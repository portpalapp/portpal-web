/**
 * Dispatch Prediction Types — Client-side port
 *
 * Ported from ~/portpal/scrapers/src/prediction/types.ts
 * Only includes types needed for client-side prediction.
 * Internal file-system types (BoardData, WorkInfoSnapshot, AnalysisData) are omitted.
 */

export interface WorkerInfo {
  board: string        // a, b, c, t, r, 00
  plate: number
  reg?: number
  name?: string
  ratings: string[]    // parsed individual codes: ['D', 'M', 'W', ...]
  ratingsRaw?: string  // original string from board: "DMWS"
}

export interface CategoryPrediction {
  category: string
  buttonPosition: number     // -1 if unknown
  totalAtJobs: number        // raw AT count from work-info
  estimatedUnionConsumption: number
  estimatedCasualJobs: number
  workersAheadOfYou: number  // rated workers between button+1 and your plate
  totalRatedOnBoard: number  // total rated workers for this category on your board
  willReachYou: boolean
  workerIsRated: boolean     // does the target worker have the rating for this category
}

export interface PredictionResult {
  worker: { board: string; plate: number; ratings: string[] }
  shift: string
  date: string
  dayOfWeek: number
  dayName: string
  dispatchProbability: number // 0-100
  likelyJob: string | null
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  allCategories: CategoryPrediction[]
  dataQuality: {
    hasBoardData: boolean
    hasWorkInfoData: boolean
    hasButtonData: boolean
    warnings: string[]
  }
}

export interface PredictOptions {
  board: string
  plate: number
  shift?: string      // '0800' (default), '1630', '0100'
  date?: string       // defaults to today
}

/** Shape of a worker in board_monitor_ticks.boards JSONB */
export interface BoardWorker {
  reg: number
  plate: number | string
  name: string
  colour: string
  ratings: string
  isCalledBack: boolean
  isPluggedIn: boolean
  isBlink: boolean
}

/** Shape of a single board entry in board_monitor_ticks.boards JSONB */
export interface BoardEntry {
  totalWorkers: number
  calledBackCount: number
  scoreboard: Record<string, string> | null
  shift: string
  shiftDate: string
  workers: BoardWorker[]
}

/** Shape of work_info_snapshots sections (matches useWorkInfo) */
export interface WorkInfoSection {
  section: string
  totals: Array<{ shift: string; date: string; pre: string; at: string }>
}

/** Data required by the predict function — fetched by the hook, not from filesystem */
export interface PredictionData {
  boardWorkers: BoardWorker[]        // workers on the target board
  workInfoSections: WorkInfoSection[] // job demand by category
  date: string
}
