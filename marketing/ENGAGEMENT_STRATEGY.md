# PORTPAL Engagement Strategy
## Daily, Weekly, and Monthly Engagement Playbook

**Last Updated:** February 2026
**Core Challenge:** Getting app opens on non-work days

---

## Executive Summary

Longshoremen don't work every day. Shifts are irregular. Some weeks they work 6 days, some weeks 2. The typical app model of "daily active use" doesn't map cleanly to this workforce.

**The problem:** If PORTPAL is only opened when logging shifts, we're a utility, not a habit. Utilities get replaced. Habits stick.

**The solution:** Create value beyond shift logging. Give users reasons to open the app even when they're not working.

**The goal:** Transform PORTPAL from a "shift logging tool" into a "financial command center" that users check daily, whether they worked or not.

---

## Part 1: Defining Engagement Levels

### What Counts as an Active User?

#### Daily Active User (DAU)
**Definition:** User who opens the app AND takes a meaningful action within 24 hours.

**Meaningful actions include:**
- Logging a shift (primary)
- Viewing pension progress
- Checking weekly/monthly summary
- Using AI chat
- Viewing rate information
- Checking goals
- Reading notifications
- Participating in polls/community features

**Does NOT count:**
- App opens under 3 seconds (accidental opens)
- Push notification dismissals without opening
- Background sync activity

**Why this definition:** A "meaningful action" separates casual opens from genuine engagement. We want users who are actually using the app, not just accidentally tapping the icon.

---

#### Weekly Active User (WAU)
**Definition:** User who has 2+ meaningful sessions in a 7-day period, at least 24 hours apart.

**Why 2+ sessions:** One session could be accidental. Two sessions 24+ hours apart indicates intentional return behavior.

**Quality WAU:** User who has 3+ meaningful sessions AND logged at least 1 shift (if they worked).

---

#### Monthly Active User (MAU)
**Definition:** User who has 4+ meaningful sessions in a 30-day period, across at least 2 different weeks.

**Why 4+ sessions:** Approximates once-per-week usage, which is minimum viable habit formation.

**Why 2 different weeks:** Prevents burst usage (logging 5 shifts in one day then disappearing) from counting as "active."

---

### User Segmentation by Engagement

#### Power Users (Top 20%)
**Criteria:**
- Opens app 5+ days per week
- Logs shifts within 24 hours of working
- Uses 3+ features beyond shift logging
- Has active streak of 14+ days
- Views weekly summary every week

**Behavioral markers:**
- Has templates or callbacks set up
- Uses AI chat regularly
- Has pension goal set and checked recently
- Exports data or views detailed analytics
- Refers other users

**Value:** Highest retention, most likely to convert to Pro, most likely to refer.

**Strategy:** Keep them delighted. Early access to new features. Build community with them.

---

#### Regular Users (Middle 50%)
**Criteria:**
- Opens app 2-4 days per week
- Logs most shifts, may be 1-2 days delayed
- Uses 1-2 features beyond shift logging
- Has moderate streak (3-13 days)
- Views weekly summary most weeks

**Behavioral markers:**
- Has default job/terminal set
- May or may not have pension goal
- Responds to push notifications
- Occasional use of dashboard features

**Value:** Core user base. Potential to become power users or to churn.

**Strategy:** Nudge toward power user behaviors. Surface features they haven't tried. Reinforce the habit with streaks and progress.

---

#### Casual Users (Next 20%)
**Criteria:**
- Opens app 1-3 times per week
- Logs shifts inconsistently (misses some)
- Minimal feature usage beyond basic logging
- No active streak
- Rarely views summaries

**Behavioral markers:**
- Hasn't completed full profile setup
- No pension goal set
- Often ignores push notifications
- Long gaps between sessions

**Value:** At risk of churning. Need intervention.

**Strategy:** Re-engagement campaigns. Simplify their experience. Focus on one core habit (shift logging).

---

#### At-Risk Users (Bottom 10%)
**Criteria:**
- No app open in past 7 days
- Last shift logged 14+ days ago
- Ignored recent push notifications
- No response to re-engagement attempts

**Behavioral markers:**
- May have uninstalled
- May have switched to competitor or manual tracking
- May have life change (leave of absence, retirement)

**Value:** Likely to churn. Worth one strong re-engagement attempt.

**Strategy:** "We miss you" campaign. Show value they're missing. Offer incentive to return.

---

### Engagement Metrics Framework

| Metric | Definition | Target | Why It Matters |
|--------|------------|--------|----------------|
| DAU/MAU Ratio | Daily actives divided by monthly actives | 30-40% | Measures stickiness |
| L7 Retention | % of users active in last 7 days | 65% | Early indicator of health |
| L30 Retention | % of users active in last 30 days | 55% | Core retention metric |
| Sessions/Week | Average sessions per active user per week | 4+ | Depth of engagement |
| Session Duration | Average time in app per session | 45-90 sec | Quality of engagement |
| Actions/Session | Average meaningful actions per session | 2+ | Feature adoption |
| Streak Length | Average consecutive logging days | 7+ | Habit formation |
| Feature Adoption | % of users who use 3+ features | 50% | Product depth |

---

## Part 2: Daily Engagement Hooks

### The Core Challenge

**Problem:** Users have no reason to open PORTPAL on days they don't work.

**Traditional app hooks don't work:**
- Social feeds? Not appropriate for this audience.
- Games? Misaligned with product value.
- News? Not our core competency.

