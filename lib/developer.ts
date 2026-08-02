/**
 * Centralized Single Source of Truth for Developer Tools & Debug Features.
 *
 * Strict Rule: Only exact === 'true' String comparison enabled the feature.
 * Missing, undefined, null, empty string, "TRUE", "True", "1", or "yes" return false.
 */

export function shouldShowDeveloperTools(): boolean {
  if (__DEV__) {
    return true;
  }

  return process.env.EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS === 'true';
}
