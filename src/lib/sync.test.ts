import { describe, expect, it } from 'vitest';

import {
  createDevPurchases,
  createUnavailablePurchases,
  isPlusActive,
  isValidEmail,
  latestPlusUntil,
  PurchasesUnavailableError,
} from './purchases';
import { normalizeRemoteRow, runSync, shouldApplyRemote, type SyncPorts, type SyncRow, type SyncTable } from './sync';

type Row = SyncRow & { dirty?: boolean; name?: string };

/** Simula sqlite y Supabase en memoria. */
function makeWorld() {
  const local: Record<SyncTable, Map<string, Row>> = { goals: new Map(), entries: new Map() };
  const remote: Record<SyncTable, Map<string, Row>> = { goals: new Map(), entries: new Map() };
  const cursors: Partial<Record<SyncTable, string>> = {};
  const calls: string[] = [];
  let failUpsert = false;

  const ports: SyncPorts = {
    getCursor: (t) => cursors[t] ?? null,
    setCursor: (t, c) => {
      cursors[t] = c;
    },
    fetchRemote: async (t, cursor) => {
      calls.push(`pull:${t}`);
      return [...remote[t].values()].filter((r) => !cursor || new Date(r.updated_at) > new Date(cursor));
    },
    getLocalUpdatedAt: (t, ids) =>
      new Map(ids.filter((id) => local[t].has(id)).map((id) => [id, local[t].get(id)!.updated_at])),
    applyRemote: (t, rows) => rows.forEach((r) => local[t].set(r.id, { ...r, dirty: false })),
    readDirty: (t) => [...local[t].values()].filter((r) => r.dirty),
    upsertRemote: async (t, rows) => {
      calls.push(`push:${t}`);
      if (failUpsert) throw new Error('offline');
      rows.forEach((r) => remote[t].set(r.id, { ...r, dirty: undefined }));
    },
    markClean: (t, rows) =>
      rows.forEach((r) => {
        const row = local[t].get(r.id);
        if (row && row.updated_at === r.updated_at) row.dirty = false;
      }),
  };
  return { local, remote, cursors, calls, ports, setFail: (v: boolean) => (failUpsert = v) };
}

const T1 = '2026-11-01T10:00:00.000Z';
const T2 = '2026-11-02T10:00:00.000Z';

describe('shouldApplyRemote', () => {
  it('aplica filas nuevas o más recientes', () => {
    expect(shouldApplyRemote(undefined, T1)).toBe(true);
    expect(shouldApplyRemote(T1, T2)).toBe(true);
  });
  it('conserva lo local si es más reciente o empatan', () => {
    expect(shouldApplyRemote(T2, T1)).toBe(false);
    expect(shouldApplyRemote(T1, T1)).toBe(false);
  });
  it('compara instantes aunque cambie el formato', () => {
    expect(shouldApplyRemote('2026-11-01T10:00:00.000Z', '2026-11-01T10:00:00+00:00')).toBe(false);
  });
});

describe('normalizeRemoteRow', () => {
  it('convierte fechas, descarta user_id y rellena nulos', () => {
    const row = normalizeRemoteRow('entries', {
      id: 'e',
      goal_id: 'g',
      value: 5,
      recorded_at: '2026-11-01T10:00:00+00:00',
      created_at: '2026-11-01T10:00:00+00:00',
      updated_at: '2026-11-01T10:00:00+00:00',
      user_id: 'u',
    });
    expect(row.updated_at).toBe('2026-11-01T10:00:00.000Z');
    expect(row).not.toHaveProperty('user_id');
    expect(row.note).toBeNull();
    expect(row.deleted_at).toBeNull();
  });
});

