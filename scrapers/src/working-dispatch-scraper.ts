import { chromium } from 'playwright';
import { ACCOUNT_BOARD, SUPABASE_URL, SUPABASE_SERVICE_KEY } from './shared/config.js';
import { makeLogger, localDateStr } from './shared/utils.js';
import { createClient } from '@supabase/supabase-js';

const log = makeLogger('working-dispatch');

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  const now = new Date();
  const dateStr = localDateStr(now);
  const timestamp = now.toISOString();

  log(`Starting working dispatch scraper at ${timestamp}...`);

  try {
    // Step 1: Navigate and authenticate
    await page.goto('https://mybcmea.bcmea.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('text=Sign In').click();
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[name="Username"], input[name="username"], input[type="text"]', ACCOUNT_BOARD.id);
    await page.fill('input[type="password"]', ACCOUNT_BOARD.password);
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    log('✅ Authentication successful');

    // Step 2: Navigate to Vancouver Work page
    await page.waitForTimeout(5000);
    await page.locator('a:has-text("Vancouver Work")').click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    log('✅ Navigated to Vancouver Work page');

    // Step 3: Extract the raw content
    const bodyText = await page.textContent('body');
    log(`📄 Page content: ${bodyText?.length} characters`);

    // Step 4: Parse the dispatch data structure
    // The format appears to be: JobTypeXXPreAtPreAtPreAt where XX are numbers
    
    // Find the section with job data
    const jobDataMatch = bodyText?.match(/JobPreAt.*?(?=\n|$)/s);
    if (!jobDataMatch) {
      log('❌ Could not find job data section');
      return;
    }

    const jobDataText = jobDataMatch[0];
    log(`🔍 Job data section: ${jobDataText}`);

    // Parse job categories and their numbers
    const jobCategories = [
      'Trades', 'Machine', 'Rail', 'Warehouse', 'Dock', 'Wheat', 'Checkers', 'First Aid', 'Topside', 'Hold'
    ];

    let totalPre = 0;
    let totalAt = 0;
    const jobBreakdown: any = [];

    for (const category of jobCategories) {
      const categoryPattern = new RegExp(`${category}(\\d+)(\\d+)(\\d+)(\\d+)(\\d+)(\\d+)`, 'i');
      const match = jobDataText.match(categoryPattern);
      
      if (match) {
        // The pattern typically is: CategoryPRE-08:00-AT-08:00-PRE-16:30-AT-16:30-PRE-01:00-AT-01:00
        // Based on the data, it looks like pairs of numbers for each shift
        const pre08 = parseInt(match[1]) || 0;
        const at08 = parseInt(match[2]) || 0;
        const pre1630 = parseInt(match[3]) || 0; 
        const at1630 = parseInt(match[4]) || 0;
        const pre01 = parseInt(match[5]) || 0;
        const at01 = parseInt(match[6]) || 0;
        
        // For current time, determine which shift to use
        const currentHour = now.getHours();
        let currentPre, currentAt;
        
        if (currentHour >= 6 && currentHour < 14) {
          // Morning shift (08:00)
          currentPre = pre08;
          currentAt = at08;
        } else if (currentHour >= 14 && currentHour < 22) {
          // Afternoon shift (16:30)
          currentPre = pre1630;
          currentAt = at1630;
        } else {
          // Night shift (01:00)
          currentPre = pre01;
          currentAt = at01;
        }
        
        totalPre += currentPre;
        totalAt += currentAt;
        
        jobBreakdown.push({
          category,
          pre: currentPre,
          at: currentAt,
          shifts: {
            '08:00': { pre: pre08, at: at08 },
            '16:30': { pre: pre1630, at: at1630 },
            '01:00': { pre: pre01, at: at01 }
          }
        });
        
        log(`📊 ${category}: ${currentPre} pre, ${currentAt} at (current shift)`);
      }
    }

    log(`🎯 TOTALS: ${totalPre} jobs available, ${totalAt} filled`);

    // Step 5: Save screenshot
    await page.screenshot({ path: `/tmp/working-dispatch-${Date.now()}.png`, fullPage: true });

    // Step 6: Update Supabase
    if (supabase && totalPre > 0) {
      try {
        const { error } = await supabase
          .from('dispatch_monitor_ticks')
          .insert({
            location: 'vancouver',
            window_type: getWindowType(now),
            tick_at: timestamp,
            tick_num: Math.floor(Date.now() / 60000),
            day_of_week: now.getDay(),
            date: dateStr,
            totals: [{
              at: totalAt.toString(),
              pre: totalPre.toString(),
              date: dateStr,
              shift: getCurrentShift(now)
            }],
            sections: jobBreakdown.map(job => ({
              section: job.category.toLowerCase(),
              jobs: [],
              totals: [{
                at: job.at.toString(),
                pre: job.pre.toString(),
                date: dateStr,
                shift: getCurrentShift(now)
              }]
            })),
            delta: {
              location: 'vancouver',
              totalAtDelta: totalAt,
              totalPreDelta: totalPre,
              totalChanges: [],
              sectionChanges: []
            }
          });

        if (error) {
          log(`⚠️ Supabase update failed: ${error.message}`);
        } else {
          log(`📊 Successfully updated Supabase with ${totalPre} pre, ${totalAt} at`);
        }
      } catch (supabaseError) {
        log(`⚠️ Supabase error: ${supabaseError}`);
      }
    }

    log(`🎉 SUCCESS: Scraped ${totalPre} total jobs, ${totalAt} filled`);

  } catch (error) {
    log(`💥 Working dispatch scraper failed: ${error}`);
  }

  await browser.close();
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