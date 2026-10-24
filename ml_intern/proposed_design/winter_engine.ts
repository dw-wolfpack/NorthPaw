/**
 * NorthPaw Unified Deterministic Winter Engine (v2)
 */

import { evaluateColdExposure } from './cold_exposure';
import { evaluateTractionBiomechanics } from './traction_biomechanics';
import { evaluateChemicalExposure } from './chemical_exposure';
import type {
  CaninePhenotypeInput,
  EnvironmentalTelemetryInput,
  OverallWinterDecision,
  WinterDecisionOutput,
} from './winter_types';

export function runWinterDecisionEngine(
  env: EnvironmentalTelemetryInput,
  dog: CaninePhenotypeInput
): WinterDecisionOutput {
  // 1. Evaluate Independent Components
  const cold = evaluateColdExposure(
    env.ambientTempF,
    env.windSpeedMph,
    env.moistureCategory,
    dog
  );

  // Universal traction evaluation (senior branching removed)
  const traction = evaluateTractionBiomechanics(
    env.tractionCondition,
    env.tractionProvenance
  );

  const chemical = evaluateChemicalExposure(
    env.chemicalProvenance,
    env.deicerType ?? 'unknown',
    env.isSnowOrIceActive
  );

  // 2. Precedence Arbitration
  let overallDecision: OverallWinterDecision = 'ready';
  let primaryHazardDriver: 'cold' | 'traction' | 'chemical' | 'none' = 'none';

  if (cold.severity === 'severe') {
    overallDecision = 'hazard';
    primaryHazardDriver = 'cold';
  } else if (traction.severity === 'hazard') {
    overallDecision = 'hazard';
    primaryHazardDriver = 'traction';
  } else if (cold.severity === 'warning') {
    overallDecision = 'caution';
    primaryHazardDriver = 'cold';
  } else if (chemical.severity === 'warning') {
    overallDecision = 'caution';
    primaryHazardDriver = 'chemical';
  } else if (traction.severity === 'caution') {
    overallDecision = 'caution';
    primaryHazardDriver = 'traction';
  } else if (cold.severity === 'advisory' || chemical.severity === 'advisory') {
    overallDecision = 'caution';
    primaryHazardDriver = cold.severity === 'advisory' ? 'cold' : 'chemical';
  }

  // 3. User-Facing Copy Generation
  let headline = 'Conditions are clear for an outing.';
  let subtext = 'Enjoy your walk together.';
  let protectiveGearPrompt: string | undefined;

  if (chemical.presenceState === 'deicer_present') {
    protectiveGearPrompt =
      'Protective dog boots provide an impermeable barrier against chemical deicing pellets. If walking barefoot, rinse or wipe paws with warm water after your walk.';
  } else if (traction.condition === 'confirmed_ice' || traction.condition === 'possible_refreeze') {
    protectiveGearPrompt =
      'Dog boots help protect paw pads from sharp crust ice and provide traction. On packed snow, paw balm can reduce ice-balling between toes.';
  }

  if (primaryHazardDriver === 'traction') {
    headline = traction.headline;
    subtext = traction.subtext;
  } else if (primaryHazardDriver === 'chemical') {
    headline = 'Chemical deicer alert.';
    subtext = chemical.actionGuidance || 'Deicing pellets present on walking surfaces.';
  } else if (primaryHazardDriver === 'cold') {
    if (cold.severity === 'severe') {
      headline = 'Extreme cold exposure.';
      subtext =
        env.moistureCategory !== 'dry'
          ? `Wet precipitation at ${env.ambientTempF}°F rapidly accelerates body cooling. Keep outings strictly to brief potty relief.`
          : `Severe sub-freezing cold (${env.ambientTempF}°F). Keep outings short and active. Watch for shivering or paw lifting.`;
    } else if (cold.severity === 'warning') {
      headline = 'Cold weather advisory.';
      subtext =
        env.moistureCategory !== 'dry'
          ? `Wet conditions at ${env.ambientTempF}°F increase heat loss. Keep walk brisk and dry off immediately upon returning.`
          : `Brisk cold (${env.ambientTempF}°F). Keep your dog moving and monitor comfort.`;
    } else {
      headline = 'Chilly outdoor air.';
      subtext = `Ambient temperature is ${env.ambientTempF}°F. Dress thin-coated dogs in a jacket if lingering outside.`;
    }
  }

  return {
    overallDecision,
    primaryHazardDriver,
    ambientTempF: env.ambientTempF, // Exact measured/forecast temperature
    coldExposure: cold,
    tractionBiomechanics: traction,
    chemicalExposure: chemical,
    userFacingCopy: {
      headline,
      subtext,
      protectiveGearPrompt,
    },
  };
}
