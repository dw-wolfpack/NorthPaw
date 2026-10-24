"""
NorthPaw ML Intern — Adversarial Property-Based Invariant Verification
Enforces the fundamental safety invariants defined in:
"Winter Outdoor Risk for Dogs: Evidence, Public Data, and a Deterministic Local-First Model"

Invariants Tested:
1. wet + same conditions cannot become safer
2. colder cannot improve cold-exposure state
3. windier cannot improve cold-exposure state
4. longer exposure cannot improve exposure state
5. double coat cannot erase wetness
6. unknown treatment data cannot become "no salt"
7. forecast-only refreeze cannot become "confirmed ice"
"""

import sys
import os
import random

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.biophysical_cold import compute_canine_cold_stress
from models.winter_surface import evaluate_ice_and_traction, evaluate_winter_chemical_deicer
from models.unified_engine import evaluate_unified_canine_conditions

PROFILES = [
    {"dog_name": "Chihuahua", "dog_weight_lbs": 6, "dog_coat_type": "Single", "dog_snout_profile": "standard", "dog_age_group": "adult"},
    {"dog_name": "Frenchie", "dog_weight_lbs": 24, "dog_coat_type": "Single", "dog_snout_profile": "flat", "dog_age_group": "adult"},
    {"dog_name": "Husky", "dog_weight_lbs": 55, "dog_coat_type": "Double", "dog_snout_profile": "standard", "dog_age_group": "adult"},
    {"dog_name": "Golden", "dog_weight_lbs": 68, "dog_coat_type": "Double", "dog_snout_profile": "standard", "dog_age_group": "senior"},
    {"dog_name": "GreatDane", "dog_weight_lbs": 130, "dog_coat_type": "Single", "dog_snout_profile": "standard", "dog_age_group": "adult"},
    {"dog_name": "Hairless", "dog_weight_lbs": 12, "dog_coat_type": "Hairless", "dog_snout_profile": "standard", "dog_age_group": "puppy"},
]

SEVERITY_ORDER = {
    "normal": 0,
    "mild_caution": 1,
    "cold_stress": 2,
    "cold_stress_conditions": 2,
    "elevated_vulnerability": 3,
    "elevated_vulnerability_conditions": 3,
}

def test_invariant_wet_never_safer():
    """Invariant 1: wet + same conditions cannot become safer"""
    violations = 0
    total = 0
    for p in PROFILES:
        for temp in [45.0, 35.0, 28.0, 15.0, 0.0]:
            for wind in [0.0, 5.0, 15.0, 25.0]:
                for dur in [15, 30, 60]:
                    dry = compute_canine_cold_stress(temp, wind, "none", p, dur)
                    wet = compute_canine_cold_stress(temp, wind, "cold_rain", p, dur)
                    total += 1
                    # Wet CCSI must be >= Dry CCSI
                    if wet["ccsi"] < dry["ccsi"]:
                        violations += 1
                    # Wet severity rank must be >= Dry severity rank
                    if SEVERITY_ORDER[wet["condition"]] < SEVERITY_ORDER[dry["condition"]]:
                        violations += 1
    return total, violations

def test_invariant_colder_never_improves():
    """Invariant 2: colder cannot improve cold-exposure state"""
    violations = 0
    total = 0
    for p in PROFILES:
        for wind in [0.0, 10.0, 20.0]:
            for precip in ["none", "wet_snow"]:
                for dur in [15, 30]:
                    prev_ccsi = -1.0
                    for temp in sorted([50.0, 42.0, 32.0, 20.0, 10.0, -5.0], reverse=True):
                        res = compute_canine_cold_stress(temp, wind, precip, p, dur)
                        total += 1
                        if prev_ccsi >= 0.0 and res["ccsi"] < prev_ccsi:
                            violations += 1
                        prev_ccsi = res["ccsi"]
    return total, violations

def test_invariant_windier_never_improves():
    """Invariant 3: windier cannot improve cold-exposure state"""
    violations = 0
    total = 0
    for p in PROFILES:
        for temp in [40.0, 30.0, 15.0, 0.0]:
            for precip in ["none", "cold_rain"]:
                prev_ccsi = -1.0
                for wind in [0.0, 5.0, 12.0, 25.0, 40.0]:
                    res = compute_canine_cold_stress(temp, wind, precip, p, 30)
                    total += 1
                    if prev_ccsi >= 0.0 and res["ccsi"] < prev_ccsi:
                        violations += 1
                    prev_ccsi = res["ccsi"]
    return total, violations

