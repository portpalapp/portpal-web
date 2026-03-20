# PORTPAL Push Notification and In-App Messaging Strategy

## Executive Summary

This document outlines the complete notification strategy for PORTPAL, designed specifically for BC port workers with irregular schedules. The strategy prioritizes utility over frequency, respects shift work patterns, and aims to enhance rather than interrupt the user experience.

---

## 1. PUSH NOTIFICATION TYPES

### 1.1 Transactional Notifications (Always Sent)

These are critical notifications that users expect and need.

#### Shift Reminder
**Purpose:** Remind users to log their shift before they forget details
**Trigger:** 2 hours after expected shift end (based on dispatch time + shift duration)

| Element | Content |
|---------|---------|
| **Title** | Just finish your shift? |
| **Body** | Log it now while the details are fresh. Takes 30 seconds. |
| **Deep Link** | `portpal://add-shift` |
| **Icon** | Clipboard with checkmark |

**Variant for Night Shift:**
| Element | Content |
|---------|---------|
| **Title** | Night shift done? |
| **Body** | Quick log before you crash. Your future self will thank you. |
| **Deep Link** | `portpal://add-shift` |

**Variant for Graveyard Shift:**
| Element | Content |
|---------|---------|
| **Title** | Graveyard shift complete |
| **Body** | Log your hours before sleep takes over. 30 seconds max. |
| **Deep Link** | `portpal://add-shift` |

---

#### Weekly Summary Ready
**Purpose:** Inform users their weekly earnings summary is available
**Trigger:** Monday at 10:00 AM (after weekend shifts typically complete)

| Element | Content |
|---------|---------|
| **Title** | Your week in review |
| **Body** | You logged X shifts for $X,XXX. See the breakdown. |
| **Deep Link** | `portpal://weekly-summary` |

**Variant (Great Week):**
| Element | Content |
|---------|---------|
| **Title** | Strong week! |
| **Body** | X shifts, $X,XXX earned. That's XX% above your average. |
| **Deep Link** | `portpal://weekly-summary` |

**Variant (Light Week):**
| Element | Content |
|---------|---------|
| **Title** | Week summary ready |
| **Body** | X shifts logged. Tap to see your earnings breakdown. |
| **Deep Link** | `portpal://weekly-summary` |

---

#### Pay Period Closing
**Purpose:** Urgent reminder that pay period is ending, check for missing shifts
**Trigger:** 48 hours before pay period cutoff

| Element | Content |
|---------|---------|
| **Title** | Pay period closes in 48h |
| **Body** | Missing any shifts? Last chance to log before cutoff. |
| **Deep Link** | `portpal://shifts?period=current` |

**Variant (24 hours):**
| Element | Content |
|---------|---------|
| **Title** | Final day to log shifts |
| **Body** | Pay period closes tomorrow. Review your logged shifts now. |
| **Deep Link** | `portpal://shifts?period=current` |

---

#### Pay Stub Verification Alert (Premium)
**Purpose:** Alert user when their logged data differs from expected pay
**Trigger:** When pay stub date arrives and discrepancy detected

| Element | Content |
|---------|---------|
| **Title** | Check your pay stub |
| **Body** | Your logged hours show $XXX more than expected. Verify today. |
| **Deep Link** | `portpal://pay-verification` |

---

### 1.2 Engagement Notifications (Frequency Capped)

These notifications drive engagement but are subject to frequency limits.

#### Streak Reminder
**Purpose:** Encourage continued logging to maintain streak
**Trigger:** If user hasn't logged a shift in 48 hours AND has active streak >= 3

| Element | Content |
|---------|---------|
| **Title** | X-shift streak at risk |
| **Body** | No shift logged in 2 days. Working today? Keep the streak alive. |
| **Deep Link** | `portpal://add-shift` |

**Variant (Long Streak):**
| Element | Content |
|---------|---------|
| **Title** | Don't break your XX-shift streak! |
| **Body** | You've been consistent. Log today's shift to keep it going. |
| **Deep Link** | `portpal://add-shift` |

---

#### Feature Discovery
**Purpose:** Introduce users to features they haven't tried
**Trigger:** User has logged 5+ shifts but hasn't used feature X

