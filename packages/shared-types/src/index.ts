// Single source of truth dei tipi di dominio condivisi tra app (apps/mobile) e
// backend (apps/backend). Qui vive il "contratto wire" condiviso: gruppi
// sanguigni, fattore Rh, tipi di donazione, centri di raccolta, emergenze sangue
// e prenotazioni (gestite dal backend). I tipi puramente applicativi (profilo,
// stato UI) restano nell'app; quelli interni al server restano nel backend.

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

// --- Prenotazioni (gestite dal backend) ------------------------------------
export type BookingStatus = 'Confermata' | 'Annullata';

export interface Booking {
  id: string;
  centerId: string;
  centerName: string;
  dateTime: string; // ISO string
  type: DonationType;
  status: BookingStatus;
}

// Payload inviato dall'app per creare una prenotazione (l'utente arriva
// dall'header X-User-Email; centerName e status li imposta il backend).
export interface CreateBookingInput {
  centerId: string;
  type: DonationType;
  dateTime: string; // ISO string
}
