/**
 * Test Suite: Primary Hazard Explanation Cue
 *
 * Verifies:
 * 1. Every engine driver maps to the correct canonical cue (icon + semantic text).
 * 2. Traction distinguishes "Confirmed ice" vs "Possible refreeze" based strictly on evidence state.
 * 3. CRITICAL INVARIANT: Unknown/unmeasured chemical treatment NEVER produces a "Deicer reported" cue.
 * 4. Heat drivers map to sun icon + semantic text.
 * 5. Favorable/none maps to check-circle + "Clear conditions".
 * 6. Accessibility labels are always present and descriptive.
 */

import { getPrimaryHazardCue } from '../primaryHazardCue';
import type { WinterDecisionOutput } from '../winterTypes';

describe('Primary Hazard Explanation Cue Helper', () => {
  const baseWinterDecision: WinterDecisionOutput = {
    overallDecision: 'ready',
    primaryHazardDriver: 'none',
    ambientTempF: 40,
    coldExposure: {
      severity: 'none',
      ambientTempF: 40,
      ambientTempBand: 'chilly',
      vulnerabilityTier: 'standard',
      reasons: [],
    },
    tractionBiomechanics: {
      severity: 'none',
      condition: 'dry',
      provenance: 'unmeasured',
      headline: 'Traction clear.',
      subtext: 'Surface friction is normal.',
    },
    chemicalExposure: {
      severity: 'none',
      presenceState: 'treatment_data_unavailable',
      provenance: 'unmeasured',
      deicerType: 'unknown',
      isDecisionRelevant: false,
    },
    visibility: {
      severity: 'none',
      isDaytime: true,
    },
    userFacingCopy: {
      headline: 'Conditions are clear for an outing.',
      subtext: 'Enjoy your walk together.',
    },
  };

  test('maps cold driver to snowflake and "Cold conditions"', () => {
    const cue = getPrimaryHazardCue({
      winterDecision: {
        ...baseWinterDecision,
        overallDecision: 'caution',
        primaryHazardDriver: 'cold',
      },
    });
    expect(cue.iconName).toBe('snowflake');
    expect(cue.label).toBe('Cold conditions');
    expect(cue.accessibilityLabel).toBe('Primary factor: Cold conditions');
  });

  test('maps traction driver with confirmed_ice to "Confirmed ice"', () => {
    const cue = getPrimaryHazardCue({
      winterDecision: {
        ...baseWinterDecision,
        overallDecision: 'hazard',
        primaryHazardDriver: 'traction',
        tractionBiomechanics: {
          ...baseWinterDecision.tractionBiomechanics,
          severity: 'hazard',
          condition: 'confirmed_ice',
          provenance: 'pavement_sensor',
        },
      },
    });
    expect(cue.iconName).toBe('snowflake-alert');
    expect(cue.label).toBe('Confirmed ice');
    expect(cue.accessibilityLabel).toBe('Primary factor: Confirmed ice');
  });

  test('maps traction driver with possible_refreeze to "Possible refreeze"', () => {
    const cue = getPrimaryHazardCue({
      winterDecision: {
        ...baseWinterDecision,
        overallDecision: 'caution',
        primaryHazardDriver: 'traction',
        tractionBiomechanics: {
          ...baseWinterDecision.tractionBiomechanics,
          severity: 'caution',
          condition: 'possible_refreeze',
          provenance: 'forecast_refreeze_proxy',
        },
      },
    });
    expect(cue.iconName).toBe('snowflake-alert');
    expect(cue.label).toBe('Possible refreeze');
    expect(cue.accessibilityLabel).toBe('Primary factor: Possible refreeze');
  });

  test('CRITICAL INVARIANT: chemical driver with reported deicer produces "Deicer reported"', () => {
    const cue = getPrimaryHazardCue({
      winterDecision: {
        ...baseWinterDecision,
        overallDecision: 'caution',
        primaryHazardDriver: 'chemical',
        chemicalExposure: {
          ...baseWinterDecision.chemicalExposure,
          severity: 'warning',
          presenceState: 'deicer_present',
          provenance: 'agency_reported',
          isDecisionRelevant: true,
        },
      },
    });
    expect(cue.iconName).toBe('flask-outline');
    expect(cue.label).toBe('Deicer reported');
    expect(cue.accessibilityLabel).toBe('Primary factor: Deicer reported');
  });

  test('CRITICAL INVARIANT: chemical driver with unmeasured treatment NEVER produces "Deicer reported"', () => {
    const cue = getPrimaryHazardCue({
      winterDecision: {
        ...baseWinterDecision,
        overallDecision: 'caution',
        primaryHazardDriver: 'chemical',
        chemicalExposure: {
          ...baseWinterDecision.chemicalExposure,
          severity: 'advisory',
          presenceState: 'treatment_data_unavailable',
          provenance: 'unmeasured',
          isDecisionRelevant: true,
        },
      },
    });
    expect(cue.iconName).toBe('alert-circle-outline');
    expect(cue.label).not.toContain('Deicer reported');
    expect(cue.label).toBe('Winter sidewalk conditions');
  });

  test('maps primary driver "none" to checkmark and "Clear conditions"', () => {
    const cue = getPrimaryHazardCue({
      winterDecision: baseWinterDecision,
    });
    expect(cue.iconName).toBe('check-circle-outline');
    expect(cue.label).toBe('Clear conditions');
  });

  test('maps summer hot pavement to sun and "Heat & pavement"', () => {
    const cue = getPrimaryHazardCue({
      winterDecision: null,
      heatContext: {
        roadTempF: 112,
        npiScore: 2.5,
      },
    });
    expect(cue.iconName).toBe('white-balance-sunny');
    expect(cue.label).toBe('Heat & pavement');
    expect(cue.accessibilityLabel).toBe('Primary factor: Heat & pavement');
  });

  test('maps summer heat stress to sun and "Heat & humidity"', () => {
    const cue = getPrimaryHazardCue({
      winterDecision: null,
      heatContext: {
        roadTempF: 85,
        npiScore: 4.8,
      },
    });
    expect(cue.iconName).toBe('white-balance-sunny');
    expect(cue.label).toBe('Heat & humidity');
    expect(cue.accessibilityLabel).toBe('Primary factor: Heat & humidity');
  });

  test('maps mild summer weather to "Clear conditions"', () => {
    const cue = getPrimaryHazardCue({
      winterDecision: null,
      heatContext: {
        roadTempF: 75,
        npiScore: 1.2,
      },
    });
    expect(cue.iconName).toBe('check-circle-outline');
    expect(cue.label).toBe('Clear conditions');
  });
});
