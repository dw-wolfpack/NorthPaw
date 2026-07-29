# NorthPaw Product Transition

**Document type:** Product strategy and staged transition plan  
**Purpose:** Move NorthPaw from a glance-and-plan utility toward a private longitudinal Companion without damaging the existing habit, overburdening owners, or monetizing basic safety  
**Evidence base:** Mixpanel export through July 26, 2026, current product implementation, `compainon.md`, `algo_north_star.md`, and the algorithm TDD plans  
**Privacy constraint:** Dog profile, outing context, outcomes, history, and personalized insights stay on-device  
**Working recommendation:** Do not ask users to rank every walk. Introduce an optional event-based outing loop and sell the interpretation of a privately built baseline—not access to safety or ownership of the user's data.

---

## 1. Executive Recommendation

NorthPaw should transition in three product layers:

```text
1. Glance
   "What should I know right now?"

2. Lightweight follow-through
   "I'm going now" → "How did Aoife handle it?"

3. Companion
   "What has NorthPaw learned from Aoife's history?"
```

The existing product already has evidence for layer 1. Layer 2 is not yet established. Companion cannot deliver its central promise until layer 2 produces enough qualified observations.

Therefore:

1. Keep current readiness, pavement, walk-window, and core safety features free.
2. Add a free, private baseline-building loop.
3. Never require a check-in for every walk.
4. Ask only after the owner explicitly indicates an outing or accepts the baseline feature.
5. Capture almost all context automatically on-device.
6. Ask one primary post-walk question.
7. Show a useful free reflection before showing a Companion offer.
8. Make Companion purchasable only when the device has enough evidence to deliver immediate value.
9. Gate eligibility on **qualified evidence**, not app-open days alone.
10. Keep raw personal records, export, deletion, and safety access free; charge for continuing interpretation, patterns, forecasting, and personalized timing.

The user's instinct is directionally right: delaying the offer can make Companion feel earned and honest. But `X unique app days` by itself is the wrong gate. The device should offer Companion only after both repeat safety use and a minimum useful private baseline exist.

---

## 2. What the Current Data Actually Shows

### 2.1 Export scope

The local Mixpanel export contains:

- **20,132 tracked events**
- **231 distinct device/user IDs**
- Events from approximately **May 29 through July 26, 2026**
- App versions ranging from **3.0.0 through 5.2.0**
- **81 weekly active users** in the latest reported seven-day window

Because the export spans multiple materially different app versions, it is directional product evidence rather than a clean experiment.

### 2.2 Repeat-use signal

The prepared summary reports:

- 74–75 users with at least 5 active days, depending on the exact event/day definition.
- 52 users with at least 10 active days.
- 19 users with at least 20 active days.
- 6–7 users with at least 30 active days.
- A top user with 38 active days and 1,015 events.

This is meaningful evidence that NorthPaw can become a recurring utility rather than a one-time novelty.

### 2.3 Current behavioral center of gravity

| Behavior | Events | Unique users |
|---|---:|---:|
| App opened | 2,794 | 225 |
| Readiness viewed | 2,847 | 145 |
| Walk window viewed | 987 | 93 |
| Surface changed | 1,221 | 78 |
| Hand test opened | 122 | 75 |
| Hand test completed | 62 | 39 |
| Checklist opened | 64 | 30 |
| Outing saved | 1 | 1 |

Home accounts for approximately **70.7% of all tracked screen views**.

The evidence says:

- People repeatedly open NorthPaw.
- People use it to assess conditions.
- A meaningful subset explores timing, surfaces, and physical verification.
- Very few users cross into structured preparation.
- Almost nobody reaches detailed logging.

NorthPaw currently behaves as a **glance-and-plan instrument**, exactly as suspected.

### 2.4 The current monetization data is not decision-grade

The export contains:

- 26 `pro_paywall_viewed` events from only 5 unique users.
- 10 `pro_interest_registered` events from only 2 unique users.
- The paywall events appear concentrated in an older app version and contain likely duplicate/versionless records.
- The current beta paywall records `subscription_started` and `subscription_purchased` when a user merely registers interest.

Do not interpret the 38.5% event-level "interest rate" as purchase conversion.

