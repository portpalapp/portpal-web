import csv
import json
from collections import defaultdict, Counter
from datetime import datetime
import re

# Read the CSV file
csv_path = r"C:\Users\veete\OneDrive\Desktop\claude_projects\portpal\pay data\user shift data\export_All-SHIFTS-modified--_2026-02-01_05-58-52.csv"

data = []
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        data.append(row)

print(f"Total shifts loaded: {len(data)}")

# 1. HEADLINE STATS
users = set()
dates = []
total_pay = 0
valid_pay_count = 0

for row in data:
    user = row.get('relUser', '').strip()
    if user:
        users.add(user)

    date_str = row.get('DATE', '').strip()
    if date_str:
        try:
            # Parse various date formats
            for fmt in ['%b %d, %Y %I:%M %p', '%b %d, %Y %H:%M %p', '%b %d, %Y']:
                try:
                    dt = datetime.strptime(date_str.split(' 12:')[0] if '12:00 am' in date_str.lower() else date_str[:12], '%b %d, %Y')
                    dates.append(dt)
                    break
                except:
                    pass
        except:
            pass

    pay_str = row.get('totalpay', '').strip()
    if pay_str:
        try:
            pay = float(pay_str)
            if pay > 0:
                total_pay += pay
                valid_pay_count += 1
        except:
            pass

print(f"\n=== HEADLINE STATS ===")
print(f"Total shifts: {len(data)}")
print(f"Unique users: {len(users)}")
print(f"Total earnings tracked: ${total_pay:,.2f}")
print(f"Shifts with pay data: {valid_pay_count}")

if dates:
    dates.sort()
    print(f"Date range: {dates[0].strftime('%b %d, %Y')} to {dates[-1].strftime('%b %d, %Y')}")
    days_span = (dates[-1] - dates[0]).days
    print(f"Days span: {days_span} days")

# 2. JOB DISTRIBUTION
job_counts = Counter()
job_pay = defaultdict(list)
job_rates = defaultdict(list)

for row in data:
    job = row.get('JOB', '').strip()
    if job:
        job_counts[job] += 1
        pay_str = row.get('totalpay', '').strip()
        if pay_str:
            try:
                pay = float(pay_str)
                if pay > 0:
                    job_pay[job].append(pay)
            except:
                pass

        reg_rate = row.get('REG RT', '').strip()
        if reg_rate:
            try:
                rate = float(reg_rate)
                if rate > 0:
                    job_rates[job].append(rate)
            except:
                pass

print(f"\n=== JOB DISTRIBUTION ===")
print(f"Unique job types: {len(job_counts)}")
print("\nTop 15 Most Common Jobs:")
for job, count in job_counts.most_common(15):
    pct = count / len(data) * 100
    avg_pay = sum(job_pay[job]) / len(job_pay[job]) if job_pay[job] else 0
    print(f"  {job}: {count} shifts ({pct:.1f}%) - Avg pay: ${avg_pay:.2f}")

print("\nHighest Paying Jobs (by average shift pay):")
job_avg_pay = {job: sum(pays)/len(pays) for job, pays in job_pay.items() if pays}
sorted_by_pay = sorted(job_avg_pay.items(), key=lambda x: x[1], reverse=True)[:10]
for job, avg in sorted_by_pay:
    print(f"  {job}: ${avg:.2f} avg per shift ({job_counts[job]} shifts)")

# Rate variance by job
print("\nJobs with Most Rate Variation:")
job_rate_variance = {}
for job, rates in job_rates.items():
    if len(rates) >= 5:
        unique_rates = len(set(rates))
        rate_range = max(rates) - min(rates)
        job_rate_variance[job] = (unique_rates, rate_range, len(rates))

sorted_variance = sorted(job_rate_variance.items(), key=lambda x: x[1][0], reverse=True)[:10]
for job, (unique, rng, count) in sorted_variance:
    print(f"  {job}: {unique} different rates (range: ${rng:.2f}) across {count} shifts")

# 3. COMPLEXITY PROOF
combos = set()
user_combos = defaultdict(set)

for row in data:
    job = row.get('JOB', '').strip()
    shift = row.get('DNG', '').strip()
    location = row.get('LOCATION', '').strip()
    subjob = row.get('SUBJOB', '').strip() or row.get('subjob', '').strip()
    user = row.get('relUser', '').strip()

    if job:
        combo = (job, shift, location, subjob)
        combos.add(combo)
        if user:
            user_combos[user].add(combo)

