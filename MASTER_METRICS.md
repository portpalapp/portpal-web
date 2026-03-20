# PORTPAL Master Metrics - Single Source of Truth

**Last Updated:** February 1, 2026

This document contains the authoritative metrics for PORTPAL. All other documents should reference these numbers. If you find a discrepancy in another document, it should be updated to match this file.

---

## Current App Statistics

| Metric | Value | Source |
|--------|-------|--------|
| **Total Users** | 752 | User data export |
| **Total Shifts Tracked** | 71,712 | User data export |
| **Total Pay Tracked** | $41,039,007 | User data export |
| **Power Users (100+ shifts)** | 305 (40.6%) | Statistical analysis |
| **One-and-Done Users** | 68 (9.0%) | Statistical analysis |

---

## Market Size (CRITICAL - Updated Feb 2026)

### Total Addressable Market (TAM)

| Market | Workers | ARR Potential |
|--------|---------|---------------|
| ILWU (West Coast + Hawaii) | 42,000 | $4.16M |
| ILA (East Coast + Gulf) | 85,000 | $8.42M |
| **North America Total** | **127,000** | **$12.57M** |

**IMPORTANT:** Previous estimates of 140,000 workers were incorrect. The corrected figure is **127,000 workers**.

### BC Market (Current Focus)

| Local | Location | Workers | Notes |
|-------|----------|---------|-------|
| **502** | New Westminster | **3,000+** | LARGEST BC local |
| 500 | Vancouver | 2,740 | Current user base |
| 505 | Prince Rupert | ~750 | Northern BC |
| 508 | Chemainus/Nanaimo | ~400 | Vancouver Island |
| 514 | Burnaby | ~300 | Foremen |
| 517 | Vancouver | ~200 | Warehouse/clerical |
| **BC Total** | | **7,200** | |

**IMPORTANT:** Previous estimates of ~3,000 BC workers only counted Local 500. The total BC market across all 6 locals is **7,200 workers**.

---

## Pricing Model

| Item | Value |
|------|-------|
| **Price** | $99/year |
| **Trial** | 30 days full access (no credit card required) |
| **Model** | Reverse Trial + Soft Paywall |
| **Target Conversion** | 35% |

### Revenue Projections (BC Market)

| Scenario | Users | Conversion | Paying Users | ARR |
|----------|-------|------------|--------------|-----|
| Conservative | 1,000 | 35% | 350 | $35K |
| **Base** | **1,500** | **35%** | **525** | **$52K** |
| Optimistic | 2,500 | 35% | 875 | $87K |

---

## Retention Metrics

| Metric | Value | Statistical Confidence |
|--------|-------|----------------------|
| **30-Day Retention** | 67.9% | n=691 |
| **90-Day Retention** | 62.5% | n=653 |
| **Power User Retention** | 72.2% | Based on 5+ shifts/month |
| **Magic Number** | 10+ shifts in first month | 69.9% retention rate |

### Key Statistical Findings

| Finding | Statistical Test | Result |
|---------|-----------------|--------|
| First-week engagement predicts retention | Chi-square | p < 0.0001 |
| Location variety correlates with retention | Pearson | r = 0.644, p < 0.0001 |
| Job pay rates significantly differ | ANOVA | F = 770.16, p < 0.0001 |

---

## Expansion Strategy (ILWU-First)

| Year | Markets | Cumulative Workers | ARR Target |
|------|---------|-------------------|------------|
| Year 1 | BC (All Locals) | 7,200 | $52K |
| Year 2 | + PNW (Seattle/Tacoma) | 14,200 | $97K |
| Year 3 | + California (LA/SF) | 28,200 | $166K |
| Year 4 | + Hawaii/Montreal | 36,000 | $215K |
| Year 5 | + ILA East Coast | 61,000 | $312K |

---

## Pay Engine Technical Data

### Differential Classes (BCMEA)

| Class | Differential | Jobs |
|-------|-------------|------|
| BASE | +$0.00 | LABOUR, HEAD CHECKER, DOCK CHECKER, BUNNY BUS, TRAINING |
| CLASS_1 | +$2.50 | HD MECHANIC, CARPENTER, ELECTRICIAN, MILLWRIGHT, PLUMBER, TRACKMEN, WELDER |
| CLASS_2 | +$1.00 | RUBBER TIRE GANTRY, FIRST AID, RAIL MOUNTED GANTRY, SHIP GANTRY, DOCK GANTRY |
| CLASS_3 | +$0.65 | TRACTOR TRAILER, LOCI, REACHSTACKER, 40 TON, FRONT END LOADER, BULLDOZER, EXCAVATOR, KOMATSU, MOBILE CRANE, WINCH DRIVER |
| CLASS_4 | +$0.50 | LIFT TRUCK, STORESPERSON, GEARPERSON |
| WHEAT | +$1.15 | WHEAT MACHINE, WHEAT SPECIALTY |

### Base Rates (Longshoreman, Mon-Fri DAY)

| Year | Effective | BASE Rate |
|------|-----------|-----------|
| Year 1 | Apr 2023 | $50.64 |
| Year 2 | Apr 2024 | $53.17 |
| Year 3 | Apr 2025 | $55.30 |
| Year 4 | Apr 2026 | $57.51 |

---

## File References

| File | Purpose | Status |
|------|---------|--------|
| `pay data/bubble_upload/PAYDIFFS_clean.csv` | Hours overrides for Bubble upload | READY (330 entries) |
| `STATISTICAL_ANALYSIS.md` | Full statistical methodology | Current |
| `TECHNICAL_SPEC.md` | Developer handoff document | Current |
| `marketing/FREEMIUM_RESEARCH.md` | Pricing model research | Current |
| `marketing/EXPANSION_STRATEGY.md` | Geographic expansion plan | Current |

---

## Version History

| Date | Change |
|------|--------|
| Feb 1, 2026 | Created MASTER_METRICS.md as single source of truth |
| Feb 1, 2026 | Corrected TAM from 140K to 127K workers |
| Feb 1, 2026 | Corrected BC market from 3K to 7.2K workers |
| Feb 1, 2026 | Standardized on 30-day trial (was 14 days in some docs) |
