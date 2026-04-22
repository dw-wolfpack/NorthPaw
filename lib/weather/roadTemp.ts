type HourlyInput = {
  timeIso: string;
  airTempF: number;
  windSpeedMph: number;
  isDaytime: boolean;
  skyCover: number | null;
};

export type RoadTempBand = 'safe' | 'warm' | 'hot' | 'danger';

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

function roadBandForTemp(tempF: number): RoadTempBand {
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
  const cloudFactor = 1 - 0.75 * Math.pow(normalizedSkyCover / 100, 3.4);
  return Math.max(0, Math.min(10, clearSkyUV * cloudFactor));
}

function estimateRoadTempF(
  sample: HourlyInput,
  latitude: number,
  localHour: number,
  localDate: Date
): number {
  if (!sample.isDaytime) {
    return sample.airTempF - 3;
  }
  const solarIntensity = solarIntensityFrom(localDate, latitude, localHour, sample.skyCover);
  const solarHeating = solarIntensity * 4.5;
  const windCooling = sample.windSpeedMph * 0.6;
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
}): TimelineBarsModel | null {
  if (!input.hourly.length) return null;
  const now = input.now ?? new Date();

  const byHour = new Map<number, HourlyInput>();
  for (const sample of input.hourly) {
    const d = new Date(sample.timeIso);
    if (Number.isNaN(d.getTime())) continue;
    const h = d.getHours();
    if (h < AXIS_START_HOUR || h > AXIS_END_HOUR) continue;
    byHour.set(h, sample);
  }

  const points: TimelineBarPoint[] = [];
  const daylightHours: number[] = [];
  const bestWindowHours: number[] = [];
  for (let h = AXIS_START_HOUR; h <= AXIS_END_HOUR; h++) {
    const sample = byHour.get(h);
    if (!sample) continue;
    const localDate = new Date(sample.timeIso);
    const roadTempF = estimateRoadTempF(sample, input.latitude, h, localDate);
    const isBest = sample.isDaytime && roadTempF < 77;
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

  return {
    points,
    daylightSegments: mergeAdjacentHours(daylightHours),
    bestWindowSegments: mergeAdjacentHours(bestWindowHours),
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
