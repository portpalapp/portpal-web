/**
 * Dispatch Prediction — Rating Code Mapping & Helpers
 *
 * Ported from ~/portpal/scrapers/src/prediction/rating-map.ts
 * Pure constants and helpers — no dependencies.
 */

// Rating code -> eligible dispatch categories
export const RATING_TO_CATEGORIES: Record<string, string[]> = {
  // Machine ratings
  'D':  ['Machine'],
  'M':  ['Machine'],
  'B':  ['Machine'],
  'L':  ['Machine'],
  'F':  ['Machine'],
  'U':  ['Machine'],
  'K':  ['Machine'],
  'N':  ['Machine'],

  // Hold / labour
  'C':  ['Hold', 'Warehouse'],
  'C1': ['Hold'],
  'C2': ['Hold'],

  // Warehouse
  'W':  ['Warehouse'],

  // Surplus / specialty
  'S':  ['Surplus'],
  'R':  ['Surplus', 'Rail'],
  'Q':  ['Surplus'],

  // Topside / crane
  'A':  ['Topside'],
  'G':  ['Topside'],
  'T':  ['Topside'],
  'E':  ['Topside'],
  'J':  ['Topside'],
  'I':  ['Topside'],
  'P':  ['Topside'],

  // Trades
  'V':  ['Trades'],
  'X':  ['Trades'],

  // Z-codes: specialty / zone-based, generally NOT dispatch-eligible
  'Z1': [], 'Z2': [], 'Z3': [], 'Z4': [], 'Z5': [],
  'Z6': [], 'Z7': [], 'Z8': [], 'Z9': [],
}

// Dispatch order for categories (observed from analysis data)
export const DEFAULT_DISPATCH_ORDER: string[] = [
  'Trades',
  'Topside',
  'Surplus',
  'Rail',
  'Wheat',
  'Machine',
  'Warehouse',
  'Hold',
  'Gearperson',
  'Checkers',
  'Dock',
  'First Aid',
]

// Board dispatch priority order (seniority)
export const BOARD_ORDER = ['a', 'b', 'c', 't', '00', 'r']

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Default union/casual split ratios by day-of-week
export const DEFAULT_UNION_SPLIT_BY_DOW: Record<number, number> = {
  0: 0.55, // Sunday
  1: 0.30, // Monday
  2: 0.30, // Tuesday
  3: 0.30, // Wednesday
  4: 0.30, // Thursday
  5: 0.35, // Friday
  6: 0.50, // Saturday
}

// Shift label to work-info format
export const SHIFT_FORMAT_MAP: Record<string, string> = {
  '0800': '08:00',
  '1630': '16:30',
  '0100': '01:00',
}

/** Parse rating string into individual codes */
export function parseRatings(raw: string): string[] {
  if (!raw) return []
  const codes = raw.match(/Z\d|C[12]|[A-Z]/g) || []
  return [...new Set(codes)]
}

/** Check if a worker's ratings qualify them for a given category */
export function isRatedForCategory(ratings: string[], category: string): boolean {
  for (const code of ratings) {
    const categories = RATING_TO_CATEGORIES[code] || []
    if (categories.includes(category)) return true
  }
  // Workers with NO ratings can still be dispatched for Hold (basic labour)
  if (category === 'Hold' && ratings.length === 0) return true
  // Wheat dispatches from Warehouse-eligible workers
  if (category === 'Wheat') {
    return ratings.some(c => (RATING_TO_CATEGORIES[c] || []).includes('Warehouse'))
  }
  return false
}
