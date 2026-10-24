/**
 * Cold Exposure Evaluation Module (v2)
 * 
 * Epistemic & Policy Boundary Governance:
 * 
 * 1. Ambient Temperature Boundaries:
 * - 45°F (7.2°C) [CONSERVATIVE_POLICY]:
 *   Sugano (1981) demonstrated canine lower critical temperature (LCT) shifts
 *   between 12.5°C (54.5°F) in winter and 18.0°C (64.4°F) in summer in outdoor dogs.
 *   For indoor companion dogs, heat loss accelerates below 50°F; 45°F is an established
 *   conservative veterinary policy threshold (Tufts Animal Care and Condition [TACC])
 *   where thin-coated or toy dogs begin requiring advisory monitoring.
 *   NOT a validated physiological injury threshold.
 * 
 * - 35°F (1.7°C) [EVIDENCE_DERIVED]:
 *   Thermodynamic water phase transition boundary. Liquid water freezes at 32°F (0°C).
 *   The 35°F boundary captures the slush/freezing-precipitation interface where
 *   Arkin et al. (1991) and ISDVMA (1996) demonstrated a 3- to 5-fold collapse in fur
 *   thermal resistance and a 3.8-fold spike in dermal maceration.
 * 
 * - 25°F (-3.9°C) [CONSERVATIVE_POLICY]:
 *   Derived from veterinary clinical guidelines (Tufts TACC) and sled dog welfare
 *   assessments (VKM 2017 shows thin-coated pointer crosses increase shivering below
 *   -5°C / 23°F). Selected as the conservative policy boundary for issuing general pet warnings.
 *   NOT an observed physiological threshold for all dogs.
 * 
 * - 10°F (-12.2°C) [CONSERVATIVE_POLICY]:
 *   At -10°C to -15°C, even thick-coated breeds exhibit significant metabolic heat elevation
 *   unless performing intense endurance pulling (VKM 2017, Sugano 1981). Selected as the
 *   conservative policy ceiling for safe ordinary companion outings.
 *   NOT an acute frostbite boundary.
 * 
 * 2. Wind Boundaries:
 * - 10 mph (4.5 m/s) [EVIDENCE_DERIVED]:
 *   Boundary-layer fluid mechanics (Arkin et al. 1991) and VKM (2017) demonstrate that
 *   convective stripping of stagnant fur boundary air begins substantially between 2–5 m/s
 *   (4.5–11 mph), where forced convection overtakes natural buoyant convection.
 * 
 * - 20 mph (8.9 m/s) [EVIDENCE_DERIVED]:
 *   VKM (2017) documented that convective airflow above 8–10 m/s increases convective
 *   heat loss by over 200%, raising effective canine LCT by 10°C to 15°C.
 * 
 * 3. Vulnerability Rules:
 * - Puppy -> High [CONSERVATIVE_POLICY informed by EVIDENCE_DERIVED developmental lag]:
 *   McIntyre & Ederstrom (1958) proved homeothermic heat conservation lags behind heat
 *   production in juveniles. Placing all puppies (<6 months) into the 'high' tier is a
 *   conservative safety policy to protect companion puppies whose coat and subcutaneous
 *   adipose development vary widely.
 * 
 * - Small + Thin -> High [CONSERVATIVE_POLICY synthesizing two EVIDENCE_DERIVED factors]:
 *   Synthesizes allometric surface-area-to-mass scaling (A/M ~ M^-1/3, Kleiber 1932) and
 *   fur insulation deficits in single coats (Sugano 1981). Compounding both deficits
 *   justifies the 'high' vulnerability tier as a conservative policy rule.
 */

import type {
  AmbientTempBand,
  CaninePhenotypeInput,
  ColdExposureResult,
  ColdExposureSeverity,
  MoistureCategory,
  VulnerabilityTier,
  WindCategory,
} from './winter_types';

export function deriveAmbientTempBand(tempF: number): AmbientTempBand {
  if (tempF <= 10) return 'extreme_cold';   // CONSERVATIVE_POLICY
  if (tempF <= 25) return 'severe_cold';    // CONSERVATIVE_POLICY
  if (tempF <= 35) return 'moderate_cold';  // EVIDENCE_DERIVED (Freezing transition)
  if (tempF <= 45) return 'chilly';         // CONSERVATIVE_POLICY
  return 'mild';                            // CONSERVATIVE_POLICY
}

