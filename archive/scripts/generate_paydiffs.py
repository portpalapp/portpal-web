"""
PORTPAL PAYDIFFS Generator
Generates complete PAYDIFFS entries for all years, jobs, shifts, locations, and subjobs
"""

import pandas as pd
import numpy as np
from itertools import product

# ============================================================================
# BCMEA BASE RATES BY YEAR (from PDF)
# ============================================================================

# Base longshoreman rates (no differential) - Year 1 starts April 1, 2023
BCMEA_RATES = {
    # Year 1: April 1, 2023 - March 31, 2024
    1: {
        'eff_start': 'Apr 1, 2023 12:00 am',
        'eff_end': 'Apr 1, 2024 12:00 am',
        'DAY': {'MON-FRI': 50.64, 'SAT': 64.82, 'SUN': 81.02},
        'NIGHT': {'MON-FRI': 63.80, 'SAT': 81.02, 'SUN': 81.02},
        'GRAVEYARD': {'MON-FRI': 78.80, 'SAT': 81.02, 'SUN': 81.02},
        'OT_MULT': 1.5,
        'DOUBLE_MULT': 2.0,
    },
    # Year 2: April 1, 2024 - March 31, 2025
    2: {
        'eff_start': 'Apr 1, 2024 12:00 am',
        'eff_end': 'Apr 1, 2025 12:00 am',
        'DAY': {'MON-FRI': 53.17, 'SAT': 68.06, 'SUN': 85.07},
        'NIGHT': {'MON-FRI': 66.98, 'SAT': 85.07, 'SUN': 85.07},
        'GRAVEYARD': {'MON-FRI': 82.73, 'SAT': 85.07, 'SUN': 85.07},
        'OT_MULT': 1.5,
        'DOUBLE_MULT': 2.0,
    },
    # Year 3: April 1, 2025 - March 31, 2026
    3: {
        'eff_start': 'Apr 1, 2025 12:00 am',
        'eff_end': 'Apr 1, 2026 12:00 am',
        'DAY': {'MON-FRI': 55.30, 'SAT': 70.78, 'SUN': 88.48},
        'NIGHT': {'MON-FRI': 69.67, 'SAT': 88.48, 'SUN': 88.48},
        'GRAVEYARD': {'MON-FRI': 86.05, 'SAT': 88.48, 'SUN': 88.48},
        'OT_MULT': 1.5,
        'DOUBLE_MULT': 2.0,
    },
    # Year 4: April 1, 2026 - March 31, 2027
    4: {
        'eff_start': 'Apr 1, 2026 12:00 am',
        'eff_end': 'Apr 1, 2027 12:00 am',
        'DAY': {'MON-FRI': 57.51, 'SAT': 73.61, 'SUN': 92.02},
        'NIGHT': {'MON-FRI': 72.45, 'SAT': 92.02, 'SUN': 92.02},
        'GRAVEYARD': {'MON-FRI': 89.49, 'SAT': 92.02, 'SUN': 92.02},
        'OT_MULT': 1.5,
        'DOUBLE_MULT': 2.0,
    },
}

# ============================================================================
# JOB CLASSIFICATIONS AND DIFFERENTIALS
# ============================================================================

DIFFERENTIAL_CLASSES = {
    'CLASS_1': {
        'amount': 2.50,
        'jobs': ['HD MECHANIC', 'CARPENTER', 'ELECTRICIAN', 'MILLWRIGHT', 'PLUMBER', 'TRACKMEN', 'WELDER']
    },
    'CLASS_2': {
        'amount': 1.00,
        'jobs': ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY']
    },
    'CLASS_3': {
        'amount': 0.65,
        'jobs': ['TRACTOR TRAILER', 'LOCI', 'REACHSTACKER', '40 TON (TOP PICK)', 'FRONT END LOADER',
                 'BULLDOZER', 'EXCAVATOR', 'KOMATSU', 'MOBILE CRANE', 'WINCH DRIVER']
    },
    'CLASS_4': {
        'amount': 0.50,
        'jobs': ['LIFT TRUCK', 'STORESPERSON', 'GEARPERSON']
    },
    'WHEAT': {
        'amount': 1.15,
        'jobs': ['WHEAT MACHINE', 'WHEAT SPECIALTY']
    },
    'BASE': {
        'amount': 0.00,
        'jobs': ['LABOUR', 'HEAD CHECKER', 'DOCK CHECKER', 'BUNNY BUS', 'HATCH TENDER/SIGNALS',
                 'LINES', 'LOCKERMAN', 'OB', 'PAINTER', 'PUSHER', 'DOW MEN', 'BULK OPERATOR',
                 'LIQUID BULK', 'TRAINING']
    },
    'TRAINER': {
        'amount': 0.00,  # Uses multiplier instead
        'jobs': ['TRAINER'],
        'multiplier': 1.333333
    }
}

