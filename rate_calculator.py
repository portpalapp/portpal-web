"""
PORTPAL Rate Calculator
Test tool to calculate pay for any job/shift/location/date combination
"""

import pandas as pd
from datetime import datetime, date

# Load the generated PAYDIFFS
PAYDIFFS_PATH = r'C:\Users\veete\OneDrive\Desktop\claude_projects\portpal\pay data\generated_paydiffs_all_years.csv'

def load_paydiffs():
    """Load and index PAYDIFFS data"""
    df = pd.read_csv(PAYDIFFS_PATH)
    return df

def get_day_of_week(input_date):
    """Convert date to day of week number (0=Sunday, 6=Saturday)"""
    if isinstance(input_date, str):
        input_date = datetime.strptime(input_date, '%Y-%m-%d').date()

    # Python weekday(): Monday=0, Sunday=6
    # We need: Sunday=0, Saturday=6
    python_dow = input_date.weekday()
    bubble_dow = (python_dow + 1) % 7
    return bubble_dow

def get_year_from_date(input_date):
    """Determine which rate year applies based on date"""
    if isinstance(input_date, str):
        input_date = datetime.strptime(input_date, '%Y-%m-%d').date()

    # Year 1: Apr 1, 2023 - Mar 31, 2024
    # Year 2: Apr 1, 2024 - Mar 31, 2025
    # Year 3: Apr 1, 2025 - Mar 31, 2026
    # Year 4: Apr 1, 2026 - Mar 31, 2027

    if input_date < date(2024, 4, 1):
        return 1
    elif input_date < date(2025, 4, 1):
        return 2
    elif input_date < date(2026, 4, 1):
        return 3
    else:
        return 4

def calculate_pay(job, shift, location, input_date, subjob='', reg_hrs=None, ot_hrs=None):
    """
    Calculate pay for a shift

    Args:
        job: Job name (e.g., 'TRACTOR TRAILER')
        shift: 'DAY', 'NIGHT', or 'GRAVEYARD'
        location: Location name (e.g., 'CENTENNIAL')
        input_date: Date string 'YYYY-MM-DD' or date object
        subjob: Optional subjob (e.g., 'RAIL (TT)')
        reg_hrs: Override regular hours (uses default if None)
        ot_hrs: Override OT hours (uses default if None)

    Returns:
        Dictionary with calculation details
    """
    df = load_paydiffs()

    # Get day of week and year
    dow = get_day_of_week(input_date)
    year = get_year_from_date(input_date)

    # Determine dayofweek string
    if dow in [1, 2, 3, 4, 5]:  # Mon-Fri
        dow_str = '1 , 2 , 3 , 4 , 5'
    elif dow == 6:  # Saturday
        dow_str = '6'
    else:  # Sunday
        dow_str = '0'

    # Find matching PAYDIFF
    mask = (
        (df['JOBS'] == job) &
        (df['DNG'] == shift) &
        (df['LOCATION'] == location) &
        (df['DAYOFWEEK'] == dow_str) &
        (df['YEAR'] == year)
    )

    if subjob:
        mask = mask & (df['SUBJOB'] == subjob)
    else:
        mask = mask & ((df['SUBJOB'] == '') | (df['SUBJOB'].isna()))

    matches = df[mask]

    if len(matches) == 0:
        # Try without subjob filter
        mask_no_subjob = (
            (df['JOBS'] == job) &
            (df['DNG'] == shift) &
            (df['LOCATION'] == location) &
            (df['DAYOFWEEK'] == dow_str) &
            (df['YEAR'] == year) &
            ((df['SUBJOB'] == '') | (df['SUBJOB'].isna()))
        )
        matches = df[mask_no_subjob]

    if len(matches) == 0:
        return {
            'error': f'No matching PAYDIFF found for {job} | {shift} | {location} | Year {year}',
            'search_params': {
                'job': job,
                'shift': shift,
                'location': location,
                'subjob': subjob,
                'dayofweek': dow_str,
                'year': year
            }
        }

    paydiff = matches.iloc[0]

    # Use provided hours or defaults from PAYDIFF
    actual_reg_hrs = reg_hrs if reg_hrs is not None else paydiff['REGHRS']
    actual_ot_hrs = ot_hrs if ot_hrs is not None else paydiff['OTHRS']

    # Calculate pay
    reg_pay = actual_reg_hrs * paydiff['REGRATE']
    ot_pay = actual_ot_hrs * paydiff['OTRATE']
    total_pay = reg_pay + ot_pay

    return {
        'input': {
            'job': job,
            'shift': shift,
            'location': location,
            'subjob': subjob,
            'date': str(input_date),
            'day_of_week': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow],
        },
        'paydiff_matched': {
            'dayofweek': paydiff['DAYOFWEEK'],
            'year': paydiff['YEAR'],
            'eff_start': paydiff['eff_start'],
            'eff_end': paydiff['eff_end'],
        },
        'rates': {
            'differential_class': paydiff['DIFFERENTIAL_CLASS'],
            'differential': paydiff['DIFFERENTIAL'],
            'reg_rate': paydiff['REGRATE'],
            'ot_rate': paydiff['OTRATE'],
        },
        'hours': {
            'default_reg': paydiff['REGHRS'],
            'default_ot': paydiff['OTHRS'],
            'actual_reg': actual_reg_hrs,
            'actual_ot': actual_ot_hrs,
        },
        'pay': {
            'reg_pay': round(reg_pay, 2),
            'ot_pay': round(ot_pay, 2),
            'total_pay': round(total_pay, 2),
        }
    }


