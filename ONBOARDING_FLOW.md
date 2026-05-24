# NorthPaw Onboarding Flow

Last updated: 2026-04-21  
Owner: Product + Design + Engineering  
Status: Draft (current + proposed premium calibration flow)

## Purpose

Define onboarding as an **intelligence calibration ritual**, not just utility signup.  
NorthPaw onboarding should make users feel:

1. The app understands their specific dog.
2. The safety model is personalized and science-backed.
3. The Morning Brief habit has immediate value.

---

## Current Flow (As Implemented)

Source: `app/onboarding.tsx`

1. **Welcome**
   - Message: setup in under a minute
   - CTA: `Get started`

2. **Name**
   - Ask: dog name
   - Input: text

3. **Photo**
   - Ask: add dog photo (optional)
   - Actions: choose photo, skip, continue

4. **Breed**
   - Ask: dog breed
   - Inputs: searchable breed list or mixed-breed toggle + primary mix

5. **Biology**
   - Inputs: weight, coat type, fur color
   - Intent: heat/hydration tuning

6. **Age**
   - Options: puppy, young, adult, senior

7. **Outings**
   - Multi-select outing types

8. **Location**
   - Ask for foreground location permission
   - Skip path supported

9. **Aha**
   - Show live conditions and initial pack/checklist guidance

10. **Notifications**
   - Ask for alert permission
   - Actions: allow or not now

---

## Premium Safety Onboarding (Proposed)

### Product framing

Replace "tell us about your dog" tone with:
- "We are calibrating your dog’s safety model."
- "These inputs power your NorthPaw Index (NPI)."

### New strategic inputs (Science layer)

Add these as first-class calibration inputs:

1. **Snout Profile**
   - Prompt: "How is [Dog]'s snout?"
   - Options:
     - Flat/Smushed (for example Pug, Bulldog)
     - Standard
     - Long (for example Greyhound)
   - Why:
     - Directly used in NPI risk weighting.
     - Makes personalization obvious early.

2. **Activity Baseline**
   - Prompt: "What is [Dog]'s usual energy level?"
   - Options:
     - Low energy
     - Moderate
     - High intensity
   - Why:
     - Tunes future walk-window recommendations.
     - Improves V1 Morning Brief relevance.

---

## Experience Design Upgrades

### 1) Intelligence calibration feel

- As user completes Breed/Weight/Snout/Coat inputs, use subtle state-aware ambience:
  - breathing gradient shift
  - slight pulse-speed change indicating "model tuning"
- Keep motion low-amplitude and readable.
- Gradient palette logic:
  - before photo upload, use default "NorthPaw Forest" palette (deep moss greens + soft earthy browns)
  - after photo upload, cross-fade to photo-sampled palette over ~1.5 seconds

### 2) Haptic affirmations

- `selectionChanged` for breed/snout list interactions
- `notificationSuccess` when user completes core calibration block (biology + snout)
- Keep feedback sparse and meaningful

### 3) Staggered conversational reveals

- Questions animate in with staggered spring timing
- Prefer progressive reveal over full-form dump
- Maintain low cognitive load per step
- Use Z-axis staggered choreography on hero scenes:
  - blur background first
  - then float calibration card upward with spring damping around 15

### 4) Calibration psychology (critical)

- Scene 09 should include a short "calculation" wait state (around 2 seconds) before final NPI reveal.
- This intentional micro-delay is useful friction:
  - without it, users may perceive the result as a guess
  - with it, users perceive variable-driven calculation and model confidence
- Treat this as trust-building behavior, not dead time.
- During the pulse, rotate short status lines to make model work visible:
  - "Calculating THI..."
  - "Applying brachycephalic offset..."
  - "Fetching local humidity..."
  - "Estimating pavement heat load..."

---

## Micro-Education Inserts ("Did You Know?")

Use short educational tooltips between key calibration steps:

1. **Breed/coat**
   - "Darker coats can absorb more heat in direct sun than lighter coats."

2. **Snout profile**
   - "Flat-faced dogs often cool less efficiently through panting."

3. **Location**
   - "Local humidity helps estimate your dog’s cooling efficiency."

Guideline:
- Keep each insert one sentence.
- Avoid diagnostic or prescriptive medical claims.
- Render inserts as subtle animated captions beneath the primary card (not inside the main card body) to keep the core interface clean.

---

## Aha Step -> NPI Activation Ritual

Upgrade current Aha into a model activation moment:

1. **Visual**
   - Skia-rendered NPI gauge animates from 0 to live score.
   - 1.5 to 2.0 second "calculation pulse" before final value lock.
   - Prefer pulse on gauge glow/ring intensity (not full-screen flashing).

2. **Copy**
   - "Calibration complete. Based on [Dog]'s profile and current humidity, your safest walk window is [X]."

3. **Material treatment**
   - Use `Glass_Base` surface with `Rim_Light` edge.
   - Keep technical factors available behind `Why this score?`.

---

## Notification Step -> Habit Hook

Replace generic permission ask with value-first scheduling:

- Prompt: "When should we send your Morning Readiness Brief?"
- Options:
  - 7:00 AM (default)
  - 8:00 AM
  - Custom time

