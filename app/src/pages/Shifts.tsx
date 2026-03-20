import { useState, useEffect, useCallback } from 'react'
import { Check, Calendar, Plus, Minus, AlertCircle, CheckCircle2, RotateCcw, Star, Edit3, X, Loader2 } from 'lucide-react'
import {
  JOBS,
  LOCATIONS,
  SUBJOBS,
  BASE_RATES,
  DIFFERENTIALS,
  HOURS_BY_LOCATION,
} from '../data/mockData'
import { useShifts } from '../hooks/useShifts'
import type { Shift, AddShiftInput } from '../hooks/useShifts'
import { useTemplates } from '../hooks/useTemplates'
import type { TemplateRecord } from '../hooks/useTemplates'

type ShiftType = 'DAY' | 'NIGHT' | 'GRAVEYARD'

// Get custom locations (kept in localStorage — user-local preference)
const getCustomLocations = (): string[] => {
  const saved = localStorage.getItem('customLocations')
  if (saved) return JSON.parse(saved)
  return []
}

// Inline toast state
interface Toast {
  type: 'success' | 'error'
  message: string
}

export function Shifts() {
  const { shifts, loading: shiftsLoading, addShift } = useShifts()
  const {
    templates,
    loading: templatesLoading,
    addTemplate,
    deleteTemplate: deleteTemplateSupa,
  } = useTemplates()

  const [step, setStep] = useState(1)
  const [job, setJob] = useState('')
  const [location, setLocation] = useState('')
  const [subjob, setSubjob] = useState('')
  const [shift, setShift] = useState<ShiftType>('DAY')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [regHours, setRegHours] = useState(8)
  const [otHours, setOtHours] = useState(0)

  // New state for custom entries and editing
  const [customSubjob, setCustomSubjob] = useState('')
  const [showCustomSubjob, setShowCustomSubjob] = useState(false)
  const [customLocation, setCustomLocation] = useState('')
  const [showCustomLocation, setShowCustomLocation] = useState(false)
  const [customLocations, setCustomLocations] = useState<string[]>([])
  const [editingRate, setEditingRate] = useState(false)
  const [manualRegRate, setManualRegRate] = useState<number | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  // Derive "last shift" from the shifts array (most recent by date)
  const lastShift: Shift | null = shifts.length > 0 ? shifts[0] : null

  // Load custom locations on mount
  useEffect(() => {
    setCustomLocations(getCustomLocations())
  }, [])

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // Calculate rate based on selections
  const calculateRate = () => {
    if (!job) return { regRate: 0, otRate: 0 }

    // Use manual rate if set
    if (manualRegRate !== null) {
      return {
        regRate: manualRegRate,
        otRate: Math.round(manualRegRate * 1.5 * 100) / 100,
      }
    }

    const dayOfWeek = new Date(date).getDay()
    const dayType = dayOfWeek === 0 ? 'SUN' : dayOfWeek === 6 ? 'SAT' : 'MON-FRI'
    const baseRate = BASE_RATES[shift][dayType]
    const diff = DIFFERENTIALS[job] || { amount: 0 }

    let regRate = baseRate + diff.amount
    if (job === 'TRAINER') {
      regRate = baseRate * 1.333333 + 1.67
    }

    return {
      regRate: Math.round(regRate * 100) / 100,
      otRate: Math.round(regRate * 1.5 * 100) / 100,
    }
  }

  const { regRate, otRate } = calculateRate()
  const totalPay = regHours * regRate + otHours * otRate

  // Apply callback (repeat last shift)
  const applyCallback = () => {
    if (lastShift) {
      setJob(lastShift.job)
      setLocation(lastShift.location)
      setSubjob(lastShift.subjob || '')
      setShift(lastShift.shift)
      setStep(3) // Skip to review
    }
  }

  // Apply template
  const applyTemplate = (template: TemplateRecord) => {
    setJob(template.job)
    setLocation(template.location)
    setSubjob(template.subjob || '')
    setShift(template.shift as ShiftType)
    setShowTemplates(false)
    setStep(3) // Skip to review
  }

  // Save current as template (Supabase)
  const saveAsTemplate = useCallback(async () => {
    if (!newTemplateName || !job || !location) return
    const { error } = await addTemplate({
      name: newTemplateName,
      job,
      location,
      subjob: subjob || undefined,
      shift,
    })
    if (error) {
      setToast({ type: 'error', message: 'Failed to save template' })
    }
    setNewTemplateName('')
    setShowSaveTemplate(false)
  }, [newTemplateName, job, location, subjob, shift, addTemplate])

  // Delete template (Supabase)
  const handleDeleteTemplate = useCallback(async (id: string) => {
    await deleteTemplateSupa(id)
  }, [deleteTemplateSupa])

  // Save custom location (localStorage)
  const saveCustomLocation = () => {
    if (!customLocation) return
    const updated = [...customLocations, customLocation.toUpperCase()]
    setCustomLocations(updated)
    localStorage.setItem('customLocations', JSON.stringify(updated))
    setLocation(customLocation.toUpperCase())
    setCustomLocation('')
    setShowCustomLocation(false)
  }

  // Update hours when location changes
  const updateHoursForLocation = (loc: string) => {
    const hours = HOURS_BY_LOCATION[loc] || HOURS_BY_LOCATION.DEFAULT
    if (shift === 'DAY') setRegHours(hours.day)
    else if (shift === 'NIGHT') setRegHours(hours.night)
    else setRegHours(hours.graveyard)
  }

  // Save shift to Supabase
  const handleSaveShift = async () => {
    setSaving(true)
    const input: AddShiftInput = {
      job,
      location,
      subjob: subjob || undefined,
      shift,
      date,
      regHours,
      otHours,
      regRate,
      otRate,
      totalPay: Math.round(totalPay * 100) / 100,
    }

    const { error } = await addShift(input)
    setSaving(false)

    if (error) {
      setToast({ type: 'error', message: `Failed to save shift: ${error.message}` })
      return
    }

    setToast({ type: 'success', message: 'Shift saved successfully!' })

    // Reset form
    setStep(1)
    setJob('')
    setLocation('')
    setSubjob('')
    setManualRegRate(null)
    setEditingRate(false)
  }

  // Filter out "BLANK" from subjobs
  const availableSubjobs = (SUBJOBS[job] || []).filter(s => s !== 'BLANK')

  // All locations including custom ones
  const allLocations = [...LOCATIONS, ...customLocations.filter(c => !LOCATIONS.includes(c))]

  // Show a spinner while initial data loads
  if (shiftsLoading && shifts.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading shifts...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Log Shift</h1>
        <p className="text-sm text-slate-500">Quick entry with smart defaults</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6 px-4">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step >= s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-0.5 mx-2 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Job Selection */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            {lastShift && (
              <button
                onClick={applyCallback}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl border border-green-200 font-medium"
              >
                <RotateCcw size={18} />
                <span>Repeat Last</span>
              </button>
            )}
            {templates.length > 0 && (
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200 font-medium"
              >
                <Star size={18} />
                <span>Templates{templatesLoading ? '...' : ''}</span>
              </button>
            )}
          </div>

          {/* Templates Dropdown */}
          {showTemplates && templates.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="text-xs font-medium text-slate-500">Saved Templates</p>
              {templates.map(template => (
                <div key={template.id} className="flex items-center gap-2">
                  <button
                    onClick={() => applyTemplate(template)}
                    className="flex-1 text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100"
                  >
                    <p className="font-medium text-slate-700 text-sm">{template.name}</p>
                    <p className="text-xs text-slate-500">{template.job} - {template.location}</p>
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-red-400 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <h2 className="font-semibold text-slate-700">What job did you work?</h2>

          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto no-scrollbar">
            {JOBS.map(j => {
              const diff = DIFFERENTIALS[j]
              const hasData = diff?.hasData ?? false

              return (
                <button
                  key={j}
                  onClick={() => {
                    setJob(j)
                    setSubjob('')
                  }}
                  className={`p-3 rounded-xl text-left text-sm font-medium transition-all relative ${
                    job === j
                      ? 'bg-blue-600 text-white shadow-lg scale-[1.02]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span className="pr-5">{j}</span>
                  {hasData ? (
                    <CheckCircle2
                      size={14}
                      className={`absolute top-2 right-2 ${job === j ? 'text-green-300' : 'text-green-500'}`}
                    />
                  ) : (
                    <AlertCircle
                      size={14}
                      className={`absolute top-2 right-2 ${job === j ? 'text-orange-300' : 'text-orange-400'}`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs text-slate-500 mt-2">
            <div className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-green-500" />
              <span>Verified rate</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle size={12} className="text-orange-400" />
              <span>Base rate (learning)</span>
            </div>
          </div>

          {job && (
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium mt-4"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {/* Step 2: Location & Details */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-700">Where and when?</h2>

          {/* Location */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Location</label>
            <div className="grid grid-cols-3 gap-2">
              {allLocations.slice(0, 9).map(loc => (
                <button
                  key={loc}
                  onClick={() => {
                    setLocation(loc)
                    updateHoursForLocation(loc)
                  }}
                  className={`p-2 rounded-lg text-xs font-medium transition-all ${
                    location === loc
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
              <button
                onClick={() => setShowCustomLocation(true)}
                className="p-2 rounded-lg text-xs font-medium bg-slate-50 text-slate-500 border border-dashed border-slate-300 flex items-center justify-center gap-1"
              >
                <Plus size={14} />
                <span>Other</span>
              </button>
            </div>

            {/* Custom Location Input */}
            {showCustomLocation && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter location name"
                  value={customLocation}
                  onChange={e => setCustomLocation(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
                <button
                  onClick={saveCustomLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomLocation(false)
                    setCustomLocation('')
                  }}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Subjob */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Subjob {availableSubjobs.length === 0 && '(Optional)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSubjobs.map(sub => (
                <button
                  key={sub}
                  onClick={() => {
                    setSubjob(sub)
                    setShowCustomSubjob(false)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    subjob === sub
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
              <button
                onClick={() => setShowCustomSubjob(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-500 border border-dashed border-slate-300 flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Add Custom</span>
              </button>
            </div>

            {/* Custom Subjob Input */}
            {showCustomSubjob && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter subjob name"
                  value={customSubjob}
                  onChange={e => setCustomSubjob(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
                <button
                  onClick={() => {
                    if (customSubjob) {
                      setSubjob(customSubjob.toUpperCase())
                      setShowCustomSubjob(false)
                      setCustomSubjob('')
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomSubjob(false)
                    setCustomSubjob('')
                  }}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Shift Type */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Shift</label>
            <div className="grid grid-cols-3 gap-2">
              {(['DAY', 'NIGHT', 'GRAVEYARD'] as ShiftType[]).map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setShift(s)
                    const hours = HOURS_BY_LOCATION[location] || HOURS_BY_LOCATION.DEFAULT
                    if (s === 'DAY') setRegHours(hours.day)
                    else if (s === 'NIGHT') setRegHours(hours.night)
                    else setRegHours(hours.graveyard)
                  }}
                  className={`p-3 rounded-xl text-sm font-medium flex flex-col items-center gap-1 ${
                    shift === s
                      ? s === 'DAY' ? 'bg-amber-400 text-amber-900' :
                        s === 'NIGHT' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!location}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Hours & Review */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-700">Hours & Pay</h2>

          {/* Hours Adjusters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <label className="text-xs font-medium text-slate-500 block mb-2">Regular Hours</label>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setRegHours(Math.max(0, regHours - 0.5))}
                  className="p-2 rounded-lg bg-slate-100 text-slate-600"
                >
                  <Minus size={18} />
                </button>
                <span className="text-2xl font-bold text-slate-800">{regHours}</span>
                <button
                  onClick={() => setRegHours(regHours + 0.5)}
                  className="p-2 rounded-lg bg-slate-100 text-slate-600"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <label className="text-xs font-medium text-slate-500 block mb-2">OT Hours</label>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setOtHours(Math.max(0, otHours - 0.5))}
                  className="p-2 rounded-lg bg-slate-100 text-slate-600"
                >
                  <Minus size={18} />
                </button>
                <span className="text-2xl font-bold text-orange-600">{otHours}</span>
                <button
                  onClick={() => setOtHours(otHours + 0.5)}
                  className="p-2 rounded-lg bg-slate-100 text-slate-600"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Rate Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            {/* Data confidence banner */}
            {DIFFERENTIALS[job]?.hasData ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-3 text-xs">
                <CheckCircle2 size={14} />
                <span>Verified rate from 71,712 shifts</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-2 rounded-lg mb-3 text-xs">
                <AlertCircle size={14} />
                <span>Using base rate - your entry helps us learn!</span>
              </div>
            )}

            {/* Editable Regular Rate */}
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-600">Regular Rate</span>
              {editingRate ? (
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={manualRegRate ?? regRate}
                    onChange={e => setManualRegRate(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-blue-300 rounded text-right font-medium"
                  />
                  <span className="text-slate-400">/hr</span>
                  <button
                    onClick={() => setEditingRate(false)}
                    className="ml-1 p-1 text-green-600"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setManualRegRate(regRate)
                    setEditingRate(true)
                  }}
                  className="flex items-center gap-1 font-medium text-slate-800 hover:text-blue-600"
                >
                  ${regRate.toFixed(2)}/hr
                  <Edit3 size={12} className="text-slate-400" />
                </button>
              )}
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">OT Rate (1.5x)</span>
              <span className="font-medium text-slate-800">${otRate.toFixed(2)}/hr</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Differential</span>
              <span className="font-medium text-slate-800">
                {DIFFERENTIALS[job]?.class || 'BASE'} (+${DIFFERENTIALS[job]?.amount?.toFixed(2) || '0.00'})
              </span>
            </div>
            {manualRegRate !== null && manualRegRate !== regRate && (
              <button
                onClick={() => setManualRegRate(null)}
                className="mt-2 text-xs text-blue-600 underline"
              >
                Reset to calculated rate
              </button>
            )}
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{job}</p>
                <p className="text-blue-100 text-sm">
                  {location}{subjob ? ` - ${subjob}` : ''}
                </p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                shift === 'DAY' ? 'bg-amber-400 text-amber-900' :
                shift === 'NIGHT' ? 'bg-blue-900 text-blue-100' : 'bg-purple-600 text-purple-100'
              }`}>
                {shift}
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-blue-100 text-xs">Total Pay</p>
                <p className="text-3xl font-bold">${totalPay.toFixed(2)}</p>
              </div>
              <div className="text-right text-blue-100 text-sm">
                <p>{regHours}h reg{otHours > 0 ? ` + ${otHours}h OT` : ''}</p>
                <p>{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Save as Template */}
          {!showSaveTemplate ? (
            <button
              onClick={() => setShowSaveTemplate(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-purple-600 text-sm font-medium"
            >
              <Star size={16} />
              Save as Template
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Template name (e.g., 'Monday TT Rail')"
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={saveAsTemplate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveTemplate(false)
                  setNewTemplateName('')
                }}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              disabled={saving}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSaveShift}
              disabled={saving}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Save Shift
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
