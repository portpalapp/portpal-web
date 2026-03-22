import { useNavigate } from 'react-router-dom'
import { Radio, ChevronRight, Clock } from 'lucide-react'
import { useDispatchIntel } from '../hooks/useDispatchIntel'
import type { SignalLevel } from '../hooks/useDispatchIntel'

const SIGNAL_CONFIG: Record<SignalLevel, { dot: string; bg: string; border: string; text: string; label: string }> = {
  Good: {
    dot: 'bg-green-500',
    bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
    border: 'border-green-200',
    text: 'text-green-700',
    label: 'Good',
  },
  Moderate: {
    dot: 'bg-yellow-500',
    bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    label: 'Moderate',
  },
  Low: {
    dot: 'bg-red-400',
    bg: 'bg-gradient-to-r from-red-50 to-orange-50',
    border: 'border-red-200',
    text: 'text-red-600',
    label: 'Low',
  },
}

export function DispatchSignal() {
  const navigate = useNavigate()
  const { data, loading, nextWindow } = useDispatchIntel()

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  // No data yet — collecting state
  if (!data || !data.hasData) {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-4 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Radio size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Dispatch Intelligence</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Collecting data. First insights available after tomorrow's morning dispatch.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const config = SIGNAL_CONFIG[data.signal]
  const activeLabel = data.activeWindow?.windowType ?? null
  const isActiveDispatch = activeLabel !== null

  // Build the key stat line
  let keyStat = ''
  if (data.latestDayShift) {
    const { pre, at } = data.latestDayShift
    keyStat = `${at} of ${pre} jobs filled`
  }

  // Day-of-week context for casuals
  let dayContext = ''
  if (data.isWeekend) {
    dayContext = `${data.dayName} \u2014 members take most jobs`
  } else {
    dayContext = `${data.dayName} \u2014 best chances for casuals`
  }

  return (
    <button
      onClick={() => navigate('/dispatch')}
      aria-label="View dispatch intelligence details"
      className={`w-full ${config.bg} rounded-2xl p-4 border ${config.border} text-left`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/70 rounded-xl flex-shrink-0">
          <Radio size={20} className={config.text} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Signal label + dot */}
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2.5 h-2.5 rounded-full ${config.dot} ${isActiveDispatch ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-bold ${config.text}`}>
              {config.label}
            </span>
            <span className="text-xs text-slate-500">Dispatch Signal</span>
          </div>

          {/* Key stat */}
          {keyStat && (
            <p className="text-sm font-medium text-slate-800">{keyStat}</p>
          )}

          {/* Active window or next window */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <Clock size={12} className="text-slate-400" />
            {isActiveDispatch ? (
              <span className="text-xs font-medium text-blue-600">{activeLabel}</span>
            ) : (
              <span className="text-xs text-slate-500">Next: {nextWindow}</span>
            )}
          </div>

          {/* Day context */}
          <p className="text-[11px] text-slate-400 mt-1">{dayContext}</p>
        </div>

        <ChevronRight size={18} className="text-slate-300 flex-shrink-0 mt-1" />
      </div>
    </button>
  )
}
