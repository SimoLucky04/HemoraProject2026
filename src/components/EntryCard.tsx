import Ionicons from '@expo/vector-icons/Ionicons';
import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = PropsWithChildren<{
  icon: IconName;
  title: string;
  onDelete: () => void;
  tint?: string;
  tintBg?: string;
  deleteLabel?: string;
}>;

// Voce di elenco riutilizzabile: card elevata con icona colorata a sinistra,
// titolo + contenuto libero e pulsante cestino per eliminare a destra.
export function EntryCard({
  icon,
  title,
  onDelete,
  tint = colors.primary,
  tintBg = colors.primarySoft,
  deleteLabel,
  children,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconTile, { backgroundColor: tintBg }]}>
        <Ionicons name={icon} size={24} color={tint} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={deleteLabel ?? `Elimina ${title}`}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: radius.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 2,
  },
  title: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '900',
    marginBottom: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressed: {
    opacity: 0.6,
  },
});
