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
import { Medication } from '../types';
import { colors, spacing } from '../theme';

// Unità di misura del dosaggio, selezionabili dal menu a tendina.
const DOSAGE_UNITS = ['mg', 'g', 'mcg', 'ml', 'UI', 'mg/ml', 'gocce', 'compresse'] as const;
const DEFAULT_UNIT = 'mg';

// Forma farmaceutica del farmaco.
const DOSAGE_FORMS = ['Compressa', 'Capsula', 'Sciroppo', 'Fiala', 'Inalatore', 'Crema', 'Gocce', 'Cerotto', 'Altro'] as const;

export function MedicationsScreen() {
  const { state, addMedication, removeMedication, saveDraft, loadDraft, clearDraft } = useHemora();
  const [medName, setMedName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [dosageAmount, setDosageAmount] = useState('');
  const [dosageUnit, setDosageUnit] = useState<string>(DEFAULT_UNIT);
  const [medNotes, setMedNotes] = useState('');

  useEffect(() => {
    async function loadSavedDraft() {
      const draft = await loadDraft('MedicationsScreen');
      if (draft) {
        setMedName(draft.medName || '');
        setActiveIngredient(draft.activeIngredient || '');
        setDosageForm(draft.dosageForm || '');
        setDosageAmount(draft.dosageAmount || '');
        setDosageUnit(draft.dosageUnit || DEFAULT_UNIT);
        setMedNotes(draft.medNotes || '');
      }
    }
    loadSavedDraft();
  }, [loadDraft]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        saveDraft('MedicationsScreen', {
          medName,
          activeIngredient,
          dosageForm,
          dosageAmount,
          dosageUnit,
          medNotes,
        });
      };
    }, [medName, activeIngredient, dosageForm, dosageAmount, dosageUnit, medNotes, saveDraft]),
  );

  // Accetta solo cifre con un singolo separatore decimale (virgola o punto).
  function handleDosageAmount(text: string) {
    let cleaned = text.replace(/[^\d.,]/g, '');
    const firstSeparator = cleaned.search(/[.,]/);
    if (firstSeparator !== -1) {
      cleaned =
        cleaned.slice(0, firstSeparator + 1) + cleaned.slice(firstSeparator + 1).replace(/[.,]/g, '');
    }
    setDosageAmount(cleaned);
  }

  function submitMedication() {
    if (!medName.trim()) {
      Alert.alert('Dato mancante', 'Inserisci il nome del farmaco.');
      return;
    }
    const amount = dosageAmount.trim();
    const dosage = amount ? `${amount} ${dosageUnit}` : '';
    addMedication({
      commercialName: medName.trim(),
      activeIngredient: activeIngredient.trim(),
      form: dosageForm,
      dosage,
      emergencyNotes: medNotes.trim(),
      relevantInEmergency: true,
    });
    clearDraft('MedicationsScreen');
    setMedName('');
    setActiveIngredient('');
    setDosageForm('');
    setDosageAmount('');
    setDosageUnit(DEFAULT_UNIT);
    setMedNotes('');
  }

  function confirmDelete(item: Medication) {
    Alert.alert('Eliminare il farmaco?', item.commercialName, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => removeMedication(item.id) },
    ]);
  }

  const medications = state.profile.medications;

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Farmaci salvavita</Title>
      <Subtitle>Salva solo i farmaci importanti in contesto di emergenza.</Subtitle>

      <Card>
        <SectionTitle>Aggiungi farmaco</SectionTitle>
        <Field label="Nome commerciale" value={medName} onChangeText={setMedName} />
        <Field label="Principio attivo" value={activeIngredient} onChangeText={setActiveIngredient} />
        <SelectField
          label="Forma farmaceutica"
          value={dosageForm}
          options={DOSAGE_FORMS}
          onChange={setDosageForm}
          placeholder="Scegli la forma"
        />
        <View style={styles.dosageRow}>
          <View style={styles.dosageAmount}>
            <Field
              label="Dosaggio"
              value={dosageAmount}
              onChangeText={handleDosageAmount}
              keyboardType="decimal-pad"
              placeholder="Es. 100"
              accessibilityLabel="Quantità del dosaggio, solo numeri"
            />
          </View>
          <View style={styles.dosageUnit}>
            <SelectField label="Unità" value={dosageUnit} options={DOSAGE_UNITS} onChange={setDosageUnit} />
          </View>
        </View>
        <Field label="Note per il soccorritore" value={medNotes} onChangeText={setMedNotes} multiline />
        <AppButton title="Aggiungi farmaco" onPress={submitMedication} />
      </Card>

      <View style={styles.listHeader}>
        <SectionTitle>I tuoi farmaci</SectionTitle>
        <Badge>{medications.length}</Badge>
      </View>

      {medications.length === 0 ? (
        <Card tone="subtle">
          <Muted>Nessun farmaco inserito.</Muted>
        </Card>
      ) : (
        medications.map((item) => {
          const meta = [item.activeIngredient, item.form, item.dosage].filter(Boolean).join(' · ');
          return (
            <EntryCard
              key={item.id}
              icon="medkit"
              tint={colors.plasma}
              tintBg={colors.plasmaBg}
              title={item.commercialName}
              onDelete={() => confirmDelete(item)}
              deleteLabel={`Elimina ${item.commercialName}`}
            >
              <Muted>{meta || 'Dettagli non inseriti'}</Muted>
              {!!item.emergencyNotes && <Text style={styles.notes}>{item.emergencyNotes}</Text>}
            </EntryCard>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dosageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dosageAmount: {
    flex: 1.4,
  },
  dosageUnit: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
  notes: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
