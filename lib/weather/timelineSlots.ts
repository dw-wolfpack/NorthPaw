/** ISO bounds for one Home timeline row. */
export type TimelineSlot = {
  startTime: string;
  endTime: string;
};

/** Re-export for parsers — NWS hourly grid uses same period shape. */
export type HourlyPeriod = {
  startTime: string;
  endTime: string;
  shortForecast: string;
  precipChance: number | null;
};

/**
 * Parse NWS `/forecast/hourly` GeoJSON into ordered hourly periods.
 */
export function parseNwsHourlyPeriods(json: unknown): HourlyPeriod[] {
  const root = json as { properties?: { periods?: unknown[] } };
  const props = root.properties;
  const periods = props?.periods;
  if (!Array.isArray(periods)) return [];

  const out: HourlyPeriod[] = [];
  for (const raw of periods) {
    const p = raw as {
      startTime?: string;
      endTime?: string;
      shortForecast?: string;
      probabilityOfPrecipitation?: { value?: number | null };
    };
    if (!p.startTime || !p.endTime) continue;
    const precip = p.probabilityOfPrecipitation?.value;
    out.push({
      startTime: p.startTime,
      endTime: p.endTime,
      shortForecast: typeof p.shortForecast === 'string' ? p.shortForecast : '',
      precipChance: typeof precip === 'number' ? precip : null,
    });
  }
  return out;
}

/**
 * Build three consecutive windows from hourly periods (~3–4h each when enough data).
 * Windows use [start of first hour in block]–[end of last hour in block], so adjacent
 * blocks abut without overlap when NWS periods are contiguous.
 */
export function buildTimelineSlotsFromHourly(periods: HourlyPeriod[]): TimelineSlot[] {
  if (periods.length < 3) return [];

  const n = periods.length;
  /** ~3–4 hours per window; at least 1 hour per chunk; cap at 4. */
  const chunk = Math.max(1, Math.min(4, Math.floor(n / 3)));

  const raw: TimelineSlot[] = [];
  for (let w = 0; w < 3; w++) {
    const startIdx = w * chunk;
    const endIdx = startIdx + chunk - 1;
    if (endIdx >= periods.length) break;
    raw.push({
      startTime: periods[startIdx].startTime,
      endTime: periods[endIdx].endTime,
    });
  }

  return enforceNonOverlappingSlots(raw);
}

/**
 * Fallback when hourly is missing: three 3-hour blocks from now (guaranteed non-overlap).
 */
export function buildSyntheticTimelineSlots(): TimelineSlot[] {
  const t = Date.now();
  const h = 3 * 60 * 60 * 1000;
  return [
    { startTime: new Date(t).toISOString(), endTime: new Date(t + h).toISOString() },
    { startTime: new Date(t + h).toISOString(), endTime: new Date(t + 2 * h).toISOString() },
    { startTime: new Date(t + 2 * h).toISOString(), endTime: new Date(t + 3 * h).toISOString() },
  ];
}

/**
 * Ensures slot[i].start >= slot[i-1].end (contiguous or gap; no overlap).
 */
function enforceNonOverlappingSlots(slots: TimelineSlot[]): TimelineSlot[] {
  if (slots.length === 0) return [];

  const out: TimelineSlot[] = [];
  let prevEndMs = 0;

  for (let i = 0; i < slots.length; i++) {
    let startMs = new Date(slots[i].startTime).getTime();
    let endMs = new Date(slots[i].endTime).getTime();

    if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue;

    if (i > 0 && startMs < prevEndMs) {
      startMs = prevEndMs;
    }
    if (endMs <= startMs) {
      endMs = startMs + 60 * 60 * 1000;
    }

    out.push({
      startTime: new Date(startMs).toISOString(),
      endTime: new Date(endMs).toISOString(),
    });
    prevEndMs = endMs;
  }

  return out;
}
