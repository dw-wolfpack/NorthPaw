# NorthPaw Pavement Temperature & Dog Guidance TDD Specification

**Document Version:** 1.1.0  
**Target Area:** `lib/weather/roadTemp.ts`, `lib/weather/nwsWeather.ts`, `lib/readiness/`  
**Methodology:** Test-Driven Development (TDD) — Red/Green/Refactor  
**Purpose:** Comprehensive specification of all test cases, golden scenarios, physical invariants, and dog-profile biological evaluations required before releasing the updated algorithm.

---

## 1. TDD Philosophy & Architecture Rules

1. **No Code Without a Failing Test:** Write the test case specification in the test suite before modifying or adding calculation logic.
2. **Strict Separation of Physics & Biology:**
   - **Physical Model (`Physics Engine`)**: Computes surface temperature (°F) and uncertainty intervals based *strictly* on weather physics, solar radiation, wind convection, and surface material properties.
   - **Canine Biology Model (`Guidance Engine`)**: Evaluates dog profile traits (snout profile, coat density, body weight, age group, baseline activity) to calculate the **NorthPaw Protection Index (NPI)** score and optimal walk windows.
   - **Invariant Rule**: Changing a dog's breed, weight, or snout length MUST NEVER alter the physical pavement temperature estimate for a given location and timestamp.

### 1.1 Fixture Authority and Numeric Assertions

Several scenarios below contain exact pavement temperatures, NPI scores, confidence widths, or duration recommendations. Until the new model, coefficients, canonical thresholds, and tolerances have been approved, these values are **provisional scenario targets**, not scientific ground truth.

Before converting a provisional number into a blocking automated assertion, the test must identify one of:

- A frozen, versioned algorithm contract.
- A calibration dataset and analysis.
- A cited external reference applicable to the exact output.
- An explicitly approved conservative product-policy threshold.

Every numeric assertion must define:

- Units.
- Absolute or relative tolerance.
- Algorithm/parameter-pack version.
- Whether the value is an invariant, a regression snapshot, or a validation target.

Tests must not be weakened merely to make a new implementation pass. If a result legitimately changes, the approving reviewer must record why the old expectation was wrong and what evidence supports the replacement.

---

## 2. Test Category 1: Forecast Timeline & Timestamp Integrity

### Test 1.1: 36-Hour Multi-Day Timestamp Deduplication
- **Description:** Verify that a 36-hour forecast containing identical clock hours across multiple calendar days (e.g., 8:00 AM Today vs. 8:00 AM Tomorrow) never allows tomorrow's weather sample to overwrite today's sample in the timeline map.
- **Input:** 36-hour forecast array with duplicate clock hours (`05:00` Day 1 through `17:00` Day 2).
- **Expected Outcome:** Timeline points are keyed strictly by full ISO 8601 UTC timestamps (`YYYY-MM-DDTHH:00:00Z`). Exactly 36 distinct chronological points exist.

### Test 1.2: Local Midnight & Date Rollover
- **Description:** Verify that scrolling or querying across local midnight (`23:00` to `01:00`) maintains chronological ordering and correctly handles calendar day transitions.
- **Expected Outcome:** Timeline segments maintain monotonic time progression without gaps or array reordering.

### Test 1.3: Daylight Saving Time Transitions
- **Description:** Verify timeline integrity across Spring-Forward (23-hour day) and Fall-Back (25-hour day) transitions.
- **Expected Outcome:** No `NaN` values, missing slots, or repeated key overwrites during DST transitions.

---

## 3. Test Category 2: Day/Night & Solar Position Physics

### Test 2.1: Solar Midnight Zero Radiation
- **Description:** Verify that under clear night skies (0% cloud cover at 12:00 AM midnight), solar intensity is strictly 0.
- **Input:** `timeIso = "2026-07-15T00:00:00"`, `skyCover = 0%`, `solarGhi = 0`.
- **Expected Outcome:** `solarIntensity = 0.0`. Surface temperature decays toward night equilibrium (`AirTemp - 3°F` for asphalt).

### Test 2.2: Overcast Midday Solar Gain
- **Description:** Verify that at 12:00 PM noon with 100% cloud cover, diffuse solar radiation is calculated correctly without treating the hour as nighttime.
- **Input:** `timeIso = "2026-07-15T12:00:00"`, `skyCover = 100%`, `latitude = 37.7749`.
- **Expected Outcome:** `isDaytime = true`. Diffuse cloud factor allows ~15% solar transmittance through cloud layer.

