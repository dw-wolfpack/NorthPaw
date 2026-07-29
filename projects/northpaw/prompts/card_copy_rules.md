# Playbook: Dynamic Action Line Generation

This document lists the deterministic, rule-based logic mapping current NPI telemetry and dog profile variables to a single, concise dynamic takeaway line for the **Share Card**.

---

## 📋 Copy Generation Logic

### 1. Danger State (NPI >= 7.0 or Surface Temp >= 125°F)
*   **Rule:** If the calculated surface temperature is high risk, prioritize grass walking immediately.
*   **Copy Matrix:**
    *   *Brachycephalic:* `"Pavement risk is high for {dogName} today. Grass only."`
    *   *Standard dog:* `"Pavement is dangerously hot for {dogName} today. Avoid all asphalt/concrete."`

### 2. Caution State (NPI >= 4.0 and < 7.0 or Surface Temp >= 105°F and < 125°F)
*   **Rule:** Alert the user to monitor pavement and walk primarily in shaded areas.
*   **Copy Matrix:**
    *   *Double Coat (heavy heat load):* `"Pavement heat is rising. Shorten {dogName}'s walk and stick to shade."`
    *   *Standard dog:* `"Concrete is safer than asphalt here, but both shorten {dogName}'s walk."`

### 3. Safe State (NPI < 4.0 and Surface Temp < 105°F)
*   **Rule:** Confirm it is a safe walk opportunity.
*   **Copy Matrix:**
    *   *All dogs:* `"Good to go! Pavement conditions are safe for u/{dogName}."`

### 4. Extreme Turf Anomaly (Turf selected and Turf Temp >= 125°F)
*   **Rule:** Specifically alert the user that artificial turf behaves differently.
*   **Copy Matrix:**
    *   *All dogs:* `"Turf gets hotter than asphalt. Keep {dogName} off artificial grass."`
