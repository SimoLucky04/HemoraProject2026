import type { Booking, DonationType } from '@hemora/shared-types';

// Slot orari prenotabili (8:00–12:00), come nell'app.
export const SLOT_HOURS = [8, 9, 10, 11, 12];

export type BookingValidation = { ok: true } | { ok: false; status: number; error: string };

// Regole di prenotazione (le stesse del client, qui come autorita lato server):
// giorno feriale, slot 8–12, almeno dal giorno successivo e UNA sola
// prenotazione attiva alla volta (qualsiasi tipo).
// L'idoneita (che dipende dallo storico donazioni, locale all'app) NON e qui:
// resta un pre-check nel frontend.
export function validateNewBooking(
  input: { type: DonationType; dateTime: string },
  existingBookings: Booking[],
  now: Date = new Date(),
): BookingValidation {
  const slot = new Date(input.dateTime);
  if (Number.isNaN(slot.getTime())) {
    return { ok: false, status: 400, error: 'dateTime non valido' };
  }

  // Almeno dal giorno successivo (niente slot di oggi).
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setHours(0, 0, 0, 0);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  if (slot.getTime() < startOfTomorrow.getTime()) {
    return { ok: false, status: 400, error: 'Le prenotazioni partono almeno dal giorno successivo' };
  }

  // Giorno feriale (lun–ven).
  const day = slot.getDay();
  if (day === 0 || day === 6) {
    return { ok: false, status: 400, error: 'Le prenotazioni sono possibili solo dal lunedì al venerdì' };
  }

  // Slot orario valido.
  if (!SLOT_HOURS.includes(slot.getHours())) {
    return { ok: false, status: 400, error: 'Slot orario non valido: scegli tra le 8:00 e le 12:00' };
  }

  // Una sola prenotazione attiva alla volta, indipendentemente dal tipo:
  // coerente con l'idoneita, non si pianificano due donazioni ravvicinate.
  const active = existingBookings.find((booking) => booking.status === 'Confermata');
  if (active) {
    return {
      ok: false,
      status: 409,
      error: 'Hai già una prenotazione attiva: puoi prenotarne una sola alla volta',
    };
  }

  return { ok: true };
}
