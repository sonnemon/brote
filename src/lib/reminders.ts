import { strings } from '../i18n';

import { formatCurrentOfTarget } from './format';
import type { Frequency } from './progress';

/** `weekday` usa 0 = domingo … 6 = sábado; null significa todos los días. */
export type ReminderConfig = {
  weekday: number | null;
  hour: number;
  minute: number;
};

export type TimeOfDay = { hour: number; minute: number };

export const DEFAULT_REMINDER_TIME: TimeOfDay = { hour: 7, minute: 0 };

/** iOS solo conserva 64 notificaciones programadas por app. */
export const MAX_SCHEDULED = 64;

/** La semana empieza en lunes, como en el calendario peruano. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function weekdayOptions(): { value: number; label: string; name: string }[] {
  const s = strings();
  return WEEK_ORDER.map((value) => ({ value, label: s.weekdayLetters[value], name: s.weekdays[value] }));
}

export function defaultReminder(frequency: Frequency, now: Date, time: TimeOfDay): ReminderConfig {
  return { weekday: frequency === 'daily' ? null : now.getDay(), ...time };
}

export function serializeTime({ hour, minute }: TimeOfDay): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function parseTime(text: string | null): TimeOfDay {
  const match = text?.match(/^(\d{2}):(\d{2})$/);
  if (!match) return DEFAULT_REMINDER_TIME;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export function reminderFromColumns(goal: {
  reminder_weekday: number | null;
  reminder_hour: number | null;
  reminder_minute: number | null;
}): ReminderConfig | null {
  if (goal.reminder_hour === null) return null;
  return { weekday: goal.reminder_weekday, hour: goal.reminder_hour, minute: goal.reminder_minute ?? 0 };
}

export type ReminderGoal = {
  id: string;
  name: string;
  unit: string;
  target_value: number;
  current: number;
  completed_at: string | null;
  archived_at: string | null;
  reminder_weekday: number | null;
  reminder_hour: number | null;
  reminder_minute: number | null;
};

export type PlannedReminder = {
  goalId: string;
  title: string;
  body: string;
  /** Para el trigger: 1 = domingo … 7 = sábado; null programa uno diario. */
  triggerWeekday: number | null;
  hour: number;
  minute: number;
};

export function reminderContent(goal: ReminderGoal): { title: string; body: string } {
  return {
    title: goal.name,
    body: strings().reminders.body(formatCurrentOfTarget(goal.current, goal.target_value, goal.unit)),
  };
}

/** Lo que debería estar programado. Sin Plus o con el interruptor apagado, nada. */
export function planReminders(
  goals: readonly ReminderGoal[],
  options: { plus: boolean; enabled: boolean },
): PlannedReminder[] {
  if (!options.plus || !options.enabled) return [];
  const planned: PlannedReminder[] = [];
  for (const goal of goals) {
    const config = reminderFromColumns(goal);
    if (!config || goal.completed_at || goal.archived_at) continue;
    planned.push({
      goalId: goal.id,
      ...reminderContent(goal),
      triggerWeekday: config.weekday === null ? null : config.weekday + 1,
      hour: config.hour,
      minute: config.minute,
    });
  }
  return planned.slice(0, MAX_SCHEDULED);
}

/** Ruta que abre una notificación; ignora cualquier dato que no sea una meta. */
export function notificationRoute(goalId: unknown): `/goal/${string}` | null {
  return typeof goalId === 'string' && /^[0-9a-f-]{36}$/i.test(goalId) ? `/goal/${goalId}` : null;
}
