import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from '../screens/DashboardScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { BookingCreateScreen } from '../screens/BookingCreateScreen';
import { DonationHistoryScreen } from '../screens/DonationHistoryScreen';
import { DonationsHubScreen } from '../screens/DonationsHubScreen';
import { EmergencyContactsScreen } from '../screens/EmergencyContactsScreen';
import { ConditionsScreen } from '../screens/ConditionsScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';
import { OptionalDataScreen } from '../screens/OptionalDataScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AdminToolsScreen } from '../screens/AdminToolsScreen';
import { colors, spacing } from '../theme';

export type MainTabsParamList = {
  Donazioni: undefined;
  Home: undefined;
  Profilo: undefined;
};

export type ProfileStackParamList = {
  ProfiloMain: undefined;
  Patologie: undefined;
  Farmaci: undefined;
  ContattiEmergenza: undefined;
  DatiOpzionali: undefined;
  ImpostazioniProfilo: undefined;
  StrumentiAdmin: undefined;
};

export type DonationsStackParamList = {
  DonazioniMain: undefined;
  StoricoDonazioni: undefined;
  Prenotazioni: undefined;
  NuovaPrenotazione: { centerId?: string } | undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const DonationsStack = createNativeStackNavigator<DonationsStackParamList>();
const MAIN_TAB_ORDER = ['Donazioni', 'Home', 'Profilo'] as const;
const HOME_TAB_INDEX = MAIN_TAB_ORDER.indexOf('Home');
const PROFILE_TAB_INDEX = MAIN_TAB_ORDER.indexOf('Profilo');
const DONATIONS_TAB_INDEX = MAIN_TAB_ORDER.indexOf('Donazioni');

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];
type MainTabName = (typeof MAIN_TAB_ORDER)[number];
type NestedSection = Extract<MainTabName, 'Profilo' | 'Donazioni'>;

const tabIcons: Record<MainTabName, { active: TabIconName; inactive: TabIconName; label: string }> = {
  Donazioni: { active: 'water', inactive: 'water-outline', label: 'Donazioni' },
  Home: { active: 'home', inactive: 'home-outline', label: 'Home' },
  Profilo: { active: 'person', inactive: 'person-outline', label: 'Profilo' },
};

const tabAccessibilityLabels: Record<MainTabName, string> = {
  Donazioni: 'Donazioni, storico e prenotazioni',
  Home: 'Home Hemora, riepilogo carta salvavita',
  Profilo: 'Profilo, modifica dati salvavita',
};

function clampTabIndex(index: number) {
  return Math.min(Math.max(index, 0), MAIN_TAB_ORDER.length - 1);
}

const nestedNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

const stackScreenOptions = {
  contentStyle: { backgroundColor: colors.background },
  header: (props: NativeStackHeaderProps) => <NestedStackHeader {...props} />,
};

function getHeaderTitle({ options, route }: NativeStackHeaderProps) {
  const title = options.title ?? route.name;
  return typeof title === 'string' ? title : route.name;
}

function NestedStackHeader(props: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const title = getHeaderTitle(props);

  return (
    <View style={[styles.nestedHeader, { paddingTop: insets.top + spacing.xs }]}>
      <Pressable
        onPress={props.navigation.goBack}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Torna indietro"
        accessibilityHint={`Torna alla schermata precedente da ${title}`}
        hitSlop={8}
        style={({ pressed }) => [styles.backButton, pressed && styles.tabPressed]}
      >
        <Ionicons name="chevron-back" size={24} color={colors.primaryDark} />
        <Text style={styles.backButtonText}>Indietro</Text>
      </Pressable>
    </View>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfiloMain" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Patologie" component={ConditionsScreen} options={{ title: 'Patologie e allergie' }} />
      <ProfileStack.Screen name="Farmaci" component={MedicationsScreen} options={{ title: 'Farmaci salvavita' }} />
      <ProfileStack.Screen name="ContattiEmergenza" component={EmergencyContactsScreen} options={{ title: 'Contatti emergenza' }} />
      <ProfileStack.Screen name="DatiOpzionali" component={OptionalDataScreen} options={{ title: 'Dati opzionali' }} />
      <ProfileStack.Screen name="ImpostazioniProfilo" component={SettingsScreen} options={{ title: 'Impostazioni' }} />
      <ProfileStack.Screen name="StrumentiAdmin" component={AdminToolsScreen} options={{ title: 'Strumenti demo' }} />
    </ProfileStack.Navigator>
  );
}

function DonationsStackNavigator() {
  return (
    <DonationsStack.Navigator screenOptions={stackScreenOptions}>
      <DonationsStack.Screen name="DonazioniMain" component={DonationsHubScreen} options={{ headerShown: false }} />
      <DonationsStack.Screen name="StoricoDonazioni" component={DonationHistoryScreen} options={{ title: 'Storico donazioni' }} />
      <DonationsStack.Screen name="Prenotazioni" component={BookingsScreen} options={{ title: 'Prenotazioni' }} />
      <DonationsStack.Screen name="NuovaPrenotazione" component={BookingCreateScreen} options={{ title: 'Nuova prenotazione' }} />
    </DonationsStack.Navigator>
  );
}

