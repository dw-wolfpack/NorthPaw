# 02 — Mathematical Model Specification: Canine Cold Stress Index (CCSI)

> **Algorithmic Formulation, Equations & Parameters for Cold Weather Risk**  
> *Target: Engineering Implementation & Test-Driven Development*

---

## 1. Ground-Level Canine Wind Chill Temperature ($WCT_{\text{dog}}$)

Standard NWS Wind Chill is calibrated for adult human facial tissue measured at $10\text{ meters}$ anemometer height:

$$WCT_{\text{standard}} = 35.74 + 0.6215 T_{\text{air}} - 35.75 V_{10}^{0.16} + 0.4275 T_{\text{air}} V_{10}^{0.16}$$

### Atmospheric Boundary Layer Wind Shear Correction
Dogs stand between $0.2\text{ m}$ (Chihuahua) and $0.8\text{ m}$ (Great Dane) above ground level. Surface friction and aerodynamic surface roughness length ($z_0$) significantly reduce wind speed at canine stature:

$$V_{\text{dog}} = V_{10} \cdot \frac{\ln(z_{\text{dog}} / z_0)}{\ln(10 / z_0)}$$

For standard suburban terrain ($z_0 \approx 0.05\text{ m}$) and a median dog height ($z_{\text{dog}} \approx 0.45\text{ m}$):

$$V_{\text{dog}} \approx 0.415 \cdot V_{10}$$

### Canine Apparent Wind Chill Formulation
Using effective canine stature wind speed $V_{\text{dog}}$:

$$T_{\text{wc}} = \begin{cases} 
T_{\text{air}} & \text{if } T_{\text{air}} \ge 50^\circ\text{F} \text{ or } V_{\text{dog}} < 3.0\text{ mph} \\
35.74 + 0.6215 T_{\text{air}} - 35.75 (V_{\text{dog}})^{0.16} + 0.4275 T_{\text{air}} (V_{\text{dog}})^{0.16} & \text{if } T_{\text{air}} < 50^\circ\text{F} \text{ and } V_{\text{dog}} \ge 3.0\text{ mph}
\end{cases}$$

---

## 2. Tufts Animal Care & Condition (TACC) Base Cold Stress Function

The Tufts TACC scale defines 5 veterinary risk categories for outdoor dogs based on apparent temperature:
* **Category 1 (No risk):** $\ge 45^\circ\text{F}$ ($7.2^\circ\text{C}$)
* **Category 2 (Low/Mild risk):** $32^\circ\text{F} - 44^\circ\text{F}$ ($0^\circ\text{C} - 6.7^\circ\text{C}$)
* **Category 3 (Moderate risk):** $20^\circ\text{F} - 31^\circ\text{F}$ ($-6.7^\circ\text{C} - -0.6^\circ\text{C}$)
* **Category 4 (Severe risk):** $0^\circ\text{F} - 19^\circ\text{F}$ ($-17.8^\circ\text{C} - -7.2^\circ\text{C}$)
* **Category 5 (Critical danger):** $< 0^\circ\text{F}$ ($< -17.8^\circ\text{C}$)

### Continuous Mathematical Base Curve ($S_{\text{base}}$)
To eliminate jarring step-functions, NorthPaw models baseline cold risk as a continuous exponential-decay curve anchored at $45^\circ\text{F}$:

$$S_{\text{base}}(T_{\text{wc}}) = \begin{cases}
0.0 & \text{if } T_{\text{wc}} \ge 45.0^\circ\text{F} \\
\min\left(10.0, \; 0.12 \cdot (45.0 - T_{\text{wc}}) + 0.0035 \cdot (45.0 - T_{\text{wc}})^2\right) & \text{if } T_{\text{wc}} < 45.0^\circ\text{F}
\end{cases}$$

#### Base Score Checkpoints:
* At $45^\circ\text{F}$: $S_{\text{base}} = 0.0$ (Ready)
* At $32^\circ\text{F}$: $S_{\text{base}} = 0.12(13) + 0.0035(169) = 1.56 + 0.59 = \mathbf{2.15}$ (Mild)
* At $20^\circ\text{F}$: $S_{\text{base}} = 0.12(25) + 0.0035(625) = 3.00 + 2.19 = \mathbf{5.19}$ (Moderate / Amber)
* At $0^\circ\text{F}$: $S_{\text{base}} = 0.12(45) + 0.0035(2025) = 5.40 + 7.09 = \mathbf{10.0}$ (Crimson / Critical)

---

## 3. Biological Canine Multipliers ($M_{\text{bio}}$)

The base environmental score is scaled by individual dog traits:

$$CCSI = \min(10.0, \; S_{\text{base}} \cdot F_{\text{mass}} \cdot F_{\text{coat}} \cdot F_{\text{snout}} \cdot F_{\text{age}} \cdot F_{\text{wet}})$$

### A. Body Mass Factor ($F_{\text{mass}}$)
Calibrated against allometric surface-to-volume ratio ($A/M \propto M^{-1/3}$):

$$F_{\text{mass}} = \begin{cases}
1.35 & \text{Toy / Small Breeds } (< 15\text{ lbs}) \\
1.15 & \text{Small / Medium Breeds } (15 - 30\text{ lbs}) \\
1.00 & \text{Standard Medium / Large Breeds } (31 - 70\text{ lbs}) \\
0.85 & \text{Giant Breeds } (> 70\text{ lbs})
\end{cases}$$

### B. Coat Insulation Inversion Factor ($F_{\text{coat}}$)
In cold weather, coat polarity completely inverts compared to summer heat:

$$F_{\text{coat}} = \begin{cases}
0.65 & \text{Double Coat (Heavy undercoat: Husky, Malamute, Samoyed, Pyrenees, GSD)} \\
0.85 & \text{Wire / Dense Hair Coat (Schnauzer, Poodle, Wirehaired Pointer)} \\
1.00 & \text{Standard Single Coat (Labrador, Golden, Beagle)} \\
1.40 & \text{Short / Thin / Single Coat (Whippet, Italian Greyhound, Chihuahua, Pitbull, Doberman)}
\end{cases}$$

### C. Snout Air Pre-Warming Factor ($F_{\text{snout}}$)
Nasal turbinates pre-warm and humidify sub-freezing air before it contacts lung alveoli:
* **Dolichocephalic (Long nose: Greyhounds, Collies):** Superior air pre-warming $\implies F_{\text{snout}} = \mathbf{0.95}$
* **Mesocephalic (Standard nose: Labs, Shepherds):** Baseline $\implies F_{\text{snout}} = \mathbf{1.00}$
* **Brachycephalic (Flat-faced: French Bulldogs, Pugs, Boxers):** Minimal nasal cavity; freezing dry air hits bronchial tissue directly, causing airway spasms and coughing $\implies F_{\text{snout}} = \mathbf{1.25}$

### D. Vulnerable Age Factor ($F_{\text{age}}$)
* Senior dogs ($\ge 9\text{ years}$): Stiffened arthritic joints, reduced peripheral circulation $\implies F_{\text{age}} = \mathbf{1.15}$
* Puppies ($\le 1\text{ year}$): Immature thermoregulatory capacity $\implies F_{\text{age}} = \mathbf{1.15}$
* Prime adults ($2 - 8\text{ years}$): Baseline $\implies F_{\text{age}} = \mathbf{1.00}$

### E. Moisture Penalty ($F_{\text{wet}}$)
If precipitation (snow, sleet, freezing rain) is active:
* $F_{\text{wet}} = \mathbf{1.30}$ (Coat thermal conductivity increases dramatically).
