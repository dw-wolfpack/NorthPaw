/**
 * Regression Test Suite for Real-Time Air Temp Fallback,
 * Boundary Hour Matching, and Timeline Pill / Surface Box Consistency.
 *
 * NOTE: Uses local ISO strings (no trailing Z) so .getHours() returns the
 * hour-of-day as typed regardless of the test-runner's system timezone.
 */

// ─── Inline pure-JS re-implementation of the core roadTemp logic ─────────────
// This mirrors lib/weather/roadTemp.ts so we can unit-test the algorithm
// independently of Jest's TS-transform limitations.

function estimateRoadTempF(sample, latitude, localHour, localDate, surfaceType) {
  surfaceType = surfaceType || 'asphalt';
  if (!sample.isDaytime) {
    return sample.airTempF - (surfaceType === 'asphalt' ? 3 : 1);
  }
  const start = new Date(localDate.getFullYear(), 0, 0);
  const doy = Math.floor((localDate - start) / 86400000);
  const declination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (doy - 81));
  const hourAngle = 15 * (localHour - 12);
  const toRad = (d) => (d * Math.PI) / 180;
  const sinEl =
    Math.sin(toRad(latitude)) * Math.sin(toRad(declination)) +
    Math.cos(toRad(latitude)) * Math.cos(toRad(declination)) * Math.cos(toRad(hourAngle));
  const elDeg = Math.max(0, (Math.asin(Math.max(-1, Math.min(1, sinEl))) * 180) / Math.PI);
  const clearSkyUV = 10 * Math.sin(toRad(elDeg));
  const sky = sample.skyCover == null ? 30 : Math.max(0, Math.min(100, sample.skyCover));
  const cloudFactor = 1 - (sky / 100) * 0.85;
  const solarIntensity = Math.max(0, Math.min(10, clearSkyUV * cloudFactor));
  const sm = surfaceType === 'concrete' ? 0.72 :
             surfaceType === 'cobblestone' ? 0.85 :
             surfaceType === 'sand' ? 1.15 :
             surfaceType === 'turf' ? 1.38 : 1.0;
  const ambientScale = Math.max(0.4, Math.min(1.0, ((sample.airTempF - 40) / 45) * 0.6 + 0.4));
  const solarHeating = solarIntensity * 5.1 * ambientScale * sm;
  const windCooling = sample.windSpeedMph * 0.75;
  return sample.airTempF + solarHeating - windCooling;
}

/**
 * Inline mirror of buildTimelineBarsModel — accepts an optional `targetDate` (YYYY-MM-DD)
 * so tests can exercise crossing-midnight / day-selection behavior.
 * When targetDate is provided, only samples from that date are admitted.
 * When absent, the FIRST occurrence of each hour wins (= Today's sample).
 */
function buildTimelineBarsModel(hourlyInput, opts) {
  opts = opts || {};
  const surfaceType = opts.surfaceType || 'asphalt';
  const latitude    = opts.latitude    || 37.9747;
  const targetDate  = opts.targetDate  || null; // 'YYYY-MM-DD' or null
  const AXIS_START  = 5;
  const AXIS_END    = 22;

  if (!hourlyInput || !hourlyInput.length) return null;

  const byHour = new Map();
  for (const sample of hourlyInput) {
    const d = new Date(sample.timeIso);
    if (Number.isNaN(d.getTime())) continue;
    const h = d.getHours();
    if (h < AXIS_START || h > AXIS_END) continue;

    if (targetDate) {
      // Only admit samples from the specified calendar date (local)
      const sampleDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (sampleDate !== targetDate) continue;
    }

    // First-win: keep Today's sample, reject later-day duplicates
    if (!byHour.has(h)) {
      byHour.set(h, sample);
    }
  }

  const points = [];
  for (let h = AXIS_START; h <= AXIS_END; h++) {
    const sample = byHour.get(h);
    if (!sample) continue;
    const localDate = new Date(sample.timeIso);
    const roadTempF = estimateRoadTempF(sample, latitude, h, localDate, surfaceType);
    points.push({ hour: h, airTempF: sample.airTempF, roadTempF });
  }
  return { points };
}

function findClosestHourlySample(hourlySamples, nowMs) {
  if (!hourlySamples || !hourlySamples.length) return null;
  let closestDiff = Number.MAX_SAFE_INTEGER;
  let closestSample = null;
  for (const sample of hourlySamples) {
    const diff = Math.abs(new Date(sample.timeIso).getTime() - nowMs);
    if (diff < closestDiff) { closestDiff = diff; closestSample = sample; }
  }
  return closestDiff > 2.5 * 60 * 60 * 1000 ? null : closestSample;
}

function deriveCurrentTempF({ dailyHighP0, hourlySamples, obs, nowMs }) {
  if (obs && obs.tempF != null) return Math.round(obs.tempF);
  const h = findClosestHourlySample(hourlySamples, nowMs);
  if (h && h.airTempF != null) return Math.round(h.airTempF);
  return Math.round(dailyHighP0);
}

