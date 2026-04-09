import * as Notifications from 'expo-notifications';
import { IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import { getDb } from '@/lib/database';
import { getDogProfile } from '@/lib/profile';

const ANDROID_CHANNEL = 'med-reminders';

export type MedReminderKind = 'heartworm' | 'flea_tick' | 'custom';

export type MedReminderRow = {
  id: string;
  kind: MedReminderKind;
  custom_label: string;
  interval_days: number;
  next_due_at: number;
  last_completed_at: number | null;
  hour_local: number;
  minute_local: number;
  enabled: number;
  notification_id: string;
};

function newMedId(): string {
  return `med-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function medReminderDisplayLabel(row: MedReminderRow): string {
  if (row.kind === 'custom') return row.custom_label.trim() || 'Custom reminder';
  if (row.kind === 'heartworm') return 'Heartworm prevention';
  return 'Flea & tick prevention';
}

export async function ensureMedReminderAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: 'Dog care reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2D6A4F',
  });
}

type NotificationPermState = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

/** Expo: use `granted` and iOS provisional, not `status` alone. */
function notificationsPermitted(p: NotificationPermState): boolean {
  if (p.granted) return true;
  if (Platform.OS === 'ios' && p.ios?.status === IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  return false;
}

export type MedReminderPermissionResult =
  | { ok: true }
  | { ok: false; canAskAgain: boolean };

/**
 * Shows the system notification permission prompt when the OS allows it.
 * Does not leave the app; if permission stays off, the UI can offer Settings.
 */
export async function requestMedReminderPermissions(): Promise<MedReminderPermissionResult> {
  if (Platform.OS === 'web') return { ok: false, canAskAgain: true };

  await ensureMedReminderAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  if (notificationsPermitted(existing)) return { ok: true };

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  if (notificationsPermitted(requested)) return { ok: true };

  return { ok: false, canAskAgain: requested.canAskAgain };
}

export function computeFirstDueAt(
  firstDueInDays: number,
  hourLocal: number,
  minuteLocal: number
): number {
  const d = new Date();
  const add = Math.max(0, Math.floor(firstDueInDays));
  d.setDate(d.getDate() + add);
  d.setHours(hourLocal, minuteLocal, 0, 0);
  let t = d.getTime();
  if (t <= Date.now()) {
    d.setDate(d.getDate() + 1);
    t = d.getTime();
  }
  return t;
}

export function computeNextDueAfterCompletion(
  completedMs: number,
  intervalDays: number,
  hourLocal: number,
  minuteLocal: number
): number {
  const d = new Date(completedMs);
  d.setDate(d.getDate() + Math.max(1, Math.floor(intervalDays)));
  d.setHours(hourLocal, minuteLocal, 0, 0);
  let t = d.getTime();
  if (t <= completedMs) {
    d.setDate(d.getDate() + 1);
    t = d.getTime();
  }
  return t;
}

/** Advance next_due_at until it is in the future (missed doses). */
export function rollNextDueForward(
  nextDueAt: number,
  intervalDays: number,
  hourLocal: number,
  minuteLocal: number
): number {
  const interval = Math.max(1, Math.floor(intervalDays));
  let t = nextDueAt;
  const d = new Date(t);
  let guard = 0;
  while (t <= Date.now() && guard++ < 400) {
    d.setTime(t);
    d.setDate(d.getDate() + interval);
    d.setHours(hourLocal, minuteLocal, 0, 0);
    t = d.getTime();
  }
  if (t <= Date.now()) {
    return computeFirstDueAt(0, hourLocal, minuteLocal);
  }
  return t;
}

async function cancelScheduledNotification(notificationId: string): Promise<void> {
  if (!notificationId.trim()) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    /* stale id */
  }
}

export async function listMedReminders(): Promise<MedReminderRow[]> {
  const db = await getDb();
  return await db.getAllAsync<MedReminderRow>(
    `SELECT id, kind, custom_label, interval_days, next_due_at, last_completed_at, hour_local, minute_local, enabled, notification_id
     FROM med_reminders ORDER BY next_due_at ASC`
  );
}

export async function countMedReminderByKind(kind: MedReminderKind): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM med_reminders WHERE kind = ?`,
    [kind]
  );
  return row?.c ?? 0;
}

export type AddMedReminderInput = {
  kind: MedReminderKind;
  customLabel: string;
  intervalDays: number;
  firstDueInDays: number;
  hourLocal: number;
  minuteLocal: number;
};

