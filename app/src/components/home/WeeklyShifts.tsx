import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDateRelative } from '../../lib/formatters'
import type { Shift } from '../../hooks/useShifts'

interface WeeklyShiftsProps {
  thisWeekShifts: Shift[]
  thisWeekEarnings: number
}

export function WeeklyShifts({ thisWeekShifts, thisWeekEarnings }: WeeklyShiftsProps) {
  const navigate = useNavigate()

  return (
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
  )
}
