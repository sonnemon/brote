const DAY_MS = 86_400_000;

export type PlanId = 'lifetime';

/** Días de prueba gratis desde la primera vez que se abre la app. */
export const TRIAL_DAYS = 7;

/** Una compra de por vida se guarda como una fecha "infinita" para reutilizar isPlusActive. */
export const LIFETIME_UNTIL = '9999-12-31T00:00:00.000Z';

/** Precio de lista; con RevenueCat vendrá localizado desde App Store. Soles en Perú, dólares en el resto. */
export function lifetimePrice(currencyCode: string | null | undefined): string {
  return currencyCode === 'PEN' ? 'S/ 49.90' : 'US$12.99';
}

export function trialEndsAt(startedAt: string): Date {
  return new Date(new Date(startedAt).getTime() + TRIAL_DAYS * DAY_MS);
}

export function isTrialActive(startedAt: string, now: Date): boolean {
  return now < trialEndsAt(startedAt);
}

/** Días que quedan de prueba, redondeando hacia arriba (el último día cuenta como 1). 0 si ya terminó. */
export function trialDaysLeft(startedAt: string, now: Date): number {
  const ms = trialEndsAt(startedAt).getTime() - now.getTime();
  return ms > 0 ? Math.ceil(ms / DAY_MS) : 0;
}

/** Contrato que implementará RevenueCat. Ambos métodos devuelven hasta cuándo dura Plus. */
export interface PurchasesProvider {
  purchase(plan: PlanId): Promise<string>;
  restore(): Promise<string | null>;
}

export class PurchasesUnavailableError extends Error {}

/** El usuario cerró la hoja de compra de la tienda: no es un error que haya que mostrar. */
export class PurchaseCancelledError extends Error {}

/**
 * Convierte el entitlement de RevenueCat en "hasta cuándo dura Pro".
 * Sin entitlement activo, null; de por vida (sin vencimiento), LIFETIME_UNTIL.
 */
export function untilFromEntitlement(entitlement: { expirationDate: string | null } | undefined): string | null {
  if (!entitlement) return null;
  return entitlement.expirationDate ?? LIFETIME_UNTIL;
}

export type DevStorage = {
  get(): string | null;
  set(value: string): void;
};

/** Stub de desarrollo: simula la compra de por vida sin cobrar. Nunca debe usarse en producción. */
export function createDevPurchases(storage: DevStorage): PurchasesProvider {
  return {
    async purchase() {
      storage.set(LIFETIME_UNTIL);
      return LIFETIME_UNTIL;
    },
    async restore() {
      return storage.get();
    },
  };
}

/** Lo que usa un build de producción hasta integrar RevenueCat: no concede Plus. */
export function createUnavailablePurchases(): PurchasesProvider {
  const fail = async (): Promise<never> => {
    throw new PurchasesUnavailableError();
  };
  return { purchase: fail, restore: fail };
}

export function isPlusActive(plusUntil: string | null, now: Date): boolean {
  return plusUntil !== null && new Date(plusUntil).getTime() > now.getTime();
}

/** La fecha más lejana entre varias fuentes de Plus. */
export function latestPlusUntil(...values: (string | null)[]): string | null {
  return values.reduce<string | null>((best, value) => {
    if (value === null) return best;
    return best === null || new Date(value) > new Date(best) ? value : best;
  }, null);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