**Export Feature:**
| Element | Content |
|---------|---------|
| **Title** | Export your shift data |
| **Body** | Tax time? Export your earnings history as a spreadsheet. |
| **Deep Link** | `portpal://export` |

**Trends Feature:**
| Element | Content |
|---------|---------|
| **Title** | See your earning patterns |
| **Body** | Find out which jobs and terminals pay you best. |
| **Deep Link** | `portpal://trends` |

**Goals Feature:**
| Element | Content |
|---------|---------|
| **Title** | Set an earnings goal |
| **Body** | Track progress toward your monthly target. Try it free. |
| **Deep Link** | `portpal://goals` |

---

#### Achievement Unlocked
**Purpose:** Celebrate milestones and encourage continued use
**Trigger:** Immediately upon achievement completion

**First Shift:**
| Element | Content |
|---------|---------|
| **Title** | First shift logged! |
| **Body** | You're on your way to tracking every dollar you earn. |
| **Deep Link** | `portpal://achievements` |

**10 Shifts:**
| Element | Content |
|---------|---------|
| **Title** | Achievement: 10 shifts logged |
| **Body** | You've tracked $X,XXX so far. Keep the momentum going. |
| **Deep Link** | `portpal://achievements` |

**First Month Complete:**
| Element | Content |
|---------|---------|
| **Title** | One month with PORTPAL |
| **Body** | XX shifts, $XX,XXX tracked. Your pay history is building. |
| **Deep Link** | `portpal://achievements` |

**100 Shifts:**
| Element | Content |
|---------|---------|
| **Title** | Century Club! |
| **Body** | 100 shifts logged. You're a PORTPAL power user now. |
| **Deep Link** | `portpal://achievements` |

**Pay Discrepancy Found (Premium):**
| Element | Content |
|---------|---------|
| **Title** | Money saver! |
| **Body** | PORTPAL helped you catch $XXX in pay discrepancies this year. |
| **Deep Link** | `portpal://achievements` |

---

### 1.3 Marketing Notifications (Strictly Limited)

These notifications promote premium features or referrals. Maximum 2 per month.

#### Premium Upgrade Prompt
**Purpose:** Convert free users to premium
**Trigger:** After user has logged 10+ shifts AND viewed trends 3+ times

| Element | Content |
|---------|---------|
| **Title** | Ready for pay verification? |
| **Body** | Premium catches pay errors automatically. Try free for 7 days. |
| **Deep Link** | `portpal://premium?source=push` |

**Variant (Tax Season - January/February):**
| Element | Content |
|---------|---------|
| **Title** | Tax season is here |
| **Body** | Premium includes detailed export for CRA. 20% off this week. |
| **Deep Link** | `portpal://premium?source=tax-push` |

**Variant (After Pay Discrepancy):**
| Element | Content |
|---------|---------|
| **Title** | Never miss pay errors again |
| **Body** | Auto-verify every pay stub with Premium. Worth it? |
| **Deep Link** | `portpal://premium?source=discrepancy-push` |

---

#### Referral Reminder
**Purpose:** Encourage word-of-mouth growth
**Trigger:** User has logged 20+ shifts AND NPS score >= 8 (or high engagement)

| Element | Content |
|---------|---------|
| **Title** | Know other longshoremen? |
| **Body** | Share PORTPAL, get 1 month Premium free for each signup. |
| **Deep Link** | `portpal://referral` |

**Variant:**
| Element | Content |
|---------|---------|
| **Title** | Your coworkers need this |
| **Body** | Share your referral link. You both get Premium free. |
| **Deep Link** | `portpal://referral` |

---

#### New Feature Announcement
**Purpose:** Announce major new features
**Trigger:** Feature launch (manual, maximum 1 per quarter)

| Element | Content |
|---------|---------|
| **Title** | New: Annual tax summary |
| **Body** | Your 2025 earnings organized for CRA. Check it out. |
| **Deep Link** | `portpal://tax-summary` |

**Variant:**
| Element | Content |
|---------|---------|
| **Title** | Now available: Shift predictions |
| **Body** | See which jobs are paying best this month. |
| **Deep Link** | `portpal://predictions` |

