import { round2 } from './progress';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CURRENCY_UNIT = 'S/';

export function formatNumber(value: number): string {
  const rounded = round2(Math.abs(value));
  const [integer, decimals] = String(rounded).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = value < 0 && rounded !== 0 ? '−' : '';
  return `${sign}${grouped}${decimals ? `.${decimals}` : ''}`;
}

export function formatValue(value: number, unit: string): string {
  return unit === CURRENCY_UNIT ? `S/ ${formatNumber(value)}` : `${formatNumber(value)} ${unit}`;
}

/** "78.4 de 72 kg" · "S/ 3,000 de 4,000" */
export function formatCurrentOfTarget(current: number, target: number, unit: string): string {
  return unit === CURRENCY_UNIT
    ? `S/ ${formatNumber(current)} de ${formatNumber(target)}`
    : `${formatNumber(current)} de ${formatNumber(target)} ${unit}`;
}

/** Número con signo explícito: "+0.5", "−0.3", "0". */
export function formatSigned(value: number): string {
  const rounded = round2(value);
  return rounded > 0 ? `+${formatNumber(rounded)}` : formatNumber(rounded);
}

export function formatSignedValue(value: number, unit: string): string {
  const signed = formatSigned(value);
  return unit === CURRENCY_UNIT ? `${signed} S/` : `${signed} ${unit}`;
}

export const formatPercent = (progress: number) => `${Math.round(progress * 100)}%`;

export const formatDayMonth = (date: Date) => `${date.getDate()} ${MONTHS[date.getMonth()]}`;

export const formatFullDate = (date: Date) => `${formatDayMonth(date)} ${date.getFullYear()}`;

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Hoy · 8 nov" · "Lun · 2 nov" */
export function formatHistoryDate(date: Date, now: Date): string {
  return `${isSameDay(date, now) ? 'Hoy' : WEEKDAYS[date.getDay()]} · ${formatDayMonth(date)}`;
}

export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Acepta coma o punto decimal y el signo menos tipográfico. NaN si no es un número. */
export function parseDecimal(text: string): number {
  const normalized = text.trim().replace(',', '.').replace('−', '-');
  if (normalized === '' || normalized === '-' || normalized === '.') return NaN;
  return Number(normalized);
}

/** Suma `delta` al texto del stepper; un texto inválido cuenta como 0. */
export function nudgeText(text: string, delta: number): string {
  const base = parseDecimal(text);
  return String(round2((Number.isFinite(base) ? base : 0) + delta));
}

/** Reduce el número de Registrar para que los valores largos quepan entre los botones. */
export function heroInputFontSize(text: string): number {
  if (text.length <= 5) return 60;
  return text.length <= 7 ? 46 : 34;
}

export function stepForUnit(unit: string): number {
  if (unit === CURRENCY_UNIT) return 10;
  if (unit === 'kg' || unit === 'km') return 0.1;
  if (unit === 'horas') return 0.5;
  return 1;
}
