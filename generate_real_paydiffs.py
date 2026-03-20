"""
Generate PAYDIFFS from REAL combinations only (from user data analysis)
"""
import pandas as pd

# Load the actual combinations from user data analysis
all_combos = pd.read_csv('pay data/analysis_all_combinations.csv')

# BCMEA rates by year
BCMEA_RATES = {
    1: {'start': 'Apr 1, 2023 12:00 am', 'end': 'Apr 1, 2024 12:00 am',
        'DAY': {'MON-FRI': 50.64, 'SAT': 64.82, 'SUN': 81.02},
        'NIGHT': {'MON-FRI': 63.80, 'SAT': 81.02, 'SUN': 81.02},
        'GRAVEYARD': {'MON-FRI': 78.80, 'SAT': 81.02, 'SUN': 81.02}},
    2: {'start': 'Apr 1, 2024 12:00 am', 'end': 'Apr 1, 2025 12:00 am',
        'DAY': {'MON-FRI': 53.17, 'SAT': 68.06, 'SUN': 85.07},
        'NIGHT': {'MON-FRI': 66.98, 'SAT': 85.07, 'SUN': 85.07},
        'GRAVEYARD': {'MON-FRI': 82.73, 'SAT': 85.07, 'SUN': 85.07}},
    3: {'start': 'Apr 1, 2025 12:00 am', 'end': 'Apr 1, 2026 12:00 am',
        'DAY': {'MON-FRI': 55.30, 'SAT': 70.78, 'SUN': 88.48},
        'NIGHT': {'MON-FRI': 69.67, 'SAT': 88.48, 'SUN': 88.48},
        'GRAVEYARD': {'MON-FRI': 86.05, 'SAT': 88.48, 'SUN': 88.48}},
    4: {'start': 'Apr 1, 2026 12:00 am', 'end': 'Apr 1, 2027 12:00 am',
        'DAY': {'MON-FRI': 57.51, 'SAT': 73.61, 'SUN': 92.02},
        'NIGHT': {'MON-FRI': 72.45, 'SAT': 92.02, 'SUN': 92.02},
        'GRAVEYARD': {'MON-FRI': 89.49, 'SAT': 92.02, 'SUN': 92.02}},
}

# Differentials by job
DIFFERENTIALS = {
    'HD MECHANIC': 2.50, 'CARPENTER': 2.50, 'ELECTRICIAN': 2.50, 'MILLWRIGHT': 2.50,
    'PLUMBER': 2.50, 'TRACKMEN': 2.50, 'WELDER': 2.50,
    'RUBBER TIRE GANTRY': 1.00, 'FIRST AID': 1.00, 'RAIL MOUNTED GANTRY': 1.00,
    'SHIP GANTRY': 1.00, 'DOCK GANTRY': 1.00,
    'TRACTOR TRAILER': 0.65, 'LOCI': 0.65, 'REACHSTACKER': 0.65,
    '40 TON (TOP PICK)': 0.65, 'FRONT END LOADER': 0.65, 'BULLDOZER': 0.65,
    'EXCAVATOR': 0.65, 'KOMATSU': 0.65, 'MOBILE CRANE': 0.65, 'WINCH DRIVER': 0.65,
    'LIFT TRUCK': 0.50, 'STORESPERSON': 0.50, 'GEARPERSON': 0.50,
    'WHEAT MACHINE': 1.15, 'WHEAT SPECIALTY': 1.15,
}

DIFF_CLASS = {
    'HD MECHANIC': 'CLASS_1', 'CARPENTER': 'CLASS_1', 'ELECTRICIAN': 'CLASS_1',
    'MILLWRIGHT': 'CLASS_1', 'PLUMBER': 'CLASS_1', 'TRACKMEN': 'CLASS_1', 'WELDER': 'CLASS_1',
    'RUBBER TIRE GANTRY': 'CLASS_2', 'FIRST AID': 'CLASS_2', 'RAIL MOUNTED GANTRY': 'CLASS_2',
    'SHIP GANTRY': 'CLASS_2', 'DOCK GANTRY': 'CLASS_2',
    'TRACTOR TRAILER': 'CLASS_3', 'LOCI': 'CLASS_3', 'REACHSTACKER': 'CLASS_3',
    '40 TON (TOP PICK)': 'CLASS_3', 'FRONT END LOADER': 'CLASS_3', 'BULLDOZER': 'CLASS_3',
    'EXCAVATOR': 'CLASS_3', 'KOMATSU': 'CLASS_3', 'MOBILE CRANE': 'CLASS_3', 'WINCH DRIVER': 'CLASS_3',
    'LIFT TRUCK': 'CLASS_4', 'STORESPERSON': 'CLASS_4', 'GEARPERSON': 'CLASS_4',
    'WHEAT MACHINE': 'WHEAT', 'WHEAT SPECIALTY': 'WHEAT',
}

