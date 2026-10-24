/**
 * Chemical Deicer Exposure Evaluation Module (Production v1)
 *
 * Epistemic & Provenance Governance:
 * 1. Evidence-Neutral State:
 *    Uses 'deicer_present' instead of value-laden 'confirmed_deicer'.
 * 2. Distinct Provenance:
 *    Explicitly tracks 'user_reported', 'agency_reported', 'sensor_measured', and 'unmeasured'.
 * 3. Decision-Relevance Copy Suppression:
 *    Retains 'treatment_data_unavailable' internally for state completeness, but suppresses
 *    user-facing copy when chemical exposure is not decision-relevant (e.g. mild/dry weather
 *    without snow or ice).
 * 4. Critical Invariant:
 *    NEVER emits "no deicers expected" when treatment is unmeasured (Unknown != Safe).
 * 5. Qualified Paw Hygiene:
 *    Wiping paws and boot wearing are non-mandatory and qualified as practical risk-reduction recommendations.
 */

import type {
  ChemicalExposureResult,
  ChemicalPresenceState,
  ChemicalProvenance,
  ChemicalSeverity,
  DeicerType,
} from './winterTypes';

export function evaluateChemicalExposure(
  provenance: ChemicalProvenance,
  deicerType: DeicerType = 'unknown',
  isSnowOrIceActive: boolean = false
): ChemicalExposureResult {
  let presenceState: ChemicalPresenceState = 'treatment_data_unavailable';
  let severity: ChemicalSeverity = 'none';
  let actionGuidance: string | undefined = undefined;
  let isDecisionRelevant = false;

  if (
    provenance === 'user_reported' ||
    provenance === 'agency_reported' ||
    provenance === 'sensor_measured'
  ) {
    presenceState = 'deicer_present';
    severity = 'warning';
    isDecisionRelevant = true;

    if (deicerType === 'cacl2_pellets') {
      actionGuidance =
        'Solid calcium chloride deicing pellets reported. These pellets dissolve exothermically and can cause severe skin irritation. Use protective dog boots if tolerated, and rinse or wipe paws with warm water after walking.';
    } else {
      actionGuidance =
        'Chemical deicer reported on walking surfaces. Use protective dog boots if tolerated, and rinse or wipe paws with warm water after your walk to remove residue.';
    }
  } else {
    // Provenance is 'unmeasured' -> treatment_data_unavailable
    presenceState = 'treatment_data_unavailable';

    if (isSnowOrIceActive) {
      // Chemical exposure IS decision-relevant due to active freezing weather / snow
      severity = 'advisory';
      isDecisionRelevant = true;
      actionGuidance =
        'Sidewalk chemical treatment is unmeasured. If walking along treated roads or commercial walkways, wipe paws with a damp cloth after your walk to remove potential salt residue.';
    } else {
      // Chemical exposure is NOT decision-relevant -> suppress copy
      severity = 'none';
      isDecisionRelevant = false;
      actionGuidance = undefined; // Suppressed copy
    }
  }

  return {
    severity,
    presenceState,
    provenance,
    deicerType,
    actionGuidance,
    isDecisionRelevant,
  };
}
