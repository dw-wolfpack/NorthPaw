# NorthPaw Gold-Star Algorithm TDD, Validation, and Regression Specification

**Document Version:** 1.0.0  
**Planning Horizon:** Gold-star algorithm targeted for development over the next 2–4 months  
**Depends On:** `algo_north_star.md`, `algo_update_testdrivedev_testcases.md`, and `algo_udate.md`  
**Scope:** Environmental normalization, exposed-surface thermodynamics, canine heat-load modeling, population vulnerability, private Companion personalization, conservative decision policy, privacy, explainability, validation, and release governance  
**Privacy Constraint:** Personal dog data, outing history, outcomes, and personalized inference remain on-device  
**Safety Constraint:** The system must prefer conservative modification or abstention over unsupported reassurance  
**Purpose:** Define the test and evidence system required to build, validate, release, and maintain the ultimate NorthPaw algorithm

---

## 1. This Is More Than a Unit-Test Plan

The gold-star algorithm cannot be proven trustworthy by automated tests alone.

This specification contains five different evidence classes:

1. **Implementation tests** — prove that code implements the frozen specification.
2. **Scientific validation tests** — measure agreement with independent physical and canine outcome data.
3. **Privacy and security tests** — prove that personal information remains on-device and protected.
4. **Human-factors tests** — prove that owners understand and act on the output as intended.
5. **Operational tests** — prove that updates, failures, monitoring, and rollback behave safely.

All five classes are release-blocking.

Passing unit tests does not establish clinical validity. Passing a validation dataset does not prove privacy. A private system with confusing warnings is not safe. The complete evidence package is the product.

---

## 2. Governing Test Principles

### 2.1 Red, green, refactor

- Write the failing behavioral test before implementation.
- Make the smallest change that satisfies the frozen contract.
- Refactor without altering observable behavior.
- Preserve every fixed-bug test permanently.

### 2.2 Evidence before exactness

No exact coefficient, interval width, threshold, duration, or risk score becomes a blocking expectation until its authority is recorded:

- Published applicable evidence.
- NorthPaw calibration analysis.
- Pre-registered conservative product policy.
- Approved algorithm contract.

### 2.3 Conservative asymmetry

False reassurance is more safety-critical than unnecessary caution.

Acceptance thresholds must separately report:

- Underestimation.
- Risk downgrades.
- False-negative recommendations.
- Missed serious owner-reported responses.

Average error or overall accuracy alone cannot approve a model.

### 2.4 No hidden coupling

Each layer must have a pure, versioned contract:

```text
Weather normalization
    → Surface model
    → Systemic heat model
    → Population vulnerability
    → Private personal model
    → Decision policy
    → Explanation
```

A test failure must identify which layer violated its contract.

### 2.5 Reproducibility

Every assessment must be reproducible from:

- Normalized input snapshot.
- Algorithm version.
- Parameter-pack version.
- Dog-profile version.
- Personal-model version.
- Injected clock.
- Timezone database/version where applicable.
- Deterministic random seed, if sampling is used.

### 2.6 Abstention is valid output

Tests must cover and reward `unable_to_assess`. They must never force the algorithm to manufacture a risk estimate outside its validated domain.

### 2.7 The free layer never depends on Companion

Every current-condition safety test must pass with:

- Companion disabled.
- No history.
- Corrupt personal state.
- Personal database unavailable.

---

## 3. Test Taxonomy and Suggested Suite Layout

```text
lib/algorithm/
  __tests__/
    environmentalNormalization.test.ts
    solarPosition.test.ts
    surfaceEnergyBalance.test.ts
    surfaceEmpiricalModel.test.ts
    surfaceEnsemble.test.ts
    canineThermalLoad.test.ts
    populationVulnerability.test.ts
    decisionPolicy.test.ts
    explanation.test.ts

lib/companion/
  __tests__/
    historyQualification.test.ts
    similarity.test.ts
    bayesianUpdate.test.ts
    seasonality.test.ts
    safetyConstraints.test.ts
    deletionRebuild.test.ts

lib/privacy/
  __tests__/
    dataEgress.test.ts
    exportDeletion.test.ts
    logRedaction.test.ts
    modelPackageVerification.test.ts

integration/
  assessmentPipeline.test.ts
  providerParity.test.ts
  persistenceMigration.test.ts
  uiConsistency.test.ts
  offlineBehavior.test.ts

validation/
  surfaceExternalValidation/
  canineExternalValidation/
  subgroupValidation/
  personalizationProspectiveValidation/
  humanFactors/
```

Scientific evaluation data must not live in ordinary unit-test fixtures if access restrictions or research governance prohibit it. Store immutable hashes and reproducible evaluation manifests where raw data cannot be committed.

---

## 4. Layer 0: Environmental Data and Provenance Tests

### NS-DATA-001: Complete normalized record
- **Input:** Valid NWS fixture with all supported fields.
- **Expected:** Correct units, timestamp, location timezone, source metadata, forecast lead, and empty `imputedFields`.

### NS-DATA-002: Provider semantic parity
- **Input:** NWS and Tomorrow.io fixtures representing the same physical conditions and instant.
- **Expected:** Normalized numerical fields agree within source/rounding tolerance.

### NS-DATA-003: Missing is not zero
- **Input:** Provider omits wind, GHI, humidity, cloud cover, or precipitation.
- **Expected:** Field remains `null`/missing; corresponding provenance and imputation flags are present.

### NS-DATA-004: Full timestamp identity
- **Input:** Repeated clock hours on adjacent dates and DST fall-back.
- **Expected:** Every record remains uniquely addressable by complete instant and source generation.

### NS-DATA-005: Location timezone
- **Input:** Device timezone differs from forecast location timezone.
- **Expected:** Solar/time-window calculations use the location timezone; UI clearly labels the displayed local basis.

### NS-DATA-006: Equivalent instant
- **Input:** Same instant expressed with multiple ISO offsets.
- **Expected:** Identical normalized UTC time, solar position, and physical state.

### NS-DATA-007: Freshness
- **Input:** Same observation with increasing age.
- **Expected:** Freshness quality is non-increasing; risk itself does not become lower because data became stale.

### NS-DATA-008: Forecast horizon
- **Input:** Same data quality at increasing forecast lead.
- **Expected:** Forecast-confidence contribution is non-increasing.

### NS-DATA-009: Provider disagreement
- **Input:** Sources disagree beyond a pre-registered tolerance.
- **Expected:** Uncertainty widens or the assessment abstains; no "lowest risk wins" behavior.

### NS-DATA-010: Issue-generation isolation
- **Input:** Two provider forecast generations overlap.
- **Expected:** A model run cannot combine generations without an explicit reconciliation record.

### NS-DATA-011: Out-of-order network completion
- **Input:** Older fetch completes after newer fetch.
- **Expected:** Older generation cannot replace newer state.

### NS-DATA-012: Invalid unit metadata
- **Input:** Unknown temperature or wind unit.
- **Expected:** Reject/abstain. Never guess.

### NS-DATA-013: Plausibility validation
- **Input:** Non-finite values and values beyond approved physical/provider domains.
- **Expected:** Deterministic rejection, clamp only where explicitly allowed, and lowered evidence quality.

