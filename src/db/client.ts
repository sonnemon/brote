import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 1;

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  unit TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  start_value REAL NOT NULL,
  target_value REAL NOT NULL,
  deadline TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'free')),
  reminder_weekday INTEGER,
  reminder_hour INTEGER,
  reminder_minute INTEGER,
  completed_at TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  dirty INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT NOT NULL REFERENCES goals(id),
  value REAL NOT NULL,
  note TEXT,
  recorded_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  dirty INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_entries_goal ON entries(goal_id, recorded_at);

CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);
`;

function migrate(database: SQLiteDatabase) {
  database.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = database.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) < SCHEMA_VERSION) {
    database.withTransactionSync(() => {
      database.execSync(SCHEMA_V1);
      database.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    });
  }
}

export const db = openDatabaseSync('orbe.db');
migrate(db);
