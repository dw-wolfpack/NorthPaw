# Strict Sequential Onboarding & Activation Funnel Audit

* **Funnel Date Range:** July 17, 2026 – September 02, 2026 *(Public availability window of the new onboarding sequence)*
* **Constraints Applied:**
  * Strict in-order event sequence required.
  * 1-Hour maximum completion window from `onboarding_started`.
  * Unique `distinct_id` counts only (no duplicate events per user).
  * Excluded developer & TestFlight traffic.

---

## 📊 Strict 12-Step Sequential Funnel Results

| Step # | Event / Screen Name | Unique Users | Step Conversion | Step Drop-off | Overall Funnel Conv |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **0** | `onboarding_started` | **115** | 100.0% | 0.0% | **100.0%** |
| **1** | `step: name` | **105** | 91.3% | 8.7% | **91.3%** |
| **2** | `step: breed` | **85** | 81.0% | 19.0% | **73.9%** |
| **3** | `step: snout` | **83** | 97.6% | 2.4% | **72.2%** |
| **4** | `step: age` | **80** | 96.4% | 3.6% | **69.6%** |
| **5** | `step: biology-activity` | **76** | 95.0% | 5.0% | **66.1%** |
| **6** | `step: location` | **76** | 100.0% | 0.0% | **66.1%** |
| **7** | `step: npi-activation` | **76** | 100.0% | 0.0% | **66.1%** |
| **8** | `step: photo` | **76** | 100.0% | 0.0% | **66.1%** |
| **9** | `step: morning-brief` | **74** | 97.4% | 2.6% | **64.3%** |
| **10** | `onboarding_completed` | **72** | 97.3% | 2.7% | **62.6%** |
| **11** | `First readiness_viewed` | **70** | 97.2% | 2.8% | **60.9%** |
