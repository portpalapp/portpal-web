# PORTPAL Statistical Analysis Report

**Analysis Date:** February 1, 2026
**Data Period:** August 16, 2023 - February 16, 2026 (shift dates)
**App Activity Period:** December 9, 2024 - January 31, 2026 (creation dates)
**Analyst:** Statistical Analysis Engine

---

## Executive Summary

This report presents a comprehensive statistical analysis of 71,712 shift records from 752 unique users of the PORTPAL shift-tracking application. Key findings reveal a highly engaged power user base driving the majority of activity, statistically significant predictors of user retention, and validation of the pay rate complexity that PORTPAL addresses.

### Key Metrics at a Glance

| Metric | Value |
|--------|-------|
| Total Shifts Logged | 71,712 |
| Valid Shifts (with job & pay) | 68,023 |
| Unique Users | 752 |
| Unique Jobs | 42 |
| Unique Locations | 24 |
| Median Shifts per User | 58.5 |
| 30-Day Retention | 67.9% |
| 90-Day Retention | 62.5% |

---

## 1. Descriptive Statistics

### 1.1 Shifts Per User

| Statistic | Value |
|-----------|-------|
| Mean | 95.36 |
| Median | 58.50 |
| Mode | 1 |
| Standard Deviation | 98.18 |
| Minimum | 1 |
| Maximum | 356 |
| Skewness | 0.839 |
| Kurtosis | -0.478 |

**Percentile Distribution:**

| Percentile | Shifts |
|------------|--------|
| 25th | 8 |
| 50th (Median) | 58.5 |
| 75th | 165.25 |
| 90th | 242.90 |
| 99th | 340.98 |

**Interpretation:** The distribution shows moderate positive skewness (0.839), indicating more users with lower shift counts and a tail of highly active users. The mode of 1 shift is concerning - many users try the app once and do not return.

### 1.2 Total Pay Per Shift

| Statistic | Value |
|-----------|-------|
| Mean | $578.39 |
| Median | $562.56 |
| Mode | $442.40 |
| Standard Deviation | $381.94 |
| Minimum | $4.22 |
| Maximum | $67,176.86 |
| Skewness | 150.08 |
| Kurtosis | 25,716.26 |

**Percentile Distribution:**

| Percentile | Pay |
|------------|-----|
| 25th | $492.38 |
| 50th (Median) | $562.56 |
| 75th | $650.25 |
| 90th | $715.84 |
| 99th | $932.06 |

**Interpretation:** Extreme positive skewness (150.08) and kurtosis (25,716) indicate significant outliers. The maximum of $67,176.86 is likely a data entry error. The interquartile range ($492-$650) represents typical shift pay values.

### 1.3 Hours Per Shift

| Metric | Regular Hours | Overtime Hours | Total Hours |
|--------|---------------|----------------|-------------|
| Mean | 7.84 | 0.27 | 8.11 |
| Median | 8.00 | 0.00 | 8.00 |
| Mode | 8.0 | 0.0 | 8.0 |
| Std Dev | 4.15 | 0.71 | 4.21 |

**Key Observation:** 25.3% of shifts include overtime hours.

### 1.4 Distribution Normality Testing

**Shapiro-Wilk Test Results:**

| Variable | W-statistic | p-value | Conclusion |
|----------|-------------|---------|------------|
| Pay per Shift | 0.9064 | 4.22e-48 | NOT normally distributed |
| Shifts per User | 0.8587 | 2.03e-25 | NOT normally distributed |

Both distributions significantly deviate from normality (p < 0.001), requiring non-parametric methods for certain analyses.

### 1.5 Box Plot Summary Data

**Shifts Per User:**
```
       Min    Q1    Median    Q3    Max
       1      8     58.5      165.25   356

       IQR = 157.25
       Lower fence: -227.88 (use 1)
       Upper fence: 401.13
```

**Pay Per Shift:**
```
       Min      Q1       Median    Q3       Max
       $4.22    $492.38  $562.56   $650.25  $67,176.86

       IQR = $157.87
       Lower fence: $255.58
       Upper fence: $887.06

       Values above $887.06 are statistical outliers
```

---

## 2. User Segmentation Analysis

### 2.1 Activity-Based Segments

