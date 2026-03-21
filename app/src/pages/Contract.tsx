import { useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  FileText,
  Minimize2,
  Maximize2,
  AlertCircle,
  DollarSign,
  Clock,
  Heart,
  Shield,
  GraduationCap,
  Hand,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Inline contract data
// ---------------------------------------------------------------------------

interface SectionItem {
  heading?: string
  body?: string
  table?: { label: string; value: string }[]
  list?: string[]
}

interface ContractSection {
  id: string
  title: string
  icon: React.FC<{ size?: number; className?: string }>
  items: SectionItem[]
}

const CONTRACT_SECTIONS: ContractSection[] = [
  {
    id: 'pay-rates',
    title: 'Pay Rates',
    icon: DollarSign,
    items: [
      {
        heading: 'Base Rates by Year',
        table: [
          { label: 'Apr 2023', value: '$50.64/hr' },
          { label: 'Apr 2024', value: '$53.17/hr' },
          { label: 'Apr 2025', value: '$55.30/hr' },
          { label: 'Apr 2026', value: '$57.51/hr' },
        ],
      },
      {
        heading: 'Shift Premiums',
        body: 'Premiums are applied as a multiplier on your base rate.',
        table: [
          { label: 'Night Shift', value: '1.26x base' },
          { label: 'Graveyard Shift', value: '1.56x base' },
          { label: 'Weekend (Sat/Sun)', value: '1.6x base' },
          { label: 'Holiday', value: '2x base' },
        ],
      },
      {
        heading: 'How Your Pay Is Calculated',
        body: 'Total = (Regular Hrs x Rate) + (OT Hrs x Rate x 1.5). Your rate = Base Rate + Job Differential. Check the Job Classifications section for your differential.',
      },
    ],
  },
  {
    id: 'job-classifications',
    title: 'Job Classifications',
    icon: Shield,
    items: [
      {
        heading: 'Class 1 -- +$2.50/hr',
        list: [
          'HD Mechanic',
          'Electrician',
          'Millwright',
          'Carpenter',
          'Plumber',
          'Welder',
        ],
      },
      {
        heading: 'Class 2 -- +$1.00/hr',
        list: [
          'Dock Gantry',
          'Rubber Tire Gantry',
          'Ship Gantry',
          'Rail Mounted Gantry',
          'Winch Driver',
          'First Aid',
          'Storesperson',
        ],
      },
      {
        heading: 'Class 3 -- +$0.65/hr',
        list: [
          'Tractor Trailer',
          'Loci',
          'Reachstacker',
          '40 Ton (Top Pick)',
          'Mobile Crane',
          'Front End Loader',
          'Bulldozer',
          'Excavator',
        ],
      },
      {
        heading: 'Class 4 -- +$0.50/hr',
        list: [
          'Lift Truck',
          'Dock Checker',
          'Gearperson',
          'Side Runner',
        ],
      },
      {
        heading: 'Base -- +$0.00/hr',
        list: ['Labour', 'Head Checker', 'Bunny Bus', 'Training'],
      },
    ],
  },
  {
    id: 'vacation-leave',
    title: 'Vacation & Leave',
    icon: Heart,
    items: [
      {
        heading: 'Vacation Accrual',
        body: 'Vacation pay is a percentage of your gross earnings, based on years of service.',
        table: [
          { label: '0 - 5 years', value: '4%' },
          { label: '6 - 10 years', value: '7%' },
          { label: '11 - 14 years', value: '8%' },
          { label: '15 - 19 years', value: '9%' },
          { label: '20 - 24 years', value: '10%' },
          { label: '25 - 29 years', value: '11%' },
          { label: '30 - 34 years', value: '12%' },
          { label: '35 - 39 years', value: '13%' },
          { label: '40+ years', value: '14%' },
        ],
      },
      {
        heading: 'Bereavement Leave',
        body: '3 days at 8 hours per day, paid at straight-time rate. Applies to immediate family members.',
      },
      {
        heading: 'Maternity Leave',
        body: '17 weeks of leave. Supplemental Unemployment Benefit (SUB) tops up EI to 70% of normal earnings for 15 weeks.',
      },
      {
        heading: 'Parental Leave',
        body: 'Up to 63 weeks of leave. SUB tops up EI to 50% of normal earnings for 35 weeks.',
      },
    ],
  },
  {
    id: 'overtime-extensions',
    title: 'Overtime & Extensions',
    icon: Clock,
    items: [
      {
        heading: 'Meal Period Worked',
        body: 'If you work through your meal period, the time is paid at 1.5x your regular rate.',
      },
      {
        heading: '1-Hour Extension',
        body: 'A 1-hour extension at the end of your shift is paid at 1.5x your regular rate.',
      },
      {
        heading: '2-Hour Coastwise Extension',
        body: 'A 2-hour coastwise extension is paid at 2x (double time) your regular rate.',
      },
      {
        heading: 'Damaged Cargo Handling',
        body: 'Handling damaged or contaminated cargo is paid at 1.5x your shift rate for the duration of the work.',
      },
    ],
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    icon: Hand,
    items: [
      {
        heading: 'Grievance Procedure',
        body: 'The contract provides a 5-step process to resolve disputes:',
        list: [
          'Step 1 -- Raise the issue with your direct supervisor on the job.',
          'Step 2 -- If unresolved, submit a written grievance to the terminal superintendent within 5 working days.',
          'Step 3 -- The union Business Agent and employer representative meet to discuss within 10 working days.',
          'Step 4 -- The matter is escalated to the Joint Industry Labour Relations Committee (JILRC).',
          'Step 5 -- If still unresolved, binding arbitration by a mutually agreed arbitrator.',
        ],
      },
      {
        heading: 'Discipline Process',
        body: 'Discipline must follow progressive steps: verbal warning, written warning, suspension, then termination. You have the right to union representation at every stage.',
      },
      {
        heading: 'Union Meeting Nights',
        body: 'You are entitled to attend union meetings without penalty. Employers cannot schedule mandatory overtime on designated union meeting nights.',
      },
      {
        heading: 'Picket Line Rules',
        body: 'You are not required to cross a legal picket line established by another union. Refusal to cross is protected under the collective agreement.',
      },
    ],
  },
  {
    id: 'training-certification',
    title: 'Training & Certification',
    icon: GraduationCap,
    items: [
      {
        heading: 'Apprenticeship Rates',
        body: 'Apprentices earn a percentage of the fully certified rate for their classification:',
        table: [
          { label: 'Year 1', value: '65% of certified rate' },
          { label: 'Year 2', value: '75% of certified rate' },
          { label: 'Year 3', value: '85% of certified rate' },
          { label: 'Year 4', value: '95% of certified rate' },
        ],
      },
      {
        heading: 'Tool Allowance',
        body: 'New apprentices in trade classifications (Class 1) receive a one-time $500 tool allowance upon starting their apprenticeship.',
      },
      {
        heading: 'Certification Paths',
        body: 'Workers can advance through equipment certifications to access higher-paying job classifications. Training is provided through the BCMEA Training Centre. Seniority and availability determine access to training slots.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety',
    icon: Shield,
    items: [
      {
        heading: 'PPE Requirements',
        body: 'The employer must provide all required Personal Protective Equipment at no cost. This includes hard hats, safety vests, steel-toe boots (annual allowance), hearing protection, and eye protection. You have the right to refuse unsafe work.',
      },
      {
        heading: 'First Aid Certification',
        body: 'The employer covers the full cost of First Aid certification courses and renewals. Workers who hold valid First Aid tickets and work as First Aid attendants receive the Class 2 differential (+$1.00/hr).',
      },
      {
        heading: 'Drug & Alcohol Policy',
        body: 'Workers must not be impaired on the job. Post-incident and reasonable-cause testing may apply. Voluntary self-referral to the Employee Assistance Program (EAP) is confidential and cannot be used as grounds for discipline.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Section card component
// ---------------------------------------------------------------------------

function SectionCard({
  section,
  expanded,
  onToggle,
}: {
  section: ContractSection
  expanded: boolean
  onToggle: () => void
}) {
  const Icon = section.icon

  return (
    <div className="mx-4 mb-3 bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex items-center w-full px-4 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0">
          <Icon size={20} className="text-blue-600" />
        </div>
        <span className="flex-1 text-base font-semibold text-slate-800">
          {section.title}
        </span>
        {expanded ? (
          <ChevronUp size={20} className="text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
          {section.items.map((item, idx) => (
            <div key={idx} className={idx > 0 ? 'mt-4' : 'mt-2'}>
              {item.heading && (
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {item.heading}
                </p>
              )}

              {item.body && (
                <p className="text-sm text-slate-500 leading-5 mb-1">
                  {item.body}
                </p>
              )}

              {item.table && (
                <div className="bg-slate-50 rounded-xl mt-1 overflow-hidden">
                  {item.table.map((row, rowIdx) => (
                    <div
                      key={rowIdx}
                      className={`flex items-center justify-between px-3 py-2.5 ${
                        rowIdx < item.table!.length - 1
                          ? 'border-b border-slate-200/60'
                          : ''
                      }`}
                    >
                      <span className="text-sm text-slate-600">
                        {row.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {item.list && (
                <div className="mt-1">
                  {item.list.map((entry, listIdx) => (
                    <div key={listIdx} className="flex mt-1.5">
                      <span className="text-sm text-blue-500 mr-2 mt-px">
                        {'\u2022'}
                      </span>
                      <span className="text-sm text-slate-600 flex-1 leading-5">
                        {entry}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function Contract() {
  const navigate = useNavigate()
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({})

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const allExpanded = CONTRACT_SECTIONS.every(
    (s) => expandedSections[s.id]
  )

  const toggleAll = () => {
    const next: Record<string, boolean> = {}
    CONTRACT_SECTIONS.forEach((s) => {
      next[s.id] = !allExpanded
    })
    setExpandedSections(next)
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 bg-white">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={22} className="text-slate-500" />
        </button>
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <span className="font-semibold text-slate-800">
            Contract Reference
          </span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* Intro banner */}
        <div className="mx-4 mt-4 mb-2 bg-blue-600 rounded-2xl p-5 overflow-hidden relative">
          <div
            className="absolute w-28 h-28 bg-white/10 rounded-full"
            style={{ top: -10, right: -10 }}
          />
          <h2 className="text-white text-lg font-bold mb-1">
            ILWU Collective Agreement
          </h2>
          <p className="text-blue-200 text-sm leading-5">
            Quick reference for BCMEA/ILWU contract terms. Tap any section
            below to view details.
          </p>
        </div>

        {/* Expand / Collapse all */}
        <div className="flex justify-end mx-4 mb-2 mt-1">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {allExpanded ? (
              <Minimize2 size={14} className="text-slate-500" />
            ) : (
              <Maximize2 size={14} className="text-slate-500" />
            )}
            <span className="text-xs font-medium text-slate-500">
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </span>
          </button>
        </div>

        {/* Sections */}
        {CONTRACT_SECTIONS.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            expanded={!!expandedSections[section.id]}
            onToggle={() => toggleSection(section.id)}
          />
        ))}

        {/* Disclaimer */}
        <div className="mx-4 mt-2 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle
              size={18}
              className="text-amber-600 flex-shrink-0 mt-0.5"
            />
            <p className="flex-1 text-xs text-amber-700 leading-4">
              This is a simplified summary for quick reference. Always refer
              to the official BCMEA/ILWU Collective Agreement for complete
              terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
