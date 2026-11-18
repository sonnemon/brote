export type Direction = 'up' | 'down';
export type Frequency = 'daily' | 'weekly' | 'free';

export type EntryPoint = {
  value: number;
  recorded_at: string;
  created_at: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Redondea a 2 decimales para evitar ruido de coma flotante. */
export const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** progreso = clamp((actual − inicial) / (objetivo − inicial), 0, 1) */
export function computeProgress(start: number, target: number, current: number): number {
  if (target === start) return 0;
  return clamp((current - start) / (target - start), 0, 1);
}

export const isCompleted = (progress: number) => progress >= 1;

export function isValidRange(direction: Direction, start: number, target: number): boolean {
  if (!Number.isFinite(start) || !Number.isFinite(target)) return false;
  return direction === 'down' ? target < start : target > start;
}

function byRecordedDesc(a: EntryPoint, b: EntryPoint): number {
  return b.recorded_at.localeCompare(a.recorded_at) || b.created_at.localeCompare(a.created_at);
}

/** Valor del último registro por `recorded_at`; sin registros, el valor inicial. */
export function currentValue(start: number, entries: readonly EntryPoint[]): number {
  if (entries.length === 0) return start;
  return [...entries].sort(byRecordedDesc)[0].value;
}

/** Atajos 25/50/75%: actual = inicial + p·(objetivo − inicial). */
export function presetValue(start: number, target: number, fraction: number): number {
  return round2(start + fraction * (target - start));
}

export function weeksUntil(deadline: Date, now: Date): number {
  return (deadline.getTime() - now.getTime()) / WEEK_MS;
}

/** Ritmo sugerido = (objetivo − actual) / semanas hasta la fecha límite. Null si no hay plazo útil. */
export function suggestedPace(target: number, current: number, deadline: Date | null, now: Date): number | null {
  if (!deadline) return null;
  const weeks = weeksUntil(deadline, now);
  if (weeks <= 0) return null;
  return (target - current) / weeks;
}

function dayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

const MAX_GAP_DAYS: Record<Frequency, number> = { daily: 1, weekly: 7, free: 7 };

/**
 * Días que abarca la cadena actual de registros. La cadena se rompe cuando pasan
 * más días que los permitidos por la frecuencia entre registros consecutivos.
 */
export function streakDays(entries: readonly EntryPoint[], frequency: Frequency, now: Date): number {
  const days = [...new Set(entries.map((e) => dayNumber(new Date(e.recorded_at))))].sort((a, b) => b - a);
  if (days.length === 0) return 0;

  const maxGap = MAX_GAP_DAYS[frequency];
  if (dayNumber(now) - days[0] > maxGap) return 0;

  let first = days[0];
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] > maxGap) break;
    first = days[i];
  }
  return days[0] - first + 1;
}

/** La cadena más larga de registros en toda la historia, medida igual que la racha. */
export function bestStreakDays(entries: readonly EntryPoint[], frequency: Frequency): number {
  const days = [...new Set(entries.map((e) => dayNumber(new Date(e.recorded_at))))].sort((a, b) => a - b);
  if (days.length === 0) return 0;

  const maxGap = MAX_GAP_DAYS[frequency];
  let best = 1;
  let chainStart = days[0];
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] > maxGap) chainStart = days[i];
    best = Math.max(best, days[i] - chainStart + 1);
  }
  return best;
}

/** Días transcurridos entre dos fechas, contando al menos uno. */
export function elapsedDays(from: Date, to: Date): number {
  return Math.max(1, dayNumber(to) - dayNumber(from));
}

/** Valor vigente al cierre de cada una de las últimas `weeks` semanas (la última termina en `now`). */
export function weeklySeries(
  start: number,
  entries: readonly EntryPoint[],
  now: Date,
  weeks = 8,
): { date: Date; value: number }[] {
  return Array.from({ length: weeks }, (_, i) => {
    const date = new Date(now.getTime() - (weeks - 1 - i) * WEEK_MS);
    const upTo = entries.filter((e) => new Date(e.recorded_at).getTime() <= date.getTime());
    return { date, value: currentValue(start, upTo) };
  });
}

/** Cambio promedio por semana en la serie. */
export function weeklyChange(series: readonly { value: number }[]): number {
  if (series.length < 2) return 0;
  return (series[series.length - 1].value - series[0].value) / (series.length - 1);
}
