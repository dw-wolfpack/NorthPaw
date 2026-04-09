# NorthPaw: MVP launch checklist

Assumes MVP = **TestFlight-ready**, iOS-first, core loop works: library → checklists → optional Pro / outing log.

## Must-have before MVP

- [ ] **Store & billing:** RevenueCat **production** iOS API key; App Store Connect **subscription products** + entitlement ids match app code; prices / subscription group metadata; verify **sandbox purchases** on a **development build** (not Expo Go).
- [ ] **Legal / listing:** Public **Privacy Policy** URL (on-device data, photos, optional location: policy must match behavior). **Support** URL or contact. App Store **screenshots** and **description** aligned with dog-life + trails positioning.
- [ ] **Build & release:** EAS or Xcode **production** profile; version / build numbers; icons & splash on real device; **`app.json` / native** permission strings for camera (QR), photo library, location. Confirm they ship in the binary after `prebuild` if used.
- [ ] **Smoke-test matrix (device):** Fresh install → offline library read → checklist boxes persist → **Clear all** (checks + outing logs for that list) → Pro: save outing with photo + GPS (allow + deny paths) → **Restore purchases** → QR opens card / pack / checklist.
- [ ] **Web (optional for iOS MVP):** If not promised in listing, treat web as non-blocking; if promised, run the same critical paths in browser.
- [ ] **Content pass:** Review `NorthPaw/assets/content/library.json`: typos, disclaimers, **free vs Pro** boundaries match paywall copy.

## Strongly recommended

- [ ] **Empty / error states:** RevenueCat or network failures; invalid QR; clear user messaging (no blank screens).
- [ ] **Data expectations:** Outing data is **device-local only**. Short note in Settings (or onboarding) so users know there is no cloud backup in MVP.
- [ ] **Accessibility:** VoiceOver / focus on paywall, checklist rows, outing form. At least no critical blockers.

## Not required for MVP

- Global “all trails” database or deep maps integration
- Accounts, sync, social, cloud photo backup

## Notes

- **Expo Go** does not validate real IAP. Use **dev client** + StoreKit sandbox for subscription testing.
- Revisit Android scope separately if launch is **iOS-only** for v1.
