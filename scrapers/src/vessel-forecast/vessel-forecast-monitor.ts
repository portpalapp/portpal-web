import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { getAuthContext } from '../shared/auth-helper';
import { DATA_DIR, BCMEA_BASE_URL, ACCOUNT_BOARD, FORCE_RUN } from '../shared/config';
import { makeLogger, localDateStr, localStamp, randomDelay } from '../shared/utils';

// Vessel Forecast Hourly Monitor for PORTPAL
// Runs every hour, captures vessel forecast + public PDF + buttons
// Auth: board account (48064)

const MONITOR_DIR = path.join(DATA_DIR, 'hourly-monitor');
const log = makeLogger('hourly');

function downloadFileStream(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (resp) => {
      if (resp.statusCode === 301 || resp.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        downloadFileStream(resp.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      resp.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (e) => { fs.unlinkSync(dest); reject(e); });
  });
}

(async () => {
  fs.mkdirSync(MONITOR_DIR, { recursive: true });

  // Skip evening/overnight (7 PM - 6 AM)
  const currentHour = new Date().getHours();
  if (!FORCE_RUN && (currentHour >= 19 || currentHour < 6)) {
    log(`Skipping evening/overnight run (hour=${currentHour})`);
    process.exit(0);
  }

  // Random delay 1-8 min
  await randomDelay(60000, 8 * 60 * 1000);

  const now = new Date();
  const dateStr = localDateStr(now);
  const stamp = localStamp(now);

  log(`=== Hourly monitor run: ${stamp} ===`);

  const dayDir = path.join(MONITOR_DIR, dateStr);
  fs.mkdirSync(dayDir, { recursive: true });

  // 1) Download public PDF (no auth needed)
  try {
    log('Downloading public PDF...');
    const pdfPath = path.join(dayDir, `pdf_${stamp}.pdf`);
    await downloadFileStream(`${BCMEA_BASE_URL}/api/reports/public/WeeklyAllocationMainland`, pdfPath);
    const size = fs.statSync(pdfPath).size;
    log(`PDF: ${(size / 1024).toFixed(1)} KB`);
  } catch (e: any) {
    log(`PDF download failed: ${e.message}`);
  }

  // 2) Authenticated scraping
  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  const context = await getAuthContext(browser, ACCOUNT_BOARD, BCMEA_BASE_URL, log);
  let page = await context.newPage();
  let browserClosed = false;

  // Global API interceptor
  const apiResponses: { url: string; body: any; timestamp: string; section: string }[] = [];
  let currentSection = '';

  function registerApiInterceptor(p: any) {
    p.on('response', async (resp: any) => {
      const url = resp.url();
      if (url.includes('/api/')) {
        try {
          const text = await resp.text();
          let body: any;
          try { body = JSON.parse(text); } catch { body = text; }
          apiResponses.push({ url, body, timestamp: new Date().toISOString(), section: currentSection });
        } catch {}
      }
    });
  }
  registerApiInterceptor(page);

  // Page crash recovery
  async function ensurePageAlive(): Promise<void> {
    try {
      await page.evaluate(() => true);
    } catch (e: any) {
      log(`  Page crashed, creating new page: ${e.message?.substring(0, 60)}`);
      try { await page.close(); } catch {}
      page = await context.newPage();
      registerApiInterceptor(page);
    }
  }

  try {
  log('Auth OK');

  const snapshot: Record<string, any> = { scrapedAt: now.toISOString(), stamp };

  async function extractPageData() {
    return page.evaluate(() => {
      const tables: { headers: string[]; rows: string[][] }[] = [];
      document.querySelectorAll('table').forEach(table => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        const rows: string[][] = [];
        table.querySelectorAll('tbody tr, tr').forEach(tr => {
          const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '');
          if (cells.length > 0) rows.push(cells);
        });
        if (headers.length > 0 || rows.length > 0) tables.push({ headers, rows });
      });
      return {
        bodyText: document.body.innerText,
        tables,
        url: window.location.href,
      };
    });
  }

  // A) Vessel Forecast
  currentSection = 'vessel-forecast';
  log('Scraping /vessel-forecast...');
  try {
    const beforeCount = apiResponses.length;
    await page.goto(`${BCMEA_BASE_URL}/vessel-forecast`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const data = await extractPageData();
    snapshot['vessel-forecast'] = {
      ...data,
      apiCalls: apiResponses.slice(beforeCount).filter(a => typeof a.body !== 'string'),
    };
    log(`  ${data.tables.length} tables, ${data.bodyText.length} chars`);
  } catch (e: any) {
    log(`  ERROR: ${e.message?.substring(0, 80)}`);
    snapshot['vessel-forecast'] = { error: e.message };
  }
  await ensurePageAlive();

  // B) Union Buttons
  currentSection = 'buttons-union';
  log('Scraping /buttons/union...');
  try {
    const beforeCount = apiResponses.length;
    await page.goto(`${BCMEA_BASE_URL}/buttons/union`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const data = await extractPageData();
    snapshot['buttons-union'] = {
      ...data,
      apiCalls: apiResponses.slice(beforeCount).filter(a => typeof a.body !== 'string'),
    };
    log(`  ${data.tables.length} tables, ${data.bodyText.length} chars`);
  } catch (e: any) {
    log(`  ERROR: ${e.message?.substring(0, 80)}`);
    snapshot['buttons-union'] = { error: e.message };
  }
  await ensurePageAlive();

  // C) Casual + Telephone Buttons
  for (const cat of ['casual', 'telephone']) {
    currentSection = `buttons-${cat}`;
    log(`Scraping /buttons/${cat}...`);
    try {
      const beforeCount = apiResponses.length;
      await page.goto(`${BCMEA_BASE_URL}/buttons/${cat}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      const data = await extractPageData();
      snapshot[`buttons-${cat}`] = {
        ...data,
        apiCalls: apiResponses.slice(beforeCount).filter(a => typeof a.body !== 'string'),
      };
      log(`  ${data.tables.length} tables, ${data.bodyText.length} chars`);
    } catch (e: any) {
      log(`  ERROR: ${e.message?.substring(0, 80)}`);
      snapshot[`buttons-${cat}`] = { error: e.message };
    }
  }

  // Save all unique API endpoints discovered
  snapshot['_apiEndpoints'] = [...new Set(apiResponses.map(a => a.url))];
  snapshot['_apiResponseCount'] = apiResponses.length;

  // Save timestamped snapshot
  const outFile = path.join(dayDir, `snapshot_${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));
  log(`Saved: ${outFile}`);

  // Save latest
  fs.writeFileSync(path.join(MONITOR_DIR, 'latest.json'), JSON.stringify(snapshot, null, 2));

  // Maintain index
  const indexFile = path.join(MONITOR_DIR, 'index.json');
  let index: any[] = [];
  if (fs.existsSync(indexFile)) {
    try { index = JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch {}
  }
  index.push({
    stamp,
    file: `${dateStr}/snapshot_${stamp}.json`,
    sections: Object.keys(snapshot).filter(k => !k.startsWith('_')),
    apiCount: apiResponses.length,
  });
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));

  } finally {
    if (!browserClosed) {
      try { await browser.close(); browserClosed = true; } catch {}
    }
  }
  log(`=== Hourly monitor complete: ${stamp} ===\n`);
})();
