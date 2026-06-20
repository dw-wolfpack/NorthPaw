# NorthPaw Onboarding Calibration Flow

This document details the onboarding flow implemented in [`onboarding.tsx`](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/onboarding.tsx) as an **intelligence calibration ritual** to personalize the NorthPaw Index (NPI) thermal safety model for each dog.

---

## 🗺️ Onboarding Stages

### Scene 1: Welcome
*   **Purpose**: Introduce NorthPaw and establish the value proposition.
*   **Interaction**: Soft blur-in layout with NorthPaw branding.
*   **Haptics**: Medium impact haptic feedback upon entering onboarding.
*   **CTA**: `"Get Started"`

### Scene 2: Dog Name
*   **Purpose**: Capture the dog's name for copy personalization throughout the flow.
*   **Interaction**: Single-focus text input field.
*   **Logic**: Personalizes all subsequent questions (e.g., *"What kind of coat does Spot have?"*).

### Scene 3: Photo Upload (Optional)
*   **Purpose**: Personalize the Home screen and onboarding cards.
*   **Interaction**: Choose photo from device library or take a new one. Supports a clean skipped state.
*   **Visual**: Background colors cross-fade to a palette sampled from the uploaded photo.

### Scene 4: Breed & Snout Calibration
*   **Purpose**: Collect key anatomical variables for thermal risk adjustment.
*   **Interaction**:
    *   **Breed Search**: Searchable list of **65+ breeds** including Whippet.
    *   **Mixed Breed Pinned Entry**: A "Mixed Breed / Rescue" checkbox is pinned above the search input to allow easy custom entry. Pinned breeds are filtered from the search list to avoid redundancy.
    *   **Snout Profile Selector**: Selects between `Flat / Smushed` (brachycephalic risk, e.g., Pug, Bulldog), `Standard`, or `Long` (efficient panting, e.g., Greyhound, Whippet).
*   **Canine Physics Impact**:
    *   Flat snouts receive a **+15% heat risk multiplier** in the safety model.
    *   Long snouts receive a **-5% heat risk multiplier**.

### Scene 5: Biology & Activity Baseline
*   **Purpose**: Collect physical attributes that affect metabolic and thermodynamic heat retention.
*   **Interaction**:
    *   **Weight Input**: Numeric slider or input.
    *   **Coat Type**: Choose between Single, Double, or Hairless/Short. (Double-coated dogs like Huskies or Shepherds receive a **+10% heat retention risk factor**).
    *   **Fur Color**: Select Light, Medium, or Dark (darker fur absorbs more solar radiation).
    *   **Activity Baseline**: Choose `Low`, `Moderate`, or `High`. (High activity dogs have their safe walk windows reduced in duration by **20%** to avoid heat stress during continuous exercise).

### Scene 6: Outing Outlines
*   **Purpose**: Select outing contexts (e.g., trail running, neighborhood walks, park play) to filter safety checklist suggestions.
*   **Interaction**: Grid of multi-select cards.

### Scene 7: Location Rationale & Permission
*   **Purpose**: Secure foreground location permission to retrieve exact coordinate-based weather conditions.
*   **Interaction**: Rationale text explaining why coordinates are used to query local temperature, humidity, and solar radiation, followed by the system location prompt.

### Scene 8: NPI Model Calibration (The Ritual)
*   **Purpose**: Establish trust and show the safety model calculates real-world science instead of guessing.
*   **Interaction**:
    *   A **2-second calculation pulse** displays a loading indicator with rotating status lines:
        *   `"Calculating THI..."`
        *   `"Applying brachycephalic offset..."`
        *   `"Fetching local humidity..."`
        *   `"Estimating pavement heat load..."`
    *   On completion, the NPI safety gauge animates from 0.0 to the dog's computed index, highlighting their safest walk windows.
*   **Haptics**: Success notification haptic pattern upon score lock.

### Scene 9: Morning Brief Scheduler & Alert Setup
*   **Purpose**: Establish a recurring habit loops (Morning briefs).
*   **Interaction**:
    *   Select preferred alert timing (e.g., 7:00 AM, 8:00 AM, or Custom).
    *   Displays a lock-screen style notification card previewing a Morning Brief alert (e.g., *"Good morning! Spot's safest window is 7:30 AM to 9:30 AM today."*).
    *   Requests push notification permissions.

### Scene 10: Commitment
*   **Purpose**: Final emotional commitment to canine outdoor safety.
*   **Interaction**:
    *   CTA: `"I'm ready to keep [Dog] safe"`
    *   Saves onboarding data to local storage using `AsyncStorage` and sets the timestamp `@northpaw/onboarding_completed_at`.
*   **Haptics**: Final success notification haptic confirmation.
