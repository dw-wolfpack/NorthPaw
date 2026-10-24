# 04 — Unified Year-Round Decision Engine Specification

> **Architectural Blueprint for Merging Summer Heat & Winter Cold into a Single Engine**  
> *Target: System Design, Type Definitions & State Machines*

---

## 1. System Architecture: Independent Multi-Hazard State Arbitration

Rather than forcing complex winter and summer hazards into a single pseudo-physical continuous scalar, NorthPaw evaluates **independent condition families** and arbitrates the overall state using deterministic precedence:

$$\text{Overall State} = \text{arbitrate}\left(\text{HeatStress}, \; \text{SurfaceHeat}, \; \text{ColdExposure}, \; \text{WetCold}, \; \text{IceTraction}, \; \text{Visibility}, \; \text{ChemicalExposure}\right)$$

```
                                      ENVIRONMENTAL TELEMETRY
                   (Air Temp, Wind Speed, Solar Radiation, Humidity, Precip, Surface Moisture)
                                                 │
      ┌──────────────────┬───────────────────────┼───────────────────────┬──────────────────┐
      ▼                  ▼                       ▼                       ▼                  ▼
 HEAT STRESS       SURFACE HEAT            COLD EXPOSURE             ICE / TRACTION     CHEMICAL EXPOSURE
 • CHSI index      • Asphalt/Turf model    • Ground Wind Chill       • Sensor ICY       • Direct Agency
 • BOAS penalty    • Direct sunlight       • Tufts TACC Categories   • Freezing Rain      Telemetry Only
 • Humidity limit  • Blister burn (>=125)  • Wet-Cold Escalation     • Refreeze Proxy   • Unmeasured = Unknown
      │                  │                       │                       │                  │
      └──────────────────┴───────────────────────┼───────────────────────┴──────────────────┘
                                                 ▼
                                   MULTI-COMPONENT ARBITRATION
                            overall_state = max_severity(supported_hazards)
                            primary_hazard = most_consequential_factor
                            reasons = [supported_evidence]
                            critical_unknowns = [unmeasured_factors]
                                                 │
                                                 ▼
                                     CANONICAL USER DECISION
                              Ready (Green)  |  Caution (Amber)  |  Hazard (Red)
```

### Deterministic Safety Invariants (Verified by Adversarial Testing)
1. **Wet-Cold Invariant:** $\text{wet} + \text{same conditions} \implies \text{risk cannot decrease}$.
2. **Temperature Monotonicity:** $\text{colder conditions} \implies \text{cold exposure state cannot improve}$.
3. **Wind Monotonicity:** $\text{windier conditions} \implies \text{cold exposure state cannot improve}$.
4. **Duration Monotonicity:** $\text{longer planned duration} \implies \text{exposure state cannot improve}$.
5. **Coat Non-Cancellation:** A double coat reduces dry convective loss, but **must never erase wet-precipitation penalties**.
6. **Epistemic Salt Restraint:** Unknown treatment telemetry $\implies$ `treatment_data_unavailable`, **never "no salt"**.
7. **Ice Truth Hierarchy:** Forecast-derived refreeze $\implies$ `refreeze_possible` (moderate confidence), **never "confirmed ice"**.

---

## 2. Surface Hazard Modeling: Asymmetric Physical Truth

Winter surface hazards and summer thermal flux are biophysically asymmetric and must not be forced into artificial symmetric temperature bands:

### Summer Surface Model: Conductive Thermal Energy Flux
In summer, solar radiation drives high pavement temperatures that can cause direct epidermal thermal necrosis:
- $\ge 125^\circ\text{F}$ ($51.7^\circ\text{C}$): Rapid epidermal burn risk within 60 seconds (Crimson).
- $100^\circ\text{F} - 124.9^\circ\text{F}$: Pavement hot to canine paw pads; requires grass diversion (Orange).
- $77^\circ\text{F} - 99.9^\circ\text{F}$: Warm surface; monitored for dark-coated or sensitive dogs (Amber).

### Winter Surface Model: Evidence-Ranked Traction & Freeze States
In winter, surfaces are modeled around **physical state transitions (freezing, moisture, compaction, chemical treatment)** rather than manufactured paw frostbite thresholds:

| Condition Rank | Evidence Level | State Label | Clinical / Practical Reality |
|---|---|---|---|
| **1. Direct Pavement Sensor** | Measured (High Confidence) | `measured_ice` | RWIS sensor confirms frozen road/sidewalk surface. |
| **2. Active Freezing Rain** | Derived High | `high_confidence_area_hazard` | Liquid precipitation freezing on sub-32°F surfaces creates glazed ice. |
| **3. Cold Wet Pavement** | Measured Inputs | `high_confidence_at_sensor` | Pavement temp $\le 32^\circ\text{F}$ with moisture present. |
| **4. Melt / Refreeze Proxy** | Derived Moderate | `refreeze_possible` | Recent melting followed by sub-freezing air; shaded/untreated surfaces may be slick. |
| **5. Unmeasured Baseline** | Low Evidence | `unknown_or_low_evidence` | No direct sensor; micro-local ice status is reported as **unmeasured** (Rule 1: Unknown never becomes safe). |
---

## 3. Advisor Copy State Machine

The hero advisor message dynamically reflects the active hazard driver:

```typescript
export function deriveActiveAdvisor(params: {
  npi: number;
  heatScore: number;
  coldScore: number;
  roadTempF: number;
  windChillF: number;
  isDeicerActive: boolean;
  snoutType: string;
  coatType: string;
}): { advisor: string; subtext: string; category: 'heat' | 'cold' | 'safe' } {
  // 1. Safe conditions
  if (params.npi < 3.5) {
    return {
      advisor: "Good to go right now.",
      subtext: "Conditions are comfortable for outdoor activity.",
      category: 'safe'
    };
  }

  // 2. Heat Dominant
  if (params.heatScore >= params.coldScore) {
    if (params.roadTempF >= 125) {
      return {
        advisor: "Dangerous pavement heat.",
        subtext: "Second-degree burns occur in <60 seconds. Stick to grass or shade.",
        category: 'heat'
      };
    }
    if (params.roadTempF >= 105) {
      return {
        advisor: "Hot road surfaces.",
        subtext: "Paw pads at risk of blistering. Check temperature with hand test.",
        category: 'heat'
      };
    }
    if (params.snoutType === 'flat') {
      return {
        advisor: "Elevated respiratory heat stress.",
        subtext: "Flat-faced breeds struggle to pant. Keep walk short and hydrated.",
        category: 'heat'
      };
    }
    return {
      advisor: "Warm outdoor conditions.",
      subtext: "Monitor your dog closely for heavy panting.",
      category: 'heat'
    };
  }

  // 3. Cold Dominant
  if (params.isDeicerActive) {
    return {
      advisor: "Chemical road salt hazard.",
      subtext: "Caustic de-icers irritate and burn pads. Use booties or wipe paws post-walk.",
      category: 'cold'
    };
  }
  if (params.windChillF <= 15) {
    return {
      advisor: "Severe wind chill & frostbite risk.",
      subtext: "Keep outings strictly under 10–15 minutes for potty relief.",
      category: 'cold'
    };
  }
  if (params.coatType === 'Short' || params.coatType === 'hair') {
    return {
      advisor: "Chilly conditions for thin coat.",
      subtext: "Rapid convective body heat loss. Consider an insulated dog jacket.",
      category: 'cold'
    };
  }
  return {
    advisor: "Freezing outdoor temperatures.",
    subtext: "Check paws periodically for ice balls between toes.",
    category: 'cold'
  };
}
```
