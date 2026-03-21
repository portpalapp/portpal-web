// Waterfront Industry Pension Plan (WIPP) data
// Source: ILWU Canada LCEB Bulletins (Jan 2025, Jan 2026)

export const PENSION_YEAR = {
  // Pension year runs Jan 4 to Jan 3
  currentStart: '2026-01-04',
  currentEnd: '2027-01-03',
};

// 2026 rates (most current)
export const PENSION_2026 = {
  ratePerMonth: 200, // $200/month per year of service
  maxYears: 35,
  maxMonthlyPension: 7000, // 35 x $200
  earningsLimit: 120000, // Full pensionable year
  partialThreshold: 30000, // 25% of $120K for partial year
  employeeContribution: 3600, // Annual
  pensionAdjustment: 21000,
  pensionerCOLA: 1.9, // % increase for existing pensioners
};

// 2025 rates
export const PENSION_2025 = {
  ratePerMonth: 190,
  maxYears: 35,
  maxMonthlyPension: 6650, // 35 x $190
  earningsLimit: 120000,
  partialThreshold: 30000,
  employeeContribution: 3600,
};

// Special Early Retirement (SER) rules
export const SER_RULES = {
  description: 'Zero reduction if you qualify',
  qualifications: [
    'Age 60 + 25 years of Credited Service',
    'Age 55+ where age + years of service >= 90',
    'At least 2 years of service in last 36 months',
    'Must terminate employment and sign declaration',
  ],
};

// Early Retirement Bridge
export const BRIDGE = {
  ratePerYear: 36.35, // $36.35 per year of credited service
  maxYears25: 25, // Standard max
  maxYears35: 35, // If 35+ pension years and retiring before 65
  description: 'Bridges income from retirement to age 65 (when CPP starts)',
  note: 'CPP reduced 7.2% per year taken early (max 36% at age 60)',
};

// Retiring Allowance (M&M)
export const RETIRING_ALLOWANCE = {
  amount2024: 91250,
  amount2025: 93750, // Effective Apr 1, 2025
  requirements: '25 years qualifying service + age 55+',
  note: 'Must terminate employment to collect',
};

// CPP / OAS maximums (2025)
export const GOVT_BENEFITS = {
  cppMax65: 1433.00,
  cppMax62: 1123.47,
  cppMax60: 917.12,
  oasMax65: 727.67,
  cppReductionPerYear: 7.2, // % per year before 65
  cppMaxReduction: 36, // % at age 60
};

// Retirement scenarios table
export const RETIREMENT_SCENARIOS: {
  age: number;
  years: number;
  pension: number;
  bridge: number;
  cpp: number;
  oas: number;
  total: number;
}[] = [
  { age: 55, years: 35, pension: 6650, bridge: 1272.25, cpp: 0, oas: 0, total: 7922.25 },
  { age: 60, years: 25, pension: 4750, bridge: 545.25, cpp: 917.12, oas: 0, total: 6212.37 },
  { age: 60, years: 35, pension: 6650, bridge: 1272.25, cpp: 917.12, oas: 0, total: 8839.37 },
  { age: 62, years: 25, pension: 4750, bridge: 908.75, cpp: 1123.47, oas: 0, total: 6782.22 },
  { age: 62, years: 35, pension: 6650, bridge: 1272.25, cpp: 1123.47, oas: 0, total: 9045.72 },
  { age: 65, years: 25, pension: 4750, bridge: 0, cpp: 1433.00, oas: 727.67, total: 6910.67 },
  { age: 65, years: 35, pension: 6650, bridge: 0, cpp: 1433.00, oas: 727.67, total: 8810.67 },
];

