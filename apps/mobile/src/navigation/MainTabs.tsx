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
import { CustomHeader, HeaderIconButton } from '@components/CustomHeader';
import { DashboardScreen } from '@screens/DashboardScreen';
import { BookingsScreen } from '@screens/BookingsScreen';
import { BookingCreateScreen } from '@screens/BookingCreateScreen';
import { DonationHistoryScreen } from '@screens/DonationHistoryScreen';
import { DonationsHubScreen } from '@screens/DonationsHubScreen';
import { EmergencyContactsScreen } from '@screens/EmergencyContactsScreen';
import { ConditionsScreen } from '@screens/ConditionsScreen';
import { MedicationsScreen } from '@screens/MedicationsScreen';
import { OptionalDataScreen } from '@screens/OptionalDataScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { AdminToolsScreen } from '@screens/AdminToolsScreen';
import { colors, radius, spacing } from '@theme';

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

// Una sola glyph stabile per tab: cambia solo colore/sfondo in base al focus,
// così le icone non "saltano" tra versione piena e outline durante le transizioni.
const tabIcons: Record<MainTabName, { icon: TabIconName; label: string }> = {
  Donazioni: { icon: 'water', label: 'Donazioni' },
  Home: { icon: 'home', label: 'Home' },
  Profilo: { icon: 'person', label: 'Profilo' },
};

const tabAccessibilityLabels: Record<MainTabName, string> = {
  Donazioni: 'Donazioni, storico e prenotazioni',
  Home: 'Home Hemora, riepilogo carta salvavita',
  Profilo: 'Profilo, modifica dati salvavita',
};

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

function getHeaderTitle({ options, route }: NativeStackHeaderProps) {
  const title = options.title ?? route.name;
  return typeof title === 'string' ? title : route.name;
}

// Header globale per gli stack annidati: titolo dinamico, pulsante Indietro nelle
// sotto-schermate e slot destro opzionale (passato via options.headerRight).
const stackScreenOptions = {
  contentStyle: { backgroundColor: colors.background },
  header: (props: NativeStackHeaderProps) => {
    const canGoBack = props.navigation.canGoBack();
    return (
      <CustomHeader
        title={getHeaderTitle(props)}
        canGoBack={canGoBack}
        onBack={props.navigation.goBack}
        right={props.options.headerRight?.({ tintColor: colors.primaryDark, canGoBack })}
        large={!canGoBack}
      />
    );
  },
};

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen
        name="ProfiloMain"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'Profilo',
          headerRight: () => (
            <HeaderIconButton
              icon="settings-outline"
              accessibilityLabel="Apri impostazioni"
              onPress={() => navigation.navigate('ImpostazioniProfilo')}
            />
          ),
        })}
      />
      <ProfileStack.Screen name="Patologie" component={ConditionsScreen} options={{ title: 'Patologie' }} />
      <ProfileStack.Screen name="Farmaci" component={MedicationsScreen} options={{ title: 'Farmaci' }} />
      <ProfileStack.Screen name="ContattiEmergenza" component={EmergencyContactsScreen} options={{ title: 'Contatti di emergenza' }} />
      <ProfileStack.Screen name="DatiOpzionali" component={OptionalDataScreen} options={{ title: 'Dati opzionali' }} />
      <ProfileStack.Screen name="ImpostazioniProfilo" component={SettingsScreen} options={{ title: 'Impostazioni' }} />
      <ProfileStack.Screen name="StrumentiAdmin" component={AdminToolsScreen} options={{ title: 'Strumenti demo' }} />
    </ProfileStack.Navigator>
  );
}

function DonationsStackNavigator() {
  return (
    <DonationsStack.Navigator screenOptions={stackScreenOptions}>
      <DonationsStack.Screen name="DonazioniMain" component={DonationsHubScreen} options={{ title: 'Donazioni' }} />
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
  const insets = useSafeAreaInsets();
  const pagerRef = React.useRef<PagerView>(null);
  const activeIndexRef = React.useRef(HOME_TAB_INDEX);
  const profileNavigationRef = React.useRef(createNavigationContainerRef<ProfileStackParamList>()).current;
  const donationsNavigationRef = React.useRef(createNavigationContainerRef<DonationsStackParamList>()).current;
  // activeIndex = pagina confermata (governa swipe abilitato e reset stack).
  // highlightIndex = tab evidenziata, aggiornata in tempo reale durante lo swipe.
  const [activeIndex, setActiveIndexState] = React.useState(HOME_TAB_INDEX);
  const [highlightIndex, setHighlightIndexState] = React.useState(HOME_TAB_INDEX);
  const programmaticJumpRef = React.useRef(false);
  const [sectionRootState, setSectionRootState] = React.useState<Record<NestedSection, boolean>>({
    Profilo: true,
    Donazioni: true,
  });

  const canSwipeBetweenTabs =
    (activeIndex !== PROFILE_TAB_INDEX || sectionRootState.Profilo) &&
    (activeIndex !== DONATIONS_TAB_INDEX || sectionRootState.Donazioni);

  function setActiveIndex(index: number) {
    activeIndexRef.current = index;
    setActiveIndexState((current) => (current === index ? current : index));
    setHighlightIndex(index);
  }

  function setHighlightIndex(index: number) {
    setHighlightIndexState((current) => (current === index ? current : index));
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

    // Premendo la tab si apre SEMPRE la schermata principale della sezione: se la
    // sezione ha una sotto-schermata aperta (anche restando attiva in background),
    // si torna alla radice. Cosi tornando su Profilo/Donazioni non si riapre la
    // sotto-schermata lasciata, ma la pagina principale.
    if (!isSectionAtRoot(tabName)) {
      resetSectionStack(tabName);
    }

    if (activeIndexRef.current === index) {
      // Tab già attiva: il reset sopra basta, niente animazione di pagina.
      return;
    }

    // Salto da tap: marchiamo il jump cosi onPageScroll non accende le tab
    // intermedie durante l'animazione; l'indicatore va dritto alla destinazione.
    programmaticJumpRef.current = true;
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
          // Durante uno swipe col dito aggiorniamo subito l'indicatore (a meta
          // transizione). Durante un salto da tap restiamo fermi sulla destinazione.
          if (programmaticJumpRef.current) return;
          const { offset, position } = event.nativeEvent;
          const next = Math.round(position + offset);
          setHighlightIndex(Math.min(Math.max(next, 0), MAIN_TAB_ORDER.length - 1));
        }}
        onPageSelected={(event) => {
          programmaticJumpRef.current = false;
          setActiveIndex(event.nativeEvent.position);
        }}
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
          <CustomHeader title="Home" large />
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

      <View style={[styles.tabBar, { paddingBottom: insets.bottom + spacing.xs }]} accessibilityRole="tablist">
        {MAIN_TAB_ORDER.map((tabName, index) => {
          const focused = highlightIndex === index;
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
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={icon.icon}
                  size={22}
                  color={focused ? colors.primary : colors.muted}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              </View>
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
  iconWrap: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
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
