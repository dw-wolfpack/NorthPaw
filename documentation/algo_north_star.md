# NorthPaw Algorithm North Star

**Document type:** Long-term product, science, privacy, and validation doctrine  
**Scope:** Pavement temperature, environmental risk, dog-specific risk, outing recommendations, and the private Companion intelligence layer  
**Mission constraint:** Personal data and personalized inference remain on-device  
**Product constraint:** Core current-condition safety information remains free forever  
**Safety posture:** Decision support, not diagnosis; conservative under uncertainty; capable of abstaining  
**North-star standard:** A system trusted because its evidence, limitations, uncertainty, behavior, and change history are inspectable

---

## 1. The Mission

NorthPaw exists to help dogs live longer, healthier, happier lives by giving owners better information—not by collecting more of their data.

Every algorithmic feature must pass three questions:

1. Does it help dogs?
2. Does it respect the owner's privacy?
3. Does it make the recommendation meaningfully better?

If the answer to all three is yes, build it.

If any answer is no, do not.

The algorithm exists to reduce uncertainty before and during an outing. It must not manufacture certainty, encourage owners to test a dog's limits, or turn ordinary behavior into unsupported medical conclusions.

---

## 2. The Product Promise

### Free forever

NorthPaw's immediate safety utility must never be held behind a subscription:

- Current environmental readiness.
- Exposed-surface temperature estimates.
- Basic dog-profile adjustments.
- Safety guidance.
- Confidence and data-quality information.
- High-risk warnings and physical-verification guidance.
- Clear limitations and emergency warning signs.

Safety is not the upsell.

### Companion

Companion sells private longitudinal insight:

- Walk history.
- Personal response patterns.
- Favorite outing windows.
- Seasonal comparisons.
- Recovery patterns.
- Notifications based on the dog's own history.
- Similar-condition recall.
- Calm observations such as:
  - "Last time conditions were similar, Aoife slowed after about 30 minutes."
  - "Aoife has recovered more slowly on humid afternoon walks than on equally warm morning walks."
  - "Your recent comfortable outings have clustered before 9 AM."

Companion does not sell access to basic safety. It creates value by remembering what an owner would otherwise have to remember, then interpreting that history carefully and privately.

---

## 3. What the North Star Is—and Is Not

The North Star is not one perfect equation or a larger NPI formula.

It is a layered safety-decision system:

```text
Environmental data and provenance
                 ↓
Physical surface and exposure models
                 ↓
Population-level canine vulnerability
                 ↓
Private individual response history
                 ↓
Conservative decision policy
                 ↓
Action + explanation + uncertainty + verification
```

The system must keep distinct things distinct:

- A physical surface estimate is not a dog's physiological state.
- A breed-level association is not an individual diagnosis.
- Similar past conditions are not proof of the same future response.
- A comfortable prior walk is not evidence that hotter conditions are safe.
- A low predicted risk is not a guarantee.
- Confidence in the input data is not the same as confidence in the biological outcome.
- A personalized recommendation is not permission to override observable distress.

---

## 4. The Trust Contract

NorthPaw earns trust by consistently following these rules.

### 4.1 Never claim measurement when estimating

Use:

- "Estimated exposed-surface temperature."
- "Lower modeled risk."
- "Conditions look more favorable."
- "Based on forecast data and Aoife's recent history."

Avoid:

- "The pavement is exactly 118°F."
- "This is safe."
- "Your dog can tolerate 30 minutes."
- "Clinically proven" without completed, applicable validation.

### 4.2 Never hide uncertainty

Every material recommendation must carry:

- An estimate or risk state.
- An uncertainty range where appropriate.
- A confidence/data-quality state.
- The important reasons behind the output.
- A verification or safer alternative when uncertainty matters.

### 4.3 Never average away a severe hazard

A single severe dimension must not disappear inside a friendly aggregate score.

For example, good air conditions cannot cancel dangerous pavement. Low pavement risk cannot cancel an extreme systemic heat burden. A severe active weather alert cannot be averaged into "moderate."

The final decision policy should be conservative and monotonic:

```text
Final action severity >= severity of any independent hard-stop hazard
```

### 4.4 Never learn through risky experimentation

NorthPaw must not encourage an owner to try a hotter, longer, or more strenuous outing merely to improve the personal model.

Personalization learns from naturally occurring, owner-chosen outings inside the validated safety envelope.

### 4.5 Never let sparse history create confidence

The app must distinguish:

- No personal evidence.
- Early descriptive history.
- Emerging pattern.
- Stable, well-covered personal evidence.

If history is sparse or narrow, Companion must say so.

### 4.6 Never silently change the meaning of a score

Every result must be reproducible from:

- Algorithm version.
- Parameter-pack version.
- Input snapshot.
- Dog-profile version.
- Personal-model version.

Material model updates require release notes and renewed validation.

---

## 5. Intended Use and Safety Boundary

### Intended use

NorthPaw helps an owner plan ordinary outdoor activity by summarizing forecast conditions, estimating exposed walking-surface temperature, identifying dog-level vulnerability factors, and recalling the dog's owner-reported response to similar past outings.

### Not intended for

- Diagnosing heatstroke, burns, respiratory distress, cardiac disease, or any medical condition.
- Replacing veterinary advice.
- Clearing a medically vulnerable dog for exercise.
- Monitoring a dog left unattended.
- Certifying a route as safe.
- Predicting exact core body temperature without validated sensor inputs.
- Recommending exercise after warning signs appear.

