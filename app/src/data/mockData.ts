// Mock data based on actual PORTPAL analysis
// 71,712 user shifts, 42 jobs, 24 locations

export interface Shift {
  id: string
  date: string
  job: string
  location: string
  subjob?: string
  shift: 'DAY' | 'NIGHT' | 'GRAVEYARD'
  regHours: number
  otHours: number
  regRate: number
  otRate: number
  totalPay: number
}

export interface PayRate {
  job: string
  differential: number
  differentialClass: string
}

// ALL canonical jobs from Bubble database
// Jobs we have PAYDIFFS data for are marked with hasData: true
export const JOBS = [
  '40 TON (TOP PICK)',
  'BULLDOZER',
  'BULK OPERATOR',
  'BUNNY BUS',
  'CARPENTER',
  'DOCK CHECKER',
  'DOCK GANTRY',
  'DOW MEN',
  'ELECTRICIAN',
  'EXCAVATOR',
  'FIRST AID',
  'FRONT END LOADER',
  'GEARPERSON',
  'HATCH TENDER/SIGNAL',
  'HD MECHANIC',
  'HEAD CHECKER',
  'KOMATSU',
  'LABOUR',
  'LIFT TRUCK',
  'LINES',
  'LIQUID BULK',
  'LOCI',
  'LOCKERMAN',
  'MILLWRIGHT',
  'MOBILE CRANE',
  'OB',
  'PAINTER',
  'PLUMBER',
  'PUSHER',
  'RAIL MOUNTED GANTRY',
  'REACHSTACKER',
  'RUBBER TIRE GANTRY',
  'SHIP GANTRY',
  'STORESPERSON',
  'SWITCHMAN',
  'TRACKMEN',
  'TRACTOR TRAILER',
  'TRAINER',
  'TRAINING',
  'WELDER',
  'WHEAT MACHINE',
  'WHEAT SPECIALTY',
  'WINCH DRIVER',
]

// ALL locations (standard terminals + wheat + others from user data)
export const LOCATIONS = [
  // Main terminals
  'CENTENNIAL',
  'VANTERM',
  'DELTAPORT',
  'FRASER SURREY',
  // Other terminals
  'LYNNTERM',
  'NEPTUNE',
  'VAN WHARVES',
  'CANADA PLACE',
  'PORT MOODY',
  'SQUAMISH',
  'FIBRECO',
  'ANNACIS AUTO',
  'BC SUGAR',
  'CHEMTRADE',
  'UNIVAR',
  'WATERFRONT TRAIN. CNTR',
  'WESTERN LOCKER',
  // Wheat terminals
  'ALLIANCE GRAIN',
  'G3',
  'CASCADIA',
  'RICHARDSON',
  'CARGILL',
  'VITERRA PAC',
]

// Subjobs by job - from user data analysis
// Jobs not listed here have no subjob options
export const SUBJOBS: Record<string, string[]> = {
  'TRACTOR TRAILER': ['RAIL (TT)', 'SHIP (TT)', 'YARD (TT)', 'BARGE (TT)'],
  'HEAD CHECKER': ['TOWER (HC)', 'RAIL (HC)', 'INGATE (HC)', 'OUTGATE (HC)', 'CANOPY (HC)', 'GOPHER (HC)', 'PENTHOUSE (HC)', 'REEFER (HC)'],
  'LABOUR': ['LASHING (LAB)', 'SHEDMEN (LAB)', 'COASTWISE (LAB)', 'UTILITY (LAB)', 'SPARE (LAB)', 'BLANK'],
  'FIRST AID': ['DOCK (FA)', 'SHIP (FA)'],
  'LIFT TRUCK': ['BLANK'],
  'DOCK CHECKER': ['BLANK'],
  'BULK OPERATOR': ['BLANK'],
  'LIQUID BULK': ['BLANK'],
}

// BCMEA Base rates Year 3 (Apr 2025)
export const BASE_RATES = {
  DAY: { 'MON-FRI': 55.30, SAT: 70.78, SUN: 88.48 },
  NIGHT: { 'MON-FRI': 69.67, SAT: 88.48, SUN: 88.48 },
  GRAVEYARD: { 'MON-FRI': 86.05, SAT: 88.48, SUN: 88.48 },
}

