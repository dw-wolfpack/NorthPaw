# NorthPaw: UX Design, Behavioral Psychology & Interaction Engineering Playbook

This document serves as a comprehensive UX/UI and Product Psychology blueprint for **NorthPaw**, a premium preparedness-first safety instrument for dog outings. It maps out each screen, analyzing its functional features, consumer stickiness vectors, underlying behavioral psychology, and the engineering mechanics used to deliver a premium user experience.

---

## 🧭 Core Product Philosophy & Design System

### 1. The "Under 5-Seconds" Safety Rule
* **UX Thesis:** In outdoor or pre-outing situations, cognitive load must be minimized. NorthPaw does not act as a generic weather dashboard or a heavy medical diary; it is a clinical safety instrument. A user must be able to launch the app and answer: *"Is it safe for my dog right now, and what do I need to grab?"* in under five seconds.
* **UI Pattern:** High-contrast hero elements, ambient colored indicator lights, and simplified, progressive disclosure overlays.

### 2. Deterministic Trust over the "AI Trust Gap"
* **Psychological Hook:** Unlike probabilistic AI models that guess risks, NorthPaw utilizes deterministic, transparent physics models (pavement temperature equations) and breed-specific biological constants. By avoiding black-box advice, the app positions itself as an objective, scientific tool, building a "trust moat."
* **UI Pattern:** Transparent "Sensor Status" badges showing location accuracy and weather sample latency, combined with readable "Why this score?" cards detailing the math behind safety alerts.

### 3. Glassmorphism Design Token Standard (`Glass_Base`)
To project a premium, state-of-the-art instrument feel, NorthPaw implements a custom card design system:
* **`Glass_Base` Card:** A semi-transparent frosted card using `expo-blur` (intensity 20) with a custom background fill (`rgba(15, 23, 20, 0.7)` in dark mode / `rgba(255, 255, 255, 0.85)` in light mode).
* **Superellipse Continuous Corners:** Cards strictly employ continuous-corner approximations (`borderRadius: 24`) paired with generous internal padding (`>= 20`) to prevent pinched text and maintain tactile softness.
* **Rim Light Depth:** Borders are kept at `borderWidth: 1` with a faint rim lighting color (`rgba(255, 255, 255, 0.08)` in dark mode) to simulate physical glass edge refraction, separating card layers from the ambient animated background.

---

## 🚀 Page-by-Page Deep Dive

### 1. Onboarding & The "Intelligence Calibration Ritual"
*Source: `app/onboarding.tsx` / `ONBOARDING_FLOW.md`*

```
[ Welcome ] ➔ [ Name ] ➔ [ Photo Selection ] ➔ [ Breed & Snout ] 
      ➔ [ Biology & Activity ] ➔ [ Age ] ➔ [ Outings ] ➔ [ Location ] 
            ➔ [ NPI Activation ] ➔ [ Briefing Setup ] ➔ [ Commitment ]
```

#### A. Key Features & Flow
Onboarding is treated as an intelligence calibration ritual across 11 structured scenes:
1. **Welcome Screen:** Explains NorthPaw’s focus on personalized canine safety.
2. **Dog Name:** Initial personalization anchor.
3. **Photo Pick:** Custom portrait selection.
4. **Breed & Snout Profile:** Selection between *Flat/Brachycephalic* (+15% NPI risk penalty), *Standard*, and *Long* snout profiles.
5. **Biology & Activity:** Collecting weight, coat type (*Double-coated* triggers a +10% heat stress penalty), fur color (dark coats absorb more solar load), and activity baseline (*High intensity* reduces safe-walk windows by 20%).
6. **Age Group:** Multi-choice grouping (Puppy, Young, Adult, Senior) that influences environmental thresholds.
7. **Outing Preferences:** Outing-type selectors (neighborhood walks, hikes, beach days) to seed default checklist templates.
8. **Location Context:** Requests location permission specifically by explaining its value in reading local humidity and temp.
9. **NPI Model Activation:** Dynamic 2-second computation delay showing calculations in real-time.
10. **Morning Brief Scheduler:** Value-first notification opting (defaults to 7:00 AM) with a preview card.
11. **Commitment CTA:** Emotional closure page.

