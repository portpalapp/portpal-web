# PORTPAL Referral Program
## "The Brotherhood Bonus"

---

## Philosophy

Longshoremen are a brotherhood. Crews work together, eat together, look out for each other. When one person finds something that helps, they share it. That's just what you do.

This referral program is built on that reality. Not gimmicks. Not pushy marketing. Just: "Hey, this helped me. Might help you too."

The program rewards genuine recommendations, not spam. It builds on existing crew dynamics rather than trying to manufacture virality.

---

## 1. INCENTIVE STRUCTURE

### What the Referrer Gets

**Per Successful Referral:**
| Referral # | Reward |
|------------|--------|
| 1st | $10 account credit |
| 2nd | $10 account credit |
| 3rd | $15 account credit + "Crew Chief" badge |
| 4th-5th | $15 account credit each |
| 6-10 | $20 account credit each |
| 11+ | $25 account credit each |

**Escalating rewards because:**
- Early referrals are easiest (close crew)
- Later ones require more effort
- Top referrers are invaluable and should feel valued

**Why Credits, Not Cash:**
- Credits keep users in the ecosystem
- $79/year Pro = 8 referrals pays for your year
- Credits never expire
- Can stack across years (refer 16 people = 2 free years)

### What the Referred Gets

**New User Receives:**
- 30 days Pro free (instead of standard 14)
- $10 off first year of Pro ($69 instead of $79)
- "Referred by [Name]" badge for first 30 days

**Why this works:**
- Extended trial = more time to get hooked
- Discount removes friction to convert
- Badge creates social proof and connection

### Alternative: Cash Option

For users who don't want credits:
- $7.50 cash via PayPal/Venmo per referral (instead of $10 credit)
- Minimum $30 threshold to withdraw (4 referrals)
- Paid monthly

*Most will choose credits (better value), but cash option prevents "I don't want more credits" objection.*

---

## 2. MECHANICS

### How Users Share

**Primary: Personal Code**
- Every user gets a unique code: `PORTPAL-[FIRSTNAME]-[4DIGITS]`
- Example: `PORTPAL-MIKE-7823`
- Easy to text, say out loud, remember
- Shown prominently in app: "Your referral code: PORTPAL-MIKE-7823"

**Secondary: Share Link**
- `portpal.app/join/[code]`
- One tap to copy
- Pre-fills code on signup

**Tertiary: QR Code**
- Generated in-app
- For in-person sharing (lunchroom, dispatch hall)
- Scannable from another phone's camera

**Sharing Options (one-tap):**
1. Copy code to clipboard
2. Share via text (pre-written message)
3. Share via WhatsApp
4. Show QR code
5. Email invite

### Attribution Tracking

**Code Entry Points:**
1. During signup: "Got a referral code?" field
2. Within 7 days of signup: "Add referral code" in settings
3. Before first Pro upgrade: "Have a referral code?" prompt

**Technical Tracking:**
- Referral code stored on user profile
- Link clicks tracked with UTM + code parameter
- Cookie fallback (30-day attribution window)
- If code entered manually, overrides cookie

**Edge Cases:**
- User signs up without code, adds later = still counts
- User has multiple codes = first one entered wins
- User tries own code = blocked with friendly message

### When Rewards Are Given

**Trigger: Referred user completes Pro upgrade (paid)**
- NOT at signup (prevents gaming with fake accounts)
- NOT at trial start (too easy to abuse)
- Credits added within 24 hours of payment processing
- Push notification + email: "You earned $X! [Name] just went Pro."

**Pending State:**
- Show "Pending Rewards" for signed-up but not-yet-converted referrals
- "[Name] signed up! Credit pending when they upgrade."
- Creates anticipation, encourages referrer to check in with friend

### Fraud Prevention

**Hard Blocks:**
- Same device ID = no referral credit
- Same payment method = no referral credit
- Impossible to refer yourself

**Soft Flags (manual review):**
- Sudden spike in referrals from single user
- All referrals from same IP range
- Referred users churning immediately after reward
- Generic/fake-looking email patterns

