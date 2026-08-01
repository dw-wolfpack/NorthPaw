import AsyncStorage from '@react-native-async-storage/async-storage';
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

/**
 * Generates realistic 85°F sunny summer weather with super-hot pavement temps
 * (Asphalt ~134°F, Turf ~155°F, Concrete ~121°F) for App Store marketing screenshots.
 */
export function getMockHotWeather85F(): Exclude<HomeWeatherState, { status: 'loading' }> {
  const noonDate = new Date();
  noonDate.setHours(12, 0, 0, 0);

  const hourlySamples = Array.from({ length: 24 }).map((_, h) => {
    const dateObj = new Date(noonDate);
    dateObj.setHours(h, 0, 0, 0);

    const isDaytime = h >= 6 && h <= 20;

    let tempF = 72;
    let skyCover = 0;

    if (h >= 6 && h <= 20) {
      const solarFactor = Math.sin(((h - 6) / 14) * Math.PI);
      tempF = Math.round(72 + solarFactor * 13); // Peaking at 85°F at 12:00-14:00
      skyCover = 5; // Clear skies
    } else {
      tempF = Math.round(72 - Math.min(6, (h < 6 ? 6 - h : h - 20) * 0.8));
    }

    return {
      timeIso: dateObj.toISOString(),
      airTempF: tempF,
      windSpeedMph: 3.5, // Light breeze for realistic high pavement heat retention
      isDaytime,
      skyCover,
      humidityPct: 28,
    };
  });

  return {
    status: 'ok',
    latitude: 30.2672,
    longitude: -97.7431,
    place: 'Austin, TX',
    tempF: 85,
    summary: 'Sunny & Hot',
    windLine: 'Wind 4 mph • SE',
    updatedLabel: '12:00 PM',
    updatedIso: noonDate.toISOString(),
    stationDistanceMiles: 1.2,
    sourceNote: 'Demo Mode (12:00 PM Noon)',
    hazardTags: [],
    hazardAlerts: [],
    forecastShort: 'Sunny',
    precipChance: 0,
    isDaytime: true,
    weekendOutlook: [],
    timelineSlots: [],
    hourlyForecastAvailable: true,
    hourlySamples,
    sunsetTimeIso: null,
    mockAqi: 22,
    mockRecentRain: false,
    isCacheHit: true,
    loadTimeMs: 12,
  };
}

export async function fetchWeatherForDeviceLocation(): Promise<
  Exclude<HomeWeatherState, { status: 'loading' }>
> {
  const startTime = Date.now();

  // Check if Mock Hot Weather (85°F Demo Mode) is enabled for App Store screenshots
  try {
    const isMockEnabled = await AsyncStorage.getItem('@northpaw/mock_hot_weather_enabled');
    if (isMockEnabled === 'true') {
      return getMockHotWeather85F();
    }
  } catch {}

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
    } catch (lowErr) {
      console.warn('[WeatherDispatcher] Low accuracy fetch failed, trying High accuracy...', lowErr);
      try {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      } catch (highErr) {
        console.error('[WeatherDispatcher] Location retrieval failed completely:', highErr);
        return { status: 'unavailable', message: 'Could not read your location.', isCacheHit: false, loadTimeMs: Date.now() - startTime };
      }
    }
  }

  const { latitude, longitude } = pos.coords;

  let result: Exclude<HomeWeatherState, { status: 'loading' }>;
  let providerUsed: 'nws' | 'tomorrow' | 'cache' = 'nws';

  // 1. If in US, try NWS (Free)
  if (isInsideUS(latitude, longitude)) {
    const nwsResult = await fetchUsWeatherForDeviceLocation();
    if (nwsResult.status === 'ok') {
      result = nwsResult;
      providerUsed = nwsResult.isCacheHit ? 'cache' : 'nws';
    } else {
      const tomorrowResult = await fetchTomorrowWeatherAtCoordinates(latitude, longitude);
      result = tomorrowResult;
      providerUsed = tomorrowResult.isCacheHit ? 'cache' : 'tomorrow';
    }
  } else {
    const tomorrowResult = await fetchTomorrowWeatherAtCoordinates(latitude, longitude);
    result = tomorrowResult;
    providerUsed = tomorrowResult.isCacheHit ? 'cache' : 'tomorrow';
  }

  const totalDuration = Date.now() - startTime;
  return {
    ...result,
    providerUsed,
    isCacheHit: result.isCacheHit ?? false,
    loadTimeMs: result.loadTimeMs ?? totalDuration,
  };
}
