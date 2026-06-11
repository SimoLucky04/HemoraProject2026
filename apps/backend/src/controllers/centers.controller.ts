import type { NextFunction, Request, Response } from 'express';
import type { HemoraDataStore } from '../data/store';
import { asNumber } from '../utils/requestParsers';

export function createCentersController(store: HemoraDataStore) {
  return {
    async list(req: Request, res: Response, next: NextFunction) {
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
    },

    async getById(req: Request, res: Response, next: NextFunction) {
      try {
        const center = await store.getCenter(String(req.params.id));
        if (!center) {
          res.status(404).json({ error: 'Center not found' });
          return;
        }
        res.json({ data: center });
      } catch (error) {
        next(error);
      }
    },
  };
}
