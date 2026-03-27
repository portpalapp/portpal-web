import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'

interface EarningsCardsProps {
  thisWeekEarnings: number
  lastWeekEarnings: number
  thisWeekShiftCount: number
}

export function EarningsCards({ thisWeekEarnings, lastWeekEarnings, thisWeekShiftCount }: EarningsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
        <p className="text-blue-100 text-xs font-medium">This Week</p>
        <p className="text-2xl font-bold mt-1">{formatCurrency(thisWeekEarnings)}</p>
        <div className="flex items-center gap-1 mt-2 text-blue-100 text-xs">
          <TrendingUp size={12} />
          <span>{thisWeekShiftCount} shifts</span>
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
  )
}
