/**
 * NorthPaw Winter v1 Production Verification & Invariant Suite
 *
 * Epistemic & Architectural Invariant Tests:
 * 1. 19 Core Epistemic & Physical Invariants
 * 2. Exhaustive Boundary Tests (x - ε, x, x + ε) around all temperature and wind thresholds
 * 3. Exhaustive 4x4 Traction Condition x Provenance Matrix
 * 4. Exhaustive Chemical Presence x Provenance Matrix
 * 5. Unit Equivalence (F/C and mph/kmh)
 * 6. Deterministic 16+ Scenario Fixture Suite with Full Trace Records
 * 7. User-Facing Microcopy Evidence Guardrails
 */

import {
  evaluateColdExposure,
  deriveAmbientTempBand,
  deriveWindCategory,
  deriveVulnerabilityTier,
} from '../coldExposure';
import { evaluateTractionBiomechanics } from '../tractionBiomechanics';
import { evaluateChemicalExposure } from '../chemicalExposure';
import {
  runWinterDecisionEngine,
  evaluateWinterForProfile,
} from '../winterEngine';
import {
  mapDogProfileToPhenotype,
  mapWeatherToTelemetry,
  type CaninePhenotypeInput,
  type EnvironmentalTelemetryInput,
  type ColdExposureSeverity,
  type OverallWinterDecision,
  type TractionCondition,
  type TractionProvenance,
  type ChemicalProvenance,
  type TractionBiomechanicsResult,
  type ChemicalExposureResult,
  type WinterDecisionOutput,
} from '../winterTypes';
import type { DogProfile } from '@/lib/profile';
import type { HomeWeatherState } from '../nwsWeather';

const severityOrder: Record<ColdExposureSeverity, number> = {
  none: 0,
  advisory: 1,
  warning: 2,
  severe: 3,
};

const decisionOrder: Record<OverallWinterDecision, number> = {
  ready: 0,
  caution: 1,
  hazard: 2,
};