Before pricing or gating decisions, telemetry must distinguish:

- Paywall impression.
- Benefit detail viewed.
- Trial tapped.
- Store purchase sheet opened.
- Purchase succeeded.
- Purchase failed/cancelled.
- Subscription renewed.
- Subscription cancelled.

### 2.5 The existing "unique readiness days" is not readiness

The current local counter increments once per calendar day when the root layout opens. It does not require:

- Successful weather.
- A rendered readiness assessment.
- Time spent on Home.
- A walk-window interaction.
- Any indication that the user received value.

It is effectively `unique_app_open_days`, despite being named `unique_readiness_days`.

It is useful as a habit signal, but it should not alone control Companion eligibility.

### 2.6 Zero-value sessions need interpretation

There are:

- 934 `zero_value_session` events.
- 126 unique users with at least one such event.
- Roughly one zero-value event for every three app opens.

For a glance product, an owner may receive value simply by seeing the Home answer and leaving. A session should not be labeled zero-value merely because the user did not tap.

The definition should distinguish:

- Home/readiness successfully rendered and visible.
- Weather failed or remained loading.
- User left before value rendered.
- User saw value but needed no interaction.

The best safety utility can produce a valuable five-second session with zero taps.

---

## 3. Product Diagnosis

### What is working

- A repeatable reason to open.
- Fast current-condition value.
- Strong Home concentration.
- Walk-window curiosity.
- Surface comparison engagement.
- A physical hand-test ritual with high completion after start.
- Privacy-oriented local persistence.

### What is missing

- A clear declaration that an outing is actually beginning.
- A lightweight record tying forecast context to a real outing.
- A post-outing outcome captured close to the event.
- A visible accumulation of private knowledge.
- A free proof that history creates better insight.
- A paywall whose benefits match the future Companion promise.

### Why the current outing log does not solve it

The current log:

- Appears inside checklist detail.
- Requires the user to open and complete a checklist before the quick energy log appears.
- Offers a more demanding place/GPS/photo/notes workflow.
- Gates full saving behind Pro.
- Treats logging as documentation rather than immediate feedback.

That is appropriate for an enthusiast journal, but it is too much friction to seed a population-wide Companion baseline.

The current three-choice quick log is closer to the right interaction, but:

- It is hidden behind checklist completion.
- It fetches weather again at logging time rather than binding to a declared outing start.
- It records only NPI, a weather summary string, and low/normal/high energy.
- It has no observed usage in the current export.
- It currently sends `energyScale` and `npiScore` to Mixpanel, conflicting with a strict private-history promise.

---

## 4. The Core Transition Loop

### Step 1: Glance

The owner opens Home and gets:

- Current readiness.
- Estimated exposed-surface conditions.
- Best window.
- Primary action.

No data-entry request should interrupt the first-value moment.

### Step 2: Declare an outing

Offer one calm action:

> **Going out now**

One tap creates an on-device outing-intent record containing:

- Start timestamp.
- Current algorithm/version.
- Current environmental snapshot.
- Selected surface.
- Current recommended window.
- Dog-profile version.
- Confidence/uncertainty state.
- Optional intended duration/intensity only if the owner has already set defaults.

The owner should not have to re-enter weather, place, dog, or conditions.

Alternative language to test:

- "Going now"
- "Start outing"
- "Use this window"
- "We'll head out now"

Avoid:

- "Track walk" if there is no route tracking.
- "Begin monitoring" if the app is not sensing the dog.
- "Log walk" at the start, because it sounds like work.

### Step 3: Ask one post-outing question

After an appropriate locally scheduled delay:

> **How did Aoife handle it?**

Primary responses:

- **As usual**
- **Slowed down**
- **Struggled**

Optional fourth path:

- **We didn't go**

This is better than a 1–5 walk rating because it:

- Anchors the response to the individual dog's baseline.
- Avoids asking whether the route or owner was "good."
- Produces more interpretable safety data.
- Does not imply clinical measurement.
- Is easier to answer consistently.

If the owner chooses "Slowed down" or "Struggled," offer optional reason chips:

- Heavy panting.
- Sought shade.
- Stopped early.
- Avoided hot surface/foot lifting.
- Recovery took longer.
- Other/unsure.

