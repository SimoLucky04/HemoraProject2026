import React, { useCallback, useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '@components/Card';
import { nestedScreenEdges, Screen } from '@components/Screen';
import { Muted } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import { colors, radius, spacing } from '@theme';
import { formatItalianDate } from '@utils/date';

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

      {sortedDonations.length === 0 ? (
        <Card tone="subtle">
          <Muted>Lo storico è vuoto. Prenota una donazione: comparirà qui una volta passato lo slot.</Muted>
        </Card>
      ) : (
        sortedDonations.map((donation) => (
          <Card key={donation.id}>
            <View style={styles.topRow}>
              <View style={styles.dateBlock}>
                <Ionicons name="calendar-outline" size={16} color={colors.muted} />
                <Text style={styles.date}>{formatItalianDate(donation.date)}</Text>
              </View>
              <View style={styles.statusChip}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.statusText}>Completata</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.bottomRow}>
              <View style={styles.centerBlock}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={styles.center} numberOfLines={2}>{donation.centerName}</Text>
              </View>
              <View style={styles.metaBlock}>
                <View style={styles.typeChip}>
                  <Text style={styles.typeText}>{donation.type}</Text>
                </View>
                {donation.volumeMl ? <Text style={styles.volume}>{donation.volumeMl} ml</Text> : null}
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    color: colors.success,
    fontWeight: '800',
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm - 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  centerBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  center: {
    flex: 1,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  metaBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  typeText: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 12,
  },
  volume: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});
