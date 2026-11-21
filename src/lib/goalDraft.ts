import { strings } from '../i18n';

import { parseDecimal } from './format';
import { isValidRange, presetValue, type Direction, type Frequency } from './progress';
import type { ReminderConfig } from './reminders';

export type GoalDraft = {
  name: string;
  direction: Direction;
  unit: string;
  color: string;
  /** Clave del icono (ver goalIcons). */
  icon: string;
  /** true mientras el icono siga la sugerencia del nombre; false cuando el usuario lo eligió. */
  iconAuto: boolean;
  startText: string;
  targetText: string;
  hasProgress: boolean;
  /** Atajo elegido (0, 0.25, 0.5, 0.75); null si el valor actual es libre. */
  presetFraction: number | null;
  currentText: string;
  hasDeadline: boolean;
  deadline: Date;
  frequency: Frequency;
  reminder: ReminderConfig | null;
};

export type NewGoalInput = {
  name: string;
  direction: Direction;
  unit: string;
  color: string;
  icon: string;
  start_value: number;
  target_value: number;
  deadline: string | null;
  frequency: Frequency;
  reminder: ReminderConfig | null;
  /** Valor del primer registro cuando el usuario ya tiene avance. */
  initial_value: number | null;
};

export function validateWhat(draft: GoalDraft): string | null {
  if (draft.name.trim() === '') return strings().validation.name;
  if (draft.unit.trim() === '') return strings().validation.unit;
  return null;
}

/** Valor actual efectivo del borrador: atajo, valor libre o el inicial. */
export function draftCurrent(draft: GoalDraft): number {
  const start = parseDecimal(draft.startText);
  if (!draft.hasProgress) return start;
  if (draft.presetFraction !== null) {
    return presetValue(start, parseDecimal(draft.targetText), draft.presetFraction);
  }
  return parseDecimal(draft.currentText);
}

export function validateFrom(draft: GoalDraft): string | null {
  const start = parseDecimal(draft.startText);
  const target = parseDecimal(draft.targetText);
  if (!Number.isFinite(start) || !Number.isFinite(target)) return strings().validation.values;
  if (!isValidRange(draft.direction, start, target)) {
    return draft.direction === 'down'
      ? strings().validation.downRange
      : strings().validation.upRange;
  }
  const current = draftCurrent(draft);
  if (!Number.isFinite(current)) return strings().validation.current;
  if (current < Math.min(start, target) || current > Math.max(start, target)) {
    return strings().validation.currentRange;
  }
  return null;
}

export function draftToInput(draft: GoalDraft): NewGoalInput {
  const start = parseDecimal(draft.startText);
  const current = draftCurrent(draft);
  const unit = draft.unit.trim();
  return {
    name: draft.name.trim(),
    direction: draft.direction,
    unit,
    color: draft.color,
    icon: draft.icon,
    start_value: start,
    target_value: parseDecimal(draft.targetText),
    deadline: draft.hasDeadline ? draft.deadline.toISOString() : null,
    frequency: draft.frequency,
    reminder: draft.reminder,
    initial_value: current !== start ? current : null,
  };
}