**What does work:**
- Financial progress tracking
- Planning and forecasting
- Quick, valuable information
- Sense of progress/momentum
- Community connection (light touch)

---

### Daily Engagement Feature: "Morning Briefing"

**Concept:** A personalized, glanceable summary that gives users a reason to open the app every morning.

**Display:** First thing users see when they open the app (can be dismissed after viewing).

**Content rotates daily:**

**Monday:**
```
GOOD MORNING

Last week: $2,847 earned
This week: Starting fresh

Pension progress: 34%
[============----------] On track

Weather at Vanterm: 12C, Clear
Expected port activity: High

[Log Today] [View Week]
```

**Tuesday-Friday (work days):**
```
GOOD MORNING

This week so far: $568
Yesterday: DAY shift at CENTENNIAL - $568

Pension progress: 34.5%
[=============---------] +$568 since Monday

Rate tip: Did you know night shift adds ~26% to your base rate?

[Log Today] [View Details]
```

**Saturday:**
```
WEEKEND RATES ACTIVE

Saturday rates are 28% higher than weekday.
If you're working today, make sure to log it.

Week so far: $2,847 (5 shifts)
Pension progress: 38%

[Log Weekend Shift] [View Week]
```

**Sunday:**
```
WEEK PREVIEW

Your weekly summary is ready.
Last week: $3,415 from 6 shifts

Pension progress: 40%
[==============---------]

This time last year: You earned $3,102
You're running 10% ahead.

[View Summary] [Plan This Week]
```

---

### Daily Engagement Feature: "Daily Rate Tip"

**Concept:** One interesting fact about longshore pay each day. Rotates through a library of 365+ tips.

**Display:** Card on dashboard, refreshes daily at midnight.

**Example tips:**

**Day 1:**
> "Night shift differential is 26.7% over day shift. That's $14.08/hr extra on base rate."

**Day 2:**
> "Graveyard pays 56.3% more than day shift. A $53.17/hr day job becomes $83.07/hr on graveyard."

**Day 3:**
> "Saturday night pays the same as Sunday all-day: $85.07/hr base."

**Day 4:**
> "HD Mechanics earn $2.50/hr more than base longshoreman. Over a year, that's $5,000+."

**Day 5:**
> "Tractor Trailer on rail at Centennial/Deltaport is a 9-hour shift, not 8. That extra hour is $53.82."

**Day 6:**
> "The pension year runs April to March, not calendar year. Plan accordingly."

**Day 7:**
> "Wheat terminal jobs pay $1.15/hr differential. 6 terminals qualify: Alliance Grain, G3, Cascadia, Richardson, Cargill, Viterra PAC."

**Engagement mechanics:**
- "Knew this" / "Didn't know" buttons (tracks learning)
- Share button (spread knowledge, spread app)
- "See more tips" link to full library
- Badge: "Rate Expert" for viewing 100 tips

---

### Daily Engagement Feature: "Pension Pulse Check"

**Concept:** Quick, motivating progress update. The thing users most care about.

**Display:** Prominent widget on main dashboard. Updates in real-time as shifts are logged.

**Layout:**
```
PENSION PROGRESS

$48,240 of $120,000
[================---------------] 40.2%

Pace: +0.8% ahead of target
At this rate: Hit goal October 8

Days remaining: 247
Needed per day: $290
```

**Daily variation:**
- Green pulse animation when ahead of pace
- Yellow when on pace
- Red subtle warning when behind pace

**Why this creates daily opens:**
- Progress is the #1 motivator
- Even on non-work days, checking progress feels productive
- The "pace" metric creates urgency and satisfaction
- "Days remaining" creates time awareness

---

### Daily Engagement Feature: "What's My Number?"

**Concept:** Quick calculator that answers the question: "If I work today, how much will I make?"

**Display:** Tap to expand calculator on dashboard.

**Interface:**
```
WHAT'S MY NUMBER TODAY?

Job: [Tractor Trailer ▼]
Terminal: [Centennial ▼]
Shift: [DAY] [NIGHT] [GRAVE]
Hours: [9] reg + [0] OT

---
ESTIMATED: $484.38
---

[Log This Shift] [Save as Template]
```

**Why this creates opens:**
- Useful before deciding to take a shift
- Fun to "what-if" different scenarios
- Leads naturally to logging actual shift
- Shows immediate value of the app

---

### Daily Engagement Feature: "Community Pulse"

**Concept:** Anonymous, aggregated activity from other users. Creates social proof and FOMO.

**Display:** Small widget on dashboard, refreshes every few hours.

**Content rotates:**

```
COMMUNITY PULSE

Yesterday: 347 shifts logged
This week: 1,892 shifts logged

Top job today: TRACTOR TRAILER (28%)
Busiest terminal: CENTENNIAL (34%)
```

```
COMMUNITY PULSE

412 longshoremen checked their pension progress today.

Average pension pace: 2.1% behind target
Your pace: 0.8% ahead

You're in the top 35% for progress.
```

```
COMMUNITY PULSE

Question of the day:
"What's your biggest pay concern?"

- Getting shorted on hours (42%)
- Missing differentials (31%)
- OT calculation errors (27%)

1,247 responses so far
[Add Your Vote]
```

**Why this creates daily opens:**
- FOMO: "Others are using the app, I should too"
- Competition: "Where do I rank?"
- Connection: "I'm part of something"
- Curiosity: "What are others doing?"

