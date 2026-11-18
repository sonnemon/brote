import { ExtensionStorage } from '@bacons/apple-targets';
import { AppState } from 'react-native';

import { buildWidgetSnapshot, selectWidgetGoal } from '@/lib/widgetData';

import { getKv, setKv } from './repo';
import { getAllGoals, subscribeGoals } from './store';

const APP_GROUP = 'group.pe.orbe.app';
const STORAGE_KEY = 'widget_snapshot';
const SELECTED_KEY = 'widget_goal_id';
const DEBOUNCE_MS = 500;

const storage = new ExtensionStorage(APP_GROUP);

export const getWidgetGoalId = () => getKv(SELECTED_KEY);

export function setWidgetGoalId(goalId: string) {
  setKv(SELECTED_KEY, goalId);
  publish();
}

/** La meta que muestran los widgets ahora mismo. */
export const getCurrentWidgetGoal = () => selectWidgetGoal(getAllGoals(), getWidgetGoalId());

let lastPayload: string | null = null;
let debounce: ReturnType<typeof setTimeout> | null = null;

function publish() {
  const goal = getCurrentWidgetGoal();
  const payload = goal ? JSON.stringify(buildWidgetSnapshot(goal, new Date())) : '';
  if (payload === lastPayload) return;
  storage.set(STORAGE_KEY, payload);
  ExtensionStorage.reloadWidget();
  lastPayload = payload;
}

function requestPublish() {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(publish, DEBOUNCE_MS);
}

export function initWidgets(): () => void {
  const unsubscribe = subscribeGoals(requestPublish);
  // Al abrir la app se recalculan la racha y la ventana de 8 semanas.
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') requestPublish();
  });
  requestPublish();
  return () => {
    unsubscribe();
    appState.remove();
  };
}
