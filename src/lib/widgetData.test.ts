import { describe, expect, it } from 'vitest';

import { DEFAULT_ICON, GOAL_ICONS } from './goalIcons';
import { buildWidgetGoalItems, buildWidgetSnapshot, selectWidgetGoal, type WidgetGoal } from './widgetData';
import { DEFAULT_SYMBOL, widgetSymbol } from './widgetSymbols';

const now = new Date(2026, 10, 8, 12);
const iso = (d: number, month = 10) => new Date(2026, month, d, 12).toISOString();
const entry = (value: number, d: number) => ({ value, recorded_at: iso(d), created_at: iso(d) });

const goal: WidgetGoal = {
  id: 'a',
  name: 'Peso',
  unit: 'kg',
  start_value: 85,
  target_value: 72,
  deadline: null,
  frequency: 'weekly',
  created_at: iso(1, 8),
  completed_at: null,
  archived_at: null,
  current: 78.4,
  progress: 6.6 / 13,
  entries: [entry(78.4, 8), entry(80, 2)],
};

describe('buildWidgetSnapshot', () => {
  const s = buildWidgetSnapshot(goal, now);

  it('formatea los textos del widget', () => {
    expect(s).toMatchObject({ valueText: '78.4', unit: 'kg', percent: 51, targetText: '72 kg', targetNumberText: '72' });
    expect(s.changeText).toBe('▾ 6.6 kg');
  });
  it('trae 8 semanas terminando en el valor actual', () => {
    expect(s.series).toHaveLength(8);
    expect(s.series[0]).toBe(85);
    expect(s.series[7]).toBe(78.4);
    expect(s.startValueLabel).toBe('85 kg · 20 sep');
  });
  it('calcula la racha', () => {
    expect(s.streakDays).toBe(7);
    expect(s.streakProgress).toBeCloseTo(7 / 30);
  });
  it('sin cambios no muestra flecha', () => {
    expect(buildWidgetSnapshot({ ...goal, current: 85, entries: [] }, now).changeText).toBe('Sin cambios');
  });
  it('en meta creciente usa la flecha hacia arriba', () => {
    const up = { ...goal, start_value: 0, target_value: 10, current: 2, entries: [entry(2, 8)] };
    expect(buildWidgetSnapshot(up, now).changeText).toBe('▴ 2 kg');
  });
  it('la semana es 0 si se aleja de la meta y 1 si avanza sin fecha', () => {
    expect(s.weekProgress).toBe(1);
    expect(buildWidgetSnapshot({ ...goal, current: 90, entries: [entry(90, 8)] }, now).weekProgress).toBe(0);
  });
  it('con fecha, la semana se mide contra el ritmo sugerido', () => {
    const deadline = new Date(now.getTime() + 2 * 7 * 86_400_000).toISOString();
    const snap = buildWidgetSnapshot({ ...goal, deadline }, now);
    expect(snap.weekProgress).toBeCloseTo((6.6 / 7) / (6.4 / 2));
  });
});

describe('selectWidgetGoal', () => {
  const done = { ...goal, id: 'done', completed_at: iso(1) };
  const archived = { ...goal, id: 'arch', archived_at: iso(1) };
  const active = { ...goal, id: 'active' };

  it('respeta la elección', () => {
    expect(selectWidgetGoal([active, done], 'done')?.id).toBe('done');
  });
  it('si la elegida se archivó, usa la primera activa', () => {
    expect(selectWidgetGoal([archived, done, active], 'arch')?.id).toBe('active');
  });
  it('si solo hay cumplidas, usa una', () => {
    expect(selectWidgetGoal([done], null)?.id).toBe('done');
  });
  it('sin metas devuelve null', () => {
    expect(selectWidgetGoal([archived], null)).toBeNull();
  });
});

describe('buildWidgetGoalItems', () => {
  const styled = (over: Partial<WidgetGoal & { color: string; icon: string }>) => ({
    ...goal,
    color: '#C9B6FF',
    icon: 'book-open',
    ...over,
  });

  it('pone primero las activas, luego las cumplidas y oculta las archivadas', () => {
    const items = buildWidgetGoalItems([
      styled({ id: 'done', completed_at: iso(5) }),
      styled({ id: 'active' }),
      styled({ id: 'archived', archived_at: iso(6) }),
    ]);
    expect(items.map((item) => [item.id, item.completed])).toEqual([
      ['active', false],
      ['done', true],
    ]);
  });

  it('formatea valor, meta, porcentaje, color y símbolo', () => {
    const [item] = buildWidgetGoalItems([styled({})]);
    expect(item).toMatchObject({
      name: 'Peso',
      valueText: '78.4',
      unit: 'kg',
      targetNumberText: '72',
      percent: 51,
      color: '#C9B6FF',
      symbol: 'book',
    });
  });
});

describe('widgetSymbol', () => {
  it('tiene un SF Symbol propio para cada icono del catálogo', () => {
    const missing = GOAL_ICONS.filter((icon) => icon.key !== DEFAULT_ICON && widgetSymbol(icon.key) === DEFAULT_SYMBOL);
    expect(missing.map((icon) => icon.key)).toEqual([]);
  });

  it('usa la estrella para iconos desconocidos', () => {
    expect(widgetSymbol('no-existe')).toBe(DEFAULT_SYMBOL);
  });
});
