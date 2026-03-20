# PORTPAL Analytics Framework
## Metrics, KPIs, and Dashboard Strategy

---

## 1. NORTH STAR METRIC

### The Metric: **Weekly Active Shift Loggers (WASL)**

**Definition:** Users who logged at least one shift in the past 7 days.

**Why This Metric:**
- Directly measures core value delivery (shift tracking)
- Combines acquisition AND retention in one number
- Correlates strongly with:
  - Pay discrepancy detection (requires consistent logging)
  - Pension goal accuracy (requires complete data)
  - Conversion to Pro (engaged users convert)
  - Referral likelihood (active users recommend)

**How to Measure:**
```sql
SELECT COUNT(DISTINCT user_id)
FROM shifts
WHERE created_at >= NOW() - INTERVAL 7 DAYS
```

**Target Progression:**
| Month | WASL Target | Notes |
|-------|-------------|-------|
| Launch | 50 | Seed users |
| Month 3 | 200 | Word of mouth |
| Month 6 | 400 | 13% of market |
| Year 1 | 600 | 20% market penetration |

**Leading Indicators:**
- Daily shift logs (predict weekly)
- App opens without logging (engagement without value)
- Session duration trends

**Lagging Indicators:**
- Conversion rate (proves WASL quality)
- Referral rate (proves WASL satisfaction)
- Churn rate (proves WASL stickiness)

---

## 2. ACQUISITION METRICS

### 2.1 Download Metrics

| Metric | Definition | Target (Month 1) |
|--------|------------|------------------|
| Total Downloads | Cumulative app installs | 300 |
| Weekly Downloads | New installs per week | 50-75 |
| Download-to-Signup Rate | % downloads that create account | 70% |

### 2.2 Signup Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Total Signups | Cumulative accounts created | 210 (70% of downloads) |
| Weekly Signups | New accounts per week | 35-50 |
| Signup Completion Rate | Start vs complete registration | 85% |
| Signup Drop-off Points | Where users abandon registration | Track by step |

### 2.3 Source Attribution

Track every user's acquisition source:

**Organic Sources:**
- App Store Search
- Word of Mouth (referral code)
- Direct (typed URL/app name)

**Paid Sources:**
- Facebook/Instagram Ads
- Google Ads (if used)
- Reddit Ads (r/longshoremen, r/vancouver)

**Content Sources:**
- TikTok (link in bio)
- Instagram (link in bio)
- YouTube (if applicable)

**Implementation:**
- UTM parameters for all links
- Unique promo codes per channel
- "How did you hear about us?" survey at signup
- Referral code tracking

### 2.4 Cost Per Acquisition (CPA)

| Channel | Spend | Signups | CPA | Target CPA |
|---------|-------|---------|-----|------------|
| Facebook Ads | $X | Y | $X/Y | < $5 |
| Instagram Ads | $X | Y | $X/Y | < $5 |
| TikTok (organic) | $0 | Y | $0 | - |
| Word of Mouth | $0 | Y | $0 | - |

**Target Blended CPA:** < $3 (given small market, need efficiency)

### 2.5 Viral Coefficient (K-Factor)

**Formula:** K = (invites sent per user) x (conversion rate of invites)

**Example:**
- Each user sends 2 referral invites
- 25% of invites convert
- K = 2 x 0.25 = 0.5

**Target:** K > 0.3 (word of mouth is critical in tight-knit port community)

**Tracking:**
- Referral codes issued
- Referral codes used
- Invites sent (in-app share)
- Conversion from referral

---

## 3. ACTIVATION METRICS

### 3.1 Activation Event: First Shift Logged

**Definition:** User has logged at least one shift (the "aha moment")

**Time to First Value:**
| Cohort | Target | Concern Threshold |
|--------|--------|-------------------|
| Same day as signup | 50% | < 30% |
| Within 3 days | 75% | < 60% |
| Within 7 days | 85% | < 70% |
| Never activated | < 10% | > 20% |

### 3.2 Activation Rate by Cohort

Track weekly cohorts and their activation rates:

```
Week of Jan 1: 87 signups, 71 activated (82%)
Week of Jan 8: 92 signups, 75 activated (82%)
Week of Jan 15: 105 signups, 88 activated (84%)
```

**Red Flag:** Activation rate drops below 70%

### 3.3 Onboarding Drop-off Funnel

Track completion rates at each step:

| Step | Action | Target Completion |
|------|--------|-------------------|
| 1 | Download | 100% (baseline) |
| 2 | Open app | 95% |
| 3 | Create account | 75% |
| 4 | Complete profile (seniority, home terminal) | 90% |
| 5 | View tutorial/tooltip | 80% |
| 6 | Log first shift | 85% |
| 7 | View pay calculation | 95% |

**Identify bottlenecks:** Where do users drop off most?

### 3.4 Feature Discovery Rate

How many users discover key features in first 7 days:

| Feature | Discovery Target | How Measured |
|---------|------------------|--------------|
| Shift logging | 100% | (core flow) |
| Pension tracker | 80% | Viewed pension screen |
| Weekly summary | 70% | Viewed summary |
| AI question (Free) | 40% | Asked 1 question |
| Job predictions | 50% | Viewed prediction |

---

## 4. ENGAGEMENT METRICS

### 4.1 Active User Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| DAU | Users active today | - |
| WAU | Users active this week | - |
| MAU | Users active this month | - |
| DAU/MAU Ratio | "Stickiness" | > 0.25 |
| WAU/MAU Ratio | Weekly engagement | > 0.60 |

**"Active" Definition:** Opened app and performed an action (log, view, interact)

### 4.2 Shifts Logged Per User

| Metric | Definition | Target |
|--------|------------|--------|
| Shifts/User/Week | Average shifts logged per active user | 4-5 |
| Shifts/User/Month | Average shifts logged per active user | 15-20 |
| Zero-shift Weeks | % of users with 0 shifts in a week | < 20% |

**Benchmark:** Average longshoreman works 4-5 shifts/week

### 4.3 Session Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Sessions/User/Day | Average app opens | 1.5 |
| Session Duration | Average time in app | 45-90 sec |
| Actions/Session | Taps, logs, views | 3-5 |

**Note:** Short sessions are GOOD for PORTPAL - quick logging is the value prop.

### 4.4 Feature Usage Breakdown

Track weekly usage of each feature:

| Feature | Free Users | Pro Users | Notes |
|---------|------------|-----------|-------|
| Shift logging | 100% | 100% | Core feature |
| View weekly summary | 70% | 85% | |
| Pension tracker | 50% | 75% | Key value driver |
| AI question | 30% | 60% | Gated for Free |
| Callback/templates | N/A | 45% | Pro only |
| Pay stub upload | N/A | 30% | Pro only |
| Job predictions | 20% | 50% | Limited for Free |

---

## 5. RETENTION METRICS

### 5.1 Retention by Day

| Timeframe | Definition | Target | Concern |
|-----------|------------|--------|---------|
| D1 | Returned day after signup | 50% | < 35% |
| D7 | Returned 7 days after signup | 40% | < 25% |
| D30 | Returned 30 days after signup | 30% | < 20% |
| D90 | Returned 90 days after signup | 25% | < 15% |

### 5.2 Cohort Retention Chart

Track each weekly signup cohort over time:

```
             Week 1   Week 2   Week 3   Week 4   Week 8   Week 12
Cohort A     100%     65%      55%      50%      42%      38%
Cohort B     100%     68%      58%      52%      -        -
Cohort C     100%     62%      -        -        -        -
```

**Healthy Pattern:** Curve flattens after week 4 (core users remain)

### 5.3 Churn Prediction Signals

**Warning signs a user will churn:**