# Create reverse lookup
JOB_TO_CLASS = {}
for class_name, info in DIFFERENTIAL_CLASSES.items():
    for job in info['jobs']:
        JOB_TO_CLASS[job] = class_name

# ============================================================================
# STANDARD HOURS BY JOB/SHIFT/LOCATION/SUBJOB
# ============================================================================

# Default hours
DEFAULT_HOURS = {
    'DAY': {'reg': 8, 'ot': 0},
    'NIGHT': {'reg': 8, 'ot': 0},
    'GRAVEYARD': {'reg': 6.5, 'ot': 0}
}

# Special hour rules (job, shift, location, subjob) -> (reg_hrs, ot_hrs)
SPECIAL_HOURS = {
    # TRACTOR TRAILER - RAIL/SHIP at CENTENNIAL/DELTAPORT
    ('TRACTOR TRAILER', 'DAY', 'CENTENNIAL', 'RAIL (TT)'): (9, 0),
    ('TRACTOR TRAILER', 'DAY', 'CENTENNIAL', 'SHIP (TT)'): (9, 0),
    ('TRACTOR TRAILER', 'DAY', 'DELTAPORT', 'RAIL (TT)'): (9, 0),
    ('TRACTOR TRAILER', 'DAY', 'DELTAPORT', 'SHIP (TT)'): (9, 0),
    ('TRACTOR TRAILER', 'NIGHT', 'CENTENNIAL', 'RAIL (TT)'): (9, 0),
    ('TRACTOR TRAILER', 'NIGHT', 'CENTENNIAL', 'SHIP (TT)'): (9, 0),
    ('TRACTOR TRAILER', 'NIGHT', 'DELTAPORT', 'RAIL (TT)'): (9, 0),
    ('TRACTOR TRAILER', 'NIGHT', 'DELTAPORT', 'SHIP (TT)'): (9, 0),
    ('TRACTOR TRAILER', 'GRAVEYARD', 'CENTENNIAL', 'RAIL (TT)'): (7.5, 0),
    ('TRACTOR TRAILER', 'GRAVEYARD', 'CENTENNIAL', 'SHIP (TT)'): (7.5, 0),
    ('TRACTOR TRAILER', 'GRAVEYARD', 'DELTAPORT', 'RAIL (TT)'): (7.5, 0),
    ('TRACTOR TRAILER', 'GRAVEYARD', 'DELTAPORT', 'SHIP (TT)'): (7.5, 0),

    # WHEAT jobs - all shifts
    ('WHEAT MACHINE', 'DAY', None, ''): (7.5, 0.5),
    ('WHEAT MACHINE', 'NIGHT', None, ''): (7.5, 0.5),
    ('WHEAT MACHINE', 'GRAVEYARD', None, ''): (7.5, 0.5),
    ('WHEAT SPECIALTY', 'DAY', None, ''): (7.5, 0.5),
    ('WHEAT SPECIALTY', 'NIGHT', None, ''): (7.5, 0.5),
    ('WHEAT SPECIALTY', 'GRAVEYARD', None, ''): (7.5, 0.5),

    # RUBBER TIRE GANTRY - Day shift gets 1 OT
    ('RUBBER TIRE GANTRY', 'DAY', None, ''): (8, 1),

    # FIRST AID - gets 1 OT
    ('FIRST AID', 'DAY', None, ''): (8, 1),
    ('FIRST AID', 'NIGHT', None, ''): (8, 1),
    ('FIRST AID', 'GRAVEYARD', None, ''): (8, 1),
}

# ============================================================================
# HEAD CHECKER SPECIAL RULES (from HC DIFFS.xlsx)
# ============================================================================