describe('runSync', () => {
  it('trae antes de subir y metas antes que registros', async () => {
    const w = makeWorld();
    w.local.goals.set('g', { id: 'g', updated_at: T1, dirty: true });
    w.local.entries.set('e', { id: 'e', updated_at: T1, dirty: true });
    await runSync(w.ports);
    expect(w.calls).toEqual(['pull:goals', 'pull:entries', 'push:goals', 'push:entries']);
  });

  it('sube lo pendiente y lo marca limpio', async () => {
    const w = makeWorld();
    w.local.goals.set('g', { id: 'g', updated_at: T1, dirty: true });
    expect(await runSync(w.ports)).toEqual({ pulled: 0, pushed: 1 });
    expect(w.remote.goals.has('g')).toBe(true);
    expect(w.local.goals.get('g')!.dirty).toBe(false);
  });

  it('una fila local vieja no pisa una más nueva de la nube', async () => {
    const w = makeWorld();
    w.local.goals.set('g', { id: 'g', updated_at: T1, name: 'vieja', dirty: true });
    w.remote.goals.set('g', { id: 'g', updated_at: T2, name: 'nueva' });
    await runSync(w.ports);
    expect(w.remote.goals.get('g')!.name).toBe('nueva');
    expect(w.local.goals.get('g')!.dirty).toBe(false);
  });

  it('una fila local más nueva gana y se sube', async () => {
    const w = makeWorld();
    w.local.goals.set('g', { id: 'g', updated_at: T2, name: 'local', dirty: true });
    w.remote.goals.set('g', { id: 'g', updated_at: T1, name: 'nube' });
    await runSync(w.ports);
    expect(w.remote.goals.get('g')!.name).toBe('local');
  });

  it('avanza el cursor con la fecha de las filas remotas', async () => {
    const w = makeWorld();
    w.remote.goals.set('a', { id: 'a', updated_at: T2 });
    w.remote.goals.set('b', { id: 'b', updated_at: T1 });
    await runSync(w.ports);
    expect(w.cursors.goals).toBe(T2);
  });

  it('no vuelve a aplicar lo que ya subió', async () => {
    const w = makeWorld();
    w.local.goals.set('g', { id: 'g', updated_at: T1, dirty: true });
    await runSync(w.ports);
    expect(await runSync(w.ports)).toEqual({ pulled: 0, pushed: 0 });
  });

  it('si falla la subida, lo pendiente sigue pendiente', async () => {
    const w = makeWorld();
    w.local.goals.set('g', { id: 'g', updated_at: T1, dirty: true });
    w.setFail(true);
    await expect(runSync(w.ports)).rejects.toThrow('offline');
    expect(w.local.goals.get('g')!.dirty).toBe(true);
  });
});

describe('purchases', () => {
  const now = () => new Date('2026-11-08T12:00:00Z');

  it('el stub concede el periodo del plan y lo restaura', async () => {
    let saved: string | null = null;
    const p = createDevPurchases({ get: () => saved, set: (v) => (saved = v) }, now);
    expect(await p.restore()).toBeNull();
    expect(await p.purchase('monthly')).toBe('2026-12-08T12:00:00.000Z');
    expect(await p.restore()).toBe('2026-12-08T12:00:00.000Z');
  });
  it('producción sin RevenueCat no concede Plus', async () => {
    await expect(createUnavailablePurchases().purchase('annual')).rejects.toBeInstanceOf(PurchasesUnavailableError);
  });
  it('Plus depende de la fecha de vencimiento', () => {
    expect(isPlusActive(null, now())).toBe(false);
    expect(isPlusActive('2026-11-09T00:00:00Z', now())).toBe(true);
    expect(isPlusActive('2026-11-01T00:00:00Z', now())).toBe(false);
  });
  it('elige el vencimiento más lejano', () => {
    expect(latestPlusUntil(null, T1, T2)).toBe(T2);
    expect(latestPlusUntil(null, null)).toBeNull();
  });
  it('valida correos', () => {
    expect(isValidEmail(' ana@orbe.pe ')).toBe(true);
    expect(isValidEmail('ana@orbe')).toBe(false);
  });
});
