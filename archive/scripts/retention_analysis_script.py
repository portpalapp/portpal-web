"""
PORTPAL Retention Analysis Script
Comprehensive analysis of user retention, churn, and cohort patterns
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

# Load the data
print("Loading data...")
df = pd.read_csv(r"C:\Users\veete\OneDrive\Desktop\claude_projects\portpal\pay data\user shift data\export_All-SHIFTS-modified--_2026-02-01_05-58-52.csv")

print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")

# Parse dates
df['DATE'] = pd.to_datetime(df['DATE'], format='mixed', errors='coerce')
df['Creation Date'] = pd.to_datetime(df['Creation Date'], format='mixed', errors='coerce')

# User identifier column
df['user'] = df['relUser'].str.strip().str.lower()

# Remove rows without valid user or date
df = df.dropna(subset=['user', 'DATE'])
df = df[df['user'] != '']

print(f"Valid rows after cleaning: {len(df)}")
print(f"Unique users: {df['user'].nunique()}")
print(f"Date range: {df['DATE'].min()} to {df['DATE'].max()}")

# Reference date for churn calculation (data export date)
REFERENCE_DATE = pd.Timestamp('2026-02-01')

# ============================================
# 1. COHORT ANALYSIS
# ============================================
print("\n" + "="*60)
print("1. COHORT ANALYSIS")
print("="*60)

# Get first shift date for each user (their "signup" cohort)
user_first_shift = df.groupby('user')['DATE'].min().reset_index()
user_first_shift.columns = ['user', 'first_shift_date']
user_first_shift['cohort_month'] = user_first_shift['first_shift_date'].dt.to_period('M')

# Get all activity by user and month
df['activity_month'] = df['DATE'].dt.to_period('M')
user_activity = df.groupby(['user', 'activity_month']).size().reset_index(name='shift_count')

# Merge to get cohort info
user_activity = user_activity.merge(user_first_shift[['user', 'cohort_month']], on='user')

# Calculate months since cohort start
user_activity['months_since_start'] = (
    user_activity['activity_month'].astype('int64') -
    user_activity['cohort_month'].astype('int64')
)

# Build cohort table
cohort_data = user_activity.groupby(['cohort_month', 'months_since_start'])['user'].nunique().reset_index()
cohort_data.columns = ['cohort_month', 'months_since_start', 'users']

# Pivot to create cohort retention table
cohort_pivot = cohort_data.pivot(index='cohort_month', columns='months_since_start', values='users')
cohort_pivot = cohort_pivot.fillna(0).astype(int)

# Cohort sizes (month 0)
cohort_sizes = cohort_pivot[0].copy() if 0 in cohort_pivot.columns else cohort_pivot.iloc[:, 0].copy()

# Calculate retention percentages
cohort_retention_pct = cohort_pivot.div(cohort_sizes, axis=0) * 100

print("\nCohort Sizes (users who started each month):")
for idx, val in cohort_sizes.items():
    print(f"  {idx}: {val} users")

print("\nCohort Retention Table (Raw User Counts):")
print(cohort_pivot.to_string())

print("\nCohort Retention Table (Percentage):")
print(cohort_retention_pct.round(1).to_string())

# Average retention by month
avg_retention = cohort_retention_pct.mean(axis=0)
print("\nAverage Retention Rate by Month Since Start:")
for month, rate in avg_retention.items():
    if month <= 12:  # Only show first 12 months
        print(f"  Month {month}: {rate:.1f}%")

# ============================================
# 2. CHURN PATTERNS
# ============================================
print("\n" + "="*60)
print("2. CHURN PATTERNS")
print("="*60)

# Get last shift date for each user
user_last_shift = df.groupby('user')['DATE'].max().reset_index()
user_last_shift.columns = ['user', 'last_shift_date']

# Merge with first shift
user_stats = user_first_shift.merge(user_last_shift, on='user')
user_stats['days_since_last_shift'] = (REFERENCE_DATE - user_stats['last_shift_date']).dt.days

# Define churn: no activity in 30+ days
user_stats['churned'] = user_stats['days_since_last_shift'] >= 30

# Shift counts per user
shift_counts = df.groupby('user').size().reset_index(name='total_shifts')
user_stats = user_stats.merge(shift_counts, on='user')

# User active days span
user_stats['active_span_days'] = (user_stats['last_shift_date'] - user_stats['first_shift_date']).dt.days

total_users = len(user_stats)
churned_users = user_stats['churned'].sum()
active_users = total_users - churned_users

print(f"\nTotal users: {total_users}")
print(f"Churned users (no shift in 30+ days): {churned_users} ({churned_users/total_users*100:.1f}%)")
print(f"Active users: {active_users} ({active_users/total_users*100:.1f}%)")

# Average time before churn
churned_stats = user_stats[user_stats['churned']]
if len(churned_stats) > 0:
    avg_active_span = churned_stats['active_span_days'].mean()
    median_active_span = churned_stats['active_span_days'].median()
    print(f"\nChurned users - average active span: {avg_active_span:.1f} days")
    print(f"Churned users - median active span: {median_active_span:.1f} days")

# Single-shift users
single_shift_users = user_stats[user_stats['total_shifts'] == 1]
print(f"\nSingle-shift users (logged only 1 shift): {len(single_shift_users)} ({len(single_shift_users)/total_users*100:.1f}%)")

# Shifts before churn
print("\nShifts logged before churning (churned users only):")
churned_shift_dist = churned_stats['total_shifts'].describe()
print(f"  Mean: {churned_shift_dist['mean']:.1f}")
print(f"  Median: {churned_shift_dist['50%']:.1f}")
print(f"  Min: {churned_shift_dist['min']:.0f}")
print(f"  Max: {churned_shift_dist['max']:.0f}")

# Distribution of shifts before churn
bins = [0, 1, 2, 3, 5, 10, 20, 50, 100, float('inf')]
labels = ['1', '2', '3', '4-5', '6-10', '11-20', '21-50', '51-100', '100+']
churned_stats['shift_bucket'] = pd.cut(churned_stats['total_shifts'], bins=bins, labels=labels, right=True)
shift_churn_dist = churned_stats['shift_bucket'].value_counts().sort_index()
print("\nDistribution of shifts logged before churning:")
for bucket, count in shift_churn_dist.items():
    pct = count / len(churned_stats) * 100
    print(f"  {bucket} shifts: {count} users ({pct:.1f}%)")

# ============================================
# 3. POWER USER ANALYSIS
# ============================================
print("\n" + "="*60)
print("3. POWER USER ANALYSIS")
print("="*60)

# Calculate shifts per month for each user
user_monthly = df.groupby(['user', 'activity_month']).size().reset_index(name='shifts')
user_avg_monthly = user_monthly.groupby('user')['shifts'].mean().reset_index(name='avg_shifts_per_month')

# Merge with user stats
user_stats = user_stats.merge(user_avg_monthly, on='user')

# Power users: 5+ shifts per month on average
power_users = user_stats[user_stats['avg_shifts_per_month'] >= 5]
print(f"\nPower users (5+ shifts/month avg): {len(power_users)} ({len(power_users)/total_users*100:.1f}%)")

# Compare power users vs others
power_churn_rate = power_users['churned'].mean() * 100
non_power = user_stats[user_stats['avg_shifts_per_month'] < 5]
non_power_churn_rate = non_power['churned'].mean() * 100

print(f"Power user churn rate: {power_churn_rate:.1f}%")
print(f"Non-power user churn rate: {non_power_churn_rate:.1f}%")

# Active users characteristics
active_stats = user_stats[~user_stats['churned']]
churned_stats = user_stats[user_stats['churned']]

print("\nActive vs Churned User Comparison:")
print(f"  Active users avg total shifts: {active_stats['total_shifts'].mean():.1f}")
print(f"  Churned users avg total shifts: {churned_stats['total_shifts'].mean():.1f}")
print(f"  Active users avg shifts/month: {active_stats['avg_shifts_per_month'].mean():.1f}")
print(f"  Churned users avg shifts/month: {churned_stats['avg_shifts_per_month'].mean():.1f}")

# "Hooked" threshold analysis
print("\nRetention by First Week Activity:")
first_week = df.copy()
first_week = first_week.merge(user_first_shift[['user', 'first_shift_date']], on='user')
first_week['days_from_first'] = (first_week['DATE'] - first_week['first_shift_date']).dt.days
first_week_activity = first_week[first_week['days_from_first'] <= 7].groupby('user').size().reset_index(name='first_week_shifts')

user_stats = user_stats.merge(first_week_activity, on='user', how='left')
user_stats['first_week_shifts'] = user_stats['first_week_shifts'].fillna(0)

for threshold in [1, 2, 3, 5, 7, 10]:
    group = user_stats[user_stats['first_week_shifts'] >= threshold]
    if len(group) > 0:
        retention_rate = (1 - group['churned'].mean()) * 100
        print(f"  Users with {threshold}+ shifts in first week: {len(group)} users, {retention_rate:.1f}% retained")

# ============================================
# 4. ACTIVITY PATTERNS
# ============================================
print("\n" + "="*60)
print("4. ACTIVITY PATTERNS")
print("="*60)

# Shifts per user overall
print("\nTotal shifts per user distribution:")
shift_dist = user_stats['total_shifts'].describe()
print(f"  Mean: {shift_dist['mean']:.1f}")
print(f"  Median: {shift_dist['50%']:.1f}")
print(f"  Std Dev: {shift_dist['std']:.1f}")
print(f"  Min: {shift_dist['min']:.0f}")
print(f"  Max: {shift_dist['max']:.0f}")

# Distribution buckets
all_bins = [0, 1, 5, 10, 20, 50, 100, 200, 500, float('inf')]
all_labels = ['1', '2-5', '6-10', '11-20', '21-50', '51-100', '101-200', '201-500', '500+']
user_stats['total_shift_bucket'] = pd.cut(user_stats['total_shifts'], bins=all_bins, labels=all_labels, right=True)
shift_distribution = user_stats['total_shift_bucket'].value_counts().sort_index()
print("\nUser distribution by total shifts:")
for bucket, count in shift_distribution.items():
    pct = count / total_users * 100
    print(f"  {bucket}: {count} users ({pct:.1f}%)")

# Weekly activity
df['week'] = df['DATE'].dt.to_period('W')
weekly_activity = df.groupby('user')['week'].nunique().reset_index(name='active_weeks')
user_stats = user_stats.merge(weekly_activity, on='user')

print("\nWeekly activity patterns:")
print(f"  Average active weeks per user: {user_stats['active_weeks'].mean():.1f}")
print(f"  Users active 1 week only: {(user_stats['active_weeks'] == 1).sum()}")

# Shifts per active week
user_stats['shifts_per_active_week'] = user_stats['total_shifts'] / user_stats['active_weeks']
print(f"  Average shifts per active week: {user_stats['shifts_per_active_week'].mean():.1f}")

# ============================================
# 5. SEASONAL PATTERNS
# ============================================
print("\n" + "="*60)
print("5. SEASONAL PATTERNS")
print("="*60)

# Monthly activity trends
monthly_shifts = df.groupby(df['DATE'].dt.to_period('M')).size()
monthly_users = df.groupby(df['DATE'].dt.to_period('M'))['user'].nunique()

print("\nMonthly Activity Summary:")
monthly_summary = pd.DataFrame({
    'shifts': monthly_shifts,
    'active_users': monthly_users
})
monthly_summary['shifts_per_user'] = monthly_summary['shifts'] / monthly_summary['active_users']
print(monthly_summary.to_string())

# New vs returning users by month
print("\nNew vs Returning Users by Month:")
for month in sorted(df['activity_month'].unique()):
    month_users = df[df['activity_month'] == month]['user'].unique()
    new_users = sum(1 for u in month_users if user_first_shift[user_first_shift['user'] == u]['cohort_month'].values[0] == month)
    returning = len(month_users) - new_users
    print(f"  {month}: {new_users} new, {returning} returning")

# Day of week patterns
df['day_of_week'] = df['DATE'].dt.day_name()
dow_activity = df['day_of_week'].value_counts()
print("\nShifts by Day of Week:")
for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
    if day in dow_activity:
        print(f"  {day}: {dow_activity[day]} shifts")

# Churn by signup month
print("\nChurn Rate by Signup Month (Cohort):")
cohort_churn = user_stats.groupby(user_stats['first_shift_date'].dt.to_period('M'))['churned'].agg(['sum', 'count'])
cohort_churn['churn_rate'] = cohort_churn['sum'] / cohort_churn['count'] * 100
for idx, row in cohort_churn.iterrows():
    print(f"  {idx}: {row['churn_rate']:.1f}% churned ({int(row['sum'])}/{int(row['count'])})")

# ============================================
# 6. LEADING INDICATORS
# ============================================
print("\n" + "="*60)
print("6. LEADING INDICATORS")
print("="*60)

# First day activity
first_day_activity = first_week[first_week['days_from_first'] == 0].groupby('user').size().reset_index(name='first_day_shifts')
user_stats = user_stats.merge(first_day_activity, on='user', how='left')
user_stats['first_day_shifts'] = user_stats['first_day_shifts'].fillna(0)

print("\nRetention by First Day Activity:")
for threshold in [1, 2, 3]:
    group = user_stats[user_stats['first_day_shifts'] >= threshold]
    if len(group) > 0:
        retention_rate = (1 - group['churned'].mean()) * 100
        print(f"  Users with {threshold}+ shifts on first day: {len(group)} users, {retention_rate:.1f}% retained")

# First month activity correlation
first_month = df.copy()
first_month = first_month.merge(user_first_shift[['user', 'cohort_month']], on='user')
first_month = first_month[first_month['activity_month'] == first_month['cohort_month']]
first_month_activity = first_month.groupby('user').size().reset_index(name='first_month_shifts')
user_stats = user_stats.merge(first_month_activity, on='user', how='left')
user_stats['first_month_shifts'] = user_stats['first_month_shifts'].fillna(0)

print("\nRetention by First Month Activity:")
quartiles = user_stats['first_month_shifts'].quantile([0.25, 0.5, 0.75])
print(f"  First month shifts quartiles: 25%={quartiles[0.25]:.0f}, 50%={quartiles[0.5]:.0f}, 75%={quartiles[0.75]:.0f}")

for threshold in [5, 10, 15, 20]:
    group = user_stats[user_stats['first_month_shifts'] >= threshold]
    if len(group) > 0:
        retention_rate = (1 - group['churned'].mean()) * 100
        print(f"  Users with {threshold}+ shifts in first month: {len(group)} users, {retention_rate:.1f}% retained")

# Job type correlation with retention
print("\nRetention by First Job Type:")
first_jobs = df.sort_values('DATE').groupby('user').first()['JOB'].reset_index()
first_jobs.columns = ['user', 'first_job']
user_stats = user_stats.merge(first_jobs, on='user', how='left')

job_retention = user_stats.groupby('first_job')['churned'].agg(['sum', 'count'])
job_retention['retention_rate'] = (1 - job_retention['sum'] / job_retention['count']) * 100
job_retention = job_retention[job_retention['count'] >= 5].sort_values('retention_rate', ascending=False)
print("\nTop 10 Jobs by Retention (min 5 users):")
for idx, row in job_retention.head(10).iterrows():
    print(f"  {idx}: {row['retention_rate']:.1f}% retained ({int(row['count'])} users)")

# ============================================
# 7. AT-RISK SIGNALS
# ============================================
print("\n" + "="*60)
print("7. AT-RISK SIGNALS")
print("="*60)

# Days since last activity distribution
print("\nDays Since Last Shift (All Users):")
days_since_dist = user_stats['days_since_last_shift'].describe()
print(f"  Mean: {days_since_dist['mean']:.1f} days")
print(f"  Median: {days_since_dist['50%']:.1f} days")
print(f"  Max: {days_since_dist['max']:.0f} days")

# At-risk buckets
risk_bins = [0, 7, 14, 21, 30, 60, 90, float('inf')]
risk_labels = ['0-7 days', '8-14 days', '15-21 days', '22-30 days', '31-60 days', '61-90 days', '90+ days']
user_stats['days_since_bucket'] = pd.cut(user_stats['days_since_last_shift'], bins=risk_bins, labels=risk_labels)
risk_dist = user_stats['days_since_bucket'].value_counts().sort_index()
print("\nUsers by Days Since Last Shift:")
for bucket, count in risk_dist.items():
    pct = count / total_users * 100
    print(f"  {bucket}: {count} users ({pct:.1f}%)")

# Identify at-risk (14-30 days inactive) but not yet churned
at_risk = user_stats[(user_stats['days_since_last_shift'] >= 14) & (user_stats['days_since_last_shift'] < 30)]
print(f"\nAt-Risk Users (14-30 days inactive): {len(at_risk)} users")
if len(at_risk) > 0:
    print(f"  Average total shifts: {at_risk['total_shifts'].mean():.1f}")
    print(f"  Average active span: {at_risk['active_span_days'].mean():.1f} days")

# Pre-churn behavior analysis (for users who eventually churned)
print("\nPre-Churn Behavior (users who churned):")
# Calculate gap between last two shifts for churned users
churned_users_list = user_stats[user_stats['churned']]['user'].tolist()
last_gaps = []
for user in churned_users_list[:500]:  # Sample to avoid timeout
    user_shifts = df[df['user'] == user].sort_values('DATE')['DATE'].values
    if len(user_shifts) >= 2:
        last_gap = (pd.Timestamp(user_shifts[-1]) - pd.Timestamp(user_shifts[-2])).days
        last_gaps.append(last_gap)

if last_gaps:
    print(f"  Average gap before final shift: {np.mean(last_gaps):.1f} days")
    print(f"  Median gap before final shift: {np.median(last_gaps):.1f} days")

# Activity decline pattern
print("\nActivity Frequency Changes (Churned Users):")
decline_users = 0
stable_users = 0
for user in churned_users_list[:200]:  # Sample
    user_df = df[df['user'] == user].copy()
    if len(user_df) < 10:
        continue
    user_df = user_df.sort_values('DATE')
    half = len(user_df) // 2
    first_half = user_df.iloc[:half]
    second_half = user_df.iloc[half:]

    first_span = (first_half['DATE'].max() - first_half['DATE'].min()).days or 1
    second_span = (second_half['DATE'].max() - second_half['DATE'].min()).days or 1

    first_rate = len(first_half) / first_span
    second_rate = len(second_half) / second_span

    if second_rate < first_rate * 0.5:
        decline_users += 1
    else:
        stable_users += 1

if decline_users + stable_users > 0:
    print(f"  Users with declining activity before churn: {decline_users}/{decline_users+stable_users} ({decline_users/(decline_users+stable_users)*100:.1f}%)")

# ============================================
# SUMMARY STATISTICS
# ============================================
print("\n" + "="*60)
print("SUMMARY STATISTICS")
print("="*60)

print(f"""
KEY METRICS:
- Total Users: {total_users}
- Active Users (last 30 days): {active_users} ({active_users/total_users*100:.1f}%)
- Churned Users: {churned_users} ({churned_users/total_users*100:.1f}%)
- Single-Shift Users: {len(single_shift_users)} ({len(single_shift_users)/total_users*100:.1f}%)
- Power Users (5+ shifts/month): {len(power_users)} ({len(power_users)/total_users*100:.1f}%)

RETENTION INSIGHTS:
- Average time before churn: {churned_stats['active_span_days'].mean():.1f} days
- Average shifts before churn: {churned_stats['total_shifts'].mean():.1f}
- Power user churn rate: {power_churn_rate:.1f}%
- Non-power user churn rate: {non_power_churn_rate:.1f}%
""")

# Export key data for report
print("\nExporting data...")
user_stats.to_csv(r"C:\Users\veete\OneDrive\Desktop\claude_projects\portpal\marketing\user_stats_export.csv", index=False)
cohort_pivot.to_csv(r"C:\Users\veete\OneDrive\Desktop\claude_projects\portpal\marketing\cohort_table.csv")
cohort_retention_pct.to_csv(r"C:\Users\veete\OneDrive\Desktop\claude_projects\portpal\marketing\cohort_retention_pct.csv")
monthly_summary.to_csv(r"C:\Users\veete\OneDrive\Desktop\claude_projects\portpal\marketing\monthly_summary.csv")

print("Done!")