#### B. UX & Interaction Engineering
* **Photo-Sampled Dynamic Palettes:** Upon selecting a dog photo, the onboarding background gradient smoothly cross-fades (over 1.5 seconds) to a custom-sampled color palette extracted directly from the dog's portrait, making the app feel instantly custom.
* **Spring-Physics Transitions:** Cards utilize `react-native-reanimated` with spring-damping choreography (`damping: 15`, `stiffness: 130`) to slide up on the Z-axis, avoiding rigid transitions.
* **Staggered Reveals:** Sub-questions and inputs stagger-animate into view to keep initial visual density low.
* **Haptic Affirmations:** Soft `selectionChanged` tick-backs occur on option choices, concluding with a solid `notificationSuccess` on final model completion.

#### C. Psychological Background
* **The Labor Illusion (Computational Friction):** Instantaneous loading on Scene 9 (NPI Activation) makes calculations feel like a "guess." NorthPaw builds trust by enforcing an intentional **2-second "calculation pulse."** During this delay, the UI cycles through status messages:
  - *"Calculating THI..."*
  - *"Applying brachycephalic offset..."*
  - *"Fetching local humidity..."*
  - *"Estimating pavement heat load..."*
  This variable-friction delay demonstrates computational effort, increasing the user's perceived accuracy and value of the safety model.
* **Identity Lock-In:** By framing the final onboarding button as *"I'm ready to keep [Dog's Name] safe"* instead of a generic *"Submit"*, the app anchors the setup process inside the user's identity as a protective, responsible pet parent.

#### D. Consumer Stickiness Vector
* Personalized input variables (snout, coat type, activity) create immediate sunk-cost utility. The user immediately sees that the resulting safety windows are strictly calibrated for *their* specific dog, discouraging them from using standard weather apps.

---

### 2. Main Dashboard & The Ambient "State Atmosphere"
*Source: `app/(tabs)/home.tsx`*

#### A. Key Features & Flow
* **Live Environmental Index (NPI):** A central 0.0 to 10.0 score of "Total Environmental Load" calculated using a modified Canine Heat Stress Index (CHSI).
* **NPI Interactive Detail Card:** Clicking the NPI score discloses a checklist detailing current humidity stress, solar radiation levels, and snout/coat multipliers.
* **Dynamic Best-Window Banner:** Tells the user their safest walking windows (e.g., *"Aoife's safest window: 7:00 AM - 9:30 AM"*).
* **Contextual Weather Suggestions:** Weather-triggered cards displaying recommendations, linked to tailored packs or field guides.
* **"Instagram Story" Avatar Ring:** The dog's profile image features a colored border representing the current risk level.

#### B. UX & Interaction Engineering
* **Skia Heartbeat Pulse:** The NPI risk ring is built with `@shopify/react-native-skia` using a slow, low-amplitude breathing glow loop powered by `useDerivedValue` and `withRepeat` in Reanimated.
* **Dynamic Heartbeat Rates:** The pulsing speed of the NPI gauge changes dynamically based on the risk level:
  - **Green (Low Risk):** Calm 2200ms pulse.
  - **Amber (Caution):** 1500ms pulse.
  - **Ember (High Risk):** Rapid 950ms breathing pulse to convey atmospheric tension.
* **Spotlight Feature Walkthrough:** First-time users are greeted by a custom walkthrough using a blurred overlay canvas with an animated spotlight path cutting out to highlight key interface regions (Avatar status ring, Timeline, Reminders, and navigation tabs) in a staggered queue.

#### C. Psychological Background
* **Ambient Reassurance vs Alert Fatigue:** Instead of firing alarming red warnings, the dashboard utilizes soft, breathing color tones. This atmospheric styling keeps the safety message legible without inducing panic, reducing notification-blocking behavior.
* **The Sniff-Test Mental Model:** Owners want to check conditions quickly. The dashboard organizes weather variables into "Good / Caution / Danger" bands, mapping atmospheric variables to immediate physical limits.

#### D. Consumer Stickiness Vector
* **The "Glanceable Face" Anchoring:** Placing the dog's portrait inside the risk ring links the dog's emotional safety directly to the NPI state. Launching the app feels like checking in on the dog's comfort, creating a deep emotional loop.

---

### 3. The Signature NPI Timeline Component
*Source: `app/(tabs)/home.tsx` / `buildTimelineBarsModel()`*

#### A. Key Features & Flow
* **Custom Interactive Slider:** Displays a 24-hour horizontal bar chart mapping air temp, projected pavement temp, and systemic risk (NPI).
* **Optimal Windows Indicator:** Clear highlighted blocks marking the exact windows when it is safe to walk.
* **Timeline Scrubbing:** Tapping and dragging across the timeline updates the dashboard to show conditions and paw-safety states at that specific hour.

