# NorthPaw PRD
Version: v0.3  
Status: Draft  
Owner: C  
Product: NorthPaw  
Platform: iOS-first  
Last Updated: 2026-04-08

---

## 1. Executive Summary

NorthPaw is a preparedness-first outdoor companion for dog owners. It helps users know what matters before they go, pack accordingly, and follow through lightly afterward.

**NorthPaw has a real opportunity if it stays focused on preparedness, not feature accumulation. The winning version is not a dog hiking app, a med reminder app, or a checklist app glued together. It is a calm, trustworthy readiness product that helps owners know what matters before they go, pack accordingly, and follow through lightly afterward.**

The MVP centers on one distinctive behavior:

**The weather → content bridge is NorthPaw’s strongest product hook. “Weather app, but what this means for my dog/trip” is intuitive, ownable, and immediately useful.**

NorthPaw should not try to replace trail navigation, act as a veterinary product, or become a broad utility hub. It should win the moment before uncertainty.

---

## 2. Problem Statement

Dog owners preparing for outdoor outings often piece together multiple tools:
- a trail or map app
- a weather app
- notes or memory for packing
- random internet searches for safety guidance
- calendar reminders for recurring care

This creates friction and uncertainty:
- Is today a good fit for my dog?
- What should I bring?
- What should I watch for?
- What am I forgetting?

Existing tools tend to own only one slice of this experience. NorthPaw exists to simplify preparation and reduce uncertainty before and during a dog outing.

---

## 3. Product Thesis

NorthPaw helps dog owners feel prepared before leaving and confident once they are out.

### Product Hierarchy
**Primary job:** help users prepare for safe, smoother outdoor outings with their dog.  
**Secondary job:** help users remember lightweight recurring care tied to that lifestyle.  
**Tertiary job:** help users keep a simple record of what they packed, did, or want to remember.

Reminders and logs support the preparedness experience. They are not co-equal pillars.

---

## 4. Goals and Non-Goals

### Goals
- reduce uncertainty before dog outings
- make preparation faster and easier
- provide calm, practical, dog-specific guidance
- bundle the most relevant readiness tasks into one lightweight experience
- build trust through clear boundaries and low-clutter design

### Non-Goals
NorthPaw is not:
- a replacement for AllTrails, Gaia, or other trail navigation apps
- a veterinary or diagnostic app
- a tele-vet product
- a heavy pet medication manager
- a generic productivity/checklist tool
- a social feed or community platform
- a shame-based habit tracker or “readiness score” product

---

## 5. Target Users, Personas, and JTBD

### Primary User
A conscientious dog owner who enjoys walks, parks, and light-to-moderate outdoor outings and wants to feel more prepared without becoming an expert.

### User Characteristics
- wants to do the right thing for their dog
- values simple, trustworthy guidance
- likes curated recommendations
- does not want a hardcore hiking tool
- does not want a complicated pet health app
- appreciates low-friction, mobile-first utility

### Excluded Early Segments
- advanced backcountry hikers needing topo/nav depth
- users seeking diagnosis or medication management
- users primarily motivated by community/social features
- users wanting detailed analytics or quantified-self tracking

### Persona 1: The Conscientious Weekend Owner
- goes on weekend walks, easy trails, beach trips, or park loops
- wants confidence, not complexity
- already checks weather, but is unsure what it means for the dog
- currently uses mental lists or Notes app packing lists

**JTBD:** “When I am getting ready for an outing with my dog, help me know what matters and what to bring so I can leave without second-guessing myself.”

### Persona 2: The Newer Dog Adventure Planner
- recently started taking the dog on outdoor outings more often
- is unsure about etiquette, gear, surface conditions, and weather implications
- appreciates plain-language field guidance

**JTBD:** “When I am trying something slightly more outdoorsy than my normal routine, help me feel prepared without needing to become an expert.”

### Persona 3: The Routine-Driven Preventive Care User
- is reasonably organized but forgets recurring care tasks
- wants simple reminders tied to lifestyle, not a full medication manager

