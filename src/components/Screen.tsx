import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, shadows, spacing } from '../theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  safeAreaEdges?: Edge[];
  // Contenuto fissato in basso (es. bottone "Salva" sempre visibile durante lo scroll).
  footer?: React.ReactNode;
}>;

const defaultSafeAreaEdges: Edge[] = ['top', 'right', 'bottom', 'left'];
export const nestedScreenEdges: Edge[] = ['right', 'bottom', 'left'];

export function Screen({ children, scroll = true, safeAreaEdges = defaultSafeAreaEdges, footer }: Props) {
  const contentStyle = [styles.content, footer ? styles.contentWithFooter : null];

  return (
    <SafeAreaView style={styles.safe} edges={safeAreaEdges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  contentWithFooter: {
    paddingBottom: spacing.xxl * 2,
  },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.card,
  },
});
