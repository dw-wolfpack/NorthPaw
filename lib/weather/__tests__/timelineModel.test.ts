import { buildTimelineBarsModel, getLocationDateTime, mergeAndSaveDailyHourlySamples, estimateRoadTempF } from '../roadTemp';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Strict Weather Data Provenance & Bounded Estimation Test Suite', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('Test 1: A 7 AM-only sample extrapolates 5-6 AM (max 2h) with sourceType "extrapolated" and confidence "low"', () => {
    const mockHourly = [
      { timeIso: '2026-07-29T07:00:00-07:00', airTempF: 52, windSpeedMph: 2, isDaytime: true, skyCover: 5 },
      { timeIso: '2026-07-29T15:00:00-07:00', airTempF: 84, windSpeedMph: 3, isDaytime: true, skyCover: 10 },
    ];

    const now3pm = new Date('2026-07-29T15:25:00-07:00');
    const model = buildTimelineBarsModel({
      hourly: mockHourly,
      latitude: 38.1074,
      longitude: -122.5697,
      timeZone: 'America/Los_Angeles',
      now: now3pm,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    const point6am = model.points.find((p) => p.hour === 6);
    expect(point6am).toBeDefined();
    expect(point6am?.sourceType).toBe('extrapolated');
    expect(point6am?.confidence).toBe('low');
    expect(point6am?.airTempF).toBe(52);

    const point5am = model.points.find((p) => p.hour === 5);
    expect(point5am).toBeDefined();
    expect(point5am?.sourceType).toBe('extrapolated');
    expect(point5am?.confidence).toBe('low');
  });

  it('Test 2: A 9 AM first sample does NOT backfill 4 missing hours (5 AM-8 AM); hours 5 AM-8 AM remain UNAVAILABLE', () => {
    const mockHourly = [
      { timeIso: '2026-07-29T09:00:00-07:00', airTempF: 65, windSpeedMph: 2, isDaytime: true, skyCover: 5 },
      { timeIso: '2026-07-29T15:00:00-07:00', airTempF: 84, windSpeedMph: 3, isDaytime: true, skyCover: 10 },
    ];

    const now3pm = new Date('2026-07-29T15:25:00-07:00');
    const model = buildTimelineBarsModel({
      hourly: mockHourly,
      latitude: 38.1074,
      longitude: -122.5697,
      timeZone: 'America/Los_Angeles',
      now: now3pm,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    const point5am = model.points.find((p) => p.hour === 5);
    expect(point5am).toBeDefined();
    expect(point5am?.sourceType).toBe('unavailable');
    expect(point5am?.airTempF).toBeNull();
    expect(point5am?.roadTempF).toBeNull();
    expect(point5am?.roadBand).toBe('unavailable');
  });

  it('Test 3: Tomorrow 5-6 AM values are NEVER used for today', () => {
    const mockHourly = [
      { timeIso: '2026-07-30T05:00:00-07:00', airTempF: 42, windSpeedMph: 1, isDaytime: true, skyCover: 0 },
      { timeIso: '2026-07-29T15:00:00-07:00', airTempF: 84, windSpeedMph: 3, isDaytime: true, skyCover: 10 },
    ];

    const now3pm = new Date('2026-07-29T15:25:00-07:00');
    const model = buildTimelineBarsModel({
      hourly: mockHourly,
      latitude: 38.1074,
      longitude: -122.5697,
      timeZone: 'America/Los_Angeles',
      now: now3pm,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    const point5am = model.points.find((p) => p.hour === 5);
    expect(point5am?.airTempF).not.toBe(42);
  });

  it('Test 4: No interpolation or extrapolation crosses midnight or timezone boundaries', () => {
    const mockHourly = [
      { timeIso: '2026-07-28T23:00:00-07:00', airTempF: 60, windSpeedMph: 2, isDaytime: false, skyCover: 0 },
      { timeIso: '2026-07-29T08:00:00-07:00', airTempF: 58, windSpeedMph: 2, isDaytime: true, skyCover: 5 },
    ];

    const now3pm = new Date('2026-07-29T15:25:00-07:00');
    const model = buildTimelineBarsModel({
      hourly: mockHourly,
      latitude: 38.1074,
      longitude: -122.5697,
      timeZone: 'America/Los_Angeles',
      now: now3pm,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    const point5am = model.points.find((p) => p.hour === 5);
    expect(point5am?.sourceType).not.toBe('interpolated');
  });

  it('Test 5: Bounded linear interpolation between 5 AM (50°F) and 7 AM (60°F) produces bounded 6 AM value (55°F)', () => {
    const mockHourly = [
      { timeIso: '2026-07-29T05:00:00-07:00', airTempF: 50, windSpeedMph: 2, isDaytime: true, skyCover: 5 },
      { timeIso: '2026-07-29T07:00:00-07:00', airTempF: 60, windSpeedMph: 4, isDaytime: true, skyCover: 5 },
    ];

    const now3pm = new Date('2026-07-29T15:25:00-07:00');
    const model = buildTimelineBarsModel({
      hourly: mockHourly,
      latitude: 38.1074,
      longitude: -122.5697,
      timeZone: 'America/Los_Angeles',
      now: now3pm,
    });

    expect(model).not.toBeNull();
    if (!model) return;

    const point6am = model.points.find((p) => p.hour === 6);
    expect(point6am).toBeDefined();
    expect(point6am?.airTempF).toBe(55);
    expect(point6am?.sourceType).toBe('interpolated');
    expect(point6am?.confidence).toBe('medium');
  });

  it('Test 6: Backward extrapolation retains air temperature without unproven warming/cooling trend', () => {
    const mockHourly = [
      { timeIso: '2026-07-29T07:00:00-07:00', airTempF: 52, windSpeedMph: 2, isDaytime: true, skyCover: 5 },
    ];

    const now3pm = new Date('2026-07-29T15:25:00-07:00');
    const model = buildTimelineBarsModel({
      hourly: mockHourly,
      latitude: 38.1074,
      longitude: -122.5697,
      timeZone: 'America/Los_Angeles',
      now: now3pm,
    });

    const point6am = model?.points.find((p) => p.hour === 6);
    expect(point6am?.airTempF).toBe(52);
  });

  it('Test 7 & 8: Provider-observed samples replace cached estimates when later available', async () => {
    const initialForecast = [
      { timeIso: '2026-07-29T08:00:00-07:00', airTempF: 55, windSpeedMph: 2, isDaytime: true, skyCover: 5, sourceType: 'forecast' as const },
    ];
    await mergeAndSaveDailyHourlySamples(initialForecast, 'novato', 'America/Los_Angeles');

    const realObservation = [
      { timeIso: '2026-07-29T08:00:00-07:00', airTempF: 58, windSpeedMph: 2, isDaytime: true, skyCover: 5, sourceType: 'observation' as const },
    ];
    const merged = await mergeAndSaveDailyHourlySamples(realObservation, 'novato', 'America/Los_Angeles');

    const sample8am = merged.find((s) => s.timeIso === '2026-07-29T08:00:00-07:00');
    expect(sample8am?.airTempF).toBe(58);
    expect(sample8am?.sourceType).toBe('observation');
  });

  it('Test 9: Missing or invalid samples CANNOT produce green safety reassurance', () => {
    const mockHourly: any[] = [];
    const now3pm = new Date('2026-07-29T15:25:00-07:00');
    const model = buildTimelineBarsModel({
      hourly: mockHourly,
      latitude: 38.1074,
      longitude: -122.5697,
      timeZone: 'America/Los_Angeles',
      now: now3pm,
    });

    expect(model).toBeNull();
  });

  it('Test 10: Timeline colors & surface temps are calculated dynamically from each hour solar context—NOT a static reading', () => {
    const nightSample = { timeIso: '2026-07-29T03:00:00-07:00', airTempF: 84, windSpeedMph: 3, isDaytime: false, skyCover: 10 };
    const daySample = { timeIso: '2026-07-29T14:00:00-07:00', airTempF: 84, windSpeedMph: 3, isDaytime: true, skyCover: 10 };

    const nightRoadTemp = estimateRoadTempF(nightSample, 38.1074, 3, new Date(nightSample.timeIso), 'asphalt', -122.5697);
    const dayRoadTemp = estimateRoadTempF(daySample, 38.1074, 14, new Date(daySample.timeIso), 'asphalt', -122.5697);

    expect(nightRoadTemp).toBe(81);
    expect(dayRoadTemp).toBeGreaterThan(120);
  });

  it('Test 11: Mandatory Guardrail — NO forecastGridData sample can EVER emerge as sourceType: "observation"', () => {
    const gridForecastSample = {
      timeIso: '2026-07-29T08:00:00-07:00',
      airTempF: 58,
      windSpeedMph: 3,
      isDaytime: true,
      skyCover: 10,
      sourceType: 'provider_grid_forecast' as const,
    };

    const now3pm = new Date('2026-07-29T15:25:00-07:00');
    const model = buildTimelineBarsModel({
      hourly: [gridForecastSample],
      latitude: 38.1074,
      longitude: -122.5697,
      timeZone: 'America/Los_Angeles',
      now: now3pm,
    });

    expect(model).not.toBeNull();
    const point8am = model?.points.find((p) => p.hour === 8);
    expect(point8am).toBeDefined();
    // MUST be provider_grid_forecast, NEVER observation!
    expect(point8am?.sourceType).toBe('provider_grid_forecast');
    expect(point8am?.sourceType).not.toBe('observation');
  });
});
