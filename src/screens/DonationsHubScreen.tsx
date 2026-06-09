import React, { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../components/Card';
import { EligibilityStatus } from '../components/EligibilityStatus';
import { Screen } from '../components/Screen';
import { SectionLink } from '../components/SectionLink';
import { SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import type { DonationsStackParamList } from '../navigation/MainTabs';

type Navigation = NativeStackNavigationProp<DonationsStackParamList>;

export function DonationsHubScreen() {
  const navigation = useNavigation<Navigation>();
  const { state, reconcileDueBookings } = useHemora();

  // Converte le prenotazioni scadute in donazioni appena entri nella sezione.
  useFocusEffect(
    useCallback(() => {
      reconcileDueBookings();
    }, [reconcileDueBookings])
  );

  return (
    <Screen>
      <Title>Donazioni</Title>
      <Subtitle>Le donazioni nascono dalle prenotazioni: quando lo slot passa, finiscono nello storico.</Subtitle>

      <Card>
        <SectionTitle>Idoneità per tipo</SectionTitle>
        <EligibilityStatus donations={state.donations} />
      </Card>

      <Card>
        <SectionTitle>Sottosezioni donazioni</SectionTitle>
        <SectionLink
          icon="time-outline"
          title="Storico"
          description="Le donazioni completate dalle tue prenotazioni."
          badge={state.donations.length}
          onPress={() => navigation.navigate('StoricoDonazioni')}
        />
        <SectionLink
          icon="calendar-outline"
          title="Prenotazioni"
          description="Mappa dei centri, nuova prenotazione e prenotazioni salvate."
          badge={state.bookings.length}
          onPress={() => navigation.navigate('Prenotazioni')}
        />
      </Card>
    </Screen>
  );
}
