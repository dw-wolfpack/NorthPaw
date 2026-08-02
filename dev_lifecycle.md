# NorthPaw — Build & Release Lifecycle

> **Read this before touching a build.** Mistakes here can ship broken code to real users.

---

## TL;DR Decision Tree

```
Making a code change?
  └─ Test locally first                   →  npm run dev
  └─ TestFlight internal test build       →  eas build --platform ios --profile testflight
  └─ App Store production release         →  eas build --platform ios --profile production --auto-submit
```

---

## Build Profiles (`eas.json`)

Developer features are controlled by one single, strict compile-time flag: `EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS`.

### 1. Local Development (`npm run dev`)
- `__DEV__` is `true`
- Developer Settings section is **VISIBLE**
- Analytics fire to console

### 2. TestFlight Profile (`eas build --platform ios --profile testflight`)
- `EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS` = `"true"`
- Developer Settings section is **VISIBLE** for internal testing
- Upload to App Store Connect / TestFlight internal testers

### 3. Production Profile (`eas build --platform ios --profile production --auto-submit`)
- `EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS` = `"false"`
- Developer Settings section is **IMPOSSIBLE / HIDDEN BY DEFAULT** (`<DeveloperOnly>` renders `null`)
- Uploads and submits to App Store Review automatically

---

## Architecture & Code Guards

### `lib/developer.ts`
Centralized single source of truth:

```ts
export function shouldShowDeveloperTools(): boolean {
  if (__DEV__) {
    return true;
  }
  return process.env.EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS === 'true';
}
```

### `<DeveloperOnly>` Wrapper Component (`components/DeveloperOnly.tsx`)
Every debug toggle, menu, or test button MUST be wrapped in `<DeveloperOnly>`:

```tsx
<DeveloperOnly>
  <DeveloperSettingsSection />
</DeveloperOnly>
```

**Strict Rule**: Never use `process.env.EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS !== 'false'` or `Boolean(...)` because `"false"` is a truthy string in JS. Only exact `=== 'true'` comparison is valid.

---

## Pre-Release Checklist

### Before every production build:
- [ ] Run `npx jest lib/__tests__/` — all test suites must pass
- [ ] Run `npx tsc --noEmit` — 0 TypeScript errors
- [ ] Verify `app.json` version and buildNumber are bumped
- [ ] Build testflight first: `eas build --platform ios --profile testflight`
- [ ] Verify TestFlight build on physical device
- [ ] Run production build: `eas build --platform ios --profile production --auto-submit`
- [ ] **Manual Stop-Ship Verification**: Install production candidate build from TestFlight and verify Settings contains **NO** developer controls.

---

## Hotfix Procedure

When something is broken in production:

1. **Remove from sale immediately** (limits new downloads):
   - App Store Connect → Pricing and Availability → Manage Availability → deselect all → Save

2. **Fix the code** in the codebase

3. **Bump the version** in `app.json`:
   - Patch fix: `5.3.0` → `5.3.1`, `buildNumber` to `"1"`

4. **Run tests**: `npx jest lib/__tests__/` & `npx tsc --noEmit`

5. **Build and submit**:
   ```bash
   eas build --platform ios --profile production --auto-submit
   ```

6. **Install via TestFlight** once it appears (~15 min), verify the fix

7. **Re-enable App Store availability** once approved by Apple

---

## Release Gate Test Suite

Automated regression suite: `lib/__tests__/devSettingsGuard.test.js`
Guarantees that:
- `__DEV__` = true → true
- `"true"` → true
- `"false"` → false
- `undefined` / missing / `null` / `""` → false
- `"TRUE"`, `"True"`, `"1"`, `"yes"` → false
