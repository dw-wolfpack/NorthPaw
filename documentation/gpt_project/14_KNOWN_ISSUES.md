# 14 — Known Issues

> Out of your head, into the table. Priorities: **P0** crash/data loss/safety wrongness · **P1** broken feature · **P2** polish/annoyance · **P3** someday.

Last updated: 2026-08-01

---

## Open

| Issue | Priority | Status | Notes |
|---|---|---|---|
| Tomorrow.io API key is client-side (`EXPO_PUBLIC_*`) — extractable from binary | P2 | OPEN | Mitigation known: route through a lightweight proxy (Cloudflare Worker). From `personal_doc/vulnerability_audit_report.md` |
| Location-denied fallback UI is functional but plain | P2 | OPEN | Design fix specced: blurred "Unlock Your Environment" card + settings CTA (Uncertainty Moat policy) |
| Modal transitions (e.g. Verify Surface) still abrupt | P3 | OPEN | Spring-physics scaling + background blur planned in design vision |
| Empty states (Gear Vault / fresh install) feel barren | P3 | OPEN | Illustrated empty states specced ("Every great adventure starts with preparation") |
| Widgets not implemented | P1 | planned 5.4 | The 5.4 theme |
|AQI modeled indirectly through weather text parsing.| P2 | → 6.0 | Works but blunt; live AQI feed in 6.0 |
| Cold-weather risk not modeled (CHSI is heat-only) | P2 | → 6.0 | Winter + salt in Decision Engine |
| Single-dog only | P2 | → 6.0 | Multiple dogs is a top request |
| Web build is non-blocking/unpolished | P3 | OPEN | Not promised in listing |
| Android receives compatibility support but not feature-first development.| P3 | OPEN | iOS-first strategy; revisit deliberately |
| Weather provider outages (NWS / Tomorrow.io) | P2 | OPEN | Current fallback and cache handle temporary outages, but prolonged provider downtime will degrade functionality. Continue improving graceful degradation. |

## Accepted Risks

| Decision | Why |
|----------|-----|
| Tomorrow.io client-side API key | Good enough for current scale. Proxy when international usage justifies it. |
| iOS-first development | 99%+ of current users are on iOS. Android polish intentionally deferred. |
| No cloud sync | Privacy-first philosophy outweighs convenience today. |
| Companion features hidden behind "Coming Soon" | Measuring demand before building expensive infrastructure. |

## Recently Fixed (5.3 — keep for regression awareness)

| Issue | Priority | Status | Regression guard |
|---|---|---|---|
| Timer lifecycle / stuck screen | P0 | FIXED 5.3 | AppState safeguards; test every release (`07_TESTING_CHECKLIST.md` §5) |
| Current temp fallback (daily max instead of hourly) | P1 | FIXED 5.3 | 5-case regression suite in `lib/__tests__` |
| Timeline overwrite / pill-box misalignment | P1 | FIXED 5.3 | Regression suite: boundary hour selection, pill/box alignment |
| Checklist toggle | P1 | FIXED 5.3 | QA pass per release |
| Contrast / readability failures (text over photos) | P0 | FIXED 5.3 | Standing rule in `12_DECISIONS.md`; contrast in checklist |
| Review flow state persistence | P1 | FIXED 5.3 | Session guard + expanded unit tests |
| Android DateTimePicker loop | P1 | FIXED 5.3 | Care preset tests |
| "Try again near None" text bug | P2 | FIXED 4.3 | — |

## How to Use

1. User reports something → add to `08_FEEDBACK.md` first, then here if it's a defect.
2. Every release: scan this file during QA; move fixed items to "Recently Fixed" with the version.
3. Anything that ships broken twice → add an explicit regression test to the checklist.

## Regression Watch List

These areas have historically broken more than once.

Always test manually.

- Weather parsing
- Timeline alignment
- Hand Test timer lifecycle
- Checklist state
- Accessibility contrast
- Review prompt eligibility
- Reminder scheduling

## If I Only Have One Hour

Fix these first:

1. Anything affecting safety recommendations
2. Crashes
3. Weather retrieval
4. Readability
5. Performance
6. Everything else