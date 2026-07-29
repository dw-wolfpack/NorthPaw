/**
 * NorthPaw Canonical Shared Temperature Band Thresholds
 * Version: 1.0.0
 */

export type RoadTempBand = 'safe' | 'warm' | 'hot' | 'danger';
export type TempUnit = 'F' | 'C';

export const THRESHOLD_BOUNDARIES = {
  SAFE_MAX: 77.0,     // < 77.0°F: Safe (Green)
  WARM_MAX: 100.0,    // 77.0°F – 99.9°F: Warm (Amber)
  HOT_MAX: 125.0,     // 100.0°F – 124.9°F: Hot (Ember)
  DANGER_MIN: 125.0,  // >= 125.0°F: Danger (Crimson - Clinical paw burn risk)
};

/**
 * Returns the canonical safety band for a given surface temperature (°F).
 */
export function roadBandForTemp(tempF: number): RoadTempBand {
  if (!Number.isFinite(tempF)) return 'safe';
  if (tempF < THRESHOLD_BOUNDARIES.SAFE_MAX) return 'safe';
  if (tempF < THRESHOLD_BOUNDARIES.WARM_MAX) return 'warm';
  if (tempF < THRESHOLD_BOUNDARIES.HOT_MAX) return 'hot';
  return 'danger';
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
 * User-facing display labels for temperature bands.
 */
export const BAND_LABELS: Record<RoadTempBand, { name: string; title: string; color: string }> = {
  safe: { name: 'Safe', title: 'Paws Favorable', color: '#4E9F6E' },
  warm: { name: 'Warm', title: 'Warm Surface', color: '#D4AF37' },
  hot: { name: 'Hot', title: 'Scorching Pavement', color: '#E67E22' },
  danger: { name: 'Danger', title: 'Severe Paw Burn Risk', color: '#C0392B' },
};
