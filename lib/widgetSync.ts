import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

import { reloadAllTimelines } from '../modules/widget-bridge';

export interface WidgetSyncData {
  dogName: string;
  statusText: string;
  airTempF: number;
  roadTempF: number;
  surfaceType: string;
  npiScore: number;
  actionableTime?: string;
  isOutingActive?: boolean;
  syncedAt?: number;
  tempUnit?: 'F' | 'C';
}

export const WIDGET_STORAGE_KEY = '@northpaw/widget_last_sync_v1';
export const WIDGET_SYNC_TIME_KEY = '@northpaw/widget_last_sync_time';
export const WIDGET_INTRO_VERSION_KEY = '@northpaw/widget_intro_version';
export const CURRENT_WIDGET_INTRO_VERSION = 1;
export const DEFAULT_WIDGET_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
export const MIN_SYNC_THROTTLE_MS = 2000; // 2 seconds

/**
 * Gets the current recorded widget introduction version for the user.
 * Defaults to 0 if never recorded.
 */
export async function getWidgetIntroVersion(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(WIDGET_INTRO_VERSION_KEY);
    if (val != null) {
      const parsed = parseInt(val, 10);
      if (Number.isFinite(parsed)) return parsed;
    }
  } catch {}
  return 0;
}

/**
 * Persists the widget introduction version once the user completes or dismisses the intro.
 */
export async function setWidgetIntroVersion(version: number = CURRENT_WIDGET_INTRO_VERSION): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_INTRO_VERSION_KEY, String(version));
  } catch (e) {
    console.warn('[WidgetSync] Failed to persist widget intro version', e);
  }
}

/**
 * Evaluates whether the 6.0 widget upgrade sheet should be presented to an existing user.
 */
export function shouldShowWidgetUpgrade(version: number): boolean {
  return version < CURRENT_WIDGET_INTRO_VERSION;
}

/**
 * Determines if widget synchronization is due based on elapsed time.
 */
export function isWidgetSyncDue(
  lastSyncTimestamp: number | null | undefined,
  now: number = Date.now(),
  intervalMs: number = DEFAULT_WIDGET_SYNC_INTERVAL_MS
): boolean {
  if (!lastSyncTimestamp || Number.isNaN(lastSyncTimestamp) || lastSyncTimestamp <= 0) {
    return true;
  }
  return (now - lastSyncTimestamp) >= intervalMs;
}

/**
 * Throttles rapid duplicate sync calls within MIN_SYNC_THROTTLE_MS.
 */
export function shouldThrottleSync(
  lastSyncTimestamp: number | null | undefined,
  now: number = Date.now(),
  throttleMs: number = MIN_SYNC_THROTTLE_MS
): boolean {
  if (!lastSyncTimestamp || Number.isNaN(lastSyncTimestamp)) {
    return false;
  }
  const diff = now - lastSyncTimestamp;
  return diff >= 0 && diff < throttleMs;
}

export async function getLastWidgetSyncTimestamp(): Promise<number | null> {
  try {
    const str = await AsyncStorage.getItem(WIDGET_SYNC_TIME_KEY);
    if (str) {
      const val = parseInt(str, 10);
      if (Number.isFinite(val)) return val;
    }
  } catch {}
  return null;
}

export async function syncWidgetData(
  data: WidgetSyncData,
  options: { force?: boolean } = {}
): Promise<boolean> {
  console.log('[WidgetSync] syncWidgetData called with:', JSON.stringify(data));
  try {
    const now = Date.now();
    const lastSync = await getLastWidgetSyncTimestamp();
    if (!options.force && shouldThrottleSync(lastSync, now)) {
      console.log('[WidgetSync] Throttled rapid duplicate sync call');
      return false;
    }

    const trimmedName = typeof data.dogName === 'string' ? data.dogName.trim() : '';
    const trimmedStatus = typeof data.statusText === 'string' ? data.statusText.trim() : '';

    let unit = data.tempUnit;
    if (!unit) {
      try {
        const storedUnit = await AsyncStorage.getItem('@northpaw_temp_unit');
        if (storedUnit === 'C' || storedUnit === 'F') {
          unit = storedUnit;
        }
      } catch {}
    }
    const resolvedUnit: 'F' | 'C' = unit === 'C' ? 'C' : 'F';

    const sanitizedData: WidgetSyncData = {
      dogName: trimmedName || 'Pup',
      statusText: trimmedStatus || 'Ready',
      airTempF: Number.isFinite(data.airTempF) ? Math.round(data.airTempF) : 72,
      roadTempF: Number.isFinite(data.roadTempF) ? Math.round(data.roadTempF) : 77,
      surfaceType: data.surfaceType || 'asphalt',
      npiScore: Number.isFinite(data.npiScore) ? Math.max(0, Math.min(100, Math.round(data.npiScore))) : 0,
      actionableTime: data.actionableTime || '',
      isOutingActive: Boolean(data.isOutingActive),
      syncedAt: data.syncedAt ?? now,
      tempUnit: resolvedUnit,
    };

    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(sanitizedData));
    await AsyncStorage.setItem(WIDGET_SYNC_TIME_KEY, String(sanitizedData.syncedAt));

    if (Platform.OS === 'ios' && SharedGroupPreferences && typeof SharedGroupPreferences.setItem === 'function') {
      const groupName = 'group.com.northpaw.app';

      await SharedGroupPreferences.setItem('dogName', sanitizedData.dogName, groupName);
      await SharedGroupPreferences.setItem('statusText', sanitizedData.statusText, groupName);
      await SharedGroupPreferences.setItem('airTempF', String(sanitizedData.airTempF), groupName);
      await SharedGroupPreferences.setItem('roadTempF', String(sanitizedData.roadTempF), groupName);
      await SharedGroupPreferences.setItem('surfaceType', sanitizedData.surfaceType, groupName);
      await SharedGroupPreferences.setItem('npiScore', String(sanitizedData.npiScore), groupName);
      await SharedGroupPreferences.setItem('isOutingActive', String(sanitizedData.isOutingActive), groupName);
      await SharedGroupPreferences.setItem('tempUnit', sanitizedData.tempUnit || 'F', groupName);
      if (sanitizedData.actionableTime) {
        await SharedGroupPreferences.setItem('actionableTime', sanitizedData.actionableTime, groupName);
      }
      await SharedGroupPreferences.setItem('lastSyncTime', String(sanitizedData.syncedAt), groupName);
      console.log('[WidgetSync] SharedGroupPreferences write completed successfully');
      reloadAllTimelines();
    }
    return true;
  } catch (e) {
    console.error('[WidgetSync] Error syncing widget data:', e);
    return false;
  }
}

export async function getLastSyncedWidgetData(): Promise<WidgetSyncData | null> {
  try {
    const json = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    if (json) return JSON.parse(json);
  } catch {}
  return null;
}

