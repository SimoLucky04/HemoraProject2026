import type { BloodGroup, RhFactor } from '@hemora/shared-types';
import type { DonationType } from '@app-types';

// Gruppo sanguigno completo (ABO + Rh) come stringa, es. '0-', 'A+', 'AB+'.
export type FullBloodType = `${BloodGroup}${RhFactor}`;

// Tutti gli 8 gruppi completi, ordinati per leggibilita (0, A, B, AB; - prima di +).
export const ALL_BLOOD_TYPES: readonly FullBloodType[] = [
  '0-', '0+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+',
];

// --- Dati di compatibilita ABO ---------------------------------------------
// Per ogni RICEVENTE, i gruppi ABO che possono donargli. La mappa e indicizzata
// per tipo di donazione: oggi e implementato solo "Sangue intero" (globuli
// rossi). Plasma e Piastrine seguono regole diverse (il plasma e ~invertito:
// AB e donatore universale) e restano come estensione futura — basta aggiungere
// la rispettiva mappa qui sotto, senza toccare le funzioni.
// Speculare a apps/backend/src/services/bloodCompatibility.service.ts.
const ABO_DONORS_BY_TYPE: Partial<Record<DonationType, Record<BloodGroup, readonly BloodGroup[]>>> = {
  'Sangue intero': {
    '0': ['0'],
    A: ['0', 'A'],
    B: ['0', 'B'],
    AB: ['0', 'A', 'B', 'AB'], // ricevente universale
  },
};

// L'Rh e sempre l'ultimo carattere ('+'/'-'); il resto e il gruppo ('0','A','B','AB').
function splitBloodType(type: FullBloodType): { group: BloodGroup; rh: RhFactor } {
  return { group: type.slice(0, -1) as BloodGroup, rh: type.slice(-1) as RhFactor };
}

export function formatBloodType(group: BloodGroup, rh: RhFactor): FullBloodType {
  return `${group}${rh}`;
}

// --- Regole di compatibilita -----------------------------------------------
// Un donatore puo donare a un ricevente se: (1) ABO compatibile per quel tipo di
// donazione e (2) Rh compatibile (un donatore Rh- dona a tutti; un Rh+ solo a Rh+).
export function canDonate(
  donor: FullBloodType,
  recipient: FullBloodType,
  type: DonationType = 'Sangue intero',
): boolean {
  const aboMap = ABO_DONORS_BY_TYPE[type];
  if (!aboMap) return false;
  const d = splitBloodType(donor);
  const r = splitBloodType(recipient);
  const aboCompatible = aboMap[r.group].includes(d.group);
  const rhCompatible = d.rh === '-' || r.rh === '+';
  return aboCompatible && rhCompatible;
}

// Riceventi a cui il gruppo indicato PUO donare.
export function getCompatibleRecipients(
  donor: FullBloodType,
  type: DonationType = 'Sangue intero',
): FullBloodType[] {
  return ALL_BLOOD_TYPES.filter((recipient) => canDonate(donor, recipient, type));
}

// Donatori da cui il gruppo indicato PUO ricevere.
export function getCompatibleDonors(
  recipient: FullBloodType,
  type: DonationType = 'Sangue intero',
): FullBloodType[] {
  return ALL_BLOOD_TYPES.filter((donor) => canDonate(donor, recipient, type));
}

// Casi speciali (note educative): donatore / ricevente universale.
export function isUniversalDonor(type: FullBloodType): boolean {
  return getCompatibleRecipients(type).length === ALL_BLOOD_TYPES.length;
}

export function isUniversalRecipient(type: FullBloodType): boolean {
  return getCompatibleDonors(type).length === ALL_BLOOD_TYPES.length;
}