### NS-DATA-014: Weather request minimization
- **Input:** Intercept outbound weather requests.
- **Expected:** Request contains only the minimum location/provider fields; no dog identity, profile, outing history, outcomes, or Companion state.

### NS-DATA-015: Manual coarse location
- **Input:** User selects a general location without precise location permission.
- **Expected:** Weather and free safety layer work; no precise GPS is requested or persisted.

### NS-DATA-016: Provider outage
- **Input:** Primary fails, fallback succeeds.
- **Expected:** Source transition is recorded; provider-specific missing fields affect confidence; personal data is not sent to fallback.

### NS-DATA-017: All providers unavailable
- **Expected:** Typed offline/stale/unavailable state. Never a green default.

### NS-DATA-018: Input provenance completeness
- **Expected:** Every derived field can enumerate direct, inferred, imputed, and unavailable inputs.

---

## 5. Solar Geometry and Radiation Tests

### NS-SOLAR-001: Night below horizon
- **Input:** Clear midnight at representative low, mid, and high latitudes.
- **Expected:** Calculated solar elevation below horizon; zero direct shortwave contribution.

### NS-SOLAR-002: Overcast daytime
- **Input:** Solar elevation above horizon with 100% cloud cover.
- **Expected:** Daytime remains true; radiation uses actual GHI or documented diffuse fallback.

### NS-SOLAR-003: Longitude-aware solar noon
- **Input:** Locations at opposite edges of one timezone.
- **Expected:** Solar noon differs appropriately.

### NS-SOLAR-004: Equation-of-time reference
- **Input:** Published/reference solar-position fixtures across the year.
- **Expected:** Elevation and azimuth remain within the approved angular tolerance.

### NS-SOLAR-005: DST invariance
- **Input:** Same physical instant under standard/daylight clock representations.
- **Expected:** Same solar geometry.

### NS-SOLAR-006: Sunrise/sunset continuity
- **Input:** Five-minute samples spanning the horizon.
- **Expected:** Continuous radiation transition; no boolean step artifact.

### NS-SOLAR-007: Polar day
- **Expected:** Correct continuous-day behavior without invalid trigonometry.

### NS-SOLAR-008: Polar night
- **Expected:** Correct continuous-night behavior without fabricated solar gain.

### NS-SOLAR-009: GHI precedence
- **Input:** Valid positive GHI conflicts with cloud-derived estimate.
- **Expected:** Approved measured/forecast GHI path takes precedence and provenance shows it.

### NS-SOLAR-010: Impossible GHI
- **Input:** Negative, non-finite, or implausible high GHI.
- **Expected:** Reject or cap according to source-aware policy; confidence degrades.

### NS-SOLAR-011: Unknown shade
- **Expected:** Cloud cover cannot be used as route shade. Output says exposed/unknown according to policy.

### NS-SOLAR-012: Explicit route shade
- **Input:** Exposed, mixed, and mostly shaded route settings.
- **Expected:** Shade changes approved solar exposure assumptions and widens uncertainty according to route variability.

---

## 6. Layer 1: Mechanistic Surface Energy-Balance Tests

### NS-SURF-MECH-001: Zero-net-flux equilibrium
- **Input:** Surface equals air/subsurface temperature with zero radiation, zero evaporation, and no gradient.
- **Expected:** No temperature change within numerical tolerance.

### NS-SURF-MECH-002: Energy sign convention
- **Expected:** Absorbed shortwave and incoming longwave warm; emitted longwave, outward convection, conduction to cooler substrate, and evaporation cool.

### NS-SURF-MECH-003: Shortwave absorption
- **Input:** Increase GHI with all other state held constant.
- **Expected:** Absorbed energy and next-step surface temperature do not decrease.

### NS-SURF-MECH-004: Albedo response
- **Input:** Increase albedo under positive GHI.
- **Expected:** Absorbed shortwave and heating do not increase.

### NS-SURF-MECH-005: Longwave emission
- **Input:** Increase surface absolute temperature.
- **Expected:** Outgoing longwave energy increases according to the approved equation.

### NS-SURF-MECH-006: Convective direction
- **Input:** Surface hotter than air, then colder than air.
- **Expected:** Convection acts toward air temperature in both cases.

### NS-SURF-MECH-007: Wind response
- **Input:** Hot surface with increasing valid wind.
- **Expected:** Convective heat loss is non-decreasing within the validated range.

### NS-SURF-MECH-008: Conductive storage
- **Input:** Hot surface over cooler material.
- **Expected:** Heat flows into substrate; later release produces thermal lag.

### NS-SURF-MECH-009: Post-sunset lag
- **Input:** Hot afternoon followed by zero shortwave.
- **Expected:** Surface cools gradually and may remain above air according to material state.

### NS-SURF-MECH-010: Clear-night radiative cooling
- **Input:** Calm clear night with cool sky.
- **Expected:** Model may produce surface below air within validated limits; no universal `surface >= air` invariant at night.

### NS-SURF-MECH-011: Wet-surface evaporation
- **Input:** Identical dry and wet initialized surfaces with evaporation-capable conditions.
- **Expected:** Wet path has documented temporary cooling and greater uncertainty.

### NS-SURF-MECH-012: Wetness depletion
- **Expected:** Available surface water cannot become negative and evaporative cooling ends when depleted.

### NS-SURF-MECH-013: Rain onset
- **Expected:** Rain affects wetness/heat state without an instantaneous unphysical reset unless measurement data supports the step.

### NS-SURF-MECH-014: Time-step convergence
- **Input:** Approved 1-, 5-, and 10-minute integration steps.
- **Expected:** Results converge within pre-registered tolerance.

### NS-SURF-MECH-015: Seven-day stability
- **Expected:** No drift, overflow, oscillatory instability, or accumulated numerical error beyond tolerance.

### NS-SURF-MECH-016: Thirty-day stability
- **Expected:** Same requirements under a longer bounded input sequence.

### NS-SURF-MECH-017: No future leakage
- **Input:** Forecasts identical until cutoff and different afterward.
- **Expected:** States through cutoff are identical.

### NS-SURF-MECH-018: Initialization uncertainty
- **Expected:** Missing prior thermal state widens early prediction intervals and follows documented warm-start policy.

### NS-SURF-MECH-019: State serialization
- **Expected:** Saving/restoring internal thermal state produces the same next-step output as uninterrupted computation.

### NS-SURF-MECH-020: Surface parameter isolation
- **Expected:** Changing one surface parameter pack cannot mutate another.

---

## 7. Surface Material and Applicability Tests

### NS-SURF-MAT-001: Asphalt parameter provenance
- **Expected:** Every parameter includes version, source/calibration record, valid domain, and uncertainty.

### NS-SURF-MAT-002: Concrete parameter provenance
- Same requirements.

### NS-SURF-MAT-003: Turf construction uncertainty
- **Input:** Turf class unknown.
- **Expected:** Wider interval or abstention; never claim a precise universal turf temperature.

### NS-SURF-MAT-004: Natural grass separation
- **Expected:** Natural grass never uses artificial-turf parameters.