If severe signs are selected, ordinary Companion learning stops and veterinarian-reviewed safety guidance takes over.

### Step 4: Close the loop immediately

After the response, show a small payoff:

> Saved privately on this device.  
> 2 more check-ins will unlock Aoife's first pattern.

Do not make the user wait weeks without feedback.

### Step 5: Deliver the first free insight

After a minimum qualified set:

> **Aoife's early baseline**  
> Her recent comfortable outings have mostly been in lower sun before 9 AM. NorthPaw needs a few more varied check-ins before estimating personal patterns.

This demonstrates the value of history without overclaiming.

### Step 6: Offer Companion only after value exists

The Companion offer should lead with the insight already earned:

> **NorthPaw is beginning to recognize Aoife's patterns.**  
> Companion turns her private history into personalized walk windows, seasonal comparisons, recovery patterns, and similar-condition guidance.

The paywall should not lead with more generic content, deeper checklists, or GPS logging if Companion is the strategic product.

---

## 5. Do Not Ask After Every Walk

The central risk is turning NorthPaw into homework.

The recommended policy is **event-contingent and adaptive**, not universal:

- Ask only after the owner taps "Going now."
- Let the owner turn post-outing prompts off.
- Skip prompts after repeated dismissals.
- Allow "don't ask for this kind of outing."
- Let the owner record an outcome voluntarily later.
- Do not infer an outing solely from app open or location.
- Do not ask for low-information duplicate conditions indefinitely.

### Suggested prompt budget

Start conservatively:

- First invitation only after repeat value has been demonstrated.
- Maximum one post-outing prompt per explicitly started outing.
- Maximum default prompt frequency capped during baseline beta.
- Suppress after two consecutive dismissals until the owner re-enables or self-initiates.
- Never use guilt, lost streaks, or red badges for missing feedback.

Research on mobile ecological momentary assessment shows that repeated mobile self-report can achieve high compliance, but protocols vary widely and burden/retention depend on design, duration, and reporting practices. NorthPaw should pilot its exact three-second interaction rather than importing generic assumptions.

### High-information sampling

Once an early baseline exists, Companion should ask selectively:

- First outing in a materially hotter condition band.
- First humid outing of the season.
- A new surface type.
- A materially longer outing.
- Conditions similar to a prior struggle.
- Periodic calibration after a long gap.

It does not need a rating for the tenth nearly identical cool morning walk.

---

## 6. When to Introduce the Loop

### Do not interrupt days 1–2

The product has not yet earned additional work from the owner.

Goals:

- Deliver readiness.
- Establish accuracy and tone.
- Make Home fast and reliable.

### Invite after three qualified readiness days

Use a non-paywalled educational card:

> **Teach NorthPaw Aoife's normal**  
> When you choose "Going now," NorthPaw can ask one quick question afterward. Everything stays on this device.

Actions:

- "Try it"
- "Maybe later"
- "How privacy works"

This is an invitation to a feature, not a sales pitch.

### Define a qualified readiness day

A day counts only when:

- Onboarding is complete.
- Weather or a clearly labeled cached fallback loads.
- A full readiness assessment renders.
- The app remains visible long enough to plausibly display the answer, or the owner interacts with it.
- The date is unique in the forecast location's calendar basis.

Store this locally.

### Re-invitation

If dismissed:

- Wait several qualified days.
- Reinvite only after a naturally relevant action such as repeated walk-window use or hand-test completion.
- Stop after a small approved number of dismissals.
- Always allow manual opt-in from Settings/Profile.

---

## 7. Companion Purchase Eligibility

### The principle

Do not sell an empty personalized product.

However, do not use an arbitrary loyalty wall. Eligibility should mean:

> This device now contains enough qualified private evidence for Companion to provide immediate, honest value.

### Recommended staged gates

#### Preview eligibility

After:

- At least 3 qualified readiness days.

The user may view:

- What Companion will learn.
- Privacy explanation.
- Baseline progress.
- A demo using clearly fictional/example data.

No purchase button yet.

#### Baseline-builder eligibility

After the owner opts in:

- "Going now" and post-outing check-ins become available for free.
- Raw history and all safety information remain free.

#### Purchase/trial eligibility

