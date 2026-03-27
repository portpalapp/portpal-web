import { useNavigate } from 'react-router-dom'
import { Target, Sparkles, ChevronRight } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'

interface PensionProgressProps {
  ytdEarnings: number
  pensionGoal: number
  pensionProgress: number
  projectedDate: Date
}

export function PensionProgress({ ytdEarnings, pensionGoal, pensionProgress, projectedDate }: PensionProgressProps) {
  const navigate = useNavigate()

  return (
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
          <p className="text-xs text-slate-500">of {formatCurrency(pensionGoal)}</p>
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
  )
}
