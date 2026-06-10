import { HealthProfile } from '../types';
import { calculateAge } from './date';

export type EmergencyPayload = {
  app: 'Hemora';
  version: 1;
  generatedAt: string;
  person: {
    name: string;
    age: number | null;
    bloodType: string;
  };
  lifesavingNotes: string;
  conditions: Array<{
    name: string;
    category: string;
    severity: string;
    allergy: boolean;
    notes: string;
  }>;
  medications: Array<{
    name: string;
    activeIngredient: string;
    form: string;
    dosage: string;
    notes: string;
  }>;
  emergencyContacts: Array<{
    name: string;
    relation: string;
    phone: string;
  }>;
};

export function getFullName(profile: HealthProfile) {
  return `${profile.firstName} ${profile.lastName}`.trim();
}

export function getBloodType(profile: HealthProfile) {
  return `${profile.bloodGroup || '?'}${profile.rh || ''}`;
}

export function getMissingEmergencyFields(profile: HealthProfile) {
  const missing: string[] = [];
  if (!profile.firstName.trim()) missing.push('nome');
  if (!profile.lastName.trim()) missing.push('cognome');
  if (!profile.birthDate.trim()) missing.push('data di nascita');
  if (!profile.bloodGroup) missing.push('gruppo sanguigno');
  if (!profile.rh) missing.push('fattore Rh');
  if (profile.emergencyContacts.length === 0) missing.push('contatto emergenza');
  return missing;
}

export function buildEmergencyPayload(profile: HealthProfile): EmergencyPayload {
  // Payload minimale: migliora scansione QR e contiene solo dati utili in emergenza.
  return {
    app: 'Hemora',
    version: 1,
    generatedAt: new Date().toISOString(),
    person: {
      name: getFullName(profile),
      age: calculateAge(profile.birthDate),
      bloodType: getBloodType(profile),
    },
    lifesavingNotes: profile.lifesavingNotes.trim(),
    conditions: profile.conditions
      .filter((item) => item.relevantInEmergency)
      .map((item) => ({
        name: item.name,
        category: item.category,
        severity: item.severity,
        allergy: item.isAllergy,
        notes: item.notes,
      })),
    medications: profile.medications
      .filter((item) => item.relevantInEmergency)
      .map((item) => ({
        name: item.commercialName,
        activeIngredient: item.activeIngredient,
        form: item.form ?? '',
        dosage: item.dosage,
        notes: item.emergencyNotes,
      })),
    emergencyContacts: profile.emergencyContacts.map((item) => ({
      name: item.name,
      relation: item.relation,
      phone: item.phone,
    })),
  };
}

function emptyFallback(value: string, fallback = 'Non indicato') {
  return value.trim() || fallback;
}

function listOrFallback(items: string[], fallback: string) {
  return items.length > 0 ? items.join('\n') : fallback;
}

export function buildEmergencyTextPayload(profile: HealthProfile) {
  const payload = buildEmergencyPayload(profile);
  const generatedAt = new Date(payload.generatedAt).toLocaleString('it-IT');
  const conditions = payload.conditions.map((item) => {
    const allergy = item.allergy ? 'ALLERGIA - ' : '';
    const notes = item.notes ? ` | Note: ${item.notes}` : '';
    return `- ${allergy}${item.name} (${item.category}, gravita ${item.severity})${notes}`;
  });
  const medications = payload.medications.map((item) => {
    const form = item.form ? ` (${item.form})` : '';
    const activeIngredient = item.activeIngredient ? ` | Principio attivo: ${item.activeIngredient}` : '';
    const dosage = item.dosage ? ` | Dosaggio: ${item.dosage}` : '';
    const notes = item.notes ? ` | Note: ${item.notes}` : '';
    return `- ${item.name}${form}${activeIngredient}${dosage}${notes}`;
  });
  const contacts = payload.emergencyContacts.map((item) => {
    const relation = item.relation ? ` (${item.relation})` : '';
    return `- ${item.name}${relation}: ${item.phone}`;
  });

  return [
    'HEMORA - SCHEDA EMERGENZA',
    `Generata: ${generatedAt}`,
    '',
    'PERSONA',
    `Nome: ${emptyFallback(payload.person.name)}`,
    `Eta: ${payload.person.age ?? 'Non indicata'}`,
    `Gruppo sanguigno: ${emptyFallback(payload.person.bloodType)}`,
    '',
    'NOTE SALVAVITA',
    emptyFallback(payload.lifesavingNotes, 'Nessuna nota salvavita inserita'),
    '',
    'PATOLOGIE / ALLERGIE',
    listOrFallback(conditions, 'Nessuna patologia o allergia rilevante inserita'),
    '',
    'FARMACI SALVAVITA',
    listOrFallback(medications, 'Nessun farmaco salvavita inserito'),
    '',
    'CONTATTI EMERGENZA',
    listOrFallback(contacts, 'Nessun contatto emergenza inserito'),
  ].join('\n');
}
