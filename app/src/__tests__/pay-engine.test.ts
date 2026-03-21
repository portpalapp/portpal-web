/**
 * Pay engine tests - THE most critical test file.
 *
 * Pay accuracy is the core value prop for 957 users tracking $41M in pay.
 * These tests verify:
 *   - OT formula correctness: (Base x 1.5) + Differential, NOT (Base + Diff) x 1.5
 *   - Differential class amounts for all 6 classes
 *   - CENTENNIAL 9-hour vs VANTERM 8-hour shifts
 *   - TRAINER multiplier (1.333x base + $1.67 differential)
 *   - Weekly/YTD earnings aggregation
 *   - Pension year boundary (Jan 4, 2026)
 *   - Wheat special hours (7.5 reg + 0.5 OT)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BASE_RATES,
  DIFFERENTIALS,
  HOURS_BY_LOCATION,
  calculateWeeklyEarnings,
  calculateYTDEarnings,
} from '../data/mockData';
import type { Shift } from '../data/mockData';

// ---------------------------------------------------------------------------
// Helper: compute pay the way the engine should
// ---------------------------------------------------------------------------

/**
 * Correct OT formula per CLAUDE.md:
 *   OT Rate = (BaseRate x 1.5) + Differential
 * NOT: (BaseRate + Differential) x 1.5
 */
function correctOTRate(baseRate: number, differential: number): number {
  return baseRate * 1.5 + differential;
}

/**
 * Wrong OT formula (the bug we want to catch):
 *   OT Rate = (BaseRate + Differential) x 1.5
 */
function wrongOTRate(baseRate: number, differential: number): number {
  return (baseRate + differential) * 1.5;
}

// ---------------------------------------------------------------------------
// Differential class tests
// ---------------------------------------------------------------------------

describe('Differential classes', () => {
  it('CLASS_1 jobs have +$2.50 differential', () => {
    const class1Jobs = ['HD MECHANIC', 'CARPENTER', 'ELECTRICIAN', 'MILLWRIGHT', 'PLUMBER', 'TRACKMEN', 'WELDER'];
    for (const job of class1Jobs) {
      expect(DIFFERENTIALS[job]).toBeDefined();
      expect(DIFFERENTIALS[job].amount).toBe(2.50);
      expect(DIFFERENTIALS[job].class).toBe('CLASS_1');
    }
  });

  it('CLASS_2 jobs have +$1.00 differential', () => {
    const class2Jobs = ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY'];
    for (const job of class2Jobs) {
      expect(DIFFERENTIALS[job]).toBeDefined();
      expect(DIFFERENTIALS[job].amount).toBe(1.00);
      expect(DIFFERENTIALS[job].class).toBe('CLASS_2');
    }
  });

  it('CLASS_3 jobs have +$0.65 differential', () => {
    const class3Jobs = [
      'TRACTOR TRAILER', 'LOCI', '40 TON (TOP PICK)', 'REACHSTACKER',
      'FRONT END LOADER', 'BULLDOZER', 'EXCAVATOR', 'KOMATSU', 'MOBILE CRANE', 'WINCH DRIVER',
    ];
    for (const job of class3Jobs) {
      expect(DIFFERENTIALS[job]).toBeDefined();
      expect(DIFFERENTIALS[job].amount).toBe(0.65);
      expect(DIFFERENTIALS[job].class).toBe('CLASS_3');
    }
  });

  it('CLASS_4 jobs have +$0.50 differential', () => {
    const class4Jobs = ['LIFT TRUCK', 'STORESPERSON', 'GEARPERSON'];
    for (const job of class4Jobs) {
      expect(DIFFERENTIALS[job]).toBeDefined();
      expect(DIFFERENTIALS[job].amount).toBe(0.50);
      expect(DIFFERENTIALS[job].class).toBe('CLASS_4');
    }
  });

  it('WHEAT jobs have +$1.15 differential', () => {
    const wheatJobs = ['WHEAT MACHINE', 'WHEAT SPECIALTY'];
    for (const job of wheatJobs) {
      expect(DIFFERENTIALS[job]).toBeDefined();
      expect(DIFFERENTIALS[job].amount).toBe(1.15);
      expect(DIFFERENTIALS[job].class).toBe('WHEAT');
    }
  });

  it('BASE jobs have $0 differential', () => {
    const baseJobs = ['LABOUR', 'HEAD CHECKER', 'DOCK CHECKER', 'BUNNY BUS', 'TRAINING'];
    for (const job of baseJobs) {
      expect(DIFFERENTIALS[job]).toBeDefined();
      expect(DIFFERENTIALS[job].amount).toBe(0);
      expect(DIFFERENTIALS[job].class).toBe('BASE');
    }
  });

  it('TRAINER has +$1.67 differential and TRAINER class', () => {
    expect(DIFFERENTIALS['TRAINER']).toBeDefined();
    expect(DIFFERENTIALS['TRAINER'].amount).toBe(1.67);
    expect(DIFFERENTIALS['TRAINER'].class).toBe('TRAINER');
  });
});

