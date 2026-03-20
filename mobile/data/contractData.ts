// ============================================================================
// ILWU Canada - BCMEA Collective Agreement 2023-2027
// Structured Knowledge Base
//
// Sources:
//   1. Collective Agreement 2023-2027 (BCMEA / ILWU Canada)
//   2. Black Book 2023 (Finalized July 10, 2024)
//
// All rates, rules, and entitlements are extracted directly from these
// official documents. This file is the single source of truth for contract
// data used throughout the PortPal mobile app.
// ============================================================================

// ----------------------------------------------------------------------------
// 1. WAGE TABLES
//
// The Straight Time Base Rate (STBR) is the foundation of all pay calculations.
// Every other rate is a multiplier of the STBR. The contract runs four years
// with annual increases effective April 1 each year.
// ----------------------------------------------------------------------------

export interface ShiftRates {
  'MON-FRI': number;
  SAT: number;
  'SUN-HOL': number;
}

export interface YearRates {
  year: number;
  effective: string;
  stbr: number;
  shifts: {
    DAY: ShiftRates;
    NIGHT: ShiftRates;
    GRAVEYARD: ShiftRates;
  };
  holiday: number;
  overtime: {
    DAY: { 'MON-FRI': number; SAT: number; 'SUN-HOL': number };
    NIGHT: { 'MON-FRI': number; SAT: number; 'SUN-HOL': number };
    GRAVEYARD: { 'MON-FRI': number; SAT: number; 'SUN-HOL': number };
    HOLIDAY: number;
  };
  doubleTime: {
    DAY: { 'MON-FRI': number; SAT: number; 'SUN-HOL': number };
    NIGHT: { 'MON-FRI': number; SAT: number; 'SUN-HOL': number };
    GRAVEYARD: { 'MON-FRI': number; SAT: number; 'SUN-HOL': number };
    HOLIDAY: number;
  };
}

export const WAGE_TABLES: { years: YearRates[] } = {
  years: [
    {
      year: 1,
      effective: 'Apr 1, 2023',
      stbr: 50.64,
      shifts: {
        DAY: { 'MON-FRI': 50.64, SAT: 64.82, 'SUN-HOL': 81.02 },
        NIGHT: { 'MON-FRI': 63.80, SAT: 81.02, 'SUN-HOL': 81.02 },
        GRAVEYARD: { 'MON-FRI': 78.80, SAT: 81.02, 'SUN-HOL': 81.02 },
      },
      holiday: 101.28,
      overtime: {
        DAY: { 'MON-FRI': 75.96, SAT: 97.23, 'SUN-HOL': 121.53 },
        NIGHT: { 'MON-FRI': 95.70, SAT: 121.53, 'SUN-HOL': 121.53 },
        GRAVEYARD: { 'MON-FRI': 118.20, SAT: 121.53, 'SUN-HOL': 121.53 },
        HOLIDAY: 151.92,
      },
      doubleTime: {
        DAY: { 'MON-FRI': 101.28, SAT: 129.64, 'SUN-HOL': 162.04 },
        NIGHT: { 'MON-FRI': 127.60, SAT: 162.04, 'SUN-HOL': 162.04 },
        GRAVEYARD: { 'MON-FRI': 157.60, SAT: 162.04, 'SUN-HOL': 162.04 },
        HOLIDAY: 202.56,
      },
    },
    {
      year: 2,
      effective: 'Apr 1, 2024',
      stbr: 53.17,
      shifts: {
        DAY: { 'MON-FRI': 53.17, SAT: 68.06, 'SUN-HOL': 85.07 },
        NIGHT: { 'MON-FRI': 66.98, SAT: 85.07, 'SUN-HOL': 85.07 },
        GRAVEYARD: { 'MON-FRI': 82.73, SAT: 85.07, 'SUN-HOL': 85.07 },
      },
      holiday: 106.34,
      overtime: {
        DAY: { 'MON-FRI': 79.76, SAT: 102.09, 'SUN-HOL': 127.61 },
        NIGHT: { 'MON-FRI': 100.47, SAT: 127.61, 'SUN-HOL': 127.61 },
        GRAVEYARD: { 'MON-FRI': 124.10, SAT: 127.61, 'SUN-HOL': 127.61 },
        HOLIDAY: 159.51,
      },
      doubleTime: {
        DAY: { 'MON-FRI': 106.34, SAT: 136.12, 'SUN-HOL': 170.14 },
        NIGHT: { 'MON-FRI': 133.96, SAT: 170.14, 'SUN-HOL': 170.14 },
        GRAVEYARD: { 'MON-FRI': 165.46, SAT: 170.14, 'SUN-HOL': 170.14 },
        HOLIDAY: 212.68,
      },
    },
    {
      year: 3,
      effective: 'Apr 1, 2025',
      stbr: 55.30,
      shifts: {
        DAY: { 'MON-FRI': 55.30, SAT: 70.78, 'SUN-HOL': 88.48 },
        NIGHT: { 'MON-FRI': 69.67, SAT: 88.48, 'SUN-HOL': 88.48 },
        GRAVEYARD: { 'MON-FRI': 86.05, SAT: 88.48, 'SUN-HOL': 88.48 },
      },
      holiday: 110.60,
      overtime: {
        DAY: { 'MON-FRI': 82.95, SAT: 106.17, 'SUN-HOL': 132.72 },
        NIGHT: { 'MON-FRI': 104.51, SAT: 132.72, 'SUN-HOL': 132.72 },
        GRAVEYARD: { 'MON-FRI': 129.08, SAT: 132.72, 'SUN-HOL': 132.72 },
        HOLIDAY: 165.90,
      },
      doubleTime: {
        DAY: { 'MON-FRI': 110.60, SAT: 141.56, 'SUN-HOL': 176.96 },
        NIGHT: { 'MON-FRI': 139.34, SAT: 176.96, 'SUN-HOL': 176.96 },
        GRAVEYARD: { 'MON-FRI': 172.10, SAT: 176.96, 'SUN-HOL': 176.96 },
        HOLIDAY: 221.20,
      },
    },
    {
      year: 4,
      effective: 'Apr 1, 2026',
      stbr: 57.51,
      shifts: {
        DAY: { 'MON-FRI': 57.51, SAT: 73.61, 'SUN-HOL': 92.02 },
        NIGHT: { 'MON-FRI': 72.45, SAT: 92.02, 'SUN-HOL': 92.02 },
        GRAVEYARD: { 'MON-FRI': 89.49, SAT: 92.02, 'SUN-HOL': 92.02 },
      },
      holiday: 115.02,
      overtime: {
        DAY: { 'MON-FRI': 86.27, SAT: 110.42, 'SUN-HOL': 138.03 },
        NIGHT: { 'MON-FRI': 108.68, SAT: 138.03, 'SUN-HOL': 138.03 },
        GRAVEYARD: { 'MON-FRI': 134.24, SAT: 138.03, 'SUN-HOL': 138.03 },
        HOLIDAY: 172.53,
      },
      doubleTime: {
        DAY: { 'MON-FRI': 115.02, SAT: 147.22, 'SUN-HOL': 184.04 },
        NIGHT: { 'MON-FRI': 144.90, SAT: 184.04, 'SUN-HOL': 184.04 },
        GRAVEYARD: { 'MON-FRI': 178.98, SAT: 184.04, 'SUN-HOL': 184.04 },
        HOLIDAY: 230.04,
      },
    },
  ],
};

// ----------------------------------------------------------------------------
// 2. SHIFT MULTIPLIERS
//
// All rates are calculated from the STBR using these multipliers.
// For example: Night Mon-Fri = STBR x 1.2598, Saturday = STBR x 1.28 (day)
// or STBR x 1.6 (night/graveyard/sunday).
// Source: Article 16.02 of the Collective Agreement.
// ----------------------------------------------------------------------------

export const SHIFT_MULTIPLIERS = {
  DAY: { 'MON-FRI': 1.0, SAT: 1.28, 'SUN-HOL': 1.6 },
  NIGHT: { 'MON-FRI': 1.2598, SAT: 1.6, 'SUN-HOL': 1.6 },
  GRAVEYARD: { 'MON-FRI': 1.556, SAT: 1.6, 'SUN-HOL': 1.6 },
  HOLIDAY: 2.0,
} as const;

// ----------------------------------------------------------------------------
// 3. SKILL DIFFERENTIALS
//
// These are per-hour additions on top of the base rate. If you are dispatched
// to a Classification #1 job, you get an extra $2.50/hr for every hour of
// that shift. Differentials do not pyramid or overlap -- you only get one.
// Source: Article 17 of the Collective Agreement.
// ----------------------------------------------------------------------------

export interface SkillClass {
  amount: number;
  description: string;
  jobs: string[];
}

