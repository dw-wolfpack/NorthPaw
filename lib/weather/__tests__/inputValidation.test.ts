import { estimateRoadTempF, buildTimelineBarsModel } from '../roadTemp';

describe('Category 7 & 8: Input Validation & Defensive Behavior', () => {
  const localDate = new Date('2026-07-15T12:00:00Z');

  it('Test 8.1: Empty Forecast — Returns null without exception', () => {
    const result = buildTimelineBarsModel({
      hourly: [],
      latitude: 37.7749,
      now: localDate,
    });
    expect(result).toBeNull();
  });

  it('Test 8.2 & 8.3: Numeric Boundary Matrix — Bounded finite outputs across extreme weather values', () => {
    const temps = [-40, 0, 40, 77, 100, 120, 140];
    const winds = [0, 5, 30, 60, 100];

    for (const airTemp of temps) {
      for (const wind of winds) {
        const sample = {
          timeIso: '2026-07-15T12:00:00Z',
          airTempF: airTemp,
          windSpeedMph: wind,
          isDaytime: true,
          skyCover: 10,
        };

        const result = estimateRoadTempF(sample, 37.7749, 12, localDate, 'asphalt');
        expect(Number.isFinite(result)).toBe(true);
        expect(Number.isNaN(result)).toBe(false);
      }
    }
  });

  it('Test 8.5: Negative Weather Values — Clamps negative wind speed and sky cover safely', () => {
    const sampleNegative = {
      timeIso: '2026-07-15T12:00:00Z',
      airTempF: 85,
      windSpeedMph: -15, // Negative wind input
      isDaytime: true,
      skyCover: -50,    // Negative sky cover input
    };

    const temp = estimateRoadTempF(sampleNegative, 37.7749, 12, localDate, 'asphalt');
    expect(Number.isFinite(temp)).toBe(true);
    expect(temp).toBeGreaterThan(85);
  });
});
