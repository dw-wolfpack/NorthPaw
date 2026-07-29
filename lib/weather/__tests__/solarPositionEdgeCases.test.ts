import { calculateSolarElevationDeg, isTrueDaytime } from '../solarPosition';

describe('Category 2: Solar Position & Geographic Edge Cases', () => {
  it('Test 2.3: Geographic Solar Noon Shift — Longitude difference shifts solar peak time', () => {
    // Boston, MA (71.0589° W) vs. El Paso, TX (106.4869° W)
    // At 17:00 UTC (12:00 PM EST in Boston), solar elevation in Boston is near peak.
    // In El Paso (where 17:00 UTC is 10:00 AM MST), solar elevation is lower.
    const utcDate = new Date('2026-07-15T17:00:00Z');

    const elevBoston = calculateSolarElevationDeg(utcDate, 42.3601, -71.0589);
    const elevElPaso = calculateSolarElevationDeg(utcDate, 31.7619, -106.4869);

    // Boston is closer to solar noon at 17:00 UTC than El Paso
    expect(elevBoston).toBeGreaterThan(elevElPaso);
  });

  it('Arctic Polar Summer — Sun remains above horizon 24 hours a day in Tromsø (69.6492° N) during June solstice', () => {
    const juneSolsticeMidnight = new Date('2026-06-21T00:00:00Z');
    const isDay = isTrueDaytime(juneSolsticeMidnight, 69.6492, 18.9553);
    expect(isDay).toBe(true);
  });

  it('Arctic Polar Winter — Sun remains below horizon in Tromsø (69.6492° N) during December solstice at noon', () => {
    const decSolsticeNoon = new Date('2026-12-21T12:00:00Z');
    const isDay = isTrueDaytime(decSolsticeNoon, 69.6492, 18.9553);
    expect(isDay).toBe(false);
  });

  it('Equator Equinox — Sun passes directly overhead (solar elevation ~90°) at noon on March equinox at Equator', () => {
    const marchEquinoxNoon = new Date('2026-03-20T12:00:00Z');
    const elev = calculateSolarElevationDeg(marchEquinoxNoon, 0.0, 0.0);
    expect(elev).toBeGreaterThan(85.0);
  });
});
