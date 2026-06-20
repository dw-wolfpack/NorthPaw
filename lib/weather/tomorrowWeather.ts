import { HomeWeatherState, WeekendDayForecast, HazardTag } from './nwsWeather';
import { TimelineSlot, buildTimelineSlotsFromHourly } from './timelineSlots';

const TOMORROW_ORIGIN = 'https://api.tomorrow.io/v4/weather';
const API_KEY = process.env.EXPO_PUBLIC_TOMORROW_IO_API_KEY;

const WEATHER_CODE_MAP: Record<number, string> = {
  1000: 'Clear, Sunny',
  1100: 'Mostly Clear',
  1101: 'Partly Cloudy',
  1102: 'Mostly Cloudy',
  1001: 'Cloudy',
  2000: 'Fog',
  2100: 'Light Fog',
  4000: 'Drizzle',
  4001: 'Rain',
  4200: 'Light Rain',
  4201: 'Heavy Rain',
  5000: 'Snow',
  5001: 'Flurries',
  5100: 'Light Snow',
  5101: 'Heavy Snow',
  6000: 'Freezing Drizzle',
  6001: 'Freezing Rain',
  6200: 'Light Freezing Rain',
  6201: 'Heavy Freezing Rain',
  7000: 'Ice Pellets',
  7101: 'Heavy Ice Pellets',
  7102: 'Light Ice Pellets',
  8000: 'Thunderstorm',
};

function mapWeatherCode(code: number): string {
  return WEATHER_CODE_MAP[code] || 'Unknown Conditions';
}

export async function fetchTomorrowWeatherAtCoordinates(
  latitude: number,
  longitude: number
): Promise<Exclude<HomeWeatherState, { status: 'loading' }>> {
  const startTime = Date.now();
  if (!API_KEY) {
    return { status: 'unavailable', message: 'Tomorrow.io API key is missing. Add it to your .env file.', isCacheHit: false, loadTimeMs: Date.now() - startTime };
  }

  const latStr = latitude.toFixed(4);
  const lonStr = longitude.toFixed(4);
  const url = `${TOMORROW_ORIGIN}/forecast?location=${latStr},${lonStr}&apikey=${API_KEY}&units=imperial&timesteps=1h`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        return { status: 'unavailable', message: 'Tomorrow.io rate limit reached.' };
      }
      return { status: 'unavailable', message: `Tomorrow.io error: ${response.status}` };
    }

    const data = await response.json();
    const timelines = data.timelines;
    const hourly = timelines?.hourly;
    if (!Array.isArray(hourly) || hourly.length === 0) {
      return { status: 'unavailable', message: 'No forecast available from Tomorrow.io.' };
    }

    // Tomorrow.io "realtime" is usually the first hourly or a separate call.
    // For simplicity and efficiency, we use the first hourly point as "current".
    const current = hourly[0];
    const vals = current.values;

    const hourlySamples = hourly.slice(0, 36).map((h: any) => ({
      timeIso: h.time,
      airTempF: Math.round(h.values.temperature),
      windSpeedMph: Math.round(h.values.windSpeed),
      isDaytime: h.values.cloudCover < 100, // TODO: Better daytime detection if needed
      skyCover: h.values.cloudCover,
      humidityPct: h.values.humidity,
      solarGhi: h.values.solarGHI,
    }));

    // We need to resolve sunset time (could use a library or simpler math)
    // For now, we'll use a placeholder or reuse NWS logic if possible.
    const sunsetTimeIso = null; 

    const weekendOutlook: WeekendDayForecast[] = []; // TODO: Extract weekend if needed

    const timelineSlotsResolved = buildTimelineSlotsFromHourly(
      hourlySamples.map((h) => ({
        startTime: h.timeIso,
        endTime: new Date(new Date(h.timeIso).getTime() + 60 * 60 * 1000).toISOString(),
        shortForecast: '',
        precipChance: null,
      }))
    );

    const ok: HomeWeatherState = {
      status: 'ok',
      latitude,
      longitude,
      place: 'Your Location', // Tomorrow.io doesn't return reverse geocode by default in this endpoint
      tempF: Math.round(vals.temperature),
      summary: mapWeatherCode(vals.weatherCode),
      windLine: `${Math.round(vals.windSpeed)} mph`,
      updatedLabel: new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      updatedIso: new Date().toISOString(),
      stationDistanceMiles: null,
      sourceNote: 'Tomorrow.io (Global Precision)',
      hazardTags: [],
      hazardAlerts: [],
      forecastShort: mapWeatherCode(vals.weatherCode),
      precipChance: vals.precipitationProbability,
      isDaytime: true, // TODO: Better daytime detection
      weekendOutlook,
      timelineSlots: timelineSlotsResolved,
      hourlyForecastAvailable: true,
      hourlySamples,
      sunsetTimeIso,
      mockAqi: 45,
      mockRecentRain: false,
    };

    return { ...ok, isCacheHit: false, loadTimeMs: Date.now() - startTime };
  } catch (e) {
    return { status: 'unavailable', message: 'Failed to connect to Tomorrow.io.', isCacheHit: false, loadTimeMs: Date.now() - startTime };
  }
}
