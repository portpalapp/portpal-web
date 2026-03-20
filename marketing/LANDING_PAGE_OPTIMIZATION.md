# PORTPAL Landing Page Optimization Strategy

## CRO Analysis & Implementation Roadmap

This document outlines a comprehensive conversion rate optimization (CRO) strategy for the PORTPAL landing page, based on industry research, blue-collar app best practices, and mobile-first design principles.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Above the Fold Optimization](#2-above-the-fold-optimization)
3. [Social Proof Strategy](#3-social-proof-strategy)
4. [Feature Presentation](#4-feature-presentation)
5. [Objection Handling](#5-objection-handling)
6. [CTA Strategy](#6-cta-strategy)
7. [A/B Test Roadmap](#7-ab-test-roadmap)
8. [Page Variations](#8-page-variations)
9. [Mobile Optimization](#9-mobile-optimization)
10. [Analytics Setup](#10-analytics-setup)

---

## 1. Current State Analysis

### Current Landing Page Structure (`/app/src/pages/Landing.tsx`)

| Section | Current Implementation | Status |
|---------|----------------------|--------|
| Navigation | Fixed nav with mobile menu | Good |
| Hero | Headline + subheadline + email capture | Needs optimization |
| Badge | "Built by longshoremen" | Good trust signal |
| Demo Video | Placeholder video section | Needs actual content |
| Stats Bar | 4 stats (shifts, jobs, terminals, errors) | Good |
| Problem Section | 3 pain point cards | Good |
| Features | 6 feature cards | Review for benefits |
| Pricing | Free + Pro tiers | Good structure |
| Testimonials | 3 testimonials | Needs expansion |
| Final CTA | Dual button section | Optimize |
| Footer | Minimal | Adequate |

### Current Metrics to Establish Baseline

Before optimizing, establish baseline metrics:
- [ ] Current conversion rate (email signups / visitors)
- [ ] Bounce rate
- [ ] Time on page
- [ ] Scroll depth
- [ ] Click heatmap data

---

## 2. Above the Fold Optimization

### 2.1 Headline Variations to A/B Test

**Current Headline:**
> Stop Leaving Money On the Table

**Test Variations:**

| Version | Headline | Formula Used |
|---------|----------|--------------|
| A (Control) | "Stop Leaving Money On the Table" | Agitator |
| B | "Know Your Exact Pay Before the Check Arrives" | Value Prop |
| C | "The $340 Average Error That's Costing You Every Year" | Specific Number |
| D | "Finally: A Shift Tracker That Actually Gets Longshore Pay" | Frustration Relief |
| E | "BC Longshoremen Are Finding $1000s in Pay Errors. Are You?" | FOMO + Question |
| F | "Track Shifts in 30 Seconds. Catch Every Dollar You're Owed." | How-To + Benefit |

**Recommended Test Order:**
1. Test A vs C (control vs specific number) - Numbers convert well
2. Winner vs F (add speed benefit)
3. Winner vs E (test FOMO approach)

### 2.2 Subheadline Variations

**Current:**
> Track your shifts. Catch pay errors. Know exactly when you'll hit pension. The shift tracker that actually understands longshore pay.

**Test Variations:**

| Version | Subheadline |
|---------|-------------|
| A (Control) | "Track your shifts. Catch pay errors. Know exactly when you'll hit pension. The shift tracker that actually understands longshore pay." |
| B | "42 job types. Every differential. Every overtime rule. All calculated automatically." |
| C | "Used by 500+ BC longshoremen. Catches an average of $34 per error. Free to try." |
| D | "Stop wrestling with spreadsheets. We built the calculator the locals should have had years ago." |
| E | "From TT Rail differentials to pension tracking - finally, an app that speaks longshore." |

### 2.3 Hero Image/Video Concepts

**Current:** Placeholder video with play button

**Recommended Options:**

| Option | Description | Priority |
|--------|-------------|----------|
| **App Demo Video** | 30-60 sec showing shift logging + error catch | HIGH |
| **Real Screenshot** | Actual app interface showing pay calculation | HIGH |
| **Before/After Split** | Paper tracking vs app tracking | MEDIUM |
| **Testimonial Video** | Mike T. sharing his $340 story | HIGH |
| **Animated Illustration** | Money falling into pocket metaphor | LOW |

**Video Script Concept (60 sec):**
1. (0-10s) "I found $340 they owed me in my first month"
2. (10-25s) Quick demo: Log shift in 30 seconds
3. (25-40s) Show: App catches rate discrepancy
4. (40-50s) Show: Pension tracker predicting December date
5. (50-60s) CTA: "Try it free. No credit card needed."

### 2.4 Primary CTA Placement

**Current Position:** Below subheadline (good)

**Optimization Recommendations:**
- Make email field + button larger on mobile
- Add micro-copy below CTA field
- Consider sticky CTA on scroll (mobile)

**Micro-copy Options:**
- "Join 500+ longshoremen already tracking"
- "Takes 30 seconds. No credit card."
- "We never spam. Unsubscribe anytime."

---

## 3. Social Proof Section

### 3.1 Testimonial Optimization

**Current Testimonials:** 3 testimonials with name, role, rating

**Recommended Enhancements:**

| Enhancement | Implementation |
|-------------|----------------|
| Photos | Add headshots (even illustrated) for authenticity |
| Specificity | Add specific terminal/local references |
| Video Testimonials | 15-30 sec clips from real users |
| Variety | Include different job types (TT, HC, RTG, etc.) |
| Recency | Add dates or "using for X months" |

**Enhanced Testimonial Format:**
```
"Found $340 they owed me in my first month. App paid for itself 3x over."

- Mike T.
  TT Driver, Deltaport | 12 years
  Using PORTPAL since March 2025
  [Photo]
```

**Additional Testimonials to Collect:**

| Persona | Quote Theme | Job Type |
|---------|-------------|----------|
| New Worker | "Wish I had this when I started" | Labour |
| Veteran | "30 years of paper - finally switched" | Checker |
| Tech-Shy | "My son set it up, now I use it daily" | Various |
| Error Finder | "Caught 3 errors this year" | TT/RTG |
| Pension Focused | "Finally know I'll make it" | Various |

### 3.2 Stats Section Optimization

**Current Stats:**
- 71,712 Shifts Analyzed
- 42 Job Types
- 24 Terminals
- $34 Avg Error Caught

**Recommended Stats to Test:**

| Stat Set | Stats |
|----------|-------|
| A (Current) | Shifts, Jobs, Terminals, Avg Error |
| B (User Focus) | Active Users, Shifts Logged, Errors Caught, Money Recovered |
| C (Trust Focus) | Years of Data, Accuracy Rate, User Rating, Error Success Rate |
| D (Urgency) | Errors Found This Month, Avg $ Recovered, Users This Week, % Finding Errors |

**New Stat Options:**
- "500+ active longshoremen"
- "$12,400+ in errors caught last month"
- "99.2% rate accuracy"
- "4.8/5 average rating"
- "3,247 errors caught to date"

### 3.3 Trust Badges to Add

| Badge Type | Examples |
|------------|----------|
| Security | "Bank-level encryption" / SSL badge |
| Privacy | "Your data never shared" / Privacy shield |
| Local Trust | "Made in Vancouver, BC" |
| Community | "By longshoremen, for longshoremen" |
| Guarantee | "14-day free trial - cancel anytime" |

### 3.4 Future Media Mentions Section

Reserve space for:
- Local news coverage
- Union newsletter mentions
- Industry publication features
- App store ratings

---

## 4. Feature Presentation

### 4.1 Feature Prioritization

**Current 6 Features:**
1. Auto Rate Calculation
2. Catch Discrepancies
3. Pension Tracking
4. AI Assistant
5. 30-Second Logging
6. Pay Stub Upload

**Recommended Priority Order (by user value):**

| Priority | Feature | Why |
|----------|---------|-----|
| 1 | Catch Pay Errors | Primary pain point - money |
| 2 | Auto Rate Calculation | Core functionality |
| 3 | Pension Tracking | High emotional value |
| 4 | Quick Logging | Low friction entry |
| 5 | AI Assistant | Differentiator |
| 6 | Pay Stub Upload | Pro feature teaser |

### 4.2 Feature vs Benefit Reframing

| Feature (Current) | Benefit (Recommended) |
|-------------------|----------------------|
| Auto Rate Calculation | "Never Google rates again - we know every job, shift, and differential" |
| Catch Discrepancies | "Caught an average of $340 for users last year - money left on the table" |
| Pension Tracking | "Know your pension date, not just hope for it" |
| AI Assistant | "Ask anything about rates, rules, or your patterns - instant answers" |
| 30-Second Logging | "Log shifts faster than checking your phone - smart defaults learn your jobs" |
| Pay Stub Upload | "Snap a photo, we check the math - find errors before they cost you" |

### 4.3 Visual Presentation Options

| Format | Pros | Cons |
|--------|------|------|
| Icon Cards (Current) | Clean, scannable | Less engaging |
| Screenshots | Real product preview | Needs great UI |
| Animated GIFs | Show functionality | Can slow page |
| Interactive Demo | Highest engagement | Complex to build |
| Before/After | Clear value | Requires design |

**Recommended Approach:**
1. Keep icon cards for mobile speed
2. Add "See it in action" link to each feature
3. Consider tabbed interface for detailed view
4. Add screenshot carousel for desktop

### 4.4 Feature Section Headlines to Test

| Version | Headline |
|---------|----------|
| A (Current) | "Everything You Need" |
| B | "Built for How You Actually Work" |
| C | "What 500+ Longshoremen Use Daily" |
| D | "The Tools We Wished We Had" |
| E | "Port-Specific. No Fluff. Just Works." |

---

## 5. Objection Handling

### 5.1 FAQ Section Content

Add an FAQ section above final CTA addressing these objections:

**Primary Objections:**

#### "Is it really free?"

**Answer Options:**

| Version | Copy |
|---------|------|
| A | "Yes, completely free to start. The free plan includes unlimited shift logging, rate calculations, and basic pension tracking. No credit card required, no trial that expires. Upgrade to Pro only if you want AI chat, pay stub reconciliation, and advanced analytics." |
| B | "100% free to try, forever free to use basic features. We make money when Pro users upgrade - not from your data, not from ads. Many users stay on Free and find it valuable." |
| C | "Free means free. Log unlimited shifts, get accurate rates, track your pension goal. Pro adds AI assistant and pay stub upload for $99/year - less than the average error we catch." |

#### "Is my data safe?"

**Answer Options:**

| Version | Copy |
|---------|------|
| A | "Your data is encrypted with the same security banks use. We never sell data, never share with employers, and never show your info to other users. You can export or delete everything anytime." |
| B | "Bank-level encryption. Zero data sharing. Your shifts, your data, your control. We're longshoremen too - we'd never put fellow workers at risk." |
| C | "Encrypted, private, and yours. We can't see your data, employers can't access it, and we never sell anything. Delete your account anytime and everything goes with it." |

#### "Does it work for my local/terminal?"

**Answer Options:**

| Version | Copy |
|---------|------|
| A | "We support all BC ILWU locals including Deltaport, Vanterm, Centennial, Fraser Surrey, and all grain terminals. 42 job types, every shift differential, every location-specific rule." |
| B | "If you work BC ports, we've got you covered. Deltaport TT Rail rates? Yes. Vanterm Head Checker subjobs? Yes. Wheat terminal differentials? Yes. We built this from real payroll data." |
| C | "All BC ILWU terminals, all 42 job classifications. Check the job you work - if we're missing something, message us and we'll add it within 48 hours." |

#### "How accurate is it?"

**Answer Options:**

| Version | Copy |
|---------|------|
| A | "Our rates are sourced directly from BCMEA rate sheets and validated against thousands of real paychecks. When rates change (like the April updates), we update the same day." |
| B | "99%+ accuracy based on official BCMEA rates. Users have caught over $12,000 in errors - not by guessing, but because our calculations matched the official rates their employer missed." |
| C | "We use the exact same rate tables as payroll. When they update, we update. If you ever find a rate we got wrong, Pro users get a free month and we fix it immediately." |

#### "I've used spreadsheets for years, why change?"

**Answer Options:**

| Version | Copy |
|---------|------|
| A | "Spreadsheets work until they don't - one wrong formula and you're off for months. We auto-update rates, track pension progress, and let you log shifts in 30 seconds from your phone." |
| B | "Your spreadsheet doesn't update when rates change in April. It doesn't alert you when you're $5k from pension. It doesn't catch calculation errors. We do." |
| C | "Keep your spreadsheet - export our data anytime. But try logging one week in PORTPAL and see how much easier it is when rates calculate automatically." |

### 5.2 Objection Handling Placement

**Recommended Locations:**

| Placement | Objection Type |
|-----------|---------------|
| Below hero CTA | "Free, no credit card" |
| Below pricing | "Is it really free?" FAQ |
| Near testimonials | Security/privacy badge |
| Sticky footer | "Questions? Chat with us" |
| Exit intent popup | Address abandonment reason |

### 5.3 Risk Reversal Messaging

Add these trust statements throughout the page:

- "14-day free trial - no credit card required"
- "Cancel anytime, no questions asked"
- "Export your data anytime"
- "Your data is never shared"
- "Money-back guarantee for annual subscribers"

---

## 6. CTA Strategy

### 6.1 Primary CTA Copy Variations

**Current:** "Get Early Access"

**Test Variations:**

| Version | CTA Copy | Psychology |
|---------|----------|------------|
| A (Current) | "Get Early Access" | Exclusivity |
| B | "Start Tracking Free" | Zero commitment |
| C | "See What You're Owed" | Curiosity + money |
| D | "Join 500+ Longshoremen" | Social proof |
| E | "Check My Pay Now" | Immediate action |
| F | "Get Started - It's Free" | Clarity |
| G | "Try PORTPAL Free" | Brand + free |

**Test Priority:**
1. A vs F (exclusivity vs clarity)
2. Winner vs C (add money angle)
3. Winner vs D (test social proof)

### 6.2 Secondary CTAs

| Location | Primary CTA | Secondary CTA |
|----------|-------------|---------------|
| Hero | "Get Early Access" | "Watch 60-sec Demo" |
| Pricing (Free) | "Get Started Free" | "Compare Plans" |
| Pricing (Pro) | "Start Free Trial" | "See All Features" |
| Final Section | "Open App" | "View Pricing" |
| Exit Intent | "Get Free Access" | "No thanks" |

### 6.3 Sticky CTA Implementation

**Mobile Sticky CTA:**
```
[Show after 50% scroll]
----------------------------------
| [PORTPAL Logo] Start Tracking Free [->] |
----------------------------------
[Disappear when near existing CTAs]
```

**Desktop Consideration:**
- Subtle sticky nav CTA rather than full bar
- Change nav "Open App" to "Start Free" on scroll

### 6.4 Exit Intent Strategy

**Trigger:** Mouse leaves viewport (desktop) or back button intent (mobile)

**Popup Content Options:**

| Version | Headline | Offer | CTA |
|---------|----------|-------|-----|
| A | "Before you go..." | Free shift logging calculator | "Try the Calculator" |
| B | "Wait - did you know?" | Average user finds $340 in errors | "Check Your Pay Free" |
| C | "One question" | Which terminal do you work? [Select] | "See Your Rates" |
| D | "Not ready yet?" | Get our free rate card PDF | "Send Rate Card" |

**Exit Intent Best Practices:**
- Show only once per session
- Easy to close (X button and "No thanks")
- Mobile: Use scroll-up or inactivity trigger instead
- Don't show to returning visitors who dismissed

---

## 7. A/B Test Roadmap

### 7.1 Test Hierarchy (High Impact First)

**Phase 1: Headlines (Weeks 1-4)**

| Test | Control | Variant | Success Metric | Sample Size |
|------|---------|---------|----------------|-------------|
| 1.1 | Current headline | Specific number headline | Email signup rate | 1,000 visitors |
| 1.2 | Winner of 1.1 | Speed + benefit headline | Email signup rate | 1,000 visitors |

**Phase 2: CTAs (Weeks 5-8)**

| Test | Control | Variant | Success Metric | Sample Size |
|------|---------|---------|----------------|-------------|
| 2.1 | "Get Early Access" | "Start Tracking Free" | Click-through rate | 1,000 visitors |
| 2.2 | Winner of 2.1 | "See What You're Owed" | Email signup rate | 1,000 visitors |

**Phase 3: Social Proof (Weeks 9-12)**

| Test | Control | Variant | Success Metric | Sample Size |
|------|---------|---------|----------------|-------------|
| 3.1 | Current stats | User-focused stats | Scroll depth + signup | 1,000 visitors |
| 3.2 | Text testimonials | Video testimonials | Time on page + signup | 1,000 visitors |

**Phase 4: Page Structure (Weeks 13-16)**

| Test | Control | Variant | Success Metric | Sample Size |
|------|---------|---------|----------------|-------------|
| 4.1 | Current layout | Problem section above features | Engagement + signup | 2,000 visitors |
| 4.2 | No FAQ | FAQ section added | Signup + bounce rate | 1,000 visitors |

### 7.2 Sample Size Calculator Reference

**For 95% confidence, 80% power:**

| Baseline Conversion | MDE (Minimum Detectable Effect) | Sample Size Per Variant |
|---------------------|--------------------------------|------------------------|
| 2% | 25% relative (2% -> 2.5%) | 12,500 |
| 2% | 50% relative (2% -> 3%) | 3,200 |
| 5% | 20% relative (5% -> 6%) | 7,500 |
| 5% | 50% relative (5% -> 7.5%) | 1,200 |

**Recommendation for PORTPAL:**
- Target 50% MDE minimum (need 10%+ improvement to matter)
- With ~1,000 visitors/month, each test takes 2-3 weeks
- Focus on high-impact tests only

### 7.3 Testing Tools

| Tool | Purpose | Cost |
|------|---------|------|
| Google Optimize | A/B testing | Free (sunsetting) |
| Optimizely | A/B testing | $$$$ |
| VWO | A/B testing | $$ |
| Unbounce | Landing pages + A/B | $$$ |
| PostHog | A/B + Analytics | Free tier |

**Recommendation:** Start with PostHog (free) or VWO (mid-tier)

---

## 8. Page Variations

### 8.1 Traffic Source Variations

| Source | Landing Page Focus | Headline Emphasis |
|--------|-------------------|-------------------|
| Google (organic) | Full page | Problem-aware |
| Google Ads | Streamlined, fast | Specific job type |
| Facebook | Social proof heavy | Peer validation |
| Reddit | Technical, detailed | No BS approach |
| Referral | Trust from friend | "Your friend uses this" |
| Email | Already interested | Quick to action |

### 8.2 Local-Specific Landing Pages

Create terminal-specific pages:

**/landing/deltaport**
- Headline: "Deltaport TT Drivers: Stop Losing Money on Rail Differentials"
- Features: TT Rail 9-hour shifts, Deltaport-specific rates
- Testimonials: Deltaport workers only

**/landing/vanterm**
- Headline: "Vanterm Workers: Every Head Checker Subjob. Every Rate."
- Features: HC subjob complexity, Vanterm terminals
- Testimonials: Vanterm workers

**/landing/grain**
- Headline: "Grain Terminal Specialists: Wheat Machine Rates Done Right"
- Features: Wheat differential tracking, grain terminal list
- Testimonials: Grain terminal workers

### 8.3 Referral Landing Page

**/landing/invite?ref=USER_ID**

| Section | Content |
|---------|---------|
| Badge | "Your friend [Name] invited you" |
| Headline | "[Name] has been tracking with PORTPAL" |
| Social Proof | "[Name]'s stats: X shifts logged, $Y errors caught" |
| Offer | "You both get 1 month Pro free when you sign up" |
| CTA | "Join [Name] on PORTPAL" |

### 8.4 Job Type Landing Pages

Create pages for high-volume job types:

| URL | Target |
|-----|--------|
| /landing/tractor-trailer | TT drivers |
| /landing/rtg | RTG operators |
| /landing/checker | Head checkers, dock checkers |
| /landing/first-aid | First aid workers |
| /landing/wheat | Wheat machine/specialty |

---

## 9. Mobile Optimization

### 9.1 Current Mobile Issues to Address

Based on the Landing.tsx code review:

| Issue | Current State | Recommendation |
|-------|--------------|----------------|
| Touch Targets | Good (buttons are full-width) | Maintain |
| Form Fields | Adequate size | Increase height to 48px min |
| Font Sizes | Responsive | Test readability |
| Scroll Depth | Unknown | Add tracking |
| Load Speed | Unknown | Test and optimize |

### 9.2 Mobile-Specific Optimizations

**Touch Target Standards:**
- All buttons: minimum 48x48px
- Link spacing: minimum 8px between
- Form fields: 48px height minimum
- Close buttons on popups: 44x44px minimum

**Thumb Zone Design:**
```
[Top - Hard to reach]
   Navigation, less critical actions

[Middle - Natural reach]
   Primary content, CTAs

[Bottom - Easy reach]
   Sticky CTA bar, navigation
```

**Recommended Mobile Layout Changes:**
1. Move primary CTA to bottom of hero (thumb reach)
2. Use bottom sheet for mobile menu
3. Sticky CTA bar at bottom after scroll
4. Reduce feature cards to 2 columns or single column

### 9.3 Load Speed Optimization

**Current Potential Issues:**
- Large hero video (if implemented)
- Multiple icon imports
- Font loading

**Optimizations:**
| Action | Impact | Implementation |
|--------|--------|----------------|
| Lazy load below-fold images | HIGH | React lazy loading |
| Compress hero image/video | HIGH | WebP format, compressed |
| Defer non-critical JS | MEDIUM | Script async/defer |
| Preload critical fonts | MEDIUM | Font preload links |
| Minimize icon bundle | LOW | Tree-shake Lucide |

**Target Metrics:**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1

### 9.4 Mobile-Specific Content

**Simplify for Mobile:**
- Reduce testimonials from 3 to 2 visible (with carousel)
- Collapse FAQ items by default
- Single column feature layout
- Shorter copy throughout

---

## 10. Analytics Setup

### 10.1 Event Tracking Requirements

**Critical Events:**

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `page_view` | Page load | `source`, `referrer`, `device` |
| `scroll_depth` | 25%, 50%, 75%, 100% scroll | `depth_percentage` |
| `cta_click` | Any CTA button | `button_text`, `location`, `variant` |
| `email_submit` | Form submission | `success`, `location` |
| `video_play` | Video play click | `video_name` |
| `video_complete` | Video finishes | `video_name`, `watch_time` |
| `pricing_view` | Pricing section in view | `time_on_page` |
| `faq_expand` | FAQ item clicked | `question` |
| `exit_intent` | Exit popup shown | `popup_variant` |
| `exit_intent_action` | Popup CTA clicked | `action` |

**Funnel Stages:**

```
Landing Page Visit
        |
        v
   [25% Scroll]
        |
        v
   [50% Scroll]
        |
        v
   [Pricing View]
        |
        v
   [CTA Click]
        |
        v
   [Email Submit]
        |
        v
   [App Open]
```

### 10.2 Heatmap & Session Recording Setup

**Recommended Tool:** Hotjar (free tier) or Microsoft Clarity (free)

**Heatmap Types to Monitor:**
| Type | What It Shows | Action |
|------|---------------|--------|
| Click Map | Where users click | Identify dead clicks, missed CTAs |
| Scroll Map | How far users scroll | Content prioritization |
| Move Map | Mouse movement | Attention patterns |
| Attention Map | Time spent per area | High/low interest zones |

**Session Recording Filters:**
- Sessions > 30 seconds
- Sessions that reached pricing section
- Sessions that submitted email
- Sessions with rage clicks (frustration)
- Mobile sessions only

### 10.3 Funnel Analysis Setup

**Primary Funnel: Landing to Signup**

```
Step 1: Page Load (100%)
   |
   v
Step 2: Scroll to Features (track %)
   |
   v
Step 3: Scroll to Pricing (track %)
   |
   v
Step 4: CTA Click (track %)
   |
   v
Step 5: Email Submit (track %)
   |
   v
Step 6: App Open (track %)
```

**Drop-off Analysis Questions:**
- Where do most users leave?
- Which traffic sources complete the funnel?
- Does mobile/desktop affect completion?
- Which page variant has best funnel completion?

### 10.4 Recommended Analytics Stack

| Tool | Purpose | Cost | Priority |
|------|---------|------|----------|
| **Google Analytics 4** | Core analytics | Free | MUST HAVE |
| **Hotjar** | Heatmaps + recordings | Free tier | HIGH |
| **PostHog** | Event tracking + A/B | Free tier | HIGH |
| **Google Tag Manager** | Tag management | Free | HIGH |
| **Microsoft Clarity** | Heatmaps (alternative) | Free | ALTERNATIVE |
| **Mixpanel** | Advanced analytics | $$ | LATER |

### 10.5 Weekly Reporting Dashboard

**Key Metrics to Track Weekly:**

| Metric | Target | Current |
|--------|--------|---------|
| Unique Visitors | Growth | TBD |
| Conversion Rate (email) | > 5% | TBD |
| Bounce Rate | < 50% | TBD |
| Avg Time on Page | > 2 min | TBD |
| Scroll Depth (avg) | > 75% | TBD |
| Mobile vs Desktop | Track | TBD |
| Top Traffic Sources | Track | TBD |
| CTA Click Rate | > 10% | TBD |

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)

- [ ] Set up Google Analytics 4
- [ ] Install Hotjar/Clarity for heatmaps
- [ ] Configure event tracking for all CTAs
- [ ] Establish baseline metrics
- [ ] Set up scroll depth tracking

### Phase 2: Quick Wins (Week 3-4)

- [ ] Add FAQ section addressing top objections
- [ ] Add trust badges near CTAs
- [ ] Optimize CTA button copy
- [ ] Add micro-copy below email form
- [ ] Implement sticky CTA for mobile

### Phase 3: Content (Week 5-8)

- [ ] Create demo video (30-60 sec)
- [ ] Collect more testimonials with photos
- [ ] Add testimonial video (optional)
- [ ] Update feature copy to benefit-focused
- [ ] Create terminal-specific landing pages

### Phase 4: Testing (Week 9+)

- [ ] Begin A/B test on headlines
- [ ] Test CTA variations
- [ ] Test social proof placement
- [ ] Implement exit intent popup
- [ ] Create referral landing page

---

## Appendix: Copy Swipe File

### Headlines Library

**Problem-Aware:**
- "Stop Leaving Money On the Table"
- "The Pay Errors You Don't Know About Are Costing You Thousands"
- "Why Are You Still Guessing If Your Pay Is Right?"

**Solution-Focused:**
- "Know Your Exact Pay Before the Check Arrives"
- "Every Rate. Every Differential. Every Time."
- "The Shift Tracker That Actually Gets Longshore Pay"

**FOMO/Social Proof:**
- "500+ Longshoremen Are Tracking Smarter. Are You?"
- "BC Port Workers Are Finding Pay Errors. Every Week."
- "What Mike Found In His First Month Will Shock You"

**Specific Numbers:**
- "The $340 Error That's Costing You Every Year"
- "42 Job Types. 24 Terminals. 1 App."
- "30 Seconds to Log. $1000s to Catch."

### Subheadline Library

**Feature-Focused:**
- "Auto rate calculation. Pay stub reconciliation. Pension tracking. Built for BC longshoremen."

**Benefit-Focused:**
- "Stop wrestling with spreadsheets. Start knowing exactly what you're owed."

**Social-Focused:**
- "Join 500+ BC longshoremen who stopped guessing and started knowing."

**Specific:**
- "From TT Rail to Wheat Machine - every job, every differential, every rule."

### CTA Library

**Low Commitment:**
- "Start Tracking Free"
- "Try It Free"
- "Get Started - It's Free"

**Action-Oriented:**
- "Check My Pay Now"
- "See What I'm Owed"
- "Calculate My Rates"

**Social Proof:**
- "Join 500+ Longshoremen"
- "Start Like Mike Did"

**Exclusivity:**
- "Get Early Access"
- "Join the Waitlist"

---

## Sources and References

Research conducted for this document included:

- [Unbounce: SaaS Landing Pages Best Practices](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/)
- [Fibr.ai: SaaS Landing Pages 2026](https://fibr.ai/landing-page/saas-landing-pages)
- [Reform: Mobile Landing Page Design Guide](https://www.reform.app/blog/mobile-landing-page-design-ultimate-guide)
- [Elementor: Mobile Landing Pages](https://elementor.com/blog/mobile-landing-page/)
- [OptinMonster: Exit Intent Popup Strategies](https://optinmonster.com/40-exit-popup-hacks-that-will-grow-your-subscribers-and-revenue/)
- [Hotjar: Website Heatmaps](https://www.hotjar.com/)
- [Optimizely: A/B Test Sample Size Calculator](https://www.optimizely.com/sample-size-calculator/)
- [LinkedIn: Objection Handling on Landing Pages](https://www.linkedin.com/advice/0/how-do-you-handle-objections-faqs-your-landing)
- [SeedProd: Landing Page Headline Formulas](https://www.seedprod.com/landing-page-headline-formulas/)
- [Unbounce: Call to Action Examples](https://unbounce.com/conversion-rate-optimization/call-to-action-examples/)

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Next Review: Monthly with A/B test results*