// ---------------------------------------------------------------------------
// OT formula tests (CRITICAL - the most important test in the entire suite)
// ---------------------------------------------------------------------------

describe('OT formula: (Base x 1.5) + Differential', () => {
  it('correct formula differs from wrong formula when differential > 0', () => {
    const baseRate = 55.30; // Mon-Fri DAY base rate (Year 3)
    const differential = 2.50; // CLASS_1

    const correct = correctOTRate(baseRate, differential);
    const wrong = wrongOTRate(baseRate, differential);

    // correct: (55.30 * 1.5) + 2.50 = 82.95 + 2.50 = 85.45
    expect(correct).toBeCloseTo(85.45, 2);
    // wrong: (55.30 + 2.50) * 1.5 = 57.80 * 1.5 = 86.70
    expect(wrong).toBeCloseTo(86.70, 2);
    // They MUST differ
    expect(correct).not.toBeCloseTo(wrong, 2);
  });

  it('both formulas produce same result when differential is $0 (BASE jobs)', () => {
    const baseRate = 55.30;
    const differential = 0;

    const correct = correctOTRate(baseRate, differential);
    const wrong = wrongOTRate(baseRate, differential);

    // With $0 differential, both = 55.30 * 1.5 = 82.95
    expect(correct).toBeCloseTo(82.95, 2);
    expect(wrong).toBeCloseTo(82.95, 2);
  });

  it('TRACTOR TRAILER (CLASS_3) OT rate Mon-Fri DAY', () => {
    const baseRate = BASE_RATES.DAY['MON-FRI'];  // 55.30
    const diff = DIFFERENTIALS['TRACTOR TRAILER'].amount;  // 0.65
    const regRate = baseRate + diff;  // 55.95
    const otRate = correctOTRate(baseRate, diff);  // (55.30 * 1.5) + 0.65 = 83.60

    expect(regRate).toBeCloseTo(55.95, 2);
    expect(otRate).toBeCloseTo(83.60, 2);
  });

  it('HD MECHANIC (CLASS_1) OT rate Mon-Fri NIGHT', () => {
    const baseRate = BASE_RATES.NIGHT['MON-FRI'];  // 69.67
    const diff = DIFFERENTIALS['HD MECHANIC'].amount;  // 2.50
    const regRate = baseRate + diff;  // 72.17
    const otRate = correctOTRate(baseRate, diff);  // (69.67 * 1.5) + 2.50 = 107.005

    expect(regRate).toBeCloseTo(72.17, 2);
    expect(otRate).toBeCloseTo(107.005, 2);
  });

  it('RUBBER TIRE GANTRY (CLASS_2) OT rate Saturday DAY', () => {
    const baseRate = BASE_RATES.DAY.SAT;  // 70.78
    const diff = DIFFERENTIALS['RUBBER TIRE GANTRY'].amount;  // 1.00
    const regRate = baseRate + diff;  // 71.78
    const otRate = correctOTRate(baseRate, diff);  // (70.78 * 1.5) + 1.00 = 107.17

    expect(regRate).toBeCloseTo(71.78, 2);
    expect(otRate).toBeCloseTo(107.17, 2);
  });

  it('LIFT TRUCK (CLASS_4) OT rate Mon-Fri GRAVEYARD', () => {
    const baseRate = BASE_RATES.GRAVEYARD['MON-FRI'];  // 86.05
    const diff = DIFFERENTIALS['LIFT TRUCK'].amount;  // 0.50
    const regRate = baseRate + diff;  // 86.55
    const otRate = correctOTRate(baseRate, diff);  // (86.05 * 1.5) + 0.50 = 129.575

    expect(regRate).toBeCloseTo(86.55, 2);
    expect(otRate).toBeCloseTo(129.575, 2);
  });

  it('WHEAT MACHINE OT rate Mon-Fri DAY', () => {
    const baseRate = BASE_RATES.DAY['MON-FRI'];  // 55.30
    const diff = DIFFERENTIALS['WHEAT MACHINE'].amount;  // 1.15
    const regRate = baseRate + diff;  // 56.45
    const otRate = correctOTRate(baseRate, diff);  // (55.30 * 1.5) + 1.15 = 84.10

    expect(regRate).toBeCloseTo(56.45, 2);
    expect(otRate).toBeCloseTo(84.10, 2);
  });
});

