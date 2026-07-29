# NorthPaw Pavement Temperature Algorithm Update Handoff

**Target area:** `lib/weather/roadTemp.ts` and its weather-provider/UI integrations  
**Purpose:** Handoff for improving NorthPaw's pavement-temperature estimate while keeping computation on-device and weather inputs free or within the existing provider arrangement  
**Status:** Analysis and implementation guidance only  
**Recommended rollout posture:** Do not release the updated algorithm until every mandatory test in this document passes

## 1. Executive Summary

NorthPaw estimates the temperature of outdoor walking surfaces so dog owners can identify potentially safer outing windows. The existing implementation is a useful MVP heuristic: it starts with forecast air temperature, adds estimated solar heating, subtracts wind cooling, and applies a multiplier for the selected surface.

The current model has the right broad inputs and is inexpensive enough to run entirely on-device. It does not require a new server, paid computation, or a heavy simulation library.

The main opportunity is not simply to add more coefficients. Several correctness and integration problems should be resolved first:

1. A 36-hour forecast is collapsed by hour-of-day, allowing tomorrow's samples to overwrite today's.
2. Tomorrow.io daytime detection is based on cloud cover, causing clear nighttime hours to be classified as daytime and fully overcast daytime hours as nighttime.
3. Dog heat-risk multipliers are applied directly to Fahrenheit pavement temperature when selecting best windows.
4. Temperature-band boundaries are inconsistent between code, documentation, and downstream risk guidance.
5. Every forecast hour is calculated independently, so the model has no thermal memory and cannot represent afternoon lag or warm pavement after sunset.
6. Wind cooling is a fixed subtraction and can produce physically implausible values.
7. The fallback solar calculation assumes solar noon is always 12:00 local clock time.
8. Material multipliers are provisional and are not supported by a broad validation dataset.

A substantially better and more defensible on-device model should take approximately four to seven focused engineering days, including automated tests. Scientific calibration against real measurements is a separate effort and may require two to four weeks depending on the desired credibility.

## 2. What NorthPaw Does

NorthPaw is a React Native/Expo application that helps dog owners evaluate outdoor conditions and prepare for outings. Its primary capabilities include:

- A local weather dashboard.
- The NorthPaw Index (NPI), which estimates dog-specific environmental heat stress.
- Estimated pavement temperatures and safety bands.
- Suggested morning and evening outing windows.
- Surface comparisons for asphalt, concrete, cobblestone, sand, and artificial turf.
- Dog-profile personalization based on traits such as snout and coat.
- Outing logs, reminders, checklists, educational content, and shareable safety cards.

For U.S. users, weather primarily comes from the National Weather Service. Tomorrow.io is used as a fallback and for locations outside the U.S.

## 3. Current Road-Temperature Algorithm

The current core formula is:

```text
SurfaceTemp =
  AirTemp
  + (SolarIntensity * 5.1 * AmbientScale * SurfaceMultiplier)
  - (WindSpeed * 0.75)
```

### 3.1 Inputs

- Hourly forecast timestamp.
- Air temperature in Fahrenheit.
- Wind speed in miles per hour.
- Daytime flag.
- Cloud cover.
- Latitude.
- Optional Global Horizontal Irradiance (GHI) in W/m².
- User-selected surface type.

### 3.2 Solar intensity

When positive GHI is available, the model maps it onto a 0-10 scale:

```text
SolarIntensity = clamp(GHI / 100, 0, 10)
```

Otherwise, solar intensity is approximated using:

- Latitude.
- Day of year.
- Hour angle.
- Estimated solar elevation.
- Cloud-cover attenuation.

### 3.3 Ambient scaling

The current model reduces solar heating in cold air:

```text
AmbientScale =
  clamp((((AirTemp - 40) / 45) * 0.6) + 0.4, 0.4, 1.0)
```

Full modeled solar heating applies at approximately 85°F and above. The minimum factor is 0.4.

### 3.4 Surface multipliers

Current values:

| Surface | Multiplier | Current rationale |
|---|---:|---|
| Asphalt | 1.00 | Baseline |
| Concrete | 0.72 | Higher albedo |
| Cobblestone | 0.85 | Engineering estimate |
| Sand | 1.15 | Strong surface heating |
| Artificial turf | 1.38 | Rubber infill and poor heat dissipation |

### 3.5 Nighttime behavior

At night, the main formula is bypassed:

```text
Asphalt = AirTemp - 3°F
Other surfaces = AirTemp - 1°F
```

