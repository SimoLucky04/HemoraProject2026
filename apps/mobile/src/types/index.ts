// Tipi specifici dell'app (form, view-model, stato locale). I tipi di dominio
// condivisi con il backend arrivano da @hemora/shared-types (unica fonte di
// verita) e vengono qui ri-esportati per comodita dei consumer dell'app.
import type {
  BloodGroup as BloodGroupBase,
  RhFactor as RhFactorBase,
  CollectionCenter,
  DonationType,
  Urgency,
} from '@hemora/shared-types';

export type { CollectionCenter, DonationType, Urgency };

export type Sex = 'M' | 'F' | 'Altro';

// Nei form l'utente puo non aver ancora scelto: ammettiamo il valore vuoto come
// estensione locale del tipo di dominio canonico ('0' | 'A' | 'B' | 'AB').
export type BloodGroup = BloodGroupBase | '';
export type RhFactor = RhFactorBase | '';

export type ConditionSeverity = 'Bassa' | 'Media' | 'Alta';

export type Condition = {
  id: string;
  name: string;
  category: string;
  severity: ConditionSeverity;
  isAllergy: boolean;
  notes: string;
  relevantInEmergency: boolean;
};

export type Medication = {
  id: string;
  commercialName: string;
  activeIngredient: string;
  form?: string; // forma farmaceutica: compressa, sciroppo, inalatore...
  dosage: string;
  emergencyNotes: string;
  relevantInEmergency: boolean;
};

export type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
};

export type HealthProfile = {
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string; // YYYY-MM-DD
  sex: Sex;
  weightKg?: string;
  heightCm?: string;
  bloodGroup: BloodGroup;
  rh: RhFactor;
  lifesavingNotes: string;
  conditions: Condition[];
  medications: Medication[];
  emergencyContacts: EmergencyContact[];
  lastModifiedAt?: string;
};

export type Donation = {
  id: string;
  date: string; // YYYY-MM-DD
  centerId?: string;
  centerName: string;
  type: DonationType;
  volumeMl?: string;
  nextEligibilityDate: string; // YYYY-MM-DD
};

export type Booking = {
  id: string;
  centerId: string;
  centerName: string;
  dateTime: string; // ISO string
  type: DonationType;
  status: 'Confermata' | 'Annullata';
};

export type EmergencyNotification = {
  id: string;
  centerName: string;
  requestedGroup: BloodGroup;
  rh: RhFactor;
  urgency: Urgency;
  message: string;
  sentAt: string;
  read: boolean;
};

export type Session = {
  email: string;
};

export type HemoraState = {
  session: Session | null;
  profile: HealthProfile;
  donations: Donation[];
  centers: CollectionCenter[];
  bookings: Booking[];
  notifications: EmergencyNotification[];
  // Id dei promemoria "ora puoi donare" gia visti/letti (derivati dalle donazioni).
  readDonationReminders: string[];
};
