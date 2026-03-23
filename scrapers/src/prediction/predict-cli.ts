/**
 * Dispatch Prediction CLI
 *
 * Usage:
 *   tsx src/prediction/predict-cli.ts --board b --plate 165
 *   tsx src/prediction/predict-cli.ts --board b --plate 165 --shift 0800 --date 2026-03-22
 *   npm run predict -- --board b --plate 165
 */

import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR } from '../shared/config';
import { localDateStr } from '../shared/utils';
import type { PredictionResult, PredictOptions } from './types';
import { predict } from './dispatch-predictor';

function printResult(result: PredictionResult): void {
  const bar = '='.repeat(60);
  console.log(`\n${bar}`);
  console.log(`  DISPATCH PREDICTION`);
  console.log(`${bar}`);

  console.log(`\n  Worker:      Board ${result.worker.board.toUpperCase()} / Plate ${result.worker.plate}`);
  console.log(`  Shift:       ${result.shift} on ${result.dayName} ${result.date}`);
  console.log(`  Ratings:     ${result.worker.ratings.length > 0 ? result.worker.ratings.join(', ') : '(none)'}`);

  console.log(`\n  Probability: ${result.dispatchProbability}%`);
  console.log(`  Likely Job:  ${result.likelyJob || 'None predicted'}`);
  console.log(`  Confidence:  ${result.confidence.toUpperCase()}`);

  console.log(`\n  ${result.reasoning}`);

  console.log(`\n  ${'-'.repeat(56)}`);
  console.log(`  Category Breakdown:`);
  console.log(`  ${'Category'.padEnd(14)} ${'Btn'.padStart(4)} ${'AT'.padStart(4)} ${'Union'.padStart(6)} ${'Casual'.padStart(7)} ${'Ahead'.padStart(6)} ${'Rated'.padStart(6)} ${'Reach?'.padStart(7)}`);
  console.log(`  ${'-'.repeat(62)}`);

  for (const cat of result.allCategories) {
    const rated = cat.workerIsRated ? 'YES' : 'no';
    const reach = cat.willReachYou ? ' >>> ' : '  -  ';
    const btn = cat.buttonPosition >= 0 ? String(cat.buttonPosition) : '  -';
    console.log(
      `  ${cat.category.padEnd(14)} ${btn.padStart(4)} ${String(cat.totalAtJobs).padStart(4)} ${String(cat.estimatedUnionConsumption).padStart(6)} ${String(cat.estimatedCasualJobs).padStart(7)} ${String(cat.workersAheadOfYou).padStart(6)} ${rated.padStart(6)} ${reach.padStart(7)}`
    );
  }

  if (result.dataQuality.warnings.length > 0) {
    console.log(`\n  Warnings:`);
    for (const w of result.dataQuality.warnings) {
      console.log(`    - ${w}`);
    }
  }

  console.log(`\n  Data: board=${result.dataQuality.hasBoardData ? 'OK' : 'MISSING'} workinfo=${result.dataQuality.hasWorkInfoData ? 'OK' : 'MISSING'} history=${result.dataQuality.hasAnalysisData ? 'OK' : 'MISSING'} buttons=${result.dataQuality.hasButtonData ? 'OK' : 'MISSING'} (source: ${result.dataQuality.buttonSource})`);
  console.log(`${bar}\n`);
}

function parseArgs(): PredictOptions {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--') && i + 1 < args.length) {
      opts[arg.slice(2)] = args[i + 1];
      i++;
    }
  }

  if (!opts.board || !opts.plate) {
    console.error('Usage: tsx src/prediction/predict-cli.ts --board <letter> --plate <number> [--shift 0800] [--date YYYY-MM-DD]');
    console.error('');
    console.error('  --board   Board letter: a, b, c, t, r, 00');
    console.error('  --plate   Plate number on the board');
    console.error('  --shift   Shift: 0800 (default), 1630, 0100');
    console.error('  --date    Date: YYYY-MM-DD (default: today)');
    process.exit(1);
  }

  return {
    board: opts.board,
    plate: parseInt(opts.plate, 10),
    shift: opts.shift || '0800',
    date: opts.date || localDateStr(),
  };
}

// ── Main ──

try {
  const opts = parseArgs();
  const result = predict(opts);
  printResult(result);

  // Write JSON output
  const outDir = path.join(DATA_DIR, 'predictions');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `prediction_${result.date}_${result.shift}_${result.worker.board}_${result.worker.plate}.json`);
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(`JSON output: ${outFile}`);
} catch (err) {
  console.error('Prediction failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
