import { DonationType, Sex } from '../types';
import { addDays } from './date';

// Regole dimostrative per progetto universitario.
// In produzione vanno validate con linee guida ufficiali e configurate da backend.
const ELIGIBILITY_DAYS: Record<DonationType, { M: number; F: number; Altro: number }> = {
  'Sangue intero': { M: 90, F: 180, Altro: 120 },
  Plasma: { M: 14, F: 14, Altro: 14 },
  Piastrine: { M: 14, F: 14, Altro: 14 },
};

export function calculateNextEligibilityDate(date: string, type: DonationType, sex: Sex) {
  const intervalDays = ELIGIBILITY_DAYS[type][sex];
  return addDays(date, intervalDays);
}
