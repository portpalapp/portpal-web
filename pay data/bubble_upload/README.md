# Bubble Upload: PAYDIFFS (Hours Overrides Only)

## Architecture Decision

**PAYDIFFS stores HOURS only. Rates are calculated dynamically.**

This approach:
- Reduces table size (~330 entries vs 11K+)
- Reduces Bubble workload (no query for standard shifts)
- Eliminates rate validation issues
- Makes contract year updates easy (one place)

---

## File to Upload

**File:** `PAYDIFFS_clean.csv`
**Entries:** 330
**Status:** READY TO UPLOAD

### Columns

| Column | Type | Description |
|--------|------|-------------|
| JOB | text | Job classification (canonical name) |
| SHIFT | text | DAY, NIGHT, or GRAVEYARD |
| LOCATION | text | Terminal name |
| SUBJOB | text | Sub-job designation (can be empty) |
| REGHRS | number | Regular hours |
| OTHRS | number | Overtime hours (built-in) |
| SAMPLE_SIZE | number | For reference only |

---

## What This Table Contains

**Non-standard hour combinations only:**

| Pattern | Examples |
|---------|----------|
| CENTENNIAL 9-hour day/night | 40 TON, TRACTOR TRAILER, HEAD CHECKER |
| CENTENNIAL 7.5-hour graveyard | Same jobs |
| WHEAT jobs (7.5 + 0.5 OT) | WHEAT MACHINE, WHEAT SPECIALTY |
| LINES jobs (4 hours) | All LINES entries |
| Built-in overtime | HEAD CHECKER with 1-2 OT, LABOUR with OT |
| All-OT shifts | DOCK GANTRY (0 reg, 5 OT) |

---

## What This Table Does NOT Contain

- Rate data (calculated from Option Set)
- Standard hour entries (8/6.5 with 0 OT)
- Differential amounts (stored in Option Set)

---

## Pay Engine Logic

### Step 1: Get Differential from Option Set (no DB query)

```
Job Option Set contains:
- HD MECHANIC → CLASS_1 → +$2.50
- TRACTOR TRAILER → CLASS_3 → +$0.65
- LABOUR → BASE → +$0.00
```

### Step 2: Calculate Rate

```
RATE = BASE_RATE[shift][day_type][year] + DIFFERENTIAL
```

### Step 3: Get Hours

```
Search PAYDIFFS for JOB + SHIFT + LOCATION + SUBJOB

IF found:
  REGHRS = PAYDIFFS.REGHRS
  OTHRS = PAYDIFFS.OTHRS

IF NOT found:
  REGHRS = default (8 for day/night, 6.5 for graveyard)
  OTHRS = 0
```

### Step 4: Calculate Pay

```
TOTAL_PAY = (REGHRS × RATE) + (OTHRS × RATE × 1.5)
```

---

## Option Set: Job Classifications

Create an Option Set in Bubble with these values:

| Job | Differential Class | Differential Amount |
|-----|-------------------|---------------------|
| LABOUR | BASE | $0.00 |
| HEAD CHECKER | BASE | $0.00 |
| DOCK CHECKER | BASE | $0.00 |
| BUNNY BUS | BASE | $0.00 |
| TRAINING | BASE | $0.00 |
| HD MECHANIC | CLASS_1 | $2.50 |
| CARPENTER | CLASS_1 | $2.50 |
| ELECTRICIAN | CLASS_1 | $2.50 |
| MILLWRIGHT | CLASS_1 | $2.50 |
| PLUMBER | CLASS_1 | $2.50 |
| TRACKMEN | CLASS_1 | $2.50 |
| WELDER | CLASS_1 | $2.50 |
| RUBBER TIRE GANTRY | CLASS_2 | $1.00 |
| FIRST AID | CLASS_2 | $1.00 |
| RAIL MOUNTED GANTRY | CLASS_2 | $1.00 |
| SHIP GANTRY | CLASS_2 | $1.00 |
| DOCK GANTRY | CLASS_2 | $1.00 |
| TRACTOR TRAILER | CLASS_3 | $0.65 |
| LOCI | CLASS_3 | $0.65 |
| REACHSTACKER | CLASS_3 | $0.65 |
| 40 TON (TOP PICK) | CLASS_3 | $0.65 |
| FRONT END LOADER | CLASS_3 | $0.65 |
| BULLDOZER | CLASS_3 | $0.65 |
| EXCAVATOR | CLASS_3 | $0.65 |
| KOMATSU | CLASS_3 | $0.65 |
| MOBILE CRANE | CLASS_3 | $0.65 |
| WINCH DRIVER | CLASS_3 | $0.65 |
| LIFT TRUCK | CLASS_4 | $0.50 |
| STORESPERSON | CLASS_4 | $0.50 |
| GEARPERSON | CLASS_4 | $0.50 |
| WHEAT MACHINE | WHEAT | $1.15 |
| WHEAT SPECIALTY | WHEAT | $1.15 |

---

## Base Rate Tables (store in Bubble or calculate)

### Mon-Fri DAY (Longshoreman base)

| Year | Effective | Rate |
|------|-----------|------|
| 1 | Apr 1, 2023 | $50.64 |
| 2 | Apr 1, 2024 | $53.17 |
| 3 | Apr 1, 2025 | $55.30 |
| 4 | Apr 1, 2026 | $57.51 |

### Night Premium: Add $14.37 to day rate
### Graveyard Premium: Add $30.75 to day rate
### Saturday Premium: Add $15.48 to base
### Sunday Premium: Add $33.18 to base

See `pay rates/Pay rates.pdf` for complete tables.

---

## Data Methodology

### Source
- 71,712 user shift entries from PORTPAL app
- Filtered to HIGH confidence (sample size >= 3)
- Filtered to non-standard hours only

### Why Hours Data is Reliable
- Clear patterns (9 hrs at CENTENNIAL, 4 hrs for LINES)
- User-entered overtime (not default)
- Verified across multiple users

### Why We Don't Store Rates
- User-entered rates had ~30% errors (wrong year, wrong class)
- Calculating from official BCMEA tables is always accurate
- Easier to update when contract changes