| Signal | Weight | Detection |
|--------|--------|-----------|
| No shift logged in 10+ days | HIGH | Query shift table |
| Decreasing session frequency | MEDIUM | Compare week-over-week |
| No app open in 7 days | HIGH | Last activity date |
| Never viewed pension tracker | MEDIUM | Feature usage log |
| Free user hit AI limit (didn't upgrade) | MEDIUM | Usage + tier |
| Negative NPS/rating | HIGH | Survey/review data |

**Intervention Triggers:**
- 5 days no activity: Push notification "Don't forget to log today's shift"
- 10 days no activity: Email "Your data is waiting"
- 14 days no activity: Personal outreach (small user base)

### 5.4 Resurrection Rate

**Definition:** Users who churned (30+ days inactive) but returned

| Metric | Target |
|--------|--------|
| Monthly Resurrection Rate | 5-10% of churned users |
| Resurrection by Trigger | Track what brought them back |

**Resurrection Triggers:**
- New feature launch
- Email campaign
- Pension year reset (April)
- Pay discrepancy in news
- Friend referral

---

## 6. REVENUE METRICS

### 6.1 Trial Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Trial Starts | Users starting 30-day Pro trial | 60% of signups |
| Trial Engagement | Trials who use Pro features | 70% |
| Trial Duration (avg) | Days used before conversion/expiry | 10 days |

### 6.2 Conversion Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Trial-to-Paid | % trials converting to Pro | 40% |
| Free-to-Paid | % free users eventually upgrading | 25% |
| Time to Convert | Days from signup to payment | 14-30 days |
| Upgrade Trigger | What event preceded upgrade | Track |

**Upgrade Triggers to Track:**
- Hit AI question limit
- Tapped locked feature (callback, templates)
- Viewed pricing page
- End of trial
- Pay stub discrepancy (manual)

### 6.3 Revenue Metrics

| Metric | Definition | Calculation |
|--------|------------|-------------|
| MRR | Monthly Recurring Revenue | Sum of monthly payments |
| ARR | Annual Recurring Revenue | MRR x 12 |
| New MRR | MRR from new subscribers | This month's new subs |
| Churned MRR | MRR lost to cancellations | This month's cancellations |
| Net MRR Growth | New - Churned | Positive = good |

**Targets (Year 1):**
| Month | Pro Users | MRR | ARR |
|-------|-----------|-----|-----|
| 3 | 50 | $400 | $4,800 |
| 6 | 120 | $960 | $11,520 |
| 12 | 240 | $1,920 | $23,040 |

### 6.4 Unit Economics

| Metric | Definition | Target |
|--------|------------|--------|
| ARPU | Average Revenue Per User (all users) | $3/month |
| ARPPU | Average Revenue Per Paying User | $8/month |
| CAC | Customer Acquisition Cost | < $5 |
| LTV | Lifetime Value | $150+ |
| LTV:CAC Ratio | Payback multiple | > 3:1 |

**LTV Calculation:**
```
LTV = ARPPU x (1 / Monthly Churn Rate)
LTV = $8 x (1 / 0.05) = $160
```

### 6.5 Payback Period

**Definition:** Months to recover CAC from a customer

```
Payback = CAC / ARPU
Payback = $5 / $3 = 1.67 months
```

**Target:** < 6 months

---

## 7. REFERRAL METRICS

### 7.1 Referral Rate

| Metric | Definition | Target |
|--------|------------|--------|
| Referrers | % users who send at least 1 referral | 20% |
| Referral Invites Sent | Total invites across all users | - |
| Referral Conversion | % invites that become signups | 25% |

### 7.2 Referrals Per User

| Segment | Referrals Sent (avg) |
|---------|---------------------|
| All Users | 0.5 |
| Pro Users | 1.2 |
| Power Users | 2.5 |

### 7.3 Referred User Quality

Compare referred vs non-referred users:

| Metric | Referred | Non-Referred |
|--------|----------|--------------|
| Activation Rate | 90% | 82% |
| D30 Retention | 45% | 30% |
| Trial-to-Paid | 50% | 35% |

**Referred users are more valuable** - invest in referral program.

### 7.4 Viral Loop Time

**Definition:** Days from signup to first successful referral

**Target:** < 30 days

**Optimization:**
- Prompt referral after positive moments (discrepancy found, goal hit)
- Make sharing easy (pre-written messages)
- Reward both referrer and referee

---

## 8. DASHBOARD DESIGN

### 8.1 Executive Dashboard (5 Key Metrics)

**Purpose:** Quick health check. View daily.

```
+---------------------------------------------------+
|              PORTPAL EXECUTIVE DASHBOARD          |
+---------------------------------------------------+
|                                                   |
|  NORTH STAR: WASL (Weekly Active Shift Loggers)  |
|  ============================================     |
|  Current: 347    Target: 400    Trend: +12%      |
|                                                   |
+---------------------------------------------------+
|                                                   |
|  [1. NEW USERS]    [2. ACTIVATION]  [3. RETAIN]  |
|  This Week: 52     Rate: 84%        D30: 32%     |
|  vs Last: +8%      vs Target: +4%   vs Last: +2% |
|                                                   |
|  [4. CONVERSION]   [5. MRR]                      |
|  Trial>Paid: 42%   Current: $1,240               |
|  vs Target: +2%    Growth: +$180                 |
|                                                   |
+---------------------------------------------------+
```

### 8.2 Growth Dashboard (Acquisition Focus)

**Purpose:** Marketing team. View weekly.

```
ACQUISITION FUNNEL
==================
Downloads:     420 this month
  > Signups:   315 (75% conversion)
  > Activated: 265 (84% conversion)
  > D7 Retained: 168 (63% retention)

SOURCE BREAKDOWN
================
| Source          | Users | CAC    | D7 Ret |
|-----------------|-------|--------|--------|
| Word of Mouth   | 145   | $0     | 72%    |
| Instagram       | 85    | $3.20  | 58%    |
| App Store       | 52    | $0     | 61%    |
| TikTok          | 33    | $0     | 55%    |

VIRAL METRICS
=============
K-Factor: 0.35
Referrals This Month: 145
Avg Referrals/User: 0.46
```

### 8.3 Product Dashboard (Engagement Focus)

**Purpose:** Product team. View daily.

```
ENGAGEMENT METRICS
==================
DAU: 127    WAU: 347    MAU: 412
DAU/MAU: 0.31 (Healthy)

FEATURE USAGE (Last 7 Days)
============================
| Feature           | Users | Sessions | Completion |
|-------------------|-------|----------|------------|
| Shift Log         | 347   | 1,420    | 98%        |
| Weekly Summary    | 245   | 312      | 100%       |
| Pension Tracker   | 198   | 287      | 100%       |
| AI Question       | 89    | 102      | 95%        |
| Job Prediction    | 156   | 203      | 100%       |
| Pay Stub Upload   | 34    | 41       | 87%        |

SESSION QUALITY
===============
Avg Duration: 52 seconds
Avg Actions: 3.4
Shifts Logged/User/Week: 4.2

PROBLEM AREAS
=============
- Pay stub upload: 13% abandonment (investigate)
- AI question timeout: 5 incidents (check API)
```

### 8.4 Revenue Dashboard (Conversion Focus)

**Purpose:** Finance/leadership. View weekly.

```
REVENUE SNAPSHOT
================
MRR: $1,240    ARR: $14,880
New MRR: +$180    Churned: -$40    Net: +$140

SUBSCRIBER BREAKDOWN
====================
| Tier          | Users | MRR     | Churn |
|---------------|-------|---------|-------|
| Founding ($79)| 42    | $276    | 0%    |
| Annual ($99)  | 68    | $561    | 2%    |
| Monthly ($10) | 45    | $450    | 8%    |

CONVERSION FUNNEL
=================
Free Users: 245
Trial Starts: 147 (60%)
Trial Active: 52
Trial Converting: 22 (42% of eligible)

UPGRADE TRIGGERS
================
| Trigger              | Upgrades | Conv% |
|----------------------|----------|-------|
| End of Trial         | 12       | 38%   |
| Hit AI Limit         | 8        | 52%   |
| Tapped Templates     | 5        | 45%   |
| Viewed Pricing       | 4        | 28%   |

CHURN ANALYSIS
==============
Cancellations This Month: 5
Reasons: Too expensive (2), Not using (2), Missing feature (1)
Save Offers Accepted: 2/5 (40%)
```

---

## 9. ALERTING SYSTEM

### 9.1 Critical Alerts (Immediate)

| Metric | Threshold | Action |
|--------|-----------|--------|
| App crashes | > 1% of sessions | Page on-call |
| API errors | > 5% failure rate | Page on-call |
| Zero signups | 24 hours | Investigate |
| Payment failures | > 10% | Investigate immediately |

### 9.2 Warning Alerts (Same Day)

| Metric | Threshold | Action |
|--------|-----------|--------|
| DAU drops | > 20% vs 7-day avg | Product review |
| Activation rate | < 70% | Onboarding review |
| Trial starts | < 50% of signups | Funnel review |
| Negative reviews | Any 1-star | Respond immediately |

### 9.3 Weekly Review Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| D7 retention | < 35% | Cohort analysis |
| Trial conversion | < 35% | Pricing/value review |
| Referral rate | < 15% | Referral program review |
| Monthly churn | > 8% | Churn analysis |

### 9.4 Anomaly Detection

**Positive Anomalies (Investigate and Replicate):**
- Signups spike > 2x average
- Viral content (track source)
- Conversion spike (what changed?)

**Negative Anomalies (Investigate and Fix):**
- Drop in any metric > 25%
- Unusual churn cluster
- Feature usage collapse

---

## 10. COHORT DEFINITIONS

### 10.1 User Segments

**By Engagement Level:**
| Segment | Definition | Expected % |
|---------|------------|------------|
| Power Users | 5+ shifts/week, daily opens | 20% |
| Regular Users | 3-4 shifts/week | 40% |
| Light Users | 1-2 shifts/week | 25% |
| Dormant | < 1 shift/week | 15% |

**By Payment Status:**
| Segment | Definition |
|---------|------------|
| Free | Never started trial |
| Trial | In 30-day trial |
| Pro (Monthly) | Paying monthly |
| Pro (Annual) | Paying annually |
| Founding Member | Early adopter ($79 rate) |
| Churned Pro | Was Pro, now Free or gone |

### 10.2 Job Type Segments

Track behavior differences by primary job:

| Job Type | Expected Users | Behavior Notes |
|----------|----------------|----------------|
| TRACTOR TRAILER | 30% | High OT, complex rates |
| RUBBER TIRE GANTRY | 15% | Equipment operators |
| DOCK CHECKER | 12% | Lower differentials |
| LABOUR | 10% | Entry level |
| FIRST AID | 5% | Unique OT rules |
| Other | 28% | Various |

**Analysis Questions:**
- Which job types have highest conversion?
- Which job types find most discrepancies?
- Which job types refer most?

### 10.3 Geographic/Terminal Segments

| Terminal | Expected % | Notes |
|----------|------------|-------|
| DELTAPORT | 35% | Largest terminal |
| CENTENNIAL | 30% | Second largest |
| VANTERM | 25% | Vancouver |
| FRASER SURREY | 10% | Smaller |

### 10.4 Seniority Segments

| Seniority | Definition | Behavior |
|-----------|------------|----------|
| Probationary | < 1 year | Learning, high engagement |
| Junior | 1-5 years | Building career, high motivation |
| Mid-Career | 5-15 years | Established, moderate engagement |
| Senior | 15+ years | May prefer paper, harder to convert |

---

## 11. DAY 1 IMPLEMENTATION

### What to Track from Launch Day

**Minimum Viable Analytics:**

1. **Install Firebase/Amplitude/Mixpanel** (pick one)
   - Track all screen views
   - Track all button taps
   - Track all form submissions

2. **Key Events to Log:**
```javascript
// Acquisition
track("app_opened")
track("signup_started")
track("signup_completed", {source: "utm_source"})

// Activation
track("shift_logged", {job: "TT", location: "CENTENNIAL", shift: "DAY"})
track("first_shift_logged")
track("pension_viewed")

// Engagement
track("session_started")
track("feature_used", {feature: "ai_question"})
track("weekly_summary_viewed")

// Conversion
track("trial_started")
track("paywall_viewed")
track("subscription_started", {plan: "annual"})
track("subscription_cancelled", {reason: "too_expensive"})

// Referral
track("referral_sent")
track("referral_converted")
```

3. **User Properties to Set:**
```javascript
setUserProperty("tier", "free") // free, trial, pro
setUserProperty("signup_date", "2025-01-15")
setUserProperty("source", "instagram")
setUserProperty("primary_job", "TRACTOR TRAILER")
setUserProperty("seniority_years", 5)
setUserProperty("home_terminal", "CENTENNIAL")
```

4. **Daily Dashboards (Google Sheets is fine early on):**
   - Signups today
   - Shifts logged today
   - Active users today
   - Trials started today
   - Conversions today

5. **Weekly Review Ritual:**
   - Every Monday: Review last 7 days
   - Check all 10 sections of this framework
   - Identify one thing to improve
   - Set goal for next week

---

## 12. TOOLS RECOMMENDATION

### For < 500 Users (Launch Phase)

| Purpose | Tool | Cost |
|---------|------|------|
| Event Tracking | Mixpanel (free tier) | $0 |
| Dashboards | Google Sheets | $0 |
| Email | Loops or Resend | $0-20/mo |
| Crash Reporting | Firebase Crashlytics | $0 |
| Reviews | App Store Connect | $0 |

### For 500-2000 Users (Growth Phase)

| Purpose | Tool | Cost |
|---------|------|------|
| Event Tracking | Mixpanel/Amplitude paid | $50-200/mo |
| Dashboards | Metabase (self-hosted) | $0 |
| Email | Customer.io | $50-100/mo |
| Attribution | Branch | Free tier |
| Support | Intercom | $50/mo |

---

## Summary: The PORTPAL Metrics Hierarchy

```
                    NORTH STAR
                 Weekly Active Shift Loggers (WASL)
                        |
    +-------------------+-------------------+
    |                   |                   |
ACQUISITION         ENGAGEMENT          MONETIZATION
    |                   |                   |
Downloads           Shifts/Week         Trial Starts
Signups             Session Freq        Conversion %
Activation          Feature Usage       MRR
                    Retention           LTV

                        |
                        v
                    REFERRAL
                 (Feeds Acquisition)
                    K-Factor
                    Referral Rate
```

**Remember:** Perfect data won't save a bad product. Ship fast, track basics, iterate based on what users actually do.

---

*Last Updated: February 2026*
*Review Quarterly*