#### B. UX & Interaction Engineering
* **Multi-Surface Pavement Selectors:** Users can toggle between *Asphalt, Concrete, Sand,* and *Artificial Turf*. Selecting a surface recalculates the pavement thermal projection model instantly and updates the timeline gradients.
* **Scrubbing Haptic Symphony:** Tapping and dragging on the timeline triggers a tactile `selectionChanged` tick-back from `expo-haptics` as the user moves from hour to hour, creating a physical sensation of scrubbing a mechanical slider.

#### C. Psychological Background
* **Pre-Preparedness Agency:** By allowing owners to preview future hours, they gain control. Toggling turf or concrete teaches the owner about different surface heat profiles, building long-term knowledge.
* **Visual Congruence:** Grouping safe zones into an obvious, distinct light window eliminates calculation steps, making planning simple.

#### D. Consumer Stickiness Vector
* Toggling surfaces becomes highly engaging. An owner prepping for a beach outing can toggle "Sand" and immediately see the danger zone shift earlier, establishing the app as a crucial planning utility.

---

### 4. Pavement Temp Verification Ritual ("Verify Surface")
*Source: `app/(tabs)/home.tsx` / `VerifySurfaceOpen`*

#### A. Key Features & Flow
* **The Pavement Heat Check:** When pavement temperature estimates exceed 100°F, a "Verify Surface" call-to-action appears.
* **Interactive Guided Timer:** Tapping the CTA opens a full-screen blurred modal instructing the user to touch the pavement with the back of their hand for 5 seconds.
* **Hold-to-Progress Circle:** The user must hold their finger down on the screen to progress the timer.
* **Actionable Completion Outro:** Once completed, the app displays a clear confirmation message (e.g., *"Too hot to hold? Walk on grass or use booties"*).

#### B. UX & Interaction Engineering
* **Guided Skia Path Ring:** The holding progress is rendered via a Skia circular path that slowly fills from 0 to 360 degrees as the timer counts down.
* **Intensifying Haptic Rumble:** Holding down triggers a repetitive, low-intensity haptic vibration that increases in frequency, resolving with a heavy `notificationSuccess` confirmation thud upon completion.
* **Aggressive Focus Blur:** A high-radius backdrop blur hides the dashboard, removing distractions to focus entirely on the physical safety check.

#### C. Psychological Background
* **The "Hand-Test" Verification Ritual:** Translating a digital weather reading into a physical action bridges the gap between data and real-world safety. The physical act of holding down a button mirrors the physical act of touching the pavement.
* **Cognitive Dissonance Resolution:** Engaging in a physical verification ritual reinforces the owner's identity as a responsible pet parent, ensuring they follow through on the safety guidelines.

#### D. Consumer Stickiness Vector
* The tactile feedback of the 5-second hold makes checking the surface feel like an active, physical ritual. This physical interaction sticks in memory, making it a habit before walks.

---

### 5. Smart Packs & Outing Checklists
*Source: `app/(tabs)/checklists.tsx` / `app/checklist/[id].tsx`*

#### A. Key Features & Flow
* **Curated Preparation Lists:** Generates checklists based on the outing type (trail hike, neighborhood run, beach outing).
* **Dynamic Weather Insertion:** Checklists automatically append items based on live weather data (e.g., a "Towel for paws" is added if rain is forecasted; "Cooling spray" is added on high-heat days).
* **Simple Swipe-to-Mark:** Quick checklist management.
* **Gear Vault Integrations:** Track personal dog gear (booties, cooling vest, hydration bottle) and append them to active checklists.

#### B. UX & Interaction Engineering
* **Local SQLite Persistence:** Checklist completion states are saved locally, ensuring offline functionality during remote hikes.
* **Layout Animations:** Checking off an item trigger an animated scale-down, smoothly sliding subsequent items up using Reanimated's layout transition animations.

#### C. Psychological Background
* **Reduction of Packing Anxiety:** The cognitive load of packing for a dog is simplified into a structured list. By suggesting items based on weather, the app removes the need for mental planning.
* **The Completion Effect:** Checking off items triggers a minor dopamine release. Completing a checklist provides a sense of accomplishment before the walk even begins.