---

## 2. TIMING STRATEGY

### 2.1 Optimal Send Times for Longshoremen

Understanding port worker schedules is critical. Shifts typically run:
- **Day Shift:** 07:00 - 15:30 (or 08:00 - 16:30)
- **Night Shift:** 15:30 - 24:00 (or 16:30 - 01:00)
- **Graveyard:** 23:00 - 07:00 (or 00:00 - 08:00)

**Best notification windows:**

| User's Last Shift | Best Send Time | Rationale |
|-------------------|----------------|-----------|
| Day | 16:00 - 18:00 | Just finished, still alert |
| Night | 01:00 - 02:00 OR 10:00 - 12:00 | Just finished OR next morning |
| Graveyard | 10:00 - 14:00 | After sleep, before next shift |
| Unknown | 11:00 - 13:00 | Lunch time, most people available |

### 2.2 Timezone Handling

- Store user timezone on device setup
- All scheduled notifications sent in user's local time
- BC workers primarily in Pacific Time (PT)
- Handle DST transitions gracefully (no duplicate notifications)

### 2.3 Frequency Caps

**Global Caps:**
| Notification Category | Maximum Frequency |
|-----------------------|-------------------|
| Transactional | No limit (essential) |
| Engagement | 3 per week maximum |
| Marketing | 2 per month maximum |
| All combined | 1 per day maximum (except transactional) |

**Per-User Adaptive Caps:**
- If user opens < 20% of notifications, reduce frequency by 50%
- If user opens > 60% of notifications, allow maximum frequency
- Track open rates over 30-day rolling window

### 2.4 Quiet Hours

**Default Quiet Hours:**
- 22:00 - 08:00 (10 PM - 8 AM)

**Shift-Aware Quiet Hours:**
- If user regularly works nights, shift quiet hours to 08:00 - 16:00
- If user regularly works graveyard, shift quiet hours to 08:00 - 18:00
- Learn from user's logged shift patterns over 2-week window

**Quiet Hour Exceptions:**
- Transactional notifications about immediate deadlines (pay period closing in < 24h)
- Never wake users for marketing notifications

---

## 3. PERSONALIZATION

### 3.1 Based on Shift Patterns

**Regular Day Workers:**
- Send reminders at 17:00
- Weekly summary Monday morning
- Assume standard sleep schedule

**Regular Night Workers:**
- Send reminders at 01:00 or 11:00 (user preference)
- Weekly summary Monday afternoon
- Adjust all timing +8 hours

**Rotating Schedule:**
- Predict next shift type from pattern
- Send post-shift reminder based on predicted end time
- Offer "I'm working today" manual trigger

**Irregular/Casual:**
- Default to 11:00 send time
- More reliant on manual triggers
- Prompt to set preferences

### 3.2 Based on Engagement Level

**Power Users (daily opens):**
- Full notification frequency
- Early access to new features
- More detailed achievement notifications

**Regular Users (weekly opens):**
- Standard notification frequency
- Focus on utility notifications
- Occasional engagement notifications

**Lapsed Users (no opens in 2 weeks):**
- Reduce frequency to weekly maximum
- Focus on value reminders ("You've logged $X,XXX this year")
- Gentle re-engagement campaign

**Dormant Users (no opens in 30+ days):**
- Single monthly "We miss you" notification
- Then silent until user returns

### 3.3 Based on Premium Status

**Free Users:**
- Standard transactional notifications
- Limited engagement notifications
- Occasional upgrade prompts (2/month max)

**Premium Users:**
- All transactional notifications
- Pay verification alerts
- No upgrade prompts
- Referral prompts instead
- Priority support notifications

**Trial Users:**
- Onboarding-focused notifications
- Feature discovery prioritized
- Trial ending reminders (7 days, 3 days, 1 day)

---

## 4. NOTIFICATION COPY LIBRARY

### 4.1 Complete Copy Examples by Type

#### Shift Reminders (Transactional)

