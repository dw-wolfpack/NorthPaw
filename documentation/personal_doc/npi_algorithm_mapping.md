# NorthPaw: Thermodynamic & Safety Algorithm Mapping

This document lists the exact mathematical equations, variable constants, and file locations for the thermodynamic pavement simulator and the personalized NorthPaw Index (NPI) calculations.

---

## 🌡️ 1. Pavement Temperature Simulation Model
*   **Purpose:** Estimates the actual surface temperature of the road/trail in real time based on atmospheric conditions and solar physics.
*   **File Location:** [lib/weather/roadTemp.ts:L81-121](file:///Users/fiegellansknowledge/experiment/NorthPaw/lib/weather/roadTemp.ts#L81-L121) (`estimateRoadTempF`)

### Variable Inputs
*   `sample.airTempF` ($T_{\text{air}}$): Ambient air temperature in °F.
*   `sample.windSpeedMph` ($W$): Local wind speed in mph (cooling factor).
*   `sample.skyCover` ($C$): Cloud cover percentage (0 to 100).
*   `latitude` ($\phi$): Geographical latitude of the user.
*   `localHour` ($H$): Current local hour of the day.
*   `localDate`: Calendar date (used for solar declination offset).
*   `surfaceType`: Selectable pavement/dirt material.

### Calculations

1.  **Solar Elevation Angle:** Calculates the height of the sun in the sky.
    $$\text{doy (day of year)} = \text{Date diff since Jan 1}$$
    $$\text{declination } (\delta) = 23.45 \times \sin\left(\frac{2\pi}{365} \times (\text{doy} - 81)\right)$$
    $$\text{hourAngle } (\omega) = 15 \times (H - 12)$$
    $$\sin(\theta) = \sin(\phi) \times \sin(\delta) + \cos(\phi) \times \cos(\delta) \times \cos(\omega)$$
    $$\text{elevationDeg } (\theta_{\text{deg}}) = \max(0, \arcsin(\sin(\theta)) \times \frac{180}{\pi})$$

2.  **Solar Intensity:** Maps the sun angle to a 0–10 scale, adjusting for cloud cover:
    $$\text{clearSkyUV} = 10 \times \sin(\theta_{\text{deg}})$$
    $$\text{cloudFactor} = 1 - \left(\frac{C}{100} \times 0.85\right)$$
    $$\text{solarIntensity} = \max(0, \min(10, \text{clearSkyUV} \times \text{cloudFactor}))$$

3.  **Surface Multipliers ($M_{\text{surface}}$):** Heat retention coefficients based on material albedo:
    *   `concrete`: **0.72**
    *   `cobblestone`: **0.85**
    *   `asphalt`: **1.00**
    *   `sand`: **1.15**
    *   `turf`: **1.38**

4.  **Convective Heat Dissipation & Wind Cooling:**
    $$\text{ambientScale} = \max\left(0.4, \min\left(1.0, \frac{T_{\text{air}} - 40}{45} \times 0.6 + 0.4\right)\right)$$
    $$\text{solarHeating} = \text{solarIntensity} \times 5.1 \times \text{ambientScale} \times M_{\text{surface}}$$
    $$\text{windCooling} = W \times 0.75$$
    $$T_{\text{pavement}} = T_{\text{air}} + \text{solarHeating} - \text{windCooling}$$

---

## 🐶 2. NorthPaw Index (NPI) Risk Calculator
*   **Purpose:** Computes the custom 0.0 to 10.0 danger dial shown on the Home hero card. It adapts thermodynamic road heat to the biological profile of each dog.
*   **File Location:** [app/(tabs)/index.tsx:L937-962](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx#L937-L962) (the `npiScore` `useMemo`)

### Variable Inputs
*   `tempF` ($T_{\text{air}}$): Current air temperature.
*   `humidity` ($H_{\text{pct}}$): Local relative humidity percentage.
*   `solarLoad` ($S$): Clamped, temperature-scaled solar intensity index (derived from current daytime flag and sky cover).
*   `dogSnoutProfile`: Snout profile from calibration (`flat` | `standard` | `long`).
*   `dogCoatType`: Coat style from calibration (`Double` | others).
*   `dogActivityBaseline`: Energy level from calibration (`low` | `moderate` | `high`).

### Calculations

1.  **Canine Heat Stress Index (CHSI):** Weights relative humidity as an additive risk for respiratory panting limitations:
    $$\text{CHSI} = (T_{\text{air}} \times 0.8) + \left(H_{\text{pct}} \times \frac{T_{\text{air}} - 14}{100}\right) + 20$$

2.  **Calibration Multipliers:**
    *   **Snout Multiplier ($M_{\text{snout}}$):** If snout is `flat` (brachycephalic risk), **1.15** (otherwise **1.00**).
        *   *Code Location:* [app/(tabs)/index.tsx:L181](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx#L181) / [L954](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx#L954)
    *   **Coat Multiplier ($M_{\text{coat}}$):** If coat is `Double` (heat retention risk), **1.10** (otherwise **1.00**).
        *   *Code Location:* [app/(tabs)/index.tsx:L182](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx#L182) / [L955](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx#L955)
    *   **Activity Penalty ($P_{\text{activity}}$):** If activity is `high`, **+1.0** flat penalty points added to final risk (otherwise **0**).
        *   *Code Location:* [app/(tabs)/index.tsx:L187](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx#L187) / [L956](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx#L956)

3.  **Risk Normalization:**
    *   The CHSI is anchored at 89 (approx. 60°F air temperature) to prevent risk over-indexing in cool weather:
    $$\text{baseRisk} = \max\left(0, \frac{\text{CHSI} - 89}{10.8}\right) + (S \times 0.35)$$
    $$\text{finalRisk} = (\text{baseRisk} \times M_{\text{snout}} \times M_{\text{coat}}) + P_{\text{activity}}$$
    $$\text{NPI Score} = \min(10.0, \text{RoundToDecimal}(\text{finalRisk}))$$

---

## 📅 3. Optimal Walk Window Reductions
*   **Purpose:** Restricts safe AM/PM timelines for dogs calibrated with high energy demands to prevent fatigue in warm conditions.
*   **File Location:** [lib/weather/roadTemp.ts:L206-214](file:///Users/fiegellansknowledge/experiment/NorthPaw/lib/weather/roadTemp.ts#L206-L214) / [app/(tabs)/index.tsx:L187](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx#L187)
*   **Rule:** If `dogActivityBaseline === 'high'`, the duration of the optimal walk windows is reduced by **20%** (`bestWindowReductionFraction = 0.2`).
