/**
 * PORTPAL Dispatch Prediction Model Builder
 *
 * Reads 30+ days of scraped board data and work-info to build a statistical
 * model that predicts dispatch probability for any worker given:
 *   - Their board (A, B, C, T, R, 00)
 *   - Their plate position (seniority rank within board)
 *   - Their ratings (qualification codes)
 *   - The shift (0800, 1630, 0100)
 *   - Day of week
 *   - Current job demand (from work-info totals)
 *
 * Output: model.json — a lookup table the mobile app can use for predictions.
 *
 * Usage: npx ts-node prediction/build-model.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Config ──────────────────────────────────────────────────────────────────
const DATA_DIR = 'C:/Users/veete/OneDrive/Desktop/claude_local/portpal/files/data';
const BOARDS_DIR = path.join(DATA_DIR, 'boards');
const WORK_INFO_DIR = path.join(DATA_DIR, 'work-info');
const OUTPUT_DIR = path.resolve('prediction');

// ── Types ───────────────────────────────────────────────────────────────────
interface Worker {
  reg: number;
  plate: string;
  name: string;
  colour: string;
  ratings: string;
  isCalledBack: boolean;
  isPluggedIn: boolean;
  isBlink: boolean;
}

interface BoardShift {
  shift: string;
  shiftDate: string;
  scoreboard: { callback: number };
  totalWorkers: number;
  calledBackCount: number;
  workers: Worker[];
}

interface BoardFile {
  scrapedAt: string;
  date: string;
  shiftLabel: string;
  boards: Record<string, { shifts: BoardShift[] }>;
}

interface WorkInfoTotals {
  shift: string;
  date: string;
  pre: string;
  at: string;
}

interface WorkInfoFile {
  scrapedAt: string;
  date: string;
  vancouver?: {
    totals: WorkInfoTotals[];
  };
}

interface TrainingRecord {
  date: string;
  dayOfWeek: number; // 0=Sun, 6=Sat
  shift: string;
  board: string;
  plate: number;
  positionPct: number; // 0-1, where 0 = top seniority
  ratingCount: number;
  ratings: string;
  totalWorkersOnBoard: number;
  calledBackOnBoard: number;
  callbackRateOnBoard: number;
  totalDemand: number; // from work-info pre counts
  isCalledBack: boolean;
}

// ── Model output types ──────────────────────────────────────────────────────
interface PositionBucket {
  bucket: string; // e.g., "0-10%", "10-20%"
  min: number;
  max: number;
  callbackRate: number;
  samples: number;
}

interface BoardModel {
  board: string;
  avgCallbackRate: number;
  totalSamples: number;
  positionBuckets: PositionBucket[];
  byShift: Record<string, { callbackRate: number; samples: number }>;
  byDayOfWeek: Record<number, { callbackRate: number; samples: number }>;
  byDemandLevel: Record<string, { callbackRate: number; samples: number }>;
}

interface RatingModel {
  code: string;
  meaning: string;
  callbackRate: number;
  samples: number;
  lift: number; // multiplier vs base rate for that board
}

interface PredictionModel {
  version: string;
  builtAt: string;
  dataRange: { from: string; to: string };
  totalRecords: number;
  totalFiles: number;
  boards: Record<string, BoardModel>;
  ratings: RatingModel[];
  demandMultipliers: { low: number; medium: number; high: number; veryHigh: number };
  shiftBaselines: Record<string, number>;
  dayOfWeekBaselines: Record<number, number>;
  overallCallbackRate: number;
}

// ── Load rating codes ───────────────────────────────────────────────────────
function loadRatingCodes(): Record<string, string> {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'rating-codes.json'), 'utf-8');
    const data = JSON.parse(raw);
    const codes: Record<string, string> = {};
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.code && item.meaning) codes[item.code] = item.meaning;
      }
    } else if (typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        codes[k] = String(v);
      }
    }
    return codes;
  } catch {
    return {};
  }
}

// ── Load work-info demand ───────────────────────────────────────────────────
function loadWorkInfoDemand(): Map<string, number> {
  // Map of "YYYY-MM-DD|shift" → total pre-dispatch demand
  const demand = new Map<string, number>();

  const files = fs.readdirSync(WORK_INFO_DIR).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/));
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(WORK_INFO_DIR, file), 'utf-8');
      const data: WorkInfoFile = JSON.parse(raw);
      if (data.vancouver?.totals) {
        for (const t of data.vancouver.totals) {
          const key = `${data.date}|${t.shift.replace(':', '')}`;
          const pre = parseInt(t.pre) || 0;
          const at = parseInt(t.at) || 0;
          demand.set(key, Math.max(pre, at));
        }
      }
    } catch (e) {
      // Skip corrupt files
    }
  }

  console.log(`  Loaded demand data for ${demand.size} shift-days`);
  return demand;
}

// ── Load all board files ────────────────────────────────────────────────────
function loadBoardFiles(): TrainingRecord[] {
  const records: TrainingRecord[] = [];
  const demand = loadWorkInfoDemand();

  const files = fs.readdirSync(BOARDS_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .sort();

  console.log(`  Found ${files.length} board files`);

  let skipped = 0;
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(BOARDS_DIR, file), 'utf-8');
      if (raw.length < 1024) { skipped++; continue; } // Skip empty/corrupt files

      const data: BoardFile = JSON.parse(raw);

      // Skip pre-dispatch files — we want final outcomes
      if (file.includes('pre-')) continue;

      const date = data.date;
      const dateObj = new Date(date + 'T12:00:00');
      const dayOfWeek = dateObj.getDay();
      const shift = data.shiftLabel;

      // Get demand for this shift-day
      const demandKey = `${date}|${shift}`;
      const totalDemand = demand.get(demandKey) || 0;

      for (const [boardName, boardData] of Object.entries(data.boards)) {
        if (!boardData.shifts || boardData.shifts.length === 0) continue;
        const bs = boardData.shifts[0];
        if (!bs.workers || bs.workers.length === 0) continue;

        const totalWorkers = bs.totalWorkers || bs.workers.length;
        const calledBack = bs.calledBackCount || bs.workers.filter(w => w.isCalledBack).length;
        const callbackRate = totalWorkers > 0 ? calledBack / totalWorkers : 0;

        for (const worker of bs.workers) {
          const plate = parseInt(worker.plate) || 0;
          const positionPct = totalWorkers > 0 ? (plate - 1) / totalWorkers : 0;

          records.push({
            date,
            dayOfWeek,
            shift,
            board: boardName,
            plate,
            positionPct: Math.min(positionPct, 1),
            ratingCount: worker.ratings ? worker.ratings.length : 0,
            ratings: worker.ratings || '',
            totalWorkersOnBoard: totalWorkers,
            calledBackOnBoard: calledBack,
            callbackRateOnBoard: callbackRate,
            totalDemand,
            isCalledBack: worker.isCalledBack === true,
          });
        }
      }
    } catch (e) {
      skipped++;
    }
  }

  console.log(`  Parsed ${records.length} worker-shift records (${skipped} files skipped)`);
  return records;
}

// ── Build the model ─────────────────────────────────────────────────────────
function buildModel(records: TrainingRecord[], ratingCodes: Record<string, string>): PredictionModel {
  const dates = [...new Set(records.map(r => r.date))].sort();

  // Overall callback rate
  const totalCalled = records.filter(r => r.isCalledBack).length;
  const overallRate = totalCalled / records.length;
  console.log(`\n  Overall callback rate: ${(overallRate * 100).toFixed(1)}% (${totalCalled}/${records.length})`);

  // ── Per-board models ──────────────────────────────────────────────────
  const boardNames = [...new Set(records.map(r => r.board))].sort();
  const boards: Record<string, BoardModel> = {};

  for (const board of boardNames) {
    const br = records.filter(r => r.board === board);
    const called = br.filter(r => r.isCalledBack).length;

    // Position buckets (10% increments)
    const positionBuckets: PositionBucket[] = [];
    for (let i = 0; i < 10; i++) {
      const min = i / 10;
      const max = (i + 1) / 10;
      const bucket = br.filter(r => r.positionPct >= min && r.positionPct < max);
      const bucketCalled = bucket.filter(r => r.isCalledBack).length;
      positionBuckets.push({
        bucket: `${i * 10}-${(i + 1) * 10}%`,
        min,
        max,
        callbackRate: bucket.length > 0 ? bucketCalled / bucket.length : 0,
        samples: bucket.length,
      });
    }

    // By shift
    const byShift: Record<string, { callbackRate: number; samples: number }> = {};
    for (const shift of ['0800', '1630', '0100']) {
      const sr = br.filter(r => r.shift === shift);
      const sc = sr.filter(r => r.isCalledBack).length;
      byShift[shift] = { callbackRate: sr.length > 0 ? sc / sr.length : 0, samples: sr.length };
    }

    // By day of week
    const byDayOfWeek: Record<number, { callbackRate: number; samples: number }> = {};
    for (let d = 0; d < 7; d++) {
      const dr = br.filter(r => r.dayOfWeek === d);
      const dc = dr.filter(r => r.isCalledBack).length;
      byDayOfWeek[d] = { callbackRate: dr.length > 0 ? dc / dr.length : 0, samples: dr.length };
    }

    // By demand level
    const demands = br.map(r => r.totalDemand).filter(d => d > 0);
    const demandMedian = demands.length > 0 ? demands.sort((a, b) => a - b)[Math.floor(demands.length / 2)] : 100;
    const byDemandLevel: Record<string, { callbackRate: number; samples: number }> = {};
    const demandLevels = [
      { label: 'low', test: (d: number) => d > 0 && d < demandMedian * 0.5 },
      { label: 'medium', test: (d: number) => d >= demandMedian * 0.5 && d < demandMedian },
      { label: 'high', test: (d: number) => d >= demandMedian && d < demandMedian * 1.5 },
      { label: 'veryHigh', test: (d: number) => d >= demandMedian * 1.5 },
    ];
    for (const { label, test } of demandLevels) {
      const dlr = br.filter(r => test(r.totalDemand));
      const dlc = dlr.filter(r => r.isCalledBack).length;
      byDemandLevel[label] = { callbackRate: dlr.length > 0 ? dlc / dlr.length : 0, samples: dlr.length };
    }

    boards[board] = {
      board,
      avgCallbackRate: br.length > 0 ? called / br.length : 0,
      totalSamples: br.length,
      positionBuckets,
      byShift,
      byDayOfWeek,
      byDemandLevel,
    };

    console.log(`  Board ${board}: ${(called / br.length * 100).toFixed(1)}% callback (${called}/${br.length})`);
  }

  // ── Rating analysis ───────────────────────────────────────────────────
  // Parse individual rating codes from the concatenated strings
  const allCodes = new Set<string>();
  for (const r of records) {
    if (r.ratings) {
      // Ratings are concatenated single chars, except Z1-Z9 which are 2-char
      const codes = parseRatingCodes(r.ratings);
      codes.forEach(c => allCodes.add(c));
    }
  }

  const ratingModels: RatingModel[] = [];
  for (const code of [...allCodes].sort()) {
    const withCode = records.filter(r => parseRatingCodes(r.ratings).includes(code));
    const withCodeCalled = withCode.filter(r => r.isCalledBack).length;
    const rate = withCode.length > 0 ? withCodeCalled / withCode.length : 0;

    // Compute lift vs overall rate
    const lift = overallRate > 0 ? rate / overallRate : 1;

    if (withCode.length >= 50) { // Only include codes with enough samples
      ratingModels.push({
        code,
        meaning: ratingCodes[code] || 'Unknown',
        callbackRate: rate,
        samples: withCode.length,
        lift,
      });
    }
  }

  ratingModels.sort((a, b) => b.callbackRate - a.callbackRate);
  console.log(`\n  Top ratings by callback rate:`);
  for (const rm of ratingModels.slice(0, 10)) {
    console.log(`    ${rm.code} (${rm.meaning}): ${(rm.callbackRate * 100).toFixed(1)}% (${rm.lift.toFixed(2)}x lift, n=${rm.samples})`);
  }

  // ── Demand multipliers ────────────────────────────────────────────────
  const demandRecords = records.filter(r => r.totalDemand > 0);
  const allDemands = demandRecords.map(r => r.totalDemand);
  const medianDemand = allDemands.length > 0
    ? allDemands.sort((a, b) => a - b)[Math.floor(allDemands.length / 2)]
    : 100;

  const computeDemandMult = (test: (d: number) => boolean) => {
    const subset = demandRecords.filter(r => test(r.totalDemand));
    const called = subset.filter(r => r.isCalledBack).length;
    const rate = subset.length > 0 ? called / subset.length : overallRate;
    return rate / overallRate;
  };

  const demandMultipliers = {
    low: computeDemandMult(d => d < medianDemand * 0.5),
    medium: computeDemandMult(d => d >= medianDemand * 0.5 && d < medianDemand),
    high: computeDemandMult(d => d >= medianDemand && d < medianDemand * 1.5),
    veryHigh: computeDemandMult(d => d >= medianDemand * 1.5),
  };

  // ── Shift baselines ───────────────────────────────────────────────────
  const shiftBaselines: Record<string, number> = {};
  for (const shift of ['0800', '1630', '0100']) {
    const sr = records.filter(r => r.shift === shift);
    const sc = sr.filter(r => r.isCalledBack).length;
    shiftBaselines[shift] = sr.length > 0 ? sc / sr.length : overallRate;
  }

  // ── Day of week baselines ─────────────────────────────────────────────
  const dayOfWeekBaselines: Record<number, number> = {};
  for (let d = 0; d < 7; d++) {
    const dr = records.filter(r => r.dayOfWeek === d);
    const dc = dr.filter(r => r.isCalledBack).length;
    dayOfWeekBaselines[d] = dr.length > 0 ? dc / dr.length : overallRate;
  }

  return {
    version: '1.0.0',
    builtAt: new Date().toISOString(),
    dataRange: { from: dates[0], to: dates[dates.length - 1] },
    totalRecords: records.length,
    totalFiles: new Set(records.map(r => `${r.date}|${r.shift}`)).size,
    boards,
    ratings: ratingModels,
    demandMultipliers,
    shiftBaselines,
    dayOfWeekBaselines,
    overallCallbackRate: overallRate,
  };
}

// ── Parse rating codes from concatenated string ─────────────────────────────
function parseRatingCodes(ratings: string): string[] {
  if (!ratings) return [];
  const codes: string[] = [];
  let i = 0;
  while (i < ratings.length) {
    // Check for Z1-Z9 (2-char trade codes)
    if (ratings[i] === 'Z' && i + 1 < ratings.length && /\d/.test(ratings[i + 1])) {
      codes.push(ratings[i] + ratings[i + 1]);
      i += 2;
    }
    // Check for C1, C2 (head checker codes)
    else if (ratings[i] === 'C' && i + 1 < ratings.length && /[12]/.test(ratings[i + 1])) {
      codes.push(ratings[i] + ratings[i + 1]);
      i += 2;
    }
    // Single character code
    else {
      codes.push(ratings[i]);
      i++;
    }
  }
  return codes;
}

// ── Prediction function (also exported for use in app) ──────────────────────
export function predict(
  model: PredictionModel,
  worker: { board: string; plate: number; ratings: string; totalOnBoard: number },
  conditions: { shift: string; dayOfWeek: number; totalDemand: number }
): { probability: number; confidence: string; factors: string[] } {
  const factors: string[] = [];

  const boardModel = model.boards[worker.board];
  if (!boardModel) {
    return { probability: model.overallCallbackRate, confidence: 'low', factors: ['Unknown board'] };
  }

  // Start with board's position-based rate
  const positionPct = worker.totalOnBoard > 0 ? (worker.plate - 1) / worker.totalOnBoard : 0.5;
  const bucket = boardModel.positionBuckets.find(b => positionPct >= b.min && positionPct < b.max)
    || boardModel.positionBuckets[boardModel.positionBuckets.length - 1];

  let prob = bucket.callbackRate;
  factors.push(`Position ${worker.plate}/${worker.totalOnBoard} (${bucket.bucket}): ${(bucket.callbackRate * 100).toFixed(0)}% base`);

  // Adjust for shift
  const shiftRate = model.shiftBaselines[conditions.shift];
  if (shiftRate && model.overallCallbackRate > 0) {
    const shiftMult = shiftRate / model.overallCallbackRate;
    prob *= shiftMult;
    if (Math.abs(shiftMult - 1) > 0.05) {
      factors.push(`${conditions.shift} shift: ${shiftMult > 1 ? '+' : ''}${((shiftMult - 1) * 100).toFixed(0)}%`);
    }
  }

  // Adjust for day of week
  const dowRate = model.dayOfWeekBaselines[conditions.dayOfWeek];
  if (dowRate && model.overallCallbackRate > 0) {
    const dowMult = dowRate / model.overallCallbackRate;
    prob *= dowMult;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (Math.abs(dowMult - 1) > 0.05) {
      factors.push(`${days[conditions.dayOfWeek]}: ${dowMult > 1 ? '+' : ''}${((dowMult - 1) * 100).toFixed(0)}%`);
    }
  }

  // Adjust for demand level
  const medianDemand = 150; // Approximate from data
  let demandLevel: keyof typeof model.demandMultipliers;
  if (conditions.totalDemand < medianDemand * 0.5) demandLevel = 'low';
  else if (conditions.totalDemand < medianDemand) demandLevel = 'medium';
  else if (conditions.totalDemand < medianDemand * 1.5) demandLevel = 'high';
  else demandLevel = 'veryHigh';

  const demandMult = model.demandMultipliers[demandLevel];
  if (demandMult && Math.abs(demandMult - 1) > 0.05) {
    prob *= demandMult;
    factors.push(`${demandLevel} demand (${conditions.totalDemand} jobs): ${demandMult > 1 ? '+' : ''}${((demandMult - 1) * 100).toFixed(0)}%`);
  }

  // Adjust for ratings (workers with more/better ratings get slight boost)
  const workerCodes = parseRatingCodes(worker.ratings);
  if (workerCodes.length > 0) {
    const ratingLifts = workerCodes
      .map(c => model.ratings.find(r => r.code === c))
      .filter(Boolean)
      .map(r => r!.lift);

    if (ratingLifts.length > 0) {
      // Use the best rating's lift (workers get called for their best-matching job)
      const bestLift = Math.max(...ratingLifts);
      if (Math.abs(bestLift - 1) > 0.1) {
        prob *= bestLift;
        const bestCode = workerCodes[ratingLifts.indexOf(bestLift)];
        factors.push(`${bestCode} rating: ${bestLift > 1 ? '+' : ''}${((bestLift - 1) * 100).toFixed(0)}%`);
      }
    }
  }

  // Clamp to 0-1
  prob = Math.max(0, Math.min(1, prob));

  // Confidence based on sample size
  const confidence = bucket.samples > 500 ? 'high' : bucket.samples > 100 ? 'medium' : 'low';

  return { probability: prob, confidence, factors };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('PORTPAL Dispatch Prediction Model Builder');
  console.log('=========================================\n');

  console.log('Loading rating codes...');
  const ratingCodes = loadRatingCodes();
  console.log(`  ${Object.keys(ratingCodes).length} codes loaded\n`);

  console.log('Loading board data...');
  const records = loadBoardFiles();

  console.log('\nBuilding model...');
  const model = buildModel(records, ratingCodes);

  // Write model
  const modelPath = path.join(OUTPUT_DIR, 'model.json');
  fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
  console.log(`\nModel written to ${modelPath}`);
  console.log(`  Version: ${model.version}`);
  console.log(`  Data range: ${model.dataRange.from} → ${model.dataRange.to}`);
  console.log(`  Records: ${model.totalRecords.toLocaleString()}`);
  console.log(`  Shift-days: ${model.totalFiles}`);

  // ── Run sample predictions ────────────────────────────────────────────
  console.log('\n── Sample Predictions ──────────────────────────────');

  const sampleWorkers = [
    { label: 'Board A, position 50/400, ratings BDLM', board: 'a', plate: 50, ratings: 'BDLM', totalOnBoard: 400 },
    { label: 'Board A, position 350/400, ratings D', board: 'a', plate: 350, ratings: 'D', totalOnBoard: 400 },
    { label: 'Board B, position 100/260, ratings BDMW', board: 'b', plate: 100, ratings: 'BDMW', totalOnBoard: 260 },
    { label: 'Board C, position 50/250, ratings D', board: 'c', plate: 50, ratings: 'D', totalOnBoard: 250 },
    { label: 'Board T, position 30/275, ratings Z1Z2', board: 't', plate: 30, ratings: 'Z1Z2', totalOnBoard: 275 },
    { label: 'Board R, position 100/400, ratings D', board: 'r', plate: 100, ratings: 'D', totalOnBoard: 400 },
    { label: 'Board 00, position 50/225, ratings D', board: '00', plate: 50, ratings: 'D', totalOnBoard: 225 },
  ];

  const sampleConditions = [
    { label: '0800 shift, Monday, high demand', shift: '0800', dayOfWeek: 1, totalDemand: 200 },
    { label: '1630 shift, Wednesday, low demand', shift: '1630', dayOfWeek: 3, totalDemand: 50 },
    { label: '0100 shift, Friday, medium demand', shift: '0100', dayOfWeek: 5, totalDemand: 120 },
  ];

  for (const worker of sampleWorkers) {
    console.log(`\n  ${worker.label}:`);
    for (const cond of sampleConditions) {
      const result = predict(model, worker, cond);
      const pct = (result.probability * 100).toFixed(0);
      const emoji = result.probability >= 0.5 ? '🟢' : result.probability >= 0.2 ? '🟡' : '🔴';
      console.log(`    ${emoji} ${cond.label}: ${pct}% (${result.confidence})`);
      if (result.factors.length > 0) {
        console.log(`       ${result.factors.join(' → ')}`);
      }
    }
  }

  console.log('\n✅ Model build complete.');
}

main().catch(console.error);
