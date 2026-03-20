# Archive Folder

This folder contains deprecated files that are no longer actively used but are kept for historical reference.

**Archived:** February 1, 2026

---

## archive/marketing/

| File | Reason Archived |
|------|-----------------|
| `PRICING_STRATEGY.md` | Uses incorrect BC market size (3,000 vs correct 7,200). Superseded by FREEMIUM_RESEARCH.md |
| `INDUSTRY_RESEARCH.md` | Uses pre-correction TAM (140,000 workers vs correct 127,000). Numbers outdated as of Feb 2026 |
| `REVISED_STRATEGY.md` | Superseded by newer marketing approaches in RESEARCH_BACKED_STRATEGY.md |
| `SOCIAL_MEDIA_PLAN.md` | Uses "rage/justice" messaging approach that conflicts with newer "problem not pay" strategy |

**Current Source of Truth:** See `MASTER_METRICS.md` in root folder for all correct numbers.

---

## archive/pay_data/

| File | Reason Archived |
|------|-----------------|
| `BUBBLE_UPLOAD_paydiffs_special.csv` | Contains rate data which violates hours-only architecture |
| `PAYDIFFS_hours_only.csv` | Older version, superseded by PAYDIFFS_clean.csv |
| `PAYDIFFS_hours_only_FIXED.csv` | Intermediate fix version, superseded by PAYDIFFS_clean.csv |
| `reference_calculation_files/` | Analysis artifacts used during development. Not for Bubble upload |

**Current File to Upload:** `pay data/bubble_upload/PAYDIFFS_clean.csv` (330 entries)

---

## archive/scripts/

| Script | Purpose | Reason Archived |
|--------|---------|-----------------|
| `analyze_shifts.py` | Generated analysis_summary.json | One-time analysis, output already exists |
| `generate_paydiffs.py` | Generated theoretical paydiffs | Superseded by generate_real_paydiffs.py |
| `retention_analysis_script.py` | Cohort/retention analysis | Analysis complete, results in marketing/ folder |
| `statistical_analysis.py` | Comprehensive statistical analysis | One-time analysis, results in STATISTICAL_ANALYSIS.md |

**Note:** These scripts may be useful if you need to re-run analysis against new data exports.

---

## What's NOT Archived (Still Active)

### Root Folder:
- `rate_calculator.py` - Active utility for pay calculations
- `generate_real_paydiffs.py` - May still be used (verify with developers)
- `analysis_summary.json` - Current, referenced by dashboards

### Marketing:
- All other files are current (35+ documents)
- See `MASTER_METRICS.md` for authoritative numbers

### Pay Data:
- `pay data/bubble_upload/PAYDIFFS_clean.csv` - The authoritative upload file
- `pay data/bubble_upload/README.md` - Upload instructions
