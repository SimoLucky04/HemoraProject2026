import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { ConditionSeverity } from '../types';
import { colors, spacing } from '../theme';

const SEVERITIES: ConditionSeverity[] = ['Bassa', 'Media', 'Alta'];

export function LifeSavingDataScreen() {
  const {
    state,
    addCondition,
    removeCondition,
    addMedication,
    removeMedication,
    addEmergencyContact,
    removeEmergencyContact,
  } = useHemora();
  const { profile } = state;

  const [conditionName, setConditionName] = useState('');
  const [conditionCategory, setConditionCategory] = useState('Altro');
  const [conditionSeverity, setConditionSeverity] = useState<ConditionSeverity>('Media');
  const [conditionIsAllergy, setConditionIsAllergy] = useState(false);
  const [conditionNotes, setConditionNotes] = useState('');

  const [medName, setMedName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [dosage, setDosage] = useState('');
  const [medNotes, setMedNotes] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  function submitCondition() {
    if (!conditionName.trim()) {
      Alert.alert('Dato mancante', 'Inserisci il nome della patologia/allergia.');
      return;
    }
    addCondition({
      name: conditionName.trim(),
      category: conditionCategory.trim() || 'Altro',
      severity: conditionSeverity,
      isAllergy: conditionIsAllergy,
      notes: conditionNotes.trim(),
      relevantInEmergency: true,
    });
    setConditionName('');
    setConditionCategory('Altro');
    setConditionSeverity('Media');
    setConditionIsAllergy(false);
    setConditionNotes('');
  }

  function submitMedication() {
    if (!medName.trim()) {
      Alert.alert('Dato mancante', 'Inserisci il nome del farmaco.');
      return;
    }
    addMedication({
      commercialName: medName.trim(),
      activeIngredient: activeIngredient.trim(),
      dosage: dosage.trim(),
      emergencyNotes: medNotes.trim(),
      relevantInEmergency: true,
    });
    setMedName('');
    setActiveIngredient('');
    setDosage('');
    setMedNotes('');
  }

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
    <Screen>
      <Title>Dati salvavita</Title>
      <Subtitle>Patologie, allergie, farmaci e contatti disponibili nel QR di emergenza.</Subtitle>

      <Card>
        <SectionTitle>Patologie e allergie</SectionTitle>
        <Field label="Nome" value={conditionName} onChangeText={setConditionName} placeholder="Esempio: Diabete, Penicillina..." />
        <Field label="Categoria" value={conditionCategory} onChangeText={setConditionCategory} placeholder="Altro" />
        <Text style={styles.label}>Gravità</Text>
        <View style={styles.optionRow}>
          {SEVERITIES.map((severity) => (
            <AppButton
              key={severity}
              title={severity}
              onPress={() => setConditionSeverity(severity)}
              variant={conditionSeverity === severity ? 'primary' : 'ghost'}
            />
          ))}
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>È un'allergia?</Text>
          <Switch value={conditionIsAllergy} onValueChange={setConditionIsAllergy} />
        </View>
        <Field label="Note" value={conditionNotes} onChangeText={setConditionNotes} multiline />
        <AppButton title="Aggiungi patologia/allergia" onPress={submitCondition} />

        {profile.conditions.length === 0 ? (
          <Muted>Nessuna patologia inserita.</Muted>
        ) : (
          profile.conditions.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <Row>
                <Text style={styles.itemTitle}>{item.name}</Text>
                {item.isAllergy && <Badge>Allergia</Badge>}
              </Row>
              <Muted>{item.category} · Gravità {item.severity}</Muted>
              {!!item.notes && <Text style={styles.itemText}>{item.notes}</Text>}
              <AppButton title="Elimina" onPress={() => removeCondition(item.id)} variant="ghost" />
            </View>
          ))
        )}
      </Card>

      <Card>
        <SectionTitle>Farmaci salvavita</SectionTitle>
        <Field label="Nome commerciale" value={medName} onChangeText={setMedName} />
        <Field label="Principio attivo" value={activeIngredient} onChangeText={setActiveIngredient} />
        <Field label="Dosaggio" value={dosage} onChangeText={setDosage} placeholder="Esempio: 100 mg" />
        <Field label="Note per il soccorritore" value={medNotes} onChangeText={setMedNotes} multiline />
        <AppButton title="Aggiungi farmaco" onPress={submitMedication} />

        {profile.medications.length === 0 ? (
          <Muted>Nessun farmaco inserito.</Muted>
        ) : (
          profile.medications.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{item.commercialName}</Text>
              <Muted>{item.activeIngredient || 'Principio attivo non inserito'} · {item.dosage || 'Dosaggio non inserito'}</Muted>
              {!!item.emergencyNotes && <Text style={styles.itemText}>{item.emergencyNotes}</Text>}
              <AppButton title="Elimina" onPress={() => removeMedication(item.id)} variant="ghost" />
            </View>
          ))
        )}
      </Card>

      <Card>
        <SectionTitle>Contatti di emergenza</SectionTitle>
        <Field label="Nome contatto" value={contactName} onChangeText={setContactName} />
        <Field label="Relazione" value={contactRelation} onChangeText={setContactRelation} placeholder="Esempio: Padre, sorella..." />
        <Field label="Telefono" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
        <Field label="Email opzionale" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" />
        <AppButton title="Aggiungi contatto" onPress={submitContact} />

        {profile.emergencyContacts.length === 0 ? (
          <Muted>Nessun contatto inserito.</Muted>
        ) : (
          profile.emergencyContacts.map((item) => (
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
  label: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  switchText: {
    color: colors.text,
    fontWeight: '700',
  },
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
  itemText: {
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