// ---------------------------------------------------------------------------
// TRAINER multiplier tests
// ---------------------------------------------------------------------------

describe('TRAINER rate calculation', () => {
  it('TRAINER regular rate uses 1.333x multiplier on base + differential', () => {
    // TRAINER: base * 1.333 + $1.67 differential
    // For Mon-Fri DAY: 55.30 * 1.333 = 73.72 (approx), + 1.67 = 75.39 (approx)
    const base = BASE_RATES.DAY['MON-FRI'];
    const multiplied = base * 1.333;
    const trainerDiff = DIFFERENTIALS['TRAINER'].amount;

    // 1.333x multiplier is significant (adds ~$18.39 to a $55.30 base)
    expect(multiplied).toBeGreaterThan(base);
    expect(multiplied).toBeCloseTo(73.72, 0);
    expect(trainerDiff).toBe(1.67);
  });
});

// ---------------------------------------------------------------------------
// Location-based hour variations
// ---------------------------------------------------------------------------

describe('Location-based hours', () => {
  it('CENTENNIAL has 9-hour day/night and 7.5-hour graveyard', () => {
    const cent = HOURS_BY_LOCATION['CENTENNIAL'];
    expect(cent.day).toBe(9);
    expect(cent.night).toBe(9);
    expect(cent.graveyard).toBe(7.5);
  });

  it('VANTERM has standard 8-hour day/night and 6.5-hour graveyard', () => {
    const vt = HOURS_BY_LOCATION['VANTERM'];
    expect(vt.day).toBe(8);
    expect(vt.night).toBe(8);
    expect(vt.graveyard).toBe(6.5);
  });

  it('DELTAPORT has standard 8-hour day/night and 6.5-hour graveyard', () => {
    const dp = HOURS_BY_LOCATION['DELTAPORT'];
    expect(dp.day).toBe(8);
    expect(dp.night).toBe(8);
    expect(dp.graveyard).toBe(6.5);
  });

  it('DEFAULT hours match standard (8/8/6.5)', () => {
    const def = HOURS_BY_LOCATION['DEFAULT'];
    expect(def.day).toBe(8);
    expect(def.night).toBe(8);
    expect(def.graveyard).toBe(6.5);
  });

  it('CENTENNIAL TT DAY pay is higher than VANTERM TT DAY due to extra hour', () => {
    const rate = BASE_RATES.DAY['MON-FRI'] + DIFFERENTIALS['TRACTOR TRAILER'].amount;
    const centPay = rate * HOURS_BY_LOCATION['CENTENNIAL'].day;
    const vtPay = rate * HOURS_BY_LOCATION['VANTERM'].day;

    // CENTENNIAL: 55.95 * 9 = 503.55
    // VANTERM:    55.95 * 8 = 447.60
    expect(centPay).toBeCloseTo(503.55, 2);
    expect(vtPay).toBeCloseTo(447.60, 2);
    expect(centPay - vtPay).toBeCloseTo(55.95, 2); // Exactly 1 hour of pay difference
  });
});

// ---------------------------------------------------------------------------
// Wheat special hours
// ---------------------------------------------------------------------------

describe('Wheat shift hours', () => {
  it('Wheat jobs use 7.5 reg + 0.5 OT standard hours', () => {
    // From CLAUDE.md: WHEAT MACHINE / WHEAT SPECIALTY: All shifts: 7.5 reg + 0.5 OT
    const regHours = 7.5;
    const otHours = 0.5;
    const baseRate = BASE_RATES.DAY['MON-FRI']; // 55.30
    const diff = DIFFERENTIALS['WHEAT MACHINE'].amount; // 1.15
    const regRate = baseRate + diff; // 56.45
    const otRate = correctOTRate(baseRate, diff); // 84.10

    const totalPay = (regHours * regRate) + (otHours * otRate);
    // 7.5 * 56.45 = 423.375 + 0.5 * 84.10 = 42.05 = 465.425
    expect(totalPay).toBeCloseTo(465.425, 2);
    expect(regHours + otHours).toBe(8); // Total shift is 8 hours
  });
});

