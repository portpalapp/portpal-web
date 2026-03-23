/**
 * Dispatch Prediction Engine — Client-side port
 *
 * Ported from ~/portpal/scrapers/src/prediction/dispatch-predictor.ts
 * Adapted to accept data as parameters (fetched by the hook) instead of reading from filesystem.
 * No fs/path imports — runs in browser.
 */

import type {
  BoardWorker,
  CategoryPrediction,
  PredictionResult,
  PredictionData,
  PredictOptions,
  WorkerInfo,
} from './types'

import {
  DEFAULT_DISPATCH_ORDER,
  BOARD_ORDER,
  DAY_NAMES,
  DEFAULT_UNION_SPLIT_BY_DOW,
  SHIFT_FORMAT_MAP,
  parseRatings,
  isRatedForCategory,
} from './rating-map'

// Re-export public API
export type { PredictionResult, PredictOptions, CategoryPrediction }
export { parseRatings, isRatedForCategory }

// Note: countWorkersAhead (button-based wrap-around) is not used in v1.
// The client-side predictor uses heuristic plate ordering since button position
// data is not yet in Supabase. When button data is added, re-port countWorkersAhead
// from ~/portpal/scrapers/src/prediction/dispatch-predictor.ts.

/**
 * Run a dispatch prediction given pre-fetched data.
 *
 * @param opts - Board, plate, shift, date
 * @param data - Board workers + work-info sections fetched from Supabase
 */
