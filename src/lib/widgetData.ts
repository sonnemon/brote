import { strings } from '../i18n';

import { formatDayMonth, formatNumber, formatSigned, formatValue } from './format';
import { widgetSymbol } from './widgetSymbols';
import { clamp, streakDays, suggestedPace, weeklyChange, weeklySeries, type EntryPoint, type Frequency } from './progress';

export type WidgetGoal = {
  id: string;
  name: string;
  unit: string;
  start_value: number;
  target_value: number;
  deadline: string | null;
  frequency: Frequency;
  created_at: string;
  completed_at: string | null;
  archived_at: string | null;
  current: number;
  progress: number;
  entries: readonly EntryPoint[];
};

/** Todo va ya formateado: el widget en Swift solo pinta. */
export type WidgetSnapshot = {
  goalId: string;
  name: string;
  valueText: string;
  unit: string;
  percent: number;
  progress: number;
  changeText: string;
  targetText: string;
  targetNumberText: string;
  streakDays: number;
  streakProgress: number;
  weeklyText: string;
  weekProgress: number;
  series: number[];
  startDateLabel: string;
  startValueLabel: string;
};

/** Una meta en los widgets de varias metas ("Mis metas"). */
export type WidgetGoalItem = {
  id: string;
  name: string;
  valueText: string;
  unit: string;
  targetNumberText: string;
  percent: number;
  progress: number;
  /** "#RRGGBB" */
  color: string;
  /** SF Symbol. */
  symbol: string;
  completed: boolean;
};

const STREAK_RING_DAYS = 30;

/**
 * Todas las metas visibles para que el widget las ofrezca al configurarlo: primero las activas y
 * luego las cumplidas, cada grupo en el orden de la app (la más reciente primero).
 */
export function buildWidgetGoalItems(goals: readonly (WidgetGoal & { color: string; icon: string })[]): WidgetGoalItem[] {
  const visible = goals.filter((goal) => !goal.archived_at);
  const ordered = [...visible.filter((goal) => !goal.completed_at), ...visible.filter((goal) => goal.completed_at)];
  return ordered.map((goal) => ({
    id: goal.id,
    name: goal.name,
    valueText: formatNumber(goal.current),
    unit: goal.unit,
    targetNumberText: formatNumber(goal.target_value),
    percent: Math.round(goal.progress * 100),
    progress: clamp(goal.progress, 0, 1),
    color: goal.color,
    symbol: widgetSymbol(goal.icon),
    completed: goal.completed_at !== null,
  }));
}

/** La meta elegida; si ya no está disponible, la primera activa y luego cualquiera. */
export function selectWidgetGoal<G extends WidgetGoal>(goals: readonly G[], selectedId: string | null): G | null {
  const visible = goals.filter((goal) => !goal.archived_at);
  return (
    visible.find((goal) => goal.id === selectedId) ??
    visible.find((goal) => !goal.completed_at) ??
    visible[0] ??
    null
  );
}

export function buildWidgetSnapshot(goal: WidgetGoal, now: Date): WidgetSnapshot {
  const series = weeklySeries(goal.start_value, goal.entries, now);
  const weekly = weeklyChange(series);
  const delta = goal.current - goal.start_value;
  const streak = streakDays(goal.entries, goal.frequency, now);
  const movingToTarget = (goal.target_value - goal.start_value) * weekly > 0;
  const pace = suggestedPace(goal.target_value, goal.current, goal.deadline ? new Date(goal.deadline) : null, now);

  return {
    goalId: goal.id,
    name: goal.name,
    valueText: formatNumber(goal.current),
    unit: goal.unit,
    percent: Math.round(goal.progress * 100),
    progress: goal.progress,
    changeText: delta === 0 ? strings().widget.noChange : `${delta < 0 ? '▾' : '▴'} ${formatValue(Math.abs(delta), goal.unit)}`,
    targetText: formatValue(goal.target_value, goal.unit),
    targetNumberText: formatNumber(goal.target_value),
    streakDays: streak,
    streakProgress: clamp(streak / STREAK_RING_DAYS, 0, 1),
    weeklyText: formatSigned(weekly),
    weekProgress: !movingToTarget ? 0 : pace ? clamp(Math.abs(weekly / pace), 0, 1) : 1,
    series: series.map((point) => point.value),
    startDateLabel: formatDayMonth(series[0].date),
    startValueLabel: `${formatValue(series[0].value, goal.unit)} · ${formatDayMonth(series[0].date)}`,
  };
}
