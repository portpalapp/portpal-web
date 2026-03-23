import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Radio, Clock, TrendingUp, BarChart3, Calendar, Loader2, Info } from 'lucide-react'
import { useDispatchIntel } from '../hooks/useDispatchIntel'
import type { SignalLevel, SectionBreakdown, WindowSummary } from '../hooks/useDispatchIntel'
import { DispatchPredictor } from '../components/DispatchPredictor'

// ---------------------------------------------------------------------------
// Signal config
// ---------------------------------------------------------------------------

const SIGNAL_STYLES: Record<SignalLevel, { dot: string; bg: string; text: string; gradientFrom: string; gradientTo: string }> = {
  Good: {
    dot: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600',
  },
  Moderate: {
    dot: 'bg-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-amber-600',
  },
  Low: {
    dot: 'bg-red-400',
    bg: 'bg-red-50',
    text: 'text-red-600',
    gradientFrom: 'from-red-400',
    gradientTo: 'to-orange-500',
  },
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_QUALITY: Record<number, { label: string; color: string }> = {
  0: { label: 'Low', color: 'bg-red-400' },
  1: { label: 'Best', color: 'bg-green-500' },
  2: { label: 'Best', color: 'bg-green-500' },
  3: { label: 'Best', color: 'bg-green-500' },
  4: { label: 'Good', color: 'bg-green-400' },
  5: { label: 'OK', color: 'bg-yellow-400' },
  6: { label: 'Low', color: 'bg-red-400' },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SignalHeader({ signal, reason, dayName }: { signal: SignalLevel; reason: string; dayName: string }) {
  const styles = SIGNAL_STYLES[signal]

  return (
    <div className={`bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} rounded-2xl p-5 text-white`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 bg-white/20 rounded-xl">
          <Radio size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Dispatch Signal</h2>
          <p className="text-white/80 text-sm">{dayName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
        <span className="text-lg font-bold">{signal}</span>
      </div>
      <p className="text-white/90 text-sm">{reason}</p>
    </div>
  )
}

function CurrentWindowCard({ windows, nextWindow }: { windows: WindowSummary[]; nextWindow: string }) {
  const activeWindows = windows.filter(w => w.tickCount > 0)

  if (activeWindows.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">Dispatch Windows</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-slate-500 text-sm">No active dispatch window</p>
          <p className="text-xs text-slate-400 mt-1">Next dispatch: {nextWindow}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={18} className="text-blue-600" />
        <h3 className="font-semibold text-slate-800">Dispatch Windows</h3>
      </div>
      <div className="space-y-3">
        {activeWindows.map(w => {
          const dayShift = w.dayShift
          return (
            <div key={w.windowType} className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 capitalize">{w.windowType}</span>
                <span className="text-xs text-slate-500">{w.tickCount} snapshots</span>
              </div>
              {dayShift && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Day Shift (08:00)</span>
                    <span className="text-sm font-bold text-slate-800">
                      {dayShift.at} / {dayShift.pre} jobs
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(dayShift.fillRate * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{Math.round(dayShift.fillRate * 100)}% filled</span>
                    {w.totalAtDelta > 0 && (
                      <span className="text-green-600 font-medium">
                        +{w.totalAtDelta} dispatched this window
                      </span>
                    )}
                  </div>
                </div>
              )}
              {!dayShift && w.latestTick && (
                <p className="text-xs text-slate-500">
                  {w.latestTick.totals.length} shift{w.latestTick.totals.length !== 1 ? 's' : ''} tracked
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionBreakdownCard({ sections }: { sections: SectionBreakdown[] }) {
  if (sections.length === 0) return null

  // Sort by pre count descending
  const sorted = [...sections].sort((a, b) => b.pre - a.pre)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={18} className="text-slate-600" />
        <h3 className="font-semibold text-slate-800">Category Breakdown</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">Day shift jobs by category</p>
      <div className="space-y-2.5">
        {sorted.map(section => {
          const fillRate = section.pre > 0 ? (section.at / section.pre) * 100 : 0
          return (
            <div key={section.section}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-700 font-medium">{section.section}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {section.at}/{section.pre}
                  </span>
                  {section.delta > 0 && (
                    <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                      +{section.delta}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    fillRate >= 90 ? 'bg-red-400' :
                    fillRate >= 60 ? 'bg-yellow-400' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(fillRate, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <Info size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Dispatch fills categories in order: Trades first, then Dock Gantry, Machine categories, and Labour/HOLD last.
            Earlier categories claim workers first.
          </p>
        </div>
      </div>
    </div>
  )
}

function DayOfWeekPattern({ currentDay }: { currentDay: number }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={18} className="text-slate-600" />
        <h3 className="font-semibold text-slate-800">Weekly Pattern</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">Best days for casual dispatch</p>
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((label, i) => {
          const quality = DAY_QUALITY[i]
          const isToday = i === currentDay
          return (
            <div
              key={label}
              className={`text-center p-2 rounded-xl ${
                isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
            >
              <p className={`text-[10px] font-medium mb-1.5 ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                {label}
              </p>
              <div className={`w-4 h-4 rounded-full mx-auto ${quality.color}`} />
              <p className={`text-[9px] mt-1 ${isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                {quality.label}
              </p>
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <TrendingUp size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Monday-Wednesday typically have the highest job counts. Fridays are moderate.
            Weekends and holidays have the fewest casual opportunities — union members take priority.
          </p>
        </div>
      </div>
    </div>
  )
}

function RecentWindowsCard({ recentWindows }: { recentWindows: WindowSummary[] }) {
  if (recentWindows.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={18} className="text-slate-600" />
        <h3 className="font-semibold text-slate-800">Recent Dispatch History</h3>
      </div>
      <div className="space-y-2">
        {recentWindows.map((w, idx) => {
          const dayShift = w.dayShift
          const date = w.latestTick?.date ?? ''
          const dayOfWeek = w.latestTick?.day_of_week ?? 0

          return (
            <div key={w.latestTick?.date ?? idx} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
              <div className="text-center min-w-[40px]">
                <p className="text-xs font-medium text-slate-600">{DAY_LABELS[dayOfWeek] ?? '?'}</p>
                <p className="text-[10px] text-slate-400">{date.slice(5)}</p>
              </div>
              {dayShift ? (
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {dayShift.at} / {dayShift.pre} jobs
                    </span>
                    <span className="text-xs text-slate-500">
                      {Math.round(dayShift.fillRate * 100)}% filled
                    </span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.min(dayShift.fillRate * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <p className="text-xs text-slate-400">No day shift data</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function DispatchIntel() {
  const navigate = useNavigate()
  const { data, loading, nextWindow } = useDispatchIntel()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 size={36} className="text-blue-600 animate-spin" />
      </div>
    )
  }

  // No data state — still show predictor (it fetches independently)
  if (!data || !data.hasData) {
    return (
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Dispatch Intelligence</h1>
        </div>

        {/* Personal Dispatch Prediction — available even before tick data */}
        <DispatchPredictor />

        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="p-4 bg-blue-50 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Radio size={32} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Collecting Data</h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Dispatch intelligence is collecting data. First insights will be available after tomorrow's morning dispatch.
          </p>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">
              The system monitors dispatch windows every 20 seconds, tracking job counts,
              fill rates, and category breakdowns to help you decide when to call in.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Dispatch Intelligence</h1>
      </div>

      {/* Personal Dispatch Prediction */}
      <DispatchPredictor />

      {/* Signal Header */}
      <SignalHeader signal={data.signal} reason={data.signalReason} dayName={data.dayName} />

      {/* Quick Stats */}
      {data.latestDayShift && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-lg font-bold text-slate-800">{data.latestDayShift.pre}</p>
            <p className="text-[10px] text-slate-500">Jobs Posted</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-lg font-bold text-slate-800">{data.latestDayShift.at}</p>
            <p className="text-[10px] text-slate-500">Jobs Filled</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-lg font-bold text-blue-600">
              {Math.round(data.latestDayShift.fillRate * 100)}%
            </p>
            <p className="text-[10px] text-slate-500">Fill Rate</p>
          </div>
        </div>
      )}

      {/* Current Dispatch Windows */}
      <CurrentWindowCard windows={data.windows} nextWindow={nextWindow} />

      {/* Category Breakdown */}
      <SectionBreakdownCard sections={data.sectionBreakdowns} />

      {/* Day-of-Week Pattern */}
      <DayOfWeekPattern currentDay={data.dayOfWeek} />

      {/* Recent History */}
      <RecentWindowsCard recentWindows={data.recentWindows} />

      {/* Casual advice */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Tip for Casuals</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Check this page the evening before to decide whether to call in. High job counts on
              weekdays (especially Monday-Wednesday) mean the best chances. The signal considers
              job volume, day of week, and how fast dispatch is filling positions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