Then request notification permission with context:
- "We will only send readiness-relevant alerts."

Add value preview before native permission prompt:
- Show a lock-screen style notification preview card:
  - "Good morning! [Dog]'s safest window is 7:30 AM to 9:30 AM today."
- Framing goal:
  - user is subscribing to a safety brief, not merely enabling notifications.
- Visual requirement:
  - style preview as a `Glass_Base` card that resembles iOS/Android system notifications.

---

## End-State Commitment

Replace generic completion CTA with emotional close:

- CTA: "I'm ready to keep [Dog] safe"

Goal:
- Reinforce identity and trust before entering Home.

Haptic close:
- Use `notificationSuccess` on final commitment tap to create a physical completion signal.

---

## Recommended Scene Map (Design Agent)

| Scene | Interaction | Haptic | AI instruction |
|---|---|---|---|
| 01: Welcome | Hero intro with soft blur-in | `impactMedium` | Use high-intensity blur transition, then settle to readable contrast |
| 02: Name | Single-input focus | none | Keep minimal, fast completion |
| 03: Photo | Optional portrait pick | `impactLight` on confirm | Preserve low-friction skip path |
| 04: Breed + Snout | Search list + snout choice cards | `selectionChanged` | Use staggered list animation and immediate visual confirmation |
| 05: Biology + Activity | Weight/coat/color + activity baseline | `impactLight` | Use squircle cards + Rim_Light tokens; avoid dense form walls |
| 06: Age | Tap-select cards | `selectionChanged` | Keep card hierarchy simple and clear |
| 07: Outings | Multi-select chips/cards | `selectionChanged` | Show progressive selection state, avoid clutter |
| 08: Location | Permission rationale + clear options | none | Explain humidity/local-condition value before prompt |
| 09: NPI Activation | Animated gauge reveal | `notificationSuccess` | Run 2-second "calculation pulse", then reveal live NPI and window |
| 10: Morning Brief Setup | Time selection + preview + permission request | `impactMedium` on time set | Ask for value first, show preview card, request permission second |
| 11: Commitment | Final emotional CTA | `notificationSuccess` | Confirm onboarding completion with trust-focused tone |

---

## Data Model Additions Needed

Add these onboarding fields to profile persistence:

- `dogSnoutProfile`: `flat | standard | long`
- `dogActivityBaseline`: `low | moderate | high`
- `morningBriefTime`: local time string or minutes-from-midnight

Optional:
- `onboardingCalibrationVersion`: for future migration/testing

### Calibration constants (v1 implementation guide)

Use these defaults when implementing `get_npi_score()` and safe-window logic:

| Variable | Multiplier / Weight |
|---|---|
| Snout: Flat | +15% to final risk score |
| Snout: Long | -5% to final risk score |
| Activity: High | reduce safe-window duration by 20% |
| Coat: Double | +10% to heat-retention logic |

---

## Guardrails

1. **Speed**
   - Target onboarding completion in under 2 minutes with optional skips.
   - If completion drops, collapse lower-impact inputs behind optional "More calibration" expansion.

2. **Clarity**
   - Every required question must have an explicit user-facing "why".

3. **Trust**
   - Educational language only; avoid diagnosis/treatment framing.
   - Keep calibration pulse messaging transparent so results feel computed, not guessed.

4. **Accessibility**
   - Respect reduced motion settings.
   - Preserve contrast/readability over visual effects.

5. **Battery/perf**
   - Scope heavy blur and gauge animations to activation scenes only.
   - Keep pulse loops low-amplitude and bounded to card/gauge layers.
   - Memoize heavy visuals:
     - NPI gauge component should be `React.memo`-wrapped.
     - Gradient pulse updates should not force text re-renders.
   - Reanimated guidance:
     - use `useDerivedValue` + `withRepeat` for heartbeat loops on glow properties.

6. **Personalization language**
   - Inject dog name into prompts wherever possible.
   - Prefer "What kind of coat does [Name] have?" over generic form labels.
   - Also inject name into "Did You Know?" inserts when possible (for example: "Darker coats like [Name]'s can absorb more heat...").

---

## Success Metrics

1. Onboarding completion rate
2. Step drop-off by scene
3. NPI activation completion rate
4. Morning Brief opt-in rate and selected time distribution
5. Early trust signal: `npi_explainer_open_rate` in first 3 sessions

---

## Open Tradeoff

Premium instrument feel vs setup speed:

- If completion drops materially, keep snout + activity but collapse lower-impact fields behind "More calibration" optional expansion.
- Preserve the identity: calibration-first, not form-first.

## Tactical Build Instructions (AI Handoff)

1. **Full-screen hero baseline**
   - For onboarding screens, use full-screen hero layout.
   - Background should be a high-resolution, slow-moving blurred gradient.
   - When a dog photo exists, sample palette colors from photo for gradient tinting.

2. **Haptics consistency**
   - Implement haptics on every step interaction.
   - Use `selectionChanged` for step taps/choices.
   - Reserve `notificationSuccess` for major completion moments (NPI activation, final commitment).
   - Ensure haptic calls are routed through one helper module to reduce lag and inconsistent behavior on older devices.

