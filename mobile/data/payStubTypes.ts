// Pay Stub parsing types and terminal mapping
// Source: BCMEA ADP pay stubs analysis

// ── Terminal / Company Code Mapping ──────────────────────────────────────────

export const COMPANY_CODE_MAP: Record<string, { operator: string; terminal: string; appLocation: string }> = {
  CO071: { operator: 'DPWORLD', terminal: 'CENTERM', appLocation: 'CENTENNIAL' },
  CO068: { operator: 'PCT', terminal: 'PCT', appLocation: 'PCT' },
  CO002: { operator: 'GCT', terminal: 'CANADA', appLocation: 'VANTERM' },
  CO066: { operator: 'FIBRECO', terminal: 'EXPORT', appLocation: 'FIBRECO' },
  CO069: { operator: 'DELTAPORT', terminal: 'DP', appLocation: 'DELTAPORT' },
  CO070: { operator: 'FRASER SURREY', terminal: 'FS', appLocation: 'FRASER SURREY' },
};

// Terminal names as they appear on pay stubs → app location names
export const TERMINAL_NAME_MAP: Record<string, string> = {
  'DPWORLD CENTERM': 'CENTENNIAL',
  'DPWORLD': 'CENTENNIAL',
  CENTERM: 'CENTENNIAL',
  PCT: 'PCT',
  'GCT CANADA': 'VANTERM',
  GCT: 'VANTERM',
  'FIBRECO EXPORT': 'FIBRECO',
  FIBRECO: 'FIBRECO',
  DELTAPORT: 'DELTAPORT',
  'FRASER SURREY': 'FRASER SURREY',
  'ALLIANCE GRAIN': 'ALLIANCE GRAIN',
  'G3 TERMINAL': 'G3 TERMINAL',
  CASCADIA: 'CASCADIA',
  RICHARDSON: 'RICHARDSON',
  CARGILL: 'CARGILL',
  'VITERRA PAC': 'VITERRA PAC',
};

// ── Rate → Differential Class Inference ──────────────────────────────────────
// Based on Year 3 (Apr 2025) base rates

export const YEAR_3_BASE_RATES = {
  'MON-FRI': { DAY: 55.30, NIGHT: 69.66, GRAVEYARD: 86.04 },
  SAT: { DAY: 70.78, NIGHT: 88.48, GRAVEYARD: 88.48 },
  'SUN-HOL': { DAY: 88.48, NIGHT: 88.48, GRAVEYARD: 88.48 },
};

export const DIFFERENTIAL_AMOUNTS: Record<string, number> = {
  BASE: 0,
  CLASS_4: 0.50,
  CLASS_3: 0.65,
  CLASS_2: 1.00,
  WHEAT: 1.15,
  CLASS_1: 2.50,
};

export const DIFFERENTIAL_JOBS: Record<string, string[]> = {
  BASE: ['LABOUR', 'HEAD CHECKER', 'DOCK CHECKER', 'BUNNY BUS', 'TRAINING'],
  CLASS_1: ['HD MECHANIC', 'CARPENTER', 'ELECTRICIAN', 'MILLWRIGHT', 'PLUMBER', 'TRACKMEN', 'WELDER'],
  CLASS_2: ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY'],
  CLASS_3: ['TRACTOR TRAILER', 'LOCI', 'REACHSTACKER', '40 TON (TOP PICK)', 'FRONT END LOADER', 'BULLDOZER', 'EXCAVATOR', 'KOMATSU', 'MOBILE CRANE', 'WINCH DRIVER'],
  CLASS_4: ['LIFT TRUCK', 'STORESPERSON', 'GEARPERSON'],
  WHEAT: ['WHEAT MACHINE', 'WHEAT SPECIALTY'],
};

// Important: OT formula is (Base × 1.5) + Differential, NOT (Base + Differential) × 1.5
export function inferDiffClassFromRate(
  regRate: number,
  dayType: 'MON-FRI' | 'SAT' | 'SUN-HOL',
  shift: 'DAY' | 'NIGHT' | 'GRAVEYARD',
): { diffClass: string; differential: number; possibleJobs: string[] } | null {
  const baseRate = YEAR_3_BASE_RATES[dayType]?.[shift];
  if (!baseRate) return null;

  const diff = Math.round((regRate - baseRate) * 100) / 100;

  // Find closest matching differential class
  let bestMatch = 'UNKNOWN';
  let bestDiff = diff;
  let minDistance = Infinity;

  for (const [cls, amount] of Object.entries(DIFFERENTIAL_AMOUNTS)) {
    const distance = Math.abs(diff - amount);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = cls;
      bestDiff = amount;
    }
  }

  // If no close match (> $0.20 tolerance), return unknown
  if (minDistance > 0.20) {
    return { diffClass: 'UNKNOWN', differential: diff, possibleJobs: [] };
  }

  return {
    diffClass: bestMatch,
    differential: bestDiff,
    possibleJobs: DIFFERENTIAL_JOBS[bestMatch] || [],
  };
}

// ── Parsed Pay Stub Types ────────────────────────────────────────────────────

export interface PayStubShift {
  date: string; // YYYY-MM-DD
  shiftType: 'DAY' | 'NIGHT' | 'GRAVEYARD';
  companyCode: string;
  terminalRaw: string; // Raw terminal name from stub
  locationRaw: string; // Raw sub-location
  appLocation: string; // Mapped to our location names
  regRate: number;
  regHours: number;
  regAmount: number;
  otRate: number;
  otHours: number;
  otAmount: number;
  travelRate?: number;
  travelHours?: number;
  totalAmount: number;
  inferredDiffClass: string;
  possibleJobs: string[];
}

export interface PayStubDeductions {
  govtPension: number;
  federalTax: number;
  welfare: number;
  eiContribution: number;
  unionDues: number;
  groupLife: number;
  total: number;
}

export interface ParsedPayStub {
  paymentDate: string;
  payEndDate: string;
  payPeriod: number;
  totalPayPeriods: number;
  employeeName: string;
  shifts: PayStubShift[];
  totalEarnings: number;
  totalGross: number;
  netPay: number;
  deductions: PayStubDeductions;
  ytdEarnings: number;
  ytdTax: number;
  ytdCpp: number;
  ytdEi: number;
  vacationTaken: number;
  vacationBalance: number;
}

// ── Comparison Types ─────────────────────────────────────────────────────────

export type MatchStatus = 'MATCH' | 'RATE_DIFF' | 'HOURS_DIFF' | 'MISSING_IN_APP' | 'MISSING_ON_STUB';

export interface ShiftComparison {
  date: string;
  stubShift?: PayStubShift;
  appShift?: {
    id: string;
    job: string;
    location: string;
    shift: string;
    regHours: number;
    otHours: number;
    regRate: number;
    totalPay: number;
  };
  status: MatchStatus;
  rateDifference?: number;
  hoursDifference?: number;
  payDifference?: number;
}

// Job label for imported shifts where we can't determine exact job
export function getImportedJobLabel(diffClass: string): string {
  switch (diffClass) {
    case 'BASE': return 'Imported (Base Rate)';
    case 'CLASS_1': return 'Imported (Class 1)';
    case 'CLASS_2': return 'Imported (Class 2)';
    case 'CLASS_3': return 'Imported (Class 3)';
    case 'CLASS_4': return 'Imported (Class 4)';
    case 'WHEAT': return 'Imported (Wheat)';
    default: return 'Imported from Pay Stub';
  }
}
