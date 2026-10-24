# NorthPaw Winter Claim Registry & Invariant Rules

This registry defines the audit verdict, scientific support, implementation boundaries, and deterministic invariants for Candidate Relationships A through R in NorthPaw's winter decision engine.

---

## Candidate Relationships & Production Invariants

### RULE-A: Colder Conditions Cannot Improve Cold-Exposure State
- **RULE ID**: `RULE-A-TEMP-MONOTONICITY`
- **NorthPaw Claim**: As ambient temperature decreases (all other variables held constant), a dog's cold exposure risk cannot decrease or become safer.
- **Claim Audit Verdict**: **SUPPORTED**
- **Evidence Classification**: **A** (Sugano 1981, McIntyre & Ederstrom 1958) & **D** (Newton's Law of Cooling, Fourier's Conduction).
- **Supporting Papers**: 
  - Sugano (1981) [A]: Measured directly increasing metabolic oxygen consumption and declining peripheral skin temperatures as chamber ambient temperature dropped from $30^\circ\text{C}$ to $5^\circ\text{C}$ in dogs.
  - McIntyre & Ederstrom (1958) [A]: Progressive decline in environmental temperature directly correlated with accelerated rectal cooling rates.
- **Contradicting Papers**: None. (Physical impossibility under biological thermodynamics).
- **Population Limitations**: Universal across all domestic canines.
- **Allowed Implementation**: Deterministic monotonic ordering: $\forall T_1 < T_2$, $\text{State}(T_1) \ge \text{State}(T_2)$ where higher state denotes equal or greater hazard severity.
- **Forbidden Interpretation**: Non-monotonic temperature curves or arbitrary dips where a colder temperature is rendered "safer" due to polynomial/spline interpolation artifacts.
- **Confidence / Uncertainty Description**: Absolute physiological and thermodynamic certainty.
- **Tests Protecting the Claim**: `test_cold_temperature_monotonicity` in `adversarial_invariants_test.py` (verifies $T \in [-30^\circ\text{F}, 50^\circ\text{F}]$ in $1^\circ\text{F}$ increments).

---

### RULE-B: Greater Wind Exposure Cannot Improve Cold-Exposure State
- **RULE ID**: `RULE-B-WIND-MONOTONICITY`
- **NorthPaw Claim**: Increasing wind speed (all other variables held constant) increases convective heat loss and cannot make cold exposure safer.
- **Claim Audit Verdict**: **SUPPORTED**
- **Evidence Classification**: **A** (VKM Report 2017) & **D** (Arkin et al. 1991, Boundary-layer convective physics).
- **Supporting Papers**:
  - VKM Report (2017) [A]: Systematic sled dog welfare consensus demonstrated that 5–10 m/s wind elevates convective heat loss by $>200\%$, raising effective LCT by 10°C–15°C.
  - Arkin et al. (1991) [D]: Wind strips the stagnant boundary layer of warm air trapped in fur, multiplying convective coefficient $h_c \propto v^{0.6}$.
- **Contradicting Papers**: None.
- **Population Limitations**: Applies to all canines exposed to convective air movement.
- **Allowed Implementation**: Monotonic step/escalation: $\forall v_1 > v_2$, $\text{State}(v_1) \ge \text{State}(v_2)$.
- **Forbidden Interpretation**: Using human NOAA wind chill formulas to state: *"It is 15°F with wind chill, so your dog's ears will freeze in 30 minutes."* Human facial heat loss models do not apply quantitatively to haired quadrupeds.
- **Confidence / Uncertainty Description**: Physical mechanism and directional impact are certain; precise convective clo degradation per dog breed is an unobserved continuous variable, so wind must be handled via discrete categorical wind bands.
- **Tests Protecting the Claim**: `test_wind_monotonicity` (verifies speeds 0 to 50 mph across multiple temperatures).

---

### RULE-C: Wetness Cannot Improve Cold Safety
- **RULE ID**: `RULE-C-WETNESS-MONOTONICITY`
- **NorthPaw Claim**: Wet precipitation (rain, freezing rain, wet sleet, slush) increases conductive and evaporative heat loss; holding temperature constant, wetter conditions cannot improve cold safety or justify longer exposure.
- **Claim Audit Verdict**: **SUPPORTED**
- **Evidence Classification**: **A** (ISDVMA Sled Dog 1996) & **D** (Arkin et al. 1991, Erdsack et al. 2013).
- **Supporting Papers**:
  - ISDVMA (1996) [A]: Wet slush near freezing ($-2^\circ\text{C}\text{ to }+1^\circ\text{C}$) produced a $3.8\times$ higher incidence of debilitating paw pad fissures and interdigital erythema ($\text{OR} = 3.82$, $95\%\text{ CI: }2.41 - 6.05$) compared to dry powder snow at $-15^\circ\text{C}$.
  - Arkin et al. (1991) [D]: Water thermal conductivity is $\sim 24\times$ greater than stagnant air ($k \approx 0.60\text{ vs }0.025\text{ W}/(\text{m}\cdot\text{K})$), causing a 3-fold to 5-fold collapse in boundary layer thermal resistance in fur.
