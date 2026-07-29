import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTrueDaytime, calculateSolarElevationDeg } from './solarPosition';
import { roadBandForTemp, RoadTempBand } from '../readiness/thresholds';

export { roadBandForTemp, RoadTempBand };
export type SurfaceType = 'asphalt' | 'concrete' | 'cobblestone' | 'sand' | 'turf';

export type PointSourceType = 'observation' | 'provider_grid_forecast' | 'forecast' | 'cached_forecast' | 'interpolated' | 'extrapolated' | 'unavailable';

export type HourlyInput = {
  timeIso: string;
  airTempF: number;
  windSpeedMph: number;
  isDaytime: boolean;
  skyCover: number | null;
  humidityPct?: number | null;
  /** Actual solar radiation in W/m² (Global Horizontal Irradiance) if available. */
  solarGhi?: number | null;
  /** Source tag ('observation' | 'provider_grid_forecast' | 'forecast' | 'cached_forecast' | 'interpolated' | 'extrapolated' | 'unavailable') */
  sourceType?: PointSourceType;
  confidence?: 'high' | 'medium' | 'low';
  stationDistanceMiles?: number | null;
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
  airTempF: number | null;
  roadTempF: number | null;
  roadBand: RoadTempBand | 'unavailable';
  sourceType: PointSourceType;
  confidence: 'high' | 'medium' | 'low';
  timeIso?: string;
  dateStr?: string;
  stationDistanceMiles?: number | null;
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

/**
 * Derives year, month, date, hour, and YYYY-MM-DD date string in location IANA timezone.
 */
export function getLocationDateTime(
  dateInput: Date | string,
  timeZone?: string
): { year: number; month: number; date: number; hour: number; dateStr: string } {
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(dateObj.getTime())) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      date: now.getDate(),
      hour: now.getHours(),
      dateStr: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    };
  }

  const tz = timeZone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'America/Los_Angeles');

  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    });
    const parts = dtf.formatToParts(dateObj);
    let year = 0, month = 0, date = 0, hour = 0;
    for (const p of parts) {
      if (p.type === 'year') year = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10) - 1;
      if (p.type === 'day') date = parseInt(p.value, 10);
      if (p.type === 'hour') hour = parseInt(p.value, 10) % 24;
    }
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return { year, month, date, hour, dateStr };
  } catch (e) {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const date = dateObj.getDate();
    const hour = dateObj.getHours();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return { year, month, date, hour, dateStr };
  }
}

/**
 * Merges newly fetched hourly samples into a persistent local daily cache for the location.
 * Real station observations replace cached forecasts. Enforces 2-day retention policy.
 */
export async function mergeAndSaveDailyHourlySamples(
  freshSamples: HourlyInput[],
  locationKey: string = 'default',
  timeZone?: string
): Promise<HourlyInput[]> {
  try {
    const nowInfo = getLocationDateTime(new Date(), timeZone);
    const todayKey = `@northpaw_daily_samples_${locationKey}_${nowInfo.dateStr}`;
    const cachedJson = await AsyncStorage.getItem(todayKey);
    const cachedMap = new Map<string, HourlyInput>();

    if (cachedJson) {
      const parsed: HourlyInput[] = JSON.parse(cachedJson);
      for (const sample of parsed) {
        cachedMap.set(sample.timeIso, {
          ...sample,
          sourceType: sample.sourceType ?? 'cached_forecast',
          confidence: sample.confidence ?? 'medium',
        });
      }
    }

    for (const sample of freshSamples) {
      const existing = cachedMap.get(sample.timeIso);
      // Genuine station observations replace cached/provider grid forecasts
      if (!existing || sample.sourceType === 'observation' || existing.sourceType === 'cached_forecast') {
        cachedMap.set(sample.timeIso, {
          ...sample,
          sourceType: sample.sourceType ?? 'forecast',
          confidence: sample.confidence ?? 'medium',
        });
      }
    }

    const merged = Array.from(cachedMap.values()).sort(
      (a, b) => new Date(a.timeIso).getTime() - new Date(b.timeIso).getTime()
    );

    await AsyncStorage.setItem(todayKey, JSON.stringify(merged));

    // Cleanup: Purge keys older than 2 days
    AsyncStorage.getAllKeys().then((keys) => {
      const dailyKeys = keys.filter((k) => k.startsWith(`@northpaw_daily_samples_${locationKey}_`));
      for (const k of dailyKeys) {
        const kDateStr = k.replace(`@northpaw_daily_samples_${locationKey}_`, '');
        if (kDateStr < nowInfo.dateStr) {
          const kDate = new Date(kDateStr);
          const tDate = new Date(nowInfo.dateStr);
          const diffDays = (tDate.getTime() - kDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 2) {
            AsyncStorage.removeItem(k);
          }
        }
      }
    }).catch(() => {});

    return merged;
  } catch (e) {
    return freshSamples;
  }
}

