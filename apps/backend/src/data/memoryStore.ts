import type {
  Booking,
  CollectionCenter,
  EmergencyBloodAlertDto,
  EmergencyFeedItem,
} from '@hemora/shared-types';
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

// Scenari d'emergenza per le notifiche push simulate. Centralizzati qui (lato
// backend) così l'app deve solo schedularli. Aggiungi pure altri casi.
export const demoEmergencyFeed: EmergencyFeedItem[] = [
  { id: 'feed_0neg_salerno', title: '🩸 Carenza 0− · Salerno', body: 'Scorte critiche di 0− al Ruggi d\'Aragona. Se sei idoneo, prenota subito una donazione.', urgency: 'Alta' },
  { id: 'feed_abpos_napoli', title: '🩸 Piastrine AB+ · Napoli', body: 'Richiesta urgente di piastrine al Cardarelli. I donatori AB+ sono pregati di contattare il centro.', urgency: 'Media' },
  { id: 'feed_plasma_campania', title: '🩸 Plasma in calo · Campania', body: 'Scorte regionali sotto la soglia di sicurezza. Richiesta disponibilità per donazione in aferesi.', urgency: 'Media' },
  { id: 'feed_incidente_a2', title: '🚑 Incidente sulla A2', body: 'Maxi-emergenza a seguito di incidente stradale. Servono sacche di gruppo A+ e 0−.', urgency: 'Alta' },
  { id: 'feed_neonatale', title: '👶 Emergenza neonatale', body: 'Il reparto TIN necessita di sangue 0− (CMV negativo) per trasfusioni pediatriche urgenti.', urgency: 'Alta' },
  { id: 'feed_ustionati', title: '🔥 Centro grandi ustionati', body: 'Picco di ricoveri per ustioni gravi. Necessità immediata di plasma e concentrati piastrinici.', urgency: 'Alta' },
  { id: 'feed_talassemia', title: '🩸 Pazienti talassemici', body: 'Rischio rinvio terapie trasfusionali periodiche. Si richiede sangue intero di tutti i gruppi.', urgency: 'Media' },


  { id: 'feed_emergenza_estiva', title: '🏖️ Carenza estiva', body: 'Calo fisiologico delle donazioni. Carenza diffusa di sangue A− e B− su tutto il territorio regionale.', urgency: 'Media' },
  { id: 'feed_trapianto_fegato', title: '🏥 Emergenza trapianto', body: 'Intervento epatico complesso in corso. Richiesta massiccia di emazie concentrate gruppo 0+.', urgency: 'Alta' },
  { id: 'feed_caserta_bneg', title: '🩸 Allarme B− · Caserta', body: 'Scorte di gruppo B− esaurite all\'Ospedale Sant\'Anna e San Sebastiano. Donazione immediata richiesta.', urgency: 'Alta' },
  { id: 'feed_chirurgia_ospedaledelmare', title: '⚕️ Blocco sale operatorie', body: 'Carenza di sacche 0+ all\'Ospedale del Mare. Interventi chirurgici programmati a rischio rinvio.', urgency: 'Alta' },
  { id: 'feed_midollo_leucemia', title: '🧬 Tipizzazione midollare', body: 'Ricerca urgente di un donatore compatibile (registro IBMDR) per paziente oncoematologico.', urgency: 'Media' },
  { id: 'feed_gruppi_rari', title: '🩸 Fenotipo raro', body: 'Paziente con anticorpi complessi necessita di sangue con fenotipo esteso specifico. Verifiche in corso sui donatori abituali.', urgency: 'Alta' },
  { id: 'feed_scadenza_piastrine', title: '⏳ Scadenza piastrine', body: 'Le piastrine durano solo 5 giorni. Serve un ricambio continuo al polo oncologico Pascale. Prenota un\'aferesi.', urgency: 'Media' }
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
    private readonly feed = demoEmergencyFeed,
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

  async listEmergencyFeed() {
    return this.feed;
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

  async clearBookings(userId: string) {
    this.bookingsByUser.delete(userId);
  }
}
