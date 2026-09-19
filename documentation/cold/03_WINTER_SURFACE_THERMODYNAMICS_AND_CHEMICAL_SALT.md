# 03 — Winter Surface Thermodynamics & Chemical Salt Hazards

> **Ground Energy Flux, Snow/Ice Physics & De-Icing Chemical Toxicity**  
> *Target: Physical Modeling, Surface Temperature Algorithms & Paw Protection*

---

## 1. Winter Ground Thermodynamics & Energy Balance

In winter, ground surface temperature ($T_{\text{ground}}$) is determined by an energy balance between solar absorption, terrestrial longwave cooling, air convection, and subterranean conductive flux:

$$R_{\text{net}} - H - LE + G = 0$$

Where:
* $R_{\text{net}} = (1 - \alpha) S_{\text{down}} + L_{\text{down}} - L_{\text{up}}$ (Net radiation).
* $H$: Sensible convective heat flux to air.
* $LE$: Latent heat flux of snow/ice sublimation or melting.
* $G$: Conductive heat transfer from deep ground ($k_{\text{ground}} \approx 1.2 - 2.1\text{ W/m}\cdot\text{K}$).

### The Snow Albedo Inversion
* **Summer Asphalt:** Albedo $\alpha \approx 0.08 - 0.12$. Absorbs $90\%+$ of solar irradiance, driving pavement temperatures to $140^\circ\text{F}$.
* **Fresh Snow Cover:** Albedo $\alpha \approx 0.75 - 0.85$. Reflects up to $85\%$ of incoming solar radiation.
* **Ice / Packed Snow:** Albedo $\alpha \approx 0.40 - 0.60$.
* **Consequence:** Even on a clear, sunny winter day, snow-covered or frozen ground **fails to warm up**, remaining trapped at or below ambient freezing temperatures.

### Nocturnal Radiative Cooling & Black Ice Formation
On clear, calm winter nights with dry air ($skyCover < 20\%$, wind $< 4\text{ mph}$):
* Longwave radiation to space ($L_{\text{up}} = \epsilon \sigma T_{\text{surface}}^4$) outpaces downwelling atmospheric radiation.
* Bridge decks, sidewalks, and unshaded asphalt frequently drop **$4^\circ\text{F}$ to $8^\circ\text{F}$ colder than ambient air temperature**, inducing black ice formation even when ambient weather stations report $34^\circ\text{F} - 36^\circ\text{F}$.

---

## 2. Chemical De-Icers: Thermal & Biological Toxicology

Municipalities and property owners treat sidewalks and roadways with chemical de-icing salts. These chemicals present a dual thermal-chemical hazard to canine paws:

### The Chemistry of Common De-Icers

| Compound | Chemical Formula | Lowest Effective Temp | Eutectic Point | Heat of Dissolution | Paw Hazard Profile |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Rock Salt (Halite)** | $\text{NaCl}$ | $20^\circ\text{F}$ ($-6.7^\circ\text{C}$) | $-6^\circ\text{F}$ ($-21.1^\circ\text{C}$) | Endothermic (absorbs heat) | Sharp abrasive granules; osmotic drying; burns cracked pads |
| **Calcium Chloride** | $\text{CaCl}_2$ | $-25^\circ\text{F}$ ($-31.7^\circ\text{C}$) | $-60^\circ\text{F}$ ($-51.1^\circ\text{C}$) | **Strongly Exothermic** ($\Delta H = -81.3\text{ kJ/mol}$) | **Releases intense heat upon contact with paw moisture** $\implies$ chemical burns |
| **Magnesium Chloride** | $\text{MgCl}_2$ | $0^\circ\text{F}$ ($-17.8^\circ\text{C}$) | $-28^\circ\text{F}$ ($-33.3^\circ\text{C}$) | Exothermic | Corrosive brine; gastrointestinal toxicity upon grooming |
| **Potassium Chloride** | $\text{KCl}$ | $25^\circ\text{F}$ ($-3.9^\circ\text{C}$) | $+12^\circ\text{F}$ ($-11.1^\circ\text{C}$) | Endothermic | Less irritating to paws, but rarely used by public works |

### Pathophysiological Impact on Canine Paw Pads
1. **Osmotic Keratolysis & Deep Fissuring:**
   * High salt concentration draws water out of living epidermal cells in the paw pad stratum corneum, causing severe desiccation, deep bleeding fissures, and chemical ulcerations.
2. **Exothermic Chemical Burn:**
   * $\text{CaCl}_2$ pelleted crystals dissolve in the natural sweat/moisture of interdigital sweat glands, generating local heat release that blisters bare skin.
3. **Secondary Toxic Ingestion:**
   * Dogs instinctively lick and groom irritated, burning paws post-walk. Ingestion of $\text{NaCl}$ or $\text{CaCl}_2$ causes salt toxicosis, hypernatremia, severe vomiting, lethargy, and neurological tremors.

---

## 3. Algorithmic Predictive Model for Chemical De-Icer Risk

Because weather APIs do not provide a "salt sensor," NorthPaw infers chemical de-icer presence using municipal maintenance trigger heuristics:

```text
IS_DEICER_HAZARD = TRUE IF:
  (Current Air Temp ≤ 34°F OR Current Surface Temp ≤ 32°F)
  AND
  (Active Snow/Ice/Freezing Rain
   OR Snow Accumulation > 0.1 inches in last 48 hours
   OR Sub-freezing precipitation in last 36 hours)
  AND
  (Surface Type IN ['asphalt', 'concrete', 'cobblestone'])
```

### Risk Elevation & In-App Advisory Trigger
When `IS_DEICER_HAZARD` is active:
* Surface risk category is elevated to **AMBER** or **CRIMSON**.
* NPI Explanation surfaces: *"Chemical de-icing salts likely present on hard surfaces. Severe chemical burn & ingestion risk. Booties or immediate warm-water paw rinse required."*
