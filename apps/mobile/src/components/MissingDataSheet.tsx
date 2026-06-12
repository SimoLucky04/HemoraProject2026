import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@components/AppButton';
import { colors, radius, shadows, spacing } from '@theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  intro: string;
  fields: string[];
};

// Bottom-sheet (tendina) che elenca i dati mancanti: usato per spiegare perche
// un'azione e bloccata, es. quando manca il profilo essenziale per prenotare.
export function MissingDataSheet({ visible, onClose, title, intro, fields }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="alert-circle" size={22} color={colors.danger} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Chiudi">
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={styles.intro}>{intro}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {fields.map((field) => (
              <View key={field} style={styles.row}>
                <Ionicons name="ellipse" size={8} color={colors.danger} />
                <Text style={styles.rowText}>{field}</Text>
              </View>
            ))}
          </ScrollView>

          <AppButton title="Ho capito" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
    ...shadows.elevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  intro: {
    color: colors.muted,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  list: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    marginVertical: 3,
    backgroundColor: colors.surfaceMuted,
  },
  rowText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