records = []

# For each REAL combination found in user data
for _, combo in all_combos.iterrows():
    job = combo['JOB']
    shift = combo['DNG']
    location = combo['LOCATION']
    subjob = combo['SUBJOB_COMBINED'] if pd.notna(combo['SUBJOB_COMBINED']) else ''

    # Get hours from the analysis (use median)
    reg_hrs = combo['REG HR_median']
    ot_hrs = combo['OT HR_median']

    if pd.isna(reg_hrs): reg_hrs = 8 if shift != 'GRAVEYARD' else 6.5
    if pd.isna(ot_hrs): ot_hrs = 0

    # Clamp unreasonable hours (data entry errors) to sensible defaults
    default_reg = 8 if shift != 'GRAVEYARD' else 6.5
    if reg_hrs <= 0 or reg_hrs > 12:
        reg_hrs = default_reg
    if ot_hrs < 0 or ot_hrs > 8:
        ot_hrs = 0

    sample_size = combo['sample_size']
    differential = DIFFERENTIALS.get(job, 0)
    diff_class = DIFF_CLASS.get(job, 'BASE')

    # Generate for each year and day type
    for year in [1, 2, 3, 4]:
        for dow, day_type in [('1 , 2 , 3 , 4 , 5', 'MON-FRI'), ('6', 'SAT'), ('0', 'SUN')]:
            base_rate = BCMEA_RATES[year][shift][day_type]

            # Special handling for TRAINER: 1.333x multiplier + $1.67 differential
            if job == 'TRAINER':
                trainer_base = round(base_rate * 1.333333, 2)
                reg_rate = round(trainer_base + 1.67, 2)
                differential = round(reg_rate - base_rate, 2)
            else:
                reg_rate = round(base_rate + differential, 2)

            ot_rate = round(reg_rate * 1.5, 2)

            records.append({
                'DAYOFWEEK': dow,
                'DNG': shift,
                'SHIFT': shift,
                'eff_start': BCMEA_RATES[year]['start'],
                'eff_end': BCMEA_RATES[year]['end'],
                'JOBS': job,
                'LOCATION': location,
                'SUBJOB': subjob,
                'REGHRS': reg_hrs,
                'OTHRS': ot_hrs,
                'REGRATE': reg_rate,
                'OTRATE': ot_rate,
                'DIFFERENTIAL': differential,
                'DIFFERENTIAL_CLASS': diff_class,
                'YEAR': year,
                'SAMPLE_SIZE': sample_size,
                'CONFIDENCE': 'HIGH' if sample_size >= 3 else 'LOW'
            })

df = pd.DataFrame(records)
df.to_csv('pay data/paydiffs_real_combinations.csv', index=False)

print('='*70)
print('GENERATED PAYDIFFS FROM REAL COMBINATIONS ONLY')
print('='*70)
print()
print(f"Source: {len(all_combos)} unique combinations from 71,712 user shifts")
print()
print(f"Generated entries: {len(df):,}")
print(f"  = {len(all_combos)} combos x 4 years x 3 day-types")
print()
print("Breakdown:")
print(f"  High confidence (n>=3): {len(df[df['CONFIDENCE']=='HIGH']):,} entries")
print(f"  Low confidence (n<3):   {len(df[df['CONFIDENCE']=='LOW']):,} entries")
print()
print("By Year:")
for y in [1, 2, 3, 4]:
    print(f"  Year {y} (Apr {2022+y}): {len(df[df['YEAR']==y]):,}")
print()
print("Saved to: pay data/paydiffs_real_combinations.csv")
print()

# Show sample
print("SAMPLE HIGH-VOLUME ENTRIES (Year 2, Mon-Fri):")
print("-"*70)
sample = df[(df['SAMPLE_SIZE'] >= 500) & (df['YEAR'] == 2) & (df['DAYOFWEEK'] == '1 , 2 , 3 , 4 , 5')].head(15)
for _, r in sample.iterrows():
    subjob_str = r['SUBJOB'][:12] if r['SUBJOB'] else '(none)'
    print(f"{r['JOBS'][:18]:<18} | {r['DNG']:<9} | {r['LOCATION']:<12} | {subjob_str:<12} | ${r['REGRATE']:.2f}/hr | n={int(r['SAMPLE_SIZE']):,}")
