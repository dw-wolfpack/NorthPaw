# Antigravity Implementation Prompt: NorthPaw Trust Foundation and Companion Transition

You are implementing the next major NorthPaw product milestone.

## Repository

```text
/Users/fiegellansknowledge/experiment/NorthPaw
```

## Primary Goal

Improve the current MVP algorithm and its trust presentation, establish reliable product metrics, and introduce the private baseline-building loop that will eventually support NorthPaw Companion.

The requested scope covers priorities:

2. Fix the known algorithm correctness defects.
3. Establish the automated regression suite.
4. Make uncertainty consistent throughout the app.
5. Correct the product metrics.
6. Add the free **Going now** action.
7. Add the one-tap post-walk response.
9. Replace the current Pro proposition with Companion.
10. Improve stickiness without requiring input.

Priority 1, changing the existing analytics/privacy architecture, is explicitly out of scope. The owner is comfortable with the current anonymous analytics approach.

However:

- New post-walk response content and private Companion history must remain on-device.
- Anonymous product funnel events may record that a flow was shown, started, completed, dismissed, or reached an eligibility milestone.
- Do not send the selected post-walk answer, optional symptom/signal chips, private history, exact location, or derived personal insight content to analytics.
- Do not rewrite or remove existing analytics properties unless required to fix a functional defect.

## Required Reading Before Implementation

Read these files completely before changing code:

```text
AGENTS.md
documentation/algo_udate.md
documentation/algo_north_star.md
documentation/algo_update_testdrivedev_testcases.md
documentation/algo_update_testdrivedev_testcases_north_star.md
documentation/product_transition.md
documentation/NPI_ALGORITHM_GUIDE.md
documentation/NORTHPAW_ROADMAP.md
documentation/personal_doc/compainon.md
documentation/notebooklm/metrics/mixpanel_export_summary.md
```

Inspect the current implementations of:

```text
lib/weather/roadTemp.ts
lib/weather/nwsWeather.ts
lib/weather/tomorrowWeather.ts
lib/weather/weatherDispatcher.ts
app/(tabs)/index.tsx
app/_layout.tsx
app/checklist/[id].tsx
app/paywall.tsx
lib/database.ts
lib/database.web.ts
lib/database.types.ts
lib/profile.ts
lib/analytics.ts
lib/readiness/
context/SubscriptionContext.tsx
```

## Non-Negotiable Product Principles

1. Current readiness and safety information remain free.
2. Physical surface temperature and dog-specific guidance remain separate.
3. Every surface value is an estimate, not a measurement.
4. Missing or uncertain inputs must never silently produce a favorable state.
5. The new outing-feedback loop is optional.
6. Do not use background GPS, geofencing, or automatic route tracking.
7. Personal outing records and answers remain on-device.
8. Do not ask the owner to rank every walk.
9. Do not use guilt, broken streaks, or pressure to walk.
10. Do not market or label the MVP model as clinically validated.
11. Do not create medical diagnoses or exercise clearance.
12. Do not sell Companion before the device has enough baseline evidence to provide value.
13. Preserve existing user data through migrations.
14. Keep the free safety layer functional if Companion state is absent or corrupt.

## Working Method

Use test-driven development:

```text
Failing test
→ minimal implementation
→ passing test
→ refactor
→ regression comparison
```

Do not tune expected values merely to make implementation pass. If an expected value must change, document the evidence or corrected contract.

Work in the phases below. Complete and validate each phase before starting the next.

---

# Phase A: Test Harness and Known-Bug Regression Coverage

## Objective

Create a deterministic test foundation before modifying the algorithm.

## Requirements

1. Add a supported test runner compatible with the current Expo/TypeScript project.
2. Add deterministic non-watch commands to `package.json`, such as:

```json
{
  "scripts": {
    "test": "...",
    "test:ci": "..."
  }
}
```

3. Tests must not depend on:

- Host timezone.
- Current wall-clock time.
- Network access.
- Live provider responses.
- Device location.
- Test execution order.

4. Use injected clocks and explicit timestamps.
5. Store weather/provider inputs as deterministic fixtures.
6. Add focused suites rather than one enormous test file.

Suggested organization:

```text
lib/weather/__tests__/solarPosition.test.ts
lib/weather/__tests__/weatherNormalization.test.ts
lib/weather/__tests__/roadTemp.test.ts
lib/weather/__tests__/timelineModel.test.ts
lib/readiness/__tests__/guidanceEngine.test.ts
lib/readiness/__tests__/thresholds.test.ts
lib/companion/__tests__/outingLifecycle.test.ts
```

## Mandatory initial regression tests

Write failing tests for:

- Tomorrow's same clock hour overwriting today's.
- Clear Tomorrow.io midnight being classified as daytime.
- Completely overcast Tomorrow.io noon being classified as nighttime.
- Dog profile changing physical Fahrenheit.
- Current threshold disagreement around 100–105°F.
- Current-hour selection using ambiguous hour-of-day rather than complete timestamp.
- Invalid timestamp being accepted.
- Empty forecast returning a favorable/default model.
- Non-finite input reaching UI output.

## Acceptance Criteria

- [ ] A deterministic `npm test` or equivalent command exists.
- [ ] CI-mode tests exit nonzero on failure.
- [ ] Tests pass from a clean checkout without live weather/network access.
- [ ] Timezone behavior is explicit.
- [ ] Clock behavior is injected.
- [ ] Each known bug has a permanent regression test.
- [ ] Existing unrelated tests continue to pass.
- [ ] No production algorithm behavior is changed until the relevant failing tests exist.

---

# Phase B: MVP Algorithm Correctness Fixes

## Objective

Correct the most consequential defects without attempting the full gold-star thermal model.

## B1. Complete-Timestamp Timeline

### Requirements

- Stop keying forecast points solely by local clock hour.
- Preserve complete timestamps and calendar dates.
- Define whether the Home timeline is:
  - The current local calendar day, or
  - A rolling horizon.
- Use one policy consistently.
- Do not mix forecast generations.
- Do not allow tomorrow's sample to replace today's.
- Handle missing hours without implying continuous coverage.
- Handle DST repeated and skipped hours.

### Acceptance Criteria

- [ ] A 36-hour forecast preserves all distinct timestamps.
- [ ] Today's timeline contains only intended points.
- [ ] DST fall-back repeated hours remain distinguishable.
- [ ] DST spring-forward does not fabricate an hour.
- [ ] Timeline points are strictly chronological.
- [ ] Selected points are identified by timestamp, not only hour.
- [ ] Home, modal, and share paths resolve the same timestamp.

## B2. Correct Day/Night Detection

### Requirements

- Do not derive day/night from cloud cover.
- Use timestamp, latitude, and longitude to compute solar elevation.
- Account for longitude and timezone rather than assuming solar noon is always 12:00.
- Prefer valid GHI when supplied for radiation magnitude.
- Below-horizon solar contribution must be zero.
- Fully overcast daytime must remain daytime.

### Acceptance Criteria

- [ ] Clear midnight is nighttime.
- [ ] Overcast noon is daytime when the sun is above the horizon.
- [ ] Solar elevation matches approved reference fixtures within tolerance.
- [ ] Equivalent instants represented with different offsets produce the same solar state.
- [ ] DST does not alter the physical sun position.
- [ ] Polar-day/night edge cases remain finite and deterministic.

## B3. Separate Physics and Dog Guidance

### Requirements

- `estimateRoadTempF` or its replacement must use no dog profile fields.
- Do not multiply absolute Fahrenheit by dog-risk multipliers.
- The same conditions and surface must yield the same physical estimate for every dog.
- Dog traits may change NPI/guidance only in the guidance layer.
- Cosmetic identity fields must never affect safety behavior.

