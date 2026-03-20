/**
 * PORTPAL Dispatch Prediction Model v2 — Board-Level Button Simulator
 *
 * Uses historical button movement data to predict what % of each board
 * gets dispatched per shift, and which job categories are active.
 *
 * Input:  board letter + shift + current demand signals
 * Output: "X% of Board B dispatched for Day shift" + active job categories
 *
 * Usage: npx ts-node prediction/build-model-v2.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = 'C:/Users/veete/OneDrive/Desktop/claude_local/portpal/files/data';
const HOURLY_DIR = path.join(DATA_DIR, 'hourly-monitor');
const BOARDS_DIR = path.join(DATA_DIR, 'boards');
const WORK_INFO_DIR = path.join(DATA_DIR, 'work-info');
const OUTPUT_DIR = path.resolve('prediction');

// ── Types ───────────────────────────────────────────────────────────────────

interface ButtonSnapshot {
  time: string;
  date: string;
  buttons: ButtonEntry[];
}

interface ButtonEntry {
  category: string; // "union", "casual", "telephone"
  description: string; // "Dock Gantry - Day", "Casual A Board - RTG"
  board: string; // "TOPSIDE", "CASUAL A", "MACHINE", etc.
  plate: number;
  shift: string; // extracted: "Day", "Night", "1 AM"
  jobType: string; // extracted: "Dock Gantry", "Lift Truck", etc.
}

interface ButtonDelta {
  date: string;
  dispatchWindow: string; // "morning" (day) or "afternoon" (night/1am)
  category: string;
  description: string;
  board: string;
  jobType: string;
  shift: string;
  plateFrom: number;
  plateTo: number;
  delta: number; // positions consumed (accounting for wrap)
  boardSize: number; // approximate board size for wrap calc
}

interface BoardDispatchRecord {
  date: string;
  shift: string; // "0800", "1630", "0100"
  board: string; // "a", "b", "c", "t", "00", "r"
  totalWorkers: number;
  calledBack: number;
  callbackPct: number;
}

interface DemandRecord {
  date: string;
  shift: string;
  totalPre: number;
}

// ── Board size estimates (from scraped data) ────────────────────────────────
const BOARD_SIZES: Record<string, number> = {
  'CASUAL A': 462,
  'CASUAL B': 261,
  'CASUAL C': 249,
  'CASUAL T': 276,
  'CASUAL 00': 226,
  'CASUAL R': 399,
  'TOPSIDE': 140, // smaller specialty board
  'GANG': 80,
  'HOLD': 430, // large, wraps around general pool
  'WHEAT SPECIALTY': 75,
  'WHEAT MACHINE': 50,
  'COASTWISE': 70,
  'WAREHOUSE': 350,
  'DOCK': 30,
  'RAILROAD': 40,
  'MACHINE': 200,
  'TRADES': 120,
};

// Map casual board names to board letters
const CASUAL_TO_LETTER: Record<string, string> = {
  'CASUAL A': 'a', 'CASUAL B': 'b', 'CASUAL C': 'c',
  'CASUAL T': 't', 'CASUAL 00': '00', 'CASUAL R': 'r',
};

// ── Parse button snapshots from hourly monitor ──────────────────────────────

function parseButtonSnapshot(data: any, time: string, date: string): ButtonSnapshot {
  const buttons: ButtonEntry[] = [];

  for (const catKey of ['buttons-union', 'buttons-casual', 'buttons-telephone']) {
    const catName = catKey.replace('buttons-', '');
    const tables = data[catKey]?.tables;
    if (!tables || !tables[0]?.rows) continue;

    for (const row of tables[0].rows) {
      const description = row[1] || '';
      const board = row[2] || '';
      const plate = parseInt(row[3]) || 0;

      // Extract shift from description
      let shift = 'unknown';
      if (description.includes('Day') || description.includes('day')) shift = 'Day';
      else if (description.includes('Night') || description.includes('night')) shift = 'Night';
      else if (description.includes('1 AM') || description.includes('1 am') || description.includes('1AM')) shift = '1 AM';

      // Extract job type (remove shift suffix)
      let jobType = description
        .replace(/ - Day$/, '').replace(/ - Night$/, '').replace(/ - 1 AM$/, '')
        .replace(/^Casual [A-Z0-9]+ Board - /, '')
        .trim();

      buttons.push({ category: catName, description, board, plate, shift, jobType });
    }
  }

  return { time, date, buttons };
}

function loadAllButtonSnapshots(): ButtonSnapshot[] {
  const snapshots: ButtonSnapshot[] = [];
  const days = fs.readdirSync(HOURLY_DIR).filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/)).sort();

  for (const day of days) {
    const dayDir = path.join(HOURLY_DIR, day);
    const files = fs.readdirSync(dayDir).filter(f => f.startsWith('snapshot_') && f.endsWith('.json')).sort();

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(dayDir, file), 'utf-8');
        const data = JSON.parse(raw);
        const timeMatch = file.match(/snapshot_\d{4}-\d{2}-\d{2}_(\d{4})\.json/);
        const time = timeMatch ? timeMatch[1] : '0000';
        snapshots.push(parseButtonSnapshot(data, time, day));
      } catch {}
    }
  }

  console.log(`  Loaded ${snapshots.length} hourly snapshots across ${days.length} days`);
  return snapshots;
}

// ── Compute button deltas (movement between dispatch windows) ───────────────

function computeButtonDeltas(snapshots: ButtonSnapshot[]): ButtonDelta[] {
  const deltas: ButtonDelta[] = [];

  // Group by date
  const byDate = new Map<string, ButtonSnapshot[]>();
  for (const s of snapshots) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }

  for (const [date, daySnapshots] of byDate) {
    daySnapshots.sort((a, b) => a.time.localeCompare(b.time));
    if (daySnapshots.length < 2) continue;

    // Morning dispatch: compare pre-dispatch (~0600) to post-dispatch (~0900)
    const preMorning = daySnapshots.find(s => parseInt(s.time) >= 500 && parseInt(s.time) <= 700);
    const postMorning = daySnapshots.find(s => parseInt(s.time) >= 800 && parseInt(s.time) <= 1000);

    if (preMorning && postMorning) {
      const morningDeltas = computeDeltaBetween(preMorning, postMorning, date, 'morning');
      deltas.push(...morningDeltas);
    }

    // Afternoon dispatch: compare pre (~1400) to post (~1800)
    const preAfternoon = daySnapshots.find(s => parseInt(s.time) >= 1300 && parseInt(s.time) <= 1500);
    const postAfternoon = daySnapshots.find(s => parseInt(s.time) >= 1700 && parseInt(s.time) <= 1900);

    if (preAfternoon && postAfternoon) {
      const afternoonDeltas = computeDeltaBetween(preAfternoon, postAfternoon, date, 'afternoon');
      deltas.push(...afternoonDeltas);
    }
  }

  console.log(`  Computed ${deltas.length} button deltas`);
  return deltas;
}

function computeDeltaBetween(pre: ButtonSnapshot, post: ButtonSnapshot, date: string, window: string): ButtonDelta[] {
  const deltas: ButtonDelta[] = [];

  for (const preBtn of pre.buttons) {
    // Find matching button in post snapshot
    const postBtn = post.buttons.find(b =>
      b.category === preBtn.category &&
      b.description === preBtn.description &&
      b.board === preBtn.board
    );

    if (!postBtn) continue;

    const boardSize = BOARD_SIZES[preBtn.board] || 430;
    let delta = 0;

    if (postBtn.plate !== preBtn.plate) {
      if (postBtn.plate > preBtn.plate) {
        delta = postBtn.plate - preBtn.plate;
      } else {
        // Wrapped around
        delta = (boardSize - preBtn.plate) + postBtn.plate;
      }
    }

    if (delta > 0) {
      deltas.push({
        date,
        dispatchWindow: window,
        category: preBtn.category,
        description: preBtn.description,
        board: preBtn.board,
        jobType: preBtn.jobType,
        shift: preBtn.shift,
        plateFrom: preBtn.plate,
        plateTo: postBtn.plate,
        delta,
        boardSize,
      });
    }
  }

  return deltas;
}

// ── Load board dispatch data (A/B boards with isCalledBack) ─────────────────

function loadBoardDispatches(): BoardDispatchRecord[] {
  const records: BoardDispatchRecord[] = [];
  const files = fs.readdirSync(BOARDS_DIR).filter(f => f.endsWith('.json') && !f.includes('pre-') && f !== 'index.json');

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(BOARDS_DIR, file), 'utf-8');
      if (raw.length < 1024) continue;
      const data = JSON.parse(raw);

      for (const [boardName, boardData] of Object.entries(data.boards as Record<string, any>)) {
        if (!boardData.shifts?.[0]?.workers) continue;
        const bs = boardData.shifts[0];
        const total = bs.totalWorkers || bs.workers.length;
        const called = bs.calledBackCount || bs.workers.filter((w: any) => w.isCalledBack).length;

        records.push({
          date: data.date,
          shift: data.shiftLabel,
          board: boardName,
          totalWorkers: total,
          calledBack: called,
          callbackPct: total > 0 ? called / total : 0,
        });
      }
    } catch {}
  }

  console.log(`  Loaded ${records.length} board dispatch records`);
  return records;
}

// ── Load work-info demand ───────────────────────────────────────────────────

function loadDemand(): DemandRecord[] {
  const records: DemandRecord[] = [];
  const files = fs.readdirSync(WORK_INFO_DIR).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/));

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(WORK_INFO_DIR, file), 'utf-8');
      const data = JSON.parse(raw);
      if (data.vancouver?.totals) {
        for (const t of data.vancouver.totals) {
          records.push({
            date: data.date,
            shift: t.shift.replace(':', ''),
            totalPre: parseInt(t.pre) || 0,
          });
        }
      }
    } catch {}
  }

  console.log(`  Loaded ${records.length} demand records`);
  return records;
}

// ── Build the v2 model ──────────────────────────────────────────────────────

function buildModel() {
  console.log('PORTPAL Dispatch Prediction Model v2 — Button Simulator');
  console.log('=======================================================\n');

  // Load all data
  console.log('Loading button snapshots...');
  const snapshots = loadAllButtonSnapshots();

  console.log('\nComputing button deltas...');
  const deltas = computeButtonDeltas(snapshots);

  console.log('\nLoading board dispatch data...');
  const boardDispatches = loadBoardDispatches();

  console.log('\nLoading demand data...');
  const demand = loadDemand();

  // ── Analyze casual board button deltas ──────────────────────────────
  // These tell us what % of each board gets consumed per dispatch window

  console.log('\n══ CASUAL BOARD DISPATCH RATES (from button deltas) ══\n');

  const casualDeltas = deltas.filter(d => d.category === 'casual');
  const boardLetters = ['a', 'b', 'c', 't', '00', 'r'];

  interface BoardShiftStats {
    board: string;
    shift: string;
    avgDelta: number;
    avgPctConsumed: number;
    maxDelta: number;
    samples: number;
    deltas: number[];
  }

  const boardStats: BoardShiftStats[] = [];

  for (const board of Object.keys(CASUAL_TO_LETTER)) {
    const letter = CASUAL_TO_LETTER[board];

    for (const shift of ['Day', 'Night', '1 AM']) {
      // Find the main dispatch button for this board+shift (e.g., "Casual A Board - Day")
      const mainBtnDeltas = casualDeltas.filter(d =>
        d.board === board && d.shift === shift && d.jobType === shift
      );

      // Also sum specialty button deltas (RTG, TT, Head Checking, etc.)
      const specialtyDeltas = casualDeltas.filter(d =>
        d.board === board && d.shift === shift && d.jobType !== shift
      );

      const allDeltas = casualDeltas.filter(d => d.board === board && d.shift === shift);

      if (mainBtnDeltas.length > 0) {
        const boardSize = BOARD_SIZES[board] || 430;
        const ds = mainBtnDeltas.map(d => d.delta);
        const avgDelta = ds.reduce((a, b) => a + b, 0) / ds.length;

        boardStats.push({
          board: letter,
          shift,
          avgDelta: Math.round(avgDelta),
          avgPctConsumed: avgDelta / boardSize,
          maxDelta: Math.max(...ds),
          samples: ds.length,
          deltas: ds,
        });
      }
    }
  }

  // Print board dispatch summary
  for (const letter of boardLetters) {
    const stats = boardStats.filter(s => s.board === letter);
    if (stats.length === 0) continue;
    const boardName = Object.entries(CASUAL_TO_LETTER).find(([, v]) => v === letter)?.[0] || letter;
    const size = BOARD_SIZES[boardName] || 430;

    console.log(`  Board ${letter.toUpperCase()} (${size} workers):`);
    for (const s of stats) {
      const pct = (s.avgPctConsumed * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(s.avgPctConsumed * 40));
      console.log(`    ${s.shift.padEnd(7)} ${bar.padEnd(40)} ${pct}% avg (${s.avgDelta} positions, max ${s.maxDelta}, n=${s.samples})`);
    }
    console.log();
  }

  // ── Analyze job category activity ──────────────────────────────────
  console.log('══ JOB CATEGORY ACTIVITY (which buttons move) ══\n');

  const unionDeltas = deltas.filter(d => d.category === 'union');
  const jobTypes = [...new Set(unionDeltas.map(d => d.description))].sort();

  interface JobActivity {
    description: string;
    board: string;
    avgDelta: number;
    activeDays: number;
    totalDays: number;
    activityRate: number;
  }

  const jobActivities: JobActivity[] = [];
  const totalDays = new Set(deltas.map(d => d.date)).size;

  for (const desc of jobTypes) {
    const jd = unionDeltas.filter(d => d.description === desc);
    const avgDelta = jd.reduce((s, d) => s + d.delta, 0) / jd.length;
    const activeDays = new Set(jd.map(d => d.date)).size;

    jobActivities.push({
      description: desc,
      board: jd[0]?.board || '',
      avgDelta: Math.round(avgDelta),
      activeDays,
      totalDays,
      activityRate: activeDays / totalDays,
    });
  }

  jobActivities.sort((a, b) => b.activityRate - a.activityRate);

  for (const ja of jobActivities.slice(0, 25)) {
    const pct = (ja.activityRate * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(ja.activityRate * 20));
    console.log(`  ${ja.description.padEnd(30)} ${ja.board.padEnd(18)} ${bar.padEnd(20)} ${pct}% active (avg Δ${ja.avgDelta}, ${ja.activeDays}/${ja.totalDays} days)`);
  }

  // ── Cross-reference with board dispatch data (A/B only) ────────────
  console.log('\n══ BOARD A/B DISPATCH VALIDATION (isCalledBack data) ══\n');

  for (const board of ['a', 'b']) {
    const br = boardDispatches.filter(d => d.board === board && d.calledBack > 0);
    if (br.length === 0) continue;

    const byShift: Record<string, { total: number; called: number; count: number }> = {};
    for (const r of br) {
      if (!byShift[r.shift]) byShift[r.shift] = { total: 0, called: 0, count: 0 };
      byShift[r.shift].total += r.totalWorkers;
      byShift[r.shift].called += r.calledBack;
      byShift[r.shift].count++;
    }

    console.log(`  Board ${board.toUpperCase()}:`);
    for (const [shift, stats] of Object.entries(byShift)) {
      const avgPct = (stats.called / stats.total * 100).toFixed(1);
      const avgCalled = Math.round(stats.called / stats.count);
      console.log(`    ${shift}: ${avgPct}% dispatched (avg ${avgCalled} workers, n=${stats.count})`);
    }
    console.log();
  }

  // ── Demand correlation ─────────────────────────────────────────────
  console.log('══ DEMAND → DISPATCH CORRELATION ══\n');

  // For each date+shift with both demand and board data, correlate
  const demandMap = new Map(demand.map(d => [`${d.date}|${d.shift}`, d.totalPre]));

  const correlationPoints: { demand: number; pctDispatched: number }[] = [];
  for (const br of boardDispatches.filter(d => d.board === 'a' && d.calledBack > 0)) {
    const key = `${br.date}|${br.shift}`;
    const dem = demandMap.get(key);
    if (dem && dem > 0) {
      correlationPoints.push({ demand: dem, pctDispatched: br.callbackPct });
    }
  }

  if (correlationPoints.length > 0) {
    // Simple bucketed analysis
    const sorted = correlationPoints.sort((a, b) => a.demand - b.demand);
    const mid = Math.floor(sorted.length / 2);
    const lowDemand = sorted.slice(0, mid);
    const highDemand = sorted.slice(mid);

    const avgLow = lowDemand.reduce((s, p) => s + p.pctDispatched, 0) / lowDemand.length;
    const avgHigh = highDemand.reduce((s, p) => s + p.pctDispatched, 0) / highDemand.length;
    const avgLowDem = lowDemand.reduce((s, p) => s + p.demand, 0) / lowDemand.length;
    const avgHighDem = highDemand.reduce((s, p) => s + p.demand, 0) / highDemand.length;

    console.log(`  Board A dispatch vs demand (${correlationPoints.length} data points):`);
    console.log(`    Low demand  (avg ${Math.round(avgLowDem)} jobs): ${(avgLow * 100).toFixed(1)}% dispatched`);
    console.log(`    High demand (avg ${Math.round(avgHighDem)} jobs): ${(avgHigh * 100).toFixed(1)}% dispatched`);
    console.log(`    Lift from demand: ${(avgHigh / avgLow).toFixed(2)}x`);
  }

  // ── Build the output model ─────────────────────────────────────────
  console.log('\n══ BUILDING MODEL ══\n');

  const model = {
    version: '2.0.0',
    builtAt: new Date().toISOString(),
    dataRange: {
      from: [...new Set(deltas.map(d => d.date))].sort()[0],
      to: [...new Set(deltas.map(d => d.date))].sort().pop(),
    },
    totalButtonDeltas: deltas.length,
    totalBoardRecords: boardDispatches.length,
    totalDemandRecords: demand.length,

    // Board-level dispatch rates (the core prediction)
    boardDispatchRates: Object.fromEntries(
      boardLetters.map(letter => {
        const stats = boardStats.filter(s => s.board === letter);
        return [letter, {
          byShift: Object.fromEntries(stats.map(s => [s.shift, {
            avgPctDispatched: Math.round(s.avgPctConsumed * 1000) / 10,
            avgPositionsConsumed: s.avgDelta,
            maxPositionsConsumed: s.maxDelta,
            samples: s.samples,
          }])),
        }];
      })
    ),

    // Job category activity rates
    jobCategoryActivity: jobActivities.map(ja => ({
      description: ja.description,
      board: ja.board,
      avgDelta: ja.avgDelta,
      activityRate: Math.round(ja.activityRate * 100),
      activeDays: ja.activeDays,
    })),

    // Demand → dispatch multiplier
    demandMultiplier: correlationPoints.length > 2 ? (() => {
      const sorted = correlationPoints.sort((a, b) => a.demand - b.demand);
      const mid = Math.floor(sorted.length / 2);
      const avgLow = sorted.slice(0, mid).reduce((s, p) => s + p.pctDispatched, 0) / mid;
      const avgHigh = sorted.slice(mid).reduce((s, p) => s + p.pctDispatched, 0) / (sorted.length - mid);
      return { lowDemandRate: avgLow, highDemandRate: avgHigh, lift: avgHigh / avgLow };
    })() : null,

    // Raw button position data (latest) for real-time predictions
    latestButtons: snapshots.length > 0 ? snapshots[snapshots.length - 1] : null,
  };

  const modelPath = path.join(OUTPUT_DIR, 'model-v2.json');
  fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
  console.log(`Model written to ${modelPath}`);

  // ── Sample predictions ─────────────────────────────────────────────
  console.log('\n══ SAMPLE PREDICTIONS ══\n');

  for (const letter of boardLetters) {
    const stats = boardStats.filter(s => s.board === letter);
    if (stats.length === 0) {
      console.log(`  Board ${letter.toUpperCase()}: Insufficient button data`);
      continue;
    }

    console.log(`  Board ${letter.toUpperCase()}:`);
    for (const s of stats) {
      const pct = Math.round(s.avgPctConsumed * 100);
      const emoji = pct >= 40 ? '🟢' : pct >= 20 ? '🟡' : '🔴';
      console.log(`    ${emoji} ${s.shift} shift: ~${pct}% chance of dispatch (${s.avgDelta} of ${BOARD_SIZES[Object.entries(CASUAL_TO_LETTER).find(([, v]) => v === letter)?.[0] || ''] || '?'} positions used)`);
    }
  }

  console.log('\n✅ Model v2 build complete.');
}

buildModel();
