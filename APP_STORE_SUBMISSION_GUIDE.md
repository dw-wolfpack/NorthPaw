# NorthPaw App Store Submission & Listing Guide

This guide details everything you need to prepare, fill out, and configure in **App Store Connect** to submit **NorthPaw** for public release on the iOS App Store.

---

## 1. App Store Metadata Checklist

Prepare this copy before editing your listing in App Store Connect.

### App Information
* **App Name**: `NorthPaw`
* **Subtitle (Max 30 chars)**: `Safe Dog Outings & Guides` or `Smart Dog Outings & Checklists` (Clear and search-friendly).
* **Primary Category**: `Utilities` or `Reference`
* **Secondary Category**: `Lifestyle` or `Travel`

### Contact & Legal Links
* **Support URL**: `https://northpaw.nextstepsbeyond.online/`
* **Privacy Policy URL**: `https://northpaw.nextstepsbeyond.online/privacy/`

### App Description (Max 4,000 chars)
Use a clean, inviting description highlighting the companion vibe and safety checks:
```text
Step outside with confidence. NorthPaw helps you plan safe, comfortable outings for your dog by taking the guesswork out of temperature, weather, and trail prep. 

Every dog is unique. NorthPaw customizes safety guidelines based on your dog's breed, coat type, fur color, and snout length—delivering personalized walk windows and routine checklists.

Key Features:
- Personalized Outing Guidelines: Tailored temp checks based on your dog’s profile.
- Dynamic Checklists: Pack lists that adapt to your dog’s outings and local weather.
- Field Guide Reference: Offline cards detailing hot asphalt thresholds, toxic plants, and ticks.
- Daily Morning Brief: Schedule an on-device alert to check conditions before your first walk.
- Privacy First: No accounts, no sign-ups, and no background location tracking. Your data stays on your device.

*Disclaimer: NorthPaw is for general educational and reference purposes only. It does not provide veterinary, emergency medical, or legal advice.*
```

### Keywords (Max 100 chars, comma-separated, no spaces)
```text
dog,trail,hike,weather,paw,heat,checklists,safety,temp,outings,walk,routine,reference,pack,guide,outdoor
```

---

## 2. App Review Information (For Reviewers)

When you submit the app, Apple reviewers require verification info:
* **Sign-in Required**: `No` (Uncheck this box. NorthPaw has no login wall, so reviewers can open and test it immediately).
* **Contact Information**: Enter your name, email, and phone number.
* **Notes**: Add a short note explaining the app's offline/local storage architecture:
  > *"NorthPaw is a local-first application designed for outdoor reference. It stores all dog profiles and checklist data on-device using local database systems and does not require user accounts. It reads local weather when open to calculate temperature safety and supports local scheduled alerts for care reminders."*

---

## 3. Required App Screenshots

Apple requires screenshots for two main phone sizes. You can capture these directly in the iOS Simulator by pressing the **Camera icon** in the Simulator toolbar, or taking standard screenshots on physical devices.

### Dimensions Required:
1. **6.5-Inch Display** (e.g., iPhone 11 Pro Max / iPhone 15 Pro Max)
   * Size: `1284 x 2778` pixels or `1242 x 2688` pixels.
2. **5.5-Inch Display** (e.g., iPhone 8 Plus / iPhone 7 Plus)
   * Size: `1242 x 2208` pixels.

### Recommended Screen Captures:
* **Screenshot 1 (Home)**: The main Ready Screen showing the dog's name, the NPI Bezel Dial ring, and the current temperature.
* **Screenshot 2 (Timeline)**: Scrolled down to show the thermodynamic asphalt/turf timeline and walk windows.
* **Screenshot 3 (Library)**: The Field Guide card packs (Trail Basics, Summer Hazards, Cold Prep).
* **Screenshot 4 (Checklists)**: A custom checklist showing task checkboxes (e.g., "Water bowl", "Leash").
* **Screenshot 5 (Settings/Reminders)**: The clean settings list and active care reminders.

---

## 4. App Store Connect Submission Steps

Once build `5` finishes processing in your TestFlight dashboard:

1. **Link the Build**:
   * Go to the **App Store** tab -> **1.0.0 Prepare for Submission**.
   * Scroll down to **Build**, click the **+** icon, select **Build 5**, and click **Done**.
2. **Set App Age Rating**:
   * Click **Age Rating** and answer the questionnaire. Since the app is educational, select "No" to all content questions (violence, mature themes) to get a `4+` rating.
3. **Configure App Privacy**:
   * Go to the **App Privacy** section in the left sidebar.
   * Under **Data Collection**, select **No, we do not collect data from this app** (since all telemetry is anonymous event totals, and no personal identifying info, location coordinates, or profiles are uploaded or linked to users).
4. **Set Pricing and Availability**:
   * Under **Pricing and Availability**, select **Free** (since the base app is completely free, and Pro purchases are coming in a future update).
5. **Submit**:
   * Once screenshots are uploaded and descriptions are filled out, click **Save** at the top right, then click **Submit for Review**.

---

## 5. Marketing & Promotion Playbook

Here are high-impact, low-cost marketing strategies to drive downloads for NorthPaw:

### 1. Real-World QR Code Flyers (Trailheads & Parks)
Since NorthPaw focuses on outdoor safety, put marketing where your audience is:
* **Community Boards**: Print flyers to pin on community bulletin boards at local dog parks, pet shops, and trail entrances.
* **Catchy Wording**: Use a headline like: *"Is the ground too hot for their paws? Scan to double-check local pavement safety guidelines."*
* **QR Codes**: Place a large QR code in the center linking directly to your App Store download page.

### 2. Social Media Micro-Demos (Instagram, TikTok, YouTube Shorts)
Create quick, highly shareable video content:
* **The Hand Test Demo**: Film yourself placing your hand on hot pavement for 7 seconds, then open the NorthPaw app to show how it calculates the thermodynamic temperature and safety window.
* **Breed Spotlights**: Create clips explaining how flat-faced (brachycephalic) dogs absorb heat differently and show how NorthPaw customizes safety alerts based on snout profile and coat color.
* **Trail Gear Checks**: Show the dynamic checklists in action as you pack water, boots, and towels before a hike.

### 3. Hyper-Local Community Outreach
Leverage existing communities of dog owners:
* **Local Hiking Groups**: Join local Facebook groups or subreddits focused on dog walks or hiking (e.g., "Hiking with Dogs in [Your City]").
* **Highlight the Privacy Model**: Share the app as a free tool built by a fellow dog owner to keep pups safe on trails. Emphasize that the app is completely free, has no ads, requires no login, and does not track location in the background.

### 4. Partnerships with Local Pet Businesses
Build relationships with local small business owners:
* **Groomers & Pet Boutiques**: Leave business-card-sized flyers at checkout counters of local groomers, dog daycares, and pet boutiques.
* **Value Add**: Pitch the app to them as a free, value-add safety checklist tool they can recommend to their customers for summer or winter outings.

### 5. Website Content SEO
Drive search traffic to your landing page:
* Write simple, informative articles on your website (such as "What temperature is asphalt too hot for dogs?") and link them directly to the App Store download buttons.

