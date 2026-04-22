import type { HomeWeatherState, TimelineSlot } from '@/lib/weather/nwsWeather';

export type TimelineTone = 'good' | 'warn' | 'neutral';

export type TimelineItem = {
  rangeLabel: string;
  title: string;
  detail: string;
  tone: TimelineTone;
};

type ReadinessLite = { signal: string; meaning: string };

/**
 * Human-readable time range from NWS grid period bounds.
 * Uses device-local time. Grid `/forecast` is period-based (often ~12h), not the `/forecast/hourly` stream.
 */
export function formatSlotRangeLabel(slot: TimelineSlot, index: number, now: Date): string {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return index === 0 ? 'Now' : index === 1 ? 'This afternoon' : 'Evening';
  }

  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: d.getMinutes() ? '2-digit' : undefined,
    });
  const endStr = fmt(end);

  if (index === 0) {
    if (now >= start && now <= end) return `Now – ${endStr}`;
    return `${fmt(start)} – ${endStr}`;
  }

  return `${fmt(start)} – ${endStr}`;
}

/**
 * Three-part day narrative for Home (uses NWS grid period times when available).
 */
export function buildHomeTimeline(
  weather: Extract<HomeWeatherState, { status: 'ok' }>,
  readiness: ReadinessLite
): TimelineItem[] {
  const blob = `${weather.forecastShort}\n${weather.summary}`.toLowerCase();
  const precip = weather.precipChance ?? 0;
  const looksWet = precip >= 38 || /rain|shower|storm|drizzle|snow|slush|ice/i.test(blob);
  const hot = weather.tempF >= 86 || (weather.tempF >= 80 && /sunny|clear|hot/i.test(blob));
  const nowDate = new Date();
  const slots = weather.timelineSlots;

  const now: TimelineItem = {
    rangeLabel: slots[0] ? formatSlotRangeLabel(slots[0], 0, nowDate) : 'Now',
    title: hot ? 'Warm — prioritize shade and water' : 'Best window for outdoor time',
    detail:
      hot || looksWet
        ? 'Comfort and visibility are workable; plan around heat or moisture.'
        : 'Comfortable conditions, good visibility for a normal outing.',
    tone: 'good',
  };

  const mid: TimelineItem = looksWet
    ? {
        rangeLabel: slots[1] ? formatSlotRangeLabel(slots[1], 1, nowDate) : 'This afternoon',
        title: 'Light rain arriving',
        detail: 'If heading out, bring rain gear or choose shorter routes.',
        tone: 'warn',
      }
    : hot
      ? {
          rangeLabel: slots[1] ? formatSlotRangeLabel(slots[1], 1, nowDate) : 'This afternoon',
          title: 'Peak heat risk',
          detail: 'Bias toward shade, water, and shorter exposed segments.',
          tone: 'warn',
        }
      : {
          rangeLabel: slots[1] ? formatSlotRangeLabel(slots[1], 1, nowDate) : 'This afternoon',
          title: 'Conditions mostly hold',
          detail: readiness.meaning,
          tone: 'neutral',
        };

  const eve: TimelineItem = {
    rangeLabel: slots[2] ? formatSlotRangeLabel(slots[2], 2, nowDate) : 'Evening',
    title: looksWet ? 'Rain clears' : 'Wind down',
    detail: looksWet
      ? 'Back to normal by sunset — still check radar before you go.'
      : 'Light prep for tomorrow; conditions usually easier to read by night.',
    tone: 'neutral',
  };

  return [now, mid, eve];
}

export type HomeTimelineSummaryRow = {
  /** Section label shown on Home (compact interpretation). */
  sectionLabel: string;
  rangeLabel: string;
  /** One short planning line (not a second hero). */
  body: string;
  tone: TimelineTone;
};

/**
 * Two-row “interpretation” for Home: best window + next change (drops the third slot).
 * Reuses `buildHomeTimeline` logic and data without changing the full timeline API.
 */
export function buildHomeTimelineSummary(
  weather: Extract<HomeWeatherState, { status: 'ok' }>,
  readiness: ReadinessLite
): HomeTimelineSummaryRow[] {
  const items = buildHomeTimeline(weather, readiness);
  const first = items[0];
  const second = items[1];
  if (!first || !second) return [];

  const body0 = `${first.title} — ${first.detail}`.replace(/\s+—\s+—/g, ' — ');
  const body1 = `${second.title} — ${second.detail}`.replace(/\s+—\s+—/g, ' — ');

  return [
    { sectionLabel: 'Best window', rangeLabel: first.rangeLabel, body: body0, tone: first.tone },
    { sectionLabel: 'Next change', rangeLabel: second.rangeLabel, body: body1, tone: second.tone },
  ];
}

