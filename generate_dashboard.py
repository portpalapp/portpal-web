"""
PORTPAL Analytics Dashboard Generator
Processes all CSV data and generates a self-contained HTML dashboard.
"""

import pandas as pd
import json
from datetime import datetime, timedelta
from collections import defaultdict
import os

BASE_DIR = r"G:\Other computers\My Laptop\claude_projects\portpal"

# ── Load Data ──────────────────────────────────────────────────────────────────

print("Loading user stats...")
users = pd.read_csv(os.path.join(BASE_DIR, "marketing", "user_stats_export.csv"))
users['first_shift_date'] = pd.to_datetime(users['first_shift_date'])
users['last_shift_date'] = pd.to_datetime(users['last_shift_date'])

print("Loading monthly summary...")
monthly = pd.read_csv(os.path.join(BASE_DIR, "marketing", "monthly_summary.csv"))

print("Loading cohort retention...")
cohort_pct = pd.read_csv(os.path.join(BASE_DIR, "marketing", "cohort_retention_pct.csv"))

print("Loading cohort table...")
cohort_raw = pd.read_csv(os.path.join(BASE_DIR, "marketing", "cohort_table.csv"))

print("Loading shift data (this may take a moment)...")
shifts = pd.read_csv(
    os.path.join(BASE_DIR, "pay data", "user shift data",
                 "export_All-SHIFTS-modified--_2026-02-01_05-58-52.csv"),
    low_memory=False
)
shifts['DATE'] = pd.to_datetime(shifts['DATE'], format='mixed', errors='coerce')
shifts['Creation Date'] = pd.to_datetime(shifts['Creation Date'], format='mixed', errors='coerce')

print(f"Loaded {len(shifts)} shifts, {len(users)} users")

# ── KPI Calculations ──────────────────────────────────────────────────────────

total_users = len(users)
total_shifts = len(shifts)
total_pay = shifts['totalpay'].sum()
churned_count = users['churned'].sum()
active_count = total_users - churned_count
churn_rate = churned_count / total_users * 100

# Active in last 7, 30, 90 days
ref_date = pd.Timestamp('2026-02-01')
dau_7 = len(users[users['days_since_last_shift'] <= 7])
mau_30 = len(users[users['days_since_last_shift'] <= 30])
active_90 = len(users[users['days_since_last_shift'] <= 90])

avg_shifts_per_user = users['total_shifts'].mean()
median_shifts_per_user = users['total_shifts'].median()

power_users = users[users['total_shifts'] >= 100]
casual_users = users[(users['total_shifts'] >= 10) & (users['total_shifts'] < 100)]
light_users = users[(users['total_shifts'] >= 2) & (users['total_shifts'] < 10)]
one_and_done = users[users['total_shifts'] == 1]

# ── DAU/WAU/MAU from shift data ──────────────────────────────────────────────

print("Calculating daily/weekly/monthly active users...")

shifts_valid = shifts.dropna(subset=['DATE', 'relUser'])
shifts_valid = shifts_valid[shifts_valid['DATE'] >= '2024-12-01']

# Cutoff: exclude current incomplete month (Feb 2026) from monthly aggregations
CURRENT_INCOMPLETE_MONTH = '2026-02'
LAST_COMPLETE_DATE = pd.Timestamp('2026-01-31')  # last full day of data

# Daily active users
daily_stats = shifts_valid.groupby(shifts_valid['DATE'].dt.date).agg(
    dau=('relUser', 'nunique'),
    shifts=('relUser', 'count')
).reset_index()
daily_stats.columns = ['date', 'dau', 'shifts']
daily_stats['date'] = pd.to_datetime(daily_stats['date'])
daily_stats = daily_stats.sort_values('date')
daily_stats = daily_stats[daily_stats['date'] <= LAST_COMPLETE_DATE]

# Weekly active users (ISO week) — drop last incomplete week
shifts_valid['week'] = shifts_valid['DATE'].dt.to_period('W').apply(lambda x: x.start_time)
weekly_stats = shifts_valid.groupby('week').agg(
    wau=('relUser', 'nunique'),
    shifts=('relUser', 'count')
).reset_index()
weekly_stats.columns = ['week', 'wau', 'shifts']
weekly_stats = weekly_stats.sort_values('week')
# Drop the last week if it's incomplete (starts in Feb)
if len(weekly_stats) > 0 and weekly_stats.iloc[-1]['week'] > LAST_COMPLETE_DATE:
    weekly_stats = weekly_stats.iloc[:-1]

# Monthly active users — exclude incomplete current month
shifts_valid['month'] = shifts_valid['DATE'].dt.to_period('M').apply(lambda x: x.start_time)
monthly_active = shifts_valid.groupby('month').agg(
    mau=('relUser', 'nunique'),
    shifts=('relUser', 'count')
).reset_index()
monthly_active.columns = ['month', 'mau', 'shifts']
monthly_active = monthly_active.sort_values('month')
monthly_active = monthly_active[monthly_active['month'] <= LAST_COMPLETE_DATE]

# Stickiness: DAU/MAU
monthly_dau_avg = daily_stats.set_index('date').resample('MS')['dau'].mean().reset_index()
monthly_dau_avg.columns = ['month', 'avg_dau']
stickiness = monthly_dau_avg.merge(monthly_active[['month', 'mau']], on='month', how='inner')
stickiness['stickiness'] = (stickiness['avg_dau'] / stickiness['mau'] * 100).round(1)

# ── New Users per Month ──────────────────────────────────────────────────────

new_users_monthly = users.groupby('cohort_month').size().reset_index(name='new_users')
new_users_monthly = new_users_monthly.sort_values('cohort_month')
# Exclude current incomplete month
new_users_monthly = new_users_monthly[new_users_monthly['cohort_month'] < CURRENT_INCOMPLETE_MONTH]

# Filter the pre-computed monthly summary CSV too
monthly = monthly[monthly['DATE'] < CURRENT_INCOMPLETE_MONTH]

# ── User Engagement Distribution ──────────────────────────────────────────────

shift_buckets = users['total_shift_bucket'].value_counts()
bucket_order = ['1', '2-5', '6-10', '11-20', '21-50', '51-100', '101-200', '201-500']
shift_dist = {b: int(shift_buckets.get(b, 0)) for b in bucket_order}

