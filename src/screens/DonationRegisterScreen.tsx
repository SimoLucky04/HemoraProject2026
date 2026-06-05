import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { DatePickerField } from '../components/DatePickerField';
import { Field } from '../components/Field';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { DonationType } from '../types';
import { colors, spacing } from '../theme';
import { formatItalianDate, isFutureDate, todayISO } from '../utils/date';

const DONATION_TYPES: DonationType[] = ['Sangue intero', 'Plasma', 'Piastrine'];

export function DonationRegisterScreen() {
  const { state, addDonation } = useHemora();
  const [date, setDate] = useState(todayISO());
  const [centerName, setCenterName] = useState(state.centers[0]?.name ?? '');
  const [type, setType] = useState<DonationType>('Sangue intero');
  const [volumeMl, setVolumeMl] = useState('450');

  function submitDonation() {
    if (!date.trim()) {
      Alert.alert('Data mancante', 'Inserisci la data della donazione.');
      return;
    }
    if (isFutureDate(date)) {
      Alert.alert('Data non valida', 'La donazione effettuata non può avere una data futura.');
      return;
    }
    if (!centerName.trim()) {
      Alert.alert('Centro mancante', 'Inserisci il centro di raccolta.');
      return;
    }

    const donation = addDonation({ date, centerName, type, volumeMl });
    Alert.alert('Donazione registrata', `Prossima idoneità: ${formatItalianDate(donation.nextEligibilityDate)}`);
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Registra donazione</Title>
      <Subtitle>Salva una donazione già effettuata nello storico locale.</Subtitle>

      <Card>
        <SectionTitle>Dettagli donazione</SectionTitle>
        <DatePickerField label="Data" value={date} onChange={setDate} maximumDate={new Date()} />
        <Field label="Centro raccolta" value={centerName} onChangeText={setCenterName} />
        <Text style={styles.label}>Tipo donazione</Text>
        <View style={styles.optionRow}>
          {DONATION_TYPES.map((item) => (
            <AppButton key={item} title={item} onPress={() => setType(item)} variant={type === item ? 'primary' : 'ghost'} />
          ))}
        </View>
        <Field label="Volume ml (opzionale)" value={volumeMl} onChangeText={setVolumeMl} keyboardType="numeric" />
        <AppButton title="Salva donazione" onPress={submitDonation} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
});
