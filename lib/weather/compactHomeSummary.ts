import type { HomeWeatherState } from '@/lib/weather/nwsWeather';

type OkWeather = Extract<HomeWeatherState, { status: 'ok' }>;

/**
 * Single-line conditions signal for Home (not a hero card).
 * Plain language, wedge-friendly; opens full detail in the weather modal.
 */
export function buildCompactConditionsSummaryLine(weather: OkWeather): string {
  const t = weather.tempF;
  const blob = `${weather.forecastShort}\n${weather.summary}`.toLowerCase();
  const precip = weather.precipChance ?? 0;
  const looksWet = precip >= 38 || /rain|shower|storm|drizzle|snow|slush|ice/i.test(blob);
  const hot = weather.tempF >= 86 || (weather.tempF >= 80 && /sunny|clear|hot/i.test(blob));

  let signal: string;
  if (hot) {
    signal = 'warm—plan shade and water';
  } else if (looksWet) {
    signal = 'workable now, wetter later';
  } else if (/wind|breezy|gust/i.test(blob)) {
    signal = 'breezy—watch footing and noise';
  } else if (weather.tempF <= 55 && !looksWet) {
    signal = 'cool and steady for a normal outing';
  } else {
    signal = 'good visibility for a normal outing';
  }

  return `Today: ${t}°, ${signal}`;
}