# ── Top Power Users ──────────────────────────────────────────────────────────

top_users = users.nlargest(30, 'total_shifts')[
    ['user', 'total_shifts', 'first_shift_date', 'last_shift_date',
     'avg_shifts_per_month', 'active_weeks', 'first_job', 'churned', 'days_since_last_shift']
].copy()
top_users['first_shift_date'] = top_users['first_shift_date'].dt.strftime('%Y-%m-%d')
top_users['last_shift_date'] = top_users['last_shift_date'].dt.strftime('%Y-%m-%d')
# Mask emails for privacy
top_users['user'] = top_users['user'].apply(
    lambda x: x[:3] + '***' + x[x.index('@'):] if '@' in str(x) else str(x)[:6] + '***'
)

# ── Churned Users Analysis ───────────────────────────────────────────────────

churned = users[users['churned'] == True].copy()
churned_by_month = churned.groupby('cohort_month').size().reset_index(name='churned_count')

# Churn by activity level
churn_by_bucket = users.groupby('total_shift_bucket').agg(
    total=('user', 'count'),
    churned=('churned', 'sum')
).reset_index()
churn_by_bucket['churn_rate'] = (churn_by_bucket['churned'] / churn_by_bucket['total'] * 100).round(1)

# ── First Week Behavior → Retention ──────────────────────────────────────────

users['first_week_bucket'] = pd.cut(
    users['first_week_shifts'],
    bins=[0, 1, 3, 5, 10, 100],
    labels=['1', '2-3', '4-5', '6-10', '10+'],
    right=True
)
first_week_retention = users.groupby('first_week_bucket', observed=True).agg(
    total=('user', 'count'),
    retained=('churned', lambda x: (~x).sum())
).reset_index()
first_week_retention['retention_pct'] = (first_week_retention['retained'] / first_week_retention['total'] * 100).round(1)

# ── Days Since Last Activity Distribution (exact) ────────────────────────────

def days_bucket(d):
    if pd.isna(d): return '90+'
    d = int(d)
    if d <= 7: return '0-7'
    elif d <= 14: return '8-14'
    elif d <= 21: return '15-21'
    elif d <= 30: return '22-30'
    elif d <= 60: return '31-60'
    elif d <= 90: return '61-90'
    else: return '90+'

users['days_bucket'] = users['days_since_last_shift'].apply(days_bucket)
days_dist = users['days_bucket'].value_counts()
days_bucket_order = ['0-7', '8-14', '15-21', '22-30', '31-60', '61-90', '90+']
days_dist_ordered = {b: int(days_dist.get(b, 0)) for b in days_bucket_order}

# ── Segment-level stats ──────────────────────────────────────────────────────

def segment_stats(df, name, definition):
    return {
        'name': name,
        'definition': definition,
        'count': len(df),
        'pct': round(len(df) / total_users * 100, 1),
        'avg_shifts_month': round(df['avg_shifts_per_month'].mean(), 1) if len(df) > 0 else 0,
        'churn_rate': round(df['churned'].sum() / len(df) * 100, 1) if len(df) > 0 else 0,
    }

segment_data = [
    segment_stats(power_users, 'Power Users', '100+ shifts'),
    segment_stats(casual_users, 'Regular Users', '10-99 shifts'),
    segment_stats(light_users, 'Light Users', '2-9 shifts'),
    segment_stats(one_and_done, 'One & Done', '1 shift'),
]

# ── Job Distribution ─────────────────────────────────────────────────────────

job_dist = shifts['JOB'].value_counts().head(15)

# ── Shift Type Distribution ──────────────────────────────────────────────────

shift_type_dist = shifts['DNG'].value_counts()

# ── Day of Week Distribution ─────────────────────────────────────────────────

shifts_valid['dow'] = shifts_valid['DATE'].dt.day_name()
dow_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
dow_dist = shifts_valid['dow'].value_counts().reindex(dow_order, fill_value=0)

# ── Location Distribution ───────────────────────────────────────────────────

loc_dist = shifts['LOCATION'].value_counts().head(10)

# ── Cohort Retention Heatmap Data ────────────────────────────────────────────

# Filter to significant cohorts (Dec 2024+)
significant_cohorts = cohort_pct[cohort_pct['cohort_month'] >= '2024-12'].copy()
sig_cohort_raw = cohort_raw[cohort_raw['cohort_month'] >= '2024-12'].copy()

# For each cohort, null out the last month column if it falls in the incomplete month
# The last cohort (2026-01) has month 1 = Feb 2026 which is incomplete
# For any cohort, if cohort_month + N months >= 2026-02, that column is partial
for idx, row in significant_cohorts.iterrows():
    cohort_start = pd.Timestamp(row['cohort_month'] + '-01')
    for col in significant_cohorts.columns[1:]:
        month_offset = int(col)
        data_month = cohort_start + pd.DateOffset(months=month_offset)
        if data_month.strftime('%Y-%m') >= CURRENT_INCOMPLETE_MONTH:
            significant_cohorts.at[idx, col] = 0
            sig_cohort_raw.at[idx, col] = 0

# ── Users at Risk (active but declining) ─────────────────────────────────────

at_risk = users[
    (users['churned'] == False) &
    (users['days_since_last_shift'] >= 14) &
    (users['days_since_last_shift'] <= 60) &
    (users['total_shifts'] >= 10)
].copy()
at_risk = at_risk.sort_values('days_since_last_shift', ascending=False)
at_risk_display = at_risk[['user', 'total_shifts', 'avg_shifts_per_month',
                           'days_since_last_shift', 'first_job', 'cohort_month']].head(20).copy()
at_risk_display['user'] = at_risk_display['user'].apply(
    lambda x: x[:3] + '***' + x[x.index('@'):] if '@' in str(x) else str(x)[:6] + '***'
)

# ── Shifts per Day Trend ─────────────────────────────────────────────────────

shifts_per_day = daily_stats.set_index('date')['shifts'].rolling(7).mean().reset_index()
shifts_per_day.columns = ['date', 'shifts_7d_avg']

# ── Prepare JSON data for dashboard ──────────────────────────────────────────

print("Preparing dashboard data...")

def ts(dt):
    """Convert datetime to string for JSON."""
    if pd.isna(dt):
        return None
    return dt.strftime('%Y-%m-%d')

