# NorthPaw Rejected Evidence & Downgraded Claims

This catalog explicitly records all candidate claims, published models, formulas, and folk assumptions that were **rejected or downgraded** during the NorthPaw Winter Evidence Audit.

In accordance with NorthPaw's core principles:
- **Permission to remove**: If an assumption cannot be defended scientifically, it is eliminated rather than retained for false comfort.
- **Falsification stance**: We actively attempted to falsify every NorthPaw winter assumption.
- **Epistemic restraint**: Never manufacture a numerical coefficient because the literature merely establishes a directional relationship.

---

## 1. Rejected Universal Frostbite Timers (<20°F / 15-Minute Countdown)
- **Proposed Claim**: At temperatures below $20^\circ\text{F}$ (or $-6.7^\circ\text{C}$), companion dogs experience frostbite after 15 to 30 minutes of exposure.
- **Source of Claim**: Commercial pet blogs, veterinary marketing infographics, and popular consumer pet apps.
- **Audited Literature**:
  - Hurley, Roberts, & Entin (1954) [B]: Measured canine hindpaw freezing at $-2.5^\circ\text{C}\text{ to }-3.0^\circ\text{C}$ in a cryogenic refrigerant bath ($-15^\circ\text{C}\text{ to }-25^\circ\text{C}$) under surgical pentobarbital anesthesia with zero limb movement.
  - Henshaw (1972) [B]: Measured Arctic wolves standing on refrigerated metal plates down to $-30^\circ\text{C}$ with countercurrent arteriovenous heat exchange maintaining pad temperatures at $+1^\circ\text{C}\text{ to }+3^\circ\text{C}$.
- **Why It Was Rejected**:
  1. *Complete lack of environmental validity*: Anesthetized dogs immersed in cryogenic liquid baths lack sympathetic vasomotor tone, shivering thermogenesis, muscular blood pumping, and behavioral withdrawal.
  2. *Huge phenotypic variance*: A 120 lb Alaskan Malamute trotting on dry snow has radically different distal extremity perfusion than a 6 lb Chihuahua standing motionless on wet slush.
  3. *Fake precision*: Presenting a countdown timer (e.g. *"Frostbite in 18 minutes"*) creates a dangerous illusion of safety before minute 18, and induces unwarranted panic afterward.
- **Action Taken**: **Rejected and banned from production**. NorthPaw will never display a numerical frostbite countdown timer. Guidance is limited to behavioral symptom alerts (paw lifting, shivering, reluctance to walk) and physical mitigation (boots, dry towel).

---

## 2. Rejected Arctic Wolf Microvascular Extrapolation to Urban Companion Dogs
- **Proposed Claim**: Canines possess specialized footpad arteriovenous anastomoses that prevent frostbite down to $-30^\circ\text{C}$ ($-22^\circ\text{F}$); therefore, companion dogs' paws are naturally protected from freezing.
- **Source of Claim**: Misinterpretation of Henshaw et al. (1972), *Science*.
- **Audited Literature**:
  - Henshaw et al. (1972) [B]: Studied wild Arctic wolves (*Canis lupus*) and working sled dogs adapted to the Alaskan interior.
  - Sled Dog Veterinary Study (1996) [A]: Sled dogs running in wet conditions still suffered severe interdigital abrasion, fissures, and local hypothermic skin breakdown.
- **Why It Was Rejected**:
  1. *Subspecies and breed divergence*: Companion breeds (e.g. French Bulldogs, Poodles, Greyhounds) have not undergone selective pressure for extreme sub-zero footpad lipid composition (unsaturated, low-melting-point fatty acids) or massive distal countercurrent shunt density.
  2. *Conductive surface differences*: Chilled aluminum plates in a dry chamber differ fundamentally from salt-treated concrete, wet slush, and sharp crusty ice.
  3. *High false-negative risk*: Assuming companion dogs share wolf footpad cryo-resistance leads to severe frostbite, pad cracking, and chemical burns.
