import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ColorField } from '@/components/ColorPicker';
import { GlassCard } from '@/components/GlassCard';
import { Icon, type UiIconName } from '@/components/Icon';
import { IconButton } from '@/components/IconPicker';
import { Section } from '@/components/ListGroup';
import { NebulaBackground } from '@/components/NebulaBackground';
import { ReminderRow } from '@/components/ReminderRow';
import { Ring } from '@/components/Ring';
import { T } from '@/components/T';
import { Toggle } from '@/components/Toggle';
import { Field, ProgressBar, RoundButton, Segmented, StepBars } from '@/components/ui';
import { WidePanel } from '@/components/WidePanel';
import { createGoal } from '@/db/store';
import { formatFullDate, formatPercent, formatSignedValue, formatValue, parseDecimal } from '@/lib/format';
import { draftCurrent, draftToInput, validateFrom, validateWhat, type GoalDraft } from '@/lib/goalDraft';
import { DEFAULT_ICON, suggestIcons, withCurrent } from '@/lib/goalIcons';
import { computeProgress, suggestedPace, weeksUntil, type Direction, type Frequency } from '@/lib/progress';
import { useStrings } from '@/i18n';
import { colors, readable } from '@/theme/tokens';

/** Unidades rápidas; páginas y horas se muestran (y se guardan) en el idioma activo. */
const unitsFor = (s: { units: { pages: string; hours: string } }) => ['kg', 'km', 'S/', s.units.pages, s.units.hours, '%'];
const PRESETS = [0, 0.25, 0.5, 0.75];
const FREQUENCY_VALUES: Frequency[] = ['daily', 'weekly', 'free'];
const DEFAULT_WEEKS = 12;

type Patch = (patch: Partial<GoalDraft>) => void;

function initialDraft(): GoalDraft {
  return {
    name: '',
    direction: 'up',
    unit: 'kg',
    color: colors.lilac,
    icon: DEFAULT_ICON,
    iconAuto: true,
    startText: '0',
    targetText: '',
    hasProgress: false,
    presetFraction: null,
    currentText: '',
    hasDeadline: true,
    deadline: new Date(Date.now() + DEFAULT_WEEKS * 7 * 86_400_000),
    frequency: 'weekly',
    reminder: null,
  };
}

