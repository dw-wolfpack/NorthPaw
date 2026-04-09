import * as Location from 'expo-location';

const NWS_ORIGIN = 'https://api.weather.gov';
/** Required by NWS (identify the client). https://www.weather.gov/documentation/services-web-api */
const USER_AGENT = 'NorthPaw/1.0 (com.northpaw.app)';

const CACHE_MS = 12 * 60 * 1000;
const US_ONLY_MESSAGE = 'Weather is only available for US locations.';

export type HomeWeatherState =
  | { status: 'loading' }
  | { status: 'permission_denied' }
  | { status: 'unavailable'; message: string }
  | {
      status: 'ok';
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

  let pos: Location.LocationObject;
  try {
    pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch {
    return { status: 'unavailable', message: 'Could not read your location.' };
  }

  return fetchUsWeatherAtCoordinates(pos.coords.latitude, pos.coords.longitude);
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
  const stationsUrl = props.observationStations as string | undefined;
  const rel = props.relativeLocation as { properties?: { city?: string; state?: string } } | undefined;
  const city = rel?.properties?.city;
  const state = rel?.properties?.state;
  const place = [city, state].filter(Boolean).join(', ') || 'Your area';

  if (!forecastUrl) {
    return { status: 'unavailable', message: 'Forecast unavailable for this point.' };
  }

  type Period = {
    temperature: number;
    temperatureUnit: string;
    shortForecast: string;
    windSpeed: string;
    windDirection: string;
    isDaytime?: boolean;
    probabilityOfPrecipitation?: { unitCode?: string; value?: number | null };
  };

  let forecastJson: { properties?: { periods?: Period[]; updateTime?: string } };
  try {
    forecastJson = (await nwsFetchJson(forecastUrl)) as typeof forecastJson;
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

  if (stationsUrl) {
    try {
      const stationsData = (await nwsFetchJson(stationsUrl)) as {
        features?: Array<{ id?: string }>;
      };
      const stationUrl = stationsData.features?.[0]?.id;
      if (stationUrl) {
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
        if (op?.temperature?.value != null && typeof op.temperature.value === 'number') {
          tempF = cToF(op.temperature.value);
        }
        if (op?.textDescription) {
          summary = op.textDescription;
        }
        const wSpeed = op?.windSpeed?.value;
        const wDir = op?.windDirection?.value;
        if (wSpeed != null && typeof wSpeed === 'number') {
          const mph = kmhToMph(wSpeed);
          const dir = wDir != null && typeof wDir === 'number' ? `${wDir}° ` : '';
          windLine = `${dir}${mph} mph`.trim();
        }
        if (op?.timestamp) {
          updatedIso = op.timestamp;
        }
      }
    } catch {
      /* forecast-only is fine */
    }
  }

  const ok: HomeWeatherState = {
    status: 'ok',
    place,
    tempF,
    summary,
    windLine: windLine.length > 0 ? windLine : null,
    updatedLabel: formatUpdated(updatedIso),
    sourceNote: 'National Weather Service · api.weather.gov',
    forecastShort,
    precipChance,
    isDaytime,
  };
  setCache(ok);
  return ok;
}
