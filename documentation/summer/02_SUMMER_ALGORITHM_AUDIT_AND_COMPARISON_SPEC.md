# NorthPaw Summer Algorithm Audit & Comparative Specification
**Version:** 1.0.0  
**Status:** Modeling & Verification Phase  

---

## 1. The NorthPaw 6.0 Production Summer Algorithm

The production 6.0 implementation is split across [`lib/weather/roadTemp.ts`](file:///Users/fiegellansknowledge/experiment/NorthPaw/lib/weather/roadTemp.ts) and [`app/(tabs)/index.tsx`](file:///Users/fiegellansknowledge/experiment/NorthPaw/app/(tabs)/index.tsx#L1149-L1174).

### Pavement Surface Temperature Model
$$\text{RoadTemp} = T_{\text{air}} + (I_{\text{solar}} \cdot 5.1 \cdot \text{AmbientScale} \cdot M_{\text{surface}}) - (V_{\text{wind}} \cdot 0.75)$$

Where:
- $I_{\text{solar}} \in [0, 10]$ derived from solar elevation angle and sky cover: $\text{SolarGhi} / 100$ or $((100 - \text{SkyCover}) / 100) \cdot 10$.
- $\text{AmbientScale} = \max\left(0.4, \min\left(1.0, \frac{T_{\text{air}} - 40}{45} \cdot 0.6 + 0.4\right)\right)$
- $M_{\text{surface}}$:
  - Asphalt: $1.00$
  - Concrete: $0.72$
  - Cobblestone: $0.85$
  - Sand: $1.15$
  - Artificial Turf: $1.38$
- Wind cooling factor: $0.75^\circ\text{F}$ per mph.

### NorthPaw Index (NPI) Summer Model
In `app/(tabs)/index.tsx`:
1. **Canine Heat Stress Index (CHSI):**
   $$\text{CHSI} = (0.8 \cdot T_{\text{air}}) + \left(\text{RH} \cdot \frac{T_{\text{air}} - 14}{100}\right) + 20$$
2. **Solar Thermal Load:**
   $$\text{SolarTempScale} = \max\left(0.0, \min\left(1.0, \frac{T_{\text{air}} - 62}{23}\right)\right)$$
   $$\text{SolarLoad} = \text{SolarLoadRaw} \cdot \text{SolarTempScale}$$
3. **Base Environmental Risk:**
   $$\text{BaseRisk} = \max\left(0, \frac{\text{CHSI} - 89}{11.5}\right) + (\text{SolarLoad} \cdot 0.25)$$
4. **Pet Profile Multipliers:**
   $$M_{\text{snout}} = \begin{cases} 1.15 & \text{flat (brachycephalic)} \\ 1.00 & \text{standard / long} \end{cases}$$
   $$M_{\text{coat}} = \begin{cases} 1.10 & \text{Double} \\ 1.00 & \text{Single / Hairless} \end{cases}$$
   $$M_{\text{activity}} = \begin{cases} 1.08 & \text{high} \\ 1.00 & \text{low / moderate} \end{cases}$$
5. **Final Composite:**
   $$\text{NPI}_{\text{prod}} = \min(10.0, \text{BaseRisk} \cdot M_{\text{snout}} \cdot M_{\text{coat}} \cdot M_{\text{activity}})$$

---

## 2. Scientific Strengths of the Production Model

1. **JAMA Burn Threshold Alignment:** The $5.1$ solar multiplier correctly causes unshaded asphalt to reach $125^\circ\text{F} - 135^\circ\text{F}$ when air temperatures hit $85^\circ\text{F} - 90^\circ\text{F}$ under peak sun, accurately warning owners of blistering contact burns.
2. **Ambient Scale Attenuation:** Solar radiation does not scorch surfaces when ambient air is $45^\circ\text{F}$; the ambient scaling term correctly tapers heating efficiency below $85^\circ\text{F}$.
3. **Additive Humidity (CHSI):** Unlike human heat index (which models skin sweat evaporation), CHSI reflects canine panting limitations by scaling humidity with air temperature above $14^\circ\text{F}$.
4. **Temperate Safe Anchor:** The $-89$ CHSI anchor ensures that comfortable $60^\circ\text{F} - 68^\circ\text{F}$ weather produces an NPI near zero ($< 1.0$).

---

## 3. Critical Scientific Gaps in the Current 6.0 Algorithm

| Feature / Variable | Current 6.0 Implementation | Scientific Reality & Clinical Research | Impact / Risk |
|---|---|---|---|
| **Dog Fur Color (`dogColor`)** | **Completely ignored** (0 effect on NPI) | A black coat absorbs **$85-92\%$** of solar irradiance vs **$40-50\%$** for a light/white coat. Surface fur temperatures differ by up to **$25^\circ\text{F}$** in direct sun. | Under-predicts heat stress for black Labs/Rottweilers in direct sunlight. |
| **Brachycephalic Airway (BOAS)** | Static linear multiplier: **$+15\%$** | In high humidity ($>70\%$) and high heat ($>85^\circ\text{F}$), brachycephalic airway resistance produces non-linear respiratory collapse (**3.8× - 5.0× clinical risk**). | Dangerously under-estimates French Bulldog/Pug risk in muggy summer conditions. |
| **Planned Walk Duration** | **Completely omitted** (implicitly instantaneous) | Canine hyperthermia is an integral: $Q = \int (M + R - E) dt$. A 10-min relief walk is manageable; a 45-min walk causes heat stroke. | Cannot differentiate between a quick bathroom break and an endurance walk. |
| **Hairless Dog Heat Physics** | Treated identically to single coat ($1.0\text{x}$) | Hairless dogs (Chinese Crested, Xoloitzcuintli) suffer direct cutaneous solar erythema (sunburn) and higher conductive heat gain. | Misses solar radiation damage on bare skin. |
| **Dew Point / Saturated Vapor Pressure** | Linear CHSI approximation | At high temperatures ($>90^\circ\text{F}$), water vapor deficit $\Delta e$ drops non-linearly; relative humidity above 65% is far more dangerous than modeled. | Under-predicts dangerous "wet-bulb" summer days. |

---

## 4. Ground-Truth Biophysical Model Specification

To evaluate and benchmark the production algorithm, we define a continuous biophysical energy-balance model:

1. **Shortwave Solar Radiation Absorbed ($R_{\text{solar}}$):**
   $$R_{\text{solar}} = I_{\text{solar\_w\_m2}} \cdot A_{\text{projected}} \cdot (1 - \alpha_{\text{coat}})$$
   Where:
   - $\alpha_{\text{coat}} = 0.10$ (Dark)
   - $\alpha_{\text{coat}} = 0.25$ (Medium)
   - $\alpha_{\text{coat}} = 0.45$ (Light)
2. **Vapor Pressure Deficit ($\text{VPD}$):**
   $$e_s(T) = 0.61078 \cdot \exp\left(\frac{17.27 \cdot T_c}{T_c + 237.3}\right) \quad (\text{kPa})$$
   $$e_a = e_s(T_{\text{air}}) \cdot \frac{\text{RH}}{100}$$
   $$\text{VPD} = \max(0.1, e_s(39.0^\circ\text{C}) - e_a)$$
3. **Panting Heat Dissipation Capacity ($E_{\text{panting\_max}}$):**
   $$E_{\text{panting\_max}} = k_{\text{panting}} \cdot \text{VPD} \cdot \eta_{\text{snout}}$$
   Where:
   - $\eta_{\text{snout}} = 0.45$ (Flat / Brachycephalic)
   - $\eta_{\text{snout}} = 1.00$ (Standard)
   - $\eta_{\text{snout}} = 1.15$ (Long / Dolichocephalic)
4. **Duration Exposure Factor ($F_{\text{dur}}$):**
   $$F_{\text{dur}} = 1.0 + 0.35 \cdot \left(\frac{\text{DurationMinutes} - 30}{30}\right)$$

---

## 5. Comparative Evaluation Objectives

We will run an automated ablation and comparison harness across 50,000+ summer scenarios comparing:
1. **Parity on Standard Scenarios:** Confirming NorthPaw 6.0 and the biophysical model agree within $\pm 0.5$ NPI points on standard adult Labrador retrievers.
2. **Brachycephalic Gap Analysis:** Quantifying how much 6.0 under-predicts flat-faced dog danger in muggy heat.
3. **Fur Color Gap Analysis:** Quantifying the delta between Light vs Dark dogs in full sun.
4. **Pavement Safety Transition Analysis:** Checking false negative rates around the $125^\circ\text{F}$ asphalt burn line.