---

### Daily Engagement Feature: "Plan Tomorrow"

**Concept:** Quick evening feature to prepare for the next day.

**Trigger:** Push notification at 7pm if user hasn't logged today.

**Content:**
```
PLAN TOMORROW

Expecting to work tomorrow?

[Yes - Set Reminder] [No - Day Off] [Not Sure]

If Yes:
- What job? [Last: TT ▼]
- What shift? [DAY] [NIGHT] [GRAVE]

We'll remind you to log tomorrow at [6pm ▼]

[Save Plan]
```

**Why this works:**
- Engages users even when they didn't work today
- Creates commitment to tomorrow's logging
- Prepares them mentally for the app
- Evening engagement captures non-work day users

---

### Daily Engagement Feature: "Weather + Work Forecast"

**Concept:** Combine weather (which affects port activity) with earnings context.

**Display:** Optional widget on dashboard.

```
TOMORROW AT VANTERM

Weather: 8C, Rain
Port Activity: Moderate-High
Historical avg earnings (similar days): $2,100/week

Pro tip: Rainy days often mean more indoor terminal work.
```

**Why this is valuable:**
- Weather affects work availability and conditions
- Creates reason to check app for planning
- Combines practical info with PORTPAL context
- Different from generic weather apps (earnings focus)

---

## Part 3: Weekly Engagement Rituals

### Weekly Ritual: "Sunday Summary"

**Timing:** Push notification Sunday at 6pm, email Sunday evening.

**Push notification:**
```
Your week is in: $3,415 from 6 shifts.
Tap to see your full summary.
```

**In-app experience:**

```
WEEK OF JAN 27 - FEB 2

EARNINGS
$3,415.23 (+12% vs last week)

SHIFTS
6 shifts logged
47 regular hours
3 overtime hours

BREAKDOWN
- Day shifts: 4 ($2,186)
- Night shifts: 2 ($1,229)

TOP EARNING JOB
Tractor Trailer - Rail: $1,843

PENSION PROGRESS
Before: 38.2%
After: 41.1%
[================----------]

THIS TIME LAST YEAR
Week ending Feb 2, 2025: $3,102
You're earning 10% more this year.

[Share Summary] [Plan Next Week]
```

**Gamification:**
- "Best Week" badge if highest earnings week this year
- "Perfect Week" badge if all shifts logged same-day
- Compare to personal average, community average

---

### Weekly Ritual: "Monday Planning Session"

**Timing:** Monday morning (push at 7am if enabled).

**Push notification:**
```
New week starts now.
Your pension target: $2,400 this week to stay on pace.
```

**In-app feature:**
```
PLAN YOUR WEEK

To stay on pace for pension goal:
Target this week: $2,400

Typical week at your pace: 5 shifts
Average per shift: $480

Quick plan:
[ ] Monday - Expected shift?
[ ] Tuesday - Expected shift?
[ ] Wednesday - Expected shift?
[ ] Thursday - Expected shift?
[ ] Friday - Expected shift?
[ ] Saturday - Expected shift?
[ ] Sunday - Expected shift?

[Save Plan] [Skip Planning]
```

**Why this works:**
- Creates commitment early in the week
- Gives users a reason to open Monday (even if not working)
- Connects daily logging to weekly goals
- Makes the week feel manageable

---

### Weekly Ritual: "Mid-Week Check-In"

**Timing:** Wednesday afternoon (push at 3pm).

**Push notification:**
```
Week check-in: You're 42% to your weekly target.
3 more shifts at average = on pace.
```

**In-app feature:**
```
MID-WEEK CHECK

This week so far: $1,008
Weekly target: $2,400

[==========-----------------] 42%

To hit target:
- Need: $1,392 more
- At your average: 3 more shifts
- Days remaining: 4

You're [on pace / behind / ahead]

[Log Today's Shift] [Adjust Target]
```

**Why this works:**
- Creates mid-week touchpoint
- Prevents "I'll catch up later" thinking
- Allows course correction
- Reinforces weekly rhythm

---

### Weekly Ritual: "Pay Day Check"

**Timing:** User-configurable (most longshoremen paid bi-weekly on specific days).

**Setup prompt:**
```
When do you get paid?
[Every two weeks] [Weekly] [Other]

What day? [Friday ▼]

We'll remind you to check your pay stub.
```

**Pay day notification:**
```
Pay day! Time to verify.

Expected (from logged shifts): $3,415
Tap to compare to your pay stub.
```

**Pay day in-app:**
```
PAY VERIFICATION

Period: Jan 20 - Feb 2

YOUR LOGGED SHIFTS
6 shifts = $3,415.23 expected

CHECK YOUR STUB
Gross pay on stub: $______

[Compare] [Mark as Verified] [Found Discrepancy]
```

**Why this matters:**
- THE core value proposition of PORTPAL
- Drives Pro conversions (stub upload feature)
- Creates bi-weekly engagement touchpoint
- Catches discrepancies = real value = loyalty

---

### Weekly Ritual: "Weekend Earnings Alert"

**Timing:** Friday evening (5pm) and Saturday morning (8am).

**Friday notification:**
```
Weekend rates start tomorrow.
Saturday/Sunday shifts pay 28% more.
```

**Saturday notification:**
```
Weekend rates active.
Saturday graveyard = $85.07/hr base.
Don't forget to log if you work.
```

