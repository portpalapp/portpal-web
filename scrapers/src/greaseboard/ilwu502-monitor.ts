import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { DATA_DIR, FORCE_RUN } from '../shared/config';
import { makeLogger, localDateStr, localStamp, downloadFile, randomDelay } from '../shared/utils';

// ILWU Local 502 Greaseboard Monitor for PORTPAL
// Scrapes work boards, work pins, westshore data, forecasts, and dispatch PDFs
// from ilwu502.ca (Delta / Fraser Surrey Docks)
// No auth needed — all public pages

const ILWU_DIR = path.join(DATA_DIR, 'ilwu502');
const log = makeLogger('ilwu502');

const GREASEBOARD_SOURCE = {
  name: 'work-pins',
  url: 'https://ilwu502.ca/greaseboard/work-pins/?gb_data_refresh'
};

const SLIP_PAGES = [
  { name: 'flowsheets', url: 'https://ilwu502.ca/dispatch-slips/' },
  { name: 'predispatch', url: 'https://ilwu502.ca/predispatch-slips/' }
];

// ============================================================
// GREASEBOARD
// ============================================================

async function scrapeGreaseboard(page: any): Promise<any> {
  log(`  Scraping greaseboard (${GREASEBOARD_SOURCE.name})...`);
  try {
    await page.goto(GREASEBOARD_SOURCE.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const gbData = await page.evaluate(() => {
      if (typeof (window as any).gbData !== 'undefined') return (window as any).gbData;
      return null;
    });

    if (gbData) {
      log(`    gbData extracted: ${JSON.stringify(gbData).length} chars`);
      return { source: GREASEBOARD_SOURCE.name, url: GREASEBOARD_SOURCE.url, data: gbData, extractedAt: new Date().toISOString(), extractionMethod: 'gbData' };
    }

    // Fallback: script tag parse
    const scriptData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const s of scripts) {
        const text = s.textContent || '';
        const match = text.match(/var\s+gbData\s*=\s*(\{[\s\S]*?\});/);
        if (match) { try { return JSON.parse(match[1]); } catch {} }
      }
      return null;
    });

    if (scriptData) {
      log(`    Script-parsed gbData: ${JSON.stringify(scriptData).length} chars`);
      return { source: GREASEBOARD_SOURCE.name, url: GREASEBOARD_SOURCE.url, data: scriptData, extractedAt: new Date().toISOString(), extractionMethod: 'script-parse' };
    }

    // Final fallback: HTML tables
    const tables = await page.evaluate(() => {
      const result: any[] = [];
      document.querySelectorAll('table').forEach((table, i) => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => (th as HTMLElement).innerText.trim());
        const rows: string[][] = [];
        table.querySelectorAll('tr').forEach(tr => {
          const cells = Array.from(tr.querySelectorAll('td')).map(td => (td as HTMLElement).innerText.trim());
          if (cells.length > 0) rows.push(cells);
        });
        if (headers.length > 0 || rows.length > 0) result.push({ tableIndex: i, headers, rows });
      });
      return result;
    });

    const contentText = await page.evaluate(() => {
      const main = document.querySelector('.entry-content') || document.querySelector('main') || document.querySelector('.greaseboard') || document.body;
      return (main as HTMLElement)?.innerText?.substring(0, 10000) || '';
    });

    log(`    HTML fallback: ${tables.length} tables, ${contentText.length} chars`);
    return { source: GREASEBOARD_SOURCE.name, url: GREASEBOARD_SOURCE.url, data: { tables, contentText: contentText.substring(0, 5000) }, extractedAt: new Date().toISOString(), extractionMethod: 'html-parse' };

  } catch (e: any) {
    log(`    ERROR on greaseboard: ${e.message?.substring(0, 100)}`);
    return { error: e.message, url: GREASEBOARD_SOURCE.url, extractedAt: new Date().toISOString() };
  }
}

// ============================================================
// DISPATCH & PRE-DISPATCH PAGES
// ============================================================

