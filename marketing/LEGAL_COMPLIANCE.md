# PORTPAL Legal and Compliance Research

> **DISCLAIMER**: This document is for informational purposes only and does not constitute legal advice. All items marked with [LAWYER REVIEW REQUIRED] should be reviewed by qualified legal counsel before implementation.

---

## Table of Contents

1. [Data Privacy](#1-data-privacy)
2. [Financial Regulations](#2-financial-regulations)
3. [Union Considerations](#3-union-considerations)
4. [App Store Compliance](#4-app-store-compliance)
5. [Terms of Service](#5-terms-of-service)
6. [Privacy Policy](#6-privacy-policy)
7. [Marketing Compliance](#7-marketing-compliance)
8. [Accessibility](#8-accessibility)
9. [International Considerations](#9-international-considerations)
10. [Action Items Summary](#10-action-items-summary)

---

## 1. Data Privacy

### 1.1 PIPEDA (Canada) - Primary Jurisdiction

**Applies to**: All Canadian users (BC port workers)

**Key Requirements**:

| Requirement | Details | Status |
|-------------|---------|--------|
| **Consent** | Must obtain clear, informed consent before collecting personal data | [IMPLEMENT] |
| **Purpose limitation** | Clearly explain why data is collected | [IMPLEMENT] |
| **Data minimization** | Collect only necessary information | [REVIEW] |
| **Access rights** | Users must be able to view, update, or delete their data | [IMPLEMENT] |
| **Security** | Encrypt data and use strong security measures | [IMPLEMENT] |
| **Privacy policy** | Must be easily accessible and understandable | [IMPLEMENT] |

**Upcoming Changes (2025-2026)**:
- Potential replacement with Consumer Privacy Protection Act (CPPA)
- Expected new features: data portability rights, stricter consent rules
- Penalties up to 5% of global revenue or $25 million CAD

**[LAWYER REVIEW REQUIRED]**: Monitor CPPA legislation progress and prepare for compliance

**Sources**:
- [PIPEDA Compliance Guide](https://capgo.app/blog/pipeda-compliance-for-mobile-apps-in-canada/)
- [Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)

---

### 1.2 GDPR (EU Workers)

**Applies to**: Any users physically located in the EU

**Likelihood**: Low for BC port workers, but possible for temporary residents

**Key Requirements if Applicable**:

| Requirement | Details |
|-------------|---------|
| Lawful basis | Consent, contract performance, or legitimate interest |
| Explicit consent | Pre-ticked boxes NOT compliant |
| Right to erasure | Users can request complete data deletion |
| Data portability | Users can export their data |
| DPO requirement | May need Data Protection Officer |

**Penalties**: Up to 20 million EUR or 4% of global annual revenue

**[LAWYER REVIEW REQUIRED]**: Determine if GDPR applies based on user base; implement geo-detection if needed

**Sources**:
- [GDPR Compliance for Apps](https://gdprlocal.com/gdpr-compliance-for-apps/)
- [GDPR HR Data Guide](https://www.dickinson-wright.com/news-alerts/the-gdpr-covers-employee-hr-data-and-tricky)

---

### 1.3 CCPA/CPRA (California Workers)

**Applies to**: California residents (any BC workers who are also CA residents)

**Threshold**: Businesses with $25.625 million+ revenue OR processing 100,000+ CA residents' data

**Key Requirements (Effective January 2026)**:

| Right | Description |
|-------|-------------|
| Right to know | What data is collected and why |
| Right to delete | Request data deletion |
| Right to opt-out | Of sale/sharing of personal information |
| Right to correct | Inaccurate information |
| Right to limit | Use of sensitive personal information |
| Non-discrimination | Cannot penalize users who exercise rights |

**Data Retention**: Must disclose specific timeframes (not "as long as necessary")

**Mobile App Requirement**: Privacy policy link MUST be in app settings menu

**[LAWYER REVIEW REQUIRED]**: Determine if CCPA thresholds are met; prepare data retention schedule

**Sources**:
- [CCPA Privacy Policy Requirements 2025](https://secureprivacy.ai/blog/ccpa-privacy-policy-requirements-2025)
- [CCPA Employee Data Requirements](https://www.redactable.com/blog/ccpa-employer-requirements-what-hr-departments-should-know)

---

### 1.4 Data We Collect

| Data Type | Purpose | Sensitivity | Consent Required |
|-----------|---------|-------------|------------------|
| Name | Account identification | Personal | Yes |
| Email | Authentication, notifications | Personal | Yes |
| Shift data (dates, times) | Pay tracking | Employment-related | Yes |
| Job/location/subjob | Pay calculation | Employment-related | Yes |
| Pay rates entered | Calculation, validation | Sensitive financial | Yes |
| Pay stubs (if uploaded) | Verification | Highly sensitive | Explicit consent |
| Device information | App functionality | Technical | Implied (with disclosure) |

**[LAWYER REVIEW REQUIRED]**: Finalize data inventory and map to consent requirements

---

### 1.5 Consent Implementation

**Required Consent Mechanisms**:

1. **First launch consent**: Clear explanation of data use before account creation
2. **Granular opt-ins**: Separate consent for:
   - Core app functionality
   - Analytics/usage data
   - Marketing communications
   - Data sharing with third parties (if any)
3. **Easy withdrawal**: One-tap opt-out for non-essential data collection
4. **Consent records**: Log when/how consent was obtained

**Consent Language Example**:
```
"PORTPAL collects your shift information, including dates, hours,
job types, and pay rates you enter, to help you track and verify
your earnings. This data is stored securely and is not shared with
your employer, union, or any third parties without your explicit
permission. You can delete your data at any time."
```

---

## 2. Financial Regulations

### 2.1 Are We Giving "Financial Advice"?

**Short Answer**: No, but disclaimers are critical.

**Analysis**:

| What We Do | Classification | Risk Level |
|------------|----------------|------------|
| Calculate expected pay based on rates | **Informational tool** | Low |
| Compare entered pay to expected pay | **Calculation service** | Low |
| Suggest discrepancies exist | **Informational** | Medium |
| Recommend user take action | **Could be construed as advice** | Higher |

**Key Distinction**: We are providing calculations and comparisons, NOT personalized financial advice about investments, savings, or financial planning.

**[LAWYER REVIEW REQUIRED]**: Confirm that pay calculation tools are exempt from financial advisor regulations

---

### 2.2 Required Disclaimers

**Calculator Disclaimer** (display before any calculation):
```
DISCLAIMER: PORTPAL provides pay calculations for informational
purposes only. These calculations are based on published BCMEA
rate schedules and user-entered data. Results are estimates and
may not reflect your actual pay. PORTPAL does not provide
financial, legal, or employment advice. Always verify discrepancies
with your employer or union representative before taking action.
```

**Pay Discrepancy Disclaimer**:
```
This comparison is for informational purposes only and should
not be relied upon as an accurate determination of pay errors.
Actual pay may vary based on factors not captured in this app.
Consult your collective agreement, employer, or union for
official pay verification.
```

**No Liability Clause**:
```
PORTPAL and its developers accept no liability whatsoever for
losses, damages, or adverse outcomes arising from reliance on
calculations provided by this app. Users are responsible for
verifying all pay information through official channels.
```

**[LAWYER REVIEW REQUIRED]**: Draft jurisdiction-specific disclaimer language

---

### 2.3 Pay Calculation Liability

**Risk Factors**:

| Scenario | Risk | Mitigation |
|----------|------|------------|
| Incorrect rate data | User acts on wrong info | Disclaimer + rate update notifications |
| Calculation errors | Financial harm claims | Testing + disclaimer + error reporting |
| Outdated rates | Misleading results | Version tracking + expiration warnings |
| User enters wrong data | Blame shifts to app | Input validation + confirmation screens |

**[LAWYER REVIEW REQUIRED]**: Draft limitation of liability clause specific to pay calculation errors

---

## 3. Union Considerations

### 3.1 BCMEA/ILWU Collective Agreement Context

**Current Agreement**: 2023-2027 BCMEA-ILWU Canada Collective Bargaining Agreement

**Relevant Unions**:
- ILWU Locals 500, 502, 505, 508, 519 (7,400+ longshore workers)
- ILWU Local 514 (730+ foremen)

**Sources**:
- [BCMEA-ILWU Collective Agreement](https://www.bcmaritime.com/wp-content/uploads/2025/04/2023-2027-BCMEA-ILWU-Canada-CBA-Final-for-Print-3.0.pdf)
- [CBC Coverage of 2023 Agreement](https://www.cbc.ca/news/canada/british-columbia/b-c-port-dispute-terms-1.6931151)

---

### 3.2 Can We Partner with Unions?

**Considerations**:

| Approach | Pros | Cons | Risk Level |
|----------|------|------|------------|
| Official union endorsement | Credibility, distribution | Political complexity, exclusivity | Medium |
| Informal worker recommendation | Organic growth | Slower adoption | Low |
| Use collective agreement data | Accuracy | May require permission | Medium |
| Display union resources | Helpful to users | Could be seen as advocacy | Low |

**Union Data Privacy Policies**: PSAC (and likely ILWU) will not distribute personal information to third parties without consent.

**[LAWYER REVIEW REQUIRED]**:
- Review collective agreement for any restrictions on third-party apps
- Determine if using published pay rates requires permission
- Assess risks/benefits of formal union partnership

---

### 3.3 Restrictions on Third-Party Apps

**Potential Concerns**:

| Issue | Description | Mitigation |
|-------|-------------|------------|
| Employer monitoring | App could be seen as surveillance | Clear policy that employer has no access |
| Data sharing | Union concerns about member data | Strong privacy policy |
| Grievance interference | App advice conflicting with union process | Defer to union for disputes |
| Collective agreement interpretation | Unauthorized interpretation | Disclaimer that app is not official |

**Recommended Approach**:
```
"PORTPAL is an independent tool and is not affiliated with,
endorsed by, or connected to BCMEA, ILWU, or any employer.
For official pay disputes, contact your union representative
or refer to your collective agreement."
```

---

## 4. App Store Compliance

### 4.1 Apple App Store (iOS)

**Relevant Guidelines**:

| Guideline | Requirement | PORTPAL Compliance |
|-----------|-------------|-------------------|
| 3.1.1 In-App Purchase | Subscriptions must use Apple IAP | Use Apple IAP for subscriptions |
| 3.1.2 Subscriptions | Must provide ongoing value | Ensure continuous value delivery |
| 5.1 Privacy | Privacy policy required | Implement comprehensive policy |
| 5.1.1 Data Collection | Minimize data collection | Collect only necessary data |
| 5.1.2 Data Use | Disclose third-party data use | Document all data sharing |

**Subscription Requirements**:
- Minimum 7-day subscription period
- Clear disclosure of auto-renewal
- Price must be clearly stated before purchase
- Easy cancellation process

**Financial App Considerations**:
- Not classified as a "loan app" (no 36% APR restrictions apply)
- Not providing investment advice (no SEC/FINRA implications)

**Upcoming (Feb 2025)**:
- South Korea: Additional auto-renewal consent required for trials/offers

**[LAWYER REVIEW REQUIRED]**: Review Apple Developer Program License Agreement Schedule 2

**Sources**:
- [Apple Auto-renewable Subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

### 4.2 Google Play Store (Android)

**Key Policies**:

| Policy | Requirement | PORTPAL Compliance |
|--------|-------------|-------------------|
| Financial Features Declaration | Must complete for all apps | Complete declaration |
| Subscription Policy | Clear disclosure of terms | Implement clear UI |
| Privacy Policy | Required and accessible | Link in app and listing |
| User Data | Transparent collection practices | Implement data safety section |

**Financial Services Exemption**: Pay calculators and employment tracking apps are NOT required to use Google Play Billing (unlike digital goods subscriptions).

**October 2025 US Changes**: Alternative billing now permitted in US, but Google Play Billing still recommended for simplicity.

**[LAWYER REVIEW REQUIRED]**: Complete Financial Features Declaration accurately

**Sources**:
- [Google Play Financial Features Declaration](https://support.google.com/googleplay/android-developer/answer/13849271)
- [Google Play Payments Policy](https://support.google.com/googleplay/android-developer/answer/10281818)

---

### 4.3 Subscription Disclosure Requirements

**Both Platforms Require**:

1. **Before Purchase**:
   - Clear price display
   - Subscription duration
   - Auto-renewal notice
   - Free trial terms (if applicable)

2. **In-App**:
   - Easy access to subscription management
   - Clear cancellation instructions
   - Current subscription status

3. **New York State (2025)**:
   - Enhanced refund rights for auto-renewals
   - Additional disclosure requirements

**Recommended Disclosure Text**:
```
"PORTPAL Premium - $X.XX/month
- Subscription automatically renews monthly
- Cancel anytime in app settings or [App Store/Play Store]
- Free trial: [X] days, then $X.XX/month
- Payment charged to [payment method] at confirmation
- Renewal charge within 24 hours before period ends"
```

**Sources**:
- [Auto-Renewal Laws Compliance](https://appbot.co/blog/auto-renewal-laws-app-devs-subscription-compliance/)

---

## 5. Terms of Service

### 5.1 Key Clauses Required

**[LAWYER REVIEW REQUIRED]**: All Terms of Service language requires legal review

| Clause | Purpose | Priority |
|--------|---------|----------|
| **Acceptance of Terms** | Establish binding agreement | Critical |
| **Eligibility** | Age requirements, jurisdiction | Critical |
| **Account Responsibilities** | User obligations | Critical |
| **Intellectual Property** | Protect app IP | Critical |
| **User Content** | Rights to user-entered data | Critical |
| **Prohibited Uses** | Restrict misuse | Important |
| **Limitation of Liability** | Limit financial exposure | Critical |
| **Disclaimer of Warranties** | "As-is" provision | Critical |
| **Indemnification** | User protects us from claims | Important |
| **Dispute Resolution** | How conflicts are resolved | Critical |
| **Termination** | When/how accounts end | Important |
| **Modification of Terms** | How terms can change | Important |
| **Governing Law** | Which jurisdiction applies | Critical |
| **Severability** | Invalid clauses don't void all | Standard |
| **Contact Information** | How to reach us | Required |

---

### 5.2 Limitation of Liability Clause

**Draft Language** (requires legal review):

```
LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
SHALL PORTPAL, ITS AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS
BE LIABLE FOR:

(a) ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
    DAMAGES;
(b) ANY LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES;
(c) ANY DAMAGES ARISING FROM YOUR RELIANCE ON PAY CALCULATIONS,
    RATE INFORMATION, OR DISCREPANCY NOTIFICATIONS PROVIDED BY
    THE APP;
(d) ANY ACTIONS TAKEN OR NOT TAKEN BASED ON INFORMATION PROVIDED
    BY THE APP;
(e) ANY ERRORS, OMISSIONS, OR INACCURACIES IN PAY RATE DATA OR
    CALCULATIONS.

YOU EXPRESSLY UNDERSTAND AND AGREE THAT YOUR USE OF THE APP IS
AT YOUR SOLE RISK. THE APP IS PROVIDED ON AN "AS IS" AND "AS
AVAILABLE" BASIS.

OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE
OF THE APP SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE
(12) MONTHS PRECEDING THE CLAIM.
```

**[LAWYER REVIEW REQUIRED]**: Ensure enforceability in BC/Canada jurisdiction

---

### 5.3 User Content Ownership

**Recommended Approach**:

```
USER CONTENT AND DATA OWNERSHIP

1. YOUR DATA REMAINS YOURS: You retain all ownership rights to
   the shift data, pay information, and other content you enter
   into PORTPAL ("User Content").

2. LICENSE GRANT: By using PORTPAL, you grant us a limited,
   non-exclusive, royalty-free license to use, process, and
   display your User Content solely for the purpose of providing
   and improving our services to you.

3. NO SALE OF DATA: We will not sell your User Content to third
   parties or share it with your employer, union, or other
   entities without your explicit consent.

4. AGGREGATED DATA: We may use anonymized, aggregated data
   (which cannot identify you) to improve our services and
   for statistical purposes.

5. DATA DELETION: You may request deletion of your User Content
   at any time through the app settings or by contacting us.
```

**Sources**:
- [Mobile App Terms and Conditions Template](https://termly.io/resources/templates/app-terms-and-conditions/)
- [TermsFeed Mobile App Terms](https://www.termsfeed.com/blog/sample-mobile-app-terms-conditions-template/)

---

### 5.4 Dispute Resolution

**Options**:

| Method | Pros | Cons |
|--------|------|------|
| Arbitration | Faster, cheaper, private | May limit user rights |
| Mediation first | Less adversarial | May not resolve |
| Court litigation | Full legal process | Expensive, slow |
| Small claims carve-out | User-friendly | Limited to small amounts |

**Recommended Approach**:
```
Any dispute arising from these Terms or your use of PORTPAL shall
be governed by the laws of British Columbia, Canada. You agree to
attempt to resolve any dispute informally by contacting us first.
If informal resolution fails, disputes shall be submitted to
binding arbitration in Vancouver, BC, except that either party
may bring claims in small claims court if eligible.
```

**[LAWYER REVIEW REQUIRED]**: Review arbitration clause enforceability and class action waiver legality in Canada

---

## 6. Privacy Policy

### 6.1 Required Disclosures

**PIPEDA/CCPA/GDPR Comprehensive Requirements**:

| Section | Contents |
|---------|----------|
| **Identity** | Who we are, contact information |
| **Data collected** | Categories of personal information |
| **Sources** | Where we get data (user input, device, etc.) |
| **Purposes** | Why we collect each data type |
| **Legal basis** | Consent, contract, legitimate interest |
| **Sharing** | Third parties who receive data |
| **Retention** | How long we keep each data type |
| **Security** | How we protect data |
| **Rights** | Access, correction, deletion, portability |
| **Cookies/tracking** | What tracking technologies we use |
| **Children** | We don't knowingly collect from children |
| **Changes** | How we notify of policy updates |
| **Contact** | How to reach us with questions |

---

### 6.2 Data Retention Schedule

**[LAWYER REVIEW REQUIRED]**: Finalize retention periods

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Account information | Until account deletion + 2 years | Legal compliance |
| Shift data | Until deletion or 7 years | Tax/employment records |
| Pay calculations | Until deletion or 3 years | Dispute resolution |
| Support communications | 3 years | Service improvement |
| Analytics data | 2 years (anonymized) | Product improvement |
| Payment records | 7 years | Financial regulations |

---

### 6.3 Third-Party Sharing

**Be Explicit About**:

| Third Party | Data Shared | Purpose |
|-------------|-------------|---------|
| Cloud provider (e.g., AWS, Bubble) | All data | Storage and processing |
| Payment processor (Stripe/Apple/Google) | Payment info | Subscription billing |
| Analytics (if used) | Usage data | App improvement |
| Error tracking (if used) | Crash reports | Bug fixing |

**Required Statement**:
```
We DO NOT share your personal data with:
- Your employer (BCMEA member companies)
- Your union (ILWU or locals)
- Government agencies (unless legally required)
- Advertisers or data brokers
```

---

### 6.4 Sample Privacy Policy Outline

```
PORTPAL PRIVACY POLICY
Last Updated: [Date]

1. INTRODUCTION
2. INFORMATION WE COLLECT
   - Information you provide
   - Information collected automatically
3. HOW WE USE YOUR INFORMATION
4. LEGAL BASIS FOR PROCESSING (GDPR)
5. DATA SHARING AND DISCLOSURE
6. DATA RETENTION
7. DATA SECURITY
8. YOUR PRIVACY RIGHTS
   - Access and portability
   - Correction
   - Deletion
   - Opt-out
9. INTERNATIONAL DATA TRANSFERS
10. CHILDREN'S PRIVACY
11. CHANGES TO THIS POLICY
12. CONTACT US
```

**Sources**:
- [CCPA Privacy Policy Requirements 2025](https://secureprivacy.ai/blog/ccpa-privacy-policy-requirements-2025)
- [Mobile App Compliance 2025](https://www.didomi.io/blog/mobile-app-compliance-2025)

---

## 7. Marketing Compliance

### 7.1 FTC Testimonial and Endorsement Rules

**Key Requirements**:

| Requirement | Details |
|-------------|---------|
| Honest opinions | Testimonials must reflect genuine experience |
| Material connections | Disclose if reviewer was paid/given free access |
| Typical results | Can't cherry-pick exceptional results |
| Clear disclosures | "Ad" or "Sponsored" must be prominent |
| No fake reviews | Cannot create or purchase fake reviews |

**For PORTPAL**:
- If users provide testimonials, disclose if they received free premium access
- Don't imply all users recover specific dollar amounts
- Don't sort/display only positive reviews

**Sources**:
- [FTC Endorsement Guides](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)
- [16 CFR Part 255](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255)

---

### 7.2 Earnings/Savings Claims

**HIGH RISK AREA** - Even if avoiding explicit claims

**DO NOT**:
- "Users save an average of $X per year"
- "Recover $X in underpaid wages"
- "Most users find discrepancies worth $X"

**ACCEPTABLE** (with disclaimers):
- "Track your shifts and verify your pay"
- "Compare your pay to published BCMEA rates"
- "Get alerts when entered pay differs from expected calculations"

**Required Disclaimer** (if any savings mentioned):
```
"Results vary. PORTPAL helps you compare your pay to published
rates but does not guarantee you will find discrepancies or
recover any specific amount. Individual results depend on many
factors including accuracy of data entered and actual employment
circumstances."
```

**[LAWYER REVIEW REQUIRED]**: Review all marketing materials for implied earnings claims

---

### 7.3 Competitor Comparison Rules

**FTC Position**: Comparative advertising is PERMITTED and even encouraged if:
- Claims are truthful
- Comparisons are clearly identified
- Substantiation exists for all claims

**Allowed**:
- "Unlike spreadsheets, PORTPAL automatically calculates differentials"
- "Compares to manual tracking methods"

**Caution**:
- Naming specific competitor apps (could trigger trademark or NAD challenges)
- "Better than [Competitor]" without substantiation

**Canada (Competition Bureau)**: Similar truthfulness requirements

**Sources**:
- [FTC Comparative Advertising Policy](https://www.ftc.gov/legal-library/browse/statement-policy-regarding-comparative-advertising)
- [Comparative Advertising Guidelines](https://www.luthor.ai/blog-post/ftc-comparative-advertising)

---

### 7.4 Social Media Marketing

**Platform-Specific Requirements**:

| Platform | Disclosure Format |
|----------|-------------------|
| Instagram | #ad or "Paid Partnership" tag |
| Facebook | Branded content tool |
| TikTok | "Promotional Content" disclosure |
| Twitter/X | #ad clearly visible |

**For User-Generated Content**:
- If incentivizing posts (free premium, contests), users must disclose
- Monitor for false claims made by enthusiastic users

---

## 8. Accessibility

### 8.1 ADA Compliance (US Users)

**Legal Landscape**:
- Private apps in "gray area" but lawsuits increasing
- Best practice: Follow WCAG 2.1 Level AA

**Key Requirements**:

| Criterion | Requirement |
|-----------|-------------|
| Text contrast | 4.5:1 for normal text, 3:1 for large text |
| Touch targets | Minimum 44x44 pixels |
| Screen reader | All content accessible via VoiceOver/TalkBack |
| Orientation | Support both portrait and landscape |
| Motion | Respect reduced motion preferences |
| Focus indicators | Visible keyboard focus |

**Sources**:
- [ADA.gov Web Rule](https://www.ada.gov/resources/2024-03-08-web-rule/)
- [WCAG 2.2 Compliance Guide](https://www.allaccessible.org/blog/wcag-22-complete-guide-2025)

---

### 8.2 WCAG 2.1 AA Checklist for Mobile

**Priority Implementation**:

| Feature | WCAG Criterion | Implementation |
|---------|----------------|----------------|
| Color contrast | 1.4.3, 1.4.11 | Use contrast checker tools |
| Text alternatives | 1.1.1 | Alt text for all images |
| Keyboard accessible | 2.1.1 | All functions via keyboard |
| Touch target size | 2.5.5 | Minimum 44x44 CSS pixels |
| Orientation | 1.3.4 | Don't restrict to single orientation |
| Error identification | 3.3.1 | Clear error messages |
| Labels | 1.3.1, 3.3.2 | Programmatic labels for inputs |

---

### 8.3 Recommended Accessibility Features

| Feature | Benefit | Priority |
|---------|---------|----------|
| Dark mode | Reduces eye strain, OLED battery | High |
| Font size adjustment | Vision impairment support | High |
| Voice input | Hands-free data entry | Medium |
| High contrast mode | Low vision users | Medium |
| Screen reader optimization | Blind users | High |
| Haptic feedback | Confirmation without visual | Medium |

**[LAWYER REVIEW REQUIRED]**: Assess accessibility lawsuit risk and prioritize remediation

---

## 9. International Considerations

### 9.1 Expansion to Other Countries

**Complexity Factors**:

| Country | Privacy Law | Employment Law | Language | Currency |
|---------|-------------|----------------|----------|----------|
| USA | CCPA + state laws | Federal + state | English | USD |
| Australia | Privacy Act | Fair Work Act | English | AUD |
| UK | UK GDPR | Employment Rights Act | English | GBP |
| EU | GDPR | Varies by country | Multiple | EUR |

**Recommendation**: Focus on Canada/BC initially; international expansion requires significant legal investment.

---

### 9.2 Multi-Currency Considerations

**If Expanding**:
- Pay rates in local currency
- Subscription pricing in local currency
- Tax compliance per jurisdiction (VAT, GST)

**Technical Requirements**:
- Currency conversion tracking
- Localized rate tables per jurisdiction
- Country-specific collective agreements

---

### 9.3 Tax Implications

| Jurisdiction | Tax Type | Threshold |
|--------------|----------|-----------|
| Canada | GST/HST | $30,000 CAD revenue |
| USA | Sales tax | Varies by state (economic nexus) |
| EU | VAT | Country-specific thresholds |
| Australia | GST | $75,000 AUD revenue |

**App Store Handling**: Apple and Google handle VAT/GST for most digital goods, but verify compliance.

**[LAWYER REVIEW REQUIRED]**: Engage tax professional before international expansion

---

## 10. Action Items Summary

### Immediate (Before Launch)

| Item | Owner | Status |
|------|-------|--------|
| Draft Privacy Policy | Legal counsel | [LAWYER REVIEW REQUIRED] |
| Draft Terms of Service | Legal counsel | [LAWYER REVIEW REQUIRED] |
| Implement consent flows | Development | [IMPLEMENT] |
| Add calculator disclaimers | Development | [IMPLEMENT] |
| Complete App Store declarations | Product | [DO NOW] |
| Accessibility audit | QA | [DO NOW] |
| Review marketing materials | Marketing | [REVIEW] |

### Before Subscription Launch

| Item | Owner | Status |
|------|-------|--------|
| Auto-renewal disclosures | Development | [IMPLEMENT] |
| Payment processor compliance | Finance | [VERIFY] |
| Refund policy documentation | Support | [DRAFT] |

### Ongoing

| Item | Frequency |
|------|-----------|
| Privacy policy review | Annual minimum |
| Terms of Service review | Annual minimum |
| BCMEA rate table updates | As published (typically April) |
| Regulatory monitoring | Quarterly |
| Accessibility testing | Each major release |

---

## Appendix A: Disclaimer Templates

### In-App Calculator Disclaimer
```
IMPORTANT: Calculations are estimates based on published BCMEA
rates and data you provide. Results are for informational
purposes only and do not constitute financial or legal advice.
Actual pay may vary. Verify discrepancies with your employer
or union representative.
```

### App Store Description Disclaimer
```
PORTPAL is an independent shift tracking and pay calculation
tool. It is not affiliated with BCMEA, ILWU, or any employer.
Calculations are estimates only. Always verify pay with
official sources.
```

### Marketing Materials Disclaimer
```
*Results vary based on individual circumstances and accuracy
of data entered. PORTPAL does not guarantee specific savings
or outcomes.
```

---

## Appendix B: Regulatory Contacts

| Agency | Jurisdiction | Website |
|--------|--------------|---------|
| Office of the Privacy Commissioner | Canada | priv.gc.ca |
| California Privacy Protection Agency | California | cppa.ca.gov |
| Information Commissioner's Office | UK | ico.org.uk |
| FTC | USA | ftc.gov |
| Apple App Review | iOS | developer.apple.com |
| Google Play Policy | Android | play.google.com/console |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-01 | Compliance Agent | Initial research compilation |

---

**FINAL NOTE**: This document represents preliminary research only. Before implementing any legal policies, disclaimers, or compliance measures, consult with qualified legal counsel familiar with Canadian privacy law, employment law, and mobile app regulations.
