import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { colors, spacing } from '../theme';
import { formatItalianDate } from '../utils/date';

export function DonationHistoryScreen() {
  const { state, reconcileDueBookings } = useHemora();

  useFocusEffect(
    useCallback(() => {
      reconcileDueBookings();
    }, [reconcileDueBookings])
  );

  const sortedDonations = useMemo(() => {
    return [...state.donations].sort((a, b) => b.date.localeCompare(a.date));
  }, [state.donations]);

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Storico donazioni</Title>
      <Subtitle>Donazioni completate dalle tue prenotazioni, dalla più recente.</Subtitle>

      <Card>
        <Row>
          <SectionTitle>Donazioni completate</SectionTitle>
          <Badge>{state.donations.length}</Badge>
        </Row>
        {sortedDonations.length === 0 ? (
          <Muted>Lo storico è vuoto. Prenota una donazione: comparirà qui una volta passato lo slot.</Muted>
        ) : (
          sortedDonations.map((donation) => (
            <View key={donation.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{formatItalianDate(donation.date)} · {donation.type}</Text>
              <Muted>{donation.centerName}{donation.volumeMl ? ` · ${donation.volumeMl} ml` : ''}</Muted>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  itemTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
});
