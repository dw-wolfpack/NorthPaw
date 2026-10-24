/**
 * Mock Weather Presets for Developer Simulation & UI Verification
 *
 * Scenarios:
 * 1. Mild Day: mostly green, sensible Best Window.
 * 2. Hot Afternoon: green -> amber/orange/red transition and earlier/later Best Window.
 * 3. Very Cold but Dry: blue Ready where appropriate + amber Caution where appropriate.
 * 4. Wet/Windy Cold: amber/red and no contradictory Best Window.
 * 5. Forecast Refreeze: traction Caution and truthful scrubber copy.
 * 6. Entire Day Hazard: No Ready window today, with no green "safe" language hiding elsewhere.
 * 7. Live: restores live GPS weather.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeWeatherState } from './nwsWeather';

export type MockWeatherPreset =
  | 'live'
  | 'mild'
  | 'hot'
  | 'cold_dry'
  | 'cold_wet_windy'
  | 'refreeze'
  | 'hazard_day'
  | 'freezing'; // legacy alias for cold_wet_windy

export const MOCK_WEATHER_PRESET_KEY = '@northpaw/mock_weather_preset';

/**
 * 1. Mild Day (62°F · Pleasant): Mostly green, sensible daylight Best Window.
 */
export function getMockMildWeather(): Exclude<HomeWeatherState, { status: 'loading' }> {
  const now = new Date();
  const hourlySamples = Array.from({ length: 24 }).map((_, h) => {
    const dateObj = new Date(now);
    dateObj.setHours(h, 0, 0, 0);
    const isDaytime = h >= 6 && h <= 19;

    // Smooth diurnal curve: 50°F at night, 62°F at 2 PM, 55°F at 8 PM
    let tempF = 50;
    if (h >= 6 && h <= 19) {
      const solarFactor = Math.sin(((h - 6) / 13) * Math.PI);
      tempF = Math.round(50 + solarFactor * 12); // 50 -> 62 -> 50
    } else if (h > 19) {
      tempF = Math.round(53 - (h - 19) * 0.7);
    } else {
      tempF = Math.round(48 + h * 0.3);
    }

    return {
      timeIso: dateObj.toISOString(),
      airTempF: tempF,
      windSpeedMph: 8,
      isDaytime,
      skyCover: 40, // Partly sunny with gentle breeze keeps asphalt cool (<77°F)
      humidityPct: 45,
      shortForecast: 'Partly Sunny & Pleasant',
      precipChance: 0,
      precipType: 'none' as const,
      sourceType: 'forecast' as const,
      confidence: 'high' as const,
    };
  });

  return {
    status: 'ok',
    latitude: 37.7749,
    longitude: -122.4194,
    place: 'San Francisco, CA (Simulated)',
    tempF: 62,
    summary: 'Partly Sunny & Pleasant',
    windLine: 'Wind 8 mph • W',
    updatedLabel: 'Just now',
    updatedIso: now.toISOString(),
    stationDistanceMiles: 1.0,
    sourceNote: 'Dev Simulation (Mild Day)',
    hazardTags: [],
    hazardAlerts: [],
    forecastShort: 'Pleasant and Comfortable',
    precipChance: 0,
    isDaytime: true,
    weekendOutlook: [],
    timelineSlots: [],
    hourlyForecastAvailable: true,
    hourlySamples,
    sunsetTimeIso: null,
    mockAqi: 25,
    mockRecentRain: false,
    isCacheHit: true,
    loadTimeMs: 10,
  };
}

/**
 * 2. Hot Afternoon (64°F -> 92°F -> 70°F · Asphalt up to 138°F):
 * Green morning/evening with Amber/Orange/Red peak and split early/late Best Windows.
 */
