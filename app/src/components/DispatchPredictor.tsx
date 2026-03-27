import { useState, useRef } from 'react'
import {
  Target,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useDispatchPredictor } from '../hooks/useDispatchPredictor'
import type { PredictionResult, CategoryPrediction } from '../lib/prediction/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BOARDS = [
  { id: 'a', label: 'A Board' },
  { id: 'b', label: 'B Board' },
  { id: 'c', label: 'C Board' },
  { id: 't', label: 'T Board' },
  { id: '00', label: '00 Board' },
  { id: 'r', label: 'R Board' },
]

const CONFIDENCE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-green-100', text: 'text-green-700', label: 'High confidence' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium confidence' },
  low: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Low confidence' },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProbabilityGauge({ probability, confidence }: { probability: number; confidence: string }) {
  // Color based on probability
  let gaugeColor = 'text-red-500'
  let ringColor = 'stroke-red-400'
  if (probability >= 70) {
    gaugeColor = 'text-green-600'
    ringColor = 'stroke-green-500'
  } else if (probability >= 40) {
    gaugeColor = 'text-yellow-600'
    ringColor = 'stroke-yellow-500'
  }

  const conf = CONFIDENCE_CONFIG[confidence] ?? CONFIDENCE_CONFIG.low

  // SVG circular gauge
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (probability / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
          {/* Background ring */}
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-100"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            className={ringColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${gaugeColor}`}>{probability}%</span>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 ${conf.bg} ${conf.text}`}>
        {conf.label}
      </span>
    </div>
  )
}

function LikelyJobBadge({ job, categories }: { job: string | null; categories: CategoryPrediction[] }) {
  if (!job) {
    return (
      <div className="text-center">
        <p className="text-sm text-slate-500">No category projected to reach you</p>
        <p className="text-xs text-slate-400 mt-1">Job demand may be low or board is fully covered</p>
      </div>
    )
  }

  const otherHits = categories.filter(c => c.willReachYou && c.category !== job)

  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-1">Likely job</p>
      <p className="text-lg font-bold text-slate-800">{job}</p>
      {otherHits.length > 0 && (
        <p className="text-xs text-slate-400 mt-1">
          Also: {otherHits.map(c => c.category).join(', ')}
        </p>
      )}
    </div>
  )
}