**JTBD:** “When recurring outdoor-related care is due, remind me simply so I can stay on track without managing a complicated system.”

### Key Usage Scenarios
1. **Saturday 7:00 AM, before leaving for an easy trail**  
   User opens NorthPaw to check conditions, confirm the suggested pack, and skim one guidance card before loading the dog into the car.

2. **At the parking lot, right before starting**  
   User opens the current checklist to confirm water, leash, waste bags, towel, and any condition-specific item.

3. **Between outings, during the week**  
   User sees a simple prevention reminder, marks it done, and returns to the app only when needed.

---

## 6. Positioning

### Category
Outdoor readiness app for dog owners

### Positioning Statement
For conscientious dog owners who want outdoor outings to feel easier and more prepared, NorthPaw is a calm, trustworthy mobile companion that helps them understand conditions, pack smart, and access quick dog-specific guidance without replacing their map app or vet.

### Core Promise
**Know what matters before you go.**

---

## 7. MVP Scope

### In Scope
1. Conditions snapshot
2. Weather → guidance bridge
3. Curated packs/checklists
4. Quick field reference cards
5. Lightweight recurring care reminders
6. Lightweight outing memory/history

### Out of Scope
- full route planning
- GPS tracking as a core value proposition
- community/social features
- cloud-required collaboration
- tele-vet or diagnostic workflows
- advanced medication schedules, refill logic, or dose calculations
- widgets at launch unless nearly free
- QR as a core pillar unless a repeated real-world use case is proven

### QR / Deep Link Status
QR and scan/deep-link behavior may exist in code as an experimental surface, but they are **not a core MVP pillar**. They should not be used in product positioning, monetization, or primary navigation until a repeated real-world use case is validated.

Examples of potentially valid future use cases:
- printed mudroom/garage gear station code
- shared family gear bin
- outing start card
- trailhead companion material

Until validated, QR remains experimental.

---

## 8. User Stories

### Conditions + Guidance
- As a dog owner, I want to see today’s relevant conditions so I know whether anything about this outing needs extra attention.
- As a dog owner, I want the app to tell me what the weather means for my dog and pack so I do not have to interpret raw conditions myself.
- As a dog owner, I want short, practical guidance so I can decide quickly without reading long articles.

### Packs / Checklists
- As a dog owner, I want a suggested checklist for today’s outing so I can prepare faster.
- As a dog owner, I want to mark items complete so I know what is left.
- As a dog owner, I want the app to suggest different packs based on conditions or outing type.

### Reminders
- As a dog owner, I want simple recurring care reminders so I do not forget prevention-related tasks.
- As a dog owner, I want to mark a reminder done and see lightweight history.
- As a dog owner, I do not want a complex medical workflow.

### History
- As a dog owner, I want a lightweight record of recent outings or completed checklists so I can remember what I did last time.
- As a dog owner, I want history to feel simple and useful, not like an analytics dashboard.

---

## 9. Core User Flows

### Flow 1: First Open / Lightweight Onboarding
1. User launches app
2. App explains NorthPaw’s core value in 1–2 screens:
   - know what matters before you go
   - weather-aware guidance
   - curated packs and lightweight reminders
3. User optionally creates Dog Profile
4. User chooses notification preference for reminders
5. User grants location permission only when needed for local conditions
6. User lands on Home

**Design intent:** minimal onboarding, value before setup, no forced complexity

### Flow 2: Pre-Outing Preparation
1. User opens Home
2. User sees conditions snapshot
3. User sees the suggested pack/checklist
4. User taps into checklist
5. User marks items complete
6. User optionally opens one related guidance card
7. User leaves for outing

### Flow 3: Parking Lot Quick Check
1. User opens recent or active checklist
2. User reviews the remaining items
3. User taps a concise field guidance card if needed
4. User closes app and starts outing

### Flow 4: Reminder Completion
1. User receives local reminder notification
2. User opens reminder detail or list
3. User marks reminder done
4. App updates next due state
5. User returns to Home or exits

### Flow 5: Browse Library
1. User opens Library
2. User browses cards by category or condition tag
3. User opens one short card
4. User returns without entering a long course-like flow

