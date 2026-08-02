import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function syncWidgetData(data: WidgetSyncData): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(data));

    if (Platform.OS !== 'ios') return;

    const SharedGroupPreferences = NativeModules.SharedGroupPreferences;
    const groupName = 'group.com.northpaw.app';

    if (SharedGroupPreferences && SharedGroupPreferences.setItem) {
      await SharedGroupPreferences.setItem('dogName', data.dogName, groupName);
      await SharedGroupPreferences.setItem('statusText', data.statusText, groupName);
      await SharedGroupPreferences.setItem('airTempF', data.airTempF, groupName);
      await SharedGroupPreferences.setItem('roadTempF', data.roadTempF, groupName);
      await SharedGroupPreferences.setItem('surfaceType', data.surfaceType, groupName);
      await SharedGroupPreferences.setItem('npiScore', data.npiScore, groupName);
      if (data.actionableTime) {
        await SharedGroupPreferences.setItem('actionableTime', data.actionableTime, groupName);
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
