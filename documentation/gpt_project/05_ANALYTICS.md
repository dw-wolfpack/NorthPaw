# 05 — Analytics

> Every event, its properties, why it exists, and which dashboard it feeds. This file saves you from re-deriving the tracking strategy every time you open Mixpanel.

Last updated: 2026-08-01
Provider: **Mixpanel** (REST, zero-SDK, `lib/analytics.ts`)

---

## North Star Metric

**Weekly Safety Checks (WSC)** — unique users with ≥1 `readiness_viewed` per calendar week.

Supporting metric logic:

- **Time to Value (TTV):** `time_to_first_readiness_ms` on the first `readiness_viewed` (measured from onboarding completion timestamp).
- **Active-Duration Bounce (`zero_value_session`):** 15+ seconds foreground with no meaningful event. Fires once per session max.
- **Weather cache performance:** `cache_hit` + `load_time_ms` on `weather_loaded`.

## Global Properties (attached to every event)

`token`, `distinct_id` (anonymous on-device UUID), `$os`, `$os_version`, `$app_version_string`, `platform` (ios/android/web), `days_since_install`, `environment` (production/testflight/expo_go/development), `is_testflight`, `build_type`.

**Non-prod guard:** dev/TestFlight events are muted by default (opt-in toggle in Settings) to keep production data clean.

## User Profile Properties (Mixpanel People)

`$created`, `dog_breed`, `dog_weight`, `dog_snout_profile`, `dog_activity_baseline`, `total_safety_checks` (increments on each `readiness_viewed`), `last_safety_check_timestamp`.

---

## Event Catalog

### Activation & Onboarding

| Event | Trigger | Properties | Why it exists | Dashboard |
|---|---|---|---|---|
| `app_opened` | App launch or return to foreground | `days_since_install`, `platform`, `$app_version_string` | Base activity, DAU/WAU, retention cohorts | Engagement |
| `onboarding_started` | Tap "Get Started" | — | Top of activation funnel | Activation |
| `onboarding_step_viewed` | Each onboarding scene renders | step/scene info | Finds drop-off scenes in the calibration ritual | Activation |
| `onboarding_photo_uploaded` | User adds dog photo | — | Personalization adoption | Activation |
| `onboarding_photo_skipped` | User skips photo step | — | Friction signal for the photo step | Activation |
| `onboarding_completed` | Onboarding flow finished | profile summary | Activation funnel bottom; starts TTV clock | Activation |
| `dog_created` | Dog profile saved | `breed`, `weight`, `snout_profile`, `activity_baseline` | Segment by dog biology; validates calibration inputs | Activation |
| `disclaimer_accepted` | ToS/liability accepted | `is_upgrade_flow` (bool) | Legal compliance audit trail | Compliance |

### Core Value (Safety Loop)

| Event | Trigger | Properties | Why it exists | Dashboard |
|---|---|---|---|---|
| `readiness_viewed` | Weather + NPI loaded on Home | `is_first_readiness_view`, `time_to_first_readiness_ms`, `surface`, `dog_breed`, `weather_cache_hit`, `weather_load_time_ms`, `weather_provider_used` (nws/tomorrow/cache) | **THE North Star (WSC).** TTV, provider mix, cache health | North Star |
| `weather_loaded` | Weather fetch completes | `cache_hit`, `load_time_ms`, `weather_provider_used` | Cache hit ratio, latency, provider reliability | System Health |
| `npi_explanation_viewed` | "Why this score?" opened | `score` | Trust-building behavior; explainer open rate | Trust |
| `weather_details_viewed` | Thermal breakdown modal opened | — | Depth of engagement beyond glance | Engagement |
| `surface_changed` | User switches pavement type | `surface` | Which surfaces users care about | Engagement |
| `hand_test_opened` | Verify Ground Temp ritual opened | `surface` | Safety ritual adoption | Safety Ritual |
| `hand_test_started` | 7-second hand test begins | `surface` | Ritual follow-through | Safety Ritual |
| `hand_test_completed` | Hand test finished | `surface`, `duration` | Completion rate of the signature ritual | Safety Ritual |
| `hand_test_cancelled` | Hand test abandoned | `surface` | Friction in the ritual | Safety Ritual |
| `walk_window_viewed` | Timeline interactions | `action` (scrub_timeline / open_road_temp_details) | Timeline engagement, planning behavior | Engagement |
| `zero_value_session` | 15s+ foreground, no meaningful event | — | Bounce signal; "opened but got nothing" | Engagement |

### Content & Preparedness

| Event | Trigger | Properties | Why it exists | Dashboard |
|---|---|---|---|---|
| `preparedness_viewed` | Card / checklist / pack detail viewed | `type` (card/checklist/pack), id, title | Which educational content matters | Content |
| `checklist_opened` | Checklist detail opened | `checklistId`, `title` | Checklist adoption | Content |
| `tick_check_completed` | Tick check flow finished | — | Seasonal safety feature usage | Content |
| `scan_screen_viewed` | Scan tab opened | — | QR feature discovery | Content |
| `scan_interest_registered` | Scan action / intent | — | Demand signal for QR field cards | Content |

### Sharing & Growth

