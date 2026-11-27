import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { GlassCard } from '@/components/GlassCard';
import { NebulaBackground } from '@/components/NebulaBackground';
import { Ring } from '@/components/Ring';
import { T } from '@/components/T';
import { RoundButton } from '@/components/ui';
import { WeeklyChart } from '@/components/WeeklyChart';
import { consumeCelebration, useGoal, type GoalView } from '@/db/store';
import {
  formatDayMonth,
  formatHistoryDate,
  formatNumber,
  formatPercent,
  formatSigned,
  formatSignedValue,
  formatValue,
} from '@/lib/format';
import { isCompleted, streakDays, weeklyChange, weeklySeries } from '@/lib/progress';
import { useStrings } from '@/i18n';
import { useLayout, WIDE_CONTENT_WIDTH } from '@/theme/layout';
import { colors, readable } from '@/theme/tokens';

const HISTORY_PREVIEW = 3;
/** En iPad el historial tiene espacio a la derecha: se muestran más registros. */
const HISTORY_PREVIEW_WIDE = 14;

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useGoal(id);
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const { wide } = useLayout();

  useFocusEffect(
    useCallback(() => {
      if (consumeCelebration(id)) router.push(`/goal/${id}/completed`);
    }, [id]),
  );

  if (!goal) {
    return (
      <View style={[styles.screen, styles.missing]}>
        <NebulaBackground variant={2} />
        <T size={16}>{s.detail.missing}</T>
        <Button title={s.detail.back} onPress={() => router.back()} style={styles.missingButton} />
      </View>
    );
  }

  const logButton = (
    <Button
      title={s.detail.log}
      icon="plus"
      onPress={() => router.push(`/goal/${goal.id}/log`)}
      style={wide ? undefined : styles.ctaButton}
    />
  );

  // iPad: el anillo, los números, el botón y el gráfico a la izquierda; el historial a la derecha.
  if (wide) {
    return (
      <View style={styles.screen}>
        <NebulaBackground variant={2} />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            styles.contentWide,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Header goal={goal} />
          <View style={styles.columns}>
            <View style={styles.side}>
              <Hero goal={goal} wide />
              <Stats goal={goal} />
              {logButton}
              <Chart goal={goal} wide />
            </View>
            <View style={styles.main}>
              <History goal={goal} preview={HISTORY_PREVIEW_WIDE} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={2} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 92 }]}
        showsVerticalScrollIndicator={false}
      >
        <Header goal={goal} />
        <Hero goal={goal} />
        <Stats goal={goal} />
        <Chart goal={goal} />
        <History goal={goal} preview={HISTORY_PREVIEW} />
      </ScrollView>
      <View style={[styles.cta, { bottom: Math.max(insets.bottom, 16) }]} pointerEvents="box-none">
        {logButton}
      </View>
    </View>
  );
}

function Header({ goal }: { goal: GoalView }) {
  const s = useStrings();
  const direction = goal.direction === 'down' ? s.common.decreasingArrow : s.common.increasingArrow;
  const deadline = goal.deadline ? s.detail.until(formatDayMonth(new Date(goal.deadline))) : s.common.noDeadline;
  return (
    <View style={styles.nav}>
      <RoundButton icon="back" label={s.common.back} onPress={() => router.back()} />
      <View style={styles.navTitle}>
        <T size={16} weight={600} numberOfLines={1}>
          {goal.name}
        </T>
        <T size={11} color={goal.color}>
          {direction} · {deadline}
        </T>
      </View>
      <RoundButton icon="more" label={s.detail.edit} onPress={() => router.push(`/goal/${goal.id}/edit`)} />
    </View>
  );
}

function Hero({ goal, wide }: { goal: GoalView; wide?: boolean }) {
  const s = useStrings();
  const remaining = Math.abs(goal.target_value - goal.current);
  return (
    <View style={[styles.hero, wide && styles.heroWide]}>
      <Ring progress={goal.progress} size={wide ? 300 : 196} strokeWidth={wide ? 16 : 12}>
        <View style={[styles.heroValue, wide && styles.heroValueWide]}>
          <T size={wide ? 88 : 60} weight={600} tracking={-0.03} glow adjustsFontSizeToFit numberOfLines={1} style={styles.heroNumber}>
            {formatNumber(goal.current)}
          </T>
          <T size={wide ? 18 : 14} color={colors.textSecondary}>
            {goal.unit}
          </T>
        </View>
        <T size={wide ? 16 : 13} color={colors.lilacSoft}>
          {isCompleted(goal.progress)
            ? s.detail.completed
            : `${formatPercent(goal.progress)} · ${s.detail.remaining(formatValue(remaining, goal.unit))}`}
        </T>
      </Ring>
    </View>
  );
}

