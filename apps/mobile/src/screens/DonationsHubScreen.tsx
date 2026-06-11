import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EligibilityStatus } from '@components/EligibilityStatus';
import { FeatureCard } from '@components/FeatureCard';
import { nestedScreenEdges, Screen } from '@components/Screen';
import { SectionTitle } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import { colors, spacing } from '@theme';
import type { DonationsStackParamList } from '@navigation/MainTabs';

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
    <Screen safeAreaEdges={nestedScreenEdges}>
      <View style={styles.sectionHeader}>
        <SectionTitle>Idoneità</SectionTitle>
      </View>
      <EligibilityStatus donations={state.donations} />

      <View style={styles.sectionHeader}>
        <SectionTitle>{'\n'}Gestisci le donazioni</SectionTitle>
      </View>
      <FeatureCard
        icon="time-outline"
        title="Storico"
        description="Storico delle tue donazioni."
        badge={state.donations.length}
        tint={colors.primary}
        tintBg={colors.primarySoft}
        onPress={() => navigation.navigate('StoricoDonazioni')}
      />
      <FeatureCard
        icon="calendar-outline"
        title="Prenotazioni"
        description="Prenota ora la tua prossima donazione!"
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
