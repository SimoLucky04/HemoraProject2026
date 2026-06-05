import { DonationType, Sex } from '../types';

// Intervalli minimi (in giorni) tra una donazione e la successiva.
// Regole dimostrative per il progetto universitario: in produzione vanno
// validate con le linee guida ufficiali sulla donazione del sangue.
// Sono volutamente semplici e centralizzate qui per essere facili da modificare.
const ELIGIBILITY_DAYS: Record<DonationType, Record<Sex, number>> = {
  'Sangue intero': { M: 90, F: 180, Altro: 120 },
  Plasma: { M: 14, F: 14, Altro: 14 },
  Piastrine: { M: 14, F: 14, Altro: 14 },
};

export type EligibilityResult = {
  eligible: boolean;
  nextEligibleDate: string | null; // YYYY-MM-DD
  message: string;
};

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Calcola se l'utente è idoneo a una nuova donazione e, in caso negativo,
 * la prossima data utile in base al tipo di donazione, al sesso e alla data
 * dell'ultima donazione.
 *
 * Se `lastDonationDate` non è fornita si assume che l'utente non abbia
 * donazioni recenti e sia quindi idoneo.
 */
export function calculateEligibility(params: {
  type: DonationType;
  sex: Sex;
  lastDonationDate?: string; // YYYY-MM-DD
}): EligibilityResult {
  const { type, sex, lastDonationDate } = params;

  if (!lastDonationDate) {
    return {
      eligible: true,
      nextEligibleDate: null,
      message: 'Nessuna donazione recente registrata: idoneo a donare.',
    };
  }

  const intervalDays = ELIGIBILITY_DAYS[type][sex];
  const nextEligibleDate = addDays(lastDonationDate, intervalDays);

  const today = new Date().toISOString().slice(0, 10);
  const eligible = today >= nextEligibleDate;

  return {
    eligible,
    nextEligibleDate,
    message: eligible
      ? 'Idoneo a una nuova donazione.'
      : `Prossima donazione possibile dal ${nextEligibleDate}.`,
  };
}