### Test 2.3: Solar Elevation Angle Accuracy
- **Description:** Verify solar elevation calculation uses both latitude and longitude to determine true solar noon rather than assuming fixed 12:00 clock time.
- **Input:** Location in western edge of timezone (e.g., El Paso, TX vs. Boston, MA).
- **Expected Outcome:** Solar peak aligns with geographic solar noon rather than hardcoded clock 12:00.

---

## 4. Test Category 3: Surface Physics & Material Invariants

### Test 3.1: Wind Convection Bounding
- **Description:** Verify that high wind speeds pull surface temperature toward ambient air temperature, but never push a sunlit surface below ambient air temperature.
- **Input:** `AirTemp = 85°F`, `SolarGHI = 900 W/m²`, `WindSpeed = 45 mph`.
- **Expected Outcome:** `SurfaceTemp >= AirTemp`. Convection reduces extreme solar buildup but does not produce physically impossible cooling below air temp under direct sun.

### Test 3.2: Thermal Inertia & Post-Sunset Heat Storage
- **Description:** Verify surface temperature decays gradually after sunset rather than dropping instantaneously to night baseline.
- **Input:** Sequence of 3 hours: 5:00 PM (Full Sun 88°F Air / 138°F Asphalt), 7:00 PM (Sunset 82°F Air), 8:00 PM (Dusk 78°F Air).
- **Expected Outcome:** At 8:00 PM, `AsphaltTemp > AirTemp` (e.g., 86°F Asphalt in 78°F air), reflecting stored heat in blacktop matrix.

### Test 3.3: Material Albedo Ordering
- **Description:** Under identical solar radiation (800 W/m²) and air temp (85°F), verify relative temperature hierarchy across all 5 supported materials:
- **Expected Hierarchy:** `Artificial Turf > Sand > Asphalt > Cobblestone > Concrete`.

---

## 5. Test Category 4: Canine Biology & Risk Engine (Various Dogs & Weights)

### Test 4.1: Small Brachycephalic Senior Dog (French Bulldog)
- **Dog Profile:**
  - Breed: French Bulldog
  - Weight: 22 lbs
  - Snout Profile: Flat / Brachycephalic (`flat`)
  - Coat Type: Short / Single
  - Age Group: Senior (9 years)
  - Baseline Activity: Low
- **Environmental Input:**
  - Time: 1:00 PM (Peak Sun)
  - Air Temp: 86°F
  - Surface: Asphalt (Modeled Temp: 134°F)
- **Expected Physical Result:** `AsphaltTemp = 134°F`
- **Expected Biological Guidance:**
  - NPI Score: **9.2 (Crimson / Danger)**
  - Signal: *"Extreme Heat & Pavement Burn Hazard"*
  - Rationale: High respiratory stress from flat snout + low ground clearance + 134°F paw burn risk in <30 seconds.
  - Safe Walk Window: Immediate restriction. Suggest shaded potty break only (<5 mins).

### Test 4.2: Large Heavy Double-Coated Dog (Bernese Mountain Dog)
- **Dog Profile:**
  - Breed: Bernese Mountain Dog
  - Weight: 95 lbs
  - Snout Profile: Long / Standard (`standard`)
  - Coat Type: Heavy Double Coat (`double`)
  - Age Group: Adult (4 years)
  - Baseline Activity: Moderate
- **Environmental Input:**
  - Time: 4:00 PM (Late Afternoon)
  - Air Temp: 82°F
  - Surface: Artificial Turf (Modeled Temp: 145°F)
- **Expected Physical Result:** `TurfTemp = 145°F`
- **Expected Biological Guidance:**
  - NPI Score: **8.5 (Ember / High Risk)**
  - Signal: *"Severe Turf Heat & Thermal Trapping"*
  - Rationale: Heavy double coat traps body heat long after shade opens + artificial turf infill baking at 145°F.
  - Safe Walk Window: Shift walk window to after 7:30 PM when surface cools below 90°F.

