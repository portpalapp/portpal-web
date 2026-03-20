# PORTPAL Technical Specification

**Version:** 1.0
**Last Updated:** February 2026
**For:** Development Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Multi-Tenant Design](#multi-tenant-design)
4. [Database Schema](#database-schema)
5. [Pay Calculation Engine](#pay-calculation-engine)
6. [Core Features](#core-features)
7. [API Specifications](#api-specifications)
8. [Mobile App Requirements](#mobile-app-requirements)
9. [Authentication & Security](#authentication--security)
10. [Third-Party Integrations](#third-party-integrations)
11. [Performance Requirements](#performance-requirements)
12. [Deployment & Infrastructure](#deployment--infrastructure)

---

## 1. System Overview

PORTPAL is a shift tracking and pay verification application for longshoremen. Users log their work shifts, and the system automatically calculates expected pay based on complex union pay rules.

### Core Problem Solved
Longshoremen work multiple job types with different pay rates, shift differentials (day/night/graveyard), overtime rules, and location-based variations. Manual tracking is error-prone. PORTPAL automates pay calculation and flags discrepancies.

### Tech Stack (Current)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Bubble.io (to be migrated)
- **Database:** Bubble (to be migrated to PostgreSQL/Supabase)
- **Mobile:** React Native or Flutter (planned)

### Tech Stack (Target)
- **Frontend:** React Native (mobile-first)
- **Backend:** Node.js/Express or Supabase Edge Functions
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth or Auth0
- **Hosting:** Vercel (web), AWS/GCP (backend)
- **AI:** OpenAI API for chat features

---

## 2. Architecture

### Current State (Bubble)
```
┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Bubble    │
│   Web App   │     │   Backend   │
└─────────────┘     └─────────────┘
                          │
                    ┌─────▼─────┐
                    │  Bubble   │
                    │  Database │
                    └───────────┘
```

### Target State
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │     │   React     │     │   Admin     │
│   Native    │     │   Web App   │     │   Dashboard │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   API Layer  │
                    │  (Supabase)  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  PostgreSQL │  │  Edge       │  │  Storage    │
   │  Database   │  │  Functions  │  │  (Pay Stubs)│
   └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 3. Multi-Tenant Design

### Tenant Model
Each "tenant" is a **union local** (e.g., ILWU Local 500, ILWU Local 502, ILA Local 1422). Different locals have different:
- Pay rates
- Job classifications
- Shift definitions
- Location/terminal names
- Overtime rules

### Tenant Isolation Strategy

**Option A: Schema-per-tenant** (Recommended for < 50 tenants)
```sql
-- Each tenant gets its own schema
CREATE SCHEMA ilwu_500;
CREATE SCHEMA ilwu_502;
CREATE SCHEMA ila_1422;

-- Tables exist in each schema
ilwu_500.shifts
ilwu_500.pay_rates
ilwu_502.shifts
ilwu_502.pay_rates
```

**Option B: Row-level security** (Recommended for > 50 tenants)
```sql
-- Single schema, tenant_id on all tables
CREATE TABLE shifts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL,
  ...
);

-- RLS Policy
CREATE POLICY tenant_isolation ON shifts
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### Tenant Configuration Table
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,        -- 'ILWU_500', 'ILA_1422'
  name VARCHAR(100) NOT NULL,              -- 'ILWU Local 500 - Vancouver'
  region VARCHAR(50),                      -- 'BC', 'WA', 'CA', 'NY'
  country VARCHAR(2) DEFAULT 'CA',         -- 'CA', 'US'
  timezone VARCHAR(50) DEFAULT 'America/Vancouver',
  currency VARCHAR(3) DEFAULT 'CAD',
  settings JSONB DEFAULT '{}',             -- Tenant-specific config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

### Tenant-Specific Pay Configuration
```sql
CREATE TABLE tenant_pay_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  effective_start DATE NOT NULL,
  effective_end DATE,
  config JSONB NOT NULL,  -- Full pay rules as JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, effective_start)
);

-- Example config JSONB structure:
{
  "base_rates": {
    "weekday_day": 53.17,
    "weekday_night": 66.98,
    "weekday_graveyard": 82.73,
    "saturday_day": 68.06,
    "saturday_night": 85.07,
    "sunday_all": 85.07
  },
  "differentials": {
    "CLASS_1": 2.50,  -- HD Mechanic, Electrician, etc.
    "CLASS_2": 1.00,  -- RTG, First Aid
    "CLASS_3": 0.65,  -- Tractor Trailer
    "CLASS_4": 0.50   -- Lift Truck
  },
  "overtime_multipliers": {
    "time_and_half": 1.5,
    "double_time": 2.0
  },
  "default_hours": {
    "day": 8,
    "night": 8,
    "graveyard": 6.5
  }
}
```

---

## 4. Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  union_number VARCHAR(50),              -- Union membership ID
  seniority_date DATE,                   -- For casuals tracking seniority
  is_casual BOOLEAN DEFAULT false,       -- Casual vs full member
  subscription_tier VARCHAR(20) DEFAULT 'free',  -- 'free', 'pro'
  subscription_expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Jobs (tenant-specific job types)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code VARCHAR(50) NOT NULL,             -- 'TRACTOR_TRAILER', 'RTG'
  name VARCHAR(100) NOT NULL,            -- Display name
  classification VARCHAR(20),            -- 'CLASS_1', 'CLASS_2', etc.
  differential DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  UNIQUE(tenant_id, code)
);

-- Locations/Terminals
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code VARCHAR(50) NOT NULL,             -- 'CENTENNIAL', 'DELTAPORT'
  name VARCHAR(100) NOT NULL,
  has_extended_shifts BOOLEAN DEFAULT false,  -- CENTENNIAL = true
  is_active BOOLEAN DEFAULT true,

  UNIQUE(tenant_id, code)
);

-- Sub-jobs (e.g., RAIL, SHIP, YARD for Tractor Trailer)
CREATE TABLE subjobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,

  UNIQUE(job_id, code)
);

-- Shifts (the main data table)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- When
  shift_date DATE NOT NULL,
  shift_type VARCHAR(20) NOT NULL,       -- 'DAY', 'NIGHT', 'GRAVEYARD'

  -- What
  job_id UUID NOT NULL REFERENCES jobs(id),
  subjob_id UUID REFERENCES subjobs(id),
  location_id UUID NOT NULL REFERENCES locations(id),

  -- Hours
  regular_hours DECIMAL(4,2) NOT NULL,
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  double_time_hours DECIMAL(4,2) DEFAULT 0,

  -- Pay (calculated)
  regular_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),
  double_time_rate DECIMAL(10,2),
  calculated_pay DECIMAL(10,2),

  -- User overrides
  user_entered_pay DECIMAL(10,2),        -- If user manually enters pay
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  source VARCHAR(20) DEFAULT 'manual',   -- 'manual', 'ocr', 'import'

  -- Indexes
  INDEX idx_shifts_user_date (user_id, shift_date),
  INDEX idx_shifts_tenant_date (tenant_id, shift_date)
);

-- Pay Stubs (uploaded for verification)
CREATE TABLE pay_stubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),

  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,

  -- Extracted data
  gross_pay DECIMAL(10,2),
  net_pay DECIMAL(10,2),
  deductions JSONB,                      -- Breakdown of deductions

  -- File storage
  file_url TEXT,
  file_hash VARCHAR(64),                 -- For deduplication

  -- OCR status
  ocr_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'complete', 'failed'
  ocr_result JSONB,

  -- Verification
  expected_pay DECIMAL(10,2),            -- Sum of shifts in period
  discrepancy DECIMAL(10,2),             -- gross_pay - expected_pay
  discrepancy_resolved BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discrepancies (flagged pay errors)
CREATE TABLE discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  pay_stub_id UUID REFERENCES pay_stubs(id),
  shift_id UUID REFERENCES shifts(id),

  type VARCHAR(50) NOT NULL,             -- 'underpaid', 'missing_shift', 'wrong_rate'
  amount DECIMAL(10,2),
  description TEXT,

  status VARCHAR(20) DEFAULT 'open',     -- 'open', 'reported', 'resolved', 'dismissed'
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pay Differentials Table (PAYDIFFS) - Hours Only

**IMPORTANT:** This table stores HOURS overrides only. Rates are calculated dynamically from Job → Differential Class mapping. See Section 5.0 for rationale.

```sql
CREATE TABLE pay_differentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Matching criteria
  job_code VARCHAR(50) NOT NULL,         -- 'TRACTOR TRAILER', 'HEAD CHECKER'
  shift_type VARCHAR(20) NOT NULL,       -- 'DAY', 'NIGHT', 'GRAVEYARD'
  location_code VARCHAR(50),             -- 'CENTENNIAL', 'VANTERM', NULL = all
  subjob_code VARCHAR(50),               -- 'RAIL (TT)', 'SHIP (TT)', NULL = all

  -- Hours (only store non-standard combinations)
  regular_hours DECIMAL(4,2) NOT NULL,
  overtime_hours DECIMAL(4,2) DEFAULT 0,

  -- Metadata
  sample_size INTEGER,                   -- Number of user entries this was derived from
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, job_code, shift_type, location_code, subjob_code),
  INDEX idx_paydiffs_lookup (tenant_id, job_code, shift_type, location_code)
);
```

**What this table contains:**
- CENTENNIAL 9-hour shifts (day/night)
- CENTENNIAL 7.5-hour graveyard shifts
- WHEAT jobs: 7.5 hrs + 0.5 OT
- LINES jobs: 4 hours
- Built-in overtime combinations
- All-OT shifts (DOCK GANTRY: 0 reg, 5 OT)

**What this table does NOT contain:**
- Rate data (calculated from Job classification)
- Standard hour entries (8/8/6.5 with 0 OT)
- Differential amounts (stored in Job table)

**Current data:** ~330 entries covering all non-standard hour combinations discovered from 71,712 user shifts.

---

## 5. Pay Calculation Engine

### 5.0 Important Architecture Decision: Hours-Only PAYDIFFS

**CRITICAL:** The PAYDIFFS table stores **HOURS only**, not rates. This is a deliberate design choice:

- Rates are calculated dynamically from Job → Differential Class lookup
- PAYDIFFS only contains entries where hours differ from standard defaults
- If no PAYDIFFS match → use standard hours (8/8/6.5 for day/night/graveyard, 0 OT)
- This reduces Bubble/database workload and ensures rate accuracy

**Benefits:**
- ~330 entries vs 11K+ (smaller table)
- No rate validation issues (always calculated from source)
- Easy contract year updates (one place)
- Less query overhead for standard shifts

### Calculation Flow
```
Input: shift_date, job, location, subjob, shift_type, hours
                    │
                    ▼
┌─────────────────────────────────────┐
│  1. Determine day type              │
│     - Weekday (Mon-Fri)             │
│     - Saturday                      │
│     - Sunday                        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  2. Get base rate for day+shift     │
│     - weekday_day: $53.17           │
│     - weekday_night: $66.98         │
│     - etc.                          │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  3. Apply job differential          │
│     - CLASS_1: +$2.50               │
│     - CLASS_2: +$1.00               │
│     - etc.                          │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  4. Check for location overrides    │
│     - CENTENNIAL: 9 hrs (not 8)     │
│     - Special rate rules            │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  5. Check for subjob overrides      │
│     - TT RAIL: different hours      │
│     - Special rules                 │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  6. Calculate pay                   │
│     regular_pay = rate × reg_hrs    │
│     ot_pay = rate × 1.5 × ot_hrs    │
│     dt_pay = rate × 2.0 × dt_hrs    │
│     total = regular + ot + dt       │
└─────────────────────────────────────┘
```

### Calculation Function (Pseudocode)
```typescript
interface ShiftInput {
  tenantId: string;
  shiftDate: Date;
  jobId: string;
  locationId: string;
  subjobId?: string;
  shiftType: 'DAY' | 'NIGHT' | 'GRAVEYARD';
  regularHours: number;
  overtimeHours?: number;
  doubleTimeHours?: number;
}

interface PayCalculation {
  regularRate: number;
  overtimeRate: number;
  doubleTimeRate: number;
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  totalPay: number;
  appliedRules: string[];  // For transparency
}

async function calculatePay(input: ShiftInput): Promise<PayCalculation> {
  // 1. Get tenant config for effective date
  const config = await getTenantPayConfig(input.tenantId, input.shiftDate);

  // 2. Determine day type
  const dayOfWeek = input.shiftDate.getDay();
  const dayType = getDayType(dayOfWeek); // 'weekday' | 'saturday' | 'sunday'

  // 3. Get base rate
  const baseRateKey = `${dayType}_${input.shiftType.toLowerCase()}`;
  let baseRate = config.base_rates[baseRateKey];

  // 4. Get job and apply differential
  const job = await getJob(input.jobId);
  const differential = config.differentials[job.classification] || 0;
  const rate = baseRate + differential;

  // 5. Check for specific overrides (location, subjob, etc.)
  const overrides = await getApplicableOverrides(input);
  // Apply any rate or hour overrides...

  // 6. Calculate
  const regularPay = rate * input.regularHours;
  const overtimePay = (rate * 1.5) * (input.overtimeHours || 0);
  const doubleTimePay = (rate * 2.0) * (input.doubleTimeHours || 0);

  return {
    regularRate: rate,
    overtimeRate: rate * 1.5,
    doubleTimeRate: rate * 2.0,
    regularPay,
    overtimePay,
    doubleTimePay,
    totalPay: regularPay + overtimePay + doubleTimePay,
    appliedRules: overrides.map(o => o.description)
  };
}
```

### 5.1 Effective Date Handling

Pay rates change annually on April 1st. The system must handle this correctly:

**Rate Years (BCMEA Contract):**
| Year | Effective Start | Effective End | Base Rate (Mon-Fri Day) |
|------|-----------------|---------------|------------------------|
| 1 | Apr 1, 2023 | Mar 31, 2024 | $50.64 |
| 2 | Apr 1, 2024 | Mar 31, 2025 | $53.17 |
| 3 | Apr 1, 2025 | Mar 31, 2026 | $55.30 |
| 4 | Apr 1, 2026 | Mar 31, 2027 | $57.51 |

**Implementation Rules:**
1. Retrieve the `tenant_pay_config` where `effective_start <= shift_date < effective_end`
2. If `shift_date` predates earliest config, use first config available
3. If `shift_date` is after latest config, use most recent config
4. Store `effective_start` and `effective_end` on each config record

**Edge Cases:**
- Shifts spanning midnight on Mar 31/Apr 1: Use the rate for the date the shift STARTED
- Retroactive corrections: Calculate using the rate that WAS effective on the original shift date
- Timezone handling: All dates stored in tenant's configured timezone

### 5.2 Location-Based Hour Overrides

Different locations have different standard shift lengths. This was validated from 71,712 user entries:

**CENTENNIAL Terminal (9-hour shifts):**
| Job | Day/Night Hours | Graveyard Hours |
|-----|-----------------|-----------------|
| TRACTOR TRAILER | 9 | 7.5 |
| HEAD CHECKER | 9 | 7.5 |
| 40 TON (TOP PICK) | 9 | 7.5 |
| REACHSTACKER | 9 | 7.5 |
| LIFT TRUCK (night only) | 9 | 6.5 |

**Standard Terminals (VANTERM, DELTAPORT, etc.):**
| Job | Day/Night Hours | Graveyard Hours |
|-----|-----------------|-----------------|
| All standard jobs | 8 | 6.5 |

**Special Cases:**
| Location | Job | Shift | Hours | Notes |
|----------|-----|-------|-------|-------|
| FRASER SURREY | FIRST AID | DAY | 9 | Only location with 9-hr First Aid |
| DELTAPORT | Various | GRAVEYARD | 6.5-7.0 | Some variation in data |

**Implementation:**
```typescript
function getDefaultHours(locationCode: string, shiftType: string): number {
  if (locationCode === 'CENTENNIAL') {
    return shiftType === 'GRAVEYARD' ? 7.5 : 9;
  }
  return shiftType === 'GRAVEYARD' ? 6.5 : 8;
}
```

### 5.3 Special Job Rules

**WHEAT Jobs (WHEAT MACHINE, WHEAT SPECIALTY):**
- Differential: +$1.15/hr (WHEAT class)
- Standard hours: 7.5 regular + 0.5 overtime (built-in OT)
- Applies to all shifts at wheat terminals: ALLIANCE GRAIN, G3 TERMINAL, CASCADIA, RICHARDSON, CARGILL, VITERRA PAC

**TRAINER Rates:**
| Type | Calculation | Notes |
|------|-------------|-------|
| TRAINER REGULAR | Base rate × 1.333 | 33.3% premium |
| TRAINER SENIOR | Senior rate applies | Use senior rate table for all days |

**Built-in Overtime Examples:**
Some job/location combinations always include overtime hours:
- DOCK GANTRY at certain locations: 0 regular, 5 OT (all-overtime shift)
- HEAD CHECKER with specific assignments: Standard hours + 1-2 OT
- LABOUR with certain subjobs: May include built-in OT

These are stored in PAYDIFFS and should be looked up, not calculated.

---

## 6. Core Features

### 6.1 Shift Logging
- Quick entry with smart defaults based on user history
- Job → Location → Subjob cascading dropdowns
- Auto-calculate pay as user enters data
- Support for split shifts
- Notes field for exceptions
- Recurring shift templates

### 6.2 Pay Stub Verification
- Upload pay stub image (camera or gallery)
- OCR extraction of key fields
- Compare against logged shifts for same period
- Flag discrepancies automatically
- Store history for records

### 6.3 User Dashboard (App Feature)
The main app dashboard for end users:
- This week's shifts and earnings
- Year-to-date earnings
- Pension progress (toward annual target)
- Recent discrepancies
- Quick stats (shifts this month, hours, etc.)

**Note:** This is distinct from the Admin/Investor Dashboard (see Section 6.8).

### 6.4 Calendar View
- Week and month views
- Color-coded by shift type
- Tap to view/edit shift
- Pay period boundaries visible

### 6.5 Analytics
- Earnings over time (week/month/year)
- Breakdown by job type
- Breakdown by location
- Hours by shift type
- Overtime percentage

### 6.6 AI Chat (Pro Feature)
- Ask questions about pay rules
- "What's the night rate for RTG on Saturday?"
- Upload pay stub and ask "Is this correct?"
- Natural language queries

### 6.7 Notifications
- Shift logging reminders (configurable)
- Pay stub uploaded reminder
- Discrepancy alerts
- Achievement milestones

### 6.8 Admin/Investor Dashboard (Internal Tool)

**Note:** This is a separate internal dashboard for business metrics, NOT a user-facing feature.

**Location:** `/command-center` route (see `app/src/pages/CommandCenter.tsx`)

**Tabs:**
| Tab | Purpose |
|-----|---------|
| Overview | User engagement metrics (DAU, MAU, WAU), user segmentation |
| Calculator | Interactive revenue calculator with market toggles |
| Growth Engine | TAM/SAM/SOM analysis, expansion projections |
| Retention | Cohort retention heatmaps, churn analysis |
| Marketing | Content calendar, email sequences |
| Financial | LTV:CAC, unit economics, pricing analysis |
| Statistical | Hypothesis testing, p-values, correlation analysis |

**Metrics Displayed:**
- Daily/Weekly/Monthly Active Users
- User retention by cohort (30/60/90 day)
- Market penetration estimates
- Revenue projections with adjustable parameters
- Churn analysis and at-risk user identification

**Access:** Internal/admin only. Not deployed to production app stores.

---

## 7. API Specifications

### Authentication
All API calls require Bearer token in header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Shifts
```
GET    /api/v1/shifts                    # List user's shifts (paginated)
GET    /api/v1/shifts/:id                # Get single shift
POST   /api/v1/shifts                    # Create shift
PUT    /api/v1/shifts/:id                # Update shift
DELETE /api/v1/shifts/:id                # Delete shift

Query params for GET /shifts:
  - start_date: ISO date
  - end_date: ISO date
  - job_id: UUID
  - location_id: UUID
  - limit: number (default 50, max 200)
  - offset: number
```

#### Pay Calculation
```
POST   /api/v1/calculate-pay             # Calculate pay for shift input
       Body: { shiftDate, jobId, locationId, shiftType, regularHours, ... }
       Response: { regularPay, overtimePay, totalPay, appliedRules }
```

#### Jobs/Locations (Tenant-specific)
```
GET    /api/v1/jobs                      # List jobs for tenant
GET    /api/v1/locations                 # List locations for tenant
GET    /api/v1/subjobs?job_id=xxx        # List subjobs for job
```

#### Pay Stubs
```
GET    /api/v1/pay-stubs                 # List user's pay stubs
POST   /api/v1/pay-stubs                 # Upload pay stub
       Content-Type: multipart/form-data
GET    /api/v1/pay-stubs/:id             # Get pay stub with analysis
```

#### User
```
GET    /api/v1/me                        # Get current user profile
PUT    /api/v1/me                        # Update profile
GET    /api/v1/me/stats                  # Get user stats (shifts, earnings, etc.)
```

#### AI Chat (Pro)
```
POST   /api/v1/chat                      # Send message to AI
       Body: { message, context?: { shiftId?, payStubId? } }
       Response: { reply, sources? }
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid shift date",
    "details": { "field": "shiftDate", "reason": "Must be in the past" }
  }
}
```

---

## 8. Mobile App Requirements

### Platforms
- iOS 14+
- Android 8+

### Framework
React Native (recommended for code sharing with web) or Flutter

### Offline Support
- Cache recent shifts locally
- Queue shift entries when offline
- Sync when connection restored
- Store job/location lists locally

### Camera Integration
- Pay stub photo capture
- Crop/rotate before upload
- Compress images (max 2MB)

### Notifications
- Push notifications via Firebase Cloud Messaging
- Local notifications for reminders

### Biometric Auth
- Face ID / Touch ID support
- PIN fallback

---

## 9. Authentication & Security

### Authentication Flow
1. Email/password or phone number
2. Magic link option for passwordless
3. JWT tokens (15 min access, 7 day refresh)
4. Secure token storage (Keychain iOS, Keystore Android)

### Data Security
- All data encrypted in transit (TLS 1.3)
- Sensitive data encrypted at rest
- Pay stub images stored in private bucket
- PII handled per PIPEDA (Canada) / CCPA (California)

### Row-Level Security
- Users can only access their own data
- Tenant isolation enforced at database level
- Admin roles for tenant managers

### Rate Limiting
- 100 requests/minute per user
- 10 requests/minute for unauthenticated
- Stricter limits on expensive operations (OCR, AI)

---

## 10. Third-Party Integrations

### OCR (Pay Stub Processing)
- **Primary:** Google Cloud Vision API
- **Fallback:** AWS Textract
- Extract: gross pay, net pay, pay period dates, line items

### AI Chat
- **Provider:** OpenAI API (GPT-4)
- **Context:** Pay rules documentation, user's shifts
- **Rate limit:** Pro users only, 50 messages/day

### Payments
- **Provider:** Stripe
- Subscription management
- Support for CAD and USD

### Analytics
- **Provider:** Mixpanel or Amplitude
- Track feature usage, retention events
- No PII in analytics

### Push Notifications
- **Provider:** Firebase Cloud Messaging
- Cross-platform support

---

## 11. Performance Requirements

### Response Times
- API responses: < 200ms (p95)
- Pay calculation: < 50ms
- Page load: < 2s (mobile 3G)
- Shift list scroll: 60fps

### Availability
- 99.9% uptime SLA
- Maintenance windows: Sunday 2-4am PST

### Scalability
- Support 10,000 concurrent users
- 1M shifts per month capacity
- Horizontal scaling for API layer

### Caching
- Job/location lists: 24h cache
- Pay config: 1h cache
- User preferences: Session cache

---

## 12. Deployment & Infrastructure

### Environments
- **Development:** Local + Supabase local
- **Staging:** Vercel preview + Supabase staging project
- **Production:** Vercel + Supabase production project

### CI/CD
- GitHub Actions for CI
- Automated tests on PR
- Staging deploy on merge to `develop`
- Production deploy on merge to `main`

### Monitoring
- Error tracking: Sentry
- Uptime monitoring: Better Uptime
- Performance: Vercel Analytics
- Database: Supabase Dashboard

### Backup
- Database: Daily automated backups, 30-day retention
- Point-in-time recovery enabled
- Pay stub images: Cross-region replication

---

## Appendix A: Tenant Onboarding Checklist

When adding a new union local (tenant):

1. [ ] Create tenant record with basic info
2. [ ] Configure timezone and currency
3. [ ] Import job classifications with differentials
4. [ ] Import locations/terminals
5. [ ] Import subjobs if applicable
6. [ ] Set up pay rate configuration (effective dates)
7. [ ] Configure default hours by shift type
8. [ ] Add location-specific hour overrides
9. [ ] Test pay calculation with sample shifts
10. [ ] Enable tenant for user registration

---

## Appendix B: Data Migration (Bubble → Supabase)

### Migration Steps
1. Export all tables from Bubble as CSV
2. Transform data to match new schema
3. Import to Supabase with data validation
4. Verify row counts and data integrity
5. Run pay recalculation on all shifts
6. Compare results with original data
7. Switch API endpoints to new backend
8. Monitor for 48 hours
9. Decommission Bubble

### Tables to Migrate
- Users (752 records)
- Shifts (71,712 records)
- Jobs (~42 types)
- Locations (~24 terminals)
- Pay configurations
- Subscription data

---

## Appendix C: Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Auth
JWT_SECRET=xxx
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# External Services
OPENAI_API_KEY=xxx
GOOGLE_CLOUD_VISION_KEY=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx

# Monitoring
SENTRY_DSN=xxx

# Feature Flags
ENABLE_AI_CHAT=true
ENABLE_OCR=true
```

---

**End of Technical Specification**
