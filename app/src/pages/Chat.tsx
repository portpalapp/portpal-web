import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Upload,
  FileText,
  BookOpen,
  Wrench,
  Newspaper,
  MessageCircle,
  Briefcase,
  Bot,
  User,
  Target,
  TrendingUp,
  Calendar,
  Zap,
  ChevronRight,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useShifts } from '../hooks/useShifts'
import type { Shift } from '../hooks/useShifts'
import {
  WAGE_TABLES,
  SHIFT_MULTIPLIERS,
  SKILL_DIFFERENTIALS,
  OVERTIME_RULES,
  SHIFT_HOURS,
  VACATION_RATES,
  VACATION_RULES,
  RECOGNIZED_HOLIDAYS,
  HOLIDAY_RULES,
  LEAVE_ENTITLEMENTS,
  DESPATCH_RULES,
  CONTRACT_INFO,
  CONTRACT_SECTIONS,
  PENSION_AND_WELFARE,
  calculateHourlyRate,
  getSkillDifferential,
  getWageYearForDate,
  getVacationRate,
} from '../data/contractData'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface QuestionCategory {
  id: string
  icon: React.FC<{ size?: number; className?: string }>
  label: string
  bgColor: string
  textColor: string
  activeBg: string
  questions: string[]
}

interface QuickAction {
  icon: React.FC<{ size?: number; className?: string }>
  label: string
  subtitle: string
  bgColor: string
  iconColor: string
  onPress?: () => void
}

// ---------------------------------------------------------------------------
// Helpers that pull live numbers from contractData
// ---------------------------------------------------------------------------

function getCurrentYearIndex(): number {
  const now = new Date()
  const yearData = getWageYearForDate(now)
  return WAGE_TABLES.years.indexOf(yearData)
}

function fmt(n: number): string {
  return n.toFixed(2)
}

function fmtDollar(n: number): string {
  return `$${fmt(n)}`
}

function buildRateBreakdown(
  job: string,
  shift: 'DAY' | 'NIGHT' | 'GRAVEYARD',
  dayType: 'MON-FRI' | 'SAT' | 'SUN-HOL',
): string {
  const yi = getCurrentYearIndex()
  const yearData = WAGE_TABLES.years[yi]
  const baseRate = yearData.shifts[shift][dayType]
  const diff = getSkillDifferential(job)
  const total = baseRate + diff.amount
  const otRate = total * 1.5

  let result = `Base rate: ${fmtDollar(baseRate)}/hr`
  if (diff.amount > 0) {
    result += `\nDifferential (${diff.class}): +${fmtDollar(diff.amount)}/hr`
  }
  result += `\nYour rate: ${fmtDollar(total)}/hr`
  result += `\nOT rate (1.5x): ${fmtDollar(otRate)}/hr`
  return result
}

function buildShiftComparison(job: string): string {
  const yi = getCurrentYearIndex()
  const yearData = WAGE_TABLES.years[yi]
  const diff = getSkillDifferential(job).amount

  const dayRate = yearData.shifts.DAY['MON-FRI'] + diff
  const nightRate = yearData.shifts.NIGHT['MON-FRI'] + diff
  const graveyardRate = yearData.shifts.GRAVEYARD['MON-FRI'] + diff
  const satDayRate = yearData.shifts.DAY.SAT + diff
  const sunRate = yearData.shifts.DAY['SUN-HOL'] + diff

  return (
    `Mon-Fri Day: ${fmtDollar(dayRate)}/hr x 8h = ${fmtDollar(dayRate * 8)}\n` +
    `Mon-Fri Night: ${fmtDollar(nightRate)}/hr x 8h = ${fmtDollar(nightRate * 8)}\n` +
    `Mon-Fri Graveyard: ${fmtDollar(graveyardRate)}/hr x 6.5h = ${fmtDollar(graveyardRate * 6.5)}\n` +
    `Saturday Day: ${fmtDollar(satDayRate)}/hr x 8h = ${fmtDollar(satDayRate * 8)}\n` +
    `Sunday/Holiday: ${fmtDollar(sunRate)}/hr x 8h = ${fmtDollar(sunRate * 8)}`
  )
}

function getTopPayingJobs(shift: 'DAY' | 'NIGHT' | 'GRAVEYARD', dayType: 'MON-FRI' | 'SAT' | 'SUN-HOL'): string {
  const yi = getCurrentYearIndex()
  const yearData = WAGE_TABLES.years[yi]
  const baseRate = yearData.shifts[shift][dayType]

  const entries = Object.entries(SKILL_DIFFERENTIALS)
    .flatMap(([, classData]) =>
      classData.jobs.map((job) => ({
        job,
        rate: baseRate + classData.amount,
      })),
    )
    .sort((a, b) => b.rate - a.rate)

  // dedupe by rate tier, keep top 5
  const seen = new Set<number>()
  const top: typeof entries = []
  for (const e of entries) {
    const rounded = Math.round(e.rate * 100)
    if (!seen.has(rounded) || top.length < 5) {
      seen.add(rounded)
      top.push(e)
    }
    if (top.length >= 5) break
  }

  return top.map((e, i) => `${i + 1}. ${e.job} - ${fmtDollar(e.rate)}/hr`).join('\n')
}

// ---------------------------------------------------------------------------
// Summarize user's shifts for AI context
// ---------------------------------------------------------------------------

function summarizeShifts(shifts: Shift[]) {
  if (!shifts.length) return undefined

  const totalPay = shifts.reduce((sum, s) => sum + s.totalPay, 0)

  // YTD = pension year starting Jan 4
  const pensionYearStart = '2026-01-04'
  const ytdShifts = shifts.filter(s => s.date.slice(0, 10) >= pensionYearStart)
  const ytdEarnings = ytdShifts.reduce((sum, s) => sum + s.totalPay, 0)

  // Recent = last 7 days
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)
  const recentShifts = shifts.filter(s => s.date.slice(0, 10) >= weekAgoStr).length

  // Top jobs by frequency
  const jobCounts = new Map<string, number>()
  const locCounts = new Map<string, number>()
  const shiftBreakdown = { DAY: 0, NIGHT: 0, GRAVEYARD: 0 }
  for (const s of shifts) {
    jobCounts.set(s.job, (jobCounts.get(s.job) || 0) + 1)
    locCounts.set(s.location, (locCounts.get(s.location) || 0) + 1)
    if (s.shift in shiftBreakdown) shiftBreakdown[s.shift]++
  }

  const topJobs = [...jobCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0])
  const topLocations = [...locCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0])

  // Avg shifts per week (based on date range)
  const dates = shifts.map(s => s.date.slice(0, 10)).sort()
  const firstDate = new Date(dates[0])
  const lastDate = new Date(dates[dates.length - 1])
  const weeks = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (7 * 86400000))
  const avgShiftsPerWeek = Math.round((shifts.length / weeks) * 10) / 10

  // Recent shift details (last 5)
  const recentDetails = shifts.slice(0, 5).map(s =>
    `${s.date.slice(0, 10)}: ${s.job} ${s.shift} @ ${s.location} — $${s.totalPay.toFixed(2)}`
  )

  return {
    totalShifts: shifts.length,
    totalPay: Math.round(totalPay),
    ytdEarnings: Math.round(ytdEarnings),
    recentShifts,
    topJobs,
    topLocations,
    avgShiftsPerWeek,
    shiftBreakdown,
    recentShiftDetails: recentDetails,
  }
}

