/**
 * NorthPaw Categorical Winter Decision Engine — Type Definitions (v2)
 * 
 * Epistemic Boundary Governance:
 * - All boundaries are labeled EVIDENCE_DERIVED or CONSERVATIVE_POLICY.
 * - Confirmed ice is allow-listed strictly to direct observation or sensor measurement.
 * - Deicer state is evidence-neutral ('deicer_present' vs 'treatment_data_unavailable').
 * - Provenance is tracked separately ('user_reported', 'agency_reported', 'sensor_measured', 'unmeasured').
 * - Zero senior-specific traction branching without direct senior evidence.
 */

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

export interface CaninePhenotypeInput {
  massCategory: MassCategory;
  coatCategory: CoatCategory;
  ageCategory: AgeCategory;
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
  actionGuidance?: string; // Suppressed when chemical exposure is not decision-relevant
  isDecisionRelevant: boolean;
}

export interface WinterDecisionOutput {
  overallDecision: OverallWinterDecision;
  primaryHazardDriver: 'cold' | 'traction' | 'chemical' | 'none';
  ambientTempF: number;
  coldExposure: ColdExposureResult;
  tractionBiomechanics: TractionBiomechanicsResult;
  chemicalExposure: ChemicalExposureResult;
  userFacingCopy: {
    headline: string;
    subtext: string;
    protectiveGearPrompt?: string;
  };
}
