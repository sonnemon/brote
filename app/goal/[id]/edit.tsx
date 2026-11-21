import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorField } from '@/components/ColorPicker';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconPicker';
import { InputRow, Row, Section } from '@/components/ListGroup';
import { NebulaBackground } from '@/components/NebulaBackground';
import { ReminderRow } from '@/components/ReminderRow';
import { T } from '@/components/T';
import { Toggle } from '@/components/Toggle';
import { Field } from '@/components/ui';
import { archiveGoal, deleteGoal, updateGoal, useGoal, type GoalView } from '@/db/store';
import { editToUpdate, nextFrequency, validateEdit, type GoalEditDraft } from '@/lib/goalEdit';
import { resolveIconKey, suggestIcons, withCurrent } from '@/lib/goalIcons';
import { reminderFromColumns } from '@/lib/reminders';
import { useStrings } from '@/i18n';
import { colors } from '@/theme/tokens';

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
    icon: resolveIconKey(goal.icon),
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
  const s = useStrings();
  const [draft, setDraft] = useState(() => toDraft(goal));
  const [error, setError] = useState<string | null>(null);
  // El icono sigue al nombre solo si coincide con la sugerencia actual (no lo eligió el usuario).
  const [iconAuto, setIconAuto] = useState(() => suggestIcons(goal.name)[0] === resolveIconKey(goal.icon));
  const suggestions = useMemo(() => withCurrent(suggestIcons(draft.name), draft.icon), [draft.name, draft.icon]);
  const update = (patch: Partial<GoalEditDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (iconAuto && 'name' in patch) next.icon = suggestIcons(next.name)[0];
      return next;
    });
    setError(null);
  };
  const pickIcon = (icon: string) => {
    setIconAuto(false);
    update({ icon });
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
    Alert.alert(s.edit.archive, s.edit.archiveText, [
      { text: s.common.cancel, style: 'cancel' },
      {
        text: s.edit.archiveConfirm,
        onPress: () => {
          archiveGoal(goal.id, true);
          router.dismissTo('/');
        },
      },
    ]);
  };

  const remove = () => {
    Alert.alert(s.edit.delete, s.edit.deleteText(goal.name), [
      { text: s.common.cancel, style: 'cancel' },
      {
        text: s.edit.deleteConfirm,
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
              {s.common.cancel}
            </T>
          </Pressable>
          <T size={17} weight={600}>
            {s.edit.title}
          </T>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={save} style={styles.navSide}>
            <T size={15} weight={600} color={colors.lilac} style={styles.navRight}>
              {s.common.save}
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
            <T size={12} tracking={0.12} color={colors.textTertiary} style={styles.blockTitle}>
              {s.edit.name}
            </T>
            <View style={styles.nameRow}>
              <View style={styles.flex}>
                <Field
                  accessibilityLabel={s.newGoal.name}
                  value={draft.name}
                  onChangeText={(name) => update({ name })}
                  maxLength={40}
                  returnKeyType="done"
                />
              </View>
              <IconButton value={draft.icon} color={draft.color} suggestions={suggestions} onChange={pickIcon} />
            </View>
          </View>

          <View style={styles.block}>
            <Section title={s.edit.goal}>
              <Row
                label={s.edit.type}
                value={draft.direction === 'down' ? s.common.decreasingArrow : s.common.increasingArrow}
                valueColor={colors.lilac}
                onPress={() => update({ direction: draft.direction === 'down' ? 'up' : 'down' })}
              />
              <InputRow label={s.edit.unit} value={draft.unit} onChangeText={(unit) => update({ unit })} maxLength={12} />
              <InputRow
                label={s.edit.startValue}
                value={draft.startText}
                onChangeText={(startText) => update({ startText })}
                keyboardType="decimal-pad"
              />
              <InputRow
                label={s.edit.target}
                value={draft.targetText}
                onChangeText={(targetText) => update({ targetText })}
                keyboardType="decimal-pad"
              />
              <InputRow
                label={s.edit.currentValue}
                value={draft.currentText}
                onChangeText={(currentText) => update({ currentText })}
                keyboardType="decimal-pad"
                last
              />
            </Section>
            <View style={styles.notice}>
              <Icon name="info" size={14} color={colors.textTertiary} />
              <T size={12} color={colors.textTertiary} style={styles.noticeText}>
                {s.edit.notice}
              </T>
            </View>
          </View>

          <Section title={s.edit.tracking}>
            <Row
              label={s.edit.deadline}
              right={
                <Toggle
                  label={s.edit.deadline}
                  value={draft.hasDeadline}
                  onChange={(hasDeadline) => update({ hasDeadline })}
                />
              }
            />
            {draft.hasDeadline && (
              <Row
                label={s.edit.until}
                right={
                  <DateTimePicker
                    value={draft.deadline}
                    mode="date"
                    display="compact"
                    themeVariant="dark"
                    accentColor={colors.lilac}
                    locale={s.locale}
                    onValueChange={(_, deadline) => update({ deadline })}
                  />
                }
              />
            )}
            <Row
              label={s.edit.frequency}
              value={s.frequency[draft.frequency]}
              onPress={() => update({ frequency: nextFrequency(draft.frequency) })}
            />
            <ReminderRow value={draft.reminder} frequency={draft.frequency} onChange={(reminder) => update({ reminder })} />
            <Row
              label={s.edit.color}
              last
              right={
                <ColorField value={draft.color} icon={draft.icon} onChange={(color) => update({ color })} swatch={22} gap={10} />
              }
            />
          </Section>

          <Section>
            <Row label={s.edit.archive} icon="archive" labelColor={colors.lilac} onPress={archive} />
            <Row label={s.edit.delete} icon="trash" iconColor={colors.pink} labelColor={colors.pink} onPress={remove} last />
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
  blockTitle: { paddingHorizontal: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
