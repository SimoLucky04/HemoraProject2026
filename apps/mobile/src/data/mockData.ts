import { CollectionCenter, EmergencyNotification, HealthProfile } from '@app-types';

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

// Profilo demo completo per gli strumenti admin: riempie dati salvavita, QR,
// patologie, farmaci e contatti in un colpo solo per testare l'app.
export function buildDemoProfile(): HealthProfile {
  return {
    firstName: 'Mario',
    lastName: 'Rossi',
    fiscalCode: 'RSSMRA90A41H703X',
    birthDate: '1990-01-01',
    sex: 'M',
    weightKg: '70',
    heightCm: '175',
    bloodGroup: '0',
    rh: '+',
    lifesavingNotes: 'Allergia alla penicillina (rischio shock anafilattico). Portatrice di lenti a contatto.',
    conditions: [
      {
        id: 'demo-condition-1',
        name: 'Asma',
        category: 'Respiratoria',
        severity: 'Media',
        isAllergy: false,
        notes: 'Usa broncodilatatore al bisogno.',
        relevantInEmergency: true,
      },
      {
        id: 'demo-condition-2',
        name: 'Allergia alla penicillina',
        category: 'Allergia',
        severity: 'Alta',
        isAllergy: true,
        notes: 'Evitare antibiotici betalattamici.',
        relevantInEmergency: true,
      },
    ],
    medications: [
      {
        id: 'demo-med-1',
        commercialName: 'Ventolin',
        activeIngredient: 'Salbutamolo',
        dosage: '100 mcg al bisogno',
        emergencyNotes: 'In caso di crisi asmatica.',
        relevantInEmergency: true,
      },
    ],
    emergencyContacts: [
      {
        id: 'demo-contact-1',
        name: 'Maria de Filippi',
        relation: 'Coniuge',
        phone: '3331234567',
        email: 'luca.rossi@example.com',
      },
    ],
  };
}

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
    centerName: 'Benvenuto in Hemora',
    requestedGroup: '',
    rh: '',
    urgency: 'Alta',
    message: 'Hemora è un app incentrata sulle donazioni del sangue, integrando al tempo stesso dati essenziali al primo soccorso. ',
    sentAt: new Date().toISOString(),
    read: false,
  },
]; 
