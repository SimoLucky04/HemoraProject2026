import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { ConditionSeverity } from '../types';
import { colors, spacing } from '../theme';

const SEVERITIES: ConditionSeverity[] = ['Bassa', 'Media', 'Alta'];

export function ConditionsScreen() {
  const { state, addCondition, removeCondition } = useHemora();
  const [conditionName, setConditionName] = useState('');
  const [conditionCategory, setConditionCategory] = useState('Altro');
  const [conditionSeverity, setConditionSeverity] = useState<ConditionSeverity>('Media');
  const [conditionIsAllergy, setConditionIsAllergy] = useState(false);
  const [conditionNotes, setConditionNotes] = useState('');

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

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Patologie e allergie</Title>
      <Subtitle>Queste informazioni saranno disponibili nel QR di emergenza.</Subtitle>

      <Card>
        <SectionTitle>Aggiungi voce</SectionTitle>
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
      </Card>

      <Card>
        <Row>
          <SectionTitle>Elenco salvato</SectionTitle>
          <Badge>{state.profile.conditions.length}</Badge>
        </Row>
        {state.profile.conditions.length === 0 ? (
          <Muted>Nessuna patologia inserita.</Muted>
        ) : (
          state.profile.conditions.map((item) => (
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
    fontWeight: '800',
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
