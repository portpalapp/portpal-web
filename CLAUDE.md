# PORTPAL - Shift Tracking App for Longshoremen

## Related Documentation
- [PAY_ENGINE.md](PAY_ENGINE.md) — Pay rates, differentials, hour variations, PAYDIFFS format
- [BUSINESS.md](BUSINESS.md) — Market data, pricing strategy, expansion roadmap
- [ANALYSIS.md](ANALYSIS.md) — Data analysis methodology, session notes
- [DISPATCH_CORRECTION.md](DISPATCH_CORRECTION.md) — Corrected dispatch understanding
- [SCRAPER_ENHANCEMENT_PLAN.md](SCRAPER_ENHANCEMENT_PLAN.md) — Scraper enhancement roadmap
- [MASTER_METRICS.md](MASTER_METRICS.md) — Single source of truth for metrics
- [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) — Developer handoff document

## gstack Sprint Status

| Phase | Skill | Status | Date |
|-------|-------|--------|------|
| **Review** | `/review` | DONE — 12 findings (3 critical fixed) | Mar 19, 2026 |
| **Think** | `/office-hours` | DONE — Design doc: "From Shift Tracker to Dispatch Oracle" | Mar 19, 2026 |
| **Build** | Prediction model | IN PROGRESS — v1 statistical model built, v2 button simulator WIP | Mar 19, 2026 |
| **Build** | DOA scraper | DONE — `doa-scraper.ts` captures supply side, pm2/cron scheduling pending | Mar 19, 2026 |
| **Design** | `/design-consultation` | PENDING | — |
| **QA** | `/qa` | BLOCKED — browse binary not starting on Mac Mini | — |
| **Ship** | `/ship` | NOT STARTED | — |

**Active Rules:** Boil the Lake (completeness principle), timezone-safe dates (`s.date.slice(0,10)` never `new Date(dateStr)`), OT formula = `(Base × 1.5) + Differential`, defense-in-depth on all mutations.

---

## Dispatch Prediction System (Dispatch Oracle)

### How Dispatch Actually Works — The Button System

Dispatch uses a **rotating button (circular token)** per job category per shift. The button is the plate number of the last worker dispatched for that category.

**Core mechanics:**
1. Each job category (Dock Gantry, Lift Truck, FEL, RTG, Tractor Trailer, etc.) has its own button per shift (Day, Night, 1AM)
2. The button number = plate position of last worker dispatched
3. Next dispatch starts at button+1 and walks forward through the board
4. When the button reaches the end of the board (~430), it **wraps to plate 1**
5. Only workers who are **plugged in** (physically showed up at dispatch hall and swiped their card) AND have the matching rating get picked
6. Workers who didn't plug in are invisible — the button skips them entirely
7. A worker can be picked up by **ANY button they're rated for — whichever reaches them first**
8. Many workers don't plug in on any given day — this is why buttons scan huge portions of the board but only ~20% actually get dispatched
7. Jobs dispatch **in order** — fixed sequence determines which buttons run first:
   - **Trades first** (Mechanic, Electrician, Millwright, Surplus, etc.)
   - **Dock Gantry / Topside** (specialized crane operators)
   - **Machine categories** (Lift Truck, FEL, Bulldozer, Komatsu, RTG)
   - Various others in between (Wheat, Railroad, Coastwise, Warehouse, etc.)
   - **Labour / HOLD last** (catch-all general work)
8. Once a worker is grabbed by an earlier button, they're unavailable for later buttons

**Dispatch timing (CORRECTED UNDERSTANDING):**
- **Day Before**: FIRST AID and HEAD CHECKERS often dispatched previous day
- **Day Of - Morning**: Regular dispatch windows 6:30-9:00 AM (day dispatch at ~6:45 AM)
- **Day Of - Afternoon**: Night + 1AM dispatch between 3:00-6:00 PM
- **Throughout Day**: Callbacks posted as additional work appears

**IMPORTANT:** Work-info shows jobs AVAILABLE for dispatch, not jobs already filled.

**Button categories (3 types, captured hourly):**
- **Union buttons** — TOPSIDE, GANG, HOLD, WHEAT SPECIALTY, WHEAT MACHINE, COASTWISE, WAREHOUSE, DOCK, RAILROAD, MACHINE, TRADES. These are the job category buttons that walk through the union boards.
- **Casual buttons** — Per casual board (A, B, C, T, R) with job-specific buttons (Day, Night, 1AM, Tractor Trailer, RTG, Head Checking, etc.). These are the SAME dispatch mechanism applied per board — e.g., "Casual A Board - RTG" is the RTG button walking through board A specifically.
- **Telephone buttons** — Telephone dispatch

