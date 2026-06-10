import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { SelectField } from '../components/SelectField';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { ConditionSeverity } from '../types';
import { colors, spacing } from '../theme';

const SEVERITIES: ConditionSeverity[] = ['Bassa', 'Media', 'Alta'];

// Macro-categorie selezionabili dal menu a tendina. "Allergia" marca la voce
// come allergia (sostituisce il vecchio switch dedicato).
const ALLERGY_CATEGORY = 'Allergia';
const CONDITION_CATEGORIES = [
  'Cardiovascolare',
  'Respiratoria',
  'Metabolica/Endocrina',
  'Neurologica',
  ALLERGY_CATEGORY,
  'Autoimmune',
  'Gastrointestinale',
  'Renale',
  'Oncologica',
  'Dermatologica',
  'Altro',
] as const;

export function ConditionsScreen() {
  const { state, addCondition, removeCondition, saveDraft, loadDraft, clearDraft } = useHemora();
  const [conditionName, setConditionName] = useState('');
  const [conditionCategory, setConditionCategory] = useState('Altro');
  const [conditionSeverity, setConditionSeverity] = useState<ConditionSeverity>('Media');
  const [conditionNotes, setConditionNotes] = useState('');

  useEffect(() => {
    async function loadSavedDraft() {
      const draft = await loadDraft('ConditionsScreen');
      if (draft) {
        setConditionName(draft.conditionName || '');
        setConditionCategory(draft.conditionCategory || 'Altro');
        setConditionSeverity(draft.conditionSeverity || 'Media');
        setConditionNotes(draft.conditionNotes || '');
      }
    }
    loadSavedDraft();
  }, [loadDraft]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        saveDraft('ConditionsScreen', {
          conditionName,
          conditionCategory,
          conditionSeverity,
          conditionNotes,
        });
      };
    }, [conditionName, conditionCategory, conditionSeverity, conditionNotes, saveDraft]),
  );

  function submitCondition() {
    if (!conditionName.trim()) {
      Alert.alert('Dato mancante', 'Inserisci il nome della patologia/allergia.');
      return;
    }
    addCondition({
      name: conditionName.trim(),
      category: conditionCategory || 'Altro',
      severity: conditionSeverity,
      // L'allergia non ha piu uno switch: deriva dalla categoria scelta nel menu.
      isAllergy: conditionCategory === ALLERGY_CATEGORY,
      notes: conditionNotes.trim(),
      relevantInEmergency: true,
    });
    clearDraft('ConditionsScreen');
    setConditionName('');
    setConditionCategory('Altro');
    setConditionSeverity('Media');
    setConditionNotes('');
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Patologie e allergie</Title>
      <Subtitle>Queste informazioni saranno disponibili nel QR di emergenza.</Subtitle>

      <Card>
        <SectionTitle>Aggiungi voce</SectionTitle>
        <Field label="Nome" value={conditionName} onChangeText={setConditionName} placeholder="Esempio: Diabete, Penicillina..." />
        <SelectField
          label="Categoria"
          value={conditionCategory}
          options={CONDITION_CATEGORIES}
          onChange={setConditionCategory}
          placeholder="Scegli una categoria"
        />
        {conditionCategory === ALLERGY_CATEGORY && (
          <Muted>Questa voce sarà contrassegnata come allergia nel QR di emergenza.</Muted>
        )}
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
