import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { AppStore } from './data/store';
import { createRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

// Composizione dell'app: middleware -> router applicativi -> 404 -> error handler.
// Riceve lo store per dependency injection (i test usano createApp(new MemoryStore())).
export function createApp(store: AppStore) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());

  // Log delle richieste in sviluppo (silenziato durante i test).
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  app.use(createRouter(store));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
