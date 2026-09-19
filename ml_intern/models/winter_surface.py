"""
NorthPaw ML Intern — Surface Traction, Ice & De-icer Module
Implements evidence-ranked ice/refreeze logic and conservative chemical de-icer detection
grounded in the peer-reviewed research paper:
"Winter Outdoor Risk for Dogs: Evidence, Public Data, and a Deterministic Local-First Model"
(Pages 16-23)
"""

from typing import Dict, Any, Optional

def evaluate_ice_and_traction(
    air_temp_f: float,
    precip_type: str = "none",
    surface_wet: bool = False,
    recent_melt_refreeze: bool = False,
    rwis_sensor_state: Optional[str] = None,
    rwis_pavement_temp_f: Optional[float] = None
) -> Dict[str, Any]:
    """
    Evaluates surface ice and traction risk following strict evidence hierarchy:
    1. observed_road_state == ICY -> MEASURED_HIGH
    2. observed_freezing_rain -> HIGH_CONFIDENCE_AREA_HAZARD
    3. pavement_temp <= 32°F and surface_wet -> HIGH_CONFIDENCE_AT_SENSOR
    4. recent_liquid_precip and air crossed >32°F to <=32°F -> REFREEZE_POSSIBLE (moderate confidence)
    5. else -> UNKNOWN_OR_LOW_EVIDENCE (Never rendered as 'no ice'!)
    """
    # 1. Direct sensor measurement outranks all proxies
    if rwis_sensor_state == "ICY":
        return {
            "ice_state": "measured_ice",
            "epistemic_class": "measured",
            "confidence": "high",
            "is_hazard": True,
            "reason": "Direct RWIS pavement sensor reports icy surface condition."
        }

    # 2. Active freezing rain creates high-confidence regional ice
    if precip_type == "freezing_rain":
        return {
            "ice_state": "high_confidence_area_hazard",
            "epistemic_class": "derived_high",
            "confidence": "high",
            "is_hazard": True,
            "reason": "Active freezing rain creates hazardous glazed ice on outdoor walking surfaces."
        }

    # 3. Direct pavement temperature sensor in freezing range with wet surface
    if rwis_pavement_temp_f is not None and rwis_pavement_temp_f <= 32.0 and surface_wet:
        return {
            "ice_state": "high_confidence_at_sensor",
            "epistemic_class": "measured_inputs_derived_condition",
            "confidence": "high",
            "is_hazard": True,
            "reason": f"Pavement sensor reports freezing temperature ({rwis_pavement_temp_f:.1f}°F) with moisture present."
        }

    # 4. Refreeze proxy: liquid water/melt followed by sub-freezing air
    if recent_melt_refreeze and air_temp_f <= 32.0:
        return {
            "ice_state": "refreeze_possible",
            "epistemic_class": "derived_moderate",
            "confidence": "moderate",
            "is_hazard": True,
            "reason": "Recent moisture or melting followed by sub-freezing air creates refreeze risk in shaded or untreated areas."
        }

    # 5. Unknown or low evidence
    # RULE 1: Unknown never becomes safe!
    return {
        "ice_state": "unknown_or_low_evidence",
        "epistemic_class": "not_reliably_knowable",
        "confidence": "low",
        "is_hazard": False,
        "reason": "No direct road sensor or active ice event; micro-local surface ice status unmeasured."
    }

def evaluate_winter_chemical_deicer(
    direct_telemetry_applied: bool = False,
    direct_chemical_sensor_pct: Optional[float] = None,
    surface_type: str = "asphalt"
) -> Dict[str, Any]:
    """
    Evaluates winter chemical de-icer exposure (Page 16 & 21).
    STRICT RULE: Only direct agency application telemetry or sensor measurements
    can produce a confirmed chemical status. Weather-based proxies are rejected.
    """
    if surface_type not in ("asphalt", "concrete"):
        return {
            "status": "not_applicable",
            "hazard_level": "none",
            "reason": f"Surface type ({surface_type}) is typically unpaved or non-salted."
        }

    if direct_chemical_sensor_pct is not None and direct_chemical_sensor_pct > 0.0:
        return {
            "status": "treatment_confirmed",
            "hazard_level": "high",
            "epistemic_class": "measured",
            "reason": "Direct pavement chemical sensor detected de-icing salts/brine on walking surface."
        }

    if direct_telemetry_applied:
        return {
            "status": "treatment_confirmed",
            "hazard_level": "moderate_to_high",
            "epistemic_class": "measured",
            "reason": "Municipal DOT spreader telemetry recorded recent chemical treatment on this segment."
        }

    # Mandatory default: treatment data unavailable
    return {
        "status": "treatment_data_unavailable",
        "hazard_level": "unknown",
        "epistemic_class": "not_reliably_knowable",
        "reason": "No direct municipal de-icer telemetry is available for this sidewalk segment. Treatment status unknown."
    }

def estimate_winter_surface_temp_f(
    air_temp_f: float,
    sky_cover_pct: float = 0.0,
    wind_speed_mph: float = 0.0,
    surface_type: str = "asphalt",
    precip_type: str = "none",
    is_daytime: bool = True,
    solar_ghi: float = 0.0
) -> Dict[str, Any]:
    """
    Backward-compatible nocturnal radiative sub-cooling estimator.
    """
    sub_cooling = 0.0
    black_ice_risk = False
    if not is_daytime:
        clear_factor = max(0.0, (100.0 - sky_cover_pct) / 100.0)
        calm_factor = max(0.2, 1.0 - (wind_speed_mph / 25.0))
        sub_cooling = 5.5 * clear_factor * calm_factor
        surf_temp = air_temp_f - sub_cooling
        if 28.0 <= air_temp_f <= 36.0 and surf_temp <= 31.5:
            black_ice_risk = True
    else:
        surf_temp = air_temp_f

    return {
        "surface_temp_f": round(surf_temp, 1),
        "sub_cooling_delta": round(sub_cooling, 1),
        "black_ice_risk": black_ice_risk,
        "ice_state": "black_ice" if black_ice_risk else "normal"
    }

def evaluate_chemical_salt_hazard(
    air_temp_f: float,
    surface_temp_f: float,
    precip_type: str,
    surface_type: str
) -> Dict[str, Any]:
    """
    Backward-compatible salt hazard estimator.
    """
    is_freezing = air_temp_f <= 32.0 or surface_temp_f <= 32.0
    has_frozen_precip = precip_type in ("snow", "wet_snow", "freezing_rain")
    if is_freezing and has_frozen_precip:
        return {
            "salt_hazard_level": "severe",
            "salt_burn_risk": True,
            "protection_recommendation": "booties_or_wax_mandatory"
        }
    return {
        "salt_hazard_level": "none",
        "salt_burn_risk": False,
        "protection_recommendation": "none"
    }