| Segment | Users | % of Users | % of Shifts | Mean Shifts | Mean Tenure (days) | Mean Total Pay |
|---------|-------|------------|-------------|-------------|-------------------|----------------|
| Power User (100+ shifts) | 305 | 40.6% | 84.7% | 199.08 | 343.59 | $114,324.84 |
| Regular (21-100 shifts) | 173 | 23.0% | 12.8% | 53.05 | 185.15 | $29,752.16 |
| Light (6-20 shifts) | 120 | 16.0% | 2.1% | 12.32 | 60.90 | $6,862.43 |
| Trial (2-5 shifts) | 86 | 11.4% | 0.4% | 3.05 | 10.08 | $1,862.87 |
| One-Time (1 shift) | 68 | 9.0% | 0.1% | 1.00 | 0.00 | $538.04 |

**Key Insight:** The Pareto principle is strongly evident - 40.6% of users (Power Users) generate 84.7% of all shift logs.

### 2.2 K-Means Behavioral Clustering

**Methodology:** K-means clustering with k=4 on standardized features: total_shifts, job_variety, location_variety, night_shift_ratio, tenure_days.

**Elbow Analysis (Inertia by Cluster Count):**

| k | Inertia |
|---|---------|
| 2 | 2105.97 |
| 3 | 1688.86 |
| 4 | 1396.42 |
| 5 | 1213.80 |
| 6 | 1064.03 |
| 7 | 979.54 |

**Cluster Profiles (k=4):**

| Cluster | n | Mean Shifts | Std Dev | Night Ratio | Mean Tenure | Mean Pay |
|---------|---|-------------|---------|-------------|-------------|----------|
| 0 | 117 | 207.06 | 81.69 | 0.45 | 342.86 | $120,864.97 |
| 1 | 187 | 16.94 | 22.66 | 0.89 | 46.91 | $10,328.99 |
| 2 | 176 | 16.06 | 22.84 | 0.08 | 48.89 | $8,876.96 |
| 3 | 272 | 152.53 | 78.55 | 0.39 | 321.72 | $86,034.62 |

**Cluster Interpretations:**
- **Cluster 0 (n=117):** "Super Power Users" - Highest engagement, balanced shift types
- **Cluster 1 (n=187):** "Night Shift Specialists" - Low-moderate engagement, predominantly night/graveyard shifts (89% night ratio)
- **Cluster 2 (n=176):** "Day Shift Specialists" - Low-moderate engagement, predominantly day shifts (8% night ratio)
- **Cluster 3 (n=272):** "Established Regulars" - High engagement, long tenure, balanced shifts

---

## 3. Retention Cohort Analysis

### 3.1 Cohort Retention Matrix

**Monthly Retention Rates (% of users active in each subsequent month):**

| Cohort | M0 | M1 | M2 | M3 | M4 | M5 |
|--------|-----|-----|-----|-----|-----|-----|
| 2025-02 | 100% | 50.9% | 47.2% | 52.8% | 49.1% | 54.7% |
| 2025-03 | 100% | 50.0% | 53.3% | 46.7% | 46.7% | 50.0% |
| 2025-04 | 100% | 73.2% | 56.1% | 63.4% | 58.5% | 53.7% |
| 2025-05 | 100% | 71.2% | 67.8% | 64.4% | 64.4% | 59.3% |
| 2025-06 | 100% | 74.3% | 60.0% | 54.3% | 51.4% | 51.4% |
| 2025-07 | 100% | 75.6% | 68.3% | 56.1% | 61.0% | 65.9% |
| 2025-08 | 100% | 60.9% | 56.5% | 52.2% | 43.5% | 43.5% |
| 2025-09 | 100% | 66.7% | 54.2% | 62.5% | 58.3% | - |
| 2025-10 | 100% | 83.3% | 41.7% | 41.7% | - | - |
| 2025-11 | 100% | 72.2% | 66.7% | - | - | - |
| 2025-12 | 100% | 81.8% | - | - | - | - |
| 2026-01 | 100% | 4.9% | - | - | - | - |

**Note:** January 2026 shows very low M1 retention (4.9%) because the analysis date is early February and most users haven't had 30 days to return.

### 3.2 Average Retention by Month

| Months Since Signup | Average Retention |
|--------------------|-------------------|
| Month 0 | 100.0% |
| Month 1 | 62.8% |
| Month 2 | 50.4% |
| Month 3 | 49.9% |
| Month 4 | 45.5% |
| Month 5 | 40.2% |
| Month 6 | 46.0% |

**Key Observation:** Largest drop occurs between Month 0 and Month 1 (-37.2 percentage points). Users who make it past Month 3 tend to stabilize.

