/**
 * Web / SSR: avoid expo-sqlite (WASM not bundled for Metro web in all setups).
 * Uses localStorage in the browser; in-memory fallback during SSR or when storage is missing.
 */
import type {
  ChecklistOutingRow,
  EntityType,
  FavoriteRow,
  HistoryRow,
  SaveChecklistOutingInput,
} from '@/lib/database.types';

import { finalizeOutingPhotos, removeOutingFiles } from '@/lib/outingPhotoStorage';

const K_FAV = 'northpaw_favorites_v1';
const K_HIST = 'northpaw_history_v1';
const K_CHECKS = 'northpaw_checklists_v1';
const K_OUTINGS = 'northpaw_outings_v1';

/** Copied from new key on first read so legacy web installs keep local data. */
const LEGACY_FAV = 'trailready_favorites_v1';
const LEGACY_HIST = 'trailready_history_v1';
const LEGACY_CHECKS = 'trailready_checklists_v1';
const LEGACY_OUTINGS = 'trailready_outings_v1';

const OUTINGS_CAP = 200;

const mem = {
  favorites: [] as FavoriteRow[],
  history: [] as HistoryRow[],
  checks: {} as Record<string, Record<string, boolean>>,
  outings: [] as ChecklistOutingRow[],
};

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function readStoragePref(key: string, legacyKey: string): string | null {
  if (!canUseStorage()) return null;
  const v = localStorage.getItem(key);
  if (v != null && v !== '') return v;
  const old = localStorage.getItem(legacyKey);
  if (old) {
    try {
      localStorage.setItem(key, old);
    } catch {
      /* ignore */
    }
  }
  return old;
}

