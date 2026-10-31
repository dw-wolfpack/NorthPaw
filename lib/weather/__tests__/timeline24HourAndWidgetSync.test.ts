import fs from 'fs';
import path from 'path';
import {
  buildTimelineBarsModel,
  timelineBounds,
  timelineHourRatio,
  roadBandForTemp,
  estimateRoadTempF,
  type HourlyInput,
} from '../roadTemp';
import {
  BAND_LABELS,
  THRESHOLD_BOUNDARIES,
  SEMANTIC_SAFETY_COLORS,
  getSemanticSafetyColor,
} from '../../readiness/thresholds';
import {
  syncWidgetData,
  getLastSyncedWidgetData,
  getLastWidgetSyncTimestamp,
  isWidgetSyncDue,
  shouldThrottleSync,
  DEFAULT_WIDGET_SYNC_INTERVAL_MS,
  MIN_SYNC_THROTTLE_MS,
  type WidgetSyncData,
} from '../../widgetSync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { reloadAllTimelines } from '../../../modules/widget-bridge';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-shared-group-preferences', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../modules/widget-bridge', () => ({
  reloadAllTimelines: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('24-Hour Timeline Block, Anti-Wrapping & Widget Sync Test Suite', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('1. Canonical Semantic Color Tokens & Swift Widget Contract', () => {
    it('defines distinct canonical tokens in TS with exact hex and RGB values', () => {
      expect(SEMANTIC_SAFETY_COLORS.safe.hex).toBe('#2D6A4F');
      expect(SEMANTIC_SAFETY_COLORS.safe.rgb).toEqual({ r: 45, g: 106, b: 79 });

      expect(SEMANTIC_SAFETY_COLORS.warm.hex).toBe('#D4AF37');
      expect(SEMANTIC_SAFETY_COLORS.warm.rgb).toEqual({ r: 212, g: 175, b: 55 });

      expect(SEMANTIC_SAFETY_COLORS.hot.hex).toBe('#E67E22');
      expect(SEMANTIC_SAFETY_COLORS.hot.rgb).toEqual({ r: 230, g: 126, b: 34 });

      expect(SEMANTIC_SAFETY_COLORS.danger.hex).toBe('#C0392B');
      expect(SEMANTIC_SAFETY_COLORS.danger.rgb).toEqual({ r: 192, g: 57, b: 43 });

      expect(SEMANTIC_SAFETY_COLORS.unavailable.hex).toBe('#555555');
      expect(SEMANTIC_SAFETY_COLORS.unavailable.rgb).toEqual({ r: 85, g: 85, b: 85 });

      expect(SEMANTIC_SAFETY_COLORS.active_outing.hex).toBe('#2980B9');
      expect(SEMANTIC_SAFETY_COLORS.active_outing.rgb).toEqual({ r: 41, g: 128, b: 185 });
    });

    it('Warm and Hot are strictly distinct colors (never collapsed)', () => {
      expect(SEMANTIC_SAFETY_COLORS.warm.hex).not.toBe(SEMANTIC_SAFETY_COLORS.hot.hex);
      expect(SEMANTIC_SAFETY_COLORS.warm.rgb).not.toEqual(SEMANTIC_SAFETY_COLORS.hot.rgb);
    });

    it('BAND_LABELS consumes canonical semantic tokens directly', () => {
      expect(BAND_LABELS.safe.color).toBe(SEMANTIC_SAFETY_COLORS.safe.hex);
      expect(BAND_LABELS.warm.color).toBe(SEMANTIC_SAFETY_COLORS.warm.hex);
      expect(BAND_LABELS.hot.color).toBe(SEMANTIC_SAFETY_COLORS.hot.hex);
      expect(BAND_LABELS.danger.color).toBe(SEMANTIC_SAFETY_COLORS.danger.hex);
    });

    it('Swift Widget Contract: index.swift mirrors exact RGB values and preserves distinct Warm and Hot states', () => {
      const swiftPath = path.resolve(__dirname, '../../../targets/NorthPawWidget/index.swift');
      const swiftContent = fs.readFileSync(swiftPath, 'utf-8');

      // Assert Swift file contains the canonical RGB ratios matching SEMANTIC_SAFETY_COLORS
      expect(swiftContent).toContain('45/255.0, green: 106/255.0, blue: 79/255.0'); // Safe
      expect(swiftContent).toContain('212/255.0, green: 175/255.0, blue: 55/255.0'); // Warm Amber
      expect(swiftContent).toContain('230/255.0, green: 126/255.0, blue: 34/255.0'); // Hot Orange
      expect(swiftContent).toContain('192/255.0, green: 57/255.0, blue: 43/255.0'); // Danger Crimson
      expect(swiftContent).toContain('85/255.0, green: 85/255.0, blue: 85/255.0'); // Unavailable Gray
      expect(swiftContent).toContain('41/255.0, green: 128/255.0, blue: 185/255.0'); // Active Outing Blue

      // Assert Hot and Warm are distinct branches in Swift statusColor
      expect(swiftContent).toMatch(/statusText == "HOT" \|\| \(roadTempF >= 100 && roadTempF < 125\)/);
      expect(swiftContent).toMatch(/statusText\.contains\("CAUTION"\) \|\| statusText == "WARM" \|\| \(roadTempF >= 77 && roadTempF < 100\)/);
    });
  });

  describe('2. Comprehensive Threshold Boundary Matrix', () => {
    it('classifies exact boundary temperatures strictly according to clinical specifications', () => {
      // 76.9°F -> Safe
      expect(roadBandForTemp(76.9)).toBe('safe');
      expect(getSemanticSafetyColor(roadBandForTemp(76.9))).toBe('#2D6A4F');

      // 77.0°F -> Warm (boundary)
      expect(roadBandForTemp(77.0)).toBe('warm');
      expect(getSemanticSafetyColor(roadBandForTemp(77.0))).toBe('#D4AF37');

      // 99.9°F -> Warm
      expect(roadBandForTemp(99.9)).toBe('warm');
      expect(getSemanticSafetyColor(roadBandForTemp(99.9))).toBe('#D4AF37');

      // 100.0°F -> Hot (boundary)
      expect(roadBandForTemp(100.0)).toBe('hot');
      expect(getSemanticSafetyColor(roadBandForTemp(100.0))).toBe('#E67E22');

      // 124.9°F -> Hot
      expect(roadBandForTemp(124.9)).toBe('hot');
      expect(getSemanticSafetyColor(roadBandForTemp(124.9))).toBe('#E67E22');

      // 125.0°F -> Danger (Clinical burn risk threshold)
      expect(roadBandForTemp(125.0)).toBe('danger');
      expect(getSemanticSafetyColor(roadBandForTemp(125.0))).toBe('#C0392B');

      // 145.0°F -> Danger
      expect(roadBandForTemp(145.0)).toBe('danger');
      expect(getSemanticSafetyColor(roadBandForTemp(145.0))).toBe('#C0392B');
    });

    it('Defensive Safety: null, undefined, NaN, and Inifinity MUST produce "unavailable", NEVER "safe"', () => {
      expect(roadBandForTemp(null)).toBe('unavailable');
      expect(roadBandForTemp(undefined)).toBe('unavailable');
      expect(roadBandForTemp(NaN)).toBe('unavailable');
      expect(roadBandForTemp(Infinity)).toBe('unavailable');
      expect(roadBandForTemp(-Infinity)).toBe('unavailable');

      expect(getSemanticSafetyColor(roadBandForTemp(null))).toBe('#555555');
      expect(getSemanticSafetyColor(roadBandForTemp(undefined))).toBe('#555555');
      expect(getSemanticSafetyColor(roadBandForTemp(NaN))).toBe('#555555');
      expect(getSemanticSafetyColor('unavailable')).toBe('#555555');
    });
  });

  describe('3. 24-Hour Timeline Block & Anti-Wrapping Safety', () => {
    it('timelineBounds returns full 24-hour block bounds (0 to 23)', () => {
      const bounds = timelineBounds();
      expect(bounds.startHour).toBe(0);
      expect(bounds.endHour).toBe(23);
    });

    it('buildTimelineBarsModel returns exactly 24 points covering hours 0 through 23 in strict contiguous order', () => {
      const dateStr = '2026-07-29';
      const mockHourly: HourlyInput[] = Array.from({ length: 24 }).map((_, h) => {
        const d = new Date(`${dateStr}T${String(h).padStart(2, '0')}:00:00-07:00`);
        const isDaytime = h >= 6 && h <= 20;
        return {
          timeIso: d.toISOString(),
          airTempF: 65 + (isDaytime ? 15 : 0),
          windSpeedMph: 4,
          isDaytime,
          skyCover: 10,
        };
      });

      const nowNoon = new Date(`${dateStr}T12:00:00-07:00`);
      const model = buildTimelineBarsModel({
        hourly: mockHourly,
        latitude: 38.1074,
        longitude: -122.5697,
        timeZone: 'America/Los_Angeles',
        now: nowNoon,
      });

      expect(model).not.toBeNull();
      if (!model) return;

      expect(model.points).toHaveLength(24);

      // Verify strict contiguous ordering 0..23 with no wrapping jumps
      model.points.forEach((p, idx) => {
        expect(p.hour).toBe(idx);
      });

      // Hour 0 is 12a, Hour 12 is 12p, Hour 23 is 11p
      expect(model.points[0].hourLabel).toBe('12a');
      expect(model.points[12].hourLabel).toBe('12p');
      expect(model.points[23].hourLabel).toBe('11p');

      // Night hours (0..5 and 21..23) are marked non-daylight
      expect(model.points[0].isDaylight).toBe(false);
      expect(model.points[3].isDaylight).toBe(false);
      expect(model.points[23].isDaylight).toBe(false);

      // Midday hours are marked daylight
      expect(model.points[12].isDaylight).toBe(true);
      expect(model.points[14].isDaylight).toBe(true);
    });

    it('timelineHourRatio strictly maps 0..23 monotonically without wrapping or negative coordinates', () => {
      expect(timelineHourRatio(0)).toBe(0);
      expect(timelineHourRatio(23)).toBe(1);

      let prevRatio = -1;
      for (let h = 0; h <= 23; h++) {
        const ratio = timelineHourRatio(h);
        expect(ratio).toBeGreaterThan(prevRatio);
        expect(ratio).toBeGreaterThanOrEqual(0);
        expect(ratio).toBeLessThanOrEqual(1);
        prevRatio = ratio;
      }

      // Defensive clamping for out-of-bounds coordinates
      expect(timelineHourRatio(-5)).toBe(0);
      expect(timelineHourRatio(-0.01)).toBe(0);
      expect(timelineHourRatio(23.5)).toBe(1);
      expect(timelineHourRatio(24)).toBe(1);
      expect(timelineHourRatio(100)).toBe(1);
    });
  });

  describe('4. Nasty Adversarial Boundary: 11:59 PM -> 12:01 AM Date Rollover', () => {
    it('yesterdays hour 23 CANNOT survive into todays hour 0 or cause timeline wrapping', () => {
      const day1 = '2026-07-29';
      const day2 = '2026-07-30';

      // 48-hour continuous forecast array spanning day 1 and day 2
      const multiDayHourly: HourlyInput[] = [];
      for (let h = 0; h < 24; h++) {
        multiDayHourly.push({
          timeIso: `${day1}T${String(h).padStart(2, '0')}:00:00-07:00`,
          airTempF: 70 + h,
          windSpeedMph: 3,
          isDaytime: h >= 6 && h <= 20,
          skyCover: 5,
        });
      }
      for (let h = 0; h < 24; h++) {
        multiDayHourly.push({
          timeIso: `${day2}T${String(h).padStart(2, '0')}:00:00-07:00`,
          airTempF: 60 + h,
          windSpeedMph: 4,
          isDaytime: h >= 6 && h <= 20,
          skyCover: 10,
        });
      }

      // State at 11:59 PM on Day 1
      const at1159PM = new Date(`${day1}T23:59:00-07:00`);
      const modelDay1 = buildTimelineBarsModel({
        hourly: multiDayHourly,
        latitude: 38.1074,
        longitude: -122.5697,
        timeZone: 'America/Los_Angeles',
        now: at1159PM,
      });

      expect(modelDay1).not.toBeNull();
      expect(modelDay1?.points).toHaveLength(24);
      // All points in Day 1 model must belong to Day 1
      modelDay1?.points.forEach((p) => {
        expect(p.dateStr).toBe(day1);
      });
      // At 11:59 PM, current position is clamped to end (23)
      expect(modelDay1?.currentHourPosition).toBe(23);
      expect(timelineHourRatio(modelDay1!.currentHourPosition)).toBe(1);

      // State at 12:01 AM on Day 2 (2 minutes later)
      const at1201AM = new Date(`${day2}T00:01:00-07:00`);
      const modelDay2 = buildTimelineBarsModel({
        hourly: multiDayHourly,
        latitude: 38.1074,
        longitude: -122.5697,
        timeZone: 'America/Los_Angeles',
        now: at1201AM,
      });

      expect(modelDay2).not.toBeNull();
      expect(modelDay2?.points).toHaveLength(24);

      // CRITICAL ASSERTION: All points in Day 2 model must strictly belong to Day 2!
      // Day 1's hour 23 CANNOT leak into Day 2's model!
      modelDay2?.points.forEach((p) => {
        expect(p.dateStr).toBe(day2);
      });

      // Hour 0 of Day 2 has airTempF 60 (Day 2's 00:00 value), NOT 93 (Day 1's 23:00 value)!
      expect(modelDay2?.points[0].airTempF).toBe(60);
      expect(modelDay2?.points[0].hour).toBe(0);

      // Current position is ~0.0167 (1 minute past midnight), positioned at the very start of the track
      expect(modelDay2?.currentHourPosition).toBeCloseTo(0.0167, 2);
      const ratioAfterMidnight = timelineHourRatio(modelDay2!.currentHourPosition);
      expect(ratioAfterMidnight).toBeGreaterThanOrEqual(0);
      expect(ratioAfterMidnight).toBeLessThan(0.01); // Within 1% of track start

      // No wrapping: ratio does NOT jump to 1.0 or become negative
      expect(Number.isFinite(ratioAfterMidnight)).toBe(true);
    });
  });

  describe('5. App-to-Widget Synchronization Responsibilities', () => {
    it('NPI 0 is preserved as 0 and NEVER falls back to default 88 or 20', async () => {
      await syncWidgetData({
        dogName: 'Cooper',
        statusText: 'Ready',
        airTempF: 65,
        roadTempF: 70,
        surfaceType: 'grass',
        npiScore: 0, // Zero risk
        actionableTime: 'Safe all day',
        isOutingActive: false,
      }, { force: true });

      const stored = await getLastSyncedWidgetData();
      expect(stored?.npiScore).toBe(0);

      const groupName = 'group.com.northpaw.app';
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('npiScore', '0', groupName);
    });

    it('Changing surface immediately updates widget payload with fresh surfaceType and roadTempF', async () => {
      const sample = {
        timeIso: '2026-07-29T14:00:00-07:00',
        airTempF: 88,
        windSpeedMph: 3,
        isDaytime: true,
        skyCover: 5,
      };

      const dateObj = new Date(sample.timeIso);
      const asphaltTemp = estimateRoadTempF(sample, 38.1074, 14, dateObj, 'asphalt', -122.5697);
      const turfTemp = estimateRoadTempF(sample, 38.1074, 14, dateObj, 'turf', -122.5697);

      expect(turfTemp).toBeGreaterThan(asphaltTemp);

      // User switches from asphalt to turf
      await syncWidgetData({
        dogName: 'Barnaby',
        statusText: 'Danger',
        airTempF: sample.airTempF,
        roadTempF: turfTemp,
        surfaceType: 'turf',
        npiScore: 75,
        actionableTime: 'Avoid turf in direct sun',
        isOutingActive: false,
      }, { force: true });

      const stored = await getLastSyncedWidgetData();
      expect(stored?.surfaceType).toBe('turf');
      expect(stored?.roadTempF).toBe(Math.round(turfTemp));
      expect(reloadAllTimelines).toHaveBeenCalled();
    });

    it('Outing active across midnight preserves isOutingActive = true', async () => {
      // Outing active at 11:50 PM
      await syncWidgetData({
        dogName: 'Maya',
        statusText: 'Exploring',
        airTempF: 62,
        roadTempF: 60,
        surfaceType: 'asphalt',
        npiScore: 10,
        actionableTime: 'Outing in progress',
        isOutingActive: true,
        syncedAt: new Date('2026-07-29T23:50:00-07:00').getTime(),
      }, { force: true });

      let stored = await getLastSyncedWidgetData();
      expect(stored?.isOutingActive).toBe(true);

      // Outing still active at 12:15 AM next day
      await syncWidgetData({
        dogName: 'Maya',
        statusText: 'Exploring',
        airTempF: 60,
        roadTempF: 58,
        surfaceType: 'asphalt',
        npiScore: 10,
        actionableTime: 'Outing in progress',
        isOutingActive: true,
        syncedAt: new Date('2026-07-30T00:15:00-07:00').getTime(),
      }, { force: true });

      stored = await getLastSyncedWidgetData();
      expect(stored?.isOutingActive).toBe(true);
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('isOutingActive', 'true', 'group.com.northpaw.app');
    });

    it('Stale weather does NOT magically become current because widget refreshed', async () => {
      // Simulate weather fetched 4 hours ago
      const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
      await AsyncStorage.setItem('@northpaw/last_weather_fetch_time', String(fourHoursAgo));

      // Widget sync occurs now
      await syncWidgetData({
        dogName: 'Archie',
        statusText: 'Caution',
        airTempF: 75,
        roadTempF: 88,
        surfaceType: 'asphalt',
        npiScore: 35,
        actionableTime: 'Wait for shade',
        isOutingActive: false,
      }, { force: true });

      // @northpaw/last_weather_fetch_time MUST still be 4 hours ago!
      const weatherFetchTimeStr = await AsyncStorage.getItem('@northpaw/last_weather_fetch_time');
      expect(parseInt(weatherFetchTimeStr!, 10)).toBe(fourHoursAgo);

      // Widget sync time is recorded separately
      const widgetSyncTime = await getLastWidgetSyncTimestamp();
      expect(widgetSyncTime).toBeGreaterThan(fourHoursAgo);
    });

    it('Malformed or missing widget payload is sanitized defensively without throwing', async () => {
      const malformed: any = {
        dogName: '   ',
        statusText: '',
        airTempF: NaN,
        roadTempF: Infinity,
        surfaceType: undefined,
        npiScore: -999,
        actionableTime: null,
      };

      const result = await syncWidgetData(malformed, { force: true });
      expect(result).toBe(true);

      const stored = await getLastSyncedWidgetData();
      expect(stored?.dogName).toBe('Pup');
      expect(stored?.statusText).toBe('Ready');
      expect(stored?.airTempF).toBe(72);
      expect(stored?.roadTempF).toBe(77);
      expect(stored?.surfaceType).toBe('asphalt');
      expect(stored?.npiScore).toBe(0);
      expect(stored?.actionableTime).toBe('');
      expect(stored?.isOutingActive).toBe(false);
    });

    it('Temperature unit bridging: C preference bridges to App Group and widget storage', async () => {
      await syncWidgetData({
        dogName: 'Cooper',
        statusText: 'Safe to Walk',
        airTempF: 70,
        roadTempF: 75,
        surfaceType: 'grass',
        npiScore: 15,
        actionableTime: 'Safe now',
        isOutingActive: false,
        tempUnit: 'C',
      }, { force: true });

      const stored = await getLastSyncedWidgetData();
      expect(stored?.tempUnit).toBe('C');

      const groupName = 'group.com.northpaw.app';
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('tempUnit', 'C', groupName);
      expect(reloadAllTimelines).toHaveBeenCalled();
    });

    it('Cadence contract: 15m periodic sync evaluated correctly', () => {
      const now = 2000000;
      const fifteenMin = DEFAULT_WIDGET_SYNC_INTERVAL_MS;

      expect(isWidgetSyncDue(null, now)).toBe(true);
      expect(isWidgetSyncDue(now - 14 * 60 * 1000, now)).toBe(false); // 14m -> not due
      expect(isWidgetSyncDue(now - fifteenMin, now)).toBe(true);      // 15m -> due
      expect(isWidgetSyncDue(now - 30 * 60 * 1000, now)).toBe(true); // 30m -> due

      // Duplicate write within 2s throttled
      expect(shouldThrottleSync(now - 1000, now)).toBe(true);
      expect(shouldThrottleSync(now - MIN_SYNC_THROTTLE_MS, now)).toBe(false);
    });
  });
});