- **Contradicting Papers**: None.
- **Population Limitations**: Universal across all mammals.
- **Allowed Implementation**: Deterministic monotonic ordering: $\forall \text{wetness}_1 > \text{wetness}_2$, $\text{State}(\text{wetness}_1) \ge \text{State}(\text{wetness}_2)$ at identical ambient temperatures and exposure durations. Wetness justifies shortening safe exposure duration and raising hazard awareness.
- **Forbidden Interpretation**: 
  - Arbitrarily mandating a universal "+1 tier escalation" under every condition (e.g. converting a mild 45°F brief outing into a high hazard merely because of light rain). The evidence establishes monotonic risk non-decrease, not a mandatory discrete tier jump across all baselines.
  - Treating wet precipitation as negligible because ambient temperature is above freezing.
- **Confidence / Uncertainty Description**: Absolute thermodynamic and clinical certainty for monotonic non-improving safety.
- **Tests Protecting the Claim**: `test_wetness_hazard_escalation` (verifies wet $\ge$ dry across identical ambient temperatures).

---

### RULE-D: Longer Exposure Duration Cannot Improve Cold-Exposure State
- **RULE ID**: `RULE-D-DURATION-MONOTONICITY`
- **NorthPaw Claim**: Holding environmental conditions constant, a longer outdoor duration cannot decrease cumulative thermal deficit or improve safety.
- **Claim Audit Verdict**: **SUPPORTED**
- **Evidence Classification**: **A** (McIntyre & Ederstrom 1958, Sugano 1981) & **D** (Thermodynamic heat debt accumulation: $\Delta S = \int (M - H_{\text{loss}}) dt$).
- **Supporting Papers**:
  - McIntyre & Ederstrom (1958) [A]: Rectal temperatures exhibited monotonic downward decay over exposure duration in cold environments.
- **Contradicting Papers**: None.
- **Population Limitations**: Universal across all homeothermic organisms.
- **Allowed Implementation**: Duration advisory bands must be non-increasing as environmental severity increases. Longer planned walks cannot be granted a safer rating than shorter walks.
- **Forbidden Interpretation**: Suggesting a dog will "warm up" after 45 minutes in sub-freezing weather unless vigorous sustained physical exertion is actively occurring.
- **Confidence / Uncertainty Description**: Fundamental physical certainty.
- **Tests Protecting the Claim**: `test_duration_monotonicity`.

---

### RULE-E: Lower-Insulation Coat Phenotype Increases Cold Vulnerability
- **RULE ID**: `RULE-E-COAT-PHENOTYPE`
- **NorthPaw Claim**: Dogs with single, short, or thin coats lose heat faster and have higher Lower Critical Temperatures than dogs with dense, double coats.
- **Claim Audit Verdict**: **DIRECTIONAL ONLY**
- **Evidence Classification**: **A** (Sugano 1981, VKM Report 2017).
- **Supporting Papers**:
  - Sugano (1981) [A]: Fur insulation differences accounted for a $5.5^\circ\text{C}$ difference in LCT and a $42\%$ change in total thermal resistance in dogs.
  - VKM Report (2017) [A]: Thinner-coated hound crosses had LCTs $15^\circ\text{C}-20^\circ\text{C}$ higher than thick Arctic-coated huskies.
- **Contradicting Papers**: None on direction; however, VKM proved that coat density varies widely within breeds, meaning breed name alone is an inadequate proxy for coat phenotype.
- **Population Limitations**: Valid across all dogs, but phenotypic assessment should come from user coat description (single/short vs. double/dense), not breed registry assumptions.
- **Allowed Implementation**: Categorical coat tiers: `single_short` vs. `double_dense` or `hairless`. Dogs with `single_short` or `hairless` coats escalate cold advisory thresholds by discrete temperature bands.
- **Forbidden Interpretation**: Assigning arbitrary decimal clo values (e.g. `clo = 1.342`) to a dog based on breed or coat selector.
- **Confidence / Uncertainty Description**: Direction is medically and physically sound; continuous quantification is scientifically unsupportable without direct individual calorimetry.
- **Tests Protecting the Claim**: `test_vulnerability_monotonicity` (verifies single coat $\ge$ double coat severity).

---

### RULE-F: Smaller Body Size / Mass Increases Cold Vulnerability
- **RULE ID**: `RULE-F-MASS-SCALING`
- **NorthPaw Claim**: Smaller dogs, possessing a higher surface-area-to-mass ratio ($A/M \propto M^{-1/3}$), lose body heat faster per unit of tissue mass and experience more rapid cooling than larger dogs of similar coat phenotype.
- **Claim Audit Verdict**: **DIRECTIONAL ONLY**
- **Evidence Classification**: **A** (Sugano 1981 direct canine heat balance) & **D** (Comparative biophysics / allometric scaling).
- **Supporting Papers**:
  - Sugano (1981) [A]: Measured total heat balance, metabolic rate ($M$), and insulation in dogs ($10.0 - 15.5\text{ kg}$), demonstrating that heat loss and metabolic requirements conform to surface-area allometry.
  - Classical Allometric Biophysics (Kleiber 1932, Schmidt-Nielsen 1984) [D]: Heat dissipation scales with surface area ($M^{0.67}$), whereas metabolic heat storage scales with mass ($M^{1.0}$). Consequently, surface area per unit mass scales as $M^{-1/3}$, causing smaller mammals to lose heat faster per kilogram.
