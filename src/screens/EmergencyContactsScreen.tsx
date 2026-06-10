import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, StyleSheet, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { EntryCard } from '../components/EntryCard';
import { Field } from '../components/Field';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Badge, Muted, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { EmergencyContact } from '../types';
import { colors, spacing } from '../theme';
import { digitsOnly, isValidEmail, isValidPhone } from '../utils/validation';

export function EmergencyContactsScreen() {
  const { state, addEmergencyContact, removeEmergencyContact, saveDraft, loadDraft, clearDraft } = useHemora();
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    async function loadSavedDraft() {
      const draft = await loadDraft('EmergencyContactsScreen');
      if (draft) {
        setContactName(draft.contactName || '');
        setContactRelation(draft.contactRelation || '');
        setContactPhone(draft.contactPhone || '');
        setContactEmail(draft.contactEmail || '');
      }
    }
    loadSavedDraft();
  }, [loadDraft]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        saveDraft('EmergencyContactsScreen', {
          contactName,
          contactRelation,
          contactPhone,
          contactEmail,
        });
      };
    }, [contactName, contactRelation, contactPhone, contactEmail, saveDraft]),
  );

  function submitContact() {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Dati mancanti', 'Inserisci nome e telefono del contatto.');
      return;
    }
    if (!isValidPhone(contactPhone)) {
      Alert.alert('Telefono non valido', 'Il numero di telefono deve avere 10 cifre.');
      return;
    }
    if (contactEmail.trim() && !isValidEmail(contactEmail)) {
      Alert.alert('Email non valida', "Inserisci un'email valida (es. nome@dominio.it) oppure lascia il campo vuoto.");
      return;
    }
    addEmergencyContact({
      name: contactName.trim(),
      relation: contactRelation.trim(),
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
    });
    clearDraft('EmergencyContactsScreen');
    setContactName('');
    setContactRelation('');
    setContactPhone('');
    setContactEmail('');
  }

  function confirmDelete(item: EmergencyContact) {
    Alert.alert('Eliminare il contatto?', item.name, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => removeEmergencyContact(item.id) },
    ]);
  }

  const phoneError =
    contactPhone.length > 0 && !isValidPhone(contactPhone) ? 'Il numero deve avere 10 cifre.' : undefined;
  const emailError =
    contactEmail.trim().length > 0 && !isValidEmail(contactEmail) ? "Formato email non valido." : undefined;

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Contatti emergenza</Title>
      <Subtitle>Persone che un soccorritore può contattare rapidamente.</Subtitle>

      <Card>
        <SectionTitle>Aggiungi contatto</SectionTitle>
        <Field label="Nome contatto" value={contactName} onChangeText={setContactName} />
        <Field label="Relazione" value={contactRelation} onChangeText={setContactRelation} placeholder="Esempio: Padre, sorella..." />
        <Field
          label="Telefono"
          value={contactPhone}
          onChangeText={(value) => setContactPhone(digitsOnly(value, 10))}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="10 cifre"
          error={phoneError}
        />
        <Field
          label="Email opzionale"
          value={contactEmail}
          onChangeText={setContactEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="nome@dominio.it"
          error={emailError}
        />
        <AppButton title="Aggiungi contatto" onPress={submitContact} />
      </Card>

      <View style={styles.listHeader}>
        <SectionTitle>Elenco salvato</SectionTitle>
        <Badge>{state.profile.emergencyContacts.length}</Badge>
      </View>

      {state.profile.emergencyContacts.length === 0 ? (
        <Card tone="subtle">
          <Muted>Nessun contatto inserito.</Muted>
        </Card>
      ) : (
        state.profile.emergencyContacts.map((item) => (
          <EntryCard
            key={item.id}
            icon="call"
            tint={colors.platelet}
            tintBg={colors.plateletBg}
            title={item.name}
            onDelete={() => confirmDelete(item)}
            deleteLabel={`Elimina ${item.name}`}
          >
            <Muted>{item.relation || 'Relazione non inserita'} · {item.phone}</Muted>
            {!!item.email && <Muted>{item.email}</Muted>}
          </EntryCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
});
