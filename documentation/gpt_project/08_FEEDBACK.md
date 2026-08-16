# 08 — Feedback

> Every meaningful piece of user feedback, where it came from, what it changed, and what happened because of it.
>
> This document is NorthPaw's institutional memory. Product direction should emerge from repeated patterns—not from assumptions.
>
> **Statuses:** NEW → QUEUED → IN PROGRESS → SHIPPED / DONE / FUTURE / DECLINED

**Last updated:** 2026-08-01

---

# Feedback Philosophy

NorthPaw is built with its community.

Every feature should solve a real problem experienced by a real dog owner.

Not every request gets built.

Every request deserves to be heard.

When possible:

1. Respond to the person.
2. Ship the improvement.
3. Tell them it shipped.

That final step builds trust far beyond the feature itself.

---

# Priority Definitions

| Priority | Meaning |
|-----------|---------|
| **P0** | Safety issue or incorrect guidance |
| **P1** | Major usability or accessibility issue |
| **P2** | Valuable feature request |
| **P3** | Nice-to-have improvement |

---

# Active / Recent Feedback

| User | Source | Date | Feedback | Priority | Status | Notes |
|------|--------|------|----------|----------|--------|------|
| Gabriel | Email | Jul 2026 | Accessibility: photo backgrounds reduce readability | P1 | **DONE** | Drove the complete 5.3 accessibility redesign. Removed translucent image backgrounds on utility screens. |
| Gabriel | Email | Jul 2026 | Contrast too low throughout the app | P1 | **DONE** | WCAG AAA color audit, typography improvements, solid cards, spacing refinements. |
| Gabriel | Email | Jul 2026 | Improve spacing and visual hierarchy | P2 | **DONE** | Home screen reordering, improved section spacing, cleaner utility layout. |
| Karel | Email | Jul 2026 | 7-second Hand Test timer could freeze | P0 | **DONE** | Complete timer lifecycle rewrite with AppState protection and regression tests. |
| Karel | Email | Jul 2026 | Air Quality Index (AQI) | P2 | **FUTURE** | Planned as part of the 6.0 Decision Engine expansion. |
| Karel | Email | Jul 2026 | Multiple dogs | P2 | **FUTURE** | Companion roadmap feature with per-dog switching. |

---

# Historical Feedback (Shipped)

| User | Source | Date | Feedback | Priority | Status | Notes |
|------|--------|------|----------|----------|--------|------|
| Kathy Lafreniere | Email | Jun 2026 | Shared NorthPaw with friends and family after using the app | P2 | **DONE** | First explicit user advocacy via email. Validated word-of-mouth potential. |
| SEA BARON | Email | Jul 2026 | Weather stopped updating | P0 | **DONE** | Led to weather refresh fixes. User later confirmed update resolved the issue. |
| App Review users | App Store | Jun 2026 | Whippet missing from breed catalog | P2 | **DONE** | Shipped in 4.1. First user-requested breed. |
| Historic-city owners | Email | Jun 2026 | Cobblestone surface support | P2 | **DONE** | Added new surface multiplier (0.85). |
| Early users | App Store | Jun 2026 | Cool sunny days produced false caution ratings | P0 | **DONE** | Algorithm recalibration to guarantee Green on genuinely safe days. |
| Multiple users | In-App | Jun 2026 | Breed catalog too small | P2 | **DONE** | Expanded from 24 to 65+ breeds. Mixed Breed pinned. |
| Google Sheet requests | In-App | Jun 2026 | Havanese, Wheaten, Mini Poodle, Greater Swiss Mountain Dog | P2 | **DONE** | Released in 4.2. |
| Users | In-App | Jun 2026 | Edit breed after onboarding | P2 | **DONE** | Added Dog Profile editing. |
| Users | In-App | Jun 2026 | Feedback form felt generic | P2 | **DONE** | Rewritten as "Help Shape NorthPaw" with friendlier UX. |
| Community | In-App | Jul 2026 | Maltipoo, Old English Sheepdog, Aussiedoodle, Great Pyrenees, American Eskimo, Standard Schnauzer | P2 | **DONE** | Released in 5.3. |
| Jennifer Rutherford | Email | Jul 2026 | Android beta testing, Great Pyrenees breed request, winter ideas | P2 | **IN PROGRESS** | Helped validate Android onboarding and winter roadmap. |
| Chuck | Android Beta | Jul 2026 | Extensive Android QA across reminders, timer, breeds, navigation | P0 | **DONE** | First power tester. Multiple bugs fixed directly from testing. |


---

