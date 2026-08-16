# NorthPaw Release Automation — What's Possible vs What Isn't

> Planning reference only. Captures an honest assessment of what can be automated in the iOS release flow after the 5.3 hotfix streak (multiple App Store trains before a clean prod).
>
> **Last updated:** 2026-08-05  
> **Do not treat this as a mandate to automate everything.** Automate gates that prevent known disasters; keep ship judgment human.

---

## Why this exists

5.3 required multiple hotfixes before the intended product was in prod. Failures included:

- Closed App Store version trains (`CFBundleShortVersionString` already approved)
- Fresh-install Home not loading after onboarding (`setWeather` never called — TypeScript/Jest still green)
- Usability / accessibility issues caught by humans, not CI

The lesson is not "add more automation until CI is green." It is: **make the failure modes that already burned us impossible to forget**, without pretending a solo Expo app can unattended-ship to the App Store.

---

## Canonical human release flow (source of truth)

Automation supports this flow. It does not replace it.

### Phase 1 — Development

- Build locally
- Add features / fix bugs
- Run Jest
- Run TypeScript
- Verify lint/build

**Goal:** Confidence the code is correct.

### Phase 2 — Internal TestFlight (`testflight` profile)

```bash
eas build --platform ios --profile testflight
```

- Developer tools **enabled**
- Install from TestFlight
- Test: launch, navigation, light/dark, performance
- New feature: every path
- Regression: golden path (Readiness, surface switching, NPI, dog profile, care reminders, share, settings)
- Verify developer features visible (debug menu, analytics testing, review trigger, etc.)

### Phase 3 — Production candidate (`production` profile)

```bash
eas build --platform ios --profile production
```

- Developer tools **OFF**
- Install this build via TestFlight
- Treat exactly like an App Store customer

### Stop Ship checklist (mandatory)

- **Upgrade:** install over existing → profile / settings / reminders / widget / analytics preserved
- **Fresh install:** delete app → onboarding → weather loads → readiness appears (catches the Home bug class)
- **Analytics:** Mixpanel shows minimum funnel events
- **Developer lockdown:** no dev menu, analytics override, review trigger, or internal UI
- **Visual QA / notifications / widgets / performance** as applicable

### Submit (only after Stop Ship passes)

```bash
eas build --platform ios --profile production --auto-submit
```

### After Apple approves

- Download from the App Store
- Final sanity + analytics
- Then resume marketing

### Printable gate list

```
□ Build passes
□ TypeScript passes
□ Jest passes

□ TestFlight build
□ New feature tested
□ Regression tested
□ Developer tools work

□ Production build

□ Upgrade existing install
□ Fresh install
□ Analytics verified
□ Developer tools hidden
□ Widget verified (if changed)
□ Notifications verified (if changed)
□ Visual QA

□ Submit

□ Download from App Store
□ Analytics verified one last time

GO MARKET THE APP
```

Also see: `documentation/gpt_project/07_TESTING_CHECKLIST.md`

---

## Current repo reality (as of this doc)

| Capability | Status |
|---|---|
| Jest unit/regression tests | Present (`lib/__tests__`, etc.) — weather, timer, review prompt |
| `npm test` / CI workflow | **Not wired** — no `.github/workflows`, no package test script |
| Maestro / Detox / Appium | **Not present** |
| Fastlane | **Not present** |
| EAS TestFlight vs production env split | **Present** (`eas.json`: `EXPO_PUBLIC_ENV`, `SHOW_DEVELOPER_TOOLS`) |
| Manual checklists | **Present** (gpt_project testing checklist + this flow) |

Automation is **buildable**, not already running.

---

## What CAN be automated well (high ROI)

### Phase 1 — code correctness

| Check | Automatable? | Notes |
|---|---|---|
| TypeScript | **Yes** | `tsc --noEmit` — block PR / pre-build |
| Jest | **Yes** | Wire `npm test`; grow suite around bugs already hit |
| Lint | **Maybe** | Only if ESLint stays non-noisy |
| "Build compiles" | **Partial** | Local/export ≠ App Store binary; real proof is EAS build success |

**Pushback:** Green Phase 1 ≠ ship confidence. The Home bug was typecheck-clean. Unit tests only catch what you assert. Prefer a **regression that Home focus sets weather state** over "trust CI more."

### Release config lockdown (cheap, high value)

| Check | Automatable? |
|---|---|
| Prod profile: `EXPO_PUBLIC_ENV=production` | **Yes** — assert `eas.json` |
| Prod: developer tools off | **Yes** |
| Marketing version > last App Store version | **Yes** — ASC API / EAS + bump gate (would have blocked closed-train uploads) |
| TestFlight vs prod env differ | **Yes** |

These are among the few automations that would have directly prevented a 5.3-class release mess.

### Build pipeline

| Step | Automatable? |
|---|---|
| `eas build` on tag / main | **Yes** |
| Auto-upload to TestFlight | **Yes** |
| Auto-submit to App Review | **Yes, but do not** |

**Hard pushback:** Auto-submit to App Review after green CI is how half-tested builds ship. Automate **building** the production candidate; keep **submitting** a manual decision after Stop Ship.

---

## What people claim is automatable but is not reliable here

### Full device E2E (Maestro / Detox) on real iPhones

