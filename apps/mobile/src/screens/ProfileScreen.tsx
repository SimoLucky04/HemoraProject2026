import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '@components/AppButton';
import { Card } from '@components/Card';
import { DatePickerField } from '@components/DatePickerField';
import { Field } from '@components/Field';
import { FeatureCard } from '@components/FeatureCard';
import { PillSelector } from '@components/PillSelector';
import { nestedScreenEdges, Screen } from '@components/Screen';
import { Muted, SectionTitle } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import { BloodGroup, HealthProfile, RhFactor, Sex } from '@app-types';
import type { ProfileStackParamList } from '@navigation/MainTabs';
import { colors, spacing } from '@theme';

const SEX_OPTIONS: Sex[] = ['M', 'F', 'Altro'];
const BLOOD_OPTIONS: Exclude<BloodGroup, ''>[] = ['0', 'A', 'B', 'AB'];
const RH_OPTIONS: Exclude<RhFactor, ''>[] = ['+', '-'];

type Navigation = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const { state, saveProfile } = useHemora();
  const [profile, setProfile] = useState<HealthProfile>(state.profile);

  useEffect(() => setProfile(state.profile), [state.profile]);

  function update<K extends keyof HealthProfile>(key: K, value: HealthProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      Alert.alert('Dati mancanti', 'Inserisci almeno nome e cognome.');
      return;
    }
    if (!profile.birthDate.trim()) {
      Alert.alert('Data mancante', 'Inserisci la data di nascita per calcolare l’età nel QR.');
      return;
    }
    if (!profile.bloodGroup || !profile.rh) {
      Alert.alert('Dati mancanti', 'Inserisci gruppo sanguigno e fattore Rh.');
      return;
    }
    saveProfile(profile);
    Alert.alert('Profilo salvato', 'I dati essenziali sono stati aggiornati localmente.');
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges} footer={<AppButton title="Salva dati essenziali" onPress={submit} />}>
      <Card>
        <SectionTitle>Dati essenziali</SectionTitle>
        <Field label="Nome" value={profile.firstName} onChangeText={(value) => update('firstName', value)} />
        <Field label="Cognome" value={profile.lastName} onChangeText={(value) => update('lastName', value)} />
        <DatePickerField
          label="Data di nascita"
          value={profile.birthDate}
          onChange={(value) => update('birthDate', value)}
          maximumDate={new Date()}
          minimumDate={new Date('1900-01-01T12:00:00')}
        />

        <PillSelector
          label="Sesso"
          options={SEX_OPTIONS}
          value={profile.sex}
          onChange={(value) => update('sex', value)}
        />

        <PillSelector
          label="Gruppo sanguigno"
          options={BLOOD_OPTIONS}
          value={profile.bloodGroup}
          onChange={(value) => update('bloodGroup', value)}
        />

        <PillSelector
          label="Fattore Rh"
          options={RH_OPTIONS}
          value={profile.rh}
          onChange={(value) => update('rh', value)}
        />
      </Card>

      <Card>
        <SectionTitle>Note salvavita</SectionTitle>
        <Field
          label="Note utili in caso di emergenza"
          value={profile.lifesavingNotes}
          onChangeText={(value) => update('lifesavingNotes', value)}
          multiline
          placeholder="Esempio: portatore di pacemaker, rischio shock anafilattico..."
        />
        <Muted>Queste note saranno incluse nel QR di emergenza.</Muted>
      </Card>

      <View style={styles.menuHeader}>
        <SectionTitle>Informazioni aggiuntive</SectionTitle>
      </View>

      <FeatureCard
        icon="medical-outline"
        title="Patologie"
        description="Categoria, gravità, allergie ed informazioni utili."
        badge={state.profile.conditions.length}
        tint={colors.primary}
        tintBg={colors.primarySoft}
        onPress={() => navigation.navigate('Patologie')}
      />
      <FeatureCard
        icon="medkit-outline"
        title="Farmaci"
        description="Nome, principio attivo, dosaggio e indicazioni di emergenza."
        badge={state.profile.medications.length}
        tint={colors.plasma}
        tintBg={colors.plasmaBg}
        onPress={() => navigation.navigate('Farmaci')}
      />
      <FeatureCard
        icon="call-outline"
        title="Contatti di emergenza"
        description="Persone da contattare in caso di necessità."
        badge={state.profile.emergencyContacts.length}
        tint={colors.platelet}
        tintBg={colors.plateletBg}
        onPress={() => navigation.navigate('ContattiEmergenza')}
      />
      <FeatureCard
        icon="document-text-outline"
        title="Dati opzionali"
        description="Codice fiscale, peso e altezza."
        tint={colors.info}
        tintBg={colors.infoBg}
        onPress={() => navigation.navigate('DatiOpzionali')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  menuHeader: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
});
