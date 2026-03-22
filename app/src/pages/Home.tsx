import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Anchor, Flame, Trophy, TrendingUp, ChevronRight, Sparkles, Target, Calendar, Loader2, Gift, Info, BarChart3, Newspaper } from 'lucide-react'
import {
  calculateWeeklyEarnings,
  calculateYTDEarnings,
} from '../data/mockData'
import { useShifts } from '../hooks/useShifts'
import type { Shift } from '../hooks/useShifts'
import { useProfile } from '../hooks/useProfile'
import { formatDateRelative, formatDateCompact, formatCurrency, getLocalDateStr } from '../lib/formatters'
import { getUpcomingHolidays, getHolidayOnDate, daysUntil, type StatHoliday } from '../data/holidayData'
import { useNews } from '../hooks/useNews'
import { useWorkInfo, getLocationsForLocal } from '../hooks/useWorkInfo'
import type { ShiftTotal, JobSection } from '../hooks/useWorkInfo'

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
  const [showHolidayInfo, setShowHolidayInfo] = useState(false)
  const { articles: newsArticles } = useNews()
  const workInfoLocations = getLocationsForLocal(profile.union_local ?? '500')
  const { snapshots: workInfoSnapshots } = useWorkInfo(workInfoLocations)

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

  // Upcoming stat holidays with qualifying info
  const upcomingHolidays = getUpcomingHolidays(3)
  const todayStr = getLocalDateStr(new Date())

  // Check if today is a stat holiday and user hasn't logged a shift
  const todayHoliday = getHolidayOnDate(todayStr)
  const hasLoggedTodayShift = shifts.some(s => s.date.slice(0, 10) === todayStr)

  function getShiftsInPeriod(h: StatHoliday): number {
    return shifts.filter(s => {
      const d = s.date.slice(0, 10)
      return d >= h.countingPeriodStart && d <= h.countingPeriodEnd
    }).length
  }

  function getHolidayStatus(h: StatHoliday): 'qualifying' | 'in-progress' | 'at-risk' {
    const worked = getShiftsInPeriod(h)
    if (worked >= 15) return 'qualifying'
    if (todayStr <= h.countingPeriodEnd) return 'in-progress'
    return 'at-risk'
  }

  // Monthly earnings
  const monthStart = todayStr.slice(0, 7) + '-01'
  const thisMonthShifts = shifts.filter(s => s.date.slice(0, 10) >= monthStart)
  const thisMonthEarnings = thisMonthShifts.reduce((sum, s) => sum + s.totalPay, 0)
  const avgPerShift = thisMonthShifts.length > 0 ? thisMonthEarnings / thisMonthShifts.length : 0

  // Top jobs this month
  const monthJobCounts = new Map<string, { count: number; pay: number }>()
  for (const s of thisMonthShifts) {
    const prev = monthJobCounts.get(s.job) || { count: 0, pay: 0 }
    monthJobCounts.set(s.job, { count: prev.count + 1, pay: prev.pay + s.totalPay })
  }
  const topMonthJobs = [...monthJobCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)

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

      {/* Stat Holiday Prompt — shows when today is a holiday */}
      {todayHoliday && !hasLoggedTodayShift && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
              <Gift size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Happy {todayHoliday.name}!</p>
              <p className="text-xs text-amber-700 mt-0.5">Working today? Holiday shifts pay <strong>2x rates</strong>.</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => navigate('/shifts')}
                  className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700"
                >
                  Log Holiday Shift
                </button>
                <button
                  onClick={() => navigate('/shifts')}
                  className="px-3 py-1.5 bg-white text-amber-700 text-xs font-medium rounded-lg border border-amber-200 hover:bg-amber-50"
                >
                  Day Off
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Work Available — shift totals from BCMEA */}
      {workInfoSnapshots.length > 0 && (() => {
        const van = workInfoSnapshots.find(s => s.location === 'vancouver')
        if (!van) return null
        const shiftLabels: Record<string, string> = { '08:00': 'Day', '16:30': 'Night', '01:00': 'Graveyard' }
        const shiftOrder = ['08:00', '16:30', '01:00']
        const totals = (van.totals || []).filter((t: ShiftTotal) => shiftOrder.includes(t.shift))
          .sort((a: ShiftTotal, b: ShiftTotal) => shiftOrder.indexOf(a.shift) - shiftOrder.indexOf(b.shift))
        const totalJobs = totals.reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
        const topSections = ((van.sections || []) as JobSection[])
          .filter((sec: JobSection) => {
            const secTotal = (sec.totals || []).reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
            return secTotal > 0
          })
          .sort((a: JobSection, b: JobSection) => {
            const aTotal = (a.totals || []).reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
            const bTotal = (b.totals || []).reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
            return bTotal - aTotal
          })
          .slice(0, 4)

        return (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <BarChart3 size={16} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-800">Work Available</h3>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {totalJobs} jobs
                </span>
              </div>
              <span className="text-[10px] text-slate-400">{van.stamp.split('_')[1]?.replace(/(\d{2})(\d{2})/, '$1:$2')}</span>
            </div>

            {/* Shift totals */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {totals.map((t: ShiftTotal) => (
                <div key={t.shift} className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-medium text-slate-400 uppercase">{shiftLabels[t.shift] ?? t.shift}</p>
                  <p className="text-lg font-bold text-slate-800">{Number(t.pre || 0)}</p>
                  <p className="text-[10px] text-slate-400">{t.date}</p>
                </div>
              ))}
            </div>

            {/* Top sections */}
            {topSections.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topSections.map((sec: JobSection) => {
                  const secTotal = (sec.totals || []).reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
                  return (
                    <span key={sec.section} className="text-[10px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      {sec.section} ({secTotal})
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

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

      {/* Upcoming Stat Holidays — compact */}
      {upcomingHolidays.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-green-600" />
              <h3 className="font-semibold text-slate-800">Stat Holidays</h3>
            </div>
            <button
              onClick={() => navigate('/holidays')}
              className="text-xs text-blue-600 font-medium flex items-center gap-1"
            >
              All Holidays <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {upcomingHolidays.slice(0, 2).map(h => {
              const worked = getShiftsInPeriod(h)
              const status = getHolidayStatus(h)
              const days = daysUntil(h.date)

              return (
                <button
                  key={h.date}
                  onClick={() => navigate('/holidays')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    status === 'qualifying' ? 'bg-green-500' :
                    status === 'at-risk' ? 'bg-red-400' :
                    'bg-blue-500'
                  }`} />

                  {/* Name + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{h.name}</p>
                    <p className="text-xs text-slate-500">{formatDateCompact(h.date)} &middot; {days}d away</p>
                  </div>

                  {/* Shifts count */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${
                      status === 'qualifying' ? 'text-green-600' :
                      worked > 0 ? 'text-blue-600' : 'text-slate-400'
                    }`}>
                      {worked}/15
                    </p>
                    <p className="text-[10px] text-slate-400">shifts</p>
                  </div>

                  <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                </button>
              )
            })}
          </div>

          {/* Collapsible info */}
          <button
            onClick={() => setShowHolidayInfo(v => !v)}
            className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Info size={12} />
            <span>{showHolidayInfo ? 'Hide info' : 'How does stat pay work?'}</span>
          </button>
          {showHolidayInfo && (
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Work <strong className="text-slate-700">15+ shifts</strong> in the 4-week counting period before each holiday for full stat pay (8 hours). Fewer shifts = partial pay (1/20th per shift).
            </p>
          )}
        </div>
      )}

      {/* Monthly Summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-800">
            {new Date().toLocaleDateString('en-US', { month: 'long' })} Summary
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 bg-slate-50 rounded-xl">
            <p className="text-lg font-bold text-slate-800">{thisMonthShifts.length}</p>
            <p className="text-[10px] text-slate-500">Shifts</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-xl">
            <p className="text-lg font-bold text-slate-800">{formatCurrency(thisMonthEarnings)}</p>
            <p className="text-[10px] text-slate-500">Earned</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-xl">
            <p className="text-lg font-bold text-slate-800">{formatCurrency(avgPerShift)}</p>
            <p className="text-[10px] text-slate-500">Avg/Shift</p>
          </div>
        </div>

        {/* Top jobs this month */}
        {topMonthJobs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">Top Jobs</p>
            {topMonthJobs.map(([job, { count, pay }]) => (
              <div key={job} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-slate-700">{job}</span>
                </div>
                <span className="text-slate-500 text-xs">{count}x &middot; {formatCurrency(pay)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest News */}
      {newsArticles.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Newspaper size={18} className="text-slate-600" />
              <h3 className="font-semibold text-slate-800">Port News</h3>
            </div>
            <button
              onClick={() => navigate('/news')}
              className="text-xs text-blue-600 font-medium flex items-center gap-1"
            >
              All News <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {newsArticles.slice(0, 3).map(article => (
              <button
                key={article.id}
                onClick={() => navigate('/news')}
                className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <div className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${
                  article.category === 'union' ? 'bg-blue-100 text-blue-700' :
                  article.category === 'port' ? 'bg-green-100 text-green-700' :
                  article.category === 'employer' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {article.category}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 line-clamp-2">{article.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateRelative(article.published_at)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
