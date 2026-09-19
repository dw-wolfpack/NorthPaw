# 05 — TDD Test Scenarios, Edge Cases & Verification Benchmarks

> **Test-Driven Development Specification for the Cold & Winter Decision Engine**  
> *Target: Automated Unit Tests (`jest`), Regression Validation & Verification Criteria*

---

## 1. Physical Surface Invariance in Winter

### Test Spec 1.1: Physical Road Temp Invariance
* **Principle:** Ground surface temperature ($T_{\text{surface}}$) is an objective physical thermodynamic measurement. It must **never** be altered by dog profile traits (snout, coat, weight, age).
* **Test Case:**
  * **Input:** $T_{\text{air}} = 22.0^\circ\text{F}$, $Wind = 15.0\text{ mph}$, $SkyCover = 90\%$, $Surface = \text{'asphalt'}$.
  * **Evaluation across 5 profiles:** Chihuahua (6 lbs), Husky (55 lbs), Frenchie (24 lbs), Great Dane (130 lbs), Senior Golden (70 lbs).
  * **Assertion:** `estimateRoadTempF` yields the **exact same scalar value** across all 5 profiles ($< 0.001^\circ\text{F}$ variance).

### Test Spec 1.2: Nocturnal Radiative Sub-Cooling
* **Input:** $T_{\text{air}} = 34.0^\circ\text{F}$, $SkyCover = 0\%$ (clear sky), $Wind = 2.0\text{ mph}$, $Time = 03:00\text{ local time (night)}$.
* **Assertion:** Ground surface temperature on asphalt drops below freezing:
  $$T_{\text{surface}} < 32.0^\circ\text{F} \quad (\approx 28.0^\circ\text{F} - 30.5^\circ\text{F})$$
* **Clinical Justification:** Verifies black ice hazard detection when ambient air station is above freezing.

---

## 2. Canine Cold Stress Index (CCSI) Breed Divergence

### Test Spec 2.1: The Siberian Husky vs. Toy Chihuahua Benchmark
* **Environmental Inputs:**
  * $T_{\text{air}} = 18.0^\circ\text{F}$ ($-7.8^\circ\text{C}$)
  * $Wind = 15.0\text{ mph}$
  * Effective $WCT_{\text{dog}} \approx 8.5^\circ\text{F}$
  * Daylight, dry conditions.
* **Profiles:**
  * **Dog A (Kodiak):** Siberian Husky, $55\text{ lbs}$, Double Coat, Mesocephalic snout, $4\text{ years old}$.
  * **Dog B (Pico):** Chihuahua, $6\text{ lbs}$, Short Single Coat, Mesocephalic snout, $3\text{ years old}$.
* **Expected Output:**
  * **Dog A (Husky):**
    * $F_{\text{mass}} = 1.00$
    * $F_{\text{coat}} = 0.65$
    * $\text{CCSI} \approx 3.2 - 3.8$ (**GREEN / Optimal to MILD AMBER**)
    * Advisor: *"Cold weather well-tolerated by double coat. Monitor paws on hard surfaces."*
  * **Dog B (Chihuahua):**
    * $F_{\text{mass}} = 1.35$
    * $F_{\text{coat}} = 1.40$
    * $\text{CCSI} \ge 8.0$ (**CRIMSON / Severe Hypothermia Hazard**)
    * Advisor: *"Severe cold risk for small single coat. Limit outing to <10 mins. Insulated jacket required."*
* **Assertion:** $\text{CCSI}_{\text{Chihuahua}} - \text{CCSI}_{\text{Husky}} \ge 4.0\text{ points}$.

---

## 3. Chemical De-Icer Hazard Detection

### Test Spec 3.1: Post-Snowstorm De-Icer Flagging
* **Inputs:**
  * Current $T_{\text{air}} = 29.0^\circ\text{F}$
  * Precip: Recent snow accumulation ($2.5\text{ inches}$ within last 24 hours)
  * Surface: `asphalt` or `concrete` (sidewalks)
* **Expected Outputs:**
  * `isDeicerActive = true`
  * Surface safety band: Elevated to **FREEZING** or **DANGER**
  * NPI Explanation: Mentions chemical de-icing salt burn hazard and recommends paw rinse/booties.

### Test Spec 3.2: Untreated Natural Grass Exemption
* **Inputs:** Same as 3.1, but user selects `surfaceType = 'sand'` or walks on natural trail/park grass.
* **Expected Output:**
  * `isDeicerActive = false` (Municipal road crews do not salt park turf or off-road trails).
  * Salt warning suppressed.

---

## 4. Seasonal Hand-off & Invariance Regressions

### Test Spec 4.1: Temperate Sweet Spot Invariance ($62^\circ\text{F}$)
* **Inputs:** $T_{\text{air}} = 62.0^\circ\text{F}$, $Humidity = 50\%$, $Wind = 8.0\text{ mph}$, $Daytime = \text{true}$.
* **Expected Output:**
  * $\text{NPI}_{\text{heat}} \approx 0.0$
  * $\text{NPI}_{\text{cold}} = 0.0$
  * $\text{NPI}_{\text{unified}} \le 1.2$ (**GREEN / Pristine Ready State**)
  * Road band: `safe` ($65^\circ - 72^\circ\text{F}$)
* **Assertion:** Engine does not trigger false positive warnings in mild spring/fall weather.

### Test Spec 4.2: Summer Extreme Heat Backward Compatibility
* **Inputs:** $T_{\text{air}} = 92.0^\circ\text{F}$, $Humidity = 65\%$, $SolarGHI = 950\text{ W/m}^2$, $Surface = \text{'asphalt'}$.
* **Expected Output:**
  * $T_{\text{surface}} \ge 138.0^\circ\text{F}$
  * $\text{NPI}_{\text{cold}} = 0.0$
  * $\text{NPI}_{\text{unified}} = \text{NPI}_{\text{heat}} \ge 7.8$ (**CRIMSON**)
* **Assertion:** Summer NPI score matches 6.0 production calculation with zero drift.

---

## 5. Brachycephalic Respiratory Cold Response

### Test Spec 5.1: Flat-Faced Bronchial Cold Sensitivity
* **Inputs:** $T_{\text{air}} = 22.0^\circ\text{F}$, $Wind = 10.0\text{ mph}$.
* **Profiles:**
  * **Dog C (Pierre):** French Bulldog, $24\text{ lbs}$, Short Single Coat, Brachycephalic snout ($F_{\text{snout}} = 1.25$).
  * **Dog D (Rex):** German Shorthaired Pointer, $58\text{ lbs}$, Short Single Coat, Dolichocephalic snout ($F_{\text{snout}} = 0.95$).
* **Expected Output:**
  * Dog C (Frenchie) experiences elevated respiratory irritation penalty due to short nasal air warming distance.
  * $\text{CCSI}_{\text{Pierre}} > \text{CCSI}_{\text{Rex}}$.
