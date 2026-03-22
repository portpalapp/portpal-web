import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { getAuthContext } from '../shared/auth-helper';
import { DATA_DIR, BCMEA_BASE_URL, ACCOUNT_BOARD } from '../shared/config';
import { makeLogger, localDateStr, randomDelay } from '../shared/utils';

// Board A & B scraper for PORTPAL
// Captures board state + isCalledBack after dispatch windows
// Uses board account (B board member - can see A/B dispatch data)

const BOARD_DIR = path.join(DATA_DIR, 'boards');
const log = makeLogger('boards');

// Which shift triggered this run (passed as arg, or auto-detect)
const SHIFT_ARG = process.argv[2] || '';

(async () => {
  fs.mkdirSync(BOARD_DIR, { recursive: true });

  // Random delay 0-2 min to avoid clockwork pattern (kept short — dispatch data is time-sensitive)
  await randomDelay(0, 2 * 60 * 1000);

  const now = new Date();
  const dateStr = localDateStr(now);

  // Determine which shift we're scraping for
  let shiftLabel = SHIFT_ARG;
  if (!shiftLabel) {
    const hour = now.getHours();
    const min = now.getMinutes();
    if (hour === 8 && min >= 50) shiftLabel = '0800';
    else if (hour === 15 && min >= 55) shiftLabel = '1630';
    else if (hour === 16 && min >= 45) shiftLabel = '0100';
    else shiftLabel = `${String(hour).padStart(2, '0')}${String(min).padStart(2, '0')}`;
  }

  const outFile = path.join(BOARD_DIR, `${dateStr}_shift-${shiftLabel}.json`);

  if (fs.existsSync(outFile)) {
    const size = fs.statSync(outFile).size;
    if (size > 1024) {
      log(`Already scraped ${shiftLabel} shift today (${outFile} exists, ${size} bytes). Skipping.`);
      return;
    }
    log(`Previous ${shiftLabel} file is undersized (${size} bytes) — re-scraping`);
    try { fs.unlinkSync(outFile); } catch {}
  }

  log(`Starting board scrape for shift ${shiftLabel}...`);

  const browser = await chromium.launch({ headless: true });
  const context = await getAuthContext(browser, ACCOUNT_BOARD, BCMEA_BASE_URL, log);
  const page = await context.newPage();

  // Global response collector - capture ALL API responses
  const apiResponses: { url: string; body: any }[] = [];
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('/api/board/casual-board/')) {
      try {
        const body = JSON.parse(await resp.text());
        apiResponses.push({ url, body });
      } catch {}
    }
  });
  log('Auth OK');

  const results: Record<string, any> = {
    scrapedAt: now.toISOString(),
    date: dateStr,
    shiftLabel,
    boards: {},
  };

  // Scrape all 6 boards
  for (const board of ['a', 'b', 'c', 't', 'r', '00']) {
    const beforeCount = apiResponses.length;

    await page.goto(`${BCMEA_BASE_URL}/casual-board/${board}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const shiftsResp = apiResponses.slice(beforeCount).find(r => r.url.includes('/shifts/'));
    const shifts = shiftsResp?.body?.shifts || [];
    log(`Board ${board.toUpperCase()}: ${shifts.length} shifts available: ${shifts.map((s: any) => s.shift + ' ' + s.shiftDate).join(', ')}`);

    const autoLoaded = apiResponses.slice(beforeCount).find(r =>
      !r.url.includes('/shifts/') && r.body?.panels
    );

    const boardShifts: any[] = [];

    if (autoLoaded?.body) {
      const bd = autoLoaded.body;
      const shiftFromUrl = autoLoaded.url.split('/casual-board/')[1]?.split('?')[0] || '';
      processBoard(bd, shiftFromUrl, board, boardShifts);
    }

    for (const shift of shifts) {
      const shiftUrl = `${BCMEA_BASE_URL}/casual-board/${board}/${shift.shift}/${shift.shiftDate}`;
      const already = boardShifts.find(s => s.shift === shift.shift && s.shiftDate === shift.shiftDate);
      if (already) continue;

      const before2 = apiResponses.length;
      await page.goto(shiftUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const newData = apiResponses.slice(before2).find(r =>
        !r.url.includes('/shifts/') && r.body?.panels
      );
      if (newData?.body) {
        processBoard(newData.body, `${board}/${shift.shift}/${shift.shiftDate}`, board, boardShifts);
      }
    }

    results.boards[board] = { shifts: boardShifts };
    log(`Board ${board.toUpperCase()}: captured ${boardShifts.length} shift snapshots`);
  }

  await browser.close();

  // Save
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  log(`Saved to ${outFile}`);
  log(`Total API responses intercepted: ${apiResponses.length}`);

  // Update index
  const allFiles = fs.readdirSync(BOARD_DIR).filter(f => f.endsWith('.json') && f !== 'index.json').sort();
  fs.writeFileSync(path.join(BOARD_DIR, 'index.json'), JSON.stringify({
    totalFiles: allFiles.length,
    files: allFiles,
    lastUpdated: now.toISOString(),
  }, null, 2));
})();

function processBoard(bd: any, urlPath: string, board: string, boardShifts: any[]) {
  const allWorkers = (bd.panels || []).flatMap((p: any) => p.panel || []);
  const realWorkers = allWorkers.filter((w: any) => w.registrationNumber !== 0);
  const calledBack = realWorkers.filter((w: any) => w.isCalledBack);

  const shift = bd.criteria?.shift || urlPath.split('/')[1] || '?';
  const shiftDate = bd.criteria?.date || urlPath.split('/')[2] || '?';

  boardShifts.push({
    shift,
    shiftDate,
    scoreboard: bd.scoreboard,
    totalWorkers: realWorkers.length,
    calledBackCount: calledBack.length,
    workers: realWorkers.map((w: any) => ({
      reg: w.registrationNumber,
      plate: w.plate,
      name: w.name,
      colour: w.colour,
      ratings: (w.boardNameRating || '').split(' - ').pop() || '',
      isCalledBack: w.isCalledBack,
      isPluggedIn: w.isPluggedIn,
      isBlink: w.isBlink,
    })),
  });

  log(`  ${board.toUpperCase()} ${shift} ${shiftDate}: ${realWorkers.length} workers, ${calledBack.length} called back (scoreboard: ${bd.scoreboard?.callback})`);
}