// Pension calculation table (2025 rates: $190/month per year, 10-year guarantee)
// pensionTable[age][yearsOfService] = monthly pension amount
export const PENSION_TABLE: Record<number, Record<number, number>> = {
  55: { 10:1007, 11:1107, 12:1208, 13:1309, 14:1409, 15:1510, 16:1611, 17:1711, 18:1812, 19:1913, 20:2014, 21:2114, 22:2215, 23:2316, 24:2416, 25:2517, 26:2618, 27:2718, 28:2819, 29:2920, 30:3021, 31:3121, 32:3222, 33:3323, 34:3423, 35:6650 },
  56: { 10:1083, 11:1191, 12:1299, 13:1407, 14:1516, 15:1624, 16:1732, 17:1841, 18:1949, 19:2057, 20:2166, 21:2274, 22:2382, 23:2490, 24:2599, 25:2707, 26:2815, 27:2924, 28:3032, 29:3140, 30:3249, 31:3357, 32:3465, 33:3573, 34:6460, 35:6650 },
  57: { 10:1140, 11:1254, 12:1368, 13:1482, 14:1596, 15:1710, 16:1824, 17:1938, 18:2025, 19:2166, 20:2280, 21:2394, 22:2508, 23:2622, 24:2736, 25:2850, 26:2964, 27:3078, 28:3192, 29:3306, 30:3420, 31:3534, 32:3648, 33:6270, 34:6460, 35:6650 },
  58: { 10:1216, 11:1337, 12:1459, 13:1580, 14:1702, 15:1824, 16:1945, 17:2067, 18:2188, 19:2310, 20:2432, 21:2553, 22:2675, 23:2796, 24:2918, 25:3040, 26:3161, 27:3283, 28:3404, 29:3526, 30:3648, 31:3769, 32:6080, 33:6270, 34:6460, 35:6650 },
  59: { 10:1292, 11:1421, 12:1550, 13:1679, 14:1808, 15:1938, 16:2067, 17:2196, 18:2325, 19:2454, 20:2584, 21:2713, 22:2842, 23:2971, 24:3100, 25:3230, 26:3359, 27:3488, 28:3617, 29:3746, 30:3876, 31:5890, 32:6080, 33:6270, 34:6460, 35:6650 },
  60: { 10:1387, 11:1525, 12:1664, 13:1803, 14:1941, 15:2080, 16:2219, 17:2357, 18:2496, 19:2635, 20:2774, 21:2912, 22:3051, 23:3190, 24:3328, 25:4750, 26:4940, 27:5130, 28:5230, 29:5510, 30:5700, 31:5890, 32:6080, 33:6270, 34:6460, 35:6650 },
  61: { 10:1463, 11:1609, 12:1755, 13:1901, 14:2048, 15:2194, 16:2340, 17:2487, 18:2633, 19:2779, 20:2926, 21:3072, 22:3218, 23:3364, 24:3511, 25:4750, 26:4940, 27:5130, 28:5230, 29:5510, 30:5700, 31:5890, 32:6080, 33:6270, 34:6460, 35:6650 },
  62: { 10:1558, 11:1713, 12:1869, 13:2025, 14:2181, 15:2337, 16:2492, 17:2648, 18:2804, 19:2960, 20:3116, 21:3271, 22:3427, 23:3583, 24:3739, 25:4750, 26:4940, 27:5130, 28:5230, 29:5510, 30:5700, 31:5890, 32:6080, 33:6270, 34:6460, 35:6650 },
  63: { 10:1672, 11:1839, 12:2006, 13:2173, 14:2340, 15:2508, 16:2675, 17:2842, 18:3009, 19:3176, 20:3344, 21:3511, 22:3678, 23:3845, 24:4012, 25:4750, 26:4940, 27:5130, 28:5230, 29:5510, 30:5700, 31:5890, 32:6080, 33:6270, 34:6460, 35:6650 },
  64: { 10:1786, 11:1964, 12:2143, 13:2321, 14:2500, 15:2679, 16:2857, 17:3036, 18:3214, 19:3393, 20:3572, 21:3750, 22:3929, 23:4107, 24:4286, 25:4750, 26:4940, 27:5130, 28:5230, 29:5510, 30:5700, 31:5890, 32:6080, 33:6270, 34:6460, 35:6650 },
  65: { 10:1900, 11:2090, 12:2280, 13:2470, 14:2660, 15:2850, 16:3040, 17:3230, 18:3420, 19:3610, 20:3800, 21:3990, 22:4180, 23:4370, 24:4560, 25:4750, 26:4940, 27:5130, 28:5230, 29:5510, 30:5700, 31:5890, 32:6080, 33:6270, 34:6460, 35:6650 },
};

// Helper: estimate monthly pension from age and years of service
export function estimatePension(age: number, yearsOfService: number): number {
  const clampedAge = Math.min(65, Math.max(55, age));
  const clampedYears = Math.min(35, Math.max(10, yearsOfService));
  const ageRow = PENSION_TABLE[clampedAge];
  if (!ageRow) return 0;
  return ageRow[clampedYears] || 0;
}

// Helper: calculate bridge benefit
export function calculateBridge(yearsOfService: number, retirementAge: number): number {
  if (retirementAge >= 65) return 0;
  const maxYears = yearsOfService >= 35 ? 35 : 25;
  const years = Math.min(yearsOfService, maxYears);
  return Math.round(BRIDGE.ratePerYear * years * 100) / 100;
}

// Helper: estimate total retirement income
export function estimateRetirementIncome(age: number, yearsOfService: number) {
  const pension = estimatePension(age, yearsOfService);
  const bridge = calculateBridge(yearsOfService, age);

  let cpp = 0;
  if (age >= 65) cpp = GOVT_BENEFITS.cppMax65;
  else if (age >= 62) cpp = GOVT_BENEFITS.cppMax62;
  else if (age >= 60) cpp = GOVT_BENEFITS.cppMax60;

  const oas = age >= 65 ? GOVT_BENEFITS.oasMax65 : 0;

  return {
    pension,
    bridge,
    cpp,
    oas,
    total: pension + bridge + cpp + oas,
  };
}

// Pension progress helpers
export function getPensionYearProgress(ytdEarnings: number) {
  const limit = PENSION_2026.earningsLimit;
  const partial = PENSION_2026.partialThreshold;
  const pct = Math.min((ytdEarnings / limit) * 100, 100);
  const qualifiesPartial = ytdEarnings >= partial;
  const qualifiesFull = ytdEarnings >= limit;
  return { pct, qualifiesPartial, qualifiesFull, limit, partial };
}
