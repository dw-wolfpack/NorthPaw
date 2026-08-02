# 04 — Architecture

> High level. No code. Answers: "How does this thing work?"

Last updated: 2026-08-01

---

## The Shape of the System

NorthPaw is a **local-first mobile app with a thin cloud edge**. All personal data lives on the device. The only network calls are to weather providers, analytics, the feedback pipeline, and app-store services.

```
┌─────────────────────────────────────────────────┐
│                  iOS / Android                   │
│                                                   │
│   Expo (React Native) app                         │
│   ├── Screens (expo-router, file-based)           │
│   ├── NPI + Road Temp engines (deterministic)     │
│   ├── Local storage (AsyncStorage, FileSystem,    │
│   │   SQLite)                                     │
│   └── Notifications (local, scheduled)            │
└───────┬──────────┬──────────┬──────────┬─────────┘
        │          │          │          │
   Weather      Mixpanel   Google     RevenueCat /
   providers    (events)   Sheets     App Store
   (NWS first,             (feedback)
   Tomorrow.io
   fallback)
```

---

# Core Philosophy

NorthPaw follows four architectural principles.

## 1. Local First

Dog profiles, reminders, photos, settings, history, and preferences remain on the user's device.

No account is required.

No cloud profile exists.

---

## 2. Deterministic

NorthPaw uses deterministic environmental models.

The same inputs always produce the same outputs.

There are no AI-generated recommendations or probabilistic black-box decisions.

Trust comes from transparency.

---

## 3. Thin Cloud

Cloud services exist only where they provide unique value.

Today those services include:

- Weather
- Analytics
- Feedback
- Purchases
- App distribution

Everything else stays local.

---

## 4. Privacy By Default

The app collects the minimum information necessary.

Dog data never leaves the device.

Location is shared only with weather providers in order to retrieve weather.

There are no accounts.

---

# Application

NorthPaw is built using Expo and React Native with file-based routing.

The application is organized into five primary experiences:

- Ready (Home)
- Checklists
- Field Guide
- Scan
- Settings

Supporting flows include:

- Onboarding
- Dog Profile
- Care Reminders
- Outing Detail
- Checklist Detail
- Pack Detail

---

# Weather Engine

NorthPaw combines multiple weather providers into a single normalized weather model.

## Primary

National Weather Service (United States)

Used whenever possible because it is free, reliable, and public.

---

## Fallback

Tomorrow.io

Used internationally and whenever NOAA data cannot provide sufficient coverage.

---

A dispatcher selects the appropriate provider, normalizes the response, caches results locally, and attaches confidence information for downstream systems.

When confidence is reduced, NorthPaw explains that to the user instead of pretending certainty.

---

# Decision Engine

The decision engine is the heart of NorthPaw.

It combines:

- Current weather
- Hourly forecast
- Solar position
- Pavement physics
- Surface characteristics
- Dog biology

to produce:

- Road temperatures
- NorthPaw Index (NPI)
- Best walk windows
- Safety guidance

Every calculation is deterministic and fully explainable.

---

# Storage

NorthPaw stores information locally.

Examples include:

- Dog profile
- Photos
- Reminders
- Cached weather
- Settings
- Checklist state
- Review prompt history

No personal cloud account exists.

---

# Notifications

NorthPaw uses local notifications.

Examples include:

- Morning Readiness Brief
- Medication reminders

Notifications are:

- optional
- scheduled locally
- never promotional

---

# Analytics

Anonymous analytics help improve the product.

Analytics measure things like:

- onboarding completion
- readiness views
- feature usage
- sharing
- review prompts

Production metrics are protected by disabling analytics in development and TestFlight builds by default.

---

# Feedback Pipeline

Users can submit:

- Bugs
- Feature requests
- Breed requests

Feedback is sent to a lightweight Google Sheets pipeline for review.

This keeps submission friction low while giving every request a permanent record.

---

# Monetization

NorthPaw follows one rule:

> Safety is free forever.

Premium features will provide historical insight, trends, and personalization—not access to safety information.

---

# Website

northpawapp.com provides:

- Marketing
- Support
- Privacy Policy
- Terms of Service
- Press

The website is intentionally separate from the mobile application.

---

# Release Pipeline

Releases follow a simple flow:

Developer
→ GitHub
→ EAS Build
→ TestFlight
→ App Store Review
→ Production

---

# System Guardrails

NorthPaw intentionally protects user trust.

Guardrails include:

- Local-first architecture
- No required accounts
- Educational (not veterinary) guidance
- Transparent uncertainty
- Conservative safety recommendations
- Privacy-first defaults
- Safety over engagement
- Performance over visual novelty

---

# Appendix — Key Implementation Facts

Concrete reference details for answering "where does X live?" questions.

## Stack

- Expo 54, React Native 0.81, React 19, TypeScript, New Architecture enabled
- expo-router 6 (typed routes), NativeWind/Tailwind styling
- Premium UI libraries: `@shopify/react-native-skia` (gauges/glow), `react-native-reanimated` (motion), `expo-blur` (glass), `expo-haptics`
- Bundle id `com.northpaw.app`, scheme `northpaw://`, current version 5.3.0

## Where things live

- Safety models: `lib/weather/roadTemp.ts` (pavement physics), NPI scoring on Home (`app/(tabs)/index.tsx`), readiness logic in `lib/readiness/`
- Weather providers: `lib/weather/nwsWeather.ts`, `tomorrowWeather.ts`, `weatherDispatcher.ts` (US bounding check → NWS first)
- Analytics: `lib/analytics.ts` (zero-SDK Mixpanel REST, non-prod muted by default)
- Companion gating: `lib/companionGuard.ts` (coming-soon modal + `companion_feature_tapped` demand events)
- Review prompts: `lib/reviewPrompt.js` (eligibility, session guards)
- Legal links/versioning: `constants/Legal.ts`, `REQUIRED_DISCLAIMER_VERSION`
- Tests: `lib/__tests__/`, `components/__tests__` (Jest)

## Service specifics

- RevenueCat entitlement `pro`; product ids `northpaw_pro_monthly` / `northpaw_pro_annual`; paywall currently a coming-soon surface measuring demand
- Feedback: Google Apps Script Web App → Google Sheet; background watcher polls for new breed requests with 12-hour throttling and sanitized payloads
- Morning Brief: local notifications + `expo-background-fetch` for weather refresh
- Weather cache: 30-minute local cache; timeline backfills hourly data from midnight
- Website: northpawapp.com on **Cloudflare** (marketing, /privacy, /support, terms); support@northpawapp.com
- Builds: EAS Build + Submit; secrets in EAS Secrets (migrated off `.env` in 4.3)
- Known exposure: Tomorrow.io API key ships client-side; planned mitigation is a Cloudflare Worker proxy (see `14_KNOWN_ISSUES.md`)

## Deep-dive docs (main repo)

- `documentation/NPI_ALGORITHM_GUIDE.md` — the safety math (CHSI, surface multipliers, thresholds)
- `documentation/DESIGN_RULES.md` — design tokens and interaction rules
- `documentation/onboarding_flow.md` — the 11-scene calibration ritual
- `documentation/metrics.md` — analytics implementation blueprint