print(f"\n=== COMPLEXITY PROOF ===")
print(f"Unique job/shift/location/subjob combinations: {len(combos)}")
if user_combos:
    avg_combos = sum(len(c) for c in user_combos.values()) / len(user_combos)
    max_combos = max(len(c) for c in user_combos.values())
    print(f"Average combos per user: {avg_combos:.1f}")
    print(f"Max combos by single user: {max_combos}")

# 4. PAY DISCREPANCY SIGNALS
modified_rates = 0
discrepancy_notes = []
note_keywords = ['shortage', 'underpaid', 'wrong', 'error', 'short', 'missing', 'owe', 'incorrect']

# Track rate variance per job/shift combo
rate_by_combo = defaultdict(list)

for row in data:
    job = row.get('JOB', '').strip()
    shift = row.get('DNG', '').strip()
    reg_rate = row.get('REG RT', '').strip()
    notes = row.get('notes', '').strip().lower()

    if notes:
        for kw in note_keywords:
            if kw in notes:
                discrepancy_notes.append((row.get('relUser', ''), notes, row.get('DATE', '')))
                break

    if job and shift and reg_rate:
        try:
            rate = float(reg_rate)
            if rate > 0:
                rate_by_combo[(job, shift)].append(rate)
        except:
            pass

print(f"\n=== PAY DISCREPANCY SIGNALS ===")

# Entries with discrepancy-related notes
print(f"Entries with discrepancy-related notes: {len(discrepancy_notes)}")
if discrepancy_notes[:5]:
    print("Sample discrepancy notes:")
    for user, note, date in discrepancy_notes[:5]:
        print(f"  - '{note[:80]}...' ({date[:12]})")

# Rate variance analysis
print("\nJob/Shift combos with significant rate variance:")
variance_combos = []
for (job, shift), rates in rate_by_combo.items():
    if len(rates) >= 3:
        unique = len(set(rates))
        if unique > 1:
            rng = max(rates) - min(rates)
            variance_combos.append((job, shift, unique, rng, len(rates)))

variance_combos.sort(key=lambda x: x[3], reverse=True)
for job, shift, unique, rng, count in variance_combos[:10]:
    print(f"  {job} ({shift}): {unique} rates, ${rng:.2f} range, {count} entries")

# 5. USER ENGAGEMENT PATTERNS
user_shifts = defaultdict(list)
user_dates = defaultdict(list)

for row in data:
    user = row.get('relUser', '').strip()
    if user:
        user_shifts[user].append(row)
        date_str = row.get('DATE', '').strip()
        if date_str:
            try:
                dt = datetime.strptime(date_str[:12], '%b %d, %Y')
                user_dates[user].append(dt)
            except:
                pass

print(f"\n=== USER ENGAGEMENT PATTERNS ===")

# Power users
print("Top 10 Power Users (most entries):")
power_users = sorted(user_shifts.items(), key=lambda x: len(x[1]), reverse=True)[:10]
for user, shifts in power_users:
    # Calculate total earnings for this user
    user_earnings = sum(float(s.get('totalpay', 0) or 0) for s in shifts)
    print(f"  {user[:25]}: {len(shifts)} shifts, ${user_earnings:,.2f} tracked")

# User tenure
print("\nUser Tracking Duration:")
long_trackers = []
for user, dates_list in user_dates.items():
    if dates_list:
        dates_list.sort()
        duration = (dates_list[-1] - dates_list[0]).days
        long_trackers.append((user, duration, len(dates_list)))

long_trackers.sort(key=lambda x: x[1], reverse=True)
for user, duration, count in long_trackers[:5]:
    print(f"  {user[:25]}: {duration} days tracking period, {count} shifts")

# Entry frequency
print("\nEntry Frequency Analysis:")
total_entries = len(data)
unique_users = len(user_shifts)
avg_per_user = total_entries / unique_users if unique_users else 0
print(f"  Average entries per user: {avg_per_user:.1f}")

# 6. MARKETING HOOKS
print(f"\n=== MARKETING HOOKS ===")

# Complex weeks
user_week_jobs = defaultdict(lambda: defaultdict(set))
for row in data:
    user = row.get('relUser', '').strip()
    job = row.get('JOB', '').strip()
    date_str = row.get('DATE', '').strip()
    if user and job and date_str:
        try:
            dt = datetime.strptime(date_str[:12], '%b %d, %Y')
            week_key = dt.strftime('%Y-W%W')
            user_week_jobs[user][week_key].add(job)
        except:
            pass

