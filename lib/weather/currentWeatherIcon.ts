import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  type WeatherConditionKind,
  weatherConditionKind,
} from '@/lib/weather/weatherConditionKind';

const KIND_TO_ICON: Record<
  WeatherConditionKind,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  snow: 'weather-snowy',
  storm: 'weather-lightning',
  rain: 'weather-pouring',
  fog: 'weather-fog',
  wind: 'weather-windy',
  clear_day: 'weather-sunny',
  clear_night: 'weather-night',
  partly_cloudy_day: 'weather-partly-cloudy',
  partly_cloudy_night: 'weather-night-partly-cloudy',
  cloudy: 'weather-cloudy',
  default_day: 'weather-partly-cloudy',
  default_night: 'weather-night-partly-cloudy',
};

/**
 * Picks a MaterialCommunityIcons glyph for current conditions (summary + short forecast + day/night).
 */
export function currentWeatherIconName(weather: {
  summary: string;
  forecastShort: string;
  isDaytime: boolean;
}): keyof typeof MaterialCommunityIcons.glyphMap {
  return KIND_TO_ICON[weatherConditionKind(weather)];
}
