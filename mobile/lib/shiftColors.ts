/**
 * Shared shift-type and job color definitions.
 *
 * Centralises the color constants that were previously duplicated across
 * index.tsx, calendar.tsx, and analytics.tsx.
 */

import type { Ionicons } from '@expo/vector-icons';

export type ShiftType = 'DAY' | 'NIGHT' | 'GRAVEYARD';

// ---------------------------------------------------------------------------
// Shift type colours
// ---------------------------------------------------------------------------

export const SHIFT_COLORS: Record<ShiftType, { bg: string; text: string; accent: string }> = {
  DAY:       { bg: 'bg-amber-100',  text: 'text-amber-800',  accent: '#fbbf24' },
  NIGHT:     { bg: 'bg-blue-100',   text: 'text-blue-800',   accent: '#2563eb' },
  GRAVEYARD: { bg: 'bg-purple-100', text: 'text-purple-800', accent: '#9333ea' },
};

/**
 * Returns a Tailwind `bg-*` class for chart bar / indicator colours.
 * Matches the pattern used in index.tsx `shiftBarColor` and
 * calendar.tsx `getShiftBarColor`.
 */
export function getShiftBarColor(shiftType: string): string {
  switch (shiftType) {
    case 'DAY':       return 'bg-amber-400';
    case 'NIGHT':     return 'bg-blue-600';
    case 'GRAVEYARD': return 'bg-purple-600';
    default:          return 'bg-slate-400';
  }
}

/**
 * Returns a Tailwind `bg-*` class for smaller dot indicators (e.g. calendar dots).
 */
export function getShiftDotColor(shiftType: string): string {
  switch (shiftType) {
    case 'DAY':       return 'bg-amber-400';
    case 'NIGHT':     return 'bg-blue-400';
    case 'GRAVEYARD': return 'bg-purple-400';
    default:          return 'bg-slate-400';
  }
}

/**
 * Returns the hex accent colour for a given shift type.
 * Useful for chart segments and styled components that need raw hex values.
 */
export function getShiftAccentHex(shiftType: string): string {
  switch (shiftType) {
    case 'DAY':       return '#fbbf24';
    case 'NIGHT':     return '#2563eb';
    case 'GRAVEYARD': return '#9333ea';
    default:          return '#94a3b8';
  }
}

// ---------------------------------------------------------------------------
// Job colours  (grouped by differential class)
// ---------------------------------------------------------------------------

