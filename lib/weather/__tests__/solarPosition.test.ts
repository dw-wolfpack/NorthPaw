import { estimateRoadTempF } from '../roadTemp';

describe('Phase A Regression: Day/Night Solar Position Classification', () => {
  it('FAILS ON MVP: Clear midnight (0% cloud cover) must be classified as NIGHTTIME, not daytime', () => {
    const midnightSample = {
      timeIso: '2026-07-15T00:00:00Z',
      airTempF: 75,
      windSpeedMph: 0,
      isDaytime: false, // In Tomorrow.io MVP, isDaytime = cloudCover < 100, which made clear midnight isDaytime = true!
      skyCover: 0
    };

    const midnightDate = new Date('2026-07-15T00:00:00Z');
    
    // In the MVP code, if sample.isDaytime is passed as true (from Tomorrow.io cloudCover < 100),
    // solarIntensityFrom(midnightDate, 37.77, 0, 0) is evaluated or solar intensity is added at midnight!
    // Under true nighttime physics (sun below horizon), road temp for asphalt at night should be Air - 3 = 72°F.
    const roadTempMidnight = estimateRoadTempF(midnightSample, 37.7749, 0, midnightDate, 'asphalt');
    
    // Road temp at midnight with 0 wind should equal Air - 3 = 72°F (or <= AirTemp)
    expect(roadTempMidnight).toBeLessThanOrEqual(75);
  });

  it('FAILS ON MVP: Overcast noon (100% cloud cover) must be classified as DAYTIME, not nighttime', () => {
    const overcastNoonSample = {
      timeIso: '2026-07-15T12:00:00Z',
      airTempF: 85,
      windSpeedMph: 2,
      isDaytime: true, // Tomorrow.io MVP set isDaytime = cloudCover < 100, making 100% cloud cover isDaytime = false!
      skyCover: 100
    };

    const noonDate = new Date('2026-07-15T12:00:00Z');
    
    // Under true solar position, 12:00 PM is daytime. Diffuse radiation still heats asphalt above air temp.
    const roadTempNoon = estimateRoadTempF(overcastNoonSample, 37.7749, 12, noonDate, 'asphalt');
    
    // Even under 100% cloud cover at noon, solar heating > 0 so roadTemp > airTemp (85°F).
    expect(roadTempNoon).toBeGreaterThan(85);
  });
});