**Simulation logic:** Run buttons in dispatch order. For each button, walk each board in seniority order (A first, then B, C, T, R, 00). Claimed workers are removed from all subsequent buttons.

**Board dispatch order:** A board dispatches first (highest seniority), then B, C, T, 00, R. Each board has independent button positions per job category.

**User matching:** Workers currently enter board letter only during onboarding (no plate number). Workers know their reg number but won't give it (privacy). Match to scraped roster by name + dispatch slip uploads. Future: auto-detect plate position from slip data or ask for approximate position ("are you in the top half or bottom half of your board?").

**Prediction output:** Workers care about TWO things: (1) am I working tomorrow yes/no, and (2) WHICH job will I get. The prediction should show both — dispatch probability AND likely job category.

**Button data is end-state only:** We see the final plate position after dispatch completes, not each individual step. The delta between snapshots = total workers consumed.

**Plug-in system (critical for accuracy):**
- Workers must **call in the night before** to confirm they're coming
- Then **physically plug in** (swipe card) at the dispatch hall in the morning
- Workers who don't plug in are invisible to all buttons — skipped entirely
- No plug-in data available from scrapes (API doesn't expose it)
- **Prediction timing:** Notification should arrive the EVENING BEFORE — the real decision is "should I call in tonight?", not "should I go tomorrow morning?"

**Individual behavior tracking (in-app):**
- If a user logged a shift → they plugged in AND got dispatched
- If they report "plugged in, no job" → they showed up but weren't reached by any button
- If they report "didn't plug in" → stayed home
- This data feeds both the prediction model AND the points/streak gamification
- Even days they DON'T work should be tracked — "I stayed home" is valuable data

**Declaration of availability (DOA — NOW SCRAPING):**
- URL: `mybcmea.bcmea.com/doa-forecast` (auth via account 48064)
- API: `/api/doa-forecast` (summary) + `/api/doa-forecast/{dispatch}/{date}/stats` (per-job breakdown)
- Scraper: `doa-scraper.ts` in scraper project (`~/portpal/scrapers/`)
- Schedule: 9 PM (post call-in) + 6 AM (pre-dispatch) — pm2/cron setup PENDING
- Data: `data/doa-forecast/YYYY-MM-DD/doa_STAMP.json` with screenshots
- Per-shift summary: `jobRequired`, `totalEmployees`, `totalEmployeesEligible`
- Per-job detail (via View Forecast): `jobsRequired`, `totalAvailable`, `matchedAvailable`, `short` per terminal
- Example (Mar 20 Day): 191 jobs, 294 eligible. TT: 173 avail for 33 needed. Dock Gantry: 0 avail for 7 needed (short -7)

**Prediction formula (v2 with availability data):**
- Jobs available for shift (from work-info) / Workers declared available (from availability scrape) = base dispatch rate
- Adjust by board (A gets dispatched first → higher rate) and historical patterns
- Evening notification: "Tomorrow 0800: 180 jobs posted, ~300 workers declared. Board B: ~45% chance."

**Inferring plug-in from scrape data:**
- When a button passes a worker's plate and they DON'T appear as dispatched, either:
  - They weren't plugged in (didn't show up), OR
  - They don't have the rating for that button's job category
- Cross-reference with scraped ratings to determine which — if they HAVE the rating but weren't dispatched, they likely weren't plugged in
- Over time, builds individual attendance patterns per worker

**Plate stability:** Positions are mostly stable but can move around. Scraped data stays accurate for weeks/months. Re-scrape periodically to catch changes.

**Dispatch fills completely per category:** Each job category fills ALL available jobs across ALL boards (A→B→C→T→00→R) before moving to the next category in the dispatch order.

**Buttons that don't move** = no demand for that job category on that shift today (e.g., Red Dog, Coastwise, Compressor often stay frozen).

**Wrap-around examples (Mar 19, 2026):**
- Casual A Head Checking: 73 → 457 (wrapped past end of board)
- Warehouse Day: 331 → 43 (wrapped around)

### Prediction Model Architecture

The dispatch is **deterministic, not probabilistic**. Given button position + job demand + worker ratings, you can simulate exactly who gets called.

**Prediction question:** "Starting from button+1, walk forward through the board counting rated workers — does it reach my plate before jobs are filled?"

