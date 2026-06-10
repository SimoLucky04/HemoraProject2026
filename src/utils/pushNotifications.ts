import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Donation } from '../types';
import { addDays } from './date';
import { getEligibilityDateForType } from './donationRules';
import { ELIGIBILITY_REMINDER_DAYS, LONG_CYCLE_TYPES, REMINDER_TYPES } from './notifications';

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

// Notifica push di prova: chiede il permesso e programma una notifica locale del
// sistema fra ~2 secondi. Utile per verificare sul dispositivo che le push
// arrivino (puoi anche bloccare lo schermo per vederla nella tendina).
// Ritorna false se il permesso e negato.
export async function sendTestPushNotification(): Promise<boolean> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hemora · Notifica di prova',
      body: 'Se vedi questo messaggio, le notifiche push sul dispositivo funzionano.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      repeats: false,
      channelId: ANDROID_CHANNEL_ID,
    },
  });

  return true;
}

// Riallinea le notifiche locali allo storico, per ogni tipo di donazione:
// - "ora puoi donare" il giorno di idoneita (tutti i tipi);
// - "una settimana prima" solo per i tipi a ciclo lungo (sangue intero).
// Se le date sono gia passate, non programma nulla.
export async function syncDonationReminders(donations: Donation[]) {
  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  // Riparte da zero per evitare promemoria duplicati o obsoleti.
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (const type of REMINDER_TYPES) {
    const eligibleISO = getEligibilityDateForType(donations, type);
    if (!eligibleISO) continue;

    const eligibleDate = buildTriggerDate(eligibleISO, REMINDER_HOUR);
    if (eligibleDate > now) {
      await scheduleAt(
        eligibleDate,
        'Ora puoi donare',
        `Sei di nuovo idoneo a donare ${type.toLowerCase()}. Prenota una donazione!`
      );
    }

    if (LONG_CYCLE_TYPES.includes(type)) {
      const reminderDate = buildTriggerDate(
        addDays(eligibleISO, -ELIGIBILITY_REMINDER_DAYS),
        REMINDER_HOUR
      );
      if (reminderDate > now) {
        await scheduleAt(
          reminderDate,
          'Manca una settimana',
          `Tra una settimana potrai donare ${type.toLowerCase()} di nuovo. Inizia a organizzarti!`
        );
      }
    }
  }
}
