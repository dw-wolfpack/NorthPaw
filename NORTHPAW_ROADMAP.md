# NorthPaw Product + Moat Roadmap

Last updated: 2026-04-21 (rev 2)
Owner: Product + Engineering
Status: Draft for review

## Purpose

Turn NorthPaw from a useful readiness utility into a trusted "Safety Intelligence" product with daily retention and long-term emotional stickiness, without losing focus or overbuilding too early.

## Product Principle

NorthPaw should answer one question fast:
"What matters for this dog outing right now, and what should I do next?"

Everything in this roadmap must strengthen that loop.

---

## Phase Overview

| Phase | Theme | Core Deliverable | Primary Metric |
|---|---|---|---|
| MVP | Safety + Trust | NorthPaw Index (NPI) + live weather risk inputs | Pre-outing NPI open rate |
| V1 | Daily Habit | Morning Brief + walk windows + pavement safety timing | L7 retention and weekly frequency |
| V1.5 | Utility Expansion | Smart Pack recommendations + light Gear Vault toggles | Checklist completion and smart-pack adoption |
| V2 | Emotional Moat | Paw-Print Archive + optional sharing handoff | 60/90-day retention and churn reduction |
| Parallel Track | Design Excellence | Hero-first UI system, depth/motion/haptics polish | NPI interaction depth and premium UX sentiment |

---

## Phase MVP: Safety + Trust

### Goal

Formalize the current weather/risk logic into a named, user-facing "NorthPaw Index (NPI)" with transparent reasoning.

### Why now

- Core primitives already exist (weather fetch, road temp estimation, dog modifiers, content engine).
- This is the strongest moat and credibility anchor.
- Trust in NPI should come before adding heavier feature layers.

### Build scope

1. **Define NPI model (v1)**
   - Create a single score and label (example: 1-10 or 0-100 with risk bands).
   - Inputs should include:
     - Air temp
     - Estimated pavement temp
     - Precip/wetness
     - Wind
     - Humidity (when available)
     - Dog profile modifiers (coat/color + snout shape in MVP; extend to size/age/activity tolerance later)
   - Keep framing educational and non-diagnostic.
   - Implement a humidity-risk curve tuned for canine panting constraints (dog-centric, not generic human heat index).
   - Include an explicit brachycephalic penalty in v1 (recommended default: +2 risk step or equivalent score weight).
   - Baseline proxy for Sprint A may use a canine-weighted THI variant:
     - `THI = AirTemp - (0.55 - 0.0055 * Humidity) * (AirTemp - 58)`
   - Input safety check for THI:
     - Treat RH as whole-number percent (for example `60`, not `0.60`) before formula application.
     - If ingest layer returns decimal humidity, normalize to 0-100 first.
   - Initial profile modifiers (v1 defaults):
     - `brachycephalic => +15%` final risk score
     - `double_thick_coat => +10%` final risk score
   - Implementation rule: `get_npi_score()` must accept full `dog_profile` as a primary input, not a post-hoc adjustment.

2. **NPI thermodynamics deep-dive (Sprint A)**
   - Add a humidity multiplier policy for high-heat days:
     - Working rule for v1 calibration: for each +5F above 85F, relative humidity must drop by ~20% to maintain similar canine heat tolerance.
   - Treat this as a conservative risk model and validate against real user outcomes/feedback.
   - Document assumptions and update cadence in an internal "NPI model notes" file.

3. **Replace mock signals with live data**
   - Replace mock AQI with live AQI source.
   - Replace mock recent-rain with real precipitation history.
   - Add fallback behavior when data is missing.
   - Store data timestamp + source distance metadata for confidence scoring.

4. **Add NPI explanation UI**
   - "Why this score?" drill-in with plain-language factors.
   - Show confidence level (High/Medium/Low) based on data completeness/freshness.
   - Include safety phrasing and uncertainty guardrails.
   - Add a "worst-case surface" note when shade certainty is unavailable.
   - Add a verification prompt for real-world conditions:
     - Example: "Route not shaded? Use the 5-second hand test before committing to asphalt."

