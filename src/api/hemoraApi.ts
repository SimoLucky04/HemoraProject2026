import { CollectionCenter, EmergencyNotification } from '../types';

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
export async function fetchEmergencyNotifications(): Promise<EmergencyNotification[]> {
  const response = await getJson<ApiListResponse<ApiEmergencyAlert>>('/api/emergency-alerts');
  return response.data.map(mapAlert);
}
