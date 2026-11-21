import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PACKAGE_TYPE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import {
  PurchaseCancelledError,
  PurchasesUnavailableError,
  untilFromEntitlement,
  type PurchasesProvider,
} from '@/lib/purchases';

/** Entitlement que desbloquea Brote Pro en el dashboard de RevenueCat. */
export const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT || 'brote_pro';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

/** Sin clave (p. ej. builds locales sin .env) la app sigue con el stub de desarrollo. */
export const isRevenueCatEnabled = !!API_KEY;

type UntilListener = (until: string | null) => void;

let onUntil: UntilListener = () => {};
let configured = false;

const untilFrom = (info: CustomerInfo) => untilFromEntitlement(info.entitlements.active[ENTITLEMENT_ID]);

function handleInfo(info: CustomerInfo) {
  const until = untilFrom(info);
  onUntil(until);
  return until;
}

/**
 * Configura el SDK una sola vez y avisa cada vez que cambia el entitlement (compra, restauración,
 * Pro regalado desde el dashboard). Devuelve la limpieza.
 */
export function initRevenueCat(listener: UntilListener): () => void {
  if (!API_KEY) return () => {};
  onUntil = listener;
  if (!configured) {
    if (__DEV__) void Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: API_KEY });
    configured = true;
  }
  Purchases.addCustomerInfoUpdateListener(handleInfo);
  void refreshRevenueCat();
  return () => {
    Purchases.removeCustomerInfoUpdateListener(handleInfo);
  };
}

/** Vuelve a leer el entitlement (al abrir la app: así aparece un Pro regalado desde el dashboard). */
export async function refreshRevenueCat() {
  if (!configured) return;
  try {
    handleInfo(await Purchases.getCustomerInfo());
  } catch {
    // Sin red se conserva el último valor guardado.
  }
}

/** Vincula las compras a la cuenta de Supabase, para recuperarlas al cambiar de celular. */
export async function identifyRevenueCat(userId: string | null) {
  if (!configured) return;
  try {
    if (userId) {
      handleInfo((await Purchases.logIn(userId)).customerInfo);
    } else if (!(await Purchases.isAnonymous())) {
      handleInfo(await Purchases.logOut());
    }
  } catch {
    // Se reintenta en el próximo cambio de sesión.
  }
}

async function lifetimePackage(): Promise<PurchasesPackage | null> {
  const offering = (await Purchases.getOfferings()).current;
  if (!offering) return null;
  return offering.lifetime ?? offering.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.LIFETIME) ?? null;
}

/** Precio de la tienda ya formateado en la moneda del usuario (null si no hay oferta). */
export async function getLifetimePriceString(): Promise<string | null> {
  if (!configured) return null;
  try {
    return (await lifetimePackage())?.product.priceString ?? null;
  } catch {
    return null;
  }
}

export function createRevenueCatPurchases(): PurchasesProvider {
  return {
    async purchase() {
      const pkg = await lifetimePackage();
      if (!pkg) throw new PurchasesUnavailableError();
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const until = handleInfo(customerInfo);
        if (!until) throw new Error('Entitlement not active after purchase');
        return until;
      } catch (error) {
        if ((error as { userCancelled?: boolean | null }).userCancelled) throw new PurchaseCancelledError();
        throw error;
      }
    },
    async restore() {
      return handleInfo(await Purchases.restorePurchases());
    },
  };
}
