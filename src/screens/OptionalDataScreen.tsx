import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Muted, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { HealthProfile } from '../types';

export function OptionalDataScreen() {
  const { state, saveProfile } = useHemora();
  const [profile, setProfile] = useState<HealthProfile>(state.profile);

  useEffect(() => setProfile(state.profile), [state.profile]);

  function update<K extends keyof HealthProfile>(key: K, value: HealthProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    saveProfile(profile);
    Alert.alert('Dati opzionali salvati', 'Le informazioni facoltative sono state aggiornate.');
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Dati opzionali</Title>
      <Subtitle>Informazioni utili ma non obbligatorie per il QR e per il flusso principale.</Subtitle>

      <Card>
        <SectionTitle>Informazioni aggiuntive</SectionTitle>
        <Field
          label="Codice fiscale"
          value={profile.fiscalCode}
          onChangeText={(value) => update('fiscalCode', value.toUpperCase())}
          autoCapitalize="characters"
        />
        <Field
          label="Peso kg"
          value={profile.weightKg ?? ''}
          onChangeText={(value) => update('weightKg', value)}
          keyboardType="numeric"
        />
        <Field
          label="Altezza cm"
          value={profile.heightCm ?? ''}
          onChangeText={(value) => update('heightCm', value)}
          keyboardType="numeric"
        />
        <Muted>Questi campi possono rimanere vuoti: li hai separati dal profilo essenziale per mantenere la schermata più leggera.</Muted>
      </Card>

      <AppButton title="Salva dati opzionali" onPress={submit} />
    </Screen>
  );
}