5. **Event instrumentation**
   - `npi_viewed`
   - `npi_explainer_opened`
   - `npi_cta_clicked` (for checklist/card navigation)
   - `npi_verification_prompt_opened`
   - `npi_confidence_badge_viewed`

### Exit criteria

- Users can understand "what this means for my dog" in under 5 seconds on Home.
- NPI explainer usage indicates trust-building behavior.
- Mock dependencies are removed from production logic.
- Pug/flat-faced test personas show meaningfully different risk outputs vs non-brachycephalic profiles in identical weather.

---

## Phase V1: Daily Habit (Micro-Preparedness)

### Goal

Move from "weekend utility" to "daily readiness companion" with low-noise morning planning.

### Build scope

1. **Morning Brief (7:00 AM local, opt-in)**
   - "Best walk window today"
   - "Paws-on-pavement safe until X"
   - Optional environmental caution line (pollen/tick/air quality)
   - Copy should be prescriptive and deadline-oriented ("warning day," "safe before X"), not generic forecast narration.

2. **Walk window engine**
   - Compute best 2-hour block based on NPI trend across day.
   - Summer behavior: prioritize coolest/safest window.
   - Cooler seasons: prioritize comfortable daylight window.

3. **Notification controls**
   - Quiet defaults (no spam mechanics).
   - User-selectable cadence and alert types.
   - Clear pre-permission explanation copy.

4. **Instrumentation**
   - `morning_brief_sent`
   - `morning_brief_opened`
   - `session_started_after_brief`
   - `walk_window_viewed`
   - `walk_window_deadline_crossed`

### Exit criteria

- Meaningful increase in weekly active frequency.
- Strong "open after brief" behavior.
- No major increase in notification disables/uninstalls.

---

## Phase V1.5: Smart Pack + Light Gear Vault

### Goal

Convert forecast intelligence into practical "what to bring" behavior with low setup friction.

### Build scope

1. **Dynamic checklist composition**
   - Contextually add/remove checklist items from weather and conditions.
   - Examples:
     - Wet/muddy: towels, paw cleanup.
     - High heat/UV: cooling tools, shade strategy.
   - Keep logic deterministic and explainable.

2. **Light Gear Vault (toggle-first)**
   - Start with inferred ownership prompts in-context instead of long setup forms.
   - Example prompt: "It is getting hot. Do you have a cooling vest for [Dog]?"
   - Save yes/no to Gear Vault and reuse in future Smart Pack generation.
   - Use owned gear in smart-pack recommendations.

3. **Missing-item pathways**
   - "Do this now" fallback tips when item unavailable.
   - Optional affiliate links only after trust baseline is proven.
   - Include a DIY fallback before purchase links to preserve trust-first product tone.

4. **Instrumentation**
   - `smart_pack_generated`
   - `smart_pack_item_completed`
   - `gear_toggle_updated`
   - `missing_item_action_clicked`

### Exit criteria

- Checklist completion rate rises vs static baseline.
- Users interact with suggested pack items, not just weather cards.

---

## Phase V2: Paw-Print Archive (Emotional Moat)

### Goal

Create long-term emotional and historical value so the app is hard to replace.

### Build scope

1. **Adventure/Paw-Print timeline**
   - Save outing snapshot: date, location, NPI context, quick notes.
   - Optional one-photo "hero shot."

2. **Quick-log post-outing**
   - 5-second check-in (energy low/normal/high, paws, hydration note).
   - Keep as light memory aid, not medical tracking.
   - Persist weather context with each quick log (temp, humidity, NPI band).

3. **Weather Flashbacks (personalized safety memory)**
   - Detect prior low-energy or caution outcomes under similar weather signatures.
   - Surface context-aware reminders:
     - Example: "Last time humidity was this high, [Dog] struggled. Consider shorter/shaded route."
   - Keep language suggestive, never diagnostic.

4. **Optional handoff/share**
   - Export brief for spouse/dog-walker:
     - Current readiness note
     - Conditions caveat
     - Checklist status

