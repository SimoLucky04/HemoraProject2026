import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from './TextBlocks';
import { Donation } from '../types';
import { getEligibilitySummary } from '../utils/donationRules';
import { formatItalianDate } from '../utils/date';
import { colors, spacing } from '../theme';

// Mostra l'idoneita per ogni tipo di donazione: "Idoneo" oppure la data da cui lo sarai.
export function EligibilityStatus({ donations }: { donations: Donation[] }) {
  const summary = getEligibilitySummary(donations);

  return (
    <View style={styles.container}>
      {summary.map((item) => (
        <View
          key={item.type}
          style={styles.row}
          accessible
          accessibilityLabel={
            item.eligible
              ? `${item.type}: idoneo`
              : `${item.type}: idoneo dal ${formatItalianDate(item.date!)}`
          }
        >
          <Text style={styles.type}>{item.type}</Text>
          {item.eligible ? (
            <Badge tone="success">Idoneo</Badge>
          ) : (
            <Text style={styles.waiting}>Dal {formatItalianDate(item.date!)}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  type: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  waiting: {
    color: colors.danger,
    fontWeight: '800',
  },
});
