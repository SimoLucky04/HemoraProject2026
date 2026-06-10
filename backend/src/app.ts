import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { BloodGroup, DonationType, HemoraDataStore, RhFactor } from './types';
import { calculateEligibility, DONATION_TYPES, WAIT_DAYS } from './logic/eligibility';
import { normalizeBloodGroup, normalizeRh } from './logic/bloodCompatibility';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  const text = asString(value);
  if (!text) return undefined;
  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}

function asDonationType(value: unknown): DonationType | undefined {
  const text = asString(value);
  return text && DONATION_TYPES.includes(text as DonationType) ? (text as DonationType) : undefined;
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

  // --- Emergenze sangue ---------------------------------------------------
  // Endpoint usato dall'app: emergenze attive senza filtri di compatibilita.
  app.get('/api/emergency-alerts', async (req, res, next) => {
    try {
      const activeOnly = req.query.active !== 'false';
      const alerts = await store.listEmergencyAlerts({ activeOnly });
      res.json({ data: alerts });
    } catch (error) {
      next(error);
    }
  });

  // Emergenze filtrabili per gruppo/Rh del donatore e citta.
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

  // --- Idoneita alla donazione -------------------------------------------
  // Regole condivise con l'app (matrice WAIT_DAYS, ultima->prossima donazione).
  app.get('/api/donation-rules', (_req, res) => {
    res.json({ data: { types: DONATION_TYPES, waitDays: WAIT_DAYS } });
  });

  // Esempio: GET /api/donation-eligibility?type=Plasma&lastType=Sangue intero&lastDonationDate=2026-05-01
  app.get('/api/donation-eligibility', (req, res) => {
    const type = asDonationType(req.query.type);
    const lastType = asDonationType(req.query.lastType);
    const lastDonationDate = asString(req.query.lastDonationDate);

    if (!type) {
      res.status(400).json({ error: 'Parametro type non valido' });
      return;
    }
    if (req.query.lastType !== undefined && !lastType) {
      res.status(400).json({ error: 'Parametro lastType non valido' });
      return;
    }

    const result = calculateEligibility({ type, lastType, lastDonationDate });
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
