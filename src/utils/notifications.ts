import { DonationType, HemoraState } from '../types';
import { addDays, formatItalianDate, todayISO } from './date';
import { getEligibilityDateForType } from './donationRules';

// Quanti giorni prima dell'idoneita scatta il promemoria di routine.
export const ELIGIBILITY_REMINDER_DAYS = 7;

// Tipi per cui generiamo promemoria.
export const REMINDER_TYPES: DonationType[] = ['Sangue intero', 'Plasma', 'Piastrine'];
// Tipi a ciclo lungo: ricevono anche pop-up in-app e promemoria a una settimana.
// Plasma e piastrine (ciclo breve) ricevono solo la notifica il giorno dell'idoneita.
export const LONG_CYCLE_TYPES: DonationType[] = ['Sangue intero'];

export type NotificationKind = 'emergency' | 'donation';

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  date: string; // YYYY-MM-DD o ISO
  read: boolean;
  urgency?: 'Bassa' | 'Media' | 'Alta';
};

function eligibleReminder(type: DonationType, eligibleDate: string, readIds: string[]): NotificationItem {
  const id = `donation-eligible-${type}-${eligibleDate}`;
  return {
    id,
    kind: 'donation',
    title: `Ora puoi donare ${type.toLowerCase()}`,
    message: `Sei di nuovo idoneo a donare ${type.toLowerCase()} dal ${formatItalianDate(eligibleDate)}.`,
    date: eligibleDate,
    read: readIds.includes(id),
  };
}

function upcomingReminder(type: DonationType, eligibleDate: string, readIds: string[]): NotificationItem {
  const id = `donation-upcoming-${type}-${eligibleDate}`;
  return {
    id,
    kind: 'donation',
    title: 'Manca una settimana',
    message: `Tra una settimana, dal ${formatItalianDate(eligibleDate)}, potrai donare ${type.toLowerCase()}.`,
    date: addDays(eligibleDate, -ELIGIBILITY_REMINDER_DAYS),
    read: readIds.includes(id),
  };
}

// Promemoria, per tipo, basati sull'idoneita cross-tipo (vedi donationRules):
// - "ora puoi donare" dal giorno di idoneita in poi (tutti i tipi);
// - "una settimana prima" solo per i tipi a ciclo lungo (sangue intero).
export function getDonationReminders(state: HemoraState): NotificationItem[] {
  const today = todayISO();
  const reminders: NotificationItem[] = [];

  for (const type of REMINDER_TYPES) {
    const eligibleDate = getEligibilityDateForType(state.donations, type);
    if (!eligibleDate) continue;

    if (today >= eligibleDate) {
      reminders.push(eligibleReminder(type, eligibleDate, state.readDonationReminders));
    } else if (LONG_CYCLE_TYPES.includes(type)) {
      const reminderDate = addDays(eligibleDate, -ELIGIBILITY_REMINDER_DAYS);
      if (today >= reminderDate) {
        reminders.push(upcomingReminder(type, eligibleDate, state.readDonationReminders));
      }
    }
  }

  return reminders;
}

// Pop-up in-app: solo per i tipi a ciclo lungo, il giorno in cui torni idoneo.
export function getDonationEligibilityReminder(state: HemoraState): NotificationItem | null {
  const today = todayISO();
  for (const type of LONG_CYCLE_TYPES) {
    const eligibleDate = getEligibilityDateForType(state.donations, type);
    if (eligibleDate && today >= eligibleDate) {
      return eligibleReminder(type, eligibleDate, state.readDonationReminders);
    }
  }
  return null;
}

// Registro unificato: promemoria donazione + notifiche emergenza, dalla piu recente.
export function buildNotifications(state: HemoraState): NotificationItem[] {
  const emergency: NotificationItem[] = state.notifications.map((item) => ({
    id: item.id,
    kind: 'emergency',
    title: item.centerName,
    message: item.message,
    date: item.sentAt,
    read: item.read,
    urgency: item.urgency,
  }));

  const reminders = getDonationReminders(state);
  return [...reminders, ...emergency].sort((a, b) => b.date.localeCompare(a.date));
}

export function countUnread(items: NotificationItem[]) {
  return items.filter((item) => !item.read).length;
}
