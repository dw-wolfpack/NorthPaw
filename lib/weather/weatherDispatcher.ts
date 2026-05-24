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
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    return { status: 'permission_denied' };
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
      return { status: 'unavailable', message: 'Could not read your location.' };
    }
  }

  const { latitude, longitude } = pos.coords;

  // 1. If in US, try NWS (Free)
  if (isInsideUS(latitude, longitude)) {
    const nwsResult = await fetchUsWeatherForDeviceLocation();
    if (nwsResult.status === 'ok') {
      return nwsResult;
    }
    // If NWS is unavailable (e.g. server down or grid gap), fall back to Tomorrow.io
  }

  // 2. Global or US Fallback -> Tomorrow.io
  return fetchTomorrowWeatherAtCoordinates(latitude, longitude);
}
