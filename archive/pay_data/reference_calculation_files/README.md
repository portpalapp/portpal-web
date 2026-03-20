# Reference & Calculation Files

**These files are for reference and analysis. DO NOT upload to Bubble.**

## Files in this folder:

### analysis_all_combinations.csv
- 990 unique JOB/SHIFT/LOCATION/SUBJOB combinations from user data
- Raw statistics: mean, median, std for hours and rates
- Includes ALL sample sizes (even low confidence)

### analysis_high_confidence_combinations.csv
- 541 combinations with HIGH confidence (sample size >= 3)
- Filtered version of all_combinations

### analysis_recommended_paydiffs.csv
- 341 entries recommended for PAYDIFFS
- High confidence only
- Source for the filtered Bubble upload file

### paydiffs_real_combinations.csv
- 11,880 rows (990 combos x 4 years x 3 day types)
- Expanded to Bubble format with year/day-of-week variations
- Full rate calculations included
- **Too large for upload** - use filtered special file instead

### generated_paydiffs_all_years.csv
- 55,080 rows - FULL expansion of all possible combinations
- Includes all locations, all years, all day types
- **Reference only** - most entries are standard and don't need to be uploaded

## Why These Aren't for Upload:
1. Most entries represent STANDARD hours (8/8/6.5) that can be auto-calculated
2. Files are too large and contain redundant data
3. Only SPECIAL cases (non-standard hours, built-in OT) need to be in PAYDIFFS

## For Bubble Upload:
See `../bubble_upload/` folder for the filtered file ready for import.