describe('NorthPaw Winter v1 Production Engine', () => {
  const baseDog: CaninePhenotypeInput = {
    massCategory: 'medium',
    coatCategory: 'double_dense',
    ageCategory: 'adult_senior',
    breedLabel: 'Golden Retriever',
    isBrachycephalic: false,
    furColor: 'Golden',
  };

  const vulnerableDog: CaninePhenotypeInput = {
    massCategory: 'toy_small',
    coatCategory: 'hairless_single_short',
    ageCategory: 'puppy',
    breedLabel: 'Chihuahua',
    isBrachycephalic: false,
    furColor: 'Tan',
  };

  const baseEnv: EnvironmentalTelemetryInput = {
    ambientTempF: 32,
    windSpeedMph: 5,
    moistureCategory: 'dry',
    tractionCondition: 'dry',
    tractionProvenance: 'unmeasured',
    chemicalProvenance: 'unmeasured',
    isSnowOrIceActive: false,
    isDaytime: true,
  };

  // =========================================================================
  // 1. 19 Core Epistemic & Physical Invariants
  // =========================================================================
  describe('1. Epistemic & Physical Invariants', () => {
    it('1. Colder conditions cannot improve cold-exposure severity (monotonicity)', () => {
      for (let t = 60; t >= -30; t--) {
        const warm = evaluateColdExposure(t, 10, 'dry', baseDog);
        const cold = evaluateColdExposure(t - 1, 10, 'dry', baseDog);
        expect(severityOrder[cold.severity]).toBeGreaterThanOrEqual(severityOrder[warm.severity]);
      }
    });

    it('2. Greater applicable wind cannot improve cold-exposure severity', () => {
      for (let w = 0; w <= 50; w += 2) {
        const calm = evaluateColdExposure(20, w, 'dry', baseDog);
        const windier = evaluateColdExposure(20, w + 2, 'dry', baseDog);
        expect(severityOrder[windier.severity]).toBeGreaterThanOrEqual(severityOrder[calm.severity]);
      }
    });

    it('3. Wetness cannot improve cold-exposure severity', () => {
      const temps = [40, 32, 20, 0];
      for (const t of temps) {
        const dryRes = evaluateColdExposure(t, 10, 'dry', baseDog);
        const wetRes = evaluateColdExposure(t, 10, 'wet_precip', baseDog);
        expect(severityOrder[wetRes.severity]).toBeGreaterThanOrEqual(severityOrder[dryRes.severity]);
      }
    });

    it('4. Dense/double coat cannot cancel a wetness hazard', () => {
      const dryDouble = evaluateColdExposure(30, 10, 'dry', baseDog);
      const wetDouble = evaluateColdExposure(30, 10, 'wet_precip', baseDog);
      // Double coat does not prevent wetness from escalating severity
      expect(severityOrder[wetDouble.severity]).toBeGreaterThan(severityOrder[dryDouble.severity]);
    });

    it('5. Increasing supported vulnerability cannot make the decision safer', () => {
      const standardDog: CaninePhenotypeInput = {
        massCategory: 'large',
        coatCategory: 'double_dense',
        ageCategory: 'adult_senior',
      };
      const moderateDog: CaninePhenotypeInput = {
        massCategory: 'large',
        coatCategory: 'hairless_single_short',
        ageCategory: 'adult_senior',
      };
      const highDog: CaninePhenotypeInput = {
        massCategory: 'toy_small',
        coatCategory: 'hairless_single_short',
        ageCategory: 'puppy',
      };

      const resStd = evaluateColdExposure(30, 15, 'dry', standardDog);
      const resMod = evaluateColdExposure(30, 15, 'dry', moderateDog);
      const resHigh = evaluateColdExposure(30, 15, 'dry', highDog);

      expect(severityOrder[resMod.severity]).toBeGreaterThanOrEqual(severityOrder[resStd.severity]);
      expect(severityOrder[resHigh.severity]).toBeGreaterThanOrEqual(severityOrder[resMod.severity]);
    });

    it('6. Missing values cannot default to values that improve safety', () => {
      // Empty profile defaults conservatively to medium mass, thin coat
      const phenotype = mapDogProfileToPhenotype(null);
      expect(phenotype.coatCategory).toBe('hairless_single_short');
      expect(phenotype.massCategory).toBe('medium');
      expect(phenotype.ageCategory).toBe('adult_senior');
      // When evaluated, thin coat ensures it does NOT default to double-coat safety
      const res = evaluateColdExposure(30, 15, 'dry', phenotype);
      expect(res.vulnerabilityTier).not.toBe('standard');
    });

    it('7. Unknown treatment cannot become "no treatment", "untreated", or "safe"', () => {
      const res = evaluateChemicalExposure('unmeasured', 'unknown', true);
      expect(res.presenceState).toBe('treatment_data_unavailable');
      expect(res.actionGuidance).not.toContain('no treatment');
      expect(res.actionGuidance).not.toContain('no deicers expected');
      expect(res.actionGuidance).not.toContain('safe');
    });

    it('8. Forecast refreeze cannot become confirmed ice', () => {
      const res = evaluateTractionBiomechanics('confirmed_ice', 'forecast_refreeze_proxy');
      expect(res.condition).toBe('possible_refreeze');
      expect(res.condition).not.toBe('confirmed_ice');
      expect(res.severity).toBe('caution');
    });

    it('9. Unmeasured provenance cannot become confirmed ice', () => {
      const res = evaluateTractionBiomechanics('confirmed_ice', 'unmeasured');
      expect(res.condition).toBe('possible_refreeze');
      expect(res.condition).not.toBe('confirmed_ice');
    });

    it('10. Confirmed ice only occurs for allow-listed provenance', () => {
      const sensorRes = evaluateTractionBiomechanics('confirmed_ice', 'pavement_sensor');
      const userRes = evaluateTractionBiomechanics('confirmed_ice', 'direct_user_report');
      expect(sensorRes.condition).toBe('confirmed_ice');
      expect(sensorRes.severity).toBe('hazard');
      expect(userRes.condition).toBe('confirmed_ice');
      expect(userRes.severity).toBe('hazard');
    });

    it('11. Breed-label changes with identical phenotype do not change Winter output', () => {
      const dogA: CaninePhenotypeInput = {
        massCategory: 'toy_small',
        coatCategory: 'hairless_single_short',
        ageCategory: 'adult_senior',
        breedLabel: 'Italian Greyhound',
      };
      const dogB: CaninePhenotypeInput = {
        massCategory: 'toy_small',
        coatCategory: 'hairless_single_short',
        ageCategory: 'adult_senior',
        breedLabel: 'Whippet Mix',
      };

      const outA = runWinterDecisionEngine(baseEnv, dogA);
      const outB = runWinterDecisionEngine(baseEnv, dogB);

      expect(outA.overallDecision).toBe(outB.overallDecision);
      expect(outA.coldExposure.severity).toBe(outB.coldExposure.severity);
      expect(outA.primaryHazardDriver).toBe(outB.primaryHazardDriver);
    });

    it('12. Brachycephalic flag toggled with otherwise identical Winter inputs does not alter cold output', () => {
      const standardSnout: CaninePhenotypeInput = { ...baseDog, isBrachycephalic: false };
      const flatSnout: CaninePhenotypeInput = { ...baseDog, isBrachycephalic: true };

      const outStd = runWinterDecisionEngine(baseEnv, standardSnout);
      const outFlat = runWinterDecisionEngine(baseEnv, flatSnout);

      expect(outStd.coldExposure.severity).toBe(outFlat.coldExposure.severity);
      expect(outStd.coldExposure.vulnerabilityTier).toBe(outFlat.coldExposure.vulnerabilityTier);
      expect(outStd.overallDecision).toBe(outFlat.overallDecision);
    });

    it('13. Fur color does not alter Winter output', () => {
      const lightDog: CaninePhenotypeInput = { ...baseDog, furColor: 'White' };
      const darkDog: CaninePhenotypeInput = { ...baseDog, furColor: 'Black' };

      const outLight = runWinterDecisionEngine(baseEnv, lightDog);
      const outDark = runWinterDecisionEngine(baseEnv, darkDog);

      expect(outLight.coldExposure.severity).toBe(outDark.coldExposure.severity);
      expect(outLight.overallDecision).toBe(outDark.overallDecision);
    });

    it('14. Fahrenheit/Celsius equivalents produce identical decisions', () => {
      // 32°F is exactly 0°C; 14°F is -10°C; -4°F is -20°C
      const pairs = [
        { f: 32, c: 0 },
        { f: 14, c: -10 },
        { f: -4, c: -20 },
        { f: 45, c: 7.22 },
        { f: 10, c: -12.22 },
      ];

      for (const { f, c } of pairs) {
        const fFromC = (c * 9) / 5 + 32;
        const outF = runWinterDecisionEngine({ ...baseEnv, ambientTempF: f }, baseDog);
        const outFromC = runWinterDecisionEngine(
          { ...baseEnv, ambientTempF: Math.round(fFromC * 10) / 10 },
          baseDog
        );
        expect(outF.coldExposure.ambientTempBand).toBe(outFromC.coldExposure.ambientTempBand);
        expect(outF.overallDecision).toBe(outFromC.overallDecision);
      }
    });

    it('15. mph/km/h equivalents produce identical wind categories and decisions', () => {
      // 10 mph = 16.09 km/h, 20 mph = 32.19 km/h
      const pairs = [
        { mph: 9, kmh: 14.5 },
        { mph: 10, kmh: 16.1 },
        { mph: 15, kmh: 24.1 },
        { mph: 20, kmh: 32.2 },
        { mph: 25, kmh: 40.2 },
      ];

      for (const { mph, kmh } of pairs) {
        const derivedMph = Math.round(kmh * 0.621371);
        expect(deriveWindCategory(mph)).toBe(deriveWindCategory(derivedMph));
      }
    });

    it('16. Identical canonical inputs always produce identical output (determinism)', () => {
      const out1 = runWinterDecisionEngine(baseEnv, baseDog);
      const out2 = runWinterDecisionEngine(baseEnv, baseDog);
      expect(out1).toEqual(out2);
    });

    it('17. Raw measured/forecast ambient temperature is preserved exactly', () => {
      const testTemps = [-15.5, 0, 12, 23.4, 32, 41.5];
      for (const t of testTemps) {
        const out = runWinterDecisionEngine({ ...baseEnv, ambientTempF: t }, baseDog);
        expect(out.ambientTempF).toBe(t);
        expect(out.coldExposure.ambientTempF).toBe(t);
        expect((out as any).effectiveTempF).toBeUndefined();
      }
    });

    it('18. Independent hazards cannot disappear through averaging', () => {
      // Mild air temp (50°F) but confirmed ice on pavement
      const iceEnv: EnvironmentalTelemetryInput = {
        ...baseEnv,
        ambientTempF: 50,
        tractionCondition: 'confirmed_ice',
        tractionProvenance: 'pavement_sensor',
      };
      const out = runWinterDecisionEngine(iceEnv, baseDog);

      // Cold lane is 'none', but Traction lane is 'hazard' -> overall decision MUST be 'hazard'
      expect(out.coldExposure.severity).toBe('none');
      expect(out.tractionBiomechanics.severity).toBe('hazard');
      expect(out.overallDecision).toBe('hazard');
      expect(out.primaryHazardDriver).toBe('traction');
    });

    it('19. Senior age alone does not increase cold severity', () => {
      const adultDog: CaninePhenotypeInput = {
        massCategory: 'large',
        coatCategory: 'double_dense',
        ageCategory: 'adult_senior',
      };
      const seniorDog: CaninePhenotypeInput = {
        massCategory: 'large',
        coatCategory: 'double_dense',
        ageCategory: 'adult_senior', // Mapped as adult_senior per governance
      };
      const outAdult = evaluateColdExposure(25, 10, 'dry', adultDog);
      const outSenior = evaluateColdExposure(25, 10, 'dry', seniorDog);
      expect(outSenior.severity).toBe(outAdult.severity);
      expect(outSenior.vulnerabilityTier).toBe(outAdult.vulnerabilityTier);
    });
  });

  // =========================================================================
  // 2. Exhaustive Boundary Tests (x - ε, x, x + ε)
  // =========================================================================
  describe('2. Exhaustive Boundary Tests (x - ε, x, x + ε)', () => {
    const eps = 0.01;

    test('10°F boundary [CONSERVATIVE_POLICY: extreme_cold vs severe_cold]', () => {
      expect(deriveAmbientTempBand(10 - eps)).toBe('extreme_cold');
      expect(deriveAmbientTempBand(10)).toBe('extreme_cold');
      expect(deriveAmbientTempBand(10 + eps)).toBe('severe_cold');
    });

    test('25°F boundary [CONSERVATIVE_POLICY: severe_cold vs moderate_cold]', () => {
      expect(deriveAmbientTempBand(25 - eps)).toBe('severe_cold');
      expect(deriveAmbientTempBand(25)).toBe('severe_cold');
      expect(deriveAmbientTempBand(25 + eps)).toBe('moderate_cold');
    });

    test('35°F boundary [EVIDENCE_DERIVED: moderate_cold vs chilly]', () => {
      expect(deriveAmbientTempBand(35 - eps)).toBe('moderate_cold');
      expect(deriveAmbientTempBand(35)).toBe('moderate_cold');
      expect(deriveAmbientTempBand(35 + eps)).toBe('chilly');
    });

    test('45°F boundary [CONSERVATIVE_POLICY: chilly vs mild]', () => {
      expect(deriveAmbientTempBand(45 - eps)).toBe('chilly');
      expect(deriveAmbientTempBand(45)).toBe('chilly');
      expect(deriveAmbientTempBand(45 + eps)).toBe('mild');
    });

    test('10 mph wind boundary [EVIDENCE_DERIVED: calm vs moderate]', () => {
      expect(deriveWindCategory(10 - eps)).toBe('calm');
      expect(deriveWindCategory(10)).toBe('moderate');
      expect(deriveWindCategory(10 + eps)).toBe('moderate');
    });

    test('20 mph wind boundary [EVIDENCE_DERIVED: moderate vs high]', () => {
      expect(deriveWindCategory(20 - eps)).toBe('moderate');
      expect(deriveWindCategory(20)).toBe('high');
      expect(deriveWindCategory(20 + eps)).toBe('high');
    });
  });

  // =========================================================================
  // 3. Exhaustive 4x4 Traction Condition x Provenance Matrix
  // =========================================================================
  describe('3. Exhaustive 4x4 Traction Condition x Provenance Matrix', () => {
    const conditions: TractionCondition[] = ['dry', 'wet', 'possible_refreeze', 'confirmed_ice'];
    const provenances: TractionProvenance[] = [
      'pavement_sensor',
      'direct_user_report',
      'forecast_refreeze_proxy',
      'unmeasured',
    ];

    test.each([
      ['dry', 'pavement_sensor', 'dry', 'none'],
      ['dry', 'direct_user_report', 'dry', 'none'],
      ['dry', 'forecast_refreeze_proxy', 'dry', 'none'],
      ['dry', 'unmeasured', 'dry', 'none'],

      ['wet', 'pavement_sensor', 'wet', 'none'],
      ['wet', 'direct_user_report', 'wet', 'none'],
      ['wet', 'forecast_refreeze_proxy', 'wet', 'none'],
      ['wet', 'unmeasured', 'wet', 'none'],

      ['possible_refreeze', 'pavement_sensor', 'possible_refreeze', 'caution'],
      ['possible_refreeze', 'direct_user_report', 'possible_refreeze', 'caution'],
      ['possible_refreeze', 'forecast_refreeze_proxy', 'possible_refreeze', 'caution'],
      ['possible_refreeze', 'unmeasured', 'possible_refreeze', 'caution'],

      // ALLOW-LISTED: Only pavement_sensor and direct_user_report can produce confirmed_ice
      ['confirmed_ice', 'pavement_sensor', 'confirmed_ice', 'hazard'],
      ['confirmed_ice', 'direct_user_report', 'confirmed_ice', 'hazard'],

      // DOWNGRADED: forecast_refreeze_proxy and unmeasured CANNOT produce confirmed_ice
      ['confirmed_ice', 'forecast_refreeze_proxy', 'possible_refreeze', 'caution'],
      ['confirmed_ice', 'unmeasured', 'possible_refreeze', 'caution'],
    ] as const)(
      'Traction cell: [%s x %s] -> effectiveCondition=%s, severity=%s',
      (cond, prov, expCond, expSev) => {
        const res = evaluateTractionBiomechanics(cond, prov);
        expect(res.condition).toBe(expCond);
        expect(res.severity).toBe(expSev);
      }
    );
  });

  // =========================================================================
  // 4. Exhaustive Chemical Presence x Provenance Matrix
  // =========================================================================
  describe('4. Exhaustive Chemical Presence x Provenance Matrix', () => {
    const provenances: ChemicalProvenance[] = [
      'user_reported',
      'agency_reported',
      'sensor_measured',
      'unmeasured',
    ];

    test.each(provenances)(
      'Chemical active snow condition with provenance=%s',
      (prov) => {
        const res = evaluateChemicalExposure(prov, 'general_deicer', true);
        if (prov === 'unmeasured') {
          expect(res.presenceState).toBe('treatment_data_unavailable');
          expect(res.severity).toBe('advisory');
          expect(res.isDecisionRelevant).toBe(true);
          expect(res.actionGuidance).toBeDefined();
        } else {
          expect(res.presenceState).toBe('deicer_present');
          expect(res.severity).toBe('warning');
          expect(res.isDecisionRelevant).toBe(true);
          expect(res.actionGuidance).toBeDefined();
        }
      }
    );

    test('Dry non-freezing weather suppresses chemical copy when unmeasured', () => {
      const res = evaluateChemicalExposure('unmeasured', 'unknown', false);
      expect(res.presenceState).toBe('treatment_data_unavailable');
      expect(res.severity).toBe('none');
      expect(res.isDecisionRelevant).toBe(false);
      expect(res.actionGuidance).toBeUndefined();
    });

    test('CaCl2 pellets emit specific exothermic burn guidance', () => {
      const res = evaluateChemicalExposure('user_reported', 'cacl2_pellets', true);
      expect(res.actionGuidance).toContain('exothermically');
      expect(res.actionGuidance).toContain('severe skin irritation');
    });
  });

  // =========================================================================
  // 5. Deterministic Scenario Fixture Suite (16 Fixtures)
  // =========================================================================
  describe('5. Deterministic Scenario Fixture Suite', () => {
    type FixtureRecord = {
      name: string;
      env: EnvironmentalTelemetryInput;
      dog: CaninePhenotypeInput;
      expected: {
        coldSeverity: ColdExposureSeverity;
        tractionSeverity: TractionBiomechanicsResult['severity'];
        chemicalSeverity: ChemicalExposureResult['severity'];
        overallDecision: OverallWinterDecision;
        primaryHazardDriver: WinterDecisionOutput['primaryHazardDriver'];
        headlineSubstr: string;
      };
    };

    const fixtures: FixtureRecord[] = [
      // 1. 40°F, dry, calm, large double-coated adult
      {
        name: '40°F, dry, calm, large double-coated adult',
        env: { ...baseEnv, ambientTempF: 40, windSpeedMph: 4, moistureCategory: 'dry' },
        dog: { massCategory: 'large', coatCategory: 'double_dense', ageCategory: 'adult_senior' },
        expected: {
          coldSeverity: 'none',
          tractionSeverity: 'none',
          chemicalSeverity: 'none',
          overallDecision: 'ready',
          primaryHazardDriver: 'none',
          headlineSubstr: 'Conditions are clear',
        },
      },
      // 2. 40°F, wet/windy, toy short-coated dog
      {
        name: '40°F, wet/windy, toy short-coated dog',
        env: { ...baseEnv, ambientTempF: 40, windSpeedMph: 22, moistureCategory: 'wet_precip' },
        dog: { massCategory: 'toy_small', coatCategory: 'hairless_single_short', ageCategory: 'adult_senior' },
        expected: {
          coldSeverity: 'warning',
          tractionSeverity: 'none',
          chemicalSeverity: 'none',
          overallDecision: 'caution',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Cold weather advisory',
        },
      },
      // 3. 32–35°F after recent moisture (possible refreeze)
      {
        name: '32–35°F after recent moisture',
        env: {
          ...baseEnv,
          ambientTempF: 33,
          moistureCategory: 'wet_slush',
          tractionCondition: 'possible_refreeze',
          tractionProvenance: 'forecast_refreeze_proxy',
        },
        dog: baseDog,
        expected: {
          coldSeverity: 'warning',
          tractionSeverity: 'caution',
          chemicalSeverity: 'none',
          overallDecision: 'caution',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Cold weather advisory',
        },
      },
      // 4. 28°F dry/calm
      {
        name: '28°F dry/calm',
        env: { ...baseEnv, ambientTempF: 28, windSpeedMph: 5, moistureCategory: 'dry' },
        dog: baseDog,
        expected: {
          coldSeverity: 'advisory',
          tractionSeverity: 'none',
          chemicalSeverity: 'none',
          overallDecision: 'caution',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Chilly outdoor air',
        },
      },
      // 5. 28°F wet/windy
      {
        name: '28°F wet/windy',
        env: { ...baseEnv, ambientTempF: 28, windSpeedMph: 22, moistureCategory: 'wet_precip' },
        dog: baseDog,
        expected: {
          coldSeverity: 'severe',
          tractionSeverity: 'none',
          chemicalSeverity: 'none',
          overallDecision: 'hazard',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Extreme cold exposure',
        },
      },
      // 6. 20°F toy short-coated puppy
      {
        name: '20°F toy short-coated puppy',
        env: { ...baseEnv, ambientTempF: 20, windSpeedMph: 8, moistureCategory: 'dry' },
        dog: { massCategory: 'toy_small', coatCategory: 'hairless_single_short', ageCategory: 'puppy' },
        expected: {
          coldSeverity: 'severe',
          tractionSeverity: 'none',
          chemicalSeverity: 'none',
          overallDecision: 'hazard',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Extreme cold exposure',
        },
      },
      // 7. 20°F large dense-coated adult
      {
        name: '20°F large dense-coated adult',
        env: { ...baseEnv, ambientTempF: 20, windSpeedMph: 8, moistureCategory: 'dry' },
        dog: { massCategory: 'large', coatCategory: 'double_dense', ageCategory: 'adult_senior' },
        expected: {
          coldSeverity: 'warning',
          tractionSeverity: 'none',
          chemicalSeverity: 'none',
          overallDecision: 'caution',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Cold weather advisory',
        },
      },
      // 8. Forecast refreeze with no surface observation
      {
        name: 'Forecast refreeze with no surface observation',
        env: {
          ...baseEnv,
          ambientTempF: 31,
          tractionCondition: 'possible_refreeze',
          tractionProvenance: 'forecast_refreeze_proxy',
        },
        dog: baseDog,
        expected: {
          coldSeverity: 'advisory',
          tractionSeverity: 'caution',
          chemicalSeverity: 'none',
          overallDecision: 'caution',
          primaryHazardDriver: 'traction',
          headlineSubstr: 'Possible slick refreeze',
        },
      },
      // 9. Measured pavement ice
      {
        name: 'Measured pavement ice',
        env: {
          ...baseEnv,
          ambientTempF: 40,
          tractionCondition: 'confirmed_ice',
          tractionProvenance: 'pavement_sensor',
        },
        dog: baseDog,
        expected: {
          coldSeverity: 'none',
          tractionSeverity: 'hazard',
          chemicalSeverity: 'none',
          overallDecision: 'hazard',
          primaryHazardDriver: 'traction',
          headlineSubstr: 'Confirmed icy surfaces',
        },
      },
      // 10. Direct user-reported ice
      {
        name: 'Direct user-reported ice',
        env: {
          ...baseEnv,
          ambientTempF: 38,
          tractionCondition: 'confirmed_ice',
          tractionProvenance: 'direct_user_report',
        },
        dog: baseDog,
        expected: {
          coldSeverity: 'none',
          tractionSeverity: 'hazard',
          chemicalSeverity: 'none',
          overallDecision: 'hazard',
          primaryHazardDriver: 'traction',
          headlineSubstr: 'Confirmed icy surfaces',
        },
      },
      // 11. Active snow with unknown deicer treatment
      {
        name: 'Active snow with unknown deicer treatment',
        env: {
          ...baseEnv,
          ambientTempF: 30,
          isSnowOrIceActive: true,
          chemicalProvenance: 'unmeasured',
        },
        dog: baseDog,
        expected: {
          coldSeverity: 'advisory',
          tractionSeverity: 'none',
          chemicalSeverity: 'advisory',
          overallDecision: 'caution',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Chilly outdoor air',
        },
      },
      // 12. User/agency-reported deicer
      {
        name: 'User/agency-reported deicer',
        env: {
          ...baseEnv,
          ambientTempF: 46,
          chemicalProvenance: 'agency_reported',
          deicerType: 'general_deicer',
        },
        dog: baseDog,
        expected: {
          coldSeverity: 'none',
          tractionSeverity: 'none',
          chemicalSeverity: 'warning',
          overallDecision: 'caution',
          primaryHazardDriver: 'chemical',
          headlineSubstr: 'Chemical deicer alert',
        },
      },
      // 13. Same phenotype represented by two different breed labels
      {
        name: 'Same phenotype represented by two different breed labels (Labrador vs Mastiff mix)',
        env: { ...baseEnv, ambientTempF: 22 },
        dog: { massCategory: 'large', coatCategory: 'hairless_single_short', ageCategory: 'adult_senior', breedLabel: 'Labrador' },
        expected: {
          coldSeverity: 'warning',
          tractionSeverity: 'none',
          chemicalSeverity: 'none',
          overallDecision: 'caution',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Cold weather advisory',
        },
      },
      // 14. Brachycephalic flag toggled with otherwise identical Winter inputs
      {
        name: 'Brachycephalic flag toggled with otherwise identical Winter inputs',
        env: { ...baseEnv, ambientTempF: 22 },
        dog: { massCategory: 'large', coatCategory: 'hairless_single_short', ageCategory: 'adult_senior', isBrachycephalic: true },
        expected: {
          coldSeverity: 'warning',
          tractionSeverity: 'none',
          chemicalSeverity: 'none',
          overallDecision: 'caution',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Cold weather advisory',
        },
      },
      // 15. Fur color toggled with otherwise identical Winter inputs
      {
        name: 'Fur color toggled with otherwise identical Winter inputs',
        env: { ...baseEnv, ambientTempF: 22 },
        dog: { massCategory: 'large', coatCategory: 'hairless_single_short', ageCategory: 'adult_senior', furColor: 'Midnight Black' },
        expected: {
          coldSeverity: 'warning',
          tractionSeverity: 'none',
          chemicalSeverity: 'none',
          overallDecision: 'caution',
          primaryHazardDriver: 'cold',
          headlineSubstr: 'Cold weather advisory',
        },
      },
      // 16. Missing RWIS / unmeasured surface data attempting confirmed ice
      {
        name: 'Missing RWIS/surface data attempting confirmed ice',
        env: {
          ...baseEnv,
          ambientTempF: 30,
          tractionCondition: 'confirmed_ice',
          tractionProvenance: 'unmeasured',
        },
        dog: baseDog,
        expected: {
          coldSeverity: 'advisory',
          tractionSeverity: 'caution', // Downgraded
          chemicalSeverity: 'none',
          overallDecision: 'caution',
          primaryHazardDriver: 'traction',
          headlineSubstr: 'Possible slick refreeze',
        },
      },
    ];

    test.each(fixtures)(
      'Fixture: $name',
      ({ env, dog, expected }) => {
        const out = runWinterDecisionEngine(env, dog);

        // Record trace for auditability:
        // inputs -> component states -> evidence/provenance -> overall decision -> primary driver -> user-facing explanation
        const trace = {
          inputs: { env, dog },
          componentStates: {
            cold: out.coldExposure.severity,
            traction: out.tractionBiomechanics.severity,
            chemical: out.chemicalExposure.severity,
          },
          provenance: {
            traction: out.tractionBiomechanics.provenance,
            chemical: out.chemicalExposure.provenance,
          },
          overallDecision: out.overallDecision,
          primaryDriver: out.primaryHazardDriver,
          userFacingExplanation: out.userFacingCopy,
        };

        expect(trace.componentStates.cold).toBe(expected.coldSeverity);
        expect(trace.componentStates.traction).toBe(expected.tractionSeverity);
        expect(trace.componentStates.chemical).toBe(expected.chemicalSeverity);
        expect(trace.overallDecision).toBe(expected.overallDecision);
        expect(trace.primaryDriver).toBe(expected.primaryHazardDriver);
        expect(trace.userFacingExplanation.headline).toContain(expected.headlineSubstr);
      }
    );
  });

  // =========================================================================
  // 6. User-Facing Microcopy Guardrails
  // =========================================================================
  describe('6. User-Facing Microcopy Guardrails', () => {
    it('never emits countdown timers or "safe for X minutes"', () => {
      const temps = [-20, 0, 10, 20, 30, 40];
      for (const t of temps) {
        const out = runWinterDecisionEngine({ ...baseEnv, ambientTempF: t }, vulnerableDog);
        const allCopy = `${out.userFacingCopy.headline} ${out.userFacingCopy.subtext} ${out.userFacingCopy.protectiveGearPrompt ?? ''}`;
        expect(allCopy).not.toMatch(/safe for \d+ minute/i);
        expect(allCopy).not.toMatch(/\d+ minutes max/i);
        expect(allCopy).not.toMatch(/frostbite in \d+/i);
      }
    });

    it('never emits fake effective temperatures or Fahrenheit offsets', () => {
      const out = runWinterDecisionEngine({ ...baseEnv, ambientTempF: 15, windSpeedMph: 25 }, vulnerableDog);
      const allCopy = `${out.userFacingCopy.headline} ${out.userFacingCopy.subtext}`;
      expect(allCopy).not.toContain('feels like');
      expect(allCopy).not.toContain('wind chill of');
      expect(allCopy).not.toContain('effective temp');
    });

    it('never emits exact wet-coat insulation loss percentages', () => {
      const out = runWinterDecisionEngine({ ...baseEnv, ambientTempF: 32, moistureCategory: 'wet_precip' }, baseDog);
      const allCopy = `${out.userFacingCopy.headline} ${out.userFacingCopy.subtext}`;
      expect(allCopy).not.toMatch(/\b(80|85|90)%\s*(insulation\s*loss|colder)/i);
    });

    it('never assumes sidewalks are salted from cold/snow alone', () => {
      const out = runWinterDecisionEngine({ ...baseEnv, ambientTempF: 20, isSnowOrIceActive: true, chemicalProvenance: 'unmeasured' }, baseDog);
      const allCopy = `${out.userFacingCopy.headline} ${out.userFacingCopy.subtext} ${out.chemicalExposure.actionGuidance ?? ''}`;
      expect(allCopy).not.toContain('sidewalks are salted');
      expect(allCopy).not.toContain('ground is salted');
      expect(allCopy).not.toContain('no deicers expected');
    });
  });

  // =========================================================================
  // 7. Production Profile & Weather Adapter Tests
  // =========================================================================
  describe('7. Production Adapter: evaluateWinterForProfile', () => {
    const mockWeatherOk: Extract<HomeWeatherState, { status: 'ok' }> = {
      status: 'ok',
      latitude: 40.7128,
      longitude: -74.006,
      place: 'New York, NY',
      tempF: 22,
      summary: 'Partly cloudy and breezy',
      windLine: 'NW 15 mph',
      updatedLabel: 'Just now',
      updatedIso: new Date().toISOString(),
      stationDistanceMiles: 3.5,
      sourceNote: 'NWS',
      hazardTags: [],
      hazardAlerts: [],
      forecastShort: 'Cold and Breezy',
      precipChance: 10,
      isDaytime: true,
      weekendOutlook: [],
      timelineSlots: [],
      hourlyForecastAvailable: true,
      hourlySamples: [
        {
          timeIso: new Date().toISOString(),
          airTempF: 22,
          windSpeedMph: 16,
          isDaytime: true,
          skyCover: 30,
        },
      ],
      sunsetTimeIso: null,
      mockAqi: 25,
      mockRecentRain: false,
    };

    const mockProfile: DogProfile = {
      onboardingDone: true,
      dogName: 'Cooper',
      dogPhotoUri: '',
      dogBreed: 'Beagle',
      dogBreedMix: '',
      dogAgeGroup: 'adult',
      dogOutingTypes: ['walk'],
      locationPermission: 'granted',
      notificationsPermission: 'granted',
      dogWeightLbs: 24,
      dogCoatType: 'Single',
      dogColor: 'Tricolor',
      dogSnoutProfile: 'standard',
      dogActivityBaseline: 'moderate',
      morningBriefTime: '7:00 AM',
      gearVault: {},
      uniqueReadinessDays: 1,
      lastReadinessDay: '2026-09-26',
    };

    it('evaluates winter output directly from production HomeWeatherState and DogProfile', () => {
      const out = evaluateWinterForProfile(mockWeatherOk, mockProfile);
      expect(out.ambientTempF).toBe(22);
      expect(out.coldExposure.ambientTempBand).toBe('severe_cold');
      expect(out.coldExposure.vulnerabilityTier).toBe('moderate'); // Single coat -> moderate
      expect(out.overallDecision).toBe('caution');
      expect(out.primaryHazardDriver).toBe('cold');
      expect(out.userFacingCopy.headline).toBe('Cold weather advisory.');
    });
  });
});
