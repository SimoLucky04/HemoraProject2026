import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { colors, spacing } from '../theme';

export function MedicationsScreen() {
  const { state, addMedication, removeMedication, saveDraft, loadDraft, clearDraft } = useHemora();
  const [medName, setMedName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [dosage, setDosage] = useState('');
  const [medNotes, setMedNotes] = useState('');

  useEffect(() => {
    async function loadSavedDraft() {
      const draft = await loadDraft('MedicationsScreen');
      if (draft) {
        setMedName(draft.medName || '');
        setActiveIngredient(draft.activeIngredient || '');
        setDosage(draft.dosage || '');
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
          dosage,
          medNotes,
        });
      };
    }, [medName, activeIngredient, dosage, medNotes, saveDraft]),
  );

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
    clearDraft('MedicationsScreen');
    setMedName('');
    setActiveIngredient('');
    setDosage('');
    setMedNotes('');
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Farmaci salvavita</Title>
      <Subtitle>Salva solo i farmaci importanti in contesto di emergenza.</Subtitle>

      <Card>
        <SectionTitle>Aggiungi farmaco</SectionTitle>
        <Field label="Nome commerciale" value={medName} onChangeText={setMedName} />
        <Field label="Principio attivo" value={activeIngredient} onChangeText={setActiveIngredient} />
        <Field label="Dosaggio" value={dosage} onChangeText={setDosage} placeholder="Esempio: 100 mg" />
        <Field label="Note per il soccorritore" value={medNotes} onChangeText={setMedNotes} multiline />
        <AppButton title="Aggiungi farmaco" onPress={submitMedication} />
      </Card>

      <Card>
        <Row>
          <SectionTitle>Elenco salvato</SectionTitle>
          <Badge>{state.profile.medications.length}</Badge>
        </Row>
        {state.profile.medications.length === 0 ? (
          <Muted>Nessun farmaco inserito.</Muted>
        ) : (
          state.profile.medications.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{item.commercialName}</Text>
              <Muted>{item.activeIngredient || 'Principio attivo non inserito'} · {item.dosage || 'Dosaggio non inserito'}</Muted>
              {!!item.emergencyNotes && <Text style={styles.itemText}>{item.emergencyNotes}</Text>}
              <AppButton title="Elimina" onPress={() => removeMedication(item.id)} variant="ghost" />
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
  itemText: {
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
