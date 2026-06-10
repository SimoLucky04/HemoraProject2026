// Modello di dominio del backend, allineato a quello dell'app (src/types.ts).
// Il backend serve solo i dati condivisi/simulati che l'app consuma davvero:
// centri di raccolta, emergenze sangue e le regole di idoneita alla donazione.
export type BloodGroup = '0' | 'A' | 'B' | 'AB';
export type RhFactor = '+' | '-';
export type Urgency = 'Bassa' | 'Media' | 'Alta';
export type DonationType = 'Sangue intero' | 'Plasma' | 'Piastrine';

export type CollectionCenterDto = {
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

export type ListCentersOptions = {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
};

export type EmergencyBloodAlertDto = {
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
};

export type ListEmergencyAlertsOptions = {
  activeOnly?: boolean;
};

export type ListEmergenciesFilter = {
  activeOnly?: boolean;
  bloodType?: BloodGroup;
  rh?: RhFactor;
  city?: string;
};

// Il backend e di sola lettura sui dati condivisi: niente prenotazioni o profilo
// lato server (l'app e local-first e li tiene sul dispositivo).
export interface HemoraDataStore {
  listCenters(options?: ListCentersOptions): Promise<CollectionCenterDto[]>;
  getCenter(id: string): Promise<CollectionCenterDto | null>;
  listEmergencyAlerts(options?: ListEmergencyAlertsOptions): Promise<EmergencyBloodAlertDto[]>;
  listEmergencies(filter?: ListEmergenciesFilter): Promise<EmergencyBloodAlertDto[]>;
}
