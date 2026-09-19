# 02 — The NorthPaw Decision Engine & Algorithmic Architecture

> **Grounded Context Document for Gemini Notebook / NotebookLM**  
> *Targeting: Deep Dive Audio Overviews (Podcasts), Technical Architecture Audits, and Product Explainers.*  
> *Current Date: September 14, 2026*

---

## 1. Core Thesis: Not a Weather App, But a Decision Engine

Most pet owners use standard smartphone weather apps (Apple Weather, Weather Channel, AccuWeather). However, generic weather apps fail dog owners in two critical ways:
1. **They measure air temperature at 2 meters above ground in shaded weather shelters.** Dogs walk on asphalt, concrete, and artificial turf, inches from ground-level radiant heat.
2. **They assume human cooling physiology.** Humans sweat through skin across their entire bodies. Dogs possess no sweat glands on their skin; they cool almost entirely through evaporative heat exchange in the respiratory tract (panting) and limited thermal conduction via foot pads.

NorthPaw replaces ambient air guessing with a **deterministic, local-first canine thermodynamic decision engine**.

---

## 2. Pavement Thermodynamics & Surface Physics

### Surface Absorption & Radiation Balance
Dark asphalt behaves like a blackbody radiator, absorbing solar irradiance ($G$) throughout the day and releasing sensible heat into the boundary layer.

$$\Delta T_{\text{surface}} = T_{\text{air}} + f(\text{Solar Radiation}, \text{Zenith Angle}, \text{Albedo}, \text{Wind Speed}, \text{Cloud Cover})$$

### Material Emissivity & Heat Profiles
* **Asphalt:** Highest thermal absorption (albedo $\approx 0.05 - 0.15$). On an $80^\circ\text{F}$ clear sunny day, asphalt easily reaches **$135^\circ\text{F}$ to $145^\circ\text{F}$**.
* **Artificial Turf:** Extremely dangerous. Lacks the evaporative cooling of natural grass and contains dark rubber infill crumb. Can reach **$150^\circ\text{F}$ to $165^\circ\text{F}$** in direct sun.
* **Concrete:** Moderate reflection (albedo $\approx 0.30 - 0.40$). Typically $15^\circ\text{F}$ to $20^\circ\text{F}$ cooler than asphalt under identical solar exposure.
* **Cobblestone / Brick:** High thermal mass; retains heat late into the evening hours after sunset.
* **Sand:** Low thermal conductivity at surface layer; intense radiant heat in midday.

### Astronomical Solar Position Calibration
* In NorthPaw 6.0, solar radiation incorporates a local **Solar Zenith Model** with geographic longitude alignment:
  $$\theta_z = \arccos(\sin \phi \sin \delta + \cos \phi \cos \delta \cos \omega)$$
  * $\phi$: Latitude
  * $\delta$: Solar declination
  * $\omega$: Solar hour angle adjusted for true solar noon
* **Cloud Cover Dampening Curve:** Solar irradiance is non-linearly attenuated by cloud fraction ($C \in [0, 1]$):
  $$I_{\text{attenuated}} = I_0 \cdot \cos(\theta_z) \cdot (1 - 0.75 \cdot C^{2.5})$$

---

## 3. Canine Biological Risk Modeling (The NorthPaw Index - NPI)

The NorthPaw Index (NPI) calculates a normalized risk score ($0.0 - 10.0$) calibrated against three physiological tiers:

### 1. The Respiratory Factor ($R_{\text{snout}}$)
* **Brachycephalic (Flat-faced: Pugs, Bulldogs, Boxers):** Shortened upper airways drastically impair panting heat exchange. These dogs experience rapid respiratory distress and heatstroke at significantly lower temperatures ($+20\% - 30\%$ risk penalty).
* **Mesocephalic (Moderate: Labs, Retrievers, Beagles):** Standard baseline respiratory cooling.
* **Dolichocephalic (Long-nosed: Greyhounds, Whippets, Collies):** Superior nasal heat exchange capacity.

### 2. Coat Insulation & Color Radiative Factor ($K_{\text{coat}}$)
* **Double / Dense Coats (Huskies, Samoyeds, Shepherds):** Traps body heat during exertion; slow to shed core body heat.
* **Thin / Single Coats (Whippets, Pitbulls, Chihuahuas):** Prone to sunburn and ambient cold, but sheds heat quickly.
* **Black / Dark Coats:** Absorbs up to $90\%$ of incident solar radiation directly onto fur.
* **Light / White Coats:** Reflects solar radiation, but increases risk of solar dermatitis and ear/nose burn.

### 3. Humidity & The "Wet Bulb" Hazard for Dogs
Because dogs rely on panting (evaporating water from tongue, mouth, and lungs), high relative humidity ($\ge 70\%$) paralyzes their primary cooling mechanism. An air temperature of $82^\circ\text{F}$ with $85\%$ humidity is far more fatal to a dog than $92^\circ\text{F}$ in dry desert air.

---

## 4. The Decision Output: Green, Amber, Crimson

Rather than confusing the user with raw thermodynamic equations, NorthPaw maps complex physics into an instant, actionable color verdict:

* 🟢 **GREEN (Score 0.0 – 4.9): Optimal / Safe**
  * Normal outdoor activity. No thermal risk to paws or respiratory system.
* 🟡 **AMBER (Score 5.0 – 7.4): Caution / Monitor Dog**
  * Pavement is warm. Limit walk duration, stick to grass or shaded corridors, bring water.
* 🔴 **CRIMSON (Score 7.5 – 10.0): Dangerous / Do Not Walk on Hard Surfaces**
  * Severe paw pad burn hazard within seconds. High risk of heat exhaustion/heatstroke.

---

## 5. Architectural Innovations: The Glance Widget & Ambient Decision-Making

### The Problem with App Launches
* Opening an app requires conscious user friction: unlock phone $\to$ find app icon $\to$ wait for GPS & weather fetch $\to$ view score.
* If conditions look mild through the window, users skip the app and walk their dog anyway—often stepping onto dangerously hot road surfaces.

### The Solution: iOS Lock Screen & Home Screen Widgets
* Built using SwiftUI and WidgetKit via `@bacons/apple-targets` and `react-native-shared-group-preferences`.
* **Glance Widget:** Sits on the home screen or lock screen. The owner glances at their phone and immediately sees their dog's name, current pavement temperature, and Green/Amber/Red safety status without unlocking or opening the app.
* **Outcome Check-In:** Post-walk quick survey collects ground truth data (e.g. *"Did paws get hot? Was panting heavy?"*) to calibrate future personalized machine learning models for the Companion tier.
