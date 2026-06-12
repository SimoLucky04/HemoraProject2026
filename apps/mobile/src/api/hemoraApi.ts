import Constants from 'expo-constants';
import { Booking, CollectionCenter, CreateBookingInput, EmergencyFeedItem } from '@app-types';

declare const process: {
  env?: {
    EXPO_PUBLIC_HEMORA_API_URL?: string;
  };
};

// Porta pubblicata da nginx sull'host (vedi docker-compose.yml: "8080:80").
const NGINX_PORT = 8080;

// Host:porta del bundler Metro a cui questo dispositivo e gia connesso: coincide
// con l'IP del Mac nella rete CORRENTE. Lo deduciamo da expo-constants, cosi
// l'indirizzo del backend SEGUE la rete da solo (cambi WiFi/hotspot -> cambia
// l'IP) e funziona sia col simulatore iOS (stessa macchina) sia col telefono
// fisico sulla stessa LAN, senza modificare il .env a mano.
function getDevServerHost(): string | undefined {
  const expoGoConfig = (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig;
  const hostUri = Constants.expoConfig?.hostUri ?? expoGoConfig?.debuggerHost;
  if (!hostUri) return undefined;
  // Tiene solo l'host, scarta la porta di Metro (es. 8081/19000).
  const host = hostUri.split(':')[0];
  return host || undefined;
}

// Base URL del backend, in ordine di precedenza:
//   1) EXPO_PUBLIC_HEMORA_API_URL nel .env  -> override esplicito (IP/host fisso)
//   2) IP del Mac (da Metro) + porta nginx  -> AUTO, segue la rete corrente
//   3) http://localhost:8080                -> fallback (build senza dev server)
function resolveApiBaseUrl(): string {
  const explicit = process.env?.EXPO_PUBLIC_HEMORA_API_URL?.trim();
  if (explicit) return explicit;

  const host = getDevServerHost();
  if (host) return `http://${host}:${NGINX_PORT}`;

  return `http://localhost:${NGINX_PORT}`;
}

const HEMORA_API_URL = resolveApiBaseUrl();

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

// --- Feed emergenze (notifiche push simulate) ------------------------------
// Scenari d'emergenza definiti dal backend, usati come pool per le push.
export async function fetchEmergencyFeed(): Promise<EmergencyFeedItem[]> {
  const response = await getJson<ApiListResponse<EmergencyFeedItem>>('/api/emergency-feed');
  return response.data;
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

// Cancella TUTTE le prenotazioni dell'utente sul backend (usata al reset account).
export async function clearBookings(userEmail: string): Promise<void> {
  await sendJson('/api/bookings', {
    method: 'DELETE',
    userEmail,
  });
}
