import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { colors, spacing } from '../theme';
import { calculateAge, formatItalianDate } from '../utils/date';
import { getBloodType, getFullName, getMissingEmergencyFields } from '../utils/emergencyProfile';

export function DashboardScreen() {
  const { state } = useHemora();
  const { profile, donations, notifications, bookings } = state;
  const fullName = getFullName(profile) || 'Utente Hemora';

  const lastDonation = useMemo(() => {
    return [...donations].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [donations]);

  const missingEmergencyFields = useMemo(() => getMissingEmergencyFields(profile), [profile]);
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const age = calculateAge(profile.birthDate);

  return (
    <Screen>
      <Title>Hemora</Title>
      <Subtitle>Un'app pensata per le donazioni del sangue e per fornire informazioni di primo soccorso.</Subtitle>

      <Card
        tone={missingEmergencyFields.length > 0 ? 'critical' : 'default'}
        accessible
        accessibilityLabel={`Carta salvavita di ${fullName}. Gruppo sanguigno ${getBloodType(profile)}.`}
        accessibilityHint="Questi dati sono salvati sul dispositivo e vengono usati nel QR di emergenza."
      >
        <Row>
          <SectionTitle>Carta salvavita</SectionTitle>
          <Badge accessibilityLabel={`Gruppo sanguigno ${getBloodType(profile)}`}>{getBloodType(profile)}</Badge>
        </Row>
        <Text style={styles.bigName}>{fullName}</Text>
        <Muted>{age ? `${age} anni` : 'Eta non disponibile'} - {profile.sex}</Muted>
        <Text style={styles.notes}>
          {profile.lifesavingNotes || 'Aggiungi note salvavita leggibili in pochi secondi.'}
        </Text>
        <View style={styles.offlinePill} accessible accessibilityLabel="Dati disponibili offline">
          <Text style={styles.offlinePillText}>Disponibile offline</Text>
        </View>
        {missingEmergencyFields.length > 0 && (
          <Text style={styles.warningText}>Da completare: {missingEmergencyFields.join(', ')}</Text>
        )}
      </Card>

      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard} accessible accessibilityLabel={`${donations.length} donazioni registrate`}>
          <Text style={styles.counter}>{donations.length}</Text>
          <Muted>Donazioni</Muted>
        </Card>
        <Card style={styles.metricCard} accessible accessibilityLabel={`${unreadNotifications} notifiche emergenza non lette`}>
          <Text style={styles.counter}>{unreadNotifications}</Text>
          <Muted>Notifiche</Muted>
        </Card>
      </View>

      <Card>
        <SectionTitle>Donazioni</SectionTitle>
        {lastDonation ? (
          <>
            <Text style={styles.notes}>Ultima: {formatItalianDate(lastDonation.date)} - {lastDonation.type}</Text>
            <Text style={styles.notes}>Prossima idoneita: {formatItalianDate(lastDonation.nextEligibilityDate)}</Text>
          </>
        ) : (
          <Muted>Nessuna donazione registrata. Aggiungi la prima dalla sezione Donazioni.</Muted>
        )}
      </Card>

      <Card>
        <SectionTitle>Prenotazioni</SectionTitle>
        {bookings.length === 0 ? (
          <Muted>Nessuna prenotazione attiva.</Muted>
        ) : (
          bookings.slice(0, 2).map((booking) => (
            <Text key={booking.id} style={styles.booking}>
              {formatItalianDate(booking.dateTime)} - {booking.centerName} - {booking.type}
            </Text>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bigName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  notes: {
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 22,
    fontSize: 15,
  },
  offlinePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successBg,
    borderColor: colors.success,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  offlinePillText: {
    color: colors.success,
    fontWeight: '900',
  },
  warningText: {
    color: colors.danger,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
  },
  counter: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
  },
  booking: {
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
});
