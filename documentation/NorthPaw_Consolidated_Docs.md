# NorthPaw Product Documentation & Context
*Compiled for NotebookLM Context Seeding*

This consolidated document compiles all primary product requirements, design guidelines, technical algorithms, onboarding blueprints, and launch checklists for **NorthPaw**. It is structured to provide a comprehensive, multi-dimensional context source for generating deep-dive overviews, podcast outlines, and product summaries.

---

# SECTION 1: Product Requirements Document (PRD v0.3)

## 1. Executive Summary
NorthPaw is a preparedness-first outdoor companion for dog owners. It helps users know what matters before they go, pack accordingly, and follow through lightly afterward.

**NorthPaw has a real opportunity if it stays focused on preparedness, not feature accumulation. The winning version is not a dog hiking app, a med reminder app, or a checklist app glued together. It is a calm, trustworthy readiness product that helps owners know what matters before they go, pack accordingly, and follow through lightly afterward.**

The MVP centers on one distinctive behavior:
**The weather → content bridge is NorthPaw’s strongest product hook. “Weather app, but what this means for my dog/trip” is intuitive, ownable, and immediately useful.**

NorthPaw should not try to replace trail navigation, act as a veterinary product, or become a broad utility hub. It should win the moment before uncertainty.

---

## 2. Problem Statement
Dog owners preparing for outdoor outings often piece together multiple tools:
- a trail or map app
- a weather app
- notes or memory for packing
- random internet searches for safety guidance
- calendar reminders for recurring care

This creates friction and uncertainty:
- Is today a good fit for my dog?
- What should I bring?
- What should I watch for?
- What am I forgetting?

Existing tools tend to own only one slice of this experience. NorthPaw exists to simplify preparation and reduce uncertainty before and during a dog outing.

---

## 3. Product Thesis
NorthPaw helps dog owners feel prepared before leaving and confident once they are out.

### Product Hierarchy
- **Primary job:** help users prepare for safe, smoother outdoor outings with their dog.  
- **Secondary job:** help users remember lightweight recurring care tied to that lifestyle.  
- **Tertiary job:** help users keep a simple record of what they packed, did, or want to remember.

Reminders and logs support the preparedness experience. They are not co-equal pillars.

---

## 4. Goals and Non-Goals
### Goals
- reduce uncertainty before dog outings
- make preparation faster and easier
- provide calm, practical, dog-specific guidance
- bundle the most relevant readiness tasks into one lightweight experience
- build trust through clear boundaries and low-clutter design

### Non-Goals
NorthPaw is not:
- a replacement for AllTrails, Gaia, or other trail navigation apps
- a veterinary or diagnostic app
- a tele-vet product
- a heavy pet medication manager
- a generic productivity/checklist tool
- a social feed or community platform
- a shame-based habit tracker or “readiness score” product

---

## 5. Target Users, Personas, and JTBD
### Primary User
A conscientious dog owner who enjoys walks, parks, and light-to-moderate outdoor outings and wants to feel more prepared without becoming an expert.

### User Characteristics
- wants to do the right thing for their dog
- values simple, trustworthy guidance
- likes curated recommendations
- does not want a hardcore hiking tool
- does not want a complicated pet health app
- appreciates low-friction, mobile-first utility

### Excluded Early Segments
- advanced backcountry hikers needing topo/nav depth
- users seeking diagnosis or medication management
- users primarily motivated by community/social features
- users wanting detailed analytics or quantified-self tracking

### Persona 1: The Conscientious Weekend Owner
- goes on weekend walks, easy trails, beach trips, or park loops
- wants confidence, not complexity
- already checks weather, but is unsure what it means for the dog
- currently uses mental lists or Notes app packing lists

**JTBD:** “When I am getting ready for an outing with my dog, help me know what matters and what to bring so I can leave without second-guessing myself.”

### Persona 2: The Newer Dog Adventure Planner
- recently started taking the dog on outdoor outings more often
- is unsure about etiquette, gear, surface conditions, and weather implications
- appreciates plain-language field guidance

**JTBD:** “When I am trying something slightly more outdoorsy than my normal routine, help me feel prepared without needing to become an expert.”

### Persona 3: The Routine-Driven Preventive Care User
- is reasonably organized but forgets recurring care tasks
- wants simple reminders tied to lifestyle, not a full medication manager

**JTBD:** “When recurring outdoor-related care is due, remind me simply so I can stay on track without managing a complicated system.”

### Key Usage Scenarios
1. **Saturday 7:00 AM, before leaving for an easy trail**  
   User opens NorthPaw to check conditions, confirm the suggested pack, and skim one guidance card before loading the dog into the car.
2. **At the parking lot, right before starting**  
   User opens the current checklist to confirm water, leash, waste bags, towel, and any condition-specific item.
