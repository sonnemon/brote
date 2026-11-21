import { afterEach, describe, expect, it } from 'vitest';

import { en } from '../i18n/en';
import { es } from '../i18n/es';
import { resolveLang, setLang } from '../i18n';
import { completionSummary } from './completion';
import { buildCsv } from './csv';
import { formatCurrentOfTarget, formatDayMonth, formatHistoryDate, greeting } from './format';
import { validateWhat, type GoalDraft } from './goalDraft';
import { reminderContent, weekdayOptions } from './reminders';

afterEach(() => setLang('es'));

/** Recorre el diccionario y devuelve las rutas de todas sus hojas. */
function keys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe('idioma', () => {
  it('sigue al celular salvo que el usuario elija uno', () => {
    expect(resolveLang('system', 'es')).toBe('es');
    expect(resolveLang('system', 'en')).toBe('en');
    expect(resolveLang('system', 'pt')).toBe('en');
    expect(resolveLang('system', null)).toBe('en');
    expect(resolveLang('es', 'en')).toBe('es');
    expect(resolveLang('en', 'es')).toBe('en');
  });
  it('los dos diccionarios tienen las mismas claves', () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });
});

describe('en inglés', () => {
  const now = new Date(2026, 10, 8, 9);

  it('formatea fechas, saludos y valores', () => {
    setLang('en');
    expect(formatDayMonth(now)).toBe('Nov 8');
    expect(formatHistoryDate(now, now)).toBe('Today · Nov 8');
    expect(greeting(now)).toBe('Good morning');
    expect(formatCurrentOfTarget(3000, 4000, 'S/')).toBe('S/ 3,000 of 4,000');
  });
  it('traduce validaciones, recordatorios, resumen y CSV', () => {
    setLang('en');
    expect(validateWhat({ name: ' ', unit: 'kg' } as GoalDraft)).toBe('Give your goal a name.');
    expect(weekdayOptions()[0]).toEqual({ value: 1, label: 'M', name: 'Monday' });
    expect(
      reminderContent({
        id: 'x',
        name: 'Run',
        unit: 'km',
        target_value: 100,
        current: 40,
        completed_at: null,
        archived_at: null,
        reminder_weekday: null,
        reminder_hour: 7,
        reminder_minute: 0,
      }).body,
    ).toBe("Log your progress. You're at 40 of 100 km.");
    expect(
      completionSummary(
        {
          direction: 'down',
          unit: 'kg',
          start_value: 85,
          target_value: 72,
          created_at: new Date(2026, 0, 1).toISOString(),
          completed_at: new Date(2026, 0, 6).toISOString(),
        },
        now,
      ),
    ).toBe('You reached 72 kg. You dropped 13 kg in 5 days.');
    expect(buildCsv([], []).split('\r\n')[0]).toBe('goal,type,unit,start,target,date,value,note');
  });
  it('en español sigue igual', () => {
    expect(formatDayMonth(now)).toBe('8 nov');
    expect(greeting(now)).toBe('Buenos días');
  });
});
