/**
 * NorthPaw Categorical Winter Decision Engine — Production Type Definitions (v1)
 *
 * Epistemic Boundary Governance:
 * - All boundaries are strictly labeled EVIDENCE_DERIVED or CONSERVATIVE_POLICY.
 * - Confirmed ice is allow-listed strictly to qualifying pavement sensor measurement or direct observation.
 * - Deicer state is evidence-neutral ('deicer_present' vs 'treatment_data_unavailable').
 * - Provenance is tracked separately ('user_reported', 'agency_reported', 'sensor_measured', 'unmeasured').
 * - Zero senior-specific traction branching without direct senior evidence.
 * - Brachycephaly, fur color, and breed name are cold-neutral in Winter.
 */

import type { DogProfile } from '@/lib/profile';
import type { HomeWeatherState } from './nwsWeather';

export type AmbientTempBand =
  | 'extreme_cold'   // <= 10°F (CONSERVATIVE_POLICY)
  | 'severe_cold'    // 11°F - 25°F (CONSERVATIVE_POLICY)
  | 'moderate_cold'  // 26°F - 35°F (EVIDENCE_DERIVED: 32°F water phase transition)
  | 'chilly'         // 36°F - 45°F (CONSERVATIVE_POLICY)
  | 'mild';          // > 45°F (CONSERVATIVE_POLICY)

export type WindCategory =
  | 'calm'           // < 10 mph (EVIDENCE_DERIVED boundary at ~4.5 m/s)
  | 'moderate'       // 10 - 20 mph (EVIDENCE_DERIVED boundary)
  | 'high';          // >= 20 mph (EVIDENCE_DERIVED boundary at ~8.9 m/s)

export type MoistureCategory = 'dry' | 'wet_precip' | 'wet_slush';

export type MassCategory = 'toy_small' | 'medium' | 'large';
export type CoatCategory = 'hairless_single_short' | 'double_dense';
export type AgeCategory = 'puppy' | 'adult_senior';

export type VulnerabilityTier = 'high' | 'moderate' | 'standard';

export type ColdExposureSeverity = 'none' | 'advisory' | 'warning' | 'severe';
export type TractionSeverity = 'none' | 'caution' | 'hazard';
export type ChemicalSeverity = 'none' | 'advisory' | 'warning';
export type VisibilitySeverity = 'none' | 'advisory';

export type TractionCondition = 'dry' | 'wet' | 'possible_refreeze' | 'confirmed_ice';
export type TractionProvenance =
  | 'pavement_sensor'
  | 'direct_user_report'
  | 'forecast_refreeze_proxy'
  | 'unmeasured';

export type ChemicalPresenceState = 'deicer_present' | 'treatment_data_unavailable';
export type ChemicalProvenance =
  | 'user_reported'
  | 'agency_reported'
  | 'sensor_measured'
  | 'unmeasured';

export type DeicerType = 'cacl2_pellets' | 'general_deicer' | 'unknown';

export type OverallWinterDecision = 'ready' | 'caution' | 'hazard';
export type PrimaryHazardDriver = 'cold' | 'traction' | 'chemical' | 'visibility' | 'none';

export interface CaninePhenotypeInput {
  massCategory: MassCategory;
  coatCategory: CoatCategory;
  ageCategory: AgeCategory;
  breedLabel?: string;
  isBrachycephalic?: boolean;
  furColor?: string;
}

export interface EnvironmentalTelemetryInput {
  ambientTempF: number;
  windSpeedMph: number;
  moistureCategory: MoistureCategory;
  tractionCondition: TractionCondition;
  tractionProvenance: TractionProvenance;
  chemicalProvenance: ChemicalProvenance;
  deicerType?: DeicerType;
  isSnowOrIceActive: boolean;
  isDaytime?: boolean;
}

export interface ColdExposureResult {
  severity: ColdExposureSeverity;
  ambientTempF: number;
  ambientTempBand: AmbientTempBand;
  vulnerabilityTier: VulnerabilityTier;
  reasons: string[];
}

export interface TractionBiomechanicsResult {
  severity: TractionSeverity;
  condition: TractionCondition;
  provenance: TractionProvenance;
  headline: string;
  subtext: string;
}

export interface ChemicalExposureResult {
  severity: ChemicalSeverity;
  presenceState: ChemicalPresenceState;
  provenance: ChemicalProvenance;
  deicerType: DeicerType;
  actionGuidance?: string;
  isDecisionRelevant: boolean;
}

export interface VisibilityResult {
  severity: VisibilitySeverity;
  isDaytime: boolean;
  guidance?: string;
}

export interface WinterDecisionOutput {
  overallDecision: OverallWinterDecision;
  primaryHazardDriver: PrimaryHazardDriver;
  ambientTempF: number;
  coldExposure: ColdExposureResult;
  tractionBiomechanics: TractionBiomechanicsResult;
  chemicalExposure: ChemicalExposureResult;
  visibility: VisibilityResult;
  userFacingCopy: {
    headline: string;
    subtext: string;
    protectiveGearPrompt?: string;
  };
}

