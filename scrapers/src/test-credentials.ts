import { chromium } from 'playwright';
import { ACCOUNT_BOARD } from './shared/config.js';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`Testing BCMEA credentials: ${ACCOUNT_BOARD.id} / ${ACCOUNT_BOARD.password}`);

  try {
    // Go to main site
    await page.goto('https://mybcmea.bcmea.com');
    await page.screenshot({ path: '/tmp/step1-main.png' });
    console.log('✅ Main page loaded');

    // Check for Sign In button
    const signInButton = await page.locator('text=Sign In').first();
    const signInExists = await signInButton.count() > 0;

    console.log('Sign In button found:', signInExists);

    if (signInExists) {
      console.log('🔄 Clicking Sign In button...');
      await signInButton.click();
      await page.waitForTimeout(3000);
      console.log('URL after Sign In click:', page.url());
      await page.screenshot({ path: '/tmp/step2-after-signin.png' });
    }

    // Check what we have now
    const title = await page.title();
    console.log('Current page title:', title);
    console.log('Current URL:', page.url());

    // Look for login fields
    const usernameField = await page.locator('input[type="text"], input[type="email"], input[name*="user"], input[id*="user"]').first();
    const passwordField = await page.locator('input[type="password"]').first();

    const usernameExists = await usernameField.count() > 0;
    const passwordExists = await passwordField.count() > 0;

    console.log('Username field exists:', usernameExists);
    console.log('Password field exists:', passwordExists);

    if (usernameExists && passwordExists) {
      console.log('🔐 Attempting login with credentials...');
      await usernameField.fill(ACCOUNT_BOARD.id);
      await passwordField.fill(ACCOUNT_BOARD.password);
      
      const submitButton = await page.locator('button[type="submit"], input[type="submit"], button:has-text("sign in"), button:has-text("login")').first();
      const submitExists = await submitButton.count() > 0;
      
      if (submitExists) {
        await submitButton.click();
        await page.waitForTimeout(5000);
        console.log('✅ Login submitted, URL now:', page.url());
        await page.screenshot({ path: '/tmp/step3-after-login.png' });
        
        // Check if we're logged in
        const bodyText = await page.textContent('body');
        const isLoggedIn = bodyText?.includes('dispatch') || bodyText?.includes('job') || bodyText?.includes('work');
        console.log('Appears logged in:', isLoggedIn);
        
        if (isLoggedIn) {
          console.log('🎉 SUCCESS: Login appears to have worked!');
        } else {
          console.log('❌ Login may have failed - no dispatch content found');
          console.log('Page content (first 300 chars):', bodyText?.substring(0, 300));
        }
      } else {
        console.log('❌ No submit button found');
      }
    } else {
      console.log('❌ No login form found on current page');
      
      // Check if there are other auth methods
      const pageText = await page.textContent('body');
      console.log('Page content (first 300 chars):', pageText?.substring(0, 300));
      
      // Look for SSO or OAuth buttons
      const ssoButtons = await page.locator('button:has-text("microsoft"), button:has-text("google"), button:has-text("sso"), a:has-text("microsoft"), a:has-text("google")').all();
      console.log('SSO/OAuth buttons found:', ssoButtons.length);
    }

  } catch (error) {
    console.log('💥 Error during credential test:', error);
  }

  await browser.close();
})();