| Scenario | Title | Body | Deep Link |
|----------|-------|------|-----------|
| Generic post-shift | Just finish your shift? | Log it now while the details are fresh. Takes 30 seconds. | `portpal://add-shift` |
| Day shift | Day shift wrapped? | Tap to log your hours before you forget the details. | `portpal://add-shift` |
| Night shift | Night shift done? | Quick log before you crash. Your future self will thank you. | `portpal://add-shift` |
| Graveyard | Graveyard complete | Log your hours before sleep takes over. 30 seconds max. | `portpal://add-shift` |
| Overtime detected | Long shift today? | Don't forget to log your OT hours. Every minute counts. | `portpal://add-shift?overtime=true` |
| Weekend shift | Weekend shift done | Premium rates deserve premium tracking. Log it now. | `portpal://add-shift` |

#### Weekly Summaries (Transactional)

| Scenario | Title | Body | Deep Link |
|----------|-------|------|-----------|
| Standard | Your week in review | X shifts for $X,XXX. See the full breakdown inside. | `portpal://weekly-summary` |
| Above average | Strong week! | $X,XXX earned - that's XX% above your average. | `portpal://weekly-summary` |
| Below average | Week summary ready | X shifts logged. Tap to see your earnings breakdown. | `portpal://weekly-summary` |
| Record week | Your best week yet! | $X,XXX - a new personal record. Celebrate inside. | `portpal://weekly-summary` |
| No shifts | No shifts logged | Slow week? That's okay. We'll be here when work picks up. | `portpal://weekly-summary` |

#### Pay Period (Transactional)

| Scenario | Title | Body | Deep Link |
|----------|-------|------|-----------|
| 48 hours | Pay period closes in 48h | Missing any shifts? Last chance to log before cutoff. | `portpal://shifts?period=current` |
| 24 hours | Final day to log shifts | Pay period closes tomorrow. Review your logged shifts now. | `portpal://shifts?period=current` |
| Closed | Pay period closed | XX shifts logged for $XX,XXX. Pay stub coming soon. | `portpal://shifts?period=previous` |
| Missing shifts | Possible missing shifts | We expected X shifts but you logged Y. Quick review? | `portpal://shifts?period=current&review=true` |

#### Streaks (Engagement)

| Scenario | Title | Body | Deep Link |
|----------|-------|------|-----------|
| At risk (short) | X-shift streak at risk | No shift in 2 days. Working today? Keep it alive. | `portpal://add-shift` |
| At risk (long) | Don't break your XX-shift streak! | You've been consistent. Log today's shift to continue. | `portpal://add-shift` |
| Broken | Streak ended at X shifts | No worries - start a new streak with your next shift. | `portpal://add-shift` |
| New record | New streak record: X shifts! | You've never been this consistent. Keep it going! | `portpal://streaks` |

#### Achievements (Engagement)

| Achievement | Title | Body | Deep Link |
|-------------|-------|------|-----------|
| First shift | First shift logged! | You're on your way to tracking every dollar you earn. | `portpal://achievements` |
| 5 shifts | Getting the hang of it | 5 shifts tracked. Your earnings history is taking shape. | `portpal://achievements` |
| 10 shifts | Double digits! | 10 shifts logged. You've tracked $X,XXX so far. | `portpal://achievements` |
| 25 shifts | Quarter century | 25 shifts in the books. Your data is becoming valuable. | `portpal://achievements` |
| 50 shifts | Halfway to 100 | 50 shifts logged. You're a dedicated tracker now. | `portpal://achievements` |
| 100 shifts | Century Club! | 100 shifts tracked. You're officially a power user. | `portpal://achievements` |
| First month | One month with PORTPAL | XX shifts, $XX,XXX tracked. Your pay history is building. | `portpal://achievements` |
| First discrepancy | Money saver! | You caught a $XXX pay error. PORTPAL just paid for itself. | `portpal://achievements` |
| Year complete | Full year tracked! | $XXX,XXX logged in 2025. Tax time will be easy this year. | `portpal://achievements` |

#### Feature Discovery (Engagement)

