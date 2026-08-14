# Strict Sequential Onboarding & Activation Funnel Audit

* **Funnel Date Range:** July 17, 2026 – August 12, 2026 *(Public availability window of the new onboarding sequence)*
* **Constraints Applied:**
  * Strict in-order event sequence required.
  * 1-Hour maximum completion window from `onboarding_started`.
  * Unique `distinct_id` counts only (no duplicate events per user).
  * Excluded developer & TestFlight traffic.

---

## 📊 Strict 11-Step Sequential Funnel Results

| Step # | Event / Screen Name | Unique Users | Step Conversion | Step Drop-off | Overall Funnel Conv |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **0** | `onboarding_started` | **85** | 100.0% | 0.0% | **100.0%** |
| **1** | `step: name` | **76** | 89.4% | 10.6% | **89.4%** |
| **2** | `step: breed-snout` | **61** | 80.3% | 19.7% | **71.8%** |
| **3** | `step: age` | **58** | 95.1% | 4.9% | **68.2%** |
| **4** | `step: biology-activity` | **54** | 93.1% | 6.9% | **63.5%** |
| **5** | `step: location` | **54** | 100.0% | 0.0% | **63.5%** |
| **6** | `step: npi-activation` | **54** | 100.0% | 0.0% | **63.5%** |
| **7** | `step: photo` | **54** | 100.0% | 0.0% | **63.5%** |
| **8** | `step: morning-brief` | **53** | 98.1% | 1.9% | **62.4%** |
| **9** | `onboarding_completed` | **50** | 94.3% | 5.7% | **58.8%** |
| **10** | `First readiness_viewed` | **48** | 96.0% | 4.0% | **56.5%** |
