# NorthPaw Unresolved Questions & Scientific Uncertainty Registry

This registry documents open scientific questions, data gaps, and empirical uncertainties in companion canine winter physiology identified during the NorthPaw Winter Evidence Audit.

Where scientific literature is silent or ambiguous, NorthPaw maintains strict epistemic discipline: **Unknown $\neq$ Safe**, and we explicitly refrain from manufacturing pseudo-precise algorithms.

---

## 1. Footpad Conductive Heat Flux During Locomotion in Companion Dogs
- **The Gap**: What is the actual in-vivo heat flux and tissue temperature of footpads in unanesthetized companion dogs walking on sub-freezing urban pavements (concrete, asphalt) across different temperatures ($-15^\circ\text{C}\text{ to }0^\circ\text{C}$)?
- **Current Evidence**:
  - Hurley & Entin (1954): Cryogenic immersion in anesthetized dogs.
  - Henshaw (1972): Arctic wolves standing on chilled metal plates.
- **Why It Matters**: Prevents establishing a mathematically defensible "safe walking time" on freezing pavement before paw pain or frostbite occurs.
- **NorthPaw Production Stance**: Reject numerical time thresholds; output symptom-based behavioral guidance (watch for paw lifting, limp, shivering) and recommend boots/balm as physical barriers.

---

## 2. Inhaled Cold Air Bronchial Reactivity in Brachycephalic Canines
- **The Gap**: Does inhaling sub-freezing air ($-10^\circ\text{C}\text{ to }-20^\circ\text{C}$) induce clinically significant bronchoconstriction, mucosal drying, or hypothermia in brachycephalic dogs compared to mesocephalic dogs?
- **Current Evidence**: Extensive human asthma and equine cold-induced airway hyperresponsiveness literature exists; canine literature is virtually nonexistent outside of summer BOAS heat stress.
- **Why It Matters**: Determines whether a brachycephalic cold adjustment is biologically warranted or pure speculation.
- **NorthPaw Production Stance**: Maintain brachycephaly as cold-neutral until direct veterinary pulmonology data is published. Rely entirely on body mass and short coat phenotype.

---

## 3. Microclimate and Indoor HVAC Acclimatization Decay in Pet Dogs
- **The Gap**: How quickly does cold-induced fur insulation and metabolic adaptation (as measured by Sugano 1981 in outdoor dogs) decay when dogs are housed indoors at $21^\circ\text{C}$ ($70^\circ\text{F}$)?
- **Current Evidence**: Rodent and human data show metabolic non-shivering thermogenesis (brown adipose tissue) uncoupling decays within 1–3 weeks of warm housing.
- **Why It Matters**: Evaluates whether dogs living in cold northern climates develop meaningful acclimatization despite living indoors.
- **NorthPaw Production Stance**: Because indoor microclimate, HVAC history, and acute exposure habits cannot be observed, NorthPaw must represent acclimatization as **UNKNOWN / UNOBSERVABLE**. Under the core invariant *Unknown $\neq$ Safe*, NorthPaw cannot credit unobservable acclimatization to relax safety thresholds.

---

## 4. Geriatric Canine Metabolic Lower Critical Temperature
- **The Gap**: What is the exact metabolic Lower Critical Temperature (LCT) shift in healthy geriatric dogs ($>10\text{ years}$) compared to young adult dogs of identical breed and body composition?
- **Current Evidence**: Clinical consensus confirms decreased mobility, sarcopenia, and osteoarthritis stiffness in cold weather; metabolic chamber calorimetry comparing young vs. old dogs is lacking.
- **Why It Matters**: Determines whether senior dogs require an automated categorical temperature shift or solely observational guidance.
- **NorthPaw Production Stance**: Classify senior age as **INFORMATIONAL ONLY**. Provide mobility and joint-stiffness warnings without triggering unjustified red-alert false alarms.

---

## 5. Quantitative Chemical Deicer Dispersion and Persistence on Urban Sidewalks
- **The Gap**: What is the spatial probability and concentration of solid chemical deicers ($\text{CaCl}_2$, $\text{NaCl}$, magnesium chloride) on municipal vs. private residential sidewalks as a function of time post-snowfall?
- **Current Evidence**: Civil engineering studies focus on road plowing and highway brine friction; sidewalk deicer application is decentralized, highly stochastic, and undocumented in real-time APIs.
- **Why It Matters**: Prevents algorithmic determination of sidewalk chemical exposure from weather data alone.
- **NorthPaw Production Stance**: Maintain `chemical_evidence_state = treatment_data_unavailable` when direct report is missing. Surface cautious post-walk paw wash guidance during winter weather.

---

## 6. Interaction of Canine Locomotion Velocity with Convective Heat Loss
- **The Gap**: At what running speed does internal muscular metabolic heat generation ($M_{\text{locomotion}}$) exactly offset the increased convective heat loss caused by higher relative wind velocity in companion dogs?
- **Current Evidence**: Baker et al. (2018) showed working search dogs rapidly build heat during intense exercise in temperate weather; sled dog studies show pulling dogs generate excess heat down to $-20^\circ\text{C}$. Companion dogs on casual leashed walks generate only $1.5\times - 2.0\times$ resting metabolic rate.
- **Why It Matters**: High-energy off-leash running in deep snow may prevent hypothermia, while a stationary or slow on-leash walk causes rapid cooling.
- **NorthPaw Production Stance**: NorthPaw cannot observe real-time gait velocity via ambient weather APIs. The engine conservatively models normal leashed walking velocity and cautions owners that stationary dogs cool far faster.
