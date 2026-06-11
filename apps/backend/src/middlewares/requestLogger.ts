import type { NextFunction, Request, Response } from 'express';

// Log essenziale delle richieste HTTP: utile in sviluppo per vedere il traffico
// dell'app verso il backend (metodo, path, status code, durata).
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
}
