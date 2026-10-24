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

import {
  getMockFreezingWeather,
  getMockRefreezeWeather,
  getMockHotWeather85F,
  getMockMildWeather,
} from '../mockWeatherPresets';

describe('Provider Normalization — Hourly Conditions & Provenance', () => {
  test('Freezing preset preserves hourly precipitation, snow type, and forecast provenance', () => {
    const weather = getMockFreezingWeather();
    expect(weather.status).toBe('ok');
    if (weather.status !== 'ok') return;

    expect(weather.hourlySamples.length).toBeGreaterThan(0);

    for (const sample of weather.hourlySamples) {
      expect(sample.shortForecast).toContain('Snow');
      expect(sample.precipChance).toBe(85);
      expect(sample.precipType).toBe('snow');
      expect(sample.sourceType).toBe('forecast');
      expect(sample.confidence).toBe('high');
    }
  });

  test('Refreeze preset preserves refreeze forecast, none/ground proxy type, and forecast provenance', () => {
    const weather = getMockRefreezeWeather();
    expect(weather.status).toBe('ok');
    if (weather.status !== 'ok') return;

    expect(weather.hourlySamples.length).toBeGreaterThan(0);

    for (const sample of weather.hourlySamples) {
      expect(sample.shortForecast).toContain('Refreeze');
      expect(sample.precipChance).toBe(20);
      expect(sample.sourceType).toBe('forecast');
      expect(sample.confidence).toBe('high');
    }
  });

  test('Mild and Hot presets preserve clear/sunny conditions and zero precip', () => {
    const mild = getMockMildWeather();
    expect(mild.status).toBe('ok');
    if (mild.status === 'ok') {
      expect(mild.hourlySamples[0].precipChance).toBe(0);
      expect(mild.hourlySamples[0].precipType).toBe('none');
      expect(mild.hourlySamples[0].sourceType).toBe('forecast');
    }

    const hot = getMockHotWeather85F();
    expect(hot.status).toBe('ok');
    if (hot.status === 'ok') {
      expect(hot.hourlySamples[12].airTempF).toBeGreaterThanOrEqual(85);
      expect(hot.hourlySamples[12].precipChance).toBe(0);
      expect(hot.hourlySamples[12].precipType).toBe('none');
    }
  });
});