### Flow 6: Review Recent Activity
1. User opens history/recent activity
2. User sees recent checklists or outings
3. User reopens one for reference or reuse

---

## 10. Core Objects / Data Model

### 10.1 DogProfile
Represents the user’s dog identity used for personalization.

**Fields**
- `id`
- `name`
- `photo_uri` (optional)
- `size_category` (optional)
- `age_band` (optional)
- `notes` (optional, non-medical in MVP)
- `created_at`
- `updated_at`

**MVP Notes**
- keep minimal
- do not position as a medical record
- optional fields only where they improve readiness suggestions

### 10.2 ConditionsSnapshot
Represents the weather/context information shown for a day or outing moment.

**Fields**
- `id`
- `location_name`
- `timestamp`
- `temperature`
- `condition_type` (sunny, rainy, windy, etc.)
- `precipitation_chance` (optional)
- `wind_level` (optional)
- `derived_tags` (heat, wet, cold, windy, etc.)

### 10.3 GuidanceCard
A short educational or caution card surfaced from conditions and/or browsing.

**Fields**
- `id`
- `title`
- `body_short`
- `category`
- `trigger_tags` (weather/season/outing tags)
- `priority`
- `disclaimer_type` (if needed)
- `last_updated`

### 10.4 PackTemplate
A reusable curated set of checklist items for a common outing type.

**Fields**
- `id`
- `title`
- `description`
- `outing_type`
- `condition_tags`
- `is_default`
- `created_at`
- `updated_at`

### 10.5 PackItem
An item belonging to a pack template or active checklist.

**Fields**
- `id`
- `pack_template_id`
- `label`
- `sort_order`
- `is_required_default`
- `condition_tags` (optional)
- `notes` (optional)

### 10.6 ActiveChecklist
A user-facing instantiated checklist for a specific outing context.

**Fields**
- `id`
- `dog_profile_id`
- `pack_template_id`
- `title`
- `date`
- `status` (not_started, in_progress, complete)
- `condition_context`
- `created_at`
- `updated_at`

### 10.7 ActiveChecklistItem
Tracks completion state for a checklist instance.

**Fields**
- `id`
- `active_checklist_id`
- `label`
- `is_complete`
- `completed_at`
- `sort_order`

### 10.8 Reminder
Simple recurring reminder object.

**Fields**
- `id`
- `dog_profile_id`
- `title`
- `reminder_type` (flea_tick, heartworm, custom_simple)
- `cadence_type` (monthly, every_x_weeks, seasonal)
- `next_due_at`
- `last_completed_at`
- `is_enabled`
- `created_at`
- `updated_at`

### 10.9 OutingRecord
Lightweight history object for later recall.

**Fields**
- `id`
- `dog_profile_id`
- `date`
- `title`
- `location_name` (optional)
- `conditions_summary` (optional)
- `checklist_id` (optional)
- `notes` (optional, short)
- `created_at`

**MVP Notes**
- keep this light
- no advanced metrics or route analytics

---

## 11. Information Architecture

### Primary Navigation
Proposed bottom tabs:
1. Home
2. Packs
3. Library
4. Reminders
5. Settings

### IA Principles
- Home is for readiness, not browsing everything
- Packs/checklists are core action objects
- Library is for quick reference, not long-form courses
- Reminders must remain lightweight
- Settings should support trust and clarity, not become a dense control center

---

## 12. Screen List

### 12.1 Home
Purpose: answer three questions
1. What matters today?
2. What should I do next?
3. What should I remember before leaving?

Expected modules:
- conditions card
- suggested pack/checklist card
- one guidance card
- one reminder card
- recent/continue shortcut

### 12.2 Pack Templates List
Purpose: browse curated pack/checklist templates

### 12.3 Pack Template Detail
Purpose: inspect included items and start checklist

### 12.4 Active Checklist
Purpose: complete the checklist for a specific outing

### 12.5 Library List
Purpose: browse quick field reference cards by category

### 12.6 Guidance Card Detail
Purpose: read a short piece of dog-outdoor guidance

