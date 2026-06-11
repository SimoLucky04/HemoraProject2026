import type { ErrorRequestHandler, Request, Response } from 'express';

// 404 di fallback per le rotte non gestite dai router.
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
};

// Gestore centralizzato degli errori applicativi.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
};
