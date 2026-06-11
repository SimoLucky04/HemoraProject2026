import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '@theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
  badge?: number | string;
  // Tinta dell'icona colorata a sinistra (default corallo primario).
  tint?: string;
  tintBg?: string;
};

// Blocco massiccio cliccabile: card elevata con icona colorata a sinistra,
// titolo, descrizione, contatore opzionale e chevron. Per i menu di sottosezioni.
export function FeatureCard({ icon, title, description, onPress, badge, tint = colors.primary, tintBg = colors.primarySoft }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconTile, { backgroundColor: tintBg }]}>
        <Ionicons name={icon} size={24} color={tint} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {badge !== undefined && (
            <View style={styles.countChip}>
              <Text style={styles.countText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.borderStrong} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.xs + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.soft,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: radius.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  countChip: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: colors.primaryDark,
    fontWeight: '900',
    fontSize: 13,
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