**Possible in theory. Expensive and flaky for a solo founder.**

- Fresh install + onboarding + location + live weather = hardest path
- System permission sheets, share sheet, review prompts = brittle
- Widgets / lock screen / Live Activities = mostly outside app-process E2E
- Notification timing / background refresh = not reliable without device farms

**Realistic slice:** Maestro golden path on **simulator** (launch → complete onboarding with mocked location → Home shows NPI). Could catch Home-after-onboarding *if* assertions exist. Does **not** replace TestFlight Stop Ship.

Cost: ~1–2 weeks to stabilize, then ongoing flake. Worth it only if weekly shipping keeps hitting the same bug class.

### "Verify analytics in Mixpanel" as a ship gate

**Not fully automatable.**

- Ingestion lag
- TestFlight analytics may be muted by design
- "Event appeared" ≠ correct properties / no dupes

**Possible:**

- Unit tests that `trackEvent` fires expected names
- Manual Mixpanel check after a known TestFlight session (correct)
- Optional API/JQL smoke: "did `readiness_viewed` fire for this distinct_id recently" — helper, not a hard gate

### Visual QA / accessibility / dark mode

**Partial.** Screenshot diffs on simulator possible for static screens. Outdoor contrast, real-device spacing, human taste = human. 5.3 accessibility feedback proved that.

### Upgrade / migration path

**Hard.** Needs seeded old-install state. Keep "install production over existing" as a **manual** Stop Ship item.

### Widgets

**Mostly not automatable** beyond "extension compiles." Refresh, stale, lock screen sizes = phone + TestFlight.

### Download from App Store and verify

**Not automatable before approval.** After approval: manual.

---

## Mapping 5.3 failures → automation

| Failure mode | Would have helped | Would not have helped |
|---|---|---|
| Version train closed (`5.3.1` already approved) | Version > ASC latest gate | More Jest alone |
| Home blank after onboarding | Unit test: focus path calls `setWeather`; or Maestro: Home shows temp after onboarding | "CI passed" |
| Timer / AppState stuck | Unit tests (already added — good pattern) | Full E2E of phone-call interrupt |
| Dev tools in prod | Assert prod env flags + prod-build smoke | Hoping to remember |
| Usability / contrast | Nothing replaces user feedback | "AI screenshot review" |

---

## Recommended tiers (do not boil the ocean)

### Tier 0 — hours, not days (do first)

1. `npm test` + `tsc --noEmit` as pre-push / pre-EAS gate  
2. Script: assert release config (version bump, prod flags, no TestFlight env in production profile)  
3. Stop Ship checklist remains **definition of done** — printable, mandatory  

### Tier 1 — days (next)

4. GitHub Action on PR → Jest + tsc  
5. On version tag → EAS build `testflight` (**not** App Review submit)  
6. One Maestro golden path: fresh → onboarding done → Home shows readiness (mock weather if needed)  

### Tier 2 — only if Tier 1 keeps failing you

7. Broader Maestro coverage  
8. Mixpanel smoke-query helper post-TestFlight  
9. EAS Workflow → Slack "run Stop Ship"  

**Do not start Tier 2 until Tier 0/1 exist.** No CI yet → device farm first is backwards.

---

## Explicitly NOT worth automating

- Fully unattended "green CI → App Store"
- Apple review
- "Feels good / no freezes" as a reliable gate
- Lock-screen widget QA
- "Resume marketing"
- Replacing fresh-install + upgrade TestFlight ritual

Those stay human. Correct boundary for a solo app with weather, location, and widgets.

---

## Pushback on the flow itself

The human flow is excellent. Adjustments:

1. **`--auto-submit`** — only after Stop Ship, never as the CI climax.  
2. **"Analytics verified"** — define a minimum event list + wait window; not "Mixpanel looks busy."  
3. **Two EAS builds per release** (testflight, then production candidate) — **not optional**. Fresh-install bugs show up on the build customers get.  
4. **Dev tools on vs off** — already solved via EAS profiles; automation should **assert** profile env, not invent a third mode.

---

## Bottom line

| Layer | Automate? |
|---|---|
| Compile / types / unit regressions | **Yes — do it** |
| Release config + version gates | **Yes — do it** |
| Build + TestFlight upload | **Yes** |
| Golden-path E2E (simulator) | **Maybe, after Tier 0** |
| Full Stop Ship checklist | **No — human** |
| App Review submit | **Manual on purpose** |
| Post–App Store sanity | **Manual** |

5.3 pain was not "not enough automation." It was **missing regression coverage for the bug class** (state not set after fetch) + **rushing or skipping the fresh-install production-candidate pass**. Automation should make those two things hard to skip — not replace judgment on ship day.

**Suggested build order when ready to implement:** (1) CI Jest + tsc → (2) release-config assert → (3) one Maestro golden path for post-onboarding Home → **stop until those are boring.**

---

## Related docs

- `documentation/gpt_project/07_TESTING_CHECKLIST.md` — per-release QA matrix  
- `documentation/gpt_project/06_RELEASES/` — changelogs  
- `documentation/gpt_project/14_KNOWN_ISSUES.md` — open defects / regression watch list  
- `eas.json` — `testflight` vs `production` env split  
- `documentation/TESTFLIGHT.md` — store / billing / smoke notes  