### Emergency boundary

When an owner reports severe warning signs such as collapse, confusion, loss of coordination, vomiting with distress, seizure, unresponsiveness, or breathing difficulty, the personalization algorithm stops.

The app must:

1. Stop presenting ordinary outing optimization.
2. Display an emergency-oriented message that the signs can be serious.
3. Direct the owner to stop activity, begin appropriate immediate first-aid guidance only if veterinarian-reviewed, and contact urgent veterinary care.
4. Exclude the event from ordinary "tolerance learning."

Emergency copy and first-aid content require veterinary authorship, source control, and scheduled review.

---

## 6. The North-Star Output

The internal system should never reduce the world to one number. It should produce a risk vector:

```ts
type NorthPawAssessment = {
  version: AssessmentVersion;
  evaluatedAt: string;
  horizon: AssessmentHorizon;

  environment: {
    systemicHeatLoad: RiskEstimate;
    exposedSurfaceContact: RiskEstimate;
    precipitationAndTraction: RiskEstimate;
    airQualityAndWeatherHazards: RiskEstimate;
  };

  dog: {
    populationVulnerability: RiskEstimate;
    individualResponse: PersonalEstimate | null;
  };

  evidence: {
    weatherQuality: EvidenceQuality;
    surfaceModelQuality: EvidenceQuality;
    populationEvidenceQuality: EvidenceQuality;
    personalEvidenceQuality: EvidenceQuality;
  };

  decision: {
    action: 'favorable' | 'modify' | 'short_relief_only' | 'avoid' | 'abstain';
    primaryReason: string;
    supportingReasons: string[];
    saferAlternative: string | null;
    verificationStep: string | null;
  };
};
```

The Home screen may still show a simple, glanceable state. The simplicity belongs in presentation, not in the underlying reasoning.

### Recommended public state language

| State | Meaning | Example action |
|---|---|---|
| Favorable | No modeled hazard exceeds the favorable policy under current evidence | Normal outing with ordinary observation |
| Modify | One or more factors warrant a shorter, shaded, slower, or softer-surface outing | Change timing, route, duration, or intensity |
| Short relief only | Conditions materially constrain normal exercise | Brief essential outing only |
| Avoid | A validated hard-stop threshold or serious hazard is present | Delay or use a safer alternative |
| Unable to assess | Inputs or applicability are inadequate | Verify conditions directly or use conservative default |

"Unable to assess" is a successful safety behavior, not a product failure.

---

## 7. Layer 0: Environmental Data and Provenance

The algorithm can only be as trustworthy as its inputs.

### 7.1 Allowed external dependency

Weather is the necessary external input. All dog profile, outing history, owner feedback, personalization, and recommendations remain on-device.

When requesting weather:

- Send only the location precision necessary to resolve the forecast grid.
- Never attach dog identity, profile, outing history, device-generated personal identifiers, or Companion outputs.
- Prefer coarse or grid-based coordinates when provider accuracy permits.
- Cache weather locally with source and freshness metadata.
- Allow a manually selected general location for owners who do not want device location.

No claim of "all data stays on device" should obscure the fact that a location-based weather request necessarily reveals some location information to a weather provider. The promise must be precise:

> Personal dog data and Companion history never leave the device. Weather requests use only the minimum location needed to retrieve conditions.

### 7.2 Normalized weather contract

All providers should normalize into a single versioned structure:

```ts
type EnvironmentalObservation = {
  timestampUtc: string;
  locationTimeZone: string;
  coordinatePrecision: 'grid' | 'coarse' | 'precise';

  airTempF: number | null;
  relativeHumidityPct: number | null;
  windSpeedMph: number | null;
  windGustMph: number | null;
  cloudCoverPct: number | null;
  solarGhiWm2: number | null;
  precipitationRate: number | null;
  recentPrecipitation: boolean | null;
  weatherHazards: string[];

  source: string;
  sourceIssuedAt: string | null;
  fetchedAt: string;
  forecastLeadMinutes: number;
  stationDistanceMiles: number | null;
  imputedFields: string[];
};
```

### 7.3 Data-quality score

Quality must be computed separately from risk:

- Freshness.
- Forecast horizon.
- Source distance/resolution.
- Missing inputs.
- Imputed inputs.
- Provider disagreement.
- Actual GHI versus inferred solar load.
- Recent precipitation knowledge.
- Timezone certainty.

High confidence does not mean low risk. It means the system has better evidence about the risk.

### 7.4 Provider reconciliation

If more than one provider is available:

- Do not silently select whichever produces the friendlier answer.
- Compare normalized values.
- Widen uncertainty when providers materially disagree.
- Log the provider-selection reason on-device.
- Prefer measured or higher-resolution inputs according to a documented hierarchy.

---

## 8. Layer 1: Exposed-Surface Thermal Model

### 8.1 Goal

Estimate the distribution of exposed-surface temperature over time for each supported surface—not a falsely exact point value.

### 8.2 Gold-standard model form

Use a time-stepped surface energy balance, supported by an independently validated empirical model.

A conceptual energy balance is:

```text
Surface heat storage =
  absorbed shortwave solar radiation
  + incoming longwave radiation
  - emitted longwave radiation
  - convection to air
  - conduction into the material
  - evaporative cooling when wet
```

One simplified form:

```text
Csurface × dTsurface/dt =
  absorptivity × GHI
  + longwaveIn
  - emissivity × sigma × Tsurface^4
  - convectionCoefficient(wind) × (Tsurface - Tair)
  - conductionCoefficient × (Tsurface - Tsubsurface)
  - evaporation
```

This is solved chronologically at a small internal time step, such as five minutes, while presenting hourly results.

It remains computationally trivial on-device.

### 8.3 Why two models

The gold standard uses:

1. A mechanistic energy-balance model.
2. An empirical model trained and externally validated on real surface measurements.

The two models form a conservative ensemble:

- Agreement narrows uncertainty.
- Disagreement widens uncertainty.
- The conservative decision layer gives greater weight to plausible underestimation.

The empirical model corrects real-world biases the simplified physics may miss. The physical model improves transportability beyond one training location.

### 8.4 Surface parameter packs

Each surface needs a versioned parameter distribution rather than a single multiplier:

- Solar absorptivity/albedo.
- Emissivity.
- Effective heat capacity.
- Conductivity/thermal response.
- Wetness response.
- Wind sensitivity.
- Validated temperature and weather domain.
- Between-installation variability.

Initial support levels should be explicit:

| Surface | North-star evidence target |
|---|---|
| Asphalt | Fully calibrated and externally validated |
| Concrete | Fully calibrated and externally validated |
| Artificial turf | Separate model families for major construction/infill classes or deliberately wide uncertainty |
| Sand | Validated for dry and wet states |
| Cobblestone/pavers | Multiple material/color classes or deliberately wide uncertainty |
| Natural grass | Separate living-surface model; never treat as artificial turf |
| Unknown/mixed route | Conservative mixture using owner-selected proportions or worst plausible surface |

### 8.5 Shade

The estimate is for exposed surfaces unless shade is known.

Route shade should enter only through:

- Explicit user selection such as exposed, mixed, or mostly shaded.
- A future on-device route/shade model with separately validated inputs.
- Direct observation.

NorthPaw must not infer route shade from generic cloud cover.

### 8.6 Wetness

Recent precipitation can cool a surface temporarily, but evaporation and patchiness make the effect uncertain.

Wetness logic must:

- Use recent observations when available.
- Decay wetness over time according to solar, temperature, wind, and surface.
- Never assume an entire route is wet.
- Widen uncertainty when wetness is inferred.

### 8.7 Surface outputs

For every time and surface:

```ts
type SurfaceEstimate = {
  medianF: number;
  lowerF: number;
  upperF: number;
  predictionInterval: 0.95;
  confidence: 'high' | 'medium' | 'low';
  exposureAssumption: 'exposed' | 'mixed_shade' | 'shaded' | 'unknown';
  wetnessAssumption: 'dry' | 'wet' | 'mixed' | 'unknown';
  applicabilityWarnings: string[];
};
```

Safety decisions should use an approved conservative statistic, such as the upper prediction bound, when underestimation could cause harm.

---

## 9. Layer 2: Environmental Physiological Load

Pavement contact and whole-body heat stress are separate hazards.

### 9.1 Inputs

- Air temperature.
- Relative humidity.
- Solar radiation.
- Wind.
- Activity intensity.
- Expected outing duration.
- Shade.
- Access to water.
- Acclimation season.
- Dog mass and body condition when known.
- Dog morphology and respiratory vulnerability.

### 9.2 Model strategy

The ultimate model should be based on a validated canine thermal framework rather than an improvised human heat index.

Published canine thermal modeling has used meteorological conditions, dog physical characteristics, and activity/metabolic intensity to predict core temperature under exertional heat strain. That is the appropriate scientific direction, but NorthPaw must validate any adapted model for pet dogs and ordinary outings before using it operationally.

The model should estimate a range of thermal strain under a proposed outing plan:

```text
Expected thermal load over duration
  = environment
  × activity
  × dog heat-production profile
  × heat-dissipation constraints
```

It must not claim to predict actual core temperature unless the specific implementation and population have been validated to do so.

### 9.3 Duration matters

Risk is not only a property of the current weather. It accumulates with time and exertion.

NorthPaw should assess:

- Right now.
- At the planned start time.
- Across the proposed duration.
- During the expected recovery period.

A 10-minute relief walk and a 60-minute run must not receive the same recommendation under identical weather.

### 9.4 Post-exercise risk

The model must recognize that body temperature may continue rising after exercise stops.

Advice and Companion learning should include recovery, not just the moment the walk ends:

- Time until breathing appears near baseline.
- Whether shade/water/cooling was needed.
- Whether the dog remained unusually tired.

---

## 10. Layer 3: Population-Level Canine Vulnerability

### 10.1 Evidence hierarchy

Dog modifiers must be accepted in this order:

1. Large, applicable observational studies with adjusted risk estimates.
2. Prospective physiological studies.
3. Validated canine thermal models.
4. Veterinary consensus with transparent evidence review.
5. Expert opinion, visibly labeled and conservatively weighted.

Marketing intuition is not evidence.

### 10.2 Candidate factors

Factors with plausible or published relevance include:

- Brachycephalic morphology and respiratory function.
- Body condition/overweight status.
- Body mass and size.
- Age.
- Prior heat-related illness.
- Diagnosed respiratory or cardiac limitations.
- Fitness/training state.
- Acclimation and season.
- Activity intensity.
- Coat characteristics, where evidence supports the specific use.