### 3.6 Pavement bands

The implementation currently uses:

| Band | Code boundary |
|---|---|
| Safe | Below 77°F |
| Warm | 77°F through 99.999°F |
| Hot | 100°F through 124.999°F |
| Danger | 125°F and above |

These boundaries are not consistent with all current documentation and downstream UI risk logic.

## 4. Strengths of the Current Approach

The existing model is a reasonable product prototype:

- It is deterministic and explainable.
- It runs quickly and cheaply on-device.
- It uses the correct broad categories of physical input: air temperature, solar load, wind, and material.
- It uses actual GHI when available.
- It exposes surface type to the user rather than implying all pavement behaves identically.
- It is simple enough to test thoroughly.
- It does not require ongoing backend computation.

Published pavement-temperature research also treats air temperature, solar radiation, wind, albedo, humidity, longwave radiation, and material thermal properties as important inputs. However, validated research models generally use nonlinear regression or a time-stepped energy balance rather than a single independent formula per hour.

## 5. Current Problems and Risks

### 5.1 Multi-day samples overwrite one another

`buildTimelineBarsModel` stores samples in a map keyed only by local hour. Both weather sources can supply up to 36 hours. Tomorrow's 8:00 AM can therefore overwrite today's 8:00 AM.

The resulting timeline may silently combine different calendar days. This is a correctness defect independent of algorithm calibration.

### 5.2 Incorrect Tomorrow.io daytime classification

Tomorrow.io samples currently use:

```text
isDaytime = cloudCover < 100
```

Cloud cover is unrelated to whether the sun is above the horizon. Clear midnight can be treated as daytime, while completely overcast noon can be treated as nighttime. This changes which temperature formula is used and can produce substantially incorrect results.

### 5.3 Dog risk is mixed into physical temperature

The best-window calculation multiplies estimated Fahrenheit pavement temperature by a dog-risk multiplier. Fahrenheit has an arbitrary zero, so direct multiplication is mathematically inappropriate.

For example, the combined 1.265 multiplier for a flat-faced, double-coated dog changes:

```text
61°F * 1.265 = 77.2°F
```

The pavement has not physically become hotter. Dog physiology should affect outing guidance or NPI thresholds, not the displayed physical surface estimate.

Snout and coat traits primarily affect systemic heat dissipation. They should not be treated as direct modifiers of paw-contact temperature.

### 5.4 Inconsistent safety boundaries

The code marks 100°F as `hot`, while documentation describes the warm band as extending to 105°F. Separate UI logic adds an explicit road-risk penalty only above 105°F.

NorthPaw needs one canonical threshold definition consumed by:

- Timeline coloring.
- Pavement detail labels.
- NPI or outing guidance.
- Documentation.
- Analytics.
- Share cards.
- Notifications.

The product should distinguish between comfort guidance and demonstrated burn-risk thresholds. A low "safe" cutoff such as 77°F should not be described as a clinical burn boundary without evidence.

### 5.5 No thermal inertia

Each hour is evaluated independently. Real surfaces store and release heat:

- Surface temperature rises progressively after sunrise.
- Maximum surface temperature can occur after maximum solar intensity.
- Pavement can remain hot after cloud cover increases.
- Pavement can remain warmer than air after sunset.
- The prior day's conditions can influence early-morning temperature.

The fixed nighttime rule cannot capture these effects.

### 5.6 Wind model can become implausible

The model always subtracts `0.75°F` per mph. At high wind speeds, it can predict a sunlit surface well below the surrounding air.

Convection should generally pull surface temperature toward air temperature. Its effect should depend on:

- Wind speed.
- The difference between surface and air temperature.
- Surface properties.

### 5.7 Approximate solar time

The fallback solar model assumes solar noon at 12:00 local clock time. It does not account for:

- Longitude within the timezone.
- Equation of time.
- Daylight-saving time.
- Terrain.
- Buildings and route shade.
- Surface orientation.

The first three can be improved on-device. Shade and urban microclimates should be represented as uncertainty unless the app collects more contextual information.

### 5.8 Surface coefficients are provisional

A single multiplier cannot fully represent:

- Surface color and age.
- Albedo.
- Emissivity.
- Conductivity.
- Heat capacity.
- Layer depth.
- Moisture.
- Turf fiber and infill construction.

The current ordering is directionally plausible, but the coefficients should be described as calibration parameters rather than established physical constants.

### 5.9 False precision

The UI presents a single temperature value even when inputs are incomplete. A result of 118°F can appear more precise than the available data supports.

