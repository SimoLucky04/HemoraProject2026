import React, { useEffect, useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppButton } from '@components/AppButton';
import { Card } from '@components/Card';
import { EligibilityStatus } from '@components/EligibilityStatus';
import { nestedScreenEdges, Screen } from '@components/Screen';
import { Badge, Muted, Row, SectionTitle } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import { colors, radius, shadows, spacing } from '@theme';
import { formatItalianDate } from '@utils/date';
import { buildEmergencyTextPayload, getBloodType, getFullName, getMissingEmergencyFields } from '@utils/emergencyProfile';
import { buildNotifications, countUnread, getDonationEligibilityReminder } from '@utils/notifications';
import { NotificationsScreen } from './NotificationsScreen';

type DashboardScreenProps = {
  onOpenDonationHistory: () => void;
  onOpenBookings: () => void;
};

export function DashboardScreen({ onOpenDonationHistory, onOpenBookings }: DashboardScreenProps) {
  const { state, markDonationReminderRead, eligibilityPopupPing } = useHemora();
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

  // Riapertura forzata dagli strumenti demo: ogni incremento del ping mostra il popup.
  useEffect(() => {
    if (eligibilityPopupPing > 0) {
      setEligibilityVisible(true);
    }
  }, [eligibilityPopupPing]);

  function dismissEligibilityPopup() {
    setEligibilityVisible(false);
    if (eligibilityReminder) {
      markDonationReminderRead(eligibilityReminder.id);
    }
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
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

      <Pressable
        onPress={() => setEmergencyVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="QR di emergenza"
        accessibilityHint={hasEmergencyData ? 'Mostra il QR salvavita' : 'Completa i dati salvavita'}
        style={({ pressed }) => pressed && styles.emergencyPressed}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emergencyCard}
        >
          <View style={styles.emergencyTop}>
            <View style={styles.emergencyTextBlock}>
              <View style={styles.emergencyTag}>
                <Ionicons name="medkit" size={13} color={colors.surface} />
                <Text style={styles.emergencyTagText}>EMERGENZA</Text>
              </View>
              <Text style={styles.emergencyTitle}>QR salvavita</Text>
              <Text style={styles.emergencySubtitle}>
                {hasEmergencyData
                  ? 'Dati salvavita pronti, leggibili anche offline.'
                  : 'Completa i dati salvavita per generare il QR.'}
              </Text>
            </View>
            <View style={styles.qrBadge}>
              <Ionicons name="qr-code" size={46} color={colors.primaryDark} />
            </View>
          </View>
          <View style={styles.emergencyCta}>
            <Text style={styles.emergencyCtaText}>{hasEmergencyData ? 'Mostra QR' : 'Completa ora'}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
          </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.sectionHeader}>
        <SectionTitle>Idoneità a donare</SectionTitle>
        {lastDonation && (
          <Text style={styles.lastDonation}>
            Ultima: {formatItalianDate(lastDonation.date)} · {lastDonation.type}
          </Text>
        )}
      </View>
      {lastDonation ? (
        <EligibilityStatus donations={donations} />
      ) : (
        <Card tone="subtle">
          <Muted>Nessuna donazione registrata. {'\n'}
            Aggiungi la prima dalla sezione Donazioni.</Muted>
        </Card>
      )}
      <View style={styles.sectionSpacer} />

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
                title="Prenota una donazione"
                onPress={() => {
                  dismissEligibilityPopup();
                  onOpenBookings();
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
  emergencyPressed: {
    opacity: 0.92,
  },
  emergencyCard: {
    borderRadius: radius.xl,
    padding: spacing.md - 4,
    marginBottom: spacing.sm,
    ...shadows.elevated,
  },
  emergencyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emergencyTextBlock: {
    flex: 1,
  },
  emergencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  emergencyTagText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emergencyTitle: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 20,
  },
  qrBadge: {
    width: 78,
    height: 78,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  emergencyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  emergencyCtaText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  lastDonation: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  sectionSpacer: {
    height: spacing.sm,
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
