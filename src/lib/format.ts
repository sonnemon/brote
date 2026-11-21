import { strings } from '../i18n';

import { round2 } from './progress';

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

/** "78.4 de 72 kg" · "S/ 3,000 de 4,000" (en inglés, "of") */
export function formatCurrentOfTarget(current: number, target: number, unit: string): string {
  const of = strings().common.of;
  return unit === CURRENCY_UNIT
    ? `S/ ${formatNumber(current)} ${of} ${formatNumber(target)}`
    : `${formatNumber(current)} ${of} ${formatNumber(target)} ${unit}`;
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

/** "8 nov" en español, "Nov 8" en inglés. */
export function formatDayMonth(date: Date): string {
  const s = strings();
  const month = s.months[date.getMonth()];
  return s.locale.startsWith('en') ? `${month} ${date.getDate()}` : `${date.getDate()} ${month}`;
}

export const formatFullDate = (date: Date) =>
  strings().locale.startsWith('en')
    ? `${formatDayMonth(date)}, ${date.getFullYear()}`
    : `${formatDayMonth(date)} ${date.getFullYear()}`;

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Hoy · 8 nov" · "Lun · 2 nov" */
export function formatHistoryDate(date: Date, now: Date): string {
  const s = strings();
  return `${isSameDay(date, now) ? s.common.today : s.weekdaysShort[date.getDay()]} · ${formatDayMonth(date)}`;
}

export function greeting(now: Date): string {
  const hour = now.getHours();
  const g = strings().greeting;
  if (hour < 12) return g.morning;
  if (hour < 19) return g.afternoon;
  return g.evening;
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
  if (unit === 'horas' || unit === 'hours') return 0.5;
  return 1;
}