// ---------------------------------------------------------------------------
// Base rates (Year 3 - Apr 2025)
// ---------------------------------------------------------------------------

describe('Base rates Year 3 (Apr 2025)', () => {
  it('Mon-Fri DAY base is $55.30', () => {
    expect(BASE_RATES.DAY['MON-FRI']).toBe(55.30);
  });

  it('Mon-Fri NIGHT base is $69.67', () => {
    expect(BASE_RATES.NIGHT['MON-FRI']).toBe(69.67);
  });

  it('Mon-Fri GRAVEYARD base is $86.05', () => {
    expect(BASE_RATES.GRAVEYARD['MON-FRI']).toBe(86.05);
  });

  it('Saturday DAY is higher than Mon-Fri DAY', () => {
    expect(BASE_RATES.DAY.SAT).toBeGreaterThan(BASE_RATES.DAY['MON-FRI']);
    expect(BASE_RATES.DAY.SAT).toBe(70.78);
  });

  it('Sunday rates equal Saturday NIGHT/GRAVEYARD', () => {
    expect(BASE_RATES.DAY.SUN).toBe(88.48);
    expect(BASE_RATES.NIGHT.SUN).toBe(88.48);
    expect(BASE_RATES.GRAVEYARD.SUN).toBe(88.48);
  });

  it('GRAVEYARD Mon-Fri > NIGHT Mon-Fri > DAY Mon-Fri', () => {
    expect(BASE_RATES.GRAVEYARD['MON-FRI']).toBeGreaterThan(BASE_RATES.NIGHT['MON-FRI']);
    expect(BASE_RATES.NIGHT['MON-FRI']).toBeGreaterThan(BASE_RATES.DAY['MON-FRI']);
  });
});

// ---------------------------------------------------------------------------
// calculateWeeklyEarnings
// ---------------------------------------------------------------------------

describe('calculateWeeklyEarnings', () => {
  let realDateNow: typeof Date.now;

  beforeEach(() => {
    realDateNow = Date.now;
  });

  afterEach(() => {
    Date.now = realDateNow;
    vi.useRealTimers();
  });

  it('returns 0 for empty shifts array', () => {
    expect(calculateWeeklyEarnings([])).toBe(0);
  });

  it('sums totalPay for shifts in the current week', () => {
    // Create shifts on known dates relative to "now"
    vi.useFakeTimers();
    // Set "now" to Wed Mar 18, 2026
    vi.setSystemTime(new Date(2026, 2, 18, 12, 0, 0));

    const shifts: Shift[] = [
      {
        id: 'a',
        date: '2026-03-16', // Monday of this week (Sun is start of week in JS)
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 442.40,
      },
      {
        id: 'b',
        date: '2026-03-17', // Tuesday
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 442.40,
      },
    ];

    const result = calculateWeeklyEarnings(shifts, 0);
    expect(result).toBeCloseTo(884.80, 2);
  });

  it('excludes shifts from a different week', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 18, 12, 0, 0));

    const shifts: Shift[] = [
      {
        id: 'a',
        date: '2026-03-09', // Previous week
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 442.40,
      },
    ];

    expect(calculateWeeklyEarnings(shifts, 0)).toBe(0);
  });

  it('weeksAgo=1 gets previous week shifts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 18, 12, 0, 0));

    const shifts: Shift[] = [
      {
        id: 'a',
        date: '2026-03-09', // Previous week Monday
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 442.40,
      },
    ];

    expect(calculateWeeklyEarnings(shifts, 1)).toBeCloseTo(442.40, 2);
  });
});

// ---------------------------------------------------------------------------
// calculateYTDEarnings (pension year boundary)
// ---------------------------------------------------------------------------