- **Excluded Citations**: Li et al. (2025) is strictly an engineering biomechanics paper measuring joint moments on slippery floors and contains zero metabolic or thermoregulatory measurements; it is therefore excluded from body-mass thermoregulation.
- **Contradicting Papers**: None on biophysical direction.
- **Population Limitations**: Valid directionally across all dog sizes, but must be conditioned on coat phenotype (e.g. a 10 lb Pomeranian with dense double coat may conserve core heat longer than a 70 lb short-coated Greyhound).
- **Allowed Implementation**: Coarse categorical mass tiers (`toy_small` $< 15\text{ lbs}$, `medium` $15-50\text{ lbs}$, `large` $> 50\text{ lbs}$) directionally adjusting cold sensitivity thresholds.
- **Forbidden Interpretation**: Generating continuous polynomial equations estimating exact core temperature drops or caloric burn rates from dog weight.
- **Confidence / Uncertainty Description**: Biophysical directional scaling is certain; continuous quantification is scientifically unjustified.
- **Tests Protecting the Claim**: `test_vulnerability_monotonicity` (smaller $\ge$ larger severity at identical coat and weather).

---

### RULE-G: Young Age Increases Cold Vulnerability
- **RULE ID**: `RULE-G-PUPPY-VULNERABILITY`
- **NorthPaw Claim**: Young puppies have underdeveloped heat conservation mechanisms (higher surface-area-to-mass ratio, thinner coat, and less subcutaneous adipose tissue), causing them to lose body heat faster than adult dogs of similar breed type.
- **Claim Audit Verdict**: **DIRECTIONAL ONLY**
- **Evidence Classification**: **A** (McIntyre & Ederstrom 1958).
- **Supporting Papers**:
  - McIntyre & Ederstrom (1958) [A]: Studied 75 puppies (1 to 30 days old) exposed to $4^\circ\text{C}$. Coordinated shivering reflexes and metabolic responses were functional by 2 to 3 weeks of age, but puppies continued to cool rapidly because **heat conservation mechanisms lagged behind heat production** (pp. 293–296). True physiological homeothermy equilibrium was achieved at 4 to 5 weeks.
- **Contradicting Papers**: None.
- **Population Limitations**: Valid for young juvenile dogs under 6 months. Crucially, walking-age companion puppies (typically 8 to 24+ weeks) have fully functional neuromuscular shivering reflexes; their vulnerability is due to physical heat conservation limits (surface-to-volume ratio and thin juvenile pelage), not an absent or immature shivering reflex.
- **Allowed Implementation**: Categorical age flag (`puppy` $< 6\text{ months}$) escalating cold hazard sensitivity by one category based on physical heat loss vulnerability.
- **Forbidden Interpretation**: 
  - Claiming that companion puppies have an "immature shivering reflex" or lack shivering thermogenesis.
  - Fabricating continuous week-by-week numeric tolerance curves.
- **Confidence / Uncertainty Description**: Biological certainty for directional vulnerability based on heat conservation limits.
- **Tests Protecting the Claim**: `test_vulnerability_monotonicity` (puppy $\ge$ adult severity holding coat and mass constant).

---

### RULE-H: Senior Age May Increase Cold Vulnerability
- **RULE ID**: `RULE-H-SENIOR-VULNERABILITY`
- **NorthPaw Claim**: Senior dogs may have reduced metabolic reserve, thinner subcutaneous fat, compromised circulation, and aggravated osteoarthritis in freezing conditions.
- **Claim Audit Verdict**: **INFORMATIONAL ONLY**
- **Evidence Classification**: **B** (Veterinary clinical consensus, geriatric canine orthopedics; lacking direct canine cold-chamber metabolic curves).
- **Supporting Papers**:
  - Clinical veterinary consensus: Geriatric canines suffer joint stiffness, muscle wasting (sarcopenia), and delayed peripheral vascular reactivity in cold weather.
- **Contradicting Papers**: No direct experimental paper demonstrates a distinct metabolic LCT shift solely due to chronological age in otherwise healthy dogs.
- **Population Limitations**: Highly variable depending on whether osteoarthritis or systemic disease is present.
- **Allowed Implementation**: Non-punitive informational guidance: when user selects `senior`, NorthPaw surfaces orthopedic and cold-stiffness tips and recommends monitoring for shivering or gait changes.
- **Forbidden Interpretation**: Applying an aggressive automatic numerical temperature penalty solely based on calendar age without reported mobility symptoms.
- **Confidence / Uncertainty Description**: Clinical plausibility is high, but direct quantitative metabolic evidence is lacking.
- **Tests Protecting the Claim**: Invariant that senior tag does not cause catastrophic false-alarm state jumps in the absence of cold or slick conditions.

---

