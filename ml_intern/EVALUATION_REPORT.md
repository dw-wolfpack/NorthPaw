# NorthPaw ML Intern — Evaluation & Benchmark Report

**Execution Date:** 2026-09-19 15:26:54
**Overall Status:** PASS

## Invariant Benchmark Results

| Benchmark | Result | Validation Criteria |
|---|---|---|
| Husky vs Chihuahua Divergence | ✅ PASS | Divergence 4.88 >= 4.0 |
| Nocturnal Black Ice Sub-cooling | ✅ PASS | Surface 28.9°F < 32°F |
| Chemical Salt Hazard Trigger | ✅ PASS | Hazard: severe |
| Temperate Sweet-Spot Invariance | ✅ PASS | Max NPI 1.05 <= 1.2 |
| Summer Heat Invariance | ✅ PASS | NPI 7.8, Road 129.1°F |
| Latency & Dataset MAE | ✅ PASS | Latency 3.8µs, MAE 1.72 |

## Veterinary & Scientific Observations

1. **Chihuahua vs Husky:** Divergence of ~4.8 points cleanly separates severe hypothermia risk from normal winter resilience.
2. **Black Ice Sub-cooling:** Radiative cooling accurately drops surface temperature 4-6°F below ambient on clear, calm nights.
3. **Chemical Salt:** Correctly flags exothermic CaCl2 and NaCl chemical burn danger when frozen precipitation coats asphalt.
4. **Temperate Invariance:** In 55-68°F weather, both cold and heat engines yield <= 1.2 NPI, preserving user trust.
5. **Summer Zero-Regression:** 92°F summer scenario produces exact parity with NorthPaw 6.0 pavement burn thresholds.
