import { Router } from 'express';
import type { AppStore } from '../data/store';
import { healthRoutes } from './health.routes';
import { createCentersRoutes } from './centers.routes';
import { createEmergenciesRoutes } from './emergencies.routes';
import { createDonationsRoutes } from './donations.routes';
import { createBookingsRoutes } from './bookings.routes';

// Aggrega tutti i router dell'API e inietta lo store dove serve.
export function createRouter(store: AppStore) {
  const router = Router();
  router.use(healthRoutes());
  router.use('/api/centers', createCentersRoutes(store));
  router.use('/api', createEmergenciesRoutes(store));
  router.use('/api', createDonationsRoutes());
  router.use('/api/bookings', createBookingsRoutes(store));
  return router;
}