**Why this works:**
- Reminds users of premium earning opportunity
- Creates weekend engagement even if not working
- Educates on rate differences
- "Don't forget" creates slight urgency

---

## Part 4: Monthly Engagement

### Monthly Ritual: "Month End Report"

**Timing:** Last day of month (or 1st of next month).

**Push notification:**
```
January is in the books.
$12,847 earned from 24 shifts.
Tap for your full monthly report.
```

**In-app Monthly Report:**

```
JANUARY 2026 REPORT

EARNINGS SUMMARY
Total earned: $12,847.23
Regular hours: 192
Overtime hours: 14

SHIFT BREAKDOWN
Day shifts: 14 ($7,240)
Night shifts: 8 ($4,612)
Graveyard shifts: 2 ($995)

LOCATION BREAKDOWN
Centennial: 15 shifts (62%)
Vanterm: 7 shifts (29%)
Deltaport: 2 shifts (9%)

JOB BREAKDOWN
Tractor Trailer: 18 shifts ($9,440)
Lift Truck: 4 shifts ($2,407)
RTG: 2 shifts ($1,000)

COMPARISONS
vs Last Month: +8% ($1,023 more)
vs January 2025: +12% ($1,407 more)
vs Community Average: +15% above

PENSION PROGRESS
Start of month: 32.4%
End of month: 43.1%
Progress: +10.7%

BEST DAY
January 18: $684 (Night RTG at Centennial)

HIGHLIGHTS
- 3 perfect logging weeks
- 14-day streak achieved
- Earned weekend premium 4 times

[Share Report] [Set February Goals]
```

---

### Monthly Ritual: "Goal Progress Review"

**Timing:** First week of each month.

**Content:**
```
GOAL CHECK-IN

Pension Goal: $120,000 by March 31
Current: $51,720 (43.1%)

[====================-----------]

At current pace: Goal reached November 2
Needed pace: $2,427/week
Your pace: $2,891/week

You're 19% AHEAD of pace.

Projected year-end: $137,800

[Keep Going] [Adjust Goal]
```

**Why monthly goal review matters:**
- Long-term perspective on short-term work
- Creates sense of progress even in slow months
- Allows goal adjustment based on reality
- Big-picture motivation

---

### Monthly Ritual: "Trend Analysis"

**Timing:** Available anytime, highlighted first week of month.

**Content:**
```
YOUR TRENDS

EARNING TREND (6 months)
Aug: $11,240
Sep: $12,100
Oct: $13,450
Nov: $11,890
Dec: $14,200
Jan: $12,847

Trend: Stable with holiday bump

BEST EARNING MONTHS
1. December: $14,200
2. October: $13,450
3. September: $12,100

SHIFT PATTERNS
Most worked day: Tuesday (28 shifts)
Least worked day: Sunday (4 shifts)
Peak month: December

RECOMMENDATION
December was your best month.
You worked more night shifts that month.
Consider more night shifts for higher earnings.
```

---

### Monthly Ritual: "Discrepancy Summary"

**Timing:** End of month (Pro feature).

**Content:**
```
JANUARY DISCREPANCY SUMMARY

Pay stubs uploaded: 2
Discrepancies found: 1

RESOLVED
Jan 18: $34 shortage (wrong shift code)
Status: Paid on Jan 25 stub

PENDING
None

LIFETIME RECOVERED
$247 total discrepancies found
$213 recovered
$34 pending

[Upload February Stubs] [View History]
```

**Why this matters:**
- Concrete proof of PORTPAL value
- Creates regular review habit
- Drives Pro feature usage
- "Recovered money" is powerful retention

---

### Monthly Ritual: "This Time Last Year"

**Timing:** Same day each month (for users with 12+ months history).

**Notification:**
```
This week last year: $2,340
This week this year: $2,891

You're earning 24% more than a year ago.
```

**In-app:**
```
YEAR-OVER-YEAR

JANUARY 2026 vs JANUARY 2025

Earnings: $12,847 vs $11,440 (+12%)
Shifts: 24 vs 22 (+9%)
Avg/shift: $535 vs $520 (+3%)

Your earnings have grown 12% year-over-year.

At this rate, you'll earn $154,000 this pension year
vs $138,000 last pension year.

[View Full Comparison]
```

---

### Monthly Ritual: "Best Week Celebration"

**Timing:** End of month, highlight best week.

**Notification:**
```
Best week of January: Week of Jan 13
$4,102 from 7 shifts.
You're a machine.
```

**In-app:**
```
JANUARY BEST WEEK

Week of January 13-19

$4,102 earned
7 shifts worked
52 regular + 8 OT hours

This was your highest-earning week since October 2025.

What made it great:
- 2 night shifts ($1,314)
- 1 Saturday premium ($612)
- 8 hours overtime ($842)

[Share Achievement] [Set New Goal]
```

---

## Part 5: Trigger Mapping

### External Triggers to App Opens

| External Event | User Mindset | App Hook |
|---------------|--------------|----------|
| Got dispatched for tomorrow | "What job? What will I make?" | "What's My Number" calculator |
| End of shift | "Need to log this" | Shift logging + callback |
| Saw coworker at hall | "Did they get more shifts?" | Community stats comparison |
| Pay day | "Is this right?" | Pay verification |
| End of week | "How'd I do?" | Weekly summary |
| Union meeting | "What are the rates now?" | Rate info + tips |
| Thinking about vacation | "Can I afford to take time off?" | What-if planner |
| New year/pension year | "Where do I stand?" | Pension progress |
| Heard about pay error | "Am I getting shorted?" | Discrepancy detection |
| Tax time | "What did I earn?" | Year summary + export |

