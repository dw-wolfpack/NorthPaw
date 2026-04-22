/**
 * LAYER 2 — preparedness cadence (scaffold).
 * Exported for future Profile / Settings surfaces; Home uses only `careRemindersOnTrack` for a calm chip.
 */

import { Platform } from 'react-native';

import { listChecklistOutings } from '@/lib/database';
import type { PreparednessCadenceSnapshot } from '@/lib/readiness/types';
import { listMedReminders, type MedReminderRow } from '@/lib/medReminders';

function startOfLocalMonthMs(now: number): number {
  const d = new Date(now);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isWeekendLocal(ts: number): boolean {
  const day = new Date(ts).getDay();
  return day === 0 || day === 6;
}

function fourWeeksAgoMs(now: number): number {
  return now - 28 * 24 * 60 * 60 * 1000;
}

async function safeListMedReminders(): Promise<MedReminderRow[]> {
  if (Platform.OS === 'web') return [];
  try {
    return await listMedReminders();
  } catch {
    return [];
  }
}

/** True when at least one reminder is enabled and none are overdue (next due in the future). */
export function careRemindersOnTrackFromRows(rows: MedReminderRow[], nowMs: number = Date.now()): boolean {
  const enabled = rows.filter((r) => r.enabled === 1);
  if (enabled.length === 0) return false;
  return enabled.every((r) => r.next_due_at >= nowMs);
}

/**
 * Computes cadence metrics from local data. Layer-2 fields beyond `careRemindersOnTrack` are real counts
 * but not shown on Home until UX is ready (keep Home calm).
 */
export async function getPreparednessCadenceSnapshot(
  nowMs: number = Date.now()
): Promise<PreparednessCadenceSnapshot> {
  const outings = await listChecklistOutings(500);
  const monthStart = startOfLocalMonthMs(nowMs);
  const weekendCutoff = fourWeeksAgoMs(nowMs);

  let outingsPreparedThisMonth = 0;
  let weekendPrepsCompletedLast4Weeks = 0;

  for (const o of outings) {
    if (o.created_at >= monthStart) outingsPreparedThisMonth += 1;
    if (o.created_at >= weekendCutoff && isWeekendLocal(o.created_at)) {
      weekendPrepsCompletedLast4Weeks += 1;
    }
  }

  const medRows = await safeListMedReminders();
  const careRemindersOnTrack = careRemindersOnTrackFromRows(medRows, nowMs);

  return {
    outingsPreparedThisMonth,
    weekendPrepsCompletedLast4Weeks,
    careRemindersOnTrack,
  };
}
