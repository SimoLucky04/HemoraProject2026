import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import {
  BloodGroup,
  DonationType,
  HemoraDataStore,
  RhFactor,
  Sex,
} from './types';
import { calculateEligibility } from './logic/eligibility';
import { normalizeBloodGroup, normalizeRh } from './logic/bloodCompatibility';

const DONATION_TYPES: DonationType[] = ['Sangue intero', 'Plasma', 'Piastrine'];
const SEXES: Sex[] = ['M', 'F', 'Altro'];

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  const text = asString(value);
  if (!text) return undefined;
  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}

export function createApp(store: HemoraDataStore) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'hemora-backend',
      timestamp: new Date().toISOString(),
    });
  });

  // --- Centri di raccolta -------------------------------------------------
  app.get('/api/centers', async (req, res, next) => {
    try {
      const latitude = asNumber(req.query.lat) ?? asNumber(req.query.latitude);
      const longitude =
        asNumber(req.query.lon) ?? asNumber(req.query.lng) ?? asNumber(req.query.longitude);
      const radiusKm = asNumber(req.query.radiusKm);
      const hasGeoQuery =
        req.query.lat !== undefined ||
        req.query.latitude !== undefined ||
        req.query.lon !== undefined ||
        req.query.lng !== undefined ||
        req.query.longitude !== undefined;

      if (hasGeoQuery && (latitude === undefined || longitude === undefined)) {
        res.status(400).json({ error: 'Parametri lat/lon non validi' });
        return;
      }

      if (radiusKm !== undefined && radiusKm <= 0) {
        res.status(400).json({ error: 'Parametro radiusKm non valido' });
        return;
      }

      const centers = await store.listCenters(
        latitude !== undefined && longitude !== undefined
          ? { latitude, longitude, radiusKm }
          : undefined,
      );
      res.json({ data: centers });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/centers/:id', async (req, res, next) => {
    try {
      const center = await store.getCenter(req.params.id);
      if (!center) {
        res.status(404).json({ error: 'Center not found' });
        return;
      }
      res.json({ data: center });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/centers/:id/slots', async (req, res, next) => {
    try {
      const center = await store.getCenter(req.params.id);
      if (!center) {
        res.status(404).json({ error: 'Center not found' });
        return;
      }
      const slots = await store.listSlots(req.params.id);
      res.json({ data: slots });
    } catch (error) {
      next(error);
    }
  });

  // --- Prenotazioni donazione --------------------------------------------
  app.post('/api/bookings', async (req, res, next) => {
    try {
      const { userId, centerId, slotId, dateTime, type } = req.body ?? {};

      if (!centerId || !type || !DONATION_TYPES.includes(type)) {
        res.status(400).json({ error: 'centerId e type (tipo donazione valido) sono obbligatori' });
        return;
      }

      const booking = await store.createBooking({ userId, centerId, slotId, dateTime, type });
      res.status(201).json({ data: booking });
    } catch (error) {
      if (error instanceof Error && error.message === 'CENTER_NOT_FOUND') {
        res.status(404).json({ error: 'Center not found' });
        return;
      }
      next(error);
    }
  });

  app.get('/api/bookings', async (req, res, next) => {
    try {
      const userId = asString(req.query.userId);
      const bookings = await store.listBookings(userId);
      res.json({ data: bookings });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/bookings/:id', async (req, res, next) => {
    try {
      const userId = asString(req.query.userId);
      const result = await store.cancelBooking(req.params.id, userId);
      if (result === 'not-found') {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      res.json({ data: { id: req.params.id, status: 'Annullata' } });
    } catch (error) {
      next(error);
    }
  });

  // --- Emergenze sangue ---------------------------------------------------
  // Endpoint storico mantenuto per compatibilità con il front-end esistente.
  app.get('/api/emergency-alerts', async (req, res, next) => {
    try {
      const activeOnly = req.query.active !== 'false';
      const alerts = await store.listEmergencyAlerts({ activeOnly });
      res.json({ data: alerts });
    } catch (error) {
      next(error);
    }
  });

  // Emergenze filtrabili per gruppo/Rh dell'utente e città.
  // Esempio: GET /api/emergencies?bloodType=A&rh=positive&city=Salerno
  app.get('/api/emergencies', async (req, res, next) => {
    try {
      const activeOnly = req.query.active !== 'false';
      const bloodType = normalizeBloodGroup(asString(req.query.bloodType)) ?? undefined;
      const rh = normalizeRh(asString(req.query.rh)) ?? undefined;
      const city = asString(req.query.city);

      const emergencies = await store.listEmergencies({
        activeOnly,
        bloodType: bloodType as BloodGroup | undefined,
        rh: rh as RhFactor | undefined,
        city,
      });
      res.json({ data: emergencies });
    } catch (error) {
      next(error);
    }
  });

  // --- Idoneità alla donazione -------------------------------------------
  // Esempio: GET /api/donation-eligibility?type=Plasma&sex=M&lastDonationDate=2026-05-01
  app.get('/api/donation-eligibility', (req, res) => {
    const type = asString(req.query.type);
    const sex = asString(req.query.sex);
    const lastDonationDate = asString(req.query.lastDonationDate);

    if (!type || !DONATION_TYPES.includes(type as DonationType)) {
      res.status(400).json({ error: 'Parametro type non valido' });
      return;
    }
    if (!sex || !SEXES.includes(sex as Sex)) {
      res.status(400).json({ error: 'Parametro sex non valido' });
      return;
    }

    const result = calculateEligibility({
      type: type as DonationType,
      sex: sex as Sex,
      lastDonationDate,
    });
    res.json({ data: result });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  };

  app.use(errorHandler);

  return app;
}