3. **Between outings, during the week**  
   User sees a simple prevention reminder, marks it done, and returns to the app only when needed.

---

## 6. Positioning
### Category
Outdoor readiness app for dog owners

### Positioning Statement
For conscientious dog owners who want outdoor outings to feel easier and more prepared, NorthPaw is a calm, trustworthy mobile companion that helps them understand conditions, pack smart, and access quick dog-specific guidance without replacing their map app or vet.

### Core Promise
**Know what matters before you go.**

---

## 7. MVP Scope
### In Scope
1. Conditions snapshot (NorthPaw Index - NPI)
2. Weather → guidance bridge
3. Curated packs/checklists
4. Quick field reference cards
5. Lightweight recurring care reminders
6. Lightweight outing memory/history

### Out of Scope
- full route planning
- GPS tracking as a core value proposition
- community/social features
- cloud-required collaboration
- tele-vet or diagnostic workflows
- advanced medication schedules, refill logic, or dose calculations
- widgets at launch unless nearly free
- QR as a core pillar unless a repeated real-world use case is proven

---

## 8. Monetization: Free vs Pro Boundaries
### Free
- Home with conditions snapshot
- weather → guidance bridge
- limited curated pack templates
- limited quick guidance library
- basic preset reminders
- recent activity for a short rolling window
- core dog profile

### Pro
- expanded pack template library
- additional guidance collections
- longer history / richer outing recall
- more customization of checklists
- additional reminder flexibility, still within lightweight scope
- future premium convenience features that do not distort trust

### Pro Boundary Principles
- Pro unlocks depth, not core trust
- the free product must still feel complete and useful
- no manipulative scarcity language
- no fake urgency timers
- paywall copy should be calm, boring, and honest
- preparedness-critical information should not be hidden behind deceptive gating

---

# SECTION 2: Product Audit, UX Review & Future Vision

## 1. Roadmap & Design Rule Alignment
The app is doing an excellent job adhering to the core principle: *"What matters for this dog outing right now, and what should I do next?"* The layout changes to the Hero card successfully implement the progressive disclosure rule (Hero first, NPI state primary, clutter control). 

---

## 2. Glaring Issues & Immediate Polish