dashboard_data = {
    # KPIs
    "kpis": {
        "total_users": int(total_users),
        "active_users": int(active_count),
        "churned_users": int(churned_count),
        "churn_rate": round(churn_rate, 1),
        "total_shifts": int(total_shifts),
        "total_pay": round(float(total_pay), 0),
        "avg_shifts_per_user": round(float(avg_shifts_per_user), 1),
        "median_shifts_per_user": round(float(median_shifts_per_user), 1),
        "wau_latest": int(dau_7),
        "mau_latest": int(mau_30),
        "active_90d": int(active_90),
        "power_users": len(power_users),
        "casual_users": len(casual_users),
        "light_users": len(light_users),
        "one_and_done": len(one_and_done),
    },

    # DAU trend
    "dau": {
        "dates": [ts(d) for d in daily_stats['date']],
        "values": daily_stats['dau'].tolist(),
        "shifts": daily_stats['shifts'].tolist(),
    },

    # WAU trend
    "wau": {
        "dates": [ts(d) for d in weekly_stats['week']],
        "values": weekly_stats['wau'].tolist(),
    },

    # MAU trend
    "mau": {
        "dates": [ts(d) for d in monthly_active['month']],
        "values": monthly_active['mau'].tolist(),
        "shifts": monthly_active['shifts'].tolist(),
    },

    # Stickiness (DAU/MAU)
    "stickiness": {
        "dates": [ts(d) for d in stickiness['month']],
        "values": stickiness['stickiness'].tolist(),
    },

    # New users per month
    "new_users": {
        "months": new_users_monthly['cohort_month'].tolist(),
        "counts": new_users_monthly['new_users'].tolist(),
    },

    # Monthly summary (from pre-computed)
    "monthly_summary": {
        "dates": monthly['DATE'].tolist(),
        "shifts": monthly['shifts'].tolist(),
        "active_users": monthly['active_users'].tolist(),
        "shifts_per_user": [round(x, 1) for x in monthly['shifts_per_user']],
    },

    # Shift distribution by bucket
    "shift_distribution": shift_dist,

    # Top users
    "top_users": top_users.to_dict('records'),

    # Churn by activity bucket
    "churn_by_bucket": {
        "buckets": churn_by_bucket['total_shift_bucket'].tolist(),
        "total": churn_by_bucket['total'].tolist(),
        "churned": churn_by_bucket['churned'].astype(int).tolist(),
        "churn_rate": churn_by_bucket['churn_rate'].tolist(),
    },

    # First week → retention
    "first_week_retention": {
        "buckets": first_week_retention['first_week_bucket'].astype(str).tolist(),
        "total": first_week_retention['total'].tolist(),
        "retention_pct": first_week_retention['retention_pct'].tolist(),
    },

    # Job distribution
    "job_distribution": {
        "jobs": job_dist.index.tolist(),
        "counts": job_dist.values.tolist(),
    },

    # Shift type distribution
    "shift_type": {
        "types": shift_type_dist.index.tolist(),
        "counts": shift_type_dist.values.tolist(),
    },

    # Day of week
    "dow": {
        "days": dow_dist.index.tolist(),
        "counts": dow_dist.values.tolist(),
    },

    # Location distribution
    "location": {
        "locations": loc_dist.index.tolist(),
        "counts": loc_dist.values.tolist(),
    },

    # Cohort retention heatmap (significant cohorts only)
    "cohort_heatmap": {
        "cohorts": significant_cohorts['cohort_month'].tolist(),
        "data": [],
        "raw_counts": [],
    },

    # At-risk users
    "at_risk": at_risk_display.to_dict('records'),
    "at_risk_total": len(at_risk),

    # Days since last activity (exact)
    "days_since_dist": days_dist_ordered,

    # Segment details
    "segment_details": segment_data,

    # Shifts per day (7-day rolling)
    "shifts_trend": {
        "dates": [ts(d) for d in shifts_per_day['date'].dropna()],
        "values": [round(v, 1) if not pd.isna(v) else None for v in shifts_per_day['shifts_7d_avg']],
    },
}

# Build cohort heatmap data
for _, row in significant_cohorts.iterrows():
    vals = []
    for col in significant_cohorts.columns[1:]:
        v = row[col]
        if pd.notna(v) and v > 0:
            vals.append(round(v, 1))
        else:
            vals.append(None)
    dashboard_data['cohort_heatmap']['data'].append(vals)

for _, row in sig_cohort_raw.iterrows():
    vals = []
    for col in sig_cohort_raw.columns[1:]:
        v = row[col]
        vals.append(int(v) if pd.notna(v) else 0)
    dashboard_data['cohort_heatmap']['raw_counts'].append(vals)

# ── Generate HTML ─────────────────────────────────────────────────────────────

