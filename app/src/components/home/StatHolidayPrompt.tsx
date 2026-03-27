import { useNavigate } from 'react-router-dom'
import { Gift } from 'lucide-react'
import type { StatHoliday } from '../../data/holidayData'

interface StatHolidayPromptProps {
  todayHoliday: StatHoliday
}

export function StatHolidayPrompt({ todayHoliday }: StatHolidayPromptProps) {
  const navigate = useNavigate()

  return (
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
  )
}