### NS-SURF-MAT-005: Sand wet/dry states
- **Expected:** Wet and dry sand use approved separate state/uncertainty behavior.

### NS-SURF-MAT-006: Cobblestone/paver ambiguity
- **Expected:** Unknown material/color/installation widens uncertainty.

### NS-SURF-MAT-007: Unknown surface
- **Expected:** Return unknown/mixed-surface assessment using conservative policy; do not silently default to asphalt without disclosure.

### NS-SURF-MAT-008: Mixed route
- **Input:** Surface proportions summing to 100%.
- **Expected:** Contact-risk policy follows approved worst-segment or exposure-duration rule, not a simple average that hides a severe segment.

### NS-SURF-MAT-009: Invalid mixture
- **Input:** Negative proportions or total not equal to 100% within tolerance.
- **Expected:** Validation failure.

### NS-SURF-MAT-010: Applicability boundary
- **Input:** Weather outside a surface model's validated domain.
- **Expected:** Low confidence or abstention; no extrapolation presented as validated.

---

## 8. Empirical Surface Model Tests

### NS-SURF-EMP-001: Frozen feature contract
- **Expected:** Only approved normalized features are accepted with documented units and transforms.

### NS-SURF-EMP-002: Training/evaluation separation
- **Expected:** Evaluation site, date block, and repeated measurement group cannot appear in development/tuning data.

### NS-SURF-EMP-003: Deterministic inference
- **Expected:** Same model package and inputs produce identical output.

### NS-SURF-EMP-004: Missing-feature handling
- **Expected:** Uses approved imputation with uncertainty or abstains. Missing cannot silently become zero.

### NS-SURF-EMP-005: Domain guard
- **Expected:** Model reports when a feature lies outside training/validation support.

### NS-SURF-EMP-006: Monotonic constraints
- **Expected:** Approved physical monotonicities hold or any exception is documented and validated.

### NS-SURF-EMP-007: Model-package integrity
- **Expected:** Hash/signature mismatch prevents use and falls back safely.

### NS-SURF-EMP-008: Parameter version
- **Expected:** Output records exact empirical model version.

---

## 9. Surface Ensemble and Uncertainty Tests

### NS-SURF-ENS-001: Agreement narrows appropriately
- **Input:** Mechanistic and empirical estimates agree inside expected error.
- **Expected:** Ensemble interval follows frozen combination policy; it cannot become narrower than validation supports.

### NS-SURF-ENS-002: Disagreement widens
- **Input:** Component models materially disagree.
- **Expected:** Interval widens or assessment abstains.

### NS-SURF-ENS-003: Conservative underestimation weighting
- **Expected:** Combination policy explicitly reflects asymmetric cost of underestimation.

### NS-SURF-ENS-004: Component failure
- **Input:** One model unavailable.
- **Expected:** Surviving model may operate only with downgraded confidence and disclosure if validated for standalone use.

### NS-SURF-ENS-005: Both models fail
- **Expected:** Abstain.

### NS-SURF-ENS-006: Interval ordering
- **Expected:** `lower <= median <= upper` for every supported input.

### NS-SURF-ENS-007: Interval coverage regression
- **Input:** Locked evaluation corpus.
- **Expected:** Empirical coverage meets pre-registered target overall and by critical subgroup.

### NS-SURF-ENS-008: Threshold-near uncertainty
- **Input:** Median below policy threshold, upper bound above.
- **Expected:** Decision uses frozen conservative rule.

### NS-SURF-ENS-009: Confidence-risk independence
- **Expected:** High confidence can coexist with high risk; low confidence can coexist with low median. UI and policy never conflate them.

### NS-SURF-ENS-010: Rounding
- **Expected:** Interval and band remain understandable when display rounding collapses nearby values.

---

## 10. Layer 2: Canine Environmental Heat-Load Tests

### NS-HEAT-001: Pure physical input contract
- **Expected:** Model accepts environmental state, dog physical traits, activity, and duration through explicit versioned fields.

### NS-HEAT-002: Pavement independence
- **Expected:** Systemic model does not modify physical pavement estimate.

### NS-HEAT-003: Duration monotonicity
- **Expected:** Longer planned exposure cannot lower predicted thermal load within equivalent conditions.

### NS-HEAT-004: Activity monotonicity
- **Expected:** Higher validated metabolic activity cannot lower predicted load.

### NS-HEAT-005: Solar-exposure monotonicity
- **Expected:** Greater absorbed radiant load cannot lower predicted load.

### NS-HEAT-006: Wind context
- **Expected:** Wind influences heat dissipation through the approved physiology model without creating impossible negative strain.

### NS-HEAT-007: Humidity domain
- **Expected:** Humidity is normalized to 0–100%, validated, and affects panting-related load only as supported.

### NS-HEAT-008: Mass/size domain
- **Expected:** Valid dog sizes operate within calibrated range; values outside it lower confidence or abstain.

### NS-HEAT-009: No core-temperature claim
- **Expected:** If the model is not specifically validated for core temperature, output and copy cannot label its latent score as predicted core temperature.

### NS-HEAT-010: Planned-versus-current
- **Expected:** Assessment evaluates the planned start and full planned horizon, not only current weather.

### NS-HEAT-011: Recovery horizon
- **Expected:** Model can represent continued heat burden after activity ends according to validated dynamics.

### NS-HEAT-012: Post-exercise rise fixture
- **Input:** Validated scenario where heat can continue accumulating briefly after stopping.
- **Expected:** Recovery is not modeled as immediate return to baseline.

### NS-HEAT-013: Water/shade assumptions
- **Expected:** Owner-selected water/shade modify only supported parts of the model and are disclosed as assumptions.

### NS-HEAT-014: Missing activity
- **Expected:** No precise duration advice; conservative default or abstention.

### NS-HEAT-015: Extreme environmental domain
- **Expected:** Hard-stop/abstention rather than uncontrolled extrapolation.

### NS-HEAT-016: Component uncertainty propagation
- **Expected:** Environmental and dog-parameter uncertainty reaches output interval/confidence.

---

## 11. Layer 3: Population Vulnerability Tests

### NS-POP-001: Evidence-registry requirement
- **Expected:** Every active vulnerability factor has source, population, outcome, effect representation, limitations, and review date.

### NS-POP-002: Cosmetic breed label
- **Input:** Same modeled traits, different breed text.
- **Expected:** Same output unless a separately approved breed factor exists.

### NS-POP-003: Brachycephalic factor
- **Expected:** Acts only on validated physiological risk; never changes surface temperature.

### NS-POP-004: Body-condition factor
- **Expected:** Uses explicit owner-entered/veterinary-known body condition when supported; breed-average weight is not a substitute.

### NS-POP-005: Age
- **Expected:** Age behavior follows evidence and domain; no arbitrary senior multiplier.

### NS-POP-006: Prior heat illness
- **Expected:** Makes advice more conservative or triggers veterinary restriction handling; never improves guidance.

### NS-POP-007: Unknown profile
- **Expected:** Missing vulnerability data lowers confidence; cannot default to the lowest-risk profile.