print("Generating HTML dashboard...")

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PORTPAL Analytics Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  :root {
    --bg: #0f172a;
    --surface: #1e293b;
    --surface2: #334155;
    --border: #475569;
    --text: #f1f5f9;
    --text-muted: #94a3b8;
    --accent: #3b82f6;
    --accent2: #8b5cf6;
    --green: #22c55e;
    --red: #ef4444;
    --orange: #f59e0b;
    --cyan: #06b6d4;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  .header {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-bottom: 1px solid var(--border);
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header .subtitle { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
  .header .date { color: var(--text-muted); font-size: 13px; }

  .tabs {
    display: flex;
    gap: 4px;
    padding: 12px 32px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }

  .tab {
    padding: 8px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    color: var(--text-muted);
    border: 1px solid transparent;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .tab:hover { color: var(--text); background: var(--surface2); }
  .tab.active {
    color: var(--accent);
    background: rgba(59,130,246,0.1);
    border-color: rgba(59,130,246,0.3);
  }

  .container { max-width: 1440px; margin: 0 auto; padding: 24px 32px; }

  .section { display: none; }
  .section.active { display: block; }

  .grid { display: grid; gap: 20px; }
  .grid-4 { grid-template-columns: repeat(4, 1fr); }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-1 { grid-template-columns: 1fr; }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
  }

  .card-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .kpi-value {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
  }

  .kpi-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

  .chart-container { position: relative; width: 100%; }
  .chart-container canvas { width: 100% !important; }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  th {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 2px solid var(--border);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(71,85,105,0.3);
  }

  tr:hover td { background: rgba(59,130,246,0.05); }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }

  .badge-green { background: rgba(34,197,94,0.15); color: var(--green); }
  .badge-red { background: rgba(239,68,68,0.15); color: var(--red); }
  .badge-orange { background: rgba(245,158,11,0.15); color: var(--orange); }
  .badge-blue { background: rgba(59,130,246,0.15); color: var(--accent); }

  .heatmap-table { overflow-x: auto; }
  .heatmap-table table { min-width: 800px; }
  .heatmap-table th, .heatmap-table td {
    text-align: center;
    padding: 6px 8px;
    font-size: 12px;
    min-width: 52px;
  }
  .heatmap-table th:first-child, .heatmap-table td:first-child {
    text-align: left;
    position: sticky;
    left: 0;
    background: var(--surface);
    z-index: 1;
    min-width: 90px;
  }

  .segment-bar {
    display: flex;
    height: 32px;
    border-radius: 6px;
    overflow: hidden;
    margin: 12px 0;
  }

  .segment-bar > div { display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }

  .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; }

  .insight-box {
    background: rgba(59,130,246,0.08);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 8px;
    padding: 14px 18px;
    margin-top: 12px;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .insight-box strong { color: var(--text); }

  @media (max-width: 1024px) {
    .grid-4 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
    .container { padding: 16px; }
    .tabs { padding: 12px 16px; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>PORTPAL Analytics</h1>
    <div class="subtitle">Shift Tracking Intelligence Dashboard</div>
  </div>
  <div class="date">Data through Jan 31, 2026 &bull; 752 users &bull; 71,712 shifts &bull; Incomplete Feb excluded</div>
</div>

<div class="tabs">
  <div class="tab active" onclick="showTab('overview')">Overview</div>
  <div class="tab" onclick="showTab('engagement')">DAU / WAU / MAU</div>
  <div class="tab" onclick="showTab('growth')">Growth</div>
  <div class="tab" onclick="showTab('retention')">Retention Cohorts</div>
  <div class="tab" onclick="showTab('segments')">User Segments</div>
  <div class="tab" onclick="showTab('power')">Power Users</div>
  <div class="tab" onclick="showTab('churn')">Churn Analysis</div>
  <div class="tab" onclick="showTab('activity')">Activity Patterns</div>
</div>

<div class="container">

<!-- ═══════════════════════════ OVERVIEW TAB ═══════════════════════════ -->
<div id="overview" class="section active">
  <div class="grid grid-4" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">Total Users</div>
      <div class="kpi-value" id="kpi-total-users"></div>
      <div class="kpi-sub">Lifetime signups</div>
    </div>
    <div class="card">
      <div class="card-title">Active (30d)</div>
      <div class="kpi-value" style="color:var(--green)" id="kpi-mau"></div>
      <div class="kpi-sub" id="kpi-mau-pct"></div>
    </div>
    <div class="card">
      <div class="card-title">Total Shifts</div>
      <div class="kpi-value" style="color:var(--accent)" id="kpi-shifts"></div>
      <div class="kpi-sub" id="kpi-avg-shifts"></div>
    </div>
    <div class="card">
      <div class="card-title">Pay Tracked</div>
      <div class="kpi-value" style="color:var(--accent2)" id="kpi-pay"></div>
      <div class="kpi-sub">Lifetime total</div>
    </div>
  </div>

  <div class="grid grid-4" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">Active (7d)</div>
      <div class="kpi-value" id="kpi-wau"></div>
      <div class="kpi-sub">Weekly active users</div>
    </div>
    <div class="card">
      <div class="card-title">Active (90d)</div>
      <div class="kpi-value" id="kpi-90d"></div>
      <div class="kpi-sub" id="kpi-90d-pct"></div>
    </div>
    <div class="card">
      <div class="card-title">Churned</div>
      <div class="kpi-value" style="color:var(--red)" id="kpi-churned"></div>
      <div class="kpi-sub" id="kpi-churn-rate"></div>
    </div>
    <div class="card">
      <div class="card-title">Avg Shifts/User</div>
      <div class="kpi-value" id="kpi-avg-spu"></div>
      <div class="kpi-sub" id="kpi-median-spu"></div>
    </div>
  </div>

  <div class="card" style="margin-bottom:20px">
    <div class="card-title">User Segments</div>
    <div class="segment-bar">
      <div id="seg-power" style="background:var(--accent2)"></div>
      <div id="seg-casual" style="background:var(--accent)"></div>
      <div id="seg-light" style="background:var(--orange)"></div>
      <div id="seg-one" style="background:var(--red)"></div>
    </div>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:var(--accent2)"></div><span id="leg-power"></span></div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--accent)"></div><span id="leg-casual"></span></div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--orange)"></div><span id="leg-light"></span></div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--red)"></div><span id="leg-one"></span></div>
    </div>
  </div>

  <div class="grid grid-2">
    <div class="card">
      <div class="card-title">Monthly Active Users & Shifts</div>
      <div class="chart-container"><canvas id="chart-overview-mau"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">Shifts Per Active User (Monthly)</div>
      <div class="chart-container"><canvas id="chart-overview-spu"></canvas></div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ ENGAGEMENT TAB ═══════════════════════════ -->
<div id="engagement" class="section">
  <div class="grid grid-1" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">Daily Active Users (DAU)</div>
      <div class="chart-container" style="height:300px"><canvas id="chart-dau"></canvas></div>
    </div>
  </div>
  <div class="grid grid-2" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">Weekly Active Users (WAU)</div>
      <div class="chart-container" style="height:280px"><canvas id="chart-wau"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">Monthly Active Users (MAU)</div>
      <div class="chart-container" style="height:280px"><canvas id="chart-mau"></canvas></div>
    </div>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <div class="card-title">Stickiness (Avg DAU / MAU %)</div>
      <div class="chart-container" style="height:280px"><canvas id="chart-stickiness"></canvas></div>
      <div class="insight-box">
        <strong>What is stickiness?</strong> The ratio of average daily active users to monthly active users.
        A higher ratio means users are coming back more frequently. Top consumer apps aim for 20-30%+.
        B2B/niche tools often see 10-20%.
      </div>
    </div>
    <div class="card">
      <div class="card-title">Shifts Per Day (7-day Rolling Avg)</div>
      <div class="chart-container" style="height:280px"><canvas id="chart-shifts-trend"></canvas></div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ GROWTH TAB ═══════════════════════════ -->
<div id="growth" class="section">
  <div class="grid grid-1" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">New User Signups by Month</div>
      <div class="chart-container" style="height:320px"><canvas id="chart-new-users"></canvas></div>
    </div>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <div class="card-title">Cumulative Users Over Time</div>
      <div class="chart-container" style="height:300px"><canvas id="chart-cumulative"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">Net Active User Growth (MAU)</div>
      <div class="chart-container" style="height:300px"><canvas id="chart-mau-growth"></canvas></div>
      <div class="insight-box">
        <strong>Key insight:</strong> While new signups have slowed from the Jan 2025 peak (198),
        MAU has grown steadily from 317 to 435, showing strong retention is driving growth more
        than acquisition.
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ RETENTION TAB ═══════════════════════════ -->
<div id="retention" class="section">
  <div class="card" style="margin-bottom:20px">
    <div class="card-title">Cohort Retention Heatmap (% active in month N)</div>
    <div class="heatmap-table" id="cohort-heatmap"></div>
    <div class="insight-box" style="margin-top:16px">
      <strong>How to read:</strong> Each row is a signup cohort. Column N shows the % of that cohort
      still active N months after joining. The Dec 2024 cohort (129 users, your biggest early wave)
      shows exceptional retention: <strong>69% at month 12</strong>. Jan 2025 (198 users) stabilized
      around <strong>49-52%</strong> long-term.
    </div>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <div class="card-title">First Week Shifts → Long-term Retention</div>
      <div class="chart-container" style="height:300px"><canvas id="chart-first-week"></canvas></div>
      <div class="insight-box">
        <strong>Magic number:</strong> Users who log <strong>6+ shifts in their first week</strong>
        retain at dramatically higher rates. This is your activation threshold — focus onboarding
        around getting users to log their first week of shifts.
      </div>
    </div>
    <div class="card">
      <div class="card-title">Cohort Sizes Over Time</div>
      <div class="chart-container" style="height:300px"><canvas id="chart-cohort-size"></canvas></div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ SEGMENTS TAB ═══════════════════════════ -->
<div id="segments" class="section">
  <div class="grid grid-2" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">User Distribution by Total Shifts Logged</div>
      <div class="chart-container" style="height:320px"><canvas id="chart-shift-dist"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">Segment Breakdown</div>
      <div class="chart-container" style="height:320px"><canvas id="chart-segment-pie"></canvas></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Segment Details</div>
    <table>
      <thead>
        <tr>
          <th>Segment</th>
          <th>Definition</th>
          <th>Users</th>
          <th>% of Total</th>
          <th>Avg Shifts/Month</th>
          <th>Churn Rate</th>
        </tr>
      </thead>
      <tbody id="segment-table"></tbody>
    </table>
  </div>
</div>

<!-- ═══════════════════════════ POWER USERS TAB ═══════════════════════════ -->
<div id="power" class="section">
  <div class="grid grid-3" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">Power Users (100+ shifts)</div>
      <div class="kpi-value" style="color:var(--accent2)" id="kpi-power-count"></div>
      <div class="kpi-sub" id="kpi-power-pct"></div>
    </div>
    <div class="card">
      <div class="card-title">Shifts by Power Users</div>
      <div class="kpi-value" style="color:var(--accent)" id="kpi-power-shifts"></div>
      <div class="kpi-sub" id="kpi-power-shifts-pct"></div>
    </div>
    <div class="card">
      <div class="card-title">Avg Shifts/Month (Power)</div>
      <div class="kpi-value" style="color:var(--green)" id="kpi-power-avg"></div>
      <div class="kpi-sub">vs overall avg: <span id="kpi-overall-avg"></span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Top 30 Users by Total Shifts</div>
    <div style="overflow-x:auto">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>User</th>
          <th>Total Shifts</th>
          <th>Shifts/Month</th>
          <th>Active Weeks</th>
          <th>First Job</th>
          <th>Joined</th>
          <th>Last Active</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="power-users-table"></tbody>
    </table>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ CHURN TAB ═══════════════════════════ -->
<div id="churn" class="section">
  <div class="grid grid-3" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">Total Churned</div>
      <div class="kpi-value" style="color:var(--red)" id="kpi-churn-total"></div>
      <div class="kpi-sub" id="kpi-churn-rate2"></div>
    </div>
    <div class="card">
      <div class="card-title">At Risk (14-60d inactive)</div>
      <div class="kpi-value" style="color:var(--orange)" id="kpi-at-risk"></div>
      <div class="kpi-sub">Users with 10+ shifts going quiet</div>
    </div>
    <div class="card">
      <div class="card-title">One-and-Done</div>
      <div class="kpi-value" id="kpi-one-done"></div>
      <div class="kpi-sub" id="kpi-one-done-pct"></div>
    </div>
  </div>
  <div class="grid grid-2" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">Churn Rate by Activity Level</div>
      <div class="chart-container" style="height:300px"><canvas id="chart-churn-bucket"></canvas></div>
      <div class="insight-box">
        Users with <strong>1 shift have 100% churn</strong> (by definition). But even users
        with 2-5 shifts churn at high rates. The critical threshold is around
        <strong>50+ shifts</strong> where churn drops dramatically.
      </div>
    </div>
    <div class="card">
      <div class="card-title">Days Since Last Activity Distribution</div>
      <div class="chart-container" style="height:300px"><canvas id="chart-days-since"></canvas></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">At-Risk Users (Active users going quiet — 10+ shifts, 14-60 days inactive)</div>
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Total Shifts</th>
          <th>Avg/Month</th>
          <th>Days Inactive</th>
          <th>Primary Job</th>
          <th>Cohort</th>
        </tr>
      </thead>
      <tbody id="at-risk-table"></tbody>
    </table>
  </div>
</div>

<!-- ═══════════════════════════ ACTIVITY TAB ═══════════════════════════ -->
<div id="activity" class="section">
  <div class="grid grid-2" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title">Top 15 Jobs by Shift Count</div>
      <div class="chart-container" style="height:380px"><canvas id="chart-jobs"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">Top 10 Locations</div>
      <div class="chart-container" style="height:380px"><canvas id="chart-locations"></canvas></div>
    </div>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <div class="card-title">Shift Type Distribution</div>
      <div class="chart-container" style="height:300px"><canvas id="chart-shift-type"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">Shifts by Day of Week</div>
      <div class="chart-container" style="height:300px"><canvas id="chart-dow"></canvas></div>
    </div>
  </div>
</div>

</div> <!-- /container -->

<script>
const D = DASHBOARD_DATA_PLACEHOLDER;

// ── Utilities ──────────────────────────────────────────────────────────────────

function fmt(n) { return n.toLocaleString(); }
function pct(n, total) { return (n / total * 100).toFixed(1) + '%'; }
function money(n) { return '$' + (n / 1e6).toFixed(1) + 'M'; }

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
  },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(71,85,105,0.2)' } },
    y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(71,85,105,0.2)' } },
  }
};

