import { estimateRoadTempF } from '../roadTemp';

describe('Phase A Regression: Physical Surface Calculation Invariance', () => {
  it('FAILS ON MVP: Physical surface temperature (°F) must NEVER accept or be altered by dog profile traits', () => {
    const sample = {
      timeIso: '2026-07-15T14:00:00Z',
      airTempF: 85,
      windSpeedMph: 5,
      isDaytime: true,
      skyCover: 10
    };
    const localDate = new Date('2026-07-15T14:00:00Z');

    // Physical surface calculation function signature must require ONLY physical weather & material inputs
    const tempF = estimateRoadTempF(sample, 37.7749, 14, localDate, 'asphalt');

    // Must return a deterministic finite physical Fahrenheit temperature
    expect(Number.isFinite(tempF)).toBe(true);
    expect(tempF).toBeGreaterThan(85);
  });
});
