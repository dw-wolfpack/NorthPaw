# 04 — NorthPaw Core Algorithms, Physics & Code Reference

> **Production Code Architecture & Mathematical Foundations for NorthPaw**  
> *Compiled for Grounded Context in Gemini Notebook / NotebookLM*

---

## 1. The Canine Surface Thermodynamic Model (`surfaceTemp.ts`)

NorthPaw calculates ground surface temperatures for five distinct outdoor surfaces: `asphalt`, `concrete`, `sand`, `turf`, and `cobblestone`.

### Solar Irradiance Attenuation & Zenith Factor
```typescript
/**
 * Attenuates solar irradiance based on cloud cover percentage [0, 100]
 * and solar zenith angle.
 */
export function calculateSolarRadiation(
  zenithAngleDeg: number,
  cloudCoverPct: number,
  baseSolarConstant: number = 1000 // W/m^2
): number {
  const zenithRad = (zenithAngleDeg * Math.PI) / 180;
  if (zenithAngleDeg >= 90) return 0; // Below horizon (night)

  const cosZenith = Math.cos(zenithRad);
  const cloudFraction = Math.max(0, Math.min(1, cloudCoverPct / 100));
  
  // Non-linear cloud dampening: thin clouds still transmit substantial IR/UV
  const cloudMultiplier = 1 - 0.75 * Math.pow(cloudFraction, 2.5);
  return baseSolarConstant * cosZenith * cloudMultiplier;
}
```

### Surface Material Absorptivity & Heat Absorption Delta
```typescript
export interface SurfaceProperties {
  albedo: number;           // Reflectance factor
  emissivity: number;       // Thermal radiation release
  conductionFactor: number; // Sub-surface heat transfer
  maxDeltaF: number;        // Maximum heat elevation above ambient air
}

export const SURFACE_CONSTANTS: Record<string, SurfaceProperties> = {
  asphalt: {
    albedo: 0.08,
    emissivity: 0.93,
    conductionFactor: 0.045,
    maxDeltaF: 65.0, // Asphalt can be 65°F hotter than ambient air!
  },
  turf: {
    albedo: 0.05,
    emissivity: 0.95,
    conductionFactor: 0.020,
    maxDeltaF: 75.0, // Artificial turf crumb rubber can exceed 160°F!
  },
  concrete: {
    albedo: 0.35,
    emissivity: 0.90,
    conductionFactor: 0.038,
    maxDeltaF: 40.0,
  },
  cobblestone: {
    albedo: 0.18,
    emissivity: 0.92,
    conductionFactor: 0.050,
    maxDeltaF: 50.0,
  },
  sand: {
    albedo: 0.25,
    emissivity: 0.88,
    conductionFactor: 0.030,
    maxDeltaF: 48.0,
  },
};
```

---

## 2. Canine Heat Stress & Readiness Index (`npi.ts`)

The NorthPaw Index (NPI) produces a scalar value ($0.0 \dots 10.0$) representing canine physiological stress during an outdoor outing.

```typescript
export function calculateNPI(params: {
  airTempF: number;
  roadTempF: number;
  humidityPct: number;
  windSpeedMph: number;
  snoutType: 'brachycephalic' | 'mesocephalic' | 'dolichocephalic';
  coatType: 'single' | 'double' | 'hair' | 'wire';
  coatColor: 'dark' | 'light' | 'mixed';
  ageYears: number;
  weightLbs: number;
  isMobilityImpaired?: boolean;
}): { score: number; verdict: 'GREEN' | 'AMBER' | 'CRIMSON'; reasons: string[] } {
  let riskScore = 0;
  const reasons: string[] = [];

  // 1. Pavement Paw Burn Risk (Direct Contact Physics)
  if (params.roadTempF >= 135) {
    riskScore += 4.5;
    reasons.push('Extreme pavement heat: Second-degree paw pad burns occur in <60 seconds.');
  } else if (params.roadTempF >= 120) {
    riskScore += 3.0;
    reasons.push('Hot pavement: Paw pad discomfort and cumulative tissue injury hazard.');
  } else if (params.roadTempF >= 105) {
    riskScore += 1.5;
  }

  // 2. Respiratory & Panting Cooling Penalty (Snout Shape)
  const isHumid = params.humidityPct >= 70;
  if (params.snoutType === 'brachycephalic') {
    // Flat-faced breeds cool 20-30% slower due to restricted upper airway geometry
    const snoutPenalty = isHumid ? 2.8 : 2.0;
    riskScore += snoutPenalty;
    reasons.push('Brachycephalic snout: Restricted evaporative airway heat exchange.');
  } else if (params.snoutType === 'mesocephalic') {
    if (isHumid) riskScore += 1.0;
  }

  // 3. Coat Insulation & Solar Radiation Absorption
  if (params.coatType === 'double') {
    riskScore += 1.2;
    reasons.push('Double coat: Heavy thermal trap reduces core cooling efficiency.');
  }
  if (params.coatColor === 'dark') {
    riskScore += 0.8;
  }

  // 4. Age & Vulnerability Penalties
  if (params.ageYears >= 9 || params.ageYears <= 1) {
    riskScore += 1.0;
    reasons.push('Vulnerable age: Puppies and senior dogs regulate core temperature poorly.');
  }

  // Final normalization
  const normalized = Math.min(10.0, Math.max(0.0, Number(riskScore.toFixed(1))));
  const verdict = normalized < 5.0 ? 'GREEN' : normalized < 7.5 ? 'AMBER' : 'CRIMSON';

  return { score: normalized, verdict, reasons };
}
```

---

## 3. Ambient Widget State Synchronization (`widgetSync.ts`)

To make decisions ambient, NorthPaw broadcasts its calculated state to native SwiftUI widgets via shared App Group containers (`group.com.northpaw.app`):

```typescript
export async function syncWidgetData(data: WidgetSyncData): Promise<void> {
  try {
    // 1. Local device cache
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(data));

    if (Platform.OS !== 'ios') return;

    // 2. App Group shared container for WidgetKit
    const groupName = 'group.com.northpaw.app';
    await SharedGroupPreferences.setItem('dogName', data.dogName, groupName);
    await SharedGroupPreferences.setItem('statusText', data.statusText, groupName);
    await SharedGroupPreferences.setItem('airTempF', data.airTempF, groupName);
    await SharedGroupPreferences.setItem('roadTempF', data.roadTempF, groupName);
    await SharedGroupPreferences.setItem('surfaceType', data.surfaceType, groupName);
    await SharedGroupPreferences.setItem('npiScore', data.npiScore, groupName);

    // 3. Tell WidgetKit to reload all active timeline extensions
    reloadAllTimelines();
  } catch (e) {
    console.error('[WidgetSync] Error syncing widget data:', e);
  }
}
```

---

## 4. Ground Truth Outcome Loop (`post_walk_checkin`)

To transition from static weather modeling to an adaptive machine learning Companion, the post-walk check-in records empirical owner observations:

```typescript
export interface PostWalkCheckIn {
  outingId: string;
  timestamp: string;
  predictedNpi: number;
  airTempF: number;
  roadTempF: number;
  surfaceType: string;
  pantingLevel: 'light' | 'moderate' | 'excessive';
  energyPostWalk: 'energetic' | 'normal' | 'sluggish' | 'exhausted';
  pawCheckPassed: boolean; // Did owner observe redness or limping?
  ownerEmojiScore: 'great' | 'neutral' | 'struggled';
}
```
*This dataset provides the supervised training labels needed for personalized canine tolerance thresholds in future updates.*
