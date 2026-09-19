"""
NorthPaw ML Intern — Biophysical Canine Summer & Heat Stress Model (Ground Truth)
Implements respiratory evaporative thermodynamics (Dalton vapor pressure deficit),
solar shortwave irradiance absorption by coat albedo, and brachycephalic airway mechanics.
Reference: documentation/summer/01_CANINE_SUMMER_BIOPHYSICS_AND_HEAT_BALANCE.md
           documentation/summer/02_SUMMER_ALGORITHM_AUDIT_AND_COMPARISON_SPEC.md
"""

import math
from typing import Dict, Any, Optional

def calculate_saturation_vapor_pressure_kpa(temp_c: float) -> float:
    """
    Magnus-Tetens formula for saturation water vapor pressure in kPa.
    e_s(T) = 0.61078 * exp((17.27 * T) / (T + 237.3))
    """
    return 0.61078 * math.exp((17.27 * temp_c) / (temp_c + 237.3))

def calculate_vapor_pressure_deficit_kpa(air_temp_f: float, humidity_pct: float) -> float:
    """
    Calculates the canine respiratory evaporative driving potential:
    VPD = e_s(T_mucosa) - e_a(ambient)
    Where T_mucosa is canine core/mucosal temperature (~39.0°C / 102.2°F).
    """
    temp_c = (air_temp_f - 32.0) * 5.0 / 9.0
    canine_core_c = 39.0
    e_s_mucosa = calculate_saturation_vapor_pressure_kpa(canine_core_c)  # ~7.0 kPa

    e_s_ambient = calculate_saturation_vapor_pressure_kpa(temp_c)
    e_a_ambient = e_s_ambient * (max(5.0, min(100.0, humidity_pct)) / 100.0)

    vpd = e_s_mucosa - e_a_ambient
    return max(0.1, vpd)

def compute_biophysical_heat_stress(
    air_temp_f: float,
    humidity_pct: float,
    solar_intensity: float = 0.0,  # 0.0 - 10.0 (or GHI / 100)
    wind_speed_mph: float = 5.0,
    surface_type: str = "asphalt",
    profile: Optional[Dict[str, Any]] = None,
    intended_duration_minutes: Optional[int] = None
) -> Dict[str, Any]:
    """
    Computes rigorous biophysical canine heat stress based on energy accumulation:
    Q_net = M_act + R_solar + C_conv - E_panting
    """
    if profile is None:
        profile = {}

    weight = profile.get("dog_weight_lbs") or profile.get("weight_lbs") or 50.0
    coat = profile.get("dog_coat_type") or profile.get("coat_type") or "Single"
    snout = profile.get("dog_snout_profile") or profile.get("snout_profile") or "standard"
    color = profile.get("dog_color") or profile.get("color") or "Medium"
    age = profile.get("dog_age_group") or profile.get("age_group") or "adult"
    activity = profile.get("dog_activity_baseline") or profile.get("activity_baseline") or "moderate"

    dur = intended_duration_minutes if intended_duration_minutes is not None else profile.get("intended_duration_minutes", 30)

    # 1. Thermal Neutral Anchor
    # Below 60°F, canines do not experience heat stress during standard walking
    if air_temp_f <= 58.0:
        return {
            "biophysical_npi": 0.0,
            "risk_band": "safe",
            "vpd_kpa": round(calculate_vapor_pressure_deficit_kpa(air_temp_f, humidity_pct), 2),
            "reasons": ["Air temperature is below heat accumulation threshold."],
            "limiting_factors": []
        }

    # 2. Vapor Pressure Deficit & Panting Cooling Ceiling
    vpd = calculate_vapor_pressure_deficit_kpa(air_temp_f, humidity_pct)
    # Baseline VPD at 70°F, 40% RH is ~5.8 kPa. At 90°F, 80% RH, VPD drops to ~3.0 kPa.
    # Evaporative resistance factor: lower VPD = less cooling capacity
    evap_resistance = max(1.0, 5.8 / vpd)

    # 3. Base Environmental Temperature Pressure
    # Sigmoidal thermal onset between 60°F and 95°F
    temp_pressure = max(0.0, (air_temp_f - 60.0) / 7.0)

    # 4. Solar Radiation Absorption by Fur Albedo
    # Dark coat absorbs ~90%, Medium ~75%, Light ~55%
    albedo_map = {"Dark": 0.90, "Medium": 0.75, "Light": 0.55}
    solar_absorption = albedo_map.get(color, 0.75)
    solar_load = solar_intensity * 0.38 * solar_absorption

    # 5. Craniofacial Airway Resistance (BOAS)
    # Brachycephalic dogs suffer non-linear airway collapse in humid heat!
    if snout == "flat":
        # Flat snout + high humidity is clinically catastrophic
        humidity_penalty = 1.0 + max(0.0, (humidity_pct - 50.0) / 50.0) * 0.40
        snout_mult = 1.35 * humidity_penalty  # Up to 1.75x in high humidity
    elif snout == "long":
        snout_mult = 0.92
    else:
        snout_mult = 1.00

    # 6. Coat Insulation
    # In heat, dense double coats trap muscular heat
    if coat == "Double":
        coat_mult = 1.15
    elif coat == "Hairless":
        coat_mult = 1.05  # Direct cutaneous solar absorption
    else:
        coat_mult = 1.00

    # 7. Mass & Activity Scaling
    activity_mult = 1.15 if activity == "high" else (0.92 if activity == "low" else 1.00)
    age_mult = 1.12 if age in ("puppy", "senior") else 1.00

    # 8. Exposure Duration Escalation
    dur_mult = 1.0 + max(-0.25, min(0.40, (dur - 30) / 50.0))

    # Composite Biophysical Heat Stress Score
    raw_stress = (temp_pressure * evap_resistance * 0.45 + solar_load) * snout_mult * coat_mult * activity_mult * age_mult * dur_mult
    biophysical_npi = round(max(0.0, min(10.0, raw_stress)), 2)

    # Band mapping
    if biophysical_npi < 3.0:
        band = "safe"
    elif biophysical_npi <= 5.0:
        band = "warm"
    elif biophysical_npi <= 7.5:
        band = "hot"
    else:
        band = "danger"

    reasons = []
    if snout == "flat" and air_temp_f >= 75.0:
        reasons.append("Brachycephalic airway reduces panting evaporative cooling by up to 50%.")
    if color == "Dark" and solar_intensity >= 5.0:
        reasons.append("Dark coat absorbs high shortwave solar radiation, elevating cutaneous heat gain.")
    if humidity_pct >= 70.0 and air_temp_f >= 78.0:
        reasons.append("High atmospheric humidity restricts respiratory moisture evaporation.")
    if coat == "Double" and air_temp_f >= 80.0:
        reasons.append("Dense undercoat traps metabolic heat produced by muscular movement.")

    return {
        "biophysical_npi": biophysical_npi,
        "risk_band": band,
        "vpd_kpa": round(vpd, 2),
        "evap_resistance": round(evap_resistance, 2),
        "solar_absorption": solar_absorption,
        "multipliers": {
            "snout": round(snout_mult, 2),
            "coat": round(coat_mult, 2),
            "color": solar_absorption,
            "duration": round(dur_mult, 2)
        },
        "reasons": reasons
    }
