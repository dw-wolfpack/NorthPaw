
/**
 * Simulated road temp calculation based on the updated logic in roadTemp.ts
 */

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function solarIntensityFrom(
  localDate,
  latitudeDeg,
  hour,
  skyCover
) {
  const doy = dayOfYear(localDate);
  const declination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (doy - 81));
  const hourAngle = 15 * (hour - 12);
  const sinElevation =
    Math.sin(toRadians(latitudeDeg)) * Math.sin(toRadians(declination)) +
    Math.cos(toRadians(latitudeDeg)) *
      Math.cos(toRadians(declination)) *
      Math.cos(toRadians(hourAngle));
  const clampedSin = Math.max(-1, Math.min(1, sinElevation));
  const elevationDeg = Math.max(0, (Math.asin(clampedSin) * 180) / Math.PI);
  const clearSkyUV = 10 * Math.sin(toRadians(elevationDeg));
  const normalizedSkyCover = skyCover == null ? 30 : Math.max(0, Math.min(100, skyCover));
  
  const cloudFactor = 1 - (normalizedSkyCover / 100) * 0.85;
  
  return Math.max(0, Math.min(10, clearSkyUV * cloudFactor));
}

function estimateRoadTempF(
  airTempF,
  windSpeedMph,
  latitude,
  localHour,
  localDate,
  skyCover
) {
  const solarIntensity = solarIntensityFrom(localDate, latitude, localHour, skyCover);
  
  const ambientScale = Math.max(0.4, Math.min(1.0, ((airTempF - 40) / 45) * 0.6 + 0.4));
  const solarHeating = solarIntensity * 5.1 * ambientScale;
  
  const windCooling = windSpeedMph * 0.75;
  return airTempF + solarHeating - windCooling;
}

// TEST CASES
const lat = 38.1; // Novato
const date = new Date('2026-05-10');
const hour = 10; // 10 AM

console.log("--- Pavement Temp Simulations (Updated Logic) ---");

const scenarios = [
  { air: 55, wind: 5, sky: 0, desc: "Cold, Sunny Morning" },
  { air: 55, wind: 5, sky: 100, desc: "Cold, Overcast Morning" },
  { air: 80, wind: 5, sky: 0, desc: "Warm, Sunny Day" },
  { air: 65, wind: 15, sky: 0, desc: "Cool, Windy, Sunny" },
  { air: 50, wind: 2, sky: 0, desc: "Very Cold, Clear morning" },
];

scenarios.forEach(s => {
  const road = estimateRoadTempF(s.air, s.wind, lat, hour, date, s.sky);
  console.log(`${s.desc}: Air ${s.air}F, Road ${road.toFixed(1)}F (Diff: +${(road-s.air).toFixed(1)})`);
});