- **Action Taken**: **Rejected as a general canine assumption**. Domestic companion dogs are assumed to have vulnerable, unadapted footpads requiring physical barrier protection in extreme cold, wet slush, or chemically treated areas.

---

## 3. Rejected Weather-Derived Sidewalk Salting Inferences
- **Proposed Claim**: If ambient temperature drops below $32^\circ\text{F}$ ($0^\circ\text{C}$) following rain or snow, the algorithm can infer that sidewalks are chemically treated with salt/deicers.
- **Source of Claim**: Earlier heuristic concept attempting to estimate chemical exposure without user or agency input.
- **Audited Literature**:
  - Municipal Department of Public Works snow and ice operational standards; Salt Institute maintenance records.
- **Why It Was Rejected**:
  1. *Weather $\neq$ Treatment*: Weather conditions create the *need* for deicing, but whether a specific sidewalk is salted depends on municipal budgets, private homeowner behavior, storeowner negligence, or eco-friendly sand alternatives.
  2. *Semantic violation*: Violates the core NorthPaw invariant: **Unknown $\neq$ Safe**, and **Weather compatible with salting $\neq$ Evidence of a treated sidewalk**.
  3. *Uncontrollable error rates*: Falsely alarms owners on untreated wilderness trails or rural dirt roads, while creating false security on private commercial walkways salted before a storm.
- **Action Taken**: **Rejected and replaced with Asymmetric Evidence semantics**:
  - `chemical_confirmed`: Only when verified by user report or direct municipal agency data.
  - `treatment_data_unavailable`: Default state when unmeasured.
  - Safe user-facing prompt: *"If walking on treated sidewalks, wipe paws upon returning."*

---

## 4. Rejected Breed Identity as an Independent Predictive Multiplier
- **Proposed Claim**: Calculate cold risk using a lookup table of 300+ dog breeds, each assigned a specific cold tolerance coefficient.
- **Source of Claim**: Legacy pet app architectures and canine breed encyclopedias.
- **Audited Literature**:
  - Norwegian Scientific Committee for Food and Environment (VKM Report 2017) [A]: Systematic study of working sled dogs showing that within the *single breed label* "Alaskan Husky," Lower Critical Temperature varied from $-25^\circ\text{C}$ to $+5^\circ\text{C}$ due to individual coat density and pointer outcrossing.
  - Sugano (1981) [A]: Coat insulation and body mass completely explained heat balance differences in mixed-breed dogs.
- **Why It Was Rejected**:
  1. *Phenotype dominates pedigree*: A 60 lb short-coated pit bull and a 60 lb double-coated Siberian Husky have diametrically opposite cold tolerances, despite having similar masses. Conversely, a purebred Labrador and a Lab-mix with identical coat and mass have identical thermal physics.
  2. *Fake precision*: Assigning a "7.2" to a Boxer and a "6.8" to a Beagle is mathematically unsupportable.
- **Action Taken**: **Rejected breed-based multipliers**. NorthPaw models cold exposure strictly on observable physical phenotypes: **Body Mass** (coarse allometric tiers), **Coat Type** (single/short vs. double/dense), and **Age** (puppy flag). Breed identity changes holding phenotype constant produce identical outputs.

---

## 5. Rejected Brachycephaly Cold Vulnerability Penalty
- **Proposed Claim**: Brachycephalic breeds (Pugs, French Bulldogs, Bulldogs) should receive an automated cold vulnerability penalty in winter because of their shortened muzzles.
- **Source of Claim**: Intuitive folk assumption that shortened nasal passages cannot adequately warm freezing air before it reaches the lungs.
- **Audited Literature**:
  - Extensive veterinary respiratory literature on Brachycephalic Obstructive Airway Syndrome (BOAS).
