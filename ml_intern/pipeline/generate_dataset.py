#!/usr/bin/env python3
"""
NorthPaw ML Intern — Dataset Simulation Pipeline
Generates synthetic multi-dimensional atmospheric & biological vectors
for cold and heat stress model training and evaluation.
"""

import json
import itertools
import os

PROFILES = [
    {
        "id": "pico_chihuahua",
        "name": "Pico",
        "breed": "Chihuahua",
        "weight_lbs": 6,
        "coat_type": "Short_Thin",
        "snout_type": "standard",
        "age_years": 3,
        "size_class": "toy"
    },
    {
        "id": "kodiak_husky",
        "name": "Kodiak",
        "breed": "Siberian Husky",
        "weight_lbs": 55,
        "coat_type": "Double",
        "snout_type": "standard",
        "age_years": 4,
        "size_class": "medium_large"
    },
    {
        "id": "pierre_frenchie",
        "name": "Pierre",
        "breed": "French Bulldog",
        "weight_lbs": 24,
        "coat_type": "Short_Thin",
        "snout_type": "flat",
        "age_years": 5,
        "size_class": "small"
    },
    {
        "id": "duke_great_dane",
        "name": "Duke",
        "breed": "Great Dane",
        "weight_lbs": 135,
        "coat_type": "Short_Thin",
        "snout_type": "standard",
        "age_years": 4,
        "size_class": "giant"
    },
    {
        "id": "bailey_senior_golden",
        "name": "Bailey",
        "breed": "Golden Retriever",
        "weight_lbs": 70,
        "coat_type": "Standard_Single",
        "snout_type": "standard",
        "age_years": 11,
        "size_class": "medium_large"
    },
    {
        "id": "cooper_standard_lab",
        "name": "Cooper",
        "breed": "Labrador Retriever",
        "weight_lbs": 68,
        "coat_type": "Standard_Single",
        "snout_type": "standard",
        "age_years": 3,
        "size_class": "medium_large"
    }
]

TEMP_GRID = [
    -20.0, -10.0, -5.0, 0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 32.0, 35.0,
    40.0, 45.0, 50.0, 55.0, 60.0, 65.0, 70.0, 75.0, 80.0, 85.0, 90.0, 95.0, 100.0
]

WIND_GRID = [0.0, 5.0, 12.0, 20.0, 32.0]
HUMIDITY_GRID = [20.0, 45.0, 70.0, 85.0]
PRECIP_TYPES = ["none", "rain", "snow", "freezing_rain"]
SURFACES = ["asphalt", "concrete", "turf"]

def calculate_ground_truth_tacc(air_temp_f, wind_mph, profile):
    """
    Standard veterinary Tufts TACC classification (1 to 5).
    """
    # Wind chill proxy
    v_dog = 0.415 * wind_mph
    if air_temp_f < 50.0 and v_dog >= 3.0:
        wc = 35.74 + 0.6215 * air_temp_f - 35.75 * (v_dog ** 0.16) + 0.4275 * air_temp_f * (v_dog ** 0.16)
    else:
        wc = air_temp_f

    # TACC baseline thresholds
    if wc >= 45.0:
        base_cat = 1
    elif wc >= 32.0:
        base_cat = 2
    elif wc >= 20.0:
        base_cat = 3
    elif wc >= 0.0:
        base_cat = 4
    else:
        base_cat = 5

    # Modifiers: Small dogs and thin coats shift risk up by 1 category
    shift = 0
    if profile["size_class"] == "toy" or profile["coat_type"] == "Short_Thin":
        shift += 1
    if profile["coat_type"] == "Double" and base_cat > 1:
        shift -= 1
    if profile["age_years"] >= 9:
        shift += 0.5

    final_cat = max(1, min(5, base_cat + shift))
    return round(wc, 1), final_cat

def generate_dataset(output_path="ml_intern/data/simulation_dataset.json"):
    samples = []
    sample_id = 1

    for temp_f, wind_mph, humidity, precip, surface in itertools.product(
        TEMP_GRID, WIND_GRID, HUMIDITY_GRID, PRECIP_TYPES, SURFACES
    ):
        # Filter realistic combinations (no rain at sub-zero)
        if temp_f < 28.0 and precip == "rain":
            continue
        if temp_f > 40.0 and precip in ("snow", "freezing_rain"):
            continue

        for profile in PROFILES:
            wc, tacc_cat = calculate_ground_truth_tacc(temp_f, wind_mph, profile)
            sample = {
                "id": sample_id,
                "air_temp_f": temp_f,
                "wind_speed_mph": wind_mph,
                "wind_chill_f": wc,
                "humidity_pct": humidity,
                "precip_type": precip,
                "surface_type": surface,
                "profile": profile,
                "ground_truth_tacc_category": tacc_cat
            }
            samples.append(sample)
            sample_id += 1

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump({
            "total_samples": len(samples),
            "generated_profiles_count": len(PROFILES),
            "samples": samples
        }, f, indent=2)

    print(f"Generated {len(samples)} simulation scenarios across {len(PROFILES)} dog profiles -> {output_path}")

if __name__ == "__main__":
    generate_dataset()
