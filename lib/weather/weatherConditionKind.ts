/**
 * Shared classification for icon, card background, etc.
 */
export type WeatherConditionKind =
  | 'snow'
  | 'storm'
  | 'rain'
  | 'fog'
  | 'wind'
  | 'clear_day'
  | 'clear_night'
  | 'partly_cloudy_day'
  | 'partly_cloudy_night'
  | 'cloudy'
  | 'default_day'
  | 'default_night';

export function weatherConditionKind(weather: {
  summary: string;
  forecastShort: string;
  isDaytime: boolean;
}): WeatherConditionKind {
  const blob = `${weather.summary}\n${weather.forecastShort}`.toLowerCase();

  if (/blizzard|snow|flurr|ice|sleet|freezing rain|wintry/i.test(blob)) {
    return 'snow';
  }
  if (/thunder|storm|lightning/i.test(blob)) {
    return 'storm';
  }
  if (/rain|shower|drizzle/i.test(blob)) {
    return 'rain';
  }
  if (/fog|mist|haze|smoke/i.test(blob)) {
    return 'fog';
  }
  if (/wind|breezy|gust/i.test(blob)) {
    return 'wind';
  }
  if (/clear|sunny/i.test(blob)) {
    return weather.isDaytime ? 'clear_day' : 'clear_night';
  }
  if (/fair|mostly clear/i.test(blob)) {
    return weather.isDaytime ? 'clear_day' : 'clear_night';
  }
  if (/partly|mostly cloud|sun.*cloud|cloud.*sun/i.test(blob)) {
    return weather.isDaytime ? 'partly_cloudy_day' : 'partly_cloudy_night';
  }
  if (/cloud|overcast/i.test(blob)) {
    return 'cloudy';
  }

  return weather.isDaytime ? 'default_day' : 'default_night';
}
