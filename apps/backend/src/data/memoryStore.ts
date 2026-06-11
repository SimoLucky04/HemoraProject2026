import type { Booking, CollectionCenter, EmergencyBloodAlertDto } from '@hemora/shared-types';
import type {
  AppStore,
  ListCentersOptions,
  ListEmergenciesFilter,
  ListEmergencyAlertsOptions,
} from './store';
import { canDonateTo } from '../services/bloodCompatibility.service';
import { collectionCenters } from './collectionCenters';

export const demoCenters: CollectionCenter[] = collectionCenters;

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const demoEmergencyAlerts: EmergencyBloodAlertDto[] = [
  {
    id: 'notification_1',
    centerId: 'center_1',
    centerName: 'Centro Medicina Trasfusionale AOU Ruggi',
    city: 'Salerno',
    requestedGroup: '0',
    rh: '-',
    urgency: 'Alta',
    message: 'Carenza sangue 0- in zona. Prenota se sei idoneo.',
    areaRadiusKm: 25,
    sentAt: daysFromNow(-2),
    activeUntil: daysFromNow(7),
  },
  {
    id: 'notification_2',
    centerId: 'center_campania_centro_cardarelli',
    centerName: 'A.O.R.N. Antonio Cardarelli - Servizio Trasfusionale',
    city: 'Napoli',
    // AB+ e ricevente universale: ogni donatore e compatibile, utile per mostrare
    // il filtro per gruppo dell'utente con piu di un'emergenza.
    requestedGroup: 'AB',
    rh: '+',
    urgency: 'Media',
    message: 'Richiesta piastrine AB+ al Cardarelli. Ogni gruppo puo aiutare.',
    areaRadiusKm: 30,
    sentAt: daysFromNow(-1),
    activeUntil: daysFromNow(10),
  },
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Store di sola lettura sui dati condivisi/simulati: centri reali della Campania
// ed emergenze sangue demo, tutto in memoria per restare leggero. Profilo e
// prenotazioni restano locali nell'app (local-first).
export class MemoryStore implements AppStore {
  // Prenotazioni per utente (chiave = email). Simulate in memoria: si azzerano
  // al riavvio del backend, coerente con la natura demo del progetto.
  private readonly bookingsByUser = new Map<string, Booking[]>();

  constructor(
    private readonly centers = demoCenters,
    private readonly alerts = demoEmergencyAlerts,
  ) {}

  async listCenters(options: ListCentersOptions = {}) {
    if (typeof options.latitude !== 'number' || typeof options.longitude !== 'number') {
      return this.centers;
    }

    const origin = {
      latitude: options.latitude,
      longitude: options.longitude,
    };
    const radiusKm = options.radiusKm ?? 30;

    return this.centers
      .map((center) => ({
        center,
        distanceKm: distanceKm(origin, {
          latitude: center.latitude,
          longitude: center.longitude,
        }),
      }))
      .filter((item) => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map((item) => item.center);
  }

  async getCenter(id: string) {
    return this.centers.find((center) => center.id === id) ?? null;
  }

  async listEmergencyAlerts(options: ListEmergencyAlertsOptions = {}) {
    if (!options.activeOnly) return this.alerts;
    return this.alerts.filter((alert) => this.isActive(alert));
  }

  async listEmergencies(filter: ListEmergenciesFilter = {}) {
    const activeOnly = filter.activeOnly ?? true;

    return this.alerts.filter((alert) => {
      if (activeOnly && !this.isActive(alert)) return false;

      if (filter.city && alert.city.toLowerCase() !== filter.city.toLowerCase()) {
        return false;
      }

      // Se il front-end passa il gruppo dell'utente, restituiamo solo le
      // emergenze per cui quell'utente (donatore) e compatibile.
      if (filter.bloodType && filter.rh) {
        return canDonateTo(filter.bloodType, filter.rh, alert.requestedGroup, alert.rh);
      }

      return true;
    });
  }

  private isActive(alert: EmergencyBloodAlertDto) {
    if (!alert.activeUntil) return true;
    return new Date(alert.activeUntil).getTime() >= Date.now();
  }

  // --- Prenotazioni -------------------------------------------------------
  async listBookings(userId: string) {
    return this.bookingsByUser.get(userId) ?? [];
  }

  async createBooking(userId: string, booking: Booking) {
    const list = this.bookingsByUser.get(userId) ?? [];
    list.push(booking);
    this.bookingsByUser.set(userId, list);
    return booking;
  }

  async cancelBooking(userId: string, bookingId: string) {
    const list = this.bookingsByUser.get(userId);
    if (!list) return false;
    const index = list.findIndex((booking) => booking.id === bookingId);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
  }
}