---

### Internal Triggers (Emotional)

| Feeling | User Thought | App Response |
|---------|--------------|--------------|
| Anxiety | "Will I hit my pension goal?" | Progress bar, pace indicator |
| Curiosity | "What do others make?" | Community stats, rate tips |
| Pride | "I worked hard this week" | Weekly summary celebration |
| Frustration | "They shorted me again" | Discrepancy tracking |
| Boredom | "Nothing to do" | Daily tip, poll, planning |
| Anticipation | "What will I make tomorrow?" | Calculator, forecasts |
| Accomplishment | "I logged everything" | Streak badge, achievements |
| Worry | "Am I falling behind?" | Trend analysis, recommendations |

---

### Trigger-to-Feature Map

```
DISPATCHED        ->  "What's My Number" Calculator
                      Quick rate lookup
                      Log upcoming shift

END OF SHIFT      ->  Callback (repeat yesterday)
                      Templates
                      Quick log

PAY DAY           ->  Pay stub upload
                      Comparison view
                      Discrepancy flag

SUNDAY EVENING    ->  Weekly summary
                      Plan next week
                      Set weekly goal

MONTH END         ->  Monthly report
                      Trend analysis
                      Goal review

SLOW DAY          ->  Rate tips
                      Community poll
                      Achievements check

WORRIED ABOUT $   ->  Pension progress
                      What-if planner
                      Trend forecast
```

---

## Part 6: Habit Loop Design

### The Classic Habit Loop (Cue -> Routine -> Reward)

#### PORTPAL Primary Habit Loop

**CUE:** End of work day (external) + "I should log this" (internal)

**ROUTINE:** Open PORTPAL, tap Callback/Template, confirm shift

**REWARD:**
- Immediate: See calculated pay (variable amount = exciting)
- Progress: Pension bar moves
- Social: Streak continues
- Emotional: "I'm on top of my finances"

---

### Building the Daily Habit

#### Phase 1: Establish the Trigger (Days 1-14)

**Goal:** Create automatic association: "End of shift = PORTPAL"

**Tactics:**
- Push notification at end of likely shift time
- "Did you work today?" prompt
- Celebrate first 5 shifts heavily
- Streak starts after first shift

**Key insight:** The trigger must be reliable. End-of-shift is the most consistent external cue.

---

#### Phase 2: Simplify the Routine (Days 7-30)

**Goal:** Make logging effortless (< 10 seconds)

**Tactics:**
- Callback feature: one tap to repeat yesterday
- Templates: pre-saved common shifts
- Smart defaults: pre-fill based on patterns
- Widget: log from home screen

**Key insight:** Friction kills habits. Every tap is a potential abandonment point.

---

#### Phase 3: Amplify the Reward (Days 14-60)

**Goal:** Make the reward satisfying enough to reinforce the behavior

**Tactics:**
- Show calculated pay immediately (variable reward)
- Progress bar animation on pension
- Streak celebration
- Weekly achievement badges
- "You're ahead of pace" messages

**Key insight:** Variable rewards are more engaging than fixed rewards. Showing different pay amounts for different shifts creates slot-machine-like anticipation.

---

#### Phase 4: Expand the Habit (Days 30+)

**Goal:** Transform single-behavior habit into multi-feature engagement

**Tactics:**
- After logging, suggest "View your week so far"
- Morning briefing creates second daily touchpoint
- Weekly summary creates planned return behavior
- Goal tracking creates checking behavior

**Key insight:** Once core habit is established, expand to adjacent behaviors.

---

### Variable Rewards System

**Variable Reward of the Tribe (Social)**
- Community stats change daily
- Ranking shifts ("You're in top 30%")
- Coworker comparisons (anonymized)
- "X people logged today" changes

**Variable Reward of the Hunt (Resources)**
- Pay calculation varies by shift
- Pension progress varies
- Found discrepancies (unexpected money)
- Rate tips reveal new information

**Variable Reward of the Self (Mastery)**
- Streaks grow with each day
- Badges unlock unpredictably
- Progress milestones hit
- "Personal best" achievements

---

### Habit Loop Visualization

```
                    CUE
                     |
                     v
    +---------------------------------+
    |        END OF SHIFT             |
    |   (notification + internal)     |
    +---------------------------------+
                     |
                     v
                 ROUTINE
                     |
                     v
    +---------------------------------+
    |        OPEN PORTPAL             |
    |        TAP CALLBACK             |
    |        CONFIRM SHIFT            |
    |        (< 10 seconds)           |
    +---------------------------------+
                     |
                     v
                  REWARD
                     |
                     v
    +---------------------------------+
    |   IMMEDIATE: See pay ($XXX)     |
    |   PROGRESS: Bar moves           |
    |   STREAK: Day X continues       |
    |   SOCIAL: "X logged today"      |
    +---------------------------------+
                     |
                     v
              INVESTMENT
                     |
                     v
    +---------------------------------+
    |   Data stored (can't leave)     |
    |   Streak at risk (must return)  |
    |   Goals set (must track)        |
    +---------------------------------+
```

---

## Part 7: Content Strategy for Engagement

### Content Pillar 1: Daily Rate Education

**Format:** Short, shareable tips about longshore pay

