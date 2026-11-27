import type { Session } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import {
  createDevPurchases,
  createUnavailablePurchases,
  isPlusActive,
  isReviewEmail,
  isTrialActive,
  latestPlusUntil,
  trialDaysLeft,
  trialEndsAt,
  type PlanId,
  type PurchasesProvider,
} from '@/lib/purchases';

import { deleteKv, getKv, setKv } from './repo';
import {
  createRevenueCatPurchases,
  identifyRevenueCat,
  initRevenueCat,
  isRevenueCatEnabled,
  refreshRevenueCat,
} from './revenuecat';
import { reloadGoals, setAfterWrite } from './store';
import { supabase } from './supabase';
import { clearLocalData, forgetSyncUser, hasUnbackedChanges, performSync } from './sync';

const DEV_PLUS_KEY = 'dev_plus_until';
const SERVER_PLUS_KEY = 'server_plus_until';
const LAST_SYNC_KEY = 'last_sync_at';
const TRIAL_KEY = 'trial_started_at';
/** Último entitlement conocido de RevenueCat, para arrancar sin red. */
const STORE_PLUS_KEY = 'store_plus_until';
const WRITE_DEBOUNCE_MS = 1500;

export type SyncStatus = 'idle' | 'syncing' | 'error';

export type Account = {
  /** Pro activo: comprado o dentro de la prueba gratis. */
  isPlus: boolean;
  /** Compró Pro (de por vida o desde el servidor). */
  purchased: boolean;
  /** Días de prueba que quedan; 0 si terminó. Sin uso si ya compró. */
  trialDaysLeft: number;
  /** Hasta cuándo dura Pro (fin de prueba o de la compra); null si ya venció. Lo usan los widgets. */
  proUntil: string | null;
  email: string | null;
  cloudConfigured: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
};

/**
 * RevenueCat si hay clave configurada. Sin clave, el stub de desarrollo (que nunca existe en
 * producción) o, en un build de producción, ninguna compra posible.
 */
const purchases: PurchasesProvider = isRevenueCatEnabled
  ? createRevenueCatPurchases()
  : __DEV__
    ? createDevPurchases({ get: () => getKv(DEV_PLUS_KEY), set: (value) => setKv(DEV_PLUS_KEY, value) })
    : createUnavailablePurchases();

let session: Session | null = null;
let syncStatus: SyncStatus = 'idle';

/** La prueba empieza la primera vez que se abre la app (o la primera vez tras esta versión). */
function trialStartedAt(): string {
  let started = getKv(TRIAL_KEY);
  if (!started) {
    started = new Date().toISOString();
    setKv(TRIAL_KEY, started);
  }
  return started;
}

/** Pro comprado: tienda (RevenueCat), servidor (plus_until en Supabase) o stub de desarrollo. */
function purchasedUntil(): string | null {
  const dev = __DEV__ && !isRevenueCatEnabled ? getKv(DEV_PLUS_KEY) : null;
  return latestPlusUntil(dev, getKv(SERVER_PLUS_KEY), getKv(STORE_PLUS_KEY));
}

function setStoreUntil(until: string | null) {
  if (until === getKv(STORE_PLUS_KEY)) return;
  if (until) setKv(STORE_PLUS_KEY, until);
  else deleteKv(STORE_PLUS_KEY);
  publish();
  requestSync();
}

function computePlus(): boolean {
  const now = new Date();
  return isPlusActive(purchasedUntil(), now) || isTrialActive(trialStartedAt(), now);
}