// Job differentials - KNOWN from BCMEA rates
// Jobs not listed here default to BASE rate ($0 differential)
export const DIFFERENTIALS: Record<string, { amount: number; class: string; hasData: boolean }> = {
  // CLASS_1: +$2.50 (verified)
  'HD MECHANIC': { amount: 2.50, class: 'CLASS_1', hasData: true },
  'CARPENTER': { amount: 2.50, class: 'CLASS_1', hasData: false },
  'ELECTRICIAN': { amount: 2.50, class: 'CLASS_1', hasData: true },
  'MILLWRIGHT': { amount: 2.50, class: 'CLASS_1', hasData: false },
  'PLUMBER': { amount: 2.50, class: 'CLASS_1', hasData: false },
  'TRACKMEN': { amount: 2.50, class: 'CLASS_1', hasData: false },
  'WELDER': { amount: 2.50, class: 'CLASS_1', hasData: false },

  // CLASS_2: +$1.00 (verified)
  'RUBBER TIRE GANTRY': { amount: 1.00, class: 'CLASS_2', hasData: true },
  'FIRST AID': { amount: 1.00, class: 'CLASS_2', hasData: true },
  'RAIL MOUNTED GANTRY': { amount: 1.00, class: 'CLASS_2', hasData: false },
  'SHIP GANTRY': { amount: 1.00, class: 'CLASS_2', hasData: false },
  'DOCK GANTRY': { amount: 1.00, class: 'CLASS_2', hasData: false },

  // CLASS_3: +$0.65 (verified)
  'TRACTOR TRAILER': { amount: 0.65, class: 'CLASS_3', hasData: true },
  'LOCI': { amount: 0.65, class: 'CLASS_3', hasData: true },
  '40 TON (TOP PICK)': { amount: 0.65, class: 'CLASS_3', hasData: true },
  'REACHSTACKER': { amount: 0.65, class: 'CLASS_3', hasData: true },
  'FRONT END LOADER': { amount: 0.65, class: 'CLASS_3', hasData: false },
  'BULLDOZER': { amount: 0.65, class: 'CLASS_3', hasData: false },
  'EXCAVATOR': { amount: 0.65, class: 'CLASS_3', hasData: false },
  'KOMATSU': { amount: 0.65, class: 'CLASS_3', hasData: false },
  'MOBILE CRANE': { amount: 0.65, class: 'CLASS_3', hasData: false },
  'WINCH DRIVER': { amount: 0.65, class: 'CLASS_3', hasData: false },

  // CLASS_4: +$0.50 (verified)
  'LIFT TRUCK': { amount: 0.50, class: 'CLASS_4', hasData: true },
  'STORESPERSON': { amount: 0.50, class: 'CLASS_4', hasData: false },
  'GEARPERSON': { amount: 0.50, class: 'CLASS_4', hasData: false },

  // WHEAT: +$1.15 (verified)
  'WHEAT MACHINE': { amount: 1.15, class: 'WHEAT', hasData: true },
  'WHEAT SPECIALTY': { amount: 1.15, class: 'WHEAT', hasData: true },

  // TRAINER: 1.333x + $1.67 (validated from user data)
  'TRAINER': { amount: 1.67, class: 'TRAINER', hasData: true },

  // BASE: $0 differential
  'LABOUR': { amount: 0, class: 'BASE', hasData: true },
  'HEAD CHECKER': { amount: 0, class: 'BASE', hasData: true },
  'DOCK CHECKER': { amount: 0, class: 'BASE', hasData: true },
  'BUNNY BUS': { amount: 0, class: 'BASE', hasData: false },
  'TRAINING': { amount: 0, class: 'BASE', hasData: true },
  'BULK OPERATOR': { amount: 0, class: 'BASE', hasData: true },
  'LIQUID BULK': { amount: 0, class: 'BASE', hasData: true },
  'LOCKERMAN': { amount: 0, class: 'BASE', hasData: false },
  'LINES': { amount: 0, class: 'BASE', hasData: false },
  'HATCH TENDER/SIGNAL': { amount: 0, class: 'BASE', hasData: false },
  'DOW MEN': { amount: 0, class: 'BASE', hasData: false },
  'PUSHER': { amount: 0, class: 'BASE', hasData: false },
  'SWITCHMAN': { amount: 0, class: 'BASE', hasData: false },
  'PAINTER': { amount: 0, class: 'BASE', hasData: false },
  'OB': { amount: 0, class: 'BASE', hasData: false },
}

