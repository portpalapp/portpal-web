import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { generateSampleShifts } from '../data/mockData'
import type { Shift } from '../data/mockData'

type ViewMode = 'week' | 'month'

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    setShifts(generateSampleShifts())
  }, [])

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(s => isSameDay(new Date(s.date), date))
  }

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  const getMonthDays = () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const startWeek = startOfWeek(start, { weekStartsOn: 0 })
    const days: Date[] = []

    let day = startWeek
    while (day <= end || days.length % 7 !== 0) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  const navigateWeek = (direction: number) => {
    setCurrentDate(addDays(currentDate, direction * 7))
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
  }

  const weekDays = getWeekDays()
  const monthDays = getMonthDays()

  const selectedShifts = selectedDate ? getShiftsForDate(selectedDate) : []

  // Calculate week totals
  const weekTotal = weekDays.reduce((sum, day) => {
    const dayShifts = getShiftsForDate(day)
    return sum + dayShifts.reduce((s, shift) => s + shift.totalPay, 0)
  }, 0)

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => viewMode === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
          className="p-2 rounded-lg bg-slate-100 text-slate-600"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-800">
            {viewMode === 'week'
              ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </p>
          {viewMode === 'week' && (
            <p className="text-xs text-slate-500">Pay Period Week</p>
          )}
        </div>
        <button
          onClick={() => viewMode === 'week' ? navigateWeek(1) : navigateMonth(1)}
          className="p-2 rounded-lg bg-slate-100 text-slate-600"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => {
              const dayShifts = getShiftsForDate(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 rounded-xl text-center transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isToday
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <p className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {format(day, 'd')}
                  </p>
                  {dayShifts.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {dayShifts.slice(0, 3).map((s, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.shift === 'DAY' ? 'bg-amber-400' :
                            s.shift === 'NIGHT' ? 'bg-blue-400' : 'bg-purple-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Week Total */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-300 text-xs">Week Total</p>
                <p className="text-2xl font-bold">${weekTotal.toFixed(2)}</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-600 rounded-lg text-sm">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(day => {
              const dayShifts = getShiftsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square p-1 rounded-lg text-center relative ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isToday
                      ? 'bg-blue-50 text-blue-600'
                      : isCurrentMonth
                      ? 'text-slate-700 hover:bg-slate-50'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-sm font-medium">{format(day, 'd')}</span>
                  {dayShifts.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayShifts.slice(0, 2).map((s, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            s.shift === 'DAY' ? 'bg-amber-400' :
                            s.shift === 'NIGHT' ? 'bg-blue-400' : 'bg-purple-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Day Detail */}
      {selectedDate && (
        <div className="mt-4 bg-white rounded-xl p-4 border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          {selectedShifts.length > 0 ? (
            <div className="space-y-2">
              {selectedShifts.map(shift => (
                <div
                  key={shift.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className={`w-1 h-12 rounded-full ${
                    shift.shift === 'DAY' ? 'bg-amber-400' :
                    shift.shift === 'NIGHT' ? 'bg-blue-600' : 'bg-purple-600'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{shift.job}</p>
                    <p className="text-xs text-slate-500">
                      {shift.location} • {shift.regHours}h + {shift.otHours}h OT
                    </p>
                  </div>
                  <p className="font-bold text-slate-800">${shift.totalPay.toFixed(0)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">No shifts logged</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Day</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <span>Night</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-600" />
          <span>Graveyard</span>
        </div>
      </div>
    </div>
  )
}