function Stats({ goal }: { goal: GoalView }) {
  const s = useStrings();
  const streak = streakDays(goal.entries, goal.frequency, new Date());
  return (
    <View style={styles.stats}>
      <Stat label={s.common.start} value={formatValue(goal.start_value, goal.unit)} />
      <Stat label={s.common.goal} value={formatValue(goal.target_value, goal.unit)} />
      <Stat label={s.common.streak} value={s.common.days(streak)} accent />
    </View>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.stat, accent && styles.statAccent]}>
      <T size={11} color={accent ? colors.pink : colors.textTertiary}>
        {label}
      </T>
      <T size={16} weight={600} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </T>
    </View>
  );
}

function Chart({ goal, wide }: { goal: GoalView; wide?: boolean }) {
  const s = useStrings();
  const series = weeklySeries(goal.start_value, goal.entries, new Date());
  return (
    <GlassCard style={styles.chart}>
      <View style={styles.spaceBetween}>
        <T size={15} weight={600}>
          {s.detail.last8}
        </T>
        <T size={12} color={colors.cyan}>
          {formatSignedValue(weeklyChange(series), goal.unit)} {s.detail.perWeek}
        </T>
      </View>
      <WeeklyChart values={series.map((point) => point.value)} height={wide ? 140 : undefined} />
      <View style={styles.spaceBetween}>
        <T size={11} color={colors.textTertiary}>
          {formatDayMonth(series[0].date)}
        </T>
        <T size={11} color={colors.textTertiary}>
          {s.common.today}
        </T>
      </View>
    </GlassCard>
  );
}

function History({ goal, preview }: { goal: GoalView; preview: number }) {
  const s = useStrings();
  const [expanded, setExpanded] = useState(false);
  const now = new Date();
  const visible = expanded ? goal.entries : goal.entries.slice(0, preview);

  return (
    <View style={styles.history}>
      <View style={styles.spaceBetween}>
        <T size={15} weight={600}>
          {s.detail.history}
        </T>
        {goal.entries.length > preview && (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => setExpanded(!expanded)}>
            <T size={13} color={colors.lilac}>
              {expanded ? s.detail.seeLess : s.detail.seeAll}
            </T>
          </Pressable>
        )}
      </View>
      <View style={styles.historyCard}>
        {goal.entries.length === 0 && (
          <T size={14} color={colors.textSecondary} style={styles.historyEmpty}>
            {s.detail.historyEmpty}
          </T>
        )}
        {visible.map((entry, i) => {
          const previous = goal.entries[goal.entries.indexOf(entry) + 1]?.value ?? goal.start_value;
          return (
            <View key={entry.id} style={[styles.historyRow, i < visible.length - 1 && styles.separator]}>
              <T size={14} color={i === 0 ? colors.text : colors.textSecondary}>
                {formatHistoryDate(new Date(entry.recorded_at), now)}
              </T>
              <View style={styles.historyValues}>
                <T size={14} weight={600}>
                  {formatValue(entry.value, goal.unit)}
                </T>
                <T size={12} color={colors.cyan}>
                  {formatSigned(entry.value - previous)}
                </T>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  missing: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  missingButton: { width: 200 },
  content: { ...readable, paddingHorizontal: 20, gap: 16 },
  contentWide: { maxWidth: WIDE_CONTENT_WIDTH, gap: 28 },
  columns: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  side: { flex: 1, gap: 20 },
  main: { flex: 1.1, gap: 20 },
  nav: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  navTitle: { flex: 1, alignItems: 'center' },
  hero: { alignItems: 'center' },
  heroWide: { paddingVertical: 12 },
  heroValue: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 3, width: 160 },
  heroValueWide: { width: 240 },
  heroNumber: { flexShrink: 1 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    height: 60,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.14)',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    gap: 2,
  },
  statAccent: { borderColor: 'rgba(255,158,207,0.2)' },
  chart: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  history: { gap: 8 },
  historyCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,182,255,0.14)', backgroundColor: colors.surface },
  historyEmpty: { padding: 16, lineHeight: 20 },
  historyRow: { height: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  separator: { borderBottomWidth: 1, borderBottomColor: 'rgba(201,182,255,0.08)' },
  historyValues: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cta: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  ctaButton: readable,
});
