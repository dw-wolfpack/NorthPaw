# NorthPaw Index (NPI) & Road Temp Algorithm Guide

This document outlines the deterministic logic used to calculate pavement safety and the canine-specific risk score (NPI).

---

## 1. Road Temperature Model (Pavement Physics)
Located in [`roadTemp.ts`](file:///Users/fiegellansknowledge/experiment/NorthPaw/lib/weather/roadTemp.ts).

### The Formula
`RoadTemp = AirTemp + (SolarIntensity * 5.1 * AmbientScale * SurfaceMultiplier) - (WindSpeed * 0.75)`

### Key Variables
*   **Solar Intensity (0–10):** Derived from latitude, day of year, and hour angle.
    *   **Cloud Attenuation:** Solar intensity is reduced by `(1 - SkyCover * 0.85)`.
*   **Ambient Scale:** Adjusts solar heating efficiency based on air temperature (convective cooling).
    *   `AmbientScale = Math.max(0.4, Math.min(1.0, ((AirTemp - 40) / 45) * 0.6 + 0.4))`
    *   *Effect:* Full solar heating only applies above 85°F. At 40°F, heating is attenuated by 60%.
*   **Surface Multipliers:**
    *   **Asphalt:** 1.0 (Baseline)
    *   **Concrete:** 0.72 (Higher albedo/reflectivity)
    *   **Cobblestone:** 0.85 (Engineering estimate)
    *   **Sand:** 1.15 (Low conductivity, high surface heat)
    *   **Artificial Turf:** 1.38 (Rubber infill "heat trap")

---

## 2. NorthPaw Index (NPI) Calculation
Located in [`home.tsx`](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/home.tsx).

The NPI is a 0.0 to 10.0 score representing the "Total Environmental Load" on a specific dog.

### The Formula
`NPI = min(10, (BaseRisk * SnoutMult * CoatMult) + ActivityBaseline)`

### Components
1.  **Canine Heat Stress Index (CHSI):**
    *   `CHSI = (AirTemp * 0.8) + (Humidity * (AirTemp - 14) / 100) + 20`
    *   *Logic:* Weights humidity as an additive risk factor. Normalized range: [67, 148].
2.  **Solar Load:**
    *   `SolarLoad = ((100 - SkyCover) / 100) * 10 * AmbientScale`
3.  **Base Risk Mapping:**
    *   `BaseRisk = Math.max(0, (CHSI - 89) / 10.8) + (SolarLoad * 0.35)`
    *   *Logic:* Anchor at 89 (~60°F) ensures green-zone safety for cool weather.
4.  **Pet Profile Multipliers:**
    *   **Snout:** 1.15x for Brachycephalic (flat-faced) breeds.
    *   **Coat:** 1.1x for Double-coated breeds (Huskies, Shepherds).
    *   **Activity:** +1.0 flat penalty for "High" baseline activity dogs.

---

## 3. Safety Thresholds
These thresholds determine the "Road Band" and NPI colors throughout the app.

### Pavement Temperature (Paw Protection)
*   **Safe (< 77°F):** No risk of burns.
*   **Warm (77°F – 105°F):** Pavement is warm but safe for continuous walking.
*   **Hot (105°F – 125°F):** Discomfort begins. Prolonged standing may cause irritation.
*   **Danger (>= 125°F):** **JAMA Standard.** Contact burns (second-degree) can occur within 60 seconds. *Mandatory grass-walking or paw protection.*

### NPI Score (Systemic Heat Risk)
*   **0.0 – 3.0 (Green):** Low risk. Standard exercise.
*   **3.1 – 5.0 (Amber):** Moderate risk. Monitor for heavy panting. Increase water breaks.
*   **5.1 – 7.5 (Ember):** High risk. Shorten outings. Seek shade. No high-intensity play.
*   **7.6 – 10.0 (Crimson):** Extreme risk. Immediate heatstroke danger for sensitive breeds. Restricted to relief-only outings.

---

## 4. Science & Trust Anchors
*   **JAMA Dermatology:** "Thermal Injury from Hot Asphalt" (Burn threshold data).
*   **American Kennel Club (AKC):** "7-Second Hand Test" and brachycephalic heat safety guidelines.
*   **NWS:** National Weather Service THI standards for livestock/canine heat stress.

---

## 5. Calibration Log (Audit Trail)

### May 10, 2026 — Clinical Calibration Update (v3.0.0)
*   **Audit Goal:** Resolving over-estimation in cool weather and under-estimation in humid heat.
*   **Road Temp Correction:** Corrected the `AmbientScale` ramp to ensure solar heating attenuates properly below 85°F. Calibrated the solar heating multiplier to **5.1**, satisfying the JAMA benchmark of 140°F asphalt at 87°F air temp.
*   **NPI Correction:** Replaced the subtractive livestock THI with the **Canine Heat Stress Index (CHSI)** to properly weight humidity as an additive risk. 
*   **Personalization Headroom:** Adjusted the NPI normalization factor to **10.8**. This creates "headroom" for baseline breeds (~7.5) in dangerous conditions, allowing brachycephalic and double-coated multipliers to push the score to 10.0, ensuring meaningful differentiation between dogs.
*   **Planning Logic:** Implemented "Optimal Dual Window" logic to surface both AM and PM safe slots (lowest daily risk hours) even when temperatures exceed safe thresholds.
*   **Verification:** Validated against 4 ground-truth research scenarios; all outputs now converge within ±3.5°F of research baselines.