Initial hypothesis:

- At least 7 qualified readiness days.
- At least 5 qualified outing outcomes.
- Outcomes across at least 3 distinct days.
- Enough input quality to generate one real, appropriately cautious insight.

If these conditions are not met:

> Companion is still learning. You have 3 of 5 check-ins needed for a useful first baseline.

This is a starting hypothesis to test, not a permanent algorithmic truth.

### Why days alone are insufficient

A person can open for 20 days without recording one outing. Companion would know viewing behavior, not how the dog responded.

### Why check-ins alone are insufficient

Five check-ins from one weekend or one narrow condition cannot support a meaningful longitudinal product.

### Allow early interest without early purchase

If a user seeks Companion before eligibility:

- Explain what it does.
- Let them opt into baseline building.
- Let them join a local reminder/waitlist preference.
- Do not charge until personalized value is available.

If external email waitlisting is offered, it must be a separate explicit choice and not mixed into private Companion history.

---

## 8. What Is Free and What Is Paid

### Always free

- Current readiness and safety guidance.
- Pavement estimate and uncertainty.
- Basic dog-profile factors.
- "Going now."
- Post-outing primary check-in.
- Private raw outing records.
- Edit, delete, export, and reset.
- Basic early baseline progress.
- Serious-warning guidance.
- Ability to disable learning.

### Companion value

- Similar-condition recall.
- Personalized walk-window refinement.
- Seasonal comparison.
- Recovery-pattern interpretation.
- Personal trend explanations.
- Adaptive, history-aware notifications.
- Weekly/monthly private summaries.
- "What changed?" insights.
- Multiple personal baselines by outing type.
- Confidence and evidence-maturity views.

### Why this boundary is important

The owner's data belongs to the owner. NorthPaw should not collect a free baseline and then charge the owner merely to see or delete it.

The subscription pays for ongoing interpretation and continually improving on-device utility. Apple describes strong subscription products as providing continuing value, which fits Companion only if the insight continues to refresh and deepen.

---

## 9. The Minimum Viable Check-In

### Start interaction

One tap:

> Going now

Optional expandable controls:

- Planned: quick / normal / long.
- Intensity: easy / normal / hard.
- Route: exposed / mixed / shaded.

These should default from prior choices and should not block starting.

### Outcome interaction

One tap:

> As usual · Slowed down · Struggled · Didn't go

### Conditional follow-up

Only after slowed/struggled:

> What did you notice?

Optional chips.

### Recovery interaction

Do not ask routinely at first.

Use only when:

- The owner reported struggle/heavy panting.
- The owner explicitly opts into a recovery timer.
- The gold-star model needs a scheduled calibration sample.

### Avoid generic energy labels

`low / normal / high` is ambiguous:

- Does "high" mean the dog had high energy or the walk was high intensity?
- Does "low" mean normal calm behavior, fatigue, illness, or owner perception?

Use response wording tied to the dog's usual behavior.

---

## 10. Private Data to Prepare Before Purchase

### 10.1 Consent and prompt state

```ts
type CompanionSettings = {
  enabled: boolean;
  enabledAt: number | null;
  postOutingPrompts: boolean;
  promptFrequencyPolicy: string;
  dismissedInviteCount: number;
  lastInviteAt: number | null;
  learningPaused: boolean;
};
```

### 10.2 Qualified readiness

```ts
type QualifiedReadinessDay = {
  localDate: string;
  renderedAt: number;
  sourceFreshness: string;
  assessmentVersion: string;
  confidence: string;
};
```

Do not store a complete duplicate assessment for every passive Home render. Store only what the eligibility system needs.

### 10.3 Outing intent

```ts
type OutingIntent = {
  id: string;
  dogId: string;
  startedAt: number;
  source: 'home' | 'hand_test' | 'walk_window' | 'manual';
  intendedDurationBand: 'quick' | 'normal' | 'long' | null;
  intensity: 'relief' | 'easy' | 'moderate' | 'hard' | null;
  shade: 'exposed' | 'mixed' | 'mostly_shaded' | null;
  surfaceMix: string | null;
  assessmentSnapshotId: string;
  status: 'started' | 'cancelled' | 'outcome_recorded' | 'expired';
};
```

