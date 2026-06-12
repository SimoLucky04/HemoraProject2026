import type { NextFunction, Request, Response } from 'express';
import type { BloodGroup, RhFactor } from '@hemora/shared-types';
import type { HemoraDataStore } from '../data/store';
import { normalizeBloodGroup, normalizeRh } from '../services/bloodCompatibility.service';
import { asString } from '../utils/requestParsers';

export function createEmergenciesController(store: HemoraDataStore) {
  return {
    // Emergenze attive senza filtri di compatibilita (usato dall'app).
    async listAlerts(req: Request, res: Response, next: NextFunction) {
      try {
        const activeOnly = req.query.active !== 'false';
        const alerts = await store.listEmergencyAlerts({ activeOnly });
        res.json({ data: alerts });
      } catch (error) {
        next(error);
      }
    },

    // Feed degli scenari d'emergenza per le notifiche push simulate dell'app.
    async listFeed(_req: Request, res: Response, next: NextFunction) {
      try {
        const feed = await store.listEmergencyFeed();
        res.json({ data: feed });
      } catch (error) {
        next(error);
      }
    },

    // Emergenze filtrabili per gruppo/Rh del donatore e citta.
    // Esempio: GET /api/emergencies?bloodType=A&rh=positive&city=Salerno
    async listFiltered(req: Request, res: Response, next: NextFunction) {
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
    },
  };
}
