import { buildTimelineBarsModel } from '../roadTemp';

describe('Phase A Regression: Forecast Timeline Deduplication', () => {
  it('FAILS ON MVP: Multi-day 36-hour forecast with identical clock hours must NOT overwrite today sample with tomorrow sample', () => {
    // Generate 36 consecutive hourly samples starting 2026-07-15T05:00:00Z
    const mockHourly = [];
    const baseTime = new Date('2026-07-15T05:00:00Z').getTime();

    for (let i = 0; i < 36; i++) {
      const sampleDate = new Date(baseTime + i * 3600 * 1000);
      const iso = sampleDate.toISOString();
      const isTomorrow = sampleDate.getUTCDate() === 16;
      
      // On July 15 at 8 AM, air temp is 70°F.
      // On July 16 at 8 AM, air temp is 95°F.
      const airTemp = isTomorrow ? 95 : 70;

      mockHourly.push({
        timeIso: iso,
        airTempF: airTemp,
        windSpeedMph: 5,
        isDaytime: true,
        skyCover: 10
      });
    }

    const todayDate = new Date('2026-07-15T08:00:00Z');
    const model = buildTimelineBarsModel({
      hourly: mockHourly,
      latitude: 37.7749,
      now: todayDate
    });

    expect(model).not.toBeNull();
    if (!model) return;

    // In the MVP code, points map is keyed only by local hour (8).
    // Today's 8 AM (70°F) gets silently overwritten by Tomorrow's 8 AM (95°F)!
    // A correct implementation for "Today" MUST preserve Today's air temp of 70°F.
    const point8am = model.points.find(p => p.hour === 8);
    expect(point8am).toBeDefined();
    expect(point8am?.airTempF).toBe(70); // THIS FAILS ON MVP! (MVP outputs 95°F)
  });
});
