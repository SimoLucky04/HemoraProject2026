import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Booking,
  CollectionCenter,
  Condition,
  Donation,
  DonationType,
  EmergencyContact,
  EmergencyNotification,
  HemoraState,
  HealthProfile,
  Medication,
} from '@app-types';
import {
  cancelBooking,
  clearBookings,
  createBooking,
  fetchBookings,
  fetchCollectionCenters,
  fetchEmergencyFeed,
} from '@api/hemoraApi';
import { buildDemoProfile, emptyProfile, mockCenters, mockNotifications } from '@data/mockData';
import { calculateNextEligibilityDate } from '@utils/donationEligibility';
import { getDonationReminders } from '@utils/notifications';
import {
  startEmergencyPushSimulation,
  presentEmergencyPush,
  pickRandomEmergency,
  type EmergencyCase,
} from '@utils/emergencySimulator';
import { addDays, todayISO, uid } from '@utils/date';

const STORAGE_KEY = '@hemora/state/v1';

// Le prenotazioni vivono sul backend, identificate dall'email utente. Senza una
// sessione usiamo un id "ospite" stabile, così la demo funziona anche senza login.
const GUEST_EMAIL = 'guest@hemora.local';

// Prefisso delle notifiche d'emergenza simulate, e tetto massimo per non far
// crescere all'infinito l'elenco salvato (le altre notifiche non sono toccate).
const EMERGENCY_SIM_PREFIX = 'emergency-sim-';
const MAX_SIM_NOTIFICATIONS = 20;

const initialState: HemoraState = {
  session: null,
  profile: emptyProfile,
  donations: [],
  centers: mockCenters,
  bookings: [],
  notifications: mockNotifications,
  readDonationReminders: [],
};

type RegisterPayload = {
  email: string;
  password: string;
  privacyAccepted: boolean;
};

type LoginPayload = {
  email: string;
  password: string;
};

