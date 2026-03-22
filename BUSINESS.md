# BUSINESS — Market Data, Pricing Strategy, Expansion Roadmap

This file contains all business intelligence, market data, and growth strategy
extracted from CLAUDE.md. For operational instructions, see [CLAUDE.md](CLAUDE.md).

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

## Pricing Strategy (Feb 2026)

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

---

## Business Metrics Summary

| Metric | Value | Source |
|--------|-------|--------|
| Total Users | 752 | User data |
| Total Shifts | 71,712 | User data |
| Total Pay Tracked | $41M | User data |
| TAM (North America) | **$12.6M ARR** | 127,000 workers x $99/yr |
| SAM (ILWU Only) | $4.2M ARR | 42,000 ILWU workers x $99/yr |
| SOM (BC Year 1) | $250K ARR | 7,200 BC workers x 35% x $99/yr |
| 30-Day Retention | 67.9% | Statistical analysis |
| Power User Retention | 72.2% | Statistical analysis |
| "One and Done" Rate | 9.0% | Statistical analysis |

### Market Size Breakdown

| Market | Workers | Locals | ARR Potential |
|--------|---------|--------|---------------|
| ILWU Total | 42,000 | 60+ | $4.16M |
| ILA Total | 85,000 | 200+ | $8.42M |
| **North America** | **127,000** | **260+** | **$12.57M** |

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

## Data Exports

Located in `marketing/`:
- `cohort_retention_pct.csv` - Monthly cohort retention matrix
- `cohort_table.csv` - Raw cohort data
- `monthly_summary.csv` - Monthly activity summary
- `user_stats_export.csv` - Per-user statistics
