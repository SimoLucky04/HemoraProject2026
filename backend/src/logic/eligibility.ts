import { DonationType } from '../types';

// Giorni minimi di attesa in base all'ULTIMA donazione (riga) e alla PROSSIMA
// (colonna). Stessa matrice usata dall'app (src/utils/donationEligibility.ts):
// un'unica fonte di verita, cosi backend e client calcolano l'idoneita allo
// stesso modo. I tre tipi sono indipendenti, ognuno con la sua attesa.
export const WAIT_DAYS: Record<DonationType, Record<DonationType, number>> = {
  'Sangue intero': { 'Sangue intero': 90, Plasma: 30, Piastrine: 30 },
  Plasma: { 'Sangue intero': 14, Plasma: 14, Piastrine: 14 },
  Piastrine: { 'Sangue intero': 14, Plasma: 14, Piastrine: 14 },
};

export const DONATION_TYPES: DonationType[] = ['Sangue intero', 'Plasma', 'Piastrine'];

export type EligibilityResult = {
  eligible: boolean;
  nextEligibleDate: string | null; // YYYY-MM-DD
  waitDays: number;
  message: string;
};

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Calcola se l'utente e idoneo alla prossima donazione di tipo `type` dato il
 * tipo e la data dell'ultima donazione. Senza un'ultima donazione e idoneo.
 *
 * Regole dimostrative per il progetto universitario: vanno validate con le
 * linee guida ufficiali sulla donazione del sangue prima di un uso reale.
 */
export function calculateEligibility(params: {
  type: DonationType;
  lastType?: DonationType;
  lastDonationDate?: string; // YYYY-MM-DD
}): EligibilityResult {
  const { type, lastType, lastDonationDate } = params;

  if (!lastDonationDate || !lastType) {
    return {
      eligible: true,
      nextEligibleDate: null,
      waitDays: 0,
      message: 'Nessuna donazione recente registrata: idoneo a donare.',
    };
  }

  const waitDays = WAIT_DAYS[lastType][type];
  const nextEligibleDate = addDays(lastDonationDate, waitDays);
  const today = new Date().toISOString().slice(0, 10);
  const eligible = today >= nextEligibleDate;

  return {
    eligible,
    nextEligibleDate,
    waitDays,
    message: eligible
      ? 'Idoneo a una nuova donazione.'
      : `Prossima donazione possibile dal ${nextEligibleDate}.`,
  };
}
