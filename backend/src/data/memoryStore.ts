import {
  BookingDto,
  CancelBookingResult,
  CollectionCenterDto,
  CreateBookingInput,
  DonationSlotDto,
  EmergencyBloodAlertDto,
  HemoraDataStore,
  ListCentersOptions,
  ListEmergenciesFilter,
  ListEmergencyAlertsOptions,
} from '../types';
import { canDonateTo } from '../logic/bloodCompatibility';
import { collectionCenters } from './collectionCenters';

export const demoCenters: CollectionCenterDto[] = collectionCenters;

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
];

/**
 * Genera slot di donazione simulati per un centro: alcune fasce orarie nei
 * prossimi giorni feriali. Serve solo a far testare il front-end senza un
 * sistema di prenotazione reale.
 */
function generateSlotsForCenter(centerId: string): DonationSlotDto[] {
  const slots: DonationSlotDto[] = [];
  const hours = [9, 10, 11];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  for (let day = 1; day <= 5; day += 1) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + day);
    // Salta sabato (6) e domenica (0).
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const hour of hours) {
      const slotDate = new Date(date);
      slotDate.setHours(hour, 0, 0, 0);
      const id = `slot_${centerId}_${slotDate.toISOString().slice(0, 13)}`;
      slots.push({
        id,
        centerId,
        dateTime: slotDate.toISOString(),
        // Disponibilità simulata: la fascia delle 10 è marcata come occupata.
        available: hour !== 10,
      });
    }
  }

  return slots;
}

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

export class MemoryStore implements HemoraDataStore {
  // Le prenotazioni sono mantenute in memoria: si azzerano al riavvio del backend.
  private readonly bookings: BookingDto[] = [];

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

  async listSlots(centerId: string) {
    return generateSlotsForCenter(centerId);
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
      // emergenze per cui quell'utente (donatore) è compatibile.
      if (filter.bloodType && filter.rh) {
        return canDonateTo(filter.bloodType, filter.rh, alert.requestedGroup, alert.rh);
      }

      return true;
    });
  }

  async createBooking(input: CreateBookingInput) {
    const center = this.centers.find((item) => item.id === input.centerId);
    if (!center) {
      throw new Error('CENTER_NOT_FOUND');
    }

    const booking: BookingDto = {
      id: `booking_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: input.userId ?? 'guest',
      centerId: center.id,
      centerName: center.name,
      slotId: input.slotId ?? null,
      dateTime: input.dateTime ?? new Date().toISOString(),
      type: input.type,
      status: 'Confermata',
      createdAt: new Date().toISOString(),
    };

    this.bookings.unshift(booking);
    return booking;
  }

  async listBookings(userId?: string) {
    if (!userId) return this.bookings;
    return this.bookings.filter((booking) => booking.userId === userId);
  }

  async cancelBooking(id: string, userId?: string): Promise<CancelBookingResult> {
    const booking = this.bookings.find(
      (item) => item.id === id && (!userId || item.userId === userId),
    );
    if (!booking) return 'not-found';

    booking.status = 'Annullata';
    return 'cancelled';
  }

  private isActive(alert: EmergencyBloodAlertDto) {
    if (!alert.activeUntil) return true;
    return new Date(alert.activeUntil).getTime() >= Date.now();
  }
}
