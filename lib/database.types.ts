export type EntityType = 'card' | 'checklist' | 'pack';

export type FavoriteRow = { entity_type: EntityType; entity_id: string; created_at: number };

export type HistoryRow = { entity_type: EntityType; entity_id: string; opened_at: number };

/** One saved outing: snapshot of checked items + optional notes (Pro). */
export type ChecklistOutingRow = {
  id: string;
  checklist_id: string;
  created_at: number;
  notes: string;
  /** JSON-encoded `string[]` of item ids that were checked when the user saved. */
  checked_item_ids_json: string;
  /** Trail, park, or neighborhood label (free text). */
  place_label: string;
  latitude: number | null;
  longitude: number | null;
  /** JSON-encoded `string[]` of file:// or data: URIs (photos). */
  photos_json: string;
};

/** Day-scoped outing readiness signals (device-local calendar date). */
export type ReadinessDayRow = {
  local_date: string;
  conditions_viewed: number;
  primary_checklist_id: string;
  checklist_opened: number;
};

export type SaveChecklistOutingInput = {
  checklistId: string;
  notes: string;
  checkedItemIds: string[];
  placeLabel: string;
  latitude: number | null;
  longitude: number | null;
  /** URIs from the image picker; persisted by `saveChecklistOuting`. */
  pendingPhotoUris: string[];
};