NorthPaw should expose an uncertainty interval and confidence classification, especially when actual GHI is unavailable.

### 5.10 Insufficient verification

The existing manual verification script covers only a few clear/overcast air-temperature scenarios. It does not cover:

- Actual GHI.
- All surface types.
- Nighttime.
- Safety boundaries.
- Timezones.
- Multi-day forecasts.
- Extreme wind.
- Invalid inputs.
- Thermal lag.
- Dog-risk separation.
- Uncertainty output.

Claims of clinical calibration or narrow error bounds should not be made without a documented validation dataset and reproducible results.

## 6. Recommended Updated Architecture

Separate the pipeline into four responsibilities:

```text
Weather normalization
    ↓
Physical surface-temperature estimate
    ↓
Uncertainty and confidence
    ↓
Dog-specific outing guidance
```

### 6.1 Weather normalization

Normalize provider data into one internal structure:

```ts
type NormalizedWeatherPoint = {
  timestampIso: string;
  airTempF: number;
  windSpeedMph: number;
  skyCoverPct: number | null;
  humidityPct: number | null;
  solarGhiWm2: number | null;
  precipitation: boolean | null;
};
```

Day/night should be derived consistently using solar elevation from timestamp, latitude, and longitude. Provider-specific daytime flags may be retained for diagnostics but should not be the primary physical input.

### 6.2 Physical surface estimate

The physical model must not receive dog-profile inputs.

It should process samples chronologically and retain heat state from the previous step.

A lightweight approach:

```text
SolarTarget =
  AirTemp + SolarGain

EquilibriumTarget =
  move SolarTarget toward AirTemp according to wind/convection

NextSurfaceTemp =
  PreviousSurfaceTemp
  + ResponseRate * (EquilibriumTarget - PreviousSurfaceTemp)
```

Each surface can have:

- Solar absorption coefficient.
- Heating response rate.
- Cooling response rate.
- Wind/convection sensitivity.
- Uncertainty width.

This remains computationally trivial on a mobile device.

### 6.3 Confidence and uncertainty

Return a structured result:

```ts
type SurfaceTempEstimate = {
  estimateF: number;
  lowF: number;
  highF: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
};
```

Example confidence rules:

- Actual GHI present: increase confidence.
- Cloud-cover-derived solar input: widen the interval.
- Unknown precipitation or wetness: widen the interval.
- Artificial turf or cobblestone: widen the interval.
- Very low reported wind: account for sheltered-route uncertainty.
- Forecast far in the future: widen the interval.
- Missing prior thermal state: lower first-hour confidence.

For safety decisions, use the upper estimate or a conservative percentile rather than only the center estimate.

### 6.4 Dog-specific outing guidance

Dog-profile modifiers should operate after the surface estimate:

- Surface burn/contact risk comes from surface temperature and exposure.
- Systemic heat risk comes from air temperature, humidity, solar exposure, activity, snout, coat, age, health, and other profile inputs.
- The final outing recommendation can conservatively combine these separate risk dimensions.

The UI should continue to show the same physical surface estimate for every dog at the same place, time, and selected surface. The personalized advice may differ.

## 7. Suggested Implementation Plan

### Phase 1: Correctness repairs

Estimated effort: one to two days.

1. Select forecast points by full timestamp and intended local date or rolling horizon.
2. Remove hour-only overwrite behavior.
3. Derive daytime from solar position.
4. Remove dog multipliers from physical Fahrenheit values.
5. Establish one canonical band configuration.
6. Add unit tests for current behavior and corrected edge cases.

These changes should be completed before coefficient tuning.

### Phase 2: Better on-device heuristic

Estimated effort: three to six additional days.

1. Add longitude-aware solar position.
2. Prefer actual GHI when valid.
3. Implement a chronological thermal-state model.
4. Make convection pull the surface toward air temperature.
5. Add surface-specific response coefficients.
6. Add estimate ranges and confidence.
7. Update UI language to consistently say "estimated exposed-surface temperature."
8. Expand automated tests and deterministic scenario fixtures.

### Phase 3: Scientific validation

Estimated effort: two to four weeks depending on available data.

1. Assemble timestamped field measurements with matching weather inputs.
2. Partition calibration and holdout datasets.
3. Measure mean error, MAE, RMSE, and maximum underestimation.
4. Evaluate errors by climate, hour, weather, and surface.
5. Optimize for avoiding dangerous underestimation, not merely minimizing average error.
6. Freeze coefficients and version the model.
7. Publish an internal model card describing scope and limitations.

