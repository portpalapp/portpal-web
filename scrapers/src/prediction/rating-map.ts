/**
 * Dispatch Prediction — Rating Code Mapping & Helpers
 *
 * Maps BCMEA board rating codes to work-info dispatch categories.
 * Provides helpers for parsing rating strings and checking category eligibility.
 */

// ── Rating → Category Mapping ──
// Maps individual board rating codes to work-info sections.
// Derived from BCMEA casual board colour codes and job category assignments.
// Workers with a given rating code are eligible for dispatch in that category.

export const RATING_TO_CATEGORIES: Record<string, string[]> = {
  // Machine ratings
  'D':  ['Machine'],            // Dock Lift Truck / general machine
  'M':  ['Machine'],            // Ship Lift Truck / machine specialty
  'B':  ['Machine'],            // Backhoe / Bulldozer
  'L':  ['Machine'],            // Front End Loader
  'F':  ['Machine'],            // Dock Heavy Lift / Fork
  'U':  ['Machine'],            // Pusher / utility machine
  'K':  ['Machine'],            // Komatsu
  'N':  ['Machine'],            // Bombadier

  // Hold / labour
  'C':  ['Hold', 'Warehouse'],  // Holdmen / general cargo
  'C1': ['Hold'],               // Holdmen specialty
  'C2': ['Hold'],               // Holdmen - Steel

  // Warehouse
  'W':  ['Warehouse'],          // Warehouse / Barge Ramp

  // Surplus / specialty
  'S':  ['Surplus'],            // Surplus / RMG / RTG
  'R':  ['Surplus', 'Rail'],    // Rail / Surplus crossover
  'Q':  ['Surplus'],            // Surplus specialty

  // Topside / crane
  'A':  ['Topside'],            // Dock Gantry / crane
  'G':  ['Topside'],            // Ship Gantry
  'T':  ['Topside'],            // Topside general
  'E':  ['Topside'],            // Heede Crane
  'J':  ['Topside'],            // Mobile Crane / Red Dog
  'I':  ['Topside'],            // Crane specialty
  'P':  ['Topside'],            // Crane specialty

  // Trades
  'V':  ['Trades'],             // Trades general
  'X':  ['Trades'],             // Trades specialty

  // Z-codes: specialty / zone-based, generally NOT dispatch-eligible for main categories
  'Z1': [], 'Z2': [], 'Z3': [], 'Z4': [], 'Z5': [],
  'Z6': [], 'Z7': [], 'Z8': [], 'Z9': [],
};

// Dispatch order for categories (observed from analysis data)
// Trades dispatch first, Hold last among the main categories.
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
];

// Board dispatch priority order (seniority)
export const BOARD_ORDER = ['a', 'b', 'c', 't', '00', 'r'];

// Day-of-week names
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Default union/casual split ratios by day-of-week
// Sunday/Saturday: union members grab more (premium pay)
// Weekdays: more jobs left for casuals
export const DEFAULT_UNION_SPLIT_BY_DOW: Record<number, number> = {
  0: 0.55, // Sunday — union takes ~55%
  1: 0.30, // Monday — union takes ~30%
  2: 0.30, // Tuesday
  3: 0.30, // Wednesday
  4: 0.30, // Thursday
  5: 0.35, // Friday
  6: 0.50, // Saturday — union takes ~50%
};

// Shift label to work-info format
export const SHIFT_FORMAT_MAP: Record<string, string> = {
  '0800': '08:00',
  '1630': '16:30',
  '0100': '01:00',
};

// ── Casual Button Description → Predictor Category Mapping ──
// Maps the button description suffix (after "Casual X Board - ") to predictor categories.
// "Day"/"Night"/"1 AM" are shift-general buttons used for Hold/Warehouse/Dock (non-specialty).
// Specialty categories have their own buttons.

export const CASUAL_BUTTON_TO_CATEGORY: Record<string, string> = {
  // Machine sub-types
  'Heavy Lift Truck':     'Machine',
  'Driving':              'Machine',
  'Tractor Trailer':      'Machine',

  // Topside (only on A board)
  'Topside':              'Topside',

  // Surplus / RTG
  'R.T.G.':               'Surplus',

  // Checkers
  'Head Checking':        'Checkers',
  'Checking':             'Checkers',

  // Wheat
  'Wheat Machine':        'Wheat',
  'Wheat Specialty':      'Wheat',

  // Trades sub-types
  'Heavy Duty Mechanic':  'Trades',
  'Millwright':           'Trades',
  'Electrician':          'Trades',
  'Welder':               'Trades',
  'Carpenter':            'Trades',
  'Plumber':              'Trades',
  'Automotive Mechanic':  'Trades',

  // Rail
  'Rail':                 'Rail',
};

// Shift code → button description shift suffix
export const SHIFT_TO_BUTTON_SUFFIX: Record<string, string> = {
  '0800': 'Day',
  '1630': 'Night',
  '0100': '1 AM',
};

// Categories that use the general shift button (Day/Night/1 AM) rather than a specific one
export const GENERAL_BUTTON_CATEGORIES = new Set([
  'Hold',
  'Warehouse',
  'Dock',
  'Gearperson',
  'First Aid',
]);

// ── Rating Helpers ──

/** Parse rating string into individual codes */
export function parseRatings(raw: string): string[] {
  if (!raw) return [];
  const codes = raw.match(/Z\d|C[12]|[A-Z]/g) || [];
  return [...new Set(codes)];
}

/** Check if a worker's ratings qualify them for a given category */
export function isRatedForCategory(ratings: string[], category: string): boolean {
  for (const code of ratings) {
    const categories = RATING_TO_CATEGORIES[code] || [];
    if (categories.includes(category)) return true;
  }
  // Special: workers with NO ratings can still be dispatched for Hold (basic labour)
  if (category === 'Hold' && ratings.length === 0) return true;
  // Special: Wheat dispatches from Warehouse-eligible workers
  if (category === 'Wheat') {
    return ratings.some(c => (RATING_TO_CATEGORIES[c] || []).includes('Warehouse'));
  }
  return false;
}