export function predict(opts: PredictOptions, data: PredictionData): PredictionResult {
  const {
    board: rawBoard,
    plate,
    shift = '0800',
    date = data.date,
  } = opts

  const board = rawBoard.toLowerCase()
  // Parse date as local (noon to avoid UTC midnight rollback in PST/PDT)
  const targetDate = new Date(`${date}T12:00:00`)
  const dayOfWeek = targetDate.getDay()
  const dayName = DAY_NAMES[dayOfWeek]

  const warnings: string[] = []

  // 1. Board data
  const boardWorkers = data.boardWorkers
  const hasBoardData = boardWorkers.length > 0
  let targetWorker: BoardWorker | undefined

  if (hasBoardData) {
    targetWorker = boardWorkers.find(w => String(w.plate) === String(plate))
    if (!targetWorker) {
      warnings.push(`Plate ${plate} not found on board ${board.toUpperCase()} in latest data`)
    }
  } else {
    warnings.push('No board roster data available — using limited prediction')
  }

  // Parse worker ratings
  const rawRatings = targetWorker?.ratings || ''
  const parsedRatings = parseRatings(rawRatings)
  const workerInfo: WorkerInfo = {
    board,
    plate,
    reg: targetWorker?.reg,
    name: targetWorker?.name,
    ratings: parsedRatings,
    ratingsRaw: rawRatings,
  }

  // 2. Work-info (job demand)
  const hasWorkInfoData = data.workInfoSections.length > 0
  const shiftFormatted = SHIFT_FORMAT_MAP[shift] || shift

  const sectionAtCounts = new Map<string, number>()
  if (hasWorkInfoData) {
    for (const section of data.workInfoSections) {
      const shiftTotal = section.totals.find(t => t.shift === shiftFormatted)
      const at = parseInt(shiftTotal?.at || '0', 10) || 0
      sectionAtCounts.set(section.section, at)
    }
  } else {
    warnings.push('No work-info data available — cannot estimate job demand')
  }

  // 3. Build predictions per category (no button data in v1 — heuristic ordering)
  const allCategories: CategoryPrediction[] = []
  let firstHitCategory: string | null = null
  let firstHitWorkersAhead = 0
  let firstHitCasualJobs = 0

  const dispatchedPlates = new Set<number>()

  for (const category of DEFAULT_DISPATCH_ORDER) {
    const totalAtJobs = sectionAtCounts.get(category) || 0

    // Estimate union consumption using default day-of-week splits
    const unionPct = DEFAULT_UNION_SPLIT_BY_DOW[dayOfWeek] ?? 0.35
    const estimatedUnionConsumption = Math.round(totalAtJobs * unionPct)
    const estimatedCasualJobs = Math.max(0, totalAtJobs - estimatedUnionConsumption)

    // Check if this worker has the rating
    const workerIsRated = isRatedForCategory(parsedRatings, category)

    // Count rated workers on the board for this category
    let workersAheadOfYou = 0
    let totalRatedOnBoard = 0

    if (boardWorkers.length > 0) {
      const ratedPlates: number[] = []

      for (const w of boardWorkers) {
        const plateNum = typeof w.plate === 'string' ? parseInt(w.plate, 10) : w.plate
        if (isNaN(plateNum)) continue
        if (dispatchedPlates.has(plateNum)) continue

        const wRatings = parseRatings(w.ratings)
        if (isRatedForCategory(wRatings, category)) {
          ratedPlates.push(plateNum)
        }
      }

      totalRatedOnBoard = ratedPlates.length

      // Heuristic: assume button at plate 0 (workers below target plate are ahead)
      workersAheadOfYou = ratedPlates.filter(p => p < plate).length
    }

    // Determine if the category will reach this worker
    const willReachYou = workerIsRated && estimatedCasualJobs > workersAheadOfYou

    // Simulate: mark dispatched workers as consumed
    if (estimatedCasualJobs > 0 && boardWorkers.length > 0) {
      const ratedOnBoard = boardWorkers
        .filter(w => {
          const pn = typeof w.plate === 'string' ? parseInt(w.plate, 10) : w.plate
          return !isNaN(pn) && !dispatchedPlates.has(pn) &&
            isRatedForCategory(parseRatings(w.ratings), category)
        })
        .map(w => typeof w.plate === 'string' ? parseInt(w.plate, 10) : w.plate)
        .sort((a, b) => a - b)

      const toDispatch = Math.min(estimatedCasualJobs, ratedOnBoard.length)
      for (let i = 0; i < toDispatch; i++) {
        dispatchedPlates.add(ratedOnBoard[i])
      }
    }

    if (willReachYou && !firstHitCategory) {
      firstHitCategory = category
      firstHitWorkersAhead = workersAheadOfYou
      firstHitCasualJobs = estimatedCasualJobs
    }

    allCategories.push({
      category,
      buttonPosition: -1, // No button data in v1
      totalAtJobs,
      estimatedUnionConsumption,
      estimatedCasualJobs,
      workersAheadOfYou,
      totalRatedOnBoard,
      willReachYou,
      workerIsRated,
    })
  }

  // 4. Calculate overall dispatch probability
  let dispatchProbability = 0
  let confidence: 'high' | 'medium' | 'low' = 'low'

  if (firstHitCategory) {
    const margin = firstHitCasualJobs - firstHitWorkersAhead
    const ratio = firstHitCasualJobs > 0 ? margin / firstHitCasualJobs : 0

    if (ratio > 0.5) {
      dispatchProbability = 95
      confidence = 'high'
    } else if (ratio > 0.2) {
      dispatchProbability = 75
      confidence = 'medium'
    } else if (ratio > 0) {
      dispatchProbability = 55
      confidence = 'medium'
    } else {
      dispatchProbability = 30
      confidence = 'low'
    }

    // Boost if multiple categories would reach this worker
    const hitCount = allCategories.filter(c => c.willReachYou).length
    if (hitCount >= 3) dispatchProbability = Math.min(99, dispatchProbability + 10)
    else if (hitCount >= 2) dispatchProbability = Math.min(99, dispatchProbability + 5)
  } else {
    if (!hasWorkInfoData) {
      dispatchProbability = 0
      confidence = 'low'
      warnings.push('Cannot estimate probability without work-info data')
    } else if (parsedRatings.length === 0) {
      const holdCat = allCategories.find(c => c.category === 'Hold')
      if (holdCat && holdCat.estimatedCasualJobs > 0) {
        dispatchProbability = 15
        confidence = 'low'
      }
    }
  }

  // Day-of-week adjustment
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    dispatchProbability = Math.round(dispatchProbability * 0.9)
    if (confidence === 'high' && dispatchProbability < 80) confidence = 'medium'
  }

  // Board seniority adjustment
  const boardIndex = BOARD_ORDER.indexOf(board)
  if (boardIndex > 1) {
    const penalty = boardIndex * 5
    dispatchProbability = Math.max(0, dispatchProbability - penalty)
    if (boardIndex >= 3) confidence = 'low'
  }

  dispatchProbability = Math.max(0, Math.min(100, dispatchProbability))

  // 5. Build reasoning
  const reasoning = buildReasoning(
    board, plate, workerInfo.name, rawRatings, parsedRatings,
    firstHitCategory, firstHitCasualJobs, firstHitWorkersAhead,
    allCategories, dayName, date, shift,
  )

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
      hasButtonData: false, // v1: no button data from Supabase yet
      warnings,
    },
  }
}

function buildReasoning(
  board: string, plate: number, name: string | undefined,
  rawRatings: string, parsedRatings: string[],
  firstHitCategory: string | null, casualJobs: number, workersAhead: number,
  allCategories: CategoryPrediction[], dayName: string, date: string, shift: string,
): string {
  let reasoning = `Board ${board.toUpperCase()} plate ${plate}`
  if (name) reasoning += ` (${name})`
  reasoning += ` — ratings: ${rawRatings || '(none)'}. `

  if (firstHitCategory) {
    reasoning += `Likely dispatched for ${firstHitCategory}: `
    reasoning += `${casualJobs} casual jobs estimated, ${workersAhead} rated workers ahead. `
    reasoning += `${dayName} ${date}, shift ${shift}.`
    const otherHits = allCategories.filter(c => c.willReachYou && c.category !== firstHitCategory)
    if (otherHits.length > 0) {
      reasoning += ` Also eligible for: ${otherHits.map(c => c.category).join(', ')}.`
    }
  } else {
    if (parsedRatings.length === 0) {
      reasoning += 'No ratings — only eligible for basic Hold labour. '
    }
    reasoning += `No category projected to reach plate ${plate} based on current demand. `
    reasoning += `${dayName} ${date}, shift ${shift}.`
  }

  return reasoning
}
