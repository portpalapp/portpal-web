import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight } from 'lucide-react'

export function AskAIButton() {
  const navigate = useNavigate()

  return (
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
  )
}