| Feature | Title | Body | Deep Link |
|---------|-------|------|-----------|
| Export | Export your shift data | Tax time? Get your earnings history as a spreadsheet. | `portpal://export` |
| Trends | See your earning patterns | Find out which jobs and terminals pay you best. | `portpal://trends` |
| Goals | Set an earnings goal | Track progress toward your monthly target. | `portpal://goals` |
| Compare | Compare your rates | See how your pay compares to other logged shifts. | `portpal://compare` |
| Notes | Add shift notes | Track details like equipment issues or special assignments. | `portpal://add-shift?focus=notes` |

#### Premium Prompts (Marketing)

| Scenario | Title | Body | Deep Link |
|----------|-------|------|-----------|
| Standard | Ready for pay verification? | Premium catches pay errors automatically. Try 7 days free. | `portpal://premium` |
| Tax season | Tax season is here | Premium includes detailed export for CRA. 20% off now. | `portpal://premium?promo=tax20` |
| Post-discrepancy | Never miss pay errors again | Auto-verify every pay stub with Premium. Worth it? | `portpal://premium?source=discrepancy` |
| After 10 shifts | You're ready for Premium | With XX shifts logged, pay verification can save you money. | `portpal://premium` |
| Trial ending | Trial ends in 3 days | Keep pay verification? Lock in your Premium benefits. | `portpal://premium?source=trial` |

#### Referral (Marketing)

| Scenario | Title | Body | Deep Link |
|----------|-------|------|-----------|
| Standard | Know other longshoremen? | Share PORTPAL, get 1 month Premium free per signup. | `portpal://referral` |
| After achievement | Share your success | You've tracked $XX,XXX. Help your coworkers do the same. | `portpal://referral` |
| Premium user | Your coworkers need this | Share your referral link. You both get Premium free. | `portpal://referral` |

---

## 5. IN-APP MESSAGES

### 5.1 Welcome Messages

**First Open (Day 1):**
```
Welcome to PORTPAL!

Track your shifts. Know your pay. Catch errors.

Let's log your first shift and see how easy it is.

[Log First Shift] [Show Me Around]
```

**Return Visit (Day 2-3, no shifts logged):**
```
Ready to start tracking?

Your dispatch board and pay stubs have the data.
We'll help you make sense of it.

[Log a Shift] [Maybe Later]
```

**After First Shift:**
```
Nice work!

You just logged your first shift.
Keep going and we'll show you patterns in your pay.

[Log Another] [Explore App]
```

### 5.2 Feature Tooltips

**First Visit to Trends:**
```
Trends shows you patterns

After 5+ shifts, you'll see:
- Your highest-paying jobs
- Best terminals for your skills
- Earnings by day of week

[Got It]
```

**First Visit to Goals:**
```
Set monthly targets

Track progress toward your earnings goals.
We'll keep you motivated along the way.

[Set a Goal] [Skip for Now]
```

**First Visit to Export:**
```
Export your data

Download your shift history as:
- CSV spreadsheet
- PDF summary
- Tax-ready report (Premium)

[Export Now] [Learn More]
```

### 5.3 Upgrade Prompts (Contextual)

**After Viewing 3 Trends:**
```
Want automatic pay verification?

Premium members get alerted when their
logged hours don't match their pay stub.

Average savings: $87/year

[Try Premium Free] [Not Now]
```

**When Trying Premium Feature:**
```
This is a Premium feature

Pay verification catches errors automatically.
Try it free for 7 days.

[Start Free Trial] [Maybe Later]
```

**During Export (Tax Season):**
```
Need a CRA-ready export?

Premium includes detailed tax reports
with all the information your accountant needs.

[Upgrade for Tax Report] [Basic Export]
```

### 5.4 Achievement Celebrations

**Full-Screen Celebration (Major Milestones):**
```
[Confetti Animation]

CENTURY CLUB!

100 shifts logged
$XX,XXX tracked

You're in the top 5% of PORTPAL users.

[Share Achievement] [Continue]
```

**Toast Notification (Minor Achievements):**
```
[Small badge icon] 10 shifts logged! Keep it up.
```

### 5.5 Re-engagement Messages

**Returning After 2 Weeks:**
```
Welcome back!

You've been away for a while.
Want to catch up on your shifts?

[Log Shifts] [Just Browsing]
```