**Frequency:** Daily (365 unique tips in rotation)

**Categories:**
- Base rate facts
- Differential breakdowns
- Shift comparisons
- Terminal-specific info
- Historical rate changes
- Pension and benefits info

**Example content calendar:**

| Day | Category | Tip |
|-----|----------|-----|
| Mon | Differential | "Class 1 jobs (HD Mechanic, Electrician) add $2.50/hr to your base rate." |
| Tue | Shift Compare | "Night shift at Vanterm pays $66.98/hr base. Day shift pays $53.17. That's a 26% difference." |
| Wed | Terminal | "Centennial TT shifts are 9 hours. Most other terminals are 8." |
| Thu | OT | "Time-and-a-half on night shift is $100.47/hr. Double time is $133.96/hr." |
| Fri | Weekend | "Saturday day shift pays $68.06/hr base - that's 28% more than weekday day." |
| Sat | Historical | "In April 2024, base rates increased 3.2%. Your hourly went up ~$1.65." |
| Sun | Pension | "The pension year runs April 1 to March 31. Plan your $120K goal accordingly." |

---

### Content Pillar 2: "Did You Know" Surprises

**Format:** Counter-intuitive or lesser-known facts

**Frequency:** Weekly (in Sunday summary or as special notification)

**Examples:**
- "Did you know? Graveyard on Saturday pays the SAME as graveyard on Sunday."
- "Did you know? Wheat terminal jobs have a unique $1.15/hr differential."
- "Did you know? If you're coded as 8 hours on a 9-hour TT Rail shift, you lose $53.82."
- "Did you know? TRAINER REGULAR earns 33.3% more than base rate (1.333x multiplier)."

---

### Content Pillar 3: Industry News and Updates

**Format:** Relevant news affecting longshoremen

**Frequency:** As needed (1-2 per month)

**Topics:**
- Contract negotiations
- Rate changes (April updates)
- Terminal news
- Port activity forecasts
- Union announcements

**In-app display:**
```
NEWS

April Rate Update Coming

New BCMEA rates take effect April 1, 2026.
We'll update PORTPAL automatically.

Expected increase: ~3%
Your new estimated hourly: $54.77 base

[Read More] [Dismiss]
```

---

### Content Pillar 4: Community Stories

**Format:** Anonymized user success stories

**Frequency:** Monthly

**Examples:**
- "A PORTPAL user found a $247 pay shortage over 6 months. The employer corrected it."
- "One user hit their $120K pension goal 6 weeks early this year."
- "A user's consistent logging helped resolve a dispute over shift hours."

**Purpose:** Social proof, aspiration, emotional connection

---

### Content Pillar 5: Rate Change Alerts

**Format:** Immediate notification when rates change

**Frequency:** When rate changes occur (typically April, sometimes mid-year)

**Alert:**
```
RATE ALERT

New BCMEA rates effective April 1, 2026

Your rates have been updated:
- Base longshoreman: $53.17 -> $54.77 (+3%)
- Night differential: 26.7% (unchanged)
- Your typical shift: +$14.40

All new shifts will calculate at new rates.

[View All New Rates]
```

---

## Part 8: Push Notification Strategy

### Notification Philosophy

**Principles:**
1. Every notification must provide value or be actionable
2. Respect user time and attention
3. Personalize based on behavior
4. Allow granular control
5. Test and optimize timing

**Frequency limits:**
- Maximum 1 notification per day
- Maximum 5 per week
- Never between 10pm and 7am (unless user-configured)

---

### Notification Types and Timing

#### Type 1: Shift Logging Reminder
**Purpose:** Core habit reinforcement
**Timing:** End of likely shift time (personalized based on past patterns)
**Content:** "How was today? Tap to log your shift."
**Frequency:** Daily (only on likely work days based on pattern)

---

#### Type 2: Streak Protection
**Purpose:** Prevent streak break
**Timing:** Evening (7pm) if no shift logged and streak is active
**Content:** "Don't break your 12-day streak! Did you work today?"
**Frequency:** Only when streak at risk

---

#### Type 3: Weekly Summary Ready
**Purpose:** Drive weekly engagement ritual
**Timing:** Sunday 6pm
**Content:** "Your week is in: $3,415 from 6 shifts. Tap to see your summary."
**Frequency:** Weekly (Sundays only)

---

#### Type 4: Pay Day Reminder
**Purpose:** Drive pay verification behavior
**Timing:** User-configured pay day (typically bi-weekly Friday)
**Content:** "Pay day! Your logged shifts show $3,415. Time to verify."
**Frequency:** Bi-weekly or weekly based on pay schedule

---

#### Type 5: Milestone Celebration
**Purpose:** Reward and reinforce
**Timing:** When milestone achieved
**Content:** "You hit 50% of your pension goal! Keep it up."
**Frequency:** As milestones occur (limited to prevent spam)

---

#### Type 6: Personalized Insight
**Purpose:** Show ongoing value
**Timing:** Mid-week (Wednesday afternoon)
**Content:** "You're 42% to your weekly target. 3 more shifts at your average = on pace."
**Frequency:** Weekly (Wednesdays)

---

#### Type 7: Rate/News Alert
**Purpose:** Time-sensitive information
**Timing:** When event occurs
**Content:** "New rates effective April 1. Your shifts just got 3% more valuable."
**Frequency:** As needed (rare)

---

### Notification Timing Optimization

