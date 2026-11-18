export type SyncTable = 'goals' | 'entries';

export type SyncRow = { id: string; updated_at: string } & Record<string, unknown>;

/** Columnas compartidas con Supabase; `dirty` es solo local y `user_id` solo remoto. */
export const SYNC_COLUMNS: Record<SyncTable, readonly string[]> = {
  goals: [
    'id',
    'name',
    'direction',
    'unit',
    'color',
    'icon',
    'start_value',
    'target_value',
    'deadline',
    'frequency',
    'reminder_weekday',
    'reminder_hour',
    'reminder_minute',
    'completed_at',
    'archived_at',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  entries: ['id', 'goal_id', 'value', 'note', 'recorded_at', 'created_at', 'updated_at', 'deleted_at'],
};

/** Las metas van primero: los registros dependen de ellas. */
export const SYNC_ORDER: readonly SyncTable[] = ['goals', 'entries'];

const TIMESTAMP_COLUMNS = new Set([
  'deadline',
  'completed_at',
  'archived_at',
  'created_at',
  'updated_at',
  'deleted_at',
  'recorded_at',
]);

/**
 * Deja una fila remota con el formato local. Postgres devuelve "…+00:00" y localmente
 * se guarda "…Z": sin normalizar, los mismos instantes serían cadenas distintas.
 */
export function normalizeRemoteRow(table: SyncTable, remote: Record<string, unknown>): SyncRow {
  const row: Record<string, unknown> = {};
  for (const column of SYNC_COLUMNS[table]) {
    const value = remote[column] ?? null;
    row[column] = TIMESTAMP_COLUMNS.has(column) && typeof value === 'string' ? new Date(value).toISOString() : value;
  }
  return row as SyncRow;
}

/** Last-write-wins: en un empate se conserva lo local. */
export function shouldApplyRemote(localUpdatedAt: string | undefined, remoteUpdatedAt: string): boolean {
  if (localUpdatedAt === undefined) return true;
  return new Date(remoteUpdatedAt).getTime() > new Date(localUpdatedAt).getTime();
}

export type SyncPorts = {
  getCursor(table: SyncTable): string | null;
  setCursor(table: SyncTable, cursor: string): void;
  fetchRemote(table: SyncTable, cursor: string | null): Promise<Record<string, unknown>[]>;
  getLocalUpdatedAt(table: SyncTable, ids: string[]): Map<string, string>;
  applyRemote(table: SyncTable, rows: SyncRow[]): void;
  readDirty(table: SyncTable): SyncRow[];
  upsertRemote(table: SyncTable, rows: SyncRow[]): Promise<void>;
  /** Limpia `dirty` solo si la fila no cambió desde que se leyó. */
  markClean(table: SyncTable, rows: SyncRow[]): void;
};

export type SyncResult = { pulled: number; pushed: number };

/**
 * Trae antes de subir: así una fila local vieja nunca pisa una más nueva de la nube,
 * porque el pull ya la reemplazó y dejó de estar pendiente.
 */
export async function runSync(ports: SyncPorts): Promise<SyncResult> {
  let pulled = 0;
  for (const table of SYNC_ORDER) {
    const rows = (await ports.fetchRemote(table, ports.getCursor(table))).map((row) => normalizeRemoteRow(table, row));
    if (rows.length === 0) continue;

    const local = ports.getLocalUpdatedAt(table, rows.map((row) => row.id));
    const newer = rows.filter((row) => shouldApplyRemote(local.get(row.id), row.updated_at));
    if (newer.length > 0) ports.applyRemote(table, newer);
    pulled += newer.length;

    const latest = rows.reduce((max, row) => (row.updated_at > max ? row.updated_at : max), rows[0].updated_at);
    ports.setCursor(table, latest);
  }

  let pushed = 0;
  for (const table of SYNC_ORDER) {
    const dirty = ports.readDirty(table);
    if (dirty.length === 0) continue;
    await ports.upsertRemote(table, dirty);
    ports.markClean(table, dirty);
    pushed += dirty.length;
  }

  return { pulled, pushed };
}