function makeChart(id, type, data, opts = {}) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const merged = JSON.parse(JSON.stringify(chartDefaults));
  if (opts.scales) {
    for (const k in opts.scales) {
      merged.scales[k] = { ...merged.scales[k], ...opts.scales[k] };
    }
    delete opts.scales;
  }
  Object.assign(merged, opts);
  return new Chart(ctx, { type, data, options: merged });
}

// ── Tab Navigation ─────────────────────────────────────────────────────────────

function showTab(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
}

// ── Overview KPIs ──────────────────────────────────────────────────────────────

document.getElementById('kpi-total-users').textContent = fmt(D.kpis.total_users);
document.getElementById('kpi-mau').textContent = fmt(D.kpis.mau_latest);
document.getElementById('kpi-mau-pct').textContent = pct(D.kpis.mau_latest, D.kpis.total_users) + ' of total';
document.getElementById('kpi-shifts').textContent = fmt(D.kpis.total_shifts);
document.getElementById('kpi-avg-shifts').textContent = D.kpis.avg_shifts_per_user + ' avg per user';
document.getElementById('kpi-pay').textContent = money(D.kpis.total_pay);
document.getElementById('kpi-wau').textContent = fmt(D.kpis.wau_latest);
document.getElementById('kpi-90d').textContent = fmt(D.kpis.active_90d);
document.getElementById('kpi-90d-pct').textContent = pct(D.kpis.active_90d, D.kpis.total_users) + ' of total';
document.getElementById('kpi-churned').textContent = fmt(D.kpis.churned_users);
document.getElementById('kpi-churn-rate').textContent = D.kpis.churn_rate + '% churn rate';
document.getElementById('kpi-avg-spu').textContent = D.kpis.avg_shifts_per_user;
document.getElementById('kpi-median-spu').textContent = 'Median: ' + D.kpis.median_shifts_per_user;

