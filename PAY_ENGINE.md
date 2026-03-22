# PAY ENGINE — Pay Rates, Differentials, Hour Variations, PAYDIFFS Format

This file contains all pay calculation reference data extracted from CLAUDE.md.
For operational instructions, see [CLAUDE.md](CLAUDE.md).

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

### OT Formula

**OT = (Base x 1.5) + Differential (flat), NOT (Base + Diff) x 1.5**

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

## Pay Engine Architecture

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

### Option Set: Job → Differential Class
```
HD MECHANIC → CLASS_1 → +$2.50
TRACTOR TRAILER → CLASS_3 → +$0.65
LABOUR → BASE → +$0.00
```

### Pay Calculation Flow
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
