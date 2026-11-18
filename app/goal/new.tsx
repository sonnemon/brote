import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { GlassCard } from '@/components/GlassCard';
import { Icon, type UiIconName } from '@/components/Icon';
import { Section } from '@/components/ListGroup';
import { NebulaBackground } from '@/components/NebulaBackground';
import { ReminderRow } from '@/components/ReminderRow';
import { Ring } from '@/components/Ring';
import { T } from '@/components/T';
import { Toggle } from '@/components/Toggle';
import { Field, ProgressBar, RoundButton, Segmented, StepBars } from '@/components/ui';
import { createGoal } from '@/db/store';
import { formatFullDate, formatPercent, formatSignedValue, formatValue, parseDecimal } from '@/lib/format';
import { draftCurrent, draftToInput, validateFrom, validateWhat, type GoalDraft } from '@/lib/goalDraft';
import { computeProgress, suggestedPace, weeksUntil, type Direction, type Frequency } from '@/lib/progress';
import { colors, goalColors } from '@/theme/tokens';

const UNITS = ['kg', 'km', 'S/', 'páginas', 'horas', '%'];
const PRESETS = [0, 0.25, 0.5, 0.75];
const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'free', label: 'Libre' },
];
const DEFAULT_WEEKS = 12;

type Patch = (patch: Partial<GoalDraft>) => void;

function initialDraft(): GoalDraft {
  return {
    name: '',
    direction: 'up',
    unit: 'kg',
    color: colors.lilac,
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

export default function NewGoalScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(initialDraft);
  const [showError, setShowError] = useState(false);
  const update: Patch = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
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
            <RoundButton icon={step === 1 ? 'close' : 'back'} label={step === 1 ? 'Cerrar' : 'Atrás'} onPress={goBack} />
            <T size={16} weight={600}>
              Nueva meta
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
          <Button title={step === 3 ? 'Crear meta' : 'Continuar'} onPress={next} />
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
  const [customUnit, setCustomUnit] = useState(() => !UNITS.includes(draft.unit));

  return (
    <>
      <Title>¿Qué quieres lograr?</Title>
      <Field
        label="Nombre"
        value={draft.name}
        onChangeText={(name) => update({ name })}
        placeholder="Ej. Viaje a Cusco"
        returnKeyType="done"
        maxLength={40}
      />

      <View style={styles.group}>
        <Label>Tipo</Label>
        <View style={styles.row}>
          <DirectionCard
            direction="up"
            selected={draft.direction === 'up'}
            title="Creciente"
            description="Subir un número: ahorro, km, libros"
            icon="trendUp"
            color={colors.pink}
            onPress={() => update({ direction: 'up' })}
          />
          <DirectionCard
            direction="down"
            selected={draft.direction === 'down'}
            title="Decreciente"
            description="Bajar un número: peso, deudas, horas"
            icon="trendDown"
            color={colors.lilac}
            onPress={() => update({ direction: 'down' })}
          />
        </View>
      </View>

      <View style={styles.group}>
        <Label>Unidad</Label>
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
            label="Otra…"
            dashed
            selected={customUnit}
            onPress={() => {
              setCustomUnit(true);
              update({ unit: '' });
            }}
          />
        </View>
        {customUnit && (
          <Field value={draft.unit} onChangeText={(unit) => update({ unit })} placeholder="Ej. pasos" maxLength={12} autoFocus />
        )}
      </View>

      <View style={styles.group}>
        <Label>Color</Label>
        <View style={styles.colors}>
          {goalColors.map(({ value, label }) => {
            const selected = draft.color === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                onPress={() => update({ color: value })}
                style={[styles.color, { backgroundColor: value }, selected && styles.colorSelected]}
              />
            );
          })}
        </View>
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

  return (
    <>
      <View style={styles.titleGroup}>
        <Title>¿Desde dónde partes?</Title>
        <T size={14} color={colors.textSecondary} style={styles.lead}>
          Tu progreso se mide entre el valor inicial y tu objetivo.
        </T>
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Field
            label="Valor inicial"
            value={draft.startText}
            onChangeText={(startText) => update({ startText })}
            keyboardType="decimal-pad"
            suffix={unit}
          />
        </View>
        <View style={styles.flex}>
          <Field
            label="Objetivo"
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
            Ya tengo avance
          </T>
          <T size={12} color={colors.textSecondary}>
            Empieza a mitad de camino
          </T>
        </View>
        <Toggle
          label="Ya tengo avance"
          value={draft.hasProgress}
          onChange={(hasProgress) =>
            update({ hasProgress, presetFraction: hasProgress ? 0.25 : null, currentText: '' })
          }
        />
      </View>

      {draft.hasProgress && (
        <>
          <View style={styles.group}>
            <Label>¿Cuánto llevas?</Label>
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
            label="Valor actual"
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
            Así empieza tu meta
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
              Inicio {formatValue(start, unit)}
            </T>
            <T size={12} color={colors.lilacSoft}>
              Hoy {formatValue(current, unit)}
            </T>
            <T size={12} color={colors.textTertiary}>
              Meta {formatValue(target, unit)}
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

  return (
    <>
      <Title>¿Para cuándo?</Title>

      <View style={styles.groupCard}>
        <View style={[styles.cardRow, styles.separator]}>
          <T size={15} weight={600}>
            Fecha límite
          </T>
          <Toggle label="Fecha límite" value={draft.hasDeadline} onChange={(hasDeadline) => update({ hasDeadline })} />
        </View>
        {draft.hasDeadline && (
          <View style={styles.cardRow}>
            <DateTimePicker
              value={draft.deadline}
              mode="date"
              display="compact"
              themeVariant="dark"
              accentColor={colors.lilac}
              locale="es-PE"
              minimumDate={new Date(now.getTime() + 86_400_000)}
              onValueChange={(_, deadline) => update({ deadline })}
            />
            <T size={13} color={colors.textTertiary}>
              {weeks} {weeks === 1 ? 'semana' : 'semanas'}
            </T>
          </View>
        )}
      </View>

      <View style={styles.group}>
        <Label>¿Cada cuánto registras?</Label>
        <Segmented options={FREQUENCIES} value={draft.frequency} onChange={(frequency) => update({ frequency })} />
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
              RESUMEN
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
        <SummaryRow label="Dirección" value={draft.direction === 'down' ? '▼ Decreciente' : '▲ Creciente'} color={colors.lilac} />
        <SummaryRow label="Rango" value={`${formatValue(start, draft.unit)} → ${formatValue(target, draft.unit)}`} />
        <SummaryRow label="Empiezas en" value={formatValue(current, draft.unit)} />
        {pace !== null && (
          <SummaryRow label="Ritmo sugerido" value={`${formatSignedValue(pace, draft.unit)} / semana`} color={colors.cyan} />
        )}
        {draft.hasDeadline && <SummaryRow label="Fecha límite" value={formatFullDate(draft.deadline)} />}
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
  top: { paddingHorizontal: 20, gap: 14 },
  nav: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { width: 44, textAlign: 'right' },
  content: { padding: 20, gap: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  titleGroup: { gap: 6 },
  lead: { lineHeight: 20 },
  group: { gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  row8: { flexDirection: 'row', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colors: { flexDirection: 'row', gap: 14 },
  color: { width: 44, height: 44, borderRadius: 22 },
  colorSelected: { borderWidth: 2, borderColor: colors.textStrong },
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
