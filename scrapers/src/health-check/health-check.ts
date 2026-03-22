import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR } from '../shared/config';
import { localDateStr } from '../shared/utils';

// PORTPAL Health Check
// Audits all data collection pipelines, detects gaps, errors, and issues
// Schedule: daily at 10 AM (after morning scrapers have run)

const LOG_FILE = path.join(DATA_DIR, 'scraper.log');
const REPORT_FILE = path.join(DATA_DIR, 'health-report.json');
const REPORT_HISTORY_DIR = path.join(DATA_DIR, 'health-reports');

interface CheckResult {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  message: string;
  detail?: any;
}

function loadJSON(p: string): any {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function dateDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

function today(): string {
  return localDateStr();
}

function checkWorkInfo(): CheckResult {
  const dir = path.join(DATA_DIR, 'work-info');
  if (!fs.existsSync(dir)) return { name: 'Work-Info Daily', status: 'fail', message: 'Directory missing' };
  const files = fs.readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  if (files.length === 0) return { name: 'Work-Info Daily', status: 'fail', message: 'No data files' };
  const latestDate = files[files.length - 1].replace('.json', '');
  const yesterdayStr = dateDaysAgo(1);
  const gaps: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = dateDaysAgo(i);
    if (d < files[0].replace('.json', '')) continue;
    if (!files.includes(`${d}.json`)) gaps.push(d);
  }
  const latestSize = fs.statSync(path.join(dir, files[files.length - 1])).size;
  if (latestDate < yesterdayStr) return { name: 'Work-Info Daily', status: 'fail', message: `Last file is ${latestDate}`, detail: { files: files.length, latestDate, gaps } };
  if (latestSize < 1000) return { name: 'Work-Info Daily', status: 'warn', message: `Latest file is only ${latestSize} bytes`, detail: { files: files.length, latestDate, latestSize } };
  return { name: 'Work-Info Daily', status: gaps.length > 0 ? 'warn' : 'ok', message: `${files.length} days collected. Latest: ${latestDate}${gaps.length > 0 ? `. Gaps: ${gaps.join(', ')}` : ''}`, detail: { files: files.length, latestDate, latestSize, gaps } };
}

function checkWorkInfoSnapshots(): CheckResult {
  const dir = path.join(DATA_DIR, 'work-info-snapshots');
  if (!fs.existsSync(dir)) return { name: 'Work-Info Snapshots', status: 'fail', message: 'Directory missing' };
  const todayStr = today();
  const todayDir = path.join(dir, todayStr);
  const yesterdayDir = path.join(dir, dateDaysAgo(1));
  let todayCount = 0, yesterdayCount = 0;
  try { todayCount = fs.readdirSync(todayDir).filter(f => f.startsWith('snapshot_')).length; } catch {}
  try { yesterdayCount = fs.readdirSync(yesterdayDir).filter(f => f.startsWith('snapshot_')).length; } catch {}
  const expectedPerDay = 4;
  if (todayCount === 0 && yesterdayCount === 0) return { name: 'Work-Info Snapshots', status: 'fail', message: 'No snapshots today or yesterday' };
  const referenceCount = yesterdayCount > 0 ? yesterdayCount : todayCount;
  return { name: 'Work-Info Snapshots', status: referenceCount >= expectedPerDay ? 'ok' : referenceCount >= 2 ? 'warn' : 'fail', message: `Today: ${todayCount}/${expectedPerDay}, Yesterday: ${yesterdayCount}/${expectedPerDay}`, detail: { todayCount, yesterdayCount, expectedPerDay } };
}

function checkBoards(): CheckResult {
  const dir = path.join(DATA_DIR, 'boards');
  if (!fs.existsSync(dir)) return { name: 'Board Snapshots', status: 'fail', message: 'Directory missing' };
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json').sort();
  const todayStr = today();
  const todayFiles = files.filter(f => f.startsWith(todayStr));
  const yesterdayFiles = files.filter(f => f.startsWith(dateDaysAgo(1)));
  const expectedPerDay = 6;
  const zeroBytes = files.filter(f => { try { return fs.statSync(path.join(dir, f)).size < 100; } catch { return false; } });
  const referenceFiles = yesterdayFiles.length > 0 ? yesterdayFiles : todayFiles;
  return { name: 'Board Snapshots', status: referenceFiles.length >= expectedPerDay ? 'ok' : referenceFiles.length >= 3 ? 'warn' : 'fail', message: `Today: ${todayFiles.length}/${expectedPerDay}, Yesterday: ${yesterdayFiles.length}/${expectedPerDay}. Total: ${files.length}${zeroBytes.length > 0 ? `. ${zeroBytes.length} empty!` : ''}`, detail: { totalFiles: files.length, todayFiles: todayFiles.length, yesterdayFiles: yesterdayFiles.length } };
}

