/**
 * Dispatch Prediction — Data Loading
 *
 * Loads board rosters, work-info snapshots, and historical analysis data
 * from the scrapers data directory. Handles fallbacks for missing data.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR } from '../shared/config';
import { localDateStr, loadJSON } from '../shared/utils';
import type { BoardData, WorkInfoSnapshot, AnalysisData, ButtonSnapshot, CasualButtonEntry } from './types';

/** Find the most recent board file with actual worker data */
export function findLatestBoardFile(date: string): BoardData | null {
  const boardDir = path.join(DATA_DIR, 'boards');

  // Helper: check if a BoardData file has actual workers
  const hasWorkers = (data: BoardData | null): boolean => {
    if (!data) return false;
    for (const board of Object.values(data.boards)) {
      for (const s of board.shifts || []) {
        if (s.workers && s.workers.length > 0) return true;
      }
    }
    return false;
  };

  // Try shifts in reverse priority: most recent scrape first
  for (const shift of ['1630', '0800', '0100']) {
    const file = path.join(boardDir, `${date}_shift-${shift}.json`);
    const data = loadJSON(file) as BoardData | null;
    if (hasWorkers(data)) return data;
  }

  // Try previous day if today has no data
  const prev = new Date(`${date}T12:00:00`);
  prev.setDate(prev.getDate() - 1);
  const prevStr = localDateStr(prev);
  for (const shift of ['1630', '0800', '0100']) {
    const file = path.join(boardDir, `${prevStr}_shift-${shift}.json`);
    const data = loadJSON(file) as BoardData | null;
    if (hasWorkers(data)) return data;
  }

  return null;
}

/** Find the latest work-info snapshot for the given date */
export function findLatestWorkInfo(date: string, _shift: string): WorkInfoSnapshot | null {
  // Try snapshots directory
  const snapshotDir = path.join(DATA_DIR, 'work-info-snapshots', date);
  if (fs.existsSync(snapshotDir)) {
    const files = fs.readdirSync(snapshotDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    for (const f of files) {
      const data = loadJSON(path.join(snapshotDir, f));
      if (data?.vancouver?.workInformation) return data;
    }
  }

  // Try first dispatch monitor tick (pre-dispatch state)
  const dispDir = path.join(DATA_DIR, 'dispatch-monitor', date);
  if (fs.existsSync(dispDir)) {
    const files = fs.readdirSync(dispDir)
      .filter(f => f.endsWith('.json'))
      .sort();
    if (files.length > 0) {
      const tick = loadJSON(path.join(dispDir, files[0]));
      if (tick?.data?.vancouver?.workInformation) {
        return { scrapedAt: tick.tickAt, vancouver: tick.data.vancouver };
      }
    }
  }

  // Fallback: dispatch monitor latest
  const latest = loadJSON(path.join(DATA_DIR, 'dispatch-monitor', 'latest.json'));
  if (latest?.data?.vancouver?.workInformation) {
    return { scrapedAt: latest.tickAt, vancouver: latest.data.vancouver };
  }

  return null;
}

/** Load analysis data for a specific date and window */
export function findAnalysisData(date: string, window: string): AnalysisData | null {
  const file = path.join(DATA_DIR, 'analysis', date, `dispatch-analysis-${window}.json`);
  return loadJSON(file);
}

/** Load button positions from hourly monitor data.
 *  Tries: today's latest snapshot → latest.json fallback.
 *  Returns parsed casual button entries or null. */
export function findButtonPositions(date: string): ButtonSnapshot | null {
  const hourlyDir = path.join(DATA_DIR, 'hourly-monitor');

  // Try today's directory first (most recent snapshot)
  const dayDir = path.join(hourlyDir, date);
  if (fs.existsSync(dayDir)) {
    const files = fs.readdirSync(dayDir)
      .filter(f => f.startsWith('snapshot_') && f.endsWith('.json'))
      .sort()
      .reverse();
    for (const f of files) {
      const snap = parseCasualButtons(loadJSON(path.join(dayDir, f)));
      if (snap) return snap;
    }
  }

  // Fallback: latest.json
  const latest = loadJSON(path.join(hourlyDir, 'latest.json'));
  return parseCasualButtons(latest);
}

function parseCasualButtons(raw: any): ButtonSnapshot | null {
  if (!raw?.['buttons-casual']?.tables?.[0]?.rows) return null;

  const rows: string[][] = raw['buttons-casual'].tables[0].rows;
  const entries: CasualButtonEntry[] = [];

  for (const row of rows) {
    // Row format: ['', description, boardLabel, plate]
    const desc = row[1]?.trim();
    const boardLabel = row[2]?.trim();
    const plateStr = row[3]?.trim();
    if (!desc || !boardLabel || !plateStr) continue;

    const plate = parseInt(plateStr, 10);
    if (isNaN(plate)) continue;

    // Normalize board label: "CASUAL A" → "a", "CASUAL 00" → "00"
    const board = boardLabel.replace(/^CASUAL\s+/i, '').toLowerCase();

    entries.push({ description: desc, board, plate });
  }

  if (entries.length === 0) return null;

  return {
    scrapedAt: raw.scrapedAt || '',
    stamp: raw.stamp || '',
    casualButtons: entries,
  };
}

/** Find historical union/casual split patterns from past N days */
export function findHistoricalSplits(
  targetDate: string,
  lookbackDays: number = 14
): Map<string, { unionPct: number; count: number }> {
  const splits = new Map<string, { unionPct: number; count: number }>();
  const dt = new Date(`${targetDate}T12:00:00`);

  for (let i = 1; i <= lookbackDays; i++) {
    dt.setDate(dt.getDate() - 1);
    const dateStr = localDateStr(dt);
    for (const window of ['morning', 'afternoon']) {
      const analysis = findAnalysisData(dateStr, window);
      if (!analysis) continue;
      for (const timeline of analysis.categoryTimelines || []) {
        if (timeline.location !== 'vancouver') continue;
        if (timeline.totalDispatched === 0) continue;
        const key = `${timeline.section}_${analysis.dayOfWeek}`;
        const unionPct = timeline.unionJobsConsumed / timeline.totalDispatched;
        const existing = splits.get(key);
        if (existing) {
          existing.unionPct = (existing.unionPct * existing.count + unionPct) / (existing.count + 1);
          existing.count++;
        } else {
          splits.set(key, { unionPct, count: 1 });
        }
      }
    }
  }

  return splits;
}