// Hours by location (CENTENNIAL has longer shifts)
export const HOURS_BY_LOCATION: Record<string, { day: number; night: number; graveyard: number }> = {
  CENTENNIAL: { day: 9, night: 9, graveyard: 7.5 },
  VANTERM: { day: 8, night: 8, graveyard: 6.5 },
  DELTAPORT: { day: 8, night: 8, graveyard: 6.5 },
  DEFAULT: { day: 8, night: 8, graveyard: 6.5 },
}

// Generate sample shifts for the current user
export function generateSampleShifts(): Shift[] {
  const shifts: Shift[] = []
  const today = new Date()

  // Last 2 weeks of shifts
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Skip some days randomly (not everyone works every day)
    if (Math.random() > 0.7) continue

    const job = JOBS[Math.floor(Math.random() * 6)] // Top 6 jobs
    const location = LOCATIONS[Math.floor(Math.random() * 5)] // Top 5 locations
    const shiftTypes: ('DAY' | 'NIGHT' | 'GRAVEYARD')[] = ['DAY', 'NIGHT', 'GRAVEYARD']
    const shift = shiftTypes[Math.floor(Math.random() * 3)]

    const hours = HOURS_BY_LOCATION[location] || HOURS_BY_LOCATION.DEFAULT
    const regHours = shift === 'DAY' ? hours.day : shift === 'NIGHT' ? hours.night : hours.graveyard
    const otHours = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0

    const diff = DIFFERENTIALS[job] || { amount: 0, class: 'BASE' }
    const dayOfWeek = date.getDay()
    const dayType = dayOfWeek === 0 ? 'SUN' : dayOfWeek === 6 ? 'SAT' : 'MON-FRI'

    let baseRate = BASE_RATES[shift][dayType]
    if (job === 'TRAINER') {
      baseRate = baseRate * 1.333333 + 1.67
    } else {
      baseRate = baseRate + diff.amount
    }

    const regRate = Math.round(baseRate * 100) / 100
    const otRate = Math.round(regRate * 1.5 * 100) / 100
    const totalPay = Math.round((regHours * regRate + otHours * otRate) * 100) / 100

    shifts.push({
      id: `shift-${i}`,
      date: date.toISOString().split('T')[0],
      job,
      location,
      subjob: SUBJOBS[job]?.[Math.floor(Math.random() * SUBJOBS[job].length)],
      shift,
      regHours,
      otHours,
      regRate,
      otRate,
      totalPay,
    })
  }

  return shifts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// User stats
export const USER_STATS = {
  name: 'Mike Thompson',
  seniority: 2847,
  board: 'A',
  pensionGoal: 120000,
  vacationRate: 0.04,
  currentStreak: 12,
  longestStreak: 28,
  totalShiftsLogged: 347,
  joinDate: '2023-04-15',
}

// Calculate weekly earnings
export function calculateWeeklyEarnings(shifts: Shift[], weeksAgo = 0): number {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() - (weeksAgo * 7))
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  return shifts
    .filter(s => {
      const shiftDate = new Date(s.date)
      return shiftDate >= startOfWeek && shiftDate < endOfWeek
    })
    .reduce((sum, s) => sum + s.totalPay, 0)
}

// Calculate YTD earnings (Jan 4, 2026 start for pension year)
export function calculateYTDEarnings(shifts: Shift[]): number {
  const pensionYearStart = new Date('2026-01-04')
  return shifts
    .filter(s => new Date(s.date) >= pensionYearStart)
    .reduce((sum, s) => sum + s.totalPay, 0)
}
