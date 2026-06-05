import { Booking, CollectionCenter, DonationType, EmergencyNotification, Sex } from '../types';

declare const process: {
  env?: {
    EXPO_PUBLIC_HEMORA_API_URL?: string;
  };
};

const HEMORA_API_URL = process.env?.EXPO_PUBLIC_HEMORA_API_URL || 'http://localhost:4000';

type ApiCollectionCenter = CollectionCenter;

type ApiEmergencyAlert = {
  id: string;
  centerName: string;
  requestedGroup: EmergencyNotification['requestedGroup'];
  rh: EmergencyNotification['rh'];
  urgency: EmergencyNotification['urgency'];
  message: string;
  sentAt: string;
};

export type DonationSlot = {
  id: string;
  centerId: string;
  dateTime: string;
  available: boolean;
};

export type DonationEligibility = {
  eligible: boolean;
  nextEligibleDate: string | null;
  message: string;
};

type ApiBooking = {
  id: string;
  userId: string;
  centerId: string;
  centerName: string;
  slotId: string | null;
  dateTime: string;
  type: DonationType;
  status: Booking['status'];
  createdAt: string;
};

type ApiListResponse<T> = {
  data: T[];
};

type ApiItemResponse<T> = {
  data: T;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${HEMORA_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Hemora API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function mapAlert(alert: ApiEmergencyAlert): EmergencyNotification {
  return {
    id: alert.id,
    centerName: alert.centerName,
    requestedGroup: alert.requestedGroup,
    rh: alert.rh,
    urgency: alert.urgency,
    message: alert.message,
    sentAt: alert.sentAt,
    read: false,
  };
}

function mapBooking(booking: ApiBooking): Booking {
  return {
    id: booking.id,
    centerId: booking.centerId,
    centerName: booking.centerName,
    dateTime: booking.dateTime,
    type: booking.type,
    status: booking.status,
  };
}

// --- Centri di raccolta ----------------------------------------------------
export async function fetchCollectionCenters(params?: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}): Promise<CollectionCenter[]> {
  const search = new URLSearchParams();
  if (params) {
    search.set('lat', String(params.latitude));
    search.set('lon', String(params.longitude));
    if (params.radiusKm) search.set('radiusKm', String(params.radiusKm));
  }
  const query = search.toString() ? `?${search.toString()}` : '';
  const response = await request<ApiListResponse<ApiCollectionCenter>>(`/api/centers${query}`);
  return response.data;
}

export async function fetchCollectionCenter(id: string): Promise<CollectionCenter> {
  const response = await request<ApiItemResponse<ApiCollectionCenter>>(`/api/centers/${id}`);
  return response.data;
}

export async function fetchCenterSlots(centerId: string): Promise<DonationSlot[]> {
  const response = await request<ApiListResponse<DonationSlot>>(`/api/centers/${centerId}/slots`);
  return response.data;
}

// --- Prenotazioni donazione ------------------------------------------------
// TODO: il context usa ancora prenotazioni locali (local-first). Queste funzioni
// permettono di collegare le prenotazioni al backend demo quando desiderato.
export async function createBooking(payload: {
  userId?: string;
  centerId: string;
  slotId?: string;
  dateTime?: string;
  type: DonationType;
}): Promise<Booking> {
  const response = await request<ApiItemResponse<ApiBooking>>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapBooking(response.data);
}

export async function fetchBookings(userId?: string): Promise<Booking[]> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const response = await request<ApiListResponse<ApiBooking>>(`/api/bookings${query}`);
  return response.data.map(mapBooking);
}

export async function cancelBooking(id: string, userId?: string): Promise<void> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  await request(`/api/bookings/${id}${query}`, { method: 'DELETE' });
}

// --- Emergenze sangue ------------------------------------------------------
export async function fetchEmergencyNotifications(): Promise<EmergencyNotification[]> {
  const response = await request<ApiListResponse<ApiEmergencyAlert>>('/api/emergency-alerts');
  return response.data.map(mapAlert);
}

// Emergenze filtrate per compatibilità con il gruppo dell'utente e città.
export async function fetchCompatibleEmergencies(filter: {
  bloodType?: string;
  rh?: string;
  city?: string;
}): Promise<EmergencyNotification[]> {
  const params = new URLSearchParams();
  if (filter.bloodType) params.set('bloodType', filter.bloodType);
  if (filter.rh) params.set('rh', filter.rh);
  if (filter.city) params.set('city', filter.city);
  const query = params.toString() ? `?${params.toString()}` : '';

  const response = await request<ApiListResponse<ApiEmergencyAlert>>(`/api/emergencies${query}`);
  return response.data.map(mapAlert);
}

// --- Idoneità alla donazione ----------------------------------------------
export async function fetchDonationEligibility(params: {
  type: DonationType;
  sex: Sex;
  lastDonationDate?: string;
}): Promise<DonationEligibility> {
  const search = new URLSearchParams({ type: params.type, sex: params.sex });
  if (params.lastDonationDate) search.set('lastDonationDate', params.lastDonationDate);

  const response = await request<ApiItemResponse<DonationEligibility>>(
    `/api/donation-eligibility?${search.toString()}`,
  );
  return response.data;
}
