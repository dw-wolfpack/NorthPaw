/**
 * NorthPaw Canonical Shared Temperature Band Thresholds
 * Version: 1.0.0
 */

export type RoadTempBand = 'safe' | 'warm' | 'hot' | 'danger';
export type SafetySemanticBand = RoadTempBand | 'unavailable';
export type TempUnit = 'F' | 'C';

export const THRESHOLD_BOUNDARIES = {
  SAFE_MAX: 77.0,     // < 77.0°F: Safe (Green)
  WARM_MAX: 100.0,    // 77.0°F – 99.9°F: Warm (Amber)
  HOT_MAX: 125.0,     // 100.0°F – 124.9°F: Hot (Ember)
  DANGER_MIN: 125.0,  // >= 125.0°F: Danger (Crimson - Clinical paw burn risk)
};

/**
 * Canonical Single Source of Truth for NorthPaw Safety Semantic Colors.
 * Mirrored 1-to-1 in Swift targets/NorthPawWidget/index.swift.
 */
export const SEMANTIC_SAFETY_COLORS = {
  safe: {
    hex: '#2D6A4F',
    rgb: { r: 45, g: 106, b: 79 },
    name: 'Safe',
    title: 'Paws Favorable',
  },
  warm: {
    hex: '#D4AF37',
    rgb: { r: 212, g: 175, b: 55 },
    name: 'Warm',
    title: 'Warm Surface',
  },
  hot: {
    hex: '#E67E22',
    rgb: { r: 230, g: 126, b: 34 },
    name: 'Hot',
    title: 'Scorching Pavement',
  },
  danger: {
    hex: '#C0392B',
    rgb: { r: 192, g: 57, b: 43 },
    name: 'Danger',
    title: 'Severe Paw Burn Risk',
  },
  unavailable: {
    hex: '#555555',
    rgb: { r: 85, g: 85, b: 85 },
    name: 'Unavailable',
    title: 'Data Unavailable',
  },
  active_outing: {
    hex: '#2980B9',
    rgb: { r: 41, g: 128, b: 185 },
    name: 'Active Outing',
    title: 'Exploring Now',
  },
} as const;

/**
 * Returns the canonical safety band for a given surface temperature (°F).
 * Defensively returns 'unavailable' for null, undefined, or non-finite inputs.
 */
export function roadBandForTemp(tempF?: number | null): SafetySemanticBand {
  if (tempF == null || !Number.isFinite(tempF)) return 'unavailable';
  if (tempF < THRESHOLD_BOUNDARIES.SAFE_MAX) return 'safe';
  if (tempF < THRESHOLD_BOUNDARIES.WARM_MAX) return 'warm';
  if (tempF < THRESHOLD_BOUNDARIES.HOT_MAX) return 'hot';
  return 'danger';
}

/**
 * Returns the canonical hex color for any safety band or null/undefined state.
 */
export function getSemanticSafetyColor(band?: SafetySemanticBand | null): string {
  if (band && band in SEMANTIC_SAFETY_COLORS) {
    return SEMANTIC_SAFETY_COLORS[band].hex;
  }
  return SEMANTIC_SAFETY_COLORS.unavailable.hex;
}

/**
 * Converts Fahrenheit temperature to Celsius.
 */
export function toCelsius(tempF: number): number {
  return Math.round(((tempF - 32) * 5 / 9) * 10) / 10;
}

/**
 * Formats temperature integer/decimal with preferred unit symbol (°F or °C).
 */
export function formatTemp(tempF: number, unit: TempUnit = 'F'): string {
  if (!Number.isFinite(tempF)) return '--°';
  if (unit === 'C') {
    return `${Math.round(toCelsius(tempF))}°C`;
  }
  return `${Math.round(tempF)}°F`;
}

/**
 * User-facing display labels for temperature bands derived from canonical tokens.
 */
export const BAND_LABELS: Record<RoadTempBand, { name: string; title: string; color: string }> = {
  safe: { name: SEMANTIC_SAFETY_COLORS.safe.name, title: SEMANTIC_SAFETY_COLORS.safe.title, color: SEMANTIC_SAFETY_COLORS.safe.hex },
  warm: { name: SEMANTIC_SAFETY_COLORS.warm.name, title: SEMANTIC_SAFETY_COLORS.warm.title, color: SEMANTIC_SAFETY_COLORS.warm.hex },
  hot: { name: SEMANTIC_SAFETY_COLORS.hot.name, title: SEMANTIC_SAFETY_COLORS.hot.title, color: SEMANTIC_SAFETY_COLORS.hot.hex },
  danger: { name: SEMANTIC_SAFETY_COLORS.danger.name, title: SEMANTIC_SAFETY_COLORS.danger.title, color: SEMANTIC_SAFETY_COLORS.danger.hex },
};