### 12.7 Reminders List
Purpose: view and manage recurring reminders

### 12.8 Reminder Create/Edit
Purpose: create a simple recurring reminder

### 12.9 History / Recent Activity
Purpose: revisit recent checklists or outings

### 12.10 Dog Profile
Purpose: set lightweight dog identity details

### 12.11 Settings
Purpose: notifications, privacy explanation, disclaimers, basic app controls

---

## 13. Functional Requirements by Surface

### 13.1 Home

#### Requirements
- Home must show a conditions summary at the top.
- Home must show one contextually relevant suggested pack/checklist.
- Home must show one relevant guidance card tied to conditions, season, or outing context.
- Home may show one reminder card if a reminder is due soon.
- Home may show a recent/continue shortcut.

#### Acceptance Criteria
- User can open Home and understand what matters today within 5 seconds.
- Home does not exceed a small number of stacked cards in MVP.
- Guidance on Home is contextual, not random.
- Home avoids library-heavy or admin-heavy density.

### 13.2 Conditions Snapshot

#### Requirements
- The app must retrieve and display lightweight weather/context inputs.
- The app must convert raw inputs into readable tags or implications.

#### Acceptance Criteria
- Temperature and simple condition state are visible.
- Derived tags such as warm, wet, cold, or windy can be generated.
- Conditions can drive guidance and pack suggestions.

### 13.3 Weather → Guidance Bridge

#### Requirements
- The app must map condition tags to at least one relevant guidance output.
- The app must map condition tags to at least one relevant pack suggestion.
- The app must avoid diagnostic or overly authoritative language.

#### Acceptance Criteria
- Warm day produces different guidance from rainy day.
- Users can understand “what this means for my dog/trip” quickly.
- Guidance is concise enough to be read outdoors.

### 13.4 Packs / Checklists

#### Requirements
- Users must be able to browse curated pack templates.
- Users must be able to instantiate a checklist from a template.
- Users must be able to mark checklist items complete.
- The app must support lightweight completion state language.

#### Acceptance Criteria
- User can start a checklist from Home or Packs tab.
- User can mark items complete one by one.
- Checklist state persists locally.
- UI reflects “what’s left” clearly.

### 13.5 Library / Guidance

#### Requirements
- Users must be able to browse short-form guidance cards.
- Guidance content must be grouped by simple categories or tags.
- Card length must stay short enough for quick field reference.

#### Acceptance Criteria
- User can open a card in no more than a few taps.
- Card content is scannable within seconds.
- Long-form educational content is deferred out of MVP.

### 13.6 Reminders

#### Requirements
- Users must be able to create or enable simple recurring reminders.
- Users must be able to mark reminders done.
- Reminder history must remain lightweight.
- Reminder logic must be intentionally narrow in MVP.

#### Acceptance Criteria
- User can enable a reminder in under 1 minute.
- Reminder due state is visible.
- Marking a reminder done updates next due state.
- No complex refill, snooze, or household-sharing logic exists in MVP.

### 13.7 History

#### Requirements
- The app should keep a lightweight list of recent checklists or outings.
- History should support memory and continuity, not analytics.

#### Acceptance Criteria
- User can revisit a recent checklist.
- History is chronological and simple.
- No charts or advanced performance views exist in MVP.

### 13.8 Local-First Handling

#### Requirements
- Core user state should be stored locally where feasible.
- The app must clearly align with a privacy-conscious product story.

#### Acceptance Criteria
- Checklist state persists locally.
- Reminder state persists locally.
- Dog profile persists locally.
- MVP does not require cloud sync for core usage.

---

## 14. Monetization: Free vs Pro Boundaries

### Free
- Home with conditions snapshot
- weather → guidance bridge
- limited curated pack templates
- limited quick guidance library
- basic preset reminders
- recent activity for a short rolling window
- core dog profile

### Pro
- expanded pack template library
- additional guidance collections
- longer history / richer outing recall
- more customization of checklists
- additional reminder flexibility, still within lightweight scope
- future premium convenience features that do not distort trust

