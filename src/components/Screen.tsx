import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  safeAreaEdges?: Edge[];
}>;

const defaultSafeAreaEdges: Edge[] = ['top', 'right', 'bottom', 'left'];
export const nestedScreenEdges: Edge[] = ['right', 'bottom', 'left'];

export function Screen({ children, scroll = true, safeAreaEdges = defaultSafeAreaEdges }: Props) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={safeAreaEdges}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={safeAreaEdges}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
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
});
