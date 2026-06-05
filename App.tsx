import 'react-native-gesture-handler';
import React, { useMemo } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Network from 'expo-network';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HemoraProvider, useHemora } from './src/context/HemoraContext';
import { MainTabs } from './src/navigation/MainTabs';
import { colors, spacing } from './src/theme';

export type RootStackParamList = {
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { isReady } = useHemora();
  const insets = useSafeAreaInsets();
  const networkState = Network.useNetworkState();
  const isOffline =
    networkState.type === Network.NetworkStateType.NONE ||
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.surface,
        primary: colors.primary,
        text: colors.text,
        border: colors.border,
      },
    }),
    []
  );

  if (!isReady) {
    return (
      <View
        style={styles.loader}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Caricamento Hemora"
        accessibilityHint="Sto recuperando i dati salvati in locale."
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Carico la carta salvavita locale...</Text>
      </View>
    );
  }

  return (
    <View style={styles.appShell}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {isOffline && (
        <View
          style={[styles.offlineBanner, { paddingTop: Math.max(insets.top, spacing.xs) }]}
          accessible
          accessibilityRole="alert"
          accessibilityLabel="Modalita offline attiva"
          accessibilityHint="La carta salvavita e il QR restano consultabili dal dispositivo."
        >
          <Text style={styles.offlineTitle}>Modalita offline</Text>
          <Text style={styles.offlineText}>QR e dati salvavita restano disponibili sul dispositivo.</Text>
        </View>
      )}
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <HemoraProvider>
          <RootNavigator />
        </HemoraProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  loaderText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: colors.warningBg,
    borderBottomColor: colors.warning,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  offlineTitle: {
    color: colors.warning,
    fontWeight: '900',
  },
  offlineText: {
    color: colors.text,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
