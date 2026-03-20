# PORTPAL Feature Roadmap
## Product Strategy Document

**Last Updated:** February 2026
**Data Foundation:** 71,712 shifts from 752 users across 42 job types and 994 unique combinations

---

## Product Vision

PORTPAL is the indispensable tool for BC longshoremen to track, verify, and optimize their earnings. We turn the complexity of longshore pay (42 jobs, 24 terminals, 3 shifts, weekend premiums, differentials) into peace of mind.

**Core Promise:** "Every dollar you earned. Accounted for."

---

## Current State Assessment

### What We Have

| Feature | Status | Notes |
|---------|--------|-------|
| Shift logging | Live | Unlimited, free tier |
| Auto pay calculation | Live | 990+ rate combinations |
| Pension tracking | Live | Basic progress bar |
| Basic analytics | Live | Week-over-week |
| AI chat | Live | 1 free question/week |
| Weekly summaries | Live | View & save |

### What Users Are Doing

- **752 active users** have logged shifts
- **307 power users** (41%) log consistently
- **Top jobs tracked:** LABOUR (19,201), TRACTOR TRAILER (16,921), RTG (4,725)
- **Top locations:** CENTENNIAL (23,828), VANTERM (15,226), LYNNTERM (7,120)
- **Total tracked earnings:** $41M+

### Assumed Pain Points (to validate)

1. **Verification gap:** Users log shifts but can't verify against pay stubs
2. **Callback friction:** Repeating yesterday's shift takes too many taps
3. **Prediction desire:** Users want to know what jobs they'll get
4. **Shortage tracking:** No way to track/resolve pay discrepancies
5. **Export needs:** Users can't get their data out for taxes/records

---

## IMMEDIATE PRIORITIES (Next 30 Days)

### 1. Callback Feature (Repeat Yesterday)

**Problem:** 65%+ of shifts follow patterns. Users log similar shifts repeatedly but must enter details each time.

**Solution:** One-tap "callback" button that pre-fills yesterday's shift details.

| Aspect | Details |
|--------|---------|
| User Value | Save 20+ seconds per shift, reduce friction |
| Business Value | Premium feature, drives conversion |
| Complexity | Small (S) |
| Dependencies | None |
| Tier | PRO |

**Success Metric:** 40% of Pro users use callback within first week.

---

### 2. Quick Templates

**Problem:** Power users work the same jobs/locations/shifts repeatedly.

**Solution:** Save custom templates ("My Usual TT Day at Cent") for one-tap logging.

| Aspect | Details |
|--------|---------|
| User Value | Reduces logging to 2 taps for common shifts |
| Business Value | Premium feature, creates stickiness |
| Complexity | Small (S) |
| Dependencies | None |
| Tier | PRO |

**Success Metric:** Users with 3+ templates have 2x retention.

---

### 3. Push Notification Reminders

**Problem:** Users forget to log shifts, leading to inaccurate records.

**Solution:** Smart reminders at configurable times (e.g., 8pm daily: "Did you work today?").

| Aspect | Details |
|--------|---------|
| User Value | Never forget to log, maintain accurate records |
| Business Value | Increases engagement, DAU |
| Complexity | Small (S) |
| Dependencies | Push notification infrastructure |
| Tier | FREE |

**Success Metric:** 30% increase in daily logging rate.

---

### 4. Enhanced Dashboard

**Problem:** Current dashboard is basic; users can't see meaningful patterns.

**Solution:** Add: earnings by job type, location breakdown, shift distribution, busiest days.

| Aspect | Details |
|--------|---------|
| User Value | Understand earning patterns, identify opportunities |
| Business Value | Shows data depth, premium upsell opportunity |
| Complexity | Small (S) |
| Dependencies | None |
| Tier | Basic charts FREE, detailed PRO |

**Success Metric:** Dashboard views increase 3x.

---

### 5. Notes and Annotations

**Problem:** Users need to record exceptions, issues, and context for shifts.

**Solution:** Add optional notes field to shift entries (searchable, viewable in history).

