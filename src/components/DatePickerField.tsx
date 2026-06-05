import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { formatItalianDate, todayISO } from '../utils/date';

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
};

function dateFromISO(value: string) {
  const date = new Date(`${value || todayISO()}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(`${todayISO()}T12:00:00`) : date;
}

function dateToISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function DatePickerField({ label, value, onChange, maximumDate, minimumDate }: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = useMemo(() => dateFromISO(value), [value]);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    // Android: il picker è un dialog nativo che si chiude da solo.
    // "dismissed" significa che l'utente ha annullato senza scegliere.
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed' || !date) return;
      onChange(dateToISO(date));
      return;
    }

    // iOS (calendario inline): aggiorniamo il valore in tempo reale a ogni
    // cambio, anche quando l'utente modifica solo anno/mese. La chiusura
    // avviene tramite il pulsante "Fatto" o ritoccando il campo.
    if (date) onChange(dateToISO(date));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setShowPicker((current) => !current)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatItalianDate(value)}`}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
      >
        <Text style={styles.value}>{formatItalianDate(value)}</Text>
        <Ionicons name="calendar-outline" size={22} color={colors.primaryDark} />
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={handleChange}
          locale="it-IT"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fieldPressed: {
    borderColor: colors.primary,
  },
  value: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
});
