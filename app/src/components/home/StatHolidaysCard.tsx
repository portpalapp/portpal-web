import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gift, ChevronRight, Info } from 'lucide-react'
import { formatDateCompact } from '../../lib/formatters'
import { daysUntil, type StatHoliday } from '../../data/holidayData'
import type { Shift } from '../../hooks/useShifts'

interface StatHolidaysCardProps {
  upcomingHolidays: StatHoliday[]
  shifts: Shift[]
  todayStr: string
}

function getShiftsInPeriod(shifts: Shift[], h: StatHoliday): number {
  return shifts.filter(s => {
    if (!s.date) return false
    const d = s.date.slice(0, 10)
    return d >= h.countingPeriodStart && d <= h.countingPeriodEnd
  }).length
}

function getHolidayStatus(shifts: Shift[], h: StatHoliday, todayStr: string): 'qualifying' | 'in-progress' | 'at-risk' {
  const worked = getShiftsInPeriod(shifts, h)
  if (worked >= 15) return 'qualifying'
  if (todayStr <= h.countingPeriodEnd) return 'in-progress'
  return 'at-risk'
}

export function StatHolidaysCard({ upcomingHolidays, shifts, todayStr }: StatHolidaysCardProps) {
  const navigate = useNavigate()
  const [showHolidayInfo, setShowHolidayInfo] = useState(false)

  if (upcomingHolidays.length === 0) return null

  return (
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
          const worked = getShiftsInPeriod(shifts, h)
          const status = getHolidayStatus(shifts, h, todayStr)
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
  )
}
