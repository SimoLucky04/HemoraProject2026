import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type CustomHeaderProps = {
  // Slot titolo: nome route o titolo custom.
  title: string;
  // Slot sinistro: pulsante Indietro, mostrato solo nelle sotto-schermate di uno stack.
  canGoBack?: boolean;
  onBack?: () => void;
  // Slot destro opzionale (es. avatar sulla Home, ingranaggio sul Profilo).
  right?: React.ReactNode;
  // Root screen = titolo grande; sotto-schermata = titolo compatto.
  large?: boolean;
};

// Header globale e riutilizzabile: layout a riga con slot sinistro (back),
// titolo dinamico e slot destro opzionale. Gestisce da solo la safe area
// superiore, così le schermate non devono includere il bordo 'top'.
export function CustomHeader({ title, canGoBack = false, onBack, right, large = false }: CustomHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
      {canGoBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Torna indietro"
          hitSlop={10}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primaryDark} />
        </Pressable>
      ) : null}

      <Text style={[styles.title, large && styles.titleLarge]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.right}>{right}</View>
    </View>
  );
}

// Bottone-icona riutilizzabile per lo slot destro (ingranaggio, avatar, ...).
export function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: IoniconName;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={colors.primaryDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backButton: {
    marginLeft: -4,
    minHeight: 32,
    justifyContent: 'center',
  },
  // Titolo compatto per le sotto-schermate (20-22).
  title: {
    flex: 1,
    fontSize: 21,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  // Titolo grande per le schermate principali (24-28).
  titleLarge: {
    fontSize: 26,
  },
  right: {
    minWidth: 24,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.6,
  },
});