export function deriveWindCategory(speedMph: number): WindCategory {
  if (speedMph >= 20) return 'high';        // EVIDENCE_DERIVED (VKM 2017)
  if (speedMph >= 10) return 'moderate';    // EVIDENCE_DERIVED (Arkin 1991)
  return 'calm';                            // EVIDENCE_DERIVED
}

export function deriveVulnerabilityTier(phenotype: CaninePhenotypeInput): VulnerabilityTier {
  const isPuppy = phenotype.ageCategory === 'puppy';
  const isSmall = phenotype.massCategory === 'toy_small';
  const isThinCoated = phenotype.coatCategory === 'hairless_single_short';

  // High vulnerability:
  // - Puppy: CONSERVATIVE_POLICY informed by McIntyre & Ederstrom (1958) developmental lag
  // - Small + Thin: CONSERVATIVE_POLICY synthesizing Kleiber (1932) and Sugano (1981)
  if (isPuppy || (isSmall && isThinCoated)) {
    return 'high';
  }

  // Moderate vulnerability: either small mass OR thin coat alone
  if (isSmall || isThinCoated) {
    return 'moderate';
  }

  // Standard: medium/large with double/dense coat
  return 'standard';
}

/**
 * Deterministic Monotonic Arbitration Matrix
 */
export function evaluateColdExposure(
  ambientTempF: number,
  windSpeedMph: number,
  moistureCategory: MoistureCategory,
  phenotype: CaninePhenotypeInput
): ColdExposureResult {
  const ambientTempBand = deriveAmbientTempBand(ambientTempF);
  const windCategory = deriveWindCategory(windSpeedMph);
  const vulnerabilityTier = deriveVulnerabilityTier(phenotype);
  const isWet = moistureCategory !== 'dry';

  const reasons: string[] = [];

  if (ambientTempBand === 'extreme_cold' || ambientTempBand === 'severe_cold') {
    reasons.push(`Sub-freezing ambient temperature (${ambientTempF}°F) drives high radiative and conductive heat loss.`);
  }
  if (windCategory === 'high') {
    reasons.push('High winds (>20 mph) strip the stagnant warm air boundary layer from the coat.');
  } else if (windCategory === 'moderate') {
    reasons.push('Brisk winds (10–20 mph) increase convective heat loss.');
  }
  if (isWet) {
    reasons.push('Moisture displaces insulating air pockets in fur, increasing thermal conductivity.');
  }
  if (vulnerabilityTier === 'high') {
    if (phenotype.ageCategory === 'puppy') {
      reasons.push('Puppies have higher surface-area-to-mass ratios and thinner insulating adipose tissue.');
    } else {
      reasons.push('Small body size and short/single coat compound conductive and convective heat loss.');
    }
  } else if (vulnerabilityTier === 'moderate') {
    if (phenotype.massCategory === 'toy_small') {
      reasons.push('Small body mass accelerates heat loss per unit tissue mass.');
    } else {
      reasons.push('Single or short coat provides reduced thermal boundary resistance.');
    }
  }

  let severity: ColdExposureSeverity = 'none';

  switch (ambientTempBand) {
    case 'extreme_cold':
      severity = 'severe';
      break;

    case 'severe_cold':
      if (isWet || windCategory === 'high' || vulnerabilityTier === 'high') {
        severity = 'severe';
      } else {
        severity = 'warning';
      }
      break;

    case 'moderate_cold':
      if (isWet && (windCategory !== 'calm' || vulnerabilityTier === 'high')) {
        severity = 'severe';
      } else if (isWet || windCategory === 'high' || (windCategory === 'moderate' && vulnerabilityTier !== 'standard')) {
        severity = 'warning';
      } else if (vulnerabilityTier === 'high') {
        severity = 'warning';
      } else {
        severity = 'advisory';
      }
      break;

    case 'chilly':
      if (isWet && windCategory === 'high' && vulnerabilityTier === 'high') {
        severity = 'warning';
      } else if (isWet || (windCategory !== 'calm' && vulnerabilityTier === 'high') || vulnerabilityTier === 'high') {
        severity = 'advisory';
      } else if (windCategory === 'high' && vulnerabilityTier === 'moderate') {
        severity = 'advisory';
      } else {
        severity = 'none';
      }
      break;

    case 'mild':
      severity = 'none';
      break;
  }

  return {
    severity,
    ambientTempF, // Exact untampered temperature
    ambientTempBand,
    vulnerabilityTier,
    reasons,
  };
}
