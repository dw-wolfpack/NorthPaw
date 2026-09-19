"""
NorthPaw ML Intern — Summer Heat & Pavement Model Mirror
Implements NorthPaw 6.0 production algorithms for CHSI (Canine Heat Stress Index),
solar radiation absorption, and pavement surface temperature.
Reference: documentation/NPI_ALGORITHM_GUIDE.md
           lib/weather/roadTemp.ts
"""

import math

def calculate_ambient_scale(air_temp_f: float) -> float:
    """
    Adjusts solar heating efficiency based on air temperature (convective cooling).
    AmbientScale = Math.max(0.4, Math.min(1.0, ((AirTemp - 40) / 45) * 0.6 + 0.4))
    At 85°F+: 1.0. At 40°F: 0.4.
    """
    scaled = ((air_temp_f - 40.0) / 45.0) * 0.6 + 0.4
    return max(0.4, min(1.0, scaled))

def estimate_road_temp_f(
    air_temp_f: float,
    solar_intensity: float,  # 0.0 - 10.0
    wind_speed_mph: float,
    surface_type: str = "asphalt",
    is_daytime: bool = True
) -> float:
    """
    Estimates road/surface temperature in °F.
    RoadTemp = AirTemp + (SolarIntensity * 5.1 * AmbientScale * SurfaceMultiplier) - (WindSpeed * 0.75)
    """
    if not is_daytime:
        offset = -3.0 if surface_type == "asphalt" else -1.0
        return air_temp_f + offset

    surface_multipliers = {
        "asphalt": 1.0,
        "concrete": 0.72,
        "cobblestone": 0.85,
        "sand": 1.15,
        "turf": 1.38
    }
    surf_mult = surface_multipliers.get(surface_type, 1.0)
    amb_scale = calculate_ambient_scale(air_temp_f)

    solar_heating = solar_intensity * 5.1 * amb_scale * surf_mult
    wind_cooling = max(0.0, wind_speed_mph) * 0.75
    road_temp = air_temp_f + solar_heating - wind_cooling
    return round(road_temp, 1)

def compute_canine_heat_stress_index(
    air_temp_f: float,
    humidity_pct: float,
    sky_cover_pct: float,
    solar_intensity: float,
    profile: dict
) -> dict:
    """
    Computes Canine Heat Stress Index (CHSI) and summer NPI risk score (0.0 - 10.0).
    """
    # 1. CHSI
    chsi = (air_temp_f * 0.8) + (humidity_pct * (air_temp_f - 14.0) / 100.0) + 20.0

    # 2. Solar Load
    amb_scale = calculate_ambient_scale(air_temp_f)
    solar_load = ((100.0 - sky_cover_pct) / 100.0) * solar_intensity * amb_scale

    # 3. Base Risk
    base_risk = max(0.0, (chsi - 89.0) / 10.8) + (solar_load * 0.35)

    # 4. Multipliers
    snout_mult = 1.15 if profile.get("snout_type") == "flat" else 1.00
    # In heat, heavy coats trap heat
    coat_mult = 1.10 if profile.get("coat_type") in ("Double", "Arctic_Double", "Dense_Undercoat") else 1.00
    activity_penalty = 1.0 if profile.get("activity_level") == "high" else 0.0

    raw_npi = (base_risk * snout_mult * coat_mult) + activity_penalty
    npi = max(0.0, min(10.0, raw_npi))

    # Road band mapping
    if npi < 3.0:
        band = "safe"
    elif npi <= 5.0:
        band = "warm"
    elif npi <= 7.5:
        band = "hot"
    else:
        band = "danger"

    return {
        "npi_heat": round(npi, 2),
        "chsi": round(chsi, 1),
        "solar_load": round(solar_load, 2),
        "base_risk": round(base_risk, 2),
        "risk_band": band
    }
