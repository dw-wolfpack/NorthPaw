# NorthPaw — GPT Project Knowledge Base

> The company's memory. Load these files into a GPT/AI project so every conversation starts with full context on the product, the decisions, the users, and the numbers.

Last updated: 2026-08-01

---

## What's Here

| File | What it answers | Load priority |
|---|---|---|
| `01_PRODUCT_VISION.md` | Why NorthPaw exists, who it's for, the two compass questions | ⭐⭐⭐⭐⭐ always load |
| `02_ROADMAP.md` | What's now / next / later (5.3 ✓ → 5.4 widgets → 6.0 decision engine) | ⭐⭐⭐⭐⭐ always load |
| `03_RETROSPECTIVES/` | What each release taught us (retro-5.2, retro-5.3, retro-5.4 pre-staged, template) | ⭐⭐⭐⭐⭐ |
| `04_ARCHITECTURE.md` | How the thing works: Expo, NWS/Tomorrow.io, Mixpanel, notifications, storage, RevenueCat, Sheets, Cloudflare site, App Store | ⭐⭐⭐ |
| `05_ANALYTICS.md` | Every Mixpanel event, properties, why it exists, dashboards | ⭐⭐⭐⭐ |
| `06_RELEASES/` | Changelogs: 4.x-legacy, 5.1, 5.2, 5.3 | ⭐⭐⭐ |
| `07_TESTING_CHECKLIST.md` | The every-release QA matrix | ⭐⭐⭐⭐⭐ |
| `08_FEEDBACK.md` | Every user, every request, every status — the pattern file | ⭐⭐⭐⭐⭐ |
| `09_METRICS.md` | Historical snapshots: "what happened after 5.3?" | ⭐⭐⭐⭐ |
| `10_PRESS.md` | Coverage, press kit, quotes, assets, outreach | ⭐⭐⭐ |
| `11_BRAND.md` | Colors, voice, tone rules, photography rules | ⭐⭐⭐ |
| `12_DECISIONS.md` | Dated decisions with the *why* — stops re-litigating | ⭐⭐⭐⭐⭐ |
| `13_IDEAS.md` | Brain dump, nothing committed | ⭐⭐ |
| `14_KNOWN_ISSUES.md` | Open bugs/limits with priorities — out of your head | ⭐⭐⭐⭐ |
| `15_COMPETITIVE_ANALYSIS.md` | Apple Weather, AllTrails, pet apps, the moat | ⭐⭐⭐ |
| `FOUNDER_JOURNAL.md` | The days that mattered — non-technical | ⭐⭐ (load anyway, it's short) |

## Load Order (if context is limited)

1. `01_PRODUCT_VISION.md` — the compass
2. `02_ROADMAP.md` — where we are
3. `08_FEEDBACK.md` — what users are saying
4. `12_DECISIONS.md` — what we've already decided and why
5. `05_ANALYTICS.md` — how we measure
6. Everything else as needed

## Maintenance Rules

- **After every release:** new file in `06_RELEASES/`, fill the matching retro in `03_RETROSPECTIVES/`, snapshot `09_METRICS.md`, update `02_ROADMAP.md`.
- **Weekly (Monday):** update `08_FEEDBACK.md` demand counts, `14_KNOWN_ISSUES.md` statuses.
- **When a decision is made:** dated entry in `12_DECISIONS.md` — never leave the *why* in your head.
- **When something happens:** one line in `FOUNDER_JOURNAL.md`, same day.
- **Anything marked `[fill in]`:** founder knowledge the repo couldn't reconstruct — fill it once, keep forever.

## Source Docs (deeper context, in the main repo)

- `documentation/NPI_ALGORITHM_GUIDE.md` — the safety math
- `documentation/DESIGN_RULES.md` — the design system rules
- `documentation/NORTHPAW_ROADMAP.md` — the detailed phase roadmap
- `documentation/metrics.md` — analytics implementation blueprint
- `documentation/onboarding_flow.md` — the calibration ritual
- `documentation/personal_doc/` — weekly flow, backlog, wins, money thinking

## NotebookLM / Gemini Notebook

These files are also meant to live in a Gemini Notebook (formerly NotebookLM) for grounded chat + Audio Overviews.

- Setup, auth, upgrade, and sync notes: **`NOTEBOOKLM_MCP.md`**
- Cursor MCP: `notebooklm-mcp-cli` (`nlm` + `notebooklm-mcp`) — not the abandoned `npx notebooklm-mcp@latest`
- After editing docs: re-upload changed sources in the notebook UI, or `nlm source add <id> --file …`
