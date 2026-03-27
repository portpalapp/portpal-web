import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR, BCMEA_BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../shared/config.js';
import { makeLogger, localDateStr, randomDelay, sleep } from '../shared/utils.js';
import { createClient } from '@supabase/supabase-js';

// Simple Dispatch Scraper for PORTPAL
// Attempts to scrape job counts without requiring full authentication
// Falls back to parsing publicly available information

const DISPATCH_DIR = path.join(DATA_DIR, 'dispatch');
const log = makeLogger('simple-dispatch');

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

interface ScrapedJobData {
  location: string;
  totalJobs: number;
  totalFilled: number;
  lastUpdated: string;
  source: string;
}

(async () => {
  try {
    fs.mkdirSync(DISPATCH_DIR, { recursive: true });

    // Small random delay
    await randomDelay(0, 10 * 1000);

    const now = new Date();
    const dateStr = localDateStr(now);
    const timestamp = now.toISOString();

    log(`Starting simple dispatch scraper at ${timestamp}...`);

    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();

    const scrapedData: ScrapedJobData[] = [];
    let totalJobsOverall = 0;
    let totalFilledOverall = 0;

    // Try different approaches to get job data
    const approaches = [
      // Approach 1: Try main BCMEA page
      {
        name: 'BCMEA Main',
        url: BCMEA_BASE_URL,
        handler: async () => {
          await page.goto(BCMEA_BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
          
          // Look for any job-related text on the main page
          const pageText = await page.textContent('body');
          const jobMatches = pageText?.match(/(\d+)\s*(job|position|opening)/gi) || [];
          
          if (jobMatches.length > 0) {
            const jobCount = jobMatches.reduce((sum, match) => {
              const num = parseInt(match.match(/\d+/)?.[0] || '0');
              return sum + num;
            }, 0);
            
            return {
              location: 'bcmea',
              totalJobs: jobCount,
              totalFilled: 0,
              lastUpdated: timestamp,
              source: 'main_page'
            };
          }
          
          return null;
        }
      },
      
      // Approach 2: Try public dispatch pages
      {
        name: 'Public Dispatch',
        url: `${BCMEA_BASE_URL}/dispatch`,
        handler: async () => {
          try {
            await page.goto(`${BCMEA_BASE_URL}/dispatch`, { waitUntil: 'networkidle', timeout: 15000 });
            
            // Parse any visible job information
            const jobElements = await page.locator('tr, .job-row, .dispatch-item').all();
            let jobCount = 0;
            let filledCount = 0;
            
            for (const element of jobElements) {
              const text = await element.textContent() || '';
              
              // Look for patterns like "5/10" or "filled: 2, open: 8"
              const ratioMatch = text.match(/(\d+)\/(\d+)/);
              if (ratioMatch) {
                filledCount += parseInt(ratioMatch[1]);
                jobCount += parseInt(ratioMatch[2]);
              }
              
              // Look for individual numbers
              const numberMatches = text.match(/\d+/g);
              if (numberMatches && numberMatches.length >= 2) {
                jobCount += parseInt(numberMatches[0] || '0');
              }
            }
            
            if (jobCount > 0) {
              return {
                location: 'vancouver',
                totalJobs: jobCount,
                totalFilled: filledCount,
                lastUpdated: timestamp,
                source: 'public_dispatch'
              };
            }
          } catch (e) {
            // Page might not exist or be accessible
          }
          
          return null;
        }
      },
      
      // Approach 3: Try to access the API endpoints directly (they might be public)
      {
        name: 'API Direct',
        url: `${BCMEA_BASE_URL}/api`,
        handler: async () => {
          const apiEndpoints = [
            '/api/dispatch/vancouver',
            '/api/jobs/current',
            '/api/board/status',
            '/api/v1/dispatch'
          ];
          
          for (const endpoint of apiEndpoints) {
            try {
              const response = await page.goto(`${BCMEA_BASE_URL}${endpoint}`, { timeout: 10000 });
              if (response?.ok()) {
                const content = await page.textContent('body');
                if (content && content.includes('{')) {
                  // Looks like JSON data
                  const data = JSON.parse(content);
                  if (data.jobs || data.dispatch || data.totals) {
                    log(`Found data via ${endpoint}`);
                    // Extract job counts from the API response
                    let jobs = 0;
                    let filled = 0;
                    
                    if (data.totals) {
                      jobs = parseInt(data.totals.pre || data.totals.available || '0');
                      filled = parseInt(data.totals.at || data.totals.filled || '0');
                    }
                    
                    return {
                      location: 'api_direct',
                      totalJobs: jobs,
                      totalFilled: filled,
                      lastUpdated: timestamp,
                      source: endpoint
                    };
                  }
                }
              }
            } catch (e) {
              // Endpoint might not exist
            }
          }
          
          return null;
        }
      }
    ];

    // Try each approach
    for (const approach of approaches) {
      try {
        log(`Trying approach: ${approach.name}...`);
        const result = await approach.handler();
        if (result) {
          scrapedData.push(result);
          totalJobsOverall += result.totalJobs;
          totalFilledOverall += result.totalFilled;
          log(`${approach.name}: Found ${result.totalJobs} jobs, ${result.totalFilled} filled`);
        }
        
        // Small delay between approaches
        await sleep(2000);
        
      } catch (error) {
        log(`${approach.name} failed: ${error}`);
      }
    }

    await browser.close();

    // Save results
    const results = {
      scrapedAt: timestamp,
      date: dateStr,
      totalJobs: totalJobsOverall,
      totalFilled: totalFilledOverall,
      approaches: scrapedData,
      success: scrapedData.length > 0
    };

    const outputFile = path.join(DISPATCH_DIR, `simple_${dateStr}_${now.getHours()}-${now.getMinutes()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

    if (results.success) {
      log(`✅ Success: ${totalJobsOverall} jobs found, ${totalFilledOverall} filled`);
      
      // Update Supabase if we found any data and it's configured
      if (supabase && totalJobsOverall > 0) {
        try {
          const { error } = await supabase
            .from('dispatch_monitor_ticks')
            .insert({
              location: 'simple_scraper',
              window_type: getWindowType(now),
              tick_at: timestamp,
              tick_num: Math.floor(Date.now() / 60000),
              day_of_week: now.getDay(),
              date: dateStr,
              totals: [{
                at: totalFilledOverall.toString(),
                pre: totalJobsOverall.toString(),
                date: dateStr,
                shift: getCurrentShift(now)
              }],
              sections: scrapedData.map(data => ({
                section: data.location,
                jobs: [],
                totals: [{
                  at: data.totalFilled.toString(),
                  pre: data.totalJobs.toString(),
                  date: dateStr,
                  shift: getCurrentShift(now)
                }]
              })),
              delta: {
                location: 'simple_scraper',
                totalAtDelta: totalFilledOverall,
                totalPreDelta: totalJobsOverall,
                totalChanges: [],
                sectionChanges: []
              }
            });

          if (error) {
            log(`⚠️ Supabase update failed: ${error.message}`);
          } else {
            log(`📊 Updated Supabase successfully`);
          }
        } catch (supabaseError) {
          log(`⚠️ Supabase error: ${supabaseError}`);
        }
      }
    } else {
      log(`❌ No job data found with any approach`);
      // Don't exit with error - just log the failure
    }

    log(`Simple dispatch scraper completed`);

  } catch (error) {
    log(`💥 Simple dispatch scraper failed: ${error}`);
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