### Test 4.3: Toy Puppy Single-Coated Dog (Chihuahua)
- **Dog Profile:**
  - Breed: Chihuahua
  - Weight: 6 lbs
  - Snout Profile: Standard
  - Coat Type: Short Single Coat
  - Age Group: Puppy (6 months)
  - Baseline Activity: High
- **Environmental Input:**
  - Time: 7:30 AM (Early Morning)
  - Air Temp: 72°F
  - Surface: Concrete (Modeled Temp: 88°F)
- **Expected Physical Result:** `ConcreteTemp = 88°F`
- **Expected Biological Guidance:**
  - NPI Score: **1.8 (Green / Low Risk)**
  - Signal: *"Ideal Morning Walking Window"*
  - Rationale: Cool morning concrete + low ambient air heat allows full active outing.

### Test 4.4: Athletic High-Activity Sporting Dog (German Shorthaired Pointer)
- **Dog Profile:**
  - Breed: German Shorthaired Pointer
  - Weight: 58 lbs
  - Snout Profile: Long / Athletic
  - Coat Type: Short Single Coat
  - Age Group: Adult (3 years)
  - Baseline Activity: High / Endurance
- **Environmental Input:**
  - Time: 7:30 PM (Post-Sunset Dusk)
  - Air Temp: 78°F
  - Surface: Asphalt (Modeled Temp: 102°F - Stored Heat Decay)
- **Expected Physical Result:** `AsphaltTemp = 102°F`
- **Expected Biological Guidance:**
  - NPI Score: **4.2 (Amber / Caution)**
  - Signal: *"Warm Surface & Post-Sunset Pavement Heat"*
  - Rationale: High activity baseline reduces maximum recommended continuous run duration; stored pavement heat requires paw monitoring.

### Test 4.5: Giant Working Dog (Great Dane)
- **Dog Profile:**
  - Breed: Great Dane
  - Weight: 130 lbs
  - Snout Profile: Standard
  - Coat Type: Short Single Coat
  - Age Group: Adult (5 years)
  - Baseline Activity: Moderate
- **Environmental Input:**
  - Time: 12:30 PM (High Desert Sun)
  - Air Temp: 102°F
  - Surface: Sand (Modeled Temp: 152°F)
- **Expected Physical Result:** `SandTemp = 152°F`
- **Expected Biological Guidance:**
  - NPI Score: **9.8 (Crimson / Severe Danger)**
  - Signal: *"Extreme Thermal Danger"*
  - Rationale: High ambient heat combined with 152°F sand causes rapid heat stroke and second-degree paw burns.

---

## 6. Test Category 5: Threshold & Boundary Consistency

### Test 6.1: Exact Boundary Classification
- Verify threshold logic uses strict canonical boundaries across code, UI badges, and share cards:
  - `< 77.0°F`: **Safe (Green)**
  - `77.0°F – 99.9°F`: **Warm (Amber)**
  - `100.0°F – 124.9°F`: **Hot (Ember)**
  - `>= 125.0°F`: **Danger (Crimson — current product-policy threshold; do not call this a dog-paw clinical threshold until specifically validated)**

---

## 7. Test Category 6: Uncertainty & Confidence Intervals

### Test 7.1: Measured GHI High Confidence
- When measured `solarGhi` is provided by weather API:
- `Confidence = High`. Interval width: `± 4°F`.

### Test 7.2: Cloud-Cover Fallback Medium Confidence
- When GHI is missing and solar intensity is estimated via cloud cover:
- `Confidence = Medium`. Interval width: `± 8°F`.

---

## 8. Test Category 7 Additions: Input Validation & Defensive Behavior

### Test 7.3: Confidence Interval Ordering
- **Input:** Every golden scenario and generated valid input.
- **Expected Outcome:** `lowerF <= estimateF <= upperF`; all values are finite; interval width is non-negative.

### Test 7.4: Confidence Never Improves When Evidence Is Removed
- **Input:** Scenario A has valid GHI, cloud cover, wind, recent precipitation state, and fresh timestamps. Scenario B is identical but removes one input at a time.
- **Expected Outcome:** Removing evidence cannot increase confidence or narrow the interval unless a documented provider-quality rule explicitly replaces it with better evidence.

### Test 7.5: Forecast-Horizon Degradation
- **Input:** Identical normalized conditions at lead times of 0, 6, 12, 24, and 36 hours.
- **Expected Outcome:** Confidence is non-increasing with forecast lead time. Risk may change only because the conditions change, not because confidence changes.