### Pro Boundary Principles
- Pro unlocks depth, not core trust
- the free product must still feel complete and useful
- no manipulative scarcity language
- no fake urgency timers
- paywall copy should be calm, boring, and honest
- preparedness-critical information should not be hidden behind deceptive gating

### Paywall Rules
- surface Pro at natural points of depth, not during first-use trust formation
- do not interrupt checklist completion with paywall surprises
- do not gate basic safety-adjacent guidance behind dark patterns

---

## 15. Measurement and Analytics

### Core Product Questions
- Do users open NorthPaw before outings?
- Does the weather → guidance bridge change behavior or increase perceived usefulness?
- Do curated packs/checklists reduce prep friction?
- Are reminders helping without becoming burdensome?
- Does the app feel focused and trustworthy?

### North-Star Behavioral Signal
Users repeatedly open NorthPaw shortly before outings and complete readiness actions.

### MVP Event List
- `app_opened`
- `home_viewed`
- `conditions_card_viewed`
- `guidance_card_viewed`
- `guidance_card_opened`
- `pack_suggestion_viewed`
- `pack_template_opened`
- `checklist_started`
- `checklist_item_completed`
- `checklist_completed`
- `reminder_enabled`
- `reminder_due_viewed`
- `reminder_marked_done`
- `history_viewed`
- `pro_paywall_viewed`
- `pro_upgrade_started`
- `pro_upgrade_completed`

### Initial Success Metrics
- % of active users who start a checklist
- % of started checklists that get completed
- guidance card open rate from Home
- reminder enable rate
- reminder completion rate
- repeat sessions on likely outing days
- D7 / D30 retention segmented by checklist use

### Decision Rules
- ship weather bridge v2 if guidance card open rate and pre-outing return behavior show meaningful engagement
- expand pack library if checklist start + completion rates are healthy
- keep reminders narrow unless completion and retention data prove users want slightly more flexibility
- cut or demote surfaces that do not contribute to pre-outing usefulness

---

## 16. Content Operations and Governance

### Content Ownership
- Product defines content strategy and category structure
- Design owns presentation and readability rules
- Content/UX writing owns tone and clarity
- Legal/compliance review is required for sensitive health-adjacent language
- Engineering owns delivery model and versioning

### Content Source of Truth
MVP assumption:
- content lives in a structured local file or bundle-backed format such as `library.json`
- content is versioned with the app until a CMS is justified

### Content Review Cadence
- monthly content review during MVP
- immediate review when new condition-sensitive guidance is added
- pre-release review for all new caution or prevention-adjacent cards

### Content Rules
- educational only
- no diagnosis
- no medication instructions beyond simple reminder framing
- no route or trail safety guarantees
- plain language only
- readable outdoors within seconds

### Localization
- English-only MVP unless localization capacity exists
- content schema should be localization-ready even if untranslated at launch

---

## 17. Technical / Platform Constraints

### Platform
- iOS-first MVP

### Location / Weather Scope
- MVP scope assumes US-first weather/location support
- if using NWS or similar US-oriented condition model, messaging and scope should remain clear
- location permission should be requested contextually, not on first frame without explanation

### Offline Expectations
- core local data should work offline:
  - dog profile
  - checklists
  - reminder state
  - library content already bundled in app
- weather freshness may degrade offline; UI should fail gracefully

### Persistence
- local persistence is the default MVP model
- SQLite or equivalent local store is acceptable
- cloud sync is deferred unless essential

### Notifications
- local notifications only for MVP reminders unless server-side logic becomes necessary
- permission prompt should be preceded by human explanation copy

### Deep Links
- app should support internal deep links only as needed for navigation or future experimentation
- QR-linked flows remain experimental until validated

---

## 18. Privacy, App Store, and Compliance

### Privacy Positioning
NorthPaw should be able to say, in plain language:
- what it stores locally
- what it does not collect
- when location is used
- that it is not a substitute for veterinary advice

### MVP Privacy Assumptions
- no ads
- no ATT requirement
- no unnecessary cloud collection
- collect the minimum needed for product measurement and function