**Combine across all categories:** Worker gets dispatched if ANY button for a job they're rated for reaches their plate position.

### Data Pipeline (Mac Mini — pm2 managed)

Scrapers at `~/portpal/scrapers/`, news agent at `~/portpal/news-agent/`

| Data | Source | Frequency | Used For |
|------|--------|-----------|----------|
| Button positions | hourly-monitor (union/casual/telephone) | Hourly | Current dispatch state |
| Board rosters | boards/ (pre/post dispatch) | 6x daily | Worker positions + who got called |
| Worker ratings | worker-details/all-worker-ratings.json | One-time (1,708 workers) | Rating match for simulation |
| Job demand | work-info/ + work-info-snapshots/ | 6x daily | How many jobs per category |
| Vessel forecast | vessel-forecast/ | Hourly | 3-shift-ahead gang predictions |
| External (weather, port, DP World) | external/ | Every 2h | Context signals |
| ILWU 502 greaseboard | ilwu502/ | Hourly | Delta/FSD exact job counts |
| Rating codes | rating-codes.json | Static (33 codes decoded) | Map board letters to job types |
| Dispatch ticks | dispatch-monitor (Playwright) | Every 20s during windows | Real-time dispatch tracking |
| Industry news | news-agent (13 RSS/HTML sources) | Every 90 min | Worker-relevant news feed |

### News Agent Sources (13 active — last verified 2026-03-22)

| Source | Type | Category | Notes |
|--------|------|----------|-------|
| ILWU International | RSS (`ilwu.org/feed/`) | union | Switched from HTML scrape 2026-03-22 |
| ILWU Local 500 | HTML scrape | union | |
| ILWU Local 502 | HTML scrape | union | |
| BCMEA | RSS (`bcmaritime.com/feed/`) | employer | Rebranded from bcmea.com; broken TLS chain requires relaxed fetch |
| Port of Vancouver | RSS (Google News) | port | Direct site blocked by Cloudflare; uses Google News aggregation |
| DP World | HTML scrape | terminal | |
| GCT Global | HTML scrape | terminal | |
| Transport Canada | HTML scrape | government | |
| gCaptain | RSS | industry | |
| Splash247 | RSS | industry | |
| FreightWaves | RSS | industry | |
| Hellenic Shipping News | RSS | industry | Replaced JOC (dead RSS, paywalled) |
| BC Labour Relations | HTML scrape | labour | |

### Prediction Roadmap

**v1 (NOW) — Board-level predictions:**
- Input: board letter + shift + current button positions + vessel forecast demand
- Output: "X% of Board B dispatched for Day shift. High demand — 7 DK gangs." + which job categories are active
- No plate number needed

**v2 — Plate-level precision (after collecting plate position):**
- Add plate number collection via in-app nudge after 1 week of usage ("Want more accurate predictions? Tell us your plate position")
- Smart plate detection: show user where recent buttons landed and ask "are you before or after this position?" to narrow down their plate without asking for exact number
- Can also auto-detect plate from dispatch slip uploads or name matching against scraped roster
- Input: board + plate + ratings + button positions + demand
- Output: "Lift Truck button will reach ~plate 180 on B board. You're at 165. You're getting dispatched for Lift Truck."

**v3 — Rating-aware simulation:**
- Match user to scraped worker profile (1,708 workers with full ratings)
- Simulate exact dispatch sequence: run each button category in order, claim workers, predict which specific job the user lands
- "You'll get dispatched as RTG on the Day shift at Deltaport"

### Proven Correlations
- **Gangs on greaseboard = active cranes per shift** (not total cranes)
- **~11 workers per container gang**, containers drive 20x more demand than bulk
- **Button delta (pre→post dispatch) = exact workers consumed** for that job category
- **Vessel ETA from DP World/GCT gives 2-4 week advance notice** of demand

---

## Project Overview

PORTPAL is a shift-tracking and pay verification app for BC port workers (longshoremen). The app helps workers:
- Log shifts with correct hours and pay rates
- Verify pay stubs against logged shifts
- Track earnings across complex union pay structures
- Identify pay discrepancies

**Current Status:** Live app with 957 users, 73,683 shifts tracked, $41M in pay tracked. Mobile app v1.2.0 (Expo/React Native).

See [BUSINESS.md](BUSINESS.md) for market data, pricing, and expansion strategy.
See [PAY_ENGINE.md](PAY_ENGINE.md) for pay rates, differentials, and PAYDIFFS format.

