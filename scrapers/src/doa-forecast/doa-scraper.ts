import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { getAuthContext } from '../shared/auth-helper';
import { DATA_DIR, BCMEA_BASE_URL, ACCOUNT_BOARD } from '../shared/config';
import { makeLogger, localDateStr, localStamp, randomDelay } from '../shared/utils';

// Declaration of Availability (DOA) Forecast Scraper for PORTPAL
// Scrapes mybcmea.bcmea.com/doa-forecast to capture how many workers
// declared available per category for upcoming shifts.
// This is the SUPPLY side of the dispatch prediction.
// Schedule: 9 PM (after call-in deadline) and 6 AM (pre-dispatch)

const DOA_DIR = path.join(DATA_DIR, 'doa-forecast');
const log = makeLogger('doa-scraper');

(async () => {
  fs.mkdirSync(DOA_DIR, { recursive: true });

  // Random delay 1-3 min
  await randomDelay(60000, 3 * 60 * 1000);

  const now = new Date();
  const dateStr = localDateStr(now);
  const stamp = localStamp(now);

  const dayDir = path.join(DOA_DIR, dateStr);
  fs.mkdirSync(dayDir, { recursive: true });

  log(`Starting DOA forecast scrape: ${stamp}`);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await getAuthContext(browser, ACCOUNT_BOARD, BCMEA_BASE_URL, log);
    const page = await context.newPage();
    log('Auth OK');

    // Intercept API responses
    const apiResponses: { url: string; body: any }[] = [];
    page.on('response', async (resp) => {
      const url = resp.url();
      if (url.includes('/api/') && resp.status() === 200) {
        try {
          const text = await resp.text();
          const body = JSON.parse(text);
          apiResponses.push({ url, body });
          log(`  API captured: ${url.substring(url.indexOf('/api/'))}`);
        } catch {}
      }
    });

    await page.goto(`${BCMEA_BASE_URL}/doa-forecast`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const pageTitle = await page.title();
    const pageUrl = page.url();
    log(`  Page loaded: ${pageTitle} (${pageUrl})`);

    if (pageUrl.includes('identity') || pageUrl.includes('Login')) {
      log('ERROR: Redirected to login — auth failed');
      await browser.close();
      process.exit(1);
    }

    const bodyText = await page.evaluate(() => document.body.innerText);

    // Extract all tables
    const tables = await page.evaluate(() => {
      const result: { headers: string[]; rows: string[][] }[] = [];
      document.querySelectorAll('table').forEach(table => {
        const headers: string[] = [];
        table.querySelectorAll('thead th, thead td, tr:first-child th').forEach(th => {
          headers.push((th as HTMLElement).innerText.trim());
        });
        const rows: string[][] = [];
        table.querySelectorAll('tbody tr, tr').forEach((tr, i) => {
          if (i === 0 && headers.length > 0) return;
          const cells: string[] = [];
          tr.querySelectorAll('td, th').forEach(td => {
            cells.push((td as HTMLElement).innerText.trim());
          });
          if (cells.length > 0 && cells.some(c => c.length > 0)) {
            rows.push(cells);
          }
        });
        if (rows.length > 0 || headers.length > 0) {
          result.push({ headers, rows });
        }
      });
      return result;
    });

    // MUI DataGrid components
    const gridData = await page.evaluate(() => {
      const grids: any[] = [];
      document.querySelectorAll('.MuiDataGrid-root, [role="grid"]').forEach(grid => {
        const headers: string[] = [];
        grid.querySelectorAll('[role="columnheader"], .MuiDataGrid-columnHeader').forEach(h => {
          headers.push((h as HTMLElement).innerText.trim());
        });
        const rows: string[][] = [];
        grid.querySelectorAll('[role="row"]:not([role="columnheader"])').forEach(row => {
          const cells: string[] = [];
          row.querySelectorAll('[role="cell"], [role="gridcell"]').forEach(cell => {
            cells.push((cell as HTMLElement).innerText.trim());
          });
          if (cells.length > 0) rows.push(cells);
        });
        if (headers.length > 0 || rows.length > 0) {
          grids.push({ headers, rows });
        }
      });

      document.querySelectorAll('.MuiTable-root').forEach(table => {
        const headers: string[] = [];
        table.querySelectorAll('.MuiTableHead-root .MuiTableCell-root').forEach(h => {
          headers.push((h as HTMLElement).innerText.trim());
        });
        const rows: string[][] = [];
        table.querySelectorAll('.MuiTableBody-root .MuiTableRow-root').forEach(row => {
          const cells: string[] = [];
          row.querySelectorAll('.MuiTableCell-root').forEach(cell => {
            cells.push((cell as HTMLElement).innerText.trim());
          });
          if (cells.length > 0) rows.push(cells);
        });
        if (headers.length > 0 || rows.length > 0) grids.push({ headers, rows });
      });

      return grids;
    });

    // Screenshot
    const screenshotPath = path.join(dayDir, `screenshot_${stamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(`  Screenshot saved: ${screenshotPath}`);

    log(`  Body text: ${bodyText.length} chars`);
    log(`  Tables found: ${tables.length}`);
    log(`  MUI grids found: ${gridData.length}`);
    log(`  API responses: ${apiResponses.length}`);

    if (tables.length > 0) {
      log(`  First table: ${tables[0].headers.join(' | ')} (${tables[0].rows.length} rows)`);
    }
    if (gridData.length > 0) {
      log(`  First grid: ${gridData[0].headers.join(' | ')} (${gridData[0].rows.length} rows)`);
    }

    // Click "View Forecast" buttons for per-category breakdowns
    const forecastDetails: Record<string, any>[] = [];
    const viewButtons = await page.$$('button:has-text("View Forecast"), a:has-text("View Forecast")');
    log(`  Found ${viewButtons.length} View Forecast buttons`);

    for (let i = 0; i < viewButtons.length; i++) {
      try {
        const forecastApis: any[] = [];
        const forecastHandler = async (resp: any) => {
          const url = resp.url();
          if (url.includes('/api/') && resp.status() === 200) {
            try {
              const body = JSON.parse(await resp.text());
              forecastApis.push({ url, body });
            } catch {}
          }
        };
        page.on('response', forecastHandler);

        await viewButtons[i].click();
        await page.waitForTimeout(3000);

        const expandedTables = await page.evaluate(() => {
          const result: { headers: string[]; rows: string[][] }[] = [];
          document.querySelectorAll('table').forEach(table => {
            const headers: string[] = [];
            table.querySelectorAll('thead th, thead td').forEach(th => {
              headers.push((th as HTMLElement).innerText.trim());
            });
            const rows: string[][] = [];
            table.querySelectorAll('tbody tr').forEach(tr => {
              const cells: string[] = [];
              tr.querySelectorAll('td, th').forEach(td => {
                cells.push((td as HTMLElement).innerText.trim());
              });
              if (cells.length > 0 && cells.some(c => c.length > 0)) rows.push(cells);
            });
            if (rows.length > 0) result.push({ headers, rows });
          });
          return result;
        });

        page.off('response', forecastHandler);

        forecastDetails.push({
          buttonIndex: i,
          apis: forecastApis.map(a => ({ url: a.url, data: a.body })),
          tableCount: expandedTables.length,
          tables: expandedTables,
        });

        log(`  Forecast ${i}: ${forecastApis.length} APIs, ${expandedTables.length} tables`);

        const expandedScreenshot = path.join(dayDir, `screenshot_forecast${i}_${stamp}.png`);
        await page.screenshot({ path: expandedScreenshot, fullPage: true });

      } catch (err: any) {
        log(`  Forecast ${i} click failed: ${err.message?.substring(0, 60)}`);
      }
    }

    // Build result
    const result: Record<string, any> = {
      scrapedAt: now.toISOString(),
      stamp,
      date: dateStr,
      url: pageUrl,
      pageTitle,
      bodyText: bodyText.substring(0, 5000),
      bodyLength: bodyText.length,
      tables,
      gridData,
      apiResponses: apiResponses.map(r => ({
        url: r.url,
        dataKeys: typeof r.body === 'object' && r.body !== null ? Object.keys(r.body) : [],
        dataPreview: JSON.stringify(r.body).substring(0, 2000),
        fullData: r.body,
      })),
      apiEndpointCount: apiResponses.length,
      forecastDetails,
    };

    // Save snapshot
    const snapshotFile = path.join(dayDir, `doa_${stamp}.json`);
    fs.writeFileSync(snapshotFile, JSON.stringify(result, null, 2));
    log(`Snapshot saved: ${snapshotFile}`);

    // Update latest.json
    fs.writeFileSync(path.join(DOA_DIR, 'latest.json'), JSON.stringify(result, null, 2));

    // Update index
    const indexFile = path.join(DOA_DIR, 'index.json');
    let index: any[] = [];
    try { index = JSON.parse(fs.readFileSync(indexFile, 'utf-8')); } catch {}
    index.push({ stamp, date: dateStr, file: `${dateStr}/doa_${stamp}.json`, tables: tables.length, grids: gridData.length, apis: apiResponses.length });
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));

    await page.close();
    log('DOA scrape complete');

  } catch (err: any) {
    log(`ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
