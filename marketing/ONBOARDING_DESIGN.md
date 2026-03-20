# PORTPAL Onboarding Design
## Complete First-Time User Experience

---

## Pre-Download: The Promise That Got Them Here

### How They Found Us

**Scenario A: TikTok/Social**
They saw a video about pay discrepancies, the complexity of longshore pay, or a creator showing how easy shift logging is. The hook was accuracy and simplicity, not earnings flexing.

**Scenario B: Word of Mouth**
A coworker said: "You still using that notebook? There's an app that knows all the rates."

**Scenario C: Union Hall Buzz**
Heard about it during dispatch or break. "Some app that tells you if your pay is right."

### Expectations Set (App Store Listing)

**Title:** PORTPAL - Shift Tracker for Longshoremen

**Subtitle:** Log shifts. Check your pay. Know your numbers.

**Screenshots (in order):**
1. Clean shift logging screen - "30 seconds to log"
2. Pension progress bar - "Always know where you stand"
3. Pay breakdown - "Every differential calculated"
4. Weekly summary - "Your week at a glance"

**Description Lead:**
> "42 job types. 24 terminals. 3 shifts. Weekend premiums. Differentials. The math is complicated. PORTPAL does it for you.
>
> Built by longshoremen, for longshoremen."

**Key Promise:** Accuracy and simplicity. Not wealth or earnings.

---

## First Open: 0-60 Seconds

### Splash Screen (2 seconds)
- PORTPAL logo (anchor + clipboard icon)
- Clean, dark blue background
- No text needed

### Welcome Screen 1

**Visual:** Simple illustration of a hand logging a shift on a phone

**Headline:**
"Welcome to PORTPAL"

**Subtext:**
"The shift tracker that knows longshore pay."

**Button:** "Let's Go"

---

### Welcome Screen 2 (Value Proposition)

**Visual:** Three icons in a row

**Icon 1:** Clock
"30 seconds to log"

**Icon 2:** Calculator
"Every rate calculated"

**Icon 3:** Target/Progress bar
"Always know where you stand"

**Bottom text:**
"No spreadsheets. No guessing. No math."

**Button:** "Get Started"

---

### Permission Request (if needed)

**Only request notifications at this point. Keep it minimal.**

**Screen shows:**

**Headline:**
"Stay on track"

**Subtext:**
"Get a quick reminder at the end of each shift to log your day. Takes 30 seconds."

**Visual:** Example notification: "How was today's shift? Tap to log."

**Buttons:**
- "Enable Reminders" (primary)
- "Maybe Later" (text link, no judgment)

---

## Account Setup: 1-3 Minutes

### Design Philosophy
- Collect minimum required info
- Smart defaults reduce friction
- Skip options available for non-essential fields
- Progress indicator shows they're almost done

---

### Screen 1: Local Selection

**Progress:** 1 of 4

**Headline:**
"Which local are you with?"

**Visual:** Large, easy-to-tap buttons

**Options:**
- ILWU 500 (Vancouver)
- ILWU 502 (New Westminster)
- ILWU 514 (Port Alberni)
- Local 400 (Foremen)
- Other/Not Sure

**Why we ask (small text):**
"This helps us use the right pay rates and terminals for you."

**Button:** "Continue"

---

### Screen 2: Primary Terminal

**Progress:** 2 of 4

**Headline:**
"Where do you usually work?"

**Subtext:**
"Pick your most common terminal. You can change this anytime."

**Options (large buttons, 2-column grid):**
- Centennial
- Vanterm
- Deltaport
- Fraser Surrey
- (Other terminals based on local)

**Button:** "Continue"

**Skip option:** "I work all over" (sets no default)

---

### Screen 3: Job Classification (Optional but Encouraged)

**Progress:** 3 of 4

**Headline:**
"What do you mostly do?"

**Subtext:**
"This sets your default job. Speeds up logging."

**Search bar at top:** "Search jobs..."

**Popular jobs (quick-select buttons):**
- Tractor Trailer
- Lift Truck
- Labour
- Checker
- RTG
- First Aid

**Full list below (scrollable):**
All 42 job types

**Skip option:** "It varies - skip for now"

**Button:** "Continue"

