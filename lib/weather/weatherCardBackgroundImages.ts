import type { ImageSourcePropType } from 'react-native';

import type { WeatherConditionKind } from '@/lib/weather/weatherConditionKind';

/**
 * Replace files under assets/images/weather-cards/ with Midjourney exports (see WEATHER_CARDS.md).
 * Filenames must match — Metro bundles static requires at build time.
 */
const MAP: Record<WeatherConditionKind, ImageSourcePropType> = {
  clear_day: require('../../assets/images/weather-cards/clear-day.png'),
  clear_night: require('../../assets/images/weather-cards/clear-night.png'),
  partly_cloudy_day: require('../../assets/images/weather-cards/partly-cloudy-day.png'),
  partly_cloudy_night: require('../../assets/images/weather-cards/partly-cloudy-night.png'),
  cloudy: require('../../assets/images/weather-cards/cloudy.png'),
  rain: require('../../assets/images/weather-cards/rain.png'),
  snow: require('../../assets/images/weather-cards/snow.png'),
  storm: require('../../assets/images/weather-cards/storm.png'),
  fog: require('../../assets/images/weather-cards/fog.png'),
  wind: require('../../assets/images/weather-cards/wind.png'),
  default_day: require('../../assets/images/weather-cards/default-day.png'),
  default_night: require('../../assets/images/weather-cards/default-night.png'),
};

export function weatherCardBackgroundImage(kind: WeatherConditionKind): ImageSourcePropType {
  return MAP[kind];
}
