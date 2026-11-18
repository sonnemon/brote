import { useMemo, useSyncExternalStore } from 'react';

import type { NewGoalInput } from '@/lib/goalDraft';
import type { GoalUpdate } from '@/lib/goalEdit';
import { computeProgress, currentValue } from '@/lib/progress';

import {
  getKv,
  insertGoal,
  insertLogEntry,
  selectEntries,
  selectGoals,
  setGoalArchived,
  setKv,
  softDeleteGoal,
  updateGoalRow,
  type Entry,
  type Goal,
  type NewEntryInput,
} from './repo';

export type GoalView = Goal & {
  current: number;
  progress: number;
  entries: Entry[];
};

type Snapshot = { goals: GoalView[] };

function load(): Snapshot {
  const entriesByGoal = new Map<string, Entry[]>();
  for (const entry of selectEntries()) {
    const list = entriesByGoal.get(entry.goal_id);
    if (list) list.push(entry);
    else entriesByGoal.set(entry.goal_id, [entry]);
  }
  return {
    goals: selectGoals().map((goal) => {
      const entries = entriesByGoal.get(goal.id) ?? [];
      const current = currentValue(goal.start_value, entries);
      return {
        ...goal,
        entries,
        current,
        progress: computeProgress(goal.start_value, goal.target_value, current),
      };
    }),
  };
}

let snapshot = load();
const listeners = new Set<() => void>();

/** Relee sqlite; lo usa también el sync tras traer cambios remotos. */
export function reloadGoals() {
  snapshot = load();
  listeners.forEach((listener) => listener());
}

let afterWrite: (() => void) | null = null;

/** Registra el aviso de que hubo una escritura local (dispara el sync con debounce). */
export function setAfterWrite(callback: (() => void) | null) {
  afterWrite = callback;
}

function refresh() {
  reloadGoals();
  afterWrite?.();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => snapshot;

export const subscribeGoals = subscribe;

/** Metas activas (no archivadas). */
export function useGoals(): GoalView[] {
  const goals = useSyncExternalStore(subscribe, getSnapshot).goals;
  return useMemo(() => goals.filter((goal) => !goal.archived_at), [goals]);
}

export function useArchivedGoals(): GoalView[] {
  const goals = useSyncExternalStore(subscribe, getSnapshot).goals;
  return useMemo(() => goals.filter((goal) => goal.archived_at), [goals]);
}

export function useGoal(id: string): GoalView | undefined {
  return useGoals().find((goal) => goal.id === id);
}

/** Todas las metas vigentes, para exportar. */
export const getAllGoals = () => snapshot.goals;

/** Meta recién cumplida, en espera de que Detalle muestre la celebración. Solo se entrega una vez. */
let pendingCelebration: string | null = null;

function flagCelebration(goalId: string, justCompleted: boolean) {
  if (justCompleted) pendingCelebration = goalId;
}

export function consumeCelebration(goalId: string): boolean {
  if (pendingCelebration !== goalId) return false;
  pendingCelebration = null;
  return true;
}

export function createGoal(input: NewGoalInput): string {
  const { id, justCompleted } = insertGoal(input);
  flagCelebration(id, justCompleted);
  refresh();
  return id;
}

export function logEntry(input: NewEntryInput) {
  flagCelebration(input.goal_id, insertLogEntry(input));
  refresh();
}

export function updateGoal(goalId: string, update: GoalUpdate) {
  flagCelebration(goalId, updateGoalRow(goalId, update));
  refresh();
}

export function archiveGoal(goalId: string, archived: boolean) {
  setGoalArchived(goalId, archived);
  refresh();
}

export function deleteGoal(goalId: string) {
  softDeleteGoal(goalId);
  refresh();
}

const ONBOARDED_KEY = 'onboarded';

export const isOnboarded = () => getKv(ONBOARDED_KEY) === '1';

export function markOnboarded() {
  setKv(ONBOARDED_KEY, '1');
}
