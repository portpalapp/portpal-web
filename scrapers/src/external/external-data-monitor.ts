import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { DATA_DIR } from '../shared/config';
import { makeLogger, localDateStr, localStamp, httpGet, downloadFile, randomDelay } from '../shared/utils';

// PORTPAL External Data Monitor
// Scrapes all external (non-BCMEA-portal) data sources for ML model
// Sources: Weather, Port Authority vessel lineup, public BCMEA workinfo, DP World, Twitter, GCT PDFs
// No auth needed for any of these

const EXT_DIR = path.join(DATA_DIR, 'external');
const log = makeLogger('external');

async function extractTables(page: Page) {
  return page.evaluate(() => {
    const tables: { headers: string[]; rows: string[][] }[] = [];
    document.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
      const rows: string[][] = [];
      table.querySelectorAll('tbody tr, tr:not(:has(th))').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '');
        if (cells.length > 0 && cells.some(c => c.length > 0)) rows.push(cells);
      });
      if (rows.length > 0) tables.push({ headers, rows });
    });
    return tables;
  });
}

async function extractPageText(page: Page) {
  return page.evaluate(() => ({
    text: document.body.innerText.substring(0, 20000),
    title: document.title,
    url: window.location.href,
  }));
}

// 1. ENVIRONMENT CANADA WEATHER
async function scrapeWeather(page: Page): Promise<any> {
  log('Scraping Environment Canada weather...');
  try {
    await page.goto('https://weather.gc.ca/en/location/index.html?coords=49.245,-123.115', {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.waitForTimeout(3000);

    const data = await page.evaluate(() => {
      const result: any = { current: {}, forecast: [], hourly: [] };
      const allText = document.body.innerText;

      const tempMatch = allText.match(/Temperature:\s*(-?\d+\.?\d*)\s*°C/);
      const pressMatch = allText.match(/Pressure:\s*(\d+\.?\d*)\s*kPa/);
      const humidMatch = allText.match(/Humidity:\s*(\d+)%/);
      const windMatch = allText.match(/Wind:\s*([NSEW]+)\s*(\d+)\s*km\/h/);
      const visMatch = allText.match(/Visibility:\s*(\d+\.?\d*)\s*km/);
      const conditionMatch = allText.match(/Condition:\s*(.+?)(?:\n|$)/);
      const observedMatch = allText.match(/Observed at:\s*(.+?)(?:\n|$)/);

      if (tempMatch) result.current.temperatureC = parseFloat(tempMatch[1]);
      if (pressMatch) result.current.pressureKpa = parseFloat(pressMatch[1]);
      if (humidMatch) result.current.humidityPct = parseInt(humidMatch[1]);
      if (windMatch) { result.current.windDir = windMatch[1]; result.current.windKmh = parseInt(windMatch[2]); }
      if (visMatch) result.current.visibilityKm = parseFloat(visMatch[1]);
      if (conditionMatch) result.current.condition = conditionMatch[1].trim();
      if (observedMatch) result.current.observedAt = observedMatch[1].trim();

      const forecastSection = allText.match(/(?:Tonight|Today|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[\s\S]*?(?=Hourly|Sunrise|$)/i);
      if (forecastSection) {
        const dayBlocks = forecastSection[0].split(/(?=(?:Tonight|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b)/i);
        for (const block of dayBlocks.slice(0, 8)) {
          const dayName = block.match(/^(\w+)/)?.[1];
          const high = block.match(/High\s+(-?\d+)/);
          const low = block.match(/Low\s+(-?\d+)/);
          const pop = block.match(/(\d+)%/);
          if (dayName) {
            result.forecast.push({
              day: dayName,
              high: high ? parseInt(high[1]) : null,
              low: low ? parseInt(low[1]) : null,
              pop: pop ? parseInt(pop[1]) : null,
              text: block.trim().substring(0, 200),
            });
          }
        }
      }

      return result;
    });

    log(`  Weather: temp=${data.current.temperatureC}°C, wind=${data.current.windKmh}km/h, condition=${data.current.condition}`);
    return data;
  } catch (e: any) {
    log(`  Weather ERROR: ${e.message?.substring(0, 80)}`);
    return { error: e.message };
  }
}

// 2. MARINE WEATHER
async function scrapeMarineWeather(page: Page): Promise<any> {
  log('Scraping marine weather...');
  try {
    await page.goto('https://weather.gc.ca/marine/forecast_e.html?mapID=02&siteID=14300', {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.waitForTimeout(2000);
    const pageInfo = await extractPageText(page);
    const tables = await extractTables(page);
    log(`  Marine: ${pageInfo.text.length} chars, ${tables.length} tables`);
    return { text: pageInfo.text.substring(0, 5000), tables };
  } catch (e: any) {
    log(`  Marine weather ERROR: ${e.message?.substring(0, 80)}`);
    return { error: e.message };
  }
}

// 3. PUBLIC BCMEA WORKINFO
async function scrapePublicWorkInfo(page: Page): Promise<any> {
  log('Scraping public workinfo.bcmea.com...');
  try {
    await page.goto('https://workinfo.bcmea.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const data = await page.evaluate(() => {
      const result: any = {
        text: document.body.innerText.substring(0, 10000),
        title: document.title,
      };
      const tables: any[] = [];
      document.querySelectorAll('table').forEach(table => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        const rows: string[][] = [];
        table.querySelectorAll('tr').forEach(tr => {
          const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '');
          if (cells.length > 0) rows.push(cells);
        });
        if (rows.length > 0) tables.push({ headers, rows });
      });
      result.tables = tables;
      result.canvasCount = document.querySelectorAll('canvas').length;
      result.svgCount = document.querySelectorAll('svg').length;

      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const text = script.textContent || '';
        if (text.includes('forecast') || text.includes('gang') || text.includes('data')) {
          const matches = text.match(/(?:data|forecast|gangs?)\s*[=:]\s*(\[[\s\S]*?\]|\{[\s\S]*?\})/gi);
          if (matches) result.embeddedData = matches.map(m => m.substring(0, 500));
        }
      }
      return result;
    });

    log(`  Public workinfo: ${data.text?.length || 0} chars, ${data.tables?.length || 0} tables`);
    return data;
  } catch (e: any) {
    log(`  Public workinfo ERROR: ${e.message?.substring(0, 80)}`);
    return { error: e.message };
  }
}

// 4. PORT OF VANCOUVER
async function scrapePortVancouver(page: Page): Promise<any> {
  log('Scraping Port of Vancouver data...');
  const result: any = {};

  try {
    log('  Fetching container vessel line-up...');
    const html = await httpGet('https://www.portvancouver.com/media/dashboard-documents/container-vessel-line');
    result.containerVesselLineup = { length: html.length, content: html.substring(0, 15000) };
    log(`  Container lineup: ${html.length} chars`);
  } catch (e: any) {
    log(`  Container lineup ERROR: ${e.message?.substring(0, 80)}`);
    result.containerVesselLineup = { error: e.message };
  }

  try {
    log('  Scraping metrics dashboard...');
    await page.goto('https://www.portvancouver.com/port-operations/supply-chain/metrics-dashboard', {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.waitForTimeout(3000);
    const pageInfo = await extractPageText(page);
    const tables = await extractTables(page);
    result.metricsDashboard = { text: pageInfo.text.substring(0, 10000), tables, tableCount: tables.length };
    log(`  Metrics: ${pageInfo.text.length} chars, ${tables.length} tables`);
  } catch (e: any) {
    log(`  Metrics ERROR: ${e.message?.substring(0, 80)}`);
    result.metricsDashboard = { error: e.message };
  }

  return result;
}

// 5. DP WORLD
async function scrapeDPWorld(page: Page): Promise<any> {
  log('Scraping DP World berth schedule...');
  try {
    await page.goto('https://www.dpworld.com/en/canada/client-centre/vessel-berth-schedule/vancouver', {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.waitForTimeout(3000);
    const pageInfo = await extractPageText(page);
    const tables = await extractTables(page);
    log(`  DP World: ${pageInfo.text.length} chars, ${tables.length} tables`);
    return { text: pageInfo.text.substring(0, 10000), tables };
  } catch (e: any) {
    log(`  DP World ERROR: ${e.message?.substring(0, 80)}`);
    return { error: e.message };
  }
}

// 7. @VanBCDispatch TWITTER
async function scrapeDispatchTwitter(page: Page): Promise<any> {
  log('Scraping @VanBCDispatch...');
  try {
    await page.goto('https://x.com/VanBCDispatch', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(5000);
    const pageInfo = await extractPageText(page);
    log(`  Twitter: ${pageInfo.text.length} chars`);
    return { text: pageInfo.text.substring(0, 10000), title: pageInfo.title };
  } catch (e: any) {
    log(`  Twitter ERROR: ${e.message?.substring(0, 80)}`);
    return { error: e.message };
  }
}

// 9. ENVIRONMENT CANADA JSON API (no Playwright needed)
async function scrapeWeatherAPI(): Promise<any> {
  log('Fetching Environment Canada JSON API...');
  try {
    const cityPage = await httpGet('https://api.weather.gc.ca/collections/citypageweather-realtime/items/bc-74?lang=en&f=json');
    const cityData = JSON.parse(cityPage);
    log(`  Weather API: got city page data (${cityPage.length} chars)`);

    const hourly = await httpGet('https://api.weather.gc.ca/collections/climate-hourly/items?lang=en&f=json&STATION_NAME=VANCOUVER%20INTL%20A&sortby=-LOCAL_DATE&limit=24');
    const hourlyData = JSON.parse(hourly);
    log(`  Weather API: got ${hourlyData.features?.length || 0} hourly observations`);

    return {
      cityPage: cityData,
      hourlyHistory: hourlyData.features?.map((f: any) => f.properties) || [],
      hourlyCount: hourlyData.features?.length || 0,
    };
  } catch (e: any) {
    log(`  Weather API ERROR: ${e.message?.substring(0, 80)}`);
    return { error: e.message };
  }
}

// 10. GCT VESSEL SCHEDULE PDFs
async function scrapeGCTSchedules(): Promise<any> {
  log('Fetching GCT vessel schedule PDFs...');
  const result: any = {};

  const schedules = [
    { name: 'deltaport', url: 'https://webservices.globalterminals.com/sites/default/files/DPVesselSchedule.pdf' },
    { name: 'vanterm', url: 'https://webservices.globalterminals.com/sites/default/files/VTVesselSchedule.pdf' },
  ];

  const now = new Date();
  const dateStr = localDateStr(now);
  const pdfDir = path.join(EXT_DIR, dateStr, 'gct-pdfs');
  fs.mkdirSync(pdfDir, { recursive: true });

  for (const sched of schedules) {
    try {
      const pdfPath = path.join(pdfDir, `${sched.name}_${dateStr}.pdf`);
      await new Promise<void>((resolve, reject) => {
        const file = fs.createWriteStream(pdfPath);
        https.get(sched.url, { headers: { 'User-Agent': 'Mozilla/5.0 PORTPAL' } }, (resp) => {
          if (resp.statusCode === 301 || resp.statusCode === 302) {
            file.close();
            try { fs.unlinkSync(pdfPath); } catch {}
            https.get(resp.headers.location!, { headers: { 'User-Agent': 'Mozilla/5.0 PORTPAL' } }, (resp2) => {
              resp2.pipe(file);
              file.on('finish', () => { file.close(); resolve(); });
            }).on('error', reject);
            return;
          }
          resp.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (e) => {
          try { fs.unlinkSync(pdfPath); } catch {}
          reject(e);
        });
      });

      const size = fs.statSync(pdfPath).size;
      result[sched.name] = { path: pdfPath, sizeKB: (size / 1024).toFixed(1), downloaded: true };
      log(`  GCT ${sched.name}: ${(size / 1024).toFixed(1)} KB`);
    } catch (e: any) {
      log(`  GCT ${sched.name} ERROR: ${e.message?.substring(0, 80)}`);
      result[sched.name] = { error: e.message };
    }
  }

  return result;
}

// MAIN
(async () => {
  fs.mkdirSync(EXT_DIR, { recursive: true });

  // Skip overnight hours (11 PM - 6 AM)
  const currentHour = new Date().getHours();
  if (currentHour >= 23 || currentHour < 6) {
    log(`Skipping overnight run (hour=${currentHour})`);
    process.exit(0);
  }

  // Random delay 1-10 min
  await randomDelay(60000, 10 * 60 * 1000);

  const now = new Date();
  const dateStr = localDateStr(now);
  const stamp = localStamp(now);

  log(`=== External data monitor: ${stamp} ===`);

  const dayDir = path.join(EXT_DIR, dateStr);
  fs.mkdirSync(dayDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  let page = await context.newPage();
  let browserClosed = false;

  // Page crash recovery
  async function ensurePageAlive(): Promise<void> {
    try {
      await page.evaluate(() => true);
    } catch (e: any) {
      log(`  Page crashed, creating new page: ${e.message?.substring(0, 60)}`);
      try { await page.close(); } catch {}
      page = await context.newPage();
    }
  }

  const snapshot: Record<string, any> = { scrapedAt: now.toISOString(), stamp };

  try {
    snapshot.weather = await scrapeWeather(page);
    await ensurePageAlive();
    snapshot.marineWeather = await scrapeMarineWeather(page);
    await ensurePageAlive();
    snapshot.publicWorkInfo = await scrapePublicWorkInfo(page);
    await ensurePageAlive();
    snapshot.portVancouver = await scrapePortVancouver(page);
    await ensurePageAlive();
    snapshot.dpWorld = await scrapeDPWorld(page);
    await ensurePageAlive();
    snapshot.dispatchTwitter = await scrapeDispatchTwitter(page);
  } finally {
    if (!browserClosed) {
      try { await browser.close(); browserClosed = true; } catch {}
    }
  }

  // Non-browser sources
  snapshot.weatherAPI = await scrapeWeatherAPI();
  snapshot.gctSchedules = await scrapeGCTSchedules();

  // Count successes
  const sources = Object.keys(snapshot).filter(k => k !== 'scrapedAt' && k !== 'stamp');
  const successes = sources.filter(k => !snapshot[k]?.error);
  const failures = sources.filter(k => snapshot[k]?.error);

  log(`Sources scraped: ${successes.length}/${sources.length} successful`);
  if (failures.length > 0) log(`  Failed: ${failures.join(', ')}`);

  // Save
  const outFile = path.join(dayDir, `external_${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));
  log(`Saved: ${outFile}`);

  fs.writeFileSync(path.join(EXT_DIR, 'latest.json'), JSON.stringify(snapshot, null, 2));

  // Maintain index
  const indexFile = path.join(EXT_DIR, 'index.json');
  let index: any = { snapshots: [], dates: {} };
  if (fs.existsSync(indexFile)) {
    try { index = JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch {}
  }
  index.snapshots.push({ stamp, file: `${dateStr}/external_${stamp}.json`, successes: successes.length, failures: failures.length, failedSources: failures });
  if (!index.dates[dateStr]) index.dates[dateStr] = [];
  index.dates[dateStr].push(stamp);
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));

  // Change detection
  if (index.snapshots.length >= 2) {
    const prevFile = path.join(EXT_DIR, index.snapshots[index.snapshots.length - 2].file);
    if (fs.existsSync(prevFile)) {
      try {
        const prev = JSON.parse(fs.readFileSync(prevFile, 'utf8'));
        if (snapshot.weather?.current?.temperatureC !== prev.weather?.current?.temperatureC) {
          log(`  Weather changed: ${prev.weather?.current?.temperatureC}°C -> ${snapshot.weather?.current?.temperatureC}°C`);
        }
      } catch {}
    }
  }

  log(`=== External data monitor complete: ${stamp} ===\n`);
})();