5. **Instrumentation**
   - `outing_logged`
   - `quick_log_completed`
   - `archive_viewed`
   - `share_brief_sent`
   - `weather_flashback_shown`
   - `weather_flashback_opened`

### Exit criteria

- Archive revisit behavior appears in repeat sessions.
- Retention improves in cohorts that use logs/photos.

---

## Data + Systems Priorities (Cross-Phase)

1. Replace all mock environmental inputs before marketing "intelligence."
2. Add explicit confidence scoring on modeled outputs.
3. Keep deterministic rules over black-box models for trust.
4. Preserve local-first privacy posture where feasible.
5. Maintain clear non-veterinary, non-diagnostic copy.
6. Keep NPI output conservative when uncertainty is high (do not imply precision where sensor data is stale/sparse).

### Data Confidence UX Policy

- Always show confidence badge with NPI when any core input is stale, distant, or imputed.
- Example user-facing note:
  - "Current NPI: 4 (Moderate). Local sensors are still updating, use judgment if ground feels hotter."
- Confidence inputs should include:
  - Source freshness timestamp
  - Approximate source distance
  - Missing-variable fallbacks (for example, inferred humidity/rain fields)

### NWS-Only Fallback Matrix (Product Rule)

When premium signals are unavailable, preserve "Safety Intelligence" using transparent NWS proxies:

- **AQI (live) missing**
  - Proxy: NWS hazards + forecast text smoke/haze parsing.
  - UI copy pattern: "No active AQ alerts. Forecast looks clear for sensitive paws."
  - Environmental text-scan keywords (v1): `smoke`, `haze`, `air quality`, `wildfire`, `dust`, `pollutants`.
  - If keyword hit exists without active hazard, set Sensor Status to `Fair` and show cautionary copy.
- **Rain history missing**
  - Proxy: nearest-station observations (`precipitationLast3Hours` / `precipitationLast24Hours`).
  - Secondary proxy: prior `forecastGridData` precipitation probability persistence.
  - UI copy pattern: "Station [X] reported recent rain. Expect muddy paws on trails."
- **Pollen feed missing**
  - Proxy: dry + windy + seasonal heuristic (`humidity < 30%`, `wind > 15mph`, spring/fall bias).
  - UI copy pattern: "Dry and windy conditions can raise pollen exposure. Consider a post-walk wipe."
- **UV feed missing**
  - Proxy: `skyCover` + time window (11:00 AM to 3:00 PM) for high sun exposure.
  - UI copy pattern: "Direct overhead sun. Seek shade to reduce overheating risk."
- **Pavement certainty limited**
  - Proxy: `roadTemp.ts` estimate with low-wind confidence warning.
  - UI copy pattern: "Surface heat model shows high risk. Low wind means pavement can hold heat longer."

### Uncertainty Moat Policy

- Never hide data gaps; label them clearly in UI.
- Add "Sensor Status" messaging whenever proxy logic is used (for example: "Sensor Status: Fair. Using regional estimates.").
- Trust rule: transparent uncertainty beats false precision.

---

## Risks and Guardrails

- **Risk: Overclaiming precision**
  - Guardrail: confidence labels + "planning estimate" language.
  - Guardrail: frame road temperature as exposed-surface estimate unless route shade is confirmed.

- **Risk: Notification fatigue**
  - Guardrail: quiet defaults, easy controls, no engagement spam.

- **Risk: Feature sprawl**
  - Guardrail: roadmap gate = reduces uncertainty before/during outing.

- **Risk: Setup burden**
  - Guardrail: light toggles first, defer full inventory systems.

- **Risk: Trust erosion in health-adjacent space**
  - Guardrail: educational framing, no diagnosis/treatment claims.

---

## Parallel Track: Design Excellence

### Goal

Make NorthPaw feel premium, tactile, and emotionally resonant while preserving fast readability for safety decisions.

### Design directives

