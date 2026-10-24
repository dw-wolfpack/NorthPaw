/**
 * Traction Biomechanics Evaluation Module (Production v1)
 *
 * Epistemic & Provenance Governance:
 * 1. Allow-listed Confirmed Ice:
 *    Only qualifying pavement sensor measurement ('pavement_sensor') or direct observation
 *    ('direct_user_report') may produce 'confirmed_ice'. All other provenance (including
 *    'forecast_refreeze_proxy' and 'unmeasured') is strictly incapable of producing it,
 *    and will deterministically downgrade to 'possible_refreeze'.
 * 2. Universal Traction Copy:
 *    Zero senior-specific branching. Low-friction slip mechanics apply universally across
 *    all canine ages; joint torque and slip avoidance guidance is provided without age bias.
 * 3. Removal of "Salted Ground":
 *    Never assumes surfaces are salted or safe based on cold or snow.
 */

import type {
  TractionBiomechanicsResult,
  TractionCondition,
  TractionProvenance,
  TractionSeverity,
} from './winterTypes';

export function evaluateTractionBiomechanics(
  condition: TractionCondition,
  provenance: TractionProvenance
): TractionBiomechanicsResult {
  // Allow-list guardrail: confirmed_ice strictly requires pavement_sensor or direct_user_report
  let effectiveCondition: TractionCondition = condition;
  if (condition === 'confirmed_ice') {
    const isAllowListed =
      provenance === 'pavement_sensor' || provenance === 'direct_user_report';
    if (!isAllowListed) {
      // Downgrade all unverified claims of confirmed ice to possible_refreeze
      effectiveCondition = 'possible_refreeze';
    }
  }

  let severity: TractionSeverity = 'none';
  let headline = 'Traction clear.';
  let subtext = 'Surface friction is normal for outdoor walking.';

  if (effectiveCondition === 'confirmed_ice') {
    severity = 'hazard';
    headline = 'Confirmed icy surfaces.';
    subtext =
      'Severe slip hazard. Low-friction surfaces significantly increase joint moments and slip frequency. Avoid untreated slick pavement.';
  } else if (effectiveCondition === 'possible_refreeze') {
    severity = 'caution';
    headline = 'Possible slick refreeze.';
    subtext = 'Watch for patchy refreeze or glazed snow that can cause sudden slips.';
  } else if (effectiveCondition === 'wet') {
    severity = 'none';
    headline = 'Wet surfaces.';
    subtext = 'Pavement is wet but above freezing; watch footing on painted lines and smooth metal.';
  }

  return {
    severity,
    condition: effectiveCondition,
    provenance,
    headline,
    subtext,
  };
}