### Test 7.6: Surface-Specific Uncertainty
- **Input:** Identical conditions for asphalt, concrete, cobblestone, sand, and turf.
- **Expected Outcome:** Each surface uses its configured uncertainty policy. Provisional or weakly validated materials never receive tighter intervals than a better-validated material without evidence.

### Test 8.1: Empty Forecast
- **Input:** `hourly = []`.
- **Expected Outcome:** A typed no-data result is returned. No exception, fabricated estimate, default "safe" state, or stale point appears.

### Test 8.2: Partially Invalid Forecast
- **Input:** Mix of valid samples and samples with invalid timestamps, `NaN`, infinity, missing temperature, and impossible coordinates.
- **Expected Outcome:** Invalid samples are rejected deterministically; valid samples remain usable; confidence reports degradation; no invalid value reaches UI models.

### Test 8.3: Numeric Boundary Matrix
- **Inputs:** Air temperatures at `-40, 0, 40, 77, 100, 120, 140°F`; wind at `0, 1, 10, 30, 60, 100 mph`; cloud cover at `null, 0, 50, 100%`; GHI at `null, 0, 50, 500, 1000, 1400 W/m²`.
- **Expected Outcome:** All valid combinations return bounded finite results or a documented abstention.

### Test 8.4: Invalid Coordinate Handling
- **Input:** Latitudes below -90 or above 90; longitudes below -180 or above 180; non-finite coordinates.
- **Expected Outcome:** Validation fails explicitly. Coordinates are not silently wrapped or clamped.

### Test 8.5: Negative Weather Values
- **Input:** Negative wind speed, negative GHI, cloud cover below 0 or above 100, humidity below 0 or above 100.
- **Expected Outcome:** Each field follows a documented reject-or-normalize policy. No provider-specific accidental behavior leaks into the physics engine.

### Test 8.6: Unit Confusion Guard
- **Input:** Equivalent fixtures expressed in supported source units, including °C/°F and km/h/mph.
- **Expected Outcome:** Normalized records and downstream estimates match within defined floating-point tolerance. A humidity fraction of `0.60` cannot silently be interpreted as `0.60%`.

---

## 9. Test Category 8: Chronological Thermal-State Model

### Test 9.1: Initial-State Policy
- **Input:** First forecast point with no prior surface state.
- **Expected Outcome:** Initialization follows the documented equilibrium/warm-start policy and lowers confidence for the initialization period.

### Test 9.2: Deterministic Sequence
- **Input:** Same ordered 24-hour weather series executed repeatedly.
- **Expected Outcome:** Byte-equivalent or tolerance-equivalent output on every run for the same algorithm and parameter version.

### Test 9.3: Input Order Independence
- **Input:** One chronological series and the same samples randomly shuffled.
- **Expected Outcome:** Normalization sorts by complete timestamp and produces identical chronological estimates.

### Test 9.4: No Future Leakage
- **Input:** Two forecast arrays identical through 2 PM but different after 2 PM.
- **Expected Outcome:** Estimated states through 2 PM are identical. Future weather must not alter earlier output.

### Test 9.5: Cloud Interruption
- **Input:** Several sunny hours, one overcast hour, then sun.
- **Expected Outcome:** The surface cools gradually during the cloud interruption; stored heat is not reset to air temperature.

### Test 9.6: Sunset Continuity
- **Input:** Five-minute steps spanning solar elevation from positive to negative.
- **Expected Outcome:** No discontinuous temperature jump occurs solely because a day/night flag changes.

### Test 9.7: Multi-Day Stability
- **Input:** Seven consecutive days of bounded cyclic weather.
- **Expected Outcome:** Model state remains finite and stable; no cumulative drift beyond the physical/configured range.

### Test 9.8: Time-Step Sensitivity
- **Input:** Same scenario computed at supported internal steps, such as 1, 5, and 10 minutes.
- **Expected Outcome:** Results remain within an approved convergence tolerance.

### Test 9.9: Warm Evening Regression
- **Input:** Hot sunny afternoon followed by declining air temperature and zero GHI.
- **Expected Outcome:** Asphalt can remain above air temporarily and converges rather than instantly applying `air - 3°F`.

