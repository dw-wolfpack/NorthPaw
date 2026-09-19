"""
NorthPaw ML Intern — Unified Year-Round Decision Engine
Implements the multi-component independent condition architecture from:
"Winter Outdoor Risk for Dogs: Evidence, Public Data, and a Deterministic Local-First Model"
(Pages 20-24)
"""

from typing import Dict, Any, Optional, List
from .biophysical_cold import compute_canine_cold_stress
from .winter_surface import evaluate_ice_and_traction, evaluate_winter_chemical_deicer
from .road_temp_heat import compute_canine_heat_stress_index, estimate_road_temp_f

def evaluate_visibility_and_daylight(
    is_daytime: bool,
    visibility_miles: float = 10.0,
    dog_color: str = "Medium"
) -> Dict[str, Any]:
    """
    Evaluates environmental visibility and darkness (Paper Page 9, 21).
    Local solar calculation (daylight vs twilight/darkness) + visibility observations.
    """
    state = "daylight" if is_daytime else "darkness"
    reasons = []

    if not is_daytime:
        reasons.append("Nighttime conditions reduce driver and pedestrian visibility.")
        if dog_color == "Dark":
            reasons.append("Dark fur blends into nocturnal surroundings; reflective collar or LED light recommended.")

    if visibility_miles < 1.0:
        vis_band = "visibility_severely_reduced"
        reasons.append(f"Fog or blowing snow has reduced horizontal visibility to {visibility_miles:.1f} miles.")
    elif visibility_miles < 3.0:
        vis_band = "visibility_reduced"
        reasons.append(f"Precipitation or haze reduces horizontal visibility to {visibility_miles:.1f} miles.")
    else:
        vis_band = "visibility_clear"

    return {
        "solar_state": state,
        "visibility_band": vis_band,
        "visibility_miles": visibility_miles,
        "is_reduced": (not is_daytime) or (visibility_miles < 3.0),
        "reasons": reasons
    }

