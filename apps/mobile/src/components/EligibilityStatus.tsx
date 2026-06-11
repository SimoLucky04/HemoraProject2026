import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Donation, DonationType } from '@app-types';
import { getEligibilitySummary } from '@utils/donationRules';
import { formatItalianDate } from '@utils/date';
import { colors, radius, shadows, spacing } from '@theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Icona (sacca di sangue / goccia) e tinta dedicata per ogni tipo di donazione.
const TYPE_VISUALS: Record<DonationType, { icon: IconName; tint: string; tintBg: string }> = {
  'Sangue intero': { icon: 'blood-bag', tint: colors.primary, tintBg: colors.primarySoft },
  Plasma: { icon: 'water-outline', tint: colors.plasma, tintBg: colors.plasmaBg },
  Piastrine: { icon: 'shield-plus-outline', tint: colors.platelet, tintBg: colors.plateletBg },
};

// Idoneita per ogni tipo come card individuali: icona a sinistra, tipo, e a
// destra "Idoneo" oppure la data dalla quale si potra donare ("Dal [Data]").
export function EligibilityStatus({ donations }: { donations: Donation[] }) {
  const summary = getEligibilitySummary(donations);

  return (
    <View style={styles.container}>
      {summary.map((item) => {
        const visual = TYPE_VISUALS[item.type];
        return (
          <View
            key={item.type}
            style={styles.card}
            accessible
            accessibilityLabel={
              item.eligible
                ? `${item.type}: idoneo`
                : `${item.type}: idoneo dal ${formatItalianDate(item.date!)}`
            }
          >
            <View style={[styles.iconTile, { backgroundColor: visual.tintBg }]}>
              <MaterialCommunityIcons name={visual.icon} size={26} color={visual.tint} />
            </View>
            <View style={styles.info}>
              <Text style={styles.type}>{item.type}</Text>
              {item.eligible ? (
                <View style={styles.eligibleRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.eligibleText}>Idoneo ora</Text>
                </View>
              ) : (
                <Text style={styles.waitingLabel}>In attesa</Text>
              )}
            </View>
            <View style={styles.statusRight}>
              {item.eligible ? (
                <View style={styles.badgeOk}>
                  <Text style={styles.badgeOkText}>Idoneo</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.fromLabel}>Dal</Text>
                  <Text style={styles.fromDate}>{formatItalianDate(item.date!)}</Text>
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs + 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm - 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.soft,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  type: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  eligibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  eligibleText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  waitingLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statusRight: {
    alignItems: 'flex-end',
  },
  badgeOk: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.successBg,
  },
  badgeOkText: {
    color: colors.success,
    fontWeight: '900',
    fontSize: 13,
  },
  fromLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fromDate: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
});