async function scrapeSlipPages(page: any, pdfDir: string): Promise<any> {
  const results: any = {};

  for (const { name, url } of SLIP_PAGES) {
    log(`  Scraping ${name} page (full content + PDFs)...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      const pageData = await page.evaluate(() => {
        const content = document.querySelector('.entry-content') || document.querySelector('main') || document.querySelector('article') || document.body;
        const fullText = (content as HTMLElement)?.innerText || '';

        const allLinks: { text: string; href: string; isPdf: boolean; isUpload: boolean; isImage: boolean }[] = [];
        content?.querySelectorAll('a[href]').forEach(a => {
          const href = (a as HTMLAnchorElement).href;
          const text = (a as HTMLElement).innerText.trim();
          if (!href || href === '#' || href.startsWith('javascript:')) return;
          allLinks.push({ text: text || '[no text]', href, isPdf: /\.pdf$/i.test(href), isUpload: href.includes('/uploads/') || href.includes('/wp-content/'), isImage: /\.(jpg|jpeg|png|gif|webp)$/i.test(href) });
        });

        const images: { src: string; alt: string; width: number; height: number }[] = [];
        content?.querySelectorAll('img').forEach(img => {
          const src = (img as HTMLImageElement).src;
          const alt = (img as HTMLImageElement).alt || '';
          const w = (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width || 0;
          const h = (img as HTMLImageElement).naturalHeight || (img as HTMLImageElement).height || 0;
          if (src && (w > 50 || h > 50 || src.includes('/uploads/'))) images.push({ src, alt, width: w, height: h });
        });

        const items: { type: string; text: string; href?: string }[] = [];
        const walker = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text && text.length > 1) items.push({ type: 'text', text });
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (tag === 'a' && (el as HTMLAnchorElement).href) { items.push({ type: 'link', text: el.innerText.trim(), href: (el as HTMLAnchorElement).href }); return; }
            if (tag === 'img') { items.push({ type: 'image', text: (el as HTMLImageElement).alt || '', href: (el as HTMLImageElement).src }); return; }
            if (['h1','h2','h3','h4','h5','h6'].includes(tag)) { items.push({ type: 'heading', text: el.innerText.trim() }); return; }
            if (tag === 'hr' || tag === 'br') { items.push({ type: 'separator', text: '---' }); return; }
            for (const child of Array.from(el.childNodes)) walker(child);
          }
        };
        if (content) { for (const child of Array.from(content.childNodes)) walker(child); }
        return { fullText, allLinks, images, items };
      });

      const downloadableLinks = pageData.allLinks.filter((l: any) => l.isPdf || l.isUpload);
      const downloadableImages = pageData.images.filter((img: any) => img.src.includes('/uploads/'));

      log(`    Content: ${pageData.fullText.length} chars, ${pageData.allLinks.length} links, ${pageData.images.length} images`);

      // Download PDFs with content-hash dedup
      const pdfResults: any[] = [];
      const hashIndex = loadHashIndex();
      let hashIndexDirty = false;

      for (const link of downloadableLinks) {
        if (!link.href) continue;
        const linkText = link.text || 'untitled';
        const safeName = linkText.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_').substring(0, 80);
        const ext = link.isPdf ? '.pdf' : path.extname(new URL(link.href).pathname) || '.pdf';
        const destFile = path.join(pdfDir, `${name}_${safeName}${ext}`);

        if (fs.existsSync(destFile)) { pdfResults.push({ text: linkText, href: link.href, status: 'already-downloaded' }); continue; }

        try {
          const size = await downloadFile(link.href, destFile);
          const hash = computeFileHash(destFile);
          if (hashIndex[hash]) {
            fs.unlinkSync(destFile);
            pdfResults.push({ text: linkText, href: link.href, status: 'content-duplicate', duplicateOf: hashIndex[hash].path });
            log(`    Content duplicate: ${safeName}`);
          } else {
            hashIndex[hash] = { path: destFile, date: localDateStr() };
            hashIndexDirty = true;
            pdfResults.push({ text: linkText, href: link.href, status: 'downloaded', sizeKB: (size / 1024).toFixed(1) });
            log(`    Downloaded: ${safeName} (${(size / 1024).toFixed(1)} KB)`);
          }
        } catch (e: any) {
          pdfResults.push({ text: linkText, href: link.href, status: 'error', error: e.message });
        }
      }

      // Download images from uploads
      for (const img of downloadableImages) {
        const imgName = path.basename(new URL(img.src).pathname);
        const safeName = imgName.replace(/[^a-zA-Z0-9_\-. ]/g, '').substring(0, 80);
        const destFile = path.join(pdfDir, `${name}_img_${safeName}`);

        if (fs.existsSync(destFile)) { pdfResults.push({ text: img.alt || imgName, href: img.src, status: 'already-downloaded', type: 'image' }); continue; }

        try {
          const size = await downloadFile(img.src, destFile);
          const hash = computeFileHash(destFile);
          if (hashIndex[hash]) {
            fs.unlinkSync(destFile);
            pdfResults.push({ text: img.alt || imgName, href: img.src, status: 'content-duplicate', type: 'image' });
          } else {
            hashIndex[hash] = { path: destFile, date: localDateStr() };
            hashIndexDirty = true;
            pdfResults.push({ text: img.alt || imgName, href: img.src, status: 'downloaded', sizeKB: (size / 1024).toFixed(1), type: 'image' });
            log(`    Downloaded image: ${safeName}`);
          }
        } catch (e: any) {
          pdfResults.push({ text: img.alt || imgName, href: img.src, status: 'error', error: e.message, type: 'image' });
        }
      }

      if (hashIndexDirty) saveHashIndex(hashIndex);

      // Document tracker
      const documentTracker: { label: string; status: 'available' | 'pending'; href: string; isPlaceholder: boolean }[] = [];
      for (const link of pageData.allLinks) {
        const text = link.text;
        if (!text || text.length < 3 || /^[-=~\s]+$/.test(text) || text === '[no text]') continue;
        if (['Adobe PDF Reader'].includes(text)) continue;
        const isPlaceholder = link.href === url || link.href === url.replace(/\/$/, '');
        const isRealDoc = link.isPdf || link.isUpload;
        documentTracker.push({ label: text, status: isRealDoc ? 'available' : 'pending', href: link.href, isPlaceholder });
      }

      const availCount = documentTracker.filter(d => d.status === 'available').length;
      const pendingCount = documentTracker.filter(d => d.status === 'pending').length;
      log(`    Documents: ${availCount} available, ${pendingCount} pending upload`);

      results[name] = { url, extractedAt: new Date().toISOString(), fullText: pageData.fullText, structuredItems: pageData.items, allLinks: pageData.allLinks, images: pageData.images, downloads: pdfResults, documentTracker };

    } catch (e: any) {
      log(`    ERROR scanning ${name}: ${e.message?.substring(0, 100)}`);
      results[name] = { error: e.message, url, extractedAt: new Date().toISOString() };
    }
  }

  return results;
}

// ============================================================
// CHANGE DETECTION
// ============================================================

function computeHash(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

function detectChanges(current: any, previous: any): { changed: boolean; sections: string[] } {
  if (!previous) return { changed: true, sections: ['initial-scrape'] };
  const changedSections: string[] = [];
  for (const key of Object.keys(current)) {
    if (key === 'pdfs') continue;
    const currHash = computeHash(current[key]);
    const prevHash = previous[key] ? computeHash(previous[key]) : '';
    if (currHash !== prevHash) changedSections.push(key);
  }
  return { changed: changedSections.length > 0, sections: changedSections };
}

// ============================================================
// PDF CONTENT-HASH DEDUPLICATION
// ============================================================

const HASH_INDEX_FILE = path.join(ILWU_DIR, 'pdf-hash-index.json');

function loadHashIndex(): Record<string, { path: string; date: string }> {
  try { return JSON.parse(fs.readFileSync(HASH_INDEX_FILE, 'utf8')); } catch { return {}; }
}

function saveHashIndex(index: Record<string, { path: string; date: string }>) {
  fs.writeFileSync(HASH_INDEX_FILE, JSON.stringify(index, null, 2));
}

function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ============================================================
// MAIN
// ============================================================

(async () => {
  fs.mkdirSync(ILWU_DIR, { recursive: true });

  // Skip evening/overnight (7 PM - 5 AM)
  const currentHour = new Date().getHours();
  if (!FORCE_RUN && (currentHour >= 19 || currentHour < 5)) {
    log(`Skipping evening/overnight run (hour=${currentHour})`);
    process.exit(0);
  }

  // Random delay 1-5 min
  await randomDelay(60000, 5 * 60 * 1000);

  const now = new Date();
  const dateStr = localDateStr(now);
  const stamp = localStamp(now);

  log(`=== ILWU 502 monitor run: ${stamp} ===`);

  const dayDir = path.join(ILWU_DIR, dateStr);
  fs.mkdirSync(dayDir, { recursive: true });

  const pdfDir = path.join(dayDir, 'pdfs');
  fs.mkdirSync(pdfDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    log('Scraping greaseboard...');
    const greaseboard = await scrapeGreaseboard(page);

    log('Scraping flowsheets + pre-dispatch pages...');
    const slipPages = await scrapeSlipPages(page, pdfDir);

    const snapshot: any = { scrapedAt: now.toISOString(), stamp, date: dateStr, union: 'ILWU Local 502', area: 'Delta / Fraser Surrey Docks', greaseboard, slipPages };

    // Change detection
    const latestFile = path.join(ILWU_DIR, 'latest.json');
    const previous = fs.existsSync(latestFile) ? JSON.parse(fs.readFileSync(latestFile, 'utf8')) : null;
    const allContent: any = { greaseboard: greaseboard.data || greaseboard };
    for (const [key, val] of Object.entries(slipPages)) {
      if (val && typeof val === 'object' && !('error' in (val as any))) allContent[`slip-${key}`] = (val as any).fullText || '';
    }
    const changes = detectChanges(allContent, (() => {
      if (!previous) return null;
      const prev: any = {};
      if (previous.greaseboard) prev.greaseboard = previous.greaseboard.data || previous.greaseboard;
      else if (previous.greaseboards) prev.greaseboard = previous.greaseboards['work-pins']?.data || previous.greaseboards['work-pins'];
      const prevSlips = previous.slipPages || previous.pdfs || {};
      for (const [key, val] of Object.entries(prevSlips)) {
        if (val && typeof val === 'object' && !('error' in (val as any))) prev[`slip-${key}`] = (val as any).fullText || '';
      }
      return prev;
    })());

    // Document transitions
    const docTransitions: { page: string; label: string; newHref: string }[] = [];
    if (previous?.slipPages) {
      for (const [pageName, pageVal] of Object.entries(slipPages)) {
        const currTracker = (pageVal as any)?.documentTracker || [];
        const prevTracker = (previous.slipPages[pageName] as any)?.documentTracker || [];
        for (const curr of currTracker) {
          if (curr.status !== 'available') continue;
          const prev = prevTracker.find((p: any) => p.label === curr.label);
          if (prev && prev.status === 'pending') {
            docTransitions.push({ page: pageName, label: curr.label, newHref: curr.href });
            log(`  NEW DOCUMENT: "${curr.label}" on ${pageName} — PDF now available!`);
          }
        }
      }
    }

    snapshot.changeDetection = { changed: changes.changed, changedSections: changes.sections, previousStamp: previous?.stamp || null, newDocuments: docTransitions };

    if (changes.changed) log(`Changes detected in: ${changes.sections.join(', ')}`);
    else log('No changes from previous scrape');

    // Save
    const outFile = path.join(dayDir, `ilwu502_${stamp}.json`);
    fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));
    log(`Saved: ${outFile} (${(JSON.stringify(snapshot).length / 1024).toFixed(1)} KB)`);

    fs.writeFileSync(latestFile, JSON.stringify(snapshot, null, 2));

    // Index
    const indexFile = path.join(ILWU_DIR, 'index.json');
    let index: any = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : { snapshots: [], dates: {} };
    index.snapshots.push({ stamp, file: `${dateStr}/ilwu502_${stamp}.json`, changed: changes.changed, changedSections: changes.sections });
    if (!index.dates[dateStr]) index.dates[dateStr] = [];
    index.dates[dateStr].push(stamp);
    index.lastUpdated = now.toISOString();
    index.totalSnapshots = index.snapshots.length;
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));

    const gbOk = greaseboard.data ? 'OK' : 'FAILED';
    const slipKeys = Object.keys(slipPages).filter(k => !(slipPages[k] as any).error);
    log(`Summary: greaseboard ${gbOk}, ${slipKeys.length}/${SLIP_PAGES.length} slip pages OK, changes: ${changes.changed ? changes.sections.join(', ') : 'none'}`);

  } catch (e: any) {
    log(`FATAL ERROR: ${e.message}`);
  } finally {
    await browser.close();
  }

  log('=== ILWU 502 monitor complete ===\n');
})();
