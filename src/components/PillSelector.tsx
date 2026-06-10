import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Props<T extends string> = {
  label?: string;
  options: readonly T[];
  // Accetta anche un valore non presente tra le opzioni (es. '') = nessuna pill attiva.
  value: string;
  onChange: (value: T) => void;
  getLabel?: (value: T) => string;
};

// Gruppo di pulsanti pill: bordi completamente arrotondati, attivo in corallo
// con testo bianco. Sostituisce i vecchi box quadrati per Sesso / Gruppo / Rh.
export function PillSelector<T extends string>({ label, options, value, onChange, getLabel }: Props<T>) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((option) => {
          const active = value === option;
          const text = getLabel ? getLabel(option) : option;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={text}
              style={({ pressed }) => [
                styles.pill,
                active && styles.pillActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    minHeight: 44,
    minWidth: 56,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  pillText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  pillTextActive: {
    color: colors.surface,
  },
});
