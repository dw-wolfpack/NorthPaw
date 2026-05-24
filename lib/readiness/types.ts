/**
 * Outing / pack readiness — derived from real local actions, calm copy, no streaks.
 *
 * LAYER 1 — shipped (MVP)
 * LAYER 2 — scaffolded; cadence surfaced lightly later (see cadence.ts, PreparednessCadenceSnapshot)
 * LAYER 3 — copy-only; optional dog-first tone (see copy.ts)
 * Future Pro: cadence summaries, cross-device sync
 */

/** Product readiness for “today’s pack”, distinct from weather narrative on Home. */
export type OutingReadinessState =
  | 'not_started'
  | 'conditions_checked'
  | 'pack_started'
  | 'almost_ready'
  | 'ready';

/** Inputs for deterministic derivation (no scan, no analytics). */
export type ReadinessDerivationInput = {
  /** Device-local calendar date key YYYY-MM-DD (must match persistence). */
  localDate: string;
  conditionsViewedToday: boolean;
  checklistOpenedToday: boolean;
  completedItems: number;
  totalItems: number;
  /** Dog name for neutral copy only; Layer 3 may swap strings. */
  dogName: string;
  /** Layer 3 — optional warmer strings in copy layer. */
  useDogFirstTone?: boolean;
  /** Today’s primary checklist id (same rule as Home weather suggestions). */
  primaryChecklistId: string;
  /** Short weather line from existing Home hero; merged into subtitle when non-redundant. */
  weatherHeroLine?: string;
  /** Layer 2 — when true, presentation may include a calm one-line chip (e.g. care reminders on track). */
  careRemindersOnTrack?: boolean;
};

export type ReadinessCtaAction =
  | { kind: 'open_weather' }
  | { kind: 'open_checklist'; checklistId: string };

export type ReadinessPresentation = {
  state: OutingReadinessState;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaAction: ReadinessCtaAction;
  /** 0..1 for today’s primary checklist progress. */
  progressFraction: number;
  /** Layer 3 — optional alternate title when dog-first is on. */
  dogToneTitle?: string;
  /** Layer 2 — single calm chip; omit when null. */
  careChipLabel: string | null;
};

/** Layer 2 — long-horizon preparedness metrics (scaffold; Home stays minimal). */
export type PreparednessCadenceSnapshot = {
  outingsPreparedThisMonth: number;
  weekendPrepsCompletedLast4Weeks: number;
  /** Enabled med reminders with next due not before start of local today. */
  careRemindersOnTrack: boolean;
};
