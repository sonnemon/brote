import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { GlassCard } from '@/components/GlassCard';
import { Icon } from '@/components/Icon';
import { NebulaBackground } from '@/components/NebulaBackground';
import { TAB_BAR_SPACE } from '@/components/OrbeTabBar';
import { Ring } from '@/components/Ring';
import { T } from '@/components/T';
import { useGoals, type GoalView } from '@/db/store';
import { formatCurrentOfTarget, formatDayMonth, formatPercent, greeting } from '@/lib/format';
import type { IconName } from '@/lib/goalDraft';
import { isCompleted, streakDays } from '@/lib/progress';
import { alpha, colors } from '@/theme/tokens';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const goals = useGoals();
  const now = new Date();
  const active = goals.filter((goal) => !isCompleted(goal.progress)).length;
  const streak = goals.reduce((best, goal) => Math.max(best, streakDays(goal.entries, goal.frequency, now)), 0);

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={0} />
      <FlatList
        data={goals}
        keyExtractor={(goal) => goal.id}
        renderItem={({ item }) => <GoalCard goal={item} />}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: TAB_BAR_SPACE }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleText}>
                <T size={14} color={colors.textSecondary}>
                  {greeting(now)}
                </T>
                <T size={30} weight={600} tracking={-0.02} color={colors.textStrong}>
                  Tus metas
                </T>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ajustes"
                onPress={() => router.navigate('/settings')}
                style={styles.profile}
              >
                <Icon name="user" size={20} color={colors.lilac} />
              </Pressable>
            </View>
            {goals.length > 0 && (
              <View style={styles.pills}>
                <StatPill color={colors.lilac} textColor={colors.lilacSoft} label={`${active} ${active === 1 ? 'activa' : 'activas'}`} />
                {streak > 0 && (
                  <StatPill
                    color={colors.pink}
                    textColor="#FFC2E0"
                    label={`${streak} ${streak === 1 ? 'día' : 'días'} de racha`}
                    icon
                  />
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={<EmptyState />}
      />
    </View>
  );
}

function StatPill({ color, textColor, label, icon }: { color: string; textColor: string; label: string; icon?: boolean }) {
  return (
    <View style={[styles.pill, { backgroundColor: alpha(color, 0.12), borderColor: alpha(color, 0.22) }]}>
      {icon && <Icon name="star" size={13} color={color} />}
      <T size={13} color={textColor}>
        {label}
      </T>
    </View>
  );
}

function GoalCard({ goal }: { goal: GoalView }) {
  const down = goal.direction === 'down';
  const deadline = goal.deadline ? formatDayMonth(new Date(goal.deadline)) : 'sin fecha';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${goal.name}, ${formatPercent(goal.progress)}`}
      onPress={() => router.push(`/goal/${goal.id}`)}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassCard style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.goalIcon, { backgroundColor: alpha(goal.color, 0.14), borderColor: alpha(goal.color, 0.3) }]}>
            <Icon name={goal.icon as IconName} color={goal.color} />
          </View>
          <View style={styles.cardText}>
            <T size={16} weight={600} numberOfLines={1}>
              {goal.name}
            </T>
            <T size={11} color={goal.color}>
              {down ? '▼ Decreciente' : '▲ Creciente'} · {deadline}
            </T>
            <T size={13} color={colors.textSecondary} numberOfLines={1}>
              {formatCurrentOfTarget(goal.current, goal.target_value, goal.unit)}
            </T>
          </View>
          <Ring progress={goal.progress} size={60} strokeWidth={5} color={goal.color}>
            <T size={14} weight={600}>
              {formatPercent(goal.progress)}
            </T>
          </Ring>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <GlassCard style={styles.empty} radius={28}>
      <Ring progress={0} size={96} strokeWidth={8}>
        <Icon name="orbit" size={34} color={colors.lilac} />
      </Ring>
      <T size={20} weight={600} color={colors.textStrong}>
        Aún no tienes metas
      </T>
      <T size={14} color={colors.textSecondary} style={styles.emptyText}>
        Crea tu primera meta y mira cómo se llena tu anillo.
      </T>
      <Button title="Crear mi primera meta" onPress={() => router.push('/goal/new')} style={styles.emptyButton} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 12 },
  header: { gap: 16, marginBottom: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleText: { gap: 2 },
  profile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.4)',
    backgroundColor: 'rgba(23,19,44,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  pressed: { opacity: 0.8 },
  card: { height: 96, justifyContent: 'center', paddingHorizontal: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  goalIcon: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 4 },
  empty: { alignItems: 'center', padding: 24, gap: 12, marginTop: 40 },
  emptyText: { textAlign: 'center', lineHeight: 20 },
  emptyButton: { alignSelf: 'stretch', marginTop: 8 },
});
