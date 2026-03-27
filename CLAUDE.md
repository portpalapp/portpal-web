# PORTPAL - Shift Tracking App for Longshoremen

Shift-tracking, pay verification, and dispatch intelligence app for BC port workers.
957 users, 73,683 shifts tracked, $41M in pay tracked.

## Related Documentation

- [PAY_ENGINE.md](PAY_ENGINE.md) — Pay rates, differentials, hour variations, PAYDIFFS format
- [BUSINESS.md](BUSINESS.md) — Market data, pricing strategy, expansion roadmap
- [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) — Developer handoff document
- [DISPATCH_CORRECTION.md](DISPATCH_CORRECTION.md) — Corrected dispatch understanding
- [MASTER_METRICS.md](MASTER_METRICS.md) — Single source of truth for metrics

## Extracted Reference Docs

- See `.claude/docs/dispatch-system.md` — Button system, prediction model, plug-in mechanics, roadmap
- See `.claude/docs/data-pipeline.md` — Scraper inventory, news agent sources, data frequencies
- See `.claude/docs/business-metrics.md` — Key numbers, Command Center tabs, sprint status
- See `.claude/docs/gstack-workflow.md` — Skill-by-skill workflow, PORTPAL-specific notes

---

## Tech Stack

| Layer | Web (`app/`) | Mobile (`mobile/`) |
|-------|-------------|-------------------|
| Framework | Vite + React 19 | Expo SDK 54 + React Native 0.81.5 |
| Styling | Tailwind CSS | NativeWind v4 |
| Charts | Recharts | — |
| Backend | Supabase (`qcnozghkxbnlofahaqig`, us-west-2) | Same Supabase |
| Language | TypeScript | TypeScript |

## Development Strategy: Web-First

**Build for web first (`app/`), deploy to Vercel.** All new features land in `app/` first.
The mobile app (`mobile/`, Expo) is secondary and synced periodically.
Design every component mobile-responsive — users access via phone browser.

---

## Critical Rules

These rules prevent real bugs that have occurred or would affect real worker paychecks:

- **OT formula:** `(Base x 1.5) + Differential` — NOT `(Base + Diff) x 1.5`. See PAY_ENGINE.md.
- **Timezone-safe dates:** Always `s.date.slice(0,10)` string comparison, never `new Date(dateStr)` for date filtering
- **CENTENNIAL hours:** Check `HOURS_BY_LOCATION['CENTENNIAL']` returns 9/9/7.5
- **Differential rates:** Job name must match canonical names exactly (case-sensitive)
- **Pension year boundary:** Jan 4 to Jan 3 (WIPP Sunday-Saturday cycle)
- **All mutations:** Defense-in-depth (try/catch, validation, RLS)

## Common Failure Modes

| Failure | Root Cause | Fix |
|---------|------------|-----|
| OT formula wrong | `(Base + Diff) x 1.5` instead of `(Base x 1.5) + Diff` | Verify with `pay-engine.test.ts` |
| Timezone date mismatch | `new Date(dateStr)` creates local time | Use `s.date.slice(0,10)` |
| CENTENNIAL hours wrong | Missing hour override lookup | Check `HOURS_BY_LOCATION['CENTENNIAL']` |
| Pay stub OCR fails | Google Cloud Vision API key missing | Verify `GOOGLE_CLOUD_VISION_KEY` env var |
| Mobile build fails (Gradle) | Node version mismatch | `fnm use 22`, `npm install --legacy-peer-deps` |
| Differential not applying | Job name case mismatch | Match canonical names exactly |
| Pension year calc wrong | Boundary is Jan 4 to Jan 3 | Check boundary logic |

---

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

**Web app (app/) — PRIMARY:**
```bash
cd app && npx tsc --noEmit
cd app && npm run lint
cd app && npx vitest run
cd app && npm run build
```

**Mobile app (mobile/):**
```bash
cd mobile && npx tsc --noEmit
cd mobile && npm run prebuild:check
```

## Deployment

| App | Platform | Deploy | URL |
|-----|----------|--------|-----|
| **Web (PRIMARY)** | Vercel | Push branch -> preview, merge to master -> prod | portpal-web.vercel.app |
| **Mobile** | EAS Build | `cd mobile && npm run build:apk` | Expo (veetesh) |

- **GitHub repo:** `portpalapp/portpal-web`
- **Vercel project:** `portpal-web` (root: `app/`)
- **EAS account:** `veetesh` (Expo), EXPO_TOKEN in ~/.zshrc
- **Supabase:** `qcnozghkxbnlofahaqig` (us-west-2) — shared by web + mobile + scrapers

---

## Agent Instructions

- Read this CLAUDE.md before starting any task
- Check "Do Not Touch" before modifying any file
- **New features go in `app/` (web) first** — web-first strategy
- After changes: run the appropriate Build & Validate checklist
- Create feature branches: `feat/description` or `fix/description`
- PR command: `gh pr create --base master --repo portpalapp/portpal-web`
- If modifying pay calculation logic: use `/careful` mode, run `pay-engine.test.ts`
- If modifying Supabase schema: create migration, never edit `schema.sql` directly
- After PR creation, report: PR link, what changed, preview URL
- For dispatch domain knowledge: read `.claude/docs/dispatch-system.md`
- For data pipeline details: read `.claude/docs/data-pipeline.md`

---

## Run Commands

**Web app (PRIMARY):** `cd app && npm run dev` — http://localhost:5173

**Mobile app:** `cd mobile && fnm use 22 && npm start`

**Build APK:** `cd mobile && npm run prebuild:check && npm run build:apk`
