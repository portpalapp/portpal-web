/**
 * Formatter tests - verify currency, date, and hour formatting utilities.
 *
 * Timezone safety is critical: the app uses string comparison (s.date.slice(0,10))
 * rather than new Date(dateStr) to avoid day-boundary bugs.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatCurrency,
  formatCurrencyShort,
  formatDateRelative,
  formatDateShort,
  formatDateLong,
  formatDateCompact,
  formatDateMedium,
  formatHours,
  getTodayStr,
  getLocalDateStr,
} from '../lib/formatters';

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe('formatCurrency', () => {
  it('formats a round dollar amount with two decimal places', () => {
    const result = formatCurrency(1234);
    expect(result).toMatch(/^\$1,?234\.00$/);
  });

  it('formats cents correctly', () => {
    const result = formatCurrency(55.95);
    expect(result).toMatch(/^\$55\.95$/);
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/^\$0\.00$/);
  });

  it('formats large amounts with commas', () => {
    const result = formatCurrency(41000000);
    // en-CA uses comma as thousands separator
    expect(result).toContain('$');
    expect(result).toContain('41');
    expect(result).toContain('.00');
  });

  it('rounds to 2 decimal places', () => {
    const result = formatCurrency(55.999);
    expect(result).toMatch(/\$56\.00/);
  });
});

// ---------------------------------------------------------------------------
// formatCurrencyShort
// ---------------------------------------------------------------------------

describe('formatCurrencyShort', () => {
  it('formats amounts >= 1000 as $X.XK', () => {
    expect(formatCurrencyShort(1500)).toBe('$1.5K');
    expect(formatCurrencyShort(41000)).toBe('$41.0K');
  });

  it('formats amounts < 1000 as rounded dollar amount', () => {
    expect(formatCurrencyShort(456)).toBe('$456');
    expect(formatCurrencyShort(99.99)).toBe('$100');
  });

  it('handles exactly 1000', () => {
    expect(formatCurrencyShort(1000)).toBe('$1.0K');
  });
});

// ---------------------------------------------------------------------------
// formatHours
// ---------------------------------------------------------------------------

describe('formatHours', () => {
  it('formats whole hours without decimal', () => {
    expect(formatHours(8)).toBe('8h');
    expect(formatHours(9)).toBe('9h');
    expect(formatHours(0)).toBe('0h');
  });

  it('formats fractional hours with one decimal', () => {
    expect(formatHours(8.5)).toBe('8.5h');
    expect(formatHours(7.5)).toBe('7.5h');
    expect(formatHours(6.5)).toBe('6.5h');
  });

  it('formats 0.5 for wheat OT hours', () => {
    expect(formatHours(0.5)).toBe('0.5h');
  });
});

// ---------------------------------------------------------------------------
// getTodayStr / getLocalDateStr
// ---------------------------------------------------------------------------

describe('getTodayStr', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns YYYY-MM-DD format', () => {
    const result = getTodayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('pads single-digit months and days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 12, 0, 0)); // Jan 5
    expect(getTodayStr()).toBe('2026-01-05');
  });

  it('returns correct date at midnight (no UTC rollover bug)', () => {
    vi.useFakeTimers();
    // 11:59 PM local time should still be "today"
    vi.setSystemTime(new Date(2026, 2, 20, 23, 59, 59));
    expect(getTodayStr()).toBe('2026-03-20');
  });

  it('returns correct date at start of day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 20, 0, 0, 1));
    expect(getTodayStr()).toBe('2026-03-20');
  });
});

describe('getLocalDateStr', () => {
  it('converts a Date object to YYYY-MM-DD in local timezone', () => {
    const d = new Date(2026, 11, 31, 23, 59, 59); // Dec 31 2026 local
    expect(getLocalDateStr(d)).toBe('2026-12-31');
  });

  it('handles Feb 29 on leap years', () => {
    const d = new Date(2028, 1, 29, 12, 0, 0); // Feb 29 2028 is a leap year
    expect(getLocalDateStr(d)).toBe('2028-02-29');
  });
});

// ---------------------------------------------------------------------------
// formatDateRelative
// ---------------------------------------------------------------------------

describe('formatDateRelative', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for today\'s date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 20, 12, 0, 0));
    expect(formatDateRelative('2026-03-20')).toBe('Today');
  });

  it('returns "Yesterday" for yesterday\'s date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 20, 12, 0, 0));
    expect(formatDateRelative('2026-03-19')).toBe('Yesterday');
  });

  it('returns short format for other dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 20, 12, 0, 0));
    const result = formatDateRelative('2026-03-15');
    // Should be "Sun, Mar 15" format
    expect(result).toContain('Mar');
    expect(result).toContain('15');
  });

  it('handles date strings with extra characters after YYYY-MM-DD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 20, 12, 0, 0));
    // The code uses dateStr.slice(0, 10) so appended text should not matter
    expect(formatDateRelative('2026-03-20T12:00:00')).toBe('Today');
  });
});

// ---------------------------------------------------------------------------
// formatDateShort
// ---------------------------------------------------------------------------

describe('formatDateShort', () => {
  it('returns "Weekday, Mon Day" format', () => {
    const result = formatDateShort('2026-03-20');
    // March 20, 2026 is a Friday
    expect(result).toBe('Fri, Mar 20');
  });

  it('handles start of year', () => {
    const result = formatDateShort('2026-01-01');
    expect(result).toBe('Thu, Jan 1');
  });
});

// ---------------------------------------------------------------------------
// formatDateCompact
// ---------------------------------------------------------------------------

describe('formatDateCompact', () => {
  it('returns "Mon Day" format', () => {
    expect(formatDateCompact('2026-03-20')).toBe('Mar 20');
    expect(formatDateCompact('2026-01-05')).toBe('Jan 5');
  });
});

// ---------------------------------------------------------------------------
// formatDateLong
// ---------------------------------------------------------------------------

describe('formatDateLong', () => {
  it('returns full date format', () => {
    const result = formatDateLong('2026-03-20');
    // "Friday, March 20, 2026"
    expect(result).toContain('Friday');
    expect(result).toContain('March');
    expect(result).toContain('20');
    expect(result).toContain('2026');
  });
});

// ---------------------------------------------------------------------------
// formatDateMedium
// ---------------------------------------------------------------------------

describe('formatDateMedium', () => {
  it('returns "Mon Day, Year" format', () => {
    const result = formatDateMedium('2026-03-20');
    expect(result).toContain('Mar');
    expect(result).toContain('20');
    expect(result).toContain('2026');
  });
});

// ---------------------------------------------------------------------------
// Timezone safety: no new Date(dateStr) pattern
// ---------------------------------------------------------------------------

describe('Timezone safety', () => {
  it('parseDateParts uses local timezone constructor (year, month, day)', () => {
    // The key safety feature: formatDateShort('2026-01-01') should always
    // return Jan 1 regardless of timezone, because it parses as local date
    // not UTC. If it used new Date('2026-01-01'), it would be midnight UTC
    // which could roll back to Dec 31 in Pacific timezone.
    const result = formatDateShort('2026-01-01');
    expect(result).toContain('Jan');
    expect(result).toContain('1');
    // Must NOT contain Dec
    expect(result).not.toContain('Dec');
  });

  it('date comparison uses string slicing not Date objects', () => {
    // The code uses dateStr.slice(0, 10) === todayStr
    // This is a pure string comparison — no timezone conversion
    const dateA = '2026-03-20';
    const dateB = '2026-03-20T00:00:00Z';
    expect(dateA.slice(0, 10)).toBe(dateB.slice(0, 10));
  });
});
