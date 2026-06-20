import * as Location from 'expo-location';
import { HomeWeatherState, fetchUsWeatherForDeviceLocation } from './nwsWeather';
import { fetchTomorrowWeatherAtCoordinates } from './tomorrowWeather';

/**
 * Checks if a coordinate is roughly within US borders (including AK/HI).
 * Used to prioritize the free NWS service.
 */
export function isInsideUS(lat: number, lon: number): boolean {
  // Lower 48
  const isLower48 = lat >= 24.4 && lat <= 49.4 && lon >= -124.8 && lon <= -66.9;
  // Alaska
  const isAlaska = lat >= 51.2 && lat <= 71.4 && lon >= -179.1 && lon <= -129.0;
  // Hawaii
  const isHawaii = lat >= 18.9 && lat <= 28.5 && lon >= -178.4 && lon <= -154.8;

  return isLower48 || isAlaska || isHawaii;
}

export async function fetchWeatherForDeviceLocation(): Promise<
  Exclude<HomeWeatherState, { status: 'loading' }>
> {
  const startTime = Date.now();
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    return { status: 'permission_denied', isCacheHit: false, loadTimeMs: Date.now() - startTime };
  }

  let pos: Location.LocationObject | null = null;
  try {
    pos = await Location.getLastKnownPositionAsync({
      maxAge: 10 * 60 * 1000,
    });
  } catch {
    pos = null;
  }
  if (!pos) {
    try {
      pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
    } catch {
      return { status: 'unavailable', message: 'Could not read your location.', isCacheHit: false, loadTimeMs: Date.now() - startTime };
    }
  }

  const { latitude, longitude } = pos.coords;

  let result: Exclude<HomeWeatherState, { status: 'loading' }>;

  // 1. If in US, try NWS (Free)
  if (isInsideUS(latitude, longitude)) {
    const nwsResult = await fetchUsWeatherForDeviceLocation();
    if (nwsResult.status === 'ok') {
      result = nwsResult;
    } else {
      result = await fetchTomorrowWeatherAtCoordinates(latitude, longitude);
    }
  } else {
    result = await fetchTomorrowWeatherAtCoordinates(latitude, longitude);
  }

  const totalDuration = Date.now() - startTime;
  return {
    ...result,
    isCacheHit: result.isCacheHit ?? false,
    loadTimeMs: result.loadTimeMs ?? totalDuration,
  };
}
