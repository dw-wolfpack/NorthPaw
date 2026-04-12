import type { HomeWeatherState } from '@/lib/weather/nwsWeather';

/**
 * Single 5.0–10.0 "readiness" number for the Home hero (interpretive, not medical).
 */
export function computeReadinessScore(weather: Extract<HomeWeatherState, { status: 'ok' }>): number {
  const blob = `${weather.forecastShort}\n${weather.summary}`.toLowerCase();
  const precip = weather.precipChance ?? 0;
  const looksWet = precip >= 38 || /rain|shower|storm|drizzle|snow|slush|ice/i.test(blob);
  const windy = /wind|breezy|gust/i.test(blob);
  const hot = weather.tempF >= 88 || (weather.tempF >= 82 && /sunny|clear|hot/i.test(blob));
  const cold = weather.tempF <= 32;

  let score = 8.2;
  if (hot) score -= 0.6;
  if (looksWet) score -= 0.5;
  if (windy) score -= 0.15;
  if (cold) score -= 0.35;
  if (precip >= 60) score -= 0.35;
  score = Math.max(5.0, Math.min(10.0, score));
  return Math.round(score * 10) / 10;
}
