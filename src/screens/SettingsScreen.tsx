import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Muted, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import type { ProfileStackParamList } from '../navigation/MainTabs';
import { colors, radius, spacing } from '../theme';

type Navigation = NativeStackNavigationProp<ProfileStackParamList>;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const APP_VERSION = Constants.expoConfig?.version ?? '0.1.0';

export function SettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const { deleteAccount } = useHemora();

  function confirmDelete() {
    Alert.alert(
      'Elimina dati locali',
      'Cancella profilo, donazioni, prenotazioni e notifiche salvati sul dispositivo. Operazione irreversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: deleteAccount },
      ],
    );
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Impostazioni</Title>
      <Subtitle>Gestione dell'app e dei dati salvati sul dispositivo.</Subtitle>

      <Card>
        <View style={styles.hero}>
          <View style={styles.logoTile}>
            <Ionicons name="water" size={30} color={colors.surface} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.appName}>Hemora</Text>
            <Muted>Donazioni sangue e scheda salvavita</Muted>
          </View>
        </View>
        <View style={styles.divider} />
        <InfoRow label="Versione" value={APP_VERSION} />
        <InfoRow label="Dati" value="Locali, offline-first" />
      </Card>

      <Card>
        <SectionHeader icon="shield-checkmark" title="Privacy e dati" tint={colors.success} tintBg={colors.successBg} />
        <Muted>
          I tuoi dati sanitari restano su questo dispositivo: nessuna informazione personale viene inviata al
          backend demo.
        </Muted>
        <AppButton title="Elimina dati locali" onPress={confirmDelete} variant="danger" />
      </Card>

      <Card>
        <SectionHeader icon="construct" title="Strumenti demo (admin)" tint={colors.primary} tintBg={colors.primarySoft} />
        <Muted>Popola e simula tutte le funzionalità per testare o presentare l'app.</Muted>
        <AppButton title="Apri strumenti demo" onPress={() => navigation.navigate('StrumentiAdmin')} />
      </Card>
    </Screen>
  );
}

function SectionHeader({ icon, title, tint, tintBg }: { icon: IconName; title: string; tint: string; tintBg: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.headerIcon, { backgroundColor: tintBg }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Muted>{label}</Muted>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoTile: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs / 2,
  },
  infoValue: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },
});