### RULE-I: Acclimatization Affects Cold Tolerance
- **RULE ID**: `RULE-I-ACCLIMATIZATION-UNOBSERVABLE`
- **NorthPaw Claim**: While continuous chronic outdoor cold exposure induces physiological acclimatization (shifting LCT downward and increasing fur insulation), an individual companion dog's indoor thermal microclimate, HVAC history, and outdoor exposure duration are completely unobservable to NorthPaw.
- **Claim Audit Verdict**: **DIRECTIONAL ONLY + UNKNOWN / UNOBSERVABLE**
- **Evidence Classification**: **A** (Sugano 1981) & **B** (Covino et al. 1957).
- **Supporting Papers**:
  - Sugano (1981) [A]: Dogs housed 24/7 in outdoor kennels throughout winter exhibited a $5.5^\circ\text{C}$ lower LCT ($12.5 \pm 1.4^\circ\text{C}$ winter vs. $18.0 \pm 1.2^\circ\text{C}$ summer) and a $42\%$ increase in fur insulation ($0.162\text{ vs }0.114\text{ }^\circ\text{C}\cdot\text{m}^2/\text{W}$).
  - Covino et al. (1957) [B]: Dogs maintained continuously at $4^\circ\text{C}$ for 4 weeks exhibited altered myocardial electrophysiology, lowering the core temperature threshold for ventricular fibrillation from $18.2^\circ\text{C}$ down to $14.5^\circ\text{C}$.
- **Contradicting Papers**: None on existence of the physiological mechanism.
- **Population Limitations**: Crucially, modern companion dogs live in heated, climate-controlled homes ($18^\circ\text{C}-22^\circ\text{C}$) and experience acute, intermittent outdoor excursions (15–60 minutes). Their chronic thermal state is completely heterogeneous and unmonitored.
- **Allowed Implementation**: Represent acclimatization as **UNKNOWN / UNOBSERVABLE**. Under NorthPaw's core epistemic invariant: **Unknown $\neq$ Safe**, NorthPaw cannot credit unobservable acclimatization to relax safety thresholds or grant higher cold tolerance. Cold thresholds must remain conservative and cannot be widened based on geographic location or user assumptions.
- **Forbidden Interpretation**: 
  - Assuming an urban/suburban pet dog is cold-acclimatized simply because it lives in a cold region (e.g. Minnesota or Quebec).
  - Positing that pet dogs possess outdoor kennel-level fur insulation (+42%) when living indoors.
- **Confidence / Uncertainty Description**: Biological mechanism is proven in outdoor dogs; individual companion dog status is entirely unknown and unobservable.
- **Tests Protecting the Claim**: `test_unacclimatized_default_safety` (verifies no threshold widening based on location).

---

### RULE-J: Wetness May Overwhelm Coat Insulation Advantages
- **RULE ID**: `RULE-J-WET-COAT-COLLAPSE`
- **NorthPaw Claim**: While a dense double coat provides superior boundary insulation in dry cold, water saturation displaces trapped air and severely degrades fur thermal resistance, meaning double-coated dogs cannot be treated as immune to cold distress during freezing precipitation or slush exposure.
- **Claim Audit Verdict**: **SUPPORTED**
- **Evidence Classification**: **A** (VKM Report 2017, ISDVMA 1996) & **D** (Arkin et al. 1991).
- **Supporting Papers**:
  - Arkin et al. (1991) [D]: Replacing insulating stagnant air ($k \approx 0.025\text{ W/m}\cdot\text{K}$) with water ($k \approx 0.60\text{ W/m}\cdot\text{K}$) caused a 3-fold to 5-fold collapse in fur layer thermal resistance ($R_{\text{fur}}$) in bovine pelts (p. 2554).
  - VKM Report (2017) [A]: Wet coats in working sled dogs collapsed undercoat loft and raised the effective Lower Critical Temperature to above freezing ($+2^\circ\text{C}\text{ to }+4^\circ\text{C}$).
- **Contradicting Papers**: None.
- **Population Limitations**: Universal to mammalian fur coats.
- **Allowed Implementation**: Deterministic invariant: **A double coat must NEVER cancel, override, or mute a wetness hazard.** If freezing precipitation or wet slush is active, cold hazard state must escalate regardless of coat type.
- **Forbidden Interpretation**: 
  - Quoting a fabricated canine-specific percentage (e.g. *"Wet coats lose 90% of insulation"*).
  - Treating double-coated breeds (Huskies, German Shepherds) as exempt from wet-cold exposure hazards.
- **Confidence / Uncertainty Description**: Absolute thermodynamic certainty for severe insulation degradation; precise canine percentage loss is unmeasured.
- **Tests Protecting the Claim**: `test_double_coat_does_not_cancel_wetness` in `adversarial_invariants_test.py`.

---

### RULE-K: Low-Friction Surfaces Create Meaningful Traction / Biomechanical Risk
- **RULE ID**: `RULE-K-TRACTION-BIOMECHANICS`
- **NorthPaw Claim**: Low-friction surfaces (ice, glazed snow, slick pavement) trigger compensatory gait alterations, elevate transverse-plane joint moments, and substantially increase slip frequency in companion dogs, representing an independent mechanical hazard rather than a thermal hazard.
- **Claim Audit Verdict**: **SUPPORTED**
- **Evidence Classification**: **A** (Li et al. 2025).
- **Supporting Papers**:
  - Li et al. (2025) [A]: Measured 3D kinematics and inverse dynamics in small dogs on low-friction flooring ($\mu < 0.2$), demonstrating a $24\%$ increase in stifle abduction moment, a $31\%$ increase in hip adduction torque during stance phase, and a $420\%$ surge in slip incidence as dogs splayed limbs to lower center of mass (pp. 1–6).
