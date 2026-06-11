import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { AppButton } from '@components/AppButton';
import { Card } from '@components/Card';
import { Field } from '@components/Field';
import { Screen } from '@components/Screen';
import { Muted, Title } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import { colors, spacing } from '@theme';

export function AuthScreen() {
  const { login, register } = useHemora();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('demo@hemora.it');
  const [password, setPassword] = useState('Password123');
  const [confirmPassword, setConfirmPassword] = useState('Password123');
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      if (mode === 'register') {
        if (password !== confirmPassword) throw new Error('Le password non coincidono.');
        await register({ email, password, privacyAccepted });
      } else {
        await login({ email, password });
      }
    } catch (error) {
      Alert.alert('Attenzione', error instanceof Error ? error.message : 'Operazione non riuscita.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.logoBox}>
          <Text style={styles.logo}>♥</Text>
          <Title>Hemora</Title>
          <Muted>Il battito digitale della solidarietà</Muted>
        </View>

        <Card>
          <Text style={styles.formTitle}>{mode === 'login' ? 'Accedi' : 'Crea account'}</Text>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {mode === 'register' && (
            <>
              <Field label="Conferma password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Accetto privacy e trattamento dati sensibili</Text>
                <Switch value={privacyAccepted} onValueChange={setPrivacyAccepted} />
              </View>
            </>
          )}
          <AppButton title={mode === 'login' ? 'Entra' : 'Registrati'} onPress={submit} loading={loading} />
          <AppButton
            title={mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
            variant="ghost"
          />
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoBox: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  logo: {
    fontSize: 48,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  switchText: {
    flex: 1,
    color: colors.text,
    fontWeight: '600',
  },
});
