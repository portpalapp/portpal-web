import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { getAuthContext } from '../shared/auth-helper';
import { DATA_DIR, BCMEA_BASE_URL, ACCOUNT_WORKINFO } from '../shared/config';
import { makeLogger, localDateStr, localStamp, randomDelay } from '../shared/utils';

// Work-Info Snapshot Scraper for PORTPAL
// Captures MULTIPLE snapshots per day to track how work-info changes
// throughout the day (pre-ordered -> actual)
// Each snapshot is timestamped and stored in a daily subdirectory

const SNAPSHOT_DIR = path.join(DATA_DIR, 'work-info-snapshots');
const log = makeLogger('workinfo-snap');

(async () => {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  // Random delay 1-5 min
  await randomDelay(60000, 5 * 60 * 1000);

  const now = new Date();
  const dateStr = localDateStr(now);
  const stamp = localStamp(now);

  // Create daily subdirectory
  const dayDir = path.join(SNAPSHOT_DIR, dateStr);
  fs.mkdirSync(dayDir, { recursive: true });

  log(`Starting work-info snapshot: ${stamp}`);

  const browser = await chromium.launch({ headless: true });
  const context = await getAuthContext(browser, ACCOUNT_WORKINFO, BCMEA_BASE_URL, log);
  const page = await context.newPage();
  log('Auth OK');

  const results: Record<string, any> = {
    scrapedAt: now.toISOString(),
    stamp,
    date: dateStr,
  };

  const locations = ['vancouver', 'squamish', 'coastwise'];
  for (const loc of locations) {
    let data: any = null;
    const handler = async (resp: any) => {
      if (resp.url().includes(`/api/work-info/${loc}/all`)) {
        try { data = JSON.parse(await resp.text()); } catch {}
      }
    };
    page.on('response', handler);
    try {
      await page.goto(`${BCMEA_BASE_URL}/work-info/${loc}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
    } catch {}
    page.off('response', handler);

    if (data) {
      results[loc] = data;
      const totalPre = (data.totals || []).reduce((s: number, t: any) => s + Number(t.pre || 0), 0);
      const totalAt = (data.totals || []).reduce((s: number, t: any) => s + Number(t.at || 0), 0);
      log(`  ${loc.toUpperCase()}: pre=${totalPre} at=${totalAt}`);
    } else {
      results[loc] = null;
      log(`  ${loc.toUpperCase()}: FAILED`);
    }
  }

  await browser.close();

  // Save timestamped snapshot
  const outFile = path.join(dayDir, `snapshot_${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  log(`Saved: ${outFile}`);

  // Save latest
  fs.writeFileSync(path.join(SNAPSHOT_DIR, 'latest.json'), JSON.stringify(results, null, 2));

  // Maintain snapshot index
  const indexFile = path.join(SNAPSHOT_DIR, 'index.json');
  let index: any = { snapshots: [], dates: {} };
  if (fs.existsSync(indexFile)) {
    try { index = JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch {}
  }
  index.snapshots.push({ stamp, file: `${dateStr}/snapshot_${stamp}.json` });
  if (!index.dates[dateStr]) index.dates[dateStr] = [];
  index.dates[dateStr].push(stamp);
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));

  // Also write daily work-info format (replaces daily-scraper.ts)
  const hasData = locations.some(loc => results[loc] !== null);
  if (hasData) {
    const dailyDir = path.join(DATA_DIR, 'work-info');
    fs.mkdirSync(dailyDir, { recursive: true });
    const dailyFile = path.join(dailyDir, `${dateStr}.json`);
    fs.writeFileSync(dailyFile, JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(dailyDir, 'latest.json'), JSON.stringify(results, null, 2));

    // Update daily index
    const dailyIndexFile = path.join(dailyDir, 'index.json');
    const allDailyFiles = fs.readdirSync(dailyDir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    fs.writeFileSync(dailyIndexFile, JSON.stringify({
      totalDays: allDailyFiles.length,
      dates: allDailyFiles.map(f => f.replace('.json', '')),
      lastUpdated: now.toISOString(),
    }, null, 2));
    log(`  Also wrote daily format: ${dailyFile}`);
  }

  // Detect changes from previous snapshot
  const dayFiles = fs.readdirSync(dayDir).filter(f => f.startsWith('snapshot_')).sort();
  if (dayFiles.length >= 2) {
    const prev = JSON.parse(fs.readFileSync(path.join(dayDir, dayFiles[dayFiles.length - 2]), 'utf8'));
    let changes = 0;
    for (const loc of locations) {
      const prevTotals = prev[loc]?.totals || [];
      const currTotals = results[loc]?.totals || [];
      for (let i = 0; i < Math.max(prevTotals.length, currTotals.length); i++) {
        const p = prevTotals[i] || {};
        const c = currTotals[i] || {};
        if (p.pre !== c.pre || p.at !== c.at) changes++;
      }
    }
    log(`  Changes from previous snapshot: ${changes} shift totals changed`);
    if (changes > 5) {
      log(`  HIGH CHANGE RATE detected (${changes} changes) - consider increasing scrape frequency`);
    }
  }

  log(`Snapshot complete: ${stamp}`);
})();
