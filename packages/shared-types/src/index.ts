// Single source of truth dei tipi di dominio condivisi tra app (apps/mobile) e
// backend (apps/backend). Qui vive solo il "contratto wire" davvero condiviso:
// gruppi sanguigni, fattore Rh, tipi di donazione, centri di raccolta ed
// emergenze sangue. I tipi puramente applicativi (profilo, prenotazioni, stato
// UI) restano nell'app; quelli interni al server restano nel backend.

export type BloodGroup = '0' | 'A' | 'B' | 'AB';
export type RhFactor = '+' | '-';
export type Urgency = 'Bassa' | 'Media' | 'Alta';
export type DonationType = 'Sangue intero' | 'Plasma' | 'Piastrine';

export interface CollectionCenter {
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
}

export interface EmergencyBloodAlertDto {
  id: string;
  centerId: string;
  centerName: string;
  city: string;
  requestedGroup: BloodGroup;
  rh: RhFactor;
  urgency: Urgency;
  message: string;
  areaRadiusKm: number | null;
  sentAt: string;
  activeUntil: string | null;
}
