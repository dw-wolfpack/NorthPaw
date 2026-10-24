# NorthPaw Mixpanel User Base Analysis: iOS vs. Android
*Generated: September 27, 2026 | Source: Mixpanel Live Data Export API*

---

## 1. Executive Summary

NorthPaw's active user base was extracted directly from the Mixpanel Export API (`https://data.mixpanel.com/api/2.0/export`) covering the entire project history through September 27, 2026.

| Metric | Overall | iOS | Android | Desktop / Web / Other |
| :--- | :--- | :--- | :--- | :--- |
| **Total Unique Users** | **353** (100%) | **315** (89.24%) | **26** (7.37%) | **12** (3.40%) |
| **Mobile-Only User Share** | **341** (100%) | **315** (**92.38%**) | **26** (**7.62%**) | — |
| **Total Events Tracked** | **36,573** | **35,398** (96.79%) | **1,159** (3.17%) | **16** (0.04%) |
| **Average Events / User** | **103.6** | **112.4** | **44.6** | **1.3** |
| **Active in Last 7 Days (WAU)** | **37** (10.5%) | **37** (11.7%) | **0** (0.0%) | **0** (0.0%) |
| **Active in Last 30 Days (MAU)** | **91** (25.8%) | **87** (27.6%) | **4** (15.4%) | **0** (0.0%) |
| **Active in Last 90 Days** | **275** (77.9%) | **243** (77.1%) | **26** (100.0%) | **6** (50.0%) |

---

## 2. Onboarding & Conversion Funnel (iOS vs. Android)

Comparing user progress through the core activation funnel:

```
[Onboarding Started] ───────► [Onboarding Completed] ───────► [Dog Created]
     iOS: 289 (91.7%)              iOS: 203 (70.2%)              iOS: 203 (64.4%)
 Android:  22 (84.6%)          Android:  13 (59.1%)          Android:  13 (50.0%)
```

| Funnel Step | iOS (315 users) | Android (26 users) | Comparison & Insights |
| :--- | :--- | :--- | :--- |
| **Onboarding Started** | 289 users (91.7%) | 22 users (84.6%) | Both platforms initiate onboarding at high rates upon first launch. |
| **Onboarding Completed** | 203 users (**70.2%** completion) | 13 users (**59.1%** completion) | iOS conversion from start $\rightarrow$ complete is +11.1 percentage points higher. |
| **Dog Created (`dog_created`)** | 203 users (**64.4%** of total) | 13 users (**50.0%** of total) | 100% of users who completed onboarding successfully registered their dog's profile. |
| **Paw Readiness Check (`readiness_viewed`)** | 206 users (**65.4%**) | 13 users (**50.0%**) | Core daily surface safety screen viewed by majority of activated users. |
| **Weather Loaded (`weather_loaded`)** | 173 users (54.9%) | 13 users (50.0%) | Successful GPS/NWS/Tomorrow.io atmospheric telemetry fetch. |
| **Surface Selector (`surface_changed`)** | 118 users (**37.5%**) | 5 users (**19.2%**) | iOS users actively explore surface toggles (Asphalt $\rightarrow$ Turf/Concrete/Sand) at almost 2x the rate. |
| **7-Second Hand Test (`hand_test_opened`)** | 114 users (**36.2%**) | 8 users (**30.8%**) | Educational tactile validation modal accessed across both platforms. |
| **Paw Scan Interest (`scan_interest_registered`)** | 114 users (**36.2%**) | 7 users (**26.9%**) | Optical paw pad health scanner waitlist registration. |

---

## 3. Platform Demographics & Version Distributions

### iOS Platform Breakdown
- **Date Range Active:** May 31, 2026 – September 27, 2026 (Live today)
- **Top OS Versions:**
  - `iOS 26.5`: 110 users (34.9%)
  - `iOS 26.5.2`: 69 users (21.9%)
  - `iOS 26.6`: 36 users (11.4%)
  - `iOS 26.5.1`: 33 users (10.5%)
  - Other / Older: 67 users (21.3%)
- **Top App Builds:**
  - `v4.0.0`: 83 users (26.3%)
  - `v5.4.2`: 36 users (11.4%)
  - `v4.1.0`: 29 users (9.2%)
  - `v5.2.0`: 27 users (8.6%)
  - `v4.3.0`: 26 users (8.3%)

### Android Platform Breakdown
- **Date Range Active:** July 23, 2026 – September 20, 2026
- **Top OS Versions (API Levels):**
  - `API 36` (Android 16): 10 users (38.5%)
  - `API 30` (Android 11): 8 users (30.8%)
  - `API 37` / `API 31`: 3 users (11.5%)
  - Unknown: 4 users (15.4%)
- **Top App Builds:**
  - `v5.1.0`: 22 users (84.6%)
  - Test / Dev Build: 4 users (15.4%)

### Non-Mobile Clients
- **Windows:** 6 users (all 1 event each, web/testing scripts)
- **Mac OS X:** 4 users (simulator / internal web previews)
- **Unknown:** 2 users

---

## 4. Key Takeaways & Recommendations

1. **iOS Dominance (92.4% of Mobile Base):**
   - The user base is overwhelmingly iOS-centric. This aligns with TestFlight distribution and NorthPaw's early focus on Apple ecosystem dog owners.
2. **Engagement Depth:**
   - iOS users exhibit **2.5x higher engagement density** (112.4 vs 44.6 events/user), with 37 active weekly users (11.7% WAU) and 87 active monthly users (27.6% MAU).
3. **Android Status:**
   - Android testing peaked around version 5.1.0 in late July/August. Android users had zero activity in the last 7 days and 4 in the last 30 days. Prior to an official Google Play release, Android telemetry can be reactivated for targeted beta cohorts.
4. **Data Deduplication Invariant:**
   - Mixpanel Raw Export APIs produce duplicate lines across overlapping windows. Using Mixpanel's canonical `$insert_id` deduplication guarantees exact, audit-compliant user and event counts.
