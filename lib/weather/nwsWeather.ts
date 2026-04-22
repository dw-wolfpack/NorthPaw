import * as Location from 'expo-location';

import {
  buildSyntheticTimelineSlots,
  buildTimelineSlotsFromHourly,
  parseNwsHourlyPeriods,
} from './timelineSlots';
import type { TimelineSlot } from './timelineSlots';

export type { TimelineSlot } from './timelineSlots';

const NWS_ORIGIN = 'https://api.weather.gov';
/** Required by NWS (identify the client). https://www.weather.gov/documentation/services-web-api */
const USER_AGENT = 'NorthPaw/1.0 (com.northpaw.app)';

const CACHE_MS = 12 * 60 * 1000;
const US_ONLY_MESSAGE = 'Weather is only available for US locations.';

/** One daytime weekend day from the NWS grid forecast (Sat/Sun). */
export type WeekendDayForecast = {
  dayLabel: string;
  tempF: number;
  shortForecast: string;
  precipChance: number | null;
};

export type HomeWeatherState =
  | { status: 'loading' }
  | { status: 'permission_denied' }
  | { status: 'unavailable'; message: string }
  | {
      status: 'ok';
      latitude: number;
      longitude: number;
      place: string;
      tempF: number;
      summary: string;
      windLine: string | null;
      updatedLabel: string;
      sourceNote: string;
      /** Grid forecast period (for suggestions); `summary` may come from live obs text. */
      forecastShort: string;
      precipChance: number | null;
      isDaytime: boolean;
      /** Up to two upcoming Sat/Sun daytime snapshots from the same forecast. */
      weekendOutlook: WeekendDayForecast[];
      /**
       * Three consecutive non-overlapping windows for the Home timeline.
       * Prefer **hourly** data grouped into ~3–4h blocks; otherwise synthetic 3h steps from now.
       */
      timelineSlots: TimelineSlot[];
      /** True when `forecastHourly` was fetched and parsed successfully. */
      hourlyForecastAvailable: boolean;
      /** Hourly condition points used by timeline bars on Home. */
      hourlySamples: Array<{
        timeIso: string;
        airTempF: number;
        windSpeedMph: number;
        isDaytime: boolean;
        skyCover: number | null;
      }>;
      /** Zero-cost approximate sunset tracking */
      sunsetTimeIso: string | null;
      mockAqi: number;
      mockRecentRain: boolean;
    };

type NwsJson = Record<string, unknown>;

let cache: {
  at: number;
  result: Exclude<HomeWeatherState, { status: 'loading' }>;
} | null = null;

function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

function formatUpdated(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function parseWindSpeedMph(windSpeed: string | undefined): number {
  if (!windSpeed) return 0;
  const matches = windSpeed.match(/-?\d+(\.\d+)?/g);
  if (!matches || matches.length === 0) return 0;
  const nums = matches.map((s) => Number(s)).filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  return Math.max(...nums);
}

function parseDurationHours(validTime: string): number {
  const slashIdx = validTime.indexOf('/');
  if (slashIdx < 0) return 1;
  const duration = validTime.slice(slashIdx + 1);
  const m = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!m) return 1;
  const h = m[1] ? Number(m[1]) : 0;
  const mins = m[2] ? Number(m[2]) : 0;
  const total = h + mins / 60;
  return total > 0 ? total : 1;
}

function utcHourKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

function fallbackSkyCoverFromText(shortForecast: string, isDaytime: boolean): number {
  const txt = shortForecast.toLowerCase();
  if (/overcast|cloudy|mostly cloud/i.test(txt)) return 85;
  if (/partly|some clouds|scattered cloud/i.test(txt)) return 45;
  if (/rain|storm|drizzle|snow|fog|mist/i.test(txt)) return 75;
  if (/clear|sunny/i.test(txt)) return isDaytime ? 10 : 35;
  return isDaytime ? 30 : 45;
}