export async function addMedReminder(input: AddMedReminderInput): Promise<MedReminderRow> {
  const interval = Math.min(120, Math.max(1, Math.floor(input.intervalDays)));
  const h = Math.min(23, Math.max(0, Math.floor(input.hourLocal)));
  const m = Math.min(59, Math.max(0, Math.floor(input.minuteLocal)));
  const next = computeFirstDueAt(Math.max(0, Math.floor(input.firstDueInDays)), h, m);
  const id = newMedId();
  const label =
    input.kind === 'custom' ? input.customLabel.trim().slice(0, 80) : '';

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO med_reminders (id, kind, custom_label, interval_days, next_due_at, last_completed_at, hour_local, minute_local, enabled, notification_id)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, 1, '')`,
    [id, input.kind, label, interval, next, h, m]
  );

  const row = await db.getFirstAsync<MedReminderRow>(
    `SELECT id, kind, custom_label, interval_days, next_due_at, last_completed_at, hour_local, minute_local, enabled, notification_id FROM med_reminders WHERE id = ?`,
    [id]
  );
  if (!row) throw new Error('Failed to create reminder');
  return row;
}

export async function deleteMedReminder(id: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ notification_id: string }>(
    `SELECT notification_id FROM med_reminders WHERE id = ?`,
    [id]
  );
  if (row?.notification_id) {
    await cancelScheduledNotification(row.notification_id);
  }
  await db.runAsync(`DELETE FROM med_reminders WHERE id = ?`, [id]);
}

export async function setMedReminderEnabled(id: string, enabled: boolean): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<MedReminderRow>(
    `SELECT * FROM med_reminders WHERE id = ?`,
    [id]
  );
  if (!row) return;
  if (row.notification_id) {
    await cancelScheduledNotification(row.notification_id);
  }
  await db.runAsync(`UPDATE med_reminders SET enabled = ?, notification_id = '' WHERE id = ?`, [
    enabled ? 1 : 0,
    id,
  ]);
}

/** Free-tier presets only: custom label/kind stays Pro-only elsewhere. */
export async function updatePresetMedReminderSchedule(
  id: string,
  input: {
    intervalDays: number;
    firstDueInDays: number;
    hourLocal: number;
    minuteLocal: number;
  }
): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<MedReminderRow>(`SELECT * FROM med_reminders WHERE id = ?`, [id]);
  if (!row) return;
  if (row.kind !== 'heartworm' && row.kind !== 'flea_tick') return;

  const interval = Math.min(120, Math.max(1, Math.floor(input.intervalDays)));
  const h = Math.min(23, Math.max(0, Math.floor(input.hourLocal)));
  const m = Math.min(59, Math.max(0, Math.floor(input.minuteLocal)));
  const next = computeFirstDueAt(Math.max(0, Math.floor(input.firstDueInDays)), h, m);

  if (row.notification_id) {
    await cancelScheduledNotification(row.notification_id);
  }
  await db.runAsync(
    `UPDATE med_reminders SET interval_days = ?, hour_local = ?, minute_local = ?, next_due_at = ?, notification_id = '' WHERE id = ?`,
    [interval, h, m, next, id]
  );
}

export async function markMedReminderCompleted(id: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<MedReminderRow>(
    `SELECT * FROM med_reminders WHERE id = ?`,
    [id]
  );
  if (!row) return;
  if (row.notification_id) {
    await cancelScheduledNotification(row.notification_id);
  }
  const now = Date.now();
  const next = computeNextDueAfterCompletion(now, row.interval_days, row.hour_local, row.minute_local);
  await db.runAsync(
    `UPDATE med_reminders SET last_completed_at = ?, next_due_at = ?, notification_id = '' WHERE id = ?`,
    [now, next, id]
  );
}

async function scheduleOne(row: MedReminderRow, dogName: string): Promise<string> {
  const when = row.next_due_at;
  if (when <= Date.now() + 2_000) {
    return '';
  }

  const label = medReminderDisplayLabel(row);
  const body = dogName
    ? `Time for ${label} — ${dogName}. Educational reminder only; follow your vet’s plan.`
    : `Time for ${label}. Educational reminder only; follow your vet’s plan.`;

  const trigger: Notifications.DateTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(when),
    channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
  };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${label}`,
      body,
      data: { reminderId: row.id },
      sound: true,
    },
    trigger,
  });
}

/**
 * Reconcile SQLite with OS schedule: cancel stale IDs, fix overdue next_due, schedule next alert.
 */
export async function syncAllMedReminderNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  await ensureMedReminderAndroidChannel();
  const perm = await Notifications.getPermissionsAsync();
  if (!notificationsPermitted(perm)) return;

  const profile = await getDogProfile();
  const dogName = profile.dogName.trim();
  const db = await getDb();
  const rows = await db.getAllAsync<MedReminderRow>(
    `SELECT * FROM med_reminders WHERE enabled = 1`
  );

  for (const row of rows) {
    await cancelScheduledNotification(row.notification_id);

    let next = row.next_due_at;
    if (next <= Date.now()) {
      next = rollNextDueForward(next, row.interval_days, row.hour_local, row.minute_local);
      await db.runAsync(`UPDATE med_reminders SET next_due_at = ? WHERE id = ?`, [next, row.id]);
    }

    const updated = { ...row, next_due_at: next };
    const nid = await scheduleOne(updated, dogName);
    await db.runAsync(`UPDATE med_reminders SET notification_id = ? WHERE id = ?`, [nid, row.id]);
  }
}

/** After row mutations from UI (no platform). */
export async function rescheduleMedRemindersFromUi(): Promise<void> {
  try {
    await syncAllMedReminderNotifications();
  } catch (e) {
    console.warn('[med reminders] sync failed', e);
  }
}
