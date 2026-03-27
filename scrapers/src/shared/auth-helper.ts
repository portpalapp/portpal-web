import { Browser, BrowserContext, Page } from 'playwright';
import { retry, sleep } from './utils';

export interface Account {
  id: string;
  password: string;
}

/**
 * Authenticate with BCMEA portal and return an authenticated browser context
 */
export async function getAuthContext(
  browser: Browser,
  account: Account,
  baseUrl: string,
  log: (message: string) => void
): Promise<BrowserContext> {
  log(`Authenticating with BCMEA portal as user ${account.id}...`);
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to login page with retry
    await retry(async () => {
      await page.goto(`${baseUrl}/login`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
    }, 3, 2000);
    
    log('Login page loaded, checking authentication flow...');
    
    // BCMEA might redirect to a different auth system or use a different login flow
    // Check if we're already authenticated or if there's a different login mechanism
    await page.waitForTimeout(3000);
    
    // Look for various login indicators or redirect patterns
    const currentUrl = page.url();
    log(`Current URL after navigation: ${currentUrl}`);
    
    // Check if we're redirected to a different auth provider (like SAML, OAuth, etc.)
    if (currentUrl.includes('login') && !currentUrl.includes('success')) {
      // Try to find login form - be more flexible with selectors
      const possibleLoginSelectors = [
        'input[type="text"]',
        'input[type="email"]', 
        'input[name*="user"]',
        'input[name*="login"]',
        'input[id*="user"]',
        'input[id*="login"]',
        '.login-input',
        '[data-testid*="username"]',
        '[data-testid*="login"]'
      ];
      
      let foundLoginField = false;
      for (const selector of possibleLoginSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          foundLoginField = true;
          log(`Found login field with selector: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!foundLoginField) {
        // Maybe it's a single sign-on or different auth flow
        // Look for auth buttons or links
        const authButtons = await page.locator('button:has-text("Login"), button:has-text("Sign"), a:has-text("Login"), a:has-text("Sign")').all();
        if (authButtons.length > 0) {
          log('Found auth buttons, clicking first one...');
          await authButtons[0].click();
          await page.waitForTimeout(3000);
        } else {
          log('No traditional login form found, checking if already authenticated...');
        }
      }
    }
    
    // Wait for any login form to appear after potential redirects
    const loginFieldFound = await Promise.race([
      page.waitForSelector('input[type="text"], input[type="email"], input[name*="user"]', { timeout: 10000 }).then(() => true),
      page.waitForTimeout(10000).then(() => false)
    ]);
    
    if (loginFieldFound) {
      // Fill in credentials - try multiple possible selectors
      const usernameSelectors = [
        'input[name="username"]',
        'input[name="user"]',
        'input[name="email"]',
        'input[type="text"]',
        'input[type="email"]',
        '#username',
        '#user',
        '#email',
        '.username-input',
        'input[placeholder*="username" i]',
        'input[placeholder*="user" i]',
        'input[placeholder*="email" i]'
      ];
      
      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        '#password',
        '.password-input'
      ];
      
      let usernameField = null;
      let passwordField = null;
      
      // Find username field
      for (const selector of usernameSelectors) {
        try {
          usernameField = await page.locator(selector).first();
          if (await usernameField.isVisible({ timeout: 1000 })) {
            await usernameField.fill(account.id);
            log('Username field found and filled');
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!usernameField) {
        log('Could not find username field, trying alternative auth methods...');
        
        // Maybe it's already authenticated, let's check
        await page.waitForTimeout(2000);
        const isAlreadyAuth = await checkIfAlreadyAuthenticated(page);
        if (isAlreadyAuth) {
          log('Already authenticated, proceeding...');
          return context;
        }
        
        throw new Error('Could not find username field and not already authenticated');
      }
      
      // Find password field
      for (const selector of passwordSelectors) {
        try {
          passwordField = await page.locator(selector).first();
          if (await passwordField.isVisible({ timeout: 1000 })) {
            await passwordField.fill(account.password);
            log('Password field found and filled');
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!passwordField) {
        throw new Error('Could not find password field on login page');
      }
    } else {
      // No login form found, check if we're already authenticated
      log('No login form found, checking if already authenticated...');
      const isAlreadyAuth = await checkIfAlreadyAuthenticated(page);
      if (isAlreadyAuth) {
        log('Already authenticated, proceeding...');
        return context;
      } else {
        throw new Error('No login form found and not authenticated');
      }
    }
    
    // Submit form - try multiple approaches
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      '.login-button',
      '.submit-button'
    ];
    
    let submitted = false;
    
    for (const selector of submitSelectors) {
      try {
        const submitButton = page.locator(selector).first();
        if (await submitButton.isVisible({ timeout: 1000 })) {
          await submitButton.click();
          submitted = true;
          log('Login form submitted');
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!submitted) {
      // Fallback: try pressing Enter on password field
      await passwordField.press('Enter');
      log('Submitted login via Enter key');
    }
    
    // Wait for navigation or dashboard to appear
    await Promise.race([
      page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }),
      page.waitForSelector('.dashboard', { timeout: 15000 }),
      page.waitForSelector('[data-testid="dashboard"]', { timeout: 15000 }),
      page.waitForSelector('.main-content', { timeout: 15000 })
    ]);
    
    log('Authentication successful - logged into BCMEA portal');
    
    // Small delay to ensure session is fully established
    await sleep(2000);
    
    return context;
    
  } catch (error) {
    log(`Authentication failed: ${error}`);
    await context.close();
    throw error;
  }
}

/**
 * Check if already authenticated (helper function)
 */
async function checkIfAlreadyAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for common authenticated indicators
    const authIndicators = [
      '.user-menu',
      '.logout',
      '.dashboard',
      '[data-testid="user-menu"]',
      '.main-nav',
      '.dispatch-board',
      'a[href*="logout"]'
    ];
    
    for (const selector of authIndicators) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Check URL patterns that indicate we're in the authenticated area
    const url = page.url();
    if (url.includes('/dashboard') || url.includes('/board') || url.includes('/dispatch')) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Check if the current session is still authenticated
 */
export async function isAuthenticated(page: Page, log: (message: string) => void): Promise<boolean> {
  try {
    // Check for common authentication indicators
    const authIndicators = [
      '.user-info',
      '.logout',
      '.dashboard',
      '[data-testid="user-menu"]'
    ];
    
    for (const selector of authIndicators) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Check if we're redirected to login page
    if (page.url().includes('/login')) {
      return false;
    }
    
    return false;
    
  } catch (error) {
    log(`Authentication check failed: ${error}`);
    return false;
  }
}