### Acceptance Criteria

- [ ] Profile permutation tests produce identical physical surface values.
- [ ] Changing snout, coat, weight, age, activity, name, breed label, or photo does not change pavement temperature.
- [ ] No direct multiplication of absolute Fahrenheit by a dog multiplier remains.
- [ ] Dog-specific guidance continues to differ where approved.

## B4. Canonical Thresholds

### Requirements

- Create one versioned source of truth for surface bands.
- Consume it from:
  - Algorithm.
  - Home timeline.
  - Surface modal.
  - Share card.
  - Hand-test prompt.
  - NPI road-risk contribution.
  - Notifications where applicable.
- Remove current 100°F versus 105°F disagreement.
- Describe thresholds as product policy unless specific dog-paw evidence supports stronger wording.

### Acceptance Criteria

- [ ] Every threshold has tests at `T - epsilon`, `T`, and `T + epsilon`.
- [ ] No gaps or overlaps exist.
- [ ] UI and guidance agree for 99–106°F fixtures.
- [ ] No UI calls the highest band a universal clinical dog-paw threshold.
- [ ] Threshold configuration has an explicit version.

## B5. Defensive Inputs

### Requirements

- Validate:
  - Timestamps.
  - Coordinates.
  - Temperature.
  - Wind.
  - Humidity.
  - Cloud cover.
  - GHI.
- Preserve `missing` separately from physical zero.
- Return typed unavailable/abstention behavior when critical data is invalid.
- Never default invalid data to green/ready.

### Acceptance Criteria

- [ ] `NaN` and infinity cannot reach presentation.
- [ ] Invalid coordinates are rejected.
- [ ] Negative wind/GHI follow a documented policy.
- [ ] Missing provider values are recorded as missing.
- [ ] Empty hourly arrays return no-data.
- [ ] Partially valid arrays preserve valid points and lower confidence.

## Phase B Definition of Done

- [ ] All Phase A/B tests pass.
- [ ] Known bugs are fixed.
- [ ] Candidate-versus-current golden diff is reviewed.
- [ ] Every less-conservative classification is explicitly explained.
- [ ] TypeScript compilation succeeds.
- [ ] Expo app launches on the supported target.
- [ ] No unrelated UI or navigation regression is introduced.

---

# Phase C: Consistent Uncertainty and Trust Presentation

## Objective

Present the MVP honestly and consistently without pretending the current algorithm has full scientific validation.

## C1. Estimate Contract

Refactor toward a structured result:

```ts
type SurfaceTempEstimate = {
  estimateF: number;
  lowerF: number | null;
  upperF: number | null;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  algorithmVersion: string;
  evaluatedAt: string;
  exposureAssumption: 'exposed' | 'unknown';
};
```

If defensible numeric intervals are not yet calibrated:

- Do not invent ±4°F or ±8°F.
- Permit `lowerF`/`upperF` to remain null.
- Still provide a confidence/data-quality state and reasons.
- Label the value as an estimate.

## C2. Confidence Inputs

Consider:

- Actual GHI versus inferred solar load.
- Weather freshness.
- Forecast lead time.
- Missing variables.
- Provider fallback.
- Unknown surface or lower-evidence surface.
- Unknown shade.
- Recent precipitation uncertainty.

Confidence is independent of risk.

## C3. UI Requirements

Every relevant surface display must communicate:

- Estimated status.
- Selected surface.
- Timestamp.
- Band.
- Confidence/data status when not high.
- Important assumption such as exposed surface.
- Verification action when material.

Use:

> Estimated exposed-surface temperature

Avoid:

> Actual road temperature  
> Clinically calibrated  
> Guaranteed safe  
> Exact burn time

## C4. Unable-to-Assess State

Create a distinct state when:

- Critical inputs are missing.
- Timestamps cannot be resolved.
- Providers are unavailable and cache is too stale.
- Result lies outside a supported domain.

