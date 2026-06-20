# Feedback and Resolution Tracker

This document catalogs critical feedback items received during pre-release testing and the exact engineering changes implemented in version **4.1.0** to resolve them.

---

## 📋 Feedback Log & Resolutions

### 1. Missing Breeds (Specifically "Whippet" and Mixed Breed Representation)
*   **Feedback**: Early users and reviewers noted that the initial catalog of 24 breeds was too limited. In particular, a review block was hit because the **Whippet** was missing. Additionally, users found it frustrating to search for mixed breeds or select them cleanly.
*   **Engineering Resolution**:
    *   Expanded the breed catalog from 24 options to a comprehensive list of **65+ breeds** categorized by canine group (Sporting, Herding, Working, Hounds, Terriers, Companion/Toy, Northern, and Doodles).
    *   Explicitly added **Whippet** as a built-in searchable option.
    *   Pinned the **"Mixed Breed / Rescue"** selection row directly above the breed search input.
    *   Filtered the searchable breed scroll list to remove "Mixed Breed / Rescue" as a duplicate grid item, preventing selection redundancy and search layout clutter.

### 2. Cobblestone Pavement Modeling
*   **Feedback**: Dog owners in European cities and historic neighborhoods noted that the app only allowed selecting Asphalt, Concrete, Sand, and Artificial Turf. They needed support for **Cobblestone** streets, which retain heat differently than concrete or asphalt.
*   **Engineering Resolution**:
    *   Added `'cobblestone'` to the `SurfaceType` options in [`roadTemp.ts`](file:///Users/fiegellansknowledge/experiment/NorthPaw/lib/weather/roadTemp.ts).
    *   Incorporated a thermodynamic multiplier of **0.85** for cobblestone (convectively warmer than concrete at `0.72` but cooler than asphalt at `1.00`).
    *   Integrated cobblestone into the cycles comparisons and home dashboard grid list in [`index.tsx`](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx) to display real-time safety scores.

### 3. Sterile/Generic Feedback Form
*   **Feedback**: The feedback modal looked like a generic template and didn't convey the personal, independent developer nature of the app, resulting in low submission engagement.
*   **Engineering Resolution**:
    *   Redesigned the header inside [`FeedbackModal.tsx`](file:///Users/fiegellansknowledge/experiment/NorthPaw/components/FeedbackModal.tsx) to feature a personal brand callout:
        *   *Title*: `"Help Shape NorthPaw"`
        *   *Body*: `"NorthPaw is built by one developer and improved through feedback from dog owners like you."`
    *   Updated the success view to include a warm, dog-first message thanking the user.
    *   Added telemetry properties (`payload_subject` and `type`) to categorise feedback dynamically on submission, routing requested breeds or bugs automatically in Mixpanel dashboards.

### 4. Over-estimation of Outing Risk in Cool Weather
*   **Feedback**: Early users complained that on moderately cool days with bright sunshine, the safety model was generating "Amber" and "Ember" warnings that did not match real-world observations.
*   **Engineering Resolution**:
    *   Calibrated the `AmbientScale` ramp in the Road Temperature model. It now attenuates solar heating efficiency linearly below 85°F down to a baseline of 40% at 40°F.
    *   Adjusted the base risk formula to anchor at 89 CHSI (~60°F), guaranteeing green-zone safety during cool-weather periods regardless of solar load.
