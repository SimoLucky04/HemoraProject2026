import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppButton } from '@components/AppButton';
import { Card } from '@components/Card';
import { DatePickerField } from '@components/DatePickerField';
import { nestedScreenEdges, Screen } from '@components/Screen';
import { Muted, SectionTitle } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import type { DonationsStackParamList } from '@navigation/MainTabs';
import { DonationType } from '@app-types';
import { colors, radius, spacing } from '@theme';
import { addDays, formatItalianDate, todayISO } from '@utils/date';
import {
  getActiveBookingForType,
  getEligibilityDateForType,
  getSlotConflict,
  isEligibleForType,
} from '@utils/donationRules';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [type, setType] = useState<DonationType>('Sangue intero');
  const [date, setDate] = useState<string>(() => nextWeekday(minBookingISO));
  const [hour, setHour] = useState<number | null>(null);

  const selectedCenter = state.centers.find((center) => center.id === centerId);

  // Logica collegata alle donazioni: idoneita e unicita valutate per tipo.
  const eligibleForType = isEligibleForType(state.donations, type);
  const nextEligibilityForType = getEligibilityDateForType(state.donations, type);
  const existingTypeBooking = getActiveBookingForType(state.bookings, type);
  const canBook = eligibleForType && !existingTypeBooking;

  async function confirm() {
    if (!centerId) {
      Alert.alert('Centro mancante', 'Seleziona un centro di raccolta.');
      return;
    }
    if (!eligibleForType) {
      Alert.alert('Non ancora idoneo', `Per ${type} potrai prenotare dal ${formatItalianDate(nextEligibilityForType!)}.`);
      return;
    }
    if (existingTypeBooking) {
      Alert.alert(
        'Prenotazione già presente',
        `Hai già una prenotazione per ${type} il ${formatItalianDate(existingTypeBooking.dateTime)}. Eliminala per prenotarne un'altra dello stesso tipo.`
      );
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
    if (getSlotConflict(state.bookings, dateTime)) {
      Alert.alert('Slot occupato', 'Hai già una prenotazione per questo giorno e orario.');
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

      <Card>
        <SectionTitle>Centro di raccolta</SectionTitle>
        {state.centers.length === 0 ? (
          <Muted>Nessun centro disponibile al momento.</Muted>
        ) : (
          <>
            <Pressable
              onPress={() => setDropdownOpen((open) => !open)}
              accessibilityRole="button"
              accessibilityState={{ expanded: dropdownOpen }}
              accessibilityLabel={selectedCenter ? `Centro selezionato: ${selectedCenter.name}` : 'Seleziona un centro'}
              style={({ pressed }) => [styles.dropdownField, pressed && styles.dropdownFieldPressed]}
            >
              <Text style={[styles.dropdownValue, !selectedCenter && styles.dropdownPlaceholder]} numberOfLines={1}>
                {selectedCenter ? selectedCenter.name : 'Seleziona un centro'}
              </Text>
              <Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.primaryDark} />
            </Pressable>

            {dropdownOpen && (
              <View style={styles.dropdownList}>
                {state.centers.map((center) => {
                  const selected = center.id === centerId;
                  return (
                    <Pressable
                      key={center.id}
                      onPress={() => {
                        setCenterId(center.id);
                        setDropdownOpen(false);
                      }}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected }}
                      style={({ pressed }) => [styles.dropdownItem, pressed && styles.optionPressed]}
                    >
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{center.name}</Text>
                        <Muted>{center.address}, {center.city}</Muted>
                      </View>
                      {selected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
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

      {!eligibleForType && (
        <Card tone="critical">
          <SectionTitle>Non ancora idoneo</SectionTitle>
          <Muted>Per {type} potrai prenotare di nuovo dal {formatItalianDate(nextEligibilityForType!)}.</Muted>
        </Card>
      )}

      {eligibleForType && existingTypeBooking && (
        <Card tone="critical">
          <SectionTitle>Hai già una prenotazione</SectionTitle>
          <Muted>
            Per {type} hai già una prenotazione il {formatItalianDate(existingTypeBooking.dateTime)}. Eliminala dalla
            sezione Prenotazioni per prenotarne un'altra dello stesso tipo.
          </Muted>
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
  dropdownField: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dropdownFieldPressed: {
    borderColor: colors.primary,
  },
  dropdownValue: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownPlaceholder: {
    color: colors.muted,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionPressed: {
    opacity: 0.72,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
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
});