**Anti-Abuse:**
- Referral rewards capped at $500/month per user
- If flagged for abuse, pending credits frozen for manual review
- Clear ToS: abuse = account termination + credit forfeiture

---

## 3. CREW-BASED FEATURES

### Crew Signup Bonus

**"Start Your Crew" Feature:**
When 5+ people sign up together (within 7 days, same referral code):

| Crew Size | Bonus (per person) |
|-----------|-------------------|
| 5 | +$5 extra credit each |
| 8 | +$10 extra credit each |
| 10+ | +$15 extra credit each + "Crew Founders" badge |

**How it works:**
- First person creates referral code
- Shares with crew
- All sign up within 7 days
- When 5th person signs up, everyone gets bonus notification
- Bonuses stack (so 10-person crew = $25 total bonus each)

**The organizer gets:**
- Normal referral credits ($10 x number referred)
- "Crew Captain" badge
- First access to crew features

### Crew Leaderboards

**Monthly Crew Competition:**
- Crews opt-in to compete
- Tracked: Total shifts logged, pension progress (%), discrepancies caught
- NO earnings displayed (privacy)
- Top 3 crews get recognition

**Prizes:**
- 1st Place Crew: Extra month of Pro for all members
- 2nd Place Crew: Week of Pro extension for all members
- 3rd Place Crew: Shoutout + badges

**Why it works:**
- Crews are naturally competitive
- Creates internal accountability ("log your shift!")
- No individual earnings exposed, just activity metrics

### Crew Discounts

**Team Rate (5+ active Pro subscribers from same crew):**
- 15% off annual Pro for all crew members
- $67/year instead of $79
- Auto-applied when 5th crew member upgrades

**Requirements:**
- Must designate crew membership in app
- At least 5 active Pro subscriptions
- If crew drops below 5, discount removed at next renewal

---

## 4. VIRAL LOOPS

### What Makes Someone WANT to Share

**Intrinsic Motivators (most powerful for this community):**
1. **Looking out for your crew** - "You should check this out" culture
2. **Being the guy who knows things** - Status from sharing useful info
3. **Practical help** - "This actually saved me money"
4. **Crew pride** - "Our whole crew uses this now"

**Extrinsic Motivators (supporting):**
5. **Credits toward free year** - Tangible savings
6. **Badges and status** - Visible recognition
7. **Leaderboard position** - Competitive bragging rights

### Shareable "Brag Cards"

**Monthly Summary Card (auto-generated):**
```
+----------------------------------+
|     OUR CREW THIS MONTH          |
|                                  |
|     247 shifts logged            |
|     3 pay errors caught          |
|     42 hours saved               |
|                                  |
|     [PORTPAL]                    |
+----------------------------------+
```

- No earnings displayed
- Focus on collective achievement
- One tap to share to text/social
- Crew name optional (privacy)

**Personal Milestone Cards:**
```
+----------------------------------+
|     I JUST HIT 500 SHIFTS        |
|     LOGGED WITH PORTPAL          |
|                                  |
|     Errors caught: 7             |
|     Hours saved: 120+            |
|                                  |
|     Get yours: PORTPAL-MIKE-7823 |
+----------------------------------+
```

**Discrepancy Caught Card:**
```
+----------------------------------+
|     FOUND ANOTHER ONE            |
|                                  |
|     $34 short on last stub       |
|     App caught it. I didn't.     |
|                                  |
|     Worth checking yours.        |
|     portpal.app                  |
+----------------------------------+
```

*Small amounts only. Never show earnings.*

### Milestone Celebrations

**Triggered In-App + Push Notification:**

| Milestone | Message | Shareable? |
|-----------|---------|------------|
| 1st shift logged | "You're in the system. Welcome." | No |
| 10th shift | "10 down. You're getting it." | Optional |
| 50th shift | "Halfway to centurion status." | Yes |
| 100th shift | "CENTURION. 100 shifts tracked." | Yes + badge |
| 250th shift | "Quarter-thousand club." | Yes + badge |
| 500th shift | "LEGEND. 500 shifts." | Yes + badge |
| 1000th shift | "HALL OF FAME. 1000 shifts." | Yes + badge + feature request perk |
| 1st error caught | "Paid for itself already." | Yes |
| 5 errors caught | "That's real money saved." | Yes |
| Pension goal reached | "YOU MADE IT." | Yes |
| 1 referral | "You brought a brother in." | No |
| 5 referrals | "CREW CHIEF. Squad growing." | Yes + badge |
| 10 referrals | "AMBASSADOR. You're building this." | Yes + badge |