function solarIntensityFrom(
  localDate: Date,
  latitudeDeg: number,
  longitudeDeg: number,
  hour: number,
  skyCover: number | null
): number {
  const elevationDeg = Math.max(0, calculateSolarElevationDeg(localDate, latitudeDeg, longitudeDeg));
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
  surfaceType: SurfaceType = 'asphalt',
  longitude: number = 0
): number {
  const daytime = isTrueDaytime(localDate, latitude, longitude);

  if (!daytime) {
    return sample.airTempF - (surfaceType === 'asphalt' ? 3 : 1);
  }

  let solarIntensity: number;
  if (sample.solarGhi != null && sample.solarGhi > 0) {
    solarIntensity = Math.max(0, Math.min(10, sample.solarGhi / 100));
  } else {
    solarIntensity = solarIntensityFrom(localDate, latitude, longitude, localHour, sample.skyCover);
  }
  
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
 * Returns structured estimate contract with confidence and exposure assumptions.
 */
export function getStructuredRoadTempEstimate(
  sample: HourlyInput,
  latitude: number,
  localHour: number,
  localDate: Date,
  surfaceType: SurfaceType = 'asphalt',
  longitude: number = 0
): SurfaceTempEstimate {
  const estimateF = estimateRoadTempF(sample, latitude, localHour, localDate, surfaceType, longitude);
  const reasons: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = sample.confidence ?? 'medium';

  // Distance penalty for station observations
  if (sample.sourceType === 'observation' && sample.stationDistanceMiles != null) {
    if (sample.stationDistanceMiles > 15) {
      confidence = 'low';
      reasons.push(`Station is ${sample.stationDistanceMiles.toFixed(1)} miles away`);
    } else if (sample.stationDistanceMiles > 5 && confidence === 'high') {
      confidence = 'medium';
      reasons.push(`Station is ${sample.stationDistanceMiles.toFixed(1)} miles away`);
    }
  }

  if (sample.solarGhi == null) {
    reasons.push('Solar radiation estimated from sky cover');
    if (confidence === 'high') confidence = 'medium';
  }
  if (sample.skyCover == null) {
    reasons.push('Sky cover unavailable; assumed partial cloudiness');
    confidence = 'low';
  }

  return {
    estimateF,
    lowerF: null,
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

/**
 * Builds 24-hour timeline bars model for Home screen (5 AM to 10 PM).
 * STRICT TRUTHFUL PROVENANCE:
 * - NO forecastGridData sample can EVER emerge as sourceType: 'observation'.
 * - Station observations carry distance-based confidence penalty.
 * - Provider grid forecasts tagged explicitly as 'provider_grid_forecast'.
 * - Bounded linear interpolation & max 2h backward extrapolation tagged explicitly.
 */
export function buildTimelineBarsModel(input: {
  hourly: HourlyInput[];
  latitude: number;
  longitude?: number;
  timeZone?: string;
  now?: Date;
  riskWeightMultiplier?: number;
  bestWindowReductionFraction?: number;
  surfaceType?: SurfaceType;
}): TimelineBarsModel | null {
  if (!input.hourly.length) return null;
  const now = input.now ?? new Date();
  const longitude = input.longitude ?? 0;
  const nowLoc = getLocationDateTime(now, input.timeZone);

  const riskWeight = Math.max(0.8, Math.min(1.6, input.riskWeightMultiplier ?? 1));
  const windowReduction = Math.max(0, Math.min(0.6, input.bestWindowReductionFraction ?? 0));

  const todayHourMap = new Map<number, HourlyInput>();

  for (const sample of input.hourly) {
    const sampleLoc = getLocationDateTime(sample.timeIso, input.timeZone);
    if (sampleLoc.dateStr === nowLoc.dateStr) {
      if (sampleLoc.hour >= AXIS_START_HOUR && sampleLoc.hour <= AXIS_END_HOUR) {
        if (!todayHourMap.has(sampleLoc.hour)) {
          todayHourMap.set(sampleLoc.hour, sample);
        }
      }
    }
  }

  // Bounded linear interpolation & backward extrapolation (max 2 hours)
  const newAdditionsMap = new Map<number, HourlyInput>();
  for (let h = AXIS_START_HOUR; h <= AXIS_END_HOUR; h++) {
    if (!todayHourMap.has(h)) {
      let prevH: number | null = null;
      let nextH: number | null = null;

      for (let i = h - 1; i >= AXIS_START_HOUR; i--) {
        if (todayHourMap.has(i)) { prevH = i; break; }
      }
      for (let i = h + 1; i <= AXIS_END_HOUR; i++) {
        if (todayHourMap.has(i)) { nextH = i; break; }
      }

      if (prevH !== null && nextH !== null) {
        const prevSample = todayHourMap.get(prevH)!;
        const nextSample = todayHourMap.get(nextH)!;
        const ratio = (h - prevH) / (nextH - prevH);
        const interpAir = Math.round(prevSample.airTempF + (nextSample.airTempF - prevSample.airTempF) * ratio);
        const interpWind = Math.round(prevSample.windSpeedMph + (nextSample.windSpeedMph - prevSample.windSpeedMph) * ratio);
        const interpSky = prevSample.skyCover != null && nextSample.skyCover != null
          ? Math.round(prevSample.skyCover + (nextSample.skyCover - prevSample.skyCover) * ratio)
          : prevSample.skyCover ?? nextSample.skyCover;

        const sampleDate = new Date(prevSample.timeIso);
        sampleDate.setHours(h, 0, 0, 0);

        newAdditionsMap.set(h, {
          timeIso: sampleDate.toISOString(),
          airTempF: interpAir,
          windSpeedMph: interpWind,
          isDaytime: prevSample.isDaytime,
          skyCover: interpSky,
          sourceType: 'interpolated',
          confidence: 'medium',
        });
      } else if (prevH === null && nextH !== null) {
        if (nextH - h <= 2) {
          const nextSample = todayHourMap.get(nextH)!;
          const sampleDate = new Date(nextSample.timeIso);
          sampleDate.setHours(h, 0, 0, 0);

          newAdditionsMap.set(h, {
            ...nextSample,
            timeIso: sampleDate.toISOString(),
            sourceType: 'extrapolated',
            confidence: 'low',
          });
        }
      }
    }
  }

  for (const [h, s] of newAdditionsMap.entries()) {
    todayHourMap.set(h, s);
  }

  const points: TimelineBarPoint[] = [];
  const daylightHours: number[] = [];
  const bestWindowHours: number[] = [];

  for (let h = AXIS_START_HOUR; h <= AXIS_END_HOUR; h++) {
    const sample = todayHourMap.get(h);

    if (!sample) {
      points.push({
        hour: h,
        hourLabel: hourLabel(h),
        isDaylight: false,
        airTempF: null,
        roadTempF: null,
        roadBand: 'unavailable',
        sourceType: 'unavailable',
        confidence: 'low',
        dateStr: nowLoc.dateStr,
      });
      continue;
    }

    const sampleDate = new Date(sample.timeIso);
    const sampleLoc = getLocationDateTime(sample.timeIso, input.timeZone);
    const roadTempF = estimateRoadTempF(sample, input.latitude, h, sampleDate, input.surfaceType, longitude);
    const effectiveRoadTemp = roadTempF * riskWeight;
    const daytime = isTrueDaytime(sampleDate, input.latitude, longitude);
    const isBest = daytime && effectiveRoadTemp < 77;
    if (daytime) daylightHours.push(h);
    if (isBest) bestWindowHours.push(h);

    let sourceType: PointSourceType = sample.sourceType ?? (sampleDate < now ? 'cached_forecast' : 'forecast');
    
    // GUARANTEE: NO forecastGridData sample can EVER be tagged observation!
    if (sourceType === 'observation' && sample.stationDistanceMiles == null) {
      sourceType = 'provider_grid_forecast';
    }

    let confidence: 'high' | 'medium' | 'low' = sample.confidence ?? (sourceType === 'observation' ? 'high' : sourceType === 'extrapolated' ? 'low' : 'medium');

    // Distance penalty for station observations
    if (sourceType === 'observation' && sample.stationDistanceMiles != null) {
      if (sample.stationDistanceMiles > 15) confidence = 'low';
      else if (sample.stationDistanceMiles > 5 && confidence === 'high') confidence = 'medium';
    }

    points.push({
      hour: h,
      hourLabel: hourLabel(h),
      isDaylight: daytime,
      airTempF: sample.airTempF,
      roadTempF,
      roadBand: roadBandForTemp(roadTempF),
      sourceType,
      confidence,
      timeIso: sample.timeIso,
      dateStr: sampleLoc.dateStr,
      stationDistanceMiles: sample.stationDistanceMiles,
    });
  }

  if (!points.length) return null;

  const currentHour = nowLoc.hour + (now.getMinutes() / 60);
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
