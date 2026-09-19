"""
NorthPaw ML Intern — Rich Multi-Hazard Dataset Generator
Synthesizes comprehensive environmental conditions and canine profiles
grounded in the peer-reviewed research paper:
"Winter Outdoor Risk for Dogs: Evidence, Public Data, and a Deterministic Local-First Model"
Generates independent condition labels across:
1. Cold exposure & hypothermia
2. Wet-cold coat degradation
3. Ice & traction hazard hierarchy
4. Solar visibility & darkness
5. Chemical de-icer evidence hierarchy
6. Summer heat & pavement burn (for unified year-round evaluation)
"""

import json
import itertools
import os
import math

# Load the 39 canine profiles
PROFILES_PATH = "ml_intern/data/dog_profiles.json"

AIR_TEMP_SAMPLES = [
    -15.0, -5.0, 5.0, 15.0, 22.0, 28.0, 31.0, 33.0, 36.0, 42.0, 48.0, 55.0,
    62.0, 70.0, 78.0, 85.0, 92.0, 100.0
]

WIND_SPEEDS = [0.0, 4.0, 12.0, 24.0]
HUMIDITIES = [25.0, 50.0, 80.0]
PRECIP_CONDITIONS = [
    {"type": "none", "chance": 0},
    {"type": "light_rain", "chance": 60},
    {"type": "cold_rain", "chance": 90},
    {"type": "wet_snow", "chance": 85},
    {"type": "powder_snow", "chance": 75},
    {"type": "freezing_rain", "chance": 80}
]

DAYTIME_OPTIONS = [True, False]
SURFACES = ["asphalt", "concrete", "turf"]

def determine_ice_evidence(air_temp_f, precip_type, surface_wet, rwis_sensor_state, recent_melt_refreeze):
    """
    Evidence hierarchy from research paper (Page 19-21):
    1. observed_road_state == ICY -> MEASURED_HIGH
    2. observed_freezing_rain -> HIGH_CONFIDENCE_AREA_HAZARD
    3. pavement_temp <= 0°C and surface_wet -> HIGH_CONFIDENCE_AT_SENSOR
    4. recent_liquid_precip and air crossed >0°C to <=0°C -> REFREEZE_POSSIBLE
    5. else -> UNKNOWN_OR_LOW_EVIDENCE (Never rendered as 'no ice')
    """
    if rwis_sensor_state == "ICY":
        return "MEASURED_HIGH", "Direct RWIS pavement sensor reports icy surface"
    if precip_type == "freezing_rain":
        return "HIGH_CONFIDENCE_AREA_HAZARD", "Active freezing rain glazes untreated surfaces"
    if air_temp_f <= 31.0 and surface_wet:
        return "HIGH_CONFIDENCE_AT_SENSOR", "Wet pavement in sub-freezing air creates contact ice"
    if recent_melt_refreeze and air_temp_f <= 32.0:
        return "REFREEZE_POSSIBLE", "Recent liquid runoff refreezing as temperatures dropped below 32°F"
    return "UNKNOWN_OR_LOW_EVIDENCE", "No road sensor or active ice event; surface ice status unmeasured"

