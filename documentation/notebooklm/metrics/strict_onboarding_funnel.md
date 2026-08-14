# Strict Sequential Onboarding & Activation Funnel Audit

* **Funnel Date Range:** July 17, 2026 – August 13, 2026 *(Public availability window of the new onboarding sequence)*
* **Constraints Applied:**
  * Strict in-order event sequence required.
  * 1-Hour maximum completion window from `onboarding_started`.
  * Unique `distinct_id` counts only (no duplicate events per user).
  * Excluded developer & TestFlight traffic.

---

## 📊 Strict 12-Step Sequential Funnel Results

| Step # | Event / Screen Name | Unique Users | Step Conversion | Step Drop-off | Overall Funnel Conv |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **0** | `onboarding_started` | **86** | 100.0% | 0.0% | **100.0%** |
| **1** | `step: name` | **77** | 89.5% | 10.5% | **89.5%** |
| **2** | `step: breed` | **62** | 80.5% | 19.5% | **72.1%** |
| **3** | `step: snout` | **58** | 93.5% | 6.5% | **67.4%** |
| **4** | `step: age` | **55** | 94.8% | 5.2% | **64.0%** |
| **5** | `step: biology-activity` | **54** | 98.2% | 1.8% | **62.8%** |
| **6** | `step: location` | **54** | 100.0% | 0.0% | **62.8%** |
| **7** | `step: npi-activation` | **54** | 100.0% | 0.0% | **62.8%** |
| **8** | `step: photo` | **54** | 100.0% | 0.0% | **62.8%** |
| **9** | `step: morning-brief` | **52** | 96.3% | 3.7% | **60.5%** |
| **10** | `onboarding_completed` | **51** | 98.1% | 1.9% | **59.3%** |
| **11** | `First readiness_viewed` | **49** | 96.1% | 3.9% | **57.0%** |
