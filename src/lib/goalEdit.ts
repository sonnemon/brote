import { strings } from '../i18n';

import { parseDecimal } from './format';
import { isValidRange, round2, type Direction, type Frequency } from './progress';
import type { ReminderConfig } from './reminders';

export type GoalEditDraft = {
  name: string;
  direction: Direction;
  unit: string;
  color: string;
  icon: string;
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
  icon: string;
  start_value: number;
  target_value: number;
  deadline: string | null;
  frequency: Frequency;
  reminder: ReminderConfig | null;
  /** Valor de un registro nuevo si el usuario corrigió el valor actual; el historial no se reescribe. */
  new_current: number | null;
};

const NEXT_FREQUENCY: Record<Frequency, Frequency> = { daily: 'weekly', weekly: 'free', free: 'daily' };

export const nextFrequency = (frequency: Frequency) => NEXT_FREQUENCY[frequency];

export function validateEdit(draft: GoalEditDraft): string | null {
  if (draft.name.trim() === '') return strings().validation.name;
  if (draft.unit.trim() === '') return strings().validation.unitEdit;
  const start = parseDecimal(draft.startText);
  const target = parseDecimal(draft.targetText);
  if (!Number.isFinite(start) || !Number.isFinite(target)) return strings().validation.values;
  if (!isValidRange(draft.direction, start, target)) {
    return draft.direction === 'down'
      ? strings().validation.downRange
      : strings().validation.upRange;
  }
  if (!Number.isFinite(parseDecimal(draft.currentText))) return strings().validation.current;
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
    icon: draft.icon,
    start_value: parseDecimal(draft.startText),
    target_value: parseDecimal(draft.targetText),
    deadline: draft.hasDeadline ? draft.deadline.toISOString() : null,
    frequency: draft.frequency,
    reminder: draft.reminder,
    new_current: current !== round2(previousCurrent) ? current : null,
  };
}