// Segment bar
const segs = [
  { id: 'power', count: D.kpis.power_users, label: 'Power (100+)' },
  { id: 'casual', count: D.kpis.casual_users, label: 'Regular (10-99)' },
  { id: 'light', count: D.kpis.light_users, label: 'Light (2-9)' },
  { id: 'one', count: D.kpis.one_and_done, label: 'One & Done (1)' },
];
segs.forEach(s => {
  const el = document.getElementById('seg-' + s.id);
  el.style.width = pct(s.count, D.kpis.total_users);
  el.textContent = s.count;
  document.getElementById('leg-' + s.id).textContent = s.label + ' (' + s.count + ' - ' + pct(s.count, D.kpis.total_users) + ')';
});

// Overview MAU chart
makeChart('chart-overview-mau', 'bar', {
  labels: D.monthly_summary.dates.slice(-14),
  datasets: [
    {
      label: 'Active Users',
      data: D.monthly_summary.active_users.slice(-14),
      backgroundColor: 'rgba(59,130,246,0.6)',
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      label: 'Shifts',
      data: D.monthly_summary.shifts.slice(-14),
      type: 'line',
      borderColor: '#8b5cf6',
      pointRadius: 3,
      yAxisID: 'y1',
    }
  ]
}, {
  scales: {
    y: { position: 'left', title: { display: true, text: 'Users', color: '#64748b' } },
    y1: { position: 'right', title: { display: true, text: 'Shifts', color: '#64748b' }, grid: { display: false } }
  }
});

// Overview shifts per user
makeChart('chart-overview-spu', 'line', {
  labels: D.monthly_summary.dates.slice(-14),
  datasets: [{
    label: 'Shifts per Active User',
    data: D.monthly_summary.shifts_per_user.slice(-14),
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.1)',
    fill: true,
    tension: 0.3,
    pointRadius: 4,
  }]
});

// ── Engagement Charts ──────────────────────────────────────────────────────────

makeChart('chart-dau', 'line', {
  labels: D.dau.dates,
  datasets: [{
    label: 'Daily Active Users',
    data: D.dau.values,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.08)',
    fill: true,
    tension: 0.2,
    pointRadius: 1,
    borderWidth: 1.5,
  }]
}, { plugins: { legend: { display: false } } });

makeChart('chart-wau', 'line', {
  labels: D.wau.dates,
  datasets: [{
    label: 'WAU',
    data: D.wau.values,
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139,92,246,0.1)',
    fill: true,
    tension: 0.3,
    pointRadius: 3,
  }]
});

makeChart('chart-mau', 'bar', {
  labels: D.mau.dates,
  datasets: [{
    label: 'MAU',
    data: D.mau.values,
    backgroundColor: 'rgba(34,197,94,0.6)',
    borderRadius: 4,
  }]
});

makeChart('chart-stickiness', 'line', {
  labels: D.stickiness.dates,
  datasets: [{
    label: 'DAU/MAU %',
    data: D.stickiness.values,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245,158,11,0.1)',
    fill: true,
    tension: 0.3,
    pointRadius: 4,
  }]
}, { scales: { y: { title: { display: true, text: '%', color: '#64748b' } } } });

makeChart('chart-shifts-trend', 'line', {
  labels: D.shifts_trend.dates,
  datasets: [{
    label: '7-day Rolling Avg Shifts',
    data: D.shifts_trend.values,
    borderColor: '#06b6d4',
    backgroundColor: 'rgba(6,182,212,0.08)',
    fill: true,
    tension: 0.2,
    pointRadius: 0,
    borderWidth: 2,
  }]
}, { plugins: { legend: { display: false } } });

// ── Growth Charts ──────────────────────────────────────────────────────────────

