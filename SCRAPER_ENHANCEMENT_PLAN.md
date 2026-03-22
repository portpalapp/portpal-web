# SCRAPER ENHANCEMENT PLAN
## Comprehensive Data Collection for Work Intelligence

Based on requirements for granular work intelligence and callback tracking, here's what our scrapers need to collect:

## 1. WORK INFO SCRAPER (Primary Job Data)

### Current Target: 
- BCMEA work-info pages (6x daily)
- High-level job categories

### Enhanced Requirements:
**Sub-job Granularity Within Categories:**
- MACHINE category breakdown:
  - LIFT TRUCK: X jobs
  - RTG (Rubber Tire Gantry): X jobs  
  - REACHSTACKER: X jobs
  - FRONT END LOADER: X jobs
  - KOMATSU: X jobs
  - BULLDOZER: X jobs
  - EXCAVATOR: X jobs
  - MOBILE CRANE: X jobs

- TRADES category breakdown:
  - HD MECHANIC: X jobs
  - ELECTRICIAN: X jobs
  - CARPENTER: X jobs
  - MILLWRIGHT: X jobs
  - PLUMBER: X jobs
  - WELDER: X jobs

- CRANE OPERATIONS breakdown:
  - DOCK GANTRY: X jobs
  - SHIP GANTRY: X jobs
  - RAIL MOUNTED GANTRY: X jobs

**Callback vs Original Tracking:**
- Original postings at 6 AM
- Callback postings throughout day
- Separate counts for each
- Track callback timing (when posted)
- Track which jobs get callbacks most frequently

**Enhanced Data Structure:**
```json
{
  "date": "2026-03-22",
  "shift": "DAY",
  "timestamp": "2026-03-21T18:00:00Z",
  "totalJobs": 180,
  "totalCallbacks": 23,
  "categories": {
    "LABOUR": {
      "original": 45,
      "callbacks": 8,
      "total": 53
    },
    "MACHINE": {
      "original": 25,
      "callbacks": 5,
      "total": 30,
      "breakdown": {
        "LIFT_TRUCK": { "original": 8, "callbacks": 2 },
        "RTG": { "original": 5, "callbacks": 1 },
        "REACHSTACKER": { "original": 3, "callbacks": 0 },
        "FRONT_END_LOADER": { "original": 4, "callbacks": 1 },
        "KOMATSU": { "original": 2, "callbacks": 0 },
        "BULLDOZER": { "original": 1, "callbacks": 0 },
        "MOBILE_CRANE": { "original": 2, "callbacks": 1 }
      }
    }
  }
}
```

## 2. DOA (Declaration of Availability) SCRAPER

### Current Status: 
- DONE - captures supply side
- URL: `mybcmea.bcmea.com/doa-forecast`

### Enhancement Needed:
**Granular Availability by Job Type:**
- Not just "294 eligible workers"
- Break down by specific job types:
  - How many LIFT TRUCK operators declared available?
  - How many RTG operators declared available?
  - Specific shortages by job type

**Supply/Demand Analysis:**
```json
{
  "shift": "DAY",
  "date": "2026-03-22",
  "supplyDemand": {
    "LIFT_TRUCK": {
      "jobsRequired": 8,
      "workersAvailable": 45,
      "ratio": 5.6,
      "likelihood": "very_high"
    },
    "DOCK_GANTRY": {
      "jobsRequired": 7,
      "workersAvailable": 2,
      "shortage": 5,
      "likelihood": "very_low"
    }
  }
}
```

## 3. BUTTON MONITOR SCRAPER

### Current Status:
- Hourly monitoring of button positions
- Union/casual/telephone buttons

### Enhancement for Sub-jobs:
**Granular Button Tracking:**
- Instead of just "MACHINE button at position 156"
- Track individual job buttons:
  - LIFT_TRUCK_button: 156
  - RTG_button: 89
  - REACHSTACKER_button: 203

**Button Velocity Analysis:**
- Track how fast buttons move for each job
- Predict when button will reach specific plates
- Historical button movement patterns by job type

## 4. NEW: CALLBACK TRACKING SCRAPER

### Purpose: 
- Monitor work-info pages throughout the day
- Detect when new jobs are posted (callbacks)
- Track timing and frequency patterns

### Data Collection:
**High-Frequency Monitoring:**
- Check work-info every 10-15 minutes during dispatch hours
- Detect delta changes = new callbacks posted
- Track which job types get callbacks most often
- Time-stamp when callbacks appear

**Pattern Analysis:**
- Friday callbacks predict Saturday workload
- Vessel arrival delays trigger callback surges  
- Weather delays create callback patterns
- Terminal-specific callback tendencies

## 5. ENHANCED: VESSEL FORECAST SCRAPER

### Current Status:
- Hourly vessel forecast monitoring
- 3-shift-ahead gang predictions

### Sub-job Enhancements:
**Vessel-to-Job-Type Mapping:**
- Container ships → DOCK GANTRY, LIFT TRUCK demand
- Bulk carriers → GRAB CRANE, WHEAT MACHINE demand
- Breakbulk → MOBILE CRANE, STEVEDORE demand
- Auto carriers → specialized STEVEDORE work

**Predictive Job Breakdown:**
```json
{
  "vessel": "MSC MICHIGAN",
  "eta": "2026-03-22T08:00:00Z", 
  "cargoType": "container",
  "predictedJobs": {
    "DOCK_GANTRY": 6,
    "LIFT_TRUCK": 12, 
    "TRACTOR_TRAILER": 8,
    "LABOUR": 25
  }
}
```

## 6. IMPLEMENTATION PRIORITY

### Phase 1: Critical Enhancements (This Week)
1. **Sub-job breakdown** in work-info scraper
2. **Callback detection** and separate tracking
3. **High-frequency monitoring** setup (every 10-15 min)

### Phase 2: Advanced Analysis (Next Week)  
1. **Granular DOA availability** by job type
2. **Individual button tracking** by specific job
3. **Vessel-to-job prediction** modeling

### Phase 3: Intelligence Layer (Following Week)
1. **Pattern recognition** for callback predictions
2. **Supply/demand ratio** analysis and alerts
3. **Personalized dispatch probability** based on job ratings

## 7. TECHNICAL REQUIREMENTS

### Scraper Infrastructure:
- **Windows Task Scheduler**: Update frequency for critical scrapers
- **Error Handling**: Robust retry logic for authentication issues
- **Data Storage**: Enhanced JSON structure for granular data
- **Screenshot Capture**: Visual backup of work-info pages for debugging

### Data Pipeline:
- **Real-time ingestion**: Stream scraper data to Supabase
- **Change detection**: Trigger alerts on significant job posting changes
- **Historical analysis**: Build trend database for prediction modeling

## 8. SUCCESS METRICS

### Data Quality:
- ✅ Capture individual job types within categories (not just "MACHINE: 25")
- ✅ Separate callback tracking from original postings
- ✅ 95%+ uptime for high-frequency monitoring
- ✅ Sub-15-minute callback detection latency

### Business Impact:
- ✅ Enable accurate next-day job predictions by specific type
- ✅ Provide "should I plug in?" guidance with 85%+ accuracy  
- ✅ Alert users to callback opportunities in real-time
- ✅ Support "which job will I get?" predictions

---

**Next Steps:**
1. Review existing scraper code structure
2. Implement sub-job parsing for work-info pages
3. Set up callback detection monitoring
4. Test high-frequency data collection
5. Validate enhanced data structure with actual BCMEA pages