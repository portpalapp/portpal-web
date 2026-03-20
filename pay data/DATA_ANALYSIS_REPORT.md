# PORTPAL Pay Data Analysis Report

**Generated:** 2026-01-31
**Source:** 71,712 user shift records
**Purpose:** Understand rate and hours patterns for PAYDIFFS generation

---

## Key Finding: Rate vs Hours Relationship

### RATES are determined by JOB (not location)

The pay rate differential is tied to the job classification, not where the work is performed.

**Evidence:** When controlling for Mon-Fri and filtering bad data, the same JOB+SHIFT has consistent rates across all locations:

| Job | Shift | Rate Range | Conclusion |
|-----|-------|------------|------------|
| TRACTOR TRAILER | DAY | ~$55.95 | Same across CENTENNIAL, VANTERM |
| TRACTOR TRAILER | NIGHT | ~$70.32 | Same across locations |
| RUBBER TIRE GANTRY | DAY | ~$56.30 | Same across CENTENNIAL, VANTERM |
| HD MECHANIC | DAY | ~$57.80 | Same across 3 locations |
| LABOUR | DAY | ~$55.30 | Same across 9 locations |
| HEAD CHECKER | DAY | ~$55.95 | Same across locations |

**Implication:** We only need ONE rate per JOB+SHIFT+DAY_TYPE+YEAR. Location does not affect rate.

---

### HOURS vary by LOCATION (and sometimes SUBJOB)

The number of regular hours worked varies by terminal, with CENTENNIAL typically having longer shifts.

**Pattern Discovered:**

| Location | Day/Night Hrs | Graveyard Hrs | Notes |
|----------|---------------|---------------|-------|
| CENTENNIAL | 9.0 | 7.5 | Longest shifts |
| VANTERM | 8.0 | 6.5 | Standard shifts |
| DELTAPORT | 8.0 | 6.5-7.0 | Standard shifts |
| Others | 8.0 | 6.5 | Standard shifts |

**Jobs with Location-Based Hour Variation:**

1. **TRACTOR TRAILER**
   - CENTENNIAL: 9 hrs (day/night), 7.5 hrs (graveyard)
   - VANTERM/DELTAPORT: 8 hrs (day/night), 6.5 hrs (graveyard)

2. **HEAD CHECKER**
   - CENTENNIAL: 9 hrs (night), 7.5 hrs (graveyard)
   - VANTERM: 8 hrs (night), 6.5 hrs (graveyard)

3. **40 TON (TOP PICK)**
   - CENTENNIAL: 9 hrs (day/night), 7.5 hrs (graveyard)
   - VANTERM: 8 hrs (day/night), 6.5 hrs (graveyard)

4. **REACHSTACKER**
   - CENTENNIAL: 9 hrs (day), 7.5 hrs (graveyard)
   - VANTERM/DELTAPORT: 8 hrs (day), 6.5 hrs (graveyard)

5. **LIFT TRUCK**
   - CENTENNIAL: 9 hrs (night)
   - Others: 8 hrs (night)

6. **FIRST AID**
   - FRASER SURREY: 9 hrs (day)
   - All others: 8 hrs (day)

**Jobs with CONSISTENT Hours Across Locations:**

- RUBBER TIRE GANTRY: 8.0 hrs everywhere
- HD MECHANIC: 8.0 hrs everywhere
- ELECTRICIAN: 8.0 hrs everywhere
- LABOUR: 8.0 hrs everywhere

---

## PAYDIFFS Structure Recommendation

Based on this analysis, PAYDIFFS should be structured as:

### Rate-Determining Fields (same rate for all matching):
- JOB (determines differential class)
- SHIFT (DAY/NIGHT/GRAVEYARD)
- DAYOFWEEK (Mon-Fri / Sat / Sun)
- YEAR (1-4)

### Hour-Determining Fields (can vary):
- LOCATION (CENTENNIAL vs others)
- SUBJOB (for TT: RAIL, SHIP, etc.)

### Recommendation:
Instead of 990 combinations, we could simplify to:
1. Rate entries: ~150 (42 jobs × 3 shifts × [minimal day variations])
2. Hour overrides: Separate table for location-specific hour rules

Or keep current structure but understand that rates within a JOB+SHIFT are identical - only hours vary by location.

---

## Data Quality Notes

### Filtered Out:
- Rates < $40 or > $150 (data entry errors)
- Hours <= 0 or > 12 (data entry errors)
- Deleted job option entries

### Confidence Levels:
- HIGH: Sample size >= 3
- LOW: Sample size < 3

### Rate Discrepancies Explained:
Raw data shows rate variation because:
1. Weekend rates mixed with weekday rates
2. Different years (Year 1-4 have different base rates)
3. Data entry errors

When controlling for Mon-Fri only and valid rate ranges, rates are consistent by job.

---

## Differential Classes Confirmed

| Class | Differential | Jobs |
|-------|-------------|------|
| CLASS_1 | +$2.50 | HD MECHANIC, CARPENTER, ELECTRICIAN, MILLWRIGHT, PLUMBER, TRACKMEN, WELDER |
| CLASS_2 | +$1.00 | RUBBER TIRE GANTRY, FIRST AID, RAIL MOUNTED GANTRY, SHIP GANTRY, DOCK GANTRY |
| CLASS_3 | +$0.65 | TRACTOR TRAILER, LOCI, REACHSTACKER, 40 TON, FRONT END LOADER, BULLDOZER, EXCAVATOR, KOMATSU, MOBILE CRANE, WINCH DRIVER |
| CLASS_4 | +$0.50 | LIFT TRUCK, STORESPERSON, GEARPERSON |
| WHEAT | +$1.15 | WHEAT MACHINE, WHEAT SPECIALTY |
| TRAINER | 1.333x + $1.67 | TRAINER (validated from user data) |
| BASE | +$0.00 | LABOUR, HEAD CHECKER, DOCK CHECKER, BUNNY BUS, TRAINING |

---

## Files Generated

1. `analysis_all_combinations.csv` - 990 unique combinations
2. `analysis_high_confidence_combinations.csv` - 541 high-confidence combinations
3. `paydiffs_real_combinations.csv` - 11,880 PAYDIFFS entries (990 × 4 years × 3 day-types)

---

*This report should be updated when new user data is analyzed or patterns change.*
