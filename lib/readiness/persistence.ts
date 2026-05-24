import type { ReadinessDayRow } from '@/lib/database.types';
import { getReadinessDay, putReadinessDay } from '@/lib/database';

/** Device-local calendar date YYYY-MM-DD. */
export function localCalendarDateString(from: Date = new Date()): string {
  const y = from.getFullYear();
  const m = String(from.getMonth() + 1).padStart(2, '0');
  const d = String(from.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type ReadinessDayPatch = Partial<{
  conditions_viewed: boolean;
  primary_checklist_id: string;
  checklist_opened: boolean;
}>;

async function mergeRow(localDate: string, patch: ReadinessDayPatch): Promise<void> {
  const existing = await getReadinessDay(localDate);
  const next: ReadinessDayRow = {
    local_date: localDate,
    conditions_viewed:
      patch.conditions_viewed !== undefined
        ? patch.conditions_viewed
          ? 1
          : 0
        : (existing?.conditions_viewed ?? 0),
    primary_checklist_id:
      patch.primary_checklist_id != null && patch.primary_checklist_id.trim() !== ''
        ? patch.primary_checklist_id.trim()
        : (existing?.primary_checklist_id ?? ''),
    checklist_opened:
      patch.checklist_opened !== undefined
        ? patch.checklist_opened
          ? 1
          : 0
        : (existing?.checklist_opened ?? 0),
  };
  await putReadinessDay(next);
}

export async function markConditionsViewedForLocalDate(localDate: string): Promise<void> {
  await mergeRow(localDate, { conditions_viewed: true });
}

export async function setPrimaryChecklistForLocalDate(
  localDate: string,
  primaryChecklistId: string
): Promise<void> {
  if (!primaryChecklistId.trim()) return;
  await mergeRow(localDate, { primary_checklist_id: primaryChecklistId.trim() });
}

export async function markPrimaryChecklistOpenedForLocalDate(
  localDate: string,
  openedChecklistId: string
): Promise<void> {
  const row = await getReadinessDay(localDate);
  const primary = row?.primary_checklist_id?.trim();
  if (!primary || primary !== openedChecklistId.trim()) return;
  await mergeRow(localDate, { checklist_opened: true });
}

export async function loadReadinessDaySignals(localDate: string): Promise<{
  conditionsViewedToday: boolean;
  checklistOpenedToday: boolean;
  primaryChecklistId: string;
}> {
  const row = await getReadinessDay(localDate);
  return {
    conditionsViewedToday: (row?.conditions_viewed ?? 0) === 1,
    checklistOpenedToday: (row?.checklist_opened ?? 0) === 1,
    primaryChecklistId: row?.primary_checklist_id?.trim() ?? '',
  };
}