| Event | Trigger | Properties | Why it exists | Dashboard |
|---|---|---|---|---|
| `share_button_tapped` | Share card action tapped | context | Top of share funnel | Growth |
| `share_sheet_opened` | Native share sheet displayed | card type | Share intent confirmed | Growth |
| `share_completed` | Share actually completed | card type, destination if available | **K-factor input.** Share cards working? | Growth |
| `share_button_pressed` | "Share NorthPaw" in Settings | `context` | Organic advocacy | Growth |

### Review Prompt Flow (5.3)

| Event | Trigger | Properties | Why it exists | Dashboard |
|---|---|---|---|---|
| `review_prompt_eligible` | User hits eligibility criteria | eligibility context | Funnel top — how many qualify | Reviews |
| `review_prompt_shown` | Prompt displayed | — | Display rate | Reviews |
| `review_prompt_quick_star_tapped` | Quick star rating path | rating | Low-friction review conversion | Reviews |
| `review_prompt_written_review_tapped` | "Write a review" path | — | High-effort review conversion | Reviews |
| `review_store_fallback_opened` | Native store page fallback used | — | Fallback usage | Reviews |
| `review_prompt_later_tapped` | "Later" | — | Snooze rate (don't over-ask) | Reviews |
| `review_prompt_never_tapped` | "Never" | — | Opt-out rate — respected permanently | Reviews |

### Feedback & Support

| Event | Trigger | Properties | Why it exists | Dashboard |
|---|---|---|---|---|
| `feedback_submitted` | Feedback form sent | `type` (breed_request / surface_request / feature_request / bug_report / general_feedback), `payload_subject`, `has_notes`, `has_email` | Demand routing; community pulse | Feedback |
| `breed_request_submitted` | Breed request sent | breed | Prioritizes breed catalog additions | Feedback |
| `support_contact_pressed` | Support link tapped | `method` | Support burden signal | Feedback |

### Notifications & Settings

| Event | Trigger | Properties | Why it exists | Dashboard |
|---|---|---|---|---|
| `notification_enabled` | A notification category toggled on | `category`, `context` (onboarding/reminders) | Morning brief / care reminder opt-in rate | Habit |
| `notification_disabled` | Category toggled off | `category` | Notification fatigue guardrail | Habit |
| `dog_profile_saved` | Dog profile edited in Settings | updated fields | Profile maintenance behavior | Engagement |
| `screen_viewed` | Major screens render | `screenName` (+ ids for detail screens) | Navigation/engagement map | Engagement |

### Monetization (Companion / Pro — measuring demand before selling)

| Event | Trigger | Properties | Why it exists | Dashboard |
|---|---|---|---|---|
| `companion_feature_tapped` | User taps a Companion-gated feature | `feature` | **Demand signal for the paid tier before it exists** | Monetization |
| `pro_paywall_viewed` / `pro_modal_viewed` | Paywall shown | `returnTo` | Paywall impressions | Monetization |
| `upgrade_clicked` / `pro_interest_registered` | Upgrade CTA tapped | `packageName`, `price` | Purchase intent at price points | Monetization |
| `subscription_started` / `subscription_purchased` | StoreKit flow / completed purchase | `packageName`, `price` | Conversion | Monetization |
| `pro_paywall_closed` | Paywall dismissed | `returnTo` | Rejection rate | Monetization |
| `pro_restore_tapped` | Restore purchases | — | Support/debug signal | Monetization |

---

## Meaningful-Event Whitelist (used by `zero_value_session`)

`onboarding_started`, `onboarding_completed`, `dog_created`, `readiness_viewed`, `hand_test_started`, `hand_test_completed`, `surface_changed`, `feedback_submitted`, `share_button_pressed`, `share_button_tapped`, `share_sheet_opened`, `share_completed`, `support_contact_pressed`.

## Weekly Review Ritual (Mondays)

1. New users
2. WAU / Weekly Safety Checks
3. Activation funnel (`onboarding_started` → `completed` → first `readiness_viewed`)
4. Shares (`share_completed`)
5. Feedback submitted
6. `companion_feature_tapped` — is paid demand growing?

## Suggested Mixpanel Boards (build once, reuse forever)

| Board | Core reports |
|---|---|
| North Star | WSC (unique `readiness_viewed` by week), WAU trend, TTV median (`time_to_first_readiness_ms`) |
| Activation | Funnel `onboarding_started` → `onboarding_completed` → first `readiness_viewed`; step drop-off via `onboarding_step_viewed`; photo skip rate |
| Engagement | DAU/WAU (`app_opened`), `screen_viewed` map, `zero_value_session` rate, retention cohorts by `days_since_install` |
| Trust | `npi_explanation_viewed` rate, `weather_details_viewed`, hand test funnel (opened → started → completed → cancelled) |
| Growth | Share funnel (`share_button_tapped` → `share_sheet_opened` → `share_completed`), `share_button_pressed` |
| Reviews | Review funnel (`review_prompt_eligible` → `shown` → quick star / written / later / never) |
| Feedback | `feedback_submitted` by `type`, top `payload_subject` values (breed requests surface here) |
| Monetization | `companion_feature_tapped` by `feature`, paywall funnel (`pro_paywall_viewed` → `upgrade_clicked` → `subscription_purchased`) |
| System Health | `weather_loaded` cache-hit ratio + latency p50/p95, `weather_provider_used` mix (nws / tomorrow / cache) |