---

## 5. MESSAGING

### Referral Invite Copy

**SMS/Text (pre-written, user taps to send):**

**Option 1 - Casual:**
> "Hey - you still tracking shifts on paper? Been using this app PORTPAL, actually catches pay errors. Saved me already. Use my code PORTPAL-MIKE-7823 for a month free. portpal.app"

**Option 2 - Specific:**
> "You know how complicated the rates are? This app PORTPAL knows all of them. Log your shift, it calculates everything. Worth checking out. PORTPAL-MIKE-7823 gets you extra free trial. portpal.app"

**Option 3 - Ultra-short:**
> "Download PORTPAL. Trust me. Code: PORTPAL-MIKE-7823"

*User can edit before sending. All pre-populated.*

**Email Invite:**

Subject: "Worth checking out"

> Hey,
>
> Been using this app called PORTPAL to track shifts. Simpler than spreadsheets, actually knows all the rate rules, caught a pay error already.
>
> Use my referral code PORTPAL-MIKE-7823 and you get a month free trial instead of the normal 2 weeks, plus $10 off if you upgrade.
>
> portpal.app
>
> [Your name]

**In-App Share Card:**
```
[Name] invited you to PORTPAL

"Track shifts. Verify pay. Stop guessing."

- 30 days Pro free (extended trial)
- $10 off your first year

[ACCEPT INVITE]
```

### Social Share Copy

**When sharing milestone card:**
> "500 shifts logged. 7 pay errors caught. The app pays for itself. #PORTPAL"

**When sharing crew card:**
> "Our crew logged 247 shifts this month. The system works. 💪"

**When sharing discrepancy card:**
> "Found another pay error. $34 short. How many are you missing?"

*Keep it conversational. No corporate-speak.*

### Reward Notification Copy

