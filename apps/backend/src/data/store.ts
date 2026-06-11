import type {
  BloodGroup,
  CollectionCenter,
  EmergencyBloodAlertDto,
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

// Il backend e di sola lettura sui dati condivisi: niente prenotazioni o profilo
// lato server (l'app e local-first e li tiene sul dispositivo).
export interface HemoraDataStore {
  listCenters(options?: ListCentersOptions): Promise<CollectionCenter[]>;
  getCenter(id: string): Promise<CollectionCenter | null>;
  listEmergencyAlerts(options?: ListEmergencyAlertsOptions): Promise<EmergencyBloodAlertDto[]>;
  listEmergencies(filter?: ListEmergenciesFilter): Promise<EmergencyBloodAlertDto[]>;
}
