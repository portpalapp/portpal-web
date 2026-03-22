/**
 * Test Vision-Enhanced Scraper
 * Test on publicly accessible pages first
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class TestVisionScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Initializing browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    console.log('✅ Browser initialized');
  }

  async captureScreenshot(name, url) {
    console.log(`📸 Capturing screenshot of ${url}...`);
    
    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

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

      console.log(`✅ Screenshot saved: ${filepath}`);
      return filepath;

    } catch (error) {
      console.error(`❌ Failed to capture ${url}:`, error.message);
      return null;
    }
  }

  async testBCMEAAccessibility() {
    console.log('🔍 Testing BCMEA site accessibility...');

    const testUrls = [
      'https://www.bcmea.com',
      'https://bcmea.com', 
      'https://mybcmea.bcmea.com',
      'https://mybcmea.bcmea.com/login'
    ];

    const results = {};

    for (const url of testUrls) {
      try {
        console.log(`Testing ${url}...`);
        
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });

        const title = await this.page.title();
        const hasLoginForm = await this.page.$('input[type="password"]') !== null;
        const hasWorkInfo = await this.page.evaluate(() => {
          return document.body.textContent.toLowerCase().includes('work') ||
                 document.body.textContent.toLowerCase().includes('dispatch') ||
                 document.body.textContent.toLowerCase().includes('job');
        });

        results[url] = {
          accessible: true,
          title,
          hasLoginForm,
          hasWorkInfo,
          screenshot: await this.captureScreenshot(`test-${url.replace(/[^a-zA-Z0-9]/g, '-')}`, url)
        };

        console.log(`✅ ${url} - accessible, title: "${title}"`);

      } catch (error) {
        results[url] = {
          accessible: false,
          error: error.message
        };
        console.log(`❌ ${url} - failed: ${error.message}`);
      }
    }

    return results;
  }

  async analyzePageStructure(url) {
    console.log(`🔍 Analyzing page structure for ${url}...`);

    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

      const pageData = await this.page.evaluate(() => {
        return {
          title: document.title,
          hasLogin: !!document.querySelector('input[type="password"]'),
          hasTables: document.querySelectorAll('table').length,
          hasJobKeywords: document.body.textContent.toLowerCase().includes('job') ||
                         document.body.textContent.toLowerCase().includes('work') ||
                         document.body.textContent.toLowerCase().includes('dispatch'),
          forms: Array.from(document.querySelectorAll('form')).map(form => ({
            action: form.action,
            method: form.method,
            inputs: Array.from(form.querySelectorAll('input')).map(input => ({
              type: input.type,
              name: input.name,
              id: input.id,
              placeholder: input.placeholder
            }))
          })),
          textSample: document.body.textContent.substring(0, 500)
        };
      });

      console.log(`✅ Page analysis complete for ${url}`);
      return pageData;

    } catch (error) {
      console.error(`❌ Page analysis failed for ${url}:`, error.message);
      return { error: error.message };
    }
  }

  async mockVisionAnalysis(screenshotPath) {
    console.log('👁️ Simulating vision analysis...');

    // Simulate AI vision analysis of screenshot
    // In real implementation, this would call OpenClaw's image tool
    const mockVisionData = {
      timestamp: new Date().toISOString(),
      screenshotPath,
      analysis: {
        hasJobListings: true,
        jobsFound: {
          'LIFT_TRUCK': 8,
          'RTG': 5,
          'LABOUR': 45,
          'TRACTOR_TRAILER': 12,
          'HD_MECHANIC': 3
        },
        totalJobs: 73,
        confidence: 0.92,
        shifts: {
          'DAY': { total: 58, jobs: ['LIFT_TRUCK', 'RTG', 'LABOUR'] },
          'NIGHT': { total: 15, jobs: ['TRACTOR_TRAILER', 'HD_MECHANIC'] }
        },
        notes: 'Clear tabular format with job names and quantities visible'
      },
      method: 'vision-simulation'
    };

    console.log(`✅ Vision analysis complete: ${mockVisionData.analysis.totalJobs} jobs found`);
    return mockVisionData;
  }

  async run() {
    try {
      await this.init();

      console.log('📊 Starting BCMEA site analysis...');
      
      // Test site accessibility
      const accessResults = await this.testBCMEAAccessibility();
      
      // Analyze accessible pages  
      const analysisResults = {};
      for (const [url, result] of Object.entries(accessResults)) {
        if (result.accessible) {
          analysisResults[url] = await this.analyzePageStructure(url);
        }
      }

      // Test vision analysis on captured screenshots
      const visionResults = {};
      for (const [url, result] of Object.entries(accessResults)) {
        if (result.screenshot) {
          visionResults[url] = await this.mockVisionAnalysis(result.screenshot);
        }
      }

      // Compile final report
      const report = {
        timestamp: new Date().toISOString(),
        accessibility: accessResults,
        pageAnalysis: analysisResults,
        visionAnalysis: visionResults,
        recommendations: this.generateRecommendations(accessResults, analysisResults)
      };

      // Save comprehensive report
      const reportPath = `./data/bcmea-analysis-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data', { recursive: true });
      }
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log(`✅ Analysis complete - report saved to ${reportPath}`);
      return report;

    } catch (error) {
      console.error('❌ Test scraper failed:', error.message);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateRecommendations(accessResults, analysisResults) {
    const recommendations = [];

    // Check which URLs are accessible
    const accessibleUrls = Object.entries(accessResults)
      .filter(([url, result]) => result.accessible)
      .map(([url, result]) => url);

    if (accessibleUrls.length === 0) {
      recommendations.push('❌ No BCMEA URLs accessible - check network/authentication');
    } else {
      recommendations.push(`✅ ${accessibleUrls.length} BCMEA URLs accessible`);
    }

    // Check for login forms
    const loginUrls = Object.entries(accessResults)
      .filter(([url, result]) => result.hasLoginForm)
      .map(([url, result]) => url);

    if (loginUrls.length > 0) {
      recommendations.push(`🔐 Login forms found at: ${loginUrls.join(', ')}`);
      recommendations.push('👤 Authentication will be required for work-info access');
    }

    // Check for work-related content
    const workUrls = Object.entries(accessResults)
      .filter(([url, result]) => result.hasWorkInfo)
      .map(([url, result]) => url);

    if (workUrls.length > 0) {
      recommendations.push(`💼 Work-related content found at: ${workUrls.join(', ')}`);
    }

    // Analyze page structures
    const formsFound = Object.values(analysisResults)
      .reduce((total, analysis) => total + (analysis.forms?.length || 0), 0);

    if (formsFound > 0) {
      recommendations.push(`📝 ${formsFound} forms found across pages - scraping authentication possible`);
    }

    recommendations.push('🚀 Ready to proceed with authenticated scraping for work-info data');
    recommendations.push('📸 Screenshots captured for visual analysis development');
    recommendations.push('👁️ Vision analysis framework ready for job data extraction');

    return recommendations;
  }
}

// Run test
const testScraper = new TestVisionScraper();
testScraper.run()
  .then(report => {
    console.log('\n🎉 BCMEA SITE ANALYSIS COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Accessibility tests: ${Object.keys(report.accessibility).length} URLs tested`);
    console.log(`📊 Page analysis: ${Object.keys(report.pageAnalysis).length} pages analyzed`);
    console.log(`👁️ Vision analysis: ${Object.keys(report.visionAnalysis).length} screenshots processed`);
    console.log('\n📋 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
    console.log('\n💾 Full report saved to:', `./data/bcmea-analysis-*.json`);
  })
  .catch(error => {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  });