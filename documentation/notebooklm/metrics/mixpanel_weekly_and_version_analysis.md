# NorthPaw Mixpanel Usage Trends & App Version Distribution
*Report Date: October 24, 2026 | Source: Mixpanel Live Data Export API*

---

## 1. Executive Summary

This report analyzes live telemetry from **39,179 deduplicated events** across **367 unique users** tracked in Mixpanel from project inception through **October 24, 2026**.

- **Total Event Repository:** **39,179 events** (+1,724 new unique events synchronized).
- **Total Tracked Users:** **367 users** (+10 new users across mobile and web).
- **Weekly Active Users (WAU):** **27 active users** in the past 7 days (Oct 17 – Oct 24).
- **Monthly Active Users (MAU):** **64 unique users** active in the last 30 days (**17.4%** of all-time user base).
- **Latest App Version Adoption (v6.0.0):** **47 users** are now on `v6.0.0` (up from 25 users on Oct 3, an **88% increase**).
  - **88.9% of weekly active users** (24 of 27 active users in the past 7 days) are running `v6.0.0`.
  - All 47 users on `v6.0.0` were active within the last 30 days.
- **Widget Engagement Surge:** Total widget events climbed to **156** (+62.5% increase), with **94 direct app launches via widget** across **38 unique users** (+72.7% increase from 22 users).

---

## 2. Week-Over-Week Usage Comparison (Past 6 Weeks)

A calendar breakdown of the last 6 rolling 7-day periods ending October 24, 2026:

| Week Period | Active Users (WAU) | New Users | Total Events | Avg Events / User | App Opens | Paw Readiness Views |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sep 12 – Sep 19** | 44 | 6 | 1,160 | 26.4 | 245 | 131 |
| **Sep 19 – Sep 26** | 38 | 1 | 774 | 20.4 | 181 | 87 |
| **Sep 26 – Oct 03** | 33 | 7 | 1,119 | 33.9 | 165 | 123 |
| **Oct 03 – Oct 10** | 26 | 3 | 808 | 31.1 | 171 | 82 |
| **Oct 10 – Oct 17** | 34 | 5 | 524 | 15.4 | 121 | 71 |
| **Oct 17 – Oct 24 (Past 7d)** | **27** | **2** | **381** | **14.1** | **100** | **37** |

### Key Weekly Observations
1. **Version 6.0.0 Dominance:** Nearly all weekly engagement is now concentrated in `v6.0.0` (24 of 27 active users). Older versions (`v5.4.2`, `v4.0.0`) have almost completely completed their upgrade cycle into `v6.0.0`.
2. **Seasonal Transition Pattern:** As autumn deepens and ambient heat risks subside in northern regions, daily safety check frequency reflects the shoulder season transition before severe winter weather sets in.
3. **Widget Adoption Acceleration:** Users on `v6.0.0` are increasingly launching the app via home/lock screen widgets (57 widget opens in the last 30 days).

---

## 3. App Version Distribution & Fragmentation

Analysis of every user's **latest active app version**:

| App Version | Total Users | Share of Base | Active (7 Days) | Active (30 Days) | iOS Users | Android Users | Events on Version | Last Active Date | Status / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`6.0.0`** | **47** | **12.8%** | **24** | **47** | 47 | 0 | 3,177 | **2026-10-24** *(Today)* | **Current Production / TestFlight Build** (88.9% of active WAU cohort). |
| **`5.4.2`** | 49 | 13.4% | 0 | 3 | 49 | 0 | 2,341 | 2026-09-28 | Previous stable release; 13 users migrated to 6.0.0 this month. |
| **`4.0.0`** | 48 | 13.1% | 1 | 2 | 48 | 0 | 1,596 | 2026-10-19 | Early summer major milestone build. |
| **`5.1.0`** | 38 | 10.4% | 0 | 3 | 15 | 23 | 1,752 | 2026-10-13 | Primary Android release (23 Android users) + legacy iOS testers. |
| **`Unknown`** | 34 | 9.3% | 0 | 3 | 16 | 3 | 64 | 2026-10-15 | Web downloads, previews, and headless events. |
| **`5.2.0`** | 24 | 6.5% | 0 | 1 | 24 | 0 | 1,031 | 2026-09-27 | August test cohort. |
| **`4.1.0`** | 20 | 5.4% | 0 | 0 | 20 | 0 | 517 | 2026-07-25 | Inactive legacy build. |
| **`3.0.0`** | 17 | 4.6% | 1 | 1 | 17 | 0 | 252 | 2026-10-21 | Spring legacy build. |
| **`5.4.0`** | 16 | 4.4% | 1 | 1 | 16 | 0 | 788 | 2026-10-20 | Minor TestFlight beta. |
| **`5.4.1`** | 16 | 4.4% | 0 | 0 | 16 | 0 | 306 | 2026-09-14 | Intermediate bugfix build. |
| **`4.3.0`** | 15 | 4.1% | 0 | 0 | 15 | 0 | 213 | 2026-09-12 | Mid-summer test build. |
| **`5.0.0`** | 14 | 3.8% | 0 | 0 | 14 | 0 | 211 | 2026-07-29 | Inactive legacy build. |
| **`4.2.0`** | 13 | 3.5% | 0 | 1 | 13 | 0 | 360 | 2026-10-11 | Inactive test build. |
| **`5.3.3`** | 12 | 3.3% | 0 | 0 | 12 | 0 | 219 | 2026-08-12 | Inactive test build. |
| **`5.3.2`** | 4 | 1.1% | 0 | 0 | 4 | 0 | 113 | 2026-08-04 | Inactive test build. |

---

## 4. Platform Breakdown

### iOS Ecosystem (326 Users / 88.8%)
- **Events:** 37,888 events (116.2 events/user).
- **Active User Base:** 27 active in the last 7 days, 57 active in the last 30 days.
- **Upgrades:** Rapid shift onto `6.0.0` (47 users now on `6.0.0`, up from 25 on Oct 3).

### Android Ecosystem (27 Users / 7.4%)
- **Events:** 1,262 events (46.7 events/user).
- **Active User Base:** 3 active in the last 30 days.
- **Version Concentration:** 23 of 27 users are on `5.1.0`. Pushing an updated `6.0.0` Android build will align Android users with the year-round decision engine.

### Web & Other (14 Users / 3.8%)
- macOS / Windows / Web preview sessions capturing landing page and QR-code referral traffic.
