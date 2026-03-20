import csv
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import statistics

# Load data
rows = []
with open(r"G:\Other computers\My Laptop\claude_projects\portpal\marketing\user_stats_export.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

print(f"Total users loaded: {len(rows)}")
print(f"Columns: {list(rows[0].keys())}")
print()

# Parse helper
def parse_date(s):
    if not s or s.strip() == "":
        return None
    s = s.strip()
    for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d"]:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None

def to_float(s):
    try:
        return float(s)
    except (ValueError, TypeError):
        return 0.0

def to_int(s):
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return 0

def to_bool(s):
    return s.strip().lower() == "true"

# Parse all rows
for r in rows:
    r["_first_shift"] = parse_date(r.get("first_shift_date", ""))
    r["_last_shift"] = parse_date(r.get("last_shift_date", ""))
    r["_churned"] = to_bool(r.get("churned", ""))
    r["_total_shifts"] = to_int(r.get("total_shifts", "0"))
    r["_active_span_days"] = to_int(r.get("active_span_days", "0"))
    r["_avg_shifts_per_month"] = to_float(r.get("avg_shifts_per_month", "0"))
    r["_first_week_shifts"] = to_int(r.get("first_week_shifts", "0"))
    r["_active_weeks"] = to_int(r.get("active_weeks", "0"))
    r["_shifts_per_active_week"] = to_float(r.get("shifts_per_active_week", "0"))
    r["_first_day_shifts"] = to_int(r.get("first_day_shifts", "0"))
    r["_first_month_shifts"] = to_int(r.get("first_month_shifts", "0"))
    r["_days_since_last_shift"] = to_int(r.get("days_since_last_shift", "0"))
    r["_first_job"] = r.get("first_job", "").strip()
    r["_cohort_month"] = r.get("cohort_month", "").strip()

churned = [r for r in rows if r["_churned"]]
active = [r for r in rows if not r["_churned"]]

print(f"Churned users: {len(churned)}")
print(f"Active users: {len(active)}")
print()

# ============================================================
# 1. CHURN TIMING
# ============================================================
print("=" * 70)
print("1. CHURN TIMING DISTRIBUTION")
print("=" * 70)

# active_span_days = days between first and last shift
# For churned users, this tells us how long they were active
churn_buckets = {
    "Same day (0 days)": 0,
    "First week (1-7 days)": 0,
    "First month (8-30 days)": 0,
    "Months 2-3 (31-90 days)": 0,
    "Months 3-6 (91-180 days)": 0,
    "6+ months (181+ days)": 0,
}

for r in churned:
    span = r["_active_span_days"]
    if span == 0:
        churn_buckets["Same day (0 days)"] += 1
    elif span <= 7:
        churn_buckets["First week (1-7 days)"] += 1
    elif span <= 30:
        churn_buckets["First month (8-30 days)"] += 1
    elif span <= 90:
        churn_buckets["Months 2-3 (31-90 days)"] += 1
    elif span <= 180:
        churn_buckets["Months 3-6 (91-180 days)"] += 1
    else:
        churn_buckets["6+ months (181+ days)"] += 1

for bucket, count in churn_buckets.items():
    pct = count / len(churned) * 100 if churned else 0
    print(f"  {bucket}: {count} users ({pct:.1f}%)")

if churned:
    spans = [r["_active_span_days"] for r in churned]
    print(f"\n  Median active span before churn: {statistics.median(spans):.0f} days")
    print(f"  Mean active span before churn: {statistics.mean(spans):.1f} days")
    print(f"  Min: {min(spans)} days, Max: {max(spans)} days")
print()

# ============================================================
# 2. ONE-AND-DONE PROFILE
# ============================================================
print("=" * 70)
print("2. ONE-AND-DONE PROFILE (users with exactly 1 shift)")
print("=" * 70)

one_and_done = [r for r in rows if r["_total_shifts"] == 1]
print(f"  Total one-and-done users: {len(one_and_done)} ({len(one_and_done)/len(rows)*100:.1f}% of all users)")
print(f"  Of these, churned: {sum(1 for r in one_and_done if r['_churned'])}")
print(f"  Of these, NOT churned: {sum(1 for r in one_and_done if not r['_churned'])}")
print()

# First job distribution
print("  First job distribution:")
job_counts = Counter(r["_first_job"] for r in one_and_done)
for job, count in job_counts.most_common(15):
    pct = count / len(one_and_done) * 100
    print(f"    {job}: {count} ({pct:.1f}%)")
print()

# Cohort month distribution
print("  Cohort month distribution:")
cohort_counts = Counter(r["_cohort_month"] for r in one_and_done)
for cohort, count in sorted(cohort_counts.items()):
    pct = count / len(one_and_done) * 100
    # Also compute % of that cohort's users who are one-and-done
    cohort_total = sum(1 for r in rows if r["_cohort_month"] == cohort)
    pct_of_cohort = count / cohort_total * 100 if cohort_total else 0
    print(f"    {cohort}: {count} one-and-done ({pct:.1f}% of all OAD, {pct_of_cohort:.1f}% of cohort's {cohort_total} users)")
print()

# ============================================================
# 3. ACTIVATION ANALYSIS
# ============================================================
print("=" * 70)
print("3. ACTIVATION ANALYSIS")
print("=" * 70)

# Day 1 only vs came back day 2+
day1_only = [r for r in rows if r["_active_span_days"] == 0]
came_back = [r for r in rows if r["_active_span_days"] > 0]
print(f"  Users active ONLY on day 1 (active_span=0): {len(day1_only)} ({len(day1_only)/len(rows)*100:.1f}%)")
print(f"  Users who came back day 2+ (active_span>0): {len(came_back)} ({len(came_back)/len(rows)*100:.1f}%)")
print(f"    Of day-1-only users, churned: {sum(1 for r in day1_only if r['_churned'])} ({sum(1 for r in day1_only if r['_churned'])/len(day1_only)*100:.1f}%)")
print(f"    Of came-back users, churned: {sum(1 for r in came_back if r['_churned'])} ({sum(1 for r in came_back if r['_churned'])/len(came_back)*100:.1f}%)")
print()

# First week shifts vs churned
print("  First week shifts vs churn rate:")
fw_buckets = defaultdict(lambda: {"total": 0, "churned": 0})
for r in rows:
    fws = r["_first_week_shifts"]
    if fws == 0:
        key = "0"
    elif fws == 1:
        key = "1"
    elif fws == 2:
        key = "2"
    elif fws == 3:
        key = "3"
    elif fws <= 5:
        key = "4-5"
    elif fws <= 10:
        key = "6-10"
    else:
        key = "11+"
    fw_buckets[key]["total"] += 1
    if r["_churned"]:
        fw_buckets[key]["churned"] += 1

for key in ["0", "1", "2", "3", "4-5", "6-10", "11+"]:
    if fw_buckets[key]["total"] > 0:
        total = fw_buckets[key]["total"]
        ch = fw_buckets[key]["churned"]
        pct = ch / total * 100
        print(f"    {key} shifts in week 1: {total} users, {ch} churned ({pct:.1f}% churn rate)")
print()

# First month shifts vs churned
print("  First month shifts vs churn rate:")
fm_buckets = defaultdict(lambda: {"total": 0, "churned": 0})
for r in rows:
    fms = r["_first_month_shifts"]
    if fms == 0:
        key = "0"
    elif fms == 1:
        key = "1"
    elif fms <= 3:
        key = "2-3"
    elif fms <= 5:
        key = "4-5"
    elif fms <= 10:
        key = "6-10"
    elif fms <= 20:
        key = "11-20"
    else:
        key = "21+"
    fm_buckets[key]["total"] += 1
    if r["_churned"]:
        fm_buckets[key]["churned"] += 1

for key in ["0", "1", "2-3", "4-5", "6-10", "11-20", "21+"]:
    if fm_buckets[key]["total"] > 0:
        total = fm_buckets[key]["total"]
        ch = fm_buckets[key]["churned"]
        pct = ch / total * 100
        print(f"    {key} shifts in month 1: {total} users, {ch} churned ({pct:.1f}% churn rate)")
print()

# ============================================================
# 4. POWER USER DNA
# ============================================================
print("=" * 70)
print("4. POWER USER DNA (100+ shifts)")
print("=" * 70)

power = [r for r in rows if r["_total_shifts"] >= 100]
print(f"  Power users (100+ shifts): {len(power)} ({len(power)/len(rows)*100:.1f}% of all users)")
print(f"  Of these, churned: {sum(1 for r in power if r['_churned'])}")
print()

if power:
    pw_fws = [r["_first_week_shifts"] for r in power]
    pw_fms = [r["_first_month_shifts"] for r in power]
    print(f"  Avg first_week_shifts: {statistics.mean(pw_fws):.2f} (median: {statistics.median(pw_fws):.1f})")
    print(f"  Avg first_month_shifts: {statistics.mean(pw_fms):.2f} (median: {statistics.median(pw_fms):.1f})")
    print(f"  Avg total_shifts: {statistics.mean([r['_total_shifts'] for r in power]):.1f}")
    print(f"  Avg active_span_days: {statistics.mean([r['_active_span_days'] for r in power]):.1f}")
    print(f"  Avg shifts_per_active_week: {statistics.mean([r['_shifts_per_active_week'] for r in power]):.2f}")
    print()

    # First jobs of power users
    print("  Power user first jobs:")
    pw_jobs = Counter(r["_first_job"] for r in power)
    for job, count in pw_jobs.most_common(15):
        pct = count / len(power) * 100
        print(f"    {job}: {count} ({pct:.1f}%)")
    print()

# Compare to churned users
if churned:
    ch_fws = [r["_first_week_shifts"] for r in churned]
    ch_fms = [r["_first_month_shifts"] for r in churned]
    print("  COMPARISON - Churned users:")
    print(f"  Avg first_week_shifts: {statistics.mean(ch_fws):.2f} (median: {statistics.median(ch_fws):.1f})")
    print(f"  Avg first_month_shifts: {statistics.mean(ch_fms):.2f} (median: {statistics.median(ch_fms):.1f})")
    print(f"  Avg total_shifts: {statistics.mean([r['_total_shifts'] for r in churned]):.1f}")
    print(f"  Avg active_span_days: {statistics.mean([r['_active_span_days'] for r in churned]):.1f}")
    print()

    print("  COMPARISON - Active (non-churned) users:")
    if active:
        ac_fws = [r["_first_week_shifts"] for r in active]
        ac_fms = [r["_first_month_shifts"] for r in active]
        print(f"  Avg first_week_shifts: {statistics.mean(ac_fws):.2f} (median: {statistics.median(ac_fws):.1f})")
        print(f"  Avg first_month_shifts: {statistics.mean(ac_fms):.2f} (median: {statistics.median(ac_fms):.1f})")
        print(f"  Avg total_shifts: {statistics.mean([r['_total_shifts'] for r in active]):.1f}")
        print(f"  Avg active_span_days: {statistics.mean([r['_active_span_days'] for r in active]):.1f}")
print()

# ============================================================
# 5. ENGAGEMENT DECAY
# ============================================================
print("=" * 70)
print("5. ENGAGEMENT DECAY (churned users)")
print("=" * 70)

if churned:
    avg_spm = [r["_avg_shifts_per_month"] for r in churned]
    spaw = [r["_shifts_per_active_week"] for r in churned]
    print(f"  Avg shifts_per_month (churned): {statistics.mean(avg_spm):.2f} (median: {statistics.median(avg_spm):.1f})")
    print(f"  Avg shifts_per_active_week (churned): {statistics.mean(spaw):.2f} (median: {statistics.median(spaw):.1f})")
    print()

    # Breakdown by churn timing
    print("  Engagement by churn timing:")
    for bucket_name, min_d, max_d in [("Same day", 0, 0), ("First week", 1, 7), ("First month", 8, 30), ("2-3 months", 31, 90), ("3-6 months", 91, 180), ("6+ months", 181, 9999)]:
        subset = [r for r in churned if min_d <= r["_active_span_days"] <= max_d]
        if subset:
            avg_s = statistics.mean([r["_avg_shifts_per_month"] for r in subset])
            avg_w = statistics.mean([r["_shifts_per_active_week"] for r in subset])
            avg_total = statistics.mean([r["_total_shifts"] for r in subset])
            print(f"    {bucket_name}: {len(subset)} users, avg {avg_total:.1f} total shifts, {avg_s:.2f} shifts/month, {avg_w:.2f} shifts/active_week")

    print()
    # Compare to active users
    if active:
        act_spm = [r["_avg_shifts_per_month"] for r in active]
        act_spaw = [r["_shifts_per_active_week"] for r in active]
        print(f"  Avg shifts_per_month (active): {statistics.mean(act_spm):.2f} (median: {statistics.median(act_spm):.1f})")
        print(f"  Avg shifts_per_active_week (active): {statistics.mean(act_spaw):.2f} (median: {statistics.median(act_spaw):.1f})")
print()

# ============================================================
# 6. RECENCY / AT-RISK ANALYSIS
# ============================================================
print("=" * 70)
print("6. RECENCY / AT-RISK ANALYSIS (non-churned users)")
print("=" * 70)

print(f"  Total non-churned users: {len(active)}")
print()

risk_buckets = {
    "0-7 days (safe)": [],
    "8-14 days (watch)": [],
    "15-21 days (at risk)": [],
    "22-30 days (high risk)": [],
    "31-60 days (likely churned)": [],
    "61-90 days (ghost)": [],
    "90+ days (definitely gone)": [],
}

for r in active:
    d = r["_days_since_last_shift"]
    if d <= 7:
        risk_buckets["0-7 days (safe)"].append(r)
    elif d <= 14:
        risk_buckets["8-14 days (watch)"].append(r)
    elif d <= 21:
        risk_buckets["15-21 days (at risk)"].append(r)
    elif d <= 30:
        risk_buckets["22-30 days (high risk)"].append(r)
    elif d <= 60:
        risk_buckets["31-60 days (likely churned)"].append(r)
    elif d <= 90:
        risk_buckets["61-90 days (ghost)"].append(r)
    else:
        risk_buckets["90+ days (definitely gone)"].append(r)

for bucket, users in risk_buckets.items():
    pct = len(users) / len(active) * 100 if active else 0
    avg_shifts = statistics.mean([r["_total_shifts"] for r in users]) if users else 0
    print(f"  {bucket}: {len(users)} users ({pct:.1f}%), avg {avg_shifts:.1f} total shifts")

# Summary stats
at_risk_14_30 = [r for r in active if 14 <= r["_days_since_last_shift"] <= 30]
at_risk_30_60 = [r for r in active if 30 < r["_days_since_last_shift"] <= 60]
print()
print(f"  SUMMARY: Users labeled 'active' but at risk:")
print(f"    14-30 days silent: {len(at_risk_14_30)} users ({len(at_risk_14_30)/len(active)*100:.1f}% of 'active')")
print(f"    31-60 days silent: {len(at_risk_30_60)} users ({len(at_risk_30_60)/len(active)*100:.1f}% of 'active')")
print(f"    60+ days silent: {sum(1 for r in active if r['_days_since_last_shift'] > 60)} users")
print(f"    Total 'active' users who are actually silent 14+ days: {sum(1 for r in active if r['_days_since_last_shift'] >= 14)}")
print()

# ============================================================
# 7. COHORT QUALITY
# ============================================================
print("=" * 70)
print("7. COHORT QUALITY")
print("=" * 70)

cohorts = defaultdict(lambda: {"total": 0, "churned": 0, "power": 0, "total_shifts": 0, "one_and_done": 0})
for r in rows:
    cm = r["_cohort_month"]
    cohorts[cm]["total"] += 1
    if r["_churned"]:
        cohorts[cm]["churned"] += 1
    if r["_total_shifts"] >= 100:
        cohorts[cm]["power"] += 1
    if r["_total_shifts"] == 1:
        cohorts[cm]["one_and_done"] += 1
    cohorts[cm]["total_shifts"] += r["_total_shifts"]

print(f"  {'Cohort':<10} {'Users':>6} {'Churned':>8} {'Churn%':>7} {'Power':>6} {'Power%':>7} {'OAD':>5} {'OAD%':>6} {'Avg Shifts':>11}")
print(f"  {'-'*10} {'-'*6} {'-'*8} {'-'*7} {'-'*6} {'-'*7} {'-'*5} {'-'*6} {'-'*11}")
for cm in sorted(cohorts.keys()):
    c = cohorts[cm]
    churn_pct = c["churned"] / c["total"] * 100 if c["total"] else 0
    power_pct = c["power"] / c["total"] * 100 if c["total"] else 0
    oad_pct = c["one_and_done"] / c["total"] * 100 if c["total"] else 0
    avg_sh = c["total_shifts"] / c["total"] if c["total"] else 0
    print(f"  {cm:<10} {c['total']:>6} {c['churned']:>8} {churn_pct:>6.1f}% {c['power']:>6} {power_pct:>6.1f}% {c['one_and_done']:>5} {oad_pct:>5.1f}% {avg_sh:>10.1f}")

# Best/worst cohorts
print()
sorted_by_churn = sorted(cohorts.items(), key=lambda x: x[1]["churned"]/x[1]["total"] if x[1]["total"]>=10 else 999)
eligible = [(k,v) for k,v in sorted_by_churn if v["total"] >= 10]
if eligible:
    best = eligible[0]
    worst = eligible[-1]
    print(f"  Lowest churn cohort (min 10 users): {best[0]} ({best[1]['churned']/best[1]['total']*100:.1f}% churn, {best[1]['total']} users)")
    print(f"  Highest churn cohort (min 10 users): {worst[0]} ({worst[1]['churned']/worst[1]['total']*100:.1f}% churn, {worst[1]['total']} users)")

sorted_by_power = sorted(cohorts.items(), key=lambda x: x[1]["power"]/x[1]["total"] if x[1]["total"]>=10 else -1, reverse=True)
eligible_p = [(k,v) for k,v in sorted_by_power if v["total"] >= 10]
if eligible_p:
    best_p = eligible_p[0]
    print(f"  Highest power user cohort: {best_p[0]} ({best_p[1]['power']/best_p[1]['total']*100:.1f}% power users, {best_p[1]['total']} users)")
print()

# ============================================================
# 8. JOB STICKINESS
# ============================================================
print("=" * 70)
print("8. JOB STICKINESS (first_job vs retention)")
print("=" * 70)

jobs = defaultdict(lambda: {"total": 0, "churned": 0, "power": 0, "total_shifts_sum": 0, "active_span_sum": 0})
for r in rows:
    j = r["_first_job"]
    if not j:
        j = "(empty)"
    jobs[j]["total"] += 1
    if r["_churned"]:
        jobs[j]["churned"] += 1
    if r["_total_shifts"] >= 100:
        jobs[j]["power"] += 1
    jobs[j]["total_shifts_sum"] += r["_total_shifts"]
    jobs[j]["active_span_sum"] += r["_active_span_days"]

print(f"  {'First Job':<25} {'Users':>6} {'Churned':>8} {'Churn%':>7} {'Power':>6} {'Power%':>7} {'Avg Shifts':>11} {'Avg Span':>9}")
print(f"  {'-'*25} {'-'*6} {'-'*8} {'-'*7} {'-'*6} {'-'*7} {'-'*11} {'-'*9}")

# Sort by total users descending
for j, jd in sorted(jobs.items(), key=lambda x: x[1]["total"], reverse=True):
    if jd["total"] >= 5:  # Only show jobs with 5+ users
        churn_pct = jd["churned"] / jd["total"] * 100
        power_pct = jd["power"] / jd["total"] * 100
        avg_sh = jd["total_shifts_sum"] / jd["total"]
        avg_sp = jd["active_span_sum"] / jd["total"]
        print(f"  {j:<25} {jd['total']:>6} {jd['churned']:>8} {churn_pct:>6.1f}% {jd['power']:>6} {power_pct:>6.1f}% {avg_sh:>10.1f} {avg_sp:>8.1f}")

# Best/worst retention jobs (min 10 users)
print()
job_list = [(j, jd) for j, jd in jobs.items() if jd["total"] >= 10]
if job_list:
    sorted_by_retention = sorted(job_list, key=lambda x: x[1]["churned"]/x[1]["total"])
    print(f"  BEST retention (lowest churn, min 10 users):")
    for j, jd in sorted_by_retention[:5]:
        print(f"    {j}: {jd['churned']/jd['total']*100:.1f}% churn ({jd['total']} users, avg {jd['total_shifts_sum']/jd['total']:.0f} shifts)")

    print(f"\n  WORST retention (highest churn, min 10 users):")
    for j, jd in sorted_by_retention[-5:]:
        print(f"    {j}: {jd['churned']/jd['total']*100:.1f}% churn ({jd['total']} users, avg {jd['total_shifts_sum']/jd['total']:.0f} shifts)")

print()

# ============================================================
# BONUS: Top-level summary
# ============================================================
print("=" * 70)
print("SUMMARY STATISTICS")
print("=" * 70)
print(f"  Total users: {len(rows)}")
print(f"  Churned: {len(churned)} ({len(churned)/len(rows)*100:.1f}%)")
print(f"  Active: {len(active)} ({len(active)/len(rows)*100:.1f}%)")
print(f"  One-and-done: {len(one_and_done)} ({len(one_and_done)/len(rows)*100:.1f}%)")
print(f"  Power users (100+): {len(power)} ({len(power)/len(rows)*100:.1f}%)")
print(f"  Total shifts: {sum(r['_total_shifts'] for r in rows):,}")
print(f"  Avg shifts/user: {statistics.mean([r['_total_shifts'] for r in rows]):.1f}")
print(f"  Median shifts/user: {statistics.median([r['_total_shifts'] for r in rows]):.0f}")
print(f"  Avg first_week_shifts (all): {statistics.mean([r['_first_week_shifts'] for r in rows]):.2f}")
print(f"  Avg first_month_shifts (all): {statistics.mean([r['_first_month_shifts'] for r in rows]):.2f}")

# Truly active users (shifted in last 14 days AND not churned)
truly_active = [r for r in active if r["_days_since_last_shift"] <= 14]
print(f"\n  'Truly active' (non-churned, last shift within 14 days): {len(truly_active)} ({len(truly_active)/len(rows)*100:.1f}% of all)")
print(f"  'At risk' (non-churned, last shift 14-60 days): {len(at_risk_14_30) + len(at_risk_30_60)}")
print(f"  'Zombie' (non-churned, last shift 60+ days): {sum(1 for r in active if r['_days_since_last_shift'] > 60)}")