### The "Empty State" Experience (V1.5 Smart Pack Alignment)
When a user first downloads the app (before they've populated the Gear Vault), the app can feel a bit barren. 
* **The Fix:** We need beautifully illustrated "empty states." Instead of a blank screen, show a minimalist line-drawing of a leash or hiking boots with a CTA like "Every great adventure starts with preparation. Add your first item." This builds the trusted "Micro-Preparedness" loop.

### Transition Micro-Animations (`react-native-reanimated`)
Modal transitions (like tapping "Verify Surface") should favor smooth continuity over hard state swaps. Introduce a spring-physics scaling animation for the "Verify Ground Temp" 5-second guided timer, aggressively blurring the background during the ritual to focus attention.

### Location Fallback UI (Uncertainty Moat Policy)
If a user denies location permissions, swap raw text strings for a blurred "Unlock Your Environment" card that visually demonstrates what they are missing, with a large button to open device settings.

---

## 3. UI/UX Aesthetics (Making It Prettier)
* **Skia Heartbeat Pulses:** Use `react-native-skia` to add a slow, low-amplitude breathing glow to the NPI timeline. A faint ember/orange pulse for high-risk bands, and a calm forest-green breathing tone for optimal windows.
* **The "Instagram Story" Status Ring:** Instead of a separate UI element for the NPI Risk Ring, the border of the dog’s circular avatar acts as the risk ring. It functions as an immediate visual indicator without taking up extra screen real estate.
* **Superellipse Continuous Corners:** Double-check that all major cards are strictly using continuous-corner squircles (`borderRadius: 24` with internal padding `>= 20`) rather than standard rigid corners, to preserve the tactile, premium instrument feel.
* **Haptic Symphony:** Expand `expo-haptics` to the Verify Ground Temp ritual: a low-intensity rumble during the 5-second hold progress, resolving with a heavy confirmation thud at completion.

---

## 4. Customization Per Pet (Deterministic Personalization)
*Note: No expensive black-box LLMs are used, preserving deterministic rules over black-box models for trust and cost.*
* **Dynamic App Theming:** If an owner has multiple dogs, the app's `Rim_Light` and subtle accent colors could shift depending on which dog is selected. Earthy pine-green for the adventurous Golden Retriever, a sleek slate-blue for the older Greyhound. 
* **Age & Mobility Multipliers:** Adding a "Mobility Level" or "Age" slider that intrinsically alters the NPI Risk algorithm (as a deterministic multiplier) makes the tool infinitely more accurate and personalized.
* **Breed-Specific Rule Engine:** Build out a lightweight, hardcoded rule matrix. If the profile has `coat_type = double_thick`, the app deterministically surfaces a tailored tip: *"Because Aoife is double-coated, today's 75% humidity limits her ability to cool down. Consider shorter routes."* 

---

## 5. Owner Hooks (Daily Habit & Emotional Moat)
* **The 7:00 AM Briefing (V1):** A rich, personalized push notification in the morning leveraging the quiet-default policy: *"Aoife's optimal window is 7 AM - 9 AM before the pavement gets too hot."*
* **Safety Flashbacks (V2):** Detect prior low-energy or caution outcomes under similar weather signatures. Surface context-aware reminders on the Hero card: *"Last time humidity was this high, Aoife struggled. Consider a shaded route today."*
* **Apple Watch / Wear OS Complication:** A tiny wrist widget showing the dog's face with a colored ring (Green/Yellow/Red) indicating the current NPI Risk.

---

# SECTION 3: NorthPaw Index (NPI) & Road Temp Algorithm Guide

Deterministic logic used to calculate pavement safety and the canine-specific risk score (NPI) is located in [`roadTemp.ts`](file:///Users/fiegellansknowledge/experiment/NorthPaw/lib/weather/roadTemp.ts) and [`home.tsx`](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx).

## 1. Road Temperature Model (Pavement Physics)
### The Formula
`RoadTemp = AirTemp + (SolarIntensity * 5.1 * AmbientScale * SurfaceMultiplier) - (WindSpeed * 0.75)`

### Key Variables
*   **Solar Intensity (0–10):** Derived from latitude, day of year, and hour angle.
    *   **Cloud Attenuation:** Solar intensity is reduced by `(1 - SkyCover * 0.85)`.
*   **Ambient Scale:** Adjusts solar heating efficiency based on air temperature (convective cooling).
    *   `AmbientScale = Math.max(0.4, Math.min(1.0, ((AirTemp - 40) / 45) * 0.6 + 0.4))`
    *   *Effect:* Full solar heating only applies above 85°F. At 40°F, heating is attenuated by 60%.
*   **Surface Multipliers:**
    *   **Asphalt:** 1.0 (Baseline)
    *   **Concrete:** 0.72 (Higher albedo/reflectivity)
    *   **Sand:** 1.15 (Low conductivity, high surface heat)
    *   **Artificial Turf:** 1.38 (Rubber infill "heat trap")

---

## 2. NorthPaw Index (NPI) Calculation
The NPI is a 0.0 to 10.0 score representing the "Total Environmental Load" on a specific dog.

### The Formula
`NPI = min(10, (BaseRisk * SnoutMult * CoatMult) + ActivityBaseline)`

### Components
1.  **Canine Heat Stress Index (CHSI):**
    *   `CHSI = (AirTemp * 0.8) + (Humidity * (AirTemp - 14) / 100) + 20`
    *   *Logic:* Weights humidity as an additive risk factor. Normalized range: [67, 148].
2.  **Solar Load:**
    *   `SolarLoad = ((100 - SkyCover) / 100) * 10 * AmbientScale`
3.  **Base Risk Mapping:**
    *   `BaseRisk = Math.max(0, (CHSI - 89) / 10.8) + (SolarLoad * 0.35)`
    *   *Logic:* Anchor at 89 (~60°F) ensures green-zone safety for cool weather.
4.  **Pet Profile Multipliers:**
    *   **Snout:** 1.15x for Brachycephalic (flat-faced) breeds.
    *   **Coat:** 1.1x for Double-coated breeds (Huskies, Shepherds).
    *   **Activity:** +1.0 flat penalty for "High" baseline activity dogs.

---

## 3. Safety Thresholds

### Pavement Temperature (Paw Protection)
*   **Safe (< 77°F):** No risk of burns.
*   **Warm (77°F – 105°F):** Pavement is warm but safe for continuous walking.
*   **Hot (105°F – 125°F):** Discomfort begins. Prolonged standing may cause irritation.
*   **Danger (>= 125°F):** **JAMA Standard.** Contact burns (second-degree) can occur within 60 seconds. *Mandatory grass-walking or paw protection.*

### NPI Score (Systemic Heat Risk)
*   **0.0 – 3.0 (Green):** Low risk. Standard exercise.
*   **3.1 – 5.0 (Amber):** Moderate risk. Monitor for heavy panting. Increase water breaks.
*   **5.1 – 7.5 (Ember):** High risk. Shorten outings. Seek shade. No high-intensity play.
*   **7.6 – 10.0 (Crimson):** Extreme risk. Immediate heatstroke danger for sensitive breeds. Restricted to relief-only outings.

---

## 4. Science & Trust Anchors
*   **JAMA Dermatology:** "Thermal Injury from Hot Asphalt" (Burn threshold data).
*   **American Kennel Club (AKC):** "7-Second Hand Test" and brachycephalic heat safety guidelines.
*   **NWS:** National Weather Service THI standards for livestock/canine heat stress.

---

# SECTION 4: Onboarding Flow Blueprint

Onboarding is designed as an **intelligence calibration ritual**, making users feel the safety model is highly personalized and science-backed.

## 1. The 11-Scene Calibration Flow
*   **Scenes 1–3 (Identity):** Start with a blurred hero intro, name entry, and an optional photo upload. Once a photo is uploaded, the app cross-fades the background palette to a color scheme sampled directly from the dog's portrait.
*   **Scenes 4–7 (Biological Profile):** Use staggered list animations for Breed, Snout, and energy baseline selections. Implement "Did You Know?" micro-education inserts beneath cards to explain why these factors matter.
*   **Scene 8 (Contextual Permission):** Request location access by first explaining its value in fetching hyper-local humidity and conditions.
*   **Scene 9 (The Activation Moment):** Implement an intentional 2-second "calculation pulse" before revealing the NPI. During this pulse, rotate status lines such as "Calculating THI..." or "Applying brachycephalic offset..." to build trust in the computation.
*   **Scenes 10–11 (Habit & Commitment):** Set the Morning Readiness Brief time, showing a lock-screen style notification preview. End with an emotional commitment CTA: "I'm ready to keep [Dog] safe".

---

## 2. Onboarding Calibration Constants
These profile values persist and adjust the NPI risk score and outing parameters:

| Input | V1 Weighting / Action |
|---|---|
| **Snout: Flat** | +15% to final NPI risk score |
| **Snout: Long** | -5% to final NPI risk score |
| **Coat: Double** | +10% to heat-retention logic |
| **Activity: High** | Reduce safe-window duration by 20% |

---

# SECTION 5: App Store Listing & Metadata Guide

## 1. App Store Metadata
* **App Name**: `NorthPaw`
* **Subtitle (Max 30 chars)**: `Safe Dog Outings & Guides` or `Smart Dog Outings & Checklists`
* **Primary Category**: `Utilities` or `Reference`
* **Secondary Category**: `Lifestyle` or `Travel`
* **Support URL**: `https://northpaw.nextstepsbeyond.online/`
* **Privacy Policy URL**: `https://northpaw.nextstepsbeyond.online/privacy/`
* **Keywords**: `dog,trail,hike,weather,paw,heat,checklists,safety,temp,outings,walk,routine,reference,pack,guide,outdoor`

---

## 2. App Store Description (Max 4,000 chars)
```text
Step outside with confidence. NorthPaw helps you plan safe, comfortable outings for your dog by taking the guesswork out of temperature, weather, and trail prep. 

Every dog is unique. NorthPaw customizes safety guidelines based on your dog's breed, coat type, fur color, and snout length—delivering personalized walk windows and routine checklists.

Key Features:
- Personalized Outing Guidelines: Tailored temp checks based on your dog’s profile.
- Dynamic Checklists: Pack lists that adapt to your dog’s outings and local weather.
- Field Guide Reference: Offline cards detailing hot asphalt thresholds, toxic plants, and ticks.
- Daily Morning Brief: Schedule an on-device alert to check conditions before your first walk.
- Privacy First: No accounts, no sign-ups, and no background location tracking. Your data stays on your device.

*Disclaimer: NorthPaw is for general educational and reference purposes only. It does not provide veterinary, emergency medical, or legal advice.*
```

---

## 3. Required App Screenshots (iPhone-only)
*   **6.5-Inch Display** (1284 x 2778 pixels): iPhone 11 Pro Max / iPhone 15 Pro Max
*   **5.5-Inch Display** (1242 x 2208 pixels): iPhone 8 Plus / iPhone 7 Plus

### Recommended Screen Captures:
1. **Home Screen**: Main Ready Screen showing the dog's name, NPI Bezel Dial ring, and current temperature.
2. **Timeline View**: Thermodynamic asphalt/turf timeline and calculated walk windows.
3. **Library View**: Field Guide card packs (Trail Basics, Summer Hazards, Cold Prep).
4. **Checklists Screen**: Custom outing checklist showing task checkboxes (e.g., "Water bowl", "Leash").
5. **Settings/Reminders**: Settings list and active care reminders.

---

# SECTION 6: MVP Launch Checklist

- [ ] **Store & billing:** RevenueCat production iOS API key; App Store Connect subscription products + entitlement IDs matching app code; sandbox purchase verification on development builds.
- [ ] **Legal / listing:** Public Privacy Policy and Support URLs active; App Store screenshots and description updated.
- [ ] **Build & release:** EAS/Xcode production profile configured; supportsTablet set to false (restricting to iPhone); infoPlist permission strings for camera (QR), photo library, and location verified.
- [ ] **Smoke-test matrix:** Fresh install → offline library read → checklist boxes persist → Pro subscription purchase flow check → Morning brief notification trigger checks.
