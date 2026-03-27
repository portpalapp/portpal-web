import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR, SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../shared/config.js';
import { makeLogger, localDateStr, sleep } from '../shared/utils.js';
import { createClient } from '@supabase/supabase-js';

// Public Job Scraper for PORTPAL
// Scrapes publicly available job information from BCMEA website
// Updates every 2 minutes during dispatch hours

const PUBLIC_JOBS_DIR = path.join(DATA_DIR, 'public-jobs');
const log = makeLogger('public-jobs');

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

interface PublicJobData {
  location: string;
  totalJobs: number;
  totalFilled: number;
  scrapedAt: string;
  source: string;
  rawData?: any;
}

(async () => {
  try {
    fs.mkdirSync(PUBLIC_JOBS_DIR, { recursive: true });

    const now = new Date();
    const dateStr = localDateStr(now);
    const timestamp = now.toISOString();

    log(`Starting public job scraper at ${timestamp}...`);

    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    const scrapedData: PublicJobData[] = [];
    
    // URLs to try for public job data
    const publicUrls = [
      'https://mybcmea.bcmea.com',
      'https://mybcmea.bcmea.com/dispatch',
      'https://mybcmea.bcmea.com/jobs',
      'https://mybcmea.bcmea.com/work-info',
      'https://bcmea.com',
      'https://bcmea.com/jobs',
      'https://bcmea.com/dispatch'
    ];

    for (const url of publicUrls) {
      try {
        log(`Trying ${url}...`);
        
        const response = await page.goto(url, { 
          waitUntil: 'networkidle', 
          timeout: 15000 
        });
        
        if (!response?.ok()) {
          log(`${url}: HTTP ${response?.status()}`);
          continue;
        }

        // Wait a bit for any dynamic content
        await sleep(3000);

        // Look for job-related content in the page
        const pageContent = await page.content();
        const pageText = await page.textContent('body') || '';
        
        // Extract numbers that might represent jobs
        const numberPatterns = [
          // Look for patterns like "182 jobs", "242 positions", "5 filled"
          /(\d+)\s*(job|position|opening|available|filled|dispatched)/gi,
          // Look for ratios like "5/182" or "2 of 242"  
          /(\d+)[\s/]+(?:of\s+|\/\s*)(\d+)/gi,
          // Look for large numbers that might be job counts
          /(?:total|available|open)[\s:]*(\d{2,3})/gi
        ];

        let totalJobs = 0;
        let totalFilled = 0;
        let foundData = false;

        for (const pattern of numberPatterns) {
          const matches = pageText.match(pattern);
          if (matches) {
            for (const match of matches) {
              const numbers = match.match(/\d+/g);
              if (numbers) {
                const num = parseInt(numbers[0]);
                if (num > 50 && num < 500) { // Reasonable job count range
                  if (match.toLowerCase().includes('filled') || match.toLowerCase().includes('dispatched')) {
                    totalFilled += num;
                  } else {
                    totalJobs += num;
                  }
                  foundData = true;
                  log(`Found: "${match}" -> jobs:${totalJobs}, filled:${totalFilled}`);
                }
                
                // Handle ratios like "5/182"
                if (numbers.length === 2) {
                  const filled = parseInt(numbers[0]);
                  const total = parseInt(numbers[1]);
                  if (total > 50 && total < 500 && filled < total) {
                    totalFilled = filled;
                    totalJobs = total;
                    foundData = true;
                    log(`Found ratio: ${filled}/${total}`);
                  }
                }
              }
            }
          }
        }

        // Also try to find structured data (JSON-LD, etc.)
        const scriptTags = await page.locator('script[type="application/ld+json"], script[type="application/json"]').all();
        for (const script of scriptTags) {
          try {
            const content = await script.textContent();
            if (content) {
              const data = JSON.parse(content);
              if (data.jobs || data.positions || data.openings) {
                log(`Found structured data in ${url}`);
                // Extract job counts from structured data
                foundData = true;
              }
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }

        if (foundData) {
          const jobData: PublicJobData = {
            location: url.includes('mybcmea') ? 'mybcmea' : 'bcmea',
            totalJobs,
            totalFilled,
            scrapedAt: timestamp,
            source: url
          };
          
          scrapedData.push(jobData);
          log(`✅ ${url}: ${totalJobs} jobs, ${totalFilled} filled`);
          
          // If we found good data, no need to try more URLs
          if (totalJobs > 100) break;
        } else {
          log(`❌ ${url}: No job data found`);
        }

        await sleep(2000); // Be respectful between requests

      } catch (error) {
        log(`❌ ${url}: ${error}`);
      }
    }

    await browser.close();

    // Save results
    const totalJobsFound = scrapedData.reduce((sum, d) => sum + d.totalJobs, 0);
    const totalFilledFound = scrapedData.reduce((sum, d) => sum + d.totalFilled, 0);

    const results = {
      scrapedAt: timestamp,
      date: dateStr,
      totalJobs: totalJobsFound,
      totalFilled: totalFilledFound,
      sources: scrapedData,
      success: scrapedData.length > 0
    };

    const outputFile = path.join(PUBLIC_JOBS_DIR, `public_${dateStr}_${now.getHours()}-${now.getMinutes()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

    if (results.success && totalJobsFound > 0) {
      log(`✅ SUCCESS: Found ${totalJobsFound} jobs, ${totalFilledFound} filled`);
      
      // Update Supabase with the public job data
      if (supabase) {
        try {
          const { error } = await supabase
            .from('dispatch_monitor_ticks')
            .insert({
              location: 'public_scraper',
              window_type: getWindowType(now),
              tick_at: timestamp,
              tick_num: Math.floor(Date.now() / 60000),
              day_of_week: now.getDay(),
              date: dateStr,
              totals: [{
                at: totalFilledFound.toString(),
                pre: totalJobsFound.toString(),
                date: dateStr,
                shift: getCurrentShift(now)
              }],
              sections: scrapedData.map((data, index) => ({
                section: `public_source_${index}`,
                jobs: [],
                totals: [{
                  at: data.totalFilled.toString(),
                  pre: data.totalJobs.toString(),
                  date: dateStr,
                  shift: getCurrentShift(now)
                }]
              })),
              delta: {
                location: 'public_scraper',
                totalAtDelta: totalFilledFound,
                totalPreDelta: totalJobsFound,
                totalChanges: [],
                sectionChanges: []
              }
            });

          if (error) {
            log(`⚠️ Supabase update failed: ${error.message}`);
          } else {
            log(`📊 Updated PortPal database successfully`);
          }
        } catch (supabaseError) {
          log(`⚠️ Supabase error: ${supabaseError}`);
        }
      }
    } else {
      log(`❌ No public job data found from any source`);
    }

  } catch (error) {
    log(`💥 Public job scraper failed: ${error}`);
    process.exit(1);
  }
})();

function getWindowType(date: Date): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

function getCurrentShift(date: Date): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 14) return '08:00';
  if (hour >= 14 && hour < 22) return '16:30';
  return '01:00';
}