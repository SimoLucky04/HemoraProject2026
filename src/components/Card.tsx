import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, spacing } from '../theme';

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
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
  },
});
