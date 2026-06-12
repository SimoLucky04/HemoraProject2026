import * as Notifications from 'expo-notifications';
import {
  EMERGENCY_CHANNEL_ID,
  ensureEmergencyChannel,
  ensureNotificationPermissions,
} from './pushNotifications';

// Un singolo "caso" di emergenza mostrabile come notifica push / in-app.
export type EmergencyCase = {
  title: string;
  body: string;
};

// Intervallo casuale tra una simulazione e l'altra. Una sola notifica alla
// volta: il timer successivo parte solo dopo che la precedente è stata mostrata.
const MIN_DELAY_MS = 100_000;
const MAX_DELAY_MS = 3600_000;

function randomBetween(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}

export function pickRandomEmergency(cases: EmergencyCase[]): EmergencyCase | undefined {
  return cases.length > 0 ? cases[Math.floor(Math.random() * cases.length)] : undefined;
}

// Mostra UN caso come notifica push di sistema (best-effort). Ritorna true se i
// permessi sono attivi e la notifica è stata programmata.
export async function presentEmergencyPush(emergencyCase: EmergencyCase): Promise<boolean> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return false;
  await ensureEmergencyChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: emergencyCase.title,
      body: emergencyCase.body,
      sound: true,
      data: { kind: 'emergency-sim' },
    },
    // ~1s: la mostra subito (in foreground via handler, in background via OS).
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
      channelId: EMERGENCY_CHANNEL_ID,
    },
  }).catch(() => {
    // Ignoriamo errori isolati di scheduling: la prossima riproverà.
  });
  return true;
}

// Avvia la simulazione: a intervalli casuali invoca `onTick` (una alla volta).
// È `onTick` a procurarsi un'emergenza dal backend e a mostrarla: senza backend
// non viene mostrato nulla. Ritorna una funzione per fermarla.
export function startEmergencyPushSimulation(onTick: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  function fire() {
    onTick();
    arm(); // Riarma SOLO dopo il tick: garantisce "una alla volta".
  }

  function arm() {
    if (stopped) return;
    timer = setTimeout(fire, randomBetween(MIN_DELAY_MS, MAX_DELAY_MS));
  }

  arm();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
