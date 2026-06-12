import { Router } from 'express';
import type { HemoraDataStore } from '../data/store';
import { createEmergenciesController } from '../controllers/emergencies.controller';

// Montato su /api
export function createEmergenciesRoutes(store: HemoraDataStore) {
  const router = Router();
  const controller = createEmergenciesController(store);
  router.get('/emergency-alerts', controller.listAlerts);
  router.get('/emergency-feed', controller.listFeed);
  router.get('/emergencies', controller.listFiltered);
  return router;
}
