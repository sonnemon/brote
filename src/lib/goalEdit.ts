import { parseDecimal } from './format';
import { iconForUnit, type IconName } from './goalDraft';
import { isValidRange, round2, type Direction, type Frequency } from './progress';
import type { ReminderConfig } from './reminders';

export type GoalEditDraft = {
  name: string;
  direction: Direction;
  unit: string;
  color: string;
  startText: string;
  targetText: string;
  currentText: string;
  hasDeadline: boolean;
  deadline: Date;
  frequency: Frequency;
  reminder: ReminderConfig | null;
};

export type GoalUpdate = {
  name: string;
  direction: Direction;
  unit: string;
  color: string;
  icon: IconName;
  start_value: number;
  target_value: number;
  deadline: string | null;
  frequency: Frequency;
  reminder: ReminderConfig | null;
  /** Valor de un registro nuevo si el usuario corrigió el valor actual; el historial no se reescribe. */
  new_current: number | null;
};

const NEXT_FREQUENCY: Record<Frequency, Frequency> = { daily: 'weekly', weekly: 'free', free: 'daily' };

export const FREQUENCY_LABELS: Record<Frequency, string> = { daily: 'Diario', weekly: 'Semanal', free: 'Libre' };

export const nextFrequency = (frequency: Frequency) => NEXT_FREQUENCY[frequency];

export function validateEdit(draft: GoalEditDraft): string | null {
  if (draft.name.trim() === '') return 'Ponle un nombre a tu meta.';
  if (draft.unit.trim() === '') return 'Indica una unidad.';
  const start = parseDecimal(draft.startText);
  const target = parseDecimal(draft.targetText);
  if (!Number.isFinite(start) || !Number.isFinite(target)) return 'Completa el valor inicial y el objetivo.';
  if (!isValidRange(draft.direction, start, target)) {
    return draft.direction === 'down'
      ? 'En una meta decreciente, el objetivo debe ser menor que el valor inicial.'
      : 'En una meta creciente, el objetivo debe ser mayor que el valor inicial.';
  }
  if (!Number.isFinite(parseDecimal(draft.currentText))) return 'Indica tu valor actual.';
  return null;
}

export function editToUpdate(draft: GoalEditDraft, previousCurrent: number): GoalUpdate {
  const unit = draft.unit.trim();
  const current = round2(parseDecimal(draft.currentText));
  return {
    name: draft.name.trim(),
    direction: draft.direction,
    unit,
    color: draft.color,
    icon: iconForUnit(unit),
    start_value: parseDecimal(draft.startText),
    target_value: parseDecimal(draft.targetText),
    deadline: draft.hasDeadline ? draft.deadline.toISOString() : null,
    frequency: draft.frequency,
    reminder: draft.reminder,
    new_current: current !== round2(previousCurrent) ? current : null,
  };
}
