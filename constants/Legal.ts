/**
 * App Store listing & legal URLs. Set in `.env` for production builds (preferred):
 * - EXPO_PUBLIC_NORTHPAW_PRIVACY_URL
 * - EXPO_PUBLIC_NORTHPAW_TERMS_URL
 * - EXPO_PUBLIC_NORTHPAW_SUPPORT_URL (https page or mailto:user@example.com)
 *
 * Legacy `EXPO_PUBLIC_TRAILREADY_*` keys still work for existing `.env` files.
 */

export const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_NORTHPAW_PRIVACY_URL ??
  process.env.EXPO_PUBLIC_TRAILREADY_PRIVACY_URL ??
  '';

export const TERMS_OF_USE_URL =
  process.env.EXPO_PUBLIC_NORTHPAW_TERMS_URL ??
  process.env.EXPO_PUBLIC_TRAILREADY_TERMS_URL ??
  '';

/** Support page or mailto link shown in Settings. */
export const SUPPORT_URL =
  process.env.EXPO_PUBLIC_NORTHPAW_SUPPORT_URL ??
  process.env.EXPO_PUBLIC_TRAILREADY_SUPPORT_URL ??
  '';

export const APPLE_MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