**When credit earned:**
> "🎯 You earned $15!
> [Friend's name] just upgraded to Pro.
>
> Total credits: $45
> That's 57% of a free year.
>
> [View Credits] [Refer More]"

**When pending:**
> "[Friend's name] signed up with your code!
>
> Credit pending until they upgrade to Pro.
> Send them a nudge?
>
> [Text them] [Not now]"

**When crew bonus triggered:**
> "🔥 CREW BONUS UNLOCKED
>
> 5 people signed up with your code!
> Everyone in your crew gets +$5 extra.
>
> You're officially the Crew Captain.
>
> [Share the news]"

---

## 6. GAMIFICATION

### Referral Streaks

**Monthly Streak:**
- Refer at least 1 person per month
- Streak badge: "3-month streak 🔥"
- At 6-month streak: Permanent "Consistent Advocate" badge
- At 12-month streak: Special perk (free merch, priority support access)

**Benefits of streaks:**
- Keeps referrals top of mind
- Creates urgency ("don't break your streak!")
- Rewards sustained engagement over one-time bursts

### Ambassador Levels

| Level | Requirement | Perks |
|-------|-------------|-------|
| **MEMBER** | 0 referrals | Standard |
| **ADVOCATE** | 3 referrals | Badge, priority support |
| **CREW CHIEF** | 5 referrals | Badge, early feature access |
| **AMBASSADOR** | 10 referrals | Badge, free Pro forever, input on roadmap |
| **FOUNDER** | 25 referrals | All above + name in credits, annual swag, direct line to team |

**Badge Display:**
- Shown on profile
- Visible to crew members
- Optional display on share cards

**Level-Up Notification:**
> "LEVEL UP: CREW CHIEF
>
> You've brought in 5 members.
> That's real impact on the brotherhood.
>
> New perks unlocked:
> - Crew Chief badge
> - Early access to new features
> - 5 more = Ambassador status + Free Pro forever"

### Special Perks for Top Referrers

**Monthly Top 10 Referrers:**
- Featured in optional "Top Advocates" section
- Extra 10% bonus credits that month
- Personal thank-you message from team

**Annual Top Referrer:**
- Free Pro for life
- Official "Founding Advocate" title
- Input on major product decisions
- Annual gift (jacket, gear with logo)
- Name in app credits

---

## 7. SPECIAL CAMPAIGNS

### Launch Week: "FIRST CREW" Blitz

**Timing:** First 7 days of public launch

**Mechanics:**
- Double credits for all referrals (first week only)
- First 100 people to refer 3+ get "First 100" badge (permanent)
- Crew bonus thresholds lowered (3 people = crew bonus instead of 5)

**Messaging:**
> "LAUNCH WEEK: Double referral credits.
> Every referral = $20 credit (normally $10).
> First 100 to bring in 3 people get permanent badge.
> This week only."

**Goal:** Rapid early adoption, create initial momentum

---

### Monthly: "Crew Challenge"

**Timing:** First week of each month

**Mechanics:**
- Crews opt-in to compete
- Metric: Most new Pro subscribers from crew referrals
- Top 3 crews win prizes

**Prizes:**
| Place | Reward |
|-------|--------|
| 1st | $50 credit to everyone on crew + "Crew of the Month" badge |
| 2nd | $25 credit to everyone on crew |
| 3rd | $10 credit to everyone on crew |

**Leaderboard:**
- Live leaderboard visible in-app during challenge
- Shows crew name (or "Crew #123" if anonymous)
- Number of referrals that week
- Position

**Messaging:**
> "CREW CHALLENGE WEEK
>
> Which crew brings in the most new members?
>
> Current leader: Vanterm Night Crew (7 referrals)
> Your crew: 3 referrals (4th place)
>
> 4 days left. Every referral counts."

---

### Pay Period Push

**Timing:** Every 2 weeks (aligned with pay periods)

**Mechanics:**
- Reminder that now is good time to check pay
- Prompt to share with someone who should be checking too
- Bonus: +$2 extra credit for referrals made day of pay

**Messaging:**
> "PAY DAY
>
> Did your stub match your logs?
> Know someone who should be checking theirs?
>
> Referrals today earn +$2 bonus credit.
>
> [Share your code]"

---

### Seasonal: "Holiday Crew Coverage"

**Timing:** December (holiday season)

**Mechanics:**
- Themed campaign about working through holidays
- Referral credits increased by 50%
- Crew signup bonuses doubled

**Messaging:**
> "HOLIDAY CREW BONUS
>
> Working through the holidays? So are we.
> Referral credits +50% all December.
>
> Bring your crew in. Start the new year organized.
>
> [Share your code]"

---

### Anniversary Campaign

**Timing:** One year after launch, annually

**Mechanics:**
- "Founding Member" referrals get extra weight
- Year-in-review shareable cards
- Top referrers of all time recognized

**Messaging:**
> "ONE YEAR OF PORTPAL
>
> [X] shifts logged by the community
> [X] pay errors caught
> [X] hours saved
>
> You've referred [X] people.
> Thank you for building this with us.
>
> [Share your year]"

---

## 8. TRACKING & METRICS

### Primary KPIs

**Acquisition:**
| Metric | Target | Notes |
|--------|--------|-------|
| Referral Rate | 25%+ | % of users who refer at least 1 person |
| K-Factor | 0.4+ | Viral coefficient (referrals per user) |
| Referral Conversion | 40%+ | % of referred signups that convert to Pro |
| Time to First Referral | <30 days | How quickly new users refer |

**Engagement:**
| Metric | Target | Notes |
|--------|--------|-------|
| Code Share Rate | 15%+ | % of users who ever tap "share" |
| Repeat Referrers | 30%+ | % of referrers who refer 2+ people |
| Ambassador Rate | 5%+ | % reaching 10+ referrals |

**Revenue Impact:**
| Metric | Target | Notes |
|--------|--------|-------|
| Revenue from Referrals | 30%+ | % of new Pro revenue from referral channel |
| CAC via Referral | <$15 | Cost to acquire customer via referral |
| LTV of Referred Users | Higher than organic | Referred users should retain better |

### A/B Tests to Run

**Test 1: Credit Amount**
- A: $10 per referral
- B: $15 per referral
- Measure: Referral rate, total referrals, ROI

**Test 2: Credit vs Cash**
- A: Credit only
- B: Cash option available
- Measure: Which is chosen, total referrals, retention

**Test 3: Share Message**
- A: Casual message
- B: Specific/detailed message
- C: Ultra-short message
- Measure: Click rate, conversion rate

**Test 4: Referral Prompt Timing**
- A: After 3rd shift logged
- B: After first discrepancy caught
- C: After first month
- Measure: Share rate, quality of referrals

**Test 5: Crew Bonus Threshold**
- A: 5 people for crew bonus
- B: 3 people for crew bonus
- Measure: Crew adoption rate, total signups

**Test 6: Badge Display**
- A: Prominent badge display
- B: Subtle badge display
- Measure: Share rate, referral rate (do badges motivate?)

### Conversion Benchmarks

**Expected Funnel (based on industry + community dynamics):**

```
100 users sign up
 └─ 25 share their code (25% share rate)
    └─ 50 people click link (2 clicks per sharer)
       └─ 30 sign up (60% click-to-signup)
          └─ 12 convert to Pro (40% conversion)
             └─ 12 x $10 = $120 in credits paid

Cost per new Pro user: $10 (1 credit per conversion)
```

**K-Factor Calculation:**
- K = share rate x clicks per share x signup rate x conversion rate
- K = 0.25 x 2 x 0.6 x 0.4 = 0.12

*Anything above 0.1 is healthy. Above 0.5 is exceptional.*

**Crew-Adjusted K-Factor:**
- Crew signups tend to be 3-5 at once
- If 10% of users trigger crew signups (5 people each):
- Adjusted K = 0.12 + (0.10 x 5 x 0.4) = 0.32

*Crew dynamics significantly boost virality.*

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: MVP (Launch)
- Basic referral code system
- Credit rewards ($10 per referral)
- Share via text/copy code
- Reward notifications
- Basic tracking

### Phase 2: Crew Features (Month 2)
- Crew signup bonus
- Crew designation in app
- Team rate discount
- Crew leaderboards

### Phase 3: Gamification (Month 3)
- Ambassador levels
- Badges
- Streaks
- Milestone share cards

### Phase 4: Campaigns (Month 4+)
- Crew Challenge events
- Seasonal campaigns
- Pay period pushes
- Anniversary celebrations

---

## 10. MESSAGING DON'TS

Consistent with overall PORTPAL brand strategy:

1. **DON'T show earnings in share cards**
   - No "I made $X this month" content
   - No salary figures that invite public scrutiny

2. **DON'T make it feel like MLM**
   - No "build your downline" language
   - No pressure tactics
   - No "passive income" framing

3. **DON'T spam**
   - Limit referral prompts to 1x per week max
   - Never auto-send anything without user action
   - Easy to dismiss all referral prompts

4. **DON'T incentivize fake accounts**
   - Rewards only on paid conversion
   - Fraud detection in place
   - Clear ToS against abuse

5. **DON'T break trust**
   - Never share user data with referrer beyond name
   - Never reveal who hasn't upgraded
   - Referred user's privacy always protected

---

## Summary

This referral program is built for how longshoremen actually work and communicate:

1. **Crew-first**: Bonuses for signing up together, crew competitions, team rates
2. **Trust-based**: Low-pressure sharing, useful tool focus, no earnings exposure
3. **Practical rewards**: Credits toward free Pro, simple math, real value
4. **Community status**: Badges and levels that mean something in the community
5. **Respectful**: No spam, no pressure, easy to ignore

The goal isn't to create aggressive viral growth. It's to make sharing natural and rewarding for the people who genuinely want to help their crew.

**Target: 40% of new Pro subscribers from referrals by month 6.**

---

*"My crew uses PORTPAL. You should too."*
