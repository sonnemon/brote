import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { GlassCard } from '@/components/GlassCard';
import { GoalIcon } from '@/components/GoalIcon';
import { Icon } from '@/components/Icon';
import { NebulaBackground } from '@/components/NebulaBackground';
import { TAB_BAR_SPACE } from '@/components/OrbeTabBar';
import { Ring } from '@/components/Ring';
import { T } from '@/components/T';
import { useGoals, type GoalView } from '@/db/store';
import { useStrings } from '@/i18n';
import { formatCurrentOfTarget, formatDayMonth, formatPercent, greeting } from '@/lib/format';
import { isCompleted, streakDays } from '@/lib/progress';
import { useLayout, WIDE_CONTENT_WIDTH } from '@/theme/layout';
import { alpha, colors, readable } from '@/theme/tokens';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const goals = useGoals();
  const now = new Date();
  const active = goals.filter((goal) => !isCompleted(goal.progress)).length;
  const streak = goals.reduce((best, goal) => Math.max(best, streakDays(goal.entries, goal.frequency, now)), 0);
  const { wide, columns, cardWidth, gap } = useLayout();

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={0} />
      <FlatList
        // Cambiar de columnas (al girar el iPad) obliga a montar la lista de nuevo.
        key={columns}
        data={goals}
        numColumns={columns}
        keyExtractor={(goal) => goal.id}
        renderItem={({ item }) =>
          wide ? (
            <View style={{ width: cardWidth }}>
              <GoalTile goal={item} />
            </View>
          ) : (
            <GoalCard goal={item} />
          )
        }
        columnWrapperStyle={columns > 1 ? { gap } : undefined}
        contentContainerStyle={[
          styles.content,
          wide && styles.contentWide,
          { gap, paddingTop: insets.top + (wide ? 24 : 8), paddingBottom: TAB_BAR_SPACE },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.header, wide && styles.headerWide]}>
            <View style={styles.titleRow}>
              <View style={styles.titleText}>
                <T size={wide ? 16 : 14} color={colors.textSecondary}>
                  {greeting(now)}
                </T>
                <T size={wide ? 40 : 30} weight={600} tracking={-0.02} color={colors.textStrong}>
                  {s.home.title}
                </T>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={s.home.settings}
                onPress={() => router.navigate('/settings')}
                style={styles.profile}
              >
                <Icon name="user" size={20} color={colors.lilac} />
              </Pressable>
            </View>
            {goals.length > 0 && (
              <View style={styles.pills}>
                <StatPill color={colors.lilac} textColor={colors.lilacSoft} label={s.home.active(active)} />
                {streak > 0 && (
                  <StatPill
                    color={colors.pink}
                    textColor="#FFC2E0"
                    label={s.home.streak(streak)}
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
  const s = useStrings();
  const down = goal.direction === 'down';
  const deadline = goal.deadline ? formatDayMonth(new Date(goal.deadline)) : s.common.noDeadline;

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
            <GoalIcon name={goal.icon} color={goal.color} />
          </View>
          <View style={styles.cardText}>
            <T size={16} weight={600} numberOfLines={1}>
              {goal.name}
            </T>
            <T size={11} color={goal.color}>
              {down ? s.common.decreasingArrow : s.common.increasingArrow} · {deadline}
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

/** Tarjeta de la cuadrícula en iPad: anillo grande arriba y el detalle debajo. */
function GoalTile({ goal }: { goal: GoalView }) {
  const s = useStrings();
  const down = goal.direction === 'down';
  const deadline = goal.deadline ? formatDayMonth(new Date(goal.deadline)) : s.common.noDeadline;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${goal.name}, ${formatPercent(goal.progress)}`}
      onPress={() => router.push(`/goal/${goal.id}`)}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassCard style={styles.tile} radius={28}>
        <View style={styles.tileTop}>
          <View
            style={[styles.tileIcon, { backgroundColor: alpha(goal.color, 0.14), borderColor: alpha(goal.color, 0.3) }]}
          >
            <GoalIcon name={goal.icon} color={goal.color} size={26} />
          </View>
          <Ring progress={goal.progress} size={104} strokeWidth={9} color={goal.color}>
            <T size={22} weight={600}>
              {formatPercent(goal.progress)}
            </T>
          </Ring>
        </View>
        <View style={styles.tileText}>
          <T size={20} weight={600} numberOfLines={1}>
            {goal.name}
          </T>
          <T size={13} color={goal.color}>
            {down ? s.common.decreasingArrow : s.common.increasingArrow} · {deadline}
          </T>
          <T size={15} color={colors.textSecondary} numberOfLines={1}>
            {formatCurrentOfTarget(goal.current, goal.target_value, goal.unit)}
          </T>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function EmptyState() {
  const s = useStrings();
  return (
    <GlassCard style={styles.empty} radius={28}>
      <Ring progress={0} size={96} strokeWidth={8}>
        <Icon name="sprout" size={34} color={colors.lilac} />
      </Ring>
      <T size={20} weight={600} color={colors.textStrong}>
        {s.home.emptyTitle}
      </T>
      <T size={14} color={colors.textSecondary} style={styles.emptyText}>
        {s.home.emptyText}
      </T>
      <Button title={s.home.createFirst} onPress={() => router.push('/goal/new')} style={styles.emptyButton} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { ...readable, paddingHorizontal: 20 },
  contentWide: { maxWidth: WIDE_CONTENT_WIDTH },
  header: { gap: 16, marginBottom: 4 },
  headerWide: { gap: 20, marginBottom: 12 },
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
  tile: { padding: 22, gap: 18 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tileIcon: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tileText: { gap: 6 },
  empty: { alignItems: 'center', padding: 24, gap: 12, marginTop: 40 },
  emptyText: { textAlign: 'center', lineHeight: 20 },
  emptyButton: { alignSelf: 'stretch', marginTop: 8 },
});
