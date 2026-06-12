import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '@components/AppButton';
import { Card } from '@components/Card';
import { DatePickerField } from '@components/DatePickerField';
import { nestedScreenEdges, Screen } from '@components/Screen';
import { SelectField } from '@components/SelectField';
import { Muted, SectionTitle } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import type { DonationsStackParamList } from '@navigation/MainTabs';
import { DonationType } from '@app-types';
import { colors, spacing } from '@theme';
import { addDays, formatItalianDate, todayISO } from '@utils/date';
import { distanceKm, formatDistance } from '@utils/geo';
import { getActiveBooking, getEligibilityDateForType, isEligibleForType } from '@utils/donationRules';
import { getMissingEssentialFields } from '@utils/emergencyProfile';

const DONATION_TYPES: DonationType[] = ['Sangue intero', 'Plasma', 'Piastrine'];
// Slot orari dalle 8:00 alle 12:00.
const SLOT_HOURS = [8, 9, 10, 11, 12];

type Navigation = NativeStackNavigationProp<DonationsStackParamList>;
type Route = RouteProp<DonationsStackParamList, 'NuovaPrenotazione'>;

function isWeekend(iso: string) {
  const day = new Date(`${iso}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

// Prima data utile (>= oggi) che cada in un giorno feriale.
function nextWeekday(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

function slotLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function BookingCreateScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { state, bookDonation } = useHemora();

  // Le prenotazioni partono almeno dal giorno successivo (niente slot di oggi).
  const minBookingISO = addDays(todayISO(), 1);

  const [centerId, setCenterId] = useState<string | undefined>(route.params?.centerId);
  const [type, setType] = useState<DonationType>('Sangue intero');
  const [date, setDate] = useState<string>(() => nextWeekday(minBookingISO));
  const [hour, setHour] = useState<number | null>(null);

  const selectedCenter = state.centers.find((center) => center.id === centerId);

  // Opzioni del menu a tendina: nome + sotto-descrizione "città · distanza".
  // La distanza usa la posizione passata dalla mappa (GPS o demo); se assente,
  // mostriamo almeno la città.
  const userLocation = route.params?.userLocation;
  const centerOptions = state.centers.map((center) => ({
    value: center.name,
    description: userLocation
      ? `${center.city} · ${formatDistance(
          distanceKm(userLocation, { latitude: center.latitude, longitude: center.longitude }),
        )}`
      : center.city,
  }));

  // Servono i dati essenziali (come per il QR, ma senza contatto di emergenza).
  const missingEssential = getMissingEssentialFields(state.profile);
  const hasEssential = missingEssential.length === 0;

  // Idoneita per il tipo scelto (dipende dallo storico donazioni) e vincolo di
  // UNA sola prenotazione attiva alla volta, indipendentemente dal tipo.
  const eligibleForType = isEligibleForType(state.donations, type);
  const nextEligibilityForType = getEligibilityDateForType(state.donations, type);
  const existingBooking = getActiveBooking(state.bookings);
  const canBook = hasEssential && eligibleForType && !existingBooking;

  async function confirm() {
    if (!hasEssential) {
      Alert.alert(
        'Completa i dati essenziali',
        `Prima di prenotare inserisci in Profilo › Dati essenziali: ${missingEssential.join(', ')}.`
      );
      return;
    }
    if (!centerId) {
      Alert.alert('Centro mancante', 'Seleziona un centro di raccolta.');
      return;
    }
    if (existingBooking) {
      Alert.alert(
        'Hai già una prenotazione',
        `Hai già una prenotazione attiva (${existingBooking.type} il ${formatItalianDate(existingBooking.dateTime)}). Puoi avere una sola prenotazione alla volta: eliminala dalla sezione Prenotazioni per crearne un'altra.`
      );
      return;
    }
    if (!eligibleForType) {
      Alert.alert('Non ancora idoneo', `Per ${type} potrai prenotare dal ${formatItalianDate(nextEligibilityForType!)}.`);
      return;
    }
    if (date < minBookingISO) {
      Alert.alert('Data non valida', 'Le prenotazioni partono almeno dal giorno successivo.');
      return;
    }
    if (isWeekend(date)) {
      Alert.alert('Giorno non valido', 'Le prenotazioni sono possibili solo dal lunedì al venerdì.');
      return;
    }
    if (hour === null) {
      Alert.alert('Orario mancante', 'Seleziona uno slot orario tra le 8:00 e le 12:00.');
      return;
    }

    const dateTime = `${date}T${String(hour).padStart(2, '0')}:00:00`;
    if (new Date(dateTime).getTime() <= Date.now()) {
      Alert.alert('Orario non valido', 'Lo slot scelto è già passato: scegli un giorno o un orario futuro.');
      return;
    }

    try {
      const booking = await bookDonation({ centerId, type, dateTime });
      Alert.alert(
        'Prenotazione creata',
        `${booking.centerName}\n${formatItalianDate(booking.dateTime)} alle ${slotLabel(hour)}`
      );
      navigation.goBack();
    } catch (error) {
      // Errori di validazione/rete dal backend (es. "Slot già occupato").
      Alert.alert(
        'Prenotazione non riuscita',
        error instanceof Error ? error.message : 'Riprova più tardi.'
      );
    }
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>

      {!hasEssential && (
        <Card tone="critical">
          <SectionTitle>Completa i dati essenziali</SectionTitle>
          <Muted>Per prenotare servono prima i tuoi dati essenziali (Profilo › Dati essenziali):</Muted>
          <Text style={styles.missing}>{missingEssential.join(', ')}</Text>
        </Card>
      )}

      <Card>
        <SectionTitle>Centro di raccolta</SectionTitle>
        {state.centers.length === 0 ? (
          <Muted>Nessun centro disponibile al momento.</Muted>
        ) : (
          <>
            <SelectField
              label="Centro"
              value={selectedCenter?.name ?? ''}
              options={centerOptions}
              onChange={(name) => {
                const match = state.centers.find((center) => center.name === name);
                if (match) setCenterId(match.id);
              }}
              placeholder="Seleziona un centro"
            />
            {selectedCenter && (
              <Muted>{selectedCenter.address}, {selectedCenter.city}</Muted>
            )}
          </>
        )}
      </Card>

      <Card>
        <SectionTitle>Tipo di donazione</SectionTitle>
        <View style={styles.optionRow}>
          {DONATION_TYPES.map((item) => (
            <AppButton key={item} title={item} onPress={() => setType(item)} variant={type === item ? 'primary' : 'ghost'} />
          ))}
        </View>
      </Card>

      {existingBooking && (
        <Card tone="critical">
          <SectionTitle>Hai già una prenotazione</SectionTitle>
          <Muted>
            Hai una prenotazione attiva ({existingBooking.type} il {formatItalianDate(existingBooking.dateTime)}). Puoi
            avere una sola prenotazione alla volta: eliminala dalla sezione Prenotazioni per crearne un'altra.
          </Muted>
        </Card>
      )}

      {!existingBooking && !eligibleForType && (
        <Card tone="critical">
          <SectionTitle>Non ancora idoneo</SectionTitle>
          <Muted>Per {type} potrai prenotare di nuovo dal {formatItalianDate(nextEligibilityForType!)}.</Muted>
        </Card>
      )}

      <Card>
        <SectionTitle>Giorno e orario</SectionTitle>
        <DatePickerField
          label="Giorno (lun–ven, dal giorno successivo)"
          value={date}
          onChange={setDate}
          minimumDate={new Date(`${minBookingISO}T12:00:00`)}
        />
        {isWeekend(date) && (
          <Text style={styles.warning}>Giorno non valido: scegli un giorno tra lunedì e venerdì.</Text>
        )}

        <Text style={styles.label}>Slot orario</Text>
        <View style={styles.optionRow}>
          {SLOT_HOURS.map((slot) => (
            <AppButton
              key={slot}
              title={slotLabel(slot)}
              onPress={() => setHour(slot)}
              variant={hour === slot ? 'primary' : 'ghost'}
            />
          ))}
        </View>
      </Card>

      <AppButton title="Conferma prenotazione" onPress={confirm} disabled={!canBook} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  warning: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  missing: {
    color: colors.danger,
    fontWeight: '800',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