The state must:

- Not appear green.
- Explain the gap.
- Offer a conservative action.

## Acceptance Criteria

- [ ] Estimate labels are consistent across Home, modal, and share card.
- [ ] Confidence does not become higher when evidence is removed.
- [ ] Stale data is visibly stale.
- [ ] Low confidence is not represented as low risk.
- [ ] Unable-to-assess is distinct from loading and favorable.
- [ ] The physical hand-test/verification path remains available.
- [ ] Screen readers announce estimate, band, confidence, and action.
- [ ] No color-only safety communication.
- [ ] No fabricated prediction intervals.
- [ ] UI snapshots cover all confidence and failure states.

---

# Phase D: Correct Product Metrics

## Objective

Measure the existing glance habit correctly before using engagement as a Companion gate.

## D1. Rename Existing Counter Semantics

The current `unique_readiness_days` increments when the root app layout opens.

Choose one:

1. Migrate/rename it to `unique_app_open_days`, or
2. Leave it for backward compatibility but stop using it as readiness.

Do not silently reinterpret historical values.

## D2. Add Qualified Readiness Days

A qualified readiness day requires:

- Onboarding completed.
- Weather or visibly labeled cached weather available.
- Full readiness assessment rendered.
- Unique local calendar day using the forecast location's time basis.
- Sufficient foreground visibility or a readiness interaction according to one documented rule.

Store locally:

```ts
type QualifiedReadinessDay = {
  localDate: string;
  firstRenderedAt: number;
  algorithmVersion: string;
  dataState: 'fresh' | 'cached' | 'stale';
};
```

One row per day. Make writes idempotent.

## D3. Correct Glance Value

Replace or supplement `zero_value_session` logic.

A session where readiness successfully renders and the owner leaves after five seconds can be valuable.

Track anonymously:

- `readiness_rendered`
- `readiness_unavailable`
- `meaningful_glance_session`
- Existing interactions

Do not require a tap for value.

## D4. Correct Monetization Semantics

The beta interest button currently emits purchase lifecycle events.

Correct it:

- Interest registration emits only interest.
- `subscription_started` means a real trial/subscription lifecycle event.
- `subscription_purchased` means StoreKit/RevenueCat confirmed purchase.
- Add failure/cancel where appropriate.

This is a functional measurement fix, not a broad analytics privacy rewrite.

## Acceptance Criteria

- [ ] Existing app-open-day count is no longer called qualified readiness.
- [ ] Qualified readiness writes at most once per local day.
- [ ] A failed weather/readiness render does not count.
- [ ] A cached assessment counts only according to documented freshness policy.
- [ ] Reinstall/migration behavior is documented.
- [ ] Five-second successful glances can count as value.
- [ ] Beta interest cannot emit a successful purchase.
- [ ] Funnel event meanings are mutually exclusive and documented.
- [ ] Metrics tests use injected clocks and timezone fixtures.

---

# Phase E: Free “Going now” Outing Lifecycle

## Objective

Create an explicit, private, low-friction bridge from planning to a real outing.

## E1. Entry Points

Primary:

- Home near the primary recommendation.

Secondary:

- After hand-test completion.
- After selecting a walk window.
- From a locally scheduled chosen-window reminder.

Primary CTA:

> Going now

Testable alternatives may be present behind configuration, but do not ship multiple confusing CTAs simultaneously.

## E2. Duration

On first use, offer:

- Quick — approximately 10 minutes.
- Normal — approximately 25 minutes.
- Long — approximately 45 minutes.

Requirements:

- Remember the last/default selection locally.
- One tap should start on repeat use.
- Allow adjustment.
- Duration is prompt scheduling, not a claim of safe exercise duration.
- Do not label a duration as safe for the dog.

## E3. Local Outing Record

Create a local schema:

```ts
type ActiveOuting = {
  id: string;
  dogId: string;
  startedAt: number;
  expectedDurationMinutes: number;
  source: 'home' | 'hand_test' | 'walk_window' | 'manual';
  assessmentSnapshotId: string;
  status: 'active' | 'finished' | 'cancelled' | 'expired';
  notificationId: string | null;
};
```

Assessment snapshot should capture:

- Weather timestamp/provenance.
- Algorithm version.
- Surface selection/estimate.
- Confidence.
- Risk/guidance state.
- Coarse forecast context needed for future local interpretation.

Do not capture:

- Background route.
- Continuous location.
- Return geofence.
- Exact GPS unless a separate existing explicit log action requests it.

## E4. State Machine

Support:

```text
idle
→ active
→ finished/outcome recorded

active
→ still walking
→ rescheduled prompt

active
→ cancelled/did not go

active
→ expired
```

Only one active outing per dog unless the product explicitly supports otherwise.

## E5. Local Notification

At start:

- Schedule a local notification after expected duration.

Notification:

> How did Aoife handle the outing?

Actions or opened flow:

- Check in.
- Still walking / remind in 10 minutes.
- Didn't go.
- Dismiss.

Requirements:

- Works offline.
- Survives app termination/restart.
- Cancels after response/cancellation.
- Does not duplicate on repeated taps.
- If notifications are unavailable, show active outing and Finish action in-app.
- Never request background GPS.

## E6. Active-Outing Home UI

While active:

- Show start time.
- Show expected prompt time.
- Show `Finish outing`.
- Show `Still walking`.
- Show `Cancel`.

Do not imply live dog monitoring.

## Acceptance Criteria

- [ ] Going now works without Pro.
- [ ] Going now works without network after a readiness snapshot exists.
- [ ] No GPS permission is requested by this flow.
- [ ] No background location service is started.
- [ ] Assessment snapshot is bound to start time, not response time.
- [ ] Duplicate starts are prevented.
- [ ] Active state survives app restart.
- [ ] Local notification is scheduled exactly once.
- [ ] Still walking reschedules deterministically.
- [ ] Finish cancels pending notification.
- [ ] Cancel/did-not-go is recorded without being treated as a completed response.
- [ ] Free safety features remain available during an active outing.
- [ ] Anonymous analytics record flow state only, not private context.

---

# Phase F: One-Tap Post-Walk Response

## Objective

Capture one interpretable signal without turning every outing into a survey.

## F1. Primary Question

> How did [dog name] handle it?

Responses:

- `as_usual`
- `slowed`
- `struggled`
- `did_not_go`

User-facing language:

- As usual
- Slowed down
- Struggled
- Didn't go

Do not use a 1–5 score.

## F2. Conditional Follow-Up

Only for slowed/struggled:

- Heavy panting.
- Sought shade.
- Stopped early.
- Avoided the surface / lifted feet.
- Recovery took longer.
- Other / unsure.

Keep optional.

If serious warning signs are added:

- Separate them from ordinary optional chips.
- Trigger veterinarian-reviewed safety copy.
- Do not treat the event as an ordinary tolerance observation.

## F3. Local Outcome Schema

```ts
type OutingOutcome = {
  outingId: string;
  recordedAt: number;
  response: 'as_usual' | 'slowed' | 'struggled' | 'did_not_go';
  signals: string[];
  responseLatencyMinutes: number;
  ownerConfidence: 'low' | 'medium' | 'high' | null;
};
```

## F4. Prompt Policy

- Ask only for explicitly started outings.
- Do not infer a walk from app open.
- Do not ask after every untracked real-world walk.
- Suppress after repeated dismissals according to a versioned policy.
- Allow prompt disable/pause.
- Allow manual check-in while an outing is active.
- Late responses remain valid but record latency and lower future data quality where appropriate.

## F5. Immediate Payoff

After save:

> Saved privately on this device.

Optionally show factual progress:

> 3 private check-ins recorded.

Do not generate a personal tolerance claim.

## F6. Privacy and Analytics

Local only:

- Selected response.
- Signal chips.
- Assessment context.
- Outcome record.

Allowed anonymous analytics:

- `post_outing_prompt_delivered`
- `post_outing_flow_opened`
- `post_outing_flow_completed`
- `post_outing_prompt_dismissed`

Do not attach:

- Response value.
- Signal values.
- Dog information.
- Weather/NPI/surface details.
- Location.

## Acceptance Criteria

- [ ] Primary response can be completed in one tap after opening.
- [ ] Median interaction is designed for under five seconds.
- [ ] Optional follow-up never blocks saving.
- [ ] Missing/dismissed is not recorded as `as_usual`.
- [ ] Didn't go does not train a dog-response baseline.
- [ ] Duplicate outcome records are prevented.
- [ ] Editing/deleting an outcome is supported or schema-ready.
- [ ] Pending notification is cancelled after response.
- [ ] Private response content never appears in analytics requests.
- [ ] Flow works offline.
- [ ] Screen-reader labels clearly describe each choice.
- [ ] No response is framed as diagnosis or safe-duration proof.

---

# Phase G: Stickiness Without Required Input

## Objective

Increase repeat value without making logging mandatory.

Implement a restrained subset of the following, prioritizing existing behavior:

## G1. Deadline-Oriented Readiness

Examples:

- Best window closes at 8:40 AM.
- Surface risk rises around 10 AM.
- Evening pavement cools later than the air.

Requirements:

- Derived from the corrected timeline.
- Do not claim exact certainty.
- Do not create a deadline if no favorable window exists.

## G2. Selected-Window Reminder

Allow:

> Remind me at this window

Requirements:

- Local notification.
- User initiated.
- Editable/cancellable.
- Does not create an outing until user confirms.

## G3. Meaningful Condition-Change Alerts

Only consider:

- Recommendation changes category.
- Best window materially shifts.
- Confidence materially deteriorates.
- New severe weather hazard appears.

Requirements:

- Quiet defaults.
- User controls.
- Deduplicate.
- No engagement-only notifications.

## G4. Weekly Private Reflection

Before Companion:

> You checked Aoife's conditions on 4 days this week. Morning windows were generally more favorable.

Requirements:

- Computed on-device.
- Descriptive only.
- No tolerance language.
- No shame/streak pressure.
- Can be disabled.

## G5. Hand-Test Bridge

After successful hand-test completion:

> Ground checked. Going now?

This should be a strong secondary entry to the outing flow.

## G6. Prepared-Day Language

Use:

- Prepared on 5 days.
- 3 private check-ins.
- Baseline is taking shape.

Avoid:

- Streak broken.
- Don't lose progress.
- You missed yesterday.
- Rewards for longer/hotter outings.

## Acceptance Criteria

- [ ] Stickiness features work without Companion purchase.
- [ ] Notifications are local and user-controlled.
- [ ] Alerts deduplicate.
- [ ] No notification pressures an outing in unfavorable conditions.
- [ ] No stale favorable notification supersedes a newer severe state.
- [ ] Weekly reflection is factual and reproducible from local data.
- [ ] Hand-test bridge cannot bypass current risk guidance.
- [ ] Existing Home readability remains under the established five-second goal.

---

# Phase H: Replace “Pro” With Evidence-Gated Companion

## Objective

Transition the monetization proposition from generic Pro access toward continuing private insight.

This phase depends on the baseline-builder state from Phases E/F. Do not sell Companion to users who cannot receive personal value yet.

## H1. Product Naming

Replace user-facing generic `NorthPaw Pro` positioning with `NorthPaw Companion`, subject to final product approval.

Do not necessarily rename internal entitlement identifiers during the same change unless migration is safe and required.

## H2. Free/Paid Boundary

Always free:

- Current readiness.
- Pavement estimate/confidence.
- Core dog-aware guidance.
- Going now.
- Post-walk response.
- Raw private records.
- Edit/delete/export/reset.
- Serious-warning guidance.

Companion:

- Similar-condition recall.
- Personalized window refinement.
- Seasonal comparison.
- Recovery-pattern interpretation.
- History-aware notifications.
- Continuing weekly/monthly private insight.

## H3. Eligibility Model

Implement a versioned local eligibility calculation.

Initial hypothesis:

```text
qualifiedReadinessDays >= 7
AND qualifiedOutcomes >= 5
AND distinctOutcomeDays >= 3
AND firstUsefulInsightAvailable == true
```

Important:

- Treat this as configuration, not scattered magic numbers.
- `firstUsefulInsightAvailable` may initially be a conservative placeholder based on evidence coverage, not a sophisticated personal model.
- Do not manufacture an insight merely to unlock purchase.
- If Phase 8/first-insight generation is not being implemented in this task, leave purchase disabled and expose baseline progress only.

## H4. Pre-Eligibility Screen

If user taps Companion early:

> NorthPaw is building Aoife's private baseline.

Show:

- What Companion will do.
- Privacy explanation.
- Progress.
- Example insight clearly labeled as an example.
- No enabled purchase CTA.

## H5. Eligible Offer

Lead with the real value:

- Personal patterns.
- Similar-condition context.
- Seasonal adaptation.
- Better-timed reminders.

Do not lead with:

- Generic premium content.
- Basic safety.
- GPS logging.
- A vague "more intelligence" claim.

## H6. Trial

Do not start trial before immediate personalized value is available.

If real purchase infrastructure remains beta:

- Keep interest registration semantically accurate.
- Do not emit purchase success.
- Clearly label Coming Soon/Beta.

## H7. Cancellation/Data Ownership

After cancellation:

- Free safety remains.
- Raw history remains.
- Export/delete remains.
- Existing data is not destroyed.
- Paid insights follow a clear read-only/update policy.

## Acceptance Criteria

- [ ] Companion cannot be purchased before eligibility.
- [ ] Early interest has a useful progress screen.
- [ ] Basic safety is not presented as paid.
- [ ] Going now/check-in are not paywalled.
- [ ] Raw user history remains accessible.
- [ ] Example insights are clearly labeled examples.
- [ ] No trial begins while waiting for baseline value.
- [ ] Store events reflect actual lifecycle.
- [ ] Existing entitlements continue to work.
- [ ] Restore purchase remains functional when real purchases are active.
- [ ] Subscription cancellation cannot delete private records.
- [ ] Paywall copy contains no clinical validation or tolerance claim.

---

# Cross-Cutting Data Model Requirements

Use explicit multi-dog-safe identifiers even if the current app supports one primary dog.

Recommended local tables/entities:

```text
qualified_readiness_days
assessment_snapshots
active_outings / outings
outing_outcomes
companion_settings
companion_eligibility
window_reminders
```

Requirements:

- Foreign-key or application-level ownership by dog ID.
- UTC immutable timestamps plus local-date/timezone fields where needed.
- Algorithm/model version stored with snapshots.
- Migrations are transactional and idempotent.
- Missing remains distinct from false/zero.
- Derived eligibility can be rebuilt from source records.
- Delete one outing removes or rebuilds dependent derived state.
- Corrupt Companion data cannot break Home readiness.
- Web fallback storage remains behaviorally compatible where supported.

---

# Cross-Cutting UX Requirements

- Keep Home calm and glanceable.
- Do not add multiple equal-priority CTAs.
- Going now must not overpower urgent current guidance.
- In `avoid` or equivalent highest-risk state, the CTA should reflect the safer action rather than encourage a normal outing.
- All new controls need accessibility roles, labels, states, and adequate touch targets.
- Support light/dark themes.
- Avoid color-only meaning.
- Use concise mobile copy.
- Avoid modal stacking and notification duplication.
- Preserve back-navigation behavior.

