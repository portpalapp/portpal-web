// PORTPAL Brand System
// Used across all social media content

export const brand = {
  colors: {
    // Primary
    navy: '#1e3a5f',
    blue: '#2563eb',
    blueLight: '#3b82f6',
    blueDark: '#1d4ed8',

    // Accent
    orange: '#f97316',
    orangeLight: '#fb923c',
    amber: '#f59e0b',

    // Neutrals
    slate900: '#0f172a',
    slate800: '#1e293b',
    slate700: '#334155',
    slate600: '#475569',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate300: '#cbd5e1',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    slate50: '#f8fafc',
    white: '#ffffff',

    // Semantic
    success: '#16a34a',
    successLight: '#22c55e',
    warning: '#eab308',
    error: '#dc2626',

    // Gradients (as CSS strings)
    gradientBlue: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    gradientNavy: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
    gradientOrange: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    gradientPurple: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
  },

  fonts: {
    // System font stack for reliability
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },

  // Social media dimensions
  dimensions: {
    instagramCarousel: { width: 1080, height: 1350 },
    instagramSquare: { width: 1080, height: 1080 },
    instagramStory: { width: 1080, height: 1920 },
    tiktok: { width: 1080, height: 1920 },
    twitterPost: { width: 1200, height: 675 },
  },

  // Typography scale
  type: {
    hero: { size: '72px', weight: 800, lineHeight: 1.1 },
    h1: { size: '56px', weight: 700, lineHeight: 1.2 },
    h2: { size: '42px', weight: 700, lineHeight: 1.25 },
    h3: { size: '32px', weight: 600, lineHeight: 1.3 },
    large: { size: '24px', weight: 500, lineHeight: 1.4 },
    body: { size: '20px', weight: 400, lineHeight: 1.5 },
    small: { size: '16px', weight: 400, lineHeight: 1.5 },
    caption: { size: '14px', weight: 500, lineHeight: 1.4 },
  },
}

// Real data from PORTPAL analysis
export const realData = {
  totalShifts: 71712,
  totalJobs: 42,
  totalLocations: 24,
  totalCombos: 990,

  // Top earning jobs (night shift, Mon-Fri)
  topJobs: [
    { job: 'HD MECHANIC', perShift: 648, hourly: 72.17, class: 'CLASS_1' },
    { job: 'ELECTRICIAN', perShift: 648, hourly: 72.17, class: 'CLASS_1' },
    { job: 'RTG (WEEKEND)', perShift: 634, hourly: 89.48, class: 'CLASS_2' },
    { job: 'TRAINER', perShift: 590, hourly: 73.75, class: 'TRAINER' },
    { job: 'SHIP GANTRY', perShift: 567, hourly: 70.67, class: 'CLASS_2' },
    { job: 'TRACTOR TRAILER', perShift: 562, hourly: 70.32, class: 'CLASS_3' },
    { job: 'LABOUR', perShift: 497, hourly: 55.30, class: 'BASE' },
  ],

  // Common pay mistakes
  payMistakes: [
    {
      issue: 'Wrong differential class',
      example: 'TT coded as BASE instead of Class 3',
      loss: 5.20, // per shift
      annual: 1040, // 200 shifts
    },
    {
      issue: 'Saturday coded as Friday',
      example: 'Day rate $55.95 instead of $71.43',
      loss: 123.84, // 8 hours
      annual: 2477, // 20 Saturdays
    },
    {
      issue: 'Centennial hours wrong',
      example: '8 hours instead of 9',
      loss: 70.32, // 1 hour at TT night rate
      annual: 3516, // 50 shifts
    },
    {
      issue: 'OT on base rate',
      example: '1.5x base instead of 1.5x differential rate',
      loss: 0.98, // per OT hour
      annual: 196, // 200 OT hours
    },
  ],

  // Pension data
  pension: {
    yearStart: 'Jan 4, 2026',
    yearEnd: 'Jan 3, 2027',
    goal: 120000,
    avgWeeklyToHit: 2308, // $120k / 52 weeks
  },

  // Differentials
  differentials: [
    { class: 'CLASS_1', amount: 2.50, jobs: ['HD Mechanic', 'Electrician', 'Welder', 'Carpenter'] },
    { class: 'CLASS_2', amount: 1.00, jobs: ['RTG', 'Ship Gantry', 'First Aid'] },
    { class: 'CLASS_3', amount: 0.65, jobs: ['Tractor Trailer', 'Loci', '40 Ton'] },
    { class: 'CLASS_4', amount: 0.50, jobs: ['Lift Truck', 'Gearperson'] },
    { class: 'WHEAT', amount: 1.15, jobs: ['Wheat Machine', 'Wheat Specialty'] },
    { class: 'BASE', amount: 0, jobs: ['Labour', 'Head Checker', 'Dock Checker'] },
  ],
}