### Test 9.10: Cold Clear Night Regression
- **Input:** Clear, calm winter night with no preceding hot state.
- **Expected Outcome:** Longwave/radiative cooling may permit a surface below air according to the approved model. The test does not globally enforce `surface >= air` at night.

---

## 10. Test Category 9: Weather-Provider Normalization

### Test 10.1: Equivalent NWS and Tomorrow.io Conditions
- **Input:** Provider fixtures representing the same timestamp and physical conditions.
- **Expected Outcome:** Normalized points match within unit-rounding tolerances and yield materially consistent estimates.

### Test 10.2: Tomorrow.io Clear Midnight Regression
- **Input:** Midnight, cloud cover below 100%, zero GHI.
- **Expected Outcome:** Classified as nighttime from solar position. Cloud cover must not determine daytime.

### Test 10.3: Tomorrow.io Overcast Noon Regression
- **Input:** Noon, 100% cloud cover, positive solar elevation.
- **Expected Outcome:** Classified as daytime with diffuse/forecast radiation handling.

### Test 10.4: NWS Wind Range Parsing
- **Input:** `"5 to 10 mph"`, `"10 mph"`, `"Calm"`, malformed strings, and gust-bearing variants.
- **Expected Outcome:** A documented conservative parsing rule is used. Missing/malformed wind lowers data quality rather than silently becoming a trustworthy zero.

### Test 10.5: Provider Missing-Field Semantics
- **Input:** Omit GHI, cloud cover, humidity, precipitation, and wind individually.
- **Expected Outcome:** `missing` remains distinct from a physical zero and is recorded in `imputedFields`.

### Test 10.6: Provider Disagreement
- **Input:** Two current sources differ beyond approved tolerances for air temperature, wind, or solar input.
- **Expected Outcome:** The selected-source rule is explainable; confidence widens or the assessment abstains. The friendlier forecast is never selected merely because it lowers risk.

### Test 10.7: Stale Forecast
- **Input:** Otherwise complete weather issued beyond the freshness limit.
- **Expected Outcome:** Result is labeled stale, confidence degrades, and the UI cannot display it as live.

### Test 10.8: Cache Generation Isolation
- **Input:** Forecast refresh B arrives while forecast A is cached.
- **Expected Outcome:** A timeline cannot combine samples from two forecast issue generations.

---

## 11. Test Category 10: Physics/Biology Separation and Guidance Invariants

### Test 11.1: Dog-Profile Permutation
- **Input:** One environmental/surface fixture evaluated against every supported snout, coat, weight, age, and activity combination.
- **Expected Outcome:** Every profile receives exactly the same physical surface estimate and interval.

### Test 11.2: Profile Changes Affect Only Approved Guidance Fields
- **Input:** Change one dog trait at a time.
- **Expected Outcome:** Snapshot diff proves only documented guidance fields change; weather provenance, physical surface output, and provider confidence are identical.

### Test 11.3: No Absolute-Fahrenheit Multiplication
- **Input:** Inspect public guidance-engine contract and execute representative profiles at 32°F, 60°F, and 90°F surface temperatures.
- **Expected Outcome:** No dog multiplier is applied to absolute Fahrenheit. Personalization acts on physiological/contact-risk policy.

### Test 11.4: Monotonic Duration
- **Input:** Same dog/environment with planned durations of 5, 15, 30, and 60 minutes.
- **Expected Outcome:** Longer duration cannot lower systemic heat guidance risk.

### Test 11.5: Monotonic Activity
- **Input:** Same dog/environment/duration with relief, easy, moderate, and hard activity.
- **Expected Outcome:** Increasing intensity cannot lower systemic heat guidance risk.

### Test 11.6: Missing Profile Does Not Default to Low Risk
- **Input:** No dog profile or partially completed profile.
- **Expected Outcome:** Physical estimates still work; biological confidence is limited; guidance uses an approved conservative/general fallback and explains the gap.

### Test 11.7: Severe Surface Hazard Cannot Be Averaged Away
- **Input:** Comfortable air conditions with a surface estimate in the highest canonical hazard band.
- **Expected Outcome:** Final guidance is at least as severe as the surface hard-stop policy regardless of other favorable factors.

### Test 11.8: Severe Systemic Hazard Cannot Be Averaged Away
- **Input:** Low surface-contact risk but extreme validated whole-body heat conditions.
- **Expected Outcome:** Final guidance remains severe.