## 8. Cost, Performance, and Privacy

The recommended model can remain free and on-device:

- NWS remains the free primary U.S. provider.
- Tomorrow.io can continue under the existing arrangement for fallback/global coverage.
- Solar position is calculated locally.
- Forecast processing involves only a small number of arithmetic operations per hour.
- No machine-learning runtime is necessary.
- No server-side simulation is necessary.
- Results can be cached locally.
- Battery and CPU impact should be negligible.

The main cost is engineering and validation time, not runtime infrastructure.

## 9. Mandatory Pre-Rollout Test Gate

**Every test in this section must pass before the updated algorithm is considered for rollout.** No test may be waived because the output "looks reasonable." Expected values, tolerances, and safety behavior must be agreed upon before implementation results are reviewed.

### 9.1 Date and timeline correctness

- [ ] A 36-hour input containing two occurrences of the same clock hour never allows tomorrow's sample to overwrite today's.
- [ ] A timeline explicitly requested for today contains only today's local-calendar samples.
- [ ] A rolling timeline contains monotonically increasing complete timestamps.
- [ ] Samples are ordered correctly when the input array is shuffled.
- [ ] Duplicate timestamps resolve deterministically using a documented rule.
- [ ] Invalid timestamps are rejected without corrupting valid points.
- [ ] The current-time marker uses the same timezone basis as the displayed forecast.
- [ ] The timeline works correctly across midnight.
- [ ] The timeline works correctly across a daylight-saving spring-forward transition.
- [ ] The timeline works correctly across a daylight-saving fall-back transition, including repeated local hours.
- [ ] A user near a timezone boundary receives results for the weather location's intended timezone rather than an unrelated device timezone.

### 9.2 Day/night and solar-position correctness

- [ ] Clear midnight is classified as nighttime.
- [ ] Completely overcast noon is classified as daytime when the sun is above the horizon.
- [ ] Solar contribution is zero when the sun is below the horizon and GHI is absent or zero.
- [ ] Solar elevation is positive after local sunrise and negative after local sunset.
- [ ] Solar position uses both latitude and longitude.
- [ ] Solar-noon timing is not hard-coded to 12:00 clock time.
- [ ] Polar-day and polar-night scenarios do not produce `NaN`, exceptions, or inverted day/night states.
- [ ] Daylight-saving changes do not shift the physical sun position incorrectly.
- [ ] Valid positive GHI takes precedence over the cloud-cover fallback.
- [ ] Missing GHI produces a documented lower-confidence result.
- [ ] Negative, non-finite, or impossible GHI values are rejected or clamped deterministically.
- [ ] Solar gain never becomes negative.

### 9.3 Physical invariants

- [ ] All finite valid inputs produce finite outputs.
- [ ] No valid scenario produces `NaN`, positive infinity, or negative infinity.
- [ ] With identical conditions and zero solar input, increasing wind does not increase surface temperature.
- [ ] With identical conditions and wind, increasing valid solar input does not reduce surface temperature.
- [ ] With zero solar input, convection moves the modeled surface toward air temperature rather than indefinitely below it.
- [ ] A surface initialized at air temperature does not jump implausibly below air temperature solely because wind is present.
- [ ] Output changes continuously at the transition between day and night; there is no unexplained discontinuous jump caused solely by a boolean branch.
- [ ] A one-hour cloud interruption does not instantly erase all previously stored surface heat.
- [ ] After sunset on a hot day, stored heat decays gradually.
- [ ] Under stable nighttime conditions, surface temperature converges toward a defensible nighttime equilibrium.
- [ ] Heating and cooling rates respect configured bounds for every surface.
- [ ] The algorithm remains stable for at least seven consecutive simulated days.

### 9.4 Surface behavior

- [ ] Under the same clear, dry daytime conditions, every supported surface returns a finite estimate and uncertainty interval.
- [ ] Surface ordering in defined calibration fixtures matches the approved product model.
- [ ] Asphalt, concrete, cobblestone, sand, and turf have independently configurable parameters.
- [ ] Selecting a different surface changes only the physical surface model and dependent guidance.
- [ ] Changing the surface does not change weather input data.
- [ ] Wetness or unknown wetness widens uncertainty or follows another explicitly documented rule.
- [ ] Turf and cobblestone return wider uncertainty until they have adequate validation data.
- [ ] Surface estimates never imply that one fixed multiplier is a clinically validated material constant.

### 9.5 Dog-risk separation