export function getMockHotWeather85F(): Exclude<HomeWeatherState, { status: 'loading' }> {
  const noonDate = new Date();
  noonDate.setHours(12, 0, 0, 0);

  const hourlySamples = Array.from({ length: 24 }).map((_, h) => {
    const dateObj = new Date(noonDate);
    dateObj.setHours(h, 0, 0, 0);
    const isDaytime = h >= 6 && h <= 20;

    let tempF = 58;
    if (h >= 6 && h <= 20) {
      const solarFactor = Math.sin(((h - 6) / 14) * Math.PI);
      tempF = Math.round(58 + Math.pow(solarFactor, 1.4) * 34); // 58°F at 6 AM -> 62°F at 7 AM -> 92°F peak at 1 PM -> 68°F at 8 PM
    } else if (h > 20) {
      tempF = Math.round(65 - (h - 20) * 1.5);
    } else {
      tempF = Math.round(55 + h * 0.5);
    }

    return {
      timeIso: dateObj.toISOString(),
      airTempF: tempF,
      windSpeedMph: 4,
      isDaytime,
      skyCover: 0, // Clear blazing sun
      humidityPct: 30,
      shortForecast: 'Sunny & Hot',
      precipChance: 0,
      precipType: 'none' as const,
      sourceType: 'forecast' as const,
      confidence: 'high' as const,
    };
  });

  return {
    status: 'ok',
    latitude: 30.2672,
    longitude: -97.7431,
    place: 'Austin, TX (Simulated)',
    tempF: 92,
    summary: 'Scorching Sun & Hot Pavement',
    windLine: 'Wind 4 mph • SE',
    updatedLabel: '1:00 PM',
    updatedIso: noonDate.toISOString(),
    stationDistanceMiles: 1.2,
    sourceNote: 'Dev Simulation (Hot Afternoon)',
    hazardTags: [],
    hazardAlerts: ['Heat Advisory'],
    forecastShort: 'Hot and Sunny',
    precipChance: 0,
    isDaytime: true,
    weekendOutlook: [],
    timelineSlots: [],
    hourlyForecastAvailable: true,
    hourlySamples,
    sunsetTimeIso: null,
    mockAqi: 35,
    mockRecentRain: false,
    isCacheHit: true,
    loadTimeMs: 12,
  };
}

/**
 * 3. Very Cold but Dry (24°F morning -> 39°F afternoon · Calm):
 * Sub-freezing morning Amber Caution -> Afternoon crisp Ice Blue Ready window.
 */
export function getMockColdDryWeather(): Exclude<HomeWeatherState, { status: 'loading' }> {
  const now = new Date();
  const hourlySamples = Array.from({ length: 24 }).map((_, h) => {
    const dateObj = new Date(now);
    dateObj.setHours(h, 0, 0, 0);
    const isDaytime = h >= 7 && h <= 17;

    // Sub-freezing morning (24°F), warms to 39°F at 2 PM, drops to 26°F at dusk
    let tempF = 22;
    if (h >= 7 && h <= 17) {
      const solarFactor = Math.sin(((h - 7) / 10) * Math.PI);
      tempF = Math.round(24 + solarFactor * 15); // 24°F -> 39°F at peak (12-2 PM)
    } else if (h > 17) {
      tempF = Math.round(28 - (h - 17) * 1.0);
    } else {
      tempF = Math.round(20 + h * 0.5);
    }

    return {
      timeIso: dateObj.toISOString(),
      airTempF: tempF,
      windSpeedMph: 4, // Calm wind prevents wind chill escalation
      isDaytime,
      skyCover: 10,
      humidityPct: 35,
      shortForecast: 'Sunny & Crisp',
      precipChance: 0,
      precipType: 'none' as const,
      sourceType: 'forecast' as const,
      confidence: 'high' as const,
    };
  });

  return {
    status: 'ok',
    latitude: 39.7392,
    longitude: -104.9903,
    place: 'Denver, CO (Simulated)',
    tempF: 38,
    summary: 'Sunny, Crisp & Dry',
    windLine: 'Wind 4 mph • Calm',
    updatedLabel: 'Just now',
    updatedIso: now.toISOString(),
    stationDistanceMiles: 1.8,
    sourceNote: 'Dev Simulation (Cold but Dry)',
    hazardTags: [],
    hazardAlerts: [],
    forecastShort: 'Crisp and Dry',
    precipChance: 0,
    isDaytime: true,
    weekendOutlook: [],
    timelineSlots: [],
    hourlyForecastAvailable: true,
    hourlySamples,
    sunsetTimeIso: null,
    mockAqi: 18,
    mockRecentRain: false,
    isCacheHit: true,
    loadTimeMs: 10,
  };
}