def test_invariant_longer_exposure_never_improves():
    """Invariant 4: longer exposure cannot improve exposure state"""
    violations = 0
    total = 0
    for p in PROFILES:
        for temp in [42.0, 28.0, 10.0]:
            for wind in [5.0, 15.0]:
                for precip in ["none", "cold_rain"]:
                    prev_ccsi = -1.0
                    for dur in [10, 15, 20, 30, 45, 60, 90]:
                        res = compute_canine_cold_stress(temp, wind, precip, p, dur)
                        total += 1
                        if prev_ccsi >= 0.0 and res["ccsi"] < prev_ccsi:
                            violations += 1
                        prev_ccsi = res["ccsi"]
    return total, violations

def test_invariant_double_coat_never_erases_wetness():
    """Invariant 5: double coat cannot erase wetness"""
    violations = 0
    total = 0
    husky = next(p for p in PROFILES if p["dog_coat_type"] == "Double")
    for temp in [38.0, 32.0, 25.0, 10.0]:
        for wind in [0.0, 10.0, 20.0]:
            dry = compute_canine_cold_stress(temp, wind, "none", husky, 30)
            wet = compute_canine_cold_stress(temp, wind, "cold_rain", husky, 30)
            total += 1
            # Double coat in wet conditions must escalate significantly compared to dry
            if not wet["is_wet_cold"]:
                violations += 1
            if wet["ccsi"] <= dry["ccsi"]:
                violations += 1
    return total, violations

def test_invariant_unknown_treatment_never_becomes_no_salt():
    """Invariant 6: unknown treatment data cannot become 'no salt'"""
    violations = 0
    total = 0
    for surf in ["asphalt", "concrete"]:
        chem = evaluate_winter_chemical_deicer(direct_telemetry_applied=False, surface_type=surf)
        total += 1
        if chem["status"] != "treatment_data_unavailable":
            violations += 1
        if chem["hazard_level"] == "safe":
            violations += 1
    return total, violations

def test_invariant_forecast_only_never_confirmed_ice():
    """Invariant 7: forecast-only refreeze cannot become 'confirmed ice'"""
    violations = 0
    total = 0
    # Ambient below freezing with melt/refreeze proxy, but NO direct road sensor
    ice = evaluate_ice_and_traction(air_temp_f=28.0, precip_type="none", surface_wet=False, recent_melt_refreeze=True, rwis_sensor_state=None)
    total += 1
    # Must be 'refreeze_possible' (moderate confidence), NOT 'measured_ice'
    if ice["ice_state"] == "measured_ice" or ice["confidence"] == "high":
        violations += 1

    # Ambient dry below freezing with NO sensor and NO melt
    ice_dry = evaluate_ice_and_traction(air_temp_f=25.0, precip_type="none", surface_wet=False, recent_melt_refreeze=False, rwis_sensor_state=None)
    total += 1
    if ice_dry["ice_state"] != "unknown_or_low_evidence" or ice_dry["is_hazard"] is not False:
        violations += 1

    return total, violations

def run_adversarial_suite():
    print("=" * 75)
    print("NORTHPAW ADVERSARIAL PROPERTY INVARIANTS TEST SUITE")
    print("Enforcing Deterministic Safety Properties Grounded in Peer-Reviewed Research")
    print("=" * 75)

    tests = [
        ("1. Wet + same conditions cannot become safer", test_invariant_wet_never_safer),
        ("2. Colder cannot improve cold-exposure state", test_invariant_colder_never_improves),
        ("3. Windier cannot improve cold-exposure state", test_invariant_windier_never_improves),
        ("4. Longer exposure cannot improve exposure state", test_invariant_longer_exposure_never_improves),
        ("5. Double coat cannot erase wetness", test_invariant_double_coat_never_erases_wetness),
        ("6. Unknown treatment data cannot become 'no salt'", test_invariant_unknown_treatment_never_becomes_no_salt),
        ("7. Forecast-only refreeze cannot become 'confirmed ice'", test_invariant_forecast_only_never_confirmed_ice),
    ]

    all_passed = True
    for name, fn in tests:
        total, violations = fn()
        status = "PASSED" if violations == 0 else f"FAILED ({violations} violations)"
        if violations > 0:
            all_passed = False
        print(f"  [{'PASS' if violations == 0 else 'FAIL'}] {name:<60} ({total:,} scenarios checked)")

    print("=" * 75)
    if all_passed:
        print("ALL 7 CORE MATHEMATICAL & EPISTEMIC SAFETY INVARIANTS SATISFIED (0 VIOLATIONS)")
    else:
        print("FAILURES DETECTED IN ADVERSARIAL INVARIANTS")
    print("=" * 75)
    return all_passed

if __name__ == "__main__":
    success = run_adversarial_suite()
    sys.exit(0 if success else 1)
