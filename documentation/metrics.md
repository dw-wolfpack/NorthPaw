# What We're Tracking: Mixpanel Analytics Blueprint

This document details the tracking strategy, telemetry schemas, and event properties implemented in **NorthPaw** to analyze activation, user engagement, and product-market fit.

---

## 🌟 The North Star Metric: Weekly Safety Checks (WSC)
*   **Definition**: The number of unique users who view their dog's Readiness screen on the Home cockpit at least once per calendar week.
*   **Rationale**: NorthPaw is a safety utility. Its core value is helping owners answer: *"Is it safe to walk my dog right now?"* WSC measures habit-formation and active utility delivery.
*   **Trigger Event**: `readiness_viewed`

---

## 📊 Key Telemetry & Session Logic

### 1. Time to Value (TTV)
*   **Goal**: Measure the time elapsed between onboarding completion and the first readiness evaluation.
*   **Logic**:
    *   On onboarding completion, the timestamp `Date.now()` is written to `AsyncStorage` under the key `@northpaw/onboarding_completed_at`.
    *   When the Home cockpit successfully loads weather, the app checks if `@northpaw/first_readiness_tracked` exists.
    *   If not, it logs `is_first_readiness_view: true`, calculates the duration since onboarding completion, sends `time_to_first_readiness_ms` as a property, and saves `@northpaw/first_readiness_tracked = "true"`.

### 2. Active-Duration Bounce Tracking (`zero_value_session`)
*   **Goal**: Identify users who open the app but exit without performing any meaningful action.
*   **Logic**:
    *   A session is flagged if the user spends 15+ seconds of active foreground time in the app without triggering any meaningful event.
    *   **Meaningful Event Whitelist**:
        *   `onboarding_started`, `onboarding_completed`, `dog_created`, `readiness_viewed`, `hand_test_started`, `hand_test_completed`, `surface_changed`, `feedback_submitted`, `share_button_pressed`, `support_contact_pressed`.
    *   To prevent duplicates, a single-trigger lock (`hasTrackedZeroValueSessionThisSession`) is managed per-session and resets cleanly whenever the app is brought to the foreground.

### 3. Weather Cache Performance
*   **Goal**: Monitor local weather fetch latency and cache hit ratios.
*   **Telemetry**: Logs `weather_loaded` with:
    *   `cache_hit` (boolean): `true` if loaded from the local 30-minute weather cache, `false` if retrieved via API request.
    *   `load_time_ms` (number): Latency of the retrieval/API call.

---

## 📂 Event Catalog

### `app_opened`
*   **Trigger**: App finishes launching or returns to the foreground.
*   **Properties**:
    *   `days_since_install` (number): Number of days since first install.
    *   `platform` (string): `ios` | `android` | `web`.
    *   `$app_version_string` (string): App version.

### `onboarding_started`
*   **Trigger**: User taps "Get Started" on the onboarding welcome screen.

### `onboarding_completed`
*   **Trigger**: User completes the onboarding flow.

### `dog_created`
*   **Trigger**: User successfully saves their dog's profile during onboarding.
*   **Properties**:
    *   `breed` (string): Selected breed or mix.
    *   `weight` (number): Dog's weight.
    *   `snout_profile` (string): `flat` | `standard` | `long`.
    *   `activity_baseline` (string): `low` | `moderate` | `high`.

### `readiness_viewed`
*   **Trigger**: Weather and NPI load on the Home screen.
*   **Properties**:
    *   `is_first_readiness_view` (boolean): `true` if this is the first view after onboarding.
    *   `time_to_first_readiness_ms` (number, optional): Elapsed time in milliseconds from onboarding completion.
    *   `surface` (string): Current selected pavement type (e.g. `asphalt`, `concrete`, `cobblestone`).
    *   `dog_breed` (string): Dog's breed.
    *   `weather_cache_hit` (boolean): Cache hit status.
    *   `weather_load_time_ms` (number): Retrieval latency.

### `weather_loaded`
*   **Trigger**: Weather data fetch completes.
*   **Properties**:
    *   `cache_hit` (boolean)
    *   `load_time_ms` (number)

### `zero_value_session`
*   **Trigger**: 15+ seconds of foreground time with zero meaningful events.

### `feedback_submitted`
*   **Trigger**: User submits a bug, suggestion, or request.
*   **Properties**:
    *   `type` (string): `breed_request` | `surface_request` | `feature_request` | `bug_report` | `general_feedback`.
    *   `payload_subject` (string): Detailed category/subject (e.g., "Whippet", "Cobblestone").
    *   `has_notes` (boolean): Whether the user left detailed notes.
    *   `has_email` (boolean): Whether an email address was provided.

### `share_button_pressed`
*   **Trigger**: User taps the native "Share NorthPaw" action in settings.

### `support_contact_pressed`
*   **Trigger**: User taps the support link or support email.

### `notification_enabled` / `notification_disabled`
*   **Trigger**: User toggles medical reminders or custom alerts in the notification settings screen.
*   **Properties**:
    *   `category` (string): Type of notification changed.

---

## 👤 User Profile Properties
The following properties are set on the Mixpanel user profile to enable segmentation:
*   `$created` (timestamp): Date of first install.
*   `dog_breed` (string): Calibrated breed.
*   `dog_weight` (number): Calibrated weight.
*   `dog_snout_profile` (string): `flat` | `standard` | `long`.
*   `dog_activity_baseline` (string): `low` | `moderate` | `high`.
*   `total_safety_checks` (number): Incremented on every `readiness_viewed` event.
*   `last_safety_check_timestamp` (timestamp): Updated on every `readiness_viewed` event.
