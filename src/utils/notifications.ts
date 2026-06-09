import { Donation, HemoraState } from '../types';
import { addDays, formatItalianDate, todayISO } from './date';

// Quanti giorni prima dell'idoneita scatta il promemoria di routine.
export const ELIGIBILITY_REMINDER_DAYS = 7;

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

function getLatestDonation(donations: Donation[]): Donation | undefined {
  return [...donations].sort((a, b) => b.date.localeCompare(a.date))[0];
}

// Promemoria derivati dalla donazione piu recente:
// - "una settimana prima" (routine) tra eligibleDate-7 e eligibleDate;
// - "ora puoi donare" dal giorno di idoneita in poi.
// Sono mutuamente esclusivi, quindi ne resta attivo al massimo uno alla volta.
export function getDonationReminders(state: HemoraState): NotificationItem[] {
  const latest = getLatestDonation(state.donations);
  if (!latest) return [];

  const today = todayISO();
  const eligibleDate = latest.nextEligibilityDate;

  if (today >= eligibleDate) {
    const id = `donation-eligible-${latest.id}`;
    return [
      {
        id,
        kind: 'donation',
        title: 'Ora puoi donare',
        message: `Sei di nuovo idoneo a donare dal ${formatItalianDate(eligibleDate)}.`,
        date: eligibleDate,
        read: state.readDonationReminders.includes(id),
      },
    ];
  }

  const reminderDate = addDays(eligibleDate, -ELIGIBILITY_REMINDER_DAYS);
  if (today >= reminderDate) {
    const id = `donation-upcoming-${latest.id}`;
    return [
      {
        id,
        kind: 'donation',
        title: 'Manca una settimana',
        message: `Tra una settimana, dal ${formatItalianDate(eligibleDate)}, potrai donare di nuovo.`,
        date: reminderDate,
        read: state.readDonationReminders.includes(id),
      },
    ];
  }

  return [];
}

// Solo il promemoria "ora puoi donare" (giorno di idoneita): usato per il pop-up in-app.
export function getDonationEligibilityReminder(state: HemoraState): NotificationItem | null {
  const reminder = getDonationReminders(state)[0];
  return reminder && reminder.id.startsWith('donation-eligible-') ? reminder : null;
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
