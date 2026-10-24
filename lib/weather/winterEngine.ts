/**
 * NorthPaw Unified Deterministic Winter Engine (Production v1)
 *
 * Epistemic & Multi-Hazard Governance:
 * 1. Independent 3-Lane Architecture:
 *    Cold Exposure, Traction Biomechanics, and Chemical Exposure (+ Visibility)
 *    are evaluated as independent, inspectable domain components.
 * 2. Deterministic Precedence Arbitration:
 *    Avoids averaging independent hazards into a scalar or fake index.
 *    Overall decision is determined by the most consequential active hazard:
 *    Hazard (Severe Cold / Confirmed Ice) > Caution (Cold Warning / Deicer Present / Possible Refreeze / Advisory) > Ready.
 * 3. Transparent Hazard Driver:
 *    Exposes 'primaryHazardDriver' so the UI can explain exactly why the decision changed.
 * 4. Ambient Temperature Preservation:
 *    Raw measured/forecast temperature is preserved without additive Fahrenheit offsets or fake effective temperatures.
 * 5. Evidence-Audited Copy:
 *    Prohibits frostbite countdown timers, uncalibrated duration claims, or assumed salting.
 */

import { evaluateColdExposure } from './coldExposure';
import { evaluateTractionBiomechanics } from './tractionBiomechanics';
import { evaluateChemicalExposure } from './chemicalExposure';
import {
  mapDogProfileToPhenotype,
  mapWeatherToTelemetry,
  type CaninePhenotypeInput,
  type EnvironmentalTelemetryInput,
  type OverallWinterDecision,
  type PrimaryHazardDriver,
  type VisibilityResult,
  type WinterDecisionOutput,
} from './winterTypes';
import type { DogProfile } from '@/lib/profile';
import type { HomeWeatherState } from './nwsWeather';

export function runWinterDecisionEngine(
  env: EnvironmentalTelemetryInput,
  dog: CaninePhenotypeInput
): WinterDecisionOutput {
  // 1. Evaluate Independent Domain Lanes
  const cold = evaluateColdExposure(
    env.ambientTempF,
    env.windSpeedMph,
    env.moistureCategory,
    dog
  );

  const traction = evaluateTractionBiomechanics(
    env.tractionCondition,
    env.tractionProvenance
  );

  const chemical = evaluateChemicalExposure(
    env.chemicalProvenance,
    env.deicerType ?? 'unknown',
    env.isSnowOrIceActive
  );

  // Deterministic Visibility / Daylight evaluation (separate from cold)
  const isDaytime = env.isDaytime ?? true;
  const visibility: VisibilityResult = {
    severity: isDaytime ? 'none' : 'advisory',
    isDaytime,
    guidance: isDaytime
      ? undefined
      : 'Low light conditions. Use reflective collar/leash or a clip light to stay visible.',
  };

  // 2. Multi-Hazard Precedence Arbitration
  let overallDecision: OverallWinterDecision = 'ready';
  let primaryHazardDriver: PrimaryHazardDriver = 'none';

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

  // 3. User-Facing Microcopy Generation
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
    visibility,
    userFacingCopy: {
      headline,
      subtext,
      protectiveGearPrompt,
    },
  };
}

/**
 * Production Adapter: Evaluates Winter decision directly from HomeWeatherState & DogProfile.
 */
export function evaluateWinterForProfile(
  weather: Extract<HomeWeatherState, { status: 'ok' }>,
  profile?: DogProfile | null
): WinterDecisionOutput {
  const phenotype = mapDogProfileToPhenotype(profile);
  const telemetry = mapWeatherToTelemetry(weather);
  return runWinterDecisionEngine(telemetry, phenotype);
}