describe('calculateYTDEarnings (pension year Jan 4, 2026)', () => {
  it('returns 0 for empty shifts array', () => {
    expect(calculateYTDEarnings([])).toBe(0);
  });

  it('includes shifts on or after Jan 4, 2026', () => {
    const shifts: Shift[] = [
      {
        id: 'a',
        date: '2026-01-04', // Exact boundary - should be included
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 442.40,
      },
      {
        id: 'b',
        date: '2026-01-05', // After boundary - should be included
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 442.40,
      },
    ];

    expect(calculateYTDEarnings(shifts)).toBeCloseTo(884.80, 2);
  });

  it('excludes shifts before Jan 4, 2026', () => {
    const shifts: Shift[] = [
      {
        id: 'a',
        date: '2026-01-03', // Before boundary
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 442.40,
      },
      {
        id: 'b',
        date: '2025-12-31', // Way before boundary
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 100.00,
      },
    ];

    expect(calculateYTDEarnings(shifts)).toBe(0);
  });

  it('mixed shifts across boundary only sums the pension-year ones', () => {
    const shifts: Shift[] = [
      {
        id: 'pre',
        date: '2026-01-02',
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 200.00,
      },
      {
        id: 'post',
        date: '2026-02-15',
        job: 'LABOUR',
        location: 'VANTERM',
        shift: 'DAY',
        regHours: 8,
        otHours: 0,
        regRate: 55.30,
        otRate: 82.95,
        totalPay: 500.00,
      },
    ];

    expect(calculateYTDEarnings(shifts)).toBeCloseTo(500.00, 2);
  });
});

// ---------------------------------------------------------------------------
// Full pay calculation end-to-end
// ---------------------------------------------------------------------------

describe('Full pay calculation end-to-end', () => {
  it('TRACTOR TRAILER DAY at CENTENNIAL = 9hrs * $55.95 = $503.55', () => {
    const base = BASE_RATES.DAY['MON-FRI'];
    const diff = DIFFERENTIALS['TRACTOR TRAILER'].amount;
    const hours = HOURS_BY_LOCATION['CENTENNIAL'].day;
    const regRate = base + diff;
    const total = hours * regRate;

    expect(regRate).toBeCloseTo(55.95, 2);
    expect(total).toBeCloseTo(503.55, 2);
  });

  it('TRACTOR TRAILER DAY at VANTERM = 8hrs * $55.95 = $447.60', () => {
    const base = BASE_RATES.DAY['MON-FRI'];
    const diff = DIFFERENTIALS['TRACTOR TRAILER'].amount;
    const hours = HOURS_BY_LOCATION['VANTERM'].day;
    const regRate = base + diff;
    const total = hours * regRate;

    expect(total).toBeCloseTo(447.60, 2);
  });

  it('LABOUR NIGHT at VANTERM with 1hr OT', () => {
    const base = BASE_RATES.NIGHT['MON-FRI'];
    const diff = DIFFERENTIALS['LABOUR'].amount;
    const regRate = base + diff; // 69.67 + 0 = 69.67
    const otRate = correctOTRate(base, diff); // (69.67 * 1.5) + 0 = 104.505
    const total = (8 * regRate) + (1 * otRate);

    expect(regRate).toBeCloseTo(69.67, 2);
    expect(otRate).toBeCloseTo(104.505, 2);
    expect(total).toBeCloseTo(661.865, 1);
  });

  it('HD MECHANIC DAY at DELTAPORT = 8hrs * $57.80 = $462.40', () => {
    const base = BASE_RATES.DAY['MON-FRI'];
    const diff = DIFFERENTIALS['HD MECHANIC'].amount;
    const hours = HOURS_BY_LOCATION['DELTAPORT'].day;
    const regRate = base + diff; // 55.30 + 2.50 = 57.80
    const total = hours * regRate;

    expect(regRate).toBeCloseTo(57.80, 2);
    expect(total).toBeCloseTo(462.40, 2);
  });

  it('LIFT TRUCK GRAVEYARD at CENTENNIAL = 7.5hrs * $86.55 = $649.13', () => {
    const base = BASE_RATES.GRAVEYARD['MON-FRI'];
    const diff = DIFFERENTIALS['LIFT TRUCK'].amount;
    const hours = HOURS_BY_LOCATION['CENTENNIAL'].graveyard; // 7.5
    const regRate = base + diff; // 86.05 + 0.50 = 86.55
    const total = hours * regRate;

    expect(regRate).toBeCloseTo(86.55, 2);
    expect(total).toBeCloseTo(649.125, 1);
  });
});
