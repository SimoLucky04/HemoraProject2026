import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EligibilityStatus } from '../components/EligibilityStatus';
import { FeatureCard } from '../components/FeatureCard';
import { Screen } from '../components/Screen';
import { SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { colors, spacing } from '../theme';
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

      <View style={styles.sectionHeader}>
        <SectionTitle>Idoneità per tipo</SectionTitle>
      </View>
      <EligibilityStatus donations={state.donations} />

      <View style={styles.sectionHeader}>
        <SectionTitle>Sottosezioni donazioni</SectionTitle>
      </View>
      <FeatureCard
        icon="time-outline"
        title="Storico"
        description="Le donazioni completate dalle tue prenotazioni."
        badge={state.donations.length}
        tint={colors.primary}
        tintBg={colors.primarySoft}
        onPress={() => navigation.navigate('StoricoDonazioni')}
      />
      <FeatureCard
        icon="calendar-outline"
        title="Prenotazioni"
        description="Mappa dei centri, nuova prenotazione e prenotazioni salvate."
        badge={state.bookings.length}
        tint={colors.plasma}
        tintBg={colors.plasmaBg}
        onPress={() => navigation.navigate('Prenotazioni')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
});
