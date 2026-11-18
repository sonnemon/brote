import { CURRENCY_UNIT, parseDecimal } from './format';
import { isValidRange, presetValue, type Direction, type Frequency } from './progress';
import type { ReminderConfig } from './reminders';

export type IconName = 'scale' | 'wallet' | 'book' | 'route' | 'clock' | 'percent' | 'star';

export type GoalDraft = {
  name: string;
  direction: Direction;
  unit: string;
  color: string;
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
  icon: IconName;
  start_value: number;
  target_value: number;
  deadline: string | null;
  frequency: Frequency;
  reminder: ReminderConfig | null;
  /** Valor del primer registro cuando el usuario ya tiene avance. */
  initial_value: number | null;
};

export function iconForUnit(unit: string): IconName {
  if (unit === 'kg') return 'scale';
  if (unit === CURRENCY_UNIT) return 'wallet';
  if (unit === 'páginas' || unit === 'libros') return 'book';
  if (unit === 'km') return 'route';
  if (unit === 'horas') return 'clock';
  if (unit === '%') return 'percent';
  return 'star';
}

export function validateWhat(draft: GoalDraft): string | null {
  if (draft.name.trim() === '') return 'Ponle un nombre a tu meta.';
  if (draft.unit.trim() === '') return 'Elige una unidad.';
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
  if (!Number.isFinite(start) || !Number.isFinite(target)) return 'Completa el valor inicial y el objetivo.';
  if (!isValidRange(draft.direction, start, target)) {
    return draft.direction === 'down'
      ? 'En una meta decreciente, el objetivo debe ser menor que el valor inicial.'
      : 'En una meta creciente, el objetivo debe ser mayor que el valor inicial.';
  }
  const current = draftCurrent(draft);
  if (!Number.isFinite(current)) return 'Indica tu valor actual.';
  if (current < Math.min(start, target) || current > Math.max(start, target)) {
    return 'Tu valor actual debe estar entre el inicial y el objetivo.';
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
    icon: iconForUnit(unit),
    start_value: start,
    target_value: parseDecimal(draft.targetText),
    deadline: draft.hasDeadline ? draft.deadline.toISOString() : null,
    frequency: draft.frequency,
    reminder: draft.reminder,
    initial_value: current !== start ? current : null,
  };
}
