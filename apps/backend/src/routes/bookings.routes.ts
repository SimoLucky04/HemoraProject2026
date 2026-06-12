import { Router } from 'express';
import type { AppStore } from '../data/store';
import { createBookingsController } from '../controllers/bookings.controller';

// Montato su /api/bookings
export function createBookingsRoutes(store: AppStore) {
  const router = Router();
  const controller = createBookingsController(store);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.delete('/', controller.clearAll);
  router.delete('/:id', controller.cancel);
  return router;
}