---

## Folder Structure

```
project/
├── mobile/                   # React Native (Expo) mobile app — ACTIVE DEVELOPMENT
│   ├── app/                       # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx            # Root: ThemeProvider > SafeAreaProvider > AuthProvider
│   │   ├── login.tsx              # Auth (login/signup + demo mode)
│   │   ├── onboarding.tsx         # 6-step new user setup
│   │   ├── profile.tsx            # Settings, favorite terminals, dark mode
│   │   ├── holidays.tsx           # Stat holidays (upcoming + rules)
│   │   ├── pension.tsx            # WIPP pension (4 tabs)
│   │   ├── pay-stubs.tsx          # Pay stub comparison (demo only)
│   │   ├── template-builder.tsx   # Shift template builder
│   │   └── (tabs)/               # 5 main tabs + FAB
│   ├── lib/                       # Supabase client, auth, formatters, colors
│   ├── hooks/                     # useShifts, useProfile, useTemplates, etc.
│   ├── data/                      # Pay rates, contract, pension, holidays
│   ├── supabase/                  # Schema, migrations, sync scripts
│   └── package.json
├── app/                      # React + Vite web app (Command Center dashboard)
│   ├── src/
│   │   ├── pages/
│   │   │   └── CommandCenter.tsx  # Data engine command center dashboard
│   │   ├── App.tsx
│   │   └── index.css
│   └── package.json
├── marketing/                # Marketing strategy & research (35+ docs)
│   ├── EXPANSION_STRATEGY.md      # Geographic expansion roadmap
│   ├── DATA_INSIGHTS.md           # User data analysis
│   ├── RETENTION_ANALYSIS.md      # Cohort retention data
│   ├── FREEMIUM_RESEARCH.md       # Pricing model research
│   └── [30+ more strategy docs]
├── pay data/                 # Pay rate data and analysis
│   ├── bubble_upload/             # READY TO UPLOAD - 332 special entries
│   │   └── BUBBLE_UPLOAD_paydiffs_special.csv
│   ├── reference_calculation_files/  # Analysis files (DO NOT upload)
│   ├── formatted pay data/        # Current Bubble export
│   ├── raw pay data/              # Source spreadsheets
│   ├── user shift data/           # 71K user entries analyzed
│   └── pay rates/                 # Official BCMEA PDFs
├── TECHNICAL_SPEC.md         # Developer handoff document (no business info)
├── STATISTICAL_ANALYSIS.md   # Statistical validation of findings
└── CLAUDE.md                 # This file
```

---

## Mobile App (Expo / React Native)

**Stack:** Expo SDK 54, React Native 0.81.5, Expo Router, NativeWind v4, TypeScript, Supabase

**To run:**
```bash
cd mobile
fnm use 22                    # Node >= 20.19.4 required
npm install --legacy-peer-deps
npm start
```

**To build APK:**
```bash
cd mobile
npm run prebuild:check        # Verify Metro bundling works
npm run build:apk             # Submit to EAS Build (free tier, 5-30 min queue)
npm run build:status          # Check build progress
```

### Screens & Features
| Screen | Description |
|--------|-------------|
| **Login** | Email/password auth, demo mode, Bubble migration link |
| **Onboarding** | 6-step: welcome, union local, board/seniority, favorite terminals, job ratings, complete |
| **Home** | Today's shift, streak + points, earnings (this/last week), upcoming holidays, pension progress |
| **Shift Logger** | Smart location picker (favorites > recent > all), templates, work slip upload, editable rates |
| **Calendar** | Week/month/year views, job-colored days, shift type badges, weekly tax estimates |
| **Analytics** | Earnings charts, top jobs/locations, tax estimation with time range filtering |
| **Chat** | Contract-aware assistant (hardcoded responses, needs real AI) |
| **Pension** | Overview, calculator, planner (goal tracking, projections), WIPP rules reference |
| **Holidays** | 13 ILWU stat holidays, counting periods, qualifying shifts, pay rules |
| **Profile** | Name, union local, favorite terminals, dark mode toggle |
| **Pay Stubs** | Comparison UI (demo only — needs server-side OCR) |
| **Templates** | 5-step shift template builder |
| **Contract** | ILWU contract reference (wages, OT, differentials) |

