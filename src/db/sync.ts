import type { SupabaseClient } from '@supabase/supabase-js';

import { runSync, SYNC_COLUMNS, SYNC_ORDER, type SyncPorts, type SyncResult, type SyncRow, type SyncTable } from '@/lib/sync';

import { db } from './client';
import { getKv, setKv } from './repo';

const PAGE_SIZE = 1000;
const PUSH_BATCH = 500;
const LOOKUP_BATCH = 500;
const SYNC_USER_KEY = 'sync_user';

const cursorKey = (table: SyncTable) => `last_pulled_at:${table}`;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function makePorts(client: SupabaseClient): SyncPorts {
  return {
    getCursor: (table) => getKv(cursorKey(table)),
    setCursor: (table, cursor) => setKv(cursorKey(table), cursor),

    async fetchRemote(table, cursor) {
      const rows: Record<string, unknown>[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        let query = client
          .from(table)
          .select(SYNC_COLUMNS[table].join(','))
          .order('updated_at')
          .order('id')
          .range(from, from + PAGE_SIZE - 1);
        if (cursor) query = query.gt('updated_at', cursor);
        const { data, error } = await query;
        if (error) throw error;
        const page = (data ?? []) as unknown as Record<string, unknown>[];
        rows.push(...page);
        if (page.length < PAGE_SIZE) return rows;
      }
    },

    getLocalUpdatedAt(table, ids) {
      const found = new Map<string, string>();
      for (const batch of chunk(ids, LOOKUP_BATCH)) {
        const placeholders = batch.map(() => '?').join(',');
        const rows = db.getAllSync<{ id: string; updated_at: string }>(
          `SELECT id, updated_at FROM ${table} WHERE id IN (${placeholders})`,
          batch,
        );
        rows.forEach((row) => found.set(row.id, row.updated_at));
      }
      return found;
    },

    applyRemote(table, rows) {
      const columns = SYNC_COLUMNS[table];
      const placeholders = columns.map(() => '?').join(',');
      const updates = columns.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(', ');
      const sql = `INSERT INTO ${table} (${columns.join(',')}, dirty) VALUES (${placeholders}, 0)
        ON CONFLICT(id) DO UPDATE SET ${updates}, dirty = 0`;
      db.withTransactionSync(() => {
        for (const row of rows) db.runSync(sql, columns.map((c) => row[c] as string | number | null));
      });
    },

    readDirty: (table) =>
      db.getAllSync<SyncRow>(`SELECT ${SYNC_COLUMNS[table].join(',')} FROM ${table} WHERE dirty = 1`),

    async upsertRemote(table, rows) {
      for (const batch of chunk(rows, PUSH_BATCH)) {
        const { error } = await client.from(table).upsert(batch, { onConflict: 'id' });
        if (error) throw error;
      }
    },

    markClean(table, rows) {
      db.withTransactionSync(() => {
        for (const row of rows) {
          db.runSync(`UPDATE ${table} SET dirty = 0 WHERE id = ? AND updated_at = ?`, row.id, row.updated_at);
        }
      });
    },
  };
}

/**
 * Borra metas y registros del celular y olvida de qué cuenta eran. Se usa al cerrar sesión: las metas
 * son de la cuenta y siguen en su respaldo.
 */
export function clearLocalData() {
  db.withTransactionSync(() => {
    // Los registros primero: tienen llave foránea a goals.
    for (const table of [...SYNC_ORDER].reverse()) {
      db.runSync(`DELETE FROM ${table}`);
      db.runSync('DELETE FROM kv WHERE key = ?', cursorKey(table));
    }
    db.runSync('DELETE FROM kv WHERE key = ?', SYNC_USER_KEY);
  });
}

/** Deja las metas del celular sin dueño (al borrar la cuenta): se subirán a la próxima cuenta que entre. */
export function forgetSyncUser() {
  db.runSync('DELETE FROM kv WHERE key = ?', SYNC_USER_KEY);
}

/** Hay algo en el celular que no está en el respaldo de esta cuenta. */
export function hasUnbackedChanges(userId: string): boolean {
  if (getKv(SYNC_USER_KEY) !== userId) {
    return SYNC_ORDER.some((table) => db.getFirstSync(`SELECT 1 FROM ${table} LIMIT 1`) !== null);
  }
  return SYNC_ORDER.some((table) => db.getFirstSync(`SELECT 1 FROM ${table} WHERE dirty = 1 LIMIT 1`) !== null);
}

/**
 * Las metas sin dueño (creadas sin cuenta) se suben a la primera cuenta que sincroniza. Las de otra
 * cuenta (de versiones que no las borraban al cerrar sesión) se quitan: siguen en el respaldo de esa
 * cuenta y el servidor no dejaría subirlas a esta.
 */
function prepareForUser(userId: string) {
  const previous = getKv(SYNC_USER_KEY);
  if (previous === userId) return;
  if (previous) clearLocalData();
  db.withTransactionSync(() => {
    for (const table of SYNC_ORDER) {
      db.runSync(`UPDATE ${table} SET dirty = 1`);
      db.runSync('DELETE FROM kv WHERE key = ?', cursorKey(table));
    }
    setKv(SYNC_USER_KEY, userId);
  });
}

export async function performSync(client: SupabaseClient, userId: string): Promise<SyncResult> {
  prepareForUser(userId);
  return runSync(makePorts(client));
}
