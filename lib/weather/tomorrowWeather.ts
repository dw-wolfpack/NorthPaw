import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { HomeWeatherState, WeekendDayForecast, HazardTag } from './nwsWeather';
import { TimelineSlot, buildTimelineSlotsFromHourly } from './timelineSlots';

const TOMORROW_ORIGIN = 'https://api.tomorrow.io/v4/weather';
const API_KEY = process.env.EXPO_PUBLIC_TOMORROW_IO_API_KEY;

const ALERT_COOLDOWN_KEY = '@northpaw/last_rate_limit_alert_timestamp';
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export async function notifyDeveloperSheetsOfRateLimit(providerName: string): Promise<void> {
  const sheetsUrl = process.env.EXPO_PUBLIC_BREED_REQUEST_SHEETS_URL;
  if (!sheetsUrl) return;

  try {
    const lastAlertTimeStr = await AsyncStorage.getItem(ALERT_COOLDOWN_KEY);
    const now = Date.now();
    if (lastAlertTimeStr) {
      const lastAlertTime = parseInt(lastAlertTimeStr, 10);
      if (now - lastAlertTime < TWELVE_HOURS_MS) {
        // Device-level cooldown: at most 1 alert per 12 hours per device
        return;
      }
    }

    await AsyncStorage.setItem(ALERT_COOLDOWN_KEY, now.toString());
    const appVersion = Constants?.expoConfig?.version || '1.0.0';

    await fetch(sheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'weather_api_alert_429',
        subject: '⚠️ Weather API Rate Limit / Availability Warning',
        notes: 'Rate limit or service bottleneck detected on device. Developer notified.',
        email: 'system_alert@northpawapp.com',
        appVersion,
        platform: Platform.OS,
      }),
    });
  } catch (e) {
    console.warn('[RateLimitAlert] Failed to send alert to Google Sheets:', e);
  }
}

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
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const startTimeIso = todayMidnight.toISOString();
  const url = `${TOMORROW_ORIGIN}/forecast?location=${latStr},${lonStr}&apikey=${API_KEY}&units=imperial&timesteps=1h&startTime=${startTimeIso}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        notifyDeveloperSheetsOfRateLimit('Tomorrow.io').catch(() => {});
        return {
          status: 'unavailable',
          message:
            'Weather data is temporarily unavailable. NorthPaw has notified the developer. Please try again later, or contact support@northpawapp.com if the issue continues.',
        };
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