# Demand Signals

*(Updated weekly using Google Sheets feedback + Mixpanel telemetry.)*

| Request | Count | First Seen | Planned Release |
|----------|------:|------------|-----------------|
| AQI / Air Quality | [count] | Jul 2026 | 6.0 |
| Multiple Dogs | [count] | Jul 2026 | 6.0 |
| Lock Screen Widgets | [count] | Jul 2026 | 5.4 |
| Apple Watch | [count] | [date] | Stretch Goal |
| Winter Risk Model | [count] | [date] | 6.0 |
| Salt / Ice Melt | [count] | [date] | 6.0 |
| Pollen | [count] | [date] | 6.0 |
| Smoke | [count] | [date] | 6.0 |
| Breed Requests | Running | Ongoing | Batched every release |

---

# Patterns Worth Watching

## Accessibility beats novelty

The biggest improvements in 5.3 were not new algorithms.

They were:

- readability
- spacing
- typography
- accessibility
- reducing friction

Users notice polish before physics.

## Users Want To Help

A surprising number of users don't just report bugs.

They volunteer:

• Android testing
• Accessibility reviews
• Veterinary introductions
• Family referrals

Treat early users like collaborators, not customers.

---

## Decision Engine demand is emerging

Users consistently ask for:

- AQI
- smoke
- pollen
- winter
- salt

This validates expanding NorthPaw from a pavement safety app into a complete outdoor decision engine.

---

## Household features cluster together

Requests naturally group into:

- multiple dogs
- spouse / walker sharing
- history
- recurring patterns

These all support the future Companion tier.

---

## Breed requests never stop

Breed requests arrive steadily.

Rather than treating them as interruptions, NorthPaw batches additions into nearly every release.

---

## Trust compounds

Many of the highest-value emails weren't asking for new features.

They were asking for:

- confidence
- readability
- clarity
- transparency

Trust is becoming the product moat.

---

# Lessons Learned

## SEA BARON (Reliability)

Reliability creates advocates.

A bug report became a success story because the user returned after the fix simply to say:

"I think your last update fixed it."

Following up after fixes matters.

## Gabriel (Accessibility)

Major lesson:

Visual polish is not accessibility.

Decorative imagery should never compete with safety information.

When readability and aesthetics conflict:

**Readability wins.**

This lesson fundamentally reshaped the visual direction of NorthPaw beginning with Release 5.3.


---

## Karel (Reliability)

Major lesson:

Lifecycle bugs matter.

A utility app must always provide an escape path.

Every timer, modal, and navigation flow should safely recover from interruptions such as:

- locking the phone
- backgrounding
- repeated taps
- unexpected dismissal

This resulted in stronger lifecycle handling across the application.

---

# Declined Requests

| Request | Reason |
|----------|--------|
| Social feed | Does not improve outdoor decisions. Creates moderation burden and shifts focus away from utility. |
| Veterinary diagnosis | Conflicts with educational positioning and regulatory guardrails. |
| Full trail navigation | Existing products (Gaia, AllTrails) already own this space. NorthPaw complements them rather than competing with them. |
| Required user accounts | Violates the local-first privacy philosophy. |

---

# Unexpected Wins

## Release 5.3

Users cared dramatically more about:

- readability
- spacing
- accessibility
- trust
- polish

than they did about new algorithms.

That reinforced an important product lesson:

**People must trust what they see before they'll trust how it's calculated.**

## Veterinary Clinics Want To Help

The first outreach emails resulted in clinics volunteering to distribute NorthPaw materials to clients.

This validated veterinary partnerships much earlier than expected.

---

# Feedback Principles

Every request falls into one of four buckets.

## Safety

Does this reduce the chance of harm?

Highest priority.

---

## Trust

Does this increase confidence in NorthPaw?

Second priority.

---

## Usability

Does this reduce friction?

Often produces more value than adding entirely new features.

---

## Expansion

New capabilities.

Only build these once Safety, Trust, and Usability are healthy.

---

# Weekly Ritual

## Monday

- Read every App Store review.
- Read every email.
- Review every Google Sheets submission.
- Update this document.
- Update the backlog.

---

## Thursday

Respond to everyone.

Even if a feature won't be built, acknowledge the request.

---

## After Shipping

Whenever a user's request ships:

- Tell them.
- Thank them.
- Close the loop.

Those conversations build loyalty far beyond the feature itself.

---

# Long-Term Goal

The best features in NorthPaw should eventually trace back to a conversation with a real dog owner.

The product should evolve because people trusted it enough to tell us what was missing.