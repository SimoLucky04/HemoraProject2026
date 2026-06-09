import React, { useEffect, useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { SectionLink } from '../components/SectionLink';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { colors, radius, spacing } from '../theme';
import { formatItalianDate } from '../utils/date';
import { buildEmergencyTextPayload, getBloodType, getFullName, getMissingEmergencyFields } from '../utils/emergencyProfile';
import { buildNotifications, countUnread, getDonationEligibilityReminder } from '../utils/notifications';
import { NotificationsScreen } from './NotificationsScreen';

type DashboardScreenProps = {
  onOpenDonationHistory: () => void;
};

export function DashboardScreen({ onOpenDonationHistory }: DashboardScreenProps) {
  const { state, markDonationReminderRead } = useHemora();
  const { profile, donations, bookings } = state;
  const fullName = getFullName(profile) || 'Utente Hemora';

  const lastDonation = useMemo(() => {
    return [...donations].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [donations]);

  const missingEmergencyFields = useMemo(() => getMissingEmergencyFields(profile), [profile]);
  const notifications = useMemo(() => buildNotifications(state), [state]);
  const unreadNotifications = countUnread(notifications);
  const eligibilityReminder = useMemo(() => getDonationEligibilityReminder(state), [state]);

  const { width } = useWindowDimensions();
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [eligibilityVisible, setEligibilityVisible] = useState(false);
  const hasEmergencyData = missingEmergencyFields.length === 0;
  const emergencyText = useMemo(() => buildEmergencyTextPayload(profile), [profile]);
  const qrSize = Math.min(240, Math.max(180, width - spacing.xxl * 2));

  // Pop-up "ora puoi donare": appare quando c'e un promemoria di idoneita non ancora letto.
  useEffect(() => {
    if (eligibilityReminder && !eligibilityReminder.read) {
      setEligibilityVisible(true);
    }
  }, [eligibilityReminder?.id, eligibilityReminder?.read]);

  function dismissEligibilityPopup() {
    setEligibilityVisible(false);
    if (eligibilityReminder) {
      markDonationReminderRead(eligibilityReminder.id);
    }
  }

  return (
    <Screen>
      <Title>Hemora</Title>
      <Subtitle>Un'app pensata per le donazioni del sangue e per fornire informazioni di primo soccorso.</Subtitle>

      <View style={styles.metricsGrid}>
        <Pressable
          style={({ pressed }) => [styles.metricCard, pressed && styles.metricPressed]}
          onPress={onOpenDonationHistory}
          accessibilityRole="button"
          accessibilityLabel={`${donations.length} donazioni registrate. Apri lo storico donazioni.`}
        >
          <Card>
            <Text style={styles.counter}>{donations.length}</Text>
            <Muted>Donazioni</Muted>
          </Card>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.metricCard, pressed && styles.metricPressed]}
          onPress={() => setNotificationsVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`${unreadNotifications} notifiche non lette. Apri il registro notifiche.`}
        >
          <Card>
            <Text style={styles.counter}>{unreadNotifications}</Text>
            <Muted>Notifiche</Muted>
          </Card>
        </Pressable>
      </View>

      <Card tone={hasEmergencyData ? 'default' : 'critical'}>
        <SectionTitle>Emergenza</SectionTitle>
        <SectionLink
          icon="qr-code"
          title="QR di emergenza"
          description={
            hasEmergencyData
              ? 'Mostra il QR con i dati salvavita, disponibile anche offline.'
              : 'Completa i dati salvavita per generare il QR.'
          }
          onPress={() => setEmergencyVisible(true)}
        />
      </Card>

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

      <Modal
        visible={emergencyVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEmergencyVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Row>
              <SectionTitle>QR di emergenza</SectionTitle>
              <Pressable
                onPress={() => setEmergencyVisible(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Chiudi QR di emergenza"
                style={({ pressed }) => pressed && styles.modalClosePressed}
              >
                <Ionicons name="close" size={26} color={colors.muted} />
              </Pressable>
            </Row>

            {hasEmergencyData ? (
              <View style={styles.modalContent}>
                <View style={styles.qrBox}>
                  <QRCode value={emergencyText} size={qrSize} />
                </View>
                <Badge accessibilityLabel={`Gruppo sanguigno ${getBloodType(profile)}`}>{getBloodType(profile)}</Badge>
                <Text style={styles.modalName}>{fullName}</Text>
                <Muted>Dati salvavita salvati sul dispositivo e leggibili anche offline.</Muted>
              </View>
            ) : (
              <View
                style={styles.modalContent}
                accessible
                accessibilityRole="alert"
                accessibilityLabel={`Dati salvavita incompleti. Mancano ${missingEmergencyFields.join(', ')}`}
              >
                <Ionicons name="alert-circle" size={48} color={colors.danger} />
                <Text style={styles.modalErrorTitle}>Dati salvavita mancanti</Text>
                <Muted>Completa questi dati dal profilo prima di affidarti al QR in emergenza:</Muted>
                <Text style={styles.modalErrorList}>{missingEmergencyFields.join(', ')}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={notificationsVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <SafeAreaProvider>
          <NotificationsScreen onClose={() => setNotificationsVisible(false)} />
        </SafeAreaProvider>
      </Modal>

      <Modal
        visible={eligibilityVisible}
        animationType="fade"
        transparent
        onRequestClose={dismissEligibilityPopup}
      >
        <View style={styles.popupBackdrop}>
          <View style={styles.popupCard} accessible accessibilityRole="alert">
            <Ionicons name="water" size={48} color={colors.primary} />
            <Text style={styles.popupTitle}>Ora puoi donare</Text>
            <Text style={styles.popupMessage}>
              {eligibilityReminder?.message ?? 'Sei di nuovo idoneo a donare.'}
            </Text>
            <View style={styles.popupActions}>
              <AppButton
                title="Vai alle donazioni"
                onPress={() => {
                  dismissEligibilityPopup();
                  onOpenDonationHistory();
                }}
              />
              <AppButton title="Chiudi" variant="ghost" onPress={dismissEligibilityPopup} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notes: {
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 22,
    fontSize: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
  },
  metricPressed: {
    opacity: 0.72,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalClosePressed: {
    opacity: 0.6,
  },
  modalContent: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  qrBox: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  modalName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalErrorTitle: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalErrorList: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  popupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  popupTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  popupMessage: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  popupActions: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
  },
});
