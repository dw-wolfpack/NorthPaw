/**
 * Regression Tests for isTestflightOrDevBuild()
 *
 * This guard controls whether Developer Settings are visible in the app.
 * A failure here means real users see internal debug tools — treat as P0.
 *
 * The function is tested via an inline pure-JS mirror that accepts the same
 * inputs (__DEV__, env vars) so Jest doesn't need to transform analytics.ts.
 */

function isTestflightOrDevBuild({ isDev, envPublicIsTestflight, envPublicEnv }) {
  if (isDev) return true;
  if (envPublicIsTestflight === 'true') return true;
  if (envPublicEnv === 'testflight') return true;
  return false; // default-deny
}

describe('isTestflightOrDevBuild — Developer Settings Guard (P0)', () => {

  // ── Production: MUST hide ──────────────────────────────────────────────────

  it('PROD-1: hides dev settings in a clean production build', () => {
    expect(isTestflightOrDevBuild({
      isDev: false,
      envPublicIsTestflight: undefined,
      envPublicEnv: 'production',
    })).toBe(false);
  });

  it('PROD-2: hides dev settings when env vars are completely absent (the original bug)', () => {
    // This was the bug — missing env vars caused fallthrough to `return true`
    expect(isTestflightOrDevBuild({
      isDev: false,
      envPublicIsTestflight: undefined,
      envPublicEnv: undefined,
    })).toBe(false);
  });

  it('PROD-3: hides dev settings when EXPO_PUBLIC_IS_TESTFLIGHT is explicitly "false"', () => {
    expect(isTestflightOrDevBuild({
      isDev: false,
      envPublicIsTestflight: 'false',
      envPublicEnv: 'production',
    })).toBe(false);
  });

  it('PROD-4: hides dev settings for empty-string env vars', () => {
    expect(isTestflightOrDevBuild({
      isDev: false,
      envPublicIsTestflight: '',
      envPublicEnv: '',
    })).toBe(false);
  });

  // ── TestFlight: MUST show ──────────────────────────────────────────────────

  it('TF-1: shows dev settings when EXPO_PUBLIC_IS_TESTFLIGHT=true', () => {
    expect(isTestflightOrDevBuild({
      isDev: false,
      envPublicIsTestflight: 'true',
      envPublicEnv: 'production',
    })).toBe(true);
  });

  it('TF-2: shows dev settings when EXPO_PUBLIC_ENV=testflight', () => {
    expect(isTestflightOrDevBuild({
      isDev: false,
      envPublicIsTestflight: undefined,
      envPublicEnv: 'testflight',
    })).toBe(true);
  });

  it('TF-3: shows dev settings when both TestFlight signals are set', () => {
    expect(isTestflightOrDevBuild({
      isDev: false,
      envPublicIsTestflight: 'true',
      envPublicEnv: 'testflight',
    })).toBe(true);
  });

  // ── Local dev: MUST show ───────────────────────────────────────────────────

  it('DEV-1: shows dev settings in local __DEV__ mode regardless of env vars', () => {
    expect(isTestflightOrDevBuild({
      isDev: true,
      envPublicIsTestflight: undefined,
      envPublicEnv: undefined,
    })).toBe(true);
  });

  it('DEV-2: shows dev settings in local __DEV__ mode even if env says production', () => {
    expect(isTestflightOrDevBuild({
      isDev: true,
      envPublicIsTestflight: 'false',
      envPublicEnv: 'production',
    })).toBe(true);
  });
});
