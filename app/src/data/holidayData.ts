export interface StatHoliday {
  name: string;
  date: string; // YYYY-MM-DD
  countingPeriodStart: string; // YYYY-MM-DD
  countingPeriodEnd: string; // YYYY-MM-DD
}

export const STAT_HOLIDAYS_2026: StatHoliday[] = [
  { name: 'Family Day', date: '2026-02-16', countingPeriodStart: '2026-01-18', countingPeriodEnd: '2026-02-14' },
  { name: 'Good Friday', date: '2026-04-03', countingPeriodStart: '2026-03-01', countingPeriodEnd: '2026-03-28' },
  { name: 'Easter Monday', date: '2026-04-06', countingPeriodStart: '2026-03-08', countingPeriodEnd: '2026-04-04' },
  { name: 'Victoria Day', date: '2026-05-18', countingPeriodStart: '2026-04-19', countingPeriodEnd: '2026-05-16' },
  { name: 'Canada Day', date: '2026-07-01', countingPeriodStart: '2026-05-31', countingPeriodEnd: '2026-06-27' },
  { name: 'BC Day', date: '2026-08-03', countingPeriodStart: '2026-07-05', countingPeriodEnd: '2026-08-01' },
  { name: 'Labour Day', date: '2026-09-07', countingPeriodStart: '2026-08-09', countingPeriodEnd: '2026-09-05' },
  { name: 'National Day for Truth & Reconciliation', date: '2026-09-30', countingPeriodStart: '2026-08-30', countingPeriodEnd: '2026-09-26' },
  { name: 'Thanksgiving', date: '2026-10-12', countingPeriodStart: '2026-09-13', countingPeriodEnd: '2026-10-10' },
  { name: 'Remembrance Day', date: '2026-11-11', countingPeriodStart: '2026-10-11', countingPeriodEnd: '2026-11-07' },
  { name: 'Christmas Day', date: '2026-12-25', countingPeriodStart: '2026-11-22', countingPeriodEnd: '2026-12-19' },
  { name: 'Boxing Day', date: '2026-12-26', countingPeriodStart: '2026-11-22', countingPeriodEnd: '2026-12-19' },
  { name: "New Year's Day", date: '2027-01-01', countingPeriodStart: '2026-11-29', countingPeriodEnd: '2026-12-26' },
];

/**
 * Returns the next N upcoming stat holidays from today.
 */
export function getUpcomingHolidays(count: number): StatHoliday[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  return STAT_HOLIDAYS_2026
    .filter((h) => h.date >= todayStr)
    .slice(0, count);
}

/**
 * Returns the holiday if the given date is a stat holiday, or null.
 */
export function getHolidayOnDate(dateStr: string): StatHoliday | null {
  return STAT_HOLIDAYS_2026.find((h) => h.date === dateStr) ?? null;
}

/**
 * Calculates stat holiday pay based on shifts worked in the counting period.
 * - 15+ shifts = full 8 hours pay
 * - 1-14 shifts = (shiftsInPeriod / 20) * 8 * dailyRate
 * - 0 shifts = 0
 */
export function calculateStatPay(shiftsInPeriod: number, dailyRate: number): number {
  if (shiftsInPeriod <= 0) return 0;
  if (shiftsInPeriod >= 15) return 8 * dailyRate;
  return (shiftsInPeriod / 20) * 8 * dailyRate;
}

/**
 * Returns the number of days from today until the given date string (YYYY-MM-DD).
 * Positive = future, negative = past.
 */
export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export const STAT_PAY_RULES = {
  summary: 'Stat holiday pay is based on shifts worked in the 4-week counting period before the holiday week.',
  rules: [
    '15+ shifts in counting period = full 8 hours pay',
    '1-14 shifts = 1/20th of a day\'s pay per shift worked',
    'Even 1 shift in the counting period earns some stat pay',
    'Counting period = 4 full weeks (Sun-Sat) prior to the week of the holiday',
  ],
  workingHolidayPay: 'If you work ON the stat holiday, you receive double time + stat pay.',
  vacationRules: [
    'Book off 4+ consecutive days (if you have that many available)',
    'Less than 4 days: report full allotment in one consecutive block',
    'Can report as far into the future as you like',
    'Can only go back max 7 days',
    'ALL 2026 vacation must be reported by noon December 24, 2026',
  ],
};
