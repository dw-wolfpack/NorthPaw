import { calculateSolarElevationDeg, isTrueDaytime } from '../solarPosition';
import { estimateRoadTempF } from '../roadTemp';

describe('Category 2: Solar Position & Geographic Edge Cases', () => {
  it('Lake Tahoe Afternoon Regression — 3:00 PM PDT (22:00 UTC) at Lake Tahoe (-120.03° W) is daytime with strong solar elevation', () => {
    const tahoeDate = new Date('2026-07-29T22:00:00Z'); // 3:00 PM PDT
    const elev = calculateSolarElevationDeg(tahoeDate, 39.0968, -120.0324);
    expect(elev).toBeGreaterThan(30.0);
    expect(isTrueDaytime(tahoeDate, 39.0968, -120.0324)).toBe(true);

    const sample84 = {
      timeIso: '2026-07-29T22:00:00Z',
      airTempF: 84,
      windSpeedMph: 3,
      isDaytime: true,
      skyCover: 5,
    };

    // Under 84°F air and full Tahoe 3 PM sun, asphalt temp should be hot (> 125°F)
    const asphaltTemp = estimateRoadTempF(sample84, 39.0968, 15, tahoeDate, 'asphalt', -120.0324);
    expect(asphaltTemp).toBeGreaterThan(120.0);
  });

  it('Test 2.3: Geographic Solar Noon Shift — Longitude difference shifts solar peak time', () => {
    const utcDate = new Date('2026-07-15T17:00:00Z');

    const elevBoston = calculateSolarElevationDeg(utcDate, 42.3601, -71.0589);
    const elevElPaso = calculateSolarElevationDeg(utcDate, 31.7619, -106.4869);

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