export const JOB_COLORS: Record<string, { bg: string; accent: string }> = {
  // CLASS_3 - Equipment operators (blues)
  'TRACTOR TRAILER':   { bg: 'bg-blue-100',   accent: 'bg-blue-500' },
  'LOCI':              { bg: 'bg-sky-100',     accent: 'bg-sky-500' },
  '40 TON (TOP PICK)': { bg: 'bg-blue-100',   accent: 'bg-blue-600' },
  'REACHSTACKER':      { bg: 'bg-indigo-100',  accent: 'bg-indigo-500' },
  'FRONT END LOADER':  { bg: 'bg-blue-100',   accent: 'bg-blue-400' },
  'BULLDOZER':         { bg: 'bg-slate-200',   accent: 'bg-slate-600' },
  'EXCAVATOR':         { bg: 'bg-stone-100',   accent: 'bg-stone-500' },
  'KOMATSU':           { bg: 'bg-zinc-100',    accent: 'bg-zinc-500' },
  'MOBILE CRANE':      { bg: 'bg-sky-100',     accent: 'bg-sky-600' },
  'HEAD CHECKER':      { bg: 'bg-green-100',   accent: 'bg-green-500' },
  'SWITCHMAN':         { bg: 'bg-teal-100',    accent: 'bg-teal-600' },
  // CLASS_2 - Operators/gantry (oranges/cyans)
  'RUBBER TIRE GANTRY':  { bg: 'bg-orange-100', accent: 'bg-orange-500' },
  'FIRST AID':           { bg: 'bg-red-100',    accent: 'bg-red-500' },
  'RAIL MOUNTED GANTRY': { bg: 'bg-amber-100',  accent: 'bg-amber-600' },
  'SHIP GANTRY':         { bg: 'bg-cyan-100',   accent: 'bg-cyan-500' },
  'DOCK GANTRY':         { bg: 'bg-cyan-100',   accent: 'bg-cyan-600' },
  'WINCH DRIVER':        { bg: 'bg-orange-100', accent: 'bg-orange-600' },
  'BULK OPERATOR':       { bg: 'bg-amber-100',  accent: 'bg-amber-500' },
  'HATCH TENDER/SIGNAL': { bg: 'bg-rose-100',   accent: 'bg-rose-500' },
  'STORESPERSON':        { bg: 'bg-orange-100', accent: 'bg-orange-400' },
  // CLASS_1 - Trades (purples)
  'HD MECHANIC':  { bg: 'bg-purple-100',  accent: 'bg-purple-500' },
  'CARPENTER':    { bg: 'bg-purple-100',  accent: 'bg-purple-400' },
  'ELECTRICIAN':  { bg: 'bg-violet-100',  accent: 'bg-violet-500' },
  'MILLWRIGHT':   { bg: 'bg-purple-100',  accent: 'bg-purple-600' },
  'PLUMBER':      { bg: 'bg-fuchsia-100', accent: 'bg-fuchsia-500' },
  'TRACKMEN':     { bg: 'bg-purple-100',  accent: 'bg-purple-300' },
  'WELDER':       { bg: 'bg-red-100',     accent: 'bg-red-600' },
  // CLASS_4 (yellows)
  'LIFT TRUCK':  { bg: 'bg-yellow-100', accent: 'bg-yellow-500' },
  'GEARPERSON':  { bg: 'bg-yellow-100', accent: 'bg-yellow-600' },
  // BASE (neutrals)
  'LABOUR':       { bg: 'bg-slate-100',   accent: 'bg-slate-500' },
  'DOCK CHECKER': { bg: 'bg-emerald-100', accent: 'bg-emerald-500' },
  'BUNNY BUS':    { bg: 'bg-lime-100',    accent: 'bg-lime-500' },
  'TRAINING':     { bg: 'bg-slate-100',   accent: 'bg-slate-400' },
  'LIQUID BULK':  { bg: 'bg-sky-100',     accent: 'bg-sky-400' },
  'LOCKERMAN':    { bg: 'bg-slate-100',   accent: 'bg-slate-600' },
  'LINES':        { bg: 'bg-teal-100',    accent: 'bg-teal-500' },
  'DOW MEN':      { bg: 'bg-slate-100',   accent: 'bg-slate-500' },
  'PUSHER':       { bg: 'bg-slate-200',   accent: 'bg-slate-600' },
  'PAINTER':      { bg: 'bg-pink-100',    accent: 'bg-pink-500' },
  'OB':           { bg: 'bg-slate-100',   accent: 'bg-slate-400' },
  // WHEAT (greens)
  'WHEAT MACHINE':   { bg: 'bg-emerald-100', accent: 'bg-emerald-500' },
  'WHEAT SPECIALTY': { bg: 'bg-green-100',   accent: 'bg-green-600' },
  // TRAINER (pink)
  'TRAINER': { bg: 'bg-pink-100', accent: 'bg-pink-500' },
};

export const DEFAULT_JOB_COLOR = { bg: 'bg-indigo-100', accent: 'bg-indigo-500' };

/** Look up a job's colour, falling back to the indigo default. */
export function getJobColor(job: string): { bg: string; accent: string } {
  return JOB_COLORS[job] || DEFAULT_JOB_COLOR;
}

// ---------------------------------------------------------------------------
// Job icons  (comprehensive Ionicons mapping)
// ---------------------------------------------------------------------------

