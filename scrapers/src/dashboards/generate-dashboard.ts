import { DATA_DIR } from '../shared/config';
import * as fs from 'fs';
import * as path from 'path';

// Dashboard generator for PORTPAL
// Reads all scraped data and generates a self-contained HTML dashboard

const WORK_DIR = path.join(DATA_DIR, 'work-info');
const BOARD_DIR = path.join(DATA_DIR, 'boards');
const OUT_FILE = path.join(DATA_DIR, 'dashboard.html');

interface WorkDay {
  date: string;
  scrapedAt: string;
  vancouver: any;
  squamish: any;
  coastwise: any;
}

interface BoardSnapshot {
  file: string;
  date: string;
  shiftLabel: string;
  scrapedAt: string;
  boards: Record<string, { shifts: any[] }>;
}

// Load all work-info data
function loadWorkInfo(): WorkDay[] {
  if (!fs.existsSync(WORK_DIR)) return [];
  return fs.readdirSync(WORK_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(WORK_DIR, f), 'utf8'));
      return {
        date: data.date || f.replace('.json', ''),
        scrapedAt: data.scrapedAt || '',
        vancouver: data.vancouver || null,
        squamish: data.squamish || null,
        coastwise: data.coastwise || null,
      };
    });
}

// Load all board snapshots
function loadBoards(): BoardSnapshot[] {
  if (!fs.existsSync(BOARD_DIR)) return [];
  return fs.readdirSync(BOARD_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .sort()
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(BOARD_DIR, f), 'utf8'));
      return {
        file: f,
        date: data.date || '',
        shiftLabel: data.shiftLabel || '',
        scrapedAt: data.scrapedAt || '',
        boards: data.boards || {},
      };
    });
}

