import React, { useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@components/AppButton';
import { Card } from '@components/Card';
import { Screen } from '@components/Screen';
import { Muted, SectionTitle, Subtitle, Title } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import { colors, spacing } from '@theme';
import { formatItalianDate } from '@utils/date';
import { buildNotifications, countUnread } from '@utils/notifications';

export function NotificationsScreen({ onClose }: { onClose: () => void }) {
  const { state, markNotificationsRead } = useHemora();
  const notifications = useMemo(() => buildNotifications(state), [state]);
  const unread = countUnread(notifications);

  return (
    <Screen>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Chiudi notifiche"
          accessibilityHint="Torna alla home"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primaryDark} />
          <Text style={styles.backText}>Indietro</Text>
        </Pressable>
      </View>

      <Title>Notifiche</Title>
      <Subtitle>Qui troverai tutte le notifiche ricevute, in ordine di arrivo.</Subtitle>

      {unread > 0 && (
        <AppButton
          title="Segna tutte come lette"
          onPress={markNotificationsRead}
          variant="primary"
          accessibilityHint="Contrassegna come lette tutte le notifiche del registro"
        />
      )}

      {notifications.length === 0 ? (
        <Card>
          <Muted>Non hai ancora ricevuto notifiche.</Muted>
        </Card>
      ) : (
        notifications.map((item) => (
          <Card
            key={item.id}
            tone={item.read ? 'default' : 'critical'}
            accessible
            accessibilityLabel={`${item.read ? 'Notifica letta' : 'Notifica non letta'}: ${item.title}. ${item.message}`}
          >
            <SectionTitle>{item.title}</SectionTitle>
            <Text style={[styles.message, !item.read && styles.messageUnread]}>{item.message}</Text>
            <Muted>{formatItalianDate(item.date)}</Muted>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xs,
  },
  back: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    minHeight: 40,
    paddingRight: spacing.sm,
  },
  backText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.6,
  },
  message: {
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  messageUnread: {
    color: colors.danger,
    fontWeight: '700',
  },
});