The system should prefer direct traits over breed stereotypes. Breed may suggest questions or priors, but owners should be able to correct the profile.

### 10.3 No unsupported multipliers

Avoid arbitrary rules such as:

```text
flat face = risk × 1.15
double coat = risk × 1.10
```

unless those exact transformations have been calibrated and validated for the exact output.

Instead:

- Store evidence-backed effect distributions.
- Propagate modifier uncertainty.
- Apply modifiers to physiological risk, not pavement temperature.
- Document the population and outcome from which each factor came.

### 10.4 Monotonic safety constraints

Where supported by evidence and product policy:

- Greater activity intensity must not reduce modeled strain.
- Longer duration must not reduce modeled strain.
- A prior serious heat event must not make advice less conservative.
- Worsening respiratory limitation must not improve the recommendation.
- Missing vulnerability information must not increase confidence.

---

## 11. Layer 4: The Private Companion Model

This is the heart of the long-term product.

Companion learns how this dog has responded—not how far the owner can push the dog.

### 11.1 What Companion stores

Each outing should create a private, structured on-device record:

```ts
type CompanionOuting = {
  id: string;
  algorithmVersion: string;
  startedAt: string;
  durationMinutes: number | null;

  context: {
    outingType: string | null;
    intensity: 'relief' | 'easy' | 'moderate' | 'hard' | null;
    surfaceMix: SurfaceMix | null;
    shade: 'exposed' | 'mixed' | 'mostly_shaded' | null;
    waterAvailable: boolean | null;
  };

  environmentSnapshot: PrivateEnvironmentSnapshot;
  preOutingAssessment: NorthPawAssessment;

  response: {
    completedAsPlanned: boolean | null;
    slowedEarlierThanUsual: boolean | null;
    soughtShade: boolean | null;
    heavyPanting: boolean | null;
    recoveryMinutesBand: string | null;
    footLiftingOrSurfaceAvoidance: boolean | null;
    stoppedEarly: boolean | null;
    nextDayEnergy: 'lower' | 'usual' | 'higher' | null;
    severeWarningSigns: string[];
    ownerConfidence: 'low' | 'medium' | 'high' | null;
  };
};
```

### 11.2 Minimize burden

The post-walk check-in should take five to ten seconds:

1. "How did Aoife handle it?" — Comfortable / Slowed / Struggled / Serious concern.
2. Optional context — stopped early, heavy panting, avoided pavement, recovery slower than usual.
3. Optional recovery check later.

Free text can be retained for the owner, but the learning model should use structured fields unless an on-device, validated extraction method is introduced.

### 11.3 Learn a response envelope, not a limit

Companion estimates:

- Conditions associated with comfortable outings.
- Conditions associated with modification or early stopping.
- Duration and intensity patterns.
- Recovery patterns.
- Seasonal shifts.
- Surface-avoidance patterns.

It does not estimate:

- "Maximum safe temperature."
- "Maximum tolerable duration."
- A diagnosis.
- Permission to exceed population safety limits.

### 11.4 Hierarchical Bayesian personalization

The preferred gold-standard personal model is an interpretable hierarchical Bayesian model with conservative priors:

```text
Population evidence
       ↓
Dog-profile prior
       ↓
This dog's quality-weighted observations
       ↓
Posterior response distribution
```

Why this approach:

- It handles small samples honestly.
- It retains uncertainty.
- It shrinks sparse personal data toward vetted population knowledge.
- It can run on-device.
- It can be constrained for safety.
- It is explainable.
- It avoids the opacity and instability of unconstrained black-box retraining.

### 11.5 Personalization maturity gates

| Qualified outings | Allowed behavior |
|---:|---|
| 0-4 | No personal prediction; show population model and descriptive history only |
| 5-14 | Surface simple observations; no precise duration claim; personalization can only make advice more conservative |
| 15-29 | Emerging patterns with wide intervals; similar-condition recall when effective matched sample is sufficient |
| 30+ | Calibrated personal suggestions may be considered, subject to coverage, recency, and validation |

Raw counts are not enough. A dog with 30 cool morning walks has no evidence for hot afternoon behavior.

### 11.6 Effective sample and similarity

For "last time conditions were similar," the app should:

1. Define similarity using validated features.
2. Weight matches by environmental and outing-context distance.
3. Require a minimum effective sample size.
4. Show the number and date range of relevant outings.
5. Include outcome variability.
6. Abstain if matches conflict or are too old.

Example:

> Based on 6 similar humid, moderate walks from the last 90 days, Aoife slowed earlier than usual on 4. Consider 15–20 minutes with shade.

Avoid:

> Aoife can safely walk for 20 minutes.

### 11.7 Time decay and seasonality

Personal history should not be weighted forever.

Weight should account for:

- Recency.
- Season/acclimation.
- Age or health-profile changes.
- Bodyweight/body-condition changes.
- Medication or veterinary restriction changes.
- Long gaps in activity.

A profile change should trigger recalibration or invalidate affected historical assumptions.

### 11.8 Negative-outcome asymmetry

Safety learning is asymmetric:

- One credible serious adverse response must immediately make guidance more conservative.
- Many comfortable low-risk walks must not erase a serious response.
- Comfortable outings do not justify extrapolation beyond observed conditions.
- Missing feedback must not be treated as a comfortable outcome.

### 11.9 Bias and confounding

Owner-reported history is observational:

