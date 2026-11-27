import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import { Field, ProgressBar } from '@/components/ui';
import { logEntry, useGoal, type GoalView } from '@/db/store';
import {
  formatCurrentOfTarget,
  formatDayMonth,
  formatNumber,
  formatPercent,
  heroInputFontSize,
  nudgeText,
  parseDecimal,
  stepForUnit,
} from '@/lib/format';
import { defaultLogMode, lastAddedAmount, quickAmounts, type LogMode } from '@/lib/logAmounts';
import { computeProgress, round2 } from '@/lib/progress';
import { useStrings } from '@/i18n';
import { colors, fonts, readable } from '@/theme/tokens';

const INPUT_WIDTH_SLACK = 8;

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function LogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useGoal(id);
  return goal ? <LogForm goal={goal} /> : null;
}

/**
 * Hoja "Registrar avance": un número grande con − y +, cantidades rápidas y cómo quedará la meta.
 * Las metas que suben se registran sumando; las que bajan (peso) con el valor total. Fecha y nota
 * quedan ocultas hasta que se tocan.
 */
function LogForm({ goal }: { goal: GoalView }) {
  const s = useStrings();
  const step = stepForUnit(goal.unit);
  const presets = quickAmounts(step, lastAddedAmount(goal.start_value, goal.entries));

  const [mode, setMode] = useState<LogMode>(() => defaultLogMode(goal.start_value, goal.target_value));
  const [text, setText] = useState(() => (mode === 'add' ? String(presets[0]) : String(goal.current)));
  const [date, setDate] = useState(() => new Date());
  const [showDate, setShowDate] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [inputWidth, setInputWidth] = useState<number>();

  const parsed = parseDecimal(text);
  const value = round2(mode === 'add' ? goal.current + parsed : parsed);
  const valid = Number.isFinite(value) && (mode === 'total' || parsed !== 0);
  const after = valid ? computeProgress(goal.start_value, goal.target_value, value) : goal.progress;
  const fontSize = heroInputFontSize(text);

  const switchMode = () => {
    const next = mode === 'add' ? 'total' : 'add';
    setMode(next);
    setText(next === 'add' ? String(presets[0]) : String(goal.current));
  };

  const save = () => {
    logEntry({ goal_id: goal.id, value, note: note.trim() || null, recorded_at: date.toISOString() });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <View style={styles.header}>
        <T size={17} weight={600}>
          {goal.name}
        </T>
        <T size={13} color={colors.textSecondary}>
          {mode === 'add' ? s.log.addLabel : s.log.totalLabel}
        </T>
      </View>

      <View style={styles.stepper}>
        <StepButton icon="minus" label={s.log.subtract(step)} onPress={() => setText((t) => nudgeText(t, -step))} />
        <View style={styles.valueWrap}>
          {/* iOS calcula de menos el ancho propio del TextInput y corta el último dígito. */}
          <Text
            numberOfLines={1}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onLayout={(event) => setInputWidth(Math.ceil(event.nativeEvent.layout.width))}
            style={[styles.valueInput, styles.valueMeasure, { fontSize }]}
          >
            {mode === 'add' ? `+${text || '0'}` : text || '0'}
          </Text>
          <TextInput
            accessibilityLabel={mode === 'add' ? s.log.addLabel : s.log.totalLabel}
            value={mode === 'add' ? `+${text}` : text}
            onChangeText={(next) => setText(mode === 'add' ? next.replace(/^\+/, '') : next)}
            keyboardType="decimal-pad"
            keyboardAppearance="dark"
            selectionColor={colors.lilac}
            selectTextOnFocus
            style={[styles.valueInput, { fontSize, width: inputWidth === undefined ? undefined : inputWidth + INPUT_WIDTH_SLACK }]}
          />
          <T size={16} color={colors.textSecondary}>
            {goal.unit}
          </T>
        </View>
        <StepButton icon="plus" label={s.log.add(step)} onPress={() => setText((t) => nudgeText(t, step))} />
      </View>

      {mode === 'add' && (
        <View style={styles.chips}>
          {presets.map((amount) => {
            const selected = parsed === amount;
            return (
              <Pressable
                key={amount}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setText(String(amount))}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <T size={14} weight={600} color={selected ? colors.bg : colors.textStrong}>
                  +{formatNumber(amount)}
                </T>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.impact}>
        <T size={14} color={colors.textSecondary}>
          {s.log.willBe(formatCurrentOfTarget(valid ? value : goal.current, goal.target_value, goal.unit))}
        </T>
        <View style={styles.barRow}>
          <ProgressBar progress={after} />
          <T size={12} weight={600} color={colors.textStrong}>
            {formatPercent(after)}
          </T>
        </View>
      </View>

      <View style={styles.extras}>
        <Pill icon="calendar" label={isSameDay(date, new Date()) ? s.common.today : formatDayMonth(date)} active={showDate} onPress={() => setShowDate((v) => !v)} />
        <Pill icon="plus" label={s.log.addNote} active={showNote} onPress={() => setShowNote((v) => !v)} />
      </View>

      {showDate && (
        <View style={styles.datePicker}>
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            themeVariant="dark"
            accentColor={colors.lilac}
            locale={s.locale}
            maximumDate={new Date()}
            onValueChange={(_, next) => {
              setDate(next);
              setShowDate(false);
            }}
          />
        </View>
      )}

      {showNote && (
        <Field value={note} onChangeText={setNote} placeholder={s.log.notePlaceholder} accessibilityLabel={s.log.note} maxLength={140} autoFocus />
      )}

      <Button title={s.log.save} onPress={save} disabled={!valid} />

      <Pressable accessibilityRole="button" hitSlop={8} onPress={switchMode} style={styles.switch}>
        <T size={13} color={colors.lilac}>
          {mode === 'add' ? s.log.switchToTotal : s.log.switchToAdd}
        </T>
      </Pressable>
    </ScrollView>
  );
}

function StepButton({ icon, label, onPress }: { icon: 'plus' | 'minus'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.stepButton}>
      <Icon name={icon} color={colors.lilac} strokeWidth={2.6} />
    </Pressable>
  );
}

function Pill({ icon, label, active, onPress }: { icon: 'calendar' | 'plus'; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: active }} onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Icon name={icon} size={16} color={colors.lilac} />
      <T size={14}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { ...readable, paddingTop: 28, paddingHorizontal: 20, paddingBottom: 32, gap: 18 },
  header: { alignItems: 'center', gap: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.3)',
    backgroundColor: 'rgba(201,182,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 },
  valueInput: {
    flexShrink: 1,
    minWidth: 40,
    padding: 0,
    fontFamily: fonts[600],
    fontSize: 60,
    letterSpacing: -2,
    color: colors.textStrong,
    textAlign: 'center',
  },
  valueMeasure: { position: 'absolute', opacity: 0 },
  chips: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: 64,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.lilac, borderColor: colors.lilac },
  impact: { alignItems: 'center', gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  extras: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  pill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillActive: { borderColor: 'rgba(201,182,255,0.4)' },
  datePicker: { borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  switch: { alignSelf: 'center' },
});