export const JOB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'TRACTOR TRAILER':     'bus-outline',
  'LOCI':                'train-outline',
  '40 TON (TOP PICK)':   'cube-outline',
  'REACHSTACKER':        'albums-outline',
  'FRONT END LOADER':    'car-outline',
  'BULLDOZER':           'construct-outline',
  'EXCAVATOR':           'construct-outline',
  'KOMATSU':             'cog-outline',
  'MOBILE CRANE':        'trending-up-outline',
  'HEAD CHECKER':        'clipboard-outline',
  'SWITCHMAN':           'git-branch-outline',
  'RUBBER TIRE GANTRY':  'grid-outline',
  'FIRST AID':           'medkit-outline',
  'RAIL MOUNTED GANTRY': 'git-network-outline',
  'SHIP GANTRY':         'boat-outline',
  'DOCK GANTRY':         'resize-outline',
  'WINCH DRIVER':        'sync-outline',
  'BULK OPERATOR':       'layers-outline',
  'HATCH TENDER/SIGNAL': 'flag-outline',
  'STORESPERSON':        'file-tray-stacked-outline',
  'HD MECHANIC':         'build-outline',
  'CARPENTER':           'hammer-outline',
  'ELECTRICIAN':         'flash-outline',
  'MILLWRIGHT':          'settings-outline',
  'PLUMBER':             'water-outline',
  'TRACKMEN':            'trail-sign-outline',
  'WELDER':              'flame-outline',
  'LIFT TRUCK':          'arrow-up-circle-outline',
  'GEARPERSON':          'cog-outline',
  'LABOUR':              'body-outline',
  'DOCK CHECKER':        'checkmark-circle-outline',
  'BUNNY BUS':           'car-outline',
  'TRAINING':            'book-outline',
  'LIQUID BULK':         'water-outline',
  'LOCKERMAN':           'lock-closed-outline',
  'LINES':               'link-outline',
  'DOW MEN':             'flask-outline',
  'PUSHER':              'megaphone-outline',
  'PAINTER':             'color-palette-outline',
  'OB':                  'list-outline',
  'WHEAT MACHINE':       'nutrition-outline',
  'WHEAT SPECIALTY':     'leaf-outline',
  'TRAINER':             'school-outline',
};

export const DEFAULT_JOB_ICON: keyof typeof Ionicons.glyphMap = 'ellipse';

/** Look up a job's Ionicon name, falling back to the generic ellipse. */
export function getJobIcon(job: string): keyof typeof Ionicons.glyphMap {
  return JOB_ICONS[job] || DEFAULT_JOB_ICON;
}

// ---------------------------------------------------------------------------
// Job accent hex colours (for icon tinting)
// ---------------------------------------------------------------------------

export const JOB_ACCENT_HEX: Record<string, string> = {
  'TRACTOR TRAILER': '#3b82f6', 'LOCI': '#0ea5e9', '40 TON (TOP PICK)': '#2563eb',
  'REACHSTACKER': '#6366f1', 'FRONT END LOADER': '#60a5fa', 'BULLDOZER': '#475569',
  'EXCAVATOR': '#78716c', 'KOMATSU': '#71717a', 'MOBILE CRANE': '#0284c7',
  'HEAD CHECKER': '#22c55e', 'SWITCHMAN': '#0d9488',
  'RUBBER TIRE GANTRY': '#f97316', 'FIRST AID': '#ef4444', 'RAIL MOUNTED GANTRY': '#d97706',
  'SHIP GANTRY': '#06b6d4', 'DOCK GANTRY': '#0891b2', 'WINCH DRIVER': '#ea580c',
  'BULK OPERATOR': '#f59e0b', 'HATCH TENDER/SIGNAL': '#f43f5e', 'STORESPERSON': '#fb923c',
  'HD MECHANIC': '#a855f7', 'CARPENTER': '#c084fc', 'ELECTRICIAN': '#8b5cf6',
  'MILLWRIGHT': '#9333ea', 'PLUMBER': '#d946ef', 'TRACKMEN': '#d8b4fe', 'WELDER': '#dc2626',
  'LIFT TRUCK': '#eab308', 'GEARPERSON': '#ca8a04',
  'LABOUR': '#64748b', 'DOCK CHECKER': '#10b981', 'BUNNY BUS': '#84cc16',
  'TRAINING': '#94a3b8', 'LIQUID BULK': '#38bdf8', 'LOCKERMAN': '#475569',
  'LINES': '#14b8a6', 'DOW MEN': '#64748b', 'PUSHER': '#475569',
  'PAINTER': '#ec4899', 'OB': '#94a3b8',
  'WHEAT MACHINE': '#10b981', 'WHEAT SPECIALTY': '#16a34a', 'TRAINER': '#ec4899',
};

export const DEFAULT_ACCENT_HEX = '#6366f1';

/** Look up a job's hex accent colour for icon tinting. */
export function getJobAccentHex(job: string): string {
  return JOB_ACCENT_HEX[job] || DEFAULT_ACCENT_HEX;
}
