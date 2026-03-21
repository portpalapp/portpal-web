import { useNavigate } from 'react-router-dom'
import { Anchor, Flame, Trophy, TrendingUp, ChevronRight, Sparkles, Target, Calendar, Loader2 } from 'lucide-react'
import {
  calculateWeeklyEarnings,
  calculateYTDEarnings,
} from '../data/mockData'
import { useShifts } from '../hooks/useShifts'
import type { Shift } from '../hooks/useShifts'
import { useProfile } from '../hooks/useProfile'
import { formatDateRelative, formatCurrency, getLocalDateStr } from '../lib/formatters'

// Streak: counts consecutive shifts where each gap is <= 48 hours.
// Matches the mobile app logic from mobile/app/(tabs)/index.tsx.
function calculateStreak(shifts: Shift[]): number {
  if (shifts.length === 0) return 0

  const sorted = [...shifts]
    .map((s) => s.date)
    .sort((a, b) => b.localeCompare(a))

  // Deduplicate dates
  const uniqueDates: string[] = []
  for (const d of sorted) {
    if (uniqueDates.length === 0 || uniqueDates[uniqueDates.length - 1] !== d) {
      uniqueDates.push(d)
    }
  }

  // The most recent shift must be within 48 hours of now to count
  const now = new Date()
  const latestShiftDate = new Date(uniqueDates[0] + 'T23:59:59')
  const hoursSinceLatest = (now.getTime() - latestShiftDate.getTime()) / (1000 * 60 * 60)
  if (hoursSinceLatest > 48) return 0

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const curr = new Date(uniqueDates[i - 1] + 'T00:00:00')
    const prev = new Date(uniqueDates[i] + 'T00:00:00')
    const gapDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (gapDays <= 2) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function Home() {
  const navigate = useNavigate()
  const { shifts, loading: shiftsLoading } = useShifts()
  const { profile, loading: profileLoading } = useProfile()

  const loading = shiftsLoading || profileLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 size={36} className="text-blue-600 animate-spin" />
      </div>
    )
  }

  const thisWeekEarnings = calculateWeeklyEarnings(shifts, 0)
  const lastWeekEarnings = calculateWeeklyEarnings(shifts, 1)
  const ytdEarnings = calculateYTDEarnings(shifts)
  const pensionProgress = profile.pensionGoal > 0 ? (ytdEarnings / profile.pensionGoal) * 100 : 0

  // Calculate weeks until pension goal at current rate
  const avgWeeklyEarnings = (thisWeekEarnings + lastWeekEarnings) / 2
  const remainingToGoal = profile.pensionGoal - ytdEarnings
  const weeksToGoal = avgWeeklyEarnings > 0 ? Math.ceil(remainingToGoal / avgWeeklyEarnings) : 0
  const projectedDate = new Date()
  projectedDate.setDate(projectedDate.getDate() + (weeksToGoal * 7))

  // Get this week's shifts (string comparison for timezone safety)
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const weekStartStr = getLocalDateStr(startOfWeek)

  const thisWeekShifts = shifts.filter(s => {
    return s.date.slice(0, 10) >= weekStartStr
  })

  // Calculate streaks and total shifts from real data
  const currentStreak = calculateStreak(shifts)
  const totalShiftsLogged = shifts.length

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">Welcome back,</p>
          <h1 className="text-xl font-bold text-slate-800">{profile.name}</h1>
        </div>
        <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-full">
          <Anchor size={16} />
          <span className="text-sm font-medium">#{profile.seniority}</span>
        </div>
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
          <p className="text-blue-100 text-xs font-medium">This Week</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(thisWeekEarnings)}</p>
          <div className="flex items-center gap-1 mt-2 text-blue-100 text-xs">
            <TrendingUp size={12} />
            <span>{thisWeekShifts.length} shifts</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 text-white">
          <p className="text-slate-300 text-xs font-medium">Last Week</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(lastWeekEarnings)}</p>
          <div className="flex items-center gap-1 mt-2 text-slate-300 text-xs">
            {lastWeekEarnings > 0 && (
              <>
                <span className={thisWeekEarnings > lastWeekEarnings ? 'text-green-400' : 'text-orange-400'}>
                  {thisWeekEarnings > lastWeekEarnings ? '+' : ''}
                  {Math.round(((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100)}%
                </span>
                <span>vs this week</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pension Progress - Clickable for AI insights */}
      <button
        onClick={() => navigate('/chat')}
        className="w-full bg-white rounded-2xl p-4 shadow-sm text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Pension Year Progress</h3>
              <p className="text-xs text-slate-500">Jan 4, 2026 - Jan 3, 2027</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">{formatCurrency(ytdEarnings)}</p>
            <p className="text-xs text-slate-500">of {formatCurrency(profile.pensionGoal)}</p>
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pensionProgress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-slate-500">{pensionProgress.toFixed(1)}% complete</span>
          <div className="flex items-center gap-1 text-xs text-purple-600">
            <Sparkles size={12} />
            <span>Goal by {projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </button>

      {/* Streak & Badges */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Flame className="text-orange-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{currentStreak}</p>
              <p className="text-xs text-orange-600">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Trophy className="text-amber-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{totalShiftsLogged}</p>
              <p className="text-xs text-amber-600">Shifts Logged</p>
            </div>
          </div>
        </div>
      </div>

      {/* This Week's Shifts */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-600" />
            <h3 className="font-semibold text-slate-800">This Week's Shifts</h3>
          </div>
          <button
            onClick={() => navigate('/calendar')}
            className="text-xs text-blue-600 font-medium flex items-center gap-1"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {thisWeekShifts.length > 0 ? (
          <div className="space-y-2">
            {thisWeekShifts.slice(0, 5).map(shift => (
              <div key={shift.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                <div className={`w-2 h-10 rounded-full ${
                  shift.shift === 'DAY' ? 'bg-amber-400' :
                  shift.shift === 'NIGHT' ? 'bg-blue-600' : 'bg-purple-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800 text-sm truncate">{shift.job}</p>
                    <p className="font-semibold text-slate-800">{formatCurrency(shift.totalPay)}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{shift.location} &middot; {shift.shift}</span>
                    <span>{formatDateRelative(shift.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-4">No shifts logged this week</p>
        )}

        {/* Week Total */}
        {thisWeekShifts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-600">Week Total ({thisWeekShifts.length} shifts)</span>
            <span className="font-bold text-slate-800">{formatCurrency(thisWeekEarnings)}</span>
          </div>
        )}
      </div>

      {/* Quick AI Actions */}
      <button
        onClick={() => navigate('/chat')}
        className="w-full bg-slate-100 rounded-2xl p-4 flex items-center gap-3"
      >
        <div className="p-2 bg-purple-100 rounded-xl">
          <Sparkles className="text-purple-600" size={20} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-slate-800">Ask AI anything</p>
          <p className="text-xs text-slate-500">Rates, predictions, collective agreement...</p>
        </div>
        <ChevronRight size={20} className="text-slate-400" />
      </button>
    </div>
  )
}
