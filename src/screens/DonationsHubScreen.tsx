import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { SectionLink } from '../components/SectionLink';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import type { DonationsStackParamList } from '../navigation/MainTabs';
import { colors, spacing } from '../theme';
import { formatItalianDate } from '../utils/date';

type Navigation = NativeStackNavigationProp<DonationsStackParamList>;

export function DonationsHubScreen() {
  const navigation = useNavigation<Navigation>();
  const { state } = useHemora();

  const lastDonation = useMemo(() => {
    return [...state.donations].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [state.donations]);

  return (
    <Screen>
      <Title>Donazioni</Title>
      <Subtitle>Una sola voce nella barra inferiore, con dentro storico, registrazione, centri e prenotazioni.</Subtitle>

      <Card>
        <Row>
          <SectionTitle>Riepilogo</SectionTitle>
          <Badge>{state.donations.length} totali</Badge>
        </Row>
        {lastDonation ? (
          <>
            <Text style={styles.mainText}>Ultima donazione: {formatItalianDate(lastDonation.date)} · {lastDonation.type}</Text>
            <Text style={styles.mainText}>Prossima idoneità: {formatItalianDate(lastDonation.nextEligibilityDate)}</Text>
          </>
        ) : (
          <Muted>Non hai ancora registrato donazioni.</Muted>
        )}
      </Card>

      <Card>
        <SectionTitle>Sottosezioni donazioni</SectionTitle>
        <SectionLink
          icon="add-circle-outline"
          title="Registra donazione"
          description="Aggiungi una donazione effettuata e calcola la prossima idoneità."
          onPress={() => navigation.navigate('RegistraDonazione')}
        />
        <SectionLink
          icon="time-outline"
          title="Storico"
          description="Consulta tutte le donazioni salvate."
          badge={state.donations.length}
          onPress={() => navigation.navigate('StoricoDonazioni')}
        />
        <SectionLink
          icon="map-outline"
          title="Centri raccolta"
          description="Visualizza mappa, distanza e prenotazione simulata."
          badge={state.centers.length}
          onPress={() => navigation.navigate('CentriRaccolta')}
        />
        <SectionLink
          icon="calendar-outline"
          title="Prenotazioni"
          description="Controlla le prenotazioni registrate."
          badge={state.bookings.length}
          onPress={() => navigation.navigate('Prenotazioni')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mainText: {
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
