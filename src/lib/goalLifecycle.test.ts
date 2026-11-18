import { describe, expect, it } from 'vitest';

import { completionSummary } from './completion';
import { buildCsv } from './csv';
import { editToUpdate, nextFrequency, validateEdit, type GoalEditDraft } from './goalEdit';
import { bestStreakDays, elapsedDays, type EntryPoint } from './progress';

const day = (d: number) => new Date(2026, 10, d, 12);
const entry = (d: number): EntryPoint => ({
  value: 1,
  recorded_at: day(d).toISOString(),
  created_at: day(d).toISOString(),
});

describe('bestStreakDays', () => {
  it('es 0 sin registros', () => {
    expect(bestStreakDays([], 'daily')).toBe(0);
  });
  it('encuentra la cadena más larga aunque no sea la última', () => {
    expect(bestStreakDays([entry(1), entry(2), entry(3), entry(10)], 'daily')).toBe(3);
  });
  it('usa el hueco permitido por la frecuencia', () => {
    expect(bestStreakDays([entry(1), entry(8)], 'weekly')).toBe(8);
    expect(bestStreakDays([entry(1), entry(9)], 'weekly')).toBe(1);
  });
});

describe('elapsedDays', () => {
  it('cuenta al menos un día', () => {
    expect(elapsedDays(day(8), day(8))).toBe(1);
    expect(elapsedDays(day(1), day(8))).toBe(7);
  });
});

describe('completionSummary', () => {
  const goal = {
    direction: 'down' as const,
    unit: 'kg',
    start_value: 85,
    target_value: 72,
    created_at: new Date(2026, 7, 1, 12).toISOString(),
    completed_at: new Date(2026, 10, 7, 12).toISOString(),
  };
  it('resume con semanas', () => {
    expect(completionSummary(goal, day(8))).toBe('Llegaste a 72 kg. Bajaste 13 kg en 14 semanas.');
  });
  it('usa días en metas cortas y soles', () => {
    const short = {
      ...goal,
      direction: 'up' as const,
      unit: 'S/',
      start_value: 0,
      target_value: 500,
      created_at: day(5).toISOString(),
      completed_at: day(8).toISOString(),
    };
    expect(completionSummary(short, day(8))).toBe('Llegaste a S/ 500. Subiste S/ 500 en 3 días.');
  });
});

describe('edición', () => {
  const draft: GoalEditDraft = {
    name: 'Peso',
    direction: 'down',
    unit: 'kg',
    color: '#C9B6FF',
    startText: '85',
    targetText: '72',
    currentText: '78.4',
    hasDeadline: false,
    deadline: day(30),
    frequency: 'weekly',
    reminder: null,
  };
  it('valida rango según la dirección', () => {
    expect(validateEdit(draft)).toBeNull();
    expect(validateEdit({ ...draft, direction: 'up' })).toMatch(/mayor/);
    expect(validateEdit({ ...draft, name: '' })).toMatch(/nombre/);
    expect(validateEdit({ ...draft, currentText: 'x' })).toMatch(/actual/);
  });
  it('solo crea registro si cambió el valor actual', () => {
    expect(editToUpdate(draft, 78.4).new_current).toBeNull();
    expect(editToUpdate({ ...draft, currentText: '77' }, 78.4).new_current).toBe(77);
  });
  it('rota la frecuencia', () => {
    expect(nextFrequency('daily')).toBe('weekly');
    expect(nextFrequency('free')).toBe('daily');
  });
});

describe('buildCsv', () => {
  const goal = { id: 'a', name: 'Ahorro, viaje', direction: 'up' as const, unit: 'S/', start_value: 0, target_value: 10 };
  it('escapa comas y comillas', () => {
    const csv = buildCsv([goal], [{ goal_id: 'a', value: 5, note: 'dijo "hola"', recorded_at: '2026-11-08' }]);
    expect(csv.split('\r\n')[1]).toBe('"Ahorro, viaje",Creciente,S/,0,10,2026-11-08,5,"dijo ""hola"""');
  });
  it('incluye metas sin registros', () => {
    expect(buildCsv([goal], []).split('\r\n')[1]).toBe('"Ahorro, viaje",Creciente,S/,0,10,,,');
  });
});