### 3.3 30/60/90 Day Retention

| Window | Retention Rate | Sample Size (n) |
|--------|---------------|-----------------|
| 30-day | 67.9% | 691 |
| 60-day | 62.0% | 669 |
| 90-day | 62.5% | 653 |

**Interpretation:** Strong initial retention (67.9% at 30 days) with modest attrition through 60 days, then stabilization at 90 days.

### 3.4 Churn Analysis

| Metric | Value |
|--------|-------|
| Users with no activity in last 30 days | 362 (48.1%) |
| Users with no activity in last 60 days | 293 (39.0%) |
| Users with no activity in last 90 days | 275 (36.6%) |
| One-time users | 68 (9.0%) |
| Multi-use users | 684 (91.0%) |
| Median tenure (multi-use users) | 216 days |
| Mean tenure (multi-use users) | 212 days |

**Key Insight:** While 48.1% of users haven't logged in the last 30 days, only 9.0% are true one-time users. The remaining inactive users had some engagement history, suggesting they may be reactivatable.

---

## 4. Correlation Analysis

### 4.1 Pearson Correlation Coefficients

**Correlations with Tenure (days):**

| Variable | Pearson r | Interpretation |
|----------|-----------|----------------|
| total_shifts | 0.818 | Strong positive |
| location_variety | 0.647 | Moderate-strong positive |
| job_variety | 0.510 | Moderate positive |
| first_week_shifts | 0.130 | Weak positive |
| night_shift_ratio | -0.084 | Very weak negative |

### 4.2 Correlations with 90-Day Retention

| Variable | Pearson r | p-value | Significance |
|----------|-----------|---------|--------------|
| location_variety | 0.644 | < 0.0001 | Highly significant |
| job_variety | 0.505 | < 0.0001 | Highly significant |
| first_week_shifts | 0.156 | 1.74e-05 | Significant |
| night_shift_ratio | -0.102 | 0.0049 | Significant |

**Key Findings:**
- Users who work at more locations are significantly more likely to retain (r = 0.644)
- Job variety is also strongly correlated with retention (r = 0.505)
- First-week activity shows modest but significant correlation with long-term retention
- Night shift dominance shows slight negative correlation with retention

---

## 5. Hypothesis Testing

### 5.1 H1: First-Week Activity Predicts Retention

**Hypothesis:** Users who log 3+ shifts in their first week retain better than those who log fewer.

**Results:**

| Group | n | 90-Day Retention |
|-------|---|------------------|
| 3+ first-week shifts | 502 | 66.3% |
| <3 first-week shifts | 250 | 49.6% |