def calculate_research_cold_risk(air_temp_f, wind_mph, precip_type, profile):
    """
    Deterministic biophysical cold risk (0.0 to 10.0 scale)
    matching allometric scaling and coat morphology from research review.
    """
    v_dog = wind_mph * ((0.3 / 10.0) ** 0.25)  # ~0.415 * wind
    if air_temp_f < 50.0 and v_dog >= 3.0:
        wc = 35.74 + 0.6215 * air_temp_f - 35.75 * (v_dog ** 0.16) + 0.4275 * air_temp_f * (v_dog ** 0.16)
        wc = min(air_temp_f, wc)
    else:
        wc = air_temp_f

    # Base stress curve
    if wc >= 50.0:
        base = 0.0
    elif wc >= 45.0:
        base = (50.0 - wc) / 5.0 * 1.0
    elif wc >= 32.0:
        base = 1.0 + ((45.0 - wc) / 13.0) * 1.8
    elif wc >= 20.0:
        base = 2.8 + ((32.0 - wc) / 12.0) * 2.2
    elif wc >= 0.0:
        base = 5.0 + ((20.0 - wc) / 20.0) * 2.5
    else:
        base = min(10.0, 7.5 + ((0.0 - wc) / 20.0) * 2.5)

    if base <= 0.0:
        return 0.0, wc, "normal"

    # Allometric mass factor (A/V ratio ~ M^-0.18)
    weight = profile.get("dog_weight_lbs", 45)
    f_mass = max(0.75, min(1.35, (weight / 45.0) ** -0.18))

    # Coat factor
    coat = profile.get("dog_coat_type", "Single")
    if coat == "Hairless":
        f_coat = 1.60
    elif coat == "Single":
        f_coat = 1.25 if weight < 20 else 1.10
    elif coat == "Double":
        f_coat = 0.60
    else:
        f_coat = 1.00

    # Wetness degradation (Page 6 & 10: water dramatically increases heat transfer)
    # Wet coat overrides double coat advantage!
    if precip_type in ("cold_rain", "light_rain", "wet_snow"):
        f_wet = 1.50
        if coat == "Double":
            f_coat = max(f_coat, 1.15)  # Double coat loses trapped air insulation when soaked
    elif precip_type == "freezing_rain":
        f_wet = 1.65
        f_coat = max(f_coat, 1.25)
    else:
        f_wet = 1.00

    # Duration factor (Page 11: Hypothermia/frostbite inherently time-dependent)
    dur = profile.get("intended_duration_minutes", 30)
    if dur <= 15:
        f_dur = 0.85  # Brief relief outing
    elif dur >= 60:
        f_dur = 1.25  # Extended exposure
    else:
        f_dur = 1.00

    # Age caution
    age_group = profile.get("dog_age_group", "adult")
    f_age = 1.15 if age_group in ("puppy", "senior") else 1.00

    total_risk = base * f_mass * f_coat * f_wet * f_dur * f_age
    total_risk = round(max(0.0, min(10.0, total_risk)), 2)

    if total_risk < 2.5:
        band = "normal"
    elif total_risk < 5.0:
        band = "cold_stress_conditions"
    else:
        band = "elevated_vulnerability_conditions"

    return total_risk, round(wc, 1), band

