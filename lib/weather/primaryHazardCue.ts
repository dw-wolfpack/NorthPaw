/**
 * Primary Hazard Explanation Cue Helper
 *
 * Epistemic Governance:
 * - Pure semantic mapping helper; contains ZERO safety or risk arbitration logic.
 * - Maps existing decision engine output to human presentation vocabulary.
 * - Enforces invariant: "Deicer reported" ONLY occurs when presence is actually reported/measured;
 *   unmeasured treatment never produces a "Deicer reported" claim.
 * - Accessible: always provides semantic text label; never relies on icon or color alone.
 */

import type { WinterDecisionOutput } from './winterTypes';

export type PrimaryHazardCue = {
  iconName: 'white-balance-sunny' | 'snowflake' | 'snowflake-alert' | 'flask-outline' | 'alert-circle-outline' | 'check-circle-outline';
  label: string;
  accessibilityLabel: string;
};

export type HazardCueInput = {
  winterDecision?: WinterDecisionOutput | null;
  heatContext?: {
    roadTempF?: number | null;
    npiScore?: number | null;
  } | null;
};

/**
 * Maps existing engine output to an explanation cue.
 */
export function getPrimaryHazardCue(input: HazardCueInput): PrimaryHazardCue {
  const { winterDecision, heatContext } = input;

  if (winterDecision) {
    switch (winterDecision.primaryHazardDriver) {
      case 'cold':
        return {
          iconName: 'snowflake',
          label: 'Cold conditions',
          accessibilityLabel: 'Primary factor: Cold conditions',
        };

      case 'traction':
        if (winterDecision.tractionBiomechanics.condition === 'confirmed_ice') {
          return {
            iconName: 'snowflake-alert',
            label: 'Confirmed ice',
            accessibilityLabel: 'Primary factor: Confirmed ice',
          };
        }
        return {
          iconName: 'snowflake-alert',
          label: 'Possible refreeze',
          accessibilityLabel: 'Primary factor: Possible refreeze',
        };

      case 'chemical':
        if (winterDecision.chemicalExposure.presenceState === 'deicer_present') {
          return {
            iconName: 'flask-outline',
            label: 'Deicer reported',
            accessibilityLabel: 'Primary factor: Deicer reported',
          };
        }
        // Treatment unmeasured: never say "Deicer reported" or use salt symbols
        return {
          iconName: 'alert-circle-outline',
          label: 'Winter sidewalk conditions',
          accessibilityLabel: 'Primary factor: Winter sidewalk conditions',
        };

      case 'none':
      default:
        return {
          iconName: 'check-circle-outline',
          label: 'Clear conditions',
          accessibilityLabel: 'Primary factor: Clear conditions',
        };
    }
  }

  // Non-winter (Heat / Pavement / Warm weather)
  if (heatContext) {
    const isPavementHot = (heatContext.roadTempF ?? 0) >= 100;
    const isHeatStress = (heatContext.npiScore ?? 0) >= 3.1;

    if (isPavementHot) {
      return {
        iconName: 'white-balance-sunny',
        label: 'Heat & pavement',
        accessibilityLabel: 'Primary factor: Heat & pavement',
      };
    }

    if (isHeatStress) {
      return {
        iconName: 'white-balance-sunny',
        label: 'Heat & humidity',
        accessibilityLabel: 'Primary factor: Heat & humidity',
      };
    }
  }

  return {
    iconName: 'check-circle-outline',
    label: 'Clear conditions',
    accessibilityLabel: 'Primary factor: Clear conditions',
  };
}
