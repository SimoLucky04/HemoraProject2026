import React from 'react';
import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  maxLength?: number;
  // Messaggio di errore: evidenzia il campo in rosso e lo mostra sotto.
  error?: string;
};

export const Field = React.memo(function Field({ label, multiline, accessibilityLabel, accessibilityHint, error, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessible
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        style={[styles.input, multiline && styles.multiline, !!error && styles.inputError]}
        placeholderTextColor={colors.muted}
        multiline={multiline}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs / 2,
  },
});