### Test 11.9: Profile Symmetry
- **Input:** Two dogs with identical modeled traits but different names, photos, and breed labels.
- **Expected Outcome:** Guidance is identical. Cosmetic identity fields cannot affect safety calculations.

---

## 12. Test Category 11: Best-Window Selection

### Test 12.1: Complete-Timestamp Selection
- **Input:** Today and tomorrow both contain favorable 7 AM points.
- **Expected Outcome:** Today's requested window references today's complete timestamp.

### Test 12.2: No Favorable Window
- **Input:** Every point violates the approved conservative policy.
- **Expected Outcome:** Return "no favorable window" plus safer alternatives. Never select the least dangerous point and label it safe.

### Test 12.3: Discontinuous Favorable Hours
- **Input:** Favorable at 6-8 AM and 7-9 PM, unfavorable between.
- **Expected Outcome:** Two distinct windows are returned; they are not merged across the unsafe interval.

### Test 12.4: Missing Hour Inside a Window
- **Input:** Favorable 6 AM and 8 AM with missing 7 AM.
- **Expected Outcome:** The result does not imply a continuous 6-9 AM window unless interpolation is explicitly approved and labeled.

### Test 12.5: Activity Reduction Direction
- **Input:** A 4-hour candidate window and a configured high-activity reduction.
- **Expected Outcome:** Window adjustment follows a documented rule and cannot arbitrarily trim only the safer end.

### Test 12.6: Current-Time Exclusion
- **Input:** A favorable window that has already ended.
- **Expected Outcome:** It is not promoted as an upcoming recommendation.

### Test 12.7: Uncertainty-Aware Window
- **Input:** Median below a threshold but upper conservative bound above it.
- **Expected Outcome:** Window classification follows the canonical uncertainty policy.

---

## 13. Test Category 12: Canonical Threshold and Copy Regression Matrix

### Test 13.1: Epsilon Boundary Table
- **Input:** For every threshold `T`, evaluate `T - 0.01`, `T`, and `T + 0.01`.
- **Expected Outcome:** Correct band classification with no floating-point gap or overlap.

### Test 13.2: Single Source of Truth
- **Expected Outcome:** Physics/guidance logic, Home timeline, modal, share card, analytics payload, notifications, and documentation fixtures consume the same versioned threshold definition.

### Test 13.3: Legacy Threshold Regression
- **Input:** Temperatures from 99°F through 106°F.
- **Expected Outcome:** UI and risk guidance cannot disagree because one uses 100°F while another uses 105°F.

### Test 13.4: Non-Clinical Language
- **Expected Outcome:** Product-policy boundaries are never rendered as universal clinical dog-paw thresholds without approved evidence.

### Test 13.5: No Guarantee Language
- **Expected Outcome:** Snapshot/copy tests reject unqualified phrases such as `"safe"`, `"guaranteed"`, `"will not burn"`, or `"can tolerate"` in recommendation contexts unless specifically approved.

---

## 14. Test Category 13: Regression Test Suite

### Test 14.1: Current Known-Bug Fixtures
Create explicit failing-then-fixed tests for:

- [ ] Tomorrow's clock hour overwriting today's.
- [ ] Clear midnight classified as daytime by cloud cover.
- [ ] Overcast noon classified as nighttime.
- [ ] Dog-risk multiplier changing physical Fahrenheit.
- [ ] Code/documentation/UI threshold mismatch.
- [ ] Immediate post-sunset reset to `air - 3°F`.
- [ ] High wind subtracting surface temperature implausibly below the applicable equilibrium.

These tests remain permanently after the bug is fixed.

### Test 14.2: Approved Golden-Master Corpus
- **Input:** Version-controlled scenarios spanning every surface, band, provider, confidence state, season, timezone pattern, and dog-profile class.
- **Expected Outcome:** Candidate output matches approved versioned expectations within explicit tolerances.

### Test 14.3: Intentional Snapshot Update Process
- **Expected Outcome:** Golden snapshots cannot be bulk-updated without a recorded algorithm-version change, reason, reviewer, and before/after risk summary.

### Test 14.4: Prior-Release Comparison
- **Input:** Candidate and current approved algorithms run over the complete corpus.
- **Expected Outcome:** A machine-readable diff reports temperature delta, interval delta, band changes, recommended-window changes, and guidance severity changes.

