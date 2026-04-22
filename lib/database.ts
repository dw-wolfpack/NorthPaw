import * as SQLite from 'expo-sqlite';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type {
  ChecklistOutingRow,
  EntityType,
  FavoriteRow,
  HistoryRow,
  ReadinessDayRow,
  SaveChecklistOutingInput,
} from '@/lib/database.types';

import { finalizeOutingPhotos, removeOutingFiles } from '@/lib/outingPhotoStorage';

export type {
  ChecklistOutingRow,
  EntityType,
  FavoriteRow,
  HistoryRow,
  ReadinessDayRow,
  SaveChecklistOutingInput,
};

let dbSingleton: SQLite.SQLiteDatabase | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS favorites (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (entity_type, entity_id)
    );
    CREATE TABLE IF NOT EXISTS open_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      opened_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_history_time ON open_history (opened_at DESC);
    CREATE TABLE IF NOT EXISTS checklist_checks (
      checklist_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (checklist_id, item_id)
    );
    CREATE TABLE IF NOT EXISTS checklist_outings (
      id TEXT PRIMARY KEY NOT NULL,
      checklist_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      checked_item_ids_json TEXT NOT NULL,
      place_label TEXT NOT NULL DEFAULT '',
      latitude REAL,
      longitude REAL,
      photos_json TEXT NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_outings_time ON checklist_outings (created_at);
    CREATE TABLE IF NOT EXISTS app_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      onboarding_done INTEGER NOT NULL DEFAULT 0,
      dog_name TEXT NOT NULL DEFAULT '',
      dog_photo_uri TEXT NOT NULL DEFAULT '',
      dog_weight_lbs INTEGER,
      dog_coat_type TEXT NOT NULL DEFAULT '',
      dog_color TEXT NOT NULL DEFAULT ''
    );
    INSERT OR IGNORE INTO app_profile (id, onboarding_done, dog_name, dog_photo_uri) VALUES (1, 0, '', '');
    CREATE TABLE IF NOT EXISTS med_reminders (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      custom_label TEXT NOT NULL DEFAULT '',
      interval_days INTEGER NOT NULL,
      next_due_at INTEGER NOT NULL,
      last_completed_at INTEGER,
      hour_local INTEGER NOT NULL DEFAULT 9,
      minute_local INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      notification_id TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS readiness_day (
      local_date TEXT PRIMARY KEY NOT NULL,
      conditions_viewed INTEGER NOT NULL DEFAULT 0,
      primary_checklist_id TEXT NOT NULL DEFAULT '',
      checklist_opened INTEGER NOT NULL DEFAULT 0
    );
  `);
  await migrateChecklistOutingsV2(db);
  await migrateAppProfileV2(db);
}

async function migrateChecklistOutingsV2(db: SQLite.SQLiteDatabase) {
  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(checklist_outings)');
  if (cols.length === 0) return;
  const has = (n: string) => cols.some((c) => c.name === n);
  if (!has('place_label')) {
    await db.execAsync(`ALTER TABLE checklist_outings ADD COLUMN place_label TEXT NOT NULL DEFAULT '';`);
  }
  if (!has('latitude')) {
    await db.execAsync(`ALTER TABLE checklist_outings ADD COLUMN latitude REAL;`);
  }
  if (!has('longitude')) {
    await db.execAsync(`ALTER TABLE checklist_outings ADD COLUMN longitude REAL;`);
  }
  if (!has('photos_json')) {
    await db.execAsync(`ALTER TABLE checklist_outings ADD COLUMN photos_json TEXT NOT NULL DEFAULT '[]';`);
  }
}

async function migrateAppProfileV2(db: SQLite.SQLiteDatabase) {
  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(app_profile)');
  if (cols.length === 0) return;
  const has = (n: string) => cols.some((c) => c.name === n);
  if (!has('dog_breed')) {
    await db.execAsync(`ALTER TABLE app_profile ADD COLUMN dog_breed TEXT NOT NULL DEFAULT '';`);
  }
  if (!has('dog_breed_mix')) {
    await db.execAsync(`ALTER TABLE app_profile ADD COLUMN dog_breed_mix TEXT NOT NULL DEFAULT '';`);
  }
  if (!has('dog_age_group')) {
    await db.execAsync(`ALTER TABLE app_profile ADD COLUMN dog_age_group TEXT NOT NULL DEFAULT '';`);
  }
  if (!has('dog_outing_types_json')) {
    await db.execAsync(`ALTER TABLE app_profile ADD COLUMN dog_outing_types_json TEXT NOT NULL DEFAULT '[]';`);
  }
  if (!has('location_permission')) {
    await db.execAsync(`ALTER TABLE app_profile ADD COLUMN location_permission TEXT NOT NULL DEFAULT '';`);
  }
  if (!has('notifications_permission')) {
    await db.execAsync(`ALTER TABLE app_profile ADD COLUMN notifications_permission TEXT NOT NULL DEFAULT '';`);
  }
  if (!has('dog_weight_lbs')) {
    await db.execAsync(`ALTER TABLE app_profile ADD COLUMN dog_weight_lbs INTEGER;`);
  }
  if (!has('dog_coat_type')) {
    await db.execAsync(`ALTER TABLE app_profile ADD COLUMN dog_coat_type TEXT NOT NULL DEFAULT '';`);
  }
  if (!has('dog_color')) {
    await db.execAsync(`ALTER TABLE app_profile ADD COLUMN dog_color TEXT NOT NULL DEFAULT '';`);
  }
}

function renameLegacySqliteIfNeeded(): void {
  if (Platform.OS === 'web') return;
  try {
    const sqlDir = new Directory(Paths.document, 'SQLite');
    if (!sqlDir.exists) return;
    const oldFile = new File(sqlDir, 'trailready.db');
    const newFile = new File(sqlDir, 'northpaw.db');
    if (oldFile.exists && !newFile.exists) {
      oldFile.move(newFile);
    }
  } catch {
    /* best-effort; fresh northpaw.db otherwise */
  }
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbSingleton) return dbSingleton;
  renameLegacySqliteIfNeeded();
  const db = await SQLite.openDatabaseAsync('northpaw.db');
  await migrate(db);
  dbSingleton = db;
  return db;
}

export async function addFavorite(type: EntityType, entityId: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT OR REPLACE INTO favorites (entity_type, entity_id, created_at) VALUES (?, ?, ?)`,
    [type, entityId, now]
  );
}