makeChart('chart-new-users', 'bar', {
  labels: D.new_users.months,
  datasets: [{
    label: 'New Users',
    data: D.new_users.counts,
    backgroundColor: D.new_users.counts.map(v => v > 100 ? 'rgba(59,130,246,0.8)' : 'rgba(59,130,246,0.4)'),
    borderRadius: 4,
  }]
});

// Cumulative
const cumulative = [];
let running = 0;
D.new_users.counts.forEach(c => { running += c; cumulative.push(running); });
makeChart('chart-cumulative', 'line', {
  labels: D.new_users.months,
  datasets: [{
    label: 'Cumulative Users',
    data: cumulative,
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139,92,246,0.1)',
    fill: true,
    tension: 0.3,
    pointRadius: 3,
  }]
});

// MAU growth
makeChart('chart-mau-growth', 'line', {
  labels: D.mau.dates,
  datasets: [{
    label: 'Monthly Active Users',
    data: D.mau.values,
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.1)',
    fill: true,
    tension: 0.3,
    pointRadius: 4,
  }]
});

// ── Retention Charts ───────────────────────────────────────────────────────────

// Cohort heatmap
(function buildHeatmap() {
  const container = document.getElementById('cohort-heatmap');
  const cohorts = D.cohort_heatmap.cohorts;
  const data = D.cohort_heatmap.data;
  const raw = D.cohort_heatmap.raw_counts;

  // Only show months with data
  let maxMonth = 0;
  data.forEach(row => {
    row.forEach((v, i) => { if (v !== null && v > 0) maxMonth = Math.max(maxMonth, i); });
  });

  let html = '<table><thead><tr><th>Cohort</th><th>Size</th>';
  for (let i = 0; i <= Math.min(maxMonth, 14); i++) html += '<th>M' + i + '</th>';
  html += '</tr></thead><tbody>';

  cohorts.forEach((cohort, ci) => {
    html += '<tr><td style="font-weight:600">' + cohort + '</td>';
    html += '<td>' + raw[ci][0] + '</td>';
    for (let i = 0; i <= Math.min(maxMonth, 14); i++) {
      const v = data[ci][i];
      if (v === null || v === 0) {
        html += '<td style="color:var(--text-muted);opacity:0.3">—</td>';
      } else {
        const alpha = Math.max(0.1, v / 100);
        const color = v >= 70 ? `rgba(34,197,94,${alpha})` :
                      v >= 50 ? `rgba(59,130,246,${alpha})` :
                      v >= 30 ? `rgba(245,158,11,${alpha})` :
                      `rgba(239,68,68,${alpha})`;
        html += '<td style="background:' + color + ';border-radius:3px;font-weight:500">' +
                v.toFixed(0) + '%</td>';
      }
    }
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
})();

// First week retention
makeChart('chart-first-week', 'bar', {
  labels: D.first_week_retention.buckets,
  datasets: [
    {
      label: 'Retention %',
      data: D.first_week_retention.retention_pct,
      backgroundColor: D.first_week_retention.retention_pct.map(v =>
        v >= 60 ? 'rgba(34,197,94,0.7)' : v >= 40 ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.7)'
      ),
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      label: 'Users',
      data: D.first_week_retention.total,
      type: 'line',
      borderColor: '#94a3b8',
      pointRadius: 4,
      yAxisID: 'y1',
    }
  ]
}, {
  scales: {
    x: { title: { display: true, text: 'First Week Shifts', color: '#64748b' } },
    y: { title: { display: true, text: 'Retention %', color: '#64748b' } },
    y1: { position: 'right', title: { display: true, text: 'User Count', color: '#64748b' }, grid: { display: false } }
  }
});

// Cohort sizes
makeChart('chart-cohort-size', 'bar', {
  labels: D.new_users.months.filter(m => m >= '2024-12'),
  datasets: [{
    label: 'Cohort Size',
    data: D.new_users.counts.slice(D.new_users.months.indexOf('2024-12')),
    backgroundColor: 'rgba(139,92,246,0.5)',
    borderRadius: 4,
  }]
});

// ── Segments Charts ────────────────────────────────────────────────────────────

const bucketLabels = Object.keys(D.shift_distribution);
const bucketValues = Object.values(D.shift_distribution);

makeChart('chart-shift-dist', 'bar', {
  labels: bucketLabels,
  datasets: [{
    label: 'Users',
    data: bucketValues,
    backgroundColor: [
      'rgba(239,68,68,0.6)', 'rgba(245,158,11,0.6)', 'rgba(245,158,11,0.5)',
      'rgba(59,130,246,0.4)', 'rgba(59,130,246,0.5)', 'rgba(59,130,246,0.6)',
      'rgba(139,92,246,0.6)', 'rgba(139,92,246,0.8)'
    ],
    borderRadius: 4,
  }]
}, {
  scales: { x: { title: { display: true, text: 'Total Shifts Logged', color: '#64748b' } } }
});

makeChart('chart-segment-pie', 'doughnut', {
  labels: ['Power (100+)', 'Regular (10-99)', 'Light (2-9)', 'One & Done (1)'],
  datasets: [{
    data: [D.kpis.power_users, D.kpis.casual_users, D.kpis.light_users, D.kpis.one_and_done],
    backgroundColor: ['#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'],
    borderWidth: 0,
  }]
}, {
  scales: {},
  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16 } } },
  cutout: '55%',
});

// Segment table (with real data)
(function() {
  const tbody = document.getElementById('segment-table');
  const colors = ['accent2', 'blue', 'orange', 'red'];
  D.segment_details.forEach((s, i) => {
    const churnColor = s.churn_rate >= 60 ? 'red' : s.churn_rate >= 30 ? 'orange' : 'green';
    tbody.innerHTML += '<tr>' +
      '<td><span class="badge badge-' + colors[i] + '">' + s.name + '</span></td>' +
      '<td>' + s.definition + '</td>' +
      '<td>' + s.count + '</td>' +
      '<td>' + s.pct + '%</td>' +
      '<td>' + s.avg_shifts_month + '</td>' +
      '<td><span class="badge badge-' + churnColor + '">' + s.churn_rate + '%</span></td></tr>';
  });
})();

// ── Power Users ────────────────────────────────────────────────────────────────

document.getElementById('kpi-power-count').textContent = fmt(D.kpis.power_users);
document.getElementById('kpi-power-pct').textContent = pct(D.kpis.power_users, D.kpis.total_users) + ' of users';

