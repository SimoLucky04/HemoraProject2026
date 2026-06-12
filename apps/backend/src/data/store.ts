import type {
  BloodGroup,
  Booking,
  CollectionCenter,
  EmergencyBloodAlertDto,
  EmergencyFeedItem,
  RhFactor,
} from '@hemora/shared-types';

// Contratti interni del layer dati. I tipi di dominio (CollectionCenter,
// EmergencyBloodAlertDto, BloodGroup, RhFactor) arrivano da @hemora/shared-types.

export type ListCentersOptions = {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
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

// Dati condivisi di sola lettura (centri ed emergenze): l'app e local-first per
// profilo, donazioni e QR, che restano sul dispositivo.
export interface HemoraDataStore {
  listCenters(options?: ListCentersOptions): Promise<CollectionCenter[]>;
  getCenter(id: string): Promise<CollectionCenter | null>;
  listEmergencyAlerts(options?: ListEmergencyAlertsOptions): Promise<EmergencyBloodAlertDto[]>;
  listEmergencies(filter?: ListEmergenciesFilter): Promise<EmergencyBloodAlertDto[]>;
  // Scenari d'emergenza per le notifiche push simulate (titolo + messaggio).
  listEmergencyFeed(): Promise<EmergencyFeedItem[]>;
}

// Le prenotazioni sono l'unica parte scrivibile e per-utente del backend:
// simulate in memoria, identificate dall'email dell'utente (header X-User-Email).
export interface BookingStore {
  listBookings(userId: string): Promise<Booking[]>;
  createBooking(userId: string, booking: Booking): Promise<Booking>;
  cancelBooking(userId: string, bookingId: string): Promise<boolean>;
  // Cancella TUTTE le prenotazioni dell'utente (usata al reset dei dati account).
  clearBookings(userId: string): Promise<void>;
}

// Store completo iniettato nell'app: dati condivisi (lettura) + prenotazioni.
export type AppStore = HemoraDataStore & BookingStore;