export const SKILL_DIFFERENTIALS: Record<string, SkillClass> = {
  CLASS_1: {
    amount: 2.50,
    description: 'Certified Tradespersons (including uncertified Mechanics and Millwrights)',
    jobs: [
      'HD MECHANIC',
      'MILLWRIGHT',
      'ELECTRICIAN',
      'CARPENTER',
      'PLUMBER',
      'WELDER',
      'TRACKMEN',
      'PAINTER',
      'MACHINIST',
    ],
  },
  CLASS_2: {
    amount: 1.00,
    description: 'Heavy equipment operators, specialized dock/ship roles',
    jobs: [
      'DOCK GANTRY',
      'RUBBER TIRE GANTRY',
      'SHIP GANTRY',
      'STRADDLE CARRIER',
      'BULK OPERATOR',
      'LIQUID BULK',
      'WINCH DRIVER',
      'HATCH TENDER/SIGNAL',
      'STORESPERSON',
      'RAIL MOUNTED GANTRY',
      'HEAD CHECKER (CONTAINER TERMINAL)',
      'LOCOMOTIVE ENGINEER',
      'SHIP UNLOADER OPERATOR',
      'CONTAINER HEAVY LIFT TRUCK',
      'GRAIN SPECIALTY',
      'REGISTERED B WELDER',
      'REGISTERED C WELDER',
    ],
  },
  CLASS_3: {
    amount: 0.65,
    description: 'Mobile equipment operators, specialized dock roles',
    jobs: [
      'TRACTOR TRAILER',
      'HEAD CHECKER',
      'SWITCHMAN',
      'LOCI',
      'REACHSTACKER',
      '40 TON (TOP PICK)',
      'FRONT END LOADER',
      'BULLDOZER',
      'EXCAVATOR',
      'MOBILE CRANE',
      'KOMATSU',
      'LOCKERMAN',
      'GEARPERSON (FULL FLEXIBILITY)',
      'BULK OPERATOR (FRASER SURREY/FAIRVIEW)',
      'LEAD HAND',
      'TRACKMEN (UNCERTIFIED)',
      'WELDER (UNCERTIFIED)',
    ],
  },
  CLASS_4: {
    amount: 0.50,
    description: 'Grain, lift truck, checker, first aid, and service roles',
    jobs: [
      'WHEAT MACHINE',
      'WHEAT SPECIALTY',
      'LIFT TRUCK',
      'DOCK CHECKER',
      'FIRST AID',
      'SIDE RUNNER',
      'UNITIZER OPERATOR',
      'TRADES SERVICEPERSON',
    ],
  },
  BASE: {
    amount: 0.00,
    description: 'No differential - base longshoreman rate',
    jobs: [
      'LABOUR',
      'BUNNY BUS',
      'TRAINING',
      'LINES',
      'OB',
    ],
  },
};

// Wheat jobs also get $1.15/hr per the CLAUDE.md notes (Black Book operational
// agreement). The CLAUDE.md canonical list treats them as a separate class.
// In the formal contract they fall under Class 4 ($0.50). The additional
// $0.65 ($1.15 - $0.50) comes from the Grain Specialty commodity supplement.
// For pay engine purposes, CLAUDE.md uses the combined $1.15 figure.
export const WHEAT_DIFFERENTIAL = 1.15;

// ----------------------------------------------------------------------------
// 4. OVERTIME RULES
//
// Overtime and shift extension rules from Schedule 1, Schedule 3, and
// Article 21.04 of the Collective Agreement.
// ----------------------------------------------------------------------------

export const OVERTIME_RULES = {
  // Meal period worked during any shift: paid at 1.5x the shift rate
  mealPeriodWorked: {
    multiplier: 1.5,
    description:
      'When you work through your meal break, you get paid at time-and-a-half for that period.',
    source: 'Schedule 1, Item 5; Schedule 3',
  },

  // One-hour shift extension immediately following end of shift
  oneHourExtension: {
    multiplier: 1.5,
    description:
      'If the ship needs to shift or sail, your shift can be extended up to one hour at time-and-a-half.',
    source: 'Article 21.04; Schedule 1, Item 6; Schedule 3',
  },

  // Two-hour coastwise cruise vessel extension
  twoHourCoastwiseCruiseExtension: {
    multiplier: 2.0,
    description:
      'On cruise vessels, a two-hour extension to accommodate late passengers or baggage is paid at double time.',
    source: 'Article 21.04; Schedule 3',
  },

  // Shift extension more than one hour (after a meal period)
  shiftExtensionAfterMeal: {
    day: {
      'MON-SAT': {
        multiplier: 2.0,
        description: 'Day shift extensions after a meal period (Mon-Sat) are paid at double time.',
      },
      SUN: {
        multiplier: 1.5,
        description: 'Day shift extensions after a meal period on Sunday are paid at time-and-a-half.',
      },
    },
    night: {
      multiplier: 1.5,
      description: 'Night shift extensions after a meal period are paid at time-and-a-half.',
    },
    graveyard: {
      multiplier: 1.5,
      description: 'Graveyard shift extensions after a meal period are paid at time-and-a-half.',
    },
    source: 'Article 21.04',
  },

  // Damaged cargo
  damagedCargo: {
    multiplier: 1.5,
    description:
      'Handling cargo badly damaged by fire, collision, leak, or stranding is paid at time-and-a-half of the shift rate.',
    source: 'Article 18.01',
  },

  // Advanced starting time
  advancedStartingTime: {
    general: {
      multiplier: 1.5,
      description:
        'If your shift starts early (advanced starting time), you get time-and-a-half for the advanced portion.',
    },
    truckServicing6am: {
      rate: 'graveyard_shift_rate',
      description:
        'Dock employees servicing trucks from 6:00 AM to 8:00 AM (Mon-Fri) are paid the graveyard shift rate for those two hours.',
    },
    truckServicingWeekendHoliday: {
      multiplier: 1.5,
      description:
        'Truck servicing on weekends and holidays: time-and-a-half of the applicable day shift rate.',
    },
    source: 'Schedule 1, Item 7; Article 21.01(9)',
  },

  // Maximum shift extension rules
  shiftExtensionLimits: {
    dockGeneralOneHour: 'Any dock shift can be extended up to 1 hour at any time.',
    dockGeneralFourHour:
      'Dock shifts can be extended up to 4 hours to complete a specific operation, with a 3-hour minimum if called back after a meal period, when no other suitable employees are available.',
    shipShiftOrSail:
      'Any ship shift may be extended up to 4 hours for shifting or sailing, with a 3-hour minimum after a meal period.',
    shipOneHour: 'One-hour extension for ship to shift or sail between 4:30 PM and 5:30 PM in all areas.',
    source: 'Article 21.04',
  },
} as const;

// ----------------------------------------------------------------------------
// 5. SHIFT HOURS
//
// Standard shift times from Article 21.01 of the Collective Agreement.
// ----------------------------------------------------------------------------

export const SHIFT_HOURS = {
  GRAVEYARD: { start: '1:00 AM', end: '8:00 AM', hours: 7, paidHours: 6.5, mealPeriod: '4:30 AM - 5:00 AM' },
  DAY: { start: '8:00 AM', end: '4:30 PM', hours: 8.5, paidHours: 8, mealPeriod: '12:00 PM - 12:30 PM' },
  DAY_COASTWISE: { start: '8:00 AM', end: '5:00 PM', hours: 9, paidHours: 8, mealPeriod: '12:00 PM - 1:00 PM' },
  NIGHT: { start: '4:30 PM', end: '1:00 AM', hours: 8.5, paidHours: 8, mealPeriod: '8:30 PM - 9:00 PM' },
  NIGHT_COASTWISE: { start: '5:00 PM', end: '1:00 AM', hours: 8, paidHours: 7.5, mealPeriod: '8:30 PM - 9:00 PM' },
  COASTWISE_SPECIAL: { start: '1:00 PM', end: '10:00 PM', hours: 9, paidHours: 8, mealPeriod: '5:00 PM - 6:00 PM' },
  ADVANCED_TRUCK: { start: '6:00 AM', end: '2:30 PM', hours: 8.5, paidHours: 8, mealPeriod: '10:00 AM - 10:30 AM' },
} as const;

// ----------------------------------------------------------------------------
// 6. VACATION RATES
//
// Vacation pay is a percentage of your total earnings from the previous
// calendar year (Jan 1 - Dec 31). The percentage increases with years of
// service. You need at least 500 hours in a year for it to count as a
// year of service.
// Source: Article 11.01 of the Collective Agreement; Black Book Document #66.
// ----------------------------------------------------------------------------

export interface VacationTier {
  minYears: number;
  maxYears: number | null;
  rate: number;
  vacationDays: number;
}

