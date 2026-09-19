"""
NorthPaw ML Intern — Dog Profile Generator
Generates a representative population of canine profiles based on the exact
NorthPaw schema in lib/profile.ts, app/onboarding.tsx, and clinical literature.
Includes:
- dogWeightLbs (4 to 140 lbs)
- dogCoatType ('Hairless', 'Single', 'Double')
- dogSnoutProfile ('flat', 'standard', 'long')
- dogAgeGroup ('puppy', 'young', 'adult', 'senior')
- dogActivityBaseline ('low', 'moderate', 'high')
- dogColor ('Light', 'Medium', 'Dark')
- dogBreed (Real-world breeds across morphology classes)
- intendedDurationMinutes (15, 30, 60 min walk durations)
"""

import json
import os

DOG_COHORTS = [
    # Toy & Small Breeds
    {
        "id": "chihuahua_standard",
        "breed": "Chihuahua",
        "weight_lbs": 6,
        "coat_type": "Single",
        "snout_profile": "standard",
        "age_group": "adult",
        "activity_baseline": "high",
        "color": "Light",
        "clinical_notes": "High A/V ratio, rapid convective heat loss."
    },
    {
        "id": "french_bulldog",
        "breed": "French Bulldog",
        "weight_lbs": 24,
        "coat_type": "Single",
        "snout_profile": "flat",
        "age_group": "adult",
        "activity_baseline": "moderate",
        "color": "Medium",
        "clinical_notes": "Brachycephalic obstructive airway syndrome (BOAS); extreme heat sensitivity."
    },
    {
        "id": "chinese_crested",
        "breed": "Chinese Crested",
        "weight_lbs": 10,
        "coat_type": "Hairless",
        "snout_profile": "standard",
        "age_group": "young",
        "activity_baseline": "moderate",
        "color": "Light",
        "clinical_notes": "Zero coat Clo insulation; immediate shivering in cold; sunburn risk in summer."
    },
    {
        "id": "pug_senior",
        "breed": "Pug",
        "weight_lbs": 18,
        "coat_type": "Double",
        "snout_profile": "flat",
        "age_group": "senior",
        "activity_baseline": "low",
        "color": "Light",
        "clinical_notes": "Flat snout + senior thermoregulatory impairment."
    },
    {
        "id": "dachshund_mini",
        "breed": "Miniature Dachshund",
        "weight_lbs": 11,
        "coat_type": "Single",
        "snout_profile": "long",
        "age_group": "young",
        "activity_baseline": "moderate",
        "color": "Dark",
        "clinical_notes": "Low ground clearance, belly close to snow/slush."
    },

    # Medium & Athletic Breeds
    {
        "id": "whippet_athletic",
        "breed": "Whippet",
        "weight_lbs": 30,
        "coat_type": "Single",
        "snout_profile": "long",
        "age_group": "young",
        "activity_baseline": "high",
        "color": "Light",
        "clinical_notes": "Extremely low body fat (<10%), thin single coat; high cold vulnerability."
    },
    {
        "id": "beagle_puppy",
        "breed": "Beagle",
        "weight_lbs": 16,
        "coat_type": "Single",
        "snout_profile": "standard",
        "age_group": "puppy",
        "activity_baseline": "high",
        "color": "Medium",
        "clinical_notes": "Immature thermoregulation and smaller body mass."
    },
    {
        "id": "australian_shepherd",
        "breed": "Australian Shepherd",
        "weight_lbs": 50,
        "coat_type": "Double",
        "snout_profile": "standard",
        "age_group": "adult",
        "activity_baseline": "high",
        "color": "Dark",
        "clinical_notes": "Dense insulating undercoat; resilient in cold, traps heat in summer."
    },

    # Large & Cold-Hardy Breeds
    {
        "id": "labrador_retriever",
        "breed": "Labrador Retriever",
        "weight_lbs": 68,
        "coat_type": "Double",
        "snout_profile": "standard",
        "age_group": "adult",
        "activity_baseline": "moderate",
        "color": "Dark",
        "clinical_notes": "Canonical medium-large baseline canine; water-resistant coat."
    },
    {
        "id": "siberian_husky",
        "breed": "Siberian Husky",
        "weight_lbs": 55,
        "coat_type": "Double",
        "snout_profile": "standard",
        "age_group": "young",
        "activity_baseline": "high",
        "color": "Medium",
        "clinical_notes": "Arctic breed; high Clo insulation; minimal cold stress down to sub-zero."
    },
    {
        "id": "golden_retriever_senior",
        "breed": "Golden Retriever",
        "weight_lbs": 72,
        "coat_type": "Double",
        "snout_profile": "standard",
        "age_group": "senior",
        "activity_baseline": "low",
        "color": "Light",
        "clinical_notes": "Arthritic joints vulnerable to slick ice; reduced metabolic heat production."
    },

    # Giant Breeds
    {
        "id": "great_dane",
        "breed": "Great Dane",
        "weight_lbs": 135,
        "coat_type": "Single",
        "snout_profile": "standard",
        "age_group": "adult",
        "activity_baseline": "low",
        "color": "Dark",
        "clinical_notes": "Low A/V ratio preserves core heat, but thin single coat loses skin heat."
    },
    {
        "id": "bernese_mountain_dog",
        "breed": "Bernese Mountain Dog",
        "weight_lbs": 105,
        "coat_type": "Double",
        "snout_profile": "standard",
        "age_group": "adult",
        "activity_baseline": "moderate",
        "color": "Dark",
        "clinical_notes": "Heavy double coat + giant mass; very high heat risk, very low cold risk."
    }
]

DURATION_PROFILES = [15, 30, 60]  # Planned walk duration in minutes

def generate_synthetic_profiles(output_path="ml_intern/data/dog_profiles.json"):
    expanded_profiles = []
    pid = 1
    for base in DOG_COHORTS:
        for dur in DURATION_PROFILES:
            profile = {
                "profile_id": f"{base['id']}_{dur}m",
                "dog_name": base["breed"].split()[0],
                "dog_breed": base["breed"],
                "dog_weight_lbs": base["weight_lbs"],
                "dog_coat_type": base["coat_type"],
                "dog_snout_profile": base["snout_profile"],
                "dog_age_group": base["age_group"],
                "dog_activity_baseline": base["activity_baseline"],
                "dog_color": base["color"],
                "intended_duration_minutes": dur,
                "clinical_notes": base["clinical_notes"]
            }
            expanded_profiles.append(profile)
            pid += 1

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump({
            "total_profiles": len(expanded_profiles),
            "base_cohorts_count": len(DOG_COHORTS),
            "duration_levels": DURATION_PROFILES,
            "profiles": expanded_profiles
        }, f, indent=2)

    print(f"Generated {len(expanded_profiles)} dog profiles across {len(DOG_COHORTS)} morphological cohorts -> {output_path}")

if __name__ == "__main__":
    generate_synthetic_profiles()
