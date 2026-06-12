import type { NextFunction, Request, Response } from 'express';
import type { Booking, DonationType } from '@hemora/shared-types';
import type { AppStore } from '../data/store';
import { DONATION_TYPES } from '../services/eligibility.service';
import { validateNewBooking } from '../services/bookings.service';
import { asString } from '../utils/requestParsers';

// L'utente e identificato dall'email passata nell'header X-User-Email (demo:
// niente autenticazione vera). Senza header non si possono gestire prenotazioni.
function getUserId(req: Request): string | undefined {
  return asString(req.header('x-user-email'));
}

function asDonationType(value: unknown): DonationType | undefined {
  const text = asString(value);
  return text && DONATION_TYPES.includes(text as DonationType) ? (text as DonationType) : undefined;
}

function generateBookingId(): string {
  return `booking_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBookingsController(store: AppStore) {
  return {
    async list(req: Request, res: Response, next: NextFunction) {
      try {
        const userId = getUserId(req);
        if (!userId) {
          res.status(400).json({ error: 'Header X-User-Email mancante' });
          return;
        }
        const bookings = await store.listBookings(userId);
        res.json({ data: bookings });
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction) {
      try {
        const userId = getUserId(req);
        if (!userId) {
          res.status(400).json({ error: 'Header X-User-Email mancante' });
          return;
        }

        const centerId = asString(req.body?.centerId);
        const type = asDonationType(req.body?.type);
        const dateTime = asString(req.body?.dateTime);
        if (!centerId || !type || !dateTime) {
          res.status(400).json({ error: 'centerId, type e dateTime sono obbligatori' });
          return;
        }

        const center = await store.getCenter(centerId);
        if (!center) {
          res.status(400).json({ error: 'Centro di raccolta non trovato' });
          return;
        }

        const existing = await store.listBookings(userId);
        const validation = validateNewBooking({ type, dateTime }, existing);
        if (!validation.ok) {
          res.status(validation.status).json({ error: validation.error });
          return;
        }

        const booking: Booking = {
          id: generateBookingId(),
          centerId,
          centerName: center.name,
          dateTime,
          type,
          status: 'Confermata',
        };
        await store.createBooking(userId, booking);
        res.status(201).json({ data: booking });
      } catch (error) {
        next(error);
      }
    },

    async cancel(req: Request, res: Response, next: NextFunction) {
      try {
        const userId = getUserId(req);
        if (!userId) {
          res.status(400).json({ error: 'Header X-User-Email mancante' });
          return;
        }
        const removed = await store.cancelBooking(userId, String(req.params.id));
        if (!removed) {
          res.status(404).json({ error: 'Prenotazione non trovata' });
          return;
        }
        res.json({ data: { id: String(req.params.id), status: 'Annullata' } });
      } catch (error) {
        next(error);
      }
    },

    // Cancella TUTTE le prenotazioni dell'utente (reset dati account). Idempotente.
    async clearAll(req: Request, res: Response, next: NextFunction) {
      try {
        const userId = getUserId(req);
        if (!userId) {
          res.status(400).json({ error: 'Header X-User-Email mancante' });
          return;
        }
        await store.clearBookings(userId);
        res.json({ data: { cleared: true } });
      } catch (error) {
        next(error);
      }
    },
  };
}
