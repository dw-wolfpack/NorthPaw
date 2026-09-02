# NorthPaw Version 6.0.0 Release Notes

### 📱 Interactive iOS Widgets (The Centerpiece)
* **NorthPaw Glance Widget (New):** Minimal, glance-first decision widget coexisting alongside the detailed widget. Directly answers whether now is a good time to go outside with status badges (`READY / CAUTION / HIGH RISK`), dog name, recommended safe walk window, pavement temperature, and quick actions.
* **Interactive Action Verbs:** Upgraded Medium widget controls to clean symbols and direct action verbs:
  * Ready State: **`▶ Explore`**
  * Active State: **`■ End Outing`**
* **Instant Foreground Synchronization:** Configured native `AppState` reconciliation so active outings started or ended from widgets reflect instantly upon phone unlock or foregrounding without requiring tab navigation.
* **Widget Analytics:** Embedded `widget_variant` tags (`detailed` vs `glance`) in deep links to measure widget engagement and conversion.

---

### ⛅ Weather Accuracy & Dynamic Radiation Model
* **Solar Position & Coastal Accuracy:** Standardized NWS forecast parsing to UTC ISO keys and resolved local longitude coordinate alignment, fixing coastal microclimate temperature and daylight calculations (e.g. Redondo Beach, CA).
* **Enhanced Cloud Cover Shielding:** Overcast and cloudy conditions now dynamically attenuate direct solar radiation, giving accurate relief for dogs on cloudy days.
* **Calibrated Safety Thresholds:** Replaced flat penalties with progressive temperature-gated solar heating (`>62°F`) and proportional activity multipliers, keeping standard 65°F–75°F sunny walks favorable in the Green band.

---

### 🐾 Post-Walk Check-In Refresh
* **Fast Emoji Feedback:** Streamlined post-walk check-ins with single-tap native emojis:
  * 🙂 As Usual
  * 😐 Slowed Down
  * ☹ Struggled
  * 🏠 Didn't Go
* **Structured Observation Tags:** Optional behavioral tags ("Heavy panting", "Sought shade", "Lifted paws", "Stopped early", "Excessive thirst") for future personalization baselines.

---

### 🔮 Future Roadmap (v7.0)
* **Multiple Dog Profiles:** Household support to create and switch between multiple dogs with individual breed, coat, snout, weight, and activity safety baselines.