**Default timings (adjustable):**
- Morning briefing: 7:00 AM
- End of day shift: 4:30 PM
- End of night shift: 12:30 AM (next day)
- End of graveyard: 7:00 AM
- Streak warning: 7:00 PM
- Weekly summary: Sunday 6:00 PM

**User controls:**
```
NOTIFICATION SETTINGS

Shift reminders: [ON/OFF]
Reminder time: [After shift ▼] or [Custom: ____]

Weekly summary: [ON/OFF]
Summary day: [Sunday ▼]

Streak alerts: [ON/OFF]

Pay day reminders: [ON/OFF]
Pay day: [Every other Friday ▼]

Achievements: [ON/OFF]

Rate change alerts: [ON/OFF]
```

---

### Notification A/B Tests to Run

| Test | Variant A | Variant B | Metric |
|------|-----------|-----------|--------|
| Timing | 4:30 PM | 7:00 PM | Open rate |
| Tone | "Log your shift" | "How was today?" | Tap rate |
| Emoji | No emoji | Check emoji | Tap rate |
| Personalization | Generic | "Your [Job] shift" | Tap rate |
| Urgency | Neutral | "Don't break streak!" | Action rate |
| Social proof | None | "347 logged today" | Tap rate |
| Value statement | "Log shift" | "See your $XXX" | Tap rate |

---

## Part 9: Benchmark Targets

### DAU/MAU Ratio Targets

**Industry benchmarks:**
- Social apps: 50-65%
- Utility apps: 10-20%
- Finance apps: 25-35%
- Fitness apps: 20-30%

**PORTPAL target: 30-40%**

**Rationale:** We're a utility with social/financial elements. Users don't work daily, so pure DAU is less relevant. But engaged users should open multiple times per week.

**Monthly progression:**
- Month 1-3: 20% (establishing habits)
- Month 4-6: 25% (habit solidified)
- Month 7-12: 30% (features expanding)
- Year 2+: 35-40% (full engagement)

---

### Session Frequency Targets

**Target: 4+ sessions per active user per week**

**Breakdown:**
- 2 sessions for shift logging (average 2 work days)
- 1 session for weekly summary
- 1 session for checking progress/planning

**Power users: 6+ sessions/week**
- Daily morning briefing check
- Daily shift logging
- Mid-week check
- Weekend planning
- Weekly summary
- Ad-hoc rate lookups

---

### Session Duration Targets

**Target: 45-90 seconds per session**

**Why this range:**
- Under 45 seconds: User isn't engaging deeply
- Over 90 seconds (for logging): Friction is too high
- Extended sessions (2-3 min) for reports/planning are good

**By session type:**
- Quick log (Callback): 10-15 seconds
- Full log: 30-45 seconds
- Weekly summary view: 60-90 seconds
- Monthly report: 2-3 minutes
- Rate calculator: 30-60 seconds

---

### Actions Per Session Targets

**Target: 2+ meaningful actions per session**

**Meaningful actions:**
- Log a shift
- View summary
- Check pension progress
- Use calculator
- View rate tip
- Answer poll
- Export data
- Use AI chat

**Goal: Make it easy to do "one more thing"**

After logging: "View your week so far?"
After viewing summary: "Set a goal for next week?"
After checking pension: "See your forecast?"

---

### Retention Targets

| Timeframe | Target | Notes |
|-----------|--------|-------|
| Day 1 | 70% | Return after first session |
| Day 7 | 55% | Weekly habit forming |
| Day 14 | 45% | Activation threshold |
| Day 30 | 35% | Monthly habit formed |
| Day 60 | 30% | Sticky user |
| Day 90 | 25% | Core retention |
| Day 180 | 22% | Long-term user |
| Day 365 | 20% | Loyal user |

**Key insight:** Retention drops are steepest in first 14 days. Focus onboarding and early engagement there.

---

### Conversion Targets

**Free to Pro conversion:**
- Target: 15-20% of activated users
- Timeline: Within 90 days of activation
- Key trigger: Use of Pro feature (Callback, AI chat, stub upload)

**Trial to Paid conversion:**
- Target: 60-70% of trial starters
- Timeline: During 14-day trial

**Pro retention (annual):**
- Target: 70% annual renewal
- Key driver: Discrepancy detection value

---

## Part 10: A/B Tests to Run

### Priority 1: Notification Timing

**Hypothesis:** Notification timing significantly affects open rates.

**Test structure:**
- Control: 7:00 PM daily reminder
- Variant A: 4:30 PM (end of day shift)
- Variant B: 9:00 PM (evening)
- Variant C: Personalized (based on typical shift end)

**Success metric:** Notification tap rate, shifts logged within 1 hour

**Sample size:** 1,000 users per variant

**Duration:** 2 weeks

---

### Priority 2: Streak Mechanics

**Hypothesis:** Streak visibility affects logging consistency.

**Test structure:**
- Control: Streak shown only when active
- Variant A: Streak always visible (shows 0 if broken)
- Variant B: Streak with "forgiveness" (1 miss allowed)
- Variant C: No streaks shown

**Success metric:** 7-day logging consistency, DAU

**Sample size:** 1,000 users per variant

**Duration:** 4 weeks

---

### Priority 3: Daily Content Type

**Hypothesis:** Content type affects daily engagement.

**Test structure:**
- Control: Rate tip only
- Variant A: Rate tip + Community poll
- Variant B: Rate tip + "This day last year"
- Variant C: Rotating content daily

