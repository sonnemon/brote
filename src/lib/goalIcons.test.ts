import { describe, expect, it } from 'vitest';

import { GOAL_ICONS, ICON_CATEGORIES, resolveIconKey, searchIcons, suggestIcons, withCurrent } from './goalIcons';

describe('catálogo', () => {
  it('no repite claves y toda categoría existe', () => {
    const keys = GOAL_ICONS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    const cats = new Set(ICON_CATEGORIES.map((c) => c.id));
    expect(GOAL_ICONS.every((i) => cats.has(i.category))).toBe(true);
  });
  it('resuelve claves antiguas y desconocidas', () => {
    expect(resolveIconKey('book')).toBe('book-open');
    expect(resolveIconKey('scale')).toBe('dumbbell');
    expect(resolveIconKey('wallet')).toBe('wallet');
    expect(resolveIconKey('no-existe')).toBe('star');
  });
});

describe('sugerencias', () => {
  it('elige según el nombre', () => {
    expect(suggestIcons('Viaje a Cusco')[0]).toBe('plane');
    expect(suggestIcons('Ahorrar para la boda')[0]).toBe('piggy-bank');
    expect(suggestIcons('Leer 12 libros')[0]).toBe('book-open');
    expect(suggestIcons('Dejar de fumar')[0]).toBe('cigarette-off');
    expect(suggestIcons('Aprender inglés')[0]).toBe('languages');
  });
  it('entiende nombres en inglés', () => {
    expect(suggestIcons('Lose weight')[0]).toBe('dumbbell');
    expect(suggestIcons('Read 20 books')[0]).toBe('book-open');
    expect(suggestIcons('Quit smoking')[0]).toBe('cigarette-off');
    expect(suggestIcons('Go to the gym')[0]).toBe('dumbbell');
    expect(suggestIcons('Trip to Japan')[0]).toBe('plane');
    expect(suggestIcons('Pay off credit card')[0]).toBe('credit-card');
    expect(suggestIcons('Learn Spanish')[0]).toBe('languages');
    expect(suggestIcons('Weigh')[0]).toBe('dumbbell');
  });
  it('ignora tildes y mayúsculas', () => {
    expect(suggestIcons('NATACIÓN')[0]).toBe('waves');
  });
  it('sin pistas da opciones genéricas, siempre seis distintas', () => {
    const s = suggestIcons('');
    expect(s[0]).toBe('star');
    expect(s).toHaveLength(6);
    expect(new Set(s).size).toBe(6);
    expect(suggestIcons('Algo')[0]).toBe('star');
    expect(suggestIcons('Bajar de peso')[0]).toBe('dumbbell');
  });
  it('incluye el icono elegido entre las opciones', () => {
    expect(withCurrent(['a', 'b', 'c'], 'z')).toEqual(['z', 'a', 'b']);
    expect(withCurrent(['a', 'b', 'c'], 'b')).toEqual(['a', 'b', 'c']);
  });
});

describe('búsqueda', () => {
  it('filtra por etiqueta o palabra clave', () => {
    expect(searchIcons('gym').map((i) => i.key)).toContain('dumbbell');
    expect(searchIcons('cafe').map((i) => i.key)).toContain('coffee');
    expect(searchIcons('running').map((i) => i.key)).toContain('person-standing');
    expect(searchIcons('')).toHaveLength(GOAL_ICONS.length);
  });
});