### NS-POP-008: Multiple factors
- **Expected:** Combination follows calibrated interaction/additive policy; arbitrary multiplier stacking is rejected.

### NS-POP-009: Profile change versioning
- **Expected:** Every assessment stores the profile version used.

### NS-POP-010: Unsupported health condition
- **Expected:** System abstains from personalized clearance and recommends veterinary guidance without diagnosis.

### NS-POP-011: Monotonic safety constraints
- **Expected:** Approved vulnerability worsening cannot yield less conservative output.

### NS-POP-012: Subgroup calibration
- **Input:** Locked evaluation sets.
- **Expected:** Pre-registered subgroup calibration and false-negative limits pass or the limitation is exposed operationally.

---

## 12. Layer 4: Companion Data-Capture Tests

### NS-COMP-DATA-001: Minimal structured check-in
- **Expected:** Owner can record primary response in no more than the approved interaction budget; optional fields remain optional.

### NS-COMP-DATA-002: Missing feedback
- **Expected:** No response is stored as missing, never comfortable.

### NS-COMP-DATA-003: Outcome timestamp
- **Expected:** Outcome and recovery records are tied to correct outing and time.

### NS-COMP-DATA-004: Assessment snapshot
- **Expected:** Outing retains the pre-outing assessment/version used at decision time.

### NS-COMP-DATA-005: No default exact GPS
- **Expected:** Personal learning record uses coarse context/grid unless owner explicitly saves a place/location.

### NS-COMP-DATA-006: Severe-warning branch
- **Input:** Owner selects serious warning signs.
- **Expected:** Ordinary learning/recommendation UI stops; emergency-reviewed workflow appears.

### NS-COMP-DATA-007: Severe event exclusion
- **Expected:** Serious event is not treated as an ordinary tolerance observation.

### NS-COMP-DATA-008: Owner-confidence weighting
- **Expected:** Low-confidence self-report is retained but weighted/labeled according to frozen policy.

### NS-COMP-DATA-009: Duplicate check-in
- **Expected:** Retry or app restart does not create duplicate outcomes.

### NS-COMP-DATA-010: Edit history
- **Expected:** Owner correction deterministically rebuilds affected personal state.

---

## 13. Companion Qualification and Maturity Gates

### NS-COMP-GATE-001: Zero outings
- **Expected:** No personal prediction; population model only.

### NS-COMP-GATE-002: One to four qualified outings
- **Expected:** Descriptive history only; no personal duration prediction.

### NS-COMP-GATE-003: Five to fourteen qualified outings
- **Expected:** Early observations allowed; personalization can only make advice more conservative.

### NS-COMP-GATE-004: Fifteen to twenty-nine qualified outings
- **Expected:** Emerging patterns require wide intervals and effective matched sample.

### NS-COMP-GATE-005: Thirty-plus qualified outings
- **Expected:** Personal suggestion eligibility depends on coverage, recency, quality, and prospective validation—not raw count alone.

### NS-COMP-GATE-006: Narrow-context history
- **Input:** 30 cool morning walks, query for hot afternoon.
- **Expected:** No unsupported extrapolation; personal evidence quality is low/none.

### NS-COMP-GATE-007: Low-quality history
- **Input:** Many incomplete or low-confidence records.
- **Expected:** Effective sample stays below raw count and cannot unlock mature behavior improperly.

### NS-COMP-GATE-008: Contradictory outcomes
- **Expected:** Uncertainty widens; system reports inconsistency or abstains.

### NS-COMP-GATE-009: Old history
- **Expected:** Recency decay lowers effective evidence.

### NS-COMP-GATE-010: Profile-changing event
- **Input:** Material age/weight/body-condition/health setting change.
- **Expected:** Affected prior evidence is downweighted or recalibration state begins.

---

## 14. Companion Similarity Tests

### NS-COMP-SIM-001: Identical context
- **Expected:** Maximum documented similarity.

### NS-COMP-SIM-002: Timestamp identity irrelevant
- **Expected:** Different calendar date can still be similar based on approved context, while season/recency remain explicit features.

### NS-COMP-SIM-003: Duration difference
- **Expected:** Large duration mismatch reduces similarity or prevents direct response comparison.

### NS-COMP-SIM-004: Activity difference
- **Expected:** Relief walk cannot be treated as equivalent to hard run.

### NS-COMP-SIM-005: Surface difference
- **Expected:** Grass/shaded route cannot justify asphalt/exposed contact guidance.

### NS-COMP-SIM-006: Humidity/solar tradeoff
- **Expected:** Similarity uses validated feature space; one scalar NPI score cannot make physically different contexts identical.

### NS-COMP-SIM-007: Effective sample
- **Expected:** Weighted effective sample is correctly calculated and never exceeds raw matched count.

### NS-COMP-SIM-008: Threshold gate
- **Expected:** Similar-condition statement is suppressed below effective-sample threshold.

### NS-COMP-SIM-009: Result transparency
- **Expected:** Explanation reports matched count, date range, key similar factors, and important mismatch/uncertainty.

### NS-COMP-SIM-010: No nearest-neighbor desperation
- **Input:** No reasonably similar outing exists.
- **Expected:** System says no comparable history; it does not return the least dissimilar outing as if it were meaningful.

---

## 15. Companion Bayesian Personalization Tests

### NS-COMP-BAYES-001: Population prior
- **Expected:** With no personal data, posterior equals approved profile/population prior.

### NS-COMP-BAYES-002: Conservative shrinkage
- **Input:** One comfortable observation.
- **Expected:** Posterior changes minimally and remains close to prior.

### NS-COMP-BAYES-003: Repeated consistent evidence
- **Expected:** Posterior updates gradually and uncertainty narrows only within observed domain.

### NS-COMP-BAYES-004: Conflicting evidence
- **Expected:** Posterior uncertainty remains wide or widens.

### NS-COMP-BAYES-005: Negative-outcome asymmetry
- **Input:** One credible serious/struggled response after comfortable observations.
- **Expected:** Recommendation becomes immediately more conservative according to frozen policy.

### NS-COMP-BAYES-006: Comfortable outcomes do not erase serious event
- **Expected:** Serious response influence follows explicit durable safety policy.

### NS-COMP-BAYES-007: Missing is not success
- **Expected:** Missing outcome performs no positive update.

### NS-COMP-BAYES-008: No extrapolated confidence
- **Expected:** Posterior uncertainty remains high outside observed feature support.

### NS-COMP-BAYES-009: Seasonal decay
- **Expected:** Prior-season evidence decays/recalibrates according to frozen model.

### NS-COMP-BAYES-010: Recency
- **Expected:** More recent equally reliable evidence has documented greater influence.

### NS-COMP-BAYES-011: Order invariance
- **Input:** Same evidence set in different ingestion orders where the model is mathematically exchangeable.
- **Expected:** Same posterior within numerical tolerance.

### NS-COMP-BAYES-012: Replay reproducibility
- **Expected:** Rebuilding from raw records produces identical personal state.

### NS-COMP-BAYES-013: Deletion rebuild
- **Input:** Delete one influential outing.
- **Expected:** Posterior is rebuilt as if the record never existed.

