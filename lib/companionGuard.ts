import { trackEvent } from '@/lib/analytics';

export interface CompanionGuardOptions {
  feature: string;
  onAllowed?: () => void;
  onBlocked?: () => void;
}

/**
 * Centralized entitlement helper for future Companion Mode paid features.
 * In Release 5.3, all Companion-gated persistence actions (Outing Log, Quick Log history)
 * present a coming-soon modal instead of persisting data or displaying false confirmations.
 */
export function requireCompanionAccess(options: CompanionGuardOptions): boolean {
  trackEvent('companion_feature_tapped', { feature: options.feature });

  if (options.onBlocked) {
    options.onBlocked();
  }

  return false;
}
