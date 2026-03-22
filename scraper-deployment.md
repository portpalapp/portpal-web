# SCRAPER DEPLOYMENT GUIDE
## Enhanced Data Collection Implementation

## 1. ENHANCED SCRAPERS CREATED

### enhanced-work-scraper.js
**Purpose:** Comprehensive work-info and DOA scraping with granular job breakdown
**Features:**
- ✅ Sub-job parsing within categories (MACHINE → LIFT TRUCK, RTG, etc.)
- ✅ Callback detection by comparing previous vs current data
- ✅ High-frequency monitoring (10 min during dispatch hours, 60 min otherwise)
- ✅ Enhanced DOA availability by specific job types
- ✅ Screenshot capture for debugging
- ✅ Combined intelligence generation

## 2. DATA STRUCTURE ENHANCEMENTS

### Before (High-level only):
```json
{
  "totalJobs": 180,
  "categories": {
    "MACHINE": 25,
    "TRADES": 15,
    "LABOUR": 45
  }
}
```

### After (Granular breakdown):
```json
{
  "shifts": {
    "DAY": {
      "totalJobs": 180,
      "categories": {
        "MACHINE": 25,
        "TRADES": 15
      },
      "jobs": {
        "LIFT_TRUCK": 8,
        "RTG": 5,
        "REACHSTACKER": 3,
        "HD_MECHANIC": 6,
        "ELECTRICIAN": 4,
        "LABOUR": 45
      }
    }
  },
  "callbacks": {
    "timestamp": "2026-03-21T20:30:00Z",
    "newJobs": {
      "DAY_LIFT_TRUCK": {
        "newCount": 2,
        "previousCount": 6,
        "currentCount": 8
      }
    },
    "totalNewJobs": 5
  },
  "intelligence": {
    "busynessLevel": "high",
    "busynessScore": 78,
    "insights": [
      "180 total jobs posted - high activity level",
      "5 callback jobs detected since last check"
    ]
  }
}
```

## 3. DEPLOYMENT STEPS

### Step 1: Dependencies
```bash
npm install puppeteer fs path
```

### Step 2: Environment Setup
```bash
# Set BCMEA credentials
export BCMEA_USERNAME="48064"
export BCMEA_PASSWORD="your_password"
```

### Step 3: Directory Structure
```bash
mkdir -p ./data/work-info-enhanced
mkdir -p ./screenshots/work-info
mkdir -p ./logs
```

### Step 4: Task Scheduler Setup (Windows)
```batch
# High-frequency monitoring during dispatch hours (6-10 AM)
schtasks /create /tn "PortPal-WorkScraper-HighFreq" /tr "node enhanced-work-scraper.js" /sc minute /mo 10 /st 06:00 /et 10:00

# Normal frequency monitoring (rest of day)  
schtasks /create /tn "PortPal-WorkScraper-Normal" /tr "node enhanced-work-scraper.js" /sc hourly /st 10:01 /et 05:59
```

### Step 5: Logging & Monitoring
```bash
# Output logs
node enhanced-work-scraper.js >> ./logs/scraper-out.log 2>> ./logs/scraper-error.log
```

## 4. INTEGRATION WITH WORK INTELLIGENCE UI

### API Endpoints Needed:
```javascript
// Read latest work intelligence data
GET /api/work-intelligence/latest

// Get callback activity for date range
GET /api/work-intelligence/callbacks?from=2026-03-21&to=2026-03-22

// Get job-specific predictions  
GET /api/work-intelligence/predictions?job=LIFT_TRUCK&shift=DAY

// Get busyness trends
GET /api/work-intelligence/busyness-trends?days=7
```

### Database Schema Enhancement:
```sql
-- Enhanced work_intelligence table
CREATE TABLE work_intelligence_enhanced (
  id SERIAL PRIMARY KEY,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL,
  date DATE NOT NULL,
  shift VARCHAR(10) NOT NULL, -- DAY, NIGHT, GRAVEYARD
  total_jobs INTEGER NOT NULL,
  total_callbacks INTEGER DEFAULT 0,
  busyness_score INTEGER DEFAULT 50,
  busyness_level VARCHAR(10) DEFAULT 'medium',
  raw_data JSONB NOT NULL, -- Full scraper output
  insights TEXT[], -- AI-generated insights
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job-specific breakdown table  
CREATE TABLE job_demand_detailed (
  id SERIAL PRIMARY KEY,
  work_intelligence_id INTEGER REFERENCES work_intelligence_enhanced(id),
  job_name VARCHAR(50) NOT NULL,
  job_category VARCHAR(20) NOT NULL,
  jobs_posted INTEGER NOT NULL,
  callbacks_posted INTEGER DEFAULT 0,
  workers_available INTEGER,
  dispatch_likelihood VARCHAR(20), -- very_high, high, moderate, low, very_low
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 5. TESTING & VALIDATION

### Test Scenarios:
1. **Authentication Test**: Verify scraper can login to BCMEA portal
2. **Data Parsing Test**: Confirm job breakdown extraction works
3. **Callback Detection Test**: Simulate job changes to test delta detection  
4. **High-Frequency Test**: Run 10-minute intervals during dispatch hours
5. **Error Handling Test**: Test network failures, auth expiry, page changes

### Validation Checklist:
- ✅ Sub-job granularity captured (not just "MACHINE: 25")
- ✅ Callbacks separated from original postings
- ✅ Timestamps accurate for change detection  
- ✅ Screenshots saved for manual verification
- ✅ Intelligence insights generated correctly
- ✅ Data structure matches Work Intelligence UI expectations

## 6. MONITORING & ALERTS

### Success Metrics:
- **Data Completeness**: >95% successful scrapes during dispatch hours
- **Granularity**: Job breakdown captured in >90% of scrapes
- **Callback Detection**: <15 minute latency for new job postings
- **Uptime**: <5% failure rate during critical periods (6-10 AM)

### Alert Conditions:
- Scraper fails 3+ consecutive runs
- No job data captured for >30 minutes during dispatch hours  
- Authentication expires
- Significant drop in job count (possible page structure change)
- Callback volume exceeds historical norms (potential issue or surge)

## 7. NEXT STEPS

### Immediate (This Week):
1. **Deploy enhanced scraper** with basic job breakdown
2. **Test authentication** and data extraction  
3. **Set up high-frequency monitoring** (every 10 minutes 6-10 AM)
4. **Validate data structure** matches UI expectations

### Short-term (Next Week):
1. **Integrate with Work Intelligence UI** 
2. **Add database storage** for scraped data
3. **Implement callback alerts** for users
4. **Add prediction accuracy tracking**

### Long-term (Following Weeks):
1. **Machine learning** for pattern recognition
2. **Personalized predictions** based on user board/ratings
3. **Real-time alerts** for job opportunities
4. **Historical trend analysis** and forecasting

---

**Status:** Ready for deployment and testing
**Dependencies:** Puppeteer, BCMEA authentication, Task Scheduler setup
**Expected Impact:** Granular job intelligence enabling accurate next-day predictions