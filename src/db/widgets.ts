import { ExtensionStorage } from '@bacons/apple-targets';
import { AppState } from 'react-native';

import { getLang, subscribeLang } from '@/i18n';
import { buildWidgetGoalItems, buildWidgetSnapshot, selectWidgetGoal } from '@/lib/widgetData';

import { getAccount, subscribeAccount } from './account';
import { getKv, setKv } from './repo';
import { getAllGoals, subscribeGoals } from './store';

const APP_GROUP = 'group.pe.brote.app';
const STORAGE_KEY = 'widget_snapshot';
const SELECTED_KEY = 'widget_goal_id';
/** Todas las metas, para el widget "Mis metas" y para elegir cuáles muestra al configurarlo. */
const GOALS_KEY = 'widget_goals';
/** Detalle de cada meta (id → snapshot), para los widgets de una meta configurados con otra meta. */
const SNAPSHOTS_KEY = 'widget_snapshots';
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
  const all = getAllGoals();
  const goalsPayload = JSON.stringify(buildWidgetGoalItems(all));
  const now = new Date();
  const snapshotsPayload = JSON.stringify(
    Object.fromEntries(all.filter((g) => !g.archived_at).map((g) => [g.id, buildWidgetSnapshot(g, now)])),
  );
  const signature = [payload, goalsPayload, snapshotsPayload, lang, proUntil].join('|');
  if (signature === lastPayload) return;
  storage.set(LANG_KEY, lang);
  storage.set(PRO_UNTIL_KEY, proUntil);
  storage.set(STORAGE_KEY, payload);
  storage.set(GOALS_KEY, goalsPayload);
  storage.set(SNAPSHOTS_KEY, snapshotsPayload);
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
