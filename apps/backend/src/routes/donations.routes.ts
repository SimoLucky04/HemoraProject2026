import { Router } from 'express';
import { donationsController } from '../controllers/donations.controller';

// Montato su /api
export function createDonationsRoutes() {
  const router = Router();
  router.get('/donation-rules', donationsController.rules);
  router.get('/donation-eligibility', donationsController.eligibility);
  return router;
}