function parseSkyCoverByHour(gridData: unknown): Map<string, number> {
  const root = gridData as {
    properties?: {
      skyCover?: {
        values?: Array<{ validTime?: string; value?: number | null }>;
      };
    };
  };
  const values = root.properties?.skyCover?.values;
  const out = new Map<string, number>();
  if (!Array.isArray(values)) return out;

  for (const v of values) {
    if (!v?.validTime || v.value == null || typeof v.value !== 'number') continue;
    const slashIdx = v.validTime.indexOf('/');
    const startIso = slashIdx >= 0 ? v.validTime.slice(0, slashIdx) : v.validTime;
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) continue;
    const durationHours = parseDurationHours(v.validTime);
    const steps = Math.max(1, Math.round(durationHours));
    for (let i = 0; i < steps; i++) {
      const t = new Date(start.getTime() + i * 60 * 60 * 1000);
      t.setUTCMinutes(0, 0, 0);
      out.set(t.toISOString(), Math.max(0, Math.min(100, Math.round(v.value))));
    }
  }

  return out;
}

type NwsForecastPeriod = {
  name?: string;
  startTime?: string;
  /** ISO end time — used for timeline range labels. */
  endTime?: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  probabilityOfPrecipitation?: { unitCode?: string; value?: number | null };
  isDaytime?: boolean;
};

/** Earliest daytime period per Sat/Sun calendar day; next two days chronologically. */
function extractWeekendOutlook(periods: NwsForecastPeriod[]): WeekendDayForecast[] {
  if (!periods.length) return [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const byDayKey = new Map<
    string,
    { sortKey: number; day: Date; period: NwsForecastPeriod }
  >();

  for (const p of periods) {
    if (!p.startTime) continue;
    if (p.isDaytime === false) continue;
    const d = new Date(p.startTime);
    if (Number.isNaN(d.getTime())) continue;
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) continue;

    const cal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (cal.getTime() < startOfToday.getTime()) continue;

    const key = `${cal.getFullYear()}-${cal.getMonth() + 1}-${cal.getDate()}`;
    const sortKey = d.getTime();
    const prev = byDayKey.get(key);
    if (!prev || sortKey < prev.sortKey) {
      byDayKey.set(key, { sortKey, day: cal, period: p });
    }
  }

  const sortedDays = [...byDayKey.values()].sort((a, b) => a.day.getTime() - b.day.getTime());
  return sortedDays.slice(0, 2).map(({ day, period }) => {
    let tempF = Math.round(period.temperature);
    if (period.temperatureUnit !== 'F') {
      tempF = cToF(period.temperature);
    }
    const precipChance =
      period.probabilityOfPrecipitation?.value != null &&
      typeof period.probabilityOfPrecipitation.value === 'number'
        ? period.probabilityOfPrecipitation.value
        : null;
    const dayLabel = day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    return { dayLabel, tempF, shortForecast: period.shortForecast, precipChance };
  });
}

function getApproximateSunset(lat: number, lon: number, date: Date): string {
  // Zero-cost approximation of local sunset. 
  // TODO: AI AGENT - For production, use a library like `suncalc` for exact solar equations.
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const seasonOffsetHours = Math.sin((dayOfYear - 80) / 365.25 * Math.PI * 2) * (lat / 20); // ~2 hours shift at 40 lat
  const sunsetLocalHour = 18 + seasonOffsetHours;

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setHours(Math.floor(sunsetLocalHour), (sunsetLocalHour % 1) * 60, 0, 0);
  return d.toISOString();
}

async function nwsFetchJson(url: string): Promise<NwsJson> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/geo+json, application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (res.status === 404) {
    const err = new Error('nws_not_found');
    throw err;
  }
  if (!res.ok) {
    throw new Error(`nws_http_${res.status}`);
  }
  return (await res.json()) as NwsJson;
}

function setCache(result: Exclude<HomeWeatherState, { status: 'loading' }>) {
  if (result.status === 'ok' || (result.status === 'unavailable' && result.message === US_ONLY_MESSAGE)) {
    cache = { at: Date.now(), result };
  }
}

/**
 * US-only: National Weather Service api.weather.gov (no API key).
 * Caches a successful response briefly to respect NWS usage and save battery.
 */
export async function fetchUsWeatherForDeviceLocation(): Promise<
  Exclude<HomeWeatherState, { status: 'loading' }>
> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) {
    return cache.result;
  }

  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    return { status: 'permission_denied' };
  }

  let pos: Location.LocationObject | null = null;
  try {
    pos = await Location.getLastKnownPositionAsync({
      maxAge: 10 * 60 * 1000,
    });
  } catch {
    pos = null;
  }
  if (!pos) {
    try {
      pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
    } catch {
      return { status: 'unavailable', message: 'Could not read your location.' };
    }
  }

  return fetchUsWeatherAtCoordinates(pos.coords.latitude, pos.coords.longitude);
}