/**
 * 4. Wet & Windy Cold (24°F · Snow · 24 mph wind):
 * Amber/Red cold exposure throughout; zero Ready hours, no contradictory Best Window.
 */
export function getMockWetWindyColdWeather(): Exclude<HomeWeatherState, { status: 'loading' }> {
  const now = new Date();
  const hourlySamples = Array.from({ length: 24 }).map((_, h) => {
    const dateObj = new Date(now);
    dateObj.setHours(h, 0, 0, 0);
    const isDaytime = h >= 7 && h <= 17;

    return {
      timeIso: dateObj.toISOString(),
      airTempF: 24 + (isDaytime ? 2 : -2),
      windSpeedMph: 24,
      isDaytime,
      skyCover: 95,
      humidityPct: 88,
      shortForecast: 'Blowing Snow & Gale',
      precipChance: 85,
      precipType: 'snow' as const,
      sourceType: 'forecast' as const,
      confidence: 'high' as const,
    };
  });

  return {
    status: 'ok',
    latitude: 44.9778,
    longitude: -93.265,
    place: 'Minneapolis, MN (Simulated)',
    tempF: 24,
    summary: 'Blowing Snow & High Winds',
    windLine: 'Wind 24 mph • NW',
    updatedLabel: 'Just now',
    updatedIso: now.toISOString(),
    stationDistanceMiles: 1.5,
    sourceNote: 'Dev Simulation (Wet/Windy Cold)',
    hazardTags: [],
    hazardAlerts: ['Winter Weather Advisory'],
    forecastShort: 'Snow and Gale Wind',
    precipChance: 85,
    isDaytime: true,
    weekendOutlook: [],
    timelineSlots: [],
    hourlyForecastAvailable: true,
    hourlySamples,
    sunsetTimeIso: null,
    mockAqi: 15,
    mockRecentRain: true,
    isCacheHit: true,
    loadTimeMs: 10,
  };
}

/** Alias for backwards-compatibility */
export const getMockFreezingWeather = getMockWetWindyColdWeather;

/**
 * 5. Forecast Refreeze (31°F · Patchy Freezing Fog & Refreeze):
 * Traction Caution with truthful "Possible slick refreeze" scrubber copy.
 */
export function getMockRefreezeWeather(): Exclude<HomeWeatherState, { status: 'loading' }> {
  const now = new Date();
  const hourlySamples = Array.from({ length: 24 }).map((_, h) => {
    const dateObj = new Date(now);
    dateObj.setHours(h, 0, 0, 0);
    const isDaytime = h >= 7 && h <= 17;
    return {
      timeIso: dateObj.toISOString(),
      airTempF: 31 + (isDaytime ? 1 : -1),
      windSpeedMph: 5, // Calm wind keeps cold exposure at advisory, allowing traction caution to lead
      isDaytime,
      skyCover: 85,
      humidityPct: 90,
      shortForecast: 'Patchy Freezing Fog & Refreeze',
      precipChance: 20,
      precipType: 'none' as const,
      sourceType: 'forecast' as const,
      confidence: 'high' as const,
    };
  });

  return {
    status: 'ok',
    latitude: 41.8781,
    longitude: -87.6298,
    place: 'Chicago, IL (Simulated)',
    tempF: 31,
    summary: 'Patchy Freezing Fog & Slick Refreeze',
    windLine: 'Wind 5 mph • Calm',
    updatedLabel: 'Just now',
    updatedIso: now.toISOString(),
    stationDistanceMiles: 2.1,
    sourceNote: 'Dev Simulation (Refreeze)',
    hazardTags: [],
    hazardAlerts: ['Slick Surface Alert'],
    forecastShort: 'Freezing Fog & Slick Surfaces',
    precipChance: 20,
    isDaytime: true,
    weekendOutlook: [],
    timelineSlots: [],
    hourlyForecastAvailable: true,
    hourlySamples,
    sunsetTimeIso: null,
    mockAqi: 20,
    mockRecentRain: true,
    isCacheHit: true,
    loadTimeMs: 10,
  };
}