export const VACATION_RATES: VacationTier[] = [
  { minYears: 0, maxYears: 5, rate: 0.04, vacationDays: 10 },
  { minYears: 6, maxYears: 10, rate: 0.07, vacationDays: 17 },
  { minYears: 11, maxYears: 14, rate: 0.08, vacationDays: 20 },
  { minYears: 15, maxYears: 19, rate: 0.09, vacationDays: 23 },
  { minYears: 20, maxYears: 24, rate: 0.10, vacationDays: 25 },
  { minYears: 25, maxYears: 29, rate: 0.11, vacationDays: 27 },
  { minYears: 30, maxYears: 34, rate: 0.12, vacationDays: 30 },
  { minYears: 35, maxYears: 39, rate: 0.13, vacationDays: 33 },
  { minYears: 40, maxYears: null, rate: 0.14, vacationDays: 35 },
];

export const VACATION_RULES = {
  minimumHoursForServiceYear: 500,
  minimumSchedulingBlock: 4,
  vacationPayDeadline: 'February 16',
  deferralDeadline: 'Third week of December',
  declarationDeadline: '7 calendar days after start of vacation (final: December 24)',
  calculationBasis:
    'Vacation days = gross vacation pay / (8 x straight time base rate). Vacation pay is computed on earnings from January 1 to December 31 of the preceding year.',
  noWorkDuringVacation: true,
  noCumulation: true,
  source: 'Article 11.01; Black Book Document #66',
} as const;

// ----------------------------------------------------------------------------
// 7. RECOGNIZED HOLIDAYS
//
// 13 recognized holidays per year. All shifts on a recognized holiday are
// paid at 2x STBR. No work on New Year's, Labour Day, or Christmas Day
// except for emergencies. Dec 24 and Dec 31: work stops at noon (4 hours paid).
// Source: Article 10 of the Collective Agreement.
// ----------------------------------------------------------------------------

export const RECOGNIZED_HOLIDAYS = [
  { name: "New Year's Day", date: 'January 1', restrictions: 'No work except emergencies (safety of vessel, life, or property).' },
  { name: 'Good Friday', date: 'Varies (spring)', restrictions: 'Three shifts may be worked.' },
  { name: 'Easter Monday', date: 'Varies (spring)', restrictions: 'Three shifts may be worked.' },
  { name: 'Victoria Day', date: 'Monday before May 25', restrictions: 'Three shifts may be worked.' },
  { name: 'Canada Day', date: 'July 1', restrictions: 'Three shifts may be worked.' },
  { name: 'British Columbia Day', date: 'First Monday of August', restrictions: 'Three shifts may be worked.' },
  { name: 'Labour Day', date: 'First Monday of September', restrictions: 'No work except emergencies.' },
  { name: 'National Day for Truth and Reconciliation', date: 'September 30', restrictions: 'Three shifts may be worked.' },
  { name: 'Thanksgiving Day', date: 'Second Monday of October', restrictions: 'Three shifts may be worked.' },
  { name: 'Remembrance Day', date: 'November 11', restrictions: 'Three shifts may be worked.' },
  { name: 'Christmas Day', date: 'December 25', restrictions: 'No work except emergencies.' },
  { name: 'Boxing Day', date: 'December 26', restrictions: 'Three shifts may be worked.' },
  { name: 'Family Day', date: 'Third Monday of February', restrictions: 'Three shifts may be worked.' },
] as const;

export const HOLIDAY_RULES = {
  totalHolidays: 13,
  payRate: '2x STBR for all shifts on recognized holidays',
  sundayFallback:
    'When a recognized holiday (other than Christmas Day) falls on a Sunday, it is observed on the following Monday.',
  saturdayRule:
    'When a holiday falls on Saturday, the holiday wage rate and conditions apply on that Saturday.',
  christmasEve: {
    stopTime: '12:00 noon',
    hoursPaid: 4,
    noTravelOutsideLocalArea: true,
  },
  newYearsEve: {
    stopTime: '12:00 noon',
    hoursPaid: 4,
    noTravelOutsideLocalArea: true,
  },
  fullShiftGuarantee:
    'Employees (other than lines) are guaranteed pay for a full shift on any recognized holiday they work.',
  holidayPayEligibility: {
    fifteenDaysOrMore:
      'If you worked 15 or more days in the 4 weeks before the holiday, you get 8 hours at straight time.',
    oneToFourteenDays:
      'If you worked 1-14 days, you get 1/20th of your hours from the 4 weeks before the holiday week.',
  },
  source: 'Article 10',
} as const;

// ----------------------------------------------------------------------------
// 8. LEAVE ENTITLEMENTS
//
// Various types of leave available to workers.
// Sources: Collective Agreement Addenda (Maternity/Parental); Black Book
// Documents #7 (Bereavement), #33 (Jury Duty), #106 (Domestic Violence).
// ----------------------------------------------------------------------------

export const LEAVE_ENTITLEMENTS = {
  bereavement: {
    title: 'Bereavement Leave',
    days: 3,
    hoursPerDay: 8,
    rate: 'straight_time',
    calculation: '3 days x 8 hours x straight time hourly rate',
    eligibility:
      'Must maintain "A" coverage under the ILWU Employer Association Health and Benefit Plan.',
    family:
      'Immediate family as defined in Part III of the Canada Labour Code.',
    claimDeadline: '120 days from the date of death',
    documentation: 'Completed bereavement leave form plus relevant documentation (preferably death certificate).',
    source: 'Black Book Document #7',
  },

  maternity: {
    title: 'Maternity Leave',
    weeks: 17,
    paid: false,
    earliestStart: '13 weeks before estimated due date',
    latestEnd: '17 weeks after date of confinement',
    supplementaryBenefit: {
      eligible: true,
      eligibilityRequirement: '6 consecutive months of employment under the BCMEA/ILWU agreement',
      rate: 0.70,
      description:
        'You receive the difference between 70% of 40 hours/week at base rate and your EI benefit. The total of EI + SUB + other income cannot exceed 95% of your pre-leave earnings (averaged over preceding 12 months).',
      duration: 'Up to 15 weeks',
      waitingPeriod: 'No benefit during the 1-week EI waiting period.',
      hoursRequirement: 'Must have worked 75% of your Casual Board average non-trade hours (averaged over previous 12 months).',
      eiRequired: true,
      noticeRequired: '4 weeks before expected date of leave',
    },
    creditedTime: true,
    benefitsCoverage: 'Maintained at current level (cannot increase during leave)',
    despatchBoardPosition: 'Maintained during leave',
    noWeeklyIndemnity: true,
    source: 'Collective Agreement Addendum - Maternity/Parental Leave, Section 5 & 6',
  },

  parental: {
    title: 'Parental Leave',
    weeks: 63,
    maxPeriod: '78 weeks from birth or child coming into care',
    paid: false,
    supplementaryBenefit: {
      eligible: true,
      eligibilityRequirement: '6 consecutive months of employment, plus ILWU Health and Benefit Plan eligibility',
      rate: 0.50,
      description:
        'You receive the difference between 50% of 40 hours/week at base rate and your EI benefit. Total of EI + SUB + other income cannot exceed 95% of pre-leave earnings.',
      duration: 'Up to 35 weeks (may extend up to 61 weeks with prorated EI)',
      extendedDuration:
        'If you take parental leave beyond 35 weeks (up to 61), your EI may be prorated but the SUB adjusts so your total weekly earnings stay the same.',
      eiRequired: true,
      noticeRequired: '4 weeks before expected date of leave',
    },
    onlyOneParentAtATime: true,
    noDispatchDuringLeave: true,
    creditedTime: true,
    extensionAllowed: 'One extension up to the maximum allowed, must be applied for before the original leave expires.',
    uninterrupted: true,
    source: 'Collective Agreement Addendum - Maternity/Parental Leave, Section 5 & 6',
  },

  domesticViolence: {
    title: 'Domestic Violence Leave',
    totalWeeks: 12,
    paidDays: 7,
    paidDaysDescription: 'First 7 days of DV leave in a calendar year are paid. They do not need to be consecutive.',
    unpaidWeeks: 'Remaining leave (up to 12 weeks total) is unpaid.',
    paidCalculation: {
      unionMembers: '7 days x 8 hours x STBR',
      casualEmployees: '7 days x 8 hours x STBR (must have 6+ months service and worked 75% of Casual Board average non-trade hours over last 6 months)',
    },
    noPaidCarryOver: true,
    incrementSize: 'One or more full days (does not need to be continuous)',
    noLossOfBenefitsOrSeniority: true,
    eligibility: 'All employees. Does not apply if the employee committed the domestic violence.',
    evidence:
      'Reasonable proof required. Examples: written communication from shelter, victim services, police, Crown Counsel, lawyer, or medical practitioner.',
    application: 'Submit to WEBC prior to or as soon as possible after commencing leave.',
    coveredSituations: [
      'Seeking medical attention for physical or psychological injury',
      'Obtaining victim services',
      'Psychological or professional counselling',
      'Temporary or permanent relocation',
      'Legal or law enforcement assistance',
      'Preparing for or participating in civil or criminal proceedings',
    ],
    source: 'Black Book Document #106 (effective June 26, 2019)',
  },

  juryDuty: {
    title: 'Supreme Court Jury Duty',
    rate: 'straight_time',
    hoursPerDay: 8,
    calculation: '8 hours x basic straight time hourly rate, minus the wage portion of daily reimbursement from the Supreme Court.',
    eligibility:
      'Must be a Union member maintaining "A" coverage under the ILWU Employer Association Health and Benefit Plan.',
    paidFor: 'Days actively engaged in Supreme Court Jury Duty only.',
    documentation: 'Application form plus official Jury Duty Form.',
    source: 'Black Book Document #33',
  },
} as const;

