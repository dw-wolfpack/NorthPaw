# Strict Sequential Onboarding & Activation Funnel Audit

* **Funnel Date Range:** July 17, 2026 – September 25, 2026 *(Public availability window of the new onboarding sequence)*
* **Constraints Applied:**
  * Strict in-order event sequence required.
  * 1-Hour maximum completion window from `onboarding_started`.
  * Unique `distinct_id` counts only (no duplicate events per user).
  * Excluded developer & TestFlight traffic.

---

## 📊 Strict 12-Step Sequential Funnel Results

| Step # | Event / Screen Name | Unique Users | Step Conversion | Step Drop-off | Overall Funnel Conv |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **0** | `onboarding_started` | **127** | 100.0% | 0.0% | **100.0%** |
| **1** | `step: name` | **117** | 92.1% | 7.9% | **92.1%** |
| **2** | `step: breed` | **94** | 80.3% | 19.7% | **74.0%** |
| **3** | `step: snout` | **94** | 100.0% | 0.0% | **74.0%** |
| **4** | `step: age` | **91** | 96.8% | 3.2% | **71.7%** |
| **5** | `step: biology-activity` | **86** | 94.5% | 5.5% | **67.7%** |
| **6** | `step: location` | **86** | 100.0% | 0.0% | **67.7%** |
| **7** | `step: npi-activation` | **86** | 100.0% | 0.0% | **67.7%** |
| **8** | `step: photo` | **86** | 100.0% | 0.0% | **67.7%** |
| **9** | `step: morning-brief` | **84** | 97.7% | 2.3% | **66.1%** |
| **10** | `onboarding_completed` | **80** | 95.2% | 4.8% | **63.0%** |
| **11** | `First readiness_viewed` | **78** | 97.5% | 2.5% | **61.4%** |