**Returning After 1 Month:**
```
We saved your data

All XX of your previous shifts are still here.
Ready to pick up where you left off?

[Continue Tracking] [Start Fresh]
```

---

## 6. PERMISSION STRATEGY

### 6.1 When to Ask for Notification Permission

**Optimal Timing:**
1. NOT on first app open
2. After user has logged their first shift (shown value)
3. Use a pre-permission prompt first

**Pre-Permission Prompt (In-App):**
```
Never miss your pay

Get reminders to log shifts and alerts
when your weekly summary is ready.

Want shift reminders?

[Yes, Notify Me] [Not Right Now]
```

**If "Yes":** Trigger system permission prompt
**If "Not Right Now":** Save preference, ask again after 5th shift

### 6.2 Re-Engagement for Denied Users

**After 10 Shifts (Settings Prompt):**
```
Notifications are off

You've logged 10 shifts! Reminders can
help you stay consistent.

[Enable in Settings] [Keep Off]
```

**Deep Link:** Opens device Settings directly to app notification settings

**After Missed Pay Period (Contextual):**
```
You might have missed shifts

The pay period closed and we couldn't remind you.
Enable notifications to never miss a deadline.

[Turn On Notifications] [I'll Remember]
```

### 6.3 iOS vs Android Differences

**iOS (Requires Explicit Permission):**
- Pre-permission prompt is critical
- Only one chance at system prompt (technically)
- If denied, must direct to Settings
- Provisional notifications available (silent, in Notification Center only)

**Strategy for iOS:**
1. Pre-permission prompt after first shift
2. If denied, use provisional notifications for 30 days
3. After 30 days, prompt again via in-app message
4. If still denied, rely on in-app messaging only

**Android (Permission Granted by Default until Android 13):**
- Android 13+ requires explicit permission
- Can request at any time
- Multiple prompt attempts allowed

**Strategy for Android:**
1. Pre-permission prompt after first shift
2. If Android 12 or below, notifications work automatically
3. If Android 13+, follow iOS strategy

---

## 7. A/B TESTS

### 7.1 Copy Variations

**Test 1: Shift Reminder Tone**
| Variant | Title | Body |
|---------|-------|------|
| A (Direct) | Log your shift | Don't forget to record today's hours. |
| B (Friendly) | Just finish your shift? | Log it now while the details are fresh. |
| C (Urgent) | Hours fading from memory | Quick! Log your shift before you forget the details. |

**Metric:** Tap-through rate, shift logged within 1 hour

**Test 2: Premium Prompt Value Prop**
| Variant | Title | Body |
|---------|-------|------|
| A (Savings) | Catch pay errors | Premium users save $87/year on average. |
| B (Automation) | Automatic pay checking | Premium verifies every pay stub for you. |
| C (Peace of Mind) | Never worry about pay again | Premium ensures you're paid correctly. Always. |

**Metric:** Trial start rate, conversion to paid

**Test 3: Achievement Celebration**
| Variant | Body |
|---------|------|
| A (Stats Focus) | You've tracked $X,XXX across 10 shifts. |
| B (Progress Focus) | You're building a valuable earnings history. |
| C (Social Focus) | You're in the top 30% of active users. |

**Metric:** App open rate after notification, retention

### 7.2 Timing Variations

**Test 4: Post-Shift Reminder Timing**
| Variant | Timing |
|---------|--------|
| A | 1 hour after predicted shift end |
| B | 2 hours after predicted shift end |
| C | Same day at 8 PM |

**Metric:** Shift logged rate, time from notification to log

**Test 5: Weekly Summary Day**
| Variant | Timing |
|---------|--------|
| A | Monday 10 AM |
| B | Sunday 6 PM |
| C | Monday 6 PM |

**Metric:** Open rate, engagement with summary

### 7.3 Frequency Variations

**Test 6: Engagement Notification Frequency**
| Variant | Frequency |
|---------|-----------|
| A | Max 2 per week |
| B | Max 3 per week |
| C | Max 5 per week |

**Metric:** Open rate, unsubscribe rate, retention

