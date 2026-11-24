import { describe, expect, it } from 'vitest';

import { defaultLogMode, lastAddedAmount, quickAmounts } from './logAmounts';

describe('defaultLogMode', () => {
  it('suma en metas que suben y pide el total en las que bajan', () => {
    expect(defaultLogMode(0, 10000)).toBe('add');
    expect(defaultLogMode(85, 72)).toBe('total');
  });
});

describe('lastAddedAmount', () => {
  it('es la diferencia entre los dos últimos registros (el más reciente primero)', () => {
    expect(lastAddedAmount(0, [{ value: 2499 }, { value: 1999 }])).toBe(500);
  });

  it('con un solo registro compara contra el valor inicial', () => {
    expect(lastAddedAmount(100, [{ value: 130 }])).toBe(30);
  });

  it('es nulo sin registros o si el último no sumó', () => {
    expect(lastAddedAmount(0, [])).toBeNull();
    expect(lastAddedAmount(0, [{ value: 5 }, { value: 8 }])).toBeNull();
  });
});

describe('quickAmounts', () => {
  it('ofrece 1, 5 y 10 pasos', () => {
    expect(quickAmounts(10, null)).toEqual([10, 50, 100]);
    expect(quickAmounts(0.1, null)).toEqual([0.1, 0.5, 1]);
  });

  it('agrega lo último que sumaste si no está ya', () => {
    expect(quickAmounts(10, 500)).toEqual([10, 50, 100, 500]);
    expect(quickAmounts(10, 50)).toEqual([10, 50, 100]);
  });
});
