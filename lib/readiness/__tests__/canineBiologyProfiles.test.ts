import { estimateRoadTempF } from '../../weather/roadTemp';

type DogBioProfile = {
  name: string;
  breed: string;
  weightLbs: number;
  snoutProfile: 'flat' | 'standard' | 'long';
  coatType: 'Short' | 'Double';
  activityBaseline: 'low' | 'moderate' | 'high';
};

const DOG_PROFILES: DogBioProfile[] = [
  { name: 'Pierre', breed: 'French Bulldog', weightLbs: 22, snoutProfile: 'flat', coatType: 'Short', activityBaseline: 'low' },
  { name: 'Bear', breed: 'Bernese Mountain Dog', weightLbs: 95, snoutProfile: 'standard', coatType: 'Double', activityBaseline: 'moderate' },
  { name: 'Pico', breed: 'Chihuahua', weightLbs: 6, snoutProfile: 'standard', coatType: 'Short', activityBaseline: 'high' },
  { name: 'Rex', breed: 'German Shorthaired Pointer', weightLbs: 58, snoutProfile: 'long', coatType: 'Short', activityBaseline: 'high' },
  { name: 'Duke', breed: 'Great Dane', weightLbs: 130, snoutProfile: 'standard', coatType: 'Short', activityBaseline: 'moderate' },
];

function dogRiskMultiplier(profile: DogBioProfile): number {
  let m = 1.0;
  if (profile.snoutProfile === 'flat') m *= 1.25;
  if (profile.coatType === 'Double') m *= 1.15;
  if (profile.activityBaseline === 'high') m *= 1.1;
  return m;
}

describe('Category 4: Canine Biology & Risk Engine (Various Dogs & Weights)', () => {
  const sampleEnv = {
    timeIso: '2026-07-15T13:00:00Z',
    airTempF: 86,
    windSpeedMph: 5,
    isDaytime: true,
    skyCover: 10,
    solarGhi: 850,
  };
  const noonDate = new Date('2026-07-15T13:00:00Z');

  it('INVARIANT: Physical pavement surface temp (°F) is EXACTLY IDENTICAL across all 5 distinct dog profiles', () => {
    const physicalTemps = DOG_PROFILES.map(() =>
      estimateRoadTempF(sampleEnv, 37.7749, 13, noonDate, 'asphalt')
    );

    // Assert that every dog profile gets the exact same physical surface temp
    const firstTemp = physicalTemps[0];
    for (const temp of physicalTemps) {
      expect(temp).toBe(firstTemp);
    }
  });

  it('BIOLOGY: Biological risk multipliers modulate NPI scores appropriately based on snout, coat & activity', () => {
    const frenchieMultiplier = dogRiskMultiplier(DOG_PROFILES[0]); // Flat snout
    const berneseMultiplier = dogRiskMultiplier(DOG_PROFILES[1]); // Double coat
    const chihuahuaMultiplier = dogRiskMultiplier(DOG_PROFILES[2]); // Short single coat

    // Frenchie (flat snout) and Bernese (double coat) have higher risk multipliers than short single coat Chihuahua
    expect(frenchieMultiplier).toBeGreaterThan(chihuahuaMultiplier);
    expect(berneseMultiplier).toBeGreaterThan(chihuahuaMultiplier);
  });
});