- [ ] Two dogs at the same location, timestamp, and selected surface receive exactly the same physical surface-temperature estimate.
- [ ] Changing snout type does not change the physical pavement temperature.
- [ ] Changing coat type does not change the physical pavement temperature.
- [ ] Changing activity level does not change the physical pavement temperature.
- [ ] Dog traits can still change personalized outing guidance through the separate NPI or recommendation layer.
- [ ] No calculation multiplies absolute Fahrenheit pavement temperature by a dog-risk multiplier.
- [ ] Paw-contact risk and systemic heat risk are stored and explainable as separate inputs to the final recommendation.

### 9.6 Threshold consistency

- [ ] Exact boundary tests pass for one value below, exactly at, and one value above every band threshold.
- [ ] Timeline colors use the canonical thresholds.
- [ ] Detail labels use the canonical thresholds.
- [ ] Share cards use the canonical thresholds.
- [ ] Analytics use the canonical thresholds or record the algorithm version and raw temperature.
- [ ] NPI road-risk logic uses the canonical configuration where appropriate.
- [ ] Documentation matches the implementation.
- [ ] Comfort thresholds are not described as proven burn thresholds.
- [ ] The highest-risk state uses conservative wording and recommends physical verification.

### 9.7 Confidence and uncertainty

- [ ] Every estimate includes a center, lower bound, upper bound, and confidence level.
- [ ] `lowF <= estimateF <= highF` for every result.
- [ ] Missing GHI never yields higher confidence than an otherwise identical result with valid measured/forecast GHI.
- [ ] Missing cloud cover widens uncertainty.
- [ ] Forecasts farther in the future do not receive greater confidence than near-term forecasts with equivalent input quality.
- [ ] Poorly validated surfaces receive appropriately wider intervals.
- [ ] The UI does not display an uncertainty interval as an exact measured temperature.
- [ ] Safety classification follows the documented conservative policy, such as using the upper bound when appropriate.
- [ ] Confidence reasons are deterministic and user-comprehensible.

### 9.8 Provider normalization

- [ ] Equivalent normalized NWS and Tomorrow.io fixtures produce materially consistent estimates within a predefined tolerance.
- [ ] Provider unit conversions are tested for temperature, wind, humidity, cloud cover, and GHI.
- [ ] Missing provider fields do not silently become misleading zeroes.
- [ ] Wind ranges such as "5 to 10 mph" follow a documented conservative parsing rule.
- [ ] A provider's day/night flag cannot override physically calculated solar position without an explicit documented reason.
- [ ] Provider fallback does not change the algorithm version or threshold definitions.
- [ ] Cached data is labeled and does not masquerade as newly observed weather.

### 9.9 Extreme and malformed inputs

- [ ] Air temperature fixtures cover at least -40°F, 0°F, 40°F, 77°F, 100°F, 120°F, and 140°F.
- [ ] Wind fixtures cover at least 0, 1, 10, 30, 60, and 100 mph.
- [ ] Cloud cover fixtures cover null, 0%, 50%, and 100%.
- [ ] GHI fixtures cover null, 0, typical low light, typical full sun, and an invalid extreme.
- [ ] Latitude fixtures cover the equator, mid-latitudes, high latitudes, and valid coordinate limits.
- [ ] Invalid latitude and longitude values are rejected.
- [ ] Negative wind speed is rejected or normalized according to a documented policy.
- [ ] Non-finite numeric values are rejected.
- [ ] An empty hourly array returns a defined no-data state.
- [ ] A partially valid hourly array preserves valid samples and reports degraded confidence.

### 9.10 Golden scenario tests

Create deterministic, version-controlled fixtures for at least:

- [ ] Cool, clear morning.
- [ ] Cool, overcast morning.
- [ ] Warm, clear low-wind afternoon.
- [ ] Warm, clear high-wind afternoon.
- [ ] Hot, dry desert afternoon.
- [ ] Hot, humid afternoon.
- [ ] Recently wet pavement followed by sun.
- [ ] Cloudy period after several sunny hours.
- [ ] One hour before sunset.
- [ ] One hour after sunset following a hot day.
- [ ] Clear midnight.
- [ ] Cold winter sun at high latitude.
- [ ] Artificial turf in strong sun.
- [ ] Concrete and asphalt side-by-side under identical inputs.

For every golden scenario:

- [ ] Expected output and tolerance are documented.
- [ ] Expected band is documented.
- [ ] Expected confidence is documented.
- [ ] The result is reviewed for dangerous underestimation.
- [ ] A coefficient change cannot silently update the expected snapshot.