### 10.4 Environmental snapshot

Store:

- Complete timestamp.
- Forecast location grid/coarse area, not exact GPS by default.
- Normalized weather inputs.
- Surface estimate and uncertainty.
- Risk-vector components.
- Data-quality/provenance.
- Algorithm and parameter versions.

Do not store:

- Exact route.
- Background location trail.
- Unnecessary photos.
- Provider payload fields with no future analytic purpose.

### 10.5 Outcome

```ts
type OutingOutcome = {
  outingId: string;
  recordedAt: number;
  primaryResponse: 'as_usual' | 'slowed' | 'struggled' | 'did_not_go';
  signals: string[];
  recoveryBand: string | null;
  ownerConfidence: 'low' | 'medium' | 'high' | null;
};
```

### 10.6 Derived eligibility

Derived values should be reproducible:

- Qualified readiness days.
- Qualified outing count.
- Distinct outing days.
- Condition coverage.
- Personal evidence maturity.
- First-insight availability.
- Purchase eligibility.

Do not store only a mutable count without retaining enough local evidence to rebuild it.

---

## 11. Privacy Boundary and Immediate Analytics Concern

The Companion promise says personal information stays on-device.

The current analytics implementation sends or is designed to send several dog-specific and condition-specific properties to Mixpanel, including:

- Dog breed.
- Weight/size.
- Coat type and color.
- Snout profile.
- Activity baseline.
- Current weather/forecast.
- NPI-related values.
- Dog name and safety-card details during sharing.
- Quick-log energy and NPI.

This does not match a strict interpretation of "everything personal stays private."

Before launching a private baseline, perform a telemetry privacy reset.

### Recommended Mixpanel boundary

Allowed product analytics:

- Feature impression.
- Feature tap.
- Prompt shown.
- Prompt dismissed.
- Check-in flow completed, as a boolean event only.
- Locally calculated eligibility milestone reached.
- Trial/paywall/store funnel events.
- App version and platform.

Do not send:

- Check-in response.
- Symptoms/signals.
- Dog identity or traits.
- Exact or coarse personal environmental history.
- NPI or surface temperature tied to a user.
- Location.
- Free text.
- Personal-model output.
- Similar-condition insight contents.

Example safe events:

```text
companion_invite_viewed
companion_invite_accepted
outing_intent_started
post_outing_prompt_delivered
post_outing_flow_completed
companion_baseline_milestone_reached
companion_first_insight_viewed
companion_offer_viewed
companion_trial_started
companion_purchase_completed
```

Properties should be limited to non-sensitive product state such as:

- App version.
- UI source.
- Eligibility stage as a broad enum.
- Prompt type.
- Experiment assignment.

Never send the outcome selected.

### Local analytics for private model quality

Quality information can remain on-device:

- Prompt completion rate.
- Missing feedback.
- Effective sample.
- Condition coverage.
- Personal-model confidence.

The user can optionally export a diagnostic report after previewing it. It should never upload automatically.

---

## 12. Stickiness Without Forced Logging

Companion should not be the only retention strategy.

### 12.1 Better glance value

- "Best window closes at 8:40 AM."
- "Surface risk rises around 10 AM."
- "Today is more humid than yesterday."
- "Forecast confidence is lower than usual."
- "The evening surface cools later than the air."

These deepen the existing habit without requiring input.

### 12.2 Morning Brief

The brief should answer:

- Best upcoming window.
- Deadline.
- Primary risk.
- One preparation action.

Avoid generic weather narration.

### 12.3 Condition-change alerts

Only for meaningful changes:

- Window materially shifts.
- Heat/wind/precipitation changes the recommendation.
- Confidence deteriorates.

Quiet defaults and user control are essential.

### 12.4 Weekly private reflection

Even before paid Companion:

> You checked Aoife's conditions on 4 days this week. Morning windows were generally more favorable.

This uses local readiness data and demonstrates continuity without demanding walk reports.

### 12.5 Hand-test bridge

The hand test is the strongest observed active ritual:

- 75 users opened it.
- 44 started it.
- 39 completed it.

After completion, offer:

> Ground checked. Going now?

This is a natural, contextually earned entry into outing intent.

### 12.6 Walk-window bridge