type LatestObs = {
  tempF?: number;
  summary?: string;
  windLine: string | null;
  updatedIso?: string;
};

async function fetchLatestObservationFromStations(stationsUrl: string | undefined): Promise<LatestObs | null> {
  if (!stationsUrl) return null;
  try {
    const stationsData = (await nwsFetchJson(stationsUrl)) as {
      features?: Array<{ id?: string }>;
    };
    const stationUrl = stationsData.features?.[0]?.id;
    if (!stationUrl) return null;
    const latest = (await nwsFetchJson(`${stationUrl}/observations/latest`)) as {
      properties?: {
        timestamp?: string;
        textDescription?: string;
        temperature?: { value?: number | null };
        windSpeed?: { value?: number | null };
        windDirection?: { value?: number | null };
      };
    };
    const op = latest.properties;
    if (!op) return null;
    let tempF: number | undefined;
    if (op.temperature?.value != null && typeof op.temperature.value === 'number') {
      tempF = cToF(op.temperature.value);
    }
    const summary = op.textDescription?.trim() || undefined;
    let windLine: string | null = null;
    const wSpeed = op.windSpeed?.value;
    const wDir = op.windDirection?.value;
    if (wSpeed != null && typeof wSpeed === 'number') {
      const mph = kmhToMph(wSpeed);
      const dir = wDir != null && typeof wDir === 'number' ? `${wDir}° ` : '';
      windLine = `${dir}${mph} mph`.trim();
    }
    return {
      tempF,
      summary,
      windLine: windLine && windLine.length > 0 ? windLine : null,
      updatedIso: op.timestamp,
    };
  } catch {
    return null;
  }
}

