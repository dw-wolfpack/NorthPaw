# NorthPaw Pavement Temperature & Dog Guidance TDD Specification

**Document Version:** 1.0.0  
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

### Test 5.1: Small Brachycephalic Senior Dog (French Bulldog)
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

### Test 5.2: Large Heavy Double-Coated Dog (Bernese Mountain Dog)
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

### Test 5.3: Toy Puppy Single-Coated Dog (Chihuahua)
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

### Test 5.4: Athletic High-Activity Sporting Dog (German Shorthaired Pointer)
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

### Test 5.5: Giant Working Dog (Great Dane)
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
  - `>= 125.0°F`: **Danger (Crimson - Clinical Paw Burn Threshold)**

---

## 7. Test Category 6: Uncertainty & Confidence Intervals

### Test 7.1: Measured GHI High Confidence
- When measured `solarGhi` is provided by weather API:
- `Confidence = High`. Interval width: `± 4°F`.

### Test 7.2: Cloud-Cover Fallback Medium Confidence
- When GHI is missing and solar intensity is estimated via cloud cover:
- `Confidence = Medium`. Interval width: `± 8°F`.

---

## 8. Summary Checklist for CI/CD Pipeline

- [ ] All 15+ TDD test specifications implemented in `lib/weather/__tests__/roadTemp.test.ts`.
- [ ] Physical engine tests pass with zero dog profile inputs.
- [ ] Biological guidance engine tests pass for all dog profile variants (22 lb Frenchie, 95 lb Berner, 6 lb Chihuahua, 58 lb Pointer, 130 lb Great Dane).
- [ ] Golden scenario fixtures frozen in version control.
