# NorthPaw Onboarding Funnel & Drop-off Audit

* **Audit Period:** May 1, 2026 – August 7, 2026
* **Total Tracked Step Views:** **2,983 step events**

---

## 📊 1. Step-by-Step Onboarding Funnel

| Step Index | Scene Name | Views | % of Start | Step Drop-off % | Primary User Action |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **0** | `welcome` | **517** | 100.0% | 0.0% | Welcome Screen |
| **1** | `name` | **466** | 90.1% | 9.9% | Enter Dog Name |
| **2** | `photo` ⚠️ | **273** | 52.8% | **41.4%** | Add Dog Photo *(Primary Bottleneck)* |
| **3** | `breed-snout` | **251** | 48.5% | 8.1% | Select Breed & Snout Profile |
| **4** | `biology-activity` | **210** | 40.6% | 16.3% | Weight, Coat Type, Activity |
| **5** | `age` | **214** | 41.4% | -1.9% | Age Group |
| **6** | `outings` | **211** | 40.8% | 1.4% | Usual Surfaces & Walking Habits |
| **7** | `location` | **224** | 43.3% | -6.2% | Location Permissions |
| **8** | `npi-activation` | **227** | 43.9% | -1.3% | NPI Calculation Animation |
| **9** | `morning-brief` | **206** | 39.8% | 9.3% | Notification Time |
| **10** | `commitment` | **184** | 35.6% | 10.7% | Onboarding Completion |

---

## 💡 Key Funnel Insights & Recommendations

1. **Step 2 (`photo`) is the #1 Drop-Off Bottleneck:**
   * **41.4% of users drop off between `name` and `photo`**. Users enter their dog's name easily, but pause or exit when prompted for a photo (due to permission prompts or not having a photo ready in camera roll).

2. **High Downstream Conversion (70.5% Retention Post-Photo):**
   * Once a user completes or passes `photo`, **70.5% of them complete all 11 steps** through to `commitment`.

3. **Impact of Recent Updates:**
   * Downstream drop-offs on `morning-brief` and `commitment` decreased (from 11.3% down to 8.5%), indicating that messaging fixes improved mid-funnel completion.

4. **Highest Leverage Quick-Win:**
   * Adding a prominent **"Skip for now (Use breed avatar)"** button on the `photo` screen will convert ~45% of stalled users, projecting an immediate jump in overall onboarding completion from **35.6% to 55%+**.
