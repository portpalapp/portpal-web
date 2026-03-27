import { Anchor, Loader2 } from 'lucide-react'
import {
  calculateWeeklyEarnings,
  calculateYTDEarnings,
} from '../data/mockData'
import { useShifts } from '../hooks/useShifts'
import type { Shift } from '../hooks/useShifts'
import { useProfile } from '../hooks/useProfile'
import { getLocalDateStr } from '../lib/formatters'
import { getUpcomingHolidays, getHolidayOnDate } from '../data/holidayData'
import { useNews } from '../hooks/useNews'
import { DispatchSignal } from '../components/DispatchSignal'
import { useWorkInfo, getLocationsForLocal } from '../hooks/useWorkInfo'
import {
  StatHolidayPrompt,
  EarningsCards,
  WorkAvailableCard,
  PensionProgress,
  StreakBadges,
  StatHolidaysCard,
  MonthlySummary,
  PortNewsCard,
  WeeklyShifts,
  AskAIButton,
} from '../components/home'

// Streak: counts consecutive shifts where each gap is <= 48 hours.
// Matches the mobile app logic from mobile/app/(tabs)/index.tsx.
function calculateStreak(shifts: Shift[]): number {
  if (shifts.length === 0) return 0

  const sorted = [...shifts]
    .map((s) => s.date)
    .filter((d): d is string => d != null)
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
  const { shifts, loading: shiftsLoading } = useShifts()
  const { profile, loading: profileLoading } = useProfile()
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
    return s.date && s.date.slice(0, 10) >= weekStartStr
  })

  // Calculate streaks and total shifts from real data
  const currentStreak = calculateStreak(shifts)
  const totalShiftsLogged = shifts.length

  // Upcoming stat holidays with qualifying info
  const upcomingHolidays = getUpcomingHolidays(3)
  const todayStr = getLocalDateStr(new Date())

  // Check if today is a stat holiday and user hasn't logged a shift
  const todayHoliday = getHolidayOnDate(todayStr)
  const hasLoggedTodayShift = shifts.some(s => s.date && s.date.slice(0, 10) === todayStr)

  // Monthly earnings
  const monthStart = todayStr.slice(0, 7) + '-01'
  const thisMonthShifts = shifts.filter(s => s.date && s.date.slice(0, 10) >= monthStart)
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
        <StatHolidayPrompt todayHoliday={todayHoliday} />
      )}

      {/* Dispatch Signal */}
      <DispatchSignal />

      {/* Earnings Cards */}
      <EarningsCards
        thisWeekEarnings={thisWeekEarnings}
        lastWeekEarnings={lastWeekEarnings}
        thisWeekShiftCount={thisWeekShifts.length}
      />

      {/* Work Available — shift totals from BCMEA */}
      <WorkAvailableCard snapshots={workInfoSnapshots} />

      {/* Pension Progress - Clickable for AI insights */}
      <PensionProgress
        ytdEarnings={ytdEarnings}
        pensionGoal={profile.pensionGoal}
        pensionProgress={pensionProgress}
        projectedDate={projectedDate}
      />

      {/* Streak & Badges */}
      <StreakBadges
        currentStreak={currentStreak}
        totalShiftsLogged={totalShiftsLogged}
      />

      {/* Upcoming Stat Holidays */}
      <StatHolidaysCard
        upcomingHolidays={upcomingHolidays}
        shifts={shifts}
        todayStr={todayStr}
      />

      {/* Monthly Summary */}
      <MonthlySummary
        monthShiftCount={thisMonthShifts.length}
        monthEarnings={thisMonthEarnings}
        avgPerShift={avgPerShift}
        topJobs={topMonthJobs}
      />

      {/* Latest News */}
      <PortNewsCard articles={newsArticles} />

      {/* This Week's Shifts */}
      <WeeklyShifts
        thisWeekShifts={thisWeekShifts}
        thisWeekEarnings={thisWeekEarnings}
      />

      {/* Quick AI Actions */}
      <AskAIButton />
    </div>
  )
}
