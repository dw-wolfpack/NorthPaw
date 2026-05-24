# NorthPaw Design Rules

Last updated: 2026-04-21
Owner: Product Design + Engineering
Status: Working rules for design agent iteration

## Intent

NorthPaw should feel like a premium safety instrument for dog outings, not a generic weather dashboard. Visual style must improve trust and emotional attachment without slowing decision speed.

## Core Principle

Every screen should answer the safety question in under 5 seconds, then reward deeper exploration with elegant materials, motion, and interaction feedback.

## Visual Hierarchy Rules

1. Hero first:
   - Dog identity + NPI state are primary.
   - Timeline is the core decision artifact.
   - Supporting data is secondary and collapsible.

2. Progressive disclosure:
   - Keep technical detail behind `Why this score?` and drill-in layers.
   - Never force dense data at first glance.

3. Contrast and legibility:
   - Motion or blur cannot reduce readability of safety-critical text.
   - Any decorative treatment must pass accessibility contrast targets.

## Material and Depth Rules

1. Avoid boxy cards:
   - Prefer rounded superellipse-like corners (`borderRadius` 16 to 24).
   - Use continuous-corner squircle approximation when possible.
   - If `borderRadius` is deep (for example 24), set content padding to at least 20 to avoid pinched layouts.
   - Add layered spacing so components float over the background.
   - Canonical Glass card spec for AI prompting:
     - `borderRadius: 24`
     - `padding: >= 20`
     - `borderWidth: 1`
     - `borderColor: Rim_Light`

2. Glass surfaces where appropriate:
   - Use `expo-blur` for frosted overlays on hero surfaces.
   - Keep opacity and blur subtle; prioritize content clarity.

3. Inner rim light:
   - Add faint inner border for depth (`rgba(255,255,255,0.05)` baseline; `rgba(255,255,255,0.08)` for key hero surfaces).
   - Pair with soft outer shadow on dark cards (`shadowOpacity: 0.5`, `shadowRadius: 10`) to separate surfaces from the background.
   - Use minimally to avoid visual noise.

## NPI Timeline Rules

1. Treat as signature component:
   - Timeline should feel custom and alive, not spreadsheet-like.
   - Best window should always be visually obvious.

2. State-aware ambience:
   - Safe states: calm green breathing tone.
   - High-risk states: restrained ember/orange pulse.
   - Animation speed should be slow and low-amplitude.
   - Apply pulses to NPI card/timeline glow only (never flash full-screen backgrounds).
   - Reanimated guidance: use `withRepeat` + `withSequence` to create breathing loops.
   - Performance guidance:
     - use `useDerivedValue` for pulse state and drive glow properties from shared values.
     - prefer animating glow spread/radius or halo intensity over whole-card opacity.

3. Signal emphasis:
   - Consider `react-native-skia` for high-performance glow treatments.
   - Keep effects subtle enough that labels remain readable outdoors.

## Interaction and Motion Rules

1. Haptics:
   - Use `expo-haptics` light impact on each 1-hour increment of timeline scrub.
   - Haptics should confirm state changes, not fire continuously without meaning.

2. Transition quality:
   - Use `react-native-reanimated` for morphs and staggered reveals.
   - Favor smooth continuity over hard state swaps.

3. Safety interaction ritual:
   - "Verify Ground Temp" opens a 5-second guided timer.
   - During ritual, blur background aggressively to focus attention on verification action.
   - Primary visual: large hold-to-complete thermal ring.
   - Haptic sequence:
     - low-intensity feedback during hold progress
     - heavy confirmation at 5-second completion
   - Completion state provides clear action ("Too hot to hold? Walk on grass.").

## Screen Composition Rules

1. Ready/Home hero:
   - Full-screen hero composition is preferred when feasible.
   - Dog photo + NPI + best window are visible above the fold.

2. Data layering:
   - Technical metrics live in overlays/sheets, not all on primary canvas.
   - Main CTA stays persistent and obvious.

3. Clutter control:
   - Maximum one primary action and one secondary action per major card.
   - Avoid stacking too many competing badges.

## Performance and Quality Guardrails

1. Performance budget:
   - Animations must remain smooth on mid-tier devices.
   - Blur/glow usage should be scoped to hero surfaces to limit battery cost.

2. Accessibility:
   - Honor reduced-motion preferences where possible.
   - Maintain tap target sizes and readable type under outdoor glare conditions.

3. Safety over style:
   - If a visual effect conflicts with rapid risk comprehension, remove the effect.

## Library Stack Guidance

- Depth: `expo-blur`
- Motion: `react-native-reanimated`
- Custom timeline/glow rendering: `react-native-skia`
- Haptics: `expo-haptics`

These are enabling tools, not goals. Design outcomes matter more than library usage.

## Visual Token Baseline (Sprint A)

| Token | Value / Logic | Use Case |
|---|---|---|
| `Glass_Base` | `expo-blur` intensity 20 + `rgba(15, 23, 20, 0.7)` | Main background cards |
| `Rim_Light` | `rgba(255, 255, 255, 0.08)` | 1px borders on glass surfaces |
| `Safety_Green` | `#2ECC71` + soft outer glow | Optimal window indicators |
| `Risk_Amber` | `#F39C12` + breathing pulse | Caution timeline bands |
| `Haptic_Step` | `ImpactFeedbackStyle.Light` per hour step | Timeline scrub confirmation |

Treat tokens as defaults; calibrate per contrast/accessibility requirements.

## Design-Agent Prompt Snippet

Use this wording when asking an agent to implement premium cards:

"When building `Glass_Base` cards, use `borderRadius: 24`. To approximate squircle continuity, keep inner padding at least 20. Add `borderWidth: 1` with `Rim_Light` for edge definition. Avoid boxy spacing and keep content away from deep corners."

## Design Review Checklist

- [ ] Hero clearly prioritizes NPI + dog identity.
- [ ] Timeline best window is immediately recognizable.
- [ ] `Why this score?` is discoverable but non-intrusive.
- [ ] Visual treatments preserve contrast and legibility.
- [ ] Haptics and transitions feel intentional and premium.
- [ ] Screen remains understandable within 5 seconds.
- [ ] No effect undermines safety comprehension.
