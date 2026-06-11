import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@components/AppButton';
import { Card } from '@components/Card';
import { PillSelector } from '@components/PillSelector';
import { nestedScreenEdges, Screen } from '@components/Screen';
import { Muted, SectionTitle } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import { DonationType } from '@app-types';
import { colors, radius, spacing } from '@theme';
import { addDays, todayISO } from '@utils/date';
import { sendTestPushNotification } from '@utils/pushNotifications';

const DONATION_TYPES: DonationType[] = ['Sangue intero', 'Plasma', 'Piastrine'];
const DAYS_AGO_OPTIONS = ['10', '30', '60', '100'] as const;

export function AdminToolsScreen() {
  const {
    state,
    seedDemoProfile,
    addDemoDonation,
    pushDemoEmergency,
    clearReadReminders,
    triggerEligibilityPopup,
    bookDonation,
    reconcileDueBookings,
    deleteAccount,
  } = useHemora();

  const [type, setType] = useState<DonationType>('Sangue intero');
  const [daysAgo, setDaysAgo] = useState<string>('100');

  const unreadEmergency = state.notifications.filter((item) => !item.read).length;
  const firstCenter = state.centers[0];

  function toast(message: string) {
    Alert.alert('Fatto', message);
  }

  function handleSeedProfile() {
    seedDemoProfile();
    toast('Profilo demo completo caricato: dati salvavita, patologie, farmaci e contatti.');
  }

  function handleAddDonation() {
    addDemoDonation(type, Number(daysAgo));
    toast(`Donazione "${type}" aggiunta ${daysAgo} giorni fa. Controlla idoneità e storico.`);
  }

  function handleFutureBooking() {
    if (!firstCenter) return;
    bookDonation({ centerId: firstCenter.id, type, dateTime: `${addDays(todayISO(), 7)}T10:00:00` });
    toast(`Prenotazione "${type}" creata tra 7 giorni presso ${firstCenter.name}.`);
  }

  function handleDueBooking() {
    if (!firstCenter) return;
    // Prenotazione con slot già passato: il reconcile la trasforma in donazione.
    bookDonation({ centerId: firstCenter.id, type, dateTime: `${addDays(todayISO(), -1)}T10:00:00` });
    reconcileDueBookings();
    toast(`Prenotazione scaduta convertita in donazione "${type}" nello storico.`);
  }

  function handleEmergency() {
    pushDemoEmergency();
    toast('Notifica di emergenza inviata. Aprila dal contatore Notifiche in Home.');
  }

  function handleForcePopup() {
    // Una donazione di Sangue intero >90 gg fa rende di nuovo idonei e il "ping"
    // forza la riapertura del popup ad ogni pressione, anche dopo averlo chiuso.
    addDemoDonation('Sangue intero', 100);
    clearReadReminders();
    triggerEligibilityPopup();
    toast('Idoneità forzata: il popup "Ora puoi donare" compare in Home.');
  }

  async function handleTestPush() {
    const ok = await sendTestPushNotification();
    if (ok) {
      Alert.alert(
        'Notifica programmata',
        'Arriverà tra ~2 secondi. Puoi bloccare lo schermo per vederla comparire nella tendina di sistema.'
      );
    } else {
      Alert.alert(
        'Permesso negato',
        'Abilita le notifiche per Hemora dalle impostazioni del dispositivo, poi riprova.'
      );
    }
  }

  function handleReset() {
    Alert.alert(
      'Reset totale dati',
      'Cancella profilo, donazioni, prenotazioni e notifiche locali. Operazione irreversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => deleteAccount() },
      ]
    );
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>

      <Card tone="subtle">
        <SectionTitle>Stato attuale</SectionTitle>
        <View style={styles.statsRow}>
          <Stat label="Donazioni" value={state.donations.length} />
          <Stat label="Prenotazioni" value={state.bookings.length} />
          <Stat label="Notifiche" value={unreadEmergency} />
        </View>
      </Card>

      <Card>
        <SectionTitle>Profilo salvavita</SectionTitle>
        <Muted>Riempie nome, gruppo sanguigno, note, patologie, farmaci e contatti.</Muted>
        <AppButton title="Popola profilo demo completo" onPress={handleSeedProfile} />
      </Card>

      <Card>
        <SectionTitle>Donazioni e idoneità</SectionTitle>
        <PillSelector label="Tipo donazione" options={DONATION_TYPES} value={type} onChange={setType} />
        <PillSelector
          label="Quanti giorni fa"
          options={DAYS_AGO_OPTIONS}
          value={daysAgo}
          onChange={setDaysAgo}
          getLabel={(value) => `${value} gg`}
        />
        <AppButton title="Aggiungi donazione passata" onPress={handleAddDonation} />
      </Card>

      <Card>
        <SectionTitle>Prenotazioni</SectionTitle>
        <Muted>Usano il tipo selezionato sopra ({type}).</Muted>
        <AppButton title="Crea prenotazione futura (tra 7 gg)" onPress={handleFutureBooking} variant="primary" />
        <AppButton title="Crea prenotazione scaduta → storico" onPress={handleDueBooking} variant="primary" />
      </Card>

      <Card>
        <SectionTitle>Notifiche e popup (in-app)</SectionTitle>
        <AppButton title="Invia notifica emergenza" onPress={handleEmergency} variant="primary" />
        <AppButton title="Forza popup “Ora puoi donare”" onPress={handleForcePopup} variant="primary" />
      </Card>

      <Card>
        <SectionTitle>Notifiche push (dispositivo)</SectionTitle>
        <Muted>
          Programma una vera notifica di sistema fra ~2 secondi per verificare i permessi e la consegna sul
          dispositivo. Funziona su telefono reale (e simulatore iOS); non sul web.
        </Muted>
        <AppButton title="Invia notifica push di prova" onPress={handleTestPush} />
      </Card>

      <Card>
        <SectionTitle>Reset</SectionTitle>
        <Muted>Riporta l'app allo stato iniziale vuoto.</Muted>
        <AppButton title="Reset totale dati" onPress={handleReset} variant="danger" />
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
  },
  statLabel: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
});