**Statistical Test:**
- Test: Chi-square test of independence
- Chi-square statistic: 18.91
- Degrees of freedom: 1
- p-value: 1.37e-05
- Effect size (Cramer's V): 0.159

**Conclusion:** **STATISTICALLY SIGNIFICANT** (p < 0.001). Users with 3+ first-week shifts have 16.7 percentage points higher 90-day retention. The effect size is small-to-medium.

### 5.2 H2: Night Shift Workers Have Different Engagement Patterns

**Hypothesis:** Users who primarily work night/graveyard shifts have different total engagement than day-dominant users.

**Results:**

| Group | n | Mean Shifts | Std Dev |
|-------|---|-------------|---------|
| Night-dominant (>50% night/graveyard) | 332 | 90.2 | - |
| Day-dominant (<50% night/graveyard) | 420 | 99.4 | - |

**Statistical Test:**
- Test: Independent samples t-test
- t-statistic: -1.28
- p-value: 0.2004
- 95% CI for difference: [-23.42, 4.95]

**Conclusion:** **NOT STATISTICALLY SIGNIFICANT** (p = 0.20). No evidence of different total engagement levels between night and day dominant users.

### 5.3 H3: Terminal Location Affects User Engagement

**Hypothesis:** Users at different terminals show significantly different engagement levels.

**Terminal Comparison:**

| Terminal | n Users | Mean Shifts | Median Shifts | 90-Day Retention |
|----------|---------|-------------|---------------|------------------|
| CENTENNIAL | 259 | 115.80 | 86.0 | 67.95% |
| VANTERM | 190 | 90.83 | 77.5 | 67.89% |
| LYNNTERM | 72 | 92.35 | 59.0 | 58.33% |
| NEPTUNE | 69 | 85.36 | 30.0 | 49.28% |
| VAN WHARVES | 29 | 105.59 | 18.0 | 48.28% |

**Statistical Test:**
- Test: One-way ANOVA
- F-statistic: 3.47
- p-value: 0.016

**Conclusion:** **STATISTICALLY SIGNIFICANT** (p = 0.016). Terminal location has a significant effect on user engagement. CENTENNIAL and VANTERM show highest retention rates.

---

## 6. Time Series Analysis

### 6.1 Monthly User Signups (by First Shift)

| Month | New Users |
|-------|-----------|
| 2025-02 | 53 |
| 2025-03 | 30 |
| 2025-04 | 41 |
| 2025-05 | 59 |
| 2025-06 | 35 |
| 2025-07 | 41 |
| 2025-08 | 23 |
| 2025-09 | 24 |
| 2025-10 | 12 |
| 2025-11 | 18 |
| 2025-12 | 33 |
| 2026-01 | 41 |

**Growth Analysis:**
- Average month-over-month growth: 167.6%
- Recent 3-month average growth: 52.5%

### 6.2 Daily Shift Volume

| Metric | Value |
|--------|-------|
| Mean shifts/day | 124.3 |
| Standard deviation | 92.5 |
| Maximum | 302 |
| Minimum | 1 |
| Coefficient of variation | 74.4% |

### 6.3 Day of Week Patterns

| Day | Shifts | Percentage |
|-----|--------|------------|
| Monday | 10,780 | 15.0% |
| Tuesday | 10,297 | 14.4% |
| Wednesday | 10,331 | 14.4% |
| Thursday | 10,639 | 14.8% |
| Friday | 11,405 | 15.9% |
| Saturday | 9,826 | 13.7% |
| Sunday | 8,433 | 11.8% |

**Statistical Test (uniform distribution):**
- Chi-square statistic: 513.06
- p-value: < 0.0001

**Conclusion:** Day of week distribution is **NOT uniform**. Fridays show highest activity (15.9%), Sundays lowest (11.8%).

### 6.4 Shift Type Distribution

| Shift Type | Count | Percentage |
|------------|-------|------------|
| DAY | 38,681 | 53.9% |
| NIGHT | 15,968 | 22.3% |
| GRAVEYARD | 14,495 | 20.2% |

### 6.5 Monthly Seasonality

| Month | Shifts |
|-------|--------|
| January | 9,927 |
| February | 3,356 |
| March | 3,808 |
| April | 4,394 |
| May | 5,609 |
| June | 6,071 |
| July | 6,797 |
| August | 6,368 |
| September | 6,558 |
| October | 6,136 |
| November | 5,405 |
| December | 7,282 |

**Note:** January 2026 shows higher volume likely due to the data containing January 2026 shifts logged retrospectively.

---

## 7. Pay Analysis

### 7.1 Pay Distribution by Job Type (Top 15)

| Job | Count | Mean Pay | Std Dev | Median Pay | Mean Reg Rate | Mean OT Rate |
|-----|-------|----------|---------|------------|---------------|--------------|
| LABOUR | 19,152 | $545.01 | - | - | $67.42 | $100.75 |
| TRACTOR TRAILER | 16,909 | $598.15 | - | - | $75.23 | $111.72 |
| RUBBER TIRE GANTRY | 4,725 | $570.23 | - | - | $71.55 | $106.56 |
| HEAD CHECKER | 3,526 | $659.43 | - | - | $70.91 | $105.62 |
| LIFT TRUCK | 2,658 | $540.21 | - | - | $65.07 | $97.26 |
| BULK OPERATOR | 1,891 | $586.01 | - | - | $76.67 | $111.87 |
| HD MECHANIC | 1,860 | $574.94 | - | - | $69.99 | $102.89 |
| ELECTRICIAN | 1,742 | $607.74 | - | - | $69.04 | $102.16 |
| LIQUID BULK | 1,706 | $570.79 | - | - | $66.98 | $99.43 |
| TRAINING | 1,683 | $509.74 | - | - | $62.69 | $93.98 |
| 40 TON (TOP PICK) | 1,550 | $703.53 | - | - | $71.75 | $106.77 |
| WHEAT SPECIALTY | 1,390 | $590.41 | - | - | $72.64 | $106.81 |
| DOCK CHECKER | 954 | $522.06 | - | - | $61.35 | $91.61 |
| LOCI | 764 | $608.17 | - | - | $70.76 | $105.49 |

### 7.2 Rate Variance Analysis (Coefficient of Variation)

**Jobs with Highest Rate Variance:**

| Job | Mean Rate | Std Dev | CV (%) |
|-----|-----------|---------|--------|
| OB | $74.28 | $39.63 | 53.35% |
| WHEAT SPECIALTY | $72.64 | $21.08 | 29.02% |
| DOW MEN | $63.88 | $15.49 | 24.25% |
| GEARPERSON | $62.52 | $14.25 | 22.79% |
| LIQUID BULK | $66.98 | $15.23 | 22.74% |
| WINCH DRIVER | $65.70 | $14.75 | 22.44% |
| MOBILE CRANE | $68.05 | $15.27 | 22.44% |
| REACHSTACKER | $67.84 | $15.17 | 22.36% |
| ELECTRICIAN | $69.04 | $15.33 | 22.21% |

**Interpretation:** High coefficient of variation indicates significant rate complexity. OB (53.35% CV) and WHEAT SPECIALTY (29.02% CV) show the most variable rates, validating the need for a tracking tool.

### 7.3 ANOVA: Pay Rate Differences Between Jobs

**Compared Jobs:** LABOUR, TRACTOR TRAILER, RUBBER TIRE GANTRY, HEAD CHECKER, LIFT TRUCK

**Results:**
- F-statistic: 770.16
- p-value: < 0.0001

**Conclusion:** **HIGHLY SIGNIFICANT** (p < 0.0001). Pay rates differ significantly between job classifications.

### 7.4 Tukey HSD Post-Hoc Pairwise Comparisons

| Comparison | p-value | Significant? |
|------------|---------|--------------|
| LABOUR vs TRACTOR TRAILER | < 0.0001 | Yes |
| LABOUR vs RUBBER TIRE GANTRY | < 0.0001 | Yes |
| LABOUR vs HEAD CHECKER | < 0.0001 | Yes |
| LABOUR vs LIFT TRUCK | < 0.0001 | Yes |
| TRACTOR TRAILER vs RUBBER TIRE GANTRY | < 0.0001 | Yes |
| TRACTOR TRAILER vs HEAD CHECKER | < 0.0001 | Yes |
| TRACTOR TRAILER vs LIFT TRUCK | < 0.0001 | Yes |
| RUBBER TIRE GANTRY vs HEAD CHECKER | 0.2647 | No |
| RUBBER TIRE GANTRY vs LIFT TRUCK | < 0.0001 | Yes |
| HEAD CHECKER vs LIFT TRUCK | < 0.0001 | Yes |

**Key Finding:** Most job pairs show significantly different pay rates, with the exception of RUBBER TIRE GANTRY vs HEAD CHECKER (p = 0.26).

---

## 8. Predictive Indicators for Retention

### 8.1 Logistic Regression Model

**Target Variable:** 90-Day Retention (binary)
**Features:** first_week_shifts, job_variety, night_shift_ratio
**Training Samples:** 526
**Test Samples:** 226

**Model Coefficients and Odds Ratios:**

| Feature | Coefficient | Odds Ratio | Interpretation |
|---------|-------------|------------|----------------|
| first_week_shifts | 0.1028 | 1.11 | Each additional first-week shift increases odds of retention by 11% |
| job_variety | 0.8744 | 2.40 | Each additional job type increases odds of retention by 140% |
| night_shift_ratio | -0.7585 | 0.47 | Night-dominant users have 53% lower odds of retention |

**Model Intercept:** -1.7630

### 8.2 Model Performance

| Metric | Value |
|--------|-------|
| Accuracy | 81% |
| ROC-AUC | 0.862 |

**Classification Report:**

| Class | Precision | Recall | F1-Score | Support |
|-------|-----------|--------|----------|---------|
| Churned (0) | 0.75 | 0.76 | 0.76 | 89 |
| Retained (1) | 0.84 | 0.83 | 0.84 | 137 |
| **Weighted Avg** | **0.81** | **0.81** | **0.81** | **226** |

**Interpretation:** The model achieves good predictive performance (AUC = 0.862), indicating that early user behaviors can reliably predict long-term retention.

### 8.3 Key Early Indicators Comparison

**Retained Users (90+ days): n=457**
**Churned Users (<90 days): n=295**

| Indicator | Retained Mean | Churned Mean | Difference | t-statistic | p-value |
|-----------|---------------|--------------|------------|-------------|---------|
| first_week_shifts | 4.37 | 3.61 | +0.75 | 4.32 | 1.74e-05 |
| job_variety | 3.81 | 1.61 | +2.20 | 16.02 | 6.89e-50 |
| location_variety | 6.39 | 2.06 | +4.33 | 23.06 | 2.52e-89 |

**Key Insight:** Location variety shows the strongest differentiation between retained and churned users. Users who work at more locations are dramatically more likely to remain active.

---

## 9. Key Findings Summary

### Statistically Significant Findings

#### 1. USER DISTRIBUTION IS HIGHLY SKEWED
- **Evidence:** Skewness = 0.839, Mode = 1 shift
- **Implication:** 40.6% of users (Power Users) generate 84.7% of all activity
- **Test:** Shapiro-Wilk p < 0.001 confirms non-normal distribution

#### 2. FIRST-WEEK ACTIVITY PREDICTS RETENTION
- **Evidence:** Chi-square = 18.91, p = 1.37e-05
- **Effect:** Users with 3+ first-week shifts have 66.3% vs 49.6% 90-day retention
- **Effect Size:** Cramer's V = 0.159 (small-medium)

#### 3. LOCATION AND JOB VARIETY STRONGLY PREDICT RETENTION
- **Evidence:** r = 0.644 (location), r = 0.505 (job) with p < 0.0001
- **Implication:** Users who explore more of the app's coverage area retain better
- **Odds Ratio:** Each additional job type increases retention odds by 140%

#### 4. TERMINAL LOCATION AFFECTS ENGAGEMENT
- **Evidence:** ANOVA F = 3.47, p = 0.016
- **Finding:** CENTENNIAL and VANTERM show highest retention (~68%)
- **Lowest:** NEPTUNE (49.3%) and VAN WHARVES (48.3%)

#### 5. PAY RATE VARIANCE VALIDATES PRODUCT NEED
- **Evidence:** ANOVA F = 770.16, p < 0.0001
- **Finding:** Significant pay differences between most job pairs
- **CV Range:** 22-53% variation in rates within jobs

#### 6. ONE-TIME USER OPPORTUNITY
- **Evidence:** 9.0% of users log only 1 shift
- **Opportunity:** Converting trial users to light users could significantly increase engagement

### Confidence Levels

All hypothesis tests conducted at alpha = 0.05:
- p < 0.05: Statistically significant (95% confidence)
- p < 0.01: Highly significant (99% confidence)
- p < 0.001: Extremely significant (99.9% confidence)

### Limitations

1. **Observational Data:** No randomized controlled experiments; correlations may not imply causation
2. **Self-Selection Bias:** Users who choose to track shifts may differ from non-users
3. **Data Quality:** User-entered data may contain errors and inconsistencies
4. **Survivorship Bias:** Analysis weighted toward active users
5. **Time Period:** Historical patterns may not predict future behavior
6. **Account Duplicates:** Some users may have multiple accounts

### Actionable Conclusions

| Priority | Recommendation | Evidence |
|----------|----------------|----------|
| 1 | **Focus onboarding on first-week engagement** | Chi-square p < 0.001, 16.7pp retention lift |
| 2 | **Encourage location/job exploration** | r = 0.644, OR = 2.40 for retention |
| 3 | **Investigate high-retention terminals** | CENTENNIAL/VANTERM for best practices |
| 4 | **Address one-time user churn** | 9% of users, major conversion opportunity |
| 5 | **Validate pay complexity in marketing** | CV 22-53%, ANOVA p < 0.001 |

---

## Methodology Notes

### Statistical Tests Used

| Test | Purpose | Assumptions |
|------|---------|-------------|
| Shapiro-Wilk | Normality testing | Sample size < 5000 |
| Chi-square | Independence of categorical variables | Expected frequencies > 5 |
| Independent t-test | Compare two group means | Approximately normal distributions |
| One-way ANOVA | Compare multiple group means | Homogeneity of variances |
| Tukey HSD | Post-hoc pairwise comparisons | Following significant ANOVA |
| Pearson correlation | Linear relationships | Continuous variables |
| Logistic regression | Binary outcome prediction | Independence of observations |

### Software and Libraries

- Python 3.x
- pandas (data manipulation)
- numpy (numerical operations)
- scipy.stats (statistical tests)
- sklearn (machine learning)

---

*Report generated: February 1, 2026*
*Data source: export_All-SHIFTS-modified--_2026-02-01_05-58-52.csv*
*Total records analyzed: 71,712*