function checkHourlyMonitor(): CheckResult {
  const dir = path.join(DATA_DIR, 'hourly-monitor');
  if (!fs.existsSync(dir)) return { name: 'Hourly Monitor', status: 'fail', message: 'Directory missing' };
  const todayStr = today();
  const todayDir = path.join(dir, todayStr);
  const yesterdayDir = path.join(dir, dateDaysAgo(1));
  let todaySnapshots = 0, todayPDFs = 0, yesterdaySnapshots = 0;
  try { const f = fs.readdirSync(todayDir); todaySnapshots = f.filter(x => x.startsWith('snapshot_')).length; todayPDFs = f.filter(x => x.startsWith('pdf_')).length; } catch {}
  try { yesterdaySnapshots = fs.readdirSync(yesterdayDir).filter(x => x.startsWith('snapshot_')).length; } catch {}
  return { name: 'Hourly Monitor', status: (yesterdaySnapshots || todaySnapshots) >= 14 ? 'ok' : 'warn', message: `Today: ${todaySnapshots} snapshots, ${todayPDFs} PDFs. Yesterday: ${yesterdaySnapshots}`, detail: { todaySnapshots, todayPDFs, yesterdaySnapshots } };
}

function checkExternalMonitor(): CheckResult {
  const dir = path.join(DATA_DIR, 'external');
  if (!fs.existsSync(dir)) return { name: 'External Monitor', status: 'fail', message: 'Directory missing' };
  const latest = loadJSON(path.join(dir, 'latest.json'));
  const sourceStatus: Record<string, string> = {};
  if (latest) {
    const sources = Object.keys(latest).filter(k => k !== 'scrapedAt' && k !== 'stamp');
    for (const s of sources) sourceStatus[s] = latest[s]?.error ? 'FAIL' : 'OK';
  }
  const okCount = Object.values(sourceStatus).filter(s => s === 'OK').length;
  const failCount = Object.values(sourceStatus).filter(s => s === 'FAIL').length;
  return { name: 'External Monitor', status: failCount > 4 ? 'fail' : failCount > 2 ? 'warn' : 'ok', message: `Sources: ${okCount} OK, ${failCount} failed`, detail: { sourceStatus } };
}

function checkLogErrors(): CheckResult {
  if (!fs.existsSync(LOG_FILE)) return { name: 'Scraper Log', status: 'warn', message: 'Log file missing' };
  const logContent = fs.readFileSync(LOG_FILE, 'utf8');
  const lines = logContent.split('\n');
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  let recentErrors = 0, recentCrashes = 0;
  for (const line of lines) {
    const tsMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\]/);
    if (tsMatch) {
      const lineTime = new Date(tsMatch[1]).getTime();
      if (lineTime >= dayAgo) {
        if (line.includes('ERROR') || line.includes('error')) {
          recentErrors++;
          if (line.includes('Page crashed')) recentCrashes++;
        }
      }
    }
  }
  return { name: 'Scraper Log (24h)', status: recentCrashes > 10 ? 'fail' : recentErrors > 5 ? 'warn' : 'ok', message: `${recentErrors} errors (${recentCrashes} crashes)`, detail: { recentErrors, recentCrashes } };
}

function checkDataSize(): CheckResult {
  function dirSize(dir: string): number {
    let total = 0;
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) total += dirSize(full);
        else try { total += fs.statSync(full).size; } catch {}
      }
    } catch {}
    return total;
  }
  const sizes: Record<string, number> = {};
  const subdirs = ['work-info', 'work-info-snapshots', 'boards', 'hourly-monitor', 'external', 'ilwu502', 'doa-forecast', 'worker-details', 'health-reports'];
  let totalSize = 0;
  for (const sub of subdirs) { const s = dirSize(path.join(DATA_DIR, sub)); sizes[sub] = s; totalSize += s; }
  const totalMB = (totalSize / 1024 / 1024).toFixed(1);
  const largest = Object.entries(sizes).sort((a, b) => b[1] - a[1])[0];
  return { name: 'Data Size', status: totalSize > 5 * 1024 * 1024 * 1024 ? 'warn' : 'ok', message: `Total: ${totalMB} MB. Largest: ${largest?.[0]} (${(largest?.[1] / 1024 / 1024).toFixed(1)} MB)`, detail: Object.fromEntries(Object.entries(sizes).map(([k, v]) => [k, `${(v / 1024 / 1024).toFixed(2)} MB`])) };
}

