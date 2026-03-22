/**
 * Enhanced Work Info Scraper for BCMEA
 * Collects granular job data including sub-categories and callbacks
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  auth: {
    username: process.env.BCMEA_USERNAME || '48064',
    password: process.env.BCMEA_PASSWORD || '',
    baseUrl: 'https://mybcmea.bcmea.com'
  },
  monitoring: {
    highFrequency: 10 * 60 * 1000, // 10 minutes during dispatch hours
    normalFrequency: 60 * 60 * 1000, // 1 hour outside dispatch hours
    dispatchHours: {
      start: 6, // 6 AM
      end: 10   // 10 AM
    }
  },
  dataDir: './data/work-info-enhanced',
  screenshotDir: './screenshots/work-info'
};

// Job category mapping for granular parsing
const JOB_CATEGORIES = {
  MACHINE: [
    'LIFT TRUCK', 'RTG', 'REACHSTACKER', 'FRONT END LOADER',
    'KOMATSU', 'BULLDOZER', 'EXCAVATOR', 'MOBILE CRANE'
  ],
  TRADES: [
    'HD MECHANIC', 'ELECTRICIAN', 'CARPENTER', 'MILLWRIGHT',
    'PLUMBER', 'WELDER', 'TRACKMEN'
  ],
  CRANE_OPS: [
    'DOCK GANTRY', 'SHIP GANTRY', 'RAIL MOUNTED GANTRY'
  ],
  SPECIALIZED: [
    'TRACTOR TRAILER', 'HEAD CHECKER', 'WHEAT MACHINE',
    'WHEAT SPECIALTY', 'FIRST AID', 'STORESPERSON'
  ]
};

class EnhancedWorkScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.previousData = null; // For callback detection
    this.isDispatchHours = this.checkDispatchHours();
  }

  checkDispatchHours() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= CONFIG.monitoring.dispatchHours.start && 
           hour <= CONFIG.monitoring.dispatchHours.end;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set user agent and viewport
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async login() {
    try {
      await this.page.goto(`${CONFIG.auth.baseUrl}/login`, { 
        waitUntil: 'networkidle2' 
      });
      
      // Fill login form (adjust selectors based on actual page)
      await this.page.type('#username', CONFIG.auth.username);
      await this.page.type('#password', CONFIG.auth.password);
      await this.page.click('button[type="submit"]');
      
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Login successful');
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  async scrapeWorkInfo() {
    try {
      // Navigate to work info page
      await this.page.goto(`${CONFIG.auth.baseUrl}/work-info`, {
        waitUntil: 'networkidle2'
      });

      // Take screenshot for debugging
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await this.page.screenshot({
        path: `${CONFIG.screenshotDir}/work-info-${timestamp}.png`,
        fullPage: true
      });

      // Extract job data with granular parsing
      const workData = await this.page.evaluate(() => {
        const extractJobData = () => {
          const data = {
            timestamp: new Date().toISOString(),
            shifts: {},
            totalJobs: 0,
            jobBreakdown: {}
          };

          // Look for shift tabs or sections (DAY, NIGHT, GRAVEYARD)
          const shifts = ['DAY', 'NIGHT', 'GRAVEYARD'];
          
          shifts.forEach(shift => {
            data.shifts[shift] = {
              totalJobs: 0,
              categories: {},
              jobs: {}
            };

            // Parse job listings for this shift
            // This will need to be customized based on actual page structure
            const jobElements = document.querySelectorAll(`[data-shift="${shift}"] .job-item, .job-listing`);
            
            jobElements.forEach(element => {
              const jobText = element.textContent || '';
              
              // Extract job name and count
              const jobMatch = jobText.match(/([A-Z\s]+):\s*(\d+)/);
              if (jobMatch) {
                const [, jobName, count] = jobMatch;
                const jobCount = parseInt(count, 10);
                
                data.shifts[shift].jobs[jobName.trim()] = jobCount;
                data.shifts[shift].totalJobs += jobCount;
                
                // Categorize job
                const category = this.categorizeJob(jobName.trim());
                if (!data.shifts[shift].categories[category]) {
                  data.shifts[shift].categories[category] = 0;
                }
                data.shifts[shift].categories[category] += jobCount;
              }
            });
          });

          return data;
        };

        // Helper function to categorize jobs
        window.categorizeJob = (jobName) => {
          if (['LIFT TRUCK', 'RTG', 'REACHSTACKER', 'FRONT END LOADER', 'KOMATSU', 'BULLDOZER', 'EXCAVATOR', 'MOBILE CRANE'].includes(jobName)) {
            return 'MACHINE';
          } else if (['HD MECHANIC', 'ELECTRICIAN', 'CARPENTER', 'MILLWRIGHT', 'PLUMBER', 'WELDER', 'TRACKMEN'].includes(jobName)) {
            return 'TRADES';
          } else if (['DOCK GANTRY', 'SHIP GANTRY', 'RAIL MOUNTED GANTRY'].includes(jobName)) {
            return 'CRANE_OPS';
          } else if (['TRACTOR TRAILER', 'HEAD CHECKER', 'WHEAT MACHINE', 'WHEAT SPECIALTY'].includes(jobName)) {
            return 'SPECIALIZED';
          } else {
            return 'OTHER';
          }
        };

        return extractJobData();
      });

      // Detect callbacks by comparing with previous data
      if (this.previousData) {
        workData.callbacks = this.detectCallbacks(this.previousData, workData);
      }

      // Save enhanced data
      await this.saveWorkData(workData);
      this.previousData = workData;

      console.log(`✅ Scraped work info: ${workData.totalJobs} total jobs`);
      return workData;

    } catch (error) {
      console.error('❌ Work info scraping failed:', error.message);
      throw error;
    }
  }

  detectCallbacks(previousData, currentData) {
    const callbacks = {
      timestamp: new Date().toISOString(),
      newJobs: {},
      totalNewJobs: 0
    };

    // Compare current data with previous to find new jobs
    Object.keys(currentData.shifts).forEach(shift => {
      const currentJobs = currentData.shifts[shift].jobs;
      const previousJobs = previousData.shifts?.[shift]?.jobs || {};

      Object.keys(currentJobs).forEach(jobName => {
        const currentCount = currentJobs[jobName];
        const previousCount = previousJobs[jobName] || 0;
        
        if (currentCount > previousCount) {
          const newCount = currentCount - previousCount;
          callbacks.newJobs[`${shift}_${jobName}`] = {
            jobName,
            shift,
            newCount,
            previousCount,
            currentCount
          };
          callbacks.totalNewJobs += newCount;
        }
      });
    });

    return callbacks;
  }

  async saveWorkData(data) {
    const dateStr = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `work-info-${timestamp}.json`;
    
    // Ensure directory exists
    const dirPath = path.join(CONFIG.dataDir, dateStr);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    const filepath = path.join(dirPath, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    // Also save as latest.json for easy access
    fs.writeFileSync(path.join(CONFIG.dataDir, 'latest.json'), JSON.stringify(data, null, 2));
    
    console.log(`💾 Saved work data to ${filepath}`);
  }

  async scrapeDOA() {
    try {
      await this.page.goto(`${CONFIG.auth.baseUrl}/doa-forecast`, {
        waitUntil: 'networkidle2'
      });

      // Enhanced DOA parsing for granular availability
      const doaData = await this.page.evaluate(() => {
        const data = {
          timestamp: new Date().toISOString(),
          shifts: {},
          totalAvailable: 0,
          availabilityByJob: {}
        };

        // Parse DOA forecast page for job-specific availability
        // This structure will depend on actual page layout
        const jobElements = document.querySelectorAll('.job-availability, .availability-item');
        
        jobElements.forEach(element => {
          const text = element.textContent || '';
          
          // Look for patterns like "LIFT TRUCK: 45 available, 8 needed"
          const match = text.match(/([A-Z\s]+):\s*(\d+)\s*available[,\s]*(\d+)\s*needed/i);
          if (match) {
            const [, jobName, available, needed] = match;
            data.availabilityByJob[jobName.trim()] = {
              available: parseInt(available, 10),
              needed: parseInt(needed, 10),
              ratio: parseInt(available, 10) / parseInt(needed, 10),
              likelihood: this.calculateLikelihood(parseInt(available, 10), parseInt(needed, 10))
            };
          }
        });

        return data;
      });

      // Save DOA data
      const dateStr = new Date().toISOString().split('T')[0];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `doa-${timestamp}.json`;
      const filepath = path.join(CONFIG.dataDir, dateStr, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(doaData, null, 2));
      console.log(`✅ Scraped DOA data: ${Object.keys(doaData.availabilityByJob).length} job types`);
      
      return doaData;

    } catch (error) {
      console.error('❌ DOA scraping failed:', error.message);
      throw error;
    }
  }

  calculateLikelihood(available, needed) {
    const ratio = available / needed;
    if (ratio >= 5) return 'very_high';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.2) return 'moderate';
    if (ratio >= 0.8) return 'low';
    return 'very_low';
  }

  async run() {
    try {
      await this.init();
      await this.login();
      
      const workData = await this.scrapeWorkInfo();
      const doaData = await this.scrapeDOA();

      // Combine work and availability data for intelligence
      const combinedData = {
        timestamp: new Date().toISOString(),
        workInfo: workData,
        availability: doaData,
        intelligence: this.generateIntelligence(workData, doaData)
      };

      // Save combined intelligence
      const filepath = path.join(CONFIG.dataDir, 'work-intelligence-latest.json');
      fs.writeFileSync(filepath, JSON.stringify(combinedData, null, 2));

      console.log('✅ Enhanced work scraping complete');
      return combinedData;

    } catch (error) {
      console.error('❌ Enhanced scraping failed:', error.message);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateIntelligence(workData, doaData) {
    const intelligence = {
      busynessLevel: 'medium',
      busynessScore: 50,
      insights: [],
      jobPredictions: {}
    };

    // Calculate overall busyness
    const totalJobs = Object.values(workData.shifts).reduce((sum, shift) => sum + shift.totalJobs, 0);
    intelligence.busynessScore = Math.min(100, (totalJobs / 200) * 100); // Normalize to 100

    if (intelligence.busynessScore >= 75) intelligence.busynessLevel = 'high';
    else if (intelligence.busynessScore <= 25) intelligence.busynessLevel = 'low';

    // Generate insights
    intelligence.insights.push(`${totalJobs} total jobs posted - ${intelligence.busynessLevel} activity level`);

    if (workData.callbacks?.totalNewJobs > 0) {
      intelligence.insights.push(`${workData.callbacks.totalNewJobs} callback jobs detected since last check`);
    }

    // Job-specific predictions
    Object.keys(doaData.availabilityByJob).forEach(jobName => {
      const job = doaData.availabilityByJob[jobName];
      intelligence.jobPredictions[jobName] = {
        likelihood: job.likelihood,
        ratio: job.ratio,
        prediction: job.ratio >= 2 ? 'high_chance' : job.ratio >= 1 ? 'moderate_chance' : 'low_chance'
      };
    });

    return intelligence;
  }
}

// Monitoring loop
async function startMonitoring() {
  const scraper = new EnhancedWorkScraper();
  
  const runScrape = async () => {
    try {
      await scraper.run();
    } catch (error) {
      console.error('Scrape failed:', error.message);
    }
  };

  // Initial run
  await runScrape();

  // Set up recurring monitoring
  const interval = scraper.isDispatchHours ? 
    CONFIG.monitoring.highFrequency : 
    CONFIG.monitoring.normalFrequency;

  setInterval(runScrape, interval);
  console.log(`🚀 Monitoring started - checking every ${interval/60000} minutes`);
}

// Export for use in other scripts
module.exports = { EnhancedWorkScraper, startMonitoring };

// Run if called directly
if (require.main === module) {
  startMonitoring().catch(console.error);
}