// ----------------------------------------------------------------------------
// 9. DESPATCH RULES
//
// How workers get assigned to jobs. These are the fundamental principles
// from Article 9 and the Black Book documents.
// Source: Article 9 of the Collective Agreement.
// ----------------------------------------------------------------------------

export const DESPATCH_RULES = {
  principles: [
    'Preferential employment to Union members, with due regard to competence, fitness, ratings, safety, and avoiding individual speed-up.',
    'Union members available for work are dispatched on a fair and equitable basis, first within their own category, then to other work.',
    'No job picking or holding back for preferred jobs (except if in local Despatch Rules).',
    'No favouritism or unfair discrimination in hiring, dispatch, or employment.',
    'Regular Work Force employees report daily to their site.',
  ],
  penalties:
    'Strong penalties apply if you sign up as available for dispatch and then are unavailable or refuse dispatch.',
  replacements: {
    sickness: 'Paid for the greater of 4 hours or the balance of the guarantee at the appropriate shift rate.',
    accident: 'Paid for the full shift if reporting before the meal period, or 4 hours if reporting after.',
    lateOrder:
      'If dispatched to start at a non-recognized time, you are paid from the applicable recognized starting time.',
  },
  regularWorkForce: {
    description:
      'Employers can establish a Regular Work Force. These employees report daily and get continuous employment (5 shifts per 7-day period, plus a 6th if required).',
    minGuarantee: '4 hours for the 6th shift',
    notice: {
      hiring: '7 days clear notice',
      resignation: '7 days clear notice',
      layoff: '7 days clear notice (except discharge for cause)',
    },
    noDispatchToOtherCompanies: true,
    higherRatingPay: 'If turned to higher-rated work, you get the higher rate for hours actually worked.',
  },
  source: 'Article 9; Article 21.03',
} as const;

// ----------------------------------------------------------------------------
// 10. SAFETY RULES
//
// Key safety provisions from the Collective Agreement and Black Book.
// Sources: Articles 3.03, 7.03 of the Collective Agreement;
// Black Book Document #46 (Personal Protective Equipment).
// ----------------------------------------------------------------------------

export const SAFETY_RULES = {
  jointSafetyCommittee: {
    composition: 'Equal representation from the Union and the Association.',
    meetingFrequency: 'At least once every 3 months, or within 15 days of notice by either party.',
    duties: [
      'Safe working practices and Safety Regulations',
      'Accidents and accident prevention',
      'Reports and complaints about unsafe conditions',
      'Health and safety matters referred from local committees',
      'Compensation cases needing special investigation',
    ],
    source: 'Article 3.03',
  },

  rightToRefuseUnsafeWork: {
    description:
      'You have the right to refuse work if you genuinely believe it would endanger your health or safety. The issue must be investigated immediately.',
    process:
      'If not settled on the spot, a Union rep and Association rep investigate. If still unresolved, either party can refer to the Arbitrator.',
    noBadFaith:
      'This right cannot be used as a workaround to avoid work (that would violate the no-strike clause).',
    source: 'Article 7.03',
  },

  personalProtectiveEquipment: {
    highVizVest: {
      required: true,
      when: 'All shifts, all employees working on dock area or ship, including walking to/from ship or place of employment.',
      providedBy: 'Industry (signed for by employees). Replacement for damage: free. Replacement for other reasons: at employee expense.',
      exemptions: [
        'Tradespersons working in maintenance areas',
        'Employees inside an equipment cab performing their job',
        'Employees inside checker buildings, first aid rooms, or specific dock areas with no mobile/stationary equipment',
        'Automobile Ro-Ro vessel drivers at Annacis Auto Terminals and Fraser Wharves',
        'Cruise ship terminal employees wearing approved coveralls with reflective tape',
      ],
      alternativeApparel:
        'You can wear other high-viz apparel instead, but it must be pre-approved by the Joint Industry Safety Committee with matching reflective striping. Cost is on you.',
    },
    footwear: {
      required: true,
      description: 'Substantial work boots (leather or appropriate material) on all shifts, all operations.',
      providedBy: 'Employee',
      exemptions: [
        'Employees inside checker buildings or first aid rooms',
        'Automobile Ro-Ro vessel drivers at Annacis Auto Terminals and Fraser Wharves',
      ],
    },
    source: 'Black Book Document #46',
  },

  regulations:
    'Deepsea Ship operations follow Canada Shipping Act Tackle Regulations, Marine Occupational Safety and Health Regulations, and BCMEA/ILWU Safety Regulations. Dock and Bulk Terminal operations follow Canada Occupational Safety and Health Regulations.',
} as const;

// ----------------------------------------------------------------------------
// 11. TRAINING
//
// Training provisions from Article 8 and Black Book Document #31.
// Source: Article 8 of the Collective Agreement; Black Book Document #31.
// ----------------------------------------------------------------------------

export const TRAINING_RULES = {
  employerObligation:
    'The Association (BCMEA) undertakes to provide appropriate training when necessary. Each employee gets the occupational classification and rating for which they qualify.',
  unionObligation:
    'The Union cooperates with the Association on training. Workers must service the specific rating they were trained for.',
  whoGetsTrained: 'All members of the work force, including casuals, are trained for specific cargo handling functions and specialized equipment.',
  tradespersonTraining:
    'Employers provide training to Journeyman Tradespersons on how to perform Regular Maintenance Work on new and existing equipment within the scope of their trade.',
  trainingCommittee: {
    composition: '2-5 representatives from each party (Union and Association)',
    meetingFrequency: 'At least quarterly',
    duties: [
      'Arrange training of waterfront employees in specialist categories as required by the industry',
      'Determine the number of trainees and select suitable candidates (via the Port Labour Relations Committee)',
      'Establish competency standards before job ratings are granted',
    ],
  },
  regularWorkForceTraining:
    'Skill-rated employees on a Regular Work Force may be trained for other skill-rated work on-site. They can only use the new skills when no employees with the required rating are available through the Despatch Centre.',
  source: 'Article 8; Black Book Document #31',
} as const;

// ----------------------------------------------------------------------------
// 12. PENSION & WELFARE
//
// High-level references from Articles 12 and 13. The detailed plans are
// separate documents (Waterfront Industry Pension Plan, Welfare Agreement).
// Source: Articles 12, 13, 14 of the Collective Agreement.
// ----------------------------------------------------------------------------

export const PENSION_AND_WELFARE = {
  pension: {
    plan: 'Waterfront Industry Pension Plan',
    agreement: 'Waterfront Industry Pension Agreement',
    earlyRetirement:
      'Voluntary early retirement is available if the employee qualifies under the Pension Plan.',
    mandatoryRetirement:
      'Retirement at age 62 may be required if the employee is fully qualified under the Supplementary Pension Plan and there is technological change or a decline in work opportunity.',
    supplementaryPension: 'Governed by the Retirement Allowance Agreement.',
    source: 'Article 13; Article 14',
  },
  welfare: {
    plan: 'ILWU Employer Association Health and Benefit Plan',
    description:
      'Welfare arrangements are set forth in the separate Welfare Agreement. Coverage levels include "A" coverage (higher) and "B" coverage.',
    source: 'Article 12',
  },
  employeeAssistanceProgram: {
    description:
      'An Employee Assistance Program (EAP) exists under the Welfare Agreement. An Industry EAP Coordinator can assist with referrals for domestic violence, substance issues, and other personal matters.',
    source: 'Black Book Document #24',
  },
  automationProtection: {
    description:
      'The Association provides protection against technological change including: training/retraining, relocation of affected workers, voluntary early retirement, and supplementary pension.',
    source: 'Article 14',
  },
} as const;