def interactive_calculator():
    """Interactive command-line calculator"""
    print("=" * 60)
    print("PORTPAL PAY RATE CALCULATOR")
    print("=" * 60)
    print()

    # Load data to show options
    df = load_paydiffs()

    while True:
        print("\nEnter shift details (or 'quit' to exit):")
        print("-" * 40)

        job = input("Job: ").strip().upper()
        if job.lower() == 'quit':
            break

        shift = input("Shift (DAY/NIGHT/GRAVEYARD): ").strip().upper()
        location = input("Location: ").strip().upper()
        date_str = input("Date (YYYY-MM-DD): ").strip()
        subjob = input("Subjob (optional, press Enter to skip): ").strip()

        result = calculate_pay(job, shift, location, date_str, subjob)

        print("\n" + "=" * 60)
        if 'error' in result:
            print(f"ERROR: {result['error']}")
            print(f"Search params: {result['search_params']}")
        else:
            print("CALCULATION RESULT:")
            print("-" * 40)
            print(f"Job: {result['input']['job']}")
            print(f"Shift: {result['input']['shift']}")
            print(f"Location: {result['input']['location']}")
            print(f"Subjob: {result['input']['subjob'] or '(none)'}")
            print(f"Date: {result['input']['date']} ({result['input']['day_of_week']})")
            print()
            print(f"Rate Year: {result['paydiff_matched']['year']}")
            print(f"Differential Class: {result['rates']['differential_class']}")
            print(f"Differential: ${result['rates']['differential']:.2f}/hr")
            print()
            print(f"Regular Rate: ${result['rates']['reg_rate']:.2f}/hr")
            print(f"OT Rate: ${result['rates']['ot_rate']:.2f}/hr")
            print()
            print(f"Hours: {result['hours']['actual_reg']} reg + {result['hours']['actual_ot']} OT")
            print()
            print(f"Regular Pay: ${result['pay']['reg_pay']:.2f}")
            print(f"OT Pay: ${result['pay']['ot_pay']:.2f}")
            print(f"TOTAL PAY: ${result['pay']['total_pay']:.2f}")
        print("=" * 60)


# Quick test examples
if __name__ == '__main__':
    print("Running test calculations...\n")

    test_cases = [
        # (job, shift, location, date, subjob)
        ('TRACTOR TRAILER', 'DAY', 'CENTENNIAL', '2024-12-15', 'RAIL (TT)'),  # Sunday Year 2
        ('TRACTOR TRAILER', 'NIGHT', 'CENTENNIAL', '2024-12-16', 'SHIP (TT)'),  # Monday Year 2
        ('WHEAT SPECIALTY', 'DAY', 'CASCADIA', '2025-06-15', ''),  # Sunday Year 3
        ('HD MECHANIC', 'NIGHT', 'DELTAPORT', '2024-07-06', ''),  # Saturday Year 2
        ('HEAD CHECKER', 'DAY', 'VANTERM', '2025-01-15', 'TOWER (HC)'),  # Wednesday Year 2
        ('RUBBER TIRE GANTRY', 'DAY', 'CENTENNIAL', '2024-05-06', ''),  # Monday Year 2
        ('FIRST AID', 'GRAVEYARD', 'VAN WHARVES', '2026-01-10', 'DOCK (FA)'),  # Saturday Year 3
    ]

    for job, shift, location, date_str, subjob in test_cases:
        print(f"\n{'='*60}")
        print(f"TEST: {job} | {shift} | {location} | {date_str} | {subjob or '(no subjob)'}")
        print('='*60)

        result = calculate_pay(job, shift, location, date_str, subjob)

        if 'error' in result:
            print(f"ERROR: {result['error']}")
        else:
            print(f"Day: {result['input']['day_of_week']}")
            print(f"Year: {result['paydiff_matched']['year']}")
            print(f"Rates: ${result['rates']['reg_rate']}/hr reg, ${result['rates']['ot_rate']}/hr OT")
            print(f"Hours: {result['hours']['actual_reg']} reg + {result['hours']['actual_ot']} OT")
            print(f"TOTAL PAY: ${result['pay']['total_pay']:.2f}")

    print("\n" + "="*60)
    print("To run interactive mode, call: interactive_calculator()")