- Owners choose when and where to walk.
- Owners may shorten a walk because the app warned them.
- More attentive owners may report more symptoms.
- A dog's behavior can reflect excitement, pain, fear, illness, or terrain—not heat alone.

Therefore Companion should use phrases such as "was associated with" and "last time," not causal language such as "humidity caused."

### 11.10 No universal-core mutation

Personal learning must never rewrite:

- Physical surface coefficients.
- Universal hazard thresholds.
- Emergency rules.
- Population evidence.
- Provider normalization.

It may adjust the recommendation inside the validated envelope and may always become more conservative.

---

## 12. Layer 5: Conservative Decision Policy

### 12.1 Inputs remain separate

The decision engine considers:

- Surface contact risk.
- Systemic heat load.
- Weather hazards.
- Population vulnerability.
- Personal response evidence.
- Input and model uncertainty.
- Planned duration and intensity.

### 12.2 Lexicographic safety logic

The system should use explicit precedence:

1. Emergency or active severe hazard rules.
2. Validated hard-stop rules.
3. High-confidence severe component risks.
4. Conservative upper-bound risk when uncertainty is high.
5. Personal evidence that makes advice more conservative.
6. Personal evidence that refines timing or duration within safe bounds.
7. Preference optimization.

Favorite times and habit convenience come last.

### 12.3 Recommendations are modifications

The engine should prefer actionable changes:

- Go earlier or later.
- Choose a softer or shaded route.
- Reduce duration.
- Reduce intensity.
- Bring water.
- Take breaks.
- Perform a physical surface check.
- Delay.

The recommendation should name the factor that matters most.

### 12.4 Abstention policy

Abstain when:

- Core inputs are missing or stale.
- The environment is outside the validated domain.
- Providers disagree beyond tolerance.
- The selected surface lacks adequate evidence.
- The dog has a relevant condition outside the model scope.
- Personal observations conflict strongly.
- Model components disagree in a safety-critical range.

An abstention must still help:

> NorthPaw cannot estimate this route confidently because surface exposure is unknown and forecast sources disagree. Choose shade, check the surface directly, and keep the outing brief.

---

## 13. Privacy Architecture

### 13.1 Zero-egress personal data

The following never leave the device:

- Dog identity and photo.
- Breed/profile attributes.
- Health-related settings.
- Outing history.
- Exact saved routes or coordinates.
- Post-walk responses.
- Personal tolerance model.
- Similar-condition matches.
- Personalized notifications.
- Free-text notes.

No cloud account is required.

### 13.2 Data minimization

Do not store a field merely because it may someday be useful.

Every field requires:

- A named product or safety purpose.
- A retention rule.
- A user-visible explanation.
- A deletion path.
- A validation plan if used algorithmically.

### 13.3 Location

Recommended policy:

- Use precise location transiently only when necessary to resolve weather.
- Quantize or convert to a forecast-grid identifier before persistence.
- Do not retain exact GPS in Companion training records by default.
- Store human-readable place labels only when the owner chooses.
- Provide a "do not save location" control.
- Strip location from exports unless explicitly included.

### 13.4 At-rest protection

- Use the platform's data-protection facilities.
- Encrypt sensitive database content or the database container.
- Store encryption keys in the platform keychain/secure storage.
- Exclude Companion data from unprotected logs and crash payloads.
- Use file protection appropriate to device-lock state.
- Define backup behavior clearly.

### 13.5 On-device inference

Deterministic math and Bayesian updating should run directly in the app.

If a learned model is ultimately justified, Core ML can run and even personalize models on-device. However, Core ML is an implementation option—not permission to use a black box. The model must still meet explainability, calibration, validation, monotonicity, and versioning requirements.

### 13.6 Export and deletion

Owners must be able to:

- View what Companion has learned.
- Export their records in a readable format.
- Delete an outing.
- Reset personalization without deleting the dog profile.
- Delete all local data.
- Disable future learning while retaining basic free safety features.

Deletion must also remove derived personal parameters influenced by the deleted records, or rebuild them deterministically from the remaining records.

### 13.7 Analytics

Safety and Companion history must not be sent to product analytics.

If aggregate product telemetry is used:

- It is off by default or clearly consented according to the product policy.
- It contains no exact location, dog identity, free text, outing outcomes, or personal-model parameters.
- Safety functionality does not depend on consent.
- The data dictionary is public or inspectable.

---

## 14. Explainability

Every recommendation should answer four questions:

1. What does NorthPaw recommend?
2. What are the top reasons?
3. How certain is it?
4. What can the owner do?

Example:

> **Modify this outing**  
> Exposed asphalt may reach 116–129°F during your planned window. Humidity also raises Aoife's expected heat load. Based on 5 similar outings, she slowed earlier than usual on 3.  
> **Try:** 20 minutes before 9 AM, mostly shaded, with a surface check first.  
> **Confidence:** Medium—solar radiation is forecast rather than measured.

The explanation should show:

- Environmental facts.
- Surface assumptions.
- Dog-profile factors.
- Personal-history contribution.
- What would change the recommendation.

It should never imply that animations or calculation complexity are evidence.

---

## 15. Validation Program

"Fully vetted" must have an operational definition.

### 15.1 Governance team

Before a gold-standard release, named reviewers should include:

- At least two practicing veterinarians with canine emergency or sports-medicine relevance.
- A veterinary thermophysiology or canine exercise researcher.
- A pavement/materials or environmental heat-transfer engineer.
- A biostatistician experienced in prediction models.
- A privacy/security engineer.
- A mobile reliability engineer.
- A human-factors/accessibility reviewer.
- Representative dog owners, including owners of higher-risk dogs.

