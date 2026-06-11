import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AppButton } from '@components/AppButton';
import { Card } from '@components/Card';
import { Field } from '@components/Field';
import { nestedScreenEdges, Screen } from '@components/Screen';
import { Muted, SectionTitle } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import { HealthProfile } from '@app-types';
import { decimalOnly, digitsOnly, fiscalCodeInput, isValidFiscalCode } from '@utils/validation';

export function OptionalDataScreen() {
  const { state, saveProfile } = useHemora();
  const [profile, setProfile] = useState<HealthProfile>(state.profile);

  useEffect(() => setProfile(state.profile), [state.profile]);

  function update<K extends keyof HealthProfile>(key: K, value: HealthProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    if (profile.fiscalCode.trim() && !isValidFiscalCode(profile.fiscalCode)) {
      Alert.alert('Codice fiscale non valido', 'Il codice fiscale deve avere 16 caratteri (lettere e numeri).');
      return;
    }
    saveProfile(profile);
    Alert.alert('Dati opzionali salvati', 'Le informazioni facoltative sono state aggiornate.');
  }

  const fiscalError =
    profile.fiscalCode.trim().length > 0 && !isValidFiscalCode(profile.fiscalCode)
      ? 'Deve avere 16 caratteri.'
      : undefined;

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>

      <Card>
        <SectionTitle>Informazioni aggiuntive</SectionTitle>
        <Field
          label="Codice fiscale"
          value={profile.fiscalCode}
          onChangeText={(value) => update('fiscalCode', fiscalCodeInput(value))}
          autoCapitalize="characters"
          maxLength={16}
          error={fiscalError}
        />
        <Field
          label="Peso kg"
          value={profile.weightKg ?? ''}
          onChangeText={(value) => update('weightKg', decimalOnly(value))}
          keyboardType="decimal-pad"
        />
        <Field
          label="Altezza cm"
          value={profile.heightCm ?? ''}
          onChangeText={(value) => update('heightCm', digitsOnly(value))}
          keyboardType="number-pad"
        />
        <Muted>Questi campi possono rimanere vuoti. Potrebbero fornire un quadro più dettagliato in caso di emergenza.</Muted>
      </Card>

      <AppButton title="Salva dati opzionali" onPress={submit} />
    </Screen>
  );
}