**Test 7: Premium Prompt Frequency**
| Variant | Frequency |
|---------|-----------|
| A | Once per month |
| B | Twice per month |
| C | Weekly (capped at 4) |

**Metric:** Trial start rate, unsubscribe rate, NPS

---

## 8. OPT-OUT HANDLING

### 8.1 Granular Preferences

**Notification Settings Screen:**
```
NOTIFICATION PREFERENCES

Essential
[ON] Pay period reminders
[ON] Weekly summary

Helpful
[ON] Shift reminders
[ON] Achievement notifications

Optional
[OFF] Feature tips
[OFF] Premium offers

Timing
Quiet hours: 10 PM - 8 AM [Edit]
```

**Settings Deep Link:** `portpal://settings/notifications`

### 8.2 Preference Options

| Category | Default | Can Disable |
|----------|---------|-------------|
| Pay period closing | ON | Yes |
| Weekly summary | ON | Yes |
| Shift reminders | ON | Yes |
| Achievements | ON | Yes |
| Feature discovery | ON | Yes |
| Premium offers | ON | Yes |
| Referral reminders | OFF | N/A |

### 8.3 Win-Back for Opted-Out Users

**For Users Who Disabled All:**
- No push notifications
- Rely on in-app messages only
- After 30 days, show in-app prompt:

```
Missing reminders?

You turned off all notifications.
Want to enable just the essential ones?

[Essential Only] [Keep Off]
```

**For Users Who Disabled Marketing:**
- Respect the preference completely
- Never show in-app upgrade prompts more than once per session
- Focus on value delivery, not conversion

**For Users Who Uninstalled:**
- Email win-back campaign (if email collected):
  - Day 7: "Your shift data is waiting"
  - Day 30: "Tax season is coming - your records are ready"
  - Day 90: Final attempt, then remove from list

---

## 9. IMPLEMENTATION CHECKLIST

### Phase 1: MVP Notifications
- [ ] Shift reminder (generic)
- [ ] Weekly summary
- [ ] Pay period closing (48h, 24h)
- [ ] Pre-permission prompt
- [ ] Basic opt-out (all or nothing)

### Phase 2: Personalization
- [ ] Shift-specific reminders (day/night/graveyard)
- [ ] Timing based on user shift patterns
- [ ] Quiet hours implementation
- [ ] Granular notification preferences

### Phase 3: Engagement
- [ ] Streak notifications
- [ ] Achievement notifications
- [ ] Feature discovery prompts
- [ ] In-app message system

### Phase 4: Marketing
- [ ] Premium upgrade prompts
- [ ] Referral prompts
- [ ] A/B testing infrastructure
- [ ] Frequency cap system

### Phase 5: Optimization
- [ ] Adaptive frequency based on open rates
- [ ] Full A/B test suite
- [ ] Win-back campaigns
- [ ] Analytics dashboard

---

## 10. METRICS TO TRACK

### Notification Performance
- **Delivery rate:** % of sent notifications successfully delivered
- **Open rate:** % of delivered notifications opened
- **Action rate:** % of opened notifications leading to action
- **Time to action:** Minutes from notification to desired action

### User Impact
- **Shift logging rate:** Shifts logged within 24h of working
- **Retention:** 7-day, 30-day, 90-day retention by notification engagement
- **Opt-out rate:** % of users disabling notifications
- **NPS by notification frequency:** Satisfaction correlated with notification volume

### Business Impact
- **Trial starts from notifications:** Premium trials initiated via push
- **Conversion rate:** Trial to paid conversion by notification source
- **Referral signups:** New users from referral push notifications

---

## 11. LEGAL AND COMPLIANCE

### Required Disclosures
- Notification permission request must explain data usage
- Unsubscribe option must be easy to find
- Marketing notifications must comply with CASL (Canada)

### Data Handling
- Device tokens stored securely
- Notification preferences synced across devices
- User can request deletion of notification history

### CASL Compliance (Canadian Anti-Spam Legislation)
- Transactional notifications: Exempt
- Marketing notifications: Require consent
- Consent obtained through: App install + explicit opt-in
- Easy unsubscribe: One-tap disable in all marketing notifications

---

*Last Updated: February 2026*
*Version: 1.0*