### App Store / Privacy Label Preparation
Before submission, the team should define:
- what analytics events are collected
- whether any identifiers are stored
- whether coarse or precise location is accessed
- what data is linked to the user, if any
- whether user-generated content leaves device

### Health-Adjacent Guardrails
- avoid diagnostic claims
- avoid medication calculations
- avoid treatment recommendations
- keep reminder copy administrative, not prescriptive
- include clear educational-only framing where needed

---

## 19. Notification Requirements

### MVP Notification Scope
- reminder due notifications only
- optional lightweight notification settings
- no aggressive engagement spam
- no manipulative streak mechanics

### Acceptance Criteria
- user can enable reminders with clear notification permission context
- notification copy is simple and trustworthy
- notification cadence remains narrow

---

## 20. UX Principles

NorthPaw should feel:
- calm
- clear
- trustworthy
- outdoorsy
- minimal
- supportive

NorthPaw should not feel:
- clinical
- alarmist
- dashboard-heavy
- overly gamified
- cluttered
- guilt-inducing

### Preferred Language
- “2 things left”
- “Ready in 1 step”
- “Pack complete”
- “One last check”

### Avoid
- “score”
- “streak”
- “you failed”
- “high risk” unless carefully justified
- medical-sounding certainty

---

## 21. Roadmap Framing

### MVP
- conditions snapshot
- weather → guidance bridge
- curated packs/checklists
- quick field reference cards
- lightweight reminders
- simple history

### Post-MVP Exploration
- expanded premium packs and content
- richer history
- better outing object model
- experimental QR/deep-link use case validation
- widgets only if they strengthen preparedness rather than distract

### Explicit Roadmap Rule
Do not add features simply because they are adjacent. Add them only if they reduce uncertainty, speed preparation, or improve confidence before or during an outing.

---

## 22. Technical Notes for Cursor / Engineering Exploration

### Suggested Architecture Direction
- iOS-first app
- local-first persistence for MVP
- modular content/tagging layer for weather-driven guidance
- simple rules engine for mapping conditions → tags → cards/checklists
- future-safe object model without prematurely building cloud complexity

### Simple Rules Engine Example
Inputs:
- temperature band
- precipitation flag
- wind flag
- season tag
- outing type

Outputs:
- suggested pack template
- guidance card IDs
- optional reminder prompt or seasonal nudge

### Implementation Preference
Favor deterministic rules over ML/AI for MVP. Product value is clarity and trust, not novelty.

---

## 23. Risks and Mitigations

### Risk: Product sprawl
**Mitigation:** every feature must clearly support preparedness.

### Risk: Home clutter
**Mitigation:** Home must answer only three questions and keep card count low.

### Risk: Reminder complexity explosion
**Mitigation:** narrow recurrence model; no refill, no household sync, no medication calculations.

### Risk: Weak differentiation
**Mitigation:** make weather → guidance central, visible, and genuinely useful.

### Risk: Trust erosion
**Mitigation:** maintain clear educational boundaries and non-diagnostic language.

### Risk: Code / PRD mismatch
**Mitigation:** explicitly label experimental surfaces in code and docs; do not market unfinished pillars.

---

## 24. Open Questions

- What exact pack templates should exist in MVP?
- What minimum set of weather/condition tags is enough for v1?
- Should outing exist as a first-class object immediately, or should the product stay checklist-first?
- What dog profile fields meaningfully improve recommendations without expanding scope?
- How limited should free history be?
- Should custom reminders exist at launch, or only preset reminder categories?
- Does location need to be saved, or just used transiently?
- Is a dedicated History tab necessary, or can history live as a secondary surface?

---

## 25. MVP Acceptance Summary

NorthPaw MVP is successful if:
- users can open the app and understand what matters today
- users receive a relevant pack suggestion driven by conditions
- users can complete a checklist quickly
- users can access short, useful guidance in the field
- users can manage simple recurring reminders without complexity
- the product feels calm, focused, and clearly different from both map apps and pet med apps

---

## 26. Final Product Principle

NorthPaw should win by being the app a dog owner opens before leaving because it helps them feel ready.