---

### Screen 4: Ready to Roll

**Progress:** 4 of 4

**Headline:**
"You're all set."

**Visual:** Checkmark animation

**Subtext:**
"Start by logging your first shift. It takes 30 seconds."

**Button:** "Log My First Shift" (primary, large)

**Secondary:** "Explore the app first" (text link)

---

## First Shift Entry: The Critical Moment

### Design Goals
1. Dead simple - three taps minimum
2. Smart defaults reduce decisions
3. Celebrate completion
4. Show immediate value (calculated pay)

---

### Shift Entry Screen

**Header:** "Log Shift"

**Section 1: When**

**Date picker:** Today (pre-selected, tap to change)

**Shift selector (three large buttons):**
- DAY (selected by default if before 3pm)
- NIGHT
- GRAVEYARD

---

**Section 2: What & Where**

**Job field:**
- Pre-filled with default job (from setup)
- Tap to search/change
- Shows most recent jobs first

**Terminal field:**
- Pre-filled with default terminal
- Tap to change

**Subjob field (optional):**
- Shows only if applicable to selected job
- e.g., for Tractor Trailer: RAIL, SHIP, YARD, BARGE

---

**Section 3: Hours**

**Pre-filled with smart defaults based on job/shift/location**

For example, if they selected:
- Tractor Trailer + RAIL + Centennial + DAY
- Auto-fills: 9 reg / 0 OT

**Display:**
```
Regular Hours:  [  9  ]
OT Hours:       [  0  ]
```

**Small text below:**
"These are the standard hours for this job. Adjust if different."

---

**Section 4: Save**

**Large button:** "Save Shift"

**Optional: Add notes (collapsed by default)**

---

### First Shift Celebration

**Full-screen takeover (2 seconds)**

**Visual:** Confetti or simple animation

**Headline:**
"First shift logged!"

**Subtext:**
"That was easy, right?"

---

### Immediate Value Display

**Transition to shift detail screen**

**Shows:**

```
TUESDAY, FEB 4, 2026
Day Shift - Centennial

TRACTOR TRAILER - RAIL

9 hrs regular
0 hrs OT

-------------------
CALCULATED PAY
$483.42
-------------------

Rate: $53.69/hr (Class 3)
```

**Breakdown link:** "See how we calculated this"

**Breakdown expands to show:**
```
Base longshoreman rate:     $53.17
Class 3 differential:       + $0.65
Your hourly rate:           $53.82

9 hours x $53.82 = $484.38
```

**Bottom buttons:**
- "Log Another Shift"
- "Done" (goes to dashboard)

---

### First Shift Completion Modal

**Appears after they dismiss the shift detail**

**Headline:**
"One down. Here's what to do next."

**Three suggestions with icons:**

1. "Log your last few shifts"
   Small text: "Catch up so your weekly summary is complete"
   Button: "Log More"

2. "Set a reminder"
   Small text: "We'll nudge you after each shift"
   Button: "Set Up"

3. "Explore the dashboard"
   Small text: "See your earnings, progress, and more"
   Button: "Show Me"

**Dismiss:** "Maybe later" (text link)

---

## First Week Experience

### Day 1: First Shift Logged

**In-app:**
- Celebration animation
- Immediate pay calculation
- Prompt to log more shifts

**End of day notification (if enabled):**
"Nice first log! Keep the streak going tomorrow."

---

### Day 2: The Gentle Nudge

**Notification timing:** End of likely shift time (varies by shift type)

**If they worked:**
"How was today? Tap to log your shift. 30 seconds."

**If they didn't log Day 1 but opened app:**
"Ready to log? Your first shift is waiting."

---

### Day 3: Show Progress

**Notification:**
"You've logged [X] shifts this week. Tap to see your weekly summary so far."

