import { describe, expect, it } from 'vitest';

import {
  formatCurrentOfTarget,
  formatHistoryDate,
  formatNumber,
  formatSignedValue,
  formatValue,
  greeting,
  heroInputFontSize,
  nudgeText,
  parseDecimal,
} from './format';

describe('números', () => {
  it('agrupa miles y conserva decimales', () => {
    expect(formatNumber(3000)).toBe('3,000');
    expect(formatNumber(78.4)).toBe('78.4');
    expect(formatNumber(1234567.891)).toBe('1,234,567.89');
  });
  it('quita ruido de coma flotante', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
  });
  it('formatea con unidad y soles', () => {
    expect(formatValue(78.4, 'kg')).toBe('78.4 kg');
    expect(formatValue(3000, 'S/')).toBe('S/ 3,000');
    expect(formatCurrentOfTarget(78.4, 72, 'kg')).toBe('78.4 de 72 kg');
    expect(formatCurrentOfTarget(3000, 4000, 'S/')).toBe('S/ 3,000 de 4,000');
  });
  it('muestra el signo', () => {
    expect(formatSignedValue(-0.3, 'kg')).toBe('−0.3 kg');
    expect(formatSignedValue(2, 'km')).toBe('+2 km');
  });
  it('interpreta coma, punto y signo tipográfico', () => {
    expect(parseDecimal('78,5')).toBe(78.5);
    expect(parseDecimal('−2')).toBe(-2);
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
  });
});

describe('fechas', () => {
  const now = new Date(2026, 10, 8, 15);
  it('etiqueta el historial', () => {
    expect(formatHistoryDate(new Date(2026, 10, 8, 9), now)).toBe('Hoy · 8 nov');
    expect(formatHistoryDate(new Date(2026, 10, 2, 9), now)).toBe('Lun · 2 nov');
  });
  it('saluda según la hora', () => {
    expect(greeting(new Date(2026, 10, 8, 9))).toBe('Buenos días');
    expect(greeting(now)).toBe('Buenas tardes');
    expect(greeting(new Date(2026, 10, 8, 21))).toBe('Buenas noches');
  });
});

describe('nudgeText', () => {
  it('suma sin errores de punto flotante', () => {
    expect(nudgeText('89.1', 0.1)).toBe('89.2');
    expect(nudgeText('0.2', 0.1)).toBe('0.3');
    expect(nudgeText('89', -0.1)).toBe('88.9');
    expect(nudgeText('78,5', 0.1)).toBe('78.6');
  });
  it('trata un texto inválido como 0', () => {
    expect(nudgeText('', 0.5)).toBe('0.5');
  });
});

describe('heroInputFontSize', () => {
  it('reduce la fuente según el largo del valor', () => {
    expect(heroInputFontSize('89.2')).toBe(60);
    expect(heroInputFontSize('1250.5')).toBe(46);
    expect(heroInputFontSize('12500.75')).toBe(34);
  });
});