function CategoryBreakdownTable({ categories }: { categories: CategoryPrediction[] }) {
  // Only show categories that have some jobs or are rated for
  const relevant = categories.filter(c => c.totalAtJobs > 0 || c.workerIsRated)

  if (relevant.length === 0) return null

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="grid grid-cols-12 gap-1 text-[10px] font-medium text-slate-400 px-1">
        <span className="col-span-3">Category</span>
        <span className="col-span-2 text-right">Jobs</span>
        <span className="col-span-2 text-right">Casual</span>
        <span className="col-span-2 text-right">Ahead</span>
        <span className="col-span-3 text-right">Status</span>
      </div>

      {relevant.map(cat => {
        const isHit = cat.willReachYou
        const isRated = cat.workerIsRated

        return (
          <div
            key={cat.category}
            className={`grid grid-cols-12 gap-1 items-center px-2 py-1.5 rounded-lg text-xs ${
              isHit ? 'bg-green-50' : 'bg-slate-50'
            }`}
          >
            <span className={`col-span-3 font-medium truncate ${isHit ? 'text-green-700' : 'text-slate-700'}`}>
              {cat.category}
            </span>
            <span className="col-span-2 text-right text-slate-600">{cat.totalAtJobs}</span>
            <span className="col-span-2 text-right text-slate-600">{cat.estimatedCasualJobs}</span>
            <span className="col-span-2 text-right text-slate-600">
              {isRated ? cat.workersAheadOfYou : '—'}
            </span>
            <span className="col-span-3 text-right">
              {isHit ? (
                <span className="inline-flex items-center gap-0.5 text-green-600 font-medium">
                  <CheckCircle2 size={10} />
                  Reaches you
                </span>
              ) : !isRated ? (
                <span className="text-slate-400">Not rated</span>
              ) : cat.estimatedCasualJobs === 0 ? (
                <span className="text-slate-400">No jobs</span>
              ) : (
                <span className="text-red-500">Filled before you</span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DataQualityNotice({ prediction }: { prediction: PredictionResult }) {
  const { dataQuality } = prediction
  const hasWarnings = dataQuality.warnings.length > 0

  if (!hasWarnings && dataQuality.hasBoardData && dataQuality.hasWorkInfoData) {
    return null
  }

  return (
    <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-[11px] text-amber-700 space-y-0.5">
        {!dataQuality.hasBoardData && (
          <p>No board roster data available — prediction based on job demand only.</p>
        )}
        {!dataQuality.hasWorkInfoData && (
          <p>No work-info data — cannot estimate job counts.</p>
        )}
        {!dataQuality.hasButtonData && dataQuality.hasBoardData && (
          <p>Button positions unavailable — using plate-order estimate for accuracy.</p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DispatchPredictor() {
  const {
    board,
    plate,
    setBoard,
    setPlate,
    prediction,
    loading,
    isReady,
    refetch,
  } = useDispatchPredictor()

  const [showBreakdown, setShowBreakdown] = useState(false)
  const [plateInput, setPlateInput] = useState(plate?.toString() ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle plate input
  const handlePlateChange = (value: string) => {
    setPlateInput(value)
    const num = parseInt(value, 10)
    if (!isNaN(num) && num > 0 && num <= 500) {
      setPlate(num)
    } else if (value === '') {
      setPlate(null)
    }
  }

  const handlePlateBlur = () => {
    const num = parseInt(plateInput, 10)
    if (isNaN(num) || num < 1) {
      setPlateInput('')
      setPlate(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/10 rounded-xl">
            <Target size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold">My Dispatch Prediction</h2>
            <p className="text-white/60 text-xs">Will I get dispatched today?</p>
          </div>
        </div>
      </div>

      {/* Input controls */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex gap-3">
          {/* Board selector */}
          <div className="flex-1">
            <label htmlFor="pred-board" className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
              Board
            </label>
            <select
              id="pred-board"
              value={board}
              onChange={e => setBoard(e.target.value)}
              className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {BOARDS.map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Plate number input */}
          <div className="flex-1">
            <label htmlFor="pred-plate" className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
              Plate #
            </label>
            <input
              ref={inputRef}
              id="pred-plate"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              placeholder="e.g. 165"
              value={plateInput}
              onChange={e => handlePlateChange(e.target.value)}
              onBlur={handlePlateBlur}
              className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300"
            />
          </div>
        </div>

        {!isReady && (
          <p className="text-xs text-slate-400 mt-2.5 text-center">
            Enter your plate number to see your dispatch prediction
          </p>
        )}
      </div>

      {/* Loading state */}
      {isReady && loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={24} className="text-blue-600 animate-spin" />
        </div>
      )}

      {/* Prediction result */}
      {isReady && !loading && prediction && (
        <div className="p-4 space-y-4">
          {/* Main result: gauge + likely job */}
          <div className="flex items-center gap-5">
            <ProbabilityGauge
              probability={prediction.dispatchProbability}
              confidence={prediction.confidence}
            />
            <div className="flex-1">
              <LikelyJobBadge
                job={prediction.likelyJob}
                categories={prediction.allCategories}
              />
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-600 leading-relaxed">{prediction.reasoning}</p>
          </div>

          {/* Worker info (if found on board) */}
          {prediction.worker.ratings.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-medium text-slate-500 uppercase">Ratings:</span>
              {prediction.worker.ratings.map(r => (
                <span key={r} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                  {r}
                </span>
              ))}
            </div>
          )}

          {/* Data quality */}
          <DataQualityNotice prediction={prediction} />

          {/* Category breakdown toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showBreakdown ? 'Hide' : 'Show'} category breakdown
          </button>

          {showBreakdown && (
            <CategoryBreakdownTable categories={prediction.allCategories} />
          )}

          {/* Refresh + info */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <HelpCircle size={10} />
              <span>Based on latest board roster + job demand</span>
            </div>
          </div>
        </div>
      )}

      {/* No prediction (plate entered but no data returned) */}
      {isReady && !loading && !prediction && (
        <div className="p-6 text-center">
          <p className="text-sm text-slate-500">No prediction data available</p>
          <p className="text-xs text-slate-400 mt-1">
            Check back during dispatch hours when board roster data is fresh.
          </p>
        </div>
      )}
    </div>
  )
}
