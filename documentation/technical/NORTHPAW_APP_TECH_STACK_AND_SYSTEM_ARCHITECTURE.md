# NorthPaw App: Technical Stack, System Architecture & Engineering Specifications
*Classification: Purely Technical Specification | Application Version: 6.0.0*

---

## 1. System Overview & Engineering Philosophy

NorthPaw is a cross-platform mobile application engineered in React Native and TypeScript that predicts outdoor physical environmental safety for domestic dogs (*Canis lupus familiaris*). Unlike generic weather apps or simplistic temperature thresholds, NorthPaw executes a deterministic, local-first biophysical simulation directly on the client device.

### Core Architectural Principles
1. **Local-First Deterministic Simulation:**
   - 100% of risk scoring, thermal calculations, and outing evaluations execute client-side in pure TypeScript without remote inference dependencies.
   - PII, exact GPS coordinates, dog photos, and outing timestamps never leave the device.
2. **Physical Invariance:**
   - Physical surface calculations (e.g. asphalt solar heat gain, surface refreeze point) are completely independent of canine biological traits. The road temperature equation is physically invariant; dog traits modulate vulnerability and thresholds separately.
3. **Multi-Hazard Precedence Arbitration:**
   - Outing safety is arbitrated across orthogonal hazard domains: Heat/Solar Load, Cold Exposure, Traction Biomechanics, and Chemical Deicer Exposure.
   - Precedence: $\text{Hazard} > \text{Caution} > \text{Ready}$.
4. **Zero-Fluff Presentation Decoupling:**
   - Core decision output is strictly binary/ternary (`Ready`, `Caution`, `Hazard`).
   - Presentation cues (e.g., Ice Blue `#3A86C8` contextual cold tinting, tactical icons) provide explanation without altering or compromising safety arbitration.

---

## 2. Complete Technology Stack

### 2.1 Client Framework & Runtime
- **Runtime Environment:** React Native (iOS & Android) managed via Expo Application Services.
- **Expo Framework:** Expo SDK 54 / React 18 / React Native 0.76+.
- **Language & Type System:** TypeScript 5.x configured in strict mode (`"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`).
- **Navigation & Routing:** Expo Router v4 (file-based routing with typed routes, persistent tab layout under `app/(tabs)/`, modal screens, and stack navigation).
- **Styling Architecture:** Vanilla StyleSheet API with unified semantic tokens (`constants/Colors.ts`) supporting adaptive Light/Dark mode and high-contrast accessibility.

### 2.2 Local Storage & Offline Persistence
- **Relational Storage:** `expo-sqlite` (SQLite 3.x) with parameterized queries for offline outings tracking, session history, and companion compliance audit logs.
- **Key-Value Store:** `@react-native-async-storage/async-storage` for:
  - Canine phenotype profile (`DogProfile`: breed, weight, coat type, snout profile, age group, activity baseline).
  - Atmospheric telemetry cache (2-hour TTL with offline fallback).
  - Developer mode simulation state.
  - Review prompts and session guards.

### 2.3 Environmental Telemetry & Normalization Pipeline
NorthPaw interfaces with public atmospheric and meteorological endpoints through a unified normalization pipeline (`lib/weather/`):
- **US Domestic Telemetry (Primary):**
  - **Provider:** US National Weather Service (NWS) API (`api.weather.gov`).
  - **Access Model:** Free public REST API, user-agent identified, requiring zero user-billed API keys.
  - **Coordinates:** Dual-step resolution via `/points/{lat},{lon}` to retrieve grid station forecast and hourly forecast endpoints.
- **Global / International Telemetry (Secondary):**
  - **Provider:** Tomorrow.io API v4 (`api.tomorrow.io/v4/weather/forecast`).
  - **Usage:** Fallback for coordinates outside US Lower 48, Alaska, and Hawaii borders (`isInsideUS()` bounding box validator).
- **Normalized Data Contract (`HourlyInput`):**
  - `timeIso`: ISO-8601 timestamp in target location timezone.
  - `airTempF`: Dry-bulb ambient air temperature (°F).
  - `windSpeedMph`: 10-meter wind velocity (mph).
  - `isDaytime`: Astronomical solar elevation flag ($h_\text{sun} > 0^\circ$).
  - `skyCover`: Cloud cover percentage ($0\% - 100\%$).
  - `shortForecast`: Meteorological descriptor string.
  - `precipChance`: Probability of precipitation ($0\% - 100\%$).
  - `precipType`: Categorized precipitation (`'none' | 'rain' | 'snow' | 'freezing_rain' | 'ice_pellets'`).
  - `sourceType`: Provenance identifier (`'forecast' | 'observation'`).
  - `confidence`: Telemetry confidence rating (`'high' | 'medium' | 'low'`).

---

## 3. Algorithm Architecture & Mathematical Formulations

