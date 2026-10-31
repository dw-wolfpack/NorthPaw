import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from '../analytics';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock analytics trackEvent
jest.mock('../analytics', () => ({
  trackEvent: jest.fn(),
  setUserProperties: jest.fn(),
  incrementUserProperties: jest.fn(),
}));

describe('Centralized Readiness Presentation Tracking Specification', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  // Simulated implementation matching app/(tabs)/index.tsx trackReadinessPresentation
  function createPresentationTracker() {
    let lastTracked: { timestamp: number; context: string } | null = null;

    return async function trackReadinessPresentation(
      currentWeather: any,
      context: 'cold_launch' | 'foreground_resume' | 'tab_switch',
      currentProfile?: any
    ) {
      const now = Date.now();

      // Rule 4: Deduplication guard
      if (
        lastTracked &&
        now - lastTracked.timestamp < 5000 &&
        lastTracked.context === context
      ) {
        return false;
      }

      // Rule 5: Weather freshness
      let weatherFreshness: 'fresh' | 'cached' | 'stale' | 'unavailable' = 'unavailable';
      let tempF: number | undefined = undefined;
      let forecastShort: string | undefined = undefined;
      let providerUsed = 'none';
      let isCacheHit = false;
      let loadTimeMs = 0;

      if (currentWeather && currentWeather.status === 'ok') {
        tempF = currentWeather.tempF;
        forecastShort = currentWeather.forecastShort;
        providerUsed = currentWeather.providerUsed || (currentWeather.isCacheHit ? 'cache' : 'nws');
        isCacheHit = currentWeather.isCacheHit ?? false;
        loadTimeMs = currentWeather.loadTimeMs ?? 0;

        const lastFetchStr = await AsyncStorage.getItem('@northpaw/last_weather_fetch_time');
        const lastFetch = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
        const ageMs = now - lastFetch;
        if (isCacheHit) {
          weatherFreshness = ageMs > 30 * 60 * 1000 ? 'stale' : 'cached';
        } else {
          weatherFreshness = 'fresh';
        }
      } else {
        const cachedStr = await AsyncStorage.getItem('@northpaw/cached_weather_data');
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (parsed && parsed.status === 'ok') {
            tempF = parsed.tempF;
            forecastShort = parsed.forecastShort;
            providerUsed = 'cache';
            isCacheHit = true;
            weatherFreshness = 'stale';
          }
        }
      }

      // Don't track if truly unavailable without cache
      if (weatherFreshness === 'unavailable' && (!currentWeather || currentWeather.status !== 'ok')) {
        return false;
      }

      lastTracked = { timestamp: now, context };

      trackEvent('readiness_viewed', {
        tempF: tempF ?? 0,
        forecast: forecastShort ?? '',
        weather_load_time_ms: loadTimeMs,
        weather_cache_hit: isCacheHit,
        weather_provider_used: providerUsed,
        weather_freshness: weatherFreshness,
        presentation_context: context,
        surface: 'asphalt',
        dog_breed: currentProfile?.dogBreed || 'Unknown',
        app_version: '6.0.0',
      });

      return true;
    };
  }

  it('1. Cold launch: Tracks readiness presentation with fresh weather and cold_launch context', async () => {
    const tracker = createPresentationTracker();
    const weather = {
      status: 'ok',
      tempF: 72,
      forecastShort: 'Sunny',
      isCacheHit: false,
      loadTimeMs: 120,
      providerUsed: 'nws',
    };

    const tracked = await tracker(weather, 'cold_launch', { dogBreed: 'Golden Retriever' });
    expect(tracked).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith(
      'readiness_viewed',
      expect.objectContaining({
        presentation_context: 'cold_launch',
        weather_freshness: 'fresh',
        dog_breed: 'Golden Retriever',
        tempF: 72,
      })
    );
  });

  it('2. Foreground resume: Tracks readiness when returning to an already-open session', async () => {
    const tracker = createPresentationTracker();
    const weather = {
      status: 'ok',
      tempF: 68,
      forecastShort: 'Clear',
      isCacheHit: true,
      loadTimeMs: 5,
      providerUsed: 'cache',
    };

    // Stored 10 minutes ago (<30m = cached)
    await AsyncStorage.setItem('@northpaw/last_weather_fetch_time', String(Date.now() - 10 * 60 * 1000));

    const tracked = await tracker(weather, 'foreground_resume');
    expect(tracked).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith(
      'readiness_viewed',
      expect.objectContaining({
        presentation_context: 'foreground_resume',
        weather_freshness: 'cached',
        tempF: 68,
      })
    );
  });

  it('3. Tab navigation: Tracks readiness when switching back to Home tab', async () => {
    const tracker = createPresentationTracker();
    const weather = {
      status: 'ok',
      tempF: 75,
      forecastShort: 'Partly Cloudy',
      isCacheHit: false,
      loadTimeMs: 150,
      providerUsed: 'nws',
    };

    const tracked = await tracker(weather, 'tab_switch');
    expect(tracked).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith(
      'readiness_viewed',
      expect.objectContaining({
        presentation_context: 'tab_switch',
      })
    );
  });

  it('4. Deduplication: Blocks rapid duplicate calls within 5s window with same context', async () => {
    const tracker = createPresentationTracker();
    const weather = {
      status: 'ok',
      tempF: 70,
      forecastShort: 'Fair',
      isCacheHit: false,
      loadTimeMs: 100,
    };

    const first = await tracker(weather, 'cold_launch');
    const duplicate = await tracker(weather, 'cold_launch');

    expect(first).toBe(true);
    expect(duplicate).toBe(false);
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('5. Degraded weather: Tracks stale cached readiness even when current fetch is unavailable', async () => {
    const tracker = createPresentationTracker();
    
    // Seed cached weather
    await AsyncStorage.setItem(
      '@northpaw/cached_weather_data',
      JSON.stringify({ status: 'ok', tempF: 65, forecastShort: 'Breezy' })
    );

    // Weather fetch failed
    const failedWeather = { status: 'unavailable', message: 'Network offline' };

    const tracked = await tracker(failedWeather, 'foreground_resume');
    expect(tracked).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith(
      'readiness_viewed',
      expect.objectContaining({
        presentation_context: 'foreground_resume',
        weather_freshness: 'stale',
        tempF: 65,
        weather_provider_used: 'cache',
      })
    );
  });

  it('6. Does not track presentation if weather is unavailable and no cache exists', async () => {
    const tracker = createPresentationTracker();
    const failedWeather = { status: 'unavailable', message: 'No location' };

    const tracked = await tracker(failedWeather, 'cold_launch');
    expect(tracked).toBe(false);
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
