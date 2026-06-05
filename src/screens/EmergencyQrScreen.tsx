import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { colors, radius, spacing } from '../theme';
import {
  buildEmergencyPayload,
  buildEmergencyTextPayload,
  getBloodType,
  getFullName,
  getMissingEmergencyFields,
} from '../utils/emergencyProfile';

export function EmergencyQrScreen() {
  const { state } = useHemora();
  const { profile } = state;
  const { width } = useWindowDimensions();

  const missing = useMemo(() => getMissingEmergencyFields(profile), [profile]);
  const emergencyPayload = useMemo(() => buildEmergencyPayload(profile), [profile]);
  const emergencyText = useMemo(() => buildEmergencyTextPayload(profile), [profile]);
  const qrValue = emergencyText;
  const qrSize = Math.min(256, Math.max(200, width - spacing.xxl * 2));
  const fullName = getFullName(profile) || 'Nome non inserito';
  const emergencyConditions = emergencyPayload.conditions.length;
  const emergencyMedications = emergencyPayload.medications.length;

  return (
    <Screen>
      <Title>QR emergenza</Title>
      <Subtitle>Solo dati salvavita, salvati localmente e leggibili come scheda testuale anche senza rete.</Subtitle>

      {missing.length > 0 && (
        <Card tone="critical" accessible accessibilityRole="alert" accessibilityLabel={`Profilo incompleto. Mancano ${missing.join(', ')}`}>
          <SectionTitle>Profilo incompleto</SectionTitle>
          <Muted>Completa questi dati prima di affidarti al QR in emergenza:</Muted>
          <Text style={styles.missing}>{missing.join(', ')}</Text>
        </Card>
      )}

      <Card
        accessible
        accessibilityLabel={`QR emergenza per ${fullName}. Gruppo sanguigno ${getBloodType(profile)}.`}
        accessibilityHint="Il QR contiene una copia locale dei dati salvavita essenziali."
      >
        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={qrSize} />
        </View>
        <View style={styles.summary}>
          <Badge accessibilityLabel={`Gruppo sanguigno ${getBloodType(profile)}`}>{getBloodType(profile)}</Badge>
          <Text style={styles.name}>{fullName}</Text>
          <Muted>
            Scheda TXT: {emergencyConditions} patologie/allergie - {emergencyMedications} farmaci - {profile.emergencyContacts.length} contatti
          </Muted>
        </View>
      </Card>

      <Card tone="success" accessible accessibilityLabel="Consultazione offline pronta">
        <Row>
          <SectionTitle>Offline ready</SectionTitle>
          <Badge tone="success">Locale</Badge>
        </Row>
        <Muted>La carta viene generata dai dati salvati sul dispositivo. Non richiede chiamate a server esterni.</Muted>
      </Card>

      <Card>
        <SectionTitle>Anteprima testo QR</SectionTitle>
        <Text style={styles.previewText}>{emergencyText}</Text>
      </Card>

      <Card>
        <SectionTitle>Dati inclusi</SectionTitle>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Note salvavita</Text>
          <Text style={styles.dataValue}>{profile.lifesavingNotes ? 'Presenti' : 'Da compilare'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Patologie/allergie rilevanti</Text>
          <Text style={styles.dataValue}>{emergencyConditions}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Farmaci rilevanti</Text>
          <Text style={styles.dataValue}>{emergencyMedications}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Contatti emergenza</Text>
          <Text style={styles.dataValue}>{profile.emergencyContacts.length}</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrBox: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  summary: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginVertical: spacing.xs,
    textAlign: 'center',
  },
  missing: {
    color: colors.danger,
    fontWeight: '800',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  dataRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.xs,
  },
  dataLabel: {
    color: colors.muted,
    fontWeight: '700',
  },
  dataValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  previewText: {
    color: colors.text,
    fontFamily: 'Courier',
    fontSize: 13,
    lineHeight: 19,
  },
});
