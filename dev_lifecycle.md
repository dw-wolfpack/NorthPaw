# NorthPaw — Build & Release Lifecycle

> **Read this before touching a build.** Mistakes here can ship broken code to real users.

---

## TL;DR Decision Tree

```
1. Fast local iteration            →  npm run dev
2. Test feature in TestFlight      →  eas build --platform ios --profile testflight
3. Build production candidate      →  eas build --platform ios --profile production
4. Verify & Submit candidate       →  Test on device via TestFlight → Submit in App Store Connect
```

---

## The Complete Build & Deploy Workflow

### Step 1: Local Development
```bash
npm run dev
```
- `__DEV__` is `true`
- Developer Settings section is **VISIBLE**
- Analytics fire to console only
- Use for writing code, quick iteration, and local debugging

---

### Step 2: TestFlight Feature Build
```bash
eas build --platform ios --profile testflight
```
- Built with `"EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS": "true"`
- `autoIncrement` automatically bumps the iOS `buildNumber`
- App uploads to TestFlight
- Install via TestFlight on physical iPhone
- Developer Settings, Mixpanel toggle, review simulation, and debug triggers **ARE VISIBLE**
- Use this build to test features, mock weather, and verify analytics in a real compiled `.ipa` environment.

---

### Step 3: Production Candidate Build
```bash
eas build --platform ios --profile production
```
- Built with `"EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS": "false"`
- `autoIncrement` automatically bumps the iOS `buildNumber`
- App also uploads to TestFlight
- Install this production candidate via TestFlight on your device

---

### Step 4: Stop-Ship Verification & Apple Submission

Before submitting the production candidate build to Apple for review, perform this **Production Stop-Ship Check**:

#### 🛑 Production Stop-Ship Checklist:
- [ ] Install the exact production candidate build from TestFlight
- [ ] **Developer Settings absent** (Settings screen contains NO Developer Settings section)
- [ ] **Review simulation triggers absent** (No debug buttons for review prompt)
- [ ] **Analytics override absent** (No Mixpanel toggle in UI)
- [ ] **Build number matches** App Store Connect selection

Once all items pass:
1. Open **App Store Connect** → **NorthPaw**
2. Select the verified production build number
3. Submit for **App Store Review**

---

## Build Profiles (`eas.json`)

```json
{
  "build": {
    "testflight": {
      "distribution": "store",
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS": "true"
      }
    },
    "production": {
      "distribution": "store",
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS": "false"
      }
    }
  }
}
```

- **`autoIncrement: true`**: EAS automatically increments iOS build numbers for both `testflight` and `production` builds, ensuring every upload has a unique build number without manual `app.json` edits.

---

## Architecture & Code Guards

### Centralized Source of Truth (`lib/developer.ts`)
```ts
export function shouldShowDeveloperTools(): boolean {
  if (__DEV__) {
    return true;
  }
  return process.env.EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS === 'true';
}
```

### Component Guard (`components/DeveloperOnly.tsx`)
Every debug toggle, test button, or menu MUST be wrapped in `<DeveloperOnly>`:

```tsx
<DeveloperOnly>
  <DeveloperSettingsSection />
</DeveloperOnly>
```

**Strict Rule**: Never use `process.env.EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS !== 'false'` or `Boolean(...)` because `"false"` is a truthy string in JS. Only exact `=== 'true'` comparison is valid. Missing, blank, `"TRUE"`, `"1"`, or `"yes"` will return `false`.

---

## EAS Update Caution (OTA Updates)

> ⚠️ **Critical Caution for Expo Updates**:
>
> Public environment variables (`EXPO_PUBLIC_*`) are inlined into the JavaScript bundle at build time AND update publish time.
>
> If you publish an OTA update using `eas update` in the future:
> - **ALWAYS publish production channel updates with the production environment**:
>   ```bash
>   eas update --channel production --environment production
>   ```
> - **NEVER publish an update to the production channel from a preview or testflight profile**, as that would inline `"EXPO_PUBLIC_SHOW_DEVELOPER_TOOLS": "true"` into production devices.