export async function removeFavorite(type: EntityType, entityId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM favorites WHERE entity_type = ? AND entity_id = ?`, [type, entityId]);
}

export async function isFavorite(type: EntityType, entityId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM favorites WHERE entity_type = ? AND entity_id = ?`,
    [type, entityId]
  );
  return (row?.c ?? 0) > 0;
}

export async function listFavorites(): Promise<FavoriteRow[]> {
  const db = await getDb();
  return await db.getAllAsync<FavoriteRow>(
    `SELECT entity_type, entity_id, created_at FROM favorites ORDER BY created_at DESC`
  );
}

export async function recordOpen(type: EntityType, entityId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO open_history (entity_type, entity_id, opened_at) VALUES (?, ?, ?)`,
    [type, entityId, Date.now()]
  );
}

export async function listRecentHistory(limit: number): Promise<HistoryRow[]> {
  const db = await getDb();
  return await db.getAllAsync<HistoryRow>(
    `SELECT entity_type, entity_id, opened_at FROM open_history ORDER BY opened_at DESC LIMIT ?`,
    [limit]
  );
}

export async function setChecklistItemChecked(
  checklistId: string,
  itemId: string,
  checked: boolean
): Promise<void> {
  const db = await getDb();
  if (checked) {
    await db.runAsync(
      `INSERT OR REPLACE INTO checklist_checks (checklist_id, item_id, checked) VALUES (?, ?, 1)`,
      [checklistId, itemId]
    );
  } else {
    await db.runAsync(`DELETE FROM checklist_checks WHERE checklist_id = ? AND item_id = ?`, [
      checklistId,
      itemId,
    ]);
  }
}

export async function getChecklistCheckedIds(checklistId: string): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ item_id: string }>(
    `SELECT item_id FROM checklist_checks WHERE checklist_id = ? AND checked = 1`,
    [checklistId]
  );
  return new Set(rows.map((r) => r.item_id));
}

export async function clearChecklistProgress(checklistId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM checklist_checks WHERE checklist_id = ?`, [checklistId]);
}

