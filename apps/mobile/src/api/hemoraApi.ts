import { Booking, CollectionCenter, CreateBookingInput, EmergencyNotification } from '@app-types';

declare const process: {
  env?: {
    EXPO_PUBLIC_HEMORA_API_URL?: string;
  };
};

const HEMORA_API_URL = process.env?.EXPO_PUBLIC_HEMORA_API_URL || 'http://localhost:4000';

type ApiEmergencyAlert = {
  id: string;
  centerName: string;
  requestedGroup: EmergencyNotification['requestedGroup'];
  rh: EmergencyNotification['rh'];
  urgency: EmergencyNotification['urgency'];
  message: string;
  sentAt: string;
};

type ApiListResponse<T> = {
  data: T[];
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${HEMORA_API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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
  const response = await getJson<ApiListResponse<CollectionCenter>>(`/api/centers${query}`);
  return response.data;
}

// --- Emergenze sangue ------------------------------------------------------
// Restituisce le emergenze attive. Se si passa il gruppo/Rh del donatore, il
// backend filtra e ritorna solo quelle per cui l'utente e compatibile.
export async function fetchEmergencies(filter?: {
  bloodType?: string;
  rh?: string;
  city?: string;
}): Promise<EmergencyNotification[]> {
  const params = new URLSearchParams();
  if (filter?.bloodType) params.set('bloodType', filter.bloodType);
  if (filter?.rh) params.set('rh', filter.rh);
  if (filter?.city) params.set('city', filter.city);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await getJson<ApiListResponse<ApiEmergencyAlert>>(`/api/emergencies${query}`);
  return response.data.map(mapAlert);
}

// --- Prenotazioni (gestite dal backend) ------------------------------------
// L'utente e identificato dall'header X-User-Email (demo: niente auth vera).
async function sendJson<T>(
  path: string,
  options: { method: string; userEmail: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${HEMORA_API_URL}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': options.userEmail,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    // Propaga il messaggio d'errore del backend (es. "Slot già occupato").
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || `Hemora API error ${response.status}`);
  }
  return (await response.json().catch(() => ({}))) as T;
}

export async function fetchBookings(userEmail: string): Promise<Booking[]> {
  const response = await sendJson<ApiListResponse<Booking>>('/api/bookings', {
    method: 'GET',
    userEmail,
  });
  return response.data;
}

export async function createBooking(userEmail: string, input: CreateBookingInput): Promise<Booking> {
  const response = await sendJson<{ data: Booking }>('/api/bookings', {
    method: 'POST',
    userEmail,
    body: input,
  });
  return response.data;
}

export async function cancelBooking(userEmail: string, bookingId: string): Promise<void> {
  await sendJson(`/api/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'DELETE',
    userEmail,
  });
}
