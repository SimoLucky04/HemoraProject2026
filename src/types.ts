export type Sex = 'M' | 'F' | 'Altro';
export type BloodGroup = '' | '0' | 'A' | 'B' | 'AB';
export type RhFactor = '' | '+' | '-';

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

export type DonationType = 'Sangue intero' | 'Plasma' | 'Piastrine';

export type Donation = {
  id: string;
  date: string; // YYYY-MM-DD
  centerId?: string;
  centerName: string;
  type: DonationType;
  volumeMl?: string;
  nextEligibilityDate: string; // YYYY-MM-DD
};

export type CollectionCenter = {
  id: string;
  name: string;
  address: string;
  city: string;
  cap: string;
  phone: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  province?: string;
  region?: string;
  kind?: 'Servizio trasfusionale' | 'Unita di raccolta';
  sourceName?: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
  bookingMode?: 'Simulata';
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
  urgency: 'Bassa' | 'Media' | 'Alta';
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