function esc(s: any): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateHTML(workDays: WorkDay[], boardSnaps: BoardSnapshot[]): string {
  const now = new Date();

  // Build work-info table data
  const workRows: string[] = [];
  for (const day of workDays) {
    for (const loc of ['vancouver', 'squamish', 'coastwise'] as const) {
      const data = day[loc];
      if (!data?.totals) continue;
      for (const t of data.totals) {
        workRows.push(JSON.stringify({
          date: day.date,
          location: loc,
          shift: t.shift,
          shiftDate: t.date,
          pre: Number(t.pre || 0),
          at: Number(t.at || 0),
        }));
      }
    }
  }

  // Build board summary data
  const boardRows: string[] = [];
  for (const snap of boardSnaps) {
    for (const [board, data] of Object.entries(snap.boards)) {
      if (!data?.shifts) continue;
      for (const s of data.shifts) {
        boardRows.push(JSON.stringify({
          date: snap.date,
          shiftLabel: snap.shiftLabel,
          board: board.toUpperCase(),
          shift: s.shift,
          shiftDate: s.shiftDate,
          totalWorkers: s.totalWorkers,
          calledBack: s.calledBackCount,
          scoreboardCallback: s.scoreboard?.callback || 0,
          dispatchRate: s.totalWorkers > 0 ? Math.round(s.calledBackCount / s.totalWorkers * 1000) / 10 : 0,
        }));
      }
    }
  }

  // Build detailed worker data for the latest board snapshot
  let latestBoardDetail = '';
  if (boardSnaps.length > 0) {
    const latest = boardSnaps[boardSnaps.length - 1];
    const workerRows: string[] = [];
    for (const [board, data] of Object.entries(latest.boards)) {
      if (!data?.shifts) continue;
      for (const s of data.shifts) {
        for (const w of (s.workers || [])) {
          workerRows.push(JSON.stringify({
            board: board.toUpperCase(),
            shift: s.shift,
            reg: w.reg,
            plate: w.plate,
            name: w.name,
            colour: w.colour,
            ratings: w.ratings,
            calledBack: w.isCalledBack,
          }));
        }
      }
    }
    latestBoardDetail = workerRows.join(',\n    ');
  }

  // Build job breakdown for latest work-info
  let jobBreakdown = '[]';
  if (workDays.length > 0) {
    const latest = workDays[workDays.length - 1];
    const jobs: any[] = [];
    for (const loc of ['vancouver', 'squamish', 'coastwise'] as const) {
      const data = latest[loc];
      if (!data?.workInformation) continue;
      for (const section of data.workInformation) {
        for (const job of (section.jobs || [])) {
          let totalPre = 0, totalAt = 0;
          for (const site of (job.sites || [])) {
            for (const d of (site.dates || [])) {
              totalPre += Number(d.pre || 0);
              totalAt += Number(d.at || 0);
            }
          }
          if (totalPre > 0 || totalAt > 0) {
            jobs.push({
              location: loc,
              section: section.section,
              job: job.job,
              sites: (job.sites || []).length,
              pre: totalPre,
              at: totalAt,
            });
          }
        }
      }
    }
    jobBreakdown = JSON.stringify(jobs);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PORTPAL Dashboard</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,sans-serif; background:#0a0e1a; color:#c9d1d9; }

  .top { background:linear-gradient(135deg,#1a1040,#102040); padding:18px 30px; border-bottom:3px solid #f59e0b;
         display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:10; }
  .top h1 { color:#fbbf24; font-size:1.4em; }
  .top .meta { color:#8b949e; font-size:0.82em; }

  .tabs { display:flex; gap:0; background:#0f1525; border-bottom:1px solid #1e2d4a; padding:0 30px; position:sticky; top:60px; z-index:9; }
  .tab { padding:12px 22px; cursor:pointer; color:#8b949e; border-bottom:3px solid transparent; font-weight:500; transition:all 0.2s; }
  .tab:hover { color:#c9d1d9; background:#161d30; }
  .tab.active { color:#fbbf24; border-bottom-color:#fbbf24; }

  .container { padding:25px 30px 60px; max-width:1400px; margin:0 auto; }
  .panel { display:none; }
  .panel.active { display:block; }

  .stats { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
  .stat { background:#161d30; border:1px solid #1e2d4a; border-radius:10px; padding:14px 22px; text-align:center; min-width:130px; }
  .stat .n { font-size:1.8em; font-weight:700; }
  .stat .l { font-size:0.72em; color:#8b949e; text-transform:uppercase; margin-top:3px; }

  h2 { color:#818cf8; font-size:1.2em; margin:20px 0 12px; }

  table { width:100%; border-collapse:collapse; font-size:0.85em; margin-bottom:20px; }
  th { background:#161d30; color:#818cf8; text-align:left; padding:9px 12px; font-weight:600; position:sticky; top:108px; z-index:5; cursor:pointer; user-select:none; }
  th:hover { background:#1e2d4a; }
  td { padding:7px 12px; border-bottom:1px solid #111827; }
  tr:hover td { background:#161d30; }

  .green { color:#34d399; } .orange { color:#fb923c; } .red { color:#f87171; }
  .blue { color:#818cf8; } .yellow { color:#fbbf24; } .gray { color:#6b7280; }

  .tag { display:inline-block; padding:2px 8px; border-radius:8px; font-size:0.75em; font-weight:700; }
  .tag-green { background:#064e3b; color:#34d399; }
  .tag-orange { background:#451a03; color:#fb923c; }
  .tag-blue { background:#1e1b4b; color:#818cf8; }
  .tag-red { background:#450a0a; color:#f87171; }

  .colour-dot { display:inline-block; width:12px; height:12px; border-radius:3px; vertical-align:middle; margin-right:5px; border:1px solid #333; }

  .card { background:#111827; border:1px solid #1e2d4a; border-radius:12px; padding:20px 24px; margin-bottom:16px; }

  .filter-bar { display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap; align-items:center; }
  .filter-bar label { color:#8b949e; font-size:0.82em; }
  .filter-bar select, .filter-bar input { background:#161d30; color:#e1e4e8; border:1px solid #1e2d4a; border-radius:6px; padding:6px 10px; font-size:0.85em; }

  .chart-bar { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .chart-label { min-width:100px; font-size:0.82em; color:#8b949e; text-align:right; }
  .chart-fill { height:22px; border-radius:4px; transition:width 0.3s; display:flex; align-items:center; padding:0 8px; font-size:0.72em; font-weight:600; color:white; min-width:30px; }

  .empty-state { text-align:center; padding:60px 20px; color:#4b5563; }
  .empty-state .icon { font-size:3em; margin-bottom:10px; }
  .empty-state p { font-size:1.1em; }
</style>
</head>
<body>

<div class="top">
  <div>
    <h1>PORTPAL Dashboard</h1>
    <div class="meta">Auto-generated ${esc(now.toLocaleString())} | ${workDays.length} days of work data | ${boardSnaps.length} board snapshots</div>
  </div>
  <div style="text-align:right">
    <div style="color:#fbbf24;font-weight:600">${workDays.length > 0 ? workDays[workDays.length - 1].date : 'No data'}</div>
    <div class="meta">Latest scrape</div>
  </div>
</div>

<div class="tabs">
  <div class="tab active" onclick="showPanel('overview')">Overview</div>
  <div class="tab" onclick="showPanel('workinfo')">Work Info</div>
  <div class="tab" onclick="showPanel('jobs')">Job Breakdown</div>
  <div class="tab" onclick="showPanel('boards')">Board Data</div>
  <div class="tab" onclick="showPanel('workers')">Workers</div>
  <div class="tab" onclick="showPanel('trends')">Trends</div>
</div>

<div class="container">

<!-- OVERVIEW PANEL -->
<div class="panel active" id="panel-overview">
  <div class="stats" id="overview-stats"></div>
  <div class="card">
    <h2>Latest Shift Demand</h2>
    <div id="overview-bars"></div>
  </div>
  <div class="card">
    <h2>Latest Board Dispatch</h2>
    <div id="overview-boards"></div>
  </div>
  <div class="card">
    <h2>Scrape Schedule</h2>
    <table>
      <tr><th>Task</th><th>Time</th><th>What</th></tr>
      <tr><td>Board Scrape (08:00 shift)</td><td>8:55 AM</td><td>A &amp; B board state after morning dispatch</td></tr>
      <tr><td>Board Scrape (16:30 shift)</td><td>3:59 PM</td><td>A &amp; B board state after 3 PM dispatch</td></tr>
      <tr><td>Board Scrape (01:00 shift)</td><td>4:49 PM</td><td>A &amp; B board state after 4 PM dispatch</td></tr>
      <tr><td>Work Info Scrape</td><td>6:00 PM</td><td>All shifts, all locations (Van/Squamish/Coastwise)</td></tr>
    </table>
  </div>
</div>

<!-- WORK INFO PANEL -->
<div class="panel" id="panel-workinfo">
  <div class="filter-bar">
    <label>Location:</label>
    <select id="wi-loc" onchange="renderWorkInfo()">
      <option value="all">All</option>
      <option value="vancouver">Vancouver</option>
      <option value="squamish">Squamish</option>
      <option value="coastwise">Coastwise</option>
    </select>
  </div>
  <table id="wi-table">
    <thead><tr><th onclick="sortTable('wi-table',0)">Date</th><th onclick="sortTable('wi-table',1)">Location</th><th onclick="sortTable('wi-table',2)">Shift</th><th onclick="sortTable('wi-table',3)">Shift Date</th><th onclick="sortTable('wi-table',4)">Pre-ordered</th><th onclick="sortTable('wi-table',5)">Actual</th><th onclick="sortTable('wi-table',6)">Fill %</th></tr></thead>
    <tbody></tbody>
  </table>
</div>

<!-- JOB BREAKDOWN PANEL -->
<div class="panel" id="panel-jobs">
  <h2>Job Types - Latest Scrape</h2>
  <div class="filter-bar">
    <label>Location:</label>
    <select id="job-loc" onchange="renderJobs()">
      <option value="all">All</option>
      <option value="vancouver">Vancouver</option>
      <option value="squamish">Squamish</option>
      <option value="coastwise">Coastwise</option>
    </select>
  </div>
  <table id="job-table">
    <thead><tr><th onclick="sortTable('job-table',0)">Location</th><th onclick="sortTable('job-table',1)">Section</th><th onclick="sortTable('job-table',2)">Job</th><th onclick="sortTable('job-table',3)">Sites</th><th onclick="sortTable('job-table',4)">Pre</th><th onclick="sortTable('job-table',5)">At</th></tr></thead>
    <tbody></tbody>
  </table>
</div>

<!-- BOARDS PANEL -->
<div class="panel" id="panel-boards">
  <h2>Board Snapshots</h2>
  <table id="board-table">
    <thead><tr><th onclick="sortTable('board-table',0)">Date</th><th onclick="sortTable('board-table',1)">Scrape</th><th onclick="sortTable('board-table',2)">Board</th><th onclick="sortTable('board-table',3)">Shift</th><th onclick="sortTable('board-table',4)">Workers</th><th onclick="sortTable('board-table',5)">Called Back</th><th onclick="sortTable('board-table',6)">Dispatch %</th></tr></thead>
    <tbody></tbody>
  </table>
</div>

<!-- WORKERS PANEL -->
<div class="panel" id="panel-workers">
  <h2>Workers - Latest Board Snapshot</h2>
  <div class="filter-bar">
    <label>Board:</label>
    <select id="w-board" onchange="renderWorkers()">
      <option value="all">All</option>
      <option value="A">A</option>
      <option value="B">B</option>
    </select>
    <label>Status:</label>
    <select id="w-status" onchange="renderWorkers()">
      <option value="all">All</option>
      <option value="called">Called Back</option>
      <option value="available">Not Called</option>
    </select>
    <label>Search:</label>
    <input type="text" id="w-search" placeholder="Name or reg#" oninput="renderWorkers()">
  </div>
  <div id="worker-count" style="color:#8b949e;font-size:0.85em;margin-bottom:10px"></div>
  <table id="worker-table">
    <thead><tr><th onclick="sortTable('worker-table',0)">Board</th><th onclick="sortTable('worker-table',1)">Plate</th><th onclick="sortTable('worker-table',2)">Reg#</th><th onclick="sortTable('worker-table',3)">Name</th><th onclick="sortTable('worker-table',4)">Colour</th><th onclick="sortTable('worker-table',5)">Ratings</th><th onclick="sortTable('worker-table',6)">Called Back</th></tr></thead>
    <tbody></tbody>
  </table>
</div>

<!-- TRENDS PANEL -->
<div class="panel" id="panel-trends">
  ${workDays.length < 2 ?
    '<div class="empty-state"><div class="icon">&#128200;</div><p>Trends will appear after 2+ days of data collection.</p><p style="color:#6b7280;font-size:0.9em;margin-top:8px">The scraper runs daily at 6 PM. Check back in a few days!</p></div>' :
    '<h2>Daily Demand Trend</h2><canvas id="trend-canvas" width="1200" height="400" style="width:100%;background:#111827;border-radius:12px;border:1px solid #1e2d4a"></canvas>'
  }
</div>

</div>

<script>
// DATA
const workData = [
    ${workRows.join(',\n    ')}
];
const boardData = [
    ${boardRows.join(',\n    ')}
];
const workerData = [
    ${latestBoardDetail}
];
const jobData = ${jobBreakdown};

// TAB SWITCHING
function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  event.target.classList.add('active');
}

// TABLE SORTING
let sortState = {};
function sortTable(tableId, col) {
  const key = tableId + '-' + col;
  sortState[key] = !(sortState[key]);
  const tbody = document.getElementById(tableId).querySelector('tbody');
  const rows = Array.from(tbody.rows);
  rows.sort((a, b) => {
    let va = a.cells[col]?.textContent || '';
    let vb = b.cells[col]?.textContent || '';
    const na = parseFloat(va.replace('%',''));
    const nb = parseFloat(vb.replace('%',''));
    if (!isNaN(na) && !isNaN(nb)) return sortState[key] ? na - nb : nb - na;
    return sortState[key] ? va.localeCompare(vb) : vb.localeCompare(va);
  });
  rows.forEach(r => tbody.appendChild(r));
}

// OVERVIEW
function renderOverview() {
  const totalDays = new Set(workData.map(d => d.date)).size;
  const totalSnaps = boardData.length;
  const latestWork = workData.filter(d => d.date === workData[workData.length - 1]?.date);
  const totalPre = latestWork.reduce((s, d) => s + d.pre, 0);
  const totalAt = latestWork.reduce((s, d) => s + d.at, 0);
  const latestBoards = boardData.filter(d => d.date === boardData[boardData.length - 1]?.date);
  const totalCalled = latestBoards.reduce((s, d) => s + d.calledBack, 0);

  document.getElementById('overview-stats').innerHTML =
    '<div class="stat"><div class="n blue">' + totalDays + '</div><div class="l">Days Scraped</div></div>' +
    '<div class="stat"><div class="n yellow">' + totalPre + '</div><div class="l">Latest Pre-ordered</div></div>' +
    '<div class="stat"><div class="n green">' + totalAt + '</div><div class="l">Latest Actual</div></div>' +
    '<div class="stat"><div class="n orange">' + totalCalled + '</div><div class="l">Workers Called Back</div></div>' +
    '<div class="stat"><div class="n blue">' + totalSnaps + '</div><div class="l">Board Snapshots</div></div>';

  // Bars for latest shifts
  const maxPre = Math.max(...latestWork.map(d => d.pre), 1);
  let barsHtml = '';
  for (const d of latestWork) {
    if (d.pre === 0 && d.at === 0) continue;
    const pct = Math.round(d.pre / maxPre * 100);
    const loc = d.location.charAt(0).toUpperCase() + d.location.slice(1);
    barsHtml += '<div class="chart-bar">' +
      '<span class="chart-label">' + loc + ' ' + d.shift + '</span>' +
      '<div class="chart-fill" style="width:' + pct + '%;background:#818cf8">' + d.pre + ' pre</div>' +
      (d.at > 0 ? '<span style="color:#34d399;font-size:0.82em">' + d.at + ' at</span>' : '') +
      '</div>';
  }
  document.getElementById('overview-bars').innerHTML = barsHtml || '<div style="color:#4b5563">No work data yet</div>';

  // Board summary
  let boardHtml = '';
  for (const d of latestBoards) {
    const pct = d.dispatchRate;
    const color = pct > 10 ? '#34d399' : pct > 5 ? '#fb923c' : '#64748b';
    boardHtml += '<div class="chart-bar">' +
      '<span class="chart-label">Board ' + d.board + ' (' + d.shift + ')</span>' +
      '<div class="chart-fill" style="width:' + Math.max(pct, 3) + '%;background:' + color + '">' + d.calledBack + '/' + d.totalWorkers + '</div>' +
      '<span style="color:' + color + ';font-size:0.82em">' + pct + '%</span>' +
      '</div>';
  }
  document.getElementById('overview-boards').innerHTML = boardHtml || '<div style="color:#4b5563">No board data yet</div>';
}

// WORK INFO TABLE
function renderWorkInfo() {
  const loc = document.getElementById('wi-loc').value;
  const filtered = loc === 'all' ? workData : workData.filter(d => d.location === loc);
  const tbody = document.getElementById('wi-table').querySelector('tbody');
  tbody.innerHTML = filtered.map(d => {
    const fill = d.pre > 0 ? Math.round(d.at / d.pre * 100) : 0;
    const fillClass = fill >= 90 ? 'green' : fill >= 50 ? 'orange' : fill > 0 ? 'red' : 'gray';
    return '<tr><td>' + d.date + '</td><td>' + d.location + '</td><td>' + d.shift + '</td><td>' + d.shiftDate + '</td>' +
      '<td class="yellow">' + d.pre + '</td><td class="green">' + d.at + '</td>' +
      '<td class="' + fillClass + '">' + (d.pre > 0 ? fill + '%' : '-') + '</td></tr>';
  }).join('');
}

// JOBS TABLE
function renderJobs() {
  const loc = document.getElementById('job-loc').value;
  const filtered = loc === 'all' ? jobData : jobData.filter(d => d.location === loc);
  const tbody = document.getElementById('job-table').querySelector('tbody');
  tbody.innerHTML = filtered.map(d =>
    '<tr><td>' + d.location + '</td><td>' + d.section + '</td><td>' + d.job + '</td>' +
    '<td>' + d.sites + '</td><td class="yellow">' + d.pre + '</td><td class="green">' + d.at + '</td></tr>'
  ).join('');
}

// BOARDS TABLE
function renderBoards() {
  const tbody = document.getElementById('board-table').querySelector('tbody');
  tbody.innerHTML = boardData.map(d => {
    const cls = d.dispatchRate > 10 ? 'green' : d.dispatchRate > 5 ? 'orange' : 'gray';
    return '<tr><td>' + d.date + '</td><td>' + d.shiftLabel + '</td><td>Board ' + d.board + '</td>' +
      '<td>' + d.shift + '</td><td>' + d.totalWorkers + '</td>' +
      '<td class="green">' + d.calledBack + '</td><td class="' + cls + '">' + d.dispatchRate + '%</td></tr>';
  }).join('');
}

// WORKERS TABLE
function renderWorkers() {
  const board = document.getElementById('w-board').value;
  const status = document.getElementById('w-status').value;
  const search = document.getElementById('w-search').value.toLowerCase();

  let filtered = workerData;
  if (board !== 'all') filtered = filtered.filter(w => w.board === board);
  if (status === 'called') filtered = filtered.filter(w => w.calledBack);
  if (status === 'available') filtered = filtered.filter(w => !w.calledBack);
  if (search) filtered = filtered.filter(w =>
    (w.name || '').toLowerCase().includes(search) || String(w.reg).includes(search)
  );

  document.getElementById('worker-count').textContent = filtered.length + ' workers shown';

  const tbody = document.getElementById('worker-table').querySelector('tbody');
  tbody.innerHTML = filtered.map(w =>
    '<tr><td>Board ' + w.board + '</td><td>' + w.plate + '</td><td>' + w.reg + '</td>' +
    '<td>' + (w.name || '') + '</td>' +
    '<td><span class="colour-dot" style="background:' + (w.colour || '#333') + '"></span>' + (w.colour || '') + '</td>' +
    '<td>' + (w.ratings || '') + '</td>' +
    '<td>' + (w.calledBack ? '<span class="tag tag-green">YES</span>' : '<span class="tag" style="background:#1e293b;color:#64748b">no</span>') + '</td></tr>'
  ).join('');
}

// TRENDS
function renderTrends() {
  const canvas = document.getElementById('trend-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dates = [...new Set(workData.map(d => d.date))].sort();
  if (dates.length < 2) return;

  const w = canvas.width, h = canvas.height;
  const pad = { top:40, right:30, bottom:50, left:60 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  // Aggregate per date
  const perDate = dates.map(date => {
    const rows = workData.filter(d => d.date === date && d.location === 'vancouver');
    return { date, pre: rows.reduce((s, r) => s + r.pre, 0), at: rows.reduce((s, r) => s + r.at, 0) };
  });

  const maxVal = Math.max(...perDate.map(d => Math.max(d.pre, d.at)), 1);

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#1e2d4a';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + plotH - (plotH * i / 5);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#8b949e'; ctx.font = '11px Segoe UI';
    ctx.fillText(String(Math.round(maxVal * i / 5)), 5, y + 4);
  }

  // Labels
  ctx.fillStyle = '#818cf8'; ctx.font = 'bold 13px Segoe UI';
  ctx.fillText('Vancouver Total Demand Over Time', pad.left, 20);

  // Lines
  const xStep = plotW / Math.max(perDate.length - 1, 1);

  // Pre line
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
  ctx.beginPath();
  perDate.forEach((d, i) => {
    const x = pad.left + i * xStep;
    const y = pad.top + plotH - (d.pre / maxVal * plotH);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // At line
  ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2;
  ctx.beginPath();
  perDate.forEach((d, i) => {
    const x = pad.left + i * xStep;
    const y = pad.top + plotH - (d.at / maxVal * plotH);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // X labels + dots
  perDate.forEach((d, i) => {
    const x = pad.left + i * xStep;
    ctx.fillStyle = '#8b949e'; ctx.font = '10px Segoe UI';
    ctx.save(); ctx.translate(x, h - 5); ctx.rotate(-0.5);
    ctx.fillText(d.date, 0, 0);
    ctx.restore();

    // Dots
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(x, pad.top + plotH - (d.pre / maxVal * plotH), 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.beginPath(); ctx.arc(x, pad.top + plotH - (d.at / maxVal * plotH), 4, 0, Math.PI * 2); ctx.fill();
  });

  // Legend
  ctx.fillStyle = '#fbbf24'; ctx.fillRect(w - 160, 10, 12, 12);
  ctx.fillStyle = '#8b949e'; ctx.font = '11px Segoe UI'; ctx.fillText('Pre-ordered', w - 143, 20);
  ctx.fillStyle = '#34d399'; ctx.fillRect(w - 160, 28, 12, 12);
  ctx.fillStyle = '#8b949e'; ctx.fillText('Actual', w - 143, 38);
}

// INIT
renderOverview();
renderWorkInfo();
renderJobs();
renderBoards();
renderWorkers();
renderTrends();
</script>
</body>
</html>`;
}

// Main
const workDays = loadWorkInfo();
const boardSnaps = loadBoards();
const html = generateHTML(workDays, boardSnaps);
fs.writeFileSync(OUT_FILE, html);
console.log(`Dashboard generated: ${OUT_FILE}`);
console.log(`  ${workDays.length} days of work-info data`);
console.log(`  ${boardSnaps.length} board snapshots`);