max_jobs_week = 0
max_jobs_user = None
max_jobs_week_key = None
for user, weeks in user_week_jobs.items():
    for week, jobs in weeks.items():
        if len(jobs) > max_jobs_week:
            max_jobs_week = len(jobs)
            max_jobs_user = user
            max_jobs_week_key = week

print(f"Most complex week: User worked {max_jobs_week} different job types in a single week")

# Job types per month per user
monthly_job_counts = []
for user, weeks in user_week_jobs.items():
    all_jobs_user = set()
    for jobs in weeks.values():
        all_jobs_user.update(jobs)
    if len(all_jobs_user) > 1:
        monthly_job_counts.append(len(all_jobs_user))

if monthly_job_counts:
    avg_job_types = sum(monthly_job_counts) / len(monthly_job_counts)
    print(f"Average user tracks {avg_job_types:.1f} different job types")

# Users who caught discrepancies (modified rates from defaults)
# Define default rates
default_rates = {53.17, 66.98, 82.73, 85.07, 68.06}  # Common base rates

modified_from_default = 0
for row in data:
    reg_rate = row.get('REG RT', '').strip()
    if reg_rate:
        try:
            rate = float(reg_rate)
            if rate > 0 and rate not in default_rates:
                modified_from_default += 1
        except:
            pass

print(f"Entries with non-default rates (potential corrections): {modified_from_default}")

# 7. TESTIMONIAL SEEDS
print(f"\n=== TESTIMONIAL SEEDS ===")

# Find user with most tracking
if power_users:
    top_user, top_shifts = power_users[0]
    top_earnings = sum(float(s.get('totalpay', 0) or 0) for s in top_shifts)
    top_dates = []
    for s in top_shifts:
        date_str = s.get('DATE', '')
        if date_str:
            try:
                dt = datetime.strptime(date_str[:12].strip(), '%b %d, %Y')
                top_dates.append(dt)
            except:
                pass
    if top_dates:
        top_dates.sort()
        top_duration = (top_dates[-1] - top_dates[0]).days
        print(f"Power user: Tracked {len(top_shifts)} shifts totaling ${top_earnings:,.2f} over {top_duration} days")

# Find user with most job variety
max_variety_user = None
max_variety = 0
for user, weeks in user_week_jobs.items():
    all_jobs = set()
    for jobs in weeks.values():
        all_jobs.update(jobs)
    if len(all_jobs) > max_variety:
        max_variety = len(all_jobs)
        max_variety_user = user

if max_variety_user:
    user_shifts_count = len(user_shifts.get(max_variety_user, []))
    user_locs = set(s.get('LOCATION', '') for s in user_shifts.get(max_variety_user, []) if s.get('LOCATION'))
    print(f"Variety champion: One user tracked {max_variety} different job types across {len(user_locs)} terminals")

# Location distribution
locations = Counter()
for row in data:
    loc = row.get('LOCATION', '').strip()
    if loc:
        locations[loc] += 1

print(f"\nLocations tracked: {len(locations)} unique terminals")
print("Top terminals:")
for loc, count in locations.most_common(5):
    print(f"  {loc}: {count} shifts")

# Shift distribution
shifts = Counter()
for row in data:
    shift = row.get('DNG', '').strip()
    if shift:
        shifts[shift] += 1

print(f"\nShift distribution:")
for shift, count in shifts.most_common():
    if shift:
        pct = count / len(data) * 100
        print(f"  {shift}: {count} ({pct:.1f}%)")

# Save summary as JSON for easy access
summary = {
    "total_shifts": len(data),
    "unique_users": len(users),
    "total_earnings": round(total_pay, 2),
    "unique_jobs": len(job_counts),
    "unique_combos": len(combos),
    "top_jobs": [(j, c) for j, c in job_counts.most_common(10)],
    "top_locations": [(l, c) for l, c in locations.most_common(10)],
    "power_users_count": len([u for u, s in user_shifts.items() if len(s) >= 100])
}

with open(r"C:\Users\veete\OneDrive\Desktop\claude_projects\portpal\analysis_summary.json", 'w') as f:
    json.dump(summary, f, indent=2)

print("\n\nAnalysis complete. Summary saved to analysis_summary.json")