1. **Break the boxy grid**
   - Favor superellipse-like rounding (`borderRadius` 16 to 24) over rigid 12px corners.
   - Use continuous-corner "squircle" approximation (not simple hard arcs).
   - For deeper curves (for example `borderRadius: 24`), keep internal padding generous (target `>= 20`) so content does not feel pinched.
   - Add depth layering so cards do not feel glued to the background.
   - Use subtle inner borders (for example `rgba(255,255,255,0.05)`) to create rim light.
   - Combine rim light with soft depth shadow for dark surfaces:
     - `shadowOpacity: 0.5`
     - `shadowRadius: 10`
   - Where legibility allows, use frosted material surfaces via `expo-blur`.
   - Design-agent prompt anchor for consistency:
     - "For `Glass_Base` cards, use `borderRadius: 24`, internal padding `>= 20`, `borderWidth: 1`, and `Rim_Light` token border color."

2. **Elevate NPI timeline as hero surface**
   - Treat "Today's timeline" as a branded visual instrument, not a data table.
   - Add safe-window emphasis (soft glow/pulse) for best windows.
   - Prefer glow emphasis on the best-window bar/gauge, not full-screen flashing.
   - For advanced treatment, use `react-native-skia` for performant outer glow and halo.
   - Heartbeat implementation preference:
     - Use `react-native-reanimated` `useDerivedValue` + `withRepeat` loop to animate glow spread/intensity.
     - Prefer animating glow radius/intensity over whole-card opacity for performance and polish.
   - Prefer adaptive, low-motion gradients tied to NPI state:
     - high risk => faint ember/orange pulse
     - safe => calm forest-green breathing tone
   - Pulse model should feel like a heartbeat, not a siren (slow, low amplitude loop).

3. **Interaction feel**
   - Add hour-step haptics while scrubbing timeline (`expo-haptics` light impact at each 1-hour increment).
   - Use `react-native-reanimated` for state transitions (CTA morphs, staggered checklist reveals).
   - Keep animation budget subtle and purposeful (safety clarity over novelty).
   - Keep tactile interactions concentrated on high-value actions (timeline scrub, verify-ground ritual, checklist state changes).

4. **Ready screen hierarchy**
   - Move toward full-screen hero layout where dog identity + NPI are the dominant focal points.
   - Keep technical details behind progressive disclosure (`Why this score?` overlays/sheets).

### Delivery plan

- **Sprint A Design pass**
  - Define component tokens for glass, depth, radius, and motion.
  - Prototype one premium timeline treatment on Home.
  - Validate readability in light and dark schemes.
  - Implement visual token baseline:
    - `Glass_Base`: `expo-blur` intensity 20 + `rgba(15, 23, 20, 0.7)`
    - `Rim_Light`: `rgba(255, 255, 255, 0.08)`
    - `Safety_Green`: `#2ECC71` with soft glow
    - `Risk_Amber`: `#F39C12` with breathing animation
    - `Haptic_Step`: light impact at each timeline hour step
  - Validate heartbeat animation implementation on mid-tier devices:
    - glow-based pulse via `useDerivedValue` (not full-screen/card opacity pulsing)
    - stable frame pacing during timeline interactions

- **Sprint B Design pass**
  - Add haptic scrubbing and transition polish to main readiness actions.
  - Finalize mission-brief card templates and alert visual language.
  - Run before/after usability check: can users still make a safe decision in <5 seconds?
  - Implement premium "Verify Ground Temp" ritual:
    - trigger from caution pavement bands
    - blur out background heavily while active (target high intensity)
    - central thermal ring fills over 5 seconds
    - completion haptic resolves with heavy confirmation

### Success criteria

- Users engage with NPI timeline and "Why this score?" more frequently after visual refresh.
- No regressions in scan speed, contrast accessibility, or battery-impact tolerance.
- Qualitative feedback shifts from "informative" to "trustworthy + premium."

---

## KPI Framework by Phase

- **MVP (Safety + Trust)**
  - Pre-outing NPI opens per active user
  - NPI explainer open rate
  - Checklist starts from NPI surfaces

