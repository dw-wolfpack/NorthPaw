/**
 * Test Suite: NorthPaw Deterministic Winter Decision Engine (v2)
 * 
 * Verifies:
 * 1. Allow-listed confirmed_ice: only pavement_sensor or direct_user_report can produce confirmed_ice.
 * 2. Exhaustive 4x4 condition x provenance matrix test.
 * 3. Evidence-neutral deicer state (deicer_present) with separate provenance.
 * 4. Internal retention of treatment_data_unavailable with copy suppression when not decision-relevant.
 * 5. Removal of senior-specific traction copy.
 * 6. Ambient temperature preservation and monotonicity.
 */

import { runWinterDecisionEngine } from '../winter_engine';
import { evaluateColdExposure, deriveAmbientTempBand, deriveWindCategory, deriveVulnerabilityTier } from '../cold_exposure';
import { evaluateTractionBiomechanics } from '../traction_biomechanics';
import { evaluateChemicalExposure } from '../chemical_exposure';
import type {
  CaninePhenotypeInput,
  EnvironmentalTelemetryInput,
  ColdExposureSeverity,
  TractionCondition,
  TractionProvenance,
  ChemicalProvenance,
} from '../winter_types';

describe('NorthPaw Categorical Winter Decision Engine (v2)', () => {
  const baseDog: CaninePhenotypeInput = {
    massCategory: 'medium',
    coatCategory: 'double_dense',
    ageCategory: 'adult_senior',
  };

  const vulnerableDog: CaninePhenotypeInput = {
    massCategory: 'toy_small',
    coatCategory: 'hairless_single_short',
    ageCategory: 'puppy',
  };

  const baseEnv: EnvironmentalTelemetryInput = {
    ambientTempF: 32,
    windSpeedMph: 5,
    moistureCategory: 'dry',
    tractionCondition: 'dry',
    tractionProvenance: 'unmeasured',
    chemicalProvenance: 'unmeasured',
    isSnowOrIceActive: false,
  };

  const severityOrder: Record<ColdExposureSeverity, number> = {
    none: 0,
    advisory: 1,
    warning: 2,
    severe: 3,
  };

  describe('1. Allow-listed Confirmed Ice & Exhaustive Condition x Provenance Matrix', () => {
    const conditions: TractionCondition[] = ['dry', 'wet', 'possible_refreeze', 'confirmed_ice'];
    const provenances: TractionProvenance[] = [
      'pavement_sensor',
      'direct_user_report',
      'forecast_refreeze_proxy',
      'unmeasured',
    ];

    test.each([
      // [condition, provenance, expectedCondition, expectedSeverity]
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

      // BLOCKED: Forecast proxy and unmeasured can NEVER produce confirmed_ice (must downgrade to possible_refreeze)
      ['confirmed_ice', 'forecast_refreeze_proxy', 'possible_refreeze', 'caution'],
      ['confirmed_ice', 'unmeasured', 'possible_refreeze', 'caution'],
    ] as const)(
      'Matrix cell: condition=%s with provenance=%s -> effectiveCondition=%s, severity=%s',
      (cond, prov, expCond, expSev) => {
        const res = evaluateTractionBiomechanics(cond, prov);
        expect(res.condition).toBe(expCond);
        expect(res.severity).toBe(expSev);
      }
    );

    it('verifies that unmeasured provenance can NEVER produce confirmed_ice under any circumstances', () => {
      for (const cond of conditions) {
        const res = evaluateTractionBiomechanics(cond, 'unmeasured');
        expect(res.condition).not.toBe('confirmed_ice');
      }
    });

    it('verifies that forecast_refreeze_proxy can NEVER produce confirmed_ice under any circumstances', () => {
      for (const cond of conditions) {
        const res = evaluateTractionBiomechanics(cond, 'forecast_refreeze_proxy');
        expect(res.condition).not.toBe('confirmed_ice');
      }
    });
  });

  describe('2. Evidence-Neutral Deicer State & Provenance Tracking', () => {
    it('sets presenceState to deicer_present for user_reported, agency_reported, and sensor_measured', () => {
      const provenances: ChemicalProvenance[] = ['user_reported', 'agency_reported', 'sensor_measured'];
      for (const p of provenances) {
        const res = evaluateChemicalExposure(p, 'general_deicer', true);
        expect(res.presenceState).toBe('deicer_present');
        expect(res.provenance).toBe(p);
        expect(res.severity).toBe('warning');
        expect(res.isDecisionRelevant).toBe(true);
      }
    });

    it('retains treatment_data_unavailable internally when provenance is unmeasured', () => {
      const resDry = evaluateChemicalExposure('unmeasured', 'unknown', false);
      const resSnow = evaluateChemicalExposure('unmeasured', 'unknown', true);

      expect(resDry.presenceState).toBe('treatment_data_unavailable');
      expect(resDry.provenance).toBe('unmeasured');
      expect(resSnow.presenceState).toBe('treatment_data_unavailable');
      expect(resSnow.provenance).toBe('unmeasured');
    });

    it('suppresses user-facing chemical copy when exposure is NOT decision-relevant', () => {
      // In dry / non-snow weather, chemical treatment is not decision-relevant
      const res = evaluateChemicalExposure('unmeasured', 'unknown', false);
      expect(res.isDecisionRelevant).toBe(false);
      expect(res.actionGuidance).toBeUndefined(); // Suppressed
      expect(res.severity).toBe('none');
    });

    it('emits advisory action guidance when exposure IS decision-relevant (active snow/ice)', () => {
      const res = evaluateChemicalExposure('unmeasured', 'unknown', true);
      expect(res.isDecisionRelevant).toBe(true);
      expect(res.actionGuidance).toBeDefined();
      expect(res.actionGuidance).toContain('Sidewalk chemical treatment is unmeasured');
      expect(res.severity).toBe('advisory');
    });

    it('NEVER emits "no deicers expected" when treatment is unmeasured', () => {
      const resDry = evaluateChemicalExposure('unmeasured', 'unknown', false);
      const resSnow = evaluateChemicalExposure('unmeasured', 'unknown', true);

      expect(resDry.actionGuidance).toBeUndefined();
      expect(resSnow.actionGuidance).not.toContain('no deicers expected');
    });
  });

  describe('3. Removal of Senior-Specific Traction Behavior & Copy', () => {
    it('generates universal traction copy without senior branching or salted ground claims', () => {
      const resIce = evaluateTractionBiomechanics('confirmed_ice', 'pavement_sensor');
      const resRefreeze = evaluateTractionBiomechanics('possible_refreeze', 'forecast_refreeze_proxy');

      expect(resIce.subtext).not.toContain('senior');
      expect(resIce.subtext).not.toContain('salted ground');
      expect(resRefreeze.subtext).not.toContain('senior');
      expect(resRefreeze.subtext).not.toContain('salted ground');
    });
  });

  describe('4. Policy vs. Evidence Boundary Labels & Categorical Logic', () => {
    it('correctly maps ambient temperatures to bands', () => {
      expect(deriveAmbientTempBand(5)).toBe('extreme_cold');    // CONSERVATIVE_POLICY
      expect(deriveAmbientTempBand(10)).toBe('extreme_cold');   // CONSERVATIVE_POLICY
      expect(deriveAmbientTempBand(20)).toBe('severe_cold');    // CONSERVATIVE_POLICY
      expect(deriveAmbientTempBand(25)).toBe('severe_cold');    // CONSERVATIVE_POLICY
      expect(deriveAmbientTempBand(30)).toBe('moderate_cold');  // EVIDENCE_DERIVED (Freezing)
      expect(deriveAmbientTempBand(35)).toBe('moderate_cold');  // EVIDENCE_DERIVED (Freezing)
      expect(deriveAmbientTempBand(40)).toBe('chilly');         // CONSERVATIVE_POLICY
      expect(deriveAmbientTempBand(45)).toBe('chilly');         // CONSERVATIVE_POLICY
      expect(deriveAmbientTempBand(50)).toBe('mild');           // CONSERVATIVE_POLICY
    });

    it('correctly maps wind speeds to categories', () => {
      expect(deriveWindCategory(5)).toBe('calm');               // EVIDENCE_DERIVED
      expect(deriveWindCategory(10)).toBe('moderate');          // EVIDENCE_DERIVED (Arkin 1991)
      expect(deriveWindCategory(15)).toBe('moderate');          // EVIDENCE_DERIVED
      expect(deriveWindCategory(20)).toBe('high');              // EVIDENCE_DERIVED (VKM 2017)
      expect(deriveWindCategory(30)).toBe('high');              // EVIDENCE_DERIVED
    });

    it('correctly classifies vulnerability tiers based on conservative policies', () => {
      // Puppy -> High (CONSERVATIVE_POLICY informed by McIntyre 1958 developmental lag)
      expect(
        deriveVulnerabilityTier({ massCategory: 'large', coatCategory: 'double_dense', ageCategory: 'puppy' })
      ).toBe('high');

      // Small + Thin -> High (CONSERVATIVE_POLICY synthesizing allometry and coat deficit)
      expect(
        deriveVulnerabilityTier({ massCategory: 'toy_small', coatCategory: 'hairless_single_short', ageCategory: 'adult_senior' })
      ).toBe('high');

      // Small alone -> Moderate
      expect(
        deriveVulnerabilityTier({ massCategory: 'toy_small', coatCategory: 'double_dense', ageCategory: 'adult_senior' })
      ).toBe('moderate');

      // Thin coat alone -> Moderate
      expect(
        deriveVulnerabilityTier({ massCategory: 'medium', coatCategory: 'hairless_single_short', ageCategory: 'adult_senior' })
      ).toBe('moderate');

      // Standard
      expect(
        deriveVulnerabilityTier({ massCategory: 'medium', coatCategory: 'double_dense', ageCategory: 'adult_senior' })
      ).toBe('standard');
    });
  });

  describe('5. Monotonicity Invariants & Ambient Temperature Preservation', () => {
    it('preserves ambientTempF exactly as measured/forecast', () => {
      const output = runWinterDecisionEngine(
        { ...baseEnv, ambientTempF: 14, windSpeedMph: 25 },
        vulnerableDog
      );
      expect(output.ambientTempF).toBe(14);
      expect(output.coldExposure.ambientTempF).toBe(14);
      expect((output as any).effectiveTempF).toBeUndefined();
    });

    it('enforces monotonic non-decrease across temperature steps', () => {
      for (let t = 50; t > -20; t--) {
        const resWarm = evaluateColdExposure(t, 10, 'dry', baseDog);
        const resCold = evaluateColdExposure(t - 1, 10, 'dry', baseDog);

        expect(severityOrder[resCold.severity]).toBeGreaterThanOrEqual(
          severityOrder[resWarm.severity]
        );
      }
    });

    it('double coat can NEVER erase or cancel a wetness hazard', () => {
      const dryDouble = evaluateColdExposure(30, 10, 'dry', baseDog);
      const wetDouble = evaluateColdExposure(30, 10, 'wet_precip', baseDog);

      expect(severityOrder[wetDouble.severity]).toBeGreaterThan(
        severityOrder[dryDouble.severity]
      );
    });
  });
});
