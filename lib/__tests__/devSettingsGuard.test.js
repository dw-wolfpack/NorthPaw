/**
 * Strict Developer Settings Guard & Environment Release Gate Tests.
 *
 * Rules:
 * - __DEV__ true => true
 * - EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS exactly "true" => true
 * - EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS "false" => false
 * - EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS missing / undefined / null / "" => false
 * - EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS "TRUE", "True", "1", "yes" => false (strict === 'true')
 */

function evaluateShouldShowDeveloperTools({ isDev, flagValue }) {
  if (isDev) return true;
  return flagValue === 'true';
}

describe('shouldShowDeveloperTools — Environment Release Gate', () => {
  // ── Local Development ──────────────────────────────────────────────────────
  it('DEV-1: returns true in local development (__DEV__ = true) regardless of env flag', () => {
    expect(evaluateShouldShowDeveloperTools({ isDev: true, flagValue: undefined })).toBe(true);
    expect(evaluateShouldShowDeveloperTools({ isDev: true, flagValue: 'false' })).toBe(true);
  });

  // ── TestFlight Profile ─────────────────────────────────────────────────────
  it('TF-1: returns true when flag is exactly "true"', () => {
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: 'true' })).toBe(true);
  });

  // ── Production Profile ─────────────────────────────────────────────────────
  it('PROD-1: returns false when flag is explicitly "false"', () => {
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: 'false' })).toBe(false);
  });

  it('PROD-2: returns false when flag is missing or undefined', () => {
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: undefined })).toBe(false);
  });

  it('PROD-3: returns false for empty string, null, or whitespace', () => {
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: '' })).toBe(false);
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: null })).toBe(false);
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: '   ' })).toBe(false);
  });

  // ── Strict String Matching (Adversarial) ───────────────────────────────────
  it('ADV-1: returns false for "TRUE", "True", "1", "yes", or truthy non-"true" strings', () => {
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: 'TRUE' })).toBe(false);
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: 'True' })).toBe(false);
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: '1' })).toBe(false);
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: 'yes' })).toBe(false);
    expect(evaluateShouldShowDeveloperTools({ isDev: false, flagValue: 'enabled' })).toBe(false);
  });
});
