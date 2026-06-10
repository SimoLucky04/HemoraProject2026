import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { EntryCard } from '../components/EntryCard';
import { Field } from '../components/Field';
import { SelectField } from '../components/SelectField';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Badge, Muted, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { Condition, ConditionSeverity } from '../types';
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

  function confirmDelete(item: Condition) {
    Alert.alert('Eliminare la voce?', item.name, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => removeCondition(item.id) },
    ]);
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

      <View style={styles.listHeader}>
        <SectionTitle>Elenco salvato</SectionTitle>
        <Badge>{state.profile.conditions.length}</Badge>
      </View>

      {state.profile.conditions.length === 0 ? (
        <Card tone="subtle">
          <Muted>Nessuna patologia inserita.</Muted>
        </Card>
      ) : (
        state.profile.conditions.map((item) => (
          <EntryCard
            key={item.id}
            icon={item.isAllergy ? 'alert-circle' : 'medical'}
            tint={colors.primary}
            tintBg={colors.primarySoft}
            title={item.name}
            onDelete={() => confirmDelete(item)}
            deleteLabel={`Elimina ${item.name}`}
          >
            {item.isAllergy && (
              <View style={styles.badgeWrap}>
                <Badge tone="danger">Allergia</Badge>
              </View>
            )}
            <Muted>{item.category} · Gravità {item.severity}</Muted>
            {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}
          </EntryCard>
        ))
      )}
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
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
  badgeWrap: {
    marginBottom: 4,
  },
  notes: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
