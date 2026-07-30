import AsyncStorage from '@react-native-async-storage/async-storage';

export type AssessmentSnapshot = {
  id: string;
  weatherTimestamp: string;
  algorithmVersion: string;
  surfaceType: string;
  estimatedSurfaceF: number;
  confidence: 'high' | 'medium' | 'low';
  riskCategory: string;
};

export type ActiveOuting = {
  id: string;
  dogId: string;
  startedAt: number;
  expectedDurationMinutes: number;
  source: 'home' | 'hand_test' | 'walk_window' | 'manual';
  assessmentSnapshot: AssessmentSnapshot;
  status: 'active' | 'finished' | 'cancelled' | 'expired';
  notificationId: string | null;
};

export type OutingOutcomeResponse = 'as_usual' | 'slowed' | 'struggled' | 'did_not_go';

export type OutingOutcome = {
  outingId: string;
  recordedAt: number;
  response: OutingOutcomeResponse;
  signals: string[];
  responseLatencyMinutes: number;
};

const ACTIVE_OUTING_KEY = '@northpaw_active_outing';
const OUTCOMES_STORAGE_KEY = '@northpaw_outing_outcomes';
const QUALIFIED_DAYS_KEY = '@northpaw_qualified_readiness_days';

export async function getActiveOuting(): Promise<ActiveOuting | null> {
  try {
    const json = await AsyncStorage.getItem(ACTIVE_OUTING_KEY);
    if (!json) return null;
    return JSON.parse(json) as ActiveOuting;
  } catch (e) {
    console.error('Error fetching active outing:', e);
    return null;
  }
}

export async function startOuting(params: {
  dogId: string;
  expectedDurationMinutes: number;
  source: ActiveOuting['source'];
  snapshot: AssessmentSnapshot;
  notificationId?: string | null;
}): Promise<ActiveOuting> {
  const outing: ActiveOuting = {
    id: `outing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dogId: params.dogId,
    startedAt: Date.now(),
    expectedDurationMinutes: params.expectedDurationMinutes,
    source: params.source,
    assessmentSnapshot: params.snapshot,
    status: 'active',
    notificationId: params.notificationId ?? null,
  };

  await AsyncStorage.setItem(ACTIVE_OUTING_KEY, JSON.stringify(outing));
  return outing;
}

export async function finishOuting(
  outingId: string,
  response: OutingOutcomeResponse,
  signals: string[] = []
): Promise<OutingOutcome> {
  const active = await getActiveOuting();
  const recordedAt = Date.now();
  const startedAt = active?.startedAt ?? recordedAt;
  const latencyMinutes = Math.round((recordedAt - startedAt) / 60000);

  const outcome: OutingOutcome = {
    outingId,
    recordedAt,
    response,
    signals,
    responseLatencyMinutes: latencyMinutes,
  };

  // Save outcome to local list
  const existingOutcomes = await getOutingOutcomes();
  existingOutcomes.push(outcome);
  await AsyncStorage.setItem(OUTCOMES_STORAGE_KEY, JSON.stringify(existingOutcomes));

  // Clear active outing and cancel pending notification if scheduled
  if (active?.notificationId) {
    try {
      const Notifications = require('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(active.notificationId);
    } catch (_) {}
  }
  await AsyncStorage.removeItem(ACTIVE_OUTING_KEY);

  return outcome;
}

export async function cancelActiveOuting(): Promise<void> {
  const active = await getActiveOuting();
  if (active?.notificationId) {
    try {
      const Notifications = require('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(active.notificationId);
    } catch (_) {}
  }
  await AsyncStorage.removeItem(ACTIVE_OUTING_KEY);
}

export async function extendActiveOuting(additionalMinutes: number): Promise<ActiveOuting | null> {
  const active = await getActiveOuting();
  if (!active) return null;

  let newNotificationId: string | null = active.notificationId;

  if (active.notificationId) {
    try {
      const Notifications = require('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(active.notificationId);

      const elapsedSeconds = Math.max(0, Math.round((Date.now() - active.startedAt) / 1000));
      const totalPlannedSeconds = (active.expectedDurationMinutes + additionalMinutes + 5) * 60;
      const remainingSeconds = Math.max(60, totalPlannedSeconds - elapsedSeconds);

      newNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `How did your dog handle the walk?`,
          body: `Tap to record a 1-tap private check-in.`,
          sound: true,
          data: { type: 'post_walk_checkin' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: remainingSeconds,
        },
      });
    } catch (_) {}
  }

  const updated: ActiveOuting = {
    ...active,
    expectedDurationMinutes: active.expectedDurationMinutes + additionalMinutes,
    notificationId: newNotificationId,
  };
  await AsyncStorage.setItem(ACTIVE_OUTING_KEY, JSON.stringify(updated));
  return updated;
}

export async function getOutingOutcomes(): Promise<OutingOutcome[]> {
  try {
    const json = await AsyncStorage.getItem(OUTCOMES_STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as OutingOutcome[];
  } catch (e) {
    console.error('Error fetching outcomes:', e);
    return [];
  }
}

/**
 * Phase D2: Record qualified readiness day (at most 1 entry per calendar day).
 */
export async function recordQualifiedReadinessDay(localDateIso: string): Promise<number> {
  try {
    const json = await AsyncStorage.getItem(QUALIFIED_DAYS_KEY);
    const set: string[] = json ? JSON.parse(json) : [];
    const dateKey = localDateIso.split('T')[0];
    if (!set.includes(dateKey)) {
      set.push(dateKey);
      await AsyncStorage.setItem(QUALIFIED_DAYS_KEY, JSON.stringify(set));
    }
    return set.length;
  } catch (e) {
    return 0;
  }
}

export async function getQualifiedReadinessDaysCount(): Promise<number> {
  try {
    const json = await AsyncStorage.getItem(QUALIFIED_DAYS_KEY);
    const set: string[] = json ? JSON.parse(json) : [];
    return set.length;
  } catch (e) {
    return 0;
  }
}
