jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios,
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: {} },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getLastKnownPositionAsync: jest.fn().mockResolvedValue(null),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 30.2672, longitude: -97.7431 } }),
  Accuracy: { Low: 1, High: 2 },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getActiveMockWeatherPreset,
  setMockWeatherPreset,
  getMockFreezingWeather,
  getMockRefreezeWeather,
  getMockHotWeather85F,
  getMockMildWeather,
  fetchWeatherForDeviceLocation,
  MOCK_WEATHER_PRESET_KEY,
} from '../weatherDispatcher';

describe('Weather Dispatcher — Dev Simulation Presets', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterAll(async () => {
    await AsyncStorage.clear();
  });

  test('default preset is "live" when storage is empty', async () => {
    const preset = await getActiveMockWeatherPreset();
    expect(preset).toBe('live');
  });

  test('setMockWeatherPreset("cold_wet_windy") persists and causes fetchWeather to return 24°F snow weather', async () => {
    await setMockWeatherPreset('cold_wet_windy');
    const preset = await getActiveMockWeatherPreset();
    expect(preset).toBe('cold_wet_windy');

    const weather = await fetchWeatherForDeviceLocation();
    expect(weather.status).toBe('ok');
    if (weather.status === 'ok') {
      expect(weather.tempF).toBe(24);
      expect(weather.summary).toContain('Snow');
      expect(weather.windLine).toContain('24 mph');
      expect(weather.precipChance).toBe(85);
    }
  });

  test('setMockWeatherPreset("refreeze") persists and causes fetchWeather to return 31°F slick refreeze', async () => {
    await setMockWeatherPreset('refreeze');
    const preset = await getActiveMockWeatherPreset();
    expect(preset).toBe('refreeze');

    const weather = await fetchWeatherForDeviceLocation();
    expect(weather.status).toBe('ok');
    if (weather.status === 'ok') {
      expect(weather.tempF).toBe(31);
      expect(weather.summary).toContain('Refreeze');
      expect(weather.precipChance).toBe(20);
    }
  });

  test('setMockWeatherPreset("hot") persists and causes fetchWeather to return 92°F hot weather', async () => {
    await setMockWeatherPreset('hot');
    const preset = await getActiveMockWeatherPreset();
    expect(preset).toBe('hot');

    const weather = await fetchWeatherForDeviceLocation();
    expect(weather.status).toBe('ok');
    if (weather.status === 'ok') {
      expect(weather.tempF).toBe(92);
      expect(weather.summary).toContain('Hot');
    }
  });

  test('setMockWeatherPreset("cold_dry") persists and causes fetchWeather to return 38°F crisp weather', async () => {
    await setMockWeatherPreset('cold_dry');
    const preset = await getActiveMockWeatherPreset();
    expect(preset).toBe('cold_dry');

    const weather = await fetchWeatherForDeviceLocation();
    expect(weather.status).toBe('ok');
    if (weather.status === 'ok') {
      expect(weather.tempF).toBe(38);
      expect(weather.summary).toContain('Crisp');
      expect(weather.windLine).toContain('Calm');
    }
  });

  test('setMockWeatherPreset("hazard_day") persists and causes fetchWeather to return sub-zero weather', async () => {
    await setMockWeatherPreset('hazard_day');
    const preset = await getActiveMockWeatherPreset();
    expect(preset).toBe('hazard_day');

    const weather = await fetchWeatherForDeviceLocation();
    expect(weather.status).toBe('ok');
    if (weather.status === 'ok') {
      expect(weather.tempF).toBe(-2);
      expect(weather.summary).toContain('Sub-Zero');
    }
  });

  test('setMockWeatherPreset("mild") persists and causes fetchWeather to return 62°F comfortable weather', async () => {
    await setMockWeatherPreset('mild');
    const preset = await getActiveMockWeatherPreset();
    expect(preset).toBe('mild');

    const weather = await fetchWeatherForDeviceLocation();
    expect(weather.status).toBe('ok');
    if (weather.status === 'ok') {
      expect(weather.tempF).toBe(62);
      expect(weather.summary).toContain('Pleasant');
    }
  });

  test('switching presets busts cached weather data and fetch timestamps', async () => {
    await AsyncStorage.setItem('@northpaw/cached_weather_data', '{"some":"cache"}');
    await AsyncStorage.setItem('@northpaw/last_weather_fetch_time', '123456');

    await setMockWeatherPreset('freezing');

    const cachedData = await AsyncStorage.getItem('@northpaw/cached_weather_data');
    const lastFetch = await AsyncStorage.getItem('@northpaw/last_weather_fetch_time');

    expect(cachedData).toBeNull();
    expect(lastFetch).toBeNull();
  });

  test('setMockWeatherPreset("live") removes the preset key', async () => {
    await setMockWeatherPreset('freezing');
    await setMockWeatherPreset('live');

    const raw = await AsyncStorage.getItem(MOCK_WEATHER_PRESET_KEY);
    expect(raw).toBeNull();
    const preset = await getActiveMockWeatherPreset();
    expect(preset).toBe('live');
  });
});
