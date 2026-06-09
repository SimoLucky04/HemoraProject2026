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
} from '../types';
import { fetchCollectionCenters, fetchEmergencyNotifications } from '../api/hemoraApi';
import { emptyProfile, mockCenters, mockNotifications } from '../data/mockData';
import { calculateNextEligibilityDate } from '../utils/donationEligibility';
import { getDonationReminders } from '../utils/notifications';
import { todayISO, uid } from '../utils/date';

const STORAGE_KEY = '@hemora/state/v1';

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
  bookDonation: (payload: { centerId: string; type: DonationType; dateTime: string }) => Booking;
  removeBooking: (id: string) => void;
  reconcileDueBookings: () => void;
  markNotificationsRead: () => void;
  markDonationReminderRead: (id: string) => void;
  saveDraft: (screenName: string, data: Record<string, any>) => Promise<void>;
  loadDraft: (screenName: string) => Promise<Record<string, any> | null>;
  clearDraft: (screenName: string) => Promise<void>;
};

const HemoraContext = createContext<HemoraContextValue | null>(null);

function mergeCenters(centers?: CollectionCenter[]) {
  return centers && centers.length > 0 ? centers : mockCenters;
}

function mergeNotifications(notifications?: EmergencyNotification[]) {
  return notifications && notifications.length > 0 ? notifications : mockNotifications;
}

function preserveReadState(
  remoteNotifications: EmergencyNotification[],
  currentNotifications: EmergencyNotification[],
) {
  return remoteNotifications.map((notification) => {
    const current = currentNotifications.find((item) => item.id === notification.id);
    return { ...notification, read: current?.read ?? notification.read };
  });
}

export function HemoraProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<HemoraState>(initialState);
  const [isReady, setReady] = useState(false);

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
            notifications: mergeNotifications(parsed.notifications),
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

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    async function syncSharedData() {
      try {
        const [centers, notifications] = await Promise.all([
          fetchCollectionCenters(),
          fetchEmergencyNotifications(),
        ]);

        if (cancelled) return;

        setState((current) => ({
          ...current,
          centers: mergeCenters(centers),
          notifications: preserveReadState(mergeNotifications(notifications), current.notifications),
        }));
      } catch {
        // Local-first fallback: keep AsyncStorage/mock data when the demo backend is offline.
      }
    }

    syncSharedData();

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  // Una prenotazione il cui slot e passato diventa automaticamente una donazione
  // nello storico (e da quel momento guida l'idoneita futura).
  const reconcileDueBookings = useCallback(() => {
    setState((current) => {
      const now = Date.now();
      const due = current.bookings.filter(
        (booking) => booking.status === 'Confermata' && new Date(booking.dateTime).getTime() <= now
      );
      if (due.length === 0) return current;

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
      bookDonation({ centerId, type, dateTime }) {
        const center = state.centers.find((item) => item.id === centerId);
        const booking: Booking = {
          id: uid('booking'),
          centerId,
          centerName: center?.name ?? 'Centro selezionato',
          type,
          dateTime: dateTime || `${todayISO()}T09:00:00`,
          status: 'Confermata',
        };
        setState((current) => ({ ...current, bookings: [booking, ...current.bookings] }));
        return booking;
      },
      removeBooking(id) {
        setState((current) => ({
          ...current,
          bookings: current.bookings.filter((item) => item.id !== id),
        }));
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
    };
  }, [state, isReady]);

  return <HemoraContext.Provider value={value}>{children}</HemoraContext.Provider>;
}

export function useHemora() {
  const context = useContext(HemoraContext);
  if (!context) throw new Error('useHemora deve essere usato dentro HemoraProvider');
  return context;
}
