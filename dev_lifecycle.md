# NorthPaw — Build & Release Lifecycle

> **Read this before touching a build.** Mistakes here can ship broken code to real users.

---

## TL;DR Decision Tree

```
Making a code change?
  └─ Test locally first       →  npm run dev
  └─ Need to validate on device like a real user?  →  eas build --profile preview
  └─ Ready to ship?           →  eas build --profile production --auto-submit
```

---

## The Three Environments

### 1. Local Development
```bash
npm run dev
```

| Setting | Value |
|---------|-------|
| Dev settings visible | ✅ YES |
| Analytics | 🔇 Muted (logged to console only) |
| Installed via | QR code → Expo Go |
| Reflects prod behavior | ❌ NO — use this for fast iteration only |

**Use for:** Writing code, debugging UI, quick iteration.  
**Do NOT use for:** Validating prod behavior. Dev settings will always show here. That's expected.

---

### 2. Preview (TestFlight Internal)
```bash
eas build --platform ios --profile preview
```

| Setting | Value |
|---------|-------|
| Dev settings visible | ❌ NO — hidden (matches prod) |
| Analytics | ✅ Live (Mixpanel events fire for real) |
| Installed via | TestFlight (internal testers only) |
| Reflects prod behavior | ✅ YES — byte-for-byte identical to production |

**Use for:** Validating a feature before shipping. What you see here is exactly what users see.  
**Checklist before shipping:**
- [ ] Settings → scroll down → Developer Settings section is **completely gone**
- [ ] Version number matches `app.json`
- [ ] Weather loads with real data
- [ ] Privacy Policy and Support links open correctly
- [ ] Analytics events fire in Mixpanel dashboard (not just console)

---

### 3. Production (App Store)
```bash
eas build --platform ios --profile production --auto-submit
```

| Setting | Value |
|---------|-------|
| Dev settings visible | ❌ NO — hidden |
| Analytics | ✅ Live |
| Installed via | App Store / TestFlight |
| Reflects prod behavior | ✅ YES |

**Use for:** Shipping to real users. The `--auto-submit` flag uploads AND submits for App Store review automatically.

---

## Versioning Rules

> ⚠️ Get these wrong and Apple will reject your submission.

### `version` (Marketing Version — shown to users)
- Format: `MAJOR.MINOR.PATCH` (e.g., `5.3.1`)
- **Must increase** for every new App Store submission
- Apple ties this to a "train" — once a version is approved, you **cannot** submit another build under the same version number
- Hotfixes = bump `PATCH` (5.3.0 → 5.3.1)
- New features = bump `MINOR` (5.3.x → 5.4.0)
- Major redesigns = bump `MAJOR`

### `buildNumber` (Internal Build — not shown to users)
- Format: any integer as a string (e.g., `"1"`)
- **Must increase within the same version** (5.3.1 build 1, then 5.3.1 build 2 if you need to resubmit)
- **Resets to `"1"` when you bump the version** (5.3.1 build 1, 5.4.0 build 1 — this is valid)

### In `app.json`:
```json
{
  "expo": {
    "version": "5.3.1",
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

---

## Release Checklist

### Before every production build:
- [ ] Run `npx jest lib/__tests__/` — all tests must pass
- [ ] Confirm version and buildNumber in `app.json` are correct
- [ ] Build preview first: `eas build --platform ios --profile preview`
- [ ] Install preview in TestFlight, run through the checklist above
- [ ] Only then run the production build

### After submitting to App Store Connect:
- [ ] Build appears in TestFlight within ~15–30 min
- [ ] Apple review typically takes 15 min – 24 hrs
- [ ] Re-enable App Store availability if you had removed it

---

## Hotfix Procedure

When something is broken in production:

1. **Remove from sale immediately** (limits new downloads):
   - App Store Connect → Pricing and Availability → Manage Availability → deselect all → Save

2. **Fix the code** in the codebase

3. **Bump the version** in `app.json`:
   - Patch fix: `5.3.0` → `5.3.1`, buildNumber back to `"1"`

4. **Run tests**: `npx jest lib/__tests__/`

5. **Build and submit**:
   ```bash
   eas build --platform ios --profile production --auto-submit
   ```

6. **Install via TestFlight** once it appears (~15 min), verify the fix

7. **Re-enable App Store availability** once confirmed

---

## The Dev Settings Guard

> This is a P0 concern. Dev settings in production = bad.

Controlled by `isTestflightOrDevBuild()` in `lib/analytics.ts`.

**The rule is opt-in / default-deny:**
- Shows dev settings ONLY when `__DEV__ === true` (local) OR `EXPO_PUBLIC_IS_TESTFLIGHT=true`
- Everything else → hidden
- The `preview` profile sets `EXPO_PUBLIC_IS_TESTFLIGHT=false` intentionally so it matches prod

**If you ever need to add a new dev-only feature:** wrap it in `{isTestflightOrDevBuild() && ...}`.  
**Never** add dev-only UI without this guard.

The guard has a regression test suite: `lib/__tests__/devSettingsGuard.test.js` — it will fail if the guard is broken.

---

## Common Errors & Fixes

### "The train version X.X.X is closed for new build submissions"
Apple already approved this version. **Bump the version number** (e.g., 5.3.0 → 5.3.1) and rebuild.

### "Build number must be higher than previous"
You're resubmitting under the same version. **Bump buildNumber** (e.g., "1" → "2").

### Dev settings showing in production
Check `isTestflightOrDevBuild()` in `lib/analytics.ts`. It must default to `false`. Run `npx jest lib/__tests__/devSettingsGuard.test.js` to verify.

### App not appearing on App Store after approval
Check App Store Connect → Pricing and Availability → make sure territories are enabled.
