/**
 * NorthPaw True Solar Position & Astronomical Elevation Calculations
 */

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function dayOfYear(d: Date): number {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

/**
 * Calculates solar elevation angle (degrees) based on UTC timestamp, latitude, and longitude.
 * Positive values = Sun above horizon (Daytime).
 * Negative values = Sun below horizon (Nighttime).
 */
export function calculateSolarElevationDeg(
  dateUtc: Date,
  latitudeDeg: number,
  longitudeDeg: number = 0
): number {
  const doy = dayOfYear(dateUtc);
  
  // Solar declination (degrees)
  const declination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (doy - 81));
  
  // Local solar time adjustment (accounts for longitude within timezone)
  const utcHours = dateUtc.getUTCHours() + dateUtc.getUTCMinutes() / 60 + dateUtc.getUTCSeconds() / 3600;
  const solarTimeHours = (utcHours + longitudeDeg / 15 + 24) % 24;
  
  // Hour angle (15° per hour from solar noon)
  const hourAngle = 15 * (solarTimeHours - 12);
  
  // Sin(Elevation) equation from solar geometry
  const sinElevation =
    Math.sin(toRadians(latitudeDeg)) * Math.sin(toRadians(declination)) +
    Math.cos(toRadians(latitudeDeg)) *
      Math.cos(toRadians(declination)) *
      Math.cos(toRadians(hourAngle));
      
  const clampedSin = Math.max(-1, Math.min(1, sinElevation));
  return (Math.asin(clampedSin) * 180) / Math.PI;
}

/**
 * Determines true daytime state from solar elevation angle.
 * Day = solar elevation > -0.833° (standard atmospheric refraction threshold for sunrise/sunset).
 */
export function isTrueDaytime(
  dateUtc: Date,
  latitudeDeg: number,
  longitudeDeg: number = 0
): boolean {
  const elevation = calculateSolarElevationDeg(dateUtc, latitudeDeg, longitudeDeg);
  return elevation > -0.833;
}