/** All outing logs for this checklist + filesystem photos; then cleared checklist boxes. */
export async function clearChecklistAllLocal(checklistId: string): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM checklist_outings WHERE checklist_id = ?`,
    [checklistId]
  );
  for (const r of rows) {
    await removeOutingFiles(r.id);
  }
  await db.runAsync(`DELETE FROM checklist_outings WHERE checklist_id = ?`, [checklistId]);
  await db.runAsync(`DELETE FROM checklist_checks WHERE checklist_id = ?`, [checklistId]);
}

function newOutingId(): string {
  return `og-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveChecklistOuting(input: SaveChecklistOutingInput): Promise<string> {
  const id = newOutingId();
  const photos = await finalizeOutingPhotos(id, input.pendingPhotoUris);
  const db = await getDb();
  const json = JSON.stringify([...new Set(input.checkedItemIds)].sort());
  const photosJson = JSON.stringify(photos);
  await db.runAsync(
    `INSERT INTO checklist_outings (id, checklist_id, created_at, notes, checked_item_ids_json, place_label, latitude, longitude, photos_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.checklistId,
      Date.now(),
      input.notes,
      json,
      input.placeLabel.trim(),
      input.latitude,
      input.longitude,
      photosJson,
    ]
  );
  
  // Behavioral Retention: Schedule a "tick check" notification for 4 hours from now
  // since saving the checklist implies the prep is done and the outing is starting.
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for couch snuggles 🛋️',
        body: 'Give your dog a quick feel for ticks or burrs after today\'s outing.',
        sound: true,
        data: { url: '/tick-check' },
      },
      trigger: {
        seconds: 4 * 60 * 60, // 4 hours
      },
    });
  } catch (err) {
    // Ignore if permissions not granted or other notification errors
  }

  return id;
}

const OUTING_SELECT = `SELECT id, checklist_id, created_at, notes, checked_item_ids_json, place_label, latitude, longitude, photos_json FROM checklist_outings`;

function normalizeOutingRow(r: ChecklistOutingRow): ChecklistOutingRow {
  return {
    ...r,
    place_label: r.place_label ?? '',
    latitude: r.latitude != null ? r.latitude : null,
    longitude: r.longitude != null ? r.longitude : null,
    photos_json: r.photos_json ?? '[]',
  };
}

export async function listChecklistOutings(limit: number): Promise<ChecklistOutingRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ChecklistOutingRow>(
    `${OUTING_SELECT} ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map(normalizeOutingRow);
}

export async function getChecklistOuting(id: string): Promise<ChecklistOutingRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ChecklistOutingRow>(`${OUTING_SELECT} WHERE id = ?`, [id]);
  return row ? normalizeOutingRow(row) : null;
}

export async function deleteChecklistOuting(id: string): Promise<void> {
  await removeOutingFiles(id);
  const db = await getDb();
  await db.runAsync(`DELETE FROM checklist_outings WHERE id = ?`, [id]);
}

export async function getReadinessDay(localDate: string): Promise<ReadinessDayRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ReadinessDayRow>(
    `SELECT local_date, conditions_viewed, primary_checklist_id, checklist_opened FROM readiness_day WHERE local_date = ?`,
    [localDate]
  );
  return row ?? null;
}

export async function putReadinessDay(row: ReadinessDayRow): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO readiness_day (local_date, conditions_viewed, primary_checklist_id, checklist_opened) VALUES (?, ?, ?, ?)`,
    [row.local_date, row.conditions_viewed ? 1 : 0, row.primary_checklist_id, row.checklist_opened ? 1 : 0]
  );
}