function IndependentNavigator({
  children,
  navigationRef,
  onRootStateChange,
}: {
  children: React.ReactNode;
  navigationRef: React.RefObject<any>;
  onRootStateChange: (isRoot: boolean) => void;
}) {
  return (
    <NavigationIndependentTree>
      <NavigationContainer
        ref={navigationRef}
        theme={nestedNavigationTheme}
        onReady={() => {
          const state = navigationRef.current?.getRootState();
          onRootStateChange((state?.index ?? 0) === 0);
        }}
        onStateChange={(state) => onRootStateChange((state?.index ?? 0) === 0)}
      >
        {children}
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

export function MainTabs() {
  const pagerRef = React.useRef<PagerView>(null);
  const activeIndexRef = React.useRef(HOME_TAB_INDEX);
  const profileNavigationRef = React.useRef(createNavigationContainerRef<ProfileStackParamList>()).current;
  const donationsNavigationRef = React.useRef(createNavigationContainerRef<DonationsStackParamList>()).current;
  const [activeIndex, setActiveIndexState] = React.useState(HOME_TAB_INDEX);
  const [visualIndex, setVisualIndexState] = React.useState(HOME_TAB_INDEX);
  const [sectionRootState, setSectionRootState] = React.useState<Record<NestedSection, boolean>>({
    Profilo: true,
    Donazioni: true,
  });

  const canSwipeBetweenTabs =
    (activeIndex !== PROFILE_TAB_INDEX || sectionRootState.Profilo) &&
    (activeIndex !== DONATIONS_TAB_INDEX || sectionRootState.Donazioni);

  function setActiveIndex(index: number) {
    activeIndexRef.current = index;
    setActiveIndexState(index);
    setVisualIndex(index);
  }

  function setVisualIndex(index: number) {
    setVisualIndexState((current) => (current === index ? current : index));
  }

  function updateSectionRootState(section: NestedSection, isRoot: boolean) {
    setSectionRootState((current) => (current[section] === isRoot ? current : { ...current, [section]: isRoot }));
  }

  function resetSectionStack(tabName: MainTabName) {
    if (tabName === 'Profilo' && profileNavigationRef.isReady()) {
      profileNavigationRef.resetRoot({ index: 0, routes: [{ name: 'ProfiloMain' }] });
    }

    if (tabName === 'Donazioni' && donationsNavigationRef.isReady()) {
      donationsNavigationRef.resetRoot({ index: 0, routes: [{ name: 'DonazioniMain' }] });
    }
  }

  function isSectionAtRoot(tabName: MainTabName) {
    if (tabName === 'Profilo') return sectionRootState.Profilo;
    if (tabName === 'Donazioni') return sectionRootState.Donazioni;
    return true; // Home non ha stack annidato.
  }

  function goToTab(index: number) {
    const tabName = MAIN_TAB_ORDER[index];

    if (activeIndexRef.current === index) {
      // Tab già attiva: torniamo alla radice solo se siamo in una
      // sotto-schermata. Se siamo già alla radice non facciamo nulla,
      // così evitiamo l'animazione di ricarica superflua.
      if (!isSectionAtRoot(tabName)) {
        resetSectionStack(tabName);
      }
      return;
    }

    setActiveIndex(index);
    pagerRef.current?.setPage(index);
  }

  function openDonationHistory() {
    goToTab(DONATIONS_TAB_INDEX);
    if (donationsNavigationRef.isReady()) {
      donationsNavigationRef.navigate('StoricoDonazioni');
    }
  }

  function openBookings() {
    goToTab(DONATIONS_TAB_INDEX);
    if (donationsNavigationRef.isReady()) {
      donationsNavigationRef.navigate('Prenotazioni');
    }
  }

  return (
    <View style={styles.swipeShell}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={HOME_TAB_INDEX}
        orientation="horizontal"
        scrollEnabled={canSwipeBetweenTabs}
        onPageScroll={(event) => {
          const { offset, position } = event.nativeEvent;
          setVisualIndex(clampTabIndex(Math.round(position + offset)));
        }}
        onPageSelected={(event) => setActiveIndex(event.nativeEvent.position)}
      >
        <View key="donations" style={styles.page}>
          <IndependentNavigator
            navigationRef={donationsNavigationRef}
            onRootStateChange={(isRoot) => updateSectionRootState('Donazioni', isRoot)}
          >
            <DonationsStackNavigator />
          </IndependentNavigator>
        </View>
        <View key="home" style={styles.page}>
          <DashboardScreen onOpenDonationHistory={openDonationHistory} onOpenBookings={openBookings} />
        </View>
        <View key="profile" style={styles.page}>
          <IndependentNavigator
            navigationRef={profileNavigationRef}
            onRootStateChange={(isRoot) => updateSectionRootState('Profilo', isRoot)}
          >
            <ProfileStackNavigator />
          </IndependentNavigator>
        </View>
      </PagerView>

      <View style={styles.tabBar} accessibilityRole="tablist">
        {MAIN_TAB_ORDER.map((tabName, index) => {
          const focused = visualIndex === index;
          const icon = tabIcons[tabName];

          return (
            <Pressable
              key={tabName}
              onPress={() => goToTab(index)}
              accessible
              accessibilityRole="tab"
              accessibilityLabel={tabAccessibilityLabels[tabName]}
              accessibilityState={{ selected: focused }}
              style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
            >
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={24}
                color={focused ? colors.primary : colors.muted}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{icon.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  nestedHeader: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    minHeight: 40,
    paddingRight: spacing.sm,
  },
  backButtonText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '900',
  },
  tabBar: {
    minHeight: 72,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  tabPressed: {
    opacity: 0.72,
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: colors.primary,
  },
});