### NS-COMP-BAYES-014: Model-version migration
- **Expected:** Old posterior is never blindly interpreted by incompatible model; rebuild/migration is deterministic.

### NS-COMP-BAYES-015: Numerical stability
- **Input:** Long history and extreme valid likelihood values.
- **Expected:** No underflow, overflow, `NaN`, or degenerate certainty.

### NS-COMP-BAYES-016: Variance floor
- **Expected:** Personal uncertainty cannot collapse below the approved irreducible uncertainty floor.

### NS-COMP-BAYES-017: Safety-envelope constraint
- **Expected:** Personal posterior cannot relax universal hard stops or extend beyond validated population/physical domain.

### NS-COMP-BAYES-018: Conservative-only early phase
- **Expected:** At early maturity, personal data may escalate but cannot downgrade guidance.

---

## 16. Layer 5: Conservative Decision-Policy Tests

### NS-DEC-001: Independent risk vector
- **Expected:** Surface, systemic, weather-hazard, population, personal, and evidence-quality components remain individually available.

### NS-DEC-002: Surface hard stop
- **Expected:** Severe contact risk cannot be averaged down by favorable systemic conditions.

### NS-DEC-003: Systemic hard stop
- **Expected:** Severe heat load cannot be averaged down by cool ground.

### NS-DEC-004: Active severe weather
- **Expected:** Approved severe hazard takes precedence.

### NS-DEC-005: Personal negative evidence
- **Expected:** Relevant credible struggle history can make action more conservative.

### NS-DEC-006: Personal positive evidence
- **Expected:** Can refine preferences/duration only inside universal validated safety envelope and maturity gates.

### NS-DEC-007: Favorite-window precedence
- **Expected:** Preference never overrides safety.

### NS-DEC-008: High uncertainty
- **Expected:** Conservative bound, modification, or abstention according to policy.

### NS-DEC-009: Missing critical input
- **Expected:** Abstention or conservative fallback; no green default.

### NS-DEC-010: Unsupported health condition
- **Expected:** No exercise clearance; scope limitation and veterinary guidance.

### NS-DEC-011: No favorable period
- **Expected:** Report no favorable window; offer safer alternative without calling least-bad time safe.

### NS-DEC-012: Action monotonicity
- **Expected:** Increasing an independent risk while all else is fixed cannot improve final action.

### NS-DEC-013: Confidence monotonicity
- **Expected:** Removing evidence cannot make the recommendation more confident.

### NS-DEC-014: Duration recommendation
- **Expected:** Precise duration appears only when model maturity, validation, and uncertainty gates pass.

### NS-DEC-015: Emergency signal
- **Expected:** Emergency flow overrides ordinary assessment and personalization.

### NS-DEC-016: Deterministic reason ordering
- **Expected:** Primary reason follows documented severity/contribution policy and remains stable.

### NS-DEC-017: Actionability
- **Expected:** Every non-favorable action includes a feasible modification or clear abstention guidance.

---

## 17. Explanation and Product-Copy Tests

### NS-XPL-001: Four-question contract
- Every result answers:
  - What is recommended?
  - Why?
  - How certain?
  - What should the owner do?

### NS-XPL-002: Estimate not measurement
- **Expected:** Surface output is always labeled estimated unless connected to an approved direct sensor.

### NS-XPL-003: No guarantee
- **Expected:** Reject `"safe"`, `"guaranteed"`, `"will not"`, or equivalent unqualified assurance in safety output.

### NS-XPL-004: No diagnosis
- **Expected:** Reject diagnosis/treatment language outside veterinarian-approved emergency content.

### NS-XPL-005: Personal association language
- **Expected:** Use `"last time"`, `"was associated with"`, or equivalent; reject unsupported causal language.

### NS-XPL-006: Matched-history disclosure
- **Expected:** Personal insight includes effective count, recency/date range, and uncertainty.

### NS-XPL-007: Data-gap disclosure
- **Expected:** Missing GHI, inferred wetness, unknown shade, stale forecast, or provider disagreement is visible when material.

### NS-XPL-008: Primary hazard cannot be hidden
- **Expected:** Highest-severity independent hazard is prominent in explanation.

### NS-XPL-009: Algorithm update notice
- **Expected:** Material change can be communicated in plain language with version/details available.

### NS-XPL-010: Accessibility
- **Expected:** Meaning is available without color, animation, fine motor input, or high reading level.

### NS-XPL-011: Five-second comprehension target
- **Validation:** Representative owners identify action and primary reason within the pre-registered time/success threshold.

### NS-XPL-012: Abstention comprehension
- **Validation:** Owners understand that unable-to-assess is not favorable.

---

## 18. Privacy and Security Tests

### NS-PRIV-001: Network egress inventory
- **Method:** Capture all outbound traffic during onboarding, weather refresh, assessment, outing logging, personal update, export, and deletion.
- **Expected:** Only approved weather/operational endpoints are contacted; no Companion record or dog profile leaves device.

### NS-PRIV-002: Weather payload inspection
- **Expected:** Minimum necessary location only; no dog/profile/history identifiers.

### NS-PRIV-003: Analytics isolation
- **Expected:** Safety inputs, outcomes, exact location, personal parameters, and free text never enter analytics.

### NS-PRIV-004: Crash-report redaction
- **Expected:** Exceptions cannot attach database rows, weather URLs containing more location precision than policy allows, free text, or model state.

### NS-PRIV-005: Log redaction
- **Expected:** Debug/release logs contain no sensitive Companion payloads.

### NS-PRIV-006: At-rest encryption
- **Expected:** Sensitive database/files are protected using approved platform data protection and encryption design.

### NS-PRIV-007: Key storage
- **Expected:** Encryption key is stored in platform secure storage, not source, preferences, logs, or database.

### NS-PRIV-008: Device-lock behavior
- **Expected:** Protected data accessibility matches documented lock-state policy.

### NS-PRIV-009: Backup policy
- **Expected:** Backup inclusion/exclusion matches user promise and is tested on supported platforms.

### NS-PRIV-010: Export completeness
- **Expected:** User export includes their readable personal records and model explanation/version metadata.

### NS-PRIV-011: Export review
- **Expected:** User can inspect what will be exported before sharing.

### NS-PRIV-012: Delete one outing
- **Expected:** Raw record, associated attachments, indexes, similarity caches, and derived personal state are removed/rebuilt.

### NS-PRIV-013: Reset personalization
- **Expected:** Deletes personal posterior/derived state while preserving chosen profile/history according to explicit user choice.

### NS-PRIV-014: Delete all
- **Expected:** Removes profile, history, outcomes, photos, derived state, exports, and keys according to platform limits.

### NS-PRIV-015: Learning opt-out
- **Expected:** Free safety layer works; no new personal model updates occur.

### NS-PRIV-016: No cloud account
- **Expected:** Core and Companion local functionality do not require login or cloud identity.

### NS-PRIV-017: Model update privacy
- **Expected:** Downloading a generic model/parameter pack reveals no personal state.

### NS-PRIV-018: Package signature
- **Expected:** Tampered model package is rejected and safe approved fallback is used.

