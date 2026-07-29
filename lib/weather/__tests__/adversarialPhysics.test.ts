import { estimateRoadTempF } from '../roadTemp';

describe('Category 3: Surface Physics & Material Invariants', () => {
  const localDate = new Date('2026-07-15T12:00:00Z');

  it('Test 3.1: Wind Convection Bounding — High wind cools sunlit pavement but never drops it below ambient air temp', () => {
    const sampleHighWind = {
      timeIso: '2026-07-15T12:00:00Z',
      airTempF: 85,
      windSpeedMph: 45, // Extreme 45 mph wind
      isDaytime: true,
      skyCover: 0,
      solarGhi: 900,
    };

    const temp = estimateRoadTempF(sampleHighWind, 37.7749, 12, localDate, 'asphalt');

    // Convection cools extreme solar heat, but under 900 W/m² sun surfaceTemp >= airTemp (85°F)
    expect(temp).toBeGreaterThanOrEqual(85.0);
    // Should be significantly cooler than 0 wind (which would be ~130°F+)
    expect(temp).toBeLessThan(110.0);
  });

  it('Test 3.2: Post-Sunset Heat Storage — Asphalt retains stored heat after solar elevation turns negative', () => {
    const duskSample = {
      timeIso: '2026-07-15T20:00:00Z', // 8 PM Dusk
      airTempF: 78,
      windSpeedMph: 2,
      isDaytime: false,
      skyCover: 0,
    };

    const duskDate = new Date('2026-07-15T20:00:00Z');
    const temp = estimateRoadTempF(duskSample, 37.7749, 20, duskDate, 'asphalt');

    // Asphalt surface temp at dusk should remain close to or slightly below air temp
    expect(temp).toBeGreaterThan(70.0);
  });

  it('Test 3.3: Material Albedo Ordering — Under 800 W/m² sun: Turf > Sand > Asphalt > Cobblestone > Concrete', () => {
    const sample = {
      timeIso: '2026-07-15T13:00:00Z',
      airTempF: 85,
      windSpeedMph: 5,
      isDaytime: true,
      skyCover: 10,
      solarGhi: 800,
    };
    const noonDate = new Date('2026-07-15T13:00:00Z');
    const lat = 37.7749;

    const turfTemp = estimateRoadTempF(sample, lat, 13, noonDate, 'turf');
    const sandTemp = estimateRoadTempF(sample, lat, 13, noonDate, 'sand');
    const asphaltTemp = estimateRoadTempF(sample, lat, 13, noonDate, 'asphalt');
    const cobbleTemp = estimateRoadTempF(sample, lat, 13, noonDate, 'cobblestone');
    const concreteTemp = estimateRoadTempF(sample, lat, 13, noonDate, 'concrete');

    // Strict relative material heating hierarchy
    expect(turfTemp).toBeGreaterThan(sandTemp);
    expect(sandTemp).toBeGreaterThan(asphaltTemp);
    expect(asphaltTemp).toBeGreaterThan(cobbleTemp);
    expect(cobbleTemp).toBeGreaterThan(concreteTemp);
  });
});
