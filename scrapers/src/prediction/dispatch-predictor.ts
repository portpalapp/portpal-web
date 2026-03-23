/**
 * Dispatch Prediction Engine
 *
 * Tells a worker: "Based on your board, plate position, ratings, and today's
 * job demand, here's your dispatch probability and likely job for the target shift."
 *
 * Algorithm:
 *   For each job category in dispatch order:
 *     1. Get total casual jobs available (AT count minus estimated union consumption)
 *     2. Walk forward from button+1 through rated+plugged workers on the board
 *     3. Count how many eligible workers sit between button+1 and the target plate
 *     4. If casual jobs > workers ahead → this category reaches the target worker
 *     5. First category that reaches the worker = their predicted job
 *
 * Usage (via CLI):
 *   tsx src/prediction/predict-cli.ts --board b --plate 165
 *   npm run predict -- --board b --plate 165 --date 2026-03-22
 *
 * Usage (as module):
 *   import { predict } from './dispatch-predictor';
 *   const result = predict({ board: 'b', plate: 165 });
 */

import { localDateStr } from '../shared/utils';

import type {
  WorkerInfo,
  CategoryPrediction,
  PredictionResult,
  BoardWorker,
  ButtonSnapshot,
  PredictOptions,
} from './types';

import {
  DEFAULT_DISPATCH_ORDER,
  BOARD_ORDER,
  DAY_NAMES,
  DEFAULT_UNION_SPLIT_BY_DOW,
  SHIFT_FORMAT_MAP,
  CASUAL_BUTTON_TO_CATEGORY,
  SHIFT_TO_BUTTON_SUFFIX,
  GENERAL_BUTTON_CATEGORIES,
  parseRatings,
  isRatedForCategory,
} from './rating-map';

import {
  findLatestBoardFile,
  findLatestWorkInfo,
  findAnalysisData,
  findHistoricalSplits,
  findButtonPositions,
} from './data-loader';

// Re-export public API
export type { WorkerInfo, CategoryPrediction, PredictionResult, PredictOptions };
export { parseRatings, isRatedForCategory };

// ── Helpers ──

/** Look up the casual button plate for a given board, category, and shift.
 *  Returns the plate number or -1 if not found. */
function lookupCasualButton(
  buttons: ButtonSnapshot,
  board: string,
  category: string,
  shift: string,
): number {
  const shiftSuffix = SHIFT_TO_BUTTON_SUFFIX[shift];
  if (!shiftSuffix) return -1;

  const boardUpper = board.toUpperCase() === '00' ? '00' : board.toUpperCase();

  // For general-button categories (Hold, Warehouse, Dock), use the shift button (Day/Night/1 AM)
  if (GENERAL_BUTTON_CATEGORIES.has(category)) {
    const match = buttons.casualButtons.find(b =>
      b.board === board && b.description.endsWith(`- ${shiftSuffix}`)
    );
    return match?.plate ?? -1;
  }

  // For specialty categories, find the most specific button
  // Reverse-map: find which button descriptions map to this category
  const matchingDescs: string[] = [];
  for (const [desc, cat] of Object.entries(CASUAL_BUTTON_TO_CATEGORY)) {
    if (cat === category) matchingDescs.push(desc);
  }

  if (matchingDescs.length === 0) {
    // No specific button for this category — fall back to general shift button
    const match = buttons.casualButtons.find(b =>
      b.board === board && b.description.endsWith(`- ${shiftSuffix}`)
    );
    return match?.plate ?? -1;
  }

  // Find any matching button for this board
  for (const desc of matchingDescs) {
    const match = buttons.casualButtons.find(b =>
      b.board === board && b.description.endsWith(`- ${desc}`)
    );
    if (match) return match.plate;
  }

  // Fallback to general shift button
  const fallback = buttons.casualButtons.find(b =>
    b.board === board && b.description.endsWith(`- ${shiftSuffix}`)
  );
  return fallback?.plate ?? -1;
}

/** Count rated workers between button+1 and targetPlate, wrapping around the board.
 *  Dispatch walks FORWARD from button+1. Workers in that range are "ahead" of the target. */
