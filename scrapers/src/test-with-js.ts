import { chromium } from 'playwright';
import { ACCOUNT_BOARD } from './shared/config.js';

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // JavaScript is enabled by default in Playwright

  console.log(`Testing BCMEA with JavaScript enabled: ${ACCOUNT_BOARD.id}`);

  try {
    // Go to main site
    await page.goto('https://mybcmea.bcmea.com', { waitUntil: 'networkidle' });
    console.log('✅ Main page loaded with networkidle');

    // Click Sign In
    const signInButton = await page.locator('text=Sign In').first();
    await signInButton.click();
    await page.waitForLoadState('networkidle');
    console.log('🔄 Clicked Sign In, waiting for login form...');

    // Fill credentials
    const usernameField = await page.locator('input[type="text"], input[type="email"], input[name*="user"], input[id*="user"]').first();
    const passwordField = await page.locator('input[type="password"]').first();

    await usernameField.fill(ACCOUNT_BOARD.id);
    await passwordField.fill(ACCOUNT_BOARD.password);
    
    console.log('🔐 Credentials filled, submitting...');
    
    const submitButton = await page.locator('button[type="submit"], input[type="submit"]').first();
    await submitButton.click();
    
    // Wait for redirect and JavaScript to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('✅ Login complete, final URL:', page.url());
    
    // Wait for JavaScript app to initialize
    await page.waitForTimeout(5000);
    console.log('🔄 Waiting for JavaScript app to initialize...');
    
    // Take a screenshot to see what loaded
    await page.screenshot({ path: '/tmp/final-logged-in.png', fullPage: true });
    
    // Check what content is now available
    const title = await page.title();
    console.log('Final page title:', title);
    
    const bodyText = await page.textContent('body');
    console.log('Body text length:', bodyText?.length);
    console.log('First 500 chars:', bodyText?.substring(0, 500));
    
    // Look for dispatch-related content
    const dispatchKeywords = ['dispatch', 'job', 'work', 'board', 'available', 'vancouver'];
    const foundKeywords = dispatchKeywords.filter(keyword => 
      bodyText?.toLowerCase().includes(keyword)
    );
    console.log('Dispatch keywords found:', foundKeywords);
    
    // Check for navigation menu
    const navLinks = await page.locator('nav a, .nav a, [role="navigation"] a').all();
    console.log('Navigation links found:', navLinks.length);
    
    if (navLinks.length > 0) {
      console.log('Navigation menu items:');
      for (let i = 0; i < Math.min(navLinks.length, 10); i++) {
        const link = navLinks[i];
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        console.log(`  "${text?.trim()}" -> ${href}`);
      }
    }
    
    // Look for dispatch or board links specifically
    const dispatchLinks = await page.locator('a:has-text("dispatch"), a:has-text("board"), a:has-text("work"), a:has-text("job")').all();
    console.log('Dispatch-related links found:', dispatchLinks.length);
    
    if (dispatchLinks.length > 0) {
      console.log('🎯 Found dispatch links! Trying first one...');
      const firstDispatchLink = dispatchLinks[0];
      const linkText = await firstDispatchLink.textContent();
      console.log(`Clicking: "${linkText?.trim()}"`);
      
      await firstDispatchLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const dispatchPageText = await page.textContent('body');
      console.log('Dispatch page loaded, checking for job counts...');
      
      // Look for job numbers
      const numberPattern = /\d{1,3}/g;
      const numbers = dispatchPageText?.match(numberPattern) || [];
      const largeNumbers = numbers.filter(n => parseInt(n) > 50 && parseInt(n) < 500);
      
      console.log('Large numbers found (potential job counts):', largeNumbers);
      
      await page.screenshot({ path: '/tmp/dispatch-page.png', fullPage: true });
      console.log('📸 Saved dispatch page screenshot');
    }

  } catch (error) {
    console.log('💥 Error:', error);
  }

  await browser.close();
  console.log('🏁 Test complete');
})();