import {
  TERMINAL_NAME_MAP,
  COMPANY_CODE_MAP,
  inferDiffClassFromRate,
  type ParsedPayStub,
  type PayStubShift,
  type ShiftComparison,
  type MatchStatus,
} from '../data/payStubTypes';
import type { Shift } from '../hooks/useShifts';

// -- Time Card Detail Parser --

interface TimeCardLine {
  shiftType: 'DAY' | 'NIGHT' | 'GRAVEYARD';
  month: number;
  day: number;
  companyCode: string;
  rate: number;
  terminalRaw: string;
  hours: number;
}

export function parseTimeCardLines(text: string): TimeCardLine[] {
  const lines: TimeCardLine[] = [];

  // Find TIME CARD DETAIL section
  const tcIdx = text.indexOf('TIME CARD DETAIL');
  if (tcIdx === -1) return lines;
  const tcText = text.substring(tcIdx);

  // Match lines like: DAY 12/01 CO071 55.80 DPWORLD CENTERM 08.00
  const lineRegex = /(DAY|NIGHT|GRV|GRAVEYARD)\s+(\d{2})\/(\d{2})\s+(CO\d+)\s+([\d.]+)\s+(.+?)\s+([\d.]+)\s*$/gm;

  let match;
  while ((match = lineRegex.exec(tcText)) !== null) {
    const shiftStr = match[1];
    const shiftType = shiftStr === 'GRV' ? 'GRAVEYARD' : shiftStr as 'DAY' | 'NIGHT' | 'GRAVEYARD';

    lines.push({
      shiftType,
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      companyCode: match[4],
      rate: parseFloat(match[5]),
      terminalRaw: match[6].trim(),
      hours: parseFloat(match[7]),
    });
  }

  return lines;
}

// -- Map terminal name to app location --

function mapTerminal(raw: string, companyCode: string): string {
  const direct = TERMINAL_NAME_MAP[raw.toUpperCase()];
  if (direct) return direct;

  const codeMap = COMPANY_CODE_MAP[companyCode];
  if (codeMap) return codeMap.appLocation;

  for (const [key, value] of Object.entries(TERMINAL_NAME_MAP)) {
    if (raw.toUpperCase().includes(key)) return value;
  }

  return raw;
}

// -- Determine day type from date --

function getDayType(date: Date): 'MON-FRI' | 'SAT' | 'SUN-HOL' {
  const dow = date.getDay();
  if (dow === 0) return 'SUN-HOL';
  if (dow === 6) return 'SAT';
  return 'MON-FRI';
}

// -- Group time card lines into shifts --

