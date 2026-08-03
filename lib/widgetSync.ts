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
}

const WIDGET_STORAGE_KEY = '@northpaw/widget_last_sync_v1';
const APP_GROUP_KEY = 'group.com.northpaw.app';

export async function syncWidgetData(data: WidgetSyncData): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(data));

    if (Platform.OS !== 'ios') return;

    if (SharedGroupPreferences && SharedGroupPreferences.setItem) {
      await SharedGroupPreferences.setItem('dogName', data.dogName, APP_GROUP_KEY);
      await SharedGroupPreferences.setItem('statusText', data.statusText, APP_GROUP_KEY);
      await SharedGroupPreferences.setItem('airTempF', Math.round(data.airTempF), APP_GROUP_KEY);
      await SharedGroupPreferences.setItem('roadTempF', Math.round(data.roadTempF), APP_GROUP_KEY);
      await SharedGroupPreferences.setItem('surfaceType', data.surfaceType, APP_GROUP_KEY);
      await SharedGroupPreferences.setItem('npiScore', Math.round(data.npiScore), APP_GROUP_KEY);
      if (data.actionableTime) {
        await SharedGroupPreferences.setItem('actionableTime', data.actionableTime, APP_GROUP_KEY);
      }
    }
  } catch (e) {
    console.warn('[WidgetSync] Notice - widget data update:', e);
  }
}

export async function getLastSyncedWidgetData(): Promise<WidgetSyncData | null> {
  try {
    const json = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    if (json) return JSON.parse(json);
  } catch {}
  return null;
}
