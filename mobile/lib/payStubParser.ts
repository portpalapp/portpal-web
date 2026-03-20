import {
  TERMINAL_NAME_MAP,
  COMPANY_CODE_MAP,
  YEAR_3_BASE_RATES,
  DIFFERENTIAL_AMOUNTS,
  DIFFERENTIAL_JOBS,
  inferDiffClassFromRate,
  getImportedJobLabel,
  type ParsedPayStub,
  type PayStubShift,
  type PayStubDeductions,
  type ShiftComparison,
  type MatchStatus,
} from '../data/payStubTypes';
import type { Shift } from '../data/mockData';

// ── Time Card Detail Parser ──────────────────────────────────────────────────

interface TimeCardLine {
  shiftType: 'DAY' | 'NIGHT' | 'GRAVEYARD';
  month: number;
  day: number;
  companyCode: string;
  rate: number;
  terminalRaw: string;
  hours: number;
}

function parseTimeCardLines(text: string): TimeCardLine[] {
  const lines: TimeCardLine[] = [];

  // Find TIME CARD DETAIL section
  const tcIdx = text.indexOf('TIME CARD DETAIL');
  if (tcIdx === -1) return lines;
  const tcText = text.substring(tcIdx);

  // Match lines like: DAY 12/01 CO071 55.80 DPWORLD CENTERM 08.00
  // or: DAY 11/24 CO002 55.30 GCT CANADA 01.50
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

// ── Map terminal name to app location ────────────────────────────────────────

function mapTerminal(raw: string, companyCode: string): string {
  // Try full raw match first
  const direct = TERMINAL_NAME_MAP[raw.toUpperCase()];
  if (direct) return direct;

  // Try company code
  const codeMap = COMPANY_CODE_MAP[companyCode];
  if (codeMap) return codeMap.appLocation;

  // Try partial matches
  for (const [key, value] of Object.entries(TERMINAL_NAME_MAP)) {
    if (raw.toUpperCase().includes(key)) return value;
  }

  return raw;
}

// ── Determine day type from date ─────────────────────────────────────────────

function getDayType(date: Date): 'MON-FRI' | 'SAT' | 'SUN-HOL' {
  const dow = date.getDay();
  if (dow === 0) return 'SUN-HOL';
  if (dow === 6) return 'SAT';
  return 'MON-FRI';
}

// ── Group time card lines into shifts ────────────────────────────────────────

function groupIntoShifts(lines: TimeCardLine[], year: number): PayStubShift[] {
  // Group by date + company code
  const groups = new Map<string, TimeCardLine[]>();

  for (const line of lines) {
    const key = `${line.month}-${line.day}-${line.companyCode}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(line);
  }

  const shifts: PayStubShift[] = [];

  for (const [, groupLines] of groups) {
    // Sort by hours desc — line with most hours is likely regular
    const sorted = [...groupLines].sort((a, b) => b.hours - a.hours);
    const first = sorted[0];

    const dateStr = `${year}-${String(first.month).padStart(2, '0')}-${String(first.day).padStart(2, '0')}`;
    const dateObj = new Date(year, first.month - 1, first.day);
    const dayType = getDayType(dateObj);
    const appLocation = mapTerminal(first.terminalRaw, first.companyCode);

    // Determine regular line: most hours, rate in reasonable range for regular
    let regRate = 0;
    let regHours = 0;
    let regAmount = 0;
    let otRate = 0;
    let otHours = 0;
    let otAmount = 0;
    let travelRate: number | undefined;
    let travelHours: number | undefined;

    for (const line of sorted) {
      // Check if this is overtime (rate > regular × 1.3)
      if (regRate > 0 && line.rate > regRate * 1.3) {
        otRate = line.rate;
        otHours += line.hours;
        otAmount += line.rate * line.hours;
      }
      // Check if this is travel (small hours, lower rate, same date already has reg)
      else if (regRate > 0 && line.hours <= 2 && line.rate <= regRate) {
        travelRate = line.rate;
        travelHours = (travelHours || 0) + line.hours;
      }
      // This is the regular entry
      else if (regRate === 0 || line.hours > regHours) {
        // If we already set a reg and this has more hours, swap
        if (regRate > 0 && regHours > 0) {
          // The previous "reg" was actually travel or something else
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

    // Infer differential class
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

  // Sort by date
  return shifts.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Parse header info ────────────────────────────────────────────────────────

function parseHeaderDate(text: string, label: string): string {
  // Look for YYYYMMDD format near the label
  const regex = new RegExp(label + '.*?(\\d{8})', 's');
  const match = text.match(regex);
  if (!match) return '';
  const d = match[1];
  return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
}

// ── Parse net pay ────────────────────────────────────────────────────────────

function parseNetPay(text: string): number {
  const match = text.match(/NET PAY[:\s]+([\d,.]+)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(',', ''));
}

// ── Parse total earnings / gross ─────────────────────────────────────────────

function parseTotals(text: string) {
  const earningsMatch = text.match(/TOTAL EARNINGS\s+([\d,.]+)/);
  const grossMatch = text.match(/TOTAL GROSS\s+([\d,.]+)/);
  return {
    totalEarnings: earningsMatch ? parseFloat(earningsMatch[1].replace(',', '')) : 0,
    totalGross: grossMatch ? parseFloat(grossMatch[1].replace(',', '')) : 0,
  };
}

// ── Parse deductions ─────────────────────────────────────────────────────────

function parseDeductions(text: string): PayStubDeductions {
  const find = (label: string): number => {
    // Match current amount (first number after label)
    const regex = new RegExp(label + '\\s+([\\d,.]+)', 'i');
    const match = text.match(regex);
    return match ? parseFloat(match[1].replace(',', '')) : 0;
  };

  const govtPension = find('GOVT PEN');
  const federalTax = find('FEDL TAX');
  const welfare = find('WLFARE L');
  const eiContribution = find('EI CONT');
  const unionDues = find('UNION500') || find('UNION');
  const groupLife = find('GRPLIFEL');

  return {
    govtPension,
    federalTax,
    welfare,
    eiContribution,
    unionDues,
    groupLife,
    total: govtPension + federalTax + welfare + eiContribution + unionDues + groupLife,
  };
}

// ── Parse YTD info ───────────────────────────────────────────────────────────

function parseYTD(text: string) {
  const findYTD = (label: string): number => {
    const regex = new RegExp(label + '\\s+[\\d,.]+\\s+([\\d,.]+)');
    const match = text.match(regex);
    return match ? parseFloat(match[1].replace(',', '')) : 0;
  };

  return {
    ytdEarnings: findYTD('TAX YTD HR/\\$') || findYTD('CONTYTD HR/\\$'),
    ytdTax: findYTD('YTD TAX'),
    ytdCpp: findYTD('\\*YTD CPP/QPP'),
    ytdEi: findYTD('YTD EI'),
  };
}

// ── Main parse function ──────────────────────────────────────────────────────

export function parsePayStubText(text: string): ParsedPayStub {
  const paymentDate = parseHeaderDate(text, 'PAYMENT DATE');
  const payEndDate = parseHeaderDate(text, 'PAY END DATE');
  const year = paymentDate ? parseInt(paymentDate.substring(0, 4)) : new Date().getFullYear();

  // Parse pay period number
  const periodMatch = text.match(/NO\.\s*PAY PER\.?\s*:?\s*(\d+)\s+(?:OF\s+)?(\d+)/i);
  const payPeriod = periodMatch ? parseInt(periodMatch[1]) : 0;
  const totalPayPeriods = periodMatch ? parseInt(periodMatch[2]) : 52;

  // Parse employee name
  const nameMatch = text.match(/(?:V10E\d?\s+\w+\s+\d+\s*\*?\s*\n)(.+?)(?:\n)/);
  const employeeName = nameMatch ? nameMatch[1].trim() : '';

  // Parse time card details into shifts
  const tcLines = parseTimeCardLines(text);
  const shifts = groupIntoShifts(tcLines, year);

  const totals = parseTotals(text);
  const netPay = parseNetPay(text);
  const deductions = parseDeductions(text);
  const ytd = parseYTD(text);

  // Parse vacation
  const vacMatch = text.match(/VACTAKEN\/BAL\s+([\d.]+)\s+([\d.]+)/);

  return {
    paymentDate,
    payEndDate,
    payPeriod,
    totalPayPeriods,
    employeeName,
    shifts,
    totalEarnings: totals.totalEarnings,
    totalGross: totals.totalGross,
    netPay,
    deductions,
    ytdEarnings: ytd.ytdEarnings,
    ytdTax: ytd.ytdTax,
    ytdCpp: ytd.ytdCpp,
    ytdEi: ytd.ytdEi,
    vacationTaken: vacMatch ? parseFloat(vacMatch[1]) : 0,
    vacationBalance: vacMatch ? parseFloat(vacMatch[2]) : 0,
  };
}

// ── Compare pay stub shifts against app shifts ───────────────────────────────

export function comparePayStub(stub: ParsedPayStub, appShifts: Shift[]): ShiftComparison[] {
  const comparisons: ShiftComparison[] = [];

  // For each stub shift, find matching app shift
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

// ── Demo Data (pre-parsed from actual BCMEA pay stubs) ───────────────────────

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