### Test 14.5: No Unexplained Risk Downgrades
- **Expected Outcome:** Every candidate change from a more severe to a less severe recommendation is reviewed and tied to evidence. CI should flag, not silently approve, all such deltas.

### Test 14.6: Algorithm-Version Reproducibility
- **Input:** Persisted historical input snapshot and version metadata.
- **Expected Outcome:** The matching historical algorithm reproduces the stored assessment within tolerance.

### Test 14.7: Random-Seed Independence
- **Input:** If any probabilistic interval method is used, run with approved fixed seeds and repeated production configurations.
- **Expected Outcome:** Tests are reproducible; production uncertainty does not vary in a user-confusing way.

### Test 14.8: Serialization Round Trip
- **Input:** Every public estimate/guidance result.
- **Expected Outcome:** Encode/decode preserves values, units, timestamps, confidence reasons, and version metadata.

---

## 15. Test Category 14: UI and End-to-End Integration

### Test 15.1: Home/Modal/Share Consistency
- **Input:** Same selected timestamp and surface.
- **Expected Outcome:** Rounded temperature, band, confidence, and source timestamp agree across Home, detail modal, and share card.

### Test 15.2: Selected-Hour Identity
- **Input:** DST fall-back day with two local 1 AM samples.
- **Expected Outcome:** Selection is bound to the intended complete timestamp, not ambiguous hour label.

### Test 15.3: Surface Switch
- **Expected Outcome:** Switching surface recomputes physical estimates and dependent guidance but does not refetch or mutate weather.

### Test 15.4: Loading/Error/Abstention States
- **Expected Outcome:** Loading, permission denied, unavailable, stale, low confidence, and unable-to-assess are visually and semantically distinct. None defaults to green/ready.

### Test 15.5: Accessibility
- **Expected Outcome:** Screen-reader labels announce estimate status, units, band, confidence, and action without relying only on color.

### Test 15.6: Rounding Near Thresholds
- **Input:** Estimates immediately below and above a band boundary that round to the same displayed integer.
- **Expected Outcome:** Displayed text and band do not appear contradictory; rounding policy is documented.

### Test 15.7: Physical Verification Prompt
- **Expected Outcome:** The hand/surface-check prompt appears according to canonical policy and is never suppressed by favorable dog-profile factors.

---

## 16. Test Category 15: Persistence, Cache, and Migration

### Test 16.1: Cache Freshness
- **Expected Outcome:** Cached weather and assessments retain `issuedAt`, `fetchedAt`, lead time, provider, algorithm version, and stale state.

### Test 16.2: Offline Last-Known Behavior
- **Input:** Network unavailable with valid cached data.
- **Expected Outcome:** Last-known estimates remain available with visible age and degraded confidence; they are not labeled current.

### Test 16.3: Corrupt Cache
- **Input:** Truncated or invalid serialized cache.
- **Expected Outcome:** App falls back to typed unavailable/loading behavior without crash or fabricated safe guidance.

### Test 16.4: Model-Version Cache Invalidation
- **Input:** Cached result from an older algorithm version.
- **Expected Outcome:** It is either reproducibly displayed as historical or recomputed from retained inputs; it is never relabeled as the new model's output.

### Test 16.5: Migration Idempotence
- **Expected Outcome:** Running the same schema/data migration twice produces the same valid state without duplicate records.

---

## 17. Test Category 16: Property-Based and Metamorphic Tests

### Test 17.1: Finite-Output Property
- Generate thousands of valid inputs across the approved domain.
- **Expected Outcome:** Every result is finite, ordered, versioned, and serializable.

### Test 17.2: Solar Monotonicity
- Holding other inputs and prior state constant, increase valid absorbed solar energy.
- **Expected Outcome:** The next-step equilibrium/temperature cannot decrease outside explicit wetness or phase-change behavior.

### Test 17.3: Convective Direction
- For `surface > air`, increasing convection cannot increase surface temperature.
- For `surface < air`, convection cannot drive it still farther from air.

### Test 17.4: Coordinate/Timezone Equivalence
- Represent the same instant in different ISO offsets.
- **Expected Outcome:** Solar position and physical result are identical when location and instant are identical.