### 3.1 Summer Surface Heat Gain Model
Located in [`lib/weather/roadTemp.ts`](file:///Users/fiegellansknowledge/experiment/NorthPaw/lib/weather/roadTemp.ts):
Surface temperature ($T_\text{road}$) is estimated by modeling solar radiation absorption, ambient heat exchange, and convective wind cooling:

$$T_\text{road} = T_\text{ambient} + \Delta T_\text{solar} - \Delta T_\text{wind}$$

Where:
1. **Solar Elevation & Solar UV Intensity:**
   - Solar elevation ($\alpha$) is computed geometrically from latitude, longitude, day of year, and local solar hour.
   - $\text{Solar Intensity} = 10 \cdot \sin(\alpha) \cdot (1 - 0.85 \cdot \frac{\text{SkyCover}}{100})$.
2. **Surface Material Multipliers:**
   - Asphalt: $1.00$
   - Sand: $1.15$
   - Cobblestone: $0.85$
   - Concrete: $0.72$
   - Artificial Turf: $1.38$
3. **Ambient Thermal Scaling:**
   $$\text{AmbientScale} = \max\left(0.4, \min\left(1.0, \frac{T_\text{ambient} - 40}{45} \cdot 0.6 + 0.4\right)\right)$$
4. **Convective Cooling:**
   $$\Delta T_\text{wind} = \max(0, \text{WindSpeed}) \cdot 0.75$$

**Safety Thresholds:**
- $< 77^\circ\text{F}$: Safe / Paws Favorable (Green)
- $77.0^\circ\text{F} - 99.9^\circ\text{F}$: Warm Surface (Amber)
- $100.0^\circ\text{F} - 124.9^\circ\text{F}$: Hot Pavement / Paw Discomfort (Orange)
- $\ge 125.0^\circ\text{F}$: Clinical Paw Burn Risk (Red / Danger)

---

### 3.2 Winter Multi-Lane Decision Engine
Located in [`lib/weather/winterEngine.ts`](file:///Users/fiegellansknowledge/experiment/NorthPaw/lib/weather/winterEngine.ts):

The winter engine evaluates three orthogonal physical hazard domains:

#### Lane 1: Cold Exposure (Biophysical Heat Loss)
- Evaluates canine thermal balance: ambient temperature, convective heat stripping from wind, and conductive loss from wet coat/precipitation.
- Considers phenotype vulnerability:
  - Mass Category: Toy ($<15$ lbs), Small ($15-29$ lbs), Standard ($30-79$ lbs), Giant ($\ge 80$ lbs).
  - Coat Morphology: Single/Short, Double, Wire, Dense Long.
  - Snout Profile: Brachycephalic (flat snout airway resistance) vs. Standard.
  - Age: Puppy, Adult, Senior.
- Severity levels: `none`, `advisory`, `warning`, `severe`.

#### Lane 2: Traction Biomechanics
- Evaluates slip and shear stress on paw pads and musculoskeletal structures.
- Conditions: `dry`, `wet`, `possible_refreeze`, `confirmed_ice`, `packed_snow`, `deep_snow`.
- Triggers `possible_refreeze` when ambient or surface temperatures drop to or below $32^\circ\text{F}$ in the presence of ground moisture.

#### Lane 3: Chemical Deicer Exposure
- Evaluates toxicological and caustic stress of road deicers on paw pad epithelium.
- Compounds: NaCl (rock salt), $\text{CaCl}_2$ (exothermic hydration burn risk), $\text{MgCl}_2$, Potassium Acetate.
- Differentiates proven presence vs. unmeasured historical baseline.

#### Multi-Hazard Precedence Arbitration
```
1. Cold Severe ─────────────► HAZARD (Driver: Cold)
2. Traction Hazard ─────────► HAZARD (Driver: Traction)
3. Cold Warning ────────────► CAUTION (Driver: Cold)
4. Chemical Warning ────────► CAUTION (Driver: Chemical)
5. Traction Caution ────────► CAUTION (Driver: Traction)
6. Cold / Chemical Advisory ► CAUTION (Driver: Cold / Chemical)
7. All Clear ───────────────► READY (Driver: None)
```

---

### 3.3 Diurnal Timeline & Best Window Derivation
- Evaluates all 24 hours of the current day using the unified decision engine.
- **Best Window Invariant:**
  $$\text{Hour} \in \text{BestWindow} \iff \text{isDaytime} \land \text{hourlyDecision} == \text{'ready'}$$
- Contiguous ready daylight hours are merged into segments (`RangeSegment: { startHour, endHour }`).
- If zero daylight hours are `ready`, the Best Window is strictly empty, and the scrubber displays neutral elevated guidance:
  *"No Ready window today — conditions remain elevated throughout the available forecast."*

---

## 4. Testing, Benchmarks & Validation Infrastructure

- **Test Framework:** Jest with React Native mocks.
- **Coverage Suites:** 26 test suites comprising 203 automated unit, integration, and regression tests.
  - `mockScenarios24h.test.ts`: End-to-end 24-hour diurnal simulation verification across all 6 canonical scenarios.
  - `winterEngine.test.ts`: 700+ lines of matrix validation for all biophysical phenotype/environment combinations.
  - `timelineWinterIntegration.test.ts`: Invariant tests ensuring zero contradictory green windows occur during hazard days.
  - `screensCompile.test.js`: Strict TypeScript compiler pass verification across all application screens.
  - `adversarialPhysics.test.ts`: Monotonicity and boundary checks (e.g. higher wind at cold temps cannot decrease risk).