- **Contradicting Papers**: None.
- **Population Limitations**: Directly measured in small companion breeds.
- **Crucial Evidentiary Boundary**: Li et al. (2025) demonstrated **elevated biomechanical loading and abnormal transverse-plane joint moments**, which mechanically stress joint structures. The study did **NOT demonstrate actual clinical ligament tears, rupture, or patellar luxation events** in the experimental subjects.
- **Allowed Implementation**: Independent **Ice / Traction** condition component arbitrated alongside cold exposure. Advise caution regarding slip risk and joint strain.
- **Forbidden Interpretation**: 
  - Claiming that the literature demonstrates actual ligament rupture or tears during experimental walking trials.
  - Collapsing traction risk into an aggregate scalar "cold score."
- **Confidence / Uncertainty Description**: Rigorous empirical proof of abnormal biomechanical joint loading and slip frequency; zero evidence of acute tissue rupture in trial.
- **Tests Protecting the Claim**: `test_traction_hazard_independence`.

---

### RULE-L: Freezing Precipitation / Refreeze Justifies Traction Caution
- **RULE ID**: `RULE-L-REFREEZE-EVIDENCE-TIERING`
- **NorthPaw Claim**: Weather conditions involving rain followed by sub-freezing temperatures, melting snowpack with sub-freezing surface temperatures, or freezing rain justify an advisory for slick surfaces; however, forecast refreeze must not be asserted as confirmed ice.
- **Claim Audit Verdict**: **SUPPORTED** (with strict evidentiary tiering).
- **Evidence Classification**: **D** (FHWA RWIS Guidelines 2019) & **B** (ISDVMA 1996).
- **Supporting Papers**:
  - FHWA (2019) [D]: Road weather empirical models prove black ice/refreeze occurs when surface temperatures fall below dew point and $0^\circ\text{C}$ after liquid presence.
- **Contradicting Papers**: None on physical refreeze dynamics.
- **Population Limitations**: Infrastructure and walking surface phenomenon.
- **Allowed Implementation**: Asymmetric evidence states:
  - `confirmed_ice`: Direct user observation or verified RWIS ground sensor.
  - `possible_refreeze`: Algorithmic inference from antecedent wetness + sub-freezing drop.
  - User-facing text must say: *"Possible slick surfaces / refreeze"* rather than claiming confirmed ice.
- **Forbidden Interpretation**: Stating: *"The sidewalk is iced"* based solely on weather API temperature drops.
- **Confidence / Uncertainty Description**: Meteorological inference is probabilistic; strict semantic separation between `confirmed` and `possible` is mandatory.
- **Tests Protecting the Claim**: `test_forecast_cannot_become_confirmed_ice`.

---

### RULE-M: Paw Cold Injury Exists; Ordinary Outing Threshold
- **RULE ID**: `RULE-M-PAW-COLD-THRESHOLD-INSUFFICIENT`
- **NorthPaw Claim**: Domestic dog paw tissue freezes at $-2.5^\circ\text{C}\text{ to }-3.0^\circ\text{C}$ under experimental cryogenic conditions, and dogs experience discomfort from snow/ice-balling; however, **no defensible quantitative time-to-frostbite threshold exists for ordinary walking companion dogs.** Protective boots and paw balm operate through distinct physical mechanisms and must be independently substantiated.
- **Claim Audit Verdict**: **INSUFFICIENT (for quantitative timers) / DIRECTIONAL ONLY (for paw protection advice)**
- **Evidence Classification**: **B** (Hurley & Entin 1954, Henshaw 1972, ISDVMA 1996) & **A** (Bieber et al. 2022).
- **Supporting Papers**:
  - Hurley & Entin (1954) [B]: Direct canine paw tissue freezing occurred at $-2.5^\circ\text{C}\text{ to }-3.0^\circ\text{C}$, but measured under cryogenic refrigerant immersion with pentobarbital general anesthesia; cannot establish walking thresholds.
  - Henshaw (1972) [B]: Arctic wolves maintain pad temperatures of $+1^\circ\text{C}\text{ to }+3^\circ\text{C}$ on $-30^\circ\text{C}$ plates via specialized countercurrent vascular shunts; cannot be generalized to companion dogs.
  - Bieber et al. (2022) [A]: Studied $N = 5$ Labrador Retrievers on a pressure walkway; wearing boots significantly altered peak vertical force ($PF_z$) and vertical impulse ($IF_z$) and redistributed center of pressure (COP) parameters.
  - ISDVMA (1996) [B]: Field veterinary assessment of sled dogs demonstrating snow packing between digits ("ice-balling") and maceration in wet conditions.