### NS-PRIV-019: Diagnostic export consent
- **Expected:** Any diagnostic package is user-initiated, previewable, scoped, and stripped of unapproved fields.

### NS-PRIV-020: Exact-location persistence audit
- **Expected:** Exact GPS does not appear in personal learning tables/files unless an explicit owner action requires it.

---

## 19. Persistence and Migration Tests

### NS-PERSIST-001: Fresh install
- **Expected:** Population/free model works with empty local database.

### NS-PERSIST-002: Upgrade from current production schema
- **Expected:** Existing outings/profile survive; new Companion fields default to unknown rather than false.

### NS-PERSIST-003: Migration idempotence
- **Expected:** Re-running migrations has no duplicate/destructive effect.

### NS-PERSIST-004: Interrupted migration
- **Expected:** Transaction rollback or safe resumability.

### NS-PERSIST-005: Corrupt personal state
- **Expected:** Rebuild from raw valid records or discard derived state; free layer remains operational.

### NS-PERSIST-006: Partial record
- **Expected:** Missing optional fields remain unknown and do not imply favorable outcomes.

### NS-PERSIST-007: Historical algorithm version
- **Expected:** Old record remains interpretable; personal rebuild follows documented compatibility.

### NS-PERSIST-008: Clock correction
- **Expected:** Device clock/timezone changes do not silently reorder immutable UTC outing identity.

### NS-PERSIST-009: Multi-dog isolation
- **Expected:** One dog's history and posterior can never affect another dog.

### NS-PERSIST-010: Profile deletion
- **Expected:** Deletes or reassigns dependent data only according to explicit owner choice; no orphan personal state.

---

## 20. External Surface Validation Tests

These are analysis pipelines over locked measured data, not ordinary unit tests.

### NS-VAL-SURF-001: Pre-registered evaluation
- **Expected:** Metrics and pass/fail thresholds are frozen before evaluation data is opened.

### NS-VAL-SURF-002: Site-level separation
- **Expected:** External sites are absent from development and tuning.

### NS-VAL-SURF-003: Time-block separation
- **Expected:** Repeated adjacent measurements cannot leak across development/evaluation split.

### NS-VAL-SURF-004: Instrument quality
- **Expected:** Ground-truth sensors have calibration, accuracy, emissivity/placement, and maintenance records.

### NS-VAL-SURF-005: Overall bias
- **Metric:** Mean signed error with confidence interval.

### NS-VAL-SURF-006: MAE and RMSE
- **Metric:** Report with uncertainty; must meet pre-registered limits.

### NS-VAL-SURF-007: Tail error
- **Metric:** 90th/95th percentile absolute error.

### NS-VAL-SURF-008: Maximum underestimation
- **Metric:** Report every safety-critical miss, not only aggregate.

### NS-VAL-SURF-009: Prediction-interval coverage
- **Expected:** Nominal intervals achieve pre-registered overall and subgroup coverage.

### NS-VAL-SURF-010: Threshold-near performance
- **Expected:** Bias and band classification evaluated near each product-policy threshold.

### NS-VAL-SURF-011: Surface subgroup
- Asphalt, concrete, turf classes, sand states, pavers/cobblestone, natural grass if supported.

### NS-VAL-SURF-012: Climate subgroup
- Dry, humid, coastal, desert, cold/high-latitude, and other intended-use climates.

### NS-VAL-SURF-013: Time-of-day subgroup
- Morning, solar peak, afternoon lag, sunset, and night.

### NS-VAL-SURF-014: Weather subgroup
- Clear, cloudy, windy, calm, wet, drying, and provider-missing-input conditions.

### NS-VAL-SURF-015: External geographic pass
- **Expected:** Acceptance thresholds met at entirely new locations or scope is narrowed.

### NS-VAL-SURF-016: Prospective frozen-model pass
- **Expected:** Frozen algorithm evaluated on data collected afterward without retuning.

---

## 21. External Canine-Risk Validation Tests

### NS-VAL-DOG-001: Ethical protocol
- **Expected:** No pet is intentionally exposed to unsafe conditions; appropriate review/consent/governance exists.

### NS-VAL-DOG-002: Outcome definitions
- **Expected:** Comfortable, modified/slowed, struggled, serious concern, recovery, and any objective measures are defined before collection.

### NS-VAL-DOG-003: Owner versus clinician labels
- **Expected:** Kept separate and evaluated separately.

### NS-VAL-DOG-004: Calibration-in-the-large
- **Expected:** Meets pre-registered range.

### NS-VAL-DOG-005: Calibration slope
- **Expected:** Meets pre-registered range.

### NS-VAL-DOG-006: Calibration curves
- **Expected:** Reported with uncertainty across risk range.

### NS-VAL-DOG-007: Brier score
- **Expected:** Candidate improves or meets approved baseline.

### NS-VAL-DOG-008: Serious-response sensitivity
- **Expected:** Meets pre-registered high-sensitivity requirement.

### NS-VAL-DOG-009: Serious false-negative rate
- **Expected:** Below pre-registered maximum with confidence interval.

### NS-VAL-DOG-010: Specificity/false-positive rate
- **Expected:** Reported to quantify burden; cannot compensate for failing serious false-negative requirement.

### NS-VAL-DOG-011: Predictive values
- **Expected:** Evaluated at real intended-use prevalence.

### NS-VAL-DOG-012: Abstention performance
- **Expected:** Error among non-abstained cases and abstention distribution are both reported.

### NS-VAL-DOG-013: Population baseline comparison
- **Expected:** Complex model must beat a strong simple model on predefined decision/safety metrics.

### NS-VAL-DOG-014: External cohort
- **Expected:** New dogs, owners, locations, and seasons.

### NS-VAL-DOG-015: Prospective frozen-model cohort
- **Expected:** Pass without post hoc coefficient changes.

---

## 22. Subgroup, Fairness, and Coverage Validation

### NS-VAL-SUB-001: Brachycephalic group
- Calibration, sensitivity, false-negative rate, confidence coverage.

### NS-VAL-SUB-002: Non-brachycephalic group
- Same metrics.

### NS-VAL-SUB-003: Body-condition groups
- Same metrics where reliable labels exist.

### NS-VAL-SUB-004: Size/mass groups
- Same metrics.

### NS-VAL-SUB-005: Age groups
- Same metrics.

### NS-VAL-SUB-006: Fitness/activity groups
- Same metrics.

### NS-VAL-SUB-007: Mixed breeds
- Same metrics without forcing unsupported breed inference.

### NS-VAL-SUB-008: Prior heat-illness group
- Evaluate or explicitly exclude with operational abstention.

### NS-VAL-SUB-009: Climate/season groups
- Same metrics.

### NS-VAL-SUB-010: Low-data subgroup
- **Expected:** System lowers confidence/abstains; no unsupported equivalence claim.

### NS-VAL-SUB-011: Worst-group gate
- **Expected:** Overall average cannot approve the model while a safety-critical subgroup fails.

### NS-VAL-SUB-012: Confidence calibration by subgroup
- **Expected:** Confidence labels predict actual reliability similarly or limitations are surfaced.

---

## 23. Prospective Companion Validation

