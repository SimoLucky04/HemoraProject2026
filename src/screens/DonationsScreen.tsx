import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { DatePickerField } from '../components/DatePickerField';
import { Field } from '../components/Field';
import { Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { DonationType } from '../types';
import { colors, spacing } from '../theme';
import { formatItalianDate, isFutureDate, todayISO } from '../utils/date';

const DONATION_TYPES: DonationType[] = ['Sangue intero', 'Plasma', 'Piastrine'];

export function DonationsScreen() {
  const { state, addDonation, bookDonation } = useHemora();
  const [date, setDate] = useState(todayISO());
  const [centerName, setCenterName] = useState(state.centers[0]?.name ?? '');
  const [type, setType] = useState<DonationType>('Sangue intero');
  const [volumeMl, setVolumeMl] = useState('450');
  const [bookingType, setBookingType] = useState<DonationType>('Sangue intero');

  const sortedDonations = useMemo(() => {
    return [...state.donations].sort((a, b) => b.date.localeCompare(a.date));
  }, [state.donations]);

  const lastEligibility = sortedDonations[0]?.nextEligibilityDate;

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

  function submitBooking(centerId: string) {
    const center = state.centers.find((item) => item.id === centerId);
    const minDate = lastEligibility && lastEligibility > todayISO() ? lastEligibility : todayISO();
    const booking = bookDonation({ centerId, type: bookingType, dateTime: `${minDate}T09:00:00` });
    Alert.alert('Prenotazione creata', `${center?.name ?? booking.centerName}\n${formatItalianDate(booking.dateTime)} alle 09:00`);
  }

  return (
    <Screen>
      <Title>Donazioni</Title>
      <Subtitle>Registra donazioni, visualizza storico e prenota presso un centro.</Subtitle>

      <Card>
        <SectionTitle>Registra donazione effettuata</SectionTitle>
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

      <Card>
        <Row>
          <SectionTitle>Storico</SectionTitle>
          <Badge>{state.donations.length} totali</Badge>
        </Row>
        {sortedDonations.length === 0 ? (
          <Muted>Lo storico è vuoto.</Muted>
        ) : (
          sortedDonations.map((donation) => (
            <View key={donation.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{formatItalianDate(donation.date)} · {donation.type}</Text>
              <Muted>{donation.centerName} · {donation.volumeMl || '-'} ml</Muted>
              <Text style={styles.itemText}>Prossima idoneità: {formatItalianDate(donation.nextEligibilityDate)}</Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <SectionTitle>Centri di raccolta</SectionTitle>
        <Text style={styles.label}>Tipo per prenotazione</Text>
        <View style={styles.optionRow}>
          {DONATION_TYPES.map((item) => (
            <AppButton key={item} title={item} onPress={() => setBookingType(item)} variant={bookingType === item ? 'primary' : 'ghost'} />
          ))}
        </View>
        {state.centers.map((center) => (
          <View key={center.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{center.name}</Text>
            <Muted>{center.address}, {center.city} · {center.openingHours}</Muted>
            <Muted>{center.phone}</Muted>
            <AppButton title="Prenota primo slot disponibile" onPress={() => submitBooking(center.id)} variant="secondary" />
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle>Prenotazioni</SectionTitle>
        {state.bookings.length === 0 ? (
          <Muted>Nessuna prenotazione registrata.</Muted>
        ) : (
          state.bookings.map((booking) => (
            <View key={booking.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{formatItalianDate(booking.dateTime)} · {booking.type}</Text>
              <Muted>{booking.centerName} · {booking.status}</Muted>
            </View>
          ))
        )}
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
  listItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  itemTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  itemText: {
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