- **Independent Substantiation of Protective Measures**:
  1. **Protective Boots**: Provide an impermeable physical barrier against sharp crust ice and solid/liquid chemical deicers ($\text{CaCl}_2$ pellets). However, because boots measurably alter paw kinetics and force distribution (Bieber et al. 2022), they should be advised selectively when specific surface hazards (sharp ice, chemical deicers) are present, rather than mandated indiscriminately for all cold walks.
  2. **Paw Balm / Wax**: Hydrocarbon/wax ointments (e.g. beeswax, lanolin) provide a hydrophobic coating that reduces snow and ice adhesion ("ice-balling") between toes and prevents skin desiccation. However, balm provides **zero thermal insulation** and **negligible barrier protection against dissolved chemical deicer ions** in wet slush.
- **Contradicting Papers**: No published study connects ambient temperature, wind, and time-to-frostbite in walking pet dogs.
- **Population Limitations**: Lab dogs were anesthetized; Arctic wolves are not companion dogs.
- **Allowed Implementation**:
  - Alert owners to behavioral signs of distal cold distress (paw lifting, limping, shivering).
  - Recommend boots for chemical deicers and sharp crust ice; recommend balm for snow-balling prevention on packed snow.
- **Forbidden Interpretation**: 
  - Fabricating a countdown timer (e.g. *"Frostbite risk begins in 18 minutes at 14°F"*).
  - Claiming paw balm protects against chemical deicers or provides thermal insulation.
- **Confidence / Uncertainty Description**: Distal tissue injury exists; quantitative time thresholds are scientific fiction.
- **Tests Protecting the Claim**: Test verifying that NorthPaw outputs no continuous frostbite countdown clock.

---

### RULE-N: Calcium Chloride Deicers Cause Dermal Necrosis (Calcinosis Cutis)
- **RULE ID**: `RULE-N-DEICER-TOXICOLOGY`
- **NorthPaw Claim**: Solid calcium chloride ($\text{CaCl}_2$) de-icing pellets cause acute contact dermatitis, severe ulceration, and necrotizing calcinosis cutis in canine paw pads and ventral skin through exothermic hydration and percutaneous calcium penetration.
- **Claim Audit Verdict**: **SUPPORTED (specifically for $\text{CaCl}_2$ pellets)**
- **Evidence Classification**: **A** (Schick, Schick, & Richardson 1987).
- **Supporting Papers**:
  - Schick et al. (1987) [A]: Documented severe erythematous papules, deep dermal ulceration, and biopsy-verified dystrophic calcification (calcinosis cutis) within 24 to 48 hours in 4 companion dogs walking on sidewalks treated with commercial $\text{CaCl}_2$ pellets. Serum calcium levels remained normal, proving localized percutaneous toxicity rather than systemic hypercalcemia (pp. 208–211).
- **Contradicting Papers**: None.
- **Population Limitations**: Universal across companion dogs in contact with solid $\text{CaCl}_2$ pellets.
- **Crucial Evidentiary Boundary**: Schick et al. (1987) evaluated specifically **calcium chloride ($\text{CaCl}_2$)** pellets. This evidence does **not** establish necrotizing calcinosis cutis for standard rock salt ($\text{NaCl}$), magnesium chloride, or urea, which primarily produce hyperosmotic surface irritation or gastrointestinal upset if licked in large quantities.
- **Allowed Implementation**:
  - When walking on surfaces treated with solid deicing pellets, advise using protective boots (Bieber et al. 2022).
  - Advise owners to wipe or rinse paws with warm water after walks in areas where chemical deicers are present to remove caustic residues and prevent chemical ingestion from grooming.
- **Forbidden Interpretation**: 
  - Mandating paw washing as a legally or medically enforceable rule ("mandatory post-walk wash").
  - Claiming all deicers cause necrotizing calcinosis cutis (this is biologically established specifically for $\text{CaCl}_2$).
- **Confidence / Uncertainty Description**: Conclusive clinical and histopathological proof for $\text{CaCl}_2$ pellets.
- **Tests Protecting the Claim**: `test_chemical_hazard_triggers_paw_wash_advice`.

---

### RULE-O: Inferring Chemical Treatment from Weather Alone
- **RULE ID**: `RULE-O-SALT-INFERENCE-UNOBSERVABLE`
- **NorthPaw Claim**: Weather conditions (e.g. freezing temperatures following snow) explain why road crews *might* apply salt; however, **no scientific or physical evidence permits inferring that a specific sidewalk was chemically treated from weather alone.**
- **Claim Audit Verdict**: **CONTRADICTED / UNKNOWN / UNOBSERVABLE**
- **Evidence Classification**: **D** (Municipal DPW Operations, Salt Institute Guidelines).
- **Supporting Papers**:
  - Municipal snow and ice control surveys demonstrate immense spatial variance in deicer application: city streets receive brine/salt, residential sidewalks are treated sporadically by individual property owners, and dog parks/trails are untreated.
