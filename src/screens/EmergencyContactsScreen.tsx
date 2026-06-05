import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { colors, spacing } from '../theme';

export function EmergencyContactsScreen() {
  const { state, addEmergencyContact, removeEmergencyContact } = useHemora();
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  function submitContact() {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Dati mancanti', 'Inserisci nome e telefono del contatto.');
      return;
    }
    addEmergencyContact({
      name: contactName.trim(),
      relation: contactRelation.trim(),
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
    });
    setContactName('');
    setContactRelation('');
    setContactPhone('');
    setContactEmail('');
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Contatti emergenza</Title>
      <Subtitle>Persone che un soccorritore può contattare rapidamente.</Subtitle>

      <Card>
        <SectionTitle>Aggiungi contatto</SectionTitle>
        <Field label="Nome contatto" value={contactName} onChangeText={setContactName} />
        <Field label="Relazione" value={contactRelation} onChangeText={setContactRelation} placeholder="Esempio: Padre, sorella..." />
        <Field label="Telefono" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
        <Field label="Email opzionale" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" />
        <AppButton title="Aggiungi contatto" onPress={submitContact} />
      </Card>

      <Card>
        <Row>
          <SectionTitle>Elenco salvato</SectionTitle>
          <Badge>{state.profile.emergencyContacts.length}</Badge>
        </Row>
        {state.profile.emergencyContacts.length === 0 ? (
          <Muted>Nessun contatto inserito.</Muted>
        ) : (
          state.profile.emergencyContacts.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Muted>{item.relation || 'Relazione non inserita'} · {item.phone}</Muted>
              {!!item.email && <Muted>{item.email}</Muted>}
              <AppButton title="Elimina" onPress={() => removeEmergencyContact(item.id)} variant="ghost" />
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  itemTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
});