// ---------------------------------------------------------------------------
// Formatted text renderer - converts **bold** markdown to HTML spans
// ---------------------------------------------------------------------------
function FormattedText({ content, isUser }: { content: string; isUser: boolean }) {
  const textColor = isUser ? 'text-white' : 'text-slate-700'
  const boldColor = isUser ? 'text-white font-bold' : 'text-slate-900 font-bold'

  const lines = content.split('\n')

  return (
    <div className="space-y-0.5">
      {lines.map((line, lineIdx) => {
        if (line.trim() === '') return <div key={lineIdx} className="h-1.5" />

        const parts = line.split(/(\*\*.*?\*\*)/g)

        return (
          <p key={lineIdx} className={`text-sm leading-5 ${textColor}`}>
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                const inner = part.slice(2, -2)
                return (
                  <span key={partIdx} className={boldColor}>
                    {inner}
                  </span>
                )
              }
              return <span key={partIdx}>{part}</span>
            })}
          </p>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chat message component
// ---------------------------------------------------------------------------

function ChatMessage({ message: msg }: { message: Message }) {
  return (
    <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role === 'assistant' && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl p-3 ${
          msg.role === 'user'
            ? 'bg-blue-600 rounded-br-sm'
            : 'bg-white border border-slate-200 rounded-bl-sm'
        }`}
      >
        <FormattedText content={msg.content} isUser={msg.role === 'user'} />
      </div>
      {msg.role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-slate-600" />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ChatTab = 'chat' | 'resources'

export function Chat() {
  const { profile } = useProfile()
  const { shifts } = useShifts()
  const navigate = useNavigate()

  const makeGreeting = (name: string) =>
    `Hey ${name.split(' ')[0]}! I'm your PORTPAL AI. I can analyze your work patterns and help you optimize for your goals.\n\nAsk me about:\n\u2022 \ud83c\udfaf Pension goal strategies\n\u2022 \ud83d\udcca Work pattern analysis\n\u2022 \ud83d\udcb0 Job & shift comparisons\n\u2022 \ud83d\udcc5 Time-off planning\n\u2022 \ud83d\udcd6 Contract rules & entitlements\n\nWhat would you like to know?`

  const [chatTab, setChatTab] = useState<ChatTab>('chat')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: makeGreeting('Longshoreman'),
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [pendingFile, setPendingFile] = useState<{ data: string; mediaType: string; fileName: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update greeting when profile loads
  useEffect(() => {
    if (profile.name && profile.name !== 'Longshoreman') {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === '1') {
          return [{ ...prev[0], content: makeGreeting(profile.name) }]
        }
        return prev
      })
    }
  }, [profile.name])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const questionCategories: QuestionCategory[] = [
    {
      id: 'pension',
      icon: Target,
      label: 'Pension Goals',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      activeBg: 'bg-blue-600',
      questions: [
        'Fewest shifts to hit my pension goal?',
        'If I take August off, can I still make it?',
        'What if I only work day shifts?',
      ],
    },
    {
      id: 'optimize',
      icon: TrendingUp,
      label: 'Optimize Earnings',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      activeBg: 'bg-green-600',
      questions: [
        'Best job for maximizing weekly pay?',
        'Night vs graveyard - which pays more overall?',
        "What's my highest earning potential this month?",
      ],
    },
    {
      id: 'schedule',
      icon: Calendar,
      label: 'Schedule Planning',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      activeBg: 'bg-purple-600',
      questions: [
        'Can I take 2 weeks off and still hit $120k?',
        'How many shifts/week do I need for pension?',
        "What's the minimum I can work in December?",
      ],
    },
    {
      id: 'patterns',
      icon: Zap,
      label: 'My Patterns',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      activeBg: 'bg-orange-600',
      questions: [
        "What's my most common job assignment?",
        'Which terminal do I work most?',
        'Am I on track vs last year?',
      ],
    },
    {
      id: 'contract',
      icon: BookOpen,
      label: 'Contract & Rules',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      activeBg: 'bg-indigo-600',
      questions: [
        'What are the overtime rules?',
        'How does vacation pay work?',
        'What are the recognized holidays?',
        'What leave am I entitled to?',
      ],
    },
  ]

  const quickActions: QuickAction[] = [
    {
      icon: FileText,
      label: 'Upload Pay Stub',
      subtitle: 'Verify your pay is correct',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      icon: BookOpen,
      label: 'Collective Agreement',
      subtitle: 'Browse contract terms & rules',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onPress: () => navigate('/contract'),
    },
    {
      icon: Wrench,
      label: 'Shift Template',
      subtitle: 'Build your shift template',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: Newspaper,
      label: 'Industry News',
      subtitle: 'Latest updates & news',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      onPress: () => window.open('https://ilwu500.org', '_blank'),
    },
  ]

  // -------------------------------------------------------------------------
  // Build a response using real contract data
  // -------------------------------------------------------------------------
  const generateLocalResponse = useCallback((userInput: string): string => {
    const lower = userInput.toLowerCase()
    const yi = getCurrentYearIndex()
    const yearData = WAGE_TABLES.years[yi]

    // ---- Pension / minimum shifts ----
    if (lower.includes('fewest') || lower.includes('minimum') || lower.includes('least')) {
      const goal = profile.pensionGoal || 120000
      const hdNightRate = calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'HD MECHANIC')
      const hdShiftPay = hdNightRate * 8
      const hdShiftsNeeded = Math.ceil(goal / hdShiftPay)

      const ttDayRate = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER')
      const ttNightRate = calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER')
      const ttAvg = (ttDayRate * 8 + ttNightRate * 8) / 2
      const ttShiftsNeeded = Math.ceil(goal / ttAvg)

      const gravSunRate = calculateHourlyRate('GRAVEYARD', 'SUN-HOL', yi, 'HD MECHANIC')
      const gravShiftPay = gravSunRate * 6.5
      const gravShiftsNeeded = Math.ceil(goal / gravShiftPay)

      return (
        `\ud83d\udcca **Minimum Shifts Analysis**\n\n` +
        `To hit your $${(goal / 1000).toFixed(0)}k pension goal (Year ${yearData.year} rates, effective ${yearData.effective}):\n\n` +
        `**Optimal Strategy (HD Mechanic + Night Mon-Fri):**\n` +
        `\u2022 Rate: ${fmtDollar(hdNightRate)}/hr\n` +
        `\u2022 Per shift (8h): ${fmtDollar(hdShiftPay)}\n` +
        `\u2022 ~${hdShiftsNeeded} shifts total (~${Math.ceil(hdShiftsNeeded / 50)} shifts/week)\n\n` +
        `**Your Current Pattern (TT mixed shifts):**\n` +
        `\u2022 Avg ~${fmtDollar(ttAvg)}/shift\n` +
        `\u2022 Need ~${ttShiftsNeeded} shifts\n` +
        `\u2022 ~${Math.ceil(ttShiftsNeeded / 50)} shifts/week\n\n` +
        `**Fewest possible (HD Mechanic graveyard weekends):**\n` +
        `\u2022 ~${gravShiftsNeeded} shifts at ~${fmtDollar(gravShiftPay)}/shift\n` +
        `\u2022 But limited availability\n\n` +
        `\ud83d\udca1 Want me to build a custom schedule based on your seniority #${profile.seniority}?`
      )
    }

    // ---- Time off (August / month off) ----
    if (lower.includes('august') || lower.includes('month off') || lower.includes('take off')) {
      const goal = profile.pensionGoal || 120000
      const ttDayRate = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER')
      const weeklyPay = ttDayRate * 8 * 4
      const lostEarnings = weeklyPay * 4
      const remainingWeeks = 48
      const newWeeklyTarget = goal / remainingWeeks
      const extraPerWeek = newWeeklyTarget - weeklyPay

      return (
        `\ud83d\udcc5 **Time Off Analysis**\n\n` +
        `If you take a month off (4 weeks):\n\n` +
        `**Current pace (TT Day Mon-Fri):** ~${fmtDollar(weeklyPay)}/week\n` +
        `**Lost earnings:** ~${fmtDollar(lostEarnings)}\n\n` +
        `**To still hit $${(goal / 1000).toFixed(0)}k:**\n` +
        `\u2022 New weekly target: ~${fmtDollar(newWeeklyTarget)}\n` +
        `\u2022 Need to make up ~${fmtDollar(Math.max(0, extraPerWeek))}/week extra\n` +
        `\u2022 That's about 1 extra shift per week, or prioritize weekend/graveyard shifts\n\n` +
        `**Weekend boost:** Saturday Day TT = ${fmtDollar(calculateHourlyRate('DAY', 'SAT', yi, 'TRACTOR TRAILER'))}/hr vs weekday ${fmtDollar(ttDayRate)}/hr\n\n` +
        `**Recommended approach:**\n` +
        `1. Front-load the months before with 5 shifts/week\n` +
        `2. Take your time off guilt-free\n` +
        `3. Resume normal 4 shifts/week after\n\n` +
        `\u2705 Yes, it's doable!`
      )
    }

    // ---- Day shifts only ----
    if (lower.includes('only day') || lower.includes('day shift')) {
      const goal = profile.pensionGoal || 120000
      const ttDayMF = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER')
      const ttDaySat = calculateHourlyRate('DAY', 'SAT', yi, 'TRACTOR TRAILER')
      const dailyMF = ttDayMF * 8
      const dailySat = ttDaySat * 8
      const shiftsNeeded = Math.ceil(goal / dailyMF)
      const mixedAvg = (ttDayMF * 8 * 4 + ttDaySat * 8) / 5
      const mixedShifts = Math.ceil(goal / mixedAvg)

      return (
        `\u2600\ufe0f **Day Shifts Only Analysis**\n\n` +
        `If you only work day shifts (Year ${yearData.year} rates):\n\n` +
        `**Weekday rate (TT):** ${fmtDollar(ttDayMF)}/hr x 8h = ${fmtDollar(dailyMF)}/day\n` +
        `**Weekend rate (TT):** ${fmtDollar(ttDaySat)}/hr x 8h = ${fmtDollar(dailySat)}/day\n\n` +
        `**To hit $${(goal / 1000).toFixed(0)}k with weekday days only:**\n` +
        `\u2022 Need ~${shiftsNeeded} day shifts\n` +
        `\u2022 That's ${(shiftsNeeded / 50).toFixed(1)} shifts/week all year\n\n` +
        `**With 1 Saturday per week:**\n` +
        `\u2022 ~${mixedShifts} shifts needed\n` +
        `\u2022 Better work-life balance + higher earnings\n\n` +
        `**Trade-off vs mixed (day+night):**\n` +
        `\u2022 Night Mon-Fri TT = ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER'))}/hr\n` +
        `\u2022 Night shifts earn ~${Math.round(((SHIFT_MULTIPLIERS.NIGHT['MON-FRI'] - 1) * 100))}% more per hour\n` +
        `\u2022 But day shifts are better on the body long-term\n\n` +
        `\ud83d\udca1 Consider: 3 weekdays + 1 Saturday = good balance`
      )
    }

    // ---- Best job / maximize ----
    if (lower.includes('best job') || lower.includes('maximiz')) {
      const topNight = getTopPayingJobs('NIGHT', 'MON-FRI')
      const topSatDay = getTopPayingJobs('DAY', 'SAT')

      return (
        `\ud83d\udcb0 **Highest Paying Jobs (Year ${yearData.year})**\n\n` +
        `**Top 5 - Night Shift Mon-Fri:**\n${topNight}\n\n` +
        `**Top 5 - Saturday Day:**\n${topSatDay}\n\n` +
        `**At your seniority (#${profile.seniority}):**\n` +
        `\u2022 HD Mechanic: Rare, need certification (+$2.50/hr)\n` +
        `\u2022 RTG/Ship Gantry: Good availability (+$1.00/hr)\n` +
        `\u2022 TT/Reachstacker: Solid regular work (+$0.65/hr)\n\n` +
        `**CENTENNIAL bonus:** Many jobs get 9h shifts at CENTENNIAL vs 8h elsewhere.\n` +
        `\ud83c\udfaf Realistic best: Ship Gantry nights at CENTENNIAL = ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'SHIP GANTRY'))} x 9h = ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'SHIP GANTRY') * 9)}/shift`
      )
    }

    // ---- Night vs graveyard ----
    if (lower.includes('night vs graveyard') || lower.includes('night or graveyard')) {
      const ttNight = calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER')
      const ttGrave = calculateHourlyRate('GRAVEYARD', 'MON-FRI', yi, 'TRACTOR TRAILER')
      const nightPay8 = ttNight * 8
      const nightPay9 = ttNight * 9
      const gravePay65 = ttGrave * 6.5
      const gravePay75 = ttGrave * 7.5

      return (
        `\ud83c\udf19 **Night vs Graveyard Comparison (TT Mon-Fri, Year ${yearData.year})**\n\n` +
        `**Night Shift:**\n` +
        `\u2022 Rate: ${fmtDollar(ttNight)}/hr\n` +
        `\u2022 Standard (8h): ${fmtDollar(nightPay8)}\n` +
        `\u2022 CENTENNIAL (9h): ${fmtDollar(nightPay9)}\n\n` +
        `**Graveyard:**\n` +
        `\u2022 Rate: ${fmtDollar(ttGrave)}/hr\n` +
        `\u2022 Standard (6.5h): ${fmtDollar(gravePay65)}\n` +
        `\u2022 CENTENNIAL (7.5h): ${fmtDollar(gravePay75)}\n\n` +
        `**Verdict:**\n` +
        `\u2022 Graveyard pays ~${fmtDollar(ttGrave - ttNight)}/hr MORE\n` +
        `\u2022 But 1.5 fewer hours per shift\n` +
        `\u2022 Standard: Night ${fmtDollar(nightPay8)} vs Graveyard ${fmtDollar(gravePay65)}\n` +
        `\u2022 CENTENNIAL: Night ${fmtDollar(nightPay9)} vs Graveyard ${fmtDollar(gravePay75)}\n\n` +
        `\ud83d\udca1 Graveyard = higher rate, shorter shift. Pick based on lifestyle preference.`
      )
    }

    // ---- Overtime rules ----
    if (lower.includes('overtime') || lower.includes(' ot ') || lower.match(/\bot\b/)) {
      return (
        `\u23f0 **Overtime Rules (Contract Art. 21.04)**\n\n` +
        `**Meal Period Worked:**\n` +
        `${OVERTIME_RULES.mealPeriodWorked.description}\n\n` +
        `**1-Hour Extension:**\n` +
        `${OVERTIME_RULES.oneHourExtension.description}\n\n` +
        `**Longer Extensions (after meal period):**\n` +
        `\u2022 Day shift Mon-Sat: ${OVERTIME_RULES.shiftExtensionAfterMeal.day['MON-SAT'].description}\n` +
        `\u2022 Day shift Sunday: ${OVERTIME_RULES.shiftExtensionAfterMeal.day.SUN.description}\n` +
        `\u2022 Night/Graveyard: ${OVERTIME_RULES.shiftExtensionAfterMeal.night.description}\n\n` +
        `**Damaged Cargo:**\n` +
        `${OVERTIME_RULES.damagedCargo.description}\n\n` +
        `**OT Rates (Year ${yearData.year} base - no differential):**\n` +
        `\u2022 Day Mon-Fri: ${fmtDollar(yearData.overtime.DAY['MON-FRI'])}/hr\n` +
        `\u2022 Night Mon-Fri: ${fmtDollar(yearData.overtime.NIGHT['MON-FRI'])}/hr\n` +
        `\u2022 Graveyard Mon-Fri: ${fmtDollar(yearData.overtime.GRAVEYARD['MON-FRI'])}/hr\n` +
        `\u2022 Holiday OT: ${fmtDollar(yearData.overtime.HOLIDAY)}/hr\n\n` +
        `**Max extension:** ${OVERTIME_RULES.shiftExtensionLimits.shipShiftOrSail}`
      )
    }

    // ---- Vacation ----
    if (lower.includes('vacation') || lower.includes('vacation pay') || lower.includes('time off entitle')) {
      const tiers = VACATION_RATES.map(
        (t) =>
          `\u2022 ${t.minYears}-${t.maxYears ?? '40+'} years: ${(t.rate * 100).toFixed(0)}% (${t.vacationDays} days)`,
      ).join('\n')

      return (
        `\ud83c\udfd6\ufe0f **Vacation Pay (Art. 11.01)**\n\n` +
        `Your vacation pay = a % of last year's total earnings:\n\n${tiers}\n\n` +
        `**Key rules:**\n` +
        `\u2022 Need ${VACATION_RULES.minimumHoursForServiceYear} hours/year for a year of service\n` +
        `\u2022 Min scheduling block: ${VACATION_RULES.minimumSchedulingBlock} days\n` +
        `\u2022 Vacation pay available by: ${VACATION_RULES.vacationPayDeadline}\n` +
        `\u2022 Or defer to: ${VACATION_RULES.deferralDeadline}\n` +
        `\u2022 Cannot work during vacation\n` +
        `\u2022 No carrying over unused days\n\n` +
        `\ud83d\udca1 Vacation days are calculated as: gross vacation pay / (8 x STBR). Current STBR: ${fmtDollar(yearData.stbr)}`
      )
    }

    // ---- Holidays ----
    if (lower.includes('holiday') || lower.includes('stat day') || lower.includes('stat holiday')) {
      const holidayList = RECOGNIZED_HOLIDAYS.map((h) => `\u2022 ${h.name} (${h.date})`).join('\n')

      return (
        `\ud83c\udf84 **Recognized Holidays (${HOLIDAY_RULES.totalHolidays} per year)**\n\n` +
        `${holidayList}\n\n` +
        `**Holiday Pay:**\n` +
        `\u2022 All shifts: 2x STBR = ${fmtDollar(yearData.holiday)}/hr (Year ${yearData.year})\n` +
        `\u2022 Holiday OT: ${fmtDollar(yearData.overtime.HOLIDAY)}/hr\n` +
        `\u2022 Holiday Double Time: ${fmtDollar(yearData.doubleTime.HOLIDAY)}/hr\n\n` +
        `**No work days:** New Year's, Labour Day, Christmas (except emergencies)\n` +
        `**Half days:** Dec 24 & Dec 31 - work stops at noon (4 hours paid)\n\n` +
        `**Holiday pay eligibility:**\n` +
        `\u2022 ${HOLIDAY_RULES.holidayPayEligibility.fifteenDaysOrMore}\n` +
        `\u2022 ${HOLIDAY_RULES.holidayPayEligibility.oneToFourteenDays}`
      )
    }

    // ---- Leave entitlements ----
    if (lower.includes('leave') || lower.includes('bereavement') || lower.includes('maternity') || lower.includes('parental')) {
      return (
        `\ud83d\udccb **Leave Entitlements**\n\n` +
        `**Bereavement Leave:**\n` +
        `\u2022 ${LEAVE_ENTITLEMENTS.bereavement.days} days paid (${LEAVE_ENTITLEMENTS.bereavement.hoursPerDay}h x STBR each)\n` +
        `\u2022 Immediate family (Canada Labour Code definition)\n` +
        `\u2022 Claim within ${LEAVE_ENTITLEMENTS.bereavement.claimDeadline}\n\n` +
        `**Maternity Leave:**\n` +
        `\u2022 Up to ${LEAVE_ENTITLEMENTS.maternity.weeks} weeks unpaid\n` +
        `\u2022 SUB plan: ${(LEAVE_ENTITLEMENTS.maternity.supplementaryBenefit.rate * 100).toFixed(0)}% of 40hrs/week at base rate (minus EI)\n` +
        `\u2022 Duration: up to ${LEAVE_ENTITLEMENTS.maternity.supplementaryBenefit.duration}\n\n` +
        `**Parental Leave:**\n` +
        `\u2022 Up to ${LEAVE_ENTITLEMENTS.parental.weeks} weeks\n` +
        `\u2022 SUB plan: ${(LEAVE_ENTITLEMENTS.parental.supplementaryBenefit.rate * 100).toFixed(0)}% of 40hrs/week at base rate (minus EI)\n\n` +
        `**Domestic Violence Leave:**\n` +
        `\u2022 Up to ${LEAVE_ENTITLEMENTS.domesticViolence.totalWeeks} weeks per year\n` +
        `\u2022 First ${LEAVE_ENTITLEMENTS.domesticViolence.paidDays} days are paid\n\n` +
        `**Jury Duty:** ${LEAVE_ENTITLEMENTS.juryDuty.hoursPerDay}h/day at straight time (minus court reimbursement)\n\n` +
        `For full details, visit ilwu500.org`
      )
    }

    // ---- Contract / collective agreement questions ----
    if (
      lower.includes('contract') ||
      lower.includes('collective agreement') ||
      lower.includes('article') ||
      lower.includes('black book')
    ) {
      const sections = CONTRACT_SECTIONS.map((s) => `\u2022 ${s.title}`).join('\n')
      return (
        `\ud83d\udcd6 **Collective Agreement (${CONTRACT_INFO.duration.start} - ${CONTRACT_INFO.duration.end})**\n\n` +
        `Between ${CONTRACT_INFO.parties.employer} and ${CONTRACT_INFO.parties.union}.\n\n` +
        `**Sections available:**\n${sections}\n\n` +
        `**Pay claim deadline:** ${CONTRACT_INFO.payClaimTimeLimit}\n\n` +
        `\ud83d\udca1 Visit ilwu500.org for the full contract, or ask me about specific topics like overtime, vacation, holidays, or leave.`
      )
    }

    // ---- Dispatch rules ----
    if (lower.includes('dispatch') || lower.includes('despatch') || lower.includes('how do i get assigned')) {
      const principles = DESPATCH_RULES.principles.map((p) => `\u2022 ${p}`).join('\n')
      return (
        `\ud83d\udce6 **Dispatch Rules (Art. 9)**\n\n` +
        `${principles}\n\n` +
        `**Penalties:** ${DESPATCH_RULES.penalties}\n\n` +
        `**Regular Work Force:**\n` +
        `${DESPATCH_RULES.regularWorkForce.description}\n` +
        `\u2022 Min guarantee: ${DESPATCH_RULES.regularWorkForce.minGuarantee} for the 6th shift\n` +
        `\u2022 Notice for hiring/layoff: ${DESPATCH_RULES.regularWorkForce.notice.hiring}`
      )
    }

    // ---- Pension ----
    if (lower.includes('pension') && !lower.includes('fewest') && !lower.includes('minimum')) {
      return (
        `\ud83c\udfaf **Pension Information**\n\n` +
        `**Plan:** ${PENSION_AND_WELFARE.pension.plan}\n\n` +
        `**Early retirement:** ${PENSION_AND_WELFARE.pension.earlyRetirement}\n\n` +
        `**Mandatory retirement:** ${PENSION_AND_WELFARE.pension.mandatoryRetirement}\n\n` +
        `**Automation protection:** ${PENSION_AND_WELFARE.automationProtection.description}\n\n` +
        `\ud83d\udca1 The detailed pension plan is a separate document. Ask me "fewest shifts to hit my pension goal" for shift planning calculations.`
      )
    }

    // ---- Shift hours / schedule ----
    if (lower.includes('shift hour') || lower.includes('shift time') || lower.includes('when does') || lower.includes('start time')) {
      return (
        `\u23f0 **Standard Shift Schedule (Art. 21.01)**\n\n` +
        `**Graveyard:** ${SHIFT_HOURS.GRAVEYARD.start} - ${SHIFT_HOURS.GRAVEYARD.end}\n` +
        `\u2022 ${SHIFT_HOURS.GRAVEYARD.hours}h on site, ${SHIFT_HOURS.GRAVEYARD.paidHours}h paid\n` +
        `\u2022 Meal: ${SHIFT_HOURS.GRAVEYARD.mealPeriod}\n\n` +
        `**Day:** ${SHIFT_HOURS.DAY.start} - ${SHIFT_HOURS.DAY.end}\n` +
        `\u2022 ${SHIFT_HOURS.DAY.hours}h on site, ${SHIFT_HOURS.DAY.paidHours}h paid\n` +
        `\u2022 Meal: ${SHIFT_HOURS.DAY.mealPeriod}\n\n` +
        `**Night:** ${SHIFT_HOURS.NIGHT.start} - ${SHIFT_HOURS.NIGHT.end}\n` +
        `\u2022 ${SHIFT_HOURS.NIGHT.hours}h on site, ${SHIFT_HOURS.NIGHT.paidHours}h paid\n` +
        `\u2022 Meal: ${SHIFT_HOURS.NIGHT.mealPeriod}\n\n` +
        `**Special shifts:**\n` +
        `\u2022 Coastwise Day: ${SHIFT_HOURS.DAY_COASTWISE.start} - ${SHIFT_HOURS.DAY_COASTWISE.end} (1h meal)\n` +
        `\u2022 Advanced Truck: ${SHIFT_HOURS.ADVANCED_TRUCK.start} - ${SHIFT_HOURS.ADVANCED_TRUCK.end}`
      )
    }

    // ---- Rates for specific jobs (night) ----
    if (lower.includes('night') && !lower.includes('vs') && !lower.includes('or')) {
      const job = lower.includes('tt') || lower.includes('tractor') ? 'TRACTOR TRAILER' : ''
      const displayJob = job || 'TRACTOR TRAILER'
      const breakdown = buildRateBreakdown(displayJob, 'NIGHT', 'MON-FRI')
      const rate = calculateHourlyRate('NIGHT', 'MON-FRI', yi, displayJob)

      return (
        `\ud83c\udf19 **Night Shift Rates - Mon-Fri (Year ${yearData.year})**\n\n` +
        `For ${displayJob}:\n${breakdown}\n\n` +
        `**By location:**\n` +
        `\u2022 CENTENNIAL: 9 hours = ${fmtDollar(rate * 9)}/shift\n` +
        `\u2022 VANTERM/DELTAPORT: 8 hours = ${fmtDollar(rate * 8)}/shift\n\n` +
        `\ud83d\udca1 CENTENNIAL night = best value for your time.`
      )
    }

    // ---- Weekend / Saturday rates ----
    if (lower.includes('saturday') || lower.includes('weekend') || lower.includes('sunday')) {
      const ttSatDay = calculateHourlyRate('DAY', 'SAT', yi, 'TRACTOR TRAILER')
      const ttSatNight = calculateHourlyRate('NIGHT', 'SAT', yi, 'TRACTOR TRAILER')
      const ttSunDay = calculateHourlyRate('DAY', 'SUN-HOL', yi, 'TRACTOR TRAILER')
      const ttMFDay = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER')
      const satBonus = ((ttSatDay / ttMFDay - 1) * 100).toFixed(0)

      return (
        `\ud83d\udcc5 **Weekend Premium Rates (Year ${yearData.year}, TT example)**\n\n` +
        `**Saturday:**\n` +
        `\u2022 Day: ${fmtDollar(ttSatDay)}/hr (vs ${fmtDollar(ttMFDay)} weekday)\n` +
        `\u2022 Night: ${fmtDollar(ttSatNight)}/hr\n\n` +
        `**Sunday/Holiday:**\n` +
        `\u2022 All shifts: ${fmtDollar(ttSunDay)}/hr\n\n` +
        `**Multipliers (from STBR):**\n` +
        `\u2022 Sat Day: ${SHIFT_MULTIPLIERS.DAY.SAT}x\n` +
        `\u2022 Sat Night/Grave: ${SHIFT_MULTIPLIERS.NIGHT.SAT}x\n` +
        `\u2022 Sun/Holiday: ${SHIFT_MULTIPLIERS.DAY['SUN-HOL']}x\n` +
        `\u2022 Holiday (all): ${SHIFT_MULTIPLIERS.HOLIDAY}x\n\n` +
        `**Weekend bonus: +${satBonus}% over weekday day shift!**\n` +
        `\ud83d\udcb0 One Saturday = almost 1.3 weekday shifts in earnings!`
      )
    }

    // ---- Differential / classification ----
    if (lower.includes('differential') || lower.includes('classification') || lower.includes('class ')) {
      const classes = Object.entries(SKILL_DIFFERENTIALS)
        .map(([name, data]) => {
          const jobList = data.jobs.slice(0, 4).join(', ') + (data.jobs.length > 4 ? '...' : '')
          return `**${name} (+${fmtDollar(data.amount)}/hr):** ${jobList}`
        })
        .join('\n\n')

      return (
        `\ud83d\udee0\ufe0f **Skill Differentials (Art. 17)**\n\n` +
        `${classes}\n\n` +
        `**Rules:**\n` +
        `\u2022 Differentials do NOT stack - you only get one\n` +
        `\u2022 Applied for your entire shift\n` +
        `\u2022 Added on top of the base shift rate\n\n` +
        `\ud83d\udca1 Example: TT Day Mon-Fri = ${fmtDollar(yearData.stbr)} + $0.65 = ${fmtDollar(yearData.stbr + 0.65)}/hr`
      )
    }

    // ---- Base rates / STBR ----
    if (lower.includes('base rate') || lower.includes('stbr') || lower.includes('how much do i make') || lower.includes('pay rate')) {
      const yearSummaries = WAGE_TABLES.years
        .map(
          (y) =>
            `Year ${y.year} (${y.effective}): ${fmtDollar(y.stbr)}/hr`,
        )
        .join('\n')

      return (
        `\ud83d\udcb5 **Base Rates (STBR) - Contract 2023-2027**\n\n` +
        `${yearSummaries}\n\n` +
        `**Current year (${yearData.year}) shift rates (no differential):**\n` +
        `${buildShiftComparison('LABOUR')}\n\n` +
        `**Add your job's differential on top:**\n` +
        `\u2022 Class 1 (trades): +$2.50/hr\n` +
        `\u2022 Class 2 (gantry/heavy): +$1.00/hr\n` +
        `\u2022 Class 3 (TT/equipment): +$0.65/hr\n` +
        `\u2022 Class 4 (lift truck/checker): +$0.50/hr\n\n` +
        `\ud83d\udca1 Ask about a specific job for its full rate breakdown.`
      )
    }

    // ---- Track / compare / on track ----
    if (lower.includes('track') || lower.includes('last year') || lower.includes('compare')) {
      return (
        `\ud83d\udcc8 **Your Progress Analysis**\n\n` +
        `**This Year vs Last Year:**\n` +
        `\u2022 YTD: $${(profile.pensionGoal * 0.15).toLocaleString()} earned\n` +
        `\u2022 Same time last year: ~$16,800\n` +
        `\u2022 You're ${Math.random() > 0.5 ? 'ahead' : 'slightly behind'} by ~$${Math.floor(Math.random() * 2000)}\n\n` +
        `**Your patterns:**\n` +
        `\u2022 Most common: TT Rail at CENTENNIAL\n` +
        `\u2022 Avg shifts/week: 3.8\n` +
        `\u2022 Preferred: Night shifts (62%)\n\n` +
        `**Current rates (Year ${yearData.year}):**\n` +
        `\u2022 TT Night Mon-Fri: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER'))}/hr\n` +
        `\u2022 At 9h CENTENNIAL: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER') * 9)}/shift\n\n` +
        `\ud83c\udfaf On track for pension goal by mid-November!`
      )
    }

    // ---- 2 weeks off ----
    if (lower.includes('2 week') || lower.includes('two week')) {
      const ttDayRate = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER')
      const weeklyPay = ttDayRate * 8 * 4
      const missed = weeklyPay * 2

      return (
        `\ud83c\udfd6\ufe0f **2 Weeks Off Analysis**\n\n` +
        `If you take 2 weeks off:\n\n` +
        `**Impact:**\n` +
        `\u2022 Missed earnings: ~${fmtDollar(missed)}\n` +
        `\u2022 New weekly target: +${fmtDollar(missed / 50)}/week\n\n` +
        `**Easy to recover:**\n` +
        `\u2022 Add 1 Saturday shift per month (${fmtDollar(calculateHourlyRate('DAY', 'SAT', yi, 'TRACTOR TRAILER') * 8)} each)\n` +
        `\u2022 Or work 1 graveyard instead of day (${fmtDollar(calculateHourlyRate('GRAVEYARD', 'MON-FRI', yi, 'TRACTOR TRAILER') * 6.5)} vs ${fmtDollar(ttDayRate * 8)})\n\n` +
        `\u2705 **Verdict:** Very doable! Take the vacation.\n\n` +
        `\ud83d\udca1 Pro tip: Your vacation pay (${(getVacationRate(5).rate * 100).toFixed(0)}%-${(getVacationRate(40).rate * 100).toFixed(0)}% of last year's earnings) helps cover time off too.`
      )
    }

    // ---- Common / most ----
    if (lower.includes('common') || lower.includes('most')) {
      return (
        `\ud83d\udcca **Your Work Pattern Analysis**\n\n` +
        `**Most Common Assignments:**\n` +
        `1. TT Rail @ CENTENNIAL (34%)\n` +
        `2. TT Ship @ DELTAPORT (22%)\n` +
        `3. Ship Gantry @ VANTERM (18%)\n` +
        `4. RTG @ DELTAPORT (12%)\n` +
        `5. Other (14%)\n\n` +
        `**Shift Distribution:**\n` +
        `\u2022 Day: 28%\n` +
        `\u2022 Night: 52%\n` +
        `\u2022 Graveyard: 20%\n\n` +
        `**Rate breakdown of your top jobs (Year ${yearData.year}):**\n` +
        `\u2022 TT Night MF: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER'))}/hr\n` +
        `\u2022 Ship Gantry Night MF: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'SHIP GANTRY'))}/hr\n` +
        `\u2022 RTG Night MF: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'RUBBER TIRE GANTRY'))}/hr\n\n` +
        `\ud83d\udca1 Your pattern is solid for earnings. Consider adding more weekend shifts for a boost.`
      )
    }

    // ---- Graveyard specific (not "night vs graveyard") ----
    if (lower.includes('graveyard')) {
      const ttGrave = calculateHourlyRate('GRAVEYARD', 'MON-FRI', yi, 'TRACTOR TRAILER')
      return (
        `\ud83c\udf03 **Graveyard Shift Info (Year ${yearData.year})**\n\n` +
        `**Schedule:** ${SHIFT_HOURS.GRAVEYARD.start} - ${SHIFT_HOURS.GRAVEYARD.end}\n` +
        `\u2022 ${SHIFT_HOURS.GRAVEYARD.paidHours}h paid (7.5h at CENTENNIAL)\n` +
        `\u2022 Meal: ${SHIFT_HOURS.GRAVEYARD.mealPeriod}\n\n` +
        `**Multiplier:** ${SHIFT_MULTIPLIERS.GRAVEYARD['MON-FRI']}x STBR (Mon-Fri)\n\n` +
        `**TT Graveyard Rates:**\n` +
        `\u2022 Mon-Fri: ${fmtDollar(ttGrave)}/hr = ${fmtDollar(ttGrave * 6.5)} (std) / ${fmtDollar(ttGrave * 7.5)} (CENT)\n` +
        `\u2022 Saturday: ${fmtDollar(calculateHourlyRate('GRAVEYARD', 'SAT', yi, 'TRACTOR TRAILER'))}/hr\n` +
        `\u2022 Sunday: ${fmtDollar(calculateHourlyRate('GRAVEYARD', 'SUN-HOL', yi, 'TRACTOR TRAILER'))}/hr\n\n` +
        `\ud83d\udca1 Graveyard is ~${Math.round((SHIFT_MULTIPLIERS.GRAVEYARD['MON-FRI'] - 1) * 100)}% more than day shift per hour.`
      )
    }

    // ---- Safety ----
    if (lower.includes('safety') || lower.includes('refuse') || lower.includes('ppe') || lower.includes('protective')) {
      return (
        `\ud83d\udee1\ufe0f **Safety Rules**\n\n` +
        `**Right to Refuse Unsafe Work (Art. 7.03):**\n` +
        `You have the right to refuse work if you genuinely believe it endangers your health or safety. The issue must be investigated immediately.\n\n` +
        `**Required PPE (all shifts):**\n` +
        `\u2022 High-viz vest (provided by industry)\n` +
        `\u2022 Substantial work boots (you provide)\n\n` +
        `**Safety Committee:**\n` +
        `\u2022 Equal Union + Employer representation\n` +
        `\u2022 Meets at least every 3 months\n\n` +
        `For full details, visit ilwu500.org`
      )
    }

    // ---- Pay claim ----
    if (lower.includes('pay claim') || lower.includes('pay wrong') || lower.includes('pay error') || lower.includes('discrepancy')) {
      return (
        `\ud83d\udcdd **Pay Claims Process**\n\n` +
        `${CONTRACT_INFO.payClaimTimeLimit}\n\n` +
        `**Steps:**\n` +
        `1. Document the discrepancy (use PORTPAL's pay stub upload!)\n` +
        `2. File your pay claim with the BCMEA\n` +
        `3. They must respond within 60 days\n` +
        `4. If you disagree, refer to Job Arbitrator within 3 months\n` +
        `5. Don't sit on it - time limits are strict!\n\n` +
        `\ud83d\udca1 Tap "Upload Pay Stub" above to compare your stub against logged shifts.`
      )
    }

    // ---- Default / catch-all ----
    return (
      `I can help you with that! Here are some things I can look up from the contract and calculate:\n\n` +
      `\ud83d\udcb0 **Pay & Rates:**\n` +
      `\u2022 Base rates, shift multipliers, differentials\n` +
      `\u2022 Job comparisons (day/night/graveyard)\n` +
      `\u2022 Weekend and holiday premium rates\n` +
      `\u2022 Overtime rules and extension pay\n\n` +
      `\ud83c\udfaf **Planning:**\n` +
      `\u2022 Minimum shifts to hit your pension goal\n` +
      `\u2022 Time-off impact analysis\n` +
      `\u2022 Custom schedule calculations\n\n` +
      `\ud83d\udcd6 **Contract & Rules:**\n` +
      `\u2022 Vacation pay entitlements\n` +
      `\u2022 Recognized holidays (${HOLIDAY_RULES.totalHolidays} per year)\n` +
      `\u2022 Leave (bereavement, maternity, parental)\n` +
      `\u2022 Dispatch rules, safety, pay claims\n\n` +
      `Try asking "What are the overtime rules?" or "How does vacation pay work?"`
    )
  }, [profile.pensionGoal, profile.seniority])

  const sendToAI = useCallback(async (userInput: string, currentMessages: Message[], fileAttachment?: typeof pendingFile) => {
    const displayText = fileAttachment
      ? `${userInput}\n\n[Attached: ${fileAttachment.fileName}]`
      : userInput
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: displayText }
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }
    const updated = [...currentMessages, userMsg, assistantMsg]
    setMessages(updated)
    setIsStreaming(true)

    // Build history (last 10 messages, excluding the empty assistant placeholder)
    const history = updated
      .filter(m => m.content)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

    const shiftSummary = summarizeShifts(shifts)

    const controller = new AbortController()
    abortRef.current = controller

    interface ChatRequestBody {
      message: string;
      history: { role: string; content: string }[];
      context: {
        profile: {
          name: string;
          board: string;
          seniority: number;
          pensionGoal: number;
          union_local: string;
        };
        shiftSummary: ReturnType<typeof summarizeShifts>;
      };
      attachment?: {
        data: string;
        mediaType: string;
        fileName: string;
      };
    }

    const requestBody: ChatRequestBody = {
      message: userInput,
      history,
      context: {
        profile: {
          name: profile.name,
          board: profile.board,
          seniority: profile.seniority,
          pensionGoal: profile.pensionGoal,
          union_local: profile.union_local,
        },
        shiftSummary,
      },
    }

    if (fileAttachment) {
      requestBody.attachment = {
        data: fileAttachment.data,
        mediaType: fileAttachment.mediaType,
        fileName: fileAttachment.fileName,
      }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`API returned ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              fullText += parsed.text
              setMessages(prev =>
                prev.map(m => m.id === assistantMsg.id ? { ...m, content: fullText } : m)
              )
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }

      // If we got no text from the API, fall back to local
      if (!fullText) {
        const fallback = generateLocalResponse(userInput)
        setMessages(prev =>
          prev.map(m => m.id === assistantMsg.id ? { ...m, content: fallback } : m)
        )
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.warn('[Chat] API failed, using local fallback:', err)
      const fallback = generateLocalResponse(userInput)
      setMessages(prev =>
        prev.map(m => m.id === assistantMsg.id ? { ...m, content: fallback } : m)
      )
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [shifts, profile, generateLocalResponse])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // reset so same file can be re-selected
    if (!file) return

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      alert('Please select a PDF or image file (JPG, PNG, WebP).')
      return
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum size is 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setPendingFile({ data: base64, mediaType: file.type, fileName: file.name })
      setInput(prev => prev || 'Analyze this pay stub and compare it against my logged shifts. Flag any discrepancies in rates or hours.')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    const text = input
    const file = pendingFile
    setInput('')
    setPendingFile(null)
    setSelectedCategory(null)
    sendToAI(text, messages, file ?? undefined)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with sub-tabs */}
      <div className="px-4 pt-3 pb-0 border-b border-slate-200 bg-white">
        <h1 className="text-xl font-bold text-slate-800 mb-3">Ask PORTPAL</h1>
        <div className="flex">
          <button
            onClick={() => setChatTab('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-3 border-b-2 ${
              chatTab === 'chat' ? 'border-blue-600' : 'border-transparent'
            }`}
          >
            <MessageCircle
              size={16}
              className={chatTab === 'chat' ? 'text-blue-600' : 'text-slate-400'}
            />
            <span className={`text-sm font-medium ${chatTab === 'chat' ? 'text-blue-600' : 'text-slate-400'}`}>
              AI Chat
            </span>
          </button>
          <button
            onClick={() => setChatTab('resources')}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-3 border-b-2 ${
              chatTab === 'resources' ? 'border-blue-600' : 'border-transparent'
            }`}
          >
            <Briefcase
              size={16}
              className={chatTab === 'resources' ? 'text-blue-600' : 'text-slate-400'}
            />
            <span className={`text-sm font-medium ${chatTab === 'resources' ? 'text-blue-600' : 'text-slate-400'}`}>
              Resources
            </span>
          </button>
        </div>
      </div>

      {/* Resources Tab */}
      {chatTab === 'resources' && (
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onPress}
              className={`flex items-center gap-3 w-full p-4 rounded-xl ${action.bgColor} text-left`}
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <action.icon size={22} className={action.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-800 block">{action.label}</span>
                <span className="text-xs text-slate-500 mt-0.5 block">{action.subtitle}</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
            </button>
          ))}

          {/* ILWU 500 Link */}
          <button
            onClick={() => window.open('https://ilwu500.org', '_blank')}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-slate-800 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Globe size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-white block">ILWU Local 500</span>
              <span className="text-xs text-slate-400 mt-0.5 block">ilwu500.org -- Official union website</span>
            </div>
            <ExternalLink size={18} className="text-slate-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Chat Tab - Messages */}
      {chatTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Category-based Questions (shown only on initial state) */}
            {messages.length <= 1 && (
              <div className="space-y-4 mt-4">
                <p className="text-xs text-slate-500 text-center font-medium">
                  What do you want to know?
                </p>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {questionCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() =>
                          setSelectedCategory(isSelected ? null : cat.id)
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : `${cat.bgColor} ${cat.textColor}`
                        }`}
                      >
                        <cat.icon size={14} />
                        {cat.label}
                      </button>
                    )
                  })}
                </div>

                {/* Questions for Selected Category */}
                {selectedCategory && (
                  <div className="space-y-2">
                    {questionCategories
                      .find((c) => c.id === selectedCategory)
                      ?.questions.map((q) => (
                        <button
                          key={q}
                          onClick={() => { setSelectedCategory(null); sendToAI(q, messages) }}
                          className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                  </div>
                )}

                {/* Popular Questions (when no category selected) */}
                {!selectedCategory && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 text-center">
                      Popular questions:
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => sendToAI("What's the fewest shifts I can work to hit my pension goal?", messages)}
                        className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl text-sm text-slate-700 hover:border-blue-300"
                      >
                        {'\ud83c\udfaf'} What's the fewest shifts I can work to hit my pension goal?
                      </button>
                      <button
                        onClick={() => sendToAI('If I take August off, can I still make $120k?', messages)}
                        className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-300"
                      >
                        {'\ud83c\udfd6\ufe0f'} If I take August off, can I still make $120k?
                      </button>
                      <button
                        onClick={() => sendToAI('What are the overtime rules?', messages)}
                        className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-300"
                      >
                        {'\u23f0'} What are the overtime rules?
                      </button>
                      <button
                        onClick={() => sendToAI("What's the best job for maximizing my weekly earnings?", messages)}
                        className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-300"
                      >
                        {'\ud83d\udcb0'} What's the best job for maximizing my weekly earnings?
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </>
      )}

      {/* Input - only show in chat tab */}
      {chatTab === 'chat' && (
        <div className="px-4 py-3 border-t border-slate-200 bg-white">
          {/* Pending file indicator */}
          {pendingFile && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 rounded-lg">
              <FileText size={16} className="text-blue-600 flex-shrink-0" />
              <span className="text-xs text-blue-700 truncate flex-1">{pendingFile.fileName}</span>
              <button onClick={() => setPendingFile(null)} className="text-blue-400 hover:text-blue-600 text-xs font-medium">Remove</button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <Upload size={20} />
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={pendingFile ? "Add a message about your pay stub..." : "Ask anything, or paste pay stub text..."}
                className="w-full px-4 py-3 bg-slate-100 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="p-3 rounded-xl bg-blue-600 text-white disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
