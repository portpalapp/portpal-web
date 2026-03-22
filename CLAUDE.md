# PORTPAL - Shift Tracking App for Longshoremen

## gstack Sprint Status

| Phase | Skill | Status | Date |
|-------|-------|--------|------|
| **Review** | `/review` | DONE — 12 findings (3 critical fixed) | Mar 19, 2026 |
| **Think** | `/office-hours` | DONE — Design doc: "From Shift Tracker to Dispatch Oracle" | Mar 19, 2026 |
| **Build** | Prediction model | IN PROGRESS — v1 statistical model built, v2 button simulator WIP | Mar 19, 2026 |
| **Build** | DOA scraper | DONE — `doa-scraper.ts` captures supply side, Task Scheduler pending | Mar 19, 2026 |
| **Design** | `/design-consultation` | PENDING | — |
| **QA** | `/qa` | BLOCKED — browse binary not starting on Windows | — |
| **Ship** | `/ship` | NOT STARTED | — |

**Active Rules:** Boil the Lake (completeness principle), timezone-safe dates (`s.date.slice(0,10)` never `new Date(dateStr)`), OT formula = `(Base × 1.5) + Differential`, defense-in-depth on all mutations.

---

## Dispatch Prediction System (Dispatch Oracle)

### How Dispatch Actually Works — The Button System

