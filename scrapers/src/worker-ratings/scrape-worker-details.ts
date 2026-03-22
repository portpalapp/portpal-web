import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR, BCMEA_BASE_URL, ACCOUNT_BOARD } from '../shared/config';

// Worker Plate Legend Extraction (one-time / manual)
// Clicks into every worker on boards C, T, R, 00 to capture training ratings
// Run manually: npx ts-node src/worker-ratings/scrape-worker-details.ts

const DIR = path.join(DATA_DIR, 'worker-details');

(async () => {
  fs.mkdirSync(DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();

  const legendHtml: Record<string, string> = {};

  page.on('response', async (resp) => {
    const url = resp.url();
    try {
      if (url.includes('/api/legacy-plate-legend/')) {
        const regMatch = url.match(/legacy-plate-legend\/(\d+)\//);
        if (regMatch) legendHtml[regMatch[1]] = await resp.text();
      }
    } catch {}
  });

  // Auth
  console.log('Authenticating...');
  await page.goto(BCMEA_BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  const signIn = await page.$('text=SIGN IN');
  if (signIn) {
    await signIn.click();
    await page.waitForURL(/.*identity.*Login.*/, { timeout: 15000 });
    await page.waitForSelector('#reg-id-input', { timeout: 5000 });
    await page.fill('#reg-id-input', ACCOUNT_BOARD.id);
    await page.fill('#password-input', ACCOUNT_BOARD.password);
    await page.click('#sign-in-button');
    try { await page.waitForURL(`${BCMEA_BASE_URL}/**`, { timeout: 30000 }); } catch {}
    await page.waitForTimeout(1500);
  }
  console.log('Auth OK\n');

  const allWorkerRatings: { reg: string; board: string; name: string; boardRating: string; legend: string }[] = [];

  for (const board of ['c', 't', 'r', '00']) {
    console.log(`=== Board ${board.toUpperCase()} ===`);
    await page.goto(`${BCMEA_BASE_URL}/casual-board/${board}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const workerNames = await page.evaluate(() => {
      const results: string[] = [];
      document.querySelectorAll('div').forEach(el => {
        const text = el.textContent?.trim() || '';
        const style = window.getComputedStyle(el);
        if (/^[A-Z][a-z]+, [A-Z]$/.test(text) && style.cursor === 'pointer') results.push(text);
      });
      return [...new Set(results)];
    });
    console.log(`Found ${workerNames.length} clickable workers\n`);

    let success = 0, errors = 0;

    for (let i = 0; i < workerNames.length; i++) {
      const name = workerNames[i];
      try {
        await page.click(`div:text-is("${name}")`, { timeout: 3000 });
        await page.waitForSelector('iframe[data-automation="plate-legend"]', { timeout: 3000 });
        await page.waitForTimeout(800);

        const legendFrame = await (await page.$('iframe[data-automation="plate-legend"]'))?.contentFrame();
        let legendText = '';
        if (legendFrame) legendText = await legendFrame.evaluate(() => document.body?.innerText || '');

        const newRegs = Object.keys(legendHtml).filter(r => !allWorkerRatings.some(w => w.reg === r));
        const reg = newRegs.length > 0 ? newRegs[newRegs.length - 1] : '?';

        const ratingLine = legendText.match(/Rating:\s*(.+)/)?.[1]?.trim() || '';
        const insertLine = legendText.match(/Plate Insert Rating:\s*(.+)/)?.[1]?.trim() || '';

        allWorkerRatings.push({ reg, board: board.toUpperCase(), name, boardRating: insertLine || ratingLine, legend: legendText.replace(/\n/g, ' | ').trim() });
        success++;
        if (success % 20 === 0 || success <= 5) console.log(`  [${success}/${workerNames.length}] ${name} (#${reg}): ${insertLine || ratingLine || '(no rating)'}`);
        else process.stdout.write(`\r  Processing... ${success}/${workerNames.length}`);

        // Close dialog
        await page.evaluate(() => { const backdrop = document.querySelector('.MuiBackdrop-root'); if (backdrop) (backdrop as HTMLElement).click(); });
        await page.waitForTimeout(300);
        const dialogOpen = await page.$('.MuiDialog-root');
        if (dialogOpen) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }

      } catch (e: any) {
        errors++;
        try { await page.evaluate(() => { const b = document.querySelector('.MuiBackdrop-root'); if (b) (b as HTMLElement).click(); }); await page.waitForTimeout(200); await page.keyboard.press('Escape'); await page.waitForTimeout(200); } catch {}
        if (errors <= 3) console.log(`  ERROR on ${name}: ${e.message?.substring(0, 80)}`);
      }

      if ((success + errors) % 50 === 0) fs.writeFileSync(path.join(DIR, 'ratings-progress.json'), JSON.stringify(allWorkerRatings, null, 2));
    }
    console.log(`\n  Board ${board.toUpperCase()}: ${success} success, ${errors} errors\n`);
  }

  fs.writeFileSync(path.join(DIR, 'worker-ratings-ctr00.json'), JSON.stringify(allWorkerRatings, null, 2));

  // Merge with existing A/B data
  const abFile = path.join(DIR, 'all-worker-ratings.json');
  let allData = allWorkerRatings;
  if (fs.existsSync(abFile)) {
    const abData = JSON.parse(fs.readFileSync(abFile, 'utf8'));
    allData = [...abData, ...allWorkerRatings];
  }
  fs.writeFileSync(path.join(DIR, 'all-worker-ratings.json'), JSON.stringify(allData, null, 2));

  // Build rating map
  const ratingMap: Record<string, Set<string>> = {};
  const boardDir = path.join(DATA_DIR, 'boards');
  try {
    const boardFile = fs.readdirSync(boardDir).find(f => f.endsWith('.json') && f !== 'index.json');
    if (boardFile) {
      const boardData = JSON.parse(fs.readFileSync(path.join(boardDir, boardFile), 'utf8'));
      for (const [bName, bData] of Object.entries(boardData.boards) as any) {
        for (const shift of (bData.shifts || [])) {
          for (const w of (shift.workers || [])) {
            const found = allWorkerRatings.find(r => String(r.reg) === String(w.reg));
            if (found && w.ratings && found.boardRating) {
              if (!ratingMap[w.ratings]) ratingMap[w.ratings] = new Set();
              ratingMap[w.ratings].add(found.boardRating);
            }
          }
        }
      }
    }
  } catch {}

  console.log('\n=== RATING CODE MAPPING ===');
  for (const [code, meanings] of Object.entries(ratingMap).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${code.padEnd(15)} => ${[...meanings].join(', ')}`);
  }

  fs.writeFileSync(path.join(DIR, 'rating-map.json'), JSON.stringify(
    Object.fromEntries(Object.entries(ratingMap).map(([k, v]) => [k, [...v]])),
    null, 2
  ));

  await browser.close();
  console.log(`\nDone. ${allWorkerRatings.length} workers scraped.`);
})();
