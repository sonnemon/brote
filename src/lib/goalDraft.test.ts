import { describe, expect, it } from 'vitest';

import { draftCurrent, draftToInput, validateFrom, validateWhat, type GoalDraft } from './goalDraft';

const base: GoalDraft = {
  name: 'Bajar de peso',
  direction: 'down',
  unit: 'kg',
  color: '#C9B6FF',
  startText: '85',
  targetText: '72',
  hasProgress: false,
  presetFraction: null,
  currentText: '',
  hasDeadline: false,
  deadline: new Date('2027-01-31T12:00:00Z'),
  frequency: 'weekly',
  reminder: null,
};

describe('validación', () => {
  it('pide nombre y unidad', () => {
    expect(validateWhat({ ...base, name: '  ' })).toMatch(/nombre/);
    expect(validateWhat({ ...base, unit: '' })).toMatch(/unidad/);
    expect(validateWhat(base)).toBeNull();
  });
  it('valida el rango según la dirección', () => {
    expect(validateFrom(base)).toBeNull();
    expect(validateFrom({ ...base, targetText: '90' })).toMatch(/menor/);
    expect(validateFrom({ ...base, direction: 'up' })).toMatch(/mayor/);
    expect(validateFrom({ ...base, targetText: '' })).toMatch(/Completa/);
  });
  it('exige un valor actual dentro del rango', () => {
    const custom = { ...base, hasProgress: true };
    expect(validateFrom({ ...custom, currentText: '' })).toMatch(/actual/);
    expect(validateFrom({ ...custom, currentText: '95' })).toMatch(/entre/);
    expect(validateFrom({ ...custom, currentText: '80' })).toBeNull();
  });
});

describe('avance previo', () => {
  it('un atajo precarga el valor y crea primer registro', () => {
    const draft = { ...base, hasProgress: true, presetFraction: 0.5 };
    expect(draftCurrent(draft)).toBe(78.5);
    expect(draftToInput(draft).initial_value).toBe(78.5);
  });
  it('empezar desde el inicial no crea registro', () => {
    expect(draftToInput(base).initial_value).toBeNull();
    expect(draftToInput({ ...base, hasProgress: true, presetFraction: 0 }).initial_value).toBeNull();
  });
  it('sin fecha límite guarda null', () => {
    expect(draftToInput(base).deadline).toBeNull();
  });
  it('asigna ícono por unidad', () => {
    expect(draftToInput(base).icon).toBe('scale');
    expect(draftToInput({ ...base, unit: 'pasos' }).icon).toBe('star');
  });
});