// ----------------------------------------------------------------------------
// 13. CONTRACT DURATION & GENERAL INFO
// ----------------------------------------------------------------------------

export const CONTRACT_INFO = {
  parties: {
    employer: 'British Columbia Maritime Employers Association (BCMEA)',
    union: 'International Longshore and Warehouse Union - Canada (ILWU Canada)',
  },
  duration: {
    start: 'April 1, 2023',
    end: 'March 31, 2027',
    renewal:
      'Automatically renews year to year unless either party gives 4 months written notice before March 31, 2027 (or December 31 in subsequent years).',
  },
  addresses: {
    bcmea: '500-349 Railway Street, Vancouver, B.C. V6A 1A4',
    ilwu: '#180 - 111 Victoria Drive, Vancouver, B.C. V5L 4C4',
  },
  blackBook:
    'The "Black Book" is the official record of decisions and understandings reached by the Joint Industry Labour Relations Committee. Anything in the Black Book that conflicts with this Agreement is null and void.',
  payClaimTimeLimit:
    'The Association must respond to pay claims within 60 days of receipt. Disputes must be referred to the Job Arbitrator within 3 months of the Association\'s response.',
} as const;

// ----------------------------------------------------------------------------
// 14. CONTRACT SECTIONS - Browsable content for the app
//
// These sections present the contract information in plain language,
// organized by topic. Each section has subsections with content written
// for workers, not lawyers.
// ----------------------------------------------------------------------------

export interface ContractSubsection {
  title: string;
  content: string;
  source: string;
  keyPoints?: string[];
}

export interface ContractSection {
  id: string;
  title: string;
  icon: string;
  subsections: ContractSubsection[];
}

