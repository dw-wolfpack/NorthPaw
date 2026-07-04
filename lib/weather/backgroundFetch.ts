import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { isInsideUS } from './weatherDispatcher';
import { fetchUsWeatherAtCoordinates } from './nwsWeather';
import { fetchTomorrowWeatherAtCoordinates } from './tomorrowWeather';

const BACKGROUND_WEATHER_TASK = 'background-weather-refresh';

// Define the background task
TaskManager.defineTask(BACKGROUND_WEATHER_TASK, async () => {
  console.log('[BackgroundFetch] Running background weather fetch task...');
  try {
    // 1. Resolve coordinates
    let coords: { latitude: number; longitude: number } | null = null;

    // Check if location services are enabled and permissions are granted
    const permissions = await Location.getForegroundPermissionsAsync();
    if (permissions.granted) {
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown?.coords) {
          coords = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
          console.log('[BackgroundFetch] Found last known GPS position:', coords);
        }
      } catch (err) {
        console.warn('[BackgroundFetch] Error reading last known GPS position:', err);
      }
    }

    // Fallback to AsyncStorage cached coordinates
    if (!coords) {
      const savedCoordsStr = await AsyncStorage.getItem('@northpaw/last_fetched_lat_lon');
      if (savedCoordsStr) {
        try {
          coords = JSON.parse(savedCoordsStr);
          console.log('[BackgroundFetch] Falling back to AsyncStorage coordinates:', coords);
        } catch {
          // ignore parsing error
        }
      }
    }

    if (!coords) {
      console.log('[BackgroundFetch] No coordinates resolved. Skipping background fetch.');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // 2. Fetch the weather
    const { latitude, longitude } = coords;
    let result;
    if (isInsideUS(latitude, longitude)) {
      console.log('[BackgroundFetch] Fetching US NWS weather...');
      const nwsResult = await fetchUsWeatherAtCoordinates(latitude, longitude);
      if (nwsResult.status === 'ok') {
        result = nwsResult;
      } else {
        console.log('[BackgroundFetch] NWS weather failed. Falling back to Tomorrow.io...');
        result = await fetchTomorrowWeatherAtCoordinates(latitude, longitude);
      }
    } else {
      console.log('[BackgroundFetch] Fetching international Tomorrow.io weather...');
      result = await fetchTomorrowWeatherAtCoordinates(latitude, longitude);
    }

    // 3. Cache the weather
    if (result.status === 'ok') {
      console.log('[BackgroundFetch] Successfully fetched fresh weather. Caching result...');
      await AsyncStorage.setItem('@northpaw/cached_weather_data', JSON.stringify(result));
      await AsyncStorage.setItem('@northpaw/last_weather_fetch_time', Date.now().toString());
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    console.log('[BackgroundFetch] Fetch failed or returned unavailable status:', result);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  } catch (error) {
    console.error('[BackgroundFetch] Task crashed with error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background fetch
export async function registerBackgroundFetchAsync() {
  if (Platform.OS === 'web') return;
  if (Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient') {
    console.log('[BackgroundFetch] Skipping background task registration in Expo Go.');
    return;
  }
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEATHER_TASK);
    if (!isRegistered) {
      // BackgroundFetch runs at minimum every 6 hours
      await BackgroundFetch.registerTaskAsync(BACKGROUND_WEATHER_TASK, {
        minimumInterval: 6 * 60 * 60, // 6 hours (in seconds)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[BackgroundFetch] Background task registered successfully.');
    } else {
      console.log('[BackgroundFetch] Background task already registered.');
    }
  } catch (err) {
    console.error('[BackgroundFetch] Registration failed:', err);
  }
}

// Unregister background fetch
export async function unregisterBackgroundFetchAsync() {
  if (Platform.OS === 'web') return;
  if (Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient') return;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEATHER_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_WEATHER_TASK);
      console.log('[BackgroundFetch] Background task unregistered successfully.');
    }
  } catch (err) {
    console.error('[BackgroundFetch] Unregistration failed:', err);
  }
}