function NewGoalScreen() {
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(initialDraft);
  const [showError, setShowError] = useState(false);
  const update: Patch = (patch) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      // Mientras el usuario no elija uno, el icono sigue al nombre.
      if (next.iconAuto && 'name' in patch) next.icon = suggestIcons(next.name)[0];
      return next;
    });
    setShowError(false);
  };

  const error = step === 1 ? validateWhat(draft) : step === 2 ? validateFrom(draft) : null;

  const goBack = () => {
    setShowError(false);
    if (step === 1) router.back();
    else setStep(step - 1);
  };

  const next = () => {
    if (error) {
      setShowError(true);
    } else if (step < 3) {
      setStep(step + 1);
    } else {
      router.replace(`/goal/${createGoal(draftToInput(draft))}`);
    }
  };

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={1} dim />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <View style={styles.nav}>
            <RoundButton icon={step === 1 ? 'close' : 'back'} label={step === 1 ? s.common.close : s.common.back} onPress={goBack} />
            <T size={16} weight={600}>
              {s.newGoal.title}
            </T>
            <T size={13} color={colors.textSecondary} style={styles.counter}>
              {step} / 3
            </T>
          </View>
          <StepBars step={step} total={3} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && <StepWhat draft={draft} update={update} />}
          {step === 2 && <StepFrom draft={draft} update={update} />}
          {step === 3 && <StepWhen draft={draft} update={update} />}
          {showError && error && (
            <T size={13} color={colors.danger} accessibilityLiveRegion="polite">
              {error}
            </T>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button title={step === 3 ? s.newGoal.create : s.newGoal.continue} onPress={next} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Title({ children }: { children: string }) {
  return (
    <T size={28} weight={600} tracking={-0.02} color={colors.textStrong}>
      {children}
    </T>
  );
}

function Label({ children }: { children: string }) {
  return (
    <T size={13} color={colors.textSecondary}>
      {children}
    </T>
  );
}

function StepWhat({ draft, update }: { draft: GoalDraft; update: Patch }) {
  const s = useStrings();
  const UNITS = unitsFor(s);
  const [customUnit, setCustomUnit] = useState(() => !UNITS.includes(draft.unit));
  const suggestions = useMemo(() => withCurrent(suggestIcons(draft.name), draft.icon), [draft.name, draft.icon]);
  const pickIcon = (icon: string) => update({ icon, iconAuto: false });

  return (
    <>
      <Title>{s.newGoal.whatTitle}</Title>
      <View style={styles.group}>
        <Label>{s.newGoal.name}</Label>
        <View style={styles.nameRow}>
          <View style={styles.flex}>
            <Field
              accessibilityLabel={s.newGoal.name}
              value={draft.name}
              onChangeText={(name) => update({ name })}
              placeholder={s.newGoal.namePlaceholder}
              returnKeyType="done"
              maxLength={40}
            />
          </View>
          <IconButton value={draft.icon} color={draft.color} suggestions={suggestions} onChange={pickIcon} />
        </View>
      </View>

      <View style={styles.group}>
        <Label>{s.newGoal.type}</Label>
        <View style={styles.row}>
          <DirectionCard
            direction="up"
            selected={draft.direction === 'up'}
            title={s.common.increasing}
            description={s.newGoal.upDescription}
            icon="trendUp"
            color={colors.pink}
            onPress={() => update({ direction: 'up' })}
          />
          <DirectionCard
            direction="down"
            selected={draft.direction === 'down'}
            title={s.common.decreasing}
            description={s.newGoal.downDescription}
            icon="trendDown"
            color={colors.lilac}
            onPress={() => update({ direction: 'down' })}
          />
        </View>
      </View>

      <View style={styles.group}>
        <Label>{s.newGoal.unit}</Label>
        <View style={styles.wrap}>
          {UNITS.map((unit) => (
            <Chip
              key={unit}
              label={unit}
              selected={!customUnit && draft.unit === unit}
              onPress={() => {
                setCustomUnit(false);
                update({ unit });
              }}
            />
          ))}
          <Chip
            label={s.units.other}
            dashed
            selected={customUnit}
            onPress={() => {
              setCustomUnit(true);
              update({ unit: '' });
            }}
          />
        </View>
        {customUnit && (
          <Field value={draft.unit} onChangeText={(unit) => update({ unit })} placeholder={s.units.otherPlaceholder} maxLength={12} autoFocus />
        )}
      </View>

      <View style={styles.group}>
        <Label>{s.newGoal.color}</Label>
        <ColorField value={draft.color} icon={draft.icon} onChange={(color) => update({ color })} />
      </View>
    </>
  );
}

type DirectionCardProps = {
  direction: Direction;
  selected: boolean;
  title: string;
  description: string;
  icon: UiIconName;
  color: string;
  onPress: () => void;
};

function DirectionCard({ selected, title, description, icon, color, onPress }: DirectionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.directionCard, selected && styles.directionSelected]}
    >
      <View style={styles.directionTop}>
        <Icon name={icon} color={color} strokeWidth={2.2} />
        {selected && (
          <View style={styles.check}>
            <Icon name="check" size={12} color={colors.onPrimary} strokeWidth={3.5} />
          </View>
        )}
      </View>
      <View style={styles.directionText}>
        <T size={16} weight={600}>
          {title}
        </T>
        <T size={12} color={selected ? colors.lilacSoft : colors.textSecondary} style={styles.directionDescription}>
          {description}
        </T>
      </View>
    </Pressable>
  );
}