**CRITICAL:** Our scraped data shows **JOBS AVAILABLE** for dispatch, NOT jobs filled or workers dispatched.

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
- Scraper: `doa-scraper.ts` + `run-doa-scraper.bat` in scraper project (`C:\Users\veete\OneDrive\Desktop\claude_local\portpal\files\`)
- Schedule: 9 PM (post call-in) + 6 AM (pre-dispatch) — Task Scheduler setup PENDING
- Data: `data/doa-forecast/YYYY-MM-DD/doa_STAMP.json` with screenshots
- Per-shift summary: `jobRequired`, `totalEmployees`, `totalEmployeesEligible`
- Per-job detail (via View Forecast): `jobsRequired`, `totalAvailable`, `matchedAvailable`, `short` per terminal
- Example (Mar 20 Day): 191 jobs, 294 eligible. TT: 173 avail for 33 needed. Dock Gantry: 0 avail for 7 needed (short -7)

**Prediction formula (v2 with availability data):**
- Jobs available for shift (from work-info) ÷ Workers declared available (from availability scrape) = base dispatch rate
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

### Data Pipeline (16 automated scrapers on Windows Task Scheduler)

All scraper code and data at: `C:\Users\veete\OneDrive\Desktop\claude_local\portpal\files\`

| Data | Source | Frequency | Used For |
|------|--------|-----------|----------|
| Button positions | hourly-monitor (union/casual/telephone) | Hourly | Current dispatch state |
| Board rosters | boards/ (pre/post dispatch) | 6x daily | Worker positions + who got called |
| Worker ratings | worker-details/all-worker-ratings.json | One-time (1,708 workers) | Rating match for simulation |
| Job demand | work-info/ + work-info-snapshots/ | 6x daily | How many jobs AVAILABLE per category |
| Vessel forecast | vessel-forecast/ | Hourly | 3-shift-ahead gang predictions |
| External (weather, port, DP World) | external/ | Every 2h | Context signals |
| ILWU 502 greaseboard | ilwu502/ | Hourly | Delta/FSD exact job counts |
| Rating codes | rating-codes.json | Static (33 codes decoded) | Map board letters to job types |

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

---

## Folder Structure

```
project/
├── mobile/                   # 📱 React Native (Expo) mobile app — ACTIVE DEVELOPMENT
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
├── app/                      # 🖥️ React + Vite web app (Command Center dashboard)
│   ├── src/
│   │   ├── pages/
│   │   │   └── CommandCenter.tsx  # Data engine command center dashboard
│   │   ├── App.tsx
│   │   └── index.css
│   └── package.json
├── marketing/                # 📈 Marketing strategy & research (35+ docs)
│   ├── EXPANSION_STRATEGY.md      # Geographic expansion roadmap
│   ├── DATA_INSIGHTS.md           # User data analysis
│   ├── RETENTION_ANALYSIS.md      # Cohort retention data
│   ├── FREEMIUM_RESEARCH.md       # Pricing model research
│   └── [30+ more strategy docs]
├── pay data/                 # 📊 Pay rate data and analysis
│   ├── bubble_upload/             # ✅ READY TO UPLOAD - 332 special entries
│   │   └── BUBBLE_UPLOAD_paydiffs_special.csv
│   ├── reference_calculation_files/  # 📈 Analysis files (DO NOT upload)
│   ├── formatted pay data/        # Current Bubble export
│   ├── raw pay data/              # Source spreadsheets
│   ├── user shift data/           # 71K user entries analyzed
│   └── pay rates/                 # Official BCMEA PDFs
├── TECHNICAL_SPEC.md         # 📋 Developer handoff document (no business info)
├── STATISTICAL_ANALYSIS.md   # 📊 Statistical validation of findings
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
- **OT formula:** (Base x 1.5) + Differential (flat), NOT (Base + Diff) x 1.5
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

## Market Data (CRITICAL - Updated Feb 2026)

### Total Addressable Market: 127,000 Workers

**IMPORTANT:** Previous estimates of 3,000 workers were WRONG. The actual BC market is **7,200 workers** across 6 locals.

### ILWU (International Longshore and Warehouse Union) - 42,000 workers

| Region | Workers | Key Locals |
|--------|---------|------------|
| **BC (Canada)** | **7,200** | 500, 502, 505, 508, 514, 517 |
| Washington | 5,500 | 4, 7, 19, 21, 23, 24, 25, 27, 32, 47, 51, 52, 98 |
| Oregon | 1,500 | 8, 12, 40, 50, 53, 92 |
| N. California | 4,000 | 10, 14, 18, 34, 54, 91 |
| LA/Long Beach | 10,000 | 13, 26, 29, 46, 63, 94 |
| S. California | 1,000 | 20, 29, 46, 56 |
| Hawaii | 6,000 | Local 142 (all islands) |
| Alaska | 800 | Local 200 |
| Inland (Warehouse) | 6,000 | Locals 6, 9, 17, 26, 30+ |

### ILA (International Longshoremen's Association) - 85,000 workers

| Region | Workers | Notes |
|--------|---------|-------|
| Atlantic | 45,000 | NY/NJ, New England, Southeast |
| Gulf | 25,000 | Houston, New Orleans, Tampa |
| Great Lakes | 5,000 | Chicago, Detroit, Cleveland |
| Canada (East) | 5,000 | Montreal, Halifax, Saint John |
| Puerto Rico | 5,000 | San Juan area |

### BC Market Detail (Current Focus)

| Local | Location | Workers | Notes |
|-------|----------|---------|-------|
| **502** | New Westminster | **3,000+** | **LARGEST BC local** |
| 500 | Vancouver | 2,740 | Current user base |
| 505 | Prince Rupert | ~750 | Northern BC |
| 508 | Chemainus/Nanaimo | ~400 | Vancouver Island |
| 514 | Burnaby | ~300 | Foremen |
| 517 | Vancouver | ~200 | Warehouse/clerical |

**KEY INSIGHT:** Local 502 is LARGER than Local 500 and in the same metro area. Natural expansion target.

---

## Expansion Strategy (ILWU-First Recommended)

See `marketing/EXPANSION_STRATEGY.md` for full details.

**Recommended Path:**
```
Year 1: BC (All Locals)        → 7,200 workers  → $52K ARR
Year 2: + PNW (Seattle/Tacoma) → 14,200 workers → $97K ARR
Year 3: + California (LA/SF)   → 28,200 workers → $166K ARR
Year 4: + Hawaii/Montreal      → 36,000 workers → $215K ARR
Year 5: + ILA East Coast       → 61,000 workers → $312K ARR
```

**Why ILWU-First:**
- Same union = 80% pay engine logic transfers
- Similar contracts across all ILWU ports
- Union relationships can cascade (endorsements)
- Natural geographic corridor (BC → Seattle → LA)

---

## Technical Specification

See `TECHNICAL_SPEC.md` for the developer handoff document. Key points:

- **Stack:** React + TypeScript + Vite + Tailwind CSS (frontend), PostgreSQL/Supabase (target backend)
- **Architecture:** Multi-tenant (one tenant per union local)
- **Pay Engine:** Handles differentials, shift types, day-of-week rates, location-based hours
- **No business/marketing info** - purely technical implementation details

---

## Pay Rate Analysis (Original Purpose)

---

## Bubble Upload: PAYDIFFS (Hours Overrides Only)

### Architecture Decision (Feb 2026)

**PAYDIFFS table stores HOURS ONLY, not rates.**

- Rates calculated dynamically using Job → Differential Class (Option Set)
- PAYDIFFS only contains entries where hours differ from standard
- If no PAYDIFFS match → use standard hours (8/8/6.5, 0 OT)
- This reduces Bubble workload and ensures rate accuracy

### File to Upload

**File:** `pay data/bubble_upload/PAYDIFFS_clean.csv`
**Entries:** 330 hour override combinations
**Status:** READY TO UPLOAD

| Column | Description |
|--------|-------------|
| JOB | Job classification |
| SHIFT | DAY, NIGHT, or GRAVEYARD |
| LOCATION | Terminal name |
| SUBJOB | Sub-job (can be empty) |
| REGHRS | Regular hours (non-standard) |
| OTHRS | Overtime hours (built-in) |
| SAMPLE_SIZE | User entry count (for reference) |

### What This Table Contains

- CENTENNIAL 9-hour shifts (day/night)
- CENTENNIAL 7.5-hour graveyard shifts
- WHEAT jobs: 7.5 hrs + 0.5 OT
- LINES jobs: 4 hours
- Built-in overtime combinations
- All-OT shifts (DOCK GANTRY: 0 reg, 5 OT)

### Pay Engine Architecture

**Option Set: Job → Differential Class**
```
HD MECHANIC → CLASS_1 → +$2.50
TRACTOR TRAILER → CLASS_3 → +$0.65
LABOUR → BASE → +$0.00
```

**Pay Calculation Flow:**
```
1. User selects JOB
   → Look up differential from Option Set (instant, no DB query)

2. RATE = BASE_RATE[shift][day_type][year] + DIFFERENTIAL

3. Search PAYDIFFS for JOB+SHIFT+LOCATION+SUBJOB

4. IF found → use PAYDIFFS.REGHRS and PAYDIFFS.OTHRS
   IF NOT found → use defaults (8/8/6.5 hrs, 0 OT)

5. TOTAL_PAY = (REGHRS × RATE) + (OTHRS × RATE × 1.5)
```

### Benefits

| Benefit | Why |
|---------|-----|
| Smaller table | ~330 entries vs 11K+ |
| Less Bubble workload | No query for standard shifts |
| No rate validation issues | Rates always calculated correctly |
| Easy maintenance | Update base rates in one place |

### Official BCMEA Differential Classes (for Option Set)

| Class | Differential | Jobs |
|-------|-------------|------|
| BASE | +$0.00 | LABOUR, DOCK CHECKER, BUNNY BUS, TRAINING |
| CLASS_1 | +$2.50 | HD MECHANIC, CARPENTER, ELECTRICIAN, MILLWRIGHT, PLUMBER, TRACKMEN, WELDER |
| CLASS_2 | +$1.00 | RUBBER TIRE GANTRY, FIRST AID, RAIL MOUNTED GANTRY, SHIP GANTRY, DOCK GANTRY |
| CLASS_3 | +$0.65 | TRACTOR TRAILER, LOCI, REACHSTACKER, 40 TON, FRONT END LOADER, BULLDOZER, EXCAVATOR, KOMATSU, MOBILE CRANE, WINCH DRIVER, HEAD CHECKER |
| CLASS_4 | +$0.50 | LIFT TRUCK, STORESPERSON, GEARPERSON |
| WHEAT | +$1.15 | WHEAT MACHINE, WHEAT SPECIALTY |

### Base Rates by Year (Mon-Fri DAY Longshoreman)

| Year | Effective | BASE Rate |
|------|-----------|-----------|
| 1 | Apr 2023 | $50.64 |
| 2 | Apr 2024 | $53.17 |
| 3 | Apr 2025 | $55.30 |
| 4 | Apr 2026 | $57.51 |

See `pay data/pay rates/Pay rates.pdf` for full rate tables by shift and day type.

---

## Key Insight: Data Quality Varies

Not all user entries are equally reliable:

**Low confidence (likely lazy entry):**
- User accepted default hours (8 day, 8 night, 6.5 graveyard)
- User accepted default rate
- No notes explaining anything
- No subjob specified

**High confidence (user actually checked their pay stub):**
- User modified hours from defaults (e.g., 8 → 9 for TT Rail)
- User added overtime hours
- User corrected the pay rate
- User added a subjob
- User left notes explaining the situation

**Critical:** Users sometimes modify entries for **exceptions** (worked through lunch, special OT situation) rather than standard rates. **Always review user notes** to determine if an entry represents:
1. The **standard rate** for that job/shift combo, OR
2. An **exception** that shouldn't be used to define the standard

Notes that suggest exceptions (ignore these for standard rate discovery):
- "worked through lunch"
- "called in early"
- "stayed late"
- "short shift"
- "training"
- "special assignment"
- Any mention of unusual circumstances

---

## Analysis Approach

### Step 1: Load and Examine User Shift Data
- Identify all columns (job, shift, location, subjob, reghrs, othrs, rate, pay, notes, date, etc.)
- Understand the data types and formats

### Step 2: Score Each Entry for Confidence
```
Base confidence: 0.5

Add points for:
+0.25 if REGHRS ≠ default (8/8/6.5 for day/night/graveyard)
+0.15 if OTHRS > 0
+0.15 if rate differs from base longshoreman rate
+0.10 if SUBJOB is specified
+0.10 if notes field is empty (no exception explanation)

Subtract points for:
-0.30 if notes suggest an exception (lunch, early, late, short, etc.)
```

### Step 3: Discover Standard Rates
For each unique (JOB, SHIFT, LOCATION, SUBJOB) combination:
1. Filter to high-confidence entries (≥ 0.7)
2. Exclude entries where notes suggest exceptions
3. Calculate mode/median for REGHRS, OTHRS, rate
4. Count sample size
5. Flag if sample size is too small (< 3) for confidence

### Step 4: Compare to Existing PAYDIFFS
- Load formatted data from `pay data/` folder
- Match discovered patterns to existing entries
- Flag discrepancies for review
- Identify missing combinations

### Step 5: Output
- Report of discovered standard rates
- List of discrepancies with existing data
- Recommendations for PAYDIFFS updates
- Entries that need human review (low sample size, conflicting data)

---

## Bubble PAYDIFFS Table Format

This is the target format. All output must match this structure exactly.

**Columns:**
| Column | Type | Format | Example |
|--------|------|--------|---------|
| DAYOFWEEK | string | space-comma-space delimited numbers | `1 , 2 , 3 , 4 , 5` |
| DNG | string | DAY, NIGHT, GRAVEYARD or combo | `DAY , NIGHT` |
| eff_start | string | `MMM D, YYYY 12:00 am` | `Apr 1, 2025 12:00 am` |
| eff_end | string | `MMM D, YYYY 12:00 am` | `Apr 1, 2026 12:00 am` |
| JOBS | string | exact canonical job name | `TRACTOR TRAILER` |
| LOCATION | string | space-comma-space delimited | `CENTENNIAL , DELTAPORT` |
| OTHRS | number | overtime hours | `0` or `1` |
| REGHRS | number | regular hours | `8` or `9` |
| SHIFT | string | single value | `DAY`, `NIGHT`, or `GRAVEYARD` |
| SUBJOB | string | space-comma-space delimited, can be empty | `RAIL (TT) , SHIP (TT)` |

**Critical formatting rules:**
- Multi-value delimiter is ALWAYS ` , ` (space-comma-space), NOT `, ` or `,`
- Day of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
- Common groupings: Mon-Fri = `1 , 2 , 3 , 4 , 5`, Weekend = `0 , 6`, All = `0 , 1 , 2 , 3 , 4 , 5 , 6`

---

## Canonical Job Names

These are the EXACT job names in the Bubble database. Any variations must be mapped to these:

```
40 TON (TOP PICK)
BULLDOZER
BULK OPERATOR
BUNNY BUS
CARPENTER
DOCK CHECKER
DOCK GANTRY
DOW MEN
ELECTRICIAN
EXCAVATOR
FIRST AID
FRONT END LOADER
GEARPERSON
HATCH TENDER/SIGNAL
HD MECHANIC
HEAD CHECKER
KOMATSU
LABOUR
LIFT TRUCK
LINES
LIQUID BULK
LOCI
LOCKERMAN
MILLWRIGHT
MOBILE CRANE
OB
PAINTER
PLUMBER
PUSHER
RAIL MOUNTED GANTRY
REACHSTACKER
RUBBER TIRE GANTRY
SHIP GANTRY
STORESPERSON
SWITCHMAN
TRACKMEN
TRACTOR TRAILER
TRAINER
TRAINING
WELDER
WHEAT MACHINE
WHEAT SPECIALTY
WINCH DRIVER
```

**Common variations to normalize:**
| Source has | Convert to |
|------------|------------|
| HEADCHECKER | HEAD CHECKER |
| TRACKMAN | TRACKMEN |
| RTG | RUBBER TIRE GANTRY |
| TT | TRACTOR TRAILER |
| HC | HEAD CHECKER |
| RMG | RAIL MOUNTED GANTRY |

---

## Base Pay Rates (BCMEA Effective April 2025)

### Longshoreman Base Rates (no differential)

| Day | Shift | Regular | Time & 1/2 | Double Time |
|-----|-------|---------|------------|-------------|
| Mon-Fri | DAY | $53.17 | $79.76 | $106.34 |
| Mon-Fri | NIGHT | $66.98 | $100.47 | $133.96 |
| Mon-Fri | GRAVEYARD | $82.73 | $124.10 | $165.46 |
| Saturday | DAY | $68.06 | $102.09 | $136.12 |
| Saturday | NIGHT | $85.07 | $127.61 | $170.14 |
| Saturday | GRAVEYARD | $85.07 | $127.61 | $170.14 |
| Sunday | ALL | $85.07 | $127.61 | $170.14 |

### Job Classification Differentials (added to base rate per hour)

| Classification | Differential | Jobs |
|----------------|--------------|------|
| Class 1 | +$2.50/hr | HD MECHANIC, CARPENTER, ELECTRICIAN, MILLWRIGHT, PLUMBER, TRACKMEN, WELDER |
| Class 2 | +$1.00/hr | RUBBER TIRE GANTRY, FIRST AID, and others |
| Class 3 | +$0.65/hr | TRACTOR TRAILER, HEAD CHECKER, and others |
| Class 4 | +$0.50/hr | LIFT TRUCK, and others |
| Base | +$0.00/hr | LABOUR, DOCK CHECKER, BUNNY BUS |

### Special Cases
- WHEAT MACHINE / WHEAT SPECIALTY: +$1.15/hr differential
- TRAINER REGULAR: 1.333x multiplier on base
- TRAINER SENIOR: Senior rate applies all days

---

## Known Hour Variations by Job

Default hours are 8 reg / 0 OT for day/night, 6.5 reg / 0 OT for graveyard.

**CENTENNIAL has longer shifts** - verified from 71,712 user entries (Jan 2026 analysis).

### TRACTOR TRAILER
| LOCATION | Day/Night REGHRS | Graveyard REGHRS |
|----------|------------------|------------------|
| CENTENNIAL | 9 | 7.5 |
| VANTERM | 8 | 6.5 |
| DELTAPORT | 8 | 6.5-7.0 |

### HEAD CHECKER
| LOCATION | Night REGHRS | Graveyard REGHRS |
|----------|--------------|------------------|
| CENTENNIAL | 9 | 7.5 |
| VANTERM | 8 | 6.5 |

### 40 TON (TOP PICK)
| LOCATION | Day/Night REGHRS | Graveyard REGHRS |
|----------|------------------|------------------|
| CENTENNIAL | 9 | 7.5 |
| VANTERM | 8 | 6.5 |

### REACHSTACKER
| LOCATION | Day REGHRS | Graveyard REGHRS |
|----------|------------|------------------|
| CENTENNIAL | 9 | 7.5 |
| VANTERM/DELTAPORT | 8 | 6.5 |

### LIFT TRUCK
- CENTENNIAL NIGHT: 9 hrs
- All other locations: 8 hrs

### FIRST AID
- FRASER SURREY: 9 hrs (day)
- All other locations: 8 hrs

### RUBBER TIRE GANTRY
- 8 hrs everywhere (no location variation)

### WHEAT MACHINE / WHEAT SPECIALTY
- All shifts: 7.5 reg + 0.5 OT
- Locations: ALLIANCE GRAIN, G3 TERMINAL, CASCADIA, RICHARDSON, CARGILL, VITERRA PAC

---

## Location Names

**Standard terminals:**
- CENTENNIAL
- VANTERM
- DELTAPORT
- FRASER SURREY

**Wheat terminals:**
- ALLIANCE GRAIN
- G3 TERMINAL
- CASCADIA
- RICHARDSON
- CARGILL
- VITERRA PAC

**Normalize these:**
| Short | Full |
|-------|------|
| CENT | CENTENNIAL |
| VT | VANTERM |
| DP | DELTAPORT |
| FS | FRASER SURREY |
| AGT | ALLIANCE GRAIN |
| G3 | G3 TERMINAL |

---

## Workflow Summary

1. **Read all user shift data** from `user shift data/` folder
2. **Identify column mappings** (job, shift, location, subjob, hours, rate, pay, notes, date)
3. **Score each entry for confidence** based on modifications from defaults
4. **Review notes field** to exclude exception entries
5. **Group by job/shift/location/subjob** and calculate standard values from high-confidence entries
6. **Compare to existing `pay data/`** formatted files
7. **Generate report** with:
   - Discovered standard rates
   - Discrepancies from existing data
   - Entries needing human review
   - Recommended PAYDIFFS updates in correct format

---

## Critical Finding: Rate vs Hours Pattern (Validated Jan 2026)

**RATES are determined by JOB only (not location)**

Analysis of 71,712 user shifts confirmed that pay rates are consistent across all locations for the same JOB+SHIFT+DAY_TYPE. The differential is tied to job classification, not terminal.

Example: TRACTOR TRAILER DAY Mon-Fri = ~$53.82/hr whether at CENTENNIAL, VANTERM, or DELTAPORT.

**HOURS vary by LOCATION (especially CENTENNIAL)**

CENTENNIAL terminal has longer standard shifts than other terminals:

| Location | Day/Night | Graveyard |
|----------|-----------|-----------|
| CENTENNIAL | 9 hrs | 7.5 hrs |
| VANTERM | 8 hrs | 6.5 hrs |
| DELTAPORT | 8 hrs | 6.5-7.0 hrs |
| All Others | 8 hrs | 6.5 hrs |

**Jobs with Location-Based Hour Variation:**
- TRACTOR TRAILER
- HEAD CHECKER
- 40 TON (TOP PICK)
- REACHSTACKER
- LIFT TRUCK (night shift)
- FIRST AID (FRASER SURREY = 9 hrs)

**Jobs with Consistent Hours Everywhere:**
- RUBBER TIRE GANTRY (8 hrs)
- HD MECHANIC (8 hrs)
- ELECTRICIAN (8 hrs)
- LABOUR (8 hrs)

**PAYDIFFS Implication:**
- Rate fields (REGRATE, OTRATE, DIFFERENTIAL) only need to vary by JOB+SHIFT+DAY_TYPE+YEAR
- Hour fields (REGHRS, OTHRS) need to vary by LOCATION (especially for CENTENNIAL)

See `pay data/DATA_ANALYSIS_REPORT.md` for full analysis.

---

## Important Reminders

- The goal is to find **STANDARD** rates, not exceptions
- Always check notes for exception indicators before using an entry
- When in doubt, flag for human review rather than guessing
- Sample size matters: need at least 3 high-confidence entries to trust a pattern
- Watch for job name variations and normalize them
- Output must use exact Bubble format with ` , ` delimiters

---

## Data Analysis & Business Intelligence

### Statistical Analysis (Feb 2026)

See `STATISTICAL_ANALYSIS.md` for comprehensive statistical analysis including:
- Hypothesis testing with p-values
- Correlation analysis
- Retention cohort data
- User segmentation

**Key Validated Findings:**
| Finding | Statistical Proof |
|---------|-------------------|
| 3+ shifts in week 1 = better retention | χ² p < 0.0001 |
| Location variety correlates with retention | r = 0.644, p < 0.0001 |
| Job pay rates significantly differ | F = 770.16, p < 0.0001 |
| 67.9% 30-day retention | Cohort analysis |
| 62.5% 90-day retention | Cohort analysis |

**Magic Number:** Users who log 10+ shifts in first month have **69.9% retention**.

### Marketing & Growth Analysis

See `marketing/` folder for 35+ strategic documents:

| Document | Purpose |
|----------|---------|
| `EXPANSION_STRATEGY.md` | Geographic expansion roadmap (ILWU-First) |
| `DATA_INSIGHTS.md` | 71K shifts analyzed, marketing hooks |
| `RETENTION_ANALYSIS.md` | Cohort tables, churn patterns |
| `INDUSTRY_RESEARCH.md` | Market sizing, union research |
| `COMPETITIVE_ANALYSIS.md` | Gap analysis, positioning |
| `STARTUP_METRICS_RESEARCH.md` | YC wisdom, magic metrics |
| `FREEMIUM_RESEARCH.md` | Pricing model deep research |

**Note:** Market size corrected Feb 2026: 127,000 workers ($12.6M TAM), not 140,000.

### Pricing Strategy (Feb 2026)

See `marketing/FREEMIUM_RESEARCH.md` for comprehensive pricing model analysis.

**Key Finding:** Pure freemium doesn't maximize revenue for niche markets.

**Recommended Model: Reverse Trial + Soft Paywall**
| Phase | Duration | Access |
|-------|----------|--------|
| Trial | Days 0-30 | Full Pro access (no CC required) |
| Free | Day 15+ | Core features only |
| Pro | $99/year | All features |

**Conversion Projections (BC Market - 7,200 workers):**
| Scenario | Users | Conversion | Paying | ARR |
|----------|-------|------------|--------|-----|
| Conservative | 1,000 | 35% | 350 | $35K |
| Base | 1,500 | 35% | 525 | $52K |
| Optimistic | 2,500 | 35% | 875 | $87K |

**Feature Gating:**
- FREE: Shift logging, rate calc, basic dashboard, 1 AI question/week
- PRO: Pay stub upload, AI reconciliation, predictions, templates, export

### Business Metrics Summary

| Metric | Value | Source |
|--------|-------|--------|
| Total Users | 752 | User data |
| Total Shifts | 71,712 | User data |
| Total Pay Tracked | $41M | User data |
| TAM (North America) | **$12.6M ARR** | 127,000 workers × $99/yr |
| SAM (ILWU Only) | $4.2M ARR | 42,000 ILWU workers × $99/yr |
| SOM (BC Year 1) | $250K ARR | 7,200 BC workers × 35% × $99/yr |
| 30-Day Retention | 67.9% | Statistical analysis |
| Power User Retention | 72.2% | Statistical analysis |
| "One and Done" Rate | 9.0% | Statistical analysis |

### Market Size Breakdown

| Market | Workers | Locals | ARR Potential |
|--------|---------|--------|---------------|
| ILWU Total | 42,000 | 60+ | $4.16M |
| ILA Total | 85,000 | 200+ | $8.42M |
| **North America** | **127,000** | **260+** | **$12.57M** |

### Data Exports

Located in `marketing/`:
- `cohort_retention_pct.csv` - Monthly cohort retention matrix
- `cohort_table.csv` - Raw cohort data
- `monthly_summary.csv` - Monthly activity summary
- `user_stats_export.csv` - Per-user statistics

---

## Casual Workers: Key Target Segment

**IMPORTANT:** Worker counts include CASUALS (part-time/on-call workers). Casuals are especially valuable users:

**Why Casuals Need PORTPAL More:**
- Work irregular hours across multiple terminals
- Harder to track their own pay (no consistent schedule)
- Need to track hours for seniority advancement
- More likely to have pay discrepancies (dispatched to different jobs)
- Highly motivated to verify pay accuracy

**Casual Worker Dynamics:**
- Casuals outnumber full-time workers at most ports
- They dispatch daily from the union hall
- Pay varies significantly day-to-day
- Building hours for seniority is critical to their career

**Marketing Implication:** Target casuals with messaging around seniority tracking and pay verification.

---

## Session Notes (Feb 1, 2026)

### What Was Built Today

1. **Command Center Dashboard** (`app/src/pages/CommandCenter.tsx`)
   - 7-tab investor-ready dashboard
   - Interactive revenue calculator with market toggles
   - Growth Engine with comprehensive ILWU/ILA data
   - Cohort retention heatmaps
   - Statistical analysis with p-values

2. **Market Research Corrections**
   - Discovered Local 502 (New Westminster) is LARGEST BC local (3,000+ workers)
   - Corrected BC market from 3,000 → 7,200 workers
   - Mapped all 260+ North American union locals
   - TAM: $12.6M (127,000 workers)

3. **TECHNICAL_SPEC.md** - Developer handoff document (no business info)

4. **EXPANSION_STRATEGY.md** - Geographic expansion roadmap with 4 strategic options

### Key Decisions Made

- **Pricing:** Reverse Trial + Soft Paywall ($99/year, 35% conversion target)
- **Expansion:** ILWU-First strategy (same contracts, 80% pay engine transfer)
- **Year 1 Focus:** All BC locals (7,200 workers), starting with 500 → 502

### Next Steps / TODO

- [ ] Update marketing docs to reflect 127K TAM (some may still say 140K)
- [ ] Build out remaining dashboard features
- [ ] Implement reverse trial paywall logic
- [ ] Create Local 502 specific marketing materials
- [ ] Test pay engine with different ILWU port configurations
- [ ] Prepare investor pitch deck using Command Center data

### Files Changed Today

| File | Changes |
|------|---------|
| `app/src/pages/CommandCenter.tsx` | Created full dashboard |
| `app/src/App.tsx` | Added /command-center route |
| `TECHNICAL_SPEC.md` | Created developer spec |
| `marketing/EXPANSION_STRATEGY.md` | Created expansion roadmap |
| `CLAUDE.md` | Updated with comprehensive info |

---

## Session Notes (Feb 5, 2026)

### Content Creator Onboarding

Hired a social media content creator (based in Mexico, WhatsApp: +52 1 56 1433 3502). She asked initial questions and we provided direction.

**Her Questions & Our Answers:**

| Question | Our Response |
|----------|--------------|
| How many posts per week? | 2-3/week during launch (first 4-6 weeks), then 1-2/week ongoing |
| Do you have port videos/photos? | No bank of footage. Focus on app screenshots and screen recordings—product demos over lifestyle content |
| Comments/DMs included? | No, content creation and scheduling only. We handle community engagement. |
| Visual reference accounts? | @copilotmoney, @ynaborig (YNAB), @todoist |

**Content Direction Given:**
- Professional but approachable, product-focused not lifestyle-focused
- Show app solving real problems (catching pay errors, tracking pension, knowing pay before payday)
- Users are practical blue-collar workers—utility over aesthetics
- Best posting times: 5:30-6:30 AM (dispatch) or 6-8 PM (post-shift)

**DO:** App screens, educational carousels, problem→solution format, real data stats ($41M tracked, 990 rate combinations)

**DON'T:** Salary flexing, generic port stock footage, meme-heavy content, overly corporate tone

**Next Steps with Creator:**
- [ ] Provide app access for screenshots
- [ ] Share brand colors/assets if needed
- [ ] Review first batch of content before posting
- [ ] Set up scheduling tool access

---

## Common Failure Modes

| Failure | Root Cause | Fix |
|---------|------------|-----|
| OT formula wrong | `(Base + Diff) × 1.5` instead of `(Base × 1.5) + Diff` | Verify with `pay-engine.test.ts` |
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
- **WORKFLOW:** Always push to Vercel branch first, work on it, then decide on merge
- After changes: run the appropriate Build & Validate checklist (web or mobile)
- Create feature branches: `feat/description` or `fix/description`
- **DEPLOYMENT:** Push branch → get Vercel preview URL → send link immediately
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
- **VERCEL WORKFLOW:** Always branch → push → send preview link → decide on merge later

### Test & Build Commands (for gstack skills)

```
test_command: cd mobile && npx tsc --noEmit
eval_command: cd mobile && npx expo export --platform web --output-dir /tmp/expo-export 2>&1
build_command: cd mobile && npm run prebuild:check
dev_command: cd app && npm run dev
```
