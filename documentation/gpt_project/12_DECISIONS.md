# 12 — Decisions

> Every important product, engineering, design, and business decision.
>
> Code explains **what**.
> This document explains **why**.
>
> If future-you asks:
>
> **"Why did we decide to do it this way?"**
>
> the answer should already be here.
>
> Newest decisions first.

**Last updated:** 2026-08-01

---

# Guiding Principle

Every decision should reinforce at least one of NorthPaw's core values:

- Better outdoor decisions
- Greater user trust
- Better usability
- Privacy-first
- Long-term sustainability

If a change weakens those, it should probably not ship.

---

# 2026-08-01 — Accessibility over aesthetics

## Decision

Removed decorative photography from utility screens and replaced it with solid high-contrast surfaces.

## Why

Real-world testing and user feedback demonstrated that photo backgrounds reduced readability outdoors and for users with accessibility needs.

NorthPaw is a safety tool first.

Readability always wins.

## Result

Release 5.3 accessibility redesign.

---

# 2026-08-01 — Utility screens should look like instruments

## Decision

Shift the visual language away from decorative cards toward clean, premium utility surfaces.

## Why

Users consistently responded more positively to clarity than visual flair.

NorthPaw should feel like premium outdoor equipment, not a weather app.

---

# 2026-08-01 — Trust before features

## Decision

Invest an entire release primarily in polish, accessibility, stability, and usability instead of major new functionality.

## Why

Feedback consistently showed that trust is earned through usability before additional features.

Release 5.3 intentionally prioritized quality over scope.

---

# 2026-08-01 — Disclaimer acceptance separated from releases

## Decision

Legal acceptance is versioned independently using `REQUIRED_DISCLAIMER_VERSION`.

## Why

App updates should never force users to reaccept unchanged legal text.

Only legal changes should require renewed acceptance.

---

# 2026-07 — Non-production analytics muted

## Decision

Disable analytics by default outside production.

## Why

Developer usage and TestFlight testing should never pollute production metrics.

Reliable analytics require clean data.

---

# 2026-07 — Review prompts must respect the user

## Decision

Review prompts are heavily gated.

Users may:

- postpone
- permanently dismiss
- review once

without repeated interruption.

## Why

Trust is more valuable than additional reviews.

---

# 2026-07 — Personalization follows value

## Decision

Move the optional dog photo until after the user receives their first readiness result.

## Why

Users should reach value before being asked for personalization.

Reduce onboarding friction.

---

# 2026-07 — Companion is measured before it is built

## Decision

Future paid functionality is feature-gated and instrumented before implementation.

## Why

Demand should be validated before investing engineering effort.

Measure interest first.

Build second.

---

# 2026-07 — Feedback should have almost zero friction

## Decision

Feedback flows directly into Google Sheets instead of email.

## Why

Email composition dramatically reduced submissions.

Lower friction produces more product insight.

---

# 2026-06 — Community-driven development

## Decision

Small community requests should ship quickly whenever practical.

## Why

Shipping user requests rapidly creates trust, loyalty, and word-of-mouth growth.

NorthPaw should be built with its community.

---

# 2026-06 — Deterministic models over AI

## Decision

NorthPaw uses deterministic environmental models rather than LLM-generated recommendations.

## Why

Deterministic systems provide:

- repeatability
- transparency
- explainability
- lower operating costs

Trust comes from consistency.

---

# 2026-06 — Local-first privacy

## Decision

Dog data stays on-device.

Accounts are not required.

## Why

Privacy is a feature.

Dog owners should not have to trade personal information for safety guidance.

---

# 2026-06 — NOAA first, Tomorrow.io second

## Decision

Use NOAA whenever available.

Fallback to Tomorrow.io when necessary.

## Why

Keeps operating costs low while maintaining excellent coverage.

---

# 2026-06 — Safety is free forever

## Decision

Core safety guidance will never be paywalled.

## Why

The mission is helping dogs.

Revenue comes from historical insight, personalization, and Companion—not restricting access to safety.

---

# 2026-06 — Quiet notifications

## Decision

Notifications are:

- optional
- local
- user-controlled
- deadline-oriented

## Why

Safety apps should help users, not compete for attention.

---
## 2026-07 — Reply to every meaningful email

Decision

Personally respond to meaningful user feedback.

Why

Every early user is effectively part of the product team.

Fast responses build trust, improve the product, and create advocates.

The first breed additions, accessibility redesign, veterinary outreach, and Android beta all came directly from email conversations.

---
# Standing Principles

These decisions should only change with extraordinary justification.

## Privacy

No required accounts.

---

## Safety

Never paywall safety.

---

## Trust

Always explain uncertainty.

Never fake precision.

---

## Accessibility

Readability beats aesthetics.

Always.

---

## Product

Answer the user's question within five seconds.

---

## Engineering

Prefer deterministic systems over opaque intelligence.

---

# Anti-Decisions

Things NorthPaw intentionally will not become.

## No social feed

Reason:

Does not improve outdoor decisions.

Creates moderation burden.

---

## No veterinary diagnosis

Reason:

Educational positioning.

Regulatory simplicity.

Trust.

---

## No trail navigation

Reason:

AllTrails and Gaia already solve this problem.

NorthPaw complements them.

---

## No AI-generated safety advice

Reason:

Breaks deterministic trust.

---

## No engagement addiction

Reason:

NorthPaw should encourage users to enjoy the outdoors—not spend more time in the app.

---

# Decision Checklist

Before making a significant product decision ask:

- Does this help owners make a better outdoor decision?
- Does this increase trust?
- Does this reduce friction?
- Does this improve accessibility?
- Does this respect privacy?
- Will this still feel like NorthPaw two years from now?

If most answers are "no,"

don't build it.