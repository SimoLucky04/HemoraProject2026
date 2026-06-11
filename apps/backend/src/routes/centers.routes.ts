import { Router } from 'express';
import type { HemoraDataStore } from '../data/store';
import { createCentersController } from '../controllers/centers.controller';

// Montato su /api/centers
export function createCentersRoutes(store: HemoraDataStore) {
  const router = Router();
  const controller = createCentersController(store);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  return router;
}
