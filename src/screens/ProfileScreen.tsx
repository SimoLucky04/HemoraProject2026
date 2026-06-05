import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { DatePickerField } from '../components/DatePickerField';
import { Field } from '../components/Field';
import { Screen } from '../components/Screen';
import { SectionLink } from '../components/SectionLink';
import { Muted, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { BloodGroup, HealthProfile, RhFactor, Sex } from '../types';
import type { ProfileStackParamList } from '../navigation/MainTabs';
import { colors, spacing } from '../theme';

const SEX_OPTIONS: Sex[] = ['M', 'F', 'Altro'];
const BLOOD_OPTIONS: BloodGroup[] = ['0', 'A', 'B', 'AB'];
const RH_OPTIONS: RhFactor[] = ['+', '-'];

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
    <Screen>
      <Title>Profilo sanitario</Title>
      <Subtitle>Inserisci i tuoi dati sanitari e nel caso anche informazioni salvavita.</Subtitle>

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

        <Text style={styles.label}>Sesso</Text>
        <View style={styles.optionRow}>
          {SEX_OPTIONS.map((option) => (
            <AppButton
              key={option}
              title={option}
              onPress={() => update('sex', option)}
              variant={profile.sex === option ? 'primary' : 'ghost'}
            />
          ))}
        </View>

        <Text style={styles.label}>Gruppo sanguigno</Text>
        <View style={styles.optionRow}>
          {BLOOD_OPTIONS.map((option) => (
            <AppButton
              key={option}
              title={option}
              onPress={() => update('bloodGroup', option)}
              variant={profile.bloodGroup === option ? 'primary' : 'ghost'}
            />
          ))}
        </View>

        <Text style={styles.label}>Fattore Rh</Text>
        <View style={styles.optionRow}>
          {RH_OPTIONS.map((option) => (
            <AppButton
              key={option}
              title={option}
              onPress={() => update('rh', option)}
              variant={profile.rh === option ? 'primary' : 'ghost'}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle>Note salvavita</SectionTitle>
        <Field
          label="Note per il soccorritore"
          value={profile.lifesavingNotes}
          onChangeText={(value) => update('lifesavingNotes', value)}
          multiline
          placeholder="Esempio: portatore di pacemaker, rischio shock anafilattico..."
        />
        <Muted>Queste note saranno incluse nel QR di emergenza.</Muted>
      </Card>

      <AppButton title="Salva dati essenziali" onPress={submit} />

      <Card>
        <SectionTitle>Sottosezioni profilo</SectionTitle>
        <Muted>Apri la parte da modificare senza affollare la barra inferiore.</Muted>
        <SectionLink
          icon="medical-outline"
          title="Patologie e allergie"
          description="Categoria, gravità, allergie e note utili al soccorritore."
          badge={state.profile.conditions.length}
          onPress={() => navigation.navigate('Patologie')}
        />
        <SectionLink
          icon="medkit-outline"
          title="Farmaci salvavita"
          description="Nome, principio attivo, dosaggio e indicazioni di emergenza."
          badge={state.profile.medications.length}
          onPress={() => navigation.navigate('Farmaci')}
        />
        <SectionLink
          icon="call-outline"
          title="Contatti emergenza"
          description="Persone da contattare in caso di necessità."
          badge={state.profile.emergencyContacts.length}
          onPress={() => navigation.navigate('ContattiEmergenza')}
        />
        <SectionLink
          icon="document-text-outline"
          title="Dati opzionali"
          description="Codice fiscale, peso e altezza."
          onPress={() => navigation.navigate('DatiOpzionali')}
        />
        <SectionLink
          icon="settings-outline"
          title="Impostazioni"
          description="Gestione locale dei dati salvati sul dispositivo."
          onPress={() => navigation.navigate('ImpostazioniProfilo')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
});