function compute(): Account {
  const now = new Date();
  const until = purchasedUntil();
  const purchased = isPlusActive(until, now);
  const trialEnd = trialEndsAt(trialStartedAt());
  const inTrial = trialEnd > now;
  return {
    isPlus: purchased || inTrial,
    purchased,
    trialDaysLeft: trialDaysLeft(trialStartedAt(), now),
    proUntil: purchased ? until : inTrial ? trialEnd.toISOString() : null,
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

export const getAccount = () => snapshot;

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
  // Las compras siguen a la cuenta: al entrar en otro celular se recupera Pro. Se identifica antes de
  // avisar, para que la pantalla vea la sesión y el Pro de esa cuenta a la vez.
  if (changedUser) await identifyRevenueCat(next?.user.id ?? null);
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
  const stopRevenueCat = initRevenueCat(setStoreUntil);

  // Dentro del callback de auth no se puede llamar a Supabase sin riesgo de bloqueo: se difiere.
  const authSubscription = supabase?.auth.onAuthStateChange((_event, next) => {
    setTimeout(() => void onSessionChanged(next), 0);
  });

  if (supabase) supabase.auth.startAutoRefresh();

  // Al terminar la prueba con la app abierta, se bloquea Pro en ese momento.
  const msToTrialEnd = trialEndsAt(trialStartedAt()).getTime() - Date.now();
  const trialTimer = msToTrialEnd > 0 && msToTrialEnd < 2 ** 31 - 1 ? setTimeout(publish, msToTrialEnd + 1000) : null;

  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase?.auth.startAutoRefresh();
      publish(); // Recalcula la prueba aunque no haya red.
      void refreshRevenueCat();
      void refreshProfile().then(publish);
      requestSync();
    } else {
      supabase?.auth.stopAutoRefresh();
    }
  });

  return () => {
    setAfterWrite(null);
    stopRevenueCat();
    if (trialTimer) clearTimeout(trialTimer);
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

/** Solo desarrollo: da la prueba por terminada (o la reinicia) para probar el bloqueo. */
export function setDevTrialEnded(ended: boolean) {
  if (!__DEV__) return;
  setKv(TRIAL_KEY, new Date(Date.now() - (ended ? 8 : 0) * 86_400_000).toISOString());
  publish();
}

// --- Cuenta ---------------------------------------------------------------

export class CloudNotConfiguredError extends Error {}

function requireClient() {
  if (!supabase) throw new CloudNotConfiguredError();
  return supabase;
}

export async function sendEmailCode(email: string) {
  // La cuenta de revisión entra con contraseña: no se envía código.
  if (isReviewEmail(email)) {
    requireClient();
    return;
  }
  const { error } = await requireClient().auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string) {
  if (isReviewEmail(email)) {
    const { error } = await requireClient().auth.signInWithPassword({ email: email.trim(), password: token });
    if (error) throw error;
    return;
  }
  const { error } = await requireClient().auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
  if (error) throw error;
}

async function waitForSync() {
  while (running) await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Antes de cerrar sesión: sube lo pendiente. Devuelve false si queda algo sin respaldar (sin red o sin
 * Pro), para avisar que se perderá.
 */
export async function syncBeforeSignOut(): Promise<boolean> {
  if (!session) return true;
  if (debounce) {
    clearTimeout(debounce);
    debounce = null;
  }
  await waitForSync();
  await runSyncNow();
  await waitForSync();
  return session ? !hasUnbackedChanges(session.user.id) : true;
}

/** Cierra la sesión y quita las metas del celular: son de la cuenta y siguen en su respaldo. */
export async function signOut() {
  if (debounce) {
    clearTimeout(debounce);
    debounce = null;
  }
  await waitForSync();
  await requireClient().auth.signOut({ scope: 'local' });
  clearLocalData();
  deleteKv(SERVER_PLUS_KEY);
  deleteKv(LAST_SYNC_KEY);
  reloadGoals();
  publish();
}

/**
 * Borra la cuenta y su respaldo en la nube (metas, registros y perfil, por cascade en el servidor).
 * Las metas de este celular se conservan, como al cerrar sesión. La compra de Pro sigue ligada a la
 * cuenta de la tienda y se puede restaurar.
 */
export async function deleteAccount() {
  const client = requireClient();
  if (debounce) {
    clearTimeout(debounce);
    debounce = null;
  }
  const { error } = await client.rpc('delete_my_account');
  if (error) throw error;
  // El usuario ya no existe: se limpia la sesión local sin llamar al servidor.
  await client.auth.signOut({ scope: 'local' });
  // Las metas se quedan en el celular, sin dueño: si entra otra cuenta, se suben a ella.
  forgetSyncUser();
  deleteKv(SERVER_PLUS_KEY);
  deleteKv(LAST_SYNC_KEY);
  publish();
}
