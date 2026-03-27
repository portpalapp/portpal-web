import { BarChart3 } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'

interface MonthlySummaryProps {
  monthShiftCount: number
  monthEarnings: number
  avgPerShift: number
  topJobs: [string, { count: number; pay: number }][]
}

export function MonthlySummary({ monthShiftCount, monthEarnings, avgPerShift, topJobs }: MonthlySummaryProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={18} className="text-slate-600" />
        <h3 className="font-semibold text-slate-800">
          {new Date().toLocaleDateString('en-US', { month: 'long' })} Summary
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-slate-50 rounded-xl">
          <p className="text-lg font-bold text-slate-800">{monthShiftCount}</p>
          <p className="text-[10px] text-slate-500">Shifts</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-xl">
          <p className="text-lg font-bold text-slate-800">{formatCurrency(monthEarnings)}</p>
          <p className="text-[10px] text-slate-500">Earned</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-xl">
          <p className="text-lg font-bold text-slate-800">{formatCurrency(avgPerShift)}</p>
          <p className="text-[10px] text-slate-500">Avg/Shift</p>
        </div>
      </div>

      {/* Top jobs this month */}
      {topJobs.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 font-medium">Top Jobs</p>
          {topJobs.map(([job, { count, pay }]) => (
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
  )
}