/**
 * Maps existing production DogProfile into CaninePhenotypeInput.
 * Follows strict epistemic constraints:
 * - Mass: <15 lbs -> toy_small, 15-50 lbs -> medium, >50 lbs -> large. Missing defaults to medium.
 * - Coat: 'Double' -> double_dense, else -> hairless_single_short.
 * - Age: 'puppy' -> puppy, 'young'/'adult'/'senior' -> adult_senior (senior alone has no cold modifier).
 * - Snout, color, breed: recorded for neutrality auditing, never alters cold tier.
 */
export function mapDogProfileToPhenotype(profile?: DogProfile | null): CaninePhenotypeInput {
  if (!profile) {
    return {
      massCategory: 'medium',
      coatCategory: 'hairless_single_short',
      ageCategory: 'adult_senior',
    };
  }

  let massCategory: MassCategory = 'medium';
  if (typeof profile.dogWeightLbs === 'number' && Number.isFinite(profile.dogWeightLbs)) {
    if (profile.dogWeightLbs < 15) {
      massCategory = 'toy_small';
    } else if (profile.dogWeightLbs > 50) {
      massCategory = 'large';
    } else {
      massCategory = 'medium';
    }
  }

  const coatCategory: CoatCategory =
    profile.dogCoatType === 'Double' ? 'double_dense' : 'hairless_single_short';

  const ageCategory: AgeCategory =
    profile.dogAgeGroup?.toLowerCase() === 'puppy' ? 'puppy' : 'adult_senior';

  return {
    massCategory,
    coatCategory,
    ageCategory,
    breedLabel: profile.dogBreed || undefined,
    isBrachycephalic: profile.dogSnoutProfile === 'flat',
    furColor: profile.dogColor || undefined,
  };
}

/**
 * Maps production HomeWeatherState into EnvironmentalTelemetryInput.
 */
export function mapWeatherToTelemetry(
  weather: Extract<HomeWeatherState, { status: 'ok' }>,
  options?: {
    tractionConditionOverride?: TractionCondition;
    tractionProvenanceOverride?: TractionProvenance;
    chemicalProvenanceOverride?: ChemicalProvenance;
    deicerType?: DeicerType;
  }
): EnvironmentalTelemetryInput {
  const blob = `${weather.forecastShort}\n${weather.summary}`.toLowerCase();
  const precipN = weather.precipChance ?? 0;

  // Determine moisture category
  let moistureCategory: MoistureCategory = 'dry';
  const hasMoisture = precipN >= 38 || /rain|shower|storm|drizzle|snow|slush|ice|wintry|sleet/i.test(blob);
  if (hasMoisture) {
    if (weather.tempF <= 35 && /snow|slush|sleet|wintry|freezing/i.test(blob)) {
      moistureCategory = 'wet_slush';
    } else {
      moistureCategory = 'wet_precip';
    }
  }

  // Parse wind speed
  let windSpeedMph = 0;
  if (weather.hourlySamples && weather.hourlySamples.length > 0) {
    windSpeedMph = weather.hourlySamples[0].windSpeedMph;
  } else if (weather.windLine) {
    const match = weather.windLine.match(/\d+/g);
    if (match) {
      const nums = match.map(Number);
      windSpeedMph = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    }
  }

  const isSnowOrIceActive =
    weather.tempF <= 32 || /snow|ice|slush|sleet|wintry|freezing/i.test(blob);

  // Traction derivation
  let tractionCondition: TractionCondition = options?.tractionConditionOverride ?? 'dry';
  let tractionProvenance: TractionProvenance = options?.tractionProvenanceOverride ?? 'unmeasured';

  if (!options?.tractionConditionOverride) {
    if (isSnowOrIceActive || (weather.tempF <= 32 && hasMoisture)) {
      // Forecast proxy: refreeze is possible, but NOT confirmed ice
      tractionCondition = 'possible_refreeze';
      tractionProvenance = 'forecast_refreeze_proxy';
    } else if (hasMoisture) {
      tractionCondition = 'wet';
      tractionProvenance = 'forecast_refreeze_proxy';
    } else {
      tractionCondition = 'dry';
      tractionProvenance = 'unmeasured';
    }
  }

  const chemicalProvenance: ChemicalProvenance =
    options?.chemicalProvenanceOverride ?? 'unmeasured';

  return {
    ambientTempF: weather.tempF, // Exact ambient temperature preserved
    windSpeedMph,
    moistureCategory,
    tractionCondition,
    tractionProvenance,
    chemicalProvenance,
    deicerType: options?.deicerType ?? 'unknown',
    isSnowOrIceActive,
    isDaytime: weather.isDaytime,
  };
}
