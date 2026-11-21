import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState } from 'react-native';

import { subscribeLang } from '@/i18n';
import {
  notificationRoute,
  parseTime,
  planReminders,
  serializeTime,
  type PlannedReminder,
  type TimeOfDay,
} from '@/lib/reminders';

import { isPlusNow, subscribeAccount } from './account';
import { getKv, setKv } from './repo';
import { getAllGoals, subscribeGoals } from './store';

const ENABLED_KEY = 'reminders_enabled';
const DEFAULT_TIME_KEY = 'reminder_default_time';
const RESCHEDULE_DEBOUNCE_MS = 300;

export const areRemindersEnabled = () => getKv(ENABLED_KEY) !== '0';

export function setRemindersEnabled(enabled: boolean) {
  setKv(ENABLED_KEY, enabled ? '1' : '0');
  requestReschedule();
}

export const getDefaultReminderTime = () => parseTime(getKv(DEFAULT_TIME_KEY));

export function setDefaultReminderTime(time: TimeOfDay) {
  setKv(DEFAULT_TIME_KEY, serializeTime(time));
}

export type ReminderPermission = 'granted' | 'undetermined' | 'denied';

export async function getReminderPermission(): Promise<ReminderPermission> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'undetermined' ? 'undetermined' : 'denied';
}

export async function requestReminderPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  requestReschedule();
  return status === 'granted';
}

/** Se llama justo al activar Plus: es el único momento en que se pide sin que el usuario toque un recordatorio. */
export async function requestPermissionOnPlusActivated() {
  if ((await getReminderPermission()) === 'undetermined') await requestReminderPermission();
}

function trigger(reminder: PlannedReminder): Notifications.SchedulableNotificationTriggerInput {
  const { hour, minute, triggerWeekday } = reminder;
  return triggerWeekday === null
    ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute }
    : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: triggerWeekday, hour, minute };
}

let lastSignature: string | null = null;
let debounce: ReturnType<typeof setTimeout> | null = null;
let running = false;
let rerun = false;

async function reschedule() {
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  try {
    // Sin permiso no se intenta programar y tampoco se pide: el aviso solo sale por acción del usuario.
    const permission = await getReminderPermission();
    const planned =
      permission === 'granted' ? planReminders(getAllGoals(), { plus: isPlusNow(), enabled: areRemindersEnabled() }) : [];
    const signature = JSON.stringify(planned);
    if (signature === lastSignature) return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const reminder of planned) {
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body, data: { goalId: reminder.goalId } },
        trigger: trigger(reminder),
      });
    }
    lastSignature = signature;
  } catch {
    lastSignature = null; // Se reintenta en el próximo cambio o al volver a primer plano.
  } finally {
    running = false;
    if (rerun) {
      rerun = false;
      void reschedule();
    }
  }
}

function requestReschedule() {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    debounce = null;
    void reschedule();
  }, RESCHEDULE_DEBOUNCE_MS);
}

let handledResponse: string | null = null;

function openFromNotification(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const key = `${response.notification.request.identifier}:${response.notification.date}`;
  if (key === handledResponse) return;
  handledResponse = key;
  const route = notificationRoute(response.notification.request.content.data?.goalId);
  if (route) router.push(route);
}

/** Debe llamarse con el Stack ya montado: abrir una notificación navega. */
export function initReminders(): () => void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const response = Notifications.addNotificationResponseReceivedListener(openFromNotification);
  openFromNotification(Notifications.getLastNotificationResponse());

  const unsubscribeGoals = subscribeGoals(requestReschedule);
  const unsubscribeAccount = subscribeAccount(requestReschedule);
  // Los textos de las notificaciones cambian con el idioma.
  const unsubscribeLang = subscribeLang(requestReschedule);
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') requestReschedule();
  });
  requestReschedule();

  return () => {
    response.remove();
    unsubscribeGoals();
    unsubscribeAccount();
    unsubscribeLang();
    appState.remove();
  };
}

/** Solo desarrollo: resume lo programado y dispara un aviso real en 5 segundos. */
export async function debugReminders(): Promise<string> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const first = scheduled[0];
  if (first) {
    await Notifications.scheduleNotificationAsync({
      content: { title: first.content.title ?? undefined, body: first.content.body ?? undefined, data: first.content.data },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
    });
    lastSignature = null;
  }
  return `${scheduled.length} programados\n${scheduled
    .map((n) => `${n.content.title}: ${JSON.stringify(n.trigger)}`)
    .join('\n')}`;
}