**Success metric:** DAU on non-work days, content interaction rate

**Sample size:** 500 users per variant

**Duration:** 4 weeks

---

### Priority 4: Weekly Summary Timing

**Hypothesis:** Summary timing affects engagement with the feature.

**Test structure:**
- Control: Sunday 6:00 PM
- Variant A: Sunday 8:00 AM (morning)
- Variant B: Monday 7:00 AM (start of new week)
- Variant C: Saturday 6:00 PM (before weekend)

**Success metric:** Summary view rate, time spent on summary

**Sample size:** 1,000 users per variant

**Duration:** 4 weeks

---

### Priority 5: Progress Bar Design

**Hypothesis:** Progress visualization affects motivation and app opens.

**Test structure:**
- Control: Simple progress bar
- Variant A: Progress bar with pace indicator
- Variant B: Progress bar with countdown (days remaining)
- Variant C: Progress bar with animated celebration at milestones

**Success metric:** Pension progress views per week, pension feature engagement

**Sample size:** 500 users per variant

**Duration:** 4 weeks

---

### Priority 6: Morning Briefing Content

**Hypothesis:** Morning briefing drives non-work day opens.

**Test structure:**
- Control: No morning briefing
- Variant A: Simple briefing (pension progress + weather)
- Variant B: Rich briefing (progress + tip + community)
- Variant C: Gamified briefing (daily challenge + reward)

**Success metric:** Non-work day app opens, morning session rate

**Sample size:** 500 users per variant

**Duration:** 4 weeks

---

### Priority 7: Social Proof Messaging

**Hypothesis:** Social proof increases engagement.

**Test structure:**
- Control: No social proof shown
- Variant A: "X people logged today"
- Variant B: "You're in top X% for logging"
- Variant C: "X people at your terminal"

**Success metric:** Logging frequency, feature engagement

**Sample size:** 500 users per variant

**Duration:** 3 weeks

---

### Priority 8: Reward Frequency

**Hypothesis:** More frequent small rewards increase engagement.

**Test structure:**
- Control: Rewards only at major milestones
- Variant A: Daily micro-rewards (tip viewed, login streak)
- Variant B: Weekly rewards (summary achievements)
- Variant C: Random rewards (unexpected bonuses)

**Success metric:** DAU, session frequency, feature adoption

**Sample size:** 500 users per variant

**Duration:** 4 weeks

---

## Appendix: Implementation Checklist

### Phase 1: Foundation (Week 1-4)

**Engagement Tracking:**
- [ ] Define and implement DAU/WAU/MAU tracking
- [ ] Implement session tracking with meaningful action detection
- [ ] Set up user segmentation (power/regular/casual/at-risk)
- [ ] Create engagement dashboard

**Core Daily Features:**
- [ ] Implement "Morning Briefing" widget
- [ ] Add "Daily Rate Tip" rotation (100 tips minimum)
- [ ] Enhance pension progress display with pace
- [ ] Add "What's My Number" calculator

**Notifications:**
- [ ] Implement end-of-shift notification
- [ ] Implement streak protection notification
- [ ] Add notification timing settings

---

### Phase 2: Weekly Rituals (Week 5-8)

**Weekly Features:**
- [ ] Enhance weekly summary view
- [ ] Add "Plan Your Week" feature
- [ ] Implement mid-week check-in notification
- [ ] Add pay day reminder system

**Streak System:**
- [ ] Implement streak tracking
- [ ] Add streak visualization
- [ ] Create streak achievements/badges

---

### Phase 3: Monthly and Community (Week 9-12)

**Monthly Features:**
- [ ] Create monthly report view
- [ ] Implement YoY comparison
- [ ] Add trend analysis
- [ ] Build goal review system

**Community Features:**
- [ ] Add community pulse widget
- [ ] Implement polls/questions
- [ ] Add social proof messaging
- [ ] Create anonymized comparisons

---

### Phase 4: Optimization (Week 13+)

**A/B Testing:**
- [ ] Set up A/B testing infrastructure
- [ ] Run notification timing tests
- [ ] Test streak mechanics
- [ ] Optimize content rotation

**Iteration:**
- [ ] Review engagement metrics
- [ ] Identify drop-off points
- [ ] Refine features based on data
- [ ] Expand successful variants

---

## Summary: The Non-Work Day Challenge

The core challenge is getting users to open PORTPAL when they didn't work.

**Our weapons:**

1. **Pension Progress** - The #1 reason to check, even on off days. "Am I on track?"

2. **Morning Briefing** - A daily ritual that provides value regardless of work status.

3. **Rate Education** - Daily tips create curiosity and learning habit.

4. **Community Connection** - "What are others doing?" creates social pull.

5. **Planning Features** - "Plan tomorrow" and "Plan your week" engage non-work time.

6. **Weekly Rituals** - Sunday summary and Monday planning create scheduled engagement.

7. **Variable Rewards** - Changing content, stats, and tips create return curiosity.

8. **Streak Psychology** - "Don't break it" creates daily check-in even without logging.

**The key insight:** PORTPAL isn't just about logging shifts. It's about financial awareness, progress tracking, and peace of mind. These are daily concerns, not just work-day concerns.

**Success looks like:** A user who opens the app on their day off to check their pension progress, read the daily tip, see what their coworkers are doing, and feel confident they're on track.

---

*Last Updated: February 2026*
*Focus: Non-work day engagement*