function StepFrom({ draft, update }: { draft: GoalDraft; update: Patch }) {
  const start = parseDecimal(draft.startText);
  const target = parseDecimal(draft.targetText);
  const current = draftCurrent(draft);
  const complete = Number.isFinite(start) && Number.isFinite(target) && Number.isFinite(current);
  const progress = complete ? computeProgress(start, target, current) : 0;
  const unit = draft.unit;
  const s = useStrings();

  return (
    <>
      <View style={styles.titleGroup}>
        <Title>{s.newGoal.fromTitle}</Title>
        <T size={14} color={colors.textSecondary} style={styles.lead}>
          {s.newGoal.fromLead}
        </T>
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Field
            label={s.newGoal.startValue}
            value={draft.startText}
            onChangeText={(startText) => update({ startText })}
            keyboardType="decimal-pad"
            suffix={unit}
          />
        </View>
        <View style={styles.flex}>
          <Field
            label={s.newGoal.target}
            value={draft.targetText}
            onChangeText={(targetText) => update({ targetText })}
            keyboardType="decimal-pad"
            suffix={unit}
          />
        </View>
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingText}>
          <T size={15} weight={600}>
            {s.newGoal.hasProgress}
          </T>
          <T size={12} color={colors.textSecondary}>
            {s.newGoal.hasProgressHint}
          </T>
        </View>
        <Toggle
          label={s.newGoal.hasProgress}
          value={draft.hasProgress}
          onChange={(hasProgress) =>
            update({ hasProgress, presetFraction: hasProgress ? 0.25 : null, currentText: '' })
          }
        />
      </View>

      {draft.hasProgress && (
        <>
          <View style={styles.group}>
            <Label>{s.newGoal.howMuch}</Label>
            <View style={styles.row8}>
              {PRESETS.map((fraction) => (
                <Chip
                  key={fraction}
                  label={formatPercent(fraction)}
                  selected={draft.presetFraction === fraction}
                  onPress={() => update({ presetFraction: fraction, currentText: '' })}
                  style={styles.preset}
                />
              ))}
            </View>
          </View>
          <Field
            label={s.newGoal.currentValue}
            value={draft.presetFraction !== null ? (Number.isFinite(current) ? String(current) : '') : draft.currentText}
            onChangeText={(currentText) => update({ currentText, presetFraction: null })}
            keyboardType="decimal-pad"
            suffix={unit}
          />
        </>
      )}

      <GlassCard radius={22} style={styles.previewCard}>
        <View style={styles.previewHead}>
          <T size={13} color={colors.textSecondary}>
            {s.newGoal.previewTitle}
          </T>
          <T size={22} weight={600} color={colors.textStrong} glow>
            {formatPercent(progress)}
          </T>
        </View>
        <View style={styles.barRow}>
          <ProgressBar progress={progress} />
        </View>
        {complete && (
          <View style={styles.previewLabels}>
            <T size={12} color={colors.textTertiary}>
              {s.newGoal.previewStart} {formatValue(start, unit)}
            </T>
            <T size={12} color={colors.lilacSoft}>
              {s.newGoal.previewToday} {formatValue(current, unit)}
            </T>
            <T size={12} color={colors.textTertiary}>
              {s.newGoal.previewGoal} {formatValue(target, unit)}
            </T>
          </View>
        )}
      </GlassCard>
    </>
  );
}