HEAD_CHECKER_RULES = {
    # VANTERM Mon-Fri
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'INGATE (HC)', '1 , 2 , 3 , 4 , 5'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'OUTGATE (HC)', '1 , 2 , 3 , 4 , 5'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'CANOPY (HC)', '1 , 2 , 3 , 4 , 5'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'GOPHER (HC)', '1 , 2 , 3 , 4 , 5'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'RAIL (HC)', '1 , 2 , 3 , 4 , 5'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'PENTHOUSE (HC)', '1 , 2 , 3 , 4 , 5'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'REEFER (HC)', '1 , 2 , 3 , 4 , 5'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'TOWER (HC)', '1 , 2 , 3 , 4 , 5'): (8, 1),

    ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'INGATE (HC)', '1 , 2 , 3 , 4 , 5'): (8, 1.5),
    ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'OUTGATE (HC)', '1 , 2 , 3 , 4 , 5'): (8, 1.5),
    ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'CANOPY (HC)', '1 , 2 , 3 , 4 , 5'): (8, 1.5),
    ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'PENTHOUSE (HC)', '1 , 2 , 3 , 4 , 5'): (8, 2),
    ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'GOPHER (HC)', '1 , 2 , 3 , 4 , 5'): (8, 1),
    ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'RAIL (HC)', '1 , 2 , 3 , 4 , 5'): (8, 1),
    ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'REEFER (HC)', '1 , 2 , 3 , 4 , 5'): (8, 1),
    ('HEAD CHECKER', 'NIGHT', 'VANTERM', 'TOWER (HC)', '1 , 2 , 3 , 4 , 5'): (8, 0.5),

    ('HEAD CHECKER', 'GRAVEYARD', 'VANTERM', 'PENTHOUSE (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 2),
    ('HEAD CHECKER', 'GRAVEYARD', 'VANTERM', 'GOPHER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 1),
    ('HEAD CHECKER', 'GRAVEYARD', 'VANTERM', 'RAIL (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 1),
    ('HEAD CHECKER', 'GRAVEYARD', 'VANTERM', 'REEFER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 1),
    ('HEAD CHECKER', 'GRAVEYARD', 'VANTERM', 'TOWER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 0.5),

    # VANTERM Sat/Sun
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'TOWER (HC)', '0 , 6'): (8, 0.5),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'GOPHER (HC)', '0 , 6'): (8, 1),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'REEFER (HC)', '0 , 6'): (8, 1),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'RAIL (HC)', '0 , 6'): (8, 1),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'INGATE (HC)', '0 , 6'): (8, 1.5),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'OUTGATE (HC)', '0 , 6'): (8, 1.5),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'CANOPY (HC)', '0 , 6'): (8, 1.5),
    ('HEAD CHECKER', 'DAY', 'VANTERM', 'PENTHOUSE (HC)', '0 , 6'): (8, 2),

    # CENTENNIAL (all days)
    ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'INGATE (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 1),
    ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'CANOPY (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 1),
    ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'GOPHER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 1),
    ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'TOWER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (9, 1),
    ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'EQUIP. CONTROL (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'YARD PLANNER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'RAIL PLANNER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 2),
    ('HEAD CHECKER', 'DAY', 'CENTENNIAL', 'RAIL (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (9, 1),

    ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'INGATE (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 1),
    ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'CANOPY (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 1),
    ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'GOPHER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 1),
    ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'REEFER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 1),
    ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'EQUIP. CONTROL (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 1),
    ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'YARD PLANNER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 2),
    ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'RAIL PLANNER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (8, 2),
    ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'TOWER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (9, 0),
    ('HEAD CHECKER', 'NIGHT', 'CENTENNIAL', 'RAIL (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (9, 1),

    ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'GOPHER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 1),
    ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'REEFER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 1),
    ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'EQUIP. CONTROL (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 1),
    ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'YARD PLANNER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 2),
    ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'RAIL PLANNER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (6.5, 2),
    ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'TOWER (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (7.5, 0),
    ('HEAD CHECKER', 'GRAVEYARD', 'CENTENNIAL', 'RAIL (HC)', '0 , 1 , 2 , 3 , 4 , 5 , 6'): (7.5, 1),
}

# ============================================================================
# LOCATIONS
# ============================================================================

# Standard container terminals
CONTAINER_TERMINALS = ['CENTENNIAL', 'VANTERM', 'DELTAPORT', 'FRASER SURREY']

# Wheat terminals
WHEAT_TERMINALS = ['ALLIANCE GRAIN', 'G3 TERMINAL', 'CASCADIA', 'RICHARDSON', 'CARGILL', 'VITERRA PAC']

# Bulk/other terminals (discovered from user data)
OTHER_TERMINALS = ['LYNNTERM', 'NEPTUNE', 'VAN WHARVES', 'CANADA PLACE', 'PORT MOODY',
                   'SQUAMISH', 'UNIVAR', 'FIBRECO', 'CHEMTRADE', 'BC SUGAR', 'ANNACIS AUTO',
                   'WATERFRONT TRAIN. CNTR']

ALL_LOCATIONS = CONTAINER_TERMINALS + WHEAT_TERMINALS + OTHER_TERMINALS

# ============================================================================
# SUBJOBS
# ============================================================================

SUBJOBS_BY_JOB = {
    'TRACTOR TRAILER': ['RAIL (TT)', 'SHIP (TT)', 'YARD (TT)', 'BARGE (TT)', ''],
    'HEAD CHECKER': ['TOWER (HC)', 'RAIL (HC)', 'INGATE (HC)', 'OUTGATE (HC)', 'CANOPY (HC)',
                     'GOPHER (HC)', 'PENTHOUSE (HC)', 'REEFER (HC)', 'EQUIP. CONTROL (HC)',
                     'YARD PLANNER (HC)', 'RAIL PLANNER (HC)', 'RAIL PLNR -GOPHER  (HC)', ''],
    'LABOUR': ['SHEDMEN (LAB)', 'LASHING (LAB)', 'COASTWISE (LAB)', 'HOLD (LAB)',
               'JANITOR (LAB)', 'UTILITY (LAB)', 'SPARE (LAB)', 'SLINGMAN (LAB)', ''],
    'FIRST AID': ['DOCK (FA)', 'SHIP (FA)', 'STORES (FA)', ''],
    'TRAINER': ['BLANK (TRNR)', 'SENIOR (TRNR)', ''],
}

# Jobs with no subjobs
JOBS_NO_SUBJOB = ['RUBBER TIRE GANTRY', 'WHEAT MACHINE', 'WHEAT SPECIALTY', 'HD MECHANIC',
                  'CARPENTER', 'ELECTRICIAN', 'MILLWRIGHT', 'PLUMBER', 'TRACKMEN', 'WELDER',
                  'LIFT TRUCK', 'BUNNY BUS', 'DOCK CHECKER', 'BULK OPERATOR', 'LIQUID BULK',
                  'LOCI', 'REACHSTACKER', '40 TON (TOP PICK)', 'FRONT END LOADER', 'BULLDOZER',
                  'EXCAVATOR', 'KOMATSU', 'MOBILE CRANE', 'WINCH DRIVER', 'RAIL MOUNTED GANTRY',
                  'SHIP GANTRY', 'DOCK GANTRY', 'STORESPERSON', 'GEARPERSON', 'HATCH TENDER/SIGNALS',
                  'LINES', 'LOCKERMAN', 'OB', 'PAINTER', 'PUSHER', 'DOW MEN', 'TRAINING']


# ============================================================================
# RATE CALCULATION FUNCTIONS
# ============================================================================

def get_differential(job):
    """Get the hourly differential for a job"""
    job_class = JOB_TO_CLASS.get(job, 'BASE')
    return DIFFERENTIAL_CLASSES[job_class]['amount']

def get_differential_class(job):
    """Get the classification name for a job"""
    return JOB_TO_CLASS.get(job, 'BASE')

def calculate_rates(year, shift, day_type, job):
    """Calculate regular and OT rates for a job/shift/day combination"""
    year_data = BCMEA_RATES[year]
    base_rate = year_data[shift][day_type]

    job_class = JOB_TO_CLASS.get(job, 'BASE')

    # Special handling for TRAINER
    if job_class == 'TRAINER':
        multiplier = DIFFERENTIAL_CLASSES['TRAINER']['multiplier']
        reg_rate = base_rate * multiplier
        differential = reg_rate - base_rate
    else:
        differential = DIFFERENTIAL_CLASSES[job_class]['amount']
        reg_rate = base_rate + differential

    ot_rate = reg_rate * year_data['OT_MULT']

    return {
        'base_rate': base_rate,
        'differential': differential,
        'reg_rate': round(reg_rate, 2),
        'ot_rate': round(ot_rate, 2)
    }

def get_hours(job, shift, location, subjob):
    """Get regular and OT hours for a combination"""
    # Check special rules first
    key = (job, shift, location, subjob)
    if key in SPECIAL_HOURS:
        return SPECIAL_HOURS[key]

    # Check with None location (applies to all locations)
    key_any_loc = (job, shift, None, subjob)
    if key_any_loc in SPECIAL_HOURS:
        return SPECIAL_HOURS[key_any_loc]

    # Check with empty subjob
    key_no_subjob = (job, shift, location, '')
    if key_no_subjob in SPECIAL_HOURS:
        return SPECIAL_HOURS[key_no_subjob]

    key_any = (job, shift, None, '')
    if key_any in SPECIAL_HOURS:
        return SPECIAL_HOURS[key_any]

    # Return defaults
    return (DEFAULT_HOURS[shift]['reg'], DEFAULT_HOURS[shift]['ot'])


# ============================================================================
# GENERATE ALL PAYDIFFS
# ============================================================================

def generate_paydiffs():
    """Generate all PAYDIFF entries"""
    records = []

    # All canonical jobs
    ALL_JOBS = list(JOB_TO_CLASS.keys())

    for year in [1, 2, 3, 4]:
        year_data = BCMEA_RATES[year]

        for job in ALL_JOBS:
            # Determine locations for this job
            if job in ['WHEAT MACHINE', 'WHEAT SPECIALTY']:
                locations = WHEAT_TERMINALS
            else:
                locations = ALL_LOCATIONS

            # Determine subjobs for this job
            if job in JOBS_NO_SUBJOB:
                subjobs = ['']
            else:
                subjobs = SUBJOBS_BY_JOB.get(job, [''])

            for shift in ['DAY', 'NIGHT', 'GRAVEYARD']:
                for location in locations:
                    for subjob in subjobs:
                        # Determine day types to generate
                        # Mon-Fri, Sat, Sun have different rates
                        day_configs = [
                            ('1 , 2 , 3 , 4 , 5', 'MON-FRI'),
                            ('6', 'SAT'),
                            ('0', 'SUN'),
                        ]

                        for dayofweek, day_type in day_configs:
                            # Skip if HEAD CHECKER with specific dayofweek rules
                            if job == 'HEAD CHECKER' and subjob:
                                hc_key = (job, shift, location, subjob, dayofweek)
                                if hc_key in HEAD_CHECKER_RULES:
                                    reg_hrs, ot_hrs = HEAD_CHECKER_RULES[hc_key]
                                else:
                                    # Check for all-days version
                                    hc_key_all = (job, shift, location, subjob, '0 , 1 , 2 , 3 , 4 , 5 , 6')
                                    if hc_key_all in HEAD_CHECKER_RULES:
                                        reg_hrs, ot_hrs = HEAD_CHECKER_RULES[hc_key_all]
                                    else:
                                        reg_hrs, ot_hrs = get_hours(job, shift, location, subjob)
                            else:
                                reg_hrs, ot_hrs = get_hours(job, shift, location, subjob)

                            rates = calculate_rates(year, shift, day_type, job)

                            record = {
                                'DAYOFWEEK': dayofweek,
                                'DNG': shift,
                                'SHIFT': shift,
                                'eff_start': year_data['eff_start'],
                                'eff_end': year_data['eff_end'],
                                'JOBS': job,
                                'LOCATION': location,
                                'SUBJOB': subjob,
                                'REGHRS': reg_hrs,
                                'OTHRS': ot_hrs,
                                'REGRATE': rates['reg_rate'],
                                'OTRATE': rates['ot_rate'],
                                'DIFFERENTIAL': rates['differential'],
                                'DIFFERENTIAL_CLASS': get_differential_class(job),
                                'YEAR': year,
                            }
                            records.append(record)

    return pd.DataFrame(records)


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("Generating PAYDIFFS entries...")

    df = generate_paydiffs()

    # Remove duplicates (same combo but different dayofweek if hours are same)
    print(f"Total entries generated: {len(df)}")

    # Save to CSV
    output_path = r'C:\Users\veete\OneDrive\Desktop\claude_projects\portpal\pay data\generated_paydiffs_all_years.csv'
    df.to_csv(output_path, index=False)
    print(f"Saved to: {output_path}")

    # Summary
    print("\n=== SUMMARY ===")
    print(f"Total entries: {len(df)}")
    print(f"Years: {df['YEAR'].unique()}")
    print(f"Jobs: {df['JOBS'].nunique()}")
    print(f"Locations: {df['LOCATION'].nunique()}")
    print(f"Shifts: {df['DNG'].unique()}")

    # Sample output
    print("\n=== SAMPLE ENTRIES ===")
    print(df.head(20).to_string())

    # Also create Bubble-formatted version (without YEAR column, adjusted format)
    bubble_df = df.copy()

    # Format for Bubble - group by combination and use ` , ` delimiter
    print("\n=== BUBBLE FORMAT SAMPLE ===")
    print(bubble_df.head(10).to_string())