#### D. Consumer Stickiness Vector
* The "Gear Vault" acts as a personalized inventory. Once users save their custom gear, they are less likely to leave the app, cementing it as their primary organization tool.

---

### 6. Post-Outing Sweep (Tick & Paw Scan)
*Source: `app/(tabs)/scan.tsx` / `app/tick-check.tsx`*

#### A. Key Features & Flow
* **Post-Outing Health Ritual:** A dedicated interface guiding owners through a systematic check for ticks, burrs, and paw cuts after returning.
* **Visual Search Guide:** An interactive diagram of a dog highlighting high-risk areas (ears, underarms, between toes, tail base).
* **Quick Log Integration:** Logs completed sweeps into the dog's activity history.

#### B. UX & Interaction Engineering
* **Interactive Hotspots:** Tapping different parts of the dog diagram opens popover cards with specific check techniques (e.g., *"How to check folding skin under the front elbows"*).

#### C. Psychological Background
* **The Peak-End Rule:** The final phase of an outing defines how the entire experience is remembered. By structuring the return home with a safety check, the app turns the end of the walk into a rewarding, responsible ritual.

#### D. Consumer Stickiness Vector
* Incorporating the "Tick Sweep" into the post-outing routine creates a complete loop: **Weather Check ➔ Prep Checklist ➔ Outing ➔ Post-Outing Sweep**. This loop makes the app valuable throughout the entire adventure.

---

### 7. Lifestyle & Preventive Care Reminders
*Source: `app/reminders.tsx`*

#### A. Key Features & Flow
* **Lightweight Care Tracking:** Scheduled reminders for recurring tasks (flea/tick meds, heartworm treatment, paw balm application).
* **Calendar Sync:** Simple, distraction-free view showing what is due next.
* **Due Card Placement:** Reminders due within 48 hours are automatically pinned to the home screen.

#### B. UX & Interaction Engineering
* **Local Notifications:** Leverages local device alerts to protect privacy and support offline functionality.
* **Swipe Action Tasks:** Fast, single-swipe actions to mark tasks as completed.

#### C. Psychological Background
* **Habit Stacking:** By linking medical reminders with everyday outdoor planning, the app helps users build a consistent care routine without needing a separate medical manager.

#### D. Consumer Stickiness Vector
* Long-term compliance logs show the user their dedication over time, building trust and keeping them engaged with the app.

---

### 8. Value-Led Paywall (Pro Gating)
*Source: `app/paywall.tsx`*

#### A. Key Features & Flow
* **Honest Boundaries:** Clearly outlines what is included in the Free vs. Pro tiers.
* **Preset Gating Points:** Paywalls are introduced when accessing advanced features (custom packing lists, multi-dog profiles, extended history) rather than interrupting core safety checks.

#### B. UX & Interaction Engineering
* **Frosted Glass Paywall Card:** Uses a premium `Glass_Base` card layout to match the app's aesthetic.
* **No Urgency Tricks:** Avoids countdown timers or aggressive popups, using a clean, readable layout instead.

#### C. Psychological Background
* **Respect-Based Conversion:** Gating advanced features rather than core safety metrics builds trust. Users convert out of appreciation for the tool's depth rather than frustration with forced restrictions.

---

## 📊 Summary of UX Design Metrics & Psychology Moats

| Page/Ritual | Primary UX Token / Interaction | Psychological Hook | Stickiness Driver |
| :--- | :--- | :--- | :--- |
| **Calibration Onboarding** | Photo-Sampled Palette Cross-fade / Staggered Springs | The Labor Illusion (Intentional calculation delay) | Custom biological risk metrics |
| **Dashboard (Home)** | Skia Heartbeat glow ring (Speed changes by risk) | Ambient Reassurance / Low-cognitive safety checks | Avatar risk ring integration |
| **NPI Timeline** | `selectionChanged` Haptic Scrub / Surface Toggles | Planning Agency & Material Education | Real-time surface temperature simulator |
| **Verify Surface** | Interactive 5s hold with intensifying haptic rumble | Physical verification ritual | High tactile interaction retention |
| **Smart Packs** | Reanimated Layout Transitions / Gear Vault | Packing Anxiety Reduction | Gear Vault inventory commitment |
| **Post-Outing Sweep** | Interactive canine hotspot diagram | Peak-End Rule Loop Closure | Outing completion history |
| **Care Reminders** | Pinned Home Alert Cards / Swipe Done | Habit Stacking | Multi-month health logs |
