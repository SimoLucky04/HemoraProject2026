import type { BloodGroup, RhFactor } from '@hemora/shared-types';

// Compatibilità trasfusionale donatore -> ricevente per i globuli rossi.
// Per ogni gruppo ricevente elenchiamo i gruppi ABO che possono donargli.
// Regola semplificata e commentata per il progetto universitario.
const ABO_DONORS_FOR_RECIPIENT: Record<BloodGroup, BloodGroup[]> = {
  '0': ['0'],
  A: ['0', 'A'],
  B: ['0', 'B'],
  AB: ['0', 'A', 'B', 'AB'], // ricevente universale
};

/**
 * Normalizza il fattore Rh accettando sia i simboli ('+', '-') sia le parole
 * usate spesso dal front-end ('positive'/'negative', 'positivo'/'negativo').
 * Restituisce null se il valore non è riconosciuto.
 */
export function normalizeRh(value?: string): RhFactor | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === '+' || v === 'positive' || v === 'positivo') return '+';
  if (v === '-' || v === 'negative' || v === 'negativo') return '-';
  return null;
}

/**
 * Normalizza il gruppo sanguigno. Accetta '0' oppure 'O' (zero/lettera).
 * Restituisce null se il valore non è riconosciuto.
 */
export function normalizeBloodGroup(value?: string): BloodGroup | null {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (v === '0' || v === 'O') return '0';
  if (v === 'A' || v === 'B' || v === 'AB') return v as BloodGroup;
  return null;
}

/**
 * Indica se un donatore può donare a un ricevente in base al gruppo ABO e al
 * fattore Rh. Un donatore Rh- può donare a Rh+ e Rh-, un donatore Rh+ solo a Rh+.
 */
export function canDonateTo(
  donorGroup: BloodGroup,
  donorRh: RhFactor,
  recipientGroup: BloodGroup,
  recipientRh: RhFactor,
): boolean {
  const aboCompatible = ABO_DONORS_FOR_RECIPIENT[recipientGroup].includes(donorGroup);
  const rhCompatible = donorRh === '-' || recipientRh === '+';
  return aboCompatible && rhCompatible;
}