export function groupIntoShifts(lines: TimeCardLine[], year: number): PayStubShift[] {
  const groups = new Map<string, TimeCardLine[]>();

  for (const line of lines) {
    const key = `${line.month}-${line.day}-${line.companyCode}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(line);
  }

  const shifts: PayStubShift[] = [];

  for (const [, groupLines] of groups) {
    const sorted = [...groupLines].sort((a, b) => b.hours - a.hours);
    const first = sorted[0];

    const dateStr = `${year}-${String(first.month).padStart(2, '0')}-${String(first.day).padStart(2, '0')}`;
    const dateObj = new Date(year, first.month - 1, first.day);
    const dayType = getDayType(dateObj);
    const appLocation = mapTerminal(first.terminalRaw, first.companyCode);

    let regRate = 0;
    let regHours = 0;
    let regAmount = 0;
    let otRate = 0;
    let otHours = 0;
    let otAmount = 0;
    let travelRate: number | undefined;
    let travelHours: number | undefined;

    for (const line of sorted) {
      if (regRate > 0 && line.rate > regRate * 1.3) {
        otRate = line.rate;
        otHours += line.hours;
        otAmount += line.rate * line.hours;
      } else if (regRate > 0 && line.hours <= 2 && line.rate <= regRate) {
        travelRate = line.rate;
        travelHours = (travelHours || 0) + line.hours;
      } else if (regRate === 0 || line.hours > regHours) {
        if (regRate > 0 && regHours > 0) {
          if (regHours <= 2) {
            travelRate = regRate;
            travelHours = regHours;
          }
        }
        regRate = line.rate;
        regHours = line.hours;
        regAmount = line.rate * line.hours;
      }
    }

    const diffInfo = inferDiffClassFromRate(regRate, dayType, first.shiftType);

    shifts.push({
      date: dateStr,
      shiftType: first.shiftType,
      companyCode: first.companyCode,
      terminalRaw: first.terminalRaw,
      locationRaw: first.terminalRaw,
      appLocation,
      regRate: Math.round(regRate * 100) / 100,
      regHours,
      regAmount: Math.round(regAmount * 100) / 100,
      otRate: Math.round(otRate * 100) / 100,
      otHours,
      otAmount: Math.round(otAmount * 100) / 100,
      travelRate,
      travelHours,
      totalAmount: Math.round((regAmount + otAmount + (travelRate && travelHours ? travelRate * travelHours : 0)) * 100) / 100,
      inferredDiffClass: diffInfo?.diffClass || 'UNKNOWN',
      possibleJobs: diffInfo?.possibleJobs || [],
    });
  }

  return shifts.sort((a, b) => a.date.localeCompare(b.date));
}

// -- Compare pay stub shifts against app shifts --

export function comparePayStub(stub: ParsedPayStub, appShifts: Shift[]): ShiftComparison[] {
  const comparisons: ShiftComparison[] = [];

  for (const stubShift of stub.shifts) {
    const matching = appShifts.filter(
      (s) => s.date === stubShift.date && s.shift === stubShift.shiftType
    );

    if (matching.length === 0) {
      comparisons.push({
        date: stubShift.date,
        stubShift,
        status: 'MISSING_IN_APP',
      });
    } else {
      const appShift = matching[0];
      const rateDiff = Math.abs(stubShift.regRate - appShift.regRate);
      const hoursDiff = Math.abs(stubShift.regHours - appShift.regHours) + Math.abs(stubShift.otHours - appShift.otHours);
      const payDiff = Math.abs(stubShift.totalAmount - appShift.totalPay);

      let status: MatchStatus = 'MATCH';
      if (rateDiff > 0.10) status = 'RATE_DIFF';
      else if (hoursDiff > 0.1) status = 'HOURS_DIFF';

      comparisons.push({
        date: stubShift.date,
        stubShift,
        appShift: {
          id: appShift.id,
          job: appShift.job,
          location: appShift.location,
          shift: appShift.shift,
          regHours: appShift.regHours,
          otHours: appShift.otHours,
          regRate: appShift.regRate,
          totalPay: appShift.totalPay,
        },
        status,
        rateDifference: rateDiff > 0.10 ? Math.round((stubShift.regRate - appShift.regRate) * 100) / 100 : undefined,
        hoursDifference: hoursDiff > 0.1 ? Math.round(hoursDiff * 100) / 100 : undefined,
        payDifference: payDiff > 0.50 ? Math.round((stubShift.totalAmount - appShift.totalPay) * 100) / 100 : undefined,
      });
    }
  }

  // Check for app shifts in the pay period that aren't on the stub
  const stubDates = new Set(stub.shifts.map((s) => s.date));
  const periodStart = stub.payEndDate
    ? (() => {
        const end = new Date(stub.payEndDate);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        return start.toISOString().split('T')[0];
      })()
    : '';

  if (periodStart) {
    for (const appShift of appShifts) {
      if (appShift.date >= periodStart && appShift.date <= stub.payEndDate && !stubDates.has(appShift.date)) {
        comparisons.push({
          date: appShift.date,
          appShift: {
            id: appShift.id,
            job: appShift.job,
            location: appShift.location,
            shift: appShift.shift,
            regHours: appShift.regHours,
            otHours: appShift.otHours,
            regRate: appShift.regRate,
            totalPay: appShift.totalPay,
          },
          status: 'MISSING_ON_STUB',
        });
      }
    }
  }

  return comparisons.sort((a, b) => a.date.localeCompare(b.date));
}

// -- Demo Data (pre-parsed from actual BCMEA pay stubs) --

export function getDemoPayStubs(): ParsedPayStub[] {
  return [
    // Pay Period 50 (Dec 1-6, 2025)
    {
      paymentDate: '2025-12-11',
      payEndDate: '2025-12-06',
      payPeriod: 50,
      totalPayPeriods: 52,
      employeeName: 'RUP ROBYN',
      shifts: [
        {
          date: '2025-12-01',
          shiftType: 'DAY',
          companyCode: 'CO071',
          terminalRaw: 'DPWORLD CENTERM',
          locationRaw: 'DPWORLD CENTERM',
          appLocation: 'CENTENNIAL',
          regRate: 55.80,
          regHours: 8,
          regAmount: 446.40,
          otRate: 0,
          otHours: 0,
          otAmount: 0,
          totalAmount: 446.40,
          inferredDiffClass: 'CLASS_4',
          possibleJobs: ['LIFT TRUCK', 'STORESPERSON', 'GEARPERSON'],
        },
        {
          date: '2025-12-02',
          shiftType: 'DAY',
          companyCode: 'CO068',
          terminalRaw: 'PCT',
          locationRaw: 'PCT',
          appLocation: 'PCT',
          regRate: 56.30,
          regHours: 8,
          regAmount: 450.40,
          otRate: 83.95,
          otHours: 1,
          otAmount: 83.95,
          totalAmount: 534.35,
          inferredDiffClass: 'CLASS_2',
          possibleJobs: ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY'],
        },
        {
          date: '2025-12-03',
          shiftType: 'DAY',
          companyCode: 'CO068',
          terminalRaw: 'PCT',
          locationRaw: 'PCT',
          appLocation: 'PCT',
          regRate: 56.30,
          regHours: 8,
          regAmount: 450.40,
          otRate: 83.95,
          otHours: 1,
          otAmount: 83.95,
          totalAmount: 534.35,
          inferredDiffClass: 'CLASS_2',
          possibleJobs: ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY'],
        },
        {
          date: '2025-12-04',
          shiftType: 'DAY',
          companyCode: 'CO068',
          terminalRaw: 'PCT',
          locationRaw: 'PCT',
          appLocation: 'PCT',
          regRate: 56.30,
          regHours: 8,
          regAmount: 450.40,
          otRate: 83.95,
          otHours: 1,
          otAmount: 83.95,
          totalAmount: 534.35,
          inferredDiffClass: 'CLASS_2',
          possibleJobs: ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY'],
        },
      ],
      totalEarnings: 2053.45,
      totalGross: 2049.45,
      netPay: 1545.59,
      deductions: {
        govtPension: 0,
        federalTax: 426.81,
        welfare: 12.60,
        eiContribution: 0,
        unionDues: 55.00,
        groupLife: 9.45,
        total: 503.86,
      },
      ytdEarnings: 120302.67,
      ytdTax: 29220.70,
      ytdCpp: 4430.10,
      ytdEi: 1077.48,
      vacationTaken: 4,
      vacationBalance: 2,
    },
    // Pay Period 49 (Nov 24-29, 2025)
    {
      paymentDate: '2025-12-04',
      payEndDate: '2025-11-29',
      payPeriod: 49,
      totalPayPeriods: 52,
      employeeName: 'RUP ROBYN',
      shifts: [
        {
          date: '2025-11-24',
          shiftType: 'DAY',
          companyCode: 'CO002',
          terminalRaw: 'GCT CANADA',
          locationRaw: 'GCT CANADA',
          appLocation: 'VANTERM',
          regRate: 55.80,
          regHours: 8,
          regAmount: 446.40,
          otRate: 0,
          otHours: 0,
          otAmount: 0,
          travelRate: 55.30,
          travelHours: 1.5,
          totalAmount: 529.35,
          inferredDiffClass: 'CLASS_4',
          possibleJobs: ['LIFT TRUCK', 'STORESPERSON', 'GEARPERSON'],
        },
        {
          date: '2025-11-25',
          shiftType: 'DAY',
          companyCode: 'CO068',
          terminalRaw: 'PCT',
          locationRaw: 'PCT',
          appLocation: 'PCT',
          regRate: 56.30,
          regHours: 8,
          regAmount: 450.40,
          otRate: 83.95,
          otHours: 1,
          otAmount: 83.95,
          totalAmount: 534.35,
          inferredDiffClass: 'CLASS_2',
          possibleJobs: ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY'],
        },
        {
          date: '2025-11-26',
          shiftType: 'DAY',
          companyCode: 'CO068',
          terminalRaw: 'PCT',
          locationRaw: 'PCT',
          appLocation: 'PCT',
          regRate: 56.30,
          regHours: 8,
          regAmount: 450.40,
          otRate: 83.95,
          otHours: 1,
          otAmount: 83.95,
          totalAmount: 534.35,
          inferredDiffClass: 'CLASS_2',
          possibleJobs: ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY'],
        },
        {
          date: '2025-11-27',
          shiftType: 'DAY',
          companyCode: 'CO071',
          terminalRaw: 'DPWORLD CENTERM',
          locationRaw: 'DPWORLD CENTERM',
          appLocation: 'CENTENNIAL',
          regRate: 55.95,
          regHours: 9,
          regAmount: 503.55,
          otRate: 0,
          otHours: 0,
          otAmount: 0,
          totalAmount: 503.55,
          inferredDiffClass: 'CLASS_3',
          possibleJobs: ['TRACTOR TRAILER', 'LOCI', 'REACHSTACKER', '40 TON (TOP PICK)', 'FRONT END LOADER', 'BULLDOZER', 'EXCAVATOR', 'KOMATSU', 'MOBILE CRANE', 'WINCH DRIVER'],
        },
      ],
      totalEarnings: 4806.59,
      totalGross: 4802.59,
      netPay: 3263.84,
      deductions: {
        govtPension: 0,
        federalTax: 1515.75,
        welfare: 13.14,
        eiContribution: 0,
        unionDues: 0,
        groupLife: 9.86,
        total: 1538.75,
      },
      ytdEarnings: 118253.22,
      ytdTax: 28793.89,
      ytdCpp: 4430.10,
      ytdEi: 1077.48,
      vacationTaken: 4,
      vacationBalance: 2,
    },
    // Pay Period 48 (Nov 17-22, 2025)
    {
      paymentDate: '2025-11-27',
      payEndDate: '2025-11-22',
      payPeriod: 48,
      totalPayPeriods: 52,
      employeeName: 'RUP ROBYN',
      shifts: [
        {
          date: '2025-11-17',
          shiftType: 'DAY',
          companyCode: 'CO066',
          terminalRaw: 'FIBRECO EXPORT',
          locationRaw: 'FIBRECO EXPORT',
          appLocation: 'FIBRECO',
          regRate: 56.30,
          regHours: 8,
          regAmount: 450.40,
          otRate: 0,
          otHours: 0,
          otAmount: 0,
          totalAmount: 450.40,
          inferredDiffClass: 'CLASS_2',
          possibleJobs: ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY'],
        },
        {
          date: '2025-11-18',
          shiftType: 'DAY',
          companyCode: 'CO071',
          terminalRaw: 'DPWORLD CENTERM',
          locationRaw: 'DPWORLD CENTERM',
          appLocation: 'CENTENNIAL',
          regRate: 55.95,
          regHours: 9,
          regAmount: 503.55,
          otRate: 0,
          otHours: 0,
          otAmount: 0,
          totalAmount: 503.55,
          inferredDiffClass: 'CLASS_3',
          possibleJobs: ['TRACTOR TRAILER', 'LOCI', 'REACHSTACKER', '40 TON (TOP PICK)', 'FRONT END LOADER', 'BULLDOZER', 'EXCAVATOR', 'KOMATSU', 'MOBILE CRANE', 'WINCH DRIVER'],
        },
        {
          date: '2025-11-19',
          shiftType: 'DAY',
          companyCode: 'CO071',
          terminalRaw: 'DPWORLD CENTERM',
          locationRaw: 'DPWORLD CENTERM',
          appLocation: 'CENTENNIAL',
          regRate: 55.30,
          regHours: 8,
          regAmount: 442.40,
          otRate: 82.95,
          otHours: 1,
          otAmount: 82.95,
          totalAmount: 525.35,
          inferredDiffClass: 'BASE',
          possibleJobs: ['LABOUR', 'HEAD CHECKER', 'DOCK CHECKER', 'BUNNY BUS', 'TRAINING'],
        },
        {
          date: '2025-11-20',
          shiftType: 'DAY',
          companyCode: 'CO071',
          terminalRaw: 'DPWORLD CENTERM',
          locationRaw: 'DPWORLD CENTERM',
          appLocation: 'CENTENNIAL',
          regRate: 56.30,
          regHours: 9,
          regAmount: 506.70,
          otRate: 0,
          otHours: 0,
          otAmount: 0,
          totalAmount: 506.70,
          inferredDiffClass: 'CLASS_2',
          possibleJobs: ['RUBBER TIRE GANTRY', 'FIRST AID', 'RAIL MOUNTED GANTRY', 'SHIP GANTRY', 'DOCK GANTRY'],
        },
      ],
      totalEarnings: 1990.00,
      totalGross: 1986.00,
      netPay: 1541.88,
      deductions: {
        govtPension: 0,
        federalTax: 422.07,
        welfare: 12.60,
        eiContribution: 0,
        unionDues: 0,
        groupLife: 9.45,
        total: 444.12,
      },
      ytdEarnings: 113450.63,
      ytdTax: 27278.14,
      ytdCpp: 4430.10,
      ytdEi: 1077.48,
      vacationTaken: 4,
      vacationBalance: 2,
    },
  ];
}
