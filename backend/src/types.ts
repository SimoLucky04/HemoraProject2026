export type BloodGroup = '0' | 'A' | 'B' | 'AB';
export type RhFactor = '+' | '-';
export type Urgency = 'Bassa' | 'Media' | 'Alta';
export type DonationType = 'Sangue intero' | 'Plasma' | 'Piastrine';
export type Sex = 'M' | 'F' | 'Altro';
export type BookingStatus = 'Confermata' | 'Annullata';

export type CollectionCenterDto = {
  id: string;
  name: string;
  address: string;
  city: string;
  cap: string;
  phone: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  province?: string;
  region?: string;
  kind?: 'Servizio trasfusionale' | 'Unita di raccolta';
  sourceName?: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
  bookingMode?: 'Simulata';
};

export type ListCentersOptions = {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
};

export type DonationSlotDto = {
  id: string;
  centerId: string;
  dateTime: string; // ISO string
  available: boolean;
};

export type BookingDto = {
  id: string;
  userId: string;
  centerId: string;
  centerName: string;
  slotId: string | null;
  dateTime: string; // ISO string
  type: DonationType;
  status: BookingStatus;
  createdAt: string;
};

export type EmergencyBloodAlertDto = {
  id: string;
  centerId: string;
  centerName: string;
  city: string;
  requestedGroup: BloodGroup;
  rh: RhFactor;
  urgency: Urgency;
  message: string;
  areaRadiusKm: number | null;
  sentAt: string;
  activeUntil: string | null;
};

export type ListEmergencyAlertsOptions = {
  activeOnly?: boolean;
};

export type ListEmergenciesFilter = {
  activeOnly?: boolean;
  bloodType?: BloodGroup;
  rh?: RhFactor;
  city?: string;
};

export type CreateBookingInput = {
  userId?: string;
  centerId: string;
  slotId?: string;
  dateTime?: string;
  type: DonationType;
};

export type CancelBookingResult = 'cancelled' | 'not-found';

export interface HemoraDataStore {
  listCenters(options?: ListCentersOptions): Promise<CollectionCenterDto[]>;
  getCenter(id: string): Promise<CollectionCenterDto | null>;
  listSlots(centerId: string): Promise<DonationSlotDto[]>;
  listEmergencyAlerts(options?: ListEmergencyAlertsOptions): Promise<EmergencyBloodAlertDto[]>;
  listEmergencies(filter?: ListEmergenciesFilter): Promise<EmergencyBloodAlertDto[]>;
  createBooking(input: CreateBookingInput): Promise<BookingDto>;
  listBookings(userId?: string): Promise<BookingDto[]>;
  cancelBooking(id: string, userId?: string): Promise<CancelBookingResult>;
}
