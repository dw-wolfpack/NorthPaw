jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios,
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  getMockMildWeather,
  getMockHotWeather85F,
  getMockColdDryWeather,
  getMockWetWindyColdWeather,
  getMockRefreezeWeather,
  getMockSevereHazardDay,
} from '../mockWeatherPresets';
import { buildTimelineBarsModel } from '../roadTemp';
import type { DogProfile } from '@/lib/profile';

describe('24-Hour End-to-End Mock Weather Scenarios & Timeline Behaviors', () => {
  const standardDogProfile: DogProfile = {
    onboardingDone: true,
    dogName: 'Cooper',
    dogPhotoUri: '',
    dogBreed: 'Golden Retriever',
    dogBreedMix: '',
    dogAgeGroup: 'adult',
    dogOutingTypes: [],
    locationPermission: 'granted',
    notificationsPermission: 'granted',
    dogWeightLbs: 65,
    dogCoatType: 'Double',
    dogColor: 'Golden',
    dogSnoutProfile: 'standard',
    dogActivityBaseline: 'moderate',
    morningBriefTime: '08:00',
    gearVault: {},
    uniqueReadinessDays: 1,
    lastReadinessDay: '2026-09-26',
  };

  test('1. Mild Day: Mostly green, sensible Best Window across daylight hours', () => {
    const weather = getMockMildWeather();
    expect(weather.status).toBe('ok');
    if (weather.status !== 'ok') return;
    expect(weather.hourlySamples).toHaveLength(24);

    const model = buildTimelineBarsModel({
      hourly: weather.hourlySamples,
      latitude: weather.latitude,
      longitude: weather.longitude,
      dogProfile: standardDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    // Daylight hours are mostly green (ready)
    const daylightPoints = model.points.filter((p) => p.isDaylight);
    expect(daylightPoints.length).toBeGreaterThanOrEqual(10);
    const readyPoints = daylightPoints.filter((p) => p.hourlyDecision === 'ready');
    expect(readyPoints.length).toBeGreaterThanOrEqual(10);

    // Sensible daylight Best Window is generated
    expect(model.bestWindowSegments.length).toBeGreaterThan(0);
    const mainBest = model.bestWindowSegments[0];
    expect(mainBest.startHour).toBeLessThanOrEqual(10);
    expect(mainBest.endHour).toBeGreaterThanOrEqual(16);
  });

  test('2. Hot Afternoon: Green morning/evening, amber/hazard peak, earlier/later Best Window', () => {
    const weather = getMockHotWeather85F();
    expect(weather.status).toBe('ok');
    if (weather.status !== 'ok') return;
    expect(weather.hourlySamples).toHaveLength(24);

    const model = buildTimelineBarsModel({
      hourly: weather.hourlySamples,
      latitude: weather.latitude,
      longitude: weather.longitude,
      surfaceType: 'asphalt',
      dogProfile: standardDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    // Peak afternoon hours (12 PM - 3 PM) must be caution or hazard due to scorching asphalt
    const peakNoon = model.points.find((p) => p.hour === 13);
    expect(peakNoon).toBeDefined();
    expect(peakNoon?.roadTempF).toBeGreaterThan(125);
    expect(['caution', 'hazard']).toContain(peakNoon?.hourlyDecision);
    expect(peakNoon?.primaryHazardDriver).toBe('heat');

    // Morning (7 AM - 9 AM) and evening (7 PM) should be ready
    const morning = model.points.find((p) => p.hour === 7);
    expect(morning?.hourlyDecision).toBe('ready');

    // Split earlier/later Best Windows
    expect(model.bestWindowSegments.length).toBeGreaterThanOrEqual(1);
    const hasMorningWindow = model.bestWindowSegments.some((w) => w.startHour <= 10);
    expect(hasMorningWindow).toBe(true);
  });

  test('3. Very Cold but Dry: Morning sub-freezing caution, afternoon crisp blue Ready window', () => {
    const weather = getMockColdDryWeather();
    expect(weather.status).toBe('ok');
    if (weather.status !== 'ok') return;
    expect(weather.hourlySamples).toHaveLength(24);

    const model = buildTimelineBarsModel({
      hourly: weather.hourlySamples,
      latitude: weather.latitude,
      longitude: weather.longitude,
      dogProfile: standardDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    // Morning hours (24°F) trigger sub-freezing caution with freezing thermalZone
    const morningCold = model.points.find((p) => p.hour === 8);
    expect(morningCold?.hourlyDecision).toBe('caution');
    expect(morningCold?.primaryHazardDriver).toBe('cold');
    expect(morningCold?.thermalZone).toBe('freezing');

    // Afternoon hours (warming to 38-39°F) transition to Ready with chilly thermalZone
    const afternoonCrisp = model.points.find((p) => p.hour === 13);
    expect(afternoonCrisp?.hourlyDecision).toBe('ready');
    expect(afternoonCrisp?.thermalZone).toBe('chilly');

    // Best Window strictly targets the afternoon warming window
    expect(model.bestWindowSegments.length).toBeGreaterThan(0);
    const window = model.bestWindowSegments[0];
    expect(window.startHour).toBeGreaterThanOrEqual(10);
  });

  test('4. Wet/Windy Cold: Amber/Red cold exposure, zero Ready hours, no contradictory Best Window', () => {
    const weather = getMockWetWindyColdWeather();
    expect(weather.status).toBe('ok');
    if (weather.status !== 'ok') return;
    expect(weather.hourlySamples).toHaveLength(24);

    const model = buildTimelineBarsModel({
      hourly: weather.hourlySamples,
      latitude: weather.latitude,
      longitude: weather.longitude,
      dogProfile: standardDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    // All daylight points should be caution or hazard due to cold exposure + gale + snow
    for (const p of model.points) {
      if (p.isDaylight) {
        expect(['caution', 'hazard']).toContain(p.hourlyDecision);
        expect(p.primaryHazardDriver).toBe('cold');
      }
    }

    // Zero ready hours -> empty bestWindowSegments (no contradictory Best Window)
    expect(model.bestWindowSegments).toEqual([]);
  });

  test('5. Forecast Refreeze: Traction Caution at freezing interface', () => {
    const weather = getMockRefreezeWeather();
    expect(weather.status).toBe('ok');
    if (weather.status !== 'ok') return;
    expect(weather.hourlySamples).toHaveLength(24);

    const model = buildTimelineBarsModel({
      hourly: weather.hourlySamples,
      latitude: weather.latitude,
      longitude: weather.longitude,
      dogProfile: standardDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    // With freezing drizzle at 31°F, traction risk is elevated to caution
    const daylightPoints = model.points.filter((p) => p.isDaylight);
    const tractionCautions = daylightPoints.filter(
      (p) => p.hourlyDecision === 'caution' && p.primaryHazardDriver === 'traction'
    );
    expect(tractionCautions.length).toBeGreaterThan(0);

    // No ready hours -> empty bestWindowSegments
    expect(model.bestWindowSegments).toEqual([]);
  });

  test('6. Entire Day Hazard: Severe sub-zero day has 0 Ready hours and empty Best Window', () => {
    const weather = getMockSevereHazardDay();
    expect(weather.status).toBe('ok');
    if (weather.status !== 'ok') return;
    expect(weather.hourlySamples).toHaveLength(24);

    const model = buildTimelineBarsModel({
      hourly: weather.hourlySamples,
      latitude: weather.latitude,
      longitude: weather.longitude,
      dogProfile: standardDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    // Entire day is elevated (caution/hazard)
    for (const p of model.points) {
      expect(['caution', 'hazard']).toContain(p.hourlyDecision);
    }

    // Zero ready hours -> empty bestWindowSegments
    expect(model.bestWindowSegments).toEqual([]);
  });
});
