import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

export function healthRoutes() {
  const router = Router();
  router.get('/health', healthController);
  return router;
}
