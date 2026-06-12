import { DonationType } from '@app-types';
import { addDays } from './date';

// Giorni minimi di attesa in base all'ULTIMA donazione (riga) e alla PROSSIMA (colonna).
// I tre tipi sono indipendenti: ogni "prossimo tipo" ha la sua attesa.
// Fonte: tabella idoneita donazioni.
export const WAIT_DAYS: Record<DonationType, Record<DonationType, number>> = {
  'Sangue intero': { 'Sangue intero': 90, Plasma: 30, Piastrine: 30 },
  Plasma: { 'Sangue intero': 14, Plasma: 14, Piastrine: 14 },
  Piastrine: { 'Sangue intero': 14, Plasma: 14, Piastrine: 14 },
};

// Prossima idoneita per una donazione dello STESSO tipo: valore informativo
// salvato sulla singola donazione (la logica vera e cross-tipo, vedi donationRules).
export function calculateNextEligibilityDate(date: string, type: DonationType) {
  return addDays(date, WAIT_DAYS[type][type]);
}
