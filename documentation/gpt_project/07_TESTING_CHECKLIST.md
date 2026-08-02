# 07 — Testing Checklist

> Run this **every release**. No remembering. Copy a fresh block per release, check the boxes, and file anything that fails into `14_KNOWN_ISSUES.md`.

Release under test: ________  Date: ________  Device(s): ________

---

## 1. Fresh Install (new user)

- ☐ Cold open → splash renders (forest `#1B4332`), no hang
- ☐ Onboarding: every scene advances; breed search focuses, searches, scrolls; Mixed Breed / Rescue pinned and selectable
- ☐ Photo step: upload works, skip works, default avatar badge appears
- ☐ Location permission: rationale shows before system prompt; **deny path** shows a graceful fallback, not raw text
- ☐ Calibration pulse runs → NPI reveals → lands on Home
- ☐ ToS / liability click-wrap blocks completion until accepted
- ☐ Morning brief scheduling prompt works; skipping it works
- ☐ First `readiness_viewed` fires with `time_to_first_readiness_ms` (verify in debug toggle)

## 2. Upgrade (existing user)

- ☐ Profile, dog photo, settings, checklist state, reminder schedules all preserved
- ☐ Updated-terms modal appears when `REQUIRED_DISCLAIMER_VERSION` bumps (and only then)
- ☐ No re-onboarding; no data loss; no duplicate prompts

## 3. Dark Mode

- ☐ Every screen readable; WCAG contrast holds
- ☐ Glass cards, rim light, pills, gauges render correctly
- ☐ Timeline bands and NPI colors distinguishable

## 4. Light Mode

- ☐ Same pass as dark mode — contrast holds outdoors in glare
- ☐ No text over photos anywhere without validated contrast

## 5. Timer / Hand Test (the 5.3 bug class — always regression-test)

- ☐ Start → completes → confirmation haptic + resolution state
- ☐ Cancel mid-test → clean exit, no stuck screen
- ☐ Background the app mid-test → foreground → no stuck state (AppState safeguards)
- ☐ Cannot get trapped on the scan tab or in any modal loop

## 5.5 Interruptions

- ☐ Receive a phone call while the app is open
- ☐ Receive a notification while using the app
- ☐ Lock/unlock the device
- ☐ Rotate device (if supported)
- ☐ Return from multitasking
- ☐ No state corruption after interruption

## 6. Offline

- ☐ Airplane mode: last-known weather/cache loads or a graceful labeled fallback appears
- ☐ Checklists, library cards, dog profile fully work offline
- ☐ No blank screens; no crash on weather timeout
- ☐ Uncertainty is labeled ("Sensor Status"), never hidden

## 7. Weather

- ☐ NWS path (US location) loads; `weather_provider_used: nws` logged
- ☐ Tomorrow.io fallback works (non-US or degraded NWS); provider logged correctly
- ☐ Cache hit within 30 min; latency reasonable
- ☐ Timeline backfills from midnight; pill and surface boxes match 100%
- ☐ Current temp uses real-time hourly sample, not daily max
- ☐ Pavement bands and NPI sane across: cool sunny day (no false amber), hot humid day, sub-freezing, extreme heat

## 7.5 Seasonality
- ☐ Summer scenario
- ☐ Winter scenario
- ☐ Morning
- ☐ Noon
- ☐ Evening
- ☐ Overnight

## 8. Share

- ☐ Share card generates (image renders, correct data)
- ☐ Native share sheet opens; share completes to Messages/social
- ☐ Share events fire (`share_button_tapped` → `sheet_opened` → `completed`)
- ☐ "Share NorthPaw" from Settings works

## 9. Notifications

- ☐ Morning brief fires at the chosen time with correct dog name and window
- ☐ Care reminder (flea/tick/heartworm) fires on schedule; monthly presets (1st/15th) compute exact month boundaries
- ☐ Toggle on/off respected; quiet defaults intact
- ☐ Tapping a notification opens the right screen

## 10. Review Prompt

- ☐ Not shown before eligibility; not shown twice in a session
- ☐ Quick star path, written review path, store fallback all work
- ☐ "Later" snoozes; "Never" is permanent
- ☐ Developer test trigger works in TestFlight only

## 11. Widgets (future — from 5.4)

- ☐ Widget installs and shows dog + NPI ring + current band
- ☐ Widget data refreshes on schedule
- ☐ Tapping widget deep-links to the right screen
- ☐ Lock screen variant legible at a glance

## 12. Legal & Links

- ☐ Privacy, Terms, Support links open northpawapp.com pages
- ☐ Feedback form submits to the sheet; success state shows; friendly message on rate limit
- ☐ Disclaimer version logic: no forced re-accept on ordinary app updates

## 13. Performance & Polish

- ☐ Animations smooth on a mid-tier device (no jank on timeline scrub)
- ☐ Hour-step haptics on timeline scrub; not excessive elsewhere
- ☐ App usable within 5 seconds of open (the core promise)
- ☐ Reduced-motion preference honored

## 14. Telemetry Sanity (before submit)

- ☐ TestFlight events NOT polluting production Mixpanel (mute default)
- ☐ Version string correct; build number bumped
- ☐ `jest` suites pass (timer, weather fallback, timeline, review prompt)

## Accessibility

- ☐ Dynamic Type / Larger Text
- ☐ VoiceOver navigation
- ☐ Color is never the only indicator
- ☐ Touch targets remain comfortable
- ☐ Contrast remains acceptable throughout

---

## Sign-off

- ☐ Done — Fresh install
- ☐ Done — Upgrade
- ☐ Done — Dark / Light
- ☐ Done — Timer
- ☐ Done — Interruptions
- ☐ Done — Offline
- ☐ Done — Weather
- ☐ Done — Seasonality
- ☐ Done — Share
- ☐ Done — Notifications
- ☐ Done — Review prompt
- ☐ Done — Widgets (future)
- ☐ Done — Legal & links
- ☐ Done — Performance
- ☐ Done — Accessibility
- ☐ Done — Telemetry

## Founder Gut Check

Before pressing Submit:

- ☐ Would I trust this with Aoife today?
- ☐ Does the app answer "Should I take my dog outside?" within 5 seconds?
- ☐ Did I make NorthPaw more trustworthy than the previous release?
- ☐ If this were the first version someone ever used, would I be proud of it?

**Ship it:** ☐
