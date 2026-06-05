import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { colors, spacing } from '../theme';
import { formatItalianDate } from '../utils/date';

export function DonationBookingsScreen() {
  const { state } = useHemora();

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Prenotazioni</Title>
      <Subtitle>Elenco delle prenotazioni create dai centri raccolta.</Subtitle>

      <Card>
        <Row>
          <SectionTitle>Prenotazioni salvate</SectionTitle>
          <Badge>{state.bookings.length}</Badge>
        </Row>
        {state.bookings.length === 0 ? (
          <Muted>Nessuna prenotazione registrata.</Muted>
        ) : (
          state.bookings.map((booking) => (
            <View key={booking.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{formatItalianDate(booking.dateTime)} · {booking.type}</Text>
              <Muted>{booking.centerName} · {booking.status}</Muted>
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
