# 01 — Product Vision

> The North Star document. This changes rarely. If a decision here changes, it deserves a dated entry in `12_DECISIONS.md`.

Last updated: 2026-08-01

---

## Mission

**NorthPaw exists to help dog owners make better outdoor decisions through personalized, privacy-first technology.**

## Vision

Help dog owners make better outdoor decisions through personalized, privacy-first tech.  so more dogs can live longer, healtheir, happier, lives.  

Confidence for every adventure everyday 

#### Long-Term Ambition
A world where no dog suffers a preventable paw burn, heatstroke, or bad outing because their owner didn't know better. NorthPaw becomes the thing owners check before they grab the leash — every walk, every day, without thinking about it.  

NorthPaw becomes the trusted companion dog owners check before every walk, hike, road trip, and outdoor adventure.

#### Founder Vision
NorthPaw is proof that thoughtful, trustworthy software built by one person can improve the lives of millions of dogs and the people who love them.


## The One Question

Every screen, every feature, every line of copy should help answer:

> **What should I do before taking my dog outside?**

A user should be able to launch the app and answer *"Is it safe for my dog right now, and what do I need to grab?"* in **under 5 seconds**.

---

## The Product Compass (Decision Filters)

Before building anything, ask two questions:

1. **Does this help dog owners make a better outdoor decision?**
2. **Does this help grow my user base?**

If the answer to both is no → don't build it.
If the answer to #1 is yes → it's probably core, and probably free.
If only #2 is yes → scrutinize it hard; growth that doesn't serve the mission erodes trust.

### The Weekly North Star

Every week ask:

- Did I make NorthPaw better?
- Did more people discover it?

Everything else is secondary.

---

## Who NorthPaw Is For

- **Dog owners who walk their dogs** and want a fast, trustworthy go/no-go answer before heading out.
- **Owners of heat-sensitive dogs** — flat-faced breeds (pugs, bulldogs), double-coated breeds (huskies, shepherds), seniors, and puppies — who face real physiological risk in ordinary weather.
- **Urban and suburban owners** walking on pavement, asphalt, and artificial turf — surfaces that can cause contact burns at air temps most people consider "nice out."
- **Weekend adventurers** — trail, beach, and park people who want preparedness (what to bring) bundled with safety (is it safe).
- **Dog owners who build their lives around adventures with their dogs** — All adventures need a checklist, so the growth is to cover everything.  from summer to winter and beyond. 
- **Privacy-conscious users** who want personalization without accounts, cloud profiles, or their dog's data leaving the device.

## Who NorthPaw Is NOT For

- **People looking for a map or navigation app.** AllTrails and Gaia own the map. NorthPaw wins *before and beside* the hike, not on it.
- **People looking for veterinary advice.** NorthPaw is educational and non-diagnostic, always. It never replaces a vet.
- **People looking for a pet social network.** No feeds, no followers, no moderation burden.
- **People who want tele-vet, diagnosis, or treatment claims.** Hard anti-goal — it undermines trust and invites regulatory risk.
- **General weather checkers.** Apple Weather already exists. NorthPaw interprets weather *for your specific dog*; it doesn't compete on forecast display.

---

## Core Principles

### 1. The "Under 5-Seconds" Safety Rule
Cognitive load must be near zero at the moment of decision. High-contrast hero elements, progressive disclosure, and no forced density. Technical detail lives behind "Why this score?" — never at first glance.

### 2. Trust Through Transparency
NorthPaw uses transparent physics models and breed-specific biological constants — not probabilistic black-box AI. Same inputs → same outputs, always auditable. No expensive LLMs; this keeps the app free to operate and worthy of trust.

### 3. Transparent Uncertainty (The Uncertainty Moat)
Never hide data gaps — label them. "Sensor Status: Fair. Using regional estimates." Transparent uncertainty beats false precision. When the model is unsure, the UI says so and the output stays conservative.

### 4. Local-First Privacy
Dog profile, photos, logs, and reminders live on the device. Coordinates go only to weather providers (api.weather.gov / Tomorrow.io). No accounts required. This is a feature, not a limitation — say it plainly.

### 5. Safety Over Style
If any visual effect conflicts with rapid risk comprehension, remove the effect. Motion and blur exist to build trust and delight — never at the cost of readability. 

### 6. Educational, Non-Diagnostic Framing
Always suggestive, never prescriptive-medical. "Consider a shaded route" — never "your dog has heat stress." Maintain the non-veterinary guardrail in every line of copy.

### 7. Free Core, Paid Insight
The safety answer is free forever — current readiness, pavement estimates, breed adjustments, safety guidance. No restrictions. What can be paid is *insight about your specific dog over time* (history, tolerance trends, patterns) — selling insight, never access to safety.

### 8. Quiet by Default
No engagement spam, no shame mechanics, no dark patterns. Notifications are prescriptive and deadline-oriented ("window closes at X"), opt-in, and easy to control. Streaks celebrate; they never guilt.

### 9. Build With the Community
Listen before you build. Every feature should solve a real user problem. Ship small, ship often, respond to everyone. Whippet and cobblestone exist because users asked.

### 10. Focus on What Compounds
Can't control: downloads, virality, press, App Store featuring.
Can control: shipping consistently, talking to users, responding to feedback, improving the product, building trust.
Trust compounds. Small wins become big wins.

---

## Success Looks Like (Milestone North Stars)

- ☐ First user says NorthPaw prevented an unsafe walk
- ☐ First user says NorthPaw changed how they plan adventures
- ☐ First dog owner says they now check NorthPaw before every walk
- ☐ First veterinarian recommends NorthPaw to clients
- ☐ First shelter includes NorthPaw in adoption packets
- ☐ First "I've used this every day for a year."
- ☐ First stranger recommended NorthPaw to someone else
- ☐ First 100 weekly active users
- ☐ 1,000 users → 10,000 users

## The Metric That Matters

**Weekly Safety Checks (WSC)** — a unique user who views their dog's readiness screen at least once in a calendar week (`readiness_viewed`).

If this number grows, it means more owners are making better outdoor decisions with NorthPaw. Every other metric exists to support this one.

## What NorthPaw Will Never Become

NorthPaw will never become:

• A social network
• A surveillance platform
• An advertising business
• A generic weather app
• A veterinary diagnosis tool
• An AI chatbot pretending certainty