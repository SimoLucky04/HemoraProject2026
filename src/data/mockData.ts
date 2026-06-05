import { CollectionCenter, EmergencyNotification, HealthProfile } from '../types';

export const emptyProfile: HealthProfile = {
  firstName: '',
  lastName: '',
  fiscalCode: '',
  birthDate: '',
  sex: 'Altro',
  weightKg: '',
  heightCm: '',
  bloodGroup: '',
  rh: '',
  lifesavingNotes: '',
  conditions: [],
  medications: [],
  emergencyContacts: [],
};

export const mockCenters: CollectionCenter[] = [
  {
    id: 'center_1',
    name: 'Centro Medicina Trasfusionale AOU Ruggi',
    address: 'Largo Citta di Ippocrate',
    city: 'Salerno',
    cap: '84131',
    phone: '089 672653',
    latitude: 40.6479,
    longitude: 14.8197,
    openingHours: 'Lun-Sab 08:00-12:00',
  },
  {
    id: 'center_2',
    name: 'AVIS Comunale Salerno',
    address: 'Via Pio XI 1',
    city: 'Salerno',
    cap: '84125',
    phone: '089 233600',
    latitude: 40.6794,
    longitude: 14.7694,
    openingHours: 'Mer-Gio 09:00-13:00',
  },
  {
    id: 'center_3',
    name: 'VOSS Donatori Ospedalieri Sangue',
    address: 'Via Luigi Guercio 420',
    city: 'Salerno',
    cap: '84134',
    phone: '089 791556',
    latitude: 40.6826,
    longitude: 14.7769,
    openingHours: 'Lun-Sab 08:00-13:00',
  },
];

export const mockNotifications: EmergencyNotification[] = [
  {
    id: 'notification_1',
    centerName: 'Centro Medicina Trasfusionale AOU Ruggi',
    requestedGroup: '0',
    rh: '-',
    urgency: 'Alta',
    message: 'Carenza sangue 0- in zona. Prenota se sei idoneo.',
    sentAt: new Date().toISOString(),
    read: false,
  },
];