### Key Technical Patterns
- **Timezone-safe dates:** Always `s.date.slice(0,10)` string comparison, never `new Date(dateStr)` for filtering
- **Smart location picker:** 3 tiers — favorite terminals (from onboarding/profile) > recent (from shift history) > all terminals (collapsible)
- **Points system:** Derived real-time from shifts (10pts/shift, 5pts/streak, 50pts/stub upload, streak multipliers)
- **Pension year:** Jan 4, 2026 → Jan 3, 2027 (WIPP Sunday-Saturday boundary)
- **OT formula:** (Base x 1.5) + Differential (flat), NOT (Base + Diff) x 1.5 — see [PAY_ENGINE.md](PAY_ENGINE.md) for full details
- **Shared utilities:** `lib/formatters.ts` (dates/currency), `lib/shiftColors.ts` (colors/icons) — no inline duplicates

---

## Command Center Dashboard

The **Command Center** (`app/src/pages/CommandCenter.tsx`) is an investor-ready React dashboard with 7 tabs:

| Tab | Purpose |
|-----|---------|
| **Overview** | Key metrics, user stats, shift data summary |
| **Calculator** | Interactive revenue calculator with market toggles |
| **Growth Engine** | TAM/SAM/SOM, expansion strategy, projections |
| **Retention** | Cohort heatmaps, churn analysis, at-risk users |
| **Marketing** | Channel strategies, content calendar, viral loops |
| **Financial** | Unit economics, pricing tiers, LTV:CAC |
| **Statistical** | Hypothesis testing, p-values, correlation analysis |

**To run:**
```bash
cd app
npm install
npm run dev
```
Access at http://localhost:5173/command-center

---

## Technical Specification

See `TECHNICAL_SPEC.md` for the developer handoff document. Key points:

- **Stack:** React + TypeScript + Vite + Tailwind CSS (frontend), PostgreSQL/Supabase (target backend)
- **Architecture:** Multi-tenant (one tenant per union local)
- **Pay Engine:** Handles differentials, shift types, day-of-week rates, location-based hours
- **No business/marketing info** - purely technical implementation details

---

## Common Failure Modes

| Failure | Root Cause | Fix |
|---------|------------|-----|
| OT formula wrong | `(Base + Diff) x 1.5` instead of `(Base x 1.5) + Diff` | Verify with `pay-engine.test.ts` |
| Timezone date mismatch | `new Date(dateStr)` creates local time | Always use `s.date.slice(0,10)` |
| CENTENNIAL hours wrong | Missing hour override lookup | Check `HOURS_BY_LOCATION['CENTENNIAL']` returns 9/9/7.5 |
| Pay stub OCR fails | Google Cloud Vision API key missing | Verify `GOOGLE_CLOUD_VISION_KEY` env var |
| Mobile build fails (Gradle) | Node version mismatch | `fnm use 22`, `npm install --legacy-peer-deps` |
| Differential rate not applying | Job name case mismatch | Match canonical names exactly |
| Pension year calc wrong | Boundary is Jan 4 → Jan 3 (WIPP Sunday-Saturday) | Check boundary logic |

## Do Not Touch

- `mobile/supabase/schema.sql` — modify only via migrations
- `mobile/supabase/migrations/*` — never edit past migrations
- RLS policies — always show changes before applying
- OT formula logic — tested heavily, change only if BCMEA contract changes
- `mobile/eas.json` — only Vee modifies EAS build settings
- `app/vercel.json` — confirm deployment implications before changing
- `pay data/reference_calculation_files/` — reference only, don't modify
- `.env` files — never commit

---

## Build & Validate
**Web dashboard (app/):**
1. `cd app && npx tsc --noEmit`
2. `cd app && npm run lint`
3. `cd app && npx vitest run`
4. `cd app && npm run build`

**Mobile app (mobile/):**
1. `cd mobile && npx tsc --noEmit`
2. `cd mobile && npm run prebuild:check`

## Deployment
- **Web dashboard:** Vercel — push branch for preview, merge to main for prod
- **Mobile app:** EAS Build — `cd mobile && npm run build:apk` for APK
- **GitHub repo:** `portpalapp/portpal-web`
- **Vercel project:** `portpal-web`
- **EAS account:** `veetesh` (Expo)

