/**
 * Live BCMEA Scraper Test
 * Working implementation based on actual site analysis
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class LiveBCMEATest {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Starting live BCMEA authentication test...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('✅ Browser initialized');
  }

  async exploreAuthFlow() {
    console.log('🔍 Exploring MyBCMEA authentication flow...');

    try {
      // Step 1: Go to main portal
      console.log('1. Navigating to MyBCMEA portal...');
      await this.page.goto('https://mybcmea.bcmea.com', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for JavaScript to load
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Take screenshot
      let screenshot = await this.captureScreenshot('01-mybcmea-portal');
      console.log(`📸 Portal screenshot: ${screenshot}`);

      // Step 2: Check current state and look for login elements
      const pageInfo = await this.page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasSignInButton: Array.from(document.querySelectorAll('button, a')).some(el => 
            el.textContent.toLowerCase().includes('sign') || el.href?.includes('login')),
          signInElements: Array.from(document.querySelectorAll('button, a, input[type="submit"]'))
            .filter(el => el.textContent.toLowerCase().includes('sign') || 
                          el.textContent.toLowerCase().includes('login') ||
                          el.href?.includes('login') ||
                          el.href?.includes('signin'))
            .map(el => ({
              tag: el.tagName,
              text: el.textContent.trim(),
              href: el.href || null,
              id: el.id || null,
              className: el.className || null
            })),
          allButtons: Array.from(document.querySelectorAll('button, a, input[type="submit"]'))
            .slice(0, 10)
            .map(el => ({
              tag: el.tagName,
              text: el.textContent.trim(),
              href: el.href || null
            })),
          bodyText: document.body.textContent.substring(0, 1000)
        };
      });

      console.log('Portal analysis:', JSON.stringify(pageInfo, null, 2));

      // Step 3: Look for and click Sign In
      if (pageInfo.signInElements.length > 0) {
        console.log(`🔐 Found ${pageInfo.signInElements.length} sign-in elements`);
        
        // Try to click the first sign-in element
        const firstSignIn = pageInfo.signInElements[0];
        console.log(`Clicking sign-in: ${firstSignIn.text}`);
        
        if (firstSignIn.href) {
          // It's a link
          await this.page.goto(firstSignIn.href, { waitUntil: 'networkidle2' });
        } else {
          // It's a button
          await this.page.click(`${firstSignIn.tag}${firstSignIn.className ? '.' + firstSignIn.className.split(' ').join('.') : ''}`);
          await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
            console.log('No navigation occurred after click');
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        screenshot = await this.captureScreenshot('02-after-signin-click');
        console.log(`📸 After sign-in click: ${screenshot}`);

      } else {
        console.log('🔍 No obvious sign-in elements found. Looking for login form...');
      }

      // Step 4: Look for login form
      const loginFormInfo = await this.page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll('form'));
        const inputs = Array.from(document.querySelectorAll('input'));
        
        return {
          forms: forms.map(form => ({
            action: form.action,
            method: form.method,
            inputs: Array.from(form.querySelectorAll('input')).map(input => ({
              type: input.type,
              name: input.name,
              id: input.id,
              placeholder: input.placeholder
            }))
          })),
          allInputs: inputs.map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder
          })),
          currentUrl: window.location.href
        };
      });

      console.log('Login form analysis:', JSON.stringify(loginFormInfo, null, 2));

      // Step 5: Try to enter credentials if form found
      const usernameInput = loginFormInfo.allInputs.find(input => 
        input.type === 'text' || input.type === 'email' || 
        (input.name && input.name.toLowerCase().includes('user')) ||
        (input.id && input.id.toLowerCase().includes('user')) ||
        (input.placeholder && input.placeholder.toLowerCase().includes('user'))
      );

      const passwordInput = loginFormInfo.allInputs.find(input => input.type === 'password');

      if (usernameInput && passwordInput) {
        console.log('🔑 Found login form fields!');
        console.log(`Username field: ${JSON.stringify(usernameInput)}`);
        console.log(`Password field: ${JSON.stringify(passwordInput)}`);

        // Enter credentials
        const usernameSelector = usernameInput.id ? `#${usernameInput.id}` : 
                                usernameInput.name ? `[name="${usernameInput.name}"]` : 
                                'input[type="text"], input[type="email"]';
        
        const passwordSelector = passwordInput.id ? `#${passwordInput.id}` : 
                                passwordInput.name ? `[name="${passwordInput.name}"]` : 
                                'input[type="password"]';

        await this.page.type(usernameSelector, process.env.BCMEA_USERNAME || '48064');
        console.log('✅ Username entered');

        if (process.env.BCMEA_PASSWORD) {
          await this.page.type(passwordSelector, process.env.BCMEA_PASSWORD);
          console.log('✅ Password entered');
        } else {
          console.log('⚠️ No BCMEA_PASSWORD environment variable set');
          console.log('Set with: export BCMEA_PASSWORD="your_password"');
        }

        screenshot = await this.captureScreenshot('03-credentials-entered');
        console.log(`📸 Credentials entered: ${screenshot}`);

        // Try to submit
        try {
          const submitButton = await this.page.$('button[type="submit"], input[type="submit"]') || 
                            await this.page.evaluateHandle(() => 
                              Array.from(document.querySelectorAll('button')).find(btn => 
                                btn.textContent.toLowerCase().includes('sign') || 
                                btn.textContent.toLowerCase().includes('login')));
          if (submitButton) {
            console.log('🚀 Attempting to submit login form...');
            await Promise.all([
              this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
              submitButton.click()
            ]);
          }
        } catch (error) {
          console.log('Login submission may have failed:', error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        screenshot = await this.captureScreenshot('04-after-login-attempt');
        console.log(`📸 After login attempt: ${screenshot}`);

      } else {
        console.log('❌ No login form fields found');
      }

      // Step 6: Check final state
      const finalState = await this.page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        hasWorkInfo: document.body.textContent.toLowerCase().includes('work'),
        hasDispatch: document.body.textContent.toLowerCase().includes('dispatch'),
        hasJob: document.body.textContent.toLowerCase().includes('job'),
        navigation: Array.from(document.querySelectorAll('nav a, .nav a, .menu a, a'))
          .filter(a => a.textContent.length > 0)
          .slice(0, 10)
          .map(a => ({
            text: a.textContent.trim(),
            href: a.href
          }))
      }));

      console.log('Final authentication state:', JSON.stringify(finalState, null, 2));

      return {
        success: finalState.url.includes('work') || finalState.hasWorkInfo,
        finalUrl: finalState.url,
        screenshots: ['01-mybcmea-portal', '02-after-signin-click', '03-credentials-entered', '04-after-login-attempt'],
        navigation: finalState.navigation
      };

    } catch (error) {
      console.error('❌ Authentication exploration failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async captureScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join('./screenshots', filename);
    
    if (!fs.existsSync('./screenshots')) {
      fs.mkdirSync('./screenshots', { recursive: true });
    }

    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });

    return filepath;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      const result = await this.exploreAuthFlow();
      
      console.log('\n🎯 AUTHENTICATION TEST RESULTS:');
      console.log('='.repeat(50));
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      console.log(`Final URL: ${result.finalUrl}`);
      
      if (result.screenshots) {
        console.log('Screenshots captured:');
        result.screenshots.forEach(screenshot => console.log(`  📸 ${screenshot}`));
      }
      
      if (result.navigation && result.navigation.length > 0) {
        console.log('Available navigation:');
        result.navigation.forEach(nav => console.log(`  🔗 ${nav.text} -> ${nav.href}`));
      }

      if (result.error) {
        console.log(`Error: ${result.error}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run the test
const tester = new LiveBCMEATest();
tester.run()
  .then(result => {
    console.log('\n✅ LIVE BCMEA TEST COMPLETE');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ LIVE TEST FAILED:', error.message);
    process.exit(1);
  });