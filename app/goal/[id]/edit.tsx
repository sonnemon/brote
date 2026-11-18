import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { InputRow, Row, Section } from '@/components/ListGroup';
import { NebulaBackground } from '@/components/NebulaBackground';
import { ReminderRow } from '@/components/ReminderRow';
import { T } from '@/components/T';
import { Toggle } from '@/components/Toggle';
import { archiveGoal, deleteGoal, updateGoal, useGoal, type GoalView } from '@/db/store';
import { editToUpdate, FREQUENCY_LABELS, nextFrequency, validateEdit, type GoalEditDraft } from '@/lib/goalEdit';
import { reminderFromColumns } from '@/lib/reminders';
import { colors, goalColors } from '@/theme/tokens';

const DEFAULT_DEADLINE_MS = 12 * 7 * 86_400_000;

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useGoal(id);
  return goal ? <EditForm goal={goal} /> : null;
}

function toDraft(goal: GoalView): GoalEditDraft {
  return {
    name: goal.name,
    direction: goal.direction,
    unit: goal.unit,
    color: goal.color,
    startText: String(goal.start_value),
    targetText: String(goal.target_value),
    currentText: String(goal.current),
    hasDeadline: goal.deadline !== null,
    deadline: goal.deadline ? new Date(goal.deadline) : new Date(Date.now() + DEFAULT_DEADLINE_MS),
    frequency: goal.frequency,
    reminder: reminderFromColumns(goal),
  };
}

function EditForm({ goal }: { goal: GoalView }) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(() => toDraft(goal));
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<GoalEditDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const save = () => {
    const problem = validateEdit(draft);
    if (problem) {
      setError(problem);
      return;
    }
    updateGoal(goal.id, editToUpdate(draft, goal.current));
    router.back();
  };

  const archive = () => {
    Alert.alert('Archivar meta', 'Dejará de aparecer en Inicio. Podrás restaurarla desde Ajustes.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Archivar',
        onPress: () => {
          archiveGoal(goal.id, true);
          router.dismissTo('/');
        },
      },
    ]);
  };

  const remove = () => {
    Alert.alert('Eliminar meta', `Se borrarán "${goal.name}" y todo su historial. No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteGoal(goal.id);
          router.dismissTo('/');
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={3} dim />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={[styles.nav, { marginTop: insets.top + 8 }]}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()} style={styles.navSide}>
            <T size={15} color={colors.textSecondary}>
              Cancelar
            </T>
          </Pressable>
          <T size={17} weight={600}>
            Editar meta
          </T>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={save} style={styles.navSide}>
            <T size={15} weight={600} color={colors.lilac} style={styles.navRight}>
              Guardar
            </T>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <T size={13} color={colors.danger} accessibilityLiveRegion="polite">
              {error}
            </T>
          )}

          <View style={styles.block}>
            <Section title="META">
              <InputRow label="Nombre" value={draft.name} onChangeText={(name) => update({ name })} maxLength={40} />
              <Row
                label="Tipo"
                value={draft.direction === 'down' ? '▼ Decreciente' : '▲ Creciente'}
                valueColor={colors.lilac}
                onPress={() => update({ direction: draft.direction === 'down' ? 'up' : 'down' })}
              />
              <InputRow label="Unidad" value={draft.unit} onChangeText={(unit) => update({ unit })} maxLength={12} />
              <InputRow
                label="Valor inicial"
                value={draft.startText}
                onChangeText={(startText) => update({ startText })}
                keyboardType="decimal-pad"
              />
              <InputRow
                label="Objetivo"
                value={draft.targetText}
                onChangeText={(targetText) => update({ targetText })}
                keyboardType="decimal-pad"
              />
              <InputRow
                label="Valor actual"
                value={draft.currentText}
                onChangeText={(currentText) => update({ currentText })}
                keyboardType="decimal-pad"
                last
              />
            </Section>
            <View style={styles.notice}>
              <Icon name="info" size={14} color={colors.textTertiary} />
              <T size={12} color={colors.textTertiary} style={styles.noticeText}>
                Si cambias el inicial o el objetivo, tu % se recalcula. El historial no se pierde.
              </T>
            </View>
          </View>

          <Section title="SEGUIMIENTO">
            <Row
              label="Fecha límite"
              right={
                <Toggle
                  label="Fecha límite"
                  value={draft.hasDeadline}
                  onChange={(hasDeadline) => update({ hasDeadline })}
                />
              }
            />
            {draft.hasDeadline && (
              <Row
                label="Hasta"
                right={
                  <DateTimePicker
                    value={draft.deadline}
                    mode="date"
                    display="compact"
                    themeVariant="dark"
                    accentColor={colors.lilac}
                    locale="es-PE"
                    onValueChange={(_, deadline) => update({ deadline })}
                  />
                }
              />
            )}
            <Row
              label="Frecuencia"
              value={FREQUENCY_LABELS[draft.frequency]}
              onPress={() => update({ frequency: nextFrequency(draft.frequency) })}
            />
            <ReminderRow value={draft.reminder} frequency={draft.frequency} onChange={(reminder) => update({ reminder })} />
            <Row
              label="Color"
              last
              right={
                <View style={styles.colors}>
                  {goalColors.map(({ value, label }) => {
                    const selected = draft.color === value;
                    return (
                      <Pressable
                        key={value}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        accessibilityState={{ selected }}
                        hitSlop={6}
                        onPress={() => update({ color: value })}
                        style={[styles.color, { backgroundColor: value }, selected && styles.colorSelected]}
                      />
                    );
                  })}
                </View>
              }
            />
          </Section>

          <Section>
            <Row label="Archivar meta" icon="archive" labelColor={colors.lilac} onPress={archive} />
            <Row label="Eliminar meta" icon="trash" iconColor={colors.pink} labelColor={colors.pink} onPress={remove} last />
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  nav: { height: 44, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navSide: { width: 76 },
  navRight: { textAlign: 'right' },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  block: { gap: 8 },
  notice: { flexDirection: 'row', gap: 6, paddingHorizontal: 4 },
  noticeText: { flex: 1, lineHeight: 17 },
  colors: { flexDirection: 'row', gap: 10 },
  color: { width: 22, height: 22, borderRadius: 11 },
  colorSelected: { borderWidth: 2, borderColor: colors.textStrong },
});