After a user selects a future window:

> Remind me at this window

At the time:

> Ready for the window you chose?

If the owner confirms, create outing intent.

### 12.7 No shame streaks

Use:

- "Prepared on 5 days."
- "3 private check-ins."
- "Baseline is taking shape."

Avoid:

- Broken streak warnings.
- Guilt for rest days.
- Pressure to walk in marginal conditions.
- Rewards for longer or hotter outings.

---

## 13. Alternatives to Asking After Every Walk

### Option A: Explicit outing loop

`Going now` → post-walk response.

**Strengths**

- Highest context quality.
- Clear consent.
- Correct start timestamp.
- Natural prompt timing.

**Weakness**

- Requires a new pre-walk tap.

**Recommendation:** Primary path.

### Option B: Opportunistic sampling

Ask only after hand-test completion, chosen walk-window use, or a self-initiated outing.

**Strengths**

- Lower burden.
- Higher-information situations.

**Weakness**

- Biased toward engaged users and unusual conditions.

**Recommendation:** Use with Option A, not alone.

### Option C: Weekly memory prompt

> Any walk stand out this week?

**Strengths**

- Very low notification burden.

**Weakness**

- Recall bias.
- Poor timestamp/environment matching.

**Recommendation:** Journal fallback, not calibration foundation.

### Option D: Passive inference

Infer walks from time, location, or motion.

**Strengths**

- Low manual effort.

**Weaknesses**

- Privacy cost.
- Battery cost.
- Incorrect inference.
- Background permission complexity.
- Contradicts the clearest privacy story.

**Recommendation:** Do not use for the near-term Companion.

### Option E: No outcome collection

Build Companion only from app-use preferences and weather.

**Strengths**

- No reporting burden.

**Weakness**

- Cannot support "Aoife slowed in similar conditions."
- Learns owner viewing behavior, not dog response.

**Recommendation:** Useful for preference personalization, insufficient for tolerance insight.

### Recommended blend

- Explicit outing start.
- Selective outcome prompt.
- Voluntary manual entry.
- Occasional high-information sampling.
- Passive weather/context capture only after explicit start.
- No background route tracking.

---

## 14. Monetization Strategy

### 14.1 Sell insight, not collection

The check-in loop must be useful and free. Otherwise users are being asked to perform unpaid setup for a product they may never access.

### 14.2 The earned offer

Show the offer after a real private insight:

```text
Aoife's baseline is beginning to form.

Companion can now:
• Compare today's conditions with her prior outings
• Adjust preferred windows from her response history
• Watch seasonal changes
• Build quiet, history-aware reminders
```

### 14.3 Trial timing

Start a free trial only when:

- A baseline exists.
- The first personalized insight can be shown immediately.
- At least one future Companion action is scheduled or available.

A trial before baseline spends trial days waiting for the product to become useful.

### 14.4 Subscription versus one-time purchase

Companion can support subscription value if it continually:

- Ingests new private outings.
- Recalculates patterns.
- Adapts seasonally.
- Produces continuing summaries and alerts.
- Receives evidence/model updates.

If it becomes a static history graph, a recurring subscription will be harder to justify.

### 14.5 Do not lock safety after cancellation

After cancellation:

- Free safety remains.
- Raw history remains.
- Export/delete remains.
- Prior records remain intact.
- Paid interpretations can stop updating or become read-only according to a clear policy.

Do not delete or hostage the baseline.

---

## 15. Product Experiments

Run experiments sequentially because the current population is small.

### Experiment 0: Telemetry integrity

Before UX testing:

- Correct unique-event/user definitions.
- Remove duplicated monetization semantics.
- Distinguish true readiness from app open.
- Add app-version segmentation.
- Establish the private analytics allowlist.

### Experiment 1: Invitation concept

Compare qualitative comprehension and opt-in for:

- "Teach NorthPaw Aoife's normal."
- "Build Aoife's private baseline."
- "Unlock personal outing patterns."

Measure:

- Understands purpose.
- Understands privacy.
- Accepts/declines.
- Does not expect medical monitoring.

### Experiment 2: Start action

Compare:

- Going now.
- Start outing.
- Use this window.

Measure:

- Tap rate among eligible users.
- Accidental starts.
- Cancellation.
- Five-second comprehension.

### Experiment 3: Outcome language

Compare:

- As usual / Slowed / Struggled.
- Great / Okay / Hard.
- Full energy / Less energy / Stopped early.

Choose the version with the best inter-user interpretation and least ambiguity, not simply highest clicks.

### Experiment 4: Trigger location

Test separately:

- Home beneath primary recommendation.
- After hand test.
- At selected walk window.
- Local notification after explicit start.

### Experiment 5: Prompt cadence

Compare:

- Every explicitly started outing.
- Maximum two per week.
- High-information conditions only.

Evaluate completion, mute/dismiss behavior, retention, and data coverage.

### Experiment 6: First insight

Test whether a truthful early reflection increases:

- Continued check-ins.
- Qualified readiness days.
- Companion interest.

### Experiment 7: Eligibility gate

Compare eligibility hypotheses only after enough users complete baselines:

- 5 outcomes across 3 days.
- 7 outcomes across 5 days.
- Insight-based gate independent of raw count.

Do not compare revenue until each group can actually receive value.

### Experiment 8: Offer framing

Compare:

- Private personal patterns.
- Better timing.
- Seasonal adaptation.
- Similar-condition recall.

Avoid combining unrelated benefits that obscure the core product.

---

## 16. Metrics for the Transition

### Core free value

- Qualified readiness days per active user.
- Time to readiness render.
- Readiness-render success.
- Walk-window use.
- Hand-test completion.
- Meaningful five-second sessions.

### Baseline-builder funnel

```text
Eligible for invitation
→ Invitation viewed
→ Baseline opted in
→ Outing intent started
→ Post-outing prompt delivered
→ Outcome flow completed
→ Third qualified outcome
→ Fifth qualified outcome
→ First insight viewed
```

### Companion funnel

```text
First real insight viewed
→ Companion offer viewed
→ Trial started
→ Companion used during trial
→ Purchase completed
→ Renewal
```

### Quality

Keep private or export only with explicit consent:

- Missing outcome rate.
- Effective personal sample.
- Context coverage.
- Contradictory reports.
- Personal confidence maturity.

### Guardrail metrics

- Readiness retention does not decline.
- Notification disable/mute rate.
- Invitation dismissals.
- Outcome-flow abandonment.
- App deletion/support complaints.
- Misunderstanding of monitoring or safety guarantees.
- Severe-warning path comprehension.

### Avoid vanity metrics

- Raw prompt sends.
- Total rows collected.
- Streak length.
- Event count without unique users.
- Paywall event count without purchase truth.

---

## 17. Initial Success Criteria

Because the current sample is small, begin with explicit hypotheses rather than pretending the thresholds are known.

Candidate beta gates:

- Most invited users understand that the feature is optional and on-device.
- Median primary outcome response takes under five seconds.
- A clear majority of delivered prompts after explicit starts are answered or intentionally dismissed.
- Prompt disable/mute remains below a pre-registered tolerance.
- Existing readiness-day retention does not materially decline.
- At least a meaningful minority reaches five qualified outcomes without incentives.
- First-insight viewers understand it as an observation, not a guarantee.
- Users can explain why Companion is worth paying for before they see a price.

Set numerical thresholds before each experiment and avoid changing them after results arrive.

---

## 18. Rollout Plan

### Phase 0: Privacy and measurement cleanup

- Audit all Mixpanel fields.
- Remove dog identity, profile, personal condition, and outcome properties.
- Correct monetization event semantics.
- Rename or replace the current readiness-day counter.
- Define qualified readiness locally.

### Phase 1: Private foundation

- Add local consent/settings.
- Add outing intent and assessment snapshot.
- Add outcome structure.
- Add export, deletion, reset, and learning pause.
- No purchase flow.

### Phase 2: Baseline-builder beta

- Invite a small repeat-user cohort.
- Add "Going now."
- Add one-question outcome prompt.
- Test burden and comprehension.
- Keep all insights descriptive.

### Phase 3: Free early reflection

- Add baseline progress.
- Add first cautious local patterns.
- Validate statements against stored records.
- Test whether the loop creates value without pressure.

### Phase 4: Companion preview

