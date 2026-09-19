"""
NorthPaw ML Intern — Biophysical Canine Cold Stress Model (CCSI)
Grounded in peer-reviewed veterinary literature & FHWA research.
Reference: "Winter Outdoor Risk for Dogs: Evidence, Public Data, and a Deterministic Local-First Model"
"""

import math
from typing import Dict, Any, Optional

def calculate_canine_ground_wind(wind_10m_mph: float, dog_height_m: float = 0.3) -> float:
    """
    Canine Ground-Level Wind Speed Correction.
    Translates standard 10m weather station wind to canine torso level (~0.3m).
    V_dog = V_10 * (z_dog / 10)^0.25 ~= 0.415 * V_10
    """
    if wind_10m_mph <= 0.0:
        return 0.0
    return wind_10m_mph * ((dog_height_m / 10.0) ** 0.25)

def calculate_canine_wind_chill(air_temp_f: float, v_dog_mph: float) -> float:
    """
    Canine Wind Chill Equivalent Temperature (T_wc).
    Calibrated for canine convective boundary layer.
    """
    if air_temp_f < 50.0 and v_dog_mph >= 3.0:
        wc = 35.74 + 0.6215 * air_temp_f - 35.75 * (v_dog_mph ** 0.16) + 0.4275 * air_temp_f * (v_dog_mph ** 0.16)
        return min(air_temp_f, wc)
    return air_temp_f

def calculate_base_cold_stress(t_wc_f: float) -> float:
    """
    Continuous Base Cold Stress S_base(T_wc) on a 0.0 - 10.0 scale.
    Tufts TACC veterinary anchor points:
      >= 50°F : 0.0 (Thermal neutral zone)
         45°F : 1.0 (Mild cool, no risk for healthy adult dogs)
         32°F : 2.8 (Freezing point of water, transition to moderate caution)
         20°F : 5.0 (Definite cold risk threshold)
          0°F : 7.5 (Severe danger, rapid hypothermia hazard)
        -15°F : 9.5 (Life-threatening deep freeze)
        < -20°F: 10.0 (Absolute ceiling)
    """
    if t_wc_f >= 50.0:
        return 0.0
    if t_wc_f >= 45.0:
        return (50.0 - t_wc_f) / 5.0 * 1.0
    if t_wc_f >= 32.0:
        return 1.0 + ((45.0 - t_wc_f) / 13.0) * 1.8
    if t_wc_f >= 20.0:
        return 2.8 + ((32.0 - t_wc_f) / 12.0) * 2.2
    if t_wc_f >= 0.0:
        return 5.0 + ((20.0 - t_wc_f) / 20.0) * 2.5
    if t_wc_f >= -15.0:
        return 7.5 + ((0.0 - t_wc_f) / 15.0) * 2.0
    deep_pen = (-15.0 - t_wc_f) * 0.1
    return min(10.0, 9.5 + deep_pen)