function StepWhen({ draft, update }: { draft: GoalDraft; update: Patch }) {
  const now = new Date();
  const start = parseDecimal(draft.startText);
  const target = parseDecimal(draft.targetText);
  const current = draftCurrent(draft);
  const progress = computeProgress(start, target, current);
  const pace = suggestedPace(target, current, draft.hasDeadline ? draft.deadline : null, now);
  const weeks = Math.round(weeksUntil(draft.deadline, now));
  const s = useStrings();
  const frequencies = FREQUENCY_VALUES.map((value) => ({ value, label: s.frequency[value] }));

  return (
    <>
      <Title>{s.newGoal.whenTitle}</Title>

      <View style={styles.groupCard}>
        <View style={[styles.cardRow, styles.separator]}>
          <T size={15} weight={600}>
            {s.newGoal.deadline}
          </T>
          <Toggle label={s.newGoal.deadline} value={draft.hasDeadline} onChange={(hasDeadline) => update({ hasDeadline })} />
        </View>
        {draft.hasDeadline && (
          <View style={styles.cardRow}>
            <DateTimePicker
              value={draft.deadline}
              mode="date"
              display="compact"
              themeVariant="dark"
              accentColor={colors.lilac}
              locale={s.locale}
              minimumDate={new Date(now.getTime() + 86_400_000)}
              onValueChange={(_, deadline) => update({ deadline })}
            />
            <T size={13} color={colors.textTertiary}>
              {s.common.weeks(weeks)}
            </T>
          </View>
        )}
      </View>

      <View style={styles.group}>
        <Label>{s.newGoal.frequency}</Label>
        <Segmented options={frequencies} value={draft.frequency} onChange={(frequency) => update({ frequency })} />
      </View>

      <Section>
        <ReminderRow
          value={draft.reminder}
          frequency={draft.frequency}
          onChange={(reminder) => update({ reminder })}
          last
        />
      </Section>

      <GlassCard style={styles.summary}>
        <View style={styles.summaryHead}>
          <View style={styles.settingText}>
            <T size={12} tracking={0.12} color={colors.textTertiary}>
              {s.newGoal.summary}
            </T>
            <T size={18} weight={600} numberOfLines={1}>
              {draft.name}
            </T>
          </View>
          <Ring progress={progress} size={52} strokeWidth={5} color={draft.color}>
            <T size={12} weight={600}>
              {formatPercent(progress)}
            </T>
          </Ring>
        </View>
        <SummaryRow label={s.newGoal.direction} value={draft.direction === 'down' ? s.common.decreasingArrow : s.common.increasingArrow} color={colors.lilac} />
        <SummaryRow label={s.newGoal.range} value={`${formatValue(start, draft.unit)} → ${formatValue(target, draft.unit)}`} />
        <SummaryRow label={s.newGoal.startsAt} value={formatValue(current, draft.unit)} />
        {pace !== null && (
          <SummaryRow label={s.newGoal.pace} value={`${formatSignedValue(pace, draft.unit)} ${s.newGoal.perWeek}`} color={colors.cyan} />
        )}
        {draft.hasDeadline && <SummaryRow label={s.newGoal.deadline} value={formatFullDate(draft.deadline)} />}
      </GlassCard>
    </>
  );
}

function SummaryRow({ label, value, color = colors.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.summaryRow}>
      <T size={14} color={colors.textSecondary}>
        {label}
      </T>
      <T size={14} color={color}>
        {value}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  top: { ...readable, paddingHorizontal: 20, gap: 14 },
  nav: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { width: 44, textAlign: 'right' },
  content: { ...readable, padding: 20, gap: 20 },
  footer: { ...readable, paddingHorizontal: 20, paddingTop: 8 },
  titleGroup: { gap: 6 },
  lead: { lineHeight: 20 },
  group: { gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  row8: { flexDirection: 'row', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  directionCard: {
    flex: 1,
    height: 124,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,17,42,0.65)',
    justifyContent: 'space-between',
  },
  directionSelected: { borderWidth: 1.5, borderColor: colors.lilac, backgroundColor: 'rgba(201,182,255,0.14)' },
  directionTop: { flexDirection: 'row', justifyContent: 'space-between' },
  directionText: { gap: 3 },
  directionDescription: { lineHeight: 16 },
  check: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center' },
  settingRow: {
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingText: { flex: 1, gap: 2 },
  preset: { flex: 1, paddingHorizontal: 0 },
  previewCard: { padding: 16, gap: 12 },
  previewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barRow: { flexDirection: 'row' },
  previewLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  groupCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cardRow: { minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  separator: { borderBottomWidth: 1, borderBottomColor: 'rgba(201,182,255,0.1)' },
  summary: { paddingVertical: 16, paddingHorizontal: 18, gap: 10 },
  summaryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

/** En iPad se muestra como tarjeta centrada; en iPhone, a pantalla completa como siempre. */
export default function NewGoalScreenRoute() {
  return (
    <WidePanel>
      <NewGoalScreen />
    </WidePanel>
  );
}