- **V1 (Daily Habit)**
  - L7 retention uplift
  - Weekly sessions per user
  - Session starts within 30 min of morning brief

- **V1.5 (Smart Pack)**
  - Smart-pack checklist completion rate
  - Gear toggle adoption
  - Suggested-item interaction rate

- **V2 (Emotional Moat)**
  - 60/90-day retention
  - Archive revisit rate
  - Churn delta for archive users vs non-users

---

## Recommended Immediate Next 2 Sprints

### Sprint A (Foundation, NWS-first)

1. Finalize NPI model spec (dog-centric thermodynamics, not human heat index):
   - Inputs: air temp, humidity, sky-cover/solar, wind, pavement estimate, and dog profile modifiers.
   - Include explicit brachycephalic and coat/color penalties.
   - Define confidence policy and uncertainty copy rules.
2. Implement NWS-only fallback matrix in data layer:
   - AQI proxy via hazards + smoke/haze text parsing.
   - Rain-history proxy via nearest-station precipitation fields, with grid-based fallback heuristics.
   - Pollen proxy via dry/windy/seasonal heuristic.
   - UV proxy via sky-cover + midday timing.
   - Pavement risk confidence adjustments based on wind and data freshness.
3. Replace mock paths with production-safe fallback logic:
   - Remove mock AQI and mock rain from user-facing decision logic.
   - Add freshness, source distance, and signal quality metadata to modeled outputs.
4. Ship NPI explanation surfaces:
   - "Why this score?" factor breakdown.
   - Confidence badge + Sensor Status messaging.
   - 5-second hand-test verification prompt when surface/shade uncertainty is high.
   - Interactive "Verify Ground Temp" tool on caution bands (for example 100F to 115F pavement estimate):
     - Tap opens a 5-second timer ritual.
     - Completion copy: "Too hot to hold? Walk on grass."
5. Instrument and validate:
   - `npi_viewed`, `npi_explainer_opened`, `npi_confidence_badge_viewed`, `npi_verification_prompt_opened`
   - Fallback usage telemetry (`aqi_proxy_used`, `rain_proxy_used`, `pollen_proxy_used`, `uv_proxy_used`)
   - Metadata completeness telemetry: station distance + timestamp present rate.
   - Success criteria: users understand score quickly, trust behaviors increase, no overclaiming language.
   - Add explicit Sprint A QA checks:
     - Rain proxy (`precipitationLast3Hours` / `precipitationLast24Hours`) can trigger muddy-paws pathways.
     - Sensor Status transitions correctly (`High`, `Medium`, `Fair`) as data quality changes.

### Sprint B (Habit Pilot)

1. Ship Morning Brief as opt-in experiment.
2. Add walk-window computation from day timeline.
3. Add notification settings and disable reasons tracking.
4. Evaluate retention lift and alert fatigue before scale-up.
5. Enforce deadline-oriented briefing copy:
   - Prefer "window closes at X" and "risk rises by Y time" over descriptive weather narration.
   - Keep mission-brief tone: actionable, dog-specific, concise.

---

## Decision Gates

Only move to next phase when current phase criteria are met:

1. **MVP -> V1:** NPI is trusted and frequently opened.
2. **V1 -> V1.5:** daily habit signal is real (not one-off novelty).
3. **V1.5 -> V2:** users act on smart packs; utility loop is sticky.

If a gate is missed, improve current phase before expanding scope.

### Post-Sprint A Measurement Gate (NPI Trust)

- Track `npi_explainer_open_rate` as a trust signal, not vanity.
- If explainer engagement is low:
  - simplify factor labels and score breakdown language,
  - improve "Why this score?" CTA placement on Home,
  - test one-tap micro-explanations before deep drill-in.

### V2 Discovery Add-On (Optional)

- Add lightweight "Safety Milestone" badges to archive (for example, "Heat Wave Hero").
- Trigger concept:
  - User logs 5 successful optimal-window walks in a week where NPI is consistently high.
- Constraint:
  - reinforce preparedness identity without streak-pressure or shame mechanics.