- **Why It Was Rejected**:
  1. *Zero clinical or empirical validation*: BOAS literature overwhelmingly demonstrates failure of *evaporative cooling* in hot, humid environments due to upper airway obstruction. No published veterinary study demonstrates increased cold-induced bronchoconstriction, hypothermia, or pulmonary frostbite in brachycephalic dogs compared to mesocephalic dogs of similar mass and coat.
  2. *Confounding by phenotype*: French Bulldogs are indeed cold-vulnerable, but this is entirely explained by their **small body mass (<28 lbs)** and **thin single coat with sparse abdominal hair**. Adding a redundant brachycephalic cold penalty double-penalizes the dog without scientific justification.
- **Action Taken**: **Completely removed from winter algorithms**. Brachycephaly is retained exclusively as a heat/humidity vulnerability factor.

---

## 6. Rejected Fur Color / Melanin Albedo Winter Adjustment
- **Proposed Claim**: Dark-furred dogs absorb more solar radiation and should be rated as safer in cold weather than white or light-furred dogs.
- **Source of Claim**: Basic solar radiation physics (albedo).
- **Audited Literature**:
  - Walsberg (1983) and comparative mammalian thermal radiation literature.
- **Why It Was Rejected**:
  1. *Convective stripping*: Solar radiation is absorbed at the outer tips of the hair shaft. In windy winter environments, convective airflow strips this surface heat before it can conduct inward through the trapped boundary layer to the dermis.
  2. *Low winter insolation*: In northern winter latitudes where cold exposure is severe, solar zenith angles are low, day lengths are short, and cloud/overcast cover is high, reducing incident solar flux to $< 150\text{ W/m}^2$.
  3. *Unsupportable complexity*: Adding a fur color selector creates user friction for a physically negligible effect.
- **Action Taken**: **Rejected and banned from winter production**. Fur color has zero effect on NorthPaw winter decisions.

---

## 7. Rejected Continuous Clo Decimal Modeling
- **Proposed Claim**: Assign precise decimal clo values (e.g. `clo = 0.85` vs `clo = 1.42`) and solve continuous differential heat transfer equations for companion dogs.
- **Source of Claim**: Theoretical engineering models of heat transfer.
- **Audited Literature**:
  - Sugano (1981) [A], Arkin et al. (1991) [D], VKM Report (2017) [A].
- **Why It Was Rejected**:
  1. *Unobservable inputs*: True fur clo depends on undercoat density, hair length, subcutaneous adiposity, wind compression of the pelt, and moisture saturation—none of which can be measured via a smartphone app.
  2. *Manufactured precision*: Solving $q = (T_{\text{core}} - T_{\text{ambient}}) / R_{\text{tot}}$ using guessed clo values produces numbers that look scientific but have massive error bars ($\pm 300\%$).
- **Action Taken**: **Rejected continuous clo math**. Replaced with conservative, deterministic categorical tiers (`single_short`, `double_dense`, `hairless`) that trigger discrete, auditable safety thresholds.

---

## 8. Rejected Unified Continuous Scalar ($NPI_{\text{cold}}$)
- **Proposed Claim**: Combine cold, wind, ice, and salt into a single continuous number from 0 to 100 ($NPI_{\text{cold}}$) and output $NPI_{\text{unified}} = \max(NPI_{\text{heat}}, NPI_{\text{cold}})$.
- **Source of Claim**: Early unified architecture draft.
- **Audited Literature**:
  - Li et al. (2025) [A], Schick et al. (1987) [A], ISDVMA (1996) [A].
- **Why It Was Rejected**:
  1. *Pathophysiological incompatibility*: Cold is a systemic metabolic heat deficit. Ice is an acute orthopedic shear/slip risk. Deicer is an acute chemical dermal/ingestion toxic hazard. Averaging or scalarizing them obscures the primary hazard and confuses the required user action.
  2. *False-negative risk*: A dog owner looking at a low scalar number might assume everything is safe, ignoring slick black ice or caustic deicers.
- **Action Taken**: **Rejected continuous scalar $NPI_{\text{cold}}$**. Replaced with deterministic **Multi-Hazard Precedence Arbitration**, where independent condition components output explicit, actionable guidance based on the highest active risk.