function countWorkersAhead(
  ratedPlates: number[],
  buttonPlate: number,
  targetPlate: number,
): number {
  // Workers ahead are those between (button+1) and (targetPlate-1) in circular order
  const start = buttonPlate + 1;

  if (start <= targetPlate) {
    // No wrap: count plates in [start, targetPlate)
    return ratedPlates.filter(p => p >= start && p < targetPlate).length;
  } else {
    // Wrap: count plates >= start OR plates < targetPlate
    return ratedPlates.filter(p => p >= start || p < targetPlate).length;
  }
}

// ── Prediction Engine ──

export function predict(opts: PredictOptions): PredictionResult {
  const {
    board: rawBoard,
    plate,
    shift = '0800',
    date = localDateStr(),
    assumePluggedIn = true,
  } = opts;

  const board = rawBoard.toLowerCase();
  // Parse date as local (noon to avoid UTC midnight rollback in PST/PDT)
  const targetDate = new Date(`${date}T12:00:00`);
  const dayOfWeek = targetDate.getDay();
  const dayName = DAY_NAMES[dayOfWeek];

  const warnings: string[] = [];

  // 1. Load board data
  const boardData = findLatestBoardFile(date);
  const hasBoardData = !!boardData;
  let boardWorkers: BoardWorker[] = [];
  let targetWorker: BoardWorker | undefined;

  if (boardData) {
    const boardEntry = boardData.boards[board];
    if (boardEntry?.shifts?.length) {
      // Pick the shift with the most workers (closest to dispatch time)
      const bestShift = boardEntry.shifts.reduce((a, b) =>
        (b.workers?.length || 0) > (a.workers?.length || 0) ? b : a
      );
      boardWorkers = bestShift.workers || [];
      targetWorker = boardWorkers.find(w => String(w.plate) === String(plate));
    }
    if (!targetWorker) {
      warnings.push(`Worker at plate ${plate} not found on board ${board.toUpperCase()} in latest data`);
    }
  } else {
    warnings.push('No board roster data available — using limited prediction');
  }

  // Parse worker ratings
  const rawRatings = targetWorker?.ratings || '';
  const parsedRatings = parseRatings(rawRatings);
  const workerInfo: WorkerInfo = {
    board,
    plate,
    reg: targetWorker?.reg,
    name: targetWorker?.name,
    ratings: parsedRatings,
    ratingsRaw: rawRatings,
  };

  // 2. Load work-info (job demand)
  const workInfo = findLatestWorkInfo(date, shift);
  const hasWorkInfoData = !!workInfo;
  const shiftFormatted = SHIFT_FORMAT_MAP[shift] || shift;

  // Extract AT counts per section
  const sectionAtCounts = new Map<string, number>();
  if (workInfo) {
    for (const section of workInfo.vancouver.workInformation) {
      const shiftTotal = section.totals.find(t => t.shift === shiftFormatted);
      const at = parseInt(shiftTotal?.at || '0', 10) || 0;
      sectionAtCounts.set(section.section, at);
    }
  } else {
    warnings.push('No work-info data available — cannot estimate job demand');
  }

  // 3. Load historical analysis for union/casual splits
  const historicalSplits = findHistoricalSplits(date);
  const hasAnalysisData = historicalSplits.size > 0;
  if (!hasAnalysisData) {
    warnings.push('No historical analysis data — using default union/casual split estimates');
  }

  // 4. Load button positions from hourly monitor
  const buttonData = findButtonPositions(date);
  const hasButtonData = !!buttonData;
  if (!hasButtonData) {
    warnings.push('No button position data — using heuristic plate ordering');
  }

  // 5. Try to get today's analysis for actual dispatch order
  const todayWindow = shift === '0800' ? 'morning' : 'afternoon';
  const todayAnalysis = findAnalysisData(date, todayWindow);
  let buttonSource: 'monitor' | 'analysis' | 'heuristic' | 'none' = 'none';

  // 5. Build predictions per category
  const allCategories: CategoryPrediction[] = [];
  let firstHitCategory: string | null = null;
  let firstHitWorkersAhead = 0;
  let firstHitCasualJobs = 0;

  // Get dispatch order (from analysis if available, else default)
  const dispatchOrder = todayAnalysis?.categoryDispatchOrder
    ? todayAnalysis.categoryDispatchOrder
        .filter(c => c.shift === shiftFormatted)
        .map(c => c.section)
    : DEFAULT_DISPATCH_ORDER;

  // Deduplicate
  const seen = new Set<string>();
  const uniqueOrder = dispatchOrder.filter(s => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });

  // Track workers already dispatched by earlier categories (simulation)
  const dispatchedPlates = new Set<number>();

  for (const category of uniqueOrder) {
    const totalAtJobs = sectionAtCounts.get(category) || 0;

    // Estimate union consumption
    const splitKey = `${category}_${dayOfWeek}`;
    const historicalSplit = historicalSplits.get(splitKey);
    let unionPct: number;
    if (historicalSplit) {
      unionPct = historicalSplit.unionPct;
    } else {
      unionPct = DEFAULT_UNION_SPLIT_BY_DOW[dayOfWeek] ?? 0.35;
    }
    const estimatedUnionConsumption = Math.round(totalAtJobs * unionPct);
    const estimatedCasualJobs = Math.max(0, totalAtJobs - estimatedUnionConsumption);

    // Check if this worker has the rating
    const workerIsRated = isRatedForCategory(parsedRatings, category);

    // Button position: prefer hourly monitor, fallback to analysis, then heuristic
    let buttonPosition = -1;

    if (buttonData) {
      const bp = lookupCasualButton(buttonData, board, category, shift);
      if (bp >= 0) {
        buttonPosition = bp;
        buttonSource = 'monitor';
      }
    }

    if (buttonPosition === -1 && todayAnalysis) {
      const timeline = todayAnalysis.categoryTimelines?.find(
        t => t.section === category && t.shift === shiftFormatted && t.location === 'vancouver'
      );
      if (timeline?.casualPhase) {
        buttonSource = 'analysis';
      }
    }

    // Count rated workers on the board who would be eligible
    let workersAheadOfYou = 0;
    let totalRatedOnBoard = 0;

    if (boardWorkers.length > 0) {
      const ratedPlates: number[] = [];

      for (const w of boardWorkers) {
        const plateNum = parseInt(w.plate, 10);
        if (isNaN(plateNum)) continue;
        if (dispatchedPlates.has(plateNum)) continue;

        const wRatings = parseRatings(w.ratings);
        if (isRatedForCategory(wRatings, category)) {
          ratedPlates.push(plateNum);
        }
      }

      totalRatedOnBoard = ratedPlates.length;

      if (buttonPosition >= 0) {
        // Real button data: count workers between button+1 and target plate (wrap-around)
        workersAheadOfYou = countWorkersAhead(ratedPlates, buttonPosition, plate);
      } else {
        // Heuristic fallback: assume button at plate 0 (all workers below target are ahead)
        if (buttonSource === 'none') buttonSource = 'heuristic';
        workersAheadOfYou = ratedPlates.filter(p => p < plate).length;
      }
    }

    // Determine if the category will reach this worker
    const willReachYou = workerIsRated && estimatedCasualJobs > workersAheadOfYou;

    // Simulate: if this category dispatches workers, mark them as consumed
    if (estimatedCasualJobs > 0 && boardWorkers.length > 0) {
      const ratedOnBoard = boardWorkers
        .filter(w => {
          const pn = parseInt(w.plate, 10);
          return !isNaN(pn) && !dispatchedPlates.has(pn) &&
            isRatedForCategory(parseRatings(w.ratings), category);
        })
        .map(w => parseInt(w.plate, 10));

      // Sort in dispatch walk order from button+1
      let sorted: number[];
      if (buttonPosition >= 0) {
        // Wrap-around sort: plates after button come first, then plates before
        const after = ratedOnBoard.filter(p => p > buttonPosition).sort((a, b) => a - b);
        const before = ratedOnBoard.filter(p => p <= buttonPosition).sort((a, b) => a - b);
        sorted = [...after, ...before];
      } else {
        sorted = ratedOnBoard.sort((a, b) => a - b);
      }

      const toDispatch = Math.min(estimatedCasualJobs, sorted.length);
      for (let i = 0; i < toDispatch; i++) {
        dispatchedPlates.add(sorted[i]);
      }
    }

    // Track first category that hits this worker
    if (willReachYou && !firstHitCategory) {
      firstHitCategory = category;
      firstHitWorkersAhead = workersAheadOfYou;
      firstHitCasualJobs = estimatedCasualJobs;
    }

    allCategories.push({
      category,
      buttonPosition,
      totalAtJobs,
      estimatedUnionConsumption,
      estimatedCasualJobs,
      workersAheadOfYou,
      totalRatedOnBoard,
      willReachYou,
      workerIsRated,
    });
  }

  // 6. Calculate overall dispatch probability
  let dispatchProbability = 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (firstHitCategory) {
    const margin = firstHitCasualJobs - firstHitWorkersAhead;
    const ratio = firstHitCasualJobs > 0 ? margin / firstHitCasualJobs : 0;

    if (ratio > 0.5) {
      dispatchProbability = 95;
      confidence = 'high';
    } else if (ratio > 0.2) {
      dispatchProbability = 75;
      confidence = 'medium';
    } else if (ratio > 0) {
      dispatchProbability = 55;
      confidence = 'medium';
    } else {
      dispatchProbability = 30;
      confidence = 'low';
    }

    // Boost if multiple categories would reach this worker
    const hitCount = allCategories.filter(c => c.willReachYou).length;
    if (hitCount >= 3) dispatchProbability = Math.min(99, dispatchProbability + 10);
    else if (hitCount >= 2) dispatchProbability = Math.min(99, dispatchProbability + 5);
  } else {
    if (!hasWorkInfoData) {
      dispatchProbability = 0;
      confidence = 'low';
      warnings.push('Cannot estimate probability without work-info data');
    } else if (parsedRatings.length === 0) {
      const holdCat = allCategories.find(c => c.category === 'Hold');
      if (holdCat && holdCat.estimatedCasualJobs > 0) {
        dispatchProbability = 15;
        confidence = 'low';
      }
    }
  }

  // Day-of-week adjustment
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    dispatchProbability = Math.round(dispatchProbability * 0.9);
    if (confidence === 'high' && dispatchProbability < 80) confidence = 'medium';
  }

  // Board seniority adjustment
  const boardIndex = BOARD_ORDER.indexOf(board);
  if (boardIndex > 1) {
    const penalty = boardIndex * 5;
    dispatchProbability = Math.max(0, dispatchProbability - penalty);
    if (boardIndex >= 3) confidence = 'low';
  }

  dispatchProbability = Math.max(0, Math.min(100, dispatchProbability));

  // 7. Build reasoning string
  const reasoning = buildReasoning(
    board, plate, workerInfo.name, rawRatings, parsedRatings,
    firstHitCategory, firstHitCasualJobs, firstHitWorkersAhead,
    allCategories, dayName, date, shift
  );

  return {
    worker: { board, plate, ratings: parsedRatings },
    shift,
    date,
    dayOfWeek,
    dayName,
    dispatchProbability,
    likelyJob: firstHitCategory,
    confidence,
    reasoning,
    allCategories,
    dataQuality: {
      hasBoardData,
      hasWorkInfoData,
      hasAnalysisData,
      hasButtonData,
      buttonSource,
      warnings,
    },
  };
}

