import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Badge, Muted } from './TextBlocks';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type SectionLinkProps = {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
  badge?: number | string;
};

export function SectionLink({ icon, title, description, onPress, badge }: SectionLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={colors.primaryDark} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge !== undefined && <Badge>{badge}</Badge>}
        </View>
        <Muted>{description}</Muted>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.borderStrong} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    minHeight: 82,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
});
