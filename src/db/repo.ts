import { randomUUID } from 'expo-crypto';

import type { NewGoalInput } from '@/lib/goalDraft';
import type { GoalUpdate } from '@/lib/goalEdit';
import { computeProgress, currentValue, isCompleted, type Direction, type Frequency } from '@/lib/progress';

import { db } from './client';

export type Goal = {
  id: string;
  name: string;
  direction: Direction;
  unit: string;
  color: string;
  icon: string;
  start_value: number;
  target_value: number;
  deadline: string | null;
  frequency: Frequency;
  reminder_weekday: number | null;
  reminder_hour: number | null;
  reminder_minute: number | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Entry = {
  id: string;
  goal_id: string;
  value: number;
  note: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
};

export type NewEntryInput = {
  goal_id: string;
  value: number;
  note: string | null;
  recorded_at: string;
};

/** Todas las metas vigentes, incluidas las archivadas. */
export function selectGoals(): Goal[] {
  return db.getAllSync<Goal>('SELECT * FROM goals WHERE deleted_at IS NULL ORDER BY created_at DESC');
}

/** Registros vigentes, del más reciente al más antiguo. */
export function selectEntries(): Entry[] {
  return db.getAllSync<Entry>(
    'SELECT * FROM entries WHERE deleted_at IS NULL ORDER BY recorded_at DESC, created_at DESC',
  );
}

function insertEntry(input: NewEntryInput, now: string) {
  db.runSync(
    `INSERT INTO entries (id, goal_id, value, note, recorded_at, created_at, updated_at, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    randomUUID(),
    input.goal_id,
    input.value,
    input.note,
    input.recorded_at,
    now,
    now,
  );
}

/**
 * Alinea `completed_at` con el progreso y avisa si la meta acaba de cumplirse.
 * Con `allowReset`, una meta redefinida que ya no llega al 100% vuelve a estar activa.
 */
function syncCompletion(goalId: string, now: string, allowReset = false): boolean {
  const goal = db.getFirstSync<Goal>('SELECT * FROM goals WHERE id = ?', goalId);
  if (!goal) return false;
  const entries = db.getAllSync<Entry>('SELECT * FROM entries WHERE goal_id = ? AND deleted_at IS NULL', goalId);
  const current = currentValue(goal.start_value, entries);
  const done = isCompleted(computeProgress(goal.start_value, goal.target_value, current));
  if (done && !goal.completed_at) {
    db.runSync('UPDATE goals SET completed_at = ?, updated_at = ?, dirty = 1 WHERE id = ?', now, now, goalId);
    return true;
  }
  if (!done && goal.completed_at && allowReset) {
    db.runSync('UPDATE goals SET completed_at = NULL, updated_at = ?, dirty = 1 WHERE id = ?', now, goalId);
  }
  return false;
}

export function insertGoal(input: NewGoalInput): { id: string; justCompleted: boolean } {
  const id = randomUUID();
  const now = new Date().toISOString();
  let justCompleted = false;
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO goals (id, name, direction, unit, color, icon, start_value, target_value, deadline, frequency, reminder_weekday, reminder_hour, reminder_minute, created_at, updated_at, dirty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      id,
      input.name,
      input.direction,
      input.unit,
      input.color,
      input.icon,
      input.start_value,
      input.target_value,
      input.deadline,
      input.frequency,
      input.reminder?.weekday ?? null,
      input.reminder?.hour ?? null,
      input.reminder?.minute ?? null,
      now,
      now,
    );
    if (input.initial_value !== null) {
      insertEntry({ goal_id: id, value: input.initial_value, note: null, recorded_at: now }, now);
      justCompleted = syncCompletion(id, now);
    }
  });
  return { id, justCompleted };
}

/** Devuelve true si este registro cumplió la meta. */
export function insertLogEntry(input: NewEntryInput): boolean {
  const now = new Date().toISOString();
  let justCompleted = false;
  db.withTransactionSync(() => {
    insertEntry(input, now);
    db.runSync('UPDATE goals SET updated_at = ?, dirty = 1 WHERE id = ?', now, input.goal_id);
    justCompleted = syncCompletion(input.goal_id, now);
  });
  return justCompleted;
}

/** Devuelve true si la edición cumplió la meta. */
export function updateGoalRow(goalId: string, update: GoalUpdate): boolean {
  const now = new Date().toISOString();
  let justCompleted = false;
  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE goals SET name = ?, direction = ?, unit = ?, color = ?, icon = ?, start_value = ?, target_value = ?,
       deadline = ?, frequency = ?, reminder_weekday = ?, reminder_hour = ?, reminder_minute = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      update.name,
      update.direction,
      update.unit,
      update.color,
      update.icon,
      update.start_value,
      update.target_value,
      update.deadline,
      update.frequency,
      update.reminder?.weekday ?? null,
      update.reminder?.hour ?? null,
      update.reminder?.minute ?? null,
      now,
      goalId,
    );
    if (update.new_current !== null) {
      insertEntry({ goal_id: goalId, value: update.new_current, note: null, recorded_at: now }, now);
    }
    justCompleted = syncCompletion(goalId, now, true);
  });
  return justCompleted;
}

export function setGoalArchived(goalId: string, archived: boolean) {
  const now = new Date().toISOString();
  db.runSync('UPDATE goals SET archived_at = ?, updated_at = ?, dirty = 1 WHERE id = ?', archived ? now : null, now, goalId);
}

/** Soft delete de la meta y sus registros. */
export function softDeleteGoal(goalId: string) {
  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    db.runSync('UPDATE goals SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?', now, now, goalId);
    db.runSync('UPDATE entries SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE goal_id = ? AND deleted_at IS NULL', now, now, goalId);
  });
}

export function getKv(key: string): string | null {
  return db.getFirstSync<{ value: string | null }>('SELECT value FROM kv WHERE key = ?', key)?.value ?? null;
}

export function setKv(key: string, value: string) {
  db.runSync('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
}

export function deleteKv(key: string) {
  db.runSync('DELETE FROM kv WHERE key = ?', key);
}