def compute_canine_cold_stress(
    air_temp_f: float,
    wind_speed_mph: float,
    humidity_pct: float = 50.0,
    precip_type: str = "none",
    profile: Optional[Dict[str, Any]] = None,
    intended_duration_minutes: Optional[int] = None
) -> Dict[str, Any]:
    """
    Evaluates cold exposure conditions and returns independent risk facts,
    provenance reasons, and confidence flags.
    Supports flexible positional arguments.
    """
    if isinstance(humidity_pct, str):
        # Passed as (temp, wind, precip_type, profile, [duration])
        actual_dur = intended_duration_minutes
        if isinstance(profile, (int, float)):
            actual_dur = int(profile)
        actual_profile = precip_type if isinstance(precip_type, dict) else (profile if isinstance(profile, dict) else {})
        precip_type = humidity_pct
        humidity_pct = 50.0
        profile = actual_profile
        intended_duration_minutes = actual_dur
    elif isinstance(humidity_pct, dict):
        # Passed as (temp, wind, profile)
        profile = humidity_pct
        humidity_pct = 50.0

    if profile is None:
        profile = {}

    v_dog = calculate_canine_ground_wind(wind_speed_mph)
    t_wc = calculate_canine_wind_chill(air_temp_f, v_dog)
    s_base = calculate_base_cold_stress(t_wc)

    # Duration handling (Research Paper Page 11: Hypothermia is time-dependent)
    dur = intended_duration_minutes if intended_duration_minutes is not None else profile.get("intended_duration_minutes")
    if dur is not None:
        if dur <= 15:
            f_dur = 0.85
            dur_label = f"{dur} min (brief relief)"
        elif dur <= 30:
            f_dur = 1.00
            dur_label = f"{dur} min (standard walk)"
        elif dur <= 45:
            f_dur = 1.15
            dur_label = f"{dur} min (moderate outing)"
        else:
            f_dur = 1.30
            dur_label = f"{dur} min (extended exposure)"
        dur_confidence = "high"
    else:
        f_dur = 1.00
        dur_label = "Instantaneous condition only (no duration specified)"
        dur_confidence = "moderate"

    if s_base <= 0.0:
        return {
            "condition": "normal",
            "risk_band": "normal",
            "ccsi": 0.0,
            "wind_chill_f": round(t_wc, 1),
            "ground_wind_mph": round(v_dog, 1),
            "is_wet_cold": False,
            "reasons": ["Temperature is within canine thermal-neutral comfort range (>= 50°F)."],
            "confidence": dur_confidence,
            "duration_context": dur_label
        }

    reasons = []

    # 1. Body Mass / Size (A/V ratio ~ M^-0.18)
    weight = profile.get("dog_weight_lbs") or profile.get("weight_lbs") or 45.0
    f_mass = max(0.75, min(1.35, (weight / 45.0) ** -0.18))
    if f_mass >= 1.20:
        reasons.append(f"Small body mass ({weight:.0f} lbs) has high surface-area-to-volume ratio, accelerating core cooling.")
    elif f_mass <= 0.85:
        reasons.append(f"Large body mass ({weight:.0f} lbs) provides substantial thermal inertia.")

    # 2. Coat Type & Insulation
    coat = profile.get("dog_coat_type") or profile.get("coat_type") or "Single"
    if coat == "Hairless":
        f_coat = 1.65
        reasons.append("Hairless skin lacks fur Clo boundary layer, causing immediate convective heat loss.")
    elif coat == "Single":
        f_coat = 1.25 if weight < 25 else 1.10
        reasons.append("Single coat provides modest dry insulation.")
    elif coat == "Double":
        f_coat = 0.60
        reasons.append("Dense double coat traps insulating air layer.")
    else:
        f_coat = 1.00

    # 3. Wet-Cold Escalation (Paper Page 6: Wet coat degrades fur Clo insulation)
    # CRITICAL RULE: Wetness overrides double coat advantage!
    f_wet = 1.00
    is_wet_cold = False
    if precip_type in ("cold_rain", "light_rain", "wet_snow", "freezing_rain"):
        is_wet_cold = True
        f_wet = 1.50
        if coat == "Double":
            f_coat = max(f_coat, 1.15)  # Trapped air layer is displaced by water
            reasons.append("Wet precipitation penetrates coat; water conducts heat ~25x faster than air, eliminating double coat benefit.")
        else:
            reasons.append("Wet precipitation soaks fur, dramatically accelerating conductive and evaporative heat loss.")

    # 4. Age Caution (Paper Page 5 & 10: Conservative one-direction flag)
    age_group = profile.get("dog_age_group") or profile.get("age_group")
    f_age = 1.00
    if age_group in ("puppy", "senior"):
        f_age = 1.15
        reasons.append(f"Age group ({age_group}) indicates potential vulnerability to cold stress.")

    raw_ccsi = s_base * f_mass * f_coat * f_wet * f_dur * f_age
    ccsi = round(max(0.0, min(10.0, raw_ccsi)), 2)

    # Condition category mapping matching paper Page 20
    if ccsi < 2.5:
        condition = "normal"
    elif ccsi < 5.0:
        condition = "cold_stress_conditions"
    else:
        condition = "elevated_vulnerability_conditions"

    return {
        "condition": condition,
        "risk_band": condition,
        "ccsi": ccsi,
        "wind_chill_f": round(t_wc, 1),
        "ground_wind_mph": round(v_dog, 1),
        "is_wet_cold": is_wet_cold,
        "duration_context": dur_label,
        "reasons": reasons,
        "confidence": dur_confidence,
        "multipliers": {
            "mass": round(f_mass, 3),
            "coat": round(f_coat, 3),
            "wet": round(f_wet, 3),
            "duration": round(f_dur, 3),
            "age": round(f_age, 3)
        }
    }

# Backward compatibility alias
compute_canine_cold_stress_index = compute_canine_cold_stress
