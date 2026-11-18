import { describe, expect, it } from 'vitest';

import {
  computeProgress,
  currentValue,
  isCompleted,
  isValidRange,
  presetValue,
  streakDays,
  suggestedPace,
  weeklyChange,
  weeklySeries,
  type EntryPoint,
} from './progress';

const entry = (value: number, recorded: Date, created = recorded): EntryPoint => ({
  value,
  recorded_at: recorded.toISOString(),
  created_at: created.toISOString(),
});
const day = (d: number, month = 10) => new Date(2026, month, d, 12);

describe('computeProgress', () => {
  it('funciona en metas crecientes', () => {
    expect(computeProgress(0, 4000, 3000)).toBe(0.75);
  });
  it('funciona en metas decrecientes con la misma fórmula', () => {
    expect(computeProgress(85, 72, 78.5)).toBeCloseTo(0.5);
  });
  it('limita a 0 si se aleja de la meta', () => {
    expect(computeProgress(85, 72, 90)).toBe(0);
    expect(computeProgress(10, 20, 5)).toBe(0);
  });
  it('limita a 1 si supera la meta', () => {
    expect(computeProgress(85, 72, 70)).toBe(1);
    expect(computeProgress(0, 10, 12)).toBe(1);
  });
  it('no produce NaN si inicial y objetivo coinciden', () => {
    expect(computeProgress(5, 5, 5)).toBe(0);
  });
  it('marca cumplida con progreso ≥ 1', () => {
    expect(isCompleted(computeProgress(85, 72, 72))).toBe(true);
    expect(isCompleted(computeProgress(85, 72, 72.1))).toBe(false);
  });
});

describe('isValidRange', () => {
  it('exige objetivo menor en decreciente', () => {
    expect(isValidRange('down', 85, 72)).toBe(true);
    expect(isValidRange('down', 72, 85)).toBe(false);
  });
  it('exige objetivo mayor en creciente', () => {
    expect(isValidRange('up', 0, 10)).toBe(true);
    expect(isValidRange('up', 10, 10)).toBe(false);
  });
  it('rechaza valores no numéricos', () => {
    expect(isValidRange('up', NaN, 10)).toBe(false);
  });
});

describe('currentValue', () => {
  it('usa el inicial si no hay registros', () => {
    expect(currentValue(85, [])).toBe(85);
  });
  it('usa el último por recorded_at, no por orden de creación', () => {
    expect(currentValue(85, [entry(80, day(8), day(8)), entry(84, day(2), day(9))])).toBe(80);
  });
  it('desempata por created_at', () => {
    expect(currentValue(85, [entry(80, day(8), day(8)), entry(79, day(8), day(9))])).toBe(79);
  });
});

describe('presetValue', () => {
  it('precarga atajos en ambas direcciones', () => {
    expect(presetValue(85, 72, 0.5)).toBe(78.5);
    expect(presetValue(0, 4000, 0.75)).toBe(3000);
    expect(presetValue(85, 72, 0.25)).toBe(81.75);
  });
});

describe('suggestedPace', () => {
  it('divide lo que falta entre las semanas restantes', () => {
    const now = new Date('2026-11-08T12:00:00Z');
    const deadline = new Date('2027-01-31T12:00:00Z');
    expect(suggestedPace(72, 78.5, deadline, now)).toBeCloseTo(-6.5 / 12);
  });
  it('es null sin fecha o con fecha vencida', () => {
    const now = day(8);
    expect(suggestedPace(72, 78, null, now)).toBeNull();
    expect(suggestedPace(72, 78, day(1), now)).toBeNull();
  });
});

describe('streakDays', () => {
  it('es 0 sin registros', () => {
    expect(streakDays([], 'daily', day(8))).toBe(0);
  });
  it('cuenta días seguidos en frecuencia diaria', () => {
    expect(streakDays([entry(1, day(8)), entry(1, day(7)), entry(1, day(6))], 'daily', day(8))).toBe(3);
  });
  it('sigue viva si el último registro fue ayer', () => {
    expect(streakDays([entry(1, day(7))], 'daily', day(8))).toBe(1);
  });
  it('se rompe con un hueco', () => {
    expect(streakDays([entry(1, day(8)), entry(1, day(5))], 'daily', day(8))).toBe(1);
    expect(streakDays([entry(1, day(5))], 'daily', day(8))).toBe(0);
  });
  it('en semanal abarca todos los días de la cadena', () => {
    expect(streakDays([entry(1, day(8)), entry(1, day(2)), entry(1, day(1))], 'weekly', day(8))).toBe(8);
  });
});

describe('weeklySeries', () => {
  it('devuelve 8 puntos terminando en el valor actual', () => {
    const series = weeklySeries(85, [entry(80, day(1)), entry(78, day(8, 10))], day(8));
    expect(series).toHaveLength(8);
    expect(series[0].value).toBe(85);
    expect(series[7].value).toBe(78);
  });
  it('calcula el cambio promedio semanal', () => {
    expect(weeklyChange([{ value: 80 }, { value: 79 }, { value: 76 }])).toBe(-2);
    expect(weeklyChange([{ value: 80 }])).toBe(0);
  });
});
