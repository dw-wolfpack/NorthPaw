# NorthPaw, TestFlight and App Store checklist

## Apple Developer

1. Create App ID `com.northpaw.app` with In-App Purchase capability.
2. In App Store Connect, create the app record (name, subtitle, privacy policy URL).
3. Create subscription group and products matching RevenueCat. Product IDs in `constants/Purchases.ts` are `northpaw_pro_monthly` / `northpaw_pro_annual` — create the same IDs in App Store Connect (or change the constants to match your chosen IDs).
4. Fill **App Privacy** questionnaire (data types collected; Purchases SDK may report diagnostics per RevenueCat settings).

## RevenueCat

1. Create project and iOS app; set bundle ID `com.northpaw.app`.
2. Add entitlement **`pro`** (must match `constants/Purchases.ts`).
3. Import products from App Store Connect; attach to offering **`default`** (or set a current offering).
4. Copy **iOS public API key** into `.env` as `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`.

## EAS

1. Run `npx eas-cli login` and `npx eas init` (replace placeholder `extra.eas.projectId` in `app.json` if you use managed project linking).
2. **Development device build:** `npx eas build --profile development --platform ios`
3. **TestFlight build:** `npx eas build --profile production --platform ios` then `npx eas submit --platform ios` (after configuring submit section or use Transporter).

## Review notes (suggested)

- Educational offline reference for hikers with dogs; not medical or veterinary advice.
- Camera used only for optional QR scanning to open in-app content; no photo storage.
- Subscriptions unlock additional regional lesson packs (digital content).

## Smoke tests before submit

- Cold open, browse Library and open a free-pack card offline (airplane mode).
- Open a Pro pack → paywall; restore with sandbox Apple ID after a test purchase.
- Scan a QR encoding `northpaw://card/heat-stress-signals` (development build). Legacy `trailready://` links still open the same routes.
