# ANALYSIS — Data Analysis Methodology, Session Notes

This file contains data analysis methodology, workflow documentation, and session
notes extracted from CLAUDE.md. For operational instructions, see [CLAUDE.md](CLAUDE.md).

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
1. Filter to high-confidence entries (>= 0.7)
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

## Statistical Analysis (Feb 2026)

See `STATISTICAL_ANALYSIS.md` for comprehensive statistical analysis including:
- Hypothesis testing with p-values
- Correlation analysis
- Retention cohort data
- User segmentation

**Key Validated Findings:**
| Finding | Statistical Proof |
|---------|-------------------|
| 3+ shifts in week 1 = better retention | chi-squared p < 0.0001 |
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
