# What We've Built: NorthPaw Feature & Architecture Guide

This document outlines the current production features, core algorithms, and client architecture of **NorthPaw**.

---

## 📱 Core Features

### 1. Home Dashboard & Cockpit
The Home screen serves as a high-fidelity dashboard to help dog owners prepare for safe outings:
*   **NorthPaw Index (NPI) Dial**: A real-time safety scale (0.0 to 10.0) illustrating canine heat and systemic stress risk under local weather conditions.
*   **Pavement Temperature Gauge**: Real-time estimations of road temperature categorized into safety bands (Safe, Warm, Hot, Danger).
*   **Optimal Walk Windows**: Daily AM/PM walk planner that displays the safest outdoor slots based on simulated road temperatures and atmospheric conditions.
*   **Surface Type Selector**: Allows users to dynamically switch between pavement materials to evaluate local risk.

### 2. Specialized Thermodynamic Simulation
Canine heat stress and pavement burns are predicted using localized formulas rather than raw air temperatures:
*   **Road Temperature Physics**: Estimates pavement heat using solar intensity (calculated via geographic latitude, declination, cloud attenuation, and hour angle), convective cooling (convective air-temp scale), wind dissipation, and material multipliers.
*   **Canine Heat Stress Index (CHSI)**: Incorporates humidity as an additive risk factor to model how efficiently a dog cools down through panting.
*   **Cobblestone Pavement Support**: Thermodynamic calculation specifically modeled for cobblestone surfaces.

### 3. Smart Onboarding & Calibration
A personalized, science-focused onboarding flow designed to calibrate the safety model to each dog:
*   **Snout Profile Calibration**: Accounts for brachycephalic (flat-faced) risk factors.
*   **Biology & Coat Modeling**: Considers weight, coat thickness (e.g., double coat), and fur color.
*   **Activity Baseline**: Adjusts walk window suggestions based on the dog's usual energy level.
*   **Calculation Pulse**: Trust-building animation showing the active computational steps of the safety model before revealing the profile's score.
*   **Morning Brief Preview**: Subscribes users to custom-scheduled morning safety notifications.

### 4. Interactive Safety Content
*   **Checklist Library**: Ready-to-use checklist templates (e.g., *Hot Weather Outings*, *Cold Weather*, *Tick Checks*) with custom packing guidelines and step progress.
*   **Educational Packs**: Short articles covering outdoor safety topics (hydration, heat exhaustion signs, winter paw care).
*   **QR Scanner**: Integrated camera scanner supporting the direct activation of field cards and checklists.

### 5. Outing Memory & Care Reminders
*   **Outing Log**: Allows users to record completed outdoor activities, log packing lists, and attach optional photos saved locally.
*   **Care Reminders**: Custom reminder schedules for critical cadence items such as flea, tick, and heartworm prevention, with detailed completion history.
*   **Native Share & Support**: Direct app sharing via native sheet utilities and standard support mail integration.

---

## 🛠️ Architecture & Technology Stack

*   **Framework**: Expo v52 (React Native) with Expo Router for robust file-system routing.
*   **Language**: TypeScript (fully typed, zero-warning compilation).
*   **State Management**: React Context APIs for dog profiles, weather data, and settings.
*   **Persistence**: Local-first data architecture using `expo-file-system` for logs and telemetry identifiers, and `AsyncStorage` for onboarding checkpoints and cache flags.
*   **Styling & UI**: Tailwind CSS coupled with custom design tokens for glassmorphism panels, rim lighting borders, and high-contrast styling.
*   **Haptics**: Centralized haptics controller providing tailored feedback (selection changes, warning pulses, success confirmations) across iOS and Android.
