import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { getAuthContext } from '../shared/auth-helper.js';
import { DATA_DIR, BCMEA_BASE_URL, ACCOUNT_BOARD, SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../shared/config.js';
import { makeLogger, localDateStr, randomDelay } from '../shared/utils.js';
import { createClient } from '@supabase/supabase-js';

// Dispatch Monitor for PORTPAL
// Scrapes current job dispatch status and job counts from BCMEA portal
// Updates the PortPal database with fresh job availability data

const DISPATCH_DIR = path.join(DATA_DIR, 'dispatch');
const log = makeLogger('dispatch-monitor');

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

interface JobSite {
  name: string;
  dates: Array<{
    at: string;
    pre: string;
    date: string;
    shift: string;
  }>;
}

interface Job {
  job: string;
  sites: JobSite[] | null;
}

interface Section {
  section: string;
  jobs: Job[];
  totals: Array<{
    at: string;
    pre: string;
    date: string;
    shift: string;
  }>;
}

interface LocationData {
  location: string;
  totals: Array<{
    at: string;
    pre: string;
    date: string;
    shift: string;
  }>;
  sections: Section[];
}

(async () => {
  try {
    fs.mkdirSync(DISPATCH_DIR, { recursive: true });

    // Small random delay to avoid clockwork scraping
    await randomDelay(0, 30 * 1000); // 0-30 seconds

    const now = new Date();
    const dateStr = localDateStr(now);
    const timestamp = now.toISOString();

    log(`Starting dispatch monitor run at ${timestamp}...`);

    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await getAuthContext(browser, ACCOUNT_BOARD, BCMEA_BASE_URL, log);
    const page = await context.newPage();

    // Collect dispatch data from all locations
    const locations = ['vancouver', 'squamish', 'coastwise'];
    const dispatchData: Record<string, LocationData> = {};
    let totalJobs = 0;
    let totalFilled = 0;

    // Monitor API responses to capture dispatch data
    const apiResponses: { url: string; body: any; location: string }[] = [];
    page.on('response', async (resp) => {
      const url = resp.url();
      try {
        if (url.includes('/api/dispatch/') || url.includes('/casual-board/')) {
          const body = JSON.parse(await resp.text());
          // Determine location from URL or other context
          let location = 'unknown';
          if (url.includes('vancouver') || url.includes('/vancouver/')) location = 'vancouver';
          else if (url.includes('squamish') || url.includes('/squamish/')) location = 'squamish';
          else if (url.includes('coastwise') || url.includes('/coastwise/')) location = 'coastwise';
          
          apiResponses.push({ url, body, location });
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Visit dispatch pages for each location
    for (const location of locations) {
      log(`Scraping dispatch data for ${location}...`);
      
      try {
        // Navigate to location-specific dispatch page
        const dispatchUrl = `${BCMEA_BASE_URL}/dispatch/${location}`;
        await page.goto(dispatchUrl, { 
          waitUntil: 'networkidle', 
          timeout: 30000 
        }).catch(() => {
          // Try alternative URL structure
          return page.goto(`${BCMEA_BASE_URL}/${location}-dispatch`, { 
            waitUntil: 'networkidle', 
            timeout: 30000 
          });
        });
        
        await page.waitForTimeout(3000); // Allow API calls to complete

        // Try to find dispatch data in DOM if API calls don't work
        const dispatchSections = await page.locator('.dispatch-section, .job-section, .board-section').all();
        
        const locationData: LocationData = {
          location,
          totals: [],
          sections: []
        };

        // Parse dispatch sections from DOM
        for (const section of dispatchSections) {
          try {
            const sectionName = await section.locator('.section-title, h3, h2').textContent() || 'Unknown';
            const jobs = await section.locator('.job-row, .dispatch-job').all();
            
            const sectionJobs: Job[] = [];
            
            for (const jobElement of jobs) {
              const jobName = await jobElement.locator('.job-name, .job-title').textContent() || '';
              const openings = await jobElement.locator('.openings, .available, .pre').textContent() || '0';
              const filled = await jobElement.locator('.filled, .at').textContent() || '0';
              
              if (jobName.trim()) {
                sectionJobs.push({
                  job: jobName.trim(),
                  sites: [{
                    name: `${location.toUpperCase()} - ${jobName.trim()}`,
                    dates: [{
                      at: filled.replace(/\D/g, '') || '0',
                      pre: openings.replace(/\D/g, '') || '0',
                      date: dateStr,
                      shift: '08:00' // Default to morning shift
                    }]
                  }]
                });

                const jobOpenings = parseInt(openings.replace(/\D/g, '') || '0');
                const jobFilled = parseInt(filled.replace(/\D/g, '') || '0');
                totalJobs += jobOpenings;
                totalFilled += jobFilled;
              }
            }

            if (sectionJobs.length > 0) {
              locationData.sections.push({
                section: sectionName.trim(),
                jobs: sectionJobs,
                totals: [{
                  at: '0',
                  pre: sectionJobs.reduce((sum, job) => sum + parseInt(job.sites?.[0]?.dates[0]?.pre || '0'), 0).toString(),
                  date: dateStr,
                  shift: '08:00'
                }]
              });
            }
          } catch (e) {
            log(`Error parsing section: ${e}`);
          }
        }

        dispatchData[location] = locationData;
        log(`${location}: Found ${locationData.sections.length} sections with jobs`);

      } catch (error) {
        log(`Failed to scrape ${location}: ${error}`);
        // Create empty data for this location
        dispatchData[location] = {
          location,
          totals: [],
          sections: []
        };
      }
    }

    // Process API responses if we captured any
    for (const response of apiResponses) {
      if (response.body && response.body.sections) {
        const locationData = response.body as LocationData;
        if (locationData.location && locations.includes(locationData.location)) {
          dispatchData[locationData.location] = locationData;
          
          // Count jobs from API data
          for (const section of locationData.sections) {
            for (const total of section.totals) {
              totalJobs += parseInt(total.pre || '0');
              totalFilled += parseInt(total.at || '0');
            }
          }
        }
      }
    }

    await browser.close();

    // Save raw dispatch data
    const outputFile = path.join(DISPATCH_DIR, `${dateStr}_${now.getHours()}-${now.getMinutes()}.json`);
    const results = {
      scrapedAt: timestamp,
      date: dateStr,
      totalJobs,
      totalFilled,
      locations: dispatchData,
      apiResponseCount: apiResponses.length
    };

    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    log(`Saved dispatch data to ${outputFile}`);

    // Update Supabase if configured
    if (supabase && (totalJobs > 0 || apiResponses.length > 0)) {
      try {
        const { error } = await supabase
          .from('dispatch_monitor_ticks')
          .insert({
            location: 'all_locations',
            window_type: 'morning', // Could be dynamic based on time
            tick_at: timestamp,
            tick_num: Math.floor(Date.now() / 60000), // Simple tick number
            day_of_week: now.getDay(),
            date: dateStr,
            totals: Object.values(dispatchData).flatMap(loc => loc.totals),
            sections: Object.values(dispatchData).flatMap(loc => loc.sections),
            delta: {
              totalAtDelta: totalFilled,
              totalPreDelta: totalJobs,
              totalChanges: [],
              sectionChanges: []
            }
          });

        if (error) {
          log(`Supabase update failed: ${error.message}`);
        } else {
          log(`Updated Supabase with ${totalJobs} total jobs, ${totalFilled} filled`);
        }
      } catch (supabaseError) {
        log(`Supabase error: ${supabaseError}`);
      }
    }

    log(`Dispatch monitor completed: ${totalJobs} total jobs, ${totalFilled} filled`);

  } catch (error) {
    log(`Dispatch monitor failed: ${error}`);
    process.exit(1);
  }
})();