def evaluate_unified_canine_conditions(
    air_temp_f: float,
    wind_speed_mph: float,
    humidity_pct: float = 50.0,
    precip_type: str = "none",
    surface_type: str = "asphalt",
    surface_wet: bool = False,
    recent_melt_refreeze: bool = False,
    is_daytime: bool = True,
    sky_cover_pct: float = 0.0,
    solar_intensity: float = 0.0,
    visibility_miles: float = 10.0,
    rwis_sensor_state: Optional[str] = None,
    rwis_pavement_temp_f: Optional[float] = None,
    direct_deicer_applied: bool = False,
    profile: Optional[Dict[str, Any]] = None,
    intended_duration_minutes: Optional[int] = None
) -> Dict[str, Any]:
    """
    Evaluates all 6 independent condition families:
    1. Cold Exposure Conditions
    2. Wet-Cold Escalation
    3. Ice / Traction Hazard
    4. Visibility & Darkness
    5. Chemical De-icer Exposure
    6. Summer Heat & Pavement Stress
    And arbitrates the overall outdoor state via supremum:
    overall_state = most_severe_supported(...) + critical_unknowns + reasons.
    """
    if profile is None:
        profile = {
            "dog_name": "Dog",
            "dog_weight_lbs": 50,
            "dog_coat_type": "Single",
            "dog_snout_profile": "standard",
            "dog_age_group": "adult",
            "dog_activity_baseline": "moderate",
            "dog_color": "Medium"
        }

    # 1. Cold Exposure Conditions
    cold_res = compute_canine_cold_stress(
        air_temp_f=air_temp_f,
        wind_speed_mph=wind_speed_mph,
        precip_type=precip_type,
        profile=profile,
        intended_duration_minutes=intended_duration_minutes
    )

    # 2. Ice & Traction
    ice_res = evaluate_ice_and_traction(
        air_temp_f=air_temp_f,
        precip_type=precip_type,
        surface_wet=surface_wet,
        recent_melt_refreeze=recent_melt_refreeze,
        rwis_sensor_state=rwis_sensor_state,
        rwis_pavement_temp_f=rwis_pavement_temp_f
    )

    # 3. Chemical De-icer Exposure
    chem_res = evaluate_winter_chemical_deicer(
        direct_telemetry_applied=direct_deicer_applied,
        surface_type=surface_type
    )

    # 4. Visibility & Darkness
    vis_res = evaluate_visibility_and_daylight(
        is_daytime=is_daytime,
        visibility_miles=visibility_miles,
        dog_color=profile.get("dog_color", "Medium")
    )

    # 5. Summer Heat & Pavement Stress (for continuous year-round parity)
    heat_res = compute_canine_heat_stress_index(
        air_temp_f=air_temp_f,
        humidity_pct=humidity_pct,
        sky_cover_pct=sky_cover_pct,
        solar_intensity=solar_intensity,
        profile=profile
    )
    road_temp_f = estimate_road_temp_f(
        air_temp_f=air_temp_f,
        solar_intensity=solar_intensity,
        wind_speed_mph=wind_speed_mph,
        surface_type=surface_type,
        is_daytime=is_daytime
    )

    # 6. Overall State Arbitration (Supremum of supported hazards)
    cold_npi = cold_res["ccsi"]
    heat_npi = heat_res["npi_heat"]

    # Thermal supremum
    if cold_npi >= heat_npi:
        dominant_stress = "cold"
        base_npi = cold_npi
    else:
        dominant_stress = "heat"
        base_npi = heat_npi

    # Pavement burn override
    if dominant_stress == "heat" and road_temp_f >= 125.0:
        base_npi = max(base_npi, 7.8)

    # Ice traction override (falls on ice present significant orthopedic hazard)
    if ice_res["is_hazard"]:
        base_npi = max(base_npi, 5.5)

    npi = round(min(10.0, max(0.0, base_npi)), 2)

    # Collect all supported reasons
    all_reasons = []
    all_reasons.extend(cold_res["reasons"])
    if ice_res["is_hazard"]:
        all_reasons.append(ice_res["reason"])
    if vis_res["is_reduced"]:
        all_reasons.extend(vis_res["reasons"])
    if heat_npi >= 4.0:
        all_reasons.append(f"Summer heat index is elevated ({heat_res['chsi']:.0f} CHSI).")
    if road_temp_f >= 125.0:
        all_reasons.append(f"Surface temperature ({road_temp_f:.1f}°F) exceeds JAMA paw burn threshold (125°F).")

    # Critical Unknowns (Paper Page 23: Never convert unknown to safe)
    critical_unknowns = []
    if chem_res["status"] == "treatment_data_unavailable" and air_temp_f <= 34.0:
        critical_unknowns.append("Sidewalk de-icing salt application status is unmeasured.")
    if ice_res["ice_state"] == "unknown_or_low_evidence" and air_temp_f <= 36.0:
        critical_unknowns.append("Micro-local ice/refreeze status on walking path is unmeasured.")

    # Canonical Band
    if dominant_stress == "cold":
        if npi >= 7.5:
            band = "elevated_vulnerability"
        elif npi >= 4.0:
            band = "cold_stress"
        elif npi >= 2.0:
            band = "mild_caution"
        else:
            band = "normal"
    else:
        if npi >= 7.6:
            band = "danger"
        elif npi >= 5.1:
            band = "hot"
        elif npi >= 3.1:
            band = "warm"
        else:
            band = "safe"

    # Actionable Advisories
    advisories = []
    if dominant_stress == "cold":
        if cold_res["is_wet_cold"]:
            advisories.append("Precipitation compromises coat insulation: dry dog thoroughly immediately after outing.")
        if cold_res["condition"] == "elevated_vulnerability_conditions":
            advisories.append("Equip insulated winter coat and restrict outdoor duration.")
        if ice_res["is_hazard"]:
            advisories.append("Slick surface conditions: watch footing and avoid icy inclines.")
        if vis_res["solar_state"] == "darkness":
            advisories.append("Carry flashlight or attach LED beacon to collar.")
    else:
        if road_temp_f >= 125.0:
            advisories.append("Walk strictly on shaded grass; asphalt causes blister burns within 60s.")
        elif road_temp_f >= 105.0:
            advisories.append("Touch pavement for 7 seconds to confirm comfort.")
        if profile.get("dog_snout_profile") == "flat" and npi >= 4.0:
            advisories.append("Brachycephalic breed: monitor closely for panting and airway distress.")

    return {
        "npi": npi,
        "dominant_stress": dominant_stress,
        "overall_band": band,
        "cold_conditions": cold_res,
        "ice_traction": ice_res,
        "chemical_exposure": chem_res,
        "visibility": vis_res,
        "heat_stress": heat_res,
        "surface_temp_f": road_temp_f if dominant_stress == "heat" else air_temp_f,
        "unified_band": band,
        "npi_cold": cold_npi,
        "npi_heat": heat_npi,
        "wind_chill_f": cold_res["wind_chill_f"],
        "reasons": all_reasons,
        "critical_unknowns": critical_unknowns,
        "advisories": advisories
    }

# Backward compatibility alias
evaluate_unified_canine_risk = evaluate_unified_canine_conditions