export const CONTRACT_SECTIONS: ContractSection[] = [
  {
    id: 'pay-rates',
    title: 'Pay Rates & Wages',
    icon: 'cash-outline',
    subsections: [
      {
        title: 'Base Rates 2023-2027',
        content:
          'Your hourly pay is based on the Straight Time Base Rate (STBR), which increases every April 1st:\n\n' +
          '- Year 1 (Apr 2023): $50.64/hr\n' +
          '- Year 2 (Apr 2024): $53.17/hr\n' +
          '- Year 3 (Apr 2025): $55.30/hr\n' +
          '- Year 4 (Apr 2026): $57.51/hr\n\n' +
          'This is the Monday-Friday day shift rate. All other rates (nights, weekends, holidays) are calculated as multiples of this base.',
        source: 'Article 16.01',
        keyPoints: [
          'The STBR is the foundation for all other rates',
          'Rates go up every April 1st',
          'Your actual hourly rate depends on shift, day, and job classification',
        ],
      },
      {
        title: 'How Shift Rates Work',
        content:
          'Every shift rate is a multiplier of the base rate (STBR):\n\n' +
          'Day Shift (8 AM - 4:30 PM):\n' +
          '- Mon-Fri: 1.0x STBR (straight time)\n' +
          '- Saturday: 1.28x STBR\n' +
          '- Sunday & Holidays: 1.6x STBR\n\n' +
          'Night Shift (4:30 PM - 1 AM):\n' +
          '- Mon-Fri: 1.2598x STBR\n' +
          '- Sat & Sun: 1.6x STBR\n\n' +
          'Graveyard Shift (1 AM - 8 AM):\n' +
          '- Mon-Fri: 1.556x STBR\n' +
          '- Sat & Sun: 1.6x STBR\n\n' +
          'Recognized Holidays: 2.0x STBR (all shifts)',
        source: 'Article 16.02',
        keyPoints: [
          'Night shift is about 26% more than day shift',
          'Graveyard is about 56% more than day shift',
          'Weekends and holidays are the same rate for night and graveyard',
          'Holiday rate is always double the base',
        ],
      },
      {
        title: 'Skill Differentials',
        content:
          'On top of your base rate, you earn an extra hourly differential based on your job classification. The differential is paid for the full shift when you are dispatched to that category:\n\n' +
          'Class 1 - $2.50/hr: Certified trades (HD Mechanic, Electrician, Millwright, Carpenter, Plumber, Welder, Trackmen)\n\n' +
          'Class 2 - $1.00/hr: Dock Gantry, RTG, Ship Gantry, Bulk Operator, Winch Driver, Hatch Tender, Storesperson, Head Checker (container terminal), and more\n\n' +
          'Class 3 - $0.65/hr: Tractor Trailer, Head Checker, Switchman, Loci, Reachstacker, Top Pick, Front End Loader, Bulldozer, Excavator, Mobile Crane, and more\n\n' +
          'Class 4 - $0.50/hr: Grain Machine, Lift Truck, Checker, First Aid, Side Runner, and more\n\n' +
          'No differential: Labour, Bunny Bus, Training, Lines',
        source: 'Article 17',
        keyPoints: [
          'Differentials do not stack - you only get one',
          'The differential applies to your entire shift, not just specific hours',
          'Example: A tractor trailer driver on a Mon-Fri day shift earns $53.17 + $0.65 = $53.82/hr (Year 2)',
        ],
      },
      {
        title: 'Overtime & Extensions',
        content:
          'Overtime is not a separate rate category. Instead, you earn premium rates for working beyond your normal shift:\n\n' +
          'Meal Period Worked: 1.5x your shift rate\n' +
          'If you work through your meal break, you get time-and-a-half for that 30 minutes.\n\n' +
          'One-Hour Extension: 1.5x your shift rate\n' +
          'When the ship needs to shift or sail, your shift can be extended up to 1 hour.\n\n' +
          'Extension After Meal Period (more than 1 hour):\n' +
          '- Day shift Mon-Sat: 2x shift rate (double time)\n' +
          '- Day shift Sunday: 1.5x shift rate\n' +
          '- Night and Graveyard: 1.5x shift rate\n\n' +
          'Cruise Vessel Two-Hour Extension: 2x shift rate\n' +
          'For late passengers or baggage on cruise vessels.\n\n' +
          'Maximum extension is 4 hours, with a 3-hour minimum if called back after a meal period.',
        source: 'Article 21.04; Schedules 1, 2, 3',
        keyPoints: [
          'You cannot be worked more than 5 consecutive hours without a meal period',
          'The employer must provide the second meal if you work past two meal periods',
          'Hot coffee must be available at meal hours if not available from other sources',
        ],
      },
      {
        title: 'Damaged Cargo Premium',
        content:
          'If cargo is badly damaged from fire, collision, leaking, or stranding and is in an offensive condition, you get paid 1.5x the shift rate to handle it.\n\n' +
          'This does not apply to checkers, first aid attendants, or employees doing grain lining, erection, or dismantling work.',
        source: 'Article 18.01',
      },
      {
        title: 'Coastwise Special Commodities',
        content:
          'When loading or discharging certain special commodities on coastwise operations, you earn an additional $0.15 per hour. These commodities include:\n\n' +
          '- Fish Meal, Whale Meal, Green Hides, Salt Fish, Salt Cake (any quantity)\n' +
          '- Ore and Concentrates in bulk or bags, Scrap Iron (when not palletized)\n' +
          '- Sulphur in Bulk, Coal in Bulk, Creosoted Products, Fish Livers (any quantity)\n' +
          '- Lime, Cement, Alphasel, Frozen Fish (in lots of 25 tons or over)',
        source: 'Article 27, Section 4',
      },
    ],
  },
  {
    id: 'hours-shifts',
    title: 'Hours & Shifts',
    icon: 'time-outline',
    subsections: [
      {
        title: 'Standard Shift Schedule',
        content:
          'Your work is divided into three main shifts:\n\n' +
          'Graveyard: 1:00 AM - 8:00 AM (meal at 4:30 AM)\n' +
          'Day: 8:00 AM - 4:30 PM (meal at 12:00 noon)\n' +
          'Night: 4:30 PM - 1:00 AM (meal at 8:30 PM)\n\n' +
          'All three shifts can be worked 7 days a week.\n\n' +
          'Special shifts:\n' +
          '- Day Shift (Coastwise Cruise): 8:00 AM - 5:00 PM (1-hour meal at noon)\n' +
          '- Night Shift (Coastwise Cruise): 5:00 PM - 1:00 AM\n' +
          '- Coastwise Special: 1:00 PM - 10:00 PM (meal at 5:00 PM)\n' +
          '- Advanced Truck Servicing: 6:00 AM - 2:30 PM (meal at 10:00 AM)',
        source: 'Article 21.01',
        keyPoints: [
          'Meal periods are 30 minutes (1 hour for coastwise cruise day shift)',
          'If your meal is advanced or deferred, it can move up to 30 minutes',
          'You cannot work more than 5 hours straight without a meal',
        ],
      },
      {
        title: 'Shift Guarantees',
        content:
          'When you are dispatched for a shift, you are guaranteed a full shift of pay, with some exceptions:\n\n' +
          '- Full shift guarantee applies to every dispatch\n' +
          '- If fired for sufficient cause, you only get paid for time actually worked\n' +
          '- Fog, non-arrival, or mechanical failure: 4-hour guarantee\n' +
          '- Replacements for sickness/shortage: greater of 4 hours or balance of the shift\n' +
          '- Replacements for accidents: full shift if reporting before meal period, 4 hours after\n' +
          '- Holiday work: full shift guarantee (except lines employees)',
        source: 'Article 21.01(3); Article 21.02(7)',
      },
      {
        title: 'Night-to-Day Turnaround',
        content:
          'If you work the night shift and are ordered back for the day shift the next day, you are released at midnight and paid for the balance of your night shift. This lets you get some rest before the day shift.\n\n' +
          'On Vancouver Island, if you work outside your local area on the night shift, you will not be required to work the day shift the following day.',
        source: 'Article 21.01(13)',
      },
      {
        title: 'Maximum Working Time',
        content:
          'Regular Work Force employees should not normally work more than one shift plus an extension in a 24-hour period. However, you may be required to report back to work (with a minimum of one shift off) on not more than one occasion each week.\n\n' +
          'Exceptions: First Aid Attendants and Boatpersons may work through meal periods at the meal period rate. Maximum working time rules do not apply to Checkers (when checking as paperpersons), First Aid Attendants, or Boatpersons.',
        source: 'Article 21.01(5); Article 21.02',
      },
      {
        title: 'Checker & Maintenance Start Times',
        content:
          'Checkers can be required to start up to 1 hour before the shift and stay up to 30 minutes after to hand in records.\n\n' +
          'Maintenance employees and rail crews can have their start times advanced or deferred up to 1 hour, and may be required to work at any hour, any day of the year.\n\n' +
          'Dock employees servicing trucks can start at 6:00 AM (2 hours early), finishing at 2:30 PM. The employer may add a 1-hour extension.',
        source: 'Article 21.01(6)(7)(8)(9)',
      },
      {
        title: 'Union Meeting Night',
        content:
          'On regular monthly Union meeting nights, work stops at the end of the day shift. There is no night shift on meeting nights.\n\n' +
          'Exception: If working in your home port, you may continue for one additional hour to finish a ship to sail (except at Chemainus).\n\n' +
          'Meetings are not held during a week that includes a holiday. Mainland locals hold their meetings on the same night.\n\n' +
          'This does not affect watchpersons, maintenance employees, lines employees, or those servicing regularly scheduled coastwise vessels.',
        source: 'Article 15',
      },
    ],
  },
  {
    id: 'benefits-leave',
    title: 'Benefits & Leave',
    icon: 'heart-outline',
    subsections: [
      {
        title: 'Vacation Pay',
        content:
          'Your vacation pay is a percentage of your total earnings from the previous calendar year (Jan 1 - Dec 31). The percentage increases with years of service:\n\n' +
          '- 0-5 years: 4% (about 10 days)\n' +
          '- 6-10 years: 7% (about 17 days)\n' +
          '- 11-14 years: 8% (about 20 days)\n' +
          '- 15-19 years: 9% (about 23 days)\n' +
          '- 20-24 years: 10% (about 25 days)\n' +
          '- 25-29 years: 11% (about 27 days)\n' +
          '- 30-34 years: 12% (about 30 days)\n' +
          '- 35-39 years: 13% (about 33 days)\n' +
          '- 40+ years: 14% (about 35 days)\n\n' +
          'You need at least 500 hours in a year for it to count as a year of service. Years of service must be consecutive.',
        source: 'Article 11.01',
        keyPoints: [
          'Vacation days = gross vacation pay / (8 x straight time base rate)',
          'You must take your full vacation entitlement each year -- no carrying over',
          'You cannot work during your vacation period',
          'Minimum scheduling block is 4 days (except for the final remaining days)',
          'Vacation pay cheques are available by February 16, or you can defer to December',
        ],
      },
      {
        title: 'Bereavement Leave',
        content:
          'If you lose an immediate family member, you are entitled to 3 days of paid bereavement leave.\n\n' +
          'Payment: 3 days x 8 hours x straight time hourly rate\n\n' +
          'Eligibility: You must maintain "A" coverage under the ILWU Health and Benefit Plan.\n\n' +
          '"Immediate family" is defined by the Canada Labour Code (spouse, parent, child, sibling, grandparent, grandchild, in-laws, common-law partner, and more).\n\n' +
          'You must submit your claim within 120 days of the date of death, with a completed bereavement leave form and relevant documentation (preferably a death certificate).',
        source: 'Black Book Document #7',
      },
      {
        title: 'Maternity Leave',
        content:
          'You can take up to 17 weeks of unpaid maternity leave. It can start as early as 13 weeks before your due date and must end no later than 17 weeks after the date of confinement.\n\n' +
          'Supplementary Benefit (SUB Plan):\n' +
          'After 6 months of continuous employment, you qualify for the SUB plan. For up to 15 weeks, you receive the difference between 70% of 40 hours/week at base rate and your EI benefit. Total of EI + SUB cannot exceed 95% of your pre-leave earnings (averaged over 12 months).\n\n' +
          'You must have worked 75% of your Casual Board\'s average non-trade hours (averaged over 12 months) and be receiving EI Maternity Benefits.\n\n' +
          'Give 4 weeks notice before your expected leave date. No benefit during the 1-week EI waiting period.',
        source: 'Collective Agreement Addendum, Section 5 & 6',
        keyPoints: [
          'Your dispatch board position is maintained during leave',
          'Your benefits coverage continues (but cannot be increased)',
          'You receive credited time during leave',
          'You are not eligible for dispatch while on leave',
        ],
      },
      {
        title: 'Parental Leave',
        content:
          'You can take up to 63 weeks of unpaid parental leave within 78 weeks of the birth or adoption.\n\n' +
          'Supplementary Benefit (SUB Plan):\n' +
          'After 6 months of employment, you qualify for the SUB plan. For up to 35 weeks, you receive the difference between 50% of 40 hours/week at base rate and your EI benefit. Total cannot exceed 95% of pre-leave earnings.\n\n' +
          'If you take leave beyond 35 weeks (up to 61 weeks), your EI may be prorated, but the SUB adjusts so your weekly total stays the same.\n\n' +
          'Only one parent can receive SUB benefits for the same child at the same time. The leave must be uninterrupted unless mutually agreed. One extension is allowed if applied for before the original leave expires.',
        source: 'Collective Agreement Addendum, Section 5 & 6',
      },
      {
        title: 'Domestic Violence Leave',
        content:
          'You are entitled to up to 12 weeks of domestic violence leave per calendar year.\n\n' +
          'The first 7 days are paid (7 x 8 hours x STBR). They do not need to be consecutive. Unused paid days do not carry over to the next year. The remaining leave is unpaid.\n\n' +
          'You can use this leave for:\n' +
          '- Medical attention for yourself, your child, or a protected adult\n' +
          '- Victim services\n' +
          '- Counselling\n' +
          '- Relocating (temporarily or permanently)\n' +
          '- Legal or law enforcement assistance\n' +
          '- Court proceedings related to the violence\n\n' +
          'All employees are eligible. You will not lose benefits or seniority during approved DV leave.\n\n' +
          'Submit your application to the WEBC before or as soon as possible after starting leave. Reasonable proof is required (e.g., letter from shelter, police, lawyer, doctor).',
        source: 'Black Book Document #106',
        keyPoints: [
          'Casual employees need 6+ months of service to qualify for paid days',
          'Leave can be taken in increments of one or more full days',
          'You do not have to take all 12 weeks continuously',
          'You are not eligible if you committed the domestic violence',
        ],
      },
      {
        title: 'Jury Duty',
        content:
          'If you are called for Supreme Court Jury Duty, you receive 8 hours pay at the basic straight time hourly rate for each day you are actively sitting on jury duty.\n\n' +
          'The daily reimbursement from the Supreme Court (the wage portion) is deducted from your payment.\n\n' +
          'Eligibility: Union member maintaining "A" coverage under the ILWU Health and Benefit Plan.\n\n' +
          'Submit an application form with your official Jury Duty Form.',
        source: 'Black Book Document #33',
      },
      {
        title: 'Pension',
        content:
          'Your pension is governed by the Waterfront Industry Pension Plan and the Waterfront Industry Pension Agreement (separate documents from this agreement).\n\n' +
          'Supplementary Pension: Governed by the Retirement Allowance Agreement.\n\n' +
          'Voluntary early retirement is available if you qualify under the Pension Plan.\n\n' +
          'Mandatory retirement at age 62 can be required if you are fully qualified under the Supplementary Pension Plan and there is technological change or a decline in work opportunity.',
        source: 'Articles 13, 14',
      },
      {
        title: 'Welfare & Health Benefits',
        content:
          'Your health and benefit coverage is under the ILWU Employer Association Health and Benefit Plan. The details are in the separate Welfare Agreement.\n\n' +
          'There are two coverage levels: "A" coverage (higher) and "B" coverage. Many entitlements (bereavement, jury duty) require you to maintain "A" coverage.\n\n' +
          'An Employee Assistance Program (EAP) is available for personal matters including substance issues and domestic violence referrals.',
        source: 'Article 12; Black Book Document #24',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & Equipment',
    icon: 'shield-checkmark-outline',
    subsections: [
      {
        title: 'Your Right to Refuse Unsafe Work',
        content:
          'If you genuinely believe that performing work under particular circumstances would endanger your health or safety, you may refuse to do the work.\n\n' +
          'What happens next:\n' +
          '1. The issue is investigated immediately on the spot\n' +
          '2. If not settled, a Union rep and Association rep try to resolve it\n' +
          '3. If still unresolved, either party can refer to the Arbitrator for a decision\n\n' +
          'Important: This right is for genuine safety concerns only. Using it as a way to avoid work (like an unofficial strike) violates the agreement.',
        source: 'Article 7.03',
      },
      {
        title: 'Required Safety Equipment',
        content:
          'You must wear the following on every shift:\n\n' +
          'High-Viz Vest: Required on all shifts for anyone working on a dock area or ship, including walking to and from work. The industry provides your vest (you sign for it). Damaged vests are replaced for free. If you lose it or need a new one for other reasons, you pay.\n\n' +
          'You can wear alternative high-viz apparel instead, but it must be pre-approved by the Joint Industry Safety Committee with the same reflective stripe pattern. You pay for any alternative apparel.\n\n' +
          'Work Boots: Substantial footwear made of leather or appropriate protective material. You provide your own boots.\n\n' +
          'Exemptions from vest/boot rules exist for certain specific situations (working inside checker buildings, driving inside equipment cabs, etc.).',
        source: 'Black Book Document #46',
      },
      {
        title: 'Safety Committee',
        content:
          'There is a Joint Safety Committee with equal Union and Association representation. They meet at least every 3 months and deal with:\n\n' +
          '- Safe working practices and Safety Regulations\n' +
          '- Accidents and accident prevention\n' +
          '- Reports about unsafe working conditions\n' +
          '- Compensation cases needing investigation\n\n' +
          'Deepsea Ship operations are guided by the Canada Shipping Act and BCMEA/ILWU Safety Regulations. Dock and Bulk Terminal operations follow Canada Occupational Safety and Health Regulations.',
        source: 'Article 3.03',
      },
    ],
  },
  {
    id: 'training',
    title: 'Training & Ratings',
    icon: 'school-outline',
    subsections: [
      {
        title: 'How Training Works',
        content:
          'The BCMEA provides training to ensure you can do the job safely and competently. The Union cooperates with training programs.\n\n' +
          'Who gets trained: All workers, including casuals, are trained for specific cargo handling functions and specialized equipment.\n\n' +
          'Once trained, you must service the rating you were trained for. The Joint Industry Training Committee (2-5 reps from each side) meets at least quarterly to plan training programs.\n\n' +
          'Trades training: Journeyman Tradespersons receive training on Regular Maintenance Work for both new and existing equipment within their trade scope.',
        source: 'Article 8; Black Book Document #31',
      },
      {
        title: 'Ratings & Classifications',
        content:
          'Your "rating" is your occupational classification -- it determines what jobs you can be dispatched to and what differential you earn.\n\n' +
          'The Port Labour Relations Committee determines the number and selection of trainees. Competency standards must be met before a rating is granted.\n\n' +
          'Regular Work Force employees who get cross-trained can only use their new skills when no one with the proper rating is available through the Despatch Centre.\n\n' +
          'A Journeyman Tradesperson is someone who has completed apprenticeship training and passed the prescribed examination (or has equivalent qualifications satisfactory to the employer). Trades include: Automotive Repair, Carpenter, HD Mechanic, Industrial Electrician, Machinist, Millwright, Painter, Plumber, Steamfitter/Pipefitter, and Welder.',
        source: 'Article 8; Schedule 4',
      },
      {
        title: 'Topside Training Program (Local 500)',
        content:
          'The Topside Training Program has specific requirements:\n\n' +
          '- Applications are reviewed jointly by a Union representative and the BCMEA Training Manager. Both must agree the candidate is acceptable.\n' +
          '- Workers with less than 15 pensionable years must:\n' +
          '  A) Join a Basic Numbered Gang for at least 12 months after completing training, OR\n' +
          '  B) If no Basic Gang vacancy exists, join a Designated Gang for 4 months, then transfer to a Basic Gang when a vacancy opens (for the remaining balance of 12 months).',
        source: 'Black Book Training Document #002',
      },
    ],
  },
  {
    id: 'dispatch',
    title: 'Dispatch & Work Rules',
    icon: 'people-outline',
    subsections: [
      {
        title: 'How Dispatch Works',
        content:
          'The dispatch system assigns you to jobs based on these principles:\n\n' +
          '- Union members get preferential employment, considering competence, fitness, ratings, and safety\n' +
          '- You are dispatched fairly -- first within your own category, then to other work\n' +
          '- No job picking or holding back for preferred jobs\n' +
          '- No favouritism or unfair discrimination\n' +
          '- If you sign up as available but then are unavailable or refuse dispatch, strong penalties apply\n\n' +
          'All employees working under this agreement are considered to be dispatched. On-the-job replacements require valid reasons and must be ordered through the Despatch Office or Business Agent.',
        source: 'Article 9',
      },
      {
        title: 'Regular Work Force',
        content:
          'Employers can establish a Regular Work Force (RWF). If you are on an RWF:\n\n' +
          '- You report daily for work on your site\n' +
          '- You get continuous employment: 5 shifts per 7-day period, plus a 6th if required (4-hour minimum for the 6th shift)\n' +
          '- You are dispatched to your rated classification\n' +
          '- You can be turned to other work outside your rating, but you will be paid no less than your rating calls for\n' +
          '- If turned to higher-rated work, you get the higher rate for hours actually worked\n' +
          '- You will not be dispatched to other companies unless released from your RWF\n\n' +
          'Hiring, resignation, and layoff from an RWF all require 7 days clear notice (except discharge for cause).',
        source: 'Article 21.03',
      },
      {
        title: 'Pay Claims',
        content:
          'If you think your pay is wrong, here is the process:\n\n' +
          '1. The BCMEA must respond to your pay claim within 60 days of receiving it\n' +
          '2. If you dispute the response, you must refer it to the Job Arbitrator within 3 months\n' +
          '3. If going through the Grievance Procedure, follow the time limits in Article 5\n' +
          '4. Time limits can be extended by joint agreement, otherwise the claim is forfeited\n\n' +
          'Bottom line: Do not sit on pay issues. File your claim and follow up.',
        source: 'Addendum; Black Book Document #64',
      },
      {
        title: 'Transfers & Travelling',
        content:
          'If you are dispatched outside your home port, you receive a travelling time allowance at straight time rates. The allowance varies by route -- for example, Vancouver to New Westminster is 1.5 hours return trip.\n\n' +
          'Regular Work Force employees are excluded from travelling time provisions.\n\n' +
          'No travelling time is allowed within the official limits of each port.',
        source: 'Article 22',
      },
    ],
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    icon: 'hand-left-outline',
    subsections: [
      {
        title: 'Grievance Procedure',
        content:
          'If you have a complaint or dispute, here is how to resolve it:\n\n' +
          'Step 1: Talk to your Business Agent, who submits the grievance in writing to the Employer. The Employer has 3 working days to respond.\n\n' +
          'Step 2: If not resolved, a committee of one Employer rep and one Union rep discusses the issue. They have 5 working days.\n\n' +
          'Step 3: If still not resolved, it goes to the Port Labour Relations Committee. They meet within 3 working days.\n\n' +
          'Step 4: If still unresolved, it goes to the Joint Industry Labour Relations Committee (5 working days).\n\n' +
          'Step 5: If all else fails, it goes to the Industry Arbitrator for a binding decision.\n\n' +
          'Important: While a grievance is being processed, work continues as normal.',
        source: 'Article 5',
      },
      {
        title: 'Discipline & Discharge',
        content:
          'If you are fired for cause, you are paid only for time actually worked that day.\n\n' +
          'If the Employer wants to impose any further penalty beyond a same-day discharge, they must notify the Union in writing within 2 working days.\n\n' +
          'If you believe your suspension or discharge was unjust, the matter is submitted in writing and dealt with by an Employer rep and a Union rep. If they cannot agree, it goes through the Grievance Procedure.\n\n' +
          'The Association can impose suspension, disciplinary layoff, or dismissal at any time, but must communicate the decision and reasons to the Union in writing.',
        source: 'Article 4',
      },
      {
        title: 'No Strikes, No Lockouts',
        content:
          'During the term of this agreement (April 2023 - March 2027):\n\n' +
          '- The Union has agreed there will be no slowdowns, strikes, stoppages, or refusals to work\n' +
          '- The Association has agreed there will be no lockouts\n\n' +
          'Picket Lines: The Union will not take sympathy action for other strikes, but the Association does not expect members to cross a picket line. If a picket line exists, the Union must inform the Association at least 2 hours before the cancellation deadline.',
        source: 'Article 7',
      },
      {
        title: 'Automation Protection',
        content:
          'If your job is affected by technological change, the Association provides:\n\n' +
          '1. Training and re-training for other work\n' +
          '2. Relocation to other areas covered by this agreement where jobs are available\n' +
          '3. Voluntary early retirement (if you qualify under the Pension Plan)\n' +
          '4. Supplementary pension arrangements\n\n' +
          'In extreme cases, retirement at age 62 can be required if you are fully qualified under the Supplementary Pension Plan and there is a decline in work opportunity.',
        source: 'Article 14',
      },
    ],
  },
  {
    id: 'ship-dock-work',
    title: 'Ship & Dock Work',
    icon: 'boat-outline',
    subsections: [
      {
        title: 'Deepsea Ship Gangs',
        content:
          'The minimum registered gang for loading or discharging is:\n' +
          '- 1 Hatch Tender\n' +
          '- 1 Winch Driver\n' +
          '- 1 Holdperson\n' +
          '- 1 Side Runner\n' +
          '- 2 Slingpersons\n\n' +
          'Each member must be able to drive winch and be interchangeable. When hand handling cargo, 4 additional holdpersons for discharge or 6 for loading.\n\n' +
          'On Gantry crane vessels, a registered gang is only needed when slingpersons and holdpersons are required on a continuous basis and gang members have Gantry ratings.',
        source: 'Article 19',
      },
      {
        title: 'Dock Work Scope',
        content:
          'Dock work includes:\n' +
          '- Handling goods to/from ship slings or barges\n' +
          '- Loading/unloading railway cars, trucks, and trailers\n' +
          '- Piling and breaking down cargo\n' +
          '- Removing goods from pallet boards\n' +
          '- Building loads on dock\n' +
          '- Checking of goods (at the Employer\'s option)\n' +
          '- Shoring and securing railway cars\n' +
          '- Handling ships\' lines\n' +
          '- Regular maintenance work (when jointly rated employees are available)',
        source: 'Article 26',
      },
      {
        title: 'Handling of Lines',
        content:
          'Lines work covers tying up and letting go vessels.\n\n' +
          'Pay: Minimum 4 hours at the applicable shift rate(s) for the first call each day. Same 4-hour minimum for each subsequent call.\n\n' +
          'Lines employees are not subject to normal Despatch Times, Starting Times, or Meal Hours.\n\n' +
          'You can be transferred berth-to-berth or dock-to-dock within a port to work out your minimum pay period. No pyramiding or overlapping of minimums.',
        source: 'Article 26.04',
      },
      {
        title: 'Continuous Operations',
        content:
          'In continuous operations (like roll-on/roll-off or sideport operations), you may be required to work from the stow in the vessel through to the final place of rest on the dock (for discharge), or from the dock through to the stow (for loading).\n\n' +
          'Bulk liquid cargo operations are continuous -- they can be performed 24 hours a day, 7 days a week. If working through meal periods, you receive the meal period rate.',
        source: 'Article 20.01(11); Article 21.01(11)',
      },
    ],
  },
  {
    id: 'special-rules',
    title: 'Special Rules',
    icon: 'information-circle-outline',
    subsections: [
      {
        title: 'Daylight Saving Time',
        content:
          'When clocks change for daylight saving time, your pay is affected:\n\n' +
          '- Spring forward: The graveyard shift loses one hour, but the contract has rules to handle this\n' +
          '- Fall back: The graveyard shift gains one hour\n\n' +
          'Specific arrangements are documented in the Black Book (Document #20).',
        source: 'Black Book Document #20',
      },
      {
        title: 'Drug & Alcohol Policy',
        content:
          'There is an industry Drug and Alcohol Policy in effect. Fentanyl has been added to the list of substances tested for (as of 2024).\n\n' +
          'The Employee Assistance Program (EAP) is available for anyone needing help with substance issues.',
        source: 'Black Book Documents #104, #105A',
      },
      {
        title: 'New Technology Committee',
        content:
          'A joint committee exists to address the introduction of new technology on the waterfront. This committee was established in 2019 to ensure that both the Union and Association have input when new technology is deployed.',
        source: 'Black Book Document #107',
      },
      {
        title: 'Shore Power - Container Operations',
        content:
          'There are specific rules governing shore power operations at container terminals, established through the Joint Industry Labour Relations Committee.',
        source: 'Black Book Document #108',
      },
      {
        title: 'Boat Allowance',
        content:
          'If you are a Boatperson required to provide a boat as per Article 20, you receive $5.00 per hour as a boat allowance on top of your regular pay.',
        source: 'Article 25',
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Get the wage year data for a given date.
 * Returns the appropriate year's rates based on the effective dates.
 */
export function getWageYearForDate(date: Date): YearRates {
  const effectiveDates = [
    new Date('2026-04-01'),
    new Date('2025-04-01'),
    new Date('2024-04-01'),
    new Date('2023-04-01'),
  ];
  const yearIndices = [3, 2, 1, 0]; // year 4, 3, 2, 1

  for (let i = 0; i < effectiveDates.length; i++) {
    if (date >= effectiveDates[i]) {
      return WAGE_TABLES.years[yearIndices[i]];
    }
  }
  // Default to year 1 if before April 2023
  return WAGE_TABLES.years[0];
}

/**
 * Get the skill differential amount for a given job name.
 * Returns 0 if the job is not found in any classification.
 */
export function getSkillDifferential(jobName: string): { class: string; amount: number } {
  const normalizedJob = jobName.toUpperCase().trim();
  for (const [className, classData] of Object.entries(SKILL_DIFFERENTIALS)) {
    if (classData.jobs.some((job) => normalizedJob.includes(job) || job.includes(normalizedJob))) {
      return { class: className, amount: classData.amount };
    }
  }
  return { class: 'BASE', amount: 0 };
}

/**
 * Get the vacation pay rate for a given number of years of service.
 */
export function getVacationRate(yearsOfService: number): VacationTier {
  for (const tier of VACATION_RATES) {
    if (yearsOfService >= tier.minYears && (tier.maxYears === null || yearsOfService <= tier.maxYears)) {
      return tier;
    }
  }
  return VACATION_RATES[0];
}

/**
 * Calculate the hourly rate for a given shift, day type, and year,
 * including the skill differential for a specific job.
 */
export function calculateHourlyRate(
  shift: 'DAY' | 'NIGHT' | 'GRAVEYARD',
  dayType: 'MON-FRI' | 'SAT' | 'SUN-HOL',
  yearIndex: number,
  jobName?: string,
): number {
  const yearData = WAGE_TABLES.years[Math.min(yearIndex, WAGE_TABLES.years.length - 1)];
  const baseRate = yearData.shifts[shift][dayType];
  const differential = jobName ? getSkillDifferential(jobName).amount : 0;
  return baseRate + differential;
}

/**
 * Check if a given date is a recognized holiday.
 * Note: This is a simplified check -- Good Friday, Easter Monday, Victoria Day,
 * BC Day, Labour Day, Thanksgiving, and Family Day fall on different dates each year.
 * For production use, integrate a proper holiday calendar library.
 */
export function isRecognizedHoliday(date: Date): boolean {
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Fixed-date holidays
  if (month === 0 && day === 1) return true; // New Year's Day
  if (month === 6 && day === 1) return true; // Canada Day
  if (month === 8 && day === 30) return true; // Truth and Reconciliation
  if (month === 10 && day === 11) return true; // Remembrance Day
  if (month === 11 && day === 25) return true; // Christmas Day
  if (month === 11 && day === 26) return true; // Boxing Day

  // Variable holidays would need a proper calendar library
  // (Good Friday, Easter Monday, Victoria Day, BC Day, Labour Day,
  //  Thanksgiving, Family Day)
  return false;
}
