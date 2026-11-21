import { strings } from '../i18n';

import { formatValue } from './format';
import { elapsedDays, type Direction } from './progress';

type CompletionInput = {
  direction: Direction;
  unit: string;
  start_value: number;
  target_value: number;
  created_at: string;
  completed_at: string | null;
};

function formatDuration(days: number): string {
  const common = strings().common;
  if (days < 14) return common.days(days);
  return common.weeks(Math.round(days / 7));
}

export function completionDays(goal: CompletionInput, now: Date): number {
  return elapsedDays(new Date(goal.created_at), goal.completed_at ? new Date(goal.completed_at) : now);
}

/** "Llegaste a 72 kg. Bajaste 13 kg en 14 semanas." */
export function completionSummary(goal: CompletionInput, now: Date): string {
  const change = formatValue(Math.abs(goal.target_value - goal.start_value), goal.unit);
  const duration = formatDuration(completionDays(goal, now));
  return strings().completed.summary(formatValue(goal.target_value, goal.unit), goal.direction === 'down', change, duration);
}
