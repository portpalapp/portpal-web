/**
 * Shared date, currency, and hours formatting utilities.
 *
 * IMPORTANT: All date helpers use timezone-safe patterns.
 *   - Today's date is generated with getFullYear/getMonth/getDate (local TZ).
 *   - Date strings are compared lexicographically (no `new Date(dateString)`).
 *   - When a Date object is needed from a YYYY-MM-DD string we append
 *     'T12:00:00' so noon local time avoids any day-boundary issues.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Parse a YYYY-MM-DD string into local-timezone component parts. */
function parseDateParts(dateStr: string): { year: number; month: number; day: number; date: Date } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d, date: new Date(y, m - 1, d) };
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/**
 * Returns "Today", "Yesterday", or "Mon, Jan 5" format.
 * Uses string comparison for timezone safety.
 */
export function formatDateRelative(dateStr: string): string {
  if (!dateStr) return '';
  const todayStr = getTodayStr();

  if (dateStr.slice(0, 10) === todayStr) {
    return 'Today';
  }

  const now = new Date();
  now.setDate(now.getDate() - 1);
  const yesterdayStr = getLocalDateStr(now);

  if (dateStr.slice(0, 10) === yesterdayStr) {
    return 'Yesterday';
  }

  return formatDateShort(dateStr);
}

/**
 * Returns "Mon, Jan 5" format (weekday short, month short, day).
 * No relative labelling.
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const { date } = parseDateParts(dateStr);
  const wd = WEEKDAYS_SHORT[date.getDay()];
  const mo = MONTHS_SHORT[date.getMonth()];
  return `${wd}, ${mo} ${date.getDate()}`;
}

/**
 * Returns "Monday, January 5, 2026" format (full weekday, full month, day, year).
 */
export function formatDateLong(dateStr: string): string {
  const { date } = parseDateParts(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns "Jan 5" format (month short, day).
 */
export function formatDateCompact(dateStr: string): string {
  if (!dateStr) return '';
  const { date } = parseDateParts(dateStr);
  const mo = MONTHS_SHORT[date.getMonth()];
  return `${mo} ${date.getDate()}`;
}

/**
 * Returns "Mar 7, 2026" format (month short, day, year).
 * Matches the old `formatDateDisplay` from shifts.tsx.
 */
export function formatDateMedium(dateStr: string): string {
  const { date } = parseDateParts(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

/** Returns "$1,234.56" format. */
export function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Returns "$1.2K" for amounts >= 1000, "$456" for smaller amounts. */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(1) + 'K';
  }
  return '$' + Math.round(amount).toString();
}

// ---------------------------------------------------------------------------
// Hours formatting
// ---------------------------------------------------------------------------

/** Returns "8h" or "8.5h". */
export function formatHours(hours: number): string {
  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
}

// ---------------------------------------------------------------------------
// Timezone-safe date helpers
// ---------------------------------------------------------------------------

/** Returns YYYY-MM-DD for today in local timezone (not UTC). */
export function getTodayStr(): string {
  const now = new Date();
  return getLocalDateStr(now);
}

/** Converts a Date object to a YYYY-MM-DD string in local timezone. */
export function getLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
