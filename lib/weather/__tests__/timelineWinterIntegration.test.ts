jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios,
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { buildTimelineBarsModel, type HourlyInput } from '../roadTemp';
import type { DogProfile } from '@/lib/profile';

describe('Timeline Winter Integration & Unified Hourly Best Window', () => {
  const toyDogProfile: DogProfile = {
    onboardingDone: true,
    dogName: 'Pip',
    dogPhotoUri: '',
    dogBreed: 'Chihuahua',
    dogBreedMix: '',
    dogAgeGroup: 'adult',
    dogOutingTypes: [],
    locationPermission: 'granted',
    notificationsPermission: 'granted',
    dogWeightLbs: 8,
    dogCoatType: 'Short',
    dogColor: 'Tan',
    dogSnoutProfile: 'standard',
    dogActivityBaseline: 'moderate',
    morningBriefTime: '08:00',
    gearVault: {},
    uniqueReadinessDays: 1,
    lastReadinessDay: '2026-09-26',
  };

  const huskyDogProfile: DogProfile = {
    onboardingDone: true,
    dogName: 'Balto',
    dogPhotoUri: '',
    dogBreed: 'Siberian Husky',
    dogBreedMix: '',
    dogAgeGroup: 'adult',
    dogOutingTypes: [],
    locationPermission: 'granted',
    notificationsPermission: 'granted',
    dogWeightLbs: 65,
    dogCoatType: 'Double',
    dogColor: 'Gray',
    dogSnoutProfile: 'standard',
    dogActivityBaseline: 'high',
    morningBriefTime: '08:00',
    gearVault: {},
    uniqueReadinessDays: 1,
    lastReadinessDay: '2026-09-26',
  };

  function makeHourlyDay(baseTempF: number, windMph: number, precipChance = 0, shortForecast = 'Clear'): HourlyInput[] {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    return Array.from({ length: 24 }).map((_, h) => {
      const d = new Date(today);
      d.setHours(h, 0, 0, 0);
      const isDaytime = h >= 7 && h <= 17;

      return {
        timeIso: d.toISOString(),
        airTempF: baseTempF + (h === 14 ? 6 : 0), // Peak at 2 PM
        windSpeedMph: windMph,
        isDaytime,
        skyCover: 20,
        shortForecast,
        precipChance,
        precipType: (precipChance > 50 ? (baseTempF <= 32 ? 'snow' : 'rain') : 'none') as any,
        sourceType: 'forecast' as const,
        confidence: 'high' as const,
      };
    });
  }

  test('Sub-freezing 18°F blizzard: Toy dog gets 0 Ready hours; bestWindowSegments is empty', () => {
    const hourly = makeHourlyDay(18, 22, 90, 'Heavy Snow');
    const model = buildTimelineBarsModel({
      hourly,
      latitude: 44.9778,
      longitude: -93.265,
      dogProfile: toyDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    // All daytime hours should be hazard or caution due to cold exposure + snow
    for (const p of model.points) {
      if (p.isDaylight) {
        expect(['caution', 'hazard']).toContain(p.hourlyDecision);
        expect(p.primaryHazardDriver).toBe('cold');
        expect(p.thermalZone).toBe('freezing');
      }
    }

    // Invariant: bestWindowSegments must be empty when zero Ready hours
    expect(model.bestWindowSegments).toEqual([]);
  });

  test('Afternoon warming window: Morning is 22°F (Caution), Afternoon warms to 40°F (Ready)', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const hourly: HourlyInput[] = Array.from({ length: 24 }).map((_, h) => {
      const d = new Date(today);
      d.setHours(h, 0, 0, 0);
      const isDaytime = h >= 7 && h <= 17;
      // 22°F in the morning, warms to 50°F between 1 PM (13) and 3 PM (15)
      const airTempF = h >= 13 && h <= 15 ? 50 : 22;

      return {
        timeIso: d.toISOString(),
        airTempF,
        windSpeedMph: 5,
        isDaytime,
        skyCover: 10,
        shortForecast: 'Sunny',
        precipChance: 0,
        precipType: 'none',
        sourceType: 'forecast',
        confidence: 'high',
      };
    });

    const model = buildTimelineBarsModel({
      hourly,
      latitude: 40.7128,
      longitude: -74.006,
      dogProfile: toyDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    // Morning points at 22°F are hazard for high-vulnerability toy dog
    const morningPoint = model.points.find((p) => p.hour === 9);
    expect(morningPoint?.hourlyDecision).toBe('hazard');

    // Afternoon points at 50°F with calm wind should be ready
    const afternoonPoint = model.points.find((p) => p.hour === 14);
    expect(afternoonPoint?.hourlyDecision).toBe('ready');

    // Best window segments must strictly include the afternoon window and exclude morning
    expect(model.bestWindowSegments.length).toBeGreaterThan(0);
    const primary = model.bestWindowSegments[0];
    expect(primary.startHour).toBeGreaterThanOrEqual(13);
    expect(primary.endHour).toBeLessThanOrEqual(16);
  });

  test('Husky at 28°F sub-freezing calm dry: receives cold advisory (Caution), thermalZone is freezing', () => {
    const hourly = makeHourlyDay(28, 4, 0, 'Clear');
    const model = buildTimelineBarsModel({
      hourly,
      latitude: 44.9778,
      longitude: -93.265,
      dogProfile: huskyDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    const noon = model.points.find((p) => p.hour === 12);
    expect(noon).toBeDefined();
    // Sub-freezing 28°F produces cold advisory (Caution) even for hardy double coats
    expect(noon?.hourlyDecision).toBe('caution');
    expect(noon?.primaryHazardDriver).toBe('cold');
    // thermalZone is 'freezing' for presentation palette
    expect(noon?.thermalZone).toBe('freezing');
  });

  test('Husky at 38°F calm dry conditions is Ready; thermalZone is chilly (presentation contextual cue)', () => {
    const hourly = makeHourlyDay(38, 4, 0, 'Clear');
    const model = buildTimelineBarsModel({
      hourly,
      latitude: 44.9778,
      longitude: -93.265,
      dogProfile: huskyDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    for (const p of model.points) {
      if (p.isDaylight) {
        expect(p.hourlyDecision).toBe('ready');
        expect(p.thermalZone).toBe('chilly');
      }
    }

    // Because daylight hours are ready, bestWindowSegments is populated
    expect(model.bestWindowSegments.length).toBeGreaterThan(0);
  });

  test('Summer hot pavement: 85°F ambient produces high pavement temp and Caution/Hazard on timeline', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const hourly: HourlyInput[] = Array.from({ length: 24 }).map((_, h) => {
      const d = new Date(today);
      d.setHours(h, 0, 0, 0);
      const isDaytime = h >= 6 && h <= 20;

      return {
        timeIso: d.toISOString(),
        airTempF: 85,
        windSpeedMph: 4,
        isDaytime,
        skyCover: 0,
        shortForecast: 'Sunny',
        precipChance: 0,
        precipType: 'none',
        sourceType: 'forecast',
        confidence: 'high',
      };
    });

    const model = buildTimelineBarsModel({
      hourly,
      latitude: 30.2672,
      longitude: -97.7431,
      surfaceType: 'asphalt',
      dogProfile: toyDogProfile,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    const noon = model.points.find((p) => p.hour === 13);
    expect(noon?.roadTempF).toBeGreaterThan(110);
    expect(['caution', 'hazard']).toContain(noon?.hourlyDecision);
    expect(noon?.primaryHazardDriver).toBe('heat');
  });
});