/**
 * 6. Severe Hazard Day (-2°F · Gale):
 * Entire day Caution/Hazard -> No Ready window today, zero green "safe" language anywhere.
 */
export function getMockSevereHazardDay(): Exclude<HomeWeatherState, { status: 'loading' }> {
  const now = new Date();
  const hourlySamples = Array.from({ length: 24 }).map((_, h) => {
    const dateObj = new Date(now);
    dateObj.setHours(h, 0, 0, 0);
    const isDaytime = h >= 7 && h <= 17;

    return {
      timeIso: dateObj.toISOString(),
      airTempF: -2 + (isDaytime ? 3 : -3), // -5°F to 1°F
      windSpeedMph: 24,
      isDaytime,
      skyCover: 80,
      humidityPct: 75,
      shortForecast: 'Extreme Sub-Zero Cold',
      precipChance: 20,
      precipType: 'snow' as const,
      sourceType: 'forecast' as const,
      confidence: 'high' as const,
    };
  });

  return {
    status: 'ok',
    latitude: 46.7867,
    longitude: -92.1005,
    place: 'Duluth, MN (Simulated)',
    tempF: -2,
    summary: 'Sub-Zero Wind Chill Warning',
    windLine: 'Wind 24 mph • NW',
    updatedLabel: 'Just now',
    updatedIso: now.toISOString(),
    stationDistanceMiles: 2.5,
    sourceNote: 'Dev Simulation (Severe Hazard Day)',
    hazardTags: [],
    hazardAlerts: ['Extreme Cold Warning'],
    forecastShort: 'Sub-Zero Cold Gale',
    precipChance: 20,
    isDaytime: true,
    weekendOutlook: [],
    timelineSlots: [],
    hourlyForecastAvailable: true,
    hourlySamples,
    sunsetTimeIso: null,
    mockAqi: 12,
    mockRecentRain: false,
    isCacheHit: true,
    loadTimeMs: 10,
  };
}

export function getMockWeatherForPreset(
  preset: MockWeatherPreset
): Exclude<HomeWeatherState, { status: 'loading' }> | null {
  switch (preset) {
    case 'mild':
      return getMockMildWeather();
    case 'hot':
      return getMockHotWeather85F();
    case 'cold_dry':
      return getMockColdDryWeather();
    case 'cold_wet_windy':
    case 'freezing':
      return getMockWetWindyColdWeather();
    case 'refreeze':
      return getMockRefreezeWeather();
    case 'hazard_day':
      return getMockSevereHazardDay();
    case 'live':
    default:
      return null;
  }
}

export async function getActiveMockWeatherPreset(): Promise<MockWeatherPreset> {
  try {
    const val = await AsyncStorage.getItem(MOCK_WEATHER_PRESET_KEY);
    if (
      val === 'mild' ||
      val === 'hot' ||
      val === 'cold_dry' ||
      val === 'cold_wet_windy' ||
      val === 'refreeze' ||
      val === 'hazard_day' ||
      val === 'freezing'
    ) {
      return val as MockWeatherPreset;
    }
    const legacyHot = await AsyncStorage.getItem('@northpaw/mock_hot_weather_enabled');
    if (legacyHot === 'true') return 'hot';
  } catch {}
  return 'live';
}

export async function setMockWeatherPreset(preset: MockWeatherPreset): Promise<void> {
  try {
    if (preset === 'live') {
      await AsyncStorage.removeItem(MOCK_WEATHER_PRESET_KEY);
      await AsyncStorage.removeItem('@northpaw/mock_hot_weather_enabled');
    } else {
      await AsyncStorage.setItem(MOCK_WEATHER_PRESET_KEY, preset);
      if (preset === 'hot') {
        await AsyncStorage.setItem('@northpaw/mock_hot_weather_enabled', 'true');
      } else {
        await AsyncStorage.removeItem('@northpaw/mock_hot_weather_enabled');
      }
    }
    // Bust cached weather so next load or pull-to-refresh gets the new simulated state immediately
    await AsyncStorage.removeItem('@northpaw/cached_weather_data');
    await AsyncStorage.removeItem('@northpaw/last_weather_fetch_time');
  } catch (err) {
    console.warn('[MockWeatherPresets] Failed to set mock weather preset:', err);
  }
}