### Test 17.5: Duplicate-Input Idempotence
- Reprocessing an identical provider payload must not duplicate timeline points or alter model state.

### Test 17.6: Dog-Identity Irrelevance
- Randomize names, photos, and IDs while preserving modeled traits.
- **Expected Outcome:** Safety output remains identical.

---

## 18. Test Category 17: Performance and Operational Reliability

### Test 18.1: Mobile Performance Budget
- **Input:** Maximum supported forecast length and every surface.
- **Expected Outcome:** Complete computation stays within the approved latency and memory budget on the representative oldest supported device.

### Test 18.2: UI Responsiveness
- **Expected Outcome:** Recalculation does not block interaction or timeline scrubbing.

### Test 18.3: No-Network Inference
- **Expected Outcome:** Core estimate/guidance functions perform zero network calls and succeed using normalized/cached inputs.

### Test 18.4: Battery/Refresh Cadence
- **Expected Outcome:** Normal background refresh cadence remains within the approved battery budget and does not recompute unchanged forecasts unnecessarily.

### Test 18.5: Concurrent Refresh
- **Input:** Two overlapping weather refreshes complete out of order.
- **Expected Outcome:** Older results cannot replace the newer forecast generation.

---

## 19. Test Category 18: Test Harness and CI Enforcement

### Test 19.1: Explicit Test Command
- **Expected Outcome:** `package.json` contains a deterministic non-watch CI test command with documented setup. Transitive Jest packages alone do not count as a configured test runner.

### Test 19.2: Test File Boundaries
- Recommended suites:
  - `lib/weather/__tests__/solarPosition.test.ts`
  - `lib/weather/__tests__/weatherNormalization.test.ts`
  - `lib/weather/__tests__/surfaceThermalModel.test.ts`
  - `lib/weather/__tests__/timelineModel.test.ts`
  - `lib/readiness/__tests__/guidanceEngine.test.ts`
  - `lib/readiness/__tests__/thresholds.test.ts`
  - Integration tests for Home/detail/share consistency.

### Test 19.3: Deterministic Timezone Environment
- **Expected Outcome:** Tests explicitly set timezone or use a timezone-aware library/contract. Results cannot depend on the CI host timezone.

### Test 19.4: Fake Clock Isolation
- **Expected Outcome:** Current-time behavior uses an injected clock. Tests never depend on the wall-clock time when executed.

### Test 19.5: Coverage Gate
- **Expected Outcome:** Branch coverage is required for threshold logic, provider fallbacks, abstention, invalid-input handling, and hard-stop safety policy. Overall percentage alone is insufficient.

### Test 19.6: Mutation Testing for Safety Boundaries
- **Expected Outcome:** Mutations that flip comparison operators, remove uncertainty checks, bypass hard stops, or change units are killed by the suite.

### Test 19.7: Flake Gate
- **Expected Outcome:** The complete suite passes repeatedly with zero nondeterministic failures before merge.

---

## 20. Updated Summary Checklist for CI/CD Pipeline

- [ ] All mandatory TDD specifications are implemented in focused unit and integration suites.
- [ ] A deterministic CI test command exists and succeeds from a clean checkout.
- [ ] Physical engine tests pass with zero dog profile inputs.
- [ ] Biological guidance engine tests pass for all dog profile variants (22 lb Frenchie, 95 lb Berner, 6 lb Chihuahua, 58 lb Pointer, 130 lb Great Dane).
- [ ] Golden scenario fixtures frozen in version control.
- [ ] Known-bug regression fixtures remain permanently green.
- [ ] Full-timestamp, timezone, DST, and provider-normalization tests pass.
- [ ] Invalid input produces a typed failure/abstention rather than default safe guidance.
- [ ] Threshold, UI, notification, analytics, and documentation behavior share one canonical policy.
- [ ] Candidate-versus-prior-release diff contains no unexplained risk downgrade.
- [ ] Property-based physical invariants pass across the approved domain.
- [ ] Offline, stale-cache, corrupt-cache, and version-migration tests pass.
- [ ] Performance succeeds on the oldest supported representative device.
- [ ] Product copy does not imply measurement, guarantee, diagnosis, or unsupported clinical validation.
- [ ] Every provisional numeric assertion has been replaced by an approved, sourced, versioned expectation before it becomes a release blocker.
