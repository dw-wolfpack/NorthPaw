import type { WeatherConditionKind } from '@/lib/weather/weatherConditionKind';

/** NorthPaw palette (aligned with constants/Colors.ts) — no blues/purples on overlays */
const forest = '#1B4332';
const moss = '#2D6A4F';
const ink = '#0D1B14';
const mintSoft = '#EEF7F3';
const mintMid = '#d8e2dc';
const sageMuted = '#8fa99a';

const FOREST_TEXT = ink;

/** On dark / moody overlays: avoid paper-white; muted mint-sage reads calmer. */
const onPhotoTemp = '#c9dad2';
const onPhotoSummary = 'rgba(184, 198, 190, 0.92)';
const onPhotoSummarySoft = 'rgba(184, 198, 190, 0.78)';
const onPhotoChevron = 'rgba(168, 184, 176, 0.65)';

export type WeatherCardStyle = {
  /** Top → bottom gradient for the weather summary card / photo overlay tint */
  gradientColors: [string, string];
  tempColor: string;
  summaryColor: string;
  chevronColor: string;
};

/**
 * Background + text colors for the Home weather card (theme: forest / mint / sage / cream).
 */
export function weatherCardStyle(
  kind: WeatherConditionKind,
  colorScheme: 'light' | 'dark'
): WeatherCardStyle {
  const isDark = colorScheme === 'dark';

  const table: Record<WeatherConditionKind, WeatherCardStyle> = {
    clear_day: {
      gradientColors: isDark ? ['#2d4a3a', forest] : ['#c8e6c9', '#81c784'],
      tempColor: isDark ? onPhotoTemp : FOREST_TEXT,
      summaryColor: isDark ? onPhotoSummary : 'rgba(13,27,20,0.85)',
      chevronColor: isDark ? onPhotoChevron : 'rgba(13,27,20,0.55)',
    },
    clear_night: {
      gradientColors: isDark ? ['#1a2820', '#0f1512'] : [moss, forest],
      tempColor: isDark ? onPhotoTemp : onPhotoTemp,
      summaryColor: isDark ? onPhotoSummary : onPhotoSummarySoft,
      chevronColor: isDark ? onPhotoChevron : onPhotoChevron,
    },
    partly_cloudy_day: {
      gradientColors: isDark ? ['#3d5a4a', '#2a4035'] : ['#cde8dc', '#95b8a8'],
      tempColor: isDark ? onPhotoTemp : FOREST_TEXT,
      summaryColor: isDark ? onPhotoSummary : 'rgba(13,27,20,0.82)',
      chevronColor: isDark ? onPhotoChevron : 'rgba(13,27,20,0.5)',
    },
    partly_cloudy_night: {
      gradientColors: isDark ? ['#243028', '#152018'] : ['#5a6b63', '#3d5249'],
      tempColor: isDark ? onPhotoTemp : onPhotoTemp,
      summaryColor: isDark ? onPhotoSummary : onPhotoSummarySoft,
      chevronColor: isDark ? onPhotoChevron : onPhotoChevron,
    },
    cloudy: {
      gradientColors: isDark ? ['#2e3d35', '#1f2a24'] : ['#dbe8e0', '#a3b5aa'],
      tempColor: isDark ? onPhotoTemp : FOREST_TEXT,
      summaryColor: isDark ? onPhotoSummary : 'rgba(13,27,20,0.88)',
      chevronColor: isDark ? onPhotoChevron : 'rgba(13,27,20,0.5)',
    },
    rain: {
      gradientColors: isDark ? ['#1e3328', '#122018'] : ['#b8d4c8', '#4a7a68'],
      tempColor: isDark ? onPhotoTemp : FOREST_TEXT,
      summaryColor: isDark ? onPhotoSummary : 'rgba(13,27,20,0.9)',
      chevronColor: isDark ? onPhotoChevron : 'rgba(13,27,20,0.55)',
    },
    snow: {
      gradientColors: isDark ? ['#2a3832', '#1c2822'] : ['#e8f2ec', '#a8c4b8'],
      tempColor: isDark ? onPhotoTemp : FOREST_TEXT,
      summaryColor: isDark ? onPhotoSummary : 'rgba(13,27,20,0.88)',
      chevronColor: isDark ? onPhotoChevron : 'rgba(13,27,20,0.55)',
    },
    storm: {
      gradientColors: isDark ? ['#1a2820', ink] : ['#355447', forest],
      tempColor: isDark ? onPhotoTemp : onPhotoTemp,
      summaryColor: isDark ? onPhotoSummary : onPhotoSummarySoft,
      chevronColor: isDark ? onPhotoChevron : onPhotoChevron,
    },
    fog: {
      gradientColors: isDark ? ['#2a3530', '#1e2822'] : [mintSoft, sageMuted],
      tempColor: isDark ? onPhotoTemp : FOREST_TEXT,
      summaryColor: isDark ? onPhotoSummary : 'rgba(13,27,20,0.88)',
      chevronColor: isDark ? onPhotoChevron : 'rgba(13,27,20,0.55)',
    },
    wind: {
      gradientColors: isDark ? ['#2d4a32', '#1b331f'] : ['#dcedc8', '#aed581'],
      tempColor: isDark ? onPhotoTemp : forest,
      summaryColor: isDark ? onPhotoSummary : 'rgba(27,67,50,0.88)',
      chevronColor: isDark ? onPhotoChevron : 'rgba(27,67,50,0.5)',
    },
    default_day: {
      gradientColors: isDark ? ['#2d4a3a', forest] : [mintMid, '#a5d6a7'],
      tempColor: isDark ? onPhotoTemp : FOREST_TEXT,
      summaryColor: isDark ? onPhotoSummary : 'rgba(13,27,20,0.85)',
      chevronColor: isDark ? onPhotoChevron : 'rgba(13,27,20,0.5)',
    },
    default_night: {
      gradientColors: isDark ? ['#1c2820', '#0f1812'] : [moss, '#3d5249'],
      tempColor: isDark ? onPhotoTemp : onPhotoTemp,
      summaryColor: isDark ? onPhotoSummary : onPhotoSummarySoft,
      chevronColor: isDark ? onPhotoChevron : onPhotoChevron,
    },
  };

  return table[kind];
}

/** `#RRGGBB` → `rgba(r,g,b,a)` for semi-transparent overlays on photos. */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6 || Number.isNaN(parseInt(h, 16))) {
    return `rgba(0,0,0,${alpha})`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Condition-colored gradient overlay on top of the weather photo (NorthPaw greens / mint).
 */
export function weatherCardImageOverlayColors(
  gradient: [string, string],
  colorScheme: 'light' | 'dark'
): [string, string] {
  const isDark = colorScheme === 'dark';
  const top = isDark ? 0.5 : 0.38;
  const bottom = isDark ? 0.64 : 0.52;
  return [hexToRgba(gradient[0], top), hexToRgba(gradient[1], bottom)];
}

/** Subtle scrim — neutral darkening only (tint comes from overlay above). */
export const WEATHER_CARD_SCRIM_COLORS: [string, string] = [
  'rgba(13, 27, 20, 0.06)',
  'rgba(13, 27, 20, 0.22)',
];