---

# Cross-Cutting Regression Requirements

Before final handoff, verify:

- Onboarding.
- Weather permission denied.
- NWS success.
- Tomorrow.io fallback.
- Offline cached weather.
- Home readiness.
- Surface switching.
- Timeline scrubbing.
- Road-temperature modal.
- Hand test.
- Share card.
- Checklist flow.
- Existing outing log.
- Care reminders.
- Paywall/entitlement checks.
- App restart with an active outing.
- Notification permission denied.
- Multiple supported timezones and both DST transitions.

Run:

- Unit tests.
- Integration tests.
- TypeScript compilation.
- Lint if configured.
- Expo/app launch smoke test.
- Platform-specific notification smoke test where possible.

---

# Required Anonymous Analytics for New Flows

The owner permits anonymous analytics. Keep new events minimal:

```text
qualified_readiness_day_recorded
going_now_viewed
outing_intent_started
outing_intent_cancelled
post_outing_prompt_delivered
post_outing_prompt_rescheduled
post_outing_flow_opened
post_outing_flow_completed
post_outing_prompt_dismissed
baseline_milestone_reached
companion_preview_viewed
companion_eligibility_reached
companion_offer_viewed
companion_interest_registered
companion_trial_started
companion_purchase_completed
```

Allowed properties:

- App version.
- Platform.
- UI source.
- Broad eligibility stage.
- Experiment variant.

Forbidden on new events:

- Dog name or profile.
- Post-walk response.
- Signal chips.
- Weather values.
- NPI/surface values.
- Location.
- Free text.
- Personal insight text.

---

# Implementation Deliverables

Produce:

1. Code changes for the complete approved scope.
2. Unit and integration tests.
3. Fixture files.
4. Database migrations.
5. Updated event catalog.
6. Updated user-facing documentation/copy references.
7. A concise implementation report:
   - Files changed.
   - Behavior added.
   - Tests run.
   - Results.
   - Remaining blockers.
   - Any requirement intentionally deferred.
8. Before/after screenshots for material Home, outing, uncertainty, and Companion screens where tooling permits.

Do not claim a phase is complete if acceptance criteria are not met.

---

# Final Release Gates

Do not consider the work ready for production until:

- [ ] Known algorithm defects are fixed and regression-tested.
- [ ] Complete timestamps and solar day/night behavior are correct.
- [ ] Physics and dog guidance are separated.
- [ ] Canonical thresholds are shared everywhere.
- [ ] Missing input never creates favorable default output.
- [ ] Uncertainty language is consistent.
- [ ] Qualified readiness is distinct from app-open days.
- [ ] Beta interest no longer records purchases.
- [ ] Going now and outcome flows are free, local, and offline-capable.
- [ ] No background GPS/location tracking was added.
- [ ] Private response values are absent from analytics payloads.
- [ ] Prompt suppression and notification-denied fallbacks work.
- [ ] Companion purchase remains disabled until evidence eligibility.
- [ ] Free safety and raw private data remain accessible.
- [ ] All automated tests pass.
- [ ] TypeScript/build smoke checks pass.
- [ ] Existing dirty/unrelated user changes are preserved.

---

# Explicit Non-Goals

Do not implement in this task:

- Full gold-star energy-balance surface model.
- Clinically validated canine core-temperature prediction.
- Black-box ML.
- Cloud Companion storage or account system.
- Background GPS.
- Route maps.
- Automatic return-home detection.
- Smart-collar integration.
- LLM analysis of outing notes.
- A 1–5 walk rating.
- Mandatory check-ins.
- A promise of exact safe duration.
- A universal clinical burn threshold.
- Social/community features.
- Multi-user family sharing.

Build a reliable bridge from the current MVP into private Companion readiness. Do not skip the bridge and pretend the long-term product already exists.
