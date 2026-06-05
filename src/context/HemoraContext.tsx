import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
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
import { todayISO, uid } from '../utils/date';

const STORAGE_KEY = '@hemora/state/v1';

const initialState: HemoraState = {
  session: null,
  profile: emptyProfile,
  donations: [],
  centers: mockCenters,
  bookings: [],
  notifications: mockNotifications,
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
  addDonation: (payload: {
    date: string;
    centerName: string;
    type: DonationType;
    volumeMl?: string;
  }) => Donation;
  bookDonation: (payload: { centerId: string; type: DonationType; dateTime: string }) => Booking;
  markNotificationsRead: () => void;
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
      addDonation({ date, centerName, type, volumeMl }) {
        const donation: Donation = {
          id: uid('donation'),
          date,
          centerName,
          type,
          volumeMl,
          nextEligibilityDate: calculateNextEligibilityDate(date, type, state.profile.sex),
        };
        setState((current) => ({ ...current, donations: [donation, ...current.donations] }));
        return donation;
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
      markNotificationsRead() {
        setState((current) => ({
          ...current,
          notifications: current.notifications.map((item) => ({ ...item, read: true })),
        }));
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