type HemoraContextValue = {
  state: HemoraState;
  isReady: boolean;
  refreshCenters: (params?: { latitude: number; longitude: number; radiusKm?: number }) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  saveProfile: (profile: HealthProfile) => void;
  addCondition: (condition: Omit<Condition, 'id'>) => void;
  removeCondition: (id: string) => void;
  addMedication: (medication: Omit<Medication, 'id'>) => void;
  removeMedication: (id: string) => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  removeEmergencyContact: (id: string) => void;
  bookDonation: (payload: { centerId: string; type: DonationType; dateTime: string }) => Promise<Booking>;
  removeBooking: (id: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
  reconcileDueBookings: () => void;
  markNotificationsRead: () => void;
  markDonationReminderRead: (id: string) => void;
  saveDraft: (screenName: string, data: Record<string, any>) => Promise<void>;
  loadDraft: (screenName: string) => Promise<Record<string, any> | null>;
  clearDraft: (screenName: string) => Promise<void>;
  // --- Strumenti demo/admin (solo per test e presentazione) ---
  seedDemoProfile: () => void;
  addDemoDonation: (type: DonationType, daysAgo: number) => void;
  pushDemoEmergency: () => Promise<boolean>;
  clearReadReminders: () => void;
  // Contatore effimero: ogni incremento forza la Dashboard a mostrare il popup idoneità.
  eligibilityPopupPing: number;
  triggerEligibilityPopup: () => void;
};

const HemoraContext = createContext<HemoraContextValue | null>(null);

function mergeCenters(centers?: CollectionCenter[]) {
  return centers && centers.length > 0 ? centers : mockCenters;
}

export function HemoraProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<HemoraState>(initialState);
  const [isReady, setReady] = useState(false);
  // Non persistito: serve solo a riaprire il popup idoneità su richiesta (admin/demo).
  const [eligibilityPopupPing, setEligibilityPopupPing] = useState(0);
  // Pool dei casi d'emergenza (casi locali + carenze del backend), letto sia dal
  // loop di simulazione sia dal pulsante "Simula emergenza".
  // Salva UNA emergenza nell'elenco notifiche in-app (come le idoneità) e la
  // mostra come notifica push di sistema (best-effort).
  const fireEmergency = useCallback((emergencyCase: EmergencyCase) => {
    const notification: EmergencyNotification = {
      id: `${EMERGENCY_SIM_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      centerName: emergencyCase.title,
      requestedGroup: '',
      rh: '',
      urgency: 'Alta',
      message: emergencyCase.body,
      sentAt: new Date().toISOString(),
      read: false,
    };
    setState((current) => {
      const next = [notification, ...current.notifications];
      const sims = next.filter((item) => item.id.startsWith(EMERGENCY_SIM_PREFIX));
      if (sims.length <= MAX_SIM_NOTIFICATIONS) return { ...current, notifications: next };
      // Tieni solo le emergenze simulate più recenti; le altre notifiche restano.
      const keep = new Set(sims.slice(0, MAX_SIM_NOTIFICATIONS).map((item) => item.id));
      return {
        ...current,
        notifications: next.filter((item) => !item.id.startsWith(EMERGENCY_SIM_PREFIX) || keep.has(item.id)),
      };
    });
    void presentEmergencyPush(emergencyCase);
  }, []);

  // Procura UNA emergenza dal backend (feed) e la innesca. Senza backend non
  // mostra nulla: emergenze e prenotazioni dipendono entrambe dal server.
  // Ritorna true se un'emergenza è stata effettivamente innescata.
  const fireRandomEmergency = useCallback(async (): Promise<boolean> => {
    try {
      const items = await fetchEmergencyFeed();
      const chosen = pickRandomEmergency(items.map((item) => ({ title: item.title, body: item.body })));
      if (!chosen) return false;
      fireEmergency(chosen);
      return true;
    } catch {
      return false; // Backend non raggiungibile: nessuna emergenza.
    }
  }, [fireEmergency]);

  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as HemoraState;
          setState({
            ...initialState,
            ...parsed,
            centers: mergeCenters(parsed.centers),
            // L'elenco in-app mostra solo la notifica locale (benvenuto):
            // partiamo dal mock preservando lo stato letto/non-letto salvato.
            // Eventuali vecchie emergenze del backend persistite vengono scartate.
            notifications: mockNotifications.map((notification) => {
              const saved = parsed.notifications?.find((item) => item.id === notification.id);
              return saved ? { ...notification, read: saved.read } : notification;
            }),
            readDonationReminders: parsed.readDonationReminders ?? [],
          });
        }
      } finally {
        setReady(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isReady]);

  // Centri di raccolta dal backend demo (con fallback locale se offline).
  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    fetchCollectionCenters()
      .then((centers) => {
        if (!cancelled) setState((current) => ({ ...current, centers: mergeCenters(centers) }));
      })
      .catch(() => {
        // Local-first: si tengono i centri mock/AsyncStorage quando il backend e offline.
      });

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  // Emergenze come notifiche PUSH simulate: a intervalli casuali (una alla
  // volta) il loop chiede un'emergenza al backend e la mostra. Senza backend
  // non scatta nulla (gli scenari vivono SOLO sul server, come le prenotazioni).
  useEffect(() => {
    if (!isReady) return;
    return startEmergencyPushSimulation(() => {
      void fireRandomEmergency();
    });
  }, [isReady, fireRandomEmergency]);

  // Prenotazioni dal backend (con fallback alla cache locale se offline).
  const sessionEmail = state.session?.email ?? null;
  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    fetchBookings(sessionEmail ?? GUEST_EMAIL)
      .then((bookings) => {
        if (!cancelled) setState((current) => ({ ...current, bookings }));
      })
      .catch(() => {
        // Local-first: si tiene la cache locale quando il backend e offline.
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, sessionEmail]);

  // Una prenotazione il cui slot e passato diventa automaticamente una donazione
  // nello storico (e da quel momento guida l'idoneita futura).
  const reconcileDueBookings = useCallback(() => {
    setState((current) => {
      const now = Date.now();
      const due = current.bookings.filter(
        (booking) => booking.status === 'Confermata' && new Date(booking.dateTime).getTime() <= now
      );
      if (due.length === 0) return current;

      // La prenotazione scaduta diventa una donazione locale: la togliamo dal
      // backend (fire-and-forget) così una futura GET non la riproponga.
      const userEmail = current.session?.email ?? GUEST_EMAIL;
      void Promise.allSettled(due.map((booking) => cancelBooking(userEmail, booking.id)));

      const completed: Donation[] = due.map((booking) => {
        const date = booking.dateTime.slice(0, 10);
        return {
          id: `donation-${booking.id}`,
          date,
          centerId: booking.centerId,
          centerName: booking.centerName,
          type: booking.type,
          nextEligibilityDate: calculateNextEligibilityDate(date, booking.type),
        };
      });
      const dueIds = new Set(due.map((booking) => booking.id));

      return {
        ...current,
        donations: [...completed, ...current.donations],
        bookings: current.bookings.filter((booking) => !dueIds.has(booking.id)),
      };
    });
  }, []);

  // Riconcilia all'avvio e ogni volta che l'app torna in primo piano.
  useEffect(() => {
    if (!isReady) return;
    reconcileDueBookings();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') reconcileDueBookings();
    });
    return () => subscription.remove();
  }, [isReady, reconcileDueBookings]);

  const value = useMemo<HemoraContextValue>(() => {
    return {
      state,
      isReady,
      async refreshCenters(params) {
        try {
          const centers = await fetchCollectionCenters(params);
          setState((current) => ({
            ...current,
            centers: params ? centers : mergeCenters(centers),
          }));
        } catch {
          // Local-first fallback: keep current centers if the demo backend is offline.
        }
      },
      async register({ email, password, privacyAccepted }) {
        if (!email.includes('@')) throw new Error('Inserisci una email valida.');
        if (password.length < 8) throw new Error('La password deve avere almeno 8 caratteri.');
        if (!privacyAccepted) throw new Error('Devi accettare privacy e termini.');
        setState((current) => ({ ...current, session: { email } }));
      },
      async login({ email, password }) {
        if (!email.includes('@')) throw new Error('Inserisci una email valida.');
        if (password.length < 8) throw new Error('Password troppo corta.');
        setState((current) => ({ ...current, session: { email } }));
      },
      async logout() {
        setState((current) => ({ ...current, session: null }));
      },
      async deleteAccount() {
        // Le prenotazioni vivono sul backend (per email): vanno cancellate anche
        // lì, altrimenti restano "fantasma" e bloccano le nuove prenotazioni.
        const userEmail = state.session?.email ?? GUEST_EMAIL;
        await clearBookings(userEmail).catch(() => {
          // Best-effort: se il backend è offline procediamo col reset locale.
        });
        await AsyncStorage.removeItem(STORAGE_KEY);
        setState(initialState);
      },
      saveProfile(profile) {
        setState((current) => ({
          ...current,
          profile: { ...profile, lastModifiedAt: new Date().toISOString() },
        }));
      },
      addCondition(condition) {
        setState((current) => ({
          ...current,
          profile: {
            ...current.profile,
            conditions: [{ id: uid('condition'), ...condition }, ...current.profile.conditions],
            lastModifiedAt: new Date().toISOString(),
          },
        }));
      },
      removeCondition(id) {
        setState((current) => ({
          ...current,
          profile: {
            ...current.profile,
            conditions: current.profile.conditions.filter((item) => item.id !== id),
          },
        }));
      },
      addMedication(medication) {
        setState((current) => ({
          ...current,
          profile: {
            ...current.profile,
            medications: [{ id: uid('med'), ...medication }, ...current.profile.medications],
            lastModifiedAt: new Date().toISOString(),
          },
        }));
      },
      removeMedication(id) {
        setState((current) => ({
          ...current,
          profile: {
            ...current.profile,
            medications: current.profile.medications.filter((item) => item.id !== id),
          },
        }));
      },
      addEmergencyContact(contact) {
        setState((current) => ({
          ...current,
          profile: {
            ...current.profile,
            emergencyContacts: [{ id: uid('contact'), ...contact }, ...current.profile.emergencyContacts],
            lastModifiedAt: new Date().toISOString(),
          },
        }));
      },
      removeEmergencyContact(id) {
        setState((current) => ({
          ...current,
          profile: {
            ...current.profile,
            emergencyContacts: current.profile.emergencyContacts.filter((item) => item.id !== id),
          },
        }));
      },
      async bookDonation({ centerId, type, dateTime }) {
        // Prenotazione creata e validata dal backend (centro, slot, unicità).
        const userEmail = state.session?.email ?? GUEST_EMAIL;
        const booking = await createBooking(userEmail, {
          centerId,
          type,
          dateTime: dateTime || `${todayISO()}T09:00:00`,
        });
        setState((current) => ({ ...current, bookings: [booking, ...current.bookings] }));
        return booking;
      },
      async removeBooking(id) {
        const userEmail = state.session?.email ?? GUEST_EMAIL;
        await cancelBooking(userEmail, id);
        setState((current) => ({
          ...current,
          bookings: current.bookings.filter((item) => item.id !== id),
        }));
      },
      async refreshBookings() {
        const userEmail = state.session?.email ?? GUEST_EMAIL;
        try {
          const bookings = await fetchBookings(userEmail);
          setState((current) => ({ ...current, bookings }));
        } catch {
          // Local-first: si tiene la cache locale quando il backend e offline.
        }
      },
      reconcileDueBookings,
      markNotificationsRead() {
        setState((current) => {
          const newReminderIds = getDonationReminders(current)
            .map((reminder) => reminder.id)
            .filter((id) => !current.readDonationReminders.includes(id));
          return {
            ...current,
            notifications: current.notifications.map((item) => ({ ...item, read: true })),
            readDonationReminders:
              newReminderIds.length > 0
                ? [...current.readDonationReminders, ...newReminderIds]
                : current.readDonationReminders,
          };
        });
      },
      markDonationReminderRead(id) {
        setState((current) =>
          current.readDonationReminders.includes(id)
            ? current
            : { ...current, readDonationReminders: [...current.readDonationReminders, id] }
        );
      },
      async saveDraft(screenName, data) {
        const draftKey = `@hemora/draft/${screenName}`;
        await AsyncStorage.setItem(draftKey, JSON.stringify(data));
      },
      async loadDraft(screenName) {
        const draftKey = `@hemora/draft/${screenName}`;
        const raw = await AsyncStorage.getItem(draftKey);
        return raw ? JSON.parse(raw) : null;
      },
      async clearDraft(screenName) {
        const draftKey = `@hemora/draft/${screenName}`;
        await AsyncStorage.removeItem(draftKey);
      },

      // --- Strumenti demo/admin: pilotano le funzioni reali per testare l'app ---
      seedDemoProfile() {
        setState((current) => ({
          ...current,
          profile: { ...buildDemoProfile(), lastModifiedAt: new Date().toISOString() },
        }));
      },
      addDemoDonation(type, daysAgo) {
        const date = addDays(todayISO(), -Math.abs(daysAgo));
        const center = mockCenters[0];
        const donation: Donation = {
          id: uid('donation'),
          date,
          centerId: center?.id,
          centerName: center?.name ?? 'Centro demo',
          type,
          volumeMl: type === 'Sangue intero' ? '450' : type === 'Plasma' ? '600' : '200',
          nextEligibilityDate: calculateNextEligibilityDate(date, type),
        };
        setState((current) => ({ ...current, donations: [donation, ...current.donations] }));
      },
      pushDemoEmergency() {
        // Chiede un'emergenza al backend e la innesca: compare in Notifiche e
        // arriva come push. Senza backend non scatta nulla (ritorna false).
        return fireRandomEmergency();
      },
      clearReadReminders() {
        setState((current) =>
          current.readDonationReminders.length === 0
            ? current
            : { ...current, readDonationReminders: [] }
        );
      },
      eligibilityPopupPing,
      triggerEligibilityPopup() {
        setEligibilityPopupPing((value) => value + 1);
      },
    };
  }, [state, isReady, eligibilityPopupPing, fireRandomEmergency]);

  return <HemoraContext.Provider value={value}>{children}</HemoraContext.Provider>;
}

export function useHemora() {
  const context = useContext(HemoraContext);
  if (!context) throw new Error('useHemora deve essere usato dentro HemoraProvider');
  return context;
}
