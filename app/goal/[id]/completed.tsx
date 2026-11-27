import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { GlassCard } from '@/components/GlassCard';
import { Icon } from '@/components/Icon';
import { NebulaBackground } from '@/components/NebulaBackground';
import { Ring } from '@/components/Ring';
import { T } from '@/components/T';
import { useGoal } from '@/db/store';
import { completionDays, completionSummary } from '@/lib/completion';
import { bestStreakDays } from '@/lib/progress';
import { useStrings } from '@/i18n';
import { colors, gradients, readable } from '@/theme/tokens';

const SPARKLE = 'M12 2c.6 4.4 1.6 5.4 6 6-4.4.6-5.4 1.6-6 6-.6-4.4-1.6-5.4-6-6 4.4-.6 5.4-1.6 6-6z';

const SPARKLES = [
  { x: 0.1, y: 0.14, scale: 1.2, color: '#FFFFFF' },
  { x: 0.82, y: 0.11, scale: 1, color: '#FFFFFF' },
  { x: 0.85, y: 0.36, scale: 0.8, color: colors.cyan },
  { x: 0.08, y: 0.39, scale: 0.7, color: colors.amber },
  { x: 0.25, y: 0.07, scale: 0.6, color: colors.pink },
  { x: 0.69, y: 0.06, scale: 0.6, color: colors.lilac },
  { x: 0.19, y: 0.3, scale: 0.5, color: colors.cyan },
];

export default function GoalCompletedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useGoal(id);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = useStrings();

  if (!goal) return null;

  const now = new Date();
  const summary = completionSummary(goal, now);
  const days = completionDays(goal, now);
  const share = () => Share.share({ message: s.completed.share(goal.name, summary) });

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={2} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        {SPARKLES.map((s, i) => (
          <Path key={i} d={SPARKLE} fill={s.color} x={width * s.x} y={height * s.y} scale={s.scale} />
        ))}
      </Svg>

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.top}>
          <Ring progress={1} size={220} strokeWidth={14}>
            <LinearGradient colors={[colors.lilac, colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.check}>
              <Icon name="check" size={26} color={colors.onPrimary} strokeWidth={3} />
            </LinearGradient>
            <T size={34} weight={600} glow style={styles.percent}>
              100%
            </T>
          </Ring>

          <View style={styles.text}>
            <T size={34} weight={600} tracking={-0.02} color={colors.textStrong}>
              {s.completed.title}
            </T>
            <T size={16} color={colors.textSecondary} style={styles.summary}>
              {summary}
            </T>
          </View>

          <GlassCard style={styles.stats}>
            <Stat value={days} label={s.completed.days(days)} color={colors.lilac} divider />
            <Stat value={goal.entries.length} label={s.completed.entries} color={colors.cyan} divider />
            <Stat value={bestStreakDays(goal.entries, goal.frequency)} label={s.completed.bestStreak} color={colors.pink} />
          </GlassCard>
        </View>

        <View style={styles.actions}>
          <Button title={s.completed.next} onPress={() => router.replace('/goal/new')} style={styles.action} />
          <Pressable accessibilityRole="button" onPress={share} style={[styles.action, styles.secondary]}>
            <Icon name="share" size={18} color={colors.text} />
            <T size={16} weight={500}>
              {s.completed.shareButton}
            </T>
          </Pressable>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={styles.link}>
            <T size={14} color={colors.lilac}>
              {s.completed.history}
            </T>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Stat({ value, label, color, divider }: { value: number; label: string; color: string; divider?: boolean }) {
  return (
    <View style={[styles.stat, divider && styles.statDivider]}>
      <T size={24} weight={600}>
        {value}
      </T>
      <T size={12} color={color}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { ...readable, flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  top: { alignItems: 'center', gap: 24 },
  check: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: gradients.progress[2],
  },
  percent: { lineHeight: 40, marginTop: -18 },
  text: { alignItems: 'center', gap: 10 },
  summary: { textAlign: 'center', lineHeight: 24 },
  stats: { alignSelf: 'stretch', flexDirection: 'row', paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { borderRightWidth: 1, borderRightColor: 'rgba(201,182,255,0.12)' },
  actions: { alignItems: 'center', gap: 12 },
  action: { alignSelf: 'stretch' },
  secondary: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.35)',
    backgroundColor: 'rgba(23,19,44,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  link: { padding: 8 },
});
