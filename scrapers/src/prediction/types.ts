/**
 * Dispatch Prediction — Types
 */

// ── Public API types ──

export interface WorkerInfo {
  board: string;        // a, b, c, t, r, 00
  plate: number;
  reg?: number;
  name?: string;
  ratings: string[];    // parsed individual codes: ['D', 'M', 'W', ...]
  ratingsRaw?: string;  // original string from board: "DMWS"
}

export interface CategoryPrediction {
  category: string;
  buttonPosition: number;     // -1 if unknown
  totalAtJobs: number;        // raw AT count from work-info
  estimatedUnionConsumption: number;
  estimatedCasualJobs: number;
  workersAheadOfYou: number;  // rated workers between button+1 and your plate
  totalRatedOnBoard: number;  // total rated workers for this category on your board
  willReachYou: boolean;
  workerIsRated: boolean;     // does the target worker have the rating for this category
}

export interface PredictionResult {
  worker: { board: string; plate: number; ratings: string[] };
  shift: string;
  date: string;
  dayOfWeek: number;
  dayName: string;
  dispatchProbability: number; // 0-100
  likelyJob: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  allCategories: CategoryPrediction[];
  dataQuality: {
    hasBoardData: boolean;
    hasWorkInfoData: boolean;
    hasAnalysisData: boolean;
    hasButtonData: boolean;
    buttonSource: 'monitor' | 'analysis' | 'heuristic' | 'none';
    warnings: string[];
  };
}

// ── Internal data types ──

export interface BoardWorker {
  reg: number;
  plate: string;
  name: string;
  colour: string;
  ratings: string;
  isCalledBack: boolean;
  isPluggedIn: boolean;
  isBlink: boolean;
}

export interface BoardShift {
  shift: string;
  shiftDate: string;
  scoreboard: { callback: number };
  totalWorkers: number;
  calledBackCount: number;
  workers: BoardWorker[];
}

export interface BoardData {
  scrapedAt: string;
  date: string;
  shiftLabel: string;
  boards: Record<string, { shifts: BoardShift[] }>;
}

export interface WorkInfoSection {
  section: string;
  totals: Array<{ shift: string; date: string; pre: string; at: string }>;
  jobs: Array<{ job: string; sites: unknown }>;
}

export interface WorkInfoSnapshot {
  scrapedAt: string;
  vancouver: {
    workInformation: WorkInfoSection[];
  };
}

export interface AnalysisTimeline {
  section: string;
  shift: string;
  location: string;
  startAt: number;
  endAt: number;
  totalDispatched: number;
  unionJobsConsumed: number;
  casualJobsConsumed: number;
  splitRatio: string;
  unionPhase: { jobsConsumed: number } | null;
  casualPhase: { jobsConsumed: number } | null;
}

export interface AnalysisData {
  date: string;
  window: string;
  dayOfWeek: number;
  dayName: string;
  categoryDispatchOrder: Array<{ rank: number; section: string; shift: string }>;
  categoryTimelines: AnalysisTimeline[];
}

export interface PredictOptions {
  board: string;
  plate: number;
  shift?: string;      // '0800' (default), '1630', '0100'
  date?: string;       // defaults to today
  assumePluggedIn?: boolean; // default true — assume the worker will plug in
}

// ── Button position types ──

export interface CasualButtonEntry {
  description: string;  // e.g. "Casual B Board - Day", "Casual B Board - Heavy Lift Truck"
  board: string;        // normalized: 'a', 'b', 'c', 't', '00', 'r'
  plate: number;        // plate of last dispatched worker
}

export interface ButtonSnapshot {
  scrapedAt: string;
  stamp: string;
  casualButtons: CasualButtonEntry[];
}