No single expert can approve the whole system.

### 15.2 Pre-registered protocol

Before fitting or tuning:

- Define intended use.
- Define outcomes.
- Define inclusion/exclusion criteria.
- Define predictors.
- Define missing-data handling.
- Define train/calibration/evaluation splits.
- Define subgroup analyses.
- Define acceptance thresholds.
- Define adverse underestimation.
- Freeze the statistical analysis plan.

This prevents choosing success criteria after seeing results.

### 15.3 Surface-temperature dataset

Collect instrumented measurements across:

- Multiple geographic regions.
- Dry, humid, coastal, desert, and high-latitude climates.
- All seasons.
- Morning, midday, afternoon, evening, and night.
- Clear, cloudy, windy, calm, recently wet, and drying conditions.
- New and aged surfaces.
- Light and dark variants.
- Exposed and shaded sites.
- Multiple turf constructions.

Ground truth should include calibrated contact or infrared measurements with documented emissivity, sensor accuracy, placement, maintenance, and timestamps.

### 15.4 Canine-response dataset

The physiological/personalization layer requires ethically collected data:

- No protocol intentionally exposes pet dogs to unsafe conditions.
- Use routine outings, controlled low-risk exercise studies, or appropriately governed working-dog research.
- Record activity intensity and duration.
- Use objective measurements where ethical and practical.
- Keep owner-reported outcomes separate from clinician-observed outcomes.
- Define severe signs independently of the prediction model.

### 15.5 Dataset separation

Maintain:

- Development data.
- Tuning/calibration data.
- Locked internal evaluation data.
- External geographic evaluation data.
- Prospective post-freeze evaluation data.

No evaluation dog, site, or time series should leak into development through repeated measurements.

### 15.6 Surface-model metrics

At minimum report:

- Bias/mean error.
- Mean absolute error.
- RMSE.
- Median absolute error.
- 90th and 95th percentile absolute error.
- Maximum underestimation.
- Prediction-interval coverage.
- Calibration of interval width.
- Error by surface.
- Error by climate.
- Error by solar intensity.
- Error by wind.
- Error by wetness.
- Error by time of day.
- Error near every product threshold.

Average error alone is insufficient. Dangerous underestimation is the primary safety metric.

### 15.7 Dog-risk metrics

For each defined outcome:

- Sensitivity and false-negative rate for serious responses.
- Specificity and false-positive rate.
- Positive and negative predictive value at real prevalence.
- Calibration-in-the-large.
- Calibration slope.
- Calibration curves.
- Brier score.
- Discrimination, while recognizing that AUROC alone is insufficient.
- Decision-curve or net-benefit analysis.
- Abstention rate.
- Performance conditional on confidence level.

### 15.8 Subgroup evaluation

Predefine and evaluate, with adequate sample sizes:

- Brachycephalic versus non-brachycephalic.
- Body-condition groups.
- Size/mass groups.
- Age groups.
- Coat groups only where reliably defined.
- Fitness/activity groups.
- Mixed breeds.
- Prior heat-illness history.
- Climate and season.
- Urban versus rural environments.

If subgroup evidence is inadequate, the model must lower confidence or abstain—not assume equivalence.

### 15.9 Personalization evaluation

Personalization must outperform the non-personalized baseline prospectively:

- Better calibration for that dog over time.
- No increase in serious false-negative recommendations.
- Reliable uncertainty at small sample sizes.
- Correct response to profile changes and seasonal drift.
- Benefit across dogs, not only frequent loggers.
- No degradation when owners skip feedback.

Evaluate against a strong simple baseline. Complexity is justified only by measurable safety or usefulness.

### 15.10 Human-factors validation

Test whether owners:

- Understand "estimate" versus "measurement."
- Understand confidence.
- Notice an abstention.
- Identify the main risk.
- Choose the intended safer action.
- Avoid interpreting "favorable" as a guarantee.
- Understand that prior comfort does not prove future safety.
- Can act within five seconds on the Home screen.

High predictive performance is insufficient if the presentation causes unsafe decisions.

### 15.11 Independent review

Before broad launch:

- Commission an independent code and model audit.
- Provide the frozen model card and validation report.
- Reproduce results from locked fixtures.
- Review privacy claims against actual network behavior.
- Red-team timezone, provider, missing-data, unit, and extreme-weather failures.
- Conduct veterinary review of all high-risk and emergency copy.

---

## 16. Gold-Star Acceptance Standard

The system may be described internally as "gold standard" only when:

1. Intended use and exclusions are frozen.
2. Every component has a versioned model card.
3. Physical temperature and dog physiology are separate.
4. Personalization cannot relax universal hard stops.
5. All personal learning runs on-device.
6. Personal data egress tests prove the privacy promise.
7. Surface models have external geographic and temporal validation.
8. Dog-risk models have external and prospective validation.
9. Prediction intervals achieve predefined coverage.
10. Dangerous underestimation remains below a predefined acceptance threshold.
11. Subgroup performance is acceptable or limitations are surfaced.
12. The system abstains outside its validated domain.
13. Companion provides measurable benefit over the non-personalized baseline.
14. Human-factors testing shows owners interpret recommendations correctly.
15. Independent reviewers reproduce the key results.
16. All mandatory tests in `algo_udate.md` pass.
17. Rollback and incident-response mechanisms have been exercised.
18. Veterinary, engineering, statistics, privacy, and product owners sign off.

