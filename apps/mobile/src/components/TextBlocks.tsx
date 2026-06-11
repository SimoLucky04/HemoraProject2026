import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@theme';

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

type BadgeProps = {
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  accessibilityLabel?: string;
};

export function Badge({ children, tone = 'default', accessibilityLabel }: BadgeProps) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={[styles.badge, styles[`${tone}Badge`]]}
    >
      <Text style={[styles.badgeText, styles[`${tone}BadgeText`]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.sm,
    lineHeight: 22,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.muted,
    lineHeight: 22,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badge: {
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  defaultBadge: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.primary,
  },
  successBadge: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  warningBadge: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
  },
  dangerBadge: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
  },
  badgeText: {
    fontWeight: '800',
  },
  defaultBadgeText: {
    color: colors.primaryDark,
  },
  successBadgeText: {
    color: colors.success,
  },
  warningBadgeText: {
    color: colors.warning,
  },
  dangerBadgeText: {
    color: colors.danger,
  },
});
