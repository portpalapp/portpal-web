import { chromium } from 'playwright';
import { makeLogger } from '../shared/utils.js';
import { BCMEA_BASE_URL } from '../shared/config.js';

const log = makeLogger('test-login');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Visible browser for testing
  const page = await browser.newPage();
  
  try {
    log(`Navigating to ${BCMEA_BASE_URL}/login...`);
    await page.goto(`${BCMEA_BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Take a screenshot to see what we're dealing with
    await page.screenshot({ path: '/tmp/bcmea-login.png' });
    log('Screenshot saved to /tmp/bcmea-login.png');
    
    // Get page title and URL
    log(`Page title: ${await page.title()}`);
    log(`Current URL: ${page.url()}`);
    
    // Find all input fields
    const inputs = await page.locator('input').all();
    log(`Found ${inputs.length} input fields:`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');
      log(`  Input ${i}: type="${type}" name="${name}" placeholder="${placeholder}" id="${id}"`);
    }
    
    // Find all buttons
    const buttons = await page.locator('button').all();
    log(`Found ${buttons.length} buttons:`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      log(`  Button ${i}: "${text}" type="${type}"`);
    }
    
    // Wait a bit so we can see the page
    await page.waitForTimeout(10000);
    
  } catch (error) {
    log(`Test failed: ${error}`);
  } finally {
    await browser.close();
  }
})();