async function fetchUsWeatherAtCoordinates(
  latitude: number,
  longitude: number
): Promise<Exclude<HomeWeatherState, { status: 'loading' }>> {
  const latStr = latitude.toFixed(4);
  const lonStr = longitude.toFixed(4);

  let pointData: NwsJson;
  try {
    pointData = await nwsFetchJson(`${NWS_ORIGIN}/points/${latStr},${lonStr}`);
  } catch (e) {
    if (e instanceof Error && e.message === 'nws_not_found') {
      const r: HomeWeatherState = { status: 'unavailable', message: US_ONLY_MESSAGE };
      setCache(r);
      return r;
    }
    return { status: 'unavailable', message: 'Weather service unavailable. Try again later.' };
  }

  const props = pointData.properties as NwsJson | undefined;
  if (!props) {
    return { status: 'unavailable', message: 'Unexpected weather response.' };
  }

  const forecastUrl = props.forecast as string | undefined;
  const forecastHourlyUrl = props.forecastHourly as string | undefined;
  const forecastGridDataUrl = props.forecastGridData as string | undefined;
  const stationsUrl = props.observationStations as string | undefined;
  const rel = props.relativeLocation as { properties?: { city?: string; state?: string } } | undefined;
  const city = rel?.properties?.city;
  const state = rel?.properties?.state;
  const place = [city, state].filter(Boolean).join(', ') || 'Your area';

  if (!forecastUrl) {
    return { status: 'unavailable', message: 'Forecast unavailable for this point.' };
  }

  type Period = NwsForecastPeriod & {
    windSpeed: string;
    windDirection: string;
  };

  let forecastJson: { properties?: { periods?: Period[]; updateTime?: string } };
  let obs: LatestObs | null = null;
  let hourlyForecastAvailable = false;
  let timelineSlotsResolved: TimelineSlot[] = buildSyntheticTimelineSlots();
  let hourlySamplesResolved: Array<{
    timeIso: string;
    airTempF: number;
    windSpeedMph: number;
    isDaytime: boolean;
    skyCover: number | null;
  }> = [];
  try {
    const [fj, obsResult, hourlyPack, gridPack] = await Promise.all([
      nwsFetchJson(forecastUrl) as Promise<{ properties?: { periods?: Period[]; updateTime?: string } }>,
      fetchLatestObservationFromStations(stationsUrl),
      forecastHourlyUrl
        ? nwsFetchJson(forecastHourlyUrl).then(
            (data) => ({ ok: true as const, data }),
            () => ({ ok: false as const, data: null as unknown })
          )
        : Promise.resolve({ ok: false as const, data: null as unknown }),
      forecastGridDataUrl
        ? nwsFetchJson(forecastGridDataUrl).then(
            (data) => ({ ok: true as const, data }),
            () => ({ ok: false as const, data: null as unknown })
          )
        : Promise.resolve({ ok: false as const, data: null as unknown }),
    ]);
    forecastJson = fj;
    obs = obsResult;
    const hourlyPeriods = hourlyPack.ok ? parseNwsHourlyPeriods(hourlyPack.data) : [];
    const skyCoverByHour = gridPack.ok ? parseSkyCoverByHour(gridPack.data) : new Map<string, number>();
    hourlyForecastAvailable = hourlyPack.ok && hourlyPeriods.length > 0;
    timelineSlotsResolved =
      hourlyPeriods.length >= 3
        ? buildTimelineSlotsFromHourly(hourlyPeriods)
        : buildSyntheticTimelineSlots();
    if (hourlyPack.ok) {
      const rawPeriods = (hourlyPack.data as { properties?: { periods?: unknown[] } })?.properties?.periods;
      if (Array.isArray(rawPeriods)) {
        hourlySamplesResolved = rawPeriods
          .map((r) => {
            const p = r as {
              startTime?: string;
              temperature?: number;
              temperatureUnit?: string;
              windSpeed?: string;
              isDaytime?: boolean;
              shortForecast?: string;
            };
            if (!p.startTime || typeof p.temperature !== 'number') return null;
            const key = utcHourKey(p.startTime);
            let airTempF = Math.round(p.temperature);
            if (p.temperatureUnit !== 'F') {
              airTempF = cToF(p.temperature);
            }
            const inferredDaytime =
              typeof p.isDaytime === 'boolean'
                ? p.isDaytime
                : !/night|overnight|evening/i.test((p.shortForecast || '').toLowerCase());
            const gridSkyCover = key && skyCoverByHour.has(key) ? skyCoverByHour.get(key) ?? null : null;
            const skyCover =
              gridSkyCover != null
                ? gridSkyCover
                : fallbackSkyCoverFromText(p.shortForecast || '', inferredDaytime);
            return {
              timeIso: p.startTime,
              airTempF,
              windSpeedMph: parseWindSpeedMph(p.windSpeed),
              isDaytime: inferredDaytime,
              skyCover,
            };
          })
          .filter((v): v is NonNullable<typeof v> => !!v)
          .slice(0, 36);
      }
    }
  } catch {
    return { status: 'unavailable', message: 'Could not load forecast.' };
  }

  const p0 = forecastJson.properties?.periods?.[0];
  if (!p0) {
    return { status: 'unavailable', message: 'No forecast for this area.' };
  }

  let tempF = Math.round(p0.temperature);
  if (p0.temperatureUnit !== 'F') {
    tempF = cToF(p0.temperature);
  }
  const forecastShort = p0.shortForecast;
  const precipChance =
    p0.probabilityOfPrecipitation?.value != null && typeof p0.probabilityOfPrecipitation.value === 'number'
      ? p0.probabilityOfPrecipitation.value
      : null;
  const isDaytime = p0.isDaytime !== false;

  let summary = forecastShort;
  let windLine = `${p0.windDirection} ${p0.windSpeed}`.trim();
  let updatedIso = forecastJson.properties?.updateTime ?? '';

  if (obs) {
    if (obs.tempF != null) tempF = obs.tempF;
    if (obs.summary) summary = obs.summary;
    if (obs.windLine) windLine = obs.windLine;
    if (obs.updatedIso) updatedIso = obs.updatedIso;
  }

  const allPeriods = (forecastJson.properties?.periods ?? []) as NwsForecastPeriod[];
  const weekendOutlook = extractWeekendOutlook(allPeriods);

  const ok: HomeWeatherState = {
    status: 'ok',
    latitude,
    longitude,
    place,
    tempF,
    summary,
    windLine: windLine.length > 0 ? windLine : null,
    updatedLabel: formatUpdated(updatedIso),
    sourceNote: 'National Weather Service · api.weather.gov',
    forecastShort,
    precipChance,
    isDaytime,
    weekendOutlook,
    timelineSlots: timelineSlotsResolved,
    hourlyForecastAvailable,
    hourlySamples: hourlySamplesResolved,
    sunsetTimeIso: getApproximateSunset(latitude, longitude, new Date()),
    mockAqi: 45, // TODO: AI AGENT - Replace with real AQI API
    mockRecentRain: false, // TODO: AI AGENT - Replace with real historical precipitation
  };
  setCache(ok);
  return ok;
}