### NS-VAL-COMP-001: Baseline comparison
- **Expected:** Personalized model compared against frozen population-only guidance.

### NS-VAL-COMP-002: Prequential evaluation
- **Method:** Each personal prediction is evaluated only against a future outcome not used to produce it.

### NS-VAL-COMP-003: Small-sample calibration
- **Expected:** Early posterior uncertainty is honest; no premature precision.

### NS-VAL-COMP-004: Mature calibration
- **Expected:** Personal model improves predefined calibration/usefulness metrics after eligibility.

### NS-VAL-COMP-005: Safety non-inferiority
- **Expected:** Personalization does not increase serious false-negative recommendations relative to population baseline.

### NS-VAL-COMP-006: Benefit distribution
- **Expected:** Improvement is not limited to a tiny high-frequency subgroup.

### NS-VAL-COMP-007: Missing-feedback robustness
- **Expected:** Performance remains safe under realistic missingness.

### NS-VAL-COMP-008: Reporting-bias sensitivity
- **Expected:** Sensitivity analyses cover plausible owner-report bias.

### NS-VAL-COMP-009: Season drift
- **Expected:** Recalibration/time decay prevents stale overconfidence.

### NS-VAL-COMP-010: Profile change
- **Expected:** Personal model safely responds to weight, age, condition, or activity change.

### NS-VAL-COMP-011: Similar-condition statement accuracy
- **Expected:** Statements match stored qualified records and do not overstate causality.

### NS-VAL-COMP-012: Recommendation utility
- **Expected:** Owners find recommendations useful without interpreting them as guarantees.

---

## 24. Human-Factors Validation

### NS-HF-001: Primary action comprehension
- Representative users correctly identify the action within the pre-registered time and success threshold.

### NS-HF-002: Primary reason comprehension
- Users correctly identify the dominant hazard.

### NS-HF-003: Estimate versus measurement
- Users understand the surface value is modeled.

### NS-HF-004: Confidence
- Users understand low confidence means uncertainty, not low risk.

### NS-HF-005: Abstention
- Users do not interpret unable-to-assess as favorable.

### NS-HF-006: Personal history
- Users understand "similar prior outings" is not proof of future safety.

### NS-HF-007: Severe warning
- Users identify stop/urgent action correctly without exploring ordinary optimization screens.

### NS-HF-008: Modification
- Users can name the intended safer alternative.

### NS-HF-009: Screen reader
- Complete safety meaning and action available with supported assistive technology.

### NS-HF-010: Color independence
- Risk/action remains understandable without color perception.

### NS-HF-011: Low-literacy/plain-language
- Copy meets approved readability and comprehension goals.

### NS-HF-012: Notification interpretation
- Morning/condition-change alerts do not imply guaranteed clearance.

### NS-HF-013: Stress scenario
- Under time pressure, owners still choose intended conservative action.

### NS-HF-014: Higher-risk dog owners
- Dedicated testing with owners of brachycephalic, senior, overweight, or medically restricted dogs.

---

## 25. Adversarial and Failure-Injection Tests

### NS-RED-001: Unit mutation
- Swap °C/°F, mph/km/h, fraction/percent.
- **Expected:** Validation/tests catch every mutation.

### NS-RED-002: Comparator mutation
- Flip every threshold `<`/`<=`.
- **Expected:** Boundary suite fails.

### NS-RED-003: Missing uncertainty
- Remove upper-bound conservative policy.
- **Expected:** Decision tests fail.

### NS-RED-004: Disable hard stop
- **Expected:** Safety-policy tests fail.

### NS-RED-005: Future leakage
- Introduce use of future thermal state.
- **Expected:** Chronology test fails.

### NS-RED-006: Dog modifies pavement
- Introduce dog multiplier into surface output.
- **Expected:** separation/property tests fail.

### NS-RED-007: Missing treated as zero
- **Expected:** provider/input tests fail.

### NS-RED-008: Personal positive overrules hard stop
- **Expected:** decision/safety-envelope tests fail.

### NS-RED-009: Missing feedback treated as comfortable
- **Expected:** Companion tests fail.

### NS-RED-010: Personal data in analytics
- **Expected:** network/schema privacy tests fail.

### NS-RED-011: Tampered model package
- **Expected:** signature/integrity tests fail closed.

### NS-RED-012: Device clock manipulation
- **Expected:** immutable timestamps/provenance prevent silent record corruption.

### NS-RED-013: Corrupt database
- **Expected:** free layer continues; personal model rebuilds/falls back.

### NS-RED-014: Storage full
- **Expected:** assessment remains safe; failed log is disclosed; no partial corrupt update.

### NS-RED-015: App termination mid-update
- **Expected:** transactional recovery and prior approved model remain available.

### NS-RED-016: Malicious import
- **Expected:** schema, size, type, and version validation prevent code execution/state poisoning.

### NS-RED-017: Extreme repeated negative reports
- **Expected:** Model remains numerically stable and guidance conservative; emergency scope is not normalized away.

### NS-RED-018: Notification race
- **Expected:** stale favorable notification cannot supersede newer severe assessment.

---

## 26. Performance and Mobile Reliability

### NS-PERF-001: Full 36-hour pipeline
- Compute all surfaces, risk layers, windows, and explanation within approved latency on oldest representative device.

### NS-PERF-002: Thirty-day Companion replay
- Rebuild personal state from expected upper-bound history within approved time/memory.

### NS-PERF-003: Multi-dog scaling
- **Expected:** Isolation and performance for maximum supported profiles.

### NS-PERF-004: Background refresh
- **Expected:** Meets battery and execution-time budgets.

### NS-PERF-005: Timeline interaction
- **Expected:** Scrubbing remains responsive while computations are cached/memoized correctly.

### NS-PERF-006: Offline assessment
- **Expected:** No inference network dependency.

### NS-PERF-007: Model package size
- **Expected:** Within app/download/storage budget.

### NS-PERF-008: Memory pressure
- **Expected:** Graceful cache eviction; no personal-data corruption.

### NS-PERF-009: Low-power mode
- **Expected:** Safety assessment remains available with documented refresh behavior.

### NS-PERF-010: Thermal throttling
- **Expected:** No incorrect output due to interrupted computation; atomic result publication.

---

## 27. Regression and Change-Control Suite

### NS-REG-001: Permanent known-bug corpus
- Includes every bug from `algo_update_testdrivedev_testcases.md`.

### NS-REG-002: Versioned golden corpus
- Covers input domain, surfaces, providers, risk bands, confidence states, dog profiles, Companion maturity, and abstentions.

### NS-REG-003: Candidate-versus-approved diff
- Reports all numerical, band, action, reason, interval, and window changes.

### NS-REG-004: Risk downgrade gate
- Every less-conservative change requires evidence and named approval.

### NS-REG-005: Prediction-interval delta
- Narrower intervals require validation evidence.

### NS-REG-006: Subgroup delta
- Candidate cannot improve overall metrics while silently worsening a safety-critical subgroup beyond limit.

### NS-REG-007: Personal-model replay
- Candidate replays representative histories; reports posterior/action changes.

### NS-REG-008: Copy regression
- Claims, terminology, confidence, and emergency text remain approved.

