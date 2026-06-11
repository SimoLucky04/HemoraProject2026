import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '@theme';

type Props = PropsWithChildren<
  ViewProps & {
    tone?: 'default' | 'critical' | 'success' | 'subtle';
  }
>;

export const Card = React.memo(function Card({ children, style, tone = 'default', ...props }: Props) {
  return (
    <View {...props} style={[styles.card, styles[tone], style]}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  default: {},
  critical: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  success: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  subtle: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.surfaceMuted,
    ...shadows.soft,
  },
});