const powerShifts = D.top_users.reduce((sum, u) => sum + u.total_shifts, 0);
document.getElementById('kpi-power-shifts').textContent = fmt(powerShifts);
document.getElementById('kpi-power-shifts-pct').textContent = 'Top 30 users alone';

const powerAvg = D.top_users.length > 0 ?
  (D.top_users.reduce((sum, u) => sum + u.avg_shifts_per_month, 0) / D.top_users.length).toFixed(1) : 0;
document.getElementById('kpi-power-avg').textContent = powerAvg;
document.getElementById('kpi-overall-avg').textContent = D.kpis.avg_shifts_per_user;

(function() {
  const tbody = document.getElementById('power-users-table');
  D.top_users.forEach((u, i) => {
    const status = u.churned ? '<span class="badge badge-red">Churned</span>' :
      (u.days_since_last_shift <= 7 ? '<span class="badge badge-green">Active</span>' :
       u.days_since_last_shift <= 30 ? '<span class="badge badge-blue">Recent</span>' :
       '<span class="badge badge-orange">Quiet</span>');
    tbody.innerHTML += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td style="font-family:monospace;font-size:12px">' + u.user + '</td>' +
      '<td style="font-weight:700">' + fmt(u.total_shifts) + '</td>' +
      '<td>' + u.avg_shifts_per_month.toFixed(1) + '</td>' +
      '<td>' + u.active_weeks + '</td>' +
      '<td>' + (u.first_job || '—') + '</td>' +
      '<td>' + u.first_shift_date + '</td>' +
      '<td>' + u.last_shift_date + '</td>' +
      '<td>' + status + '</td>' +
      '</tr>';
  });
})();

// ── Churn Charts ───────────────────────────────────────────────────────────────

document.getElementById('kpi-churn-total').textContent = fmt(D.kpis.churned_users);
document.getElementById('kpi-churn-rate2').textContent = D.kpis.churn_rate + '% of all users';
document.getElementById('kpi-at-risk').textContent = fmt(D.at_risk_total);
document.getElementById('kpi-one-done').textContent = fmt(D.kpis.one_and_done);
document.getElementById('kpi-one-done-pct').textContent = pct(D.kpis.one_and_done, D.kpis.total_users) + ' of all users';

makeChart('chart-churn-bucket', 'bar', {
  labels: D.churn_by_bucket.buckets,
  datasets: [
    {
      label: 'Churn Rate %',
      data: D.churn_by_bucket.churn_rate,
      backgroundColor: D.churn_by_bucket.churn_rate.map(v =>
        v >= 80 ? 'rgba(239,68,68,0.7)' : v >= 50 ? 'rgba(245,158,11,0.7)' : 'rgba(34,197,94,0.7)'
      ),
      borderRadius: 4,
    }
  ]
}, {
  scales: {
    x: { title: { display: true, text: 'Shift Count Bucket', color: '#64748b' } },
    y: { title: { display: true, text: 'Churn Rate %', color: '#64748b' } }
  }
});

// Days since last activity (exact from user data)
makeChart('chart-days-since', 'bar', {
  labels: Object.keys(D.days_since_dist),
  datasets: [{
    label: 'Users',
    data: Object.values(D.days_since_dist),
    backgroundColor: [
      'rgba(34,197,94,0.7)', 'rgba(34,197,94,0.5)',
      'rgba(245,158,11,0.4)', 'rgba(245,158,11,0.6)',
      'rgba(239,68,68,0.4)', 'rgba(239,68,68,0.6)', 'rgba(239,68,68,0.8)',
    ],
    borderRadius: 4,
  }]
}, {
  scales: { x: { title: { display: true, text: 'Days Since Last Shift', color: '#64748b' } } }
});

// At-risk table
(function() {
  const tbody = document.getElementById('at-risk-table');
  D.at_risk.forEach(u => {
    tbody.innerHTML += '<tr>' +
      '<td style="font-family:monospace;font-size:12px">' + u.user + '</td>' +
      '<td>' + u.total_shifts + '</td>' +
      '<td>' + u.avg_shifts_per_month.toFixed(1) + '</td>' +
      '<td><span class="badge badge-orange">' + u.days_since_last_shift + ' days</span></td>' +
      '<td>' + (u.first_job || '—') + '</td>' +
      '<td>' + u.cohort_month + '</td>' +
      '</tr>';
  });
})();

// ── Activity Charts ────────────────────────────────────────────────────────────

makeChart('chart-jobs', 'bar', {
  labels: D.job_distribution.jobs,
  datasets: [{
    label: 'Shifts',
    data: D.job_distribution.counts,
    backgroundColor: 'rgba(59,130,246,0.6)',
    borderRadius: 4,
  }]
}, {
  indexAxis: 'y',
  scales: {
    x: { title: { display: true, text: 'Number of Shifts', color: '#64748b' } },
  }
});

makeChart('chart-locations', 'bar', {
  labels: D.location.locations,
  datasets: [{
    label: 'Shifts',
    data: D.location.counts,
    backgroundColor: 'rgba(139,92,246,0.6)',
    borderRadius: 4,
  }]
}, {
  indexAxis: 'y',
  scales: {
    x: { title: { display: true, text: 'Number of Shifts', color: '#64748b' } },
  }
});

makeChart('chart-shift-type', 'doughnut', {
  labels: D.shift_type.types,
  datasets: [{
    data: D.shift_type.counts,
    backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b'],
    borderWidth: 0,
  }]
}, {
  scales: {},
  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16 } } },
  cutout: '50%',
});

makeChart('chart-dow', 'bar', {
  labels: D.dow.days,
  datasets: [{
    label: 'Shifts',
    data: D.dow.counts,
    backgroundColor: D.dow.days.map(d =>
      (d === 'Saturday' || d === 'Sunday') ? 'rgba(245,158,11,0.6)' : 'rgba(59,130,246,0.6)'
    ),
    borderRadius: 4,
  }]
});

</script>
</body>
</html>"""

# Inject the data
data_json = json.dumps(dashboard_data, default=str)
html = html.replace('DASHBOARD_DATA_PLACEHOLDER', data_json)

output_path = os.path.join(BASE_DIR, "analytics_dashboard.html")
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"\nDashboard generated: {output_path}")
print(f"Open in browser to view.")
