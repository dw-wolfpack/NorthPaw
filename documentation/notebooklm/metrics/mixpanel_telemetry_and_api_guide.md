# Mixpanel Analytics API & Telemetry Guide for NorthPaw

## 1. Mixpanel API Capabilities & Architecture

Mixpanel provides a full suite of REST APIs to query metrics, fetch event counts, analyze user retention, and export raw event data:

1. **Query & Insights API (`https://mixpanel.com/api/2.0/insights`)**: Retrieves aggregate metrics, segmentation breakdowns, and property counts over custom date ranges.
2. **Event Names API (`https://mixpanel.com/api/2.0/events/names`)**: Lists all active event types tracked in the project.
3. **Raw Data Export API (`https://data.mixpanel.com/api/2.0/export`)**: Downloads the complete stream of raw JSON event records for data pipelines or NotebookLM deep dives.
4. **User Profile API (`https://mixpanel.com/api/2.0/engage`)**: Queries user profile properties and cohort segments.

---

## 2. Authentication Requirements

Mixpanel strictly enforces separation between **Ingestion (Write)** and **Query (Read)** permissions:

* **`EXPO_PUBLIC_MIXPANEL_TOKEN` (`1f2fd09e1d6a431162d07092fde48f7f`)**:
  * Used by the mobile app for client-side event tracking (`/track`) and profile updates (`/engage`).
  * **Write-only**: Mixpanel blocks read/export API calls using this token (`400 Bad Request: Unable to authenticate request`).

* **To Query or Export Data via the API**:
  Mixpanel requires an **API Secret** or **Service Account**:
  1. Open your Mixpanel Dashboard -> **Project Settings** (Gear icon at top right).
  2. Under **Access Keys** or **Service Accounts**, copy your **API Secret** or create a **Service Account** (Username + Secret).

---

## 3. Automated Export Script (`scripts/export_mixpanel.py`)

A python exporter script is built into the codebase to query and dump metrics directly into `documentation/notebooklm/metrics/`:

### Usage:
```bash
# Export using your Mixpanel API Secret
python3 scripts/export_mixpanel.py --secret <YOUR_MIXPANEL_API_SECRET>

# Or export using a Service Account
python3 scripts/export_mixpanel.py --secret <SERVICE_ACCOUNT_USERNAME> --password <SERVICE_ACCOUNT_SECRET>
```

This exports all event names, aggregate counts, and raw event records for the last 30 days into `documentation/notebooklm/metrics/mixpanel_export.json`.

---

## 4. Complete NorthPaw Telemetry & Analytics Catalog

The following table documents all active event types and properties tracked across the NorthPaw codebase for NotebookLM metric modeling:

| Event Name | Trigger Location | Telemetry Payload & Properties |
| :--- | :--- | :--- |
| `screen_viewed` | Every tab & modal open | `screenName` (Ready, Outings, Pack, Settings, Onboarding, DogProfile, etc.) |
| `npi_score_calculated` | Home risk calculation | `score` (0-100), `roadTempF`, `airTempF`, `surfaceType`, `dogBreed` |
| `npi_explanation_viewed` | NPI modal open | `score` |
| `surface_switched` | Home surface selector | `surfaceType` (asphalt, concrete, turf, sand, cobblestone) |
| `share_card_generated` | Share button tap | `dog_name`, `dog_breed`, `current_npi`, `selected_surface`, `surface_temp_f`, `current_temp_f`, `road_band` |
| `share_card_shared` | iOS/Android native share sheet | `dog_name`, `dog_breed`, `current_npi`, `selected_surface`, `surface_temp_f`, `current_temp_f`, `road_band` |
| `breed_request_submitted` | Feedback modal | `breed_name`, `type` (`breed_request`) |
| `feedback_submitted` | Feedback modal | `type` (`surface_request`, `feature_request`, `bug_report`, `general_feedback`), `payload_subject` |
| `readiness_checked` | Home readiness assessment | `readinessLevel`, `streakDays` |
| `paywall_viewed` | Subscription screen open | `source` (settings, pack_lock, feature_lock) |