### NS-REG-009: Privacy regression
- Full data-egress and log scan runs for every release candidate.

### NS-REG-010: Migration regression
- Every supported prior schema/model version upgrades successfully.

### NS-REG-011: Rollback rehearsal
- Production-like test proves return to prior model without losing/corrupting history.

### NS-REG-012: Reproducibility archive
- Release stores code commit, model packages, fixtures, hashes, evaluation manifests, and reports.

---

## 28. Governance and Release Tests

### NS-GOV-001: Intended-use review
- Signed and current.

### NS-GOV-002: Model cards
- Complete for every component.

### NS-GOV-003: Evidence registry
- Every coefficient/factor traceable.

### NS-GOV-004: Validation protocol
- Pre-registered before locked evaluation.

### NS-GOV-005: Veterinary copy approval
- Current signatures and review dates.

### NS-GOV-006: Independent audit
- Findings resolved or accepted with explicit scope limitation.

### NS-GOV-007: Privacy audit
- Network and storage behavior matches promise.

### NS-GOV-008: Human-factors report
- Acceptance targets met.

### NS-GOV-009: Incident-response drill
- Team can identify version, disable candidate, communicate, and rollback.

### NS-GOV-010: Monitoring policy
- Monitors failures/drift without uploading private personal data.

### NS-GOV-011: Rollout gates
- Internal → beta → limited → broad progression has explicit pass/fail criteria.

### NS-GOV-012: No unsafe A/B test
- Release configuration cannot randomize weaker safety policy or uncertainty language for engagement.

### NS-GOV-013: Model-package signature
- Only approved packages activate.

### NS-GOV-014: Documentation synchronization
- User-facing limitations, internal docs, model cards, and code versions agree.

### NS-GOV-015: Named multidisciplinary sign-off
- Veterinary, thermophysiology, pavement/thermal engineering, biostatistics, privacy/security, mobile reliability, human factors/accessibility, and product owners approve.

---

## 29. Required Scenario Matrix

The golden and validation corpora must span combinations, not just isolated examples.

### Environmental axes

- Air: extreme cold through extreme heat within intended domain.
- Humidity: dry through saturated.
- Wind: calm through high wind.
- Solar: night, dawn, overcast, broken cloud, full sun.
- Wetness: dry, recently wet, actively wet, drying, unknown.
- Forecast lead: current through maximum supported horizon.
- Data quality: complete, partial, stale, disagreeing providers.
- Latitude: equatorial, mid-latitude, high-latitude.
- Time: normal date, midnight, both DST transitions, polar edge behavior.

### Surface axes

- Asphalt variants.
- Concrete variants.
- Artificial turf classes.
- Dry/wet sand.
- Paver/cobblestone classes.
- Natural grass if supported.
- Mixed/unknown route.
- Exposed, mixed shade, shaded, unknown.

### Dog axes

- Snout morphology.
- Body mass/size.
- Body condition.
- Age.
- Activity/fitness.
- Prior heat event.
- Known unsupported condition.
- Complete, partial, and missing profile.

### Outing axes

- Relief, easy, moderate, hard.
- 5, 15, 30, 60+ minutes within supported scope.
- Shade/water present, absent, unknown.
- Current, planned later, and recovery horizon.

### Companion axes

- No history.
- Sparse history.
- Mature broad history.
- Mature narrow history.
- Conflicting outcomes.
- Serious negative event.
- Missing outcomes.
- Old/seasonally stale history.
- Profile change.
- Multi-dog isolation.

Pairwise or combinatorial generation should cover interactions, with hand-authored golden scenarios for safety-critical intersections.

---

## 30. Proposed 2–4 Month Test Build Sequence

### Weeks 1–2: Foundation

- Configure deterministic test runner and CI.
- Freeze normalized input/output contracts.
- Implement time, unit, provider, and known-bug regression tests.
- Add property-based testing.
- Establish algorithm versioning and golden-fixture review workflow.

### Weeks 3–5: Surface engine

- Implement mechanistic tests before model code.
- Add parameter provenance.
- Build empirical/ensemble harness.
- Stand up surface evaluation pipeline with locked splits.
- Add uncertainty and abstention tests.

### Weeks 6–8: Canine and decision layers

- Freeze intended outcomes and evidence registry.
- Implement duration/activity/population invariants.
- Build conservative vector decision policy.
- Complete copy/explanation and human-factors prototypes.

### Weeks 9–11: Companion foundation

- Implement private schema and low-burden outcomes.
- Add maturity, similarity, Bayesian update, time-decay, deletion/rebuild, and safety-envelope tests.
- Keep production behavior descriptive/conservative until prospective evidence exists.

### Weeks 12–16: Validation and release evidence

- Run external/prospective evaluation according to frozen protocol.
- Run subgroup and personalization analyses.
- Complete privacy/security audit.
- Complete human-factors testing.
- Resolve independent review findings.
- Rehearse staged rollout and rollback.

The calendar does not override evidence. If external or prospective validation is incomplete at four months, ship only the layers whose acceptance criteria are met.

---

## 31. Definition of Done

The North Star algorithm is eligible for controlled rollout only when:

- [ ] All baseline tests in `algo_update_testdrivedev_testcases.md` pass.
- [ ] All applicable implementation tests in this document pass.
- [ ] No known safety-critical bug is waived.
- [ ] Every active coefficient/factor has provenance.
- [ ] Surface model passes locked external and prospective validation.
- [ ] Canine risk layer passes locked external and prospective validation.
- [ ] Serious false-negative and dangerous-underestimation limits pass.
- [ ] Prediction intervals achieve pre-registered coverage.
- [ ] Worst-group/subgroup gates pass or the scope explicitly abstains.
- [ ] Companion is prospectively safer/useful versus population-only baseline.
- [ ] Companion cannot relax universal hard stops.
- [ ] Personal data egress tests show zero Companion/profile/history leakage.
- [ ] Export, deletion, reset, and opt-out work and rebuild derived state correctly.
- [ ] Human-factors targets pass, including five-second action comprehension.
- [ ] Accessibility testing passes.
- [ ] Independent scientific/code/privacy review is complete.
- [ ] Model cards, evidence registry, validation report, and limitations are current.
- [ ] Candidate-versus-approved regression diff has no unexplained downgrade.
- [ ] Model-package signing, staged rollout, monitoring, incident response, and rollback are exercised.
- [ ] Multidisciplinary owners sign the release record.

---

## 32. Final Test Doctrine

The ultimate NorthPaw algorithm should not be trusted because it has many tests.

It should be trusted because:

- Tests make implementation mistakes difficult to hide.
- Independent data make performance claims falsifiable.
- Uncertainty is calibrated rather than decorated onto the UI.
- Personalization remains inside a validated safety envelope.
- Personal data never becomes the price of insight.
- Owners understand what the system means.
- The algorithm can decline to answer.
- Every change can be reproduced, reviewed, monitored, and reversed.

The final release gate is not "all tests green."

It is:

> All implementation tests are green, all pre-registered validation thresholds are met, privacy behavior matches the promise, owners understand the output, and independent reviewers agree the system is fit for its intended use.