## Agent Instructions
- Read this CLAUDE.md before starting any task
- Check the "Do Not Touch" section before modifying any file
- After changes: run the appropriate Build & Validate checklist (web or mobile)
- Create feature branches: `feat/description` or `fix/description`
- PR command: `gh pr create --base main --repo portpalapp/portpal-web`
- CRITICAL: OT formula is `(Base × 1.5) + Differential` — never `(Base + Diff) × 1.5`
- CRITICAL: Always use `s.date.slice(0,10)` for dates, never `new Date(dateStr)`
- If modifying pay calculation logic: use `/careful` mode, run `pay-engine.test.ts`
- If modifying Supabase schema: create migration, never edit `schema.sql` directly
- After PR creation, report: PR link, what changed, preview URL

---

## Quick Reference

**Run mobile app:**
```bash
cd mobile && fnm use 22 && npm start
```

**Build APK:**
```bash
cd mobile && npm run prebuild:check && npm run build:apk
```

**Run Command Center (web):**
```bash
cd app && npm run dev
```
URL: http://localhost:5173/command-center

**Key Numbers:**
- Users: 957 (Bubble) | Shifts: 73,683 | Pay tracked: $41M
- BC Market: 7,200 workers (not 3,000)
- Local 502: 3,000+ workers (largest BC local)
- Local 500: 2,740 workers (current focus)
- North America: 127,000 workers
- TAM: $12.6M ARR
- Target Conversion: 35%
- Price: $99/year
- Latest APK in users' hands: v1.2.0 (last successful EAS build)
- Current codebase: v1.3.1 (unshipped — last build Mar 8 ERRORED on Gradle)
- EAS account: veetesh (Expo), portpalapp (GitHub active)
- Build profile: "preview" (APK, internal distribution)

---

## gstack — Development Workflow

Use `/browse` from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`,
`/design-consultation`, `/review`, `/ship`, `/browse`, `/qa`, `/qa-only`, `/design-review`,
`/setup-browser-cookies`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/careful`,
`/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`.

If gstack skills aren't working, run `cd ~/.claude/skills/gstack && ./setup` to build the binary and register skills.

### Recommended Workflow for PORTPAL

**Think → Plan → Build → Review → Test → Ship → Reflect**

| Stage | Skill | PORTPAL Context |
|-------|-------|-----------------|
| Brainstorm | `/office-hours` | New features, expansion ideas, pricing changes |
| Strategy review | `/plan-ceo-review` | Feature scope, market expansion decisions |
| Architecture | `/plan-eng-review` | Pay engine changes, Supabase schema, Expo Router |
| Design audit | `/plan-design-review` | Mobile UI plans before implementation |
| Design system | `/design-consultation` | Build/refine PORTPAL's visual identity |
| Code review | `/review` | Find bugs that CI misses — pay calc edge cases, timezone issues |
| Debug | `/investigate` | Root-cause analysis with auto-freeze to affected module |
| Visual QA | `/design-review` | Audit live Command Center dashboard |
| QA testing | `/qa` | Test mobile web views, Command Center at localhost:5173 |
| Report-only QA | `/qa-only` | Bug report without code changes |
| Ship | `/ship` | Sync main, run tests, push, open PR |
| Docs | `/document-release` | Keep CLAUDE.md, TECHNICAL_SPEC.md current after changes |
| Retro | `/retro` | Weekly dev stats, shipping velocity |
| Second opinion | `/codex` | Cross-model review for critical pay engine changes |
| Safety | `/careful` | When touching Supabase prod or pay calculations |
| Scope lock | `/freeze mobile/` | Lock edits to mobile app during debugging |
| Full safety | `/guard` | Maximum safety for production database work |

### PORTPAL-Specific Notes

- **Mobile app QA:** The Expo app runs natively, so `/qa` and `/browse` are best used for the Command Center web dashboard (`npm run dev` in `app/`, then `/qa http://localhost:5173/command-center`)
- **Pay engine changes:** Always use `/careful` when modifying pay calculation logic — incorrect rates affect real worker paychecks
- **Supabase schema changes:** Use `/freeze mobile/supabase/` to scope edits, and `/careful` for any migration that touches production
- **Before shipping APK builds:** Run `/review` to catch issues, especially timezone bugs (always `s.date.slice(0,10)`, never `new Date(dateStr)`)
- **After feature work:** Run `/document-release` to keep CLAUDE.md and TECHNICAL_SPEC.md in sync with code changes

### Test & Build Commands (for gstack skills)

```
test_command: cd mobile && npx tsc --noEmit
eval_command: cd mobile && npx expo export --platform web --output-dir /tmp/expo-export 2>&1
build_command: cd mobile && npm run prebuild:check
dev_command: cd app && npm run dev
```
