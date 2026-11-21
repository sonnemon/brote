import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import { Field, ProgressBar, Segmented } from '@/components/ui';
import { logEntry, useGoal, type GoalView } from '@/db/store';
import { formatPercent, formatSignedValue, heroInputFontSize, nudgeText, parseDecimal, stepForUnit } from '@/lib/format';
import { computeProgress, round2 } from '@/lib/progress';
import { useStrings } from '@/i18n';
import { colors, fonts } from '@/theme/tokens';

type Mode = 'value' | 'delta';

const INPUT_WIDTH_SLACK = 8;

export default function LogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useGoal(id);
  return goal ? <LogForm goal={goal} /> : null;
}

function LogForm({ goal }: { goal: GoalView }) {
  const s = useStrings();
  const modes: { value: Mode; label: string }[] = [
    { value: 'value', label: s.log.newValue },
    { value: 'delta', label: s.log.change },
  ];
  const [mode, setMode] = useState<Mode>('value');
  const [text, setText] = useState(String(goal.current));
  const [date, setDate] = useState(() => new Date());
  const [note, setNote] = useState('');

  const parsed = parseDecimal(text);
  const value = round2(mode === 'value' ? parsed : goal.current + parsed);
  const valid = Number.isFinite(value) && (mode === 'value' || parsed !== 0);
  const before = goal.progress;
  const after = valid ? computeProgress(goal.start_value, goal.target_value, value) : before;
  const step = stepForUnit(goal.unit);
  const [inputWidth, setInputWidth] = useState<number>();
  const fontSize = heroInputFontSize(text);

  const changeMode = (next: Mode) => {
    setMode(next);
    setText(next === 'value' ? String(goal.current) : '0');
  };

  const nudge = (direction: 1 | -1) => {
    setText((current) => nudgeText(current, direction * step));
  };

  const save = () => {
    logEntry({ goal_id: goal.id, value, note: note.trim() || null, recorded_at: date.toISOString() });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()} style={styles.navSide}>
          <T size={15} color={colors.textSecondary}>
            {s.common.cancel}
          </T>
        </Pressable>
        <T size={17} weight={600}>
          {s.log.title}
        </T>
        <View style={styles.navSide} />
      </View>

      <Segmented options={modes} value={mode} onChange={changeMode} />

      <View style={styles.stepper}>
        <StepButton icon="minus" label={s.log.subtract(step)} onPress={() => nudge(-1)} />
        <View style={styles.valueWrap}>
          {/* iOS calcula de menos el ancho propio del TextInput y corta el último dígito. */}
          <Text
            numberOfLines={1}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onLayout={(event) => setInputWidth(Math.ceil(event.nativeEvent.layout.width))}
            style={[styles.valueInput, styles.valueMeasure, { fontSize }]}
          >
            {text || '0'}
          </Text>
          <TextInput
            accessibilityLabel={mode === 'value' ? s.log.newValue : s.log.changeLabel}
            value={text}
            onChangeText={setText}
            keyboardType={mode === 'value' ? 'decimal-pad' : 'numbers-and-punctuation'}
            keyboardAppearance="dark"
            selectionColor={colors.lilac}
            selectTextOnFocus
            style={[styles.valueInput, { fontSize, width: inputWidth === undefined ? undefined : inputWidth + INPUT_WIDTH_SLACK }]}
          />
          <T size={16} color={colors.textSecondary}>
            {goal.unit}
          </T>
        </View>
        <StepButton icon="plus" label={s.log.add(step)} onPress={() => nudge(1)} />
      </View>

      <View style={styles.impact}>
        {valid && (
          <View style={styles.diff}>
            <T size={13} color="#B5EEF6">
              {formatSignedValue(value - goal.current, goal.unit)} {s.log.vsLast}
            </T>
          </View>
        )}
        <View style={styles.barRow}>
          <T size={12} color={colors.textTertiary}>
            {formatPercent(before)}
          </T>
          <ProgressBar progress={after} />
          <T size={12} weight={600} color={colors.textStrong}>
            {formatPercent(after)}
          </T>
        </View>
      </View>

      <View style={styles.card}>
        <View style={[styles.row, styles.separator]}>
          <View style={styles.rowLabel}>
            <Icon name="calendar" size={18} color={colors.lilac} />
            <T size={15}>{s.log.date}</T>
          </View>
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            themeVariant="dark"
            accentColor={colors.lilac}
            locale={s.locale}
            maximumDate={new Date()}
            onValueChange={(_, next) => setDate(next)}
          />
        </View>
        <Field
          value={note}
          onChangeText={setNote}
          placeholder={s.log.notePlaceholder}
          accessibilityLabel={s.log.note}
          maxLength={140}
          style={styles.note}
        />
      </View>

      <Button title={s.common.save} onPress={save} disabled={!valid} />
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

const styles = StyleSheet.create({
  content: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navSide: { width: 70 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 8 },
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
  impact: { alignItems: 'center', gap: 8 },
  diff: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(143,227,240,0.26)',
    backgroundColor: 'rgba(143,227,240,0.12)',
    justifyContent: 'center',
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,182,255,0.14)', backgroundColor: 'rgba(255,255,255,0.05)' },
  row: { minHeight: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  separator: { borderBottomWidth: 1, borderBottomColor: 'rgba(201,182,255,0.08)' },
  note: { borderWidth: 0, backgroundColor: 'transparent', height: 50, fontSize: 15 },
});