Until then, use "evidence-informed estimate" rather than "validated" or "trusted algorithm."

---

## 17. Model Cards and Evidence Registry

Maintain a repository of version-controlled records:

```text
documentation/algorithm/
  intended_use.md
  evidence_registry.md
  risk_policy.md
  privacy_model.md
  validation_protocol.md
  validation_report.md
  human_factors_report.md
  incident_response.md
  models/
    surface-asphalt-vX.Y.md
    surface-concrete-vX.Y.md
    systemic-heat-vX.Y.md
    population-vulnerability-vX.Y.md
    companion-personalization-vX.Y.md
```

Each model card includes:

- Owner.
- Intended use.
- Exclusions.
- Inputs and units.
- Output semantics.
- Training/calibration data.
- Evaluation data.
- Performance and confidence intervals.
- Subgroup performance.
- Known failure modes.
- Ethical/privacy considerations.
- Change history.
- Next review date.

Every coefficient should trace to:

- A source.
- A calibration analysis.
- An expert-approved conservative policy.

No mystery constants.

---

## 18. Change Control

### 18.1 Frozen production model

Production algorithms are immutable until a new signed version is released.

On-device personalization updates only the individual posterior/state inside the approved personal-model design. It does not change the shipped population or physical models.

### 18.2 Update package

Every model update includes:

- Version identifier.
- Reason for change.
- Changed parameters or logic.
- Validation delta.
- Expected output changes.
- Compatibility rules for old history.
- Migration plan.
- Rollback target.

### 18.3 No unsafe experiments

Do not A/B test:

- Weaker warning thresholds.
- Removal of uncertainty language.
- Recommendations outside the validated envelope.
- Emergency guidance.

Safety-policy experiments require formal review and cannot optimize for engagement.

### 18.4 Shadow mode

Before rollout, run the candidate model locally in shadow mode:

- The existing approved model controls the UI.
- The candidate produces comparison results on-device.
- Differences are summarized without uploading personal records.
- Test users may explicitly export a diagnostic package after reviewing its contents.

### 18.5 Rollout

1. Internal scientific fixtures.
2. Staff/test devices.
3. Explicit beta cohort.
4. Limited production cohort.
5. Broader release after monitoring gates pass.

Rollback triggers include:

- Unexplained increase in lower-risk classifications.
- Extreme or non-finite outputs.
- Provider-specific drift.
- Prediction-interval coverage failure.
- Serious user-reported underestimation.
- Privacy or data-egress defect.

---

## 19. On-Device Reliability

The safety engine must work without a live backend after weather is cached.

Requirements:

- Pure, deterministic core calculations.
- Bounded memory and CPU.
- No dependency on an LLM.
- No network call during inference.
- Last-known data clearly labeled with age.
- Algorithm and parameter packages bundled or cryptographically verified.
- Database migrations preserve and validate personal history.
- Corrupted personal state falls back to the population model.
- A failed Companion model never disables the free safety layer.
- Timezone and unit conversions are centralized and tested.

The simplest validated model wins. A complex model that is difficult to verify or maintain is not the north star.

---

## 20. Companion UX North Star

Companion should feel like a careful memory, not surveillance.

### Morning

> **Aoife's best window is 7:10–8:35 AM.**  
> Pavement risk rises later, and she has recovered more slowly on humid afternoon walks. Mostly shaded would be better after 9.

### Before an outing

> **Modify this one.**  
> Conditions resemble 5 prior outings where Aoife slowed early. Try 15–20 minutes, easy pace, shaded route.

### During a change in conditions

> **Conditions changed.**  
> Sun exposure is higher than forecast. Recheck the ground and shorten the route if Aoife is panting harder than usual.

### After an outing

> **How did Aoife handle it?**  
> Comfortable · Slowed · Struggled · Serious concern

### Weekly

> **A pattern worth knowing**  
> Aoife's comfortable walks were longer in the morning even when air temperatures were similar. Afternoon surface heat was usually 12–20°F higher.

### Seasonal

> **Recalibrating for summer**  
> Aoife's recent history is mostly from cooler spring conditions, so Companion is using wider safety margins.

The app should not congratulate owners for walking in risky conditions or create streaks that pressure activity.

---

## 21. What NorthPaw Must Never Become

- A black-box "AI vet."
- A system that uploads private dog histories to build a commercial dataset by default.
- A single score that conceals severe component risks.
- A product that charges for urgent safety information.
- An engagement engine that creates anxiety to drive opens.
- A tolerance-maximization system.
- A route-tracking surveillance product.
- A substitute for observing the dog.
- A source of precise-sounding medical claims without validation.
- An algorithm that becomes more confident merely because it has more low-quality data.
- A product that mistakes deterministic behavior for scientific validity.

---

## 22. Development Roadmap

### Stage 0: Repair the foundation

- Complete every correctness repair in `algo_udate.md`.
- Centralize timestamps, timezones, units, thresholds, and provider normalization.
- Separate surface temperature from dog risk.
- Add uncertainty and abstention.
- Version current outputs.

### Stage 1: Validated exposed-surface engine

- Build the chronological energy-balance model.
- Assemble asphalt and concrete datasets.
- Add empirical comparator/ensemble.
- Validate across climates and time.
- Treat other surfaces as lower-confidence until independently supported.