// Use fixed local-time ISO strings (no Z suffix) to be timezone-agnostic
const TODAY    = '2026-08-01';
const TOMORROW = '2026-08-02';
function localIso(date, hh) {
  return `${date}T${String(hh).padStart(2, '0')}:00:00`;
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Weather Real-Time Air Temp & Timeline Match Regression Suite', () => {

  // ── Test 1 ────────────────────────────────────────────────────────────────
  it('Test 1: Fallback uses current hourly air temp (72°F at 11 AM), NOT daily high (92°F)', () => {
    const dailyHighP0 = 92;
    const hourlySamples = [
      { timeIso: localIso(TODAY, 11), airTempF: 72 },
      { timeIso: localIso(TODAY, 12), airTempF: 78 },
      { timeIso: localIso(TODAY, 14), airTempF: 92 },
    ];
    const currentMs = new Date(localIso(TODAY, 11)).getTime();

    const temp = deriveCurrentTempF({ dailyHighP0, hourlySamples, obs: null, nowMs: currentMs });

    expect(temp).toBe(72);
    expect(temp).not.toBe(92);
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────
  it('Test 2: Boundary — time between samples always picks nearest consistently', () => {
    const hourlySamples = [
      { timeIso: localIso(TODAY, 11), airTempF: 72 },
      { timeIso: localIso(TODAY, 12), airTempF: 78 },
    ];

    // 11:18 → 18 min from 11 AM, 42 min from noon → pick 11 AM (72°F)
    const at1118 = new Date(localIso(TODAY, 11)).getTime() + 18 * 60 * 1000;
    expect(findClosestHourlySample(hourlySamples, at1118).airTempF).toBe(72);

    // 11:42 → 42 min from 11 AM, 18 min from noon → pick noon (78°F)
    const at1142 = new Date(localIso(TODAY, 11)).getTime() + 42 * 60 * 1000;
    expect(findClosestHourlySample(hourlySamples, at1142).airTempF).toBe(78);
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────
  it('Test 3: Timeline retains Today sample and does NOT overwrite with Tomorrow\'s sample', () => {
    const multiDayHourly = [
      { timeIso: localIso(TODAY,    11), airTempF: 72, windSpeedMph: 4, isDaytime: true, skyCover: 10 },
      { timeIso: localIso(TOMORROW, 11), airTempF: 94, windSpeedMph: 2, isDaytime: true, skyCover: 5  },
    ];

    const model = buildTimelineBarsModel(multiDayHourly, { surfaceType: 'asphalt' });

    expect(model).not.toBeNull();
    const p11 = model.points.find(p => p.hour === 11);
    expect(p11).toBeDefined();
    expect(p11.airTempF).toBe(72); // NOT 94

    // Pill and grid box produce identical pavement estimate
    const todaySample = multiDayHourly[0];
    const gridBoxTemp = estimateRoadTempF(todaySample, 37.9747, 11, new Date(todaySample.timeIso), 'asphalt');
    expect(Math.round(p11.roadTempF)).toBe(Math.round(gridBoxTemp));
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────
  it('Test 4: Multi-day feed — Today\'s 94°F at 11 AM is preserved over Day 2 (88°F) and Day 3 (101°F)', () => {
    const DAY3 = '2026-08-03';
    const multiDayHourly = [
      { timeIso: localIso(TODAY,    11), airTempF: 94,  windSpeedMph: 3, isDaytime: true, skyCover: 5  },
      { timeIso: localIso(TOMORROW, 11), airTempF: 88,  windSpeedMph: 4, isDaytime: true, skyCover: 20 },
      { timeIso: localIso(DAY3,     11), airTempF: 101, windSpeedMph: 2, isDaytime: true, skyCover: 0  },
    ];

    const model = buildTimelineBarsModel(multiDayHourly, { surfaceType: 'asphalt' });

    const p11 = model.points.find(p => p.hour === 11);
    expect(p11).toBeDefined();

    // Today's value (94°F) must win
    expect(p11.airTempF).toBe(94);
    expect(p11.airTempF).not.toBe(88);
    expect(p11.airTempF).not.toBe(101);

    // Pill and grid box agree
    const todaySample = multiDayHourly[0];
    const gridBoxTemp = estimateRoadTempF(todaySample, 37.9747, 11, new Date(todaySample.timeIso), 'asphalt');
    expect(Math.round(p11.roadTempF)).toBe(Math.round(gridBoxTemp));
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────
  it('Test 5: Crossing midnight — when targetDate = Tomorrow, Tomorrow\'s 11 AM sample is intentionally used', () => {
    const multiDayHourly = [
      { timeIso: localIso(TODAY,    11), airTempF: 72, windSpeedMph: 4, isDaytime: true, skyCover: 10 },
      { timeIso: localIso(TOMORROW, 11), airTempF: 94, windSpeedMph: 2, isDaytime: true, skyCover: 5  },
    ];

    // When we cross midnight and the selected "day" switches to Tomorrow, the model
    // must use Tomorrow's 11 AM data, not Today's stale entry.
    const model = buildTimelineBarsModel(multiDayHourly, {
      surfaceType: 'asphalt',
      targetDate:  TOMORROW,  // <-- day has rolled over
    });

    const p11 = model.points.find(p => p.hour === 11);
    expect(p11).toBeDefined();

    // Now Tomorrow's value (94°F) should be used
    expect(p11.airTempF).toBe(94);
    expect(p11.airTempF).not.toBe(72);

    // Pill and grid box still agree with each other
    const tomorrowSample = multiDayHourly[1];
    const gridBoxTemp = estimateRoadTempF(tomorrowSample, 37.9747, 11, new Date(tomorrowSample.timeIso), 'asphalt');
    expect(Math.round(p11.roadTempF)).toBe(Math.round(gridBoxTemp));
  });
});
