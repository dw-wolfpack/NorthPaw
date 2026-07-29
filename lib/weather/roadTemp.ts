import { isTrueDaytime, calculateSolarElevationDeg } from './solarPosition';
import { roadBandForTemp, RoadTempBand } from '../readiness/thresholds';

export { roadBandForTemp, RoadTempBand };
export type SurfaceType = 'asphalt' | 'concrete' | 'cobblestone' | 'sand' | 'turf';

export type HourlyInput = {
  timeIso: string;
  airTempF: number;
  windSpeedMph: number;
  isDaytime: boolean;
  skyCover: number | null;
  /** Actual solar radiation in W/m² (Global Horizontal Irradiance) if available. */
  solarGhi?: number | null;
};

export type SurfaceTempEstimate = {
  estimateF: number;
  lowerF: number | null;
  upperF: number | null;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  algorithmVersion: string;
  exposureAssumption: 'exposed' | 'unknown';
};

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
export const ALGORITHM_VERSION = '6.0.0-phaseB';

function solarIntensityFrom(
  localDate: Date,
  latitudeDeg: number,
  hour: number,
  skyCover: number | null
): number {
  const elevationDeg = Math.max(0, calculateSolarElevationDeg(localDate, latitudeDeg, 0));
  const clearSkyUV = 10 * Math.sin((elevationDeg * Math.PI) / 180);
  const normalizedSkyCover = skyCover == null ? 30 : Math.max(0, Math.min(100, skyCover));
  
  const cloudFactor = 1 - (normalizedSkyCover / 100) * 0.85;
  return Math.max(0, Math.min(10, clearSkyUV * cloudFactor));
}

/**
 * Calculates physical surface temperature (°F).
 * PHYSICAL INVARIANCE: Uses ZERO dog traits. Same weather & surface always produces identical physical °F.
 */
export function estimateRoadTempF(
  sample: HourlyInput,
  latitude: number,
  localHour: number,
  localDate: Date,
  surfaceType: SurfaceType = 'asphalt'
): number {
  const daytime = isTrueDaytime(localDate, latitude, 0);

  if (!daytime) {
    return sample.airTempF - (surfaceType === 'asphalt' ? 3 : 1);
  }

  let solarIntensity: number;
  if (sample.solarGhi != null && sample.solarGhi > 0) {
    solarIntensity = Math.max(0, Math.min(10, sample.solarGhi / 100));
  } else {
    solarIntensity = solarIntensityFrom(localDate, latitude, localHour, sample.skyCover);
  }
  
  // Surface multipliers based on physical albedo and solar absorption:
  // - Concrete: ~28% less heating due to light color/high albedo (0.72)
  // - Cobblestone: ~15% less heating due to thermal mass (0.85)
  // - Asphalt: baseline blacktop absorption (1.0)
  // - Sand: ~15% higher surface heating due to low thermal conductivity (1.15)
  // - Artificial / Synthetic Turf: ~38% higher surface heating due to synthetic plastic fibers & black crumb rubber infill baking in direct sun (1.38)
  const surfaceMultiplier = 
    surfaceType === 'concrete' ? 0.72 :
    surfaceType === 'cobblestone' ? 0.85 :
    surfaceType === 'sand' ? 1.15 :
    surfaceType === 'turf' ? 1.38 : 1.0;

  const ambientScale = Math.max(0.4, Math.min(1.0, ((sample.airTempF - 40) / 45) * 0.6 + 0.4));
  const solarHeating = solarIntensity * 5.1 * ambientScale * surfaceMultiplier;
  const windCooling = Math.max(0, sample.windSpeedMph) * 0.75;

  return Math.round((sample.airTempF + solarHeating - windCooling) * 10) / 10;
}

/**
 * Returns structured estimate contract with confidence and exposure assumptions (Phase C).
 */
export function getStructuredRoadTempEstimate(
  sample: HourlyInput,
  latitude: number,
  localHour: number,
  localDate: Date,
  surfaceType: SurfaceType = 'asphalt'
): SurfaceTempEstimate {
  const estimateF = estimateRoadTempF(sample, latitude, localHour, localDate, surfaceType);
  const reasons: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'high';

  if (sample.solarGhi == null) {
    reasons.push('Solar radiation estimated from sky cover');
    confidence = 'medium';
  }
  if (sample.skyCover == null) {
    reasons.push('Sky cover unavailable; assumed partial cloudiness');
    confidence = 'low';
  }

  return {
    estimateF,
    lowerF: null, // Avoid fabricating intervals without direct calibration
    upperF: null,
    confidence,
    reasons,
    algorithmVersion: ALGORITHM_VERSION,
    exposureAssumption: 'exposed',
  };
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
  riskWeightMultiplier?: number;
  bestWindowReductionFraction?: number;
  surfaceType?: SurfaceType;
}): TimelineBarsModel | null {
  if (!input.hourly.length) return null;
  const now = input.now ?? new Date();
  const targetYear = now.getUTCFullYear();
  const targetMonth = now.getUTCMonth();
  const targetDate = now.getUTCDate();

  const riskWeight = Math.max(0.8, Math.min(1.6, input.riskWeightMultiplier ?? 1));
  const windowReduction = Math.max(0, Math.min(0.6, input.bestWindowReductionFraction ?? 0));

  const byHour = new Map<number, HourlyInput>();
  for (const sample of input.hourly) {
    const d = new Date(sample.timeIso);
    if (Number.isNaN(d.getTime())) continue;

    if (
      d.getUTCFullYear() === targetYear &&
      d.getUTCMonth() === targetMonth &&
      d.getUTCDate() === targetDate
    ) {
      const h = d.getUTCHours();
      if (h >= AXIS_START_HOUR && h <= AXIS_END_HOUR) {
        if (!byHour.has(h)) {
          byHour.set(h, sample);
        }
      }
    }
  }

  if (byHour.size === 0 && input.hourly.length > 0) {
    const firstDate = new Date(input.hourly[0].timeIso);
    const fYear = firstDate.getUTCFullYear();
    const fMonth = firstDate.getUTCMonth();
    const fDate = firstDate.getUTCDate();
    for (const sample of input.hourly) {
      const d = new Date(sample.timeIso);
      if (Number.isNaN(d.getTime())) continue;
      if (
        d.getUTCFullYear() === fYear &&
        d.getUTCMonth() === fMonth &&
        d.getUTCDate() === fDate
      ) {
        const h = d.getUTCHours();
        if (h >= AXIS_START_HOUR && h <= AXIS_END_HOUR && !byHour.has(h)) {
          byHour.set(h, sample);
        }
      }
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
    const daytime = isTrueDaytime(localDate, input.latitude, 0);
    const isBest = daytime && effectiveRoadTemp < 77;
    if (daytime) daylightHours.push(h);
    if (isBest) bestWindowHours.push(h);

    points.push({
      hour: h,
      hourLabel: hourLabel(h),
      isDaylight: daytime,
      airTempF: sample.airTempF,
      roadTempF,
      roadBand: roadBandForTemp(roadTempF),
    });
  }

  if (!points.length) return null;

  const currentHour = now.getUTCHours() + now.getUTCMinutes() / 60;
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