function readFavorites(): FavoriteRow[] {
  if (!canUseStorage()) return [...mem.favorites];
  try {
    const raw = readStoragePref(K_FAV, LEGACY_FAV);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavorites(rows: FavoriteRow[]) {
  if (!canUseStorage()) {
    mem.favorites = rows;
    return;
  }
  try {
    localStorage.setItem(K_FAV, JSON.stringify(rows));
  } catch {
    mem.favorites = rows;
  }
}

function readHistory(): HistoryRow[] {
  if (!canUseStorage()) return [...mem.history];
  try {
    const raw = readStoragePref(K_HIST, LEGACY_HIST);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(rows: HistoryRow[]) {
  if (!canUseStorage()) {
    mem.history = rows;
    return;
  }
  try {
    localStorage.setItem(K_HIST, JSON.stringify(rows.slice(0, 500)));
  } catch {
    mem.history = rows;
  }
}

function readChecks(): Record<string, Record<string, boolean>> {
  if (!canUseStorage()) return { ...mem.checks };
  try {
    const raw = readStoragePref(K_CHECKS, LEGACY_CHECKS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Record<string, boolean>>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeChecks(data: Record<string, Record<string, boolean>>) {
  if (!canUseStorage()) {
    mem.checks = data;
    return;
  }
  try {
    localStorage.setItem(K_CHECKS, JSON.stringify(data));
  } catch {
    mem.checks = data;
  }
}

function readOutings(): ChecklistOutingRow[] {
  if (!canUseStorage()) return mem.outings.map(normalizeOutingRow);
  try {
    const raw = readStoragePref(K_OUTINGS, LEGACY_OUTINGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChecklistOutingRow[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeOutingRow);
  } catch {
    return [];
  }
}

function writeOutings(rows: ChecklistOutingRow[]) {
  if (!canUseStorage()) {
    mem.outings = rows;
    return;
  }
  try {
    localStorage.setItem(K_OUTINGS, JSON.stringify(rows.slice(0, OUTINGS_CAP)));
  } catch {
    mem.outings = rows;
  }
}

/** No-op on web; keeps the same API as native for app bootstrap. */
export async function getDb(): Promise<null> {
  return null;
}

export type { ChecklistOutingRow, EntityType, FavoriteRow, HistoryRow, SaveChecklistOutingInput };

function normalizeOutingRow(r: ChecklistOutingRow): ChecklistOutingRow {
  return {
    ...r,
    place_label: r.place_label ?? '',
    latitude: r.latitude != null ? r.latitude : null,
    longitude: r.longitude != null ? r.longitude : null,
    photos_json: r.photos_json ?? '[]',
  };
}

export async function addFavorite(type: EntityType, entityId: string): Promise<void> {
  const rows = readFavorites().filter((r) => !(r.entity_type === type && r.entity_id === entityId));
  rows.unshift({ entity_type: type, entity_id: entityId, created_at: Date.now() });
  writeFavorites(rows);
}

export async function removeFavorite(type: EntityType, entityId: string): Promise<void> {
  writeFavorites(readFavorites().filter((r) => !(r.entity_type === type && r.entity_id === entityId)));
}

export async function isFavorite(type: EntityType, entityId: string): Promise<boolean> {
  return readFavorites().some((r) => r.entity_type === type && r.entity_id === entityId);
}

export async function listFavorites(): Promise<FavoriteRow[]> {
  return readFavorites().sort((a, b) => b.created_at - a.created_at);
}

export async function recordOpen(type: EntityType, entityId: string): Promise<void> {
  const rows = readHistory();
  rows.unshift({ entity_type: type, entity_id: entityId, opened_at: Date.now() });
  writeHistory(rows.slice(0, 500));
}

export async function listRecentHistory(limit: number): Promise<HistoryRow[]> {
  return readHistory()
    .sort((a, b) => b.opened_at - a.opened_at)
    .slice(0, limit);
}

export async function setChecklistItemChecked(
  checklistId: string,
  itemId: string,
  checked: boolean
): Promise<void> {
  const all = readChecks();
  if (!all[checklistId]) all[checklistId] = {};
  if (checked) all[checklistId][itemId] = true;
  else delete all[checklistId][itemId];
  writeChecks(all);
}

export async function getChecklistCheckedIds(checklistId: string): Promise<Set<string>> {
  const all = readChecks()[checklistId];
  if (!all) return new Set();
  return new Set(Object.keys(all).filter((k) => all[k]));
}

export async function clearChecklistProgress(checklistId: string): Promise<void> {
  const all = readChecks();
  delete all[checklistId];
  writeChecks(all);
}

/** All outing logs for this checklist (and any stored photo payloads); then cleared checklist boxes. */
export async function clearChecklistAllLocal(checklistId: string): Promise<void> {
  const outings = readOutings().filter((r) => r.checklist_id === checklistId);
  for (const r of outings) {
    await removeOutingFiles(r.id);
  }
  writeOutings(readOutings().filter((r) => r.checklist_id !== checklistId));
  await clearChecklistProgress(checklistId);
}

function newOutingId(): string {
  return `og-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveChecklistOuting(input: SaveChecklistOutingInput): Promise<string> {
  const id = newOutingId();
  const photos = await finalizeOutingPhotos(id, input.pendingPhotoUris);
  const row: ChecklistOutingRow = {
    id,
    checklist_id: input.checklistId,
    created_at: Date.now(),
    notes: input.notes,
    checked_item_ids_json: JSON.stringify([...new Set(input.checkedItemIds)].sort()),
    place_label: input.placeLabel.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    photos_json: JSON.stringify(photos),
  };
  const next = [row, ...readOutings()].slice(0, OUTINGS_CAP);
  writeOutings(next);
  return id;
}

export async function listChecklistOutings(limit: number): Promise<ChecklistOutingRow[]> {
  return readOutings()
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
}

export async function getChecklistOuting(id: string): Promise<ChecklistOutingRow | null> {
  return readOutings().find((r) => r.id === id) ?? null;
}

export async function deleteChecklistOuting(id: string): Promise<void> {
  await removeOutingFiles(id);
  writeOutings(readOutings().filter((r) => r.id !== id));
}