- **Contradicting Papers**: Every municipal operations study contradicts uniform deicer presence.
- **Population Limitations**: Purely an environmental/infrastructure operational boundary.
- **Allowed Implementation**:
  - When direct observation or local agency alerts are absent, NorthPaw must set `chemical_evidence_state = treatment_data_unavailable`.
  - Reframe as **Winter Chemical Exposure Evidence**: if weather is freezing and snow/ice has fallen, surface a cautious reminder: *"If walking where chemical deicers are used, wipe paws after the walk."*
- **Forbidden Interpretation**: Reporting *"Sidewalks are salted"* or *"Chemical hazard active"* based solely on weather API data.
- **Confidence / Uncertainty Description**: Meteorological data has near-zero predictive correlation with private residential sidewalk salting.
- **Tests Protecting the Claim**: `test_unknown_chemical_treatment_semantics` (verifies `treatment_data_unavailable` does not become confirmed salt or safe).

---

### RULE-P: Breed Identity Adds Predictive Value Beyond Phenotype
- **RULE ID**: `RULE-P-BREED-VS-PHENOTYPE`
- **NorthPaw Claim**: After physical phenotype variables (body mass, coat density/type, and age) are accounted for, breed registry identity provides no validated independent predictive information for cold tolerance.
- **Claim Audit Verdict**: **INSUFFICIENT / CONTRADICTED**
- **Evidence Classification**: **A** (VKM Report 2017).
- **Supporting Papers**:
  - VKM Report (2017) [A]: Demonstrated that dogs of the exact same breed label (Alaskan Husky) exhibit massive variations in coat thickness, lower critical temperature (ranging from $-25^\circ\text{C}$ to $+5^\circ\text{C}$), and cold tolerance depending on individual lineage and hound crossbreeding.
- **Contradicting Papers**: No study demonstrates that two dogs of identical mass, adiposity, age, and coat type have different cold tolerances simply because of different breed names on their pedigree papers.
- **Population Limitations**: Universal across purebred and mixed-breed dogs.
- **Allowed Implementation**: Deterministic invariant: Changing a dog's breed name while holding body mass, coat type, and age identical **must produce identical cold exposure decisions**.
- **Forbidden Interpretation**: Building a lookup table of 300+ breeds with bespoke cold sensitivity multipliers.
- **Confidence / Uncertainty Description**: Genetic breed labels are poor proxies for functional thermal phenotypes.
- **Tests Protecting the Claim**: `test_breed_independence_invariant` (verifies identical outputs for Golden Retriever vs. Mixed Breed of identical mass/coat).

---

### RULE-Q: Brachycephaly Winter Cold Adjustment
- **RULE ID**: `RULE-Q-BRACHYCEPHALY-COLD-NEUTRAL`
- **NorthPaw Claim**: While brachycephalic dogs have upper airway obstructions that impair evaporative cooling during heat stress, **there is zero peer-reviewed evidence indicating that brachycephalic airway conformation increases cold vulnerability or requires a winter-specific adjustment.**
- **Claim Audit Verdict**: **INSUFFICIENT / UNRESOLVED / CONTRADICTED BY ABSENCE OF EVIDENCE**
- **Evidence Classification**: **X** (Literature on Brachycephalic Obstructive Airway Syndrome [BOAS] addresses heat/humidity dissipation, not cold bronchospasm).
- **Supporting Papers**: None for winter cold impairment.
- **Contradicting Papers**: None demonstrating cold-induced respiratory distress in brachycephalic vs. mesocephalic dogs.
- **Population Limitations**: Brachycephalic breeds (French Bulldogs, Pugs, English Bulldogs).
- **Allowed Implementation**:
  - **Zero winter-specific algorithmic adjustment for brachycephaly.**
  - **Zero winter-specific user-facing copy regarding skull shape or brachycephaly.**
  - Dogs of brachycephalic breeds receive winter guidance strictly according to their physical body mass tier and coat phenotype (e.g., small body size and thin single coat).
- **Forbidden Interpretation**: 
  - Applying an automated temperature penalty or sensitivity multiplier based on brachycephaly in winter.
  - Generating generic winter user-facing copy warning about brachycephalic lungs, breathing freezing air, or skull shape.
- **Confidence / Uncertainty Description**: BOAS is an evaporative cooling failure in hot environments; winter cold claims are unsupported folk assumptions.
- **Tests Protecting the Claim**: `test_brachycephaly_cold_neutrality` (verifies brachycephalic input produces identical output to mesocephalic input of identical mass and coat).

---

### RULE-R: Fur Color Winter Adjustment
- **RULE ID**: `RULE-R-FUR-COLOR-COLD`
- **NorthPaw Claim**: Dark fur absorbs more solar radiation than light fur; however, in winter conditions, solar elevation is low, solar irradiance is minimal, and convective wind dominates heat loss, meaning fur color has no defensible cold adjustment.
- **Claim Audit Verdict**: **INSUFFICIENT / CONTRADICTED**
- **Evidence Classification**: **D** (Comparative biophysics) / **X**.
- **Supporting Papers**:
  - Walsberg (1983) and comparative mammalian thermal radiation studies show that while dark coats absorb shortwave solar radiation at the outer hair tips, convective wind readily strips this heat before it conducts to the skin. In winter latitudes where solar angles are low and cloud cover is high, net radiative solar gain is negligible compared to convective and conductive losses.
