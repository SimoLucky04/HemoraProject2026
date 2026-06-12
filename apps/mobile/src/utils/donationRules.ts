import { Booking, Donation, DonationType } from '@app-types';
import { addDays, todayISO } from './date';
import { WAIT_DAYS } from './donationEligibility';

export const ALL_DONATION_TYPES: DonationType[] = ['Sangue intero', 'Plasma', 'Piastrine'];

export type EligibilityStatusItem = {
  type: DonationType;
  date: string | null; // data di idoneita (null = nessuna donazione, idoneo subito)
  eligible: boolean; // idoneo alla data indicata
};

// Stato di idoneita per tutti i tipi, da mostrare nelle schermate donazioni.
export function getEligibilitySummary(donations: Donation[], onISO: string = todayISO()): EligibilityStatusItem[] {
  return ALL_DONATION_TYPES.map((type) => {
    const date = getEligibilityDateForType(donations, type);
    return { type, date, eligible: !date || onISO >= date };
  });
}

// Idoneita per un "prossimo tipo": ogni donazione passata impone un'attesa
// (matrice ultima->prossima); si prende la scadenza piu lontana. I tre tipi
// restano indipendenti perche ognuno ha la sua attesa.
// Ritorna la data dalla quale si e idonei per quel tipo, o null se non ci sono donazioni.
export function getEligibilityDateForType(donations: Donation[], nextType: DonationType): string | null {
  let result: string | null = null;
  for (const donation of donations) {
    const date = addDays(donation.date, WAIT_DAYS[donation.type][nextType]);
    if (!result || date > result) result = date;
  }
  return result;
}

// Idoneo a donare/prenotare quel tipo alla data indicata (default oggi).
export function isEligibleForType(donations: Donation[], nextType: DonationType, onISO: string = todayISO()): boolean {
  const date = getEligibilityDateForType(donations, nextType);
  return !date || onISO >= date;
}

// Per la registrazione: idoneita derivata solo dalle donazioni precedenti alla
// data indicata (gestisce anche l'inserimento di donazioni passate).
export function getEligibilityBefore(donations: Donation[], nextType: DonationType, beforeISO: string): string | null {
  return getEligibilityDateForType(
    donations.filter((donation) => donation.date < beforeISO),
    nextType
  );
}

// Esiste gia una donazione registrata in quella data (qualsiasi tipo).
export function hasDonationOnDate(donations: Donation[], dateISO: string): boolean {
  return donations.some((donation) => donation.date === dateISO);
}

// Prenotazione attiva (Confermata) gia presente, indipendentemente dal tipo:
// si puo avere una sola prenotazione alla volta (coerente con l'idoneita —
// non si possono pianificare due donazioni ravvicinate).
export function getActiveBooking(bookings: Booking[]): Booking | undefined {
  return bookings.find((booking) => booking.status === 'Confermata');
}
