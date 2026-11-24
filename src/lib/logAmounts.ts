import { round2 } from './progress';

/** Cómo se registra un avance: cuánto sumas (ahorro, km, libros) o el valor total (peso). */
export type LogMode = 'add' | 'total';

/** Las metas que suben se registran sumando; las que bajan (como el peso) con el valor total. */
export function defaultLogMode(startValue: number, targetValue: number): LogMode {
  return targetValue >= startValue ? 'add' : 'total';
}

/**
 * Cuánto sumó el último registro. Las entradas guardan el valor total y vienen de la más reciente
 * a la más antigua. Nulo si no hay registros o el último no sumó nada.
 */
export function lastAddedAmount(startValue: number, entries: readonly { value: number }[]): number | null {
  if (entries.length === 0) return null;
  const previous = entries.length > 1 ? entries[1].value : startValue;
  const amount = round2(entries[0].value - previous);
  return amount > 0 ? amount : null;
}

/** Cantidades rápidas: 1, 5 y 10 veces el paso de la unidad, más lo último que sumaste. */
export function quickAmounts(step: number, lastAmount: number | null): number[] {
  const presets = [step, step * 5, step * 10].map(round2);
  if (lastAmount !== null && !presets.includes(lastAmount)) presets.push(lastAmount);
  return presets;
}
