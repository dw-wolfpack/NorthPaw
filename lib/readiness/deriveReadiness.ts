// LAYER 1 — shipped (MVP)

import { buildReadinessCopy } from '@/lib/readiness/copy';
import type {
  OutingReadinessState,
  ReadinessDerivationInput,
  ReadinessPresentation,
} from '@/lib/readiness/types';

/**
 * Pure derivation for outing readiness (today’s primary checklist + conditions modal).
 *
 * State order (first match wins):
 * - ready — all items checked for today’s pack (totalItems > 0)
 * - almost_ready — exactly one item left (requires totalItems >= 2 per product spec)
 * - pack_started — partial checks (1..total-2), or opened today with incomplete pack
 * - conditions_checked — viewed conditions today, no pack progress yet
 * - not_started
 *
 * Policy: opening the suggested checklist with 0 checks counts as pack_started (plan).
 * Scan is intentionally excluded from ReadinessDerivationInput.
 */
export function deriveOutingReadinessState(input: ReadinessDerivationInput): OutingReadinessState {
  const { totalItems: t, completedItems: c, conditionsViewedToday, checklistOpenedToday } = input;

  if (t <= 0) return 'not_started';

  if (c === t) return 'ready';

  if (t >= 2 && c === t - 1) return 'almost_ready';

  const partialMiddle = t >= 2 && c >= 1 && c <= t - 2;
  const openedIncomplete =
    checklistOpenedToday &&
    c < t &&
    !(t >= 2 && c === t - 1); /* not almost_ready */

  if (partialMiddle || openedIncomplete) return 'pack_started';

  if (conditionsViewedToday && c === 0 && !checklistOpenedToday) return 'conditions_checked';

  return 'not_started';
}

export function getReadinessState(input: ReadinessDerivationInput): ReadinessPresentation {
  const state = deriveOutingReadinessState(input);
  const t = input.totalItems;
  const c = input.completedItems;
  const progressFraction = t > 0 ? Math.min(1, Math.max(0, c / t)) : 0;

  const copy = buildReadinessCopy({
    state,
    dogName: input.dogName,
    useDogFirstTone: input.useDogFirstTone,
    weatherHeroLine: input.weatherHeroLine,
    totalItems: t,
    completedItems: c,
    primaryChecklistId: input.primaryChecklistId,
  });

  const careChipLabel =
    input.careRemindersOnTrack === true ? 'Care up to date' : null;

  return {
    state,
    title: copy.title,
    subtitle: copy.subtitle,
    ctaLabel: copy.ctaLabel,
    ctaAction: copy.ctaAction,
    progressFraction,
    dogToneTitle: copy.dogToneTitle,
    careChipLabel,
  };
}
