import { BarChart3 } from 'lucide-react'
import type { ShiftTotal, JobSection } from '../../hooks/useWorkInfo'

interface WorkInfoSnapshot {
  location: string
  stamp: string
  totals: ShiftTotal[]
  sections: JobSection[]
}

interface WorkAvailableCardProps {
  snapshots: WorkInfoSnapshot[]
}

const SHIFT_LABELS: Record<string, string> = { '08:00': 'Day', '16:30': 'Night', '01:00': 'Graveyard' }
const SHIFT_ORDER = ['08:00', '16:30', '01:00']

export function WorkAvailableCard({ snapshots }: WorkAvailableCardProps) {
  if (snapshots.length === 0) return null

  try {
    const van = snapshots.find(s => s.location === 'vancouver')
    if (!van || !van.totals || !van.sections) return null

    const totals = (van.totals || [])
      .filter((t: ShiftTotal) => SHIFT_ORDER.includes(t.shift))
      .sort((a: ShiftTotal, b: ShiftTotal) => SHIFT_ORDER.indexOf(a.shift) - SHIFT_ORDER.indexOf(b.shift))
    const totalJobs = totals.reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
    const topSections = ((van.sections || []) as JobSection[])
      .filter((sec: JobSection) => {
        const secTotal = (sec.totals || []).reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
        return secTotal > 0
      })
      .sort((a: JobSection, b: JobSection) => {
        const aTotal = (a.totals || []).reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
        const bTotal = (b.totals || []).reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
        return bTotal - aTotal
      })
      .slice(0, 4)

    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <BarChart3 size={16} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Work Available</h3>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
              {totalJobs} jobs
            </span>
          </div>
          <span className="text-[10px] text-slate-400">{van.stamp.split('_')[1]?.replace(/(\d{2})(\d{2})/, '$1:$2')}</span>
        </div>

        {/* Shift totals */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {totals.map((t: ShiftTotal) => (
            <div key={t.shift} className="bg-slate-50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] font-medium text-slate-400 uppercase">{SHIFT_LABELS[t.shift] ?? t.shift}</p>
              <p className="text-lg font-bold text-slate-800">{Number(t.pre || 0)}</p>
              <p className="text-[10px] text-slate-400">{t.date}</p>
            </div>
          ))}
        </div>

        {/* Top sections */}
        {topSections.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topSections.map((sec: JobSection) => {
              const secTotal = (sec.totals || []).reduce((s: number, t: ShiftTotal) => s + Number(t.pre || 0), 0)
              return (
                <span key={sec.section} className="text-[10px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                  {sec.section} ({secTotal})
                </span>
              )
            })}
          </div>
        )}
      </div>
    )
  } catch (e) {
    console.warn('[WorkInfo] render error:', e)
    return null
  }
}