function buildReasoning(
  board: string, plate: number, name: string | undefined,
  rawRatings: string, parsedRatings: string[],
  firstHitCategory: string | null, casualJobs: number, workersAhead: number,
  allCategories: CategoryPrediction[], dayName: string, date: string, shift: string
): string {
  let reasoning = `Board ${board.toUpperCase()} plate ${plate}`;
  if (name) reasoning += ` (${name})`;
  reasoning += ` — ratings: ${rawRatings || '(none)'}. `;

  if (firstHitCategory) {
    reasoning += `Likely dispatched for ${firstHitCategory}: `;
    reasoning += `${casualJobs} casual jobs estimated, ${workersAhead} rated workers ahead. `;
    reasoning += `${dayName} ${date}, shift ${shift}.`;
    const otherHits = allCategories.filter(c => c.willReachYou && c.category !== firstHitCategory);
    if (otherHits.length > 0) {
      reasoning += ` Also eligible for: ${otherHits.map(c => c.category).join(', ')}.`;
    }
  } else {
    if (parsedRatings.length === 0) {
      reasoning += 'No ratings — only eligible for basic Hold labour. ';
    }
    reasoning += `No category projected to reach plate ${plate} based on current demand. `;
    reasoning += `${dayName} ${date}, shift ${shift}.`;
  }

  return reasoning;
}

// CLI entry point is in predict-cli.ts
