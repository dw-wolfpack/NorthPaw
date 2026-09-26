import {
  buildTimelineBarsModel,
  timelineBounds,
  timelineHourRatio,
  roadBandForTemp,
  type HourlyInput,
} from '../roadTemp';
import { BAND_LABELS, THRESHOLD_BOUNDARIES } from '../../readiness/thresholds';
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

  describe('1. 24-Hour Timeline Block Data Coverage', () => {
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

    it('buildTimelineBarsModel correctly handles current hour positioning across early morning, midday, and late night', () => {
      const dateStr = '2026-07-29';
      const mockHourly: HourlyInput[] = [
        { timeIso: `${dateStr}T12:00:00-07:00`, airTempF: 75, windSpeedMph: 3, isDaytime: true, skyCover: 10 },
      ];

      // 12:30 AM early morning
      const earlyMorning = new Date(`${dateStr}T00:30:00-07:00`);
      const modelEarly = buildTimelineBarsModel({
        hourly: mockHourly,
        latitude: 38.1074,
        timeZone: 'America/Los_Angeles',
        now: earlyMorning,
      });
      expect(modelEarly?.currentHourPosition).toBe(0.5);

      // 11:45 PM late night
      const lateNight = new Date(`${dateStr}T23:45:00-07:00`);
      const modelLate = buildTimelineBarsModel({
        hourly: mockHourly,
        latitude: 38.1074,
        timeZone: 'America/Los_Angeles',
        now: lateNight,
      });
      expect(modelLate?.currentHourPosition).toBe(23); // Clamped to AXIS_END_HOUR 23
    });
  });

  describe('2. Anti-Wrapping & Coordinate Safety (timelineHourRatio)', () => {
    it('maps hour 0 to exactly 0% (0.0) and hour 23 to exactly 100% (1.0)', () => {
      expect(timelineHourRatio(0)).toBe(0);
      expect(timelineHourRatio(23)).toBe(1);
    });

    it('strictly increases monotonically across all 24 hours without reversals', () => {
      let prevRatio = -1;
      for (let h = 0; h <= 23; h++) {
        const ratio = timelineHourRatio(h);
        expect(ratio).toBeGreaterThan(prevRatio);
        expect(ratio).toBeGreaterThanOrEqual(0);
        expect(ratio).toBeLessThanOrEqual(1);
        prevRatio = ratio;
      }
    });

    it('defensively clamps negative hours and overflow hours beyond 23 to prevent layout wrapping', () => {
      expect(timelineHourRatio(-5)).toBe(0);
      expect(timelineHourRatio(-0.5)).toBe(0);
      expect(timelineHourRatio(24)).toBe(1);
      expect(timelineHourRatio(100)).toBe(1);
    });
  });

  describe('3. Pavement Temperature Safety Bands & Color Harmonization', () => {
    it('validates canonical temperature thresholds align across bands', () => {
      expect(THRESHOLD_BOUNDARIES.SAFE_MAX).toBe(77.0);
      expect(THRESHOLD_BOUNDARIES.WARM_MAX).toBe(100.0);
      expect(THRESHOLD_BOUNDARIES.HOT_MAX).toBe(125.0);
      expect(THRESHOLD_BOUNDARIES.DANGER_MIN).toBe(125.0);

      expect(roadBandForTemp(70)).toBe('safe');
      expect(roadBandForTemp(76.9)).toBe('safe');
      expect(roadBandForTemp(77.0)).toBe('warm');
      expect(roadBandForTemp(99.9)).toBe('warm');
      expect(roadBandForTemp(100.0)).toBe('hot');
      expect(roadBandForTemp(124.9)).toBe('hot');
      expect(roadBandForTemp(125.0)).toBe('danger');
      expect(roadBandForTemp(140.0)).toBe('danger');
    });

    it('validates BAND_LABELS color definitions exist and are non-empty for all bands', () => {
      const bands: Array<keyof typeof BAND_LABELS> = ['safe', 'warm', 'hot', 'danger'];
      bands.forEach((band) => {
        expect(BAND_LABELS[band]).toBeDefined();
        expect(BAND_LABELS[band].name).toBeTruthy();
        expect(BAND_LABELS[band].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('4. Widget Sync Cadence & App-to-Widget Updating', () => {
    it('DEFAULT_WIDGET_SYNC_INTERVAL_MS is configured to 15 minutes', () => {
      expect(DEFAULT_WIDGET_SYNC_INTERVAL_MS).toBe(15 * 60 * 1000);
      expect(MIN_SYNC_THROTTLE_MS).toBe(2000);
    });

    it('isWidgetSyncDue correctly evaluates cadence', () => {
      const now = 1000000;
      const fifteenMin = 15 * 60 * 1000;

      // Never synced -> due immediately
      expect(isWidgetSyncDue(null, now)).toBe(true);
      expect(isWidgetSyncDue(undefined, now)).toBe(true);
      expect(isWidgetSyncDue(0, now)).toBe(true);

      // Only 5 minutes elapsed -> not due
      expect(isWidgetSyncDue(now - 5 * 60 * 1000, now)).toBe(false);

      // 15 minutes elapsed -> due
      expect(isWidgetSyncDue(now - fifteenMin, now)).toBe(true);

      // 2 hours elapsed -> due
      expect(isWidgetSyncDue(now - 2 * 60 * 60 * 1000, now)).toBe(true);
    });

    it('shouldThrottleSync prevents duplicate writes within 2 seconds', () => {
      const now = 500000;
      // 500ms elapsed -> throttle
      expect(shouldThrottleSync(now - 500, now)).toBe(true);

      // Exactly 2000ms elapsed -> do not throttle
      expect(shouldThrottleSync(now - 2000, now)).toBe(false);

      // 10 seconds elapsed -> do not throttle
      expect(shouldThrottleSync(now - 10000, now)).toBe(false);

      // Null last sync -> do not throttle
      expect(shouldThrottleSync(null, now)).toBe(false);
    });

    it('syncWidgetData writes sanitized data to AsyncStorage and SharedGroupPreferences, then reloads timelines', async () => {
      const payload: WidgetSyncData = {
        dogName: '  Barnaby  ',
        statusText: 'Caution',
        airTempF: 78.4,
        roadTempF: 94.8,
        surfaceType: 'asphalt',
        npiScore: 45.2,
        actionableTime: 'Safe after 6:00 PM',
        isOutingActive: false,
      };

      const success = await syncWidgetData(payload, { force: true });
      expect(success).toBe(true);

      // Verify AsyncStorage was updated
      const storedJson = await getLastSyncedWidgetData();
      expect(storedJson).not.toBeNull();
      expect(storedJson?.dogName).toBe('Barnaby');
      expect(storedJson?.statusText).toBe('Caution');
      expect(storedJson?.airTempF).toBe(78);
      expect(storedJson?.roadTempF).toBe(95);
      expect(storedJson?.npiScore).toBe(45);
      expect(storedJson?.actionableTime).toBe('Safe after 6:00 PM');
      expect(storedJson?.syncedAt).toBeDefined();

      const lastTimestamp = await getLastWidgetSyncTimestamp();
      expect(lastTimestamp).toBeGreaterThan(0);

      // Verify iOS SharedGroupPreferences write
      const groupName = 'group.com.northpaw.app';
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('dogName', 'Barnaby', groupName);
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('statusText', 'Caution', groupName);
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('airTempF', '78', groupName);
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('roadTempF', '95', groupName);
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('surfaceType', 'asphalt', groupName);
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('npiScore', '45', groupName);
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('isOutingActive', 'false', groupName);
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith('actionableTime', 'Safe after 6:00 PM', groupName);

      // Verify native WidgetKit reload triggered
      expect(reloadAllTimelines).toHaveBeenCalledTimes(1);
    });

    it('syncWidgetData clamps extreme npiScore values safely between 0 and 100', async () => {
      await syncWidgetData({
        dogName: 'Kona',
        statusText: 'Danger',
        airTempF: 105,
        roadTempF: 135,
        surfaceType: 'asphalt',
        npiScore: 180, // Excessive
        actionableTime: 'Avoid walking',
        isOutingActive: false,
      }, { force: true });

      const stored = await getLastSyncedWidgetData();
      expect(stored?.npiScore).toBe(100);

      await syncWidgetData({
        dogName: 'Kona',
        statusText: 'Safe',
        airTempF: 60,
        roadTempF: 65,
        surfaceType: 'asphalt',
        npiScore: -20, // Negative
        actionableTime: 'Safe now',
        isOutingActive: false,
      }, { force: true });

      const storedNegative = await getLastSyncedWidgetData();
      expect(storedNegative?.npiScore).toBe(0);
    });
  });
});
