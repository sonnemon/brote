import { ExtensionStorage } from '@bacons/apple-targets';
import { AppState } from 'react-native';

import { getLang, subscribeLang } from '@/i18n';
import { buildWidgetSnapshot, selectWidgetGoal } from '@/lib/widgetData';

import { getAccount, subscribeAccount } from './account';
import { getKv, setKv } from './repo';
import { getAllGoals, subscribeGoals } from './store';

const APP_GROUP = 'group.pe.orbe.app';
const STORAGE_KEY = 'widget_snapshot';
const SELECTED_KEY = 'widget_goal_id';
/** Idioma de la app; el widget lo lee para sus propios textos (es / en). */
const LANG_KEY = 'widget_lang';
/** Hasta cuándo los widgets muestran datos (fin de la prueba o compra). Vacío = bloqueados. */
const PRO_UNTIL_KEY = 'widget_pro_until';
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
  const lang = getLang();
  const proUntil = getAccount().proUntil ?? '';
  const payload = goal ? JSON.stringify(buildWidgetSnapshot(goal, new Date())) : '';
  const signature = [payload, lang, proUntil].join('|');
  if (signature === lastPayload) return;
  storage.set(LANG_KEY, lang);
  storage.set(PRO_UNTIL_KEY, proUntil);
  storage.set(STORAGE_KEY, payload);
  ExtensionStorage.reloadWidget();
  lastPayload = signature;
}

function requestPublish() {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(publish, DEBOUNCE_MS);
}

export function initWidgets(): () => void {
  const unsubscribe = subscribeGoals(requestPublish);
  const unsubscribeLang = subscribeLang(requestPublish);
  const unsubscribeAccount = subscribeAccount(requestPublish);
  // Al abrir la app se recalculan la racha y la ventana de 8 semanas.
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') requestPublish();
  });
  requestPublish();
  return () => {
    unsubscribe();
    unsubscribeLang();
    unsubscribeAccount();
    appState.remove();
  };
}
