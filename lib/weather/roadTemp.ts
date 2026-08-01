type HourlyInput = {
  timeIso: string;
  airTempF: number;
  windSpeedMph: number;
  isDaytime: boolean;
  skyCover: number | null;
  /** Actual solar radiation in W/m² (Global Horizontal Irradiance) if available. */
  solarGhi?: number | null;
};

export type RoadTempBand = 'safe' | 'warm' | 'hot' | 'danger';
export type SurfaceType = 'asphalt' | 'concrete' | 'cobblestone' | 'sand' | 'turf';

export type TimelineBarPoint = {
  hour: number;
  hourLabel: string;
  isDaylight: boolean;
  airTempF: number;
  roadTempF: number;
  roadBand: RoadTempBand;
};

export type RangeSegment = {
  startHour: number;
  endHour: number;
};

export type TimelineBarsModel = {
  points: TimelineBarPoint[];
  daylightSegments: RangeSegment[];
  bestWindowSegments: RangeSegment[];
  currentHourPosition: number;
};

const AXIS_START_HOUR = 5;
const AXIS_END_HOUR = 22;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function roadBandForTemp(tempF: number): RoadTempBand {
  if (tempF < 77) return 'safe';
  if (tempF < 100) return 'warm';
  if (tempF < 125) return 'hot';
  return 'danger';
}

function solarIntensityFrom(
  localDate: Date,
  latitudeDeg: number,
  hour: number,
  skyCover: number | null
): number {
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
  
  // Heat attenuation from clouds is roughly linear, unlike UV which penetrates clouds easily.
  // 100% cloud cover still lets ~15% of diffuse solar radiation through.
  const cloudFactor = 1 - (normalizedSkyCover / 100) * 0.85;
  
  return Math.max(0, Math.min(10, clearSkyUV * cloudFactor));
}

export function estimateRoadTempF(
  sample: HourlyInput,
  latitude: number,
  localHour: number,
  localDate: Date,
  surfaceType: SurfaceType = 'asphalt'
): number {
  if (!sample.isDaytime) {
    // Concrete and Turf retain heat differently, but air-3 is a safe night baseline.
    return sample.airTempF - (surfaceType === 'asphalt' ? 3 : 1);
  }

  let solarIntensity: number;
  if (sample.solarGhi != null && sample.solarGhi > 0) {
    // Map W/m² (GHI) to our 0-10 clinical intensity scale.
    // 1000 W/m² is a standard "full sun" clear sky peak at low latitudes.
    solarIntensity = Math.max(0, Math.min(10, sample.solarGhi / 100));
  } else {
    solarIntensity = solarIntensityFrom(localDate, latitude, localHour, sample.skyCover);
  }
  
  // Surface multipliers based on albedo and thermal mass
  // Asphalt: baseline (1.0)
  // Concrete: ~25% less heating due to higher albedo (0.75)
  // Sand: ~15% more heating due to low thermal conductivity/high surface area (1.15)
  // Artificial Turf: ~35% more heating due to rubber infill and poor dissipation (1.35)
  const surfaceMultiplier = 
    surfaceType === 'concrete' ? 0.72 :
    surfaceType === 'cobblestone' ? 0.85 : // Engineering estimate
    surfaceType === 'sand' ? 1.15 :
    surfaceType === 'turf' ? 1.38 : 1.0;

  // Heat dissipates faster when the air is colder due to convection.
  // At 85°F+, full solar heating applies. At 40°F, it is roughly 40% as effective.
  const ambientScale = Math.max(0.4, Math.min(1.0, ((sample.airTempF - 40) / 45) * 0.6 + 0.4));
  const solarHeating = solarIntensity * 5.1 * ambientScale * surfaceMultiplier;
  
  // Wind has a significant effect on asphalt cooling.
  const windCooling = sample.windSpeedMph * 0.75;
  return sample.airTempF + solarHeating - windCooling;
}

function mergeAdjacentHours(hours: number[]): RangeSegment[] {
  if (!hours.length) return [];
  const sorted = [...hours].sort((a, b) => a - b);
  const out: RangeSegment[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const h = sorted[i];
    if (h === prev + 1) {
      prev = h;
      continue;
    }
    out.push({ startHour: start, endHour: prev + 1 });
    start = h;
    prev = h;
  }
  out.push({ startHour: start, endHour: prev + 1 });
  return out;
}

function hourLabel(hour: number): string {
  if (hour === 12) return '12p';
  if (hour === 0) return '12a';
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function buildTimelineBarsModel(input: {
  hourly: HourlyInput[];
  latitude: number;
  now?: Date;
  /** Risk multiplier from dog profile (e.g. flat snout + coat). Defaults to 1.0 */
  riskWeightMultiplier?: number;
  /** Shrink best-window duration by fraction (e.g. 0.2 for high activity). Defaults to 0 */
  bestWindowReductionFraction?: number;
  /** Surface type to estimate. Defaults to asphalt. */
  surfaceType?: SurfaceType;
}): TimelineBarsModel | null {
  if (!input.hourly.length) return null;
  const now = input.now ?? new Date();
  const riskWeight = Math.max(0.8, Math.min(1.6, input.riskWeightMultiplier ?? 1));
  const windowReduction = Math.max(0, Math.min(0.6, input.bestWindowReductionFraction ?? 0));

  const byHour = new Map<number, HourlyInput>();
  for (const sample of input.hourly) {
    const d = new Date(sample.timeIso);
    if (Number.isNaN(d.getTime())) continue;
    const h = d.getHours();
    if (h < AXIS_START_HOUR || h > AXIS_END_HOUR) continue;
    if (!byHour.has(h)) {
      byHour.set(h, sample);
    }
  }

  const points: TimelineBarPoint[] = [];
  const daylightHours: number[] = [];
  const bestWindowHours: number[] = [];
  for (let h = AXIS_START_HOUR; h <= AXIS_END_HOUR; h++) {
    const sample = byHour.get(h);
    if (!sample) continue;
    const localDate = new Date(sample.timeIso);
    const roadTempF = estimateRoadTempF(sample, input.latitude, h, localDate, input.surfaceType);
    const effectiveRoadTemp = roadTempF * riskWeight;
    const isBest = sample.isDaytime && effectiveRoadTemp < 77;
    if (sample.isDaytime) daylightHours.push(h);
    if (isBest) bestWindowHours.push(h);
    points.push({
      hour: h,
      hourLabel: hourLabel(h),
      isDaylight: sample.isDaytime,
      airTempF: sample.airTempF,
      roadTempF,
      roadBand: roadBandForTemp(roadTempF),
    });
  }

  if (!points.length) return null;

  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentHourPosition = clamp(currentHour, AXIS_START_HOUR, AXIS_END_HOUR);

  const reducedBestSegments = mergeAdjacentHours(bestWindowHours).map((seg) => {
    if (windowReduction <= 0) return seg;
    const duration = seg.endHour - seg.startHour;
    const reducedDuration = Math.max(1, Math.round(duration * (1 - windowReduction)));
    return {
      startHour: seg.startHour,
      endHour: Math.min(seg.endHour, seg.startHour + reducedDuration),
    };
  });

  return {
    points,
    daylightSegments: mergeAdjacentHours(daylightHours),
    bestWindowSegments: reducedBestSegments,
    currentHourPosition,
  };
}

export function timelineHourRatio(hour: number): number {
  const span = AXIS_END_HOUR - AXIS_START_HOUR;
  return span > 0 ? (hour - AXIS_START_HOUR) / span : 0;
}

export function timelineBounds() {
  return { startHour: AXIS_START_HOUR, endHour: AXIS_END_HOUR };
}