function checkFreshness(): CheckResult {
  const checks = [
    { name: 'Hourly Monitor', file: path.join(DATA_DIR, 'hourly-monitor', 'latest.json'), maxAgeHours: 3 },
    { name: 'External Data', file: path.join(DATA_DIR, 'external', 'latest.json'), maxAgeHours: 4 },
    { name: 'Work-Info Snapshots', file: path.join(DATA_DIR, 'work-info-snapshots', 'latest.json'), maxAgeHours: 8 },
    { name: 'Work-Info Daily', file: path.join(DATA_DIR, 'work-info', 'latest.json'), maxAgeHours: 28 },
  ];
  const stale: string[] = [], fresh: string[] = [];
  const now = Date.now();
  for (const check of checks) {
    if (!fs.existsSync(check.file)) { stale.push(`${check.name}: file missing`); continue; }
    const data = loadJSON(check.file);
    const scrapedAt = data?.scrapedAt ? new Date(data.scrapedAt).getTime() : 0;
    const ageHours = (now - scrapedAt) / (1000 * 60 * 60);
    if (ageHours > check.maxAgeHours) stale.push(`${check.name}: ${ageHours.toFixed(1)}h old`);
    else fresh.push(`${check.name}: ${ageHours.toFixed(1)}h ago`);
  }
  return { name: 'Data Freshness', status: stale.length > 2 ? 'fail' : stale.length > 0 ? 'warn' : 'ok', message: `${fresh.length} fresh, ${stale.length} stale${stale.length > 0 ? '. ' + stale.join('; ') : ''}`, detail: { fresh, stale } };
}

function checkMLProgress(): CheckResult {
  const workInfoDir = path.join(DATA_DIR, 'work-info');
  let workInfoDays = 0, boardSnapshots = 0;
  try { workInfoDays = fs.readdirSync(workInfoDir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).length; } catch {}
  try { boardSnapshots = fs.readdirSync(path.join(DATA_DIR, 'boards')).filter(f => f.endsWith('.json') && f !== 'index.json').length; } catch {}
  const targetDays = 30;
  const pctComplete = Math.min(Math.round((workInfoDays / targetDays) * 100), 100);
  const daysRemaining = Math.max(0, targetDays - workInfoDays);
  return { name: 'ML Progress', status: pctComplete >= 100 ? 'ok' : pctComplete >= 50 ? 'warn' : 'fail', message: `${workInfoDays}/${targetDays} days (${pctComplete}%). ${boardSnapshots} board snapshots. ~${daysRemaining} days remaining.`, detail: { workInfoDays, boardSnapshots, targetDays, pctComplete, daysRemaining } };
}

// MAIN
console.log('PORTPAL Health Check');
console.log('====================\n');

const checks: CheckResult[] = [
  checkWorkInfo(),
  checkWorkInfoSnapshots(),
  checkBoards(),
  checkHourlyMonitor(),
  checkExternalMonitor(),
  checkLogErrors(),
  checkFreshness(),
  checkDataSize(),
  checkMLProgress(),
];

for (const check of checks) {
  const icon = check.status === 'ok' ? 'OK' : check.status === 'warn' ? 'WARN' : 'FAIL';
  const color = check.status === 'ok' ? '\x1b[32m' : check.status === 'warn' ? '\x1b[33m' : '\x1b[31m';
  console.log(`${color}[${icon}]\x1b[0m ${check.name}: ${check.message}`);
}

const okCount = checks.filter(c => c.status === 'ok').length;
const warnCount = checks.filter(c => c.status === 'warn').length;
const failCount = checks.filter(c => c.status === 'fail').length;

console.log(`\nSummary: ${okCount} OK, ${warnCount} warnings, ${failCount} failures`);

const report = { timestamp: new Date().toISOString(), date: today(), summary: { ok: okCount, warn: warnCount, fail: failCount, total: checks.length }, checks };

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
console.log(`\nReport saved: ${REPORT_FILE}`);

fs.mkdirSync(REPORT_HISTORY_DIR, { recursive: true });
const histFile = path.join(REPORT_HISTORY_DIR, `health_${today()}.json`);
fs.writeFileSync(histFile, JSON.stringify(report, null, 2));
console.log(`History saved: ${histFile}`);
