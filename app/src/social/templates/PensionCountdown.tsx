/**
 * PENSION COUNTDOWN TEMPLATES
 * Weekly update format for serialized content
 *
 * Story arc: Following progress toward $120k pension goal
 */

import { Slide, TikTokSlide, Logo, ProgressBar, StatCard, DataBadge, SourceBadge } from '../components'
import { Target, TrendingUp, TrendingDown, Calendar, Flame, AlertTriangle, CheckCircle } from 'lucide-react'

interface PensionData {
  weekNumber: number
  currentEarnings: number
  goal: number
  thisWeekEarnings: number
  shiftsThisWeek: number
  projectedDate: string
  status: 'ahead' | 'on-track' | 'behind'
  streak?: number
}

// =============================================================================
// INSTAGRAM CAROUSEL VERSION
// =============================================================================

export function PensionCountdown_Slide1({ data }: { data: PensionData }) {
  const percentage = (data.currentEarnings / data.goal) * 100

  return (
    <Slide variant="navy">
      <Logo size="md" />

      <div className="flex-1 flex flex-col justify-center">
        <DataBadge>
          <Calendar size={16} />
          Week {data.weekNumber} of 52
        </DataBadge>

        <h1 className="text-[72px] font-bold leading-tight mt-8">
          Pension
          <span className="text-blue-400"> Countdown</span>
        </h1>

        <div className="mt-8">
          <div className="text-6xl font-bold text-blue-400">
            {percentage.toFixed(1)}%
          </div>
          <div className="text-2xl text-slate-400 mt-2">
            ${data.currentEarnings.toLocaleString()} of ${data.goal.toLocaleString()}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {data.status === 'ahead' && (
            <div className="flex items-center gap-2 text-green-400 text-xl">
              <TrendingUp size={24} />
              <span>Running ahead of pace</span>
            </div>
          )}
          {data.status === 'on-track' && (
            <div className="flex items-center gap-2 text-blue-400 text-xl">
              <Target size={24} />
              <span>On track</span>
            </div>
          )}
          {data.status === 'behind' && (
            <div className="flex items-center gap-2 text-orange-400 text-xl">
              <AlertTriangle size={24} />
              <span>Behind pace - recovery needed</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-slate-500 text-lg">Swipe for this week's breakdown →</div>
    </Slide>
  )
}

export function PensionCountdown_Slide2({ data }: { data: PensionData }) {
  const percentage = (data.currentEarnings / data.goal) * 100
  const targetPace = (data.weekNumber / 52) * 100
  const paceVsTarget = percentage - targetPace

  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Week {data.weekNumber} Progress</h2>
        <div className="text-slate-500">2/4</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* Main Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-5xl font-bold">${data.currentEarnings.toLocaleString()}</span>
            <span className="text-2xl text-slate-500">/ ${data.goal.toLocaleString()}</span>
          </div>
          <ProgressBar value={data.currentEarnings} max={data.goal} size="lg" variant="blue" />
        </div>

        {/* This Week Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <StatCard
            value={`$${data.thisWeekEarnings.toLocaleString()}`}
            label="This week"
            sublabel={`${data.shiftsThisWeek} shifts`}
            variant="highlight"
            size="md"
          />
          <StatCard
            value={`${paceVsTarget > 0 ? '+' : ''}${paceVsTarget.toFixed(1)}%`}
            label="vs target pace"
            variant={paceVsTarget >= 0 ? 'success' : 'warning'}
            size="md"
          />
        </div>

        {/* Pace Indicator */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Target for Week {data.weekNumber}:</span>
            <span className="text-xl font-bold">
              ${Math.round((data.goal / 52) * data.weekNumber).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-slate-400">Actual:</span>
            <span className={`text-xl font-bold ${paceVsTarget >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
              ${data.currentEarnings.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <SourceBadge />
    </Slide>
  )
}

export function PensionCountdown_Slide3({ data }: { data: PensionData }) {
  const remaining = data.goal - data.currentEarnings
  const weeksLeft = 52 - data.weekNumber
  const requiredPerWeek = remaining / weeksLeft

  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Path to $120k</h2>
        <div className="text-slate-500">3/4</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-6">
          {/* Remaining */}
          <div className="bg-slate-800 rounded-2xl p-6">
            <div className="text-slate-400 mb-2">Still needed:</div>
            <div className="text-5xl font-bold">${remaining.toLocaleString()}</div>
          </div>

          {/* Weeks Left */}
          <div className="bg-slate-800 rounded-2xl p-6">
            <div className="text-slate-400 mb-2">Weeks remaining:</div>
            <div className="text-5xl font-bold">{weeksLeft}</div>
          </div>

          {/* Required Pace */}
          <div className="bg-blue-600 rounded-2xl p-6">
            <div className="text-blue-200 mb-2">Required per week:</div>
            <div className="text-5xl font-bold">${Math.round(requiredPerWeek).toLocaleString()}</div>
            <div className="text-blue-200 mt-2">~{Math.ceil(requiredPerWeek / 560)} shifts/week at avg</div>
          </div>
        </div>

        {/* Projection */}
        <div className="mt-8 flex items-center gap-3 text-xl">
          {data.status !== 'behind' ? (
            <>
              <CheckCircle className="text-green-400" size={28} />
              <span>
                Projected to hit goal by <span className="text-green-400 font-bold">{data.projectedDate}</span>
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="text-orange-400" size={28} />
              <span>
                Need to increase pace by <span className="text-orange-400 font-bold">15%</span> to hit goal
              </span>
            </>
          )}
        </div>
      </div>

      <SourceBadge />
    </Slide>
  )
}

export function PensionCountdown_Slide4({ data }: { data: PensionData }) {
  return (
    <Slide variant="gradient">
      <Logo size="lg" />

      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-5xl font-bold mb-4">Track Your Progress</h1>
        <p className="text-2xl text-blue-200 mb-8">
          Know exactly where you stand. Every week.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold">{data.weekNumber}</div>
            <div className="text-blue-200 mt-2">Weeks In</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold">{((data.currentEarnings / data.goal) * 100).toFixed(0)}%</div>
            <div className="text-blue-200 mt-2">Complete</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold">{data.projectedDate.split(' ')[0]}</div>
            <div className="text-blue-200 mt-2">Goal Date</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl text-2xl font-bold mx-auto">
          Start Tracking Free
        </div>
      </div>

      <div className="text-center text-blue-200">Link in bio</div>
    </Slide>
  )
}

// =============================================================================
// TIKTOK VERSION (Vertical, Single Slide)
// =============================================================================

export function PensionCountdown_TikTok({ data }: { data: PensionData }) {
  const remaining = data.goal - data.currentEarnings
  const weeksLeft = 52 - data.weekNumber

  return (
    <TikTokSlide variant="navy">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Logo size="sm" />
        <DataBadge>Week {data.weekNumber}</DataBadge>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-[48px] font-bold leading-tight mb-4">
          Pension Countdown
        </h1>

        {/* Big Number */}
        <div className="my-8">
          <div className="text-[80px] font-bold text-blue-400">
            ${data.currentEarnings.toLocaleString()}
          </div>
          <div className="text-2xl text-slate-400">
            of ${data.goal.toLocaleString()} goal
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar value={data.currentEarnings} max={data.goal} size="lg" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-3xl font-bold">${data.thisWeekEarnings.toLocaleString()}</div>
            <div className="text-slate-400 text-sm">This week</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-3xl font-bold">{data.shiftsThisWeek}</div>
            <div className="text-slate-400 text-sm">Shifts worked</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-orange-400">${remaining.toLocaleString()}</div>
            <div className="text-slate-400 text-sm">Remaining</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-3xl font-bold">{weeksLeft}</div>
            <div className="text-slate-400 text-sm">Weeks left</div>
          </div>
        </div>

        {/* Status */}
        <div className={`rounded-xl p-4 flex items-center gap-3 ${
          data.status === 'ahead' ? 'bg-green-500/20' :
          data.status === 'behind' ? 'bg-orange-500/20' :
          'bg-blue-500/20'
        }`}>
          {data.status === 'ahead' && <TrendingUp className="text-green-400" size={28} />}
          {data.status === 'behind' && <TrendingDown className="text-orange-400" size={28} />}
          {data.status === 'on-track' && <Target className="text-blue-400" size={28} />}
          <div>
            <div className="font-semibold">
              {data.status === 'ahead' && 'Running ahead!'}
              {data.status === 'behind' && 'Need to catch up'}
              {data.status === 'on-track' && 'Right on pace'}
            </div>
            <div className="text-sm text-slate-400">
              Projected: {data.projectedDate}
            </div>
          </div>
        </div>

        {/* Streak */}
        {data.streak && data.streak > 0 && (
          <div className="mt-4 flex items-center gap-2 text-orange-400">
            <Flame size={24} />
            <span className="text-xl font-bold">{data.streak} day streak</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center">
        <div className="text-slate-400 text-sm mb-2">Track your own progress</div>
        <div className="text-blue-400 font-semibold">PORTPAL - Link in bio</div>
      </div>
    </TikTokSlide>
  )
}

// =============================================================================
// EXAMPLE DATA FOR PREVIEWS
// =============================================================================

export const examplePensionData: PensionData[] = [
  {
    weekNumber: 4,
    currentEarnings: 12400,
    goal: 120000,
    thisWeekEarnings: 2800,
    shiftsThisWeek: 5,
    projectedDate: 'Nov 12',
    status: 'ahead',
    streak: 12,
  },
  {
    weekNumber: 16,
    currentEarnings: 38500,
    goal: 120000,
    thisWeekEarnings: 2200,
    shiftsThisWeek: 4,
    projectedDate: 'Nov 28',
    status: 'on-track',
    streak: 8,
  },
  {
    weekNumber: 32,
    currentEarnings: 68000,
    goal: 120000,
    thisWeekEarnings: 1800,
    shiftsThisWeek: 3,
    projectedDate: 'Dec 15',
    status: 'behind',
    streak: 0,
  },
]

// Export component collection
export const PensionCountdownSlides = {
  instagram: [
    PensionCountdown_Slide1,
    PensionCountdown_Slide2,
    PensionCountdown_Slide3,
    PensionCountdown_Slide4,
  ],
  tiktok: PensionCountdown_TikTok,
}
