import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Donation } from '../types';
import { addDays } from './date';
import { ELIGIBILITY_REMINDER_DAYS } from './notifications';

// Orario in cui far scattare i promemoria locali (notifiche push del telefono).
const REMINDER_HOUR = 9;
const ANDROID_CHANNEL_ID = 'donation-reminders';

// Le notifiche programmate restano in coda anche ad app chiusa: vanno mostrate
// dal sistema operativo. Se l'app e in primo piano, le mostriamo comunque.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function isGranted(settings: Notifications.NotificationPermissionsStatus) {
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
  );
}

// Crea il canale Android e chiede il permesso. Ritorna true se possiamo notificare.
export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Promemoria donazioni',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (isGranted(current)) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return isGranted(requested);
}

function buildTriggerDate(dateISO: string, hour: number) {
  const date = new Date(`${dateISO}T00:00:00`);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function scheduleAt(date: Date, title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

// Riallinea le notifiche locali alla donazione piu recente: programma il
// promemoria "una settimana prima" e quello "ora puoi donare". Se le date sono
// gia passate, non programma nulla.
export async function syncDonationReminders(donations: Donation[]) {
  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  // Riparte da zero per evitare promemoria duplicati o obsoleti.
  await Notifications.cancelAllScheduledNotificationsAsync();

  const latest = [...donations].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return;

  const now = new Date();
  const eligibleDate = buildTriggerDate(latest.nextEligibilityDate, REMINDER_HOUR);
  const reminderDate = buildTriggerDate(
    addDays(latest.nextEligibilityDate, -ELIGIBILITY_REMINDER_DAYS),
    REMINDER_HOUR
  );

  if (reminderDate > now) {
    await scheduleAt(
      reminderDate,
      'Manca una settimana',
      'Tra una settimana potrai donare di nuovo. Inizia a organizzarti!'
    );
  }

  if (eligibleDate > now) {
    await scheduleAt(
      eligibleDate,
      'Ora puoi donare',
      'Sei di nuovo idoneo a donare il sangue. Prenota una donazione!'
    );
  }
}