**In-app:**
Weekly summary card appears on dashboard showing:
- Shifts logged: 2
- Estimated earnings: $947
- Progress bar toward pension goal (if they've set one)

---

### Day 4: Social Proof

**Notification:**
"412 longshoremen logged shifts yesterday. Are you tracking?"

**Purpose:** Normalize the behavior, show they're part of something

---

### Day 5: Feature Discovery

**In-app tooltip when they open:**
"Did you know? Tap any shift to see the full pay breakdown."

**Points to a logged shift with an arrow**

---

### Day 6: Weekend Prep

**Notification (Friday evening):**
"Weekend rates hit different. Don't forget to log."

**In-app banner:**
"Weekend shifts pay 28% more. Logging helps you track the difference."

---

### Day 7: First Value Milestone

**Notification:**
"Your first week with PORTPAL. Tap to see your summary."

**In-app: Full weekly summary screen**

**Visual:** Week calendar with logged shifts highlighted

**Stats displayed:**
```
THIS WEEK

Shifts Logged:      5
Regular Hours:      43
OT Hours:           2

ESTIMATED EARNINGS
$2,847.53

You're 2.4% toward your pension year goal.
```

**Celebration:**
"One week down. You're on your way."

**CTA:**
"Set a pension goal to track your progress"

---

## Activation Triggers

### What Makes Someone "Activated"?

**Definition:** A user who will stick around and eventually convert

**Activation = User who has:**
1. Logged 5+ shifts in first 14 days
2. Viewed their weekly summary at least once
3. Opened the app on 5+ different days

**Why these metrics:**
- 5 shifts = enough to see the value
- Weekly summary view = they care about the bigger picture
- 5 different days = building a habit

---

### The Magic Number: 5 Shifts

**Research-backed insight:**
Users who log 5 shifts in the first two weeks have an 78% chance of staying active at 90 days.

**Strategy:** Everything in onboarding pushes toward 5 shifts.

**Milestone celebrations:**
- Shift 1: "First one down!"
- Shift 3: "Three in a row. You're getting the hang of this."
- Shift 5: "Five shifts logged. You're officially a PORTPAL pro."

---

### When to Introduce Premium

**Not before:**
- User has logged 5+ shifts
- User has been active for 7+ days
- User has viewed weekly summary

**First premium touchpoint (Day 7+):**
Subtle. Not pushy.

**Banner on dashboard:**
"Unlock more with Pro: templates, AI chat, pay stub verification"
[Learn More]

**Second touchpoint (Day 10):**
When they tap a Pro feature (Callback, Templates, AI)

**Modal:**
"This is a Pro feature"

"Repeat yesterday's shift with one tap. Plus unlimited AI questions, pay stub verification, and more."

"Try Pro free for 30 days"
[Start Free Trial] [Not Now]

**Third touchpoint (Day 30):**
More direct prompt.

**Full-screen:**
"You've logged 8 shifts with PORTPAL."

"Ready to unlock the full experience?"

**Shows Pro benefits with checkmarks**

[Start 30-Day Free Trial]
[Stay on Free]

---

## Friction Points to Avoid

### 1. Too Many Questions Upfront

**Bad:** 12-step onboarding asking for name, email, phone, address, employee ID, union number, seniority date, etc.

**Good:** 4 screens max. Collect only what's needed for the app to work. Other info can come later.

### 2. Confusing Job/Location Selection

**Bad:** Dropdown with all 42 jobs and 24 terminals. User has to scroll and hunt.

**Good:**
- Search bar with autocomplete
- Most popular options as quick-select buttons
- Smart suggestions based on local selected
- Recent selections at top after first use

### 3. No Immediate Value

**Bad:** User logs shift, sees "Shift saved" and nothing else.

**Good:** User logs shift, immediately sees calculated pay with full breakdown. "That was $483. Here's exactly how we got that number."

### 4. Asking for Payment Too Early

**Bad:** "Start your free trial" before they've even logged a shift.

**Good:** Let them experience the free tier fully. Introduce Pro only after they're hooked (5+ shifts).

### 5. Notification Spam

**Bad:** Daily push notifications starting Day 1.

**Good:**
- Day 1-3: Light touch, one per day max
- Only notify at relevant times (end of shift)
- Let user control frequency in settings

### 6. No Skip Options

**Bad:** Forcing users to set up everything before they can log a shift.

**Good:** Skip options on non-essential setup. They can always add info later.

---

## Gamification Elements

### 1. Streaks

**Display:** Small flame icon with number on dashboard

**Logic:**
- Log at least one shift per work day = streak continues
- Miss a work day (based on their typical pattern) = streak resets

**Messaging:**
- "3-day streak! Keep it going."
- "Streak lost. Start fresh today."

**Visual:** Progress bar that fills up with consecutive days

**Milestone rewards:**
- 7-day streak: "One week strong" badge
- 30-day streak: "Month of consistency" badge
- 90-day streak: "Quarterly champion" badge

---

### 2. Progress Bars

**Primary: Pension Year Progress**

**Display:** Large, prominent progress bar on dashboard

```
PENSION YEAR PROGRESS
[===========----------------] 34%
$40,800 of $120,000 goal

On track for: October 15
```

**Color coding:**
- Green: Ahead of pace
- Yellow: On pace
- Orange: Behind pace
- Red: Significantly behind

**Weekly: Shift Logging**

```
THIS WEEK
[============================] 5/5 shifts logged
Complete!
```

---

### 3. Achievements/Badges

**Displayed in profile section**

**Logging achievements:**
- First Shift: Log your first shift
- Week One: Log 5 shifts in your first week
- Month Strong: Log 20+ shifts in a month
- Century Club: Log 100 shifts total
- Year In Review: Complete a full pension year

**Consistency achievements:**
- Streak Starter: 7-day streak
- Streak Master: 30-day streak
- Streak Legend: 90-day streak
- Daily Driver: Log every work day for a month

**Discovery achievements:**
- Rate Explorer: View pay breakdown
- History Buff: View year-over-year comparison
- Early Adopter: Join in first 90 days (Founding Member badge)

**Visual style:**
- Clean, simple icons
- Color fills in when earned
- Grayed out when locked
- No childish or cartoon style - keep it professional

---

### 4. Social Proof

**Dashboard widget (rotates daily):**

**Variations:**

"347 longshoremen logged shifts today"

"PORTPAL users logged 1,247 shifts this week"

"You're one of 892 active trackers at Vanterm"

"420 shifts logged at your terminal this month"

**Purpose:**
- Normalize the behavior
- Show they're part of a community
- Subtle FOMO if they haven't logged

**Note:** Use real numbers when available. When starting out, can use ranges or omit this feature until critical mass.

---

### 5. Weekly Recap Email

**Sent:** Sunday evening or Monday morning

**Subject line options:**
- "Your week: 5 shifts, $2,847"
- "Week 4 in the books"
- "Here's what you logged last week"

**Content:**
```
Hey [First Name],

LAST WEEK AT A GLANCE

Shifts logged: 5
Estimated earnings: $2,847
Hours: 43 reg + 2 OT

PENSION YEAR PROGRESS
[Progress bar] 34% - On track for October

See you next week.

- The PORTPAL Team
```

**CTA:** "View Full Summary" (opens app)

---

## Notification Strategy: Full Breakdown

### Types of Notifications

**1. Shift Reminder (Daily)**
- Timing: End of typical shift time (varies by user)
- Frequency: Once per day, only on work days
- Content: "How was today? Tap to log."

**2. Streak Reminder (Prevention)**
- Timing: Evening if no shift logged that day
- Frequency: Only when streak is at risk
- Content: "Don't break your 7-day streak. Did you work today?"

**3. Weekly Summary (Weekly)**
- Timing: Sunday evening or Monday morning
- Content: "Your week is in. Tap to see your summary."

**4. Milestone Celebrations (As earned)**
- Content: "5 shifts logged! You're a PORTPAL pro."
- Content: "You hit 50% of your pension goal!"

**5. Social Proof (Weekly, optional)**
- Content: "423 longshoremen logged shifts yesterday"
- Timing: Mid-week, once per week max

### User Controls

**Settings screen options:**
- Shift reminders: On/Off
- Reminder time: [Dropdown: After day shift / After night shift / After graveyard / Custom]
- Weekly summary: On/Off
- Milestone notifications: On/Off
- Marketing notifications: On/Off (required by app stores)

---

## Copy Snippets for Key Screens

### Empty State: Dashboard (No Shifts Yet)

**Headline:** "No shifts logged yet"

**Subtext:** "Log your first shift to see your earnings, progress, and more."

**Button:** "Log Your First Shift"

---

### Empty State: Weekly Summary (No Shifts This Week)

**Headline:** "Nothing logged this week"

**Subtext:** "Week of Jan 27 - Feb 2"

"Did you work? Log your shifts to see your weekly summary."

**Button:** "Log Shifts"

---

### Error State: Rate Not Found

**Headline:** "We couldn't calculate this rate"

**Subtext:** "This job/location/shift combo isn't in our database yet. We've logged it for review."

**Input field:** "What did you actually earn? (optional)"

**Button:** "Save Anyway"

**Small text:** "We'll update the rates and notify you when it's fixed."

---

### Upgrade Prompt (Post-Trial)

**Headline:** "Your Pro trial has ended"

**Subtext:** "You logged 12 shifts during your trial. Keep the full experience for $99/year."

**What you'll keep with Free:**
- Shift logging
- Pay calculation
- Weekly summaries
- Pension progress

**What you'll lose:**
- Callback feature
- Templates
- Unlimited AI chat
- Pay stub verification

**Buttons:**
[Upgrade to Pro - $99/year]
[Continue with Free]

---

### First Pension Goal Setup

**Headline:** "Set your pension goal"

**Subtext:** "Track your progress toward your annual target."

**Input:** "What's your goal for this pension year?"

**Pre-filled suggestion:** $120,000 (based on typical goals)

**Slider option:** Adjust between $80,000 - $180,000

**Info text:** "Most longshoremen aim for $110,000-$130,000 to qualify for full benefits."

**Button:** "Set Goal"

**Skip:** "I'll set this later"

---

## Technical Notes for Implementation

### Analytics Events to Track

**Onboarding funnel:**
1. app_opened
2. welcome_screen_viewed
3. local_selected
4. terminal_selected
5. job_selected (or skipped)
6. onboarding_completed
7. first_shift_started
8. first_shift_completed
9. pay_breakdown_viewed

**Activation events:**
1. shift_logged (with count)
2. weekly_summary_viewed
3. pension_goal_set
4. streak_achieved (with length)
5. pro_feature_tapped
6. trial_started
7. subscription_purchased

**Retention events:**
1. app_opened (daily)
2. shift_logged (daily)
3. notification_tapped
4. summary_viewed

### A/B Test Opportunities

1. **Onboarding length:** 4 screens vs 3 screens
2. **First CTA:** "Log Your First Shift" vs "Get Started"
3. **Notification timing:** End of shift vs evening
4. **Social proof:** Show user count vs hide it
5. **Pro conversion prompt timing:** Day 14 vs Day 21 (during 30-day trial)
6. **Streak visibility:** Always show vs only show when active

---

## Success Metrics

### Onboarding Completion
- Target: 80% complete onboarding (reach shift entry screen)
- Measure: Drop-off at each step

### First Shift Logged
- Target: 70% of completed onboardings log first shift within 24 hours
- Measure: Time from onboarding complete to first shift

### Activation Rate
- Target: 50% of users hit activation criteria (5 shifts, 5 days, summary view) within 14 days
- Measure: Cohort analysis by signup date

### Day 7 Retention
- Target: 60% of users who logged first shift open app on Day 7
- Measure: DAU tracking

### Day 30 Retention
- Target: 40% of activated users still active at Day 30
- Measure: Monthly active users by cohort

### Free to Pro Conversion
- Target: 40% of activated users convert to Pro within 90 days
- Measure: Subscription funnel by user segment

---

## Summary: The Onboarding Journey

| Stage | Duration | Goal | Key Metric |
|-------|----------|------|------------|
| Pre-Download | - | Set right expectations | Download rate from app store |
| First Open | 60 seconds | Understand value prop | Completion rate |
| Account Setup | 1-3 minutes | Minimal friction | Setup completion |
| First Shift | 30 seconds | Immediate value | First shift logged |
| Day 1-7 | 1 week | Build habit | 5+ shifts logged |
| Week 2-4 | 3 weeks | Deepen engagement | Weekly summary views |
| Month 2+ | Ongoing | Convert to Pro | Trial starts, conversions |

---

*The goal is simple: get them to log 5 shifts. Everything else follows from there.*

*Last updated: February 2026*
