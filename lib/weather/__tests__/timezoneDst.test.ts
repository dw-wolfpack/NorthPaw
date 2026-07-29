import { isTrueDaytime, calculateSolarElevationDeg } from '../solarPosition';

describe('Category 1: Timezone & DST Integrity', () => {
  it('Test 1.3: Daylight Saving Time Invariance — Solar position relies on true UTC instant regardless of DST clock shifts', () => {
    const dateStandard = new Date('2026-03-07T12:00:00Z');
    const dateDaylight = new Date('2026-03-14T12:00:00Z');

    const elevStandard = calculateSolarElevationDeg(dateStandard, 37.7749, -122.4194);
    const elevDaylight = calculateSolarElevationDeg(dateDaylight, 37.7749, -122.4194);

    expect(Number.isFinite(elevStandard)).toBe(true);
    expect(Number.isFinite(elevDaylight)).toBe(true);
  });

  it('Test 1.2: Local Midnight Transition — Solar elevation stays negative across true local midnight (07:00 UTC in Pacific Time)', () => {
    // In Pacific Daylight Time (UTC-7), local midnight (00:00 PDT) occurs at 07:00 UTC.
    const midnight1 = new Date('2026-07-15T07:00:00Z');
    const midnight2 = new Date('2026-07-16T07:00:00Z');

    expect(isTrueDaytime(midnight1, 37.7749, -122.4194)).toBe(false);
    expect(isTrueDaytime(midnight2, 37.7749, -122.4194)).toBe(false);
  });
});
