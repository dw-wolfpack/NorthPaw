# 11 — Brand

> NorthPaw's identity.
>
> This document defines how NorthPaw looks, sounds, feels, and earns trust.
>
> Every screen should feel unmistakably like NorthPaw.

**Last updated:** 2026-08-01

---

# Brand Promise

**Confidence for every adventure, every day.**

NorthPaw exists to reduce uncertainty before every outdoor adventure.

Every design decision should reinforce one feeling:

> **"I know what to do now."**

---

# Mission

NorthPaw helps dog owners make better outdoor decisions through personalized, privacy-first technology.

---

# Brand Position

NorthPaw is **not**:

- another weather app
- a veterinary app
- a social network
- an AI chatbot

NorthPaw is:

> **A trusted outdoor decision companion for dog owners.**

---

# Personality

Imagine if NorthPaw were a person.

It would be:

- Calm
- Competent
- Helpful
- Prepared
- Honest
- Quietly confident

Never:

- Loud
- Alarmist
- Cute for the sake of cute
- Salesy
- Fear-driven
- Overly technical

---

# Emotional Goal

Users should feel:

Before opening:

> "I hope it's okay."

After opening:

> "Now I know."

---

# Voice

NorthPaw should sound like an experienced hiking partner.

Not:

> "WARNING: Heat stress risk exceeds threshold."

Instead:

> "Today's conditions are becoming challenging. Consider waiting until this evening."

---

# Tone Rules

## Answer First

Give the decision before the explanation.

---

## Explain Simply

Never overwhelm.

One sentence is better than three.

---

## Educational

Teach.

Don't lecture.

---

## Honest

If confidence is low:

Say so.

Never fake certainty.

---

## Human

Write naturally.

Never sound generated.

---

## Safety

Always encourage better decisions.

Never shame someone.

---

# Writing Style

Use:

- short sentences
- contractions
- active voice
- practical language

Avoid:

- legal language
- scientific jargon
- passive voice
- corporate marketing

---

# House Style

- NorthPaw
- NorthPaw Index (NPI)
- Hand Test
- Companion
- Field Guide

No em dashes.

Sentence case.

Never ALL CAPS except genuine emergencies.

---

# Naming & Bands

Canonical names used in copy and UI:

- Score: **NorthPaw Index (NPI)**, 0.0 to 10.0
- NPI bands: **Green** (low) / **Amber** (moderate) / **Ember** (high) / **Crimson** (extreme)
- Pavement bands: **Safe** / **Warm** / **Hot** / **Danger**
- Signature ritual: the **Hand Test** (ground-truth pavement verification)
- Site: **northpawapp.com** · Bundle: `com.northpaw.app` · Scheme: `northpaw://`

---

# Design Tokens (Glass System)

For anyone (or any agent) building NorthPaw UI:

| Token | Value | Use |
|-------|-------|-----|
| Glass_Base | blur intensity 20 + `rgba(15,23,20,0.7)` dark / `rgba(255,255,255,0.85)` light | Main cards |
| Rim_Light | 1px border `rgba(255,255,255,0.08)` | Glass edge definition |
| Corner radius | 16 to 24 (superellipse feel) | Never boxy 12px cards |
| Padding | >= 20 when radius is 24 | Prevents pinched content |
| Dark-card shadow | opacity 0.5, radius 10 | Depth separation |

Motion: breathing pulses, slow and low amplitude. Safe = calm green breath. High risk = restrained ember pulse. Never flash full-screen backgrounds.

Haptics: light tick per timeline hour step. Heavy confirmation only on ritual completion (Hand Test).

---

# Design Philosophy

NorthPaw should feel like:

- a field instrument
- premium outdoor gear
- an Apple utility

Not:

- a gaming app
- a dashboard
- a medical record

---

# Design Principles

## Utility First

Every screen should answer a question.

Decoration exists only after clarity.

---

## Safety Before Beauty

Readability beats aesthetics.

Always.

---

## Calm Motion

Animations should reinforce confidence.

Nothing should feel frantic.

---

## Information Hierarchy

The user should understand:

1. Is it safe?
2. Why?
3. What should I do?

within five seconds.

---

# Color Philosophy

Green should feel calming.

Amber should create awareness.

Red should communicate urgency.

Color should never be the only way information is communicated.

---

# Brand Colors

## Primary

Forest

`#1B4332`

---

Moss

`#2D6A4F`

---

Sage

`#40916C`

---

Ink

`#0D1712`

---

# Safety Colors

Safe

`#2ECC71`

---

Caution

`#F39C12`

---

Danger

`#B91C1C`

---

All colors must remain WCAG AAA compliant.

---

# Surfaces

Light

Background

`#F8FBF9`

Surface

`#FFFFFF`

---

Dark

Background

`#0F1713`

Surface

`#18241D`

---

# Typography

Typography should optimize outdoor readability.

Requirements:

- high contrast
- large tap targets
- readable in sunlight
- Dynamic Type friendly

Never sacrifice readability for style.

---

# Motion

Animations should feel:

- natural
- slow
- purposeful

Examples:

- breathing pulses
- gentle fades
- smooth transitions

Never:

- bounce excessively
- flash
- shake

---

# Haptics

Use haptics sparingly.

Light:

Timeline scrubbing

Medium:

Selections

Heavy:

Safety confirmations

---

# Photography

Photography exists to build emotional connection.

It never competes with information.

Rules:

- real dogs
- warm lighting
- authentic moments
- no stock-photo feeling

After Release 5.3:

> Never place utility text over photography unless contrast has been validated.

---

# Icons

Simple.

Rounded.

Friendly.

Easy to recognize outdoors.

---

# Logo

Primary:

NorthPaw icon

Monochrome variant available.

Minimum clear space:

1× icon height.

Never:

- stretch
- rotate
- recolor
- add effects

---

# Brand Assets

Primary Logo

App Icon

Adaptive Icon

Splash Icon

QR Codes

Hero Images

Share Cards

Press Kit

---

# Copy Principles

Every piece of copy should answer one of three questions.

## Is it safe?

The answer.

---

## Why?

The explanation.

---

## What should I do?

The action.

---

# Accessibility

Accessibility is part of the brand.

Not an afterthought.

Requirements:

- WCAG AAA where possible
- Dynamic Type support
- VoiceOver compatibility
- High contrast
- Color-independent communication

---

# Trust Principles

NorthPaw earns trust through:

- transparency
- consistency
- honesty
- privacy
- responsiveness

Never through:

- fear
- urgency
- manipulation

---

# Brand Evolution

## 4.x

Launch

Scientific utility.

---

## 5.x

Trust.

Accessibility.

Polish.

Community.

---

## 6.x

Decision Engine.

Companion.

Outdoor confidence.

---

# The Brand Test

Before shipping anything ask:

Does this make NorthPaw feel...

- more trustworthy?
- easier to understand?
- calmer?
- more useful?

If not,

don't ship it.