- **Contradicting Papers**: No study shows a clinically or statistically significant cold survival or LCT advantage for black dogs over white dogs in winter conditions.
- **Population Limitations**: Universal across coat color variations.
- **Allowed Implementation**: **Zero winter algorithmic adjustment based on fur color.**
- **Forbidden Interpretation**: Rating black dogs as "safe" at lower temperatures than blonde or white dogs.
- **Confidence / Uncertainty Description**: Mechanistically negligible in winter.
- **Tests Protecting the Claim**: `test_fur_color_cold_neutrality`.

---

## 3. Formal Change Proposals

### Change Proposal 1: De-aggregation of Winter Scalar into Multi-Hazard Arbitration
- **CURRENT BEHAVIOR**: Earlier proposed draft models attempted to calculate a single scalar value $NPI_{\text{cold}}$ and combine it via $\max(NPI_{\text{heat}}, NPI_{\text{cold}})$.
- **EVIDENCE**: Li et al. (2025) [A], Schick et al. (1987) [A], ISDVMA (1996) [A]. Cold exposure, orthopedic traction/slip, and chemical deicer exposure operate through completely independent pathophysiological mechanisms.
- **PROPOSED BEHAVIOR**: Formally deprecate continuous $NPI_{\text{cold}}$. Replace with three independent, deterministically arbitrated condition components:
  1. `Cold Exposure` (ambient temperature, wind, duration, coat/mass phenotype)
  2. `Traction / Biomechanics` (ice, packed snow, refreeze potential)
  3. `Chemical Exposure` (deicers, toxic slush)
  The final user-facing action is determined by the most severe active hazard.
- **WHY THIS IS SCIENTIFICALLY STRONGER**: Prevents dangerous false-negative masking (e.g. a mild $34^\circ\text{F}$ day with black ice or toxic calcium chloride pellets would produce a "Safe" cold score, masking life-threatening slip or dermal hazards).
- **USER-VISIBLE CONSEQUENCE**: Clear, unbundled outdoor guidance: *"Cold exposure is mild, but watch for slick refreeze surfaces and wipe paws after walking."*
- **FALSE-POSITIVE RISK**: None.
- **FALSE-NEGATIVE RISK**: Dramatically reduced.
- **UNCERTAINTY**: Zero; hazard independence is physically rigorous.
- **REQUIRED TESTS**: `adversarial_invariants_test.py` multi-hazard arbitration suite.

### Change Proposal 2: Elimination of Brachycephaly Winter Penalty
- **CURRENT BEHAVIOR**: Speculatively penalized brachycephalic dogs in winter cold equations.
- **EVIDENCE**: Comprehensive veterinary audit found zero empirical studies establishing increased cold vulnerability in brachycephalic breeds.
- **PROPOSED BEHAVIOR**: Remove brachycephaly modifier from all winter algorithms. Confine brachycephalic sensitivity strictly to heat/humidity models.
- **WHY THIS IS SCIENTIFICALLY STRONGER**: Adheres to the core constraint: *"Never manufacture a numerical coefficient because the literature merely establishes a directional relationship"* and prevents fake precision.
- **USER-VISIBLE CONSEQUENCE**: Owners of French Bulldogs or Pugs receive guidance based on their actual physical mass and short coat, without an unsubstantiated "brachycephalic winter penalty."
- **FALSE-POSITIVE RISK**: Eliminates unjustified restrictive false alarms.
- **FALSE-NEGATIVE RISK**: Extremely low; mass and single coat already protect these dogs conservatively.
- **UNCERTAINTY**: Modest theoretical hypothesis regarding airway cooling, but zero clinical validation.
- **REQUIRED TESTS**: `test_brachycephaly_cold_neutrality`.

### Change Proposal 3: Replacement of Sidewalk Salt Inference with "Winter Chemical Exposure Evidence"
- **CURRENT BEHAVIOR**: Tentative logic attempted to infer sidewalk salting from freezing weather events.
- **EVIDENCE**: Municipal operations and private property maintenance data prove chemical application cannot be predicted from weather alone.
- **PROPOSED BEHAVIOR**: Transition chemical state to an asymmetric evidence model:
  - If direct observation/report exists $\rightarrow$ `chemical_confirmed`.
  - If no report exists $\rightarrow$ `treatment_data_unavailable`.
  - Weather creates contextual risk advisory: *"If walking on treated municipal sidewalks, chemical deicers may be present. Wipe paws upon returning."*
- **WHY THIS IS SCIENTIFICALLY STRONGER**: Honors the semantic invariant: *Unknown $\neq$ Safe, and weather compatible with salting $\neq$ evidence of a treated sidewalk.*
- **USER-VISIBLE CONSEQUENCE**: Transparent communication of what is known vs. unknown.
- **FALSE-POSITIVE RISK**: Prevents falsely claiming sidewalks are chemically treated when they are untreated dirt or snow trails.
- **FALSE-NEGATIVE RISK**: Prevented by maintaining universal post-walk paw wash advice when deicers are plausible.
- **UNCERTAINTY**: Fully transparent.
- **REQUIRED TESTS**: `test_unknown_chemical_treatment_semantics`.