def generate_rich_dataset(output_path="ml_intern/data/rich_simulation_dataset.json"):
    if not os.path.exists(PROFILES_PATH):
        raise FileNotFoundError(f"Missing {PROFILES_PATH}. Run synthetic_profiles.py first.")

    with open(PROFILES_PATH, "r") as f:
        profiles_data = json.load(f)
    dog_profiles = profiles_data["profiles"]

    scenarios = []
    scenario_id = 1

    for temp_f, wind_mph, humidity, precip, is_day, surface in itertools.product(
        AIR_TEMP_SAMPLES, WIND_SPEEDS, HUMIDITIES, PRECIP_CONDITIONS, DAYTIME_OPTIONS, SURFACES
    ):
        p_type = precip["type"]

        # Physics consistency filters
        if temp_f < 26.0 and p_type in ("light_rain", "cold_rain"):
            continue
        if temp_f > 38.0 and p_type in ("wet_snow", "powder_snow", "freezing_rain"):
            continue
        if not is_day and p_type == "powder_snow" and temp_f > 32.0:
            continue

        surface_wet = p_type != "none"
        recent_melt = (temp_f <= 32.0 and p_type == "none" and humidity >= 70.0)

        # RWIS sensor presence (simulated 15% coverage in cold weather)
        rwis_state = "ICY" if (temp_f <= 28.0 and surface_wet and surface == "asphalt") else "NONE"

        ice_state, ice_reason = determine_ice_evidence(temp_f, p_type, surface_wet, rwis_state, recent_melt)

        # Chemical de-icer: strictly measured or unavailable (Page 16)
        if rwis_state == "ICY" and surface in ("asphalt", "concrete"):
            chem_status = "treatment_telemetry_applied"
        else:
            chem_status = "treatment_data_unavailable"

        # Solar & Visibility
        sky_cover = 90.0 if p_type != "none" else 20.0
        vis_miles = 1.5 if p_type in ("wet_snow", "powder_snow", "freezing_rain") else 10.0

        for dog in dog_profiles:
            cold_npi, wc_f, cold_band = calculate_research_cold_risk(temp_f, wind_mph, p_type, dog)

            # Summer heat risk mirror (for year-round supremum)
            if is_day and temp_f >= 60.0:
                solar_load = (100.0 - sky_cover) / 100.0 * 8.0
                chsi = (temp_f * 0.8) + (humidity * (temp_f - 14.0) / 100.0) + 20.0
                base_heat = max(0.0, (chsi - 89.0) / 10.8) + (solar_load * 0.35)
                snout_mult = 1.25 if dog.get("dog_snout_profile") == "flat" else 1.00
                coat_heat_mult = 1.10 if dog.get("dog_coat_type") == "Double" else 1.00
                heat_npi = round(min(10.0, base_heat * snout_mult * coat_heat_mult), 2)
            else:
                heat_npi = 0.0

            # Independent risk collection (Page 23)
            # overall_state = most_severe_supported(cold, wet_cold, ice_traction, visibility, chemical_if_measured)
            dominant = "cold" if cold_npi >= heat_npi else "heat"
            unified_score = max(cold_npi, heat_npi)

            # Active critical flags
            active_flags = []
            if p_type != "none" and cold_npi >= 3.0:
                active_flags.append("wet_cold_escalation")
            if ice_state in ("MEASURED_HIGH", "HIGH_CONFIDENCE_AREA_HAZARD", "HIGH_CONFIDENCE_AT_SENSOR"):
                active_flags.append("severe_ice_hazard")
            elif ice_state == "REFREEZE_POSSIBLE":
                active_flags.append("refreeze_caution")
            if not is_day:
                active_flags.append("darkness_visibility_hazard")
            if vis_miles < 3.0:
                active_flags.append("reduced_atmospheric_visibility")
            if dog.get("dog_snout_profile") == "flat" and heat_npi >= 4.0:
                active_flags.append("brachycephalic_heat_risk")

            scenario = {
                "id": scenario_id,
                "environment": {
                    "air_temp_f": temp_f,
                    "wind_speed_mph": wind_mph,
                    "wind_chill_f": wc_f,
                    "humidity_pct": humidity,
                    "precip_type": p_type,
                    "surface_wet": surface_wet,
                    "surface_type": surface,
                    "is_daytime": is_day,
                    "sky_cover_pct": sky_cover,
                    "visibility_miles": vis_miles,
                    "rwis_state": rwis_state
                },
                "dog_profile": dog,
                "evaluations": {
                    "cold_npi": cold_npi,
                    "cold_band": cold_band,
                    "heat_npi": heat_npi,
                    "unified_npi": unified_score,
                    "dominant_stress": dominant,
                    "ice_evidence": {
                        "state": ice_state,
                        "reason": ice_reason
                    },
                    "chemical_status": chem_status,
                    "active_flags": active_flags
                }
            }
            scenarios.append(scenario)
            scenario_id += 1

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump({
            "total_scenarios": len(scenarios),
            "dog_cohorts_evaluated": len(dog_profiles),
            "samples": scenarios
        }, f, indent=2)

    print(f"Generated {len(scenarios)} rich scenarios across {len(dog_profiles)} dog profiles -> {output_path}")

if __name__ == "__main__":
    generate_rich_dataset()
