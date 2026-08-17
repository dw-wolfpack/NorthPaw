import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

export interface WidgetSyncData {
  dogName: string;
  statusText: string;
  airTempF: number;
  roadTempF: number;
  surfaceType: string;
  npiScore: number;
  actionableTime?: string;
  isOutingActive?: boolean;
}

const WIDGET_STORAGE_KEY = '@northpaw/widget_last_sync_v1';

export async function syncWidgetData(data: WidgetSyncData): Promise<void> {
  console.log('[WidgetSync] syncWidgetData called with:', JSON.stringify(data));
  try {
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(data));

    if (Platform.OS !== 'ios') return;

    const groupName = 'group.com.northpaw.app';

    await SharedGroupPreferences.setItem('dogName', data.dogName, groupName);
    await SharedGroupPreferences.setItem('statusText', data.statusText, groupName);
    await SharedGroupPreferences.setItem('airTempF', data.airTempF, groupName);
    await SharedGroupPreferences.setItem('roadTempF', data.roadTempF, groupName);
    await SharedGroupPreferences.setItem('surfaceType', data.surfaceType, groupName);
    await SharedGroupPreferences.setItem('npiScore', data.npiScore, groupName);
    await SharedGroupPreferences.setItem('isOutingActive', String(data.isOutingActive ?? false), groupName);
    if (data.actionableTime) {
      await SharedGroupPreferences.setItem('actionableTime', data.actionableTime, groupName);
    }
    console.log('[WidgetSync] SharedGroupPreferences write completed successfully');
  } catch (e) {
    console.error('[WidgetSync] Error syncing widget data:', e);
  }
}

export async function getLastSyncedWidgetData(): Promise<WidgetSyncData | null> {
  try {
    const json = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    if (json) return JSON.parse(json);
  } catch {}
  return null;
}