- Show future capabilities after the first useful insight.
- Explain local-only learning.
- Add eligibility progress for interested users.
- Still no purchase if value is not ready.

### Phase 5: Companion trial

- Offer only to evidence-eligible users.
- Begin trial at immediate personalized value.
- Measure continuing use rather than paywall taps.

### Phase 6: Paid Companion

- Activate only after:
  - Algorithm safety gates.
  - Privacy tests.
  - Baseline UX evidence.
  - First-insight comprehension.
  - Store transaction correctness.
  - Cancellation/data-access policy.

---

## 19. What Not to Build Yet

- A mandatory before-walk questionnaire.
- A 1–5 rating after every walk.
- Background route/location tracking.
- Automatic claims about heat tolerance.
- A paywall triggered only by app-open count.
- A purchase flow before personalized value exists.
- A complex journal as the default path.
- Generic motivational streaks.
- Social comparisons.
- Cloud account/sync before the private local product is proven.
- Smart-collar dependency.
- LLM interpretation of free-text health notes.
- A dashboard full of trends with fewer than the minimum qualified observations.

---

## 20. Product Decisions to Make

Before implementation, decide:

1. What exactly is a qualified readiness day?
2. What action declares an outing?
3. What is the primary outcome vocabulary?
4. What is the default prompt delay?
5. When should prompts self-suppress?
6. What qualifies an outing outcome?
7. What minimum evidence unlocks the first free reflection?
8. What minimum evidence permits purchase?
9. Which raw history views remain free?
10. What happens to paid insights after cancellation?
11. Which aggregate events may leave the device?
12. What claims are forbidden until gold-star validation?

These should become versioned product-policy constants rather than scattered UI decisions.

---

## 21. Recommended Product Decision

Proceed with Companion, but treat the next step as proving a **low-burden private feedback loop**, not building the paid algorithm immediately.

The recommended wedge is:

```text
Qualified repeat user
    ↓
Optional private baseline invitation
    ↓
"Going now"
    ↓
Automatic local context snapshot
    ↓
"How did Aoife handle it?"
    ↓
Immediate baseline progress
    ↓
First truthful free reflection
    ↓
Evidence-gated Companion trial
```

Do not ask the user to rank every walk. Ask for one meaningful signal after outings the owner explicitly starts in NorthPaw, then become selective as the baseline grows.

Your instinct to delay the upsell is strong. The refinement is:

> Do not unlock Companion after X days simply because the user has been loyal. Unlock it when NorthPaw has both earned trust and accumulated enough private evidence to deliver value on day one of the purchase.

---

## 22. References and Internal Sources

### NorthPaw evidence

- `documentation/notebooklm/metrics/mixpanel_export.json`
- `documentation/notebooklm/metrics/mixpanel_export_summary.md`
- `documentation/notebooklm/metrics/mixpanel_telemetry_and_api_guide.md`
- `documentation/personal_doc/compainon.md`
- `documentation/algo_north_star.md`
- `documentation/algo_update_testdrivedev_testcases_north_star.md`

### External design evidence

- [Compliance with mobile ecological momentary assessment: systematic review and meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC7970161/) — mobile self-report can achieve strong compliance, but protocols and burden vary substantially; NorthPaw must test its specific interaction.
- [Ecological momentary assessment design and compliance meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC9999286/) — longer protocols often use fewer prompts, and compliance/retention should be measured directly rather than assumed.
- [Apple subscription guidance](https://developer.apple.com/app-store/subscriptions/) — recurring subscriptions should provide ongoing value.
- [Apple in-app purchase design guidance](https://developer.apple.com/design/human-interface-guidelines/in-app-purchase) — allowing users to experience value before purchase is an established freemium approach.

---

## 23. Final Principle

NorthPaw does not need to turn every owner into a diligent logger.

It needs to:

- Recognize the moment an owner is already making an outing decision.
- Capture context without extra work.
- Ask one question the owner can answer honestly.
- Return value quickly.
- Ask less as it learns more.
- Keep the entire personal story on the device.
- Offer Companion only when that story is ready to become genuinely useful.

The transition succeeds when logging stops feeling like data entry and starts feeling like NorthPaw remembering Aoife.
