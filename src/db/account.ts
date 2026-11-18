import type { Session } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import {
  createDevPurchases,
  createUnavailablePurchases,
  isPlusActive,
  latestPlusUntil,
  type PlanId,
  type PurchasesProvider,
} from '@/lib/purchases';

import { deleteKv, getKv, setKv } from './repo';
import { reloadGoals, setAfterWrite } from './store';
import { supabase } from './supabase';
import { performSync } from './sync';

const DEV_PLUS_KEY = 'dev_plus_until';
const SERVER_PLUS_KEY = 'server_plus_until';
const LAST_SYNC_KEY = 'last_sync_at';
const WRITE_DEBOUNCE_MS = 1500;

export type SyncStatus = 'idle' | 'syncing' | 'error';

export type Account = {
  isPlus: boolean;
  email: string | null;
  cloudConfigured: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
};

/** El stub solo existe en desarrollo: un build de producción nunca concede Plus gratis. */
const purchases: PurchasesProvider = __DEV__
  ? createDevPurchases({ get: () => getKv(DEV_PLUS_KEY), set: (value) => setKv(DEV_PLUS_KEY, value) })
  : createUnavailablePurchases();

let session: Session | null = null;
let syncStatus: SyncStatus = 'idle';

function computePlus(): boolean {
  const dev = __DEV__ ? getKv(DEV_PLUS_KEY) : null;
  return isPlusActive(latestPlusUntil(dev, getKv(SERVER_PLUS_KEY)), new Date());
}

function compute(): Account {
  return {
    isPlus: computePlus(),
    email: session?.user.email ?? null,
    cloudConfigured: supabase !== null,
    syncStatus,
    lastSyncAt: getKv(LAST_SYNC_KEY),
  };
}

let snapshot = compute();
const listeners = new Set<() => void>();

function publish() {
  snapshot = compute();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const subscribeAccount = subscribe;

export function useAccount(): Account {
  return useSyncExternalStore(subscribe, () => snapshot);
}

export const isPlusNow = () => snapshot.isPlus;

// --- Sincronización -------------------------------------------------------

let debounce: ReturnType<typeof setTimeout> | null = null;
let running = false;
let rerun = false;

async function runSyncNow() {
  if (!supabase || !session || !computePlus()) return;
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  syncStatus = 'syncing';
  publish();
  try {
    const { pulled } = await performSync(supabase, session.user.id);
    if (pulled > 0) reloadGoals();
    setKv(LAST_SYNC_KEY, new Date().toISOString());
    syncStatus = 'idle';
  } catch {
    // Lo pendiente sigue marcado con dirty y se reintenta en el próximo disparador.
    syncStatus = 'error';
  } finally {
    running = false;
    publish();
    if (rerun) {
      rerun = false;
      void runSyncNow();
    }
  }
}

export function requestSync(delayMs = 0) {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    debounce = null;
    void runSyncNow();
  }, delayMs);
}

async function refreshProfile() {
  if (!supabase || !session) return;
  const { data, error } = await supabase
    .from('profiles')
    .select('plus_until')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (error) return; // Sin red se conserva el último valor conocido.
  if (data?.plus_until) setKv(SERVER_PLUS_KEY, data.plus_until);
  else deleteKv(SERVER_PLUS_KEY);
}

async function onSessionChanged(next: Session | null) {
  const changedUser = next?.user.id !== session?.user.id;
  session = next;
  publish();
  if (next && changedUser) {
    await refreshProfile();
    publish();
    requestSync();
  }
}

/** Arranca sesión, disparadores de sync y escucha de foreground. Devuelve la limpieza. */
export function initAccount(): () => void {
  setAfterWrite(() => requestSync(WRITE_DEBOUNCE_MS));

  // Dentro del callback de auth no se puede llamar a Supabase sin riesgo de bloqueo: se difiere.
  const authSubscription = supabase?.auth.onAuthStateChange((_event, next) => {
    setTimeout(() => void onSessionChanged(next), 0);
  });

  if (supabase) supabase.auth.startAutoRefresh();

  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase?.auth.startAutoRefresh();
      void refreshProfile().then(publish);
      requestSync();
    } else {
      supabase?.auth.stopAutoRefresh();
    }
  });

  return () => {
    setAfterWrite(null);
    authSubscription?.data.subscription.unsubscribe();
    appState.remove();
  };
}

// --- Compras --------------------------------------------------------------

export async function purchasePlan(plan: PlanId) {
  await purchases.purchase(plan);
  publish();
  requestSync();
}

/** Devuelve true si había una compra vigente. */
export async function restorePurchases(): Promise<boolean> {
  const until = await purchases.restore();
  publish();
  return isPlusActive(until, new Date());
}

export function clearDevPlus() {
  if (!__DEV__) return;
  deleteKv(DEV_PLUS_KEY);
  publish();
}

// --- Cuenta ---------------------------------------------------------------

export class CloudNotConfiguredError extends Error {}

function requireClient() {
  if (!supabase) throw new CloudNotConfiguredError();
  return supabase;
}

export async function sendEmailCode(email: string) {
  const { error } = await requireClient().auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string) {
  const { error } = await requireClient().auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
  if (error) throw error;
}

/** Cierra la sesión; los datos siguen en el celular. */
export async function signOut() {
  await requireClient().auth.signOut({ scope: 'local' });
  deleteKv(SERVER_PLUS_KEY);
  publish();
}
