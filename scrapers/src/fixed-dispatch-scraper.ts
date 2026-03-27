import { chromium } from 'playwright';
import { ACCOUNT_BOARD, SUPABASE_URL, SUPABASE_SERVICE_KEY } from './shared/config.js';
import { makeLogger, localDateStr } from './shared/utils.js';
import { createClient } from '@supabase/supabase-js';

const log = makeLogger('fixed-dispatch');

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

  log(`Starting fixed dispatch scraper at ${timestamp}...`);

  try {
    // Step 1: Navigate to main page
    await page.goto('https://mybcmea.bcmea.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    log('✅ Main page loaded');

    // Step 2: Click Sign In
    await page.locator('text=Sign In').click();
    await page.waitForLoadState('domcontentloaded');
    log('🔄 Clicked Sign In');

    // Step 3: Fill login form
    await page.fill('input[name="Username"], input[name="username"], input[type="text"]', ACCOUNT_BOARD.id);
    await page.fill('input[type="password"]', ACCOUNT_BOARD.password);
    log('🔐 Credentials filled');

    // Step 4: Submit form with better selector
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]', 
      'button:has-text("Sign In")',
      'button:has-text("Log In")',
      'button:has-text("Login")',
      '.btn[type="submit"]'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          await button.click();
          submitted = true;
          log(`✅ Submitted with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!submitted) {
      // Try pressing Enter
      await page.keyboard.press('Enter');
      log('⌨️ Tried Enter key');
    }

    // Step 5: Wait for authentication to complete
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    log(`✅ Authentication complete, URL: ${page.url()}`);

    // Step 6: Wait for JavaScript app to load
    await page.waitForTimeout(5000);
    
    // Step 7: Look for dispatch/work/job links
    const possibleLinks = [
      'a:has-text("dispatch")',
      'a:has-text("Dispatch")', 
      'a:has-text("work")',
      'a:has-text("Work")',
      'a:has-text("job")',
      'a:has-text("Job")',
      'a:has-text("board")',
      'a:has-text("Board")',
      'a:has-text("vancouver")',
      'a:has-text("Vancouver")',
      'a[href*="dispatch"]',
      'a[href*="work"]',
      'a[href*="job"]'
    ];

    let foundDispatchPage = false;
    for (const linkSelector of possibleLinks) {
      try {
        const links = page.locator(linkSelector);
        const count = await links.count();
        if (count > 0) {
          const firstLink = links.first();
          const linkText = await firstLink.textContent();
          const href = await firstLink.getAttribute('href');
          log(`📋 Found link: "${linkText?.trim()}" -> ${href}`);
          
          await firstLink.click();
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          log(`✅ Navigated to dispatch page`);
          foundDispatchPage = true;
          break;
        }
      } catch (e) {
        // Try next link type
      }
    }

    if (!foundDispatchPage) {
      log('📍 No dispatch links found, checking current page content...');
    }

    // Step 8: Extract job data from current page
    await page.waitForTimeout(3000); // Let any dynamic content load
    
    const bodyText = await page.textContent('body');
    log(`📄 Page content loaded, ${bodyText?.length} characters`);

    // Look for job counts in various formats
    const jobPatterns = [
      /(\d+)\s*(?:jobs?|positions?|openings?|available)/gi,
      /(?:filled|dispatched|assigned):\s*(\d+)/gi,
      /(?:available|open|remaining):\s*(\d+)/gi,
      /(\d+)\s*\/\s*(\d+)/, // filled/total format
      /at:\s*(\d+).*?pre:\s*(\d+)/gi, // "at" and "pre" dispatch format
    ];

    let totalJobs = 0;
    let filledJobs = 0;

    for (const pattern of jobPatterns) {
      const matches = bodyText?.matchAll(new RegExp(pattern.source, 'gi'));
      if (matches) {
        for (const match of matches) {
          if (pattern.source.includes('\\/')) {
            // This is the filled/total pattern
            filledJobs = parseInt(match[1]) || 0;
            totalJobs = parseInt(match[2]) || 0;
            log(`📊 Found ratio pattern: ${filledJobs}/${totalJobs}`);
          } else if (pattern.source.includes('at:') && match[1] && match[2]) {
            // This is the dispatch format
            filledJobs = parseInt(match[1]) || 0;
            totalJobs = parseInt(match[2]) || 0;
            log(`📊 Found dispatch pattern: at:${filledJobs} pre:${totalJobs}`);
          } else {
            const num = parseInt(match[1]) || 0;
            if (num > 50 && num < 500) { // Reasonable job count
              if (match[0].toLowerCase().includes('filled') || match[0].toLowerCase().includes('dispatched')) {
                filledJobs = num;
              } else {
                totalJobs = num;
              }
              log(`📊 Found job count: ${match[0]} -> ${num}`);
            }
          }
        }
      }
    }

    // Step 9: Take screenshot for debugging
    await page.screenshot({ path: `/tmp/dispatch-success-${Date.now()}.png`, fullPage: true });
    
    // Step 10: Report results
    if (totalJobs > 0 || filledJobs > 0) {
      log(`🎉 SUCCESS: Found ${totalJobs} total jobs, ${filledJobs} filled`);
      
      // Update Supabase if configured
      if (supabase) {
        try {
          const { error } = await supabase
            .from('dispatch_monitor_ticks')
            .insert({
              location: 'fixed_scraper',
              window_type: getWindowType(now),
              tick_at: timestamp,
              tick_num: Math.floor(Date.now() / 60000),
              day_of_week: now.getDay(),
              date: dateStr,
              totals: [{
                at: filledJobs.toString(),
                pre: totalJobs.toString(),
                date: dateStr,
                shift: getCurrentShift(now)
              }],
              sections: [{
                section: 'vancouver',
                jobs: [],
                totals: [{
                  at: filledJobs.toString(),
                  pre: totalJobs.toString(),
                  date: dateStr,
                  shift: getCurrentShift(now)
                }]
              }],
              delta: {
                location: 'fixed_scraper',
                totalAtDelta: filledJobs,
                totalPreDelta: totalJobs,
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
      log(`❌ No job data found. Page may require different navigation.`);
      log(`First 500 chars of content: ${bodyText?.substring(0, 500)}`);
    }

  } catch (error) {
    log(`💥 Fixed dispatch scraper failed: ${error}`);
  }

  await browser.close();
  log('🏁 Fixed dispatch scraper completed');
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