### Stage 2: Evidence-based systemic heat model

- Define intended outcome and activity levels.
- Partner with canine thermophysiology expertise.
- Implement and validate the simplest applicable model.
- Replace arbitrary profile multipliers with evidence-backed effects.

### Stage 3: Companion data foundation

- Create the private outing schema.
- Add low-burden structured post-walk feedback.
- Add export, deletion, and learning controls.
- Produce descriptive history only.

### Stage 4: Similar-condition memory

- Define and validate similarity.
- Require effective-sample and recency gates.
- Surface associations with counts and uncertainty.
- Personalization can only make advice more conservative.

### Stage 5: Calibrated personal response model

- Implement hierarchical Bayesian updating.
- Validate prospectively against the population baseline.
- Add seasonal/time-decay behavior.
- Permit duration/window refinement only after all gates pass.

### Stage 6: Independent certification-quality review

- Freeze protocols.
- Complete external and prospective validation.
- Complete privacy and security audit.
- Complete human-factors testing.
- Publish the internal evidence dossier.
- Roll out gradually with rollback exercised.

---

## 23. Research and Standards Foundation

The north star should be developed against primary research and rigorous prediction-model practices. These sources establish direction; none independently validates NorthPaw.

### Pavement and surface modeling

- [Determining asphalt surface temperature using weather parameters](https://www.sciencedirect.com/science/article/pii/S2095756417304440) — field-measured asphalt modeling using air temperature, wind, humidity, and solar radiation with separate development and evaluation periods.
- [Mathematical model for paved surface summer and winter temperature](https://www.sciencedirect.com/science/article/pii/S0165232X04000217) — hourly energy-balance approach including radiation, conduction, convection, wind, and surface thermal properties.
- [Models for predicting surface temperatures on synthetic turf](https://www.sciencedirect.com/science/article/pii/S1877705814006699) — measured variation across turf systems and the importance of air temperature and solar radiation.
- [Pavement temperature and burns: streets of fire](https://pubmed.ncbi.nlm.nih.gov/7486363/) — direct pavement-temperature measurement and time-to-burn observations in an extreme desert setting; useful as hazard evidence, not a universal dog-paw threshold.

### Canine heat risk and thermoregulation

- [Incidence and risk factors for heat-related illness in UK dogs](https://pubmed.ncbi.nlm.nih.gov/32555323/) — large VetCompass study identifying population risk associations including brachycephaly, high bodyweight, breed, and bodyweight relative to breed/sex mean.
- [Effect of brachycephaly and body condition score on respiratory thermoregulation](https://pubmed.ncbi.nlm.nih.gov/29099251/) — prospective evidence that upper-airway conformation and body condition are relevant to heat-stress tolerance.
- [Effect of masses, ages, and coats on thermoregulation before and after exercise](https://pubmed.ncbi.nlm.nih.gov/36449118/) — pet-dog exercise observations across seasons and physical characteristics.
- [Body temperature regulation after agility trials](https://pubmed.ncbi.nlm.nih.gov/39817687/) — evidence that season/acclimation, athleticism, body size, and genetic factors affect thermoregulation.
- [Validated Canine Thermal Model for exertional heat strain](https://www.sciencedirect.com/science/article/pii/S0306456520300371) — model direction using meteorology, dog physical characteristics, and metabolic activity.
- [Post-exercise management of exertional hyperthermia in canicross dogs](https://pubmed.ncbi.nlm.nih.gov/38518416/) — prospective evidence that temperature can continue to rise after exercise and that recovery context matters.

### Prediction-model quality and transparency

- [TRIPOD+AI reporting guidance](https://www.bmj.com/content/385/bmj-2023-078378) — transparent reporting across regression and machine-learning prediction models, including fairness, subgroup evaluation, and open-science practices.
- [FDA, Health Canada, and MHRA transparency principles](https://www.fda.gov/medical-devices/software-medical-device-samd/transparency-machine-learning-enabled-medical-devices-guiding-principles) — useful high-bar principles for intended use, performance, limitations, confidence, human-centered communication, and lifecycle monitoring. NorthPaw should use these as quality guidance without implying regulatory status.
- [NIST AI Risk Management Framework resources](https://airc.nist.gov/) — testing, evaluation, verification, validation, risk documentation, and trustworthy-system practices.

### On-device privacy

- [Apple Core ML documentation](https://developer.apple.com/documentation/coreml/) — supports on-device prediction and personalization without requiring a network connection.
- [Apple Keychain Services](https://developer.apple.com/documentation/security/keychain-services/) — protected storage for encryption keys and small sensitive values.

---

## 24. Final North-Star Statement

The ultimate NorthPaw algorithm is not the one that produces the most impressive score.

It is the one that:

- Correctly models the environment within a documented domain.
- Keeps physical hazards separate from canine physiology.
- Learns cautiously from this dog's history.
- Preserves personal information entirely on the owner's device.
- Explains what it knows and what it does not.
- Becomes more conservative when evidence is weak.
- Abstains when it cannot support a recommendation.
- Never uses personal history to overrule universal safety boundaries.
- Demonstrates performance on data it has never seen.
- Survives independent veterinary, scientific, statistical, privacy, engineering, and human-factors review.
- Helps the owner make a better decision in under five seconds.

NorthPaw should not ask users to trust the algorithm.

It should continually earn that trust through evidence, restraint, privacy, transparency, and useful action.
