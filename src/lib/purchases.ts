export type PlanId = 'annual' | 'monthly';

export type Plan = {
  id: PlanId;
  title: string;
  price: string;
  note?: string;
  badge?: string;
  cta: string;
};

/** Precios de lista; con RevenueCat vendrán de las offerings de App Store. */
export const PLANS: readonly Plan[] = [
  { id: 'annual', title: 'Anual', price: 'S/ 59.90', note: 'S/ 4.99 al mes', badge: 'AHORRA 50%', cta: 'Activar Plus anual' },
  { id: 'monthly', title: 'Mensual', price: 'S/ 9.90', cta: 'Activar Plus mensual' },
];

/** Contrato que implementará RevenueCat. Ambos métodos devuelven hasta cuándo dura Plus. */
export interface PurchasesProvider {
  purchase(plan: PlanId): Promise<string>;
  restore(): Promise<string | null>;
}

export class PurchasesUnavailableError extends Error {}

export type DevStorage = {
  get(): string | null;
  set(value: string): void;
};

const DAY_MS = 86_400_000;

/** Stub de desarrollo: simula la compra sin cobrar. Nunca debe usarse en producción. */
export function createDevPurchases(storage: DevStorage, now: () => Date = () => new Date()): PurchasesProvider {
  return {
    async purchase(plan) {
      const days = plan === 'annual' ? 365 : 30;
      const until = new Date(now().getTime() + days * DAY_MS).toISOString();
      storage.set(until);
      return until;
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
