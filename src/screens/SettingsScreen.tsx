import React from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Muted, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import type { ProfileStackParamList } from '../navigation/MainTabs';
import { colors, spacing } from '../theme';

type Navigation = NativeStackNavigationProp<ProfileStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const { deleteAccount, markNotificationsRead } = useHemora();

  function confirmDelete() {
    Alert.alert(
      'Elimina dati locali',
      'Questa operazione cancella i dati locali salvati in AsyncStorage.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: deleteAccount },
      ],
    );
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Impostazioni</Title>
      <Subtitle>Gestione dati locali della demo.</Subtitle>

      <Card>
        <SectionTitle>Modalità locale</SectionTitle>
        <Text style={styles.status}>Nessuna autenticazione</Text>
        <Muted>Profilo sanitario, QR, donazioni e prenotazioni simulate restano su questo dispositivo.</Muted>
      </Card>

      <Card>
        <SectionTitle>Notifiche</SectionTitle>
        <Muted>Gli alert emergenza possono arrivare dal backend demo oppure dai dati locali di fallback.</Muted>
        <AppButton title="Segna notifiche come lette" onPress={markNotificationsRead} variant="secondary" />
      </Card>

      <Card>
        <SectionTitle>Privacy</SectionTitle>
        <Muted>Nessun dato sanitario personale viene inviato al backend demo.</Muted>
        <AppButton title="Elimina dati locali" onPress={confirmDelete} variant="danger" />
      </Card>

      <Card tone="subtle">
        <SectionTitle>Strumenti demo (admin)</SectionTitle>
        <Muted>Popola e simula tutte le funzionalità dell'app per testarla o presentarla.</Muted>
        <AppButton
          title="Apri strumenti demo"
          onPress={() => navigation.navigate('StrumentiAdmin')}
          accessibilityHint="Apre il pannello admin per popolare dati di test"
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
});