### 9.11 Historical backtesting

- [ ] A holdout dataset not used for coefficient tuning is evaluated.
- [ ] Mean error is reported.
- [ ] Mean absolute error is reported.
- [ ] RMSE is reported.
- [ ] Maximum overestimation is reported.
- [ ] Maximum underestimation is reported.
- [ ] The percentage of estimates outside the uncertainty interval is reported.
- [ ] Metrics are segmented by surface, hour, climate, GHI availability, wind, and temperature band.
- [ ] The accepted maximum dangerous underestimation is defined before results are reviewed.
- [ ] Performance is not described using only average error.
- [ ] Calibration and holdout records are reproducible and versioned.

### 9.12 Regression and integration

- [ ] The Home timeline renders with the updated result type.
- [ ] The surface-detail comparison renders all supported surfaces.
- [ ] The selected hour maps to the correct complete timestamp.
- [ ] Current pavement status uses the sample nearest the current timestamp, not merely the nearest clock hour.
- [ ] Best-window generation uses conservative surface conditions without changing the physical estimate.
- [ ] High-activity window adjustments cannot truncate the wrong end of a time range.
- [ ] Share-card values match the Home-screen values for the same estimate.
- [ ] Hand-test prompts still appear at the approved risk level.
- [ ] Analytics record the model version, surface, estimate, uncertainty, input source, and confidence without transmitting exact location.
- [ ] Weather-cache refreshes do not combine different forecast generations in one timeline.
- [ ] Existing NPI behavior changes only where explicitly approved.

### 9.13 Performance and offline behavior

- [ ] Processing a full provider forecast completes within the agreed mobile performance budget on a representative older device.
- [ ] The algorithm performs no network calls itself.
- [ ] Recalculation does not block UI interaction.
- [ ] Repeated calculations with identical inputs return identical results.
- [ ] Battery impact remains negligible during normal refresh cadence.
- [ ] Cached inputs can produce a result with visibly degraded freshness/confidence.
- [ ] No-data and stale-data states are distinguishable.

### 9.14 Product safety and wording

- [ ] Every pavement value is labeled as estimated rather than measured.
- [ ] The UI identifies the estimate as applying to an exposed surface unless shade is known.
- [ ] High-risk guidance tells the user to avoid relying solely on the estimate.
- [ ] The physical hand test or another suitable verification cue remains available.
- [ ] The application does not promise that a "safe" band guarantees no injury.
- [ ] Medical or veterinary claims have source support and appropriate review.
- [ ] Marketing copy does not claim "clinical validation" unless the completed validation supports that statement.
- [ ] Model limitations are accessible in the app.

### 9.15 Release mechanics

- [ ] The updated model has a unique algorithm version.
- [ ] Old and new results can be compared in a development-only shadow mode.
- [ ] Shadow-mode comparison records contain no exact GPS location.
- [ ] Rollback to the prior model is possible without an emergency binary release, if the architecture supports configuration.
- [ ] Rollout starts with an internal or limited cohort.
- [ ] Monitoring includes band-change frequency, extreme estimates, missing-input frequency, and provider differences.
- [ ] A named owner reviews unexpected underestimation reports.
- [ ] Rollout criteria and rollback criteria are written before enabling the new model.
- [ ] All mandatory tests above are green in CI.

## 10. Acceptance Criteria

The algorithm is ready to be considered for rollout only when:

1. Every mandatory pre-rollout test passes.
2. Timeline and day/night correctness defects are resolved.
3. Physical temperature is fully separated from dog-specific risk.
4. One threshold configuration is used throughout the product.
5. The algorithm produces uncertainty and confidence information.
6. Golden fixtures are reviewed and frozen.
7. Holdout validation meets predefined error and underestimation limits.
8. Product language accurately reflects an estimate rather than a sensor measurement.
9. The algorithm is versioned and rollback is available.
10. Safety, product, and engineering owners explicitly approve the results.

## 11. Recommended Decision

Proceed with a staged update.

First complete the correctness fixes, because they can materially change displayed results and are independent of model sophistication. Then introduce a lightweight chronological thermal model with longitude-aware solar position, bounded convection, surface-specific response rates, and confidence intervals.

Do not invest heavily in coefficient precision before the test harness and validation framework exist. The most important optimization target is not a small average error; it is preventing dangerous underestimation while communicating uncertainty honestly.

The proposed design remains fast, private, free to compute, and suitable for on-device execution.