| Aspect | Details |
|--------|---------|
| User Value | Track context for discrepancies, remember details |
| Business Value | Richer data, enables future discrepancy features |
| Complexity | Small (S) |
| Dependencies | None |
| Tier | FREE |

**Success Metric:** 15% of shifts have notes within 30 days.

---

## SHORT TERM (30-90 Days)

### 6. Pay Stub Photo Upload

**Problem:** Users want to verify their logged shifts against actual pay stubs but it's manual and tedious.

**Solution:** Upload pay stub photo, we extract key data for comparison.

| Aspect | Details |
|--------|---------|
| User Value | Verify accuracy without manual calculation |
| Business Value | Core premium differentiator, key conversion driver |
| Complexity | Medium (M) |
| Dependencies | OCR infrastructure (Google Vision or similar) |
| Tier | PRO |

**Success Metric:** 50% of Pro users upload at least one stub in first month.

---

### 7. Discrepancy Detection and Alerts

**Problem:** Users get shorted but don't know it. Errors are small but compound over time.

**Solution:** AI compares uploaded stubs to logged shifts, flags mismatches.

| Aspect | Details |
|--------|---------|
| User Value | Catch errors automatically, protect earnings |
| Business Value | THE killer feature. "One discrepancy pays for a year of Pro." |
| Complexity | Medium (M) |
| Dependencies | Pay stub upload (#6), rate database accuracy |
| Tier | PRO |

**Success Metric:** Average user finds 2+ discrepancies in first year.

---

### 8. Shortage Tracking and Resolution

**Problem:** When users find a pay discrepancy, they have no way to track resolution.

**Solution:** Log shortages, track status (pending, submitted, resolved), sum outstanding amounts.

| Aspect | Details |
|--------|---------|
| User Value | Don't lose track of owed money, have records for union rep |
| Business Value | Creates ongoing engagement, shows long-term value |
| Complexity | Medium (M) |
| Dependencies | Discrepancy detection (#7) |
| Tier | PRO |

**Success Metric:** 80% of detected discrepancies tracked to resolution.

---

### 9. Data Export (CSV, PDF)

**Problem:** Users need their data for taxes, records, or disputes but can't get it out.

**Solution:** Export shift history, earnings summaries, and discrepancy reports.

| Aspect | Details |
|--------|---------|
| User Value | Portable data, tax prep, legal records |
| Business Value | Premium feature, removes exit friction (paradoxically increases trust) |
| Complexity | Small (S) |
| Dependencies | None |
| Tier | PRO |

**Success Metric:** 25% of Pro users export annually.

---

### 10. Year-over-Year Comparison

**Problem:** Users can't see how this year compares to last year.

**Solution:** Compare earnings, shifts, jobs, and pension progress YoY.

| Aspect | Details |
|--------|---------|
| User Value | Track career progress, see trends |
| Business Value | Requires history, increases lifetime value |
| Complexity | Small (S) |
| Dependencies | 12+ months of user data |
| Tier | PRO |

**Success Metric:** Users with YoY view have 40% higher retention.

---

### 11. Referral Program

**Problem:** Growth is organic but unoptimized. Users tell coworkers but get nothing.

**Solution:** Share code, friend gets 1 month Pro free, user gets 1 month Pro free.

| Aspect | Details |
|--------|---------|
| User Value | Free Pro time, help coworkers |
| Business Value | Viral loop, reduces CAC, leverages dock culture |
| Complexity | Medium (M) |
| Dependencies | User accounts, referral tracking |
| Tier | PRO (but benefits Free users) |

**Success Metric:** 20% of new users come from referrals.

---

### 12. Widgets (iOS/Android)

**Problem:** Users must open app to see pension progress or log shifts.

**Solution:** Home screen widgets: pension progress bar, quick-log button, earnings summary.

| Aspect | Details |
|--------|---------|
| User Value | Instant visibility, faster logging |
| Business Value | Increases daily engagement, brand presence on home screen |
| Complexity | Medium (M) |
| Dependencies | Native app development |
| Tier | FREE (basic), PRO (advanced) |

**Success Metric:** Widget users log 50% more shifts.

---

## MEDIUM TERM (90-180 Days)

### 13. Job Prediction Engine

**Problem:** Users don't know what jobs they'll get based on their seniority.

**Solution:** ML model predicts likely jobs based on seniority number, historical patterns, and current demand.

| Aspect | Details |
|--------|---------|
| User Value | Plan ahead, know what to expect |
| Business Value | MAJOR differentiator, uses our 71k shift data moat |
| Complexity | Large (L) |
| Dependencies | Seniority data, ML infrastructure, job posting data |
| Tier | Basic prediction FREE, detailed PRO |

**Success Metric:** 70% accuracy on job predictions (within top 3).

---

### 14. What-If Scenario Planner

**Problem:** Users want to know: "If I take August off, will I hit my pension goal?"

**Solution:** Interactive tool to model scenarios and see impact on pension/earnings.

| Aspect | Details |
|--------|---------|
| User Value | Plan vacations, life decisions with confidence |
| Business Value | Premium feature, emotional engagement |
| Complexity | Medium (M) |
| Dependencies | Pension tracking, user history |
| Tier | PRO |

**Success Metric:** Users who use scenarios have 2x Pro conversion.

---

### 15. Smart Scheduling Insights

**Problem:** Users don't know when to be available for best jobs.

**Solution:** Analyze patterns to suggest optimal days/shifts for user's goals.

| Aspect | Details |
|--------|---------|
| User Value | Maximize earnings, work smarter |
| Business Value | AI-powered premium feature |
| Complexity | Medium (M) |
| Dependencies | Job prediction engine (#13), user preference data |
| Tier | PRO |

**Success Metric:** Users following recommendations earn 10%+ more.

---

### 16. Earnings Goal Setting

**Problem:** Beyond pension, users have other financial goals but no way to track.

**Solution:** Set custom goals (vacation fund, down payment, etc.) and track progress.

| Aspect | Details |
|--------|---------|
| User Value | Motivation, financial planning |
| Business Value | Increased engagement, personal investment in app |
| Complexity | Small (S) |
| Dependencies | None |
| Tier | FREE (1 goal), PRO (unlimited) |

**Success Metric:** 60% of users set at least one goal.

---

### 17. Crew Sharing (Opt-in)

**Problem:** Users want to compare earnings with trusted coworkers.

**Solution:** Create private groups to share anonymized stats (without revealing exact earnings).

| Aspect | Details |
|--------|---------|
| User Value | Benchmark against peers, catch systemic issues |
| Business Value | Viral growth, social lock-in |
| Complexity | Medium (M) |
| Dependencies | User accounts, privacy controls |
| Tier | PRO |

**Success Metric:** Users in crews have 3x retention.

---

### 18. Foreman/Supervisor Mode

**Problem:** Supervisors need to track their crews and ensure compliance.

**Solution:** Supervisors can view aggregate crew stats (with permission), track qualifications.

| Aspect | Details |
|--------|---------|
| User Value | Simplify management tasks |
| Business Value | B2B opportunity, expands TAM |
| Complexity | Large (L) |
| Dependencies | User roles, permission system |
| Tier | Special tier (B2B) |

**Success Metric:** 10+ foremen using within 6 months.

---

### 19. Training and Certification Tracking

**Problem:** Users need to track certifications, training expiration, and qualification requirements.

**Solution:** Log certifications, get reminders before expiration, see what training unlocks.

| Aspect | Details |
|--------|---------|
| User Value | Never let certifications lapse, plan career progression |
| Business Value | Stickiness, daily relevance even when not working |
| Complexity | Medium (M) |
| Dependencies | Certification database |
| Tier | FREE (basic), PRO (reminders, planning) |

**Success Metric:** 40% of users track at least one certification.

---

### 20. AI Chat Enhancements

**Problem:** Current AI is basic; users want more sophisticated questions answered.

**Solution:** Train AI on full rate database, historical patterns, and user context.

| Aspect | Details |
|--------|---------|
| User Value | Get any pay question answered instantly |
| Business Value | Reduces support burden, premium feature |
| Complexity | Medium (M) |
| Dependencies | LLM integration, rate database |
| Tier | 3 questions FREE, unlimited PRO |

**Success Metric:** 80% of AI questions resolved without human support.

---

## LONG TERM (6-12 Months)

### 21. Union Partnership Dashboard

**Problem:** Unions lack real-time data on member earnings, patterns, and issues.

**Solution:** Anonymized aggregate dashboard for union officials showing trends, discrepancy rates, and member needs.

| Aspect | Details |
|--------|---------|
| User Value | Better union representation, data-driven advocacy |
| Business Value | B2B revenue, institutional distribution |
| Complexity | Large (L) |
| Dependencies | Significant user base, privacy framework |
| Tier | B2B Licensing |

**Revenue Potential:** $5-20K/year per local chapter.

---

### 22. Employer Integration API

**Problem:** Employers want accurate records; currently they verify manually.

**Solution:** Optional API for employers to verify shifts (with user permission).

| Aspect | Details |
|--------|---------|
| User Value | Faster discrepancy resolution, official record |
| Business Value | B2B revenue, reduces employer friction |
| Complexity | Large (L) |
| Dependencies | Employer partnerships, legal framework |
| Tier | B2B Licensing |

**Revenue Potential:** $10-50K/year per terminal operator.

---

### 23. Multi-Port Expansion

**Problem:** Other ports (ILA East Coast, US West Coast, Australia) have same problems.

**Solution:** Expand PORTPAL to other longshore jurisdictions with local rate data.

| Aspect | Details |
|--------|---------|
| User Value | Same great tool, wherever they work |
| Business Value | 10x TAM expansion |
| Complexity | Large (L) |
| Dependencies | Local rate research, compliance, partnerships |
| Tier | Regional pricing |

**Market Potential:** ILA (East Coast) alone is 45,000+ longshoremen.

---

### 24. Family/Dependent Access

**Problem:** Spouses/partners want visibility into household earnings.

**Solution:** Family accounts with read-only access or co-management.

| Aspect | Details |
|--------|---------|
| User Value | Household financial planning, peace of mind for families |
| Business Value | Additional revenue per household |
| Complexity | Medium (M) |
| Dependencies | User roles, sharing permissions |
| Tier | Family Plan ($149/year) |

**Success Metric:** 20% of Pro users upgrade to Family.

---

### 25. Industry Insights Report

**Problem:** No one has accurate data on longshore work patterns.

**Solution:** Publish anonymized quarterly reports on industry trends.

| Aspect | Details |
|--------|---------|
| User Value | Understand industry context, benchmark |
| Business Value | PR, credibility, potential data licensing |
| Complexity | Medium (M) |
| Dependencies | Large user base, data science capacity |
| Tier | Free public report, detailed PRO |

**Revenue Potential:** Data licensing to analysts, researchers.

---

### 26. Tax Preparation Integration

**Problem:** Year-end tax prep requires manual export and formatting.

**Solution:** Direct integration with tax software or accountant-ready reports.

| Aspect | Details |
|--------|---------|
| User Value | Save hours at tax time |
| Business Value | Seasonal engagement, partnership revenue |
| Complexity | Medium (M) |
| Dependencies | Tax software APIs, accountant partnerships |
| Tier | PRO |

**Success Metric:** 30% of users use tax export annually.

---

### 27. Retirement Planning Tools

**Problem:** Pension tracking is short-term; users need long-term retirement planning.

**Solution:** Model retirement scenarios, integrate with other retirement accounts, show projected outcomes.

| Aspect | Details |
|--------|---------|
| User Value | Comprehensive retirement picture |
| Business Value | Deepens engagement, financial advisor partnerships |
| Complexity | Large (L) |
| Dependencies | Financial data APIs, compliance |
| Tier | PRO Premium |

**Partnership Potential:** Fidelity, Vanguard, pension funds.

---

## FEATURE PRIORITIZATION MATRIX

### Impact vs. Effort Grid

```
                    HIGH IMPACT
                         |
    QUICK WINS           |         BIG BETS
    [Do Now]             |         [Plan Carefully]
                         |
    - Callback           |         - Pay Stub Upload + OCR
    - Templates          |         - Job Prediction Engine
    - Push Notifications |         - Union Dashboard
    - Dashboard Enhance  |         - Multi-Port Expansion
    - Notes              |
                         |
LOW EFFORT --------------|--------------- HIGH EFFORT
                         |
    FILL-INS             |         AVOID/DEFER
    [When Capacity]      |         [Reconsider]
                         |
    - Data Export        |         - Employer API
    - YoY Comparison     |         - Retirement Planning
    - Goal Setting       |         (unless strategic)
                         |
                    LOW IMPACT
```

### Must-Have vs Nice-to-Have

**Must-Have (Core Value Proposition):**
1. Pay Stub Upload + OCR
2. Discrepancy Detection
3. Callback/Templates (time savings)
4. Push Notifications (engagement)

**Nice-to-Have (Differentiation):**
1. Job Prediction Engine
2. What-If Scenarios
3. Crew Sharing
4. Widgets

**Future Optionality (Strategic):**
1. Union Dashboard
2. Multi-Port Expansion
3. Employer API

### Free vs Premium Placement

| Free Tier | Premium Tier |
|-----------|--------------|
| Unlimited shift logging | Callback (repeat yesterday) |
| Auto pay calculation | Custom templates |
| Basic pension tracking | Pay stub upload + OCR |
| Weekly summary | Discrepancy detection + alerts |
| Basic dashboard | Shortage tracking |
| 1 AI question/week | Unlimited AI chat |
| 1 goal | Unlimited goals |
| Push notifications | Data export |
| Notes/annotations | YoY comparison |
| Basic widgets | Job predictions |
| | What-if scenarios |
| | Crew sharing |
| | Advanced analytics |

---

## DIFFERENTIATING FEATURES

### What Makes PORTPAL Impossible to Copy

1. **71,712+ Shifts of Data**
   - No competitor starts with this advantage
   - Enables job prediction accuracy
   - Powers discrepancy detection
   - Creates network effects

2. **990+ Rate Combinations Verified**
   - Years of research in the rate database
   - Constantly updated with new differentials
   - No one else has done this work

3. **Community Trust**
   - Built by/for the dock
   - Word-of-mouth in a tight community
   - Not a corporate tool imposed from above

4. **Domain Expertise**
   - Understanding the nuances (Centennial 9-hour shifts vs 8-hour)
   - Knowing the subjobs, the variations
   - Speaking the language

### What Creates Lock-In

1. **Historical Data**
   - Users build multi-year earning history
   - Data becomes more valuable over time
   - Can't export everything (context, notes, verifications)

2. **Verified Discrepancies**
   - Record of caught errors
   - Evidence for disputes
   - Legal/financial documentation

3. **Pension Goal Progress**
   - Multi-year tracking toward retirement
   - Emotional investment in the journey
   - Switching means losing context

4. **Templates and Workflows**
   - Customized to user's patterns
   - Time to rebuild elsewhere

5. **Referral Network**
   - Connected to coworkers' accounts
   - Crew comparisons require everyone on platform

### What Drives Virality

1. **"I Caught a $34 Error" Stories**
   - Concrete, shareable moments
   - Social proof of value
   - Encourages checking ("am I being shorted too?")

2. **Pension Progress Celebrations**
   - "Hit my pension goal!"
   - Natural share moments
   - Aspirational for others

3. **Referral Incentives**
   - Direct benefit to sharing
   - Free Pro time for both parties

4. **Comparison/Competition**
   - "Who worked more this quarter?"
   - Healthy crew competition
   - Requires everyone to have the app

5. **Educational Content**
   - "Did you know Saturday graveyard pays X?"
   - Shareable knowledge
   - Positions PORTPAL as authority

---

## DATA ADVANTAGES

### How 71,712 Shifts Help

**1. Rate Verification**
- Crowdsourced validation of official rates
- Catch when employers misapply rules
- Identify terminal-specific variations

**2. Pattern Detection**
```
Example findings:
- CENTENNIAL shifts average 9 hours, not 8
- RTG night shift often has 1 hour OT
- WHEAT terminals have unique differentials
```

**3. Anomaly Detection**
- Flag user entries that deviate from patterns
- Identify potential errors before pay stub arrives
- "This rate seems unusual - double check?"

**4. Job Prediction Accuracy**
- Historical demand by job type
- Seasonal patterns (busy December, slow January)
- Seniority cutoffs for jobs

### Patterns We Can Detect

1. **Seasonal Demand**
   - Which months have most shifts
   - When overtime is common
   - Holiday period patterns

2. **Job Availability by Seniority**
   - At seniority X, you typically get jobs Y and Z
   - Predict promotion timelines
   - Set realistic expectations

3. **Terminal Patterns**
   - Which terminals are busiest
   - Where certain jobs concentrate
   - Travel time considerations

4. **Pay Error Patterns**
   - Common mistakes by terminal
   - Frequent mis-coded jobs
   - Systematic issues to flag

### Predictions We Can Make

1. **Job Prediction** (Medium-term feature)
   - Input: Seniority number, day of week, preferences
   - Output: Likely job assignments (probability ranked)

2. **Earnings Forecast**
   - Based on historical patterns
   - Adjusted for seniority
   - Factor in seasonal trends

3. **Pension Timeline**
   - Will user hit goal this year?
   - When at current pace?
   - What's needed to accelerate?

4. **Discrepancy Likelihood**
   - "This type of shift has 8% error rate"
   - Priority checking recommendations
   - Historical accuracy by terminal

---

## IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (Days 1-30)
```
Week 1-2: Callback + Templates (Pro features)
Week 2-3: Push notifications + Dashboard enhancements
Week 3-4: Notes field + Quality improvements
```

### Phase 2: Core Premium (Days 30-90)
```
Month 2: Pay stub photo upload infrastructure
Month 2-3: OCR processing + data extraction
Month 3: Discrepancy detection v1
```

### Phase 3: Differentiation (Days 90-180)
```
Month 4: Shortage tracking
Month 4-5: Data export + YoY comparison
Month 5-6: Job prediction v1 (basic)
Month 6: Referral program launch
```

### Phase 4: Expansion (Months 6-12)
```
Month 7-8: Widgets + mobile enhancements
Month 8-9: What-if scenario planner
Month 9-10: Crew sharing (beta)
Month 10-12: Union dashboard pilot
```

---

## SUCCESS METRICS BY PHASE

### Phase 1 (30 days)
- DAU increase: 25%
- Pro conversion: 15% of active users
- NPS: 50+

### Phase 2 (90 days)
- Pay stubs uploaded: 500+
- Discrepancies found: 100+
- Pro conversion: 30%
- Revenue: $2K MRR

### Phase 3 (180 days)
- Active users: 1,000+
- Pro subscribers: 300+
- Referral rate: 20% of new users
- Revenue: $4K MRR

### Phase 4 (12 months)
- Active users: 2,000+
- Pro subscribers: 600+
- B2B contracts: 2+
- Revenue: $8K MRR + B2B

---

## CONCLUSION

PORTPAL's feature roadmap is built on three pillars:

1. **Immediate Value:** Quick wins that reduce friction and demonstrate competence (callback, templates, notifications).

2. **Core Differentiation:** Pay stub verification and discrepancy detection - the "one feature worth a year of Pro."

3. **Long-Term Moat:** Data-powered features (predictions, insights) that become more valuable with scale and create true competitive barriers.

The sequencing prioritizes features that:
- Drive Pro conversion (revenue)
- Create lock-in (retention)
- Enable virality (growth)
- Build data moat (defense)

Every feature should pass the test: "Does this help a longshoreman know they got paid correctly, plan their future, or save time?"

---

*This roadmap is a living document. Update quarterly based on user feedback, conversion data, and competitive dynamics.*
