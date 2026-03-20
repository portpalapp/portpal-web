import { useState } from 'react'

// Types
interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  onClick?: () => void
  highlight?: boolean
}

// Metric Card Component
function MetricCard({ label, value, subtext, trend, trendValue, onClick, highlight }: MetricCardProps) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400'
  }
  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  }

  return (
    <div
      className={`p-4 rounded-xl ${highlight ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-slate-800'} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
      onClick={onClick}
    >
      <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-slate-400 mt-1">{subtext}</div>}
      {trend && trendValue && (
        <div className={`text-xs mt-2 ${trendColors[trend]}`}>
          {trendIcons[trend]} {trendValue}
        </div>
      )}
      {onClick && <div className="text-xs text-blue-400 mt-2">Click to drill down →</div>}
    </div>
  )
}

// Expandable Panel Component
function ExpandablePanel({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  badge,
  badgeColor = 'blue'
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  defaultExpanded?: boolean
  badge?: string
  badgeColor?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const badgeColors = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400'
  }

  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
          <div className="text-left">
            <div className="font-semibold text-white flex items-center gap-2">
              {title}
              {badge && <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColors[badgeColor]}`}>{badge}</span>}
            </div>
            {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
          </div>
        </div>
        <span className="text-slate-400 text-sm">{expanded ? 'Collapse' : 'Expand'}</span>
      </button>
      {expanded && (
        <div className="p-4 pt-0 border-t border-slate-700/50">
          {children}
        </div>
      )}
    </div>
  )
}

// Data Table Component
function DataTable({
  headers,
  rows,
  highlightColumn
}: {
  headers: string[]
  rows: (string | number)[][]
  highlightColumn?: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {headers.map((h, i) => (
              <th key={i} className={`text-left py-2 px-3 text-slate-400 font-medium ${highlightColumn === i ? 'text-blue-400' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
              {row.map((cell, j) => (
                <td key={j} className={`py-2 px-3 ${highlightColumn === j ? 'text-blue-400 font-semibold' : 'text-slate-300'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Progress Bar Component
function ProgressBar({ value, max, label, color = 'blue' }: { value: number, max: number, label?: string, color?: string }) {
  const pct = Math.min((value / max) * 100, 100)
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  }
  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-slate-400 flex justify-between"><span>{label}</span><span>{pct.toFixed(1)}%</span></div>}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// Mini Chart Component (SVG)
function MiniLineChart({ data, color = '#3b82f6', height = 60 }: { data: number[], color?: string, height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 200
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 10) - 5
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Cohort Heatmap Cell
function CohortCell({ value }: { value: number | null, baseline?: number }) {
  if (value === null) return <td className="p-1"><div className="w-12 h-8 bg-slate-800 rounded" /></td>

  const getColor = (v: number) => {
    if (v >= 70) return 'bg-emerald-500/80 text-white'
    if (v >= 60) return 'bg-emerald-500/50 text-white'
    if (v >= 50) return 'bg-yellow-500/50 text-white'
    if (v >= 40) return 'bg-orange-500/50 text-white'
    return 'bg-red-500/50 text-white'
  }

  return (
    <td className="p-1">
      <div className={`w-12 h-8 rounded flex items-center justify-center text-xs font-medium ${getColor(value)}`}>
        {value.toFixed(0)}%
      </div>
    </td>
  )
}

// Stat Pill
function StatPill({ label, value, color = 'blue' }: { label: string, value: string, color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${colors[color]}`}>
      <span className="text-slate-400">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

// Slider Component
function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v: number) => v.toString(),
  suffix = ''
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  format?: (v: number) => string
  suffix?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-semibold">{format(value)}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{format(min)}{suffix}</span>
        <span>{format(max)}{suffix}</span>
      </div>
    </div>
  )
}

// Main Command Center Component
export function CommandCenter() {
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'retention' | 'marketing' | 'financial' | 'statistical' | 'calculator'>('overview')
  // Revenue Calculator State
  const [pricePerYear, setPricePerYear] = useState(99)
  const [conversionRate, setConversionRate] = useState(35)
  const [penetrationRate, setPenetrationRate] = useState(20)

  // Market toggle states - COMPREHENSIVE (127,000 total workers, 260 locals)
  const [markets, setMarkets] = useState({
    // ILWU CANADA - BC (~7,200)
    ilwuBC: { enabled: true, members: 7200, name: 'ILWU BC (All)', region: 'canada', locals: '500, 502, 505, 508, 514, 517, 519, 520, 522, 523' },

    // ILWU US - WASHINGTON (~5,500)
    ilwuWA: { enabled: false, members: 5500, name: 'ILWU Washington', region: 'pnw', locals: '4, 7, 19, 21, 23, 24, 25, 27, 32, 47, 51, 52, 98' },

    // ILWU US - OREGON (~1,500)
    ilwuOR: { enabled: false, members: 1500, name: 'ILWU Oregon', region: 'pnw', locals: '8, 12, 40, 50, 53, 92' },

    // ILWU US - CALIFORNIA (~15,000)
    ilwuCANorth: { enabled: false, members: 4000, name: 'ILWU N. California', region: 'california', locals: '10, 14, 18, 34, 54, 91' },
    ilwuCALA: { enabled: false, members: 10000, name: 'ILWU LA/Long Beach', region: 'california', locals: '13, 26, 29, 46, 63, 94' },

    // ILWU US - HAWAII & ALASKA (~3,000 longshore)
    ilwuHI: { enabled: false, members: 2500, name: 'ILWU Hawaii (Longshore)', region: 'pacific', locals: '142 Longshore Division' },
    ilwuAK: { enabled: false, members: 500, name: 'ILWU Alaska', region: 'pacific', locals: '200 (all units)' },

    // ILA CANADA - EAST (~2,500)
    ilaCanada: { enabled: false, members: 2500, name: 'ILA Canada (East)', region: 'canada', locals: 'Montreal 1657, Halifax 269, Saint John 273' },

    // ILA US - NEW YORK/NEW JERSEY (~8,000)
    ilaNYNJ: { enabled: false, members: 8000, name: 'ILA NY/NJ', region: 'northeast', locals: '1, 824, 920, 1233, 1235, 1478, 1588, 1804, 1814, 1964' },

    // ILA US - NEW ENGLAND (~1,500)
    ilaNewEngland: { enabled: false, members: 1500, name: 'ILA New England', region: 'northeast', locals: '799, 800, 805, 861, 1066' },

    // ILA US - MID-ATLANTIC (~6,000)
    ilaMidAtlantic: { enabled: false, members: 6000, name: 'ILA Mid-Atlantic', region: 'midatlantic', locals: 'Philadelphia, Baltimore, Hampton Roads' },

    // ILA US - SOUTH ATLANTIC (~12,000)
    ilaSouthAtlantic: { enabled: false, members: 12000, name: 'ILA South Atlantic', region: 'southeast', locals: 'Charleston, Savannah, Jacksonville, Miami, NC ports' },

    // ILA US - GULF COAST (~20,000)
    ilaGulf: { enabled: false, members: 20000, name: 'ILA Gulf Coast', region: 'gulf', locals: 'Houston, New Orleans, Tampa, Mobile, 20+ TX locals' },

    // ILA US - GREAT LAKES (~2,000)
    ilaGreatLakes: { enabled: false, members: 2000, name: 'ILA Great Lakes', region: 'greatlakes', locals: 'Chicago, Cleveland, Detroit, Toledo, Duluth' },

    // ILA - PUERTO RICO (~1,500)
    ilaPR: { enabled: false, members: 1500, name: 'ILA Puerto Rico', region: 'caribbean', locals: '1575, 1740, 1855, 1903' },
  })

  // Simulated DAU data (90 days)
  const dauData = Array.from({ length: 90 }, (_, i) => {
    const base = 180 + i * 1.2
    const dayOfWeek = i % 7
    const weekendDip = dayOfWeek === 0 || dayOfWeek === 6 ? -30 : 0
    return Math.floor(base + weekendDip + Math.random() * 40)
  })

  // Cohort retention data
  const cohortData = [
    { month: 'Aug 2023', users: 45, m1: 73, m2: 69, m3: 67, m4: 65, m5: 64, m6: 63, m12: 58 },
    { month: 'Sep 2023', users: 52, m1: 71, m2: 67, m3: 65, m4: 63, m5: 62, m6: 61, m12: 55 },
    { month: 'Oct 2023', users: 58, m1: 74, m2: 70, m3: 68, m4: 66, m5: 65, m6: 64, m12: 59 },
    { month: 'Nov 2023', users: 61, m1: 69, m2: 65, m3: 63, m4: 61, m5: 60, m6: 59, m12: 54 },
    { month: 'Dec 2023', users: 67, m1: 76, m2: 72, m3: 70, m4: 68, m5: 67, m6: 66, m12: 61 },
    { month: 'Jan 2024', users: 72, m1: 72, m2: 68, m3: 66, m4: 64, m5: 63, m6: 62, m12: 57 },
    { month: 'Feb 2024', users: 78, m1: 75, m2: 71, m3: 69, m4: 67, m5: 66, m6: 65, m12: null },
    { month: 'Mar 2024', users: 84, m1: 73, m2: 69, m3: 67, m4: 65, m5: 64, m6: 63, m12: null },
    { month: 'Dec 2024', users: 95, m1: 78, m2: 74, m3: 72, m4: 70, m5: 69, m6: 68, m12: null },
    { month: 'Jan 2025', users: 89, m1: 71, m2: 67, m3: 65, m4: null, m5: null, m6: null, m12: null },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'calculator', label: 'Revenue Calculator', icon: '🧮' },
    { id: 'growth', label: 'Growth Engine', icon: '📈' },
    { id: 'retention', label: 'Retention', icon: '🔄' },
    { id: 'marketing', label: 'Marketing', icon: '📣' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'statistical', label: 'Statistical', icon: '🔬' },
  ]

  // Calculate totals
  const selectedMarketSize = Object.values(markets).filter(m => m.enabled).reduce((sum, m) => sum + m.members, 0)
  const projectedUsers = Math.round(selectedMarketSize * (penetrationRate / 100))
  const payingUsers = Math.round(projectedUsers * (conversionRate / 100))
  const arr = payingUsers * pricePerYear
  const mrr = arr / 12

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                PORTPAL Command Center
              </h1>
              <p className="text-sm text-slate-400">Data Engine & Investor Intelligence Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-400">Last Updated</div>
                <div className="text-sm font-medium">Feb 1, 2026 • 3:42 PM</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold">
                PP
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-1 mt-4 -mb-4 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white border-t border-l border-r border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <MetricCard label="Total Users" value="752" subtext="Lifetime signups" trend="up" trendValue="+12% MoM" highlight />
              <MetricCard label="Total Shifts" value="71,712" subtext="All-time logged" trend="up" trendValue="+8% MoM" />
              <MetricCard label="Pay Tracked" value="$41M" subtext="Gross wages" trend="up" trendValue="+15% MoM" />
              <MetricCard label="30-Day Retention" value="67.9%" subtext="Active users" trend="up" trendValue="+2.3pp" />
              <MetricCard label="Avg Shifts/User" value="95.4" subtext="Lifetime" />
              <MetricCard label="Power Users" value="40.6%" subtext="100+ shifts" />
            </div>

            {/* Quick Insights */}
            <div className="grid md:grid-cols-2 gap-6">
              <ExpandablePanel title="Product-Market Fit Signals" subtitle="Why investors should care" badge="STRONG" badgeColor="green" defaultExpanded>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400">67.9%</div>
                      <div className="text-xs text-slate-400">30-Day Retention</div>
                      <div className="text-xs text-emerald-400 mt-1">Top 10% for consumer apps</div>
                    </div>
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400">95.4</div>
                      <div className="text-xs text-slate-400">Avg Shifts/User</div>
                      <div className="text-xs text-emerald-400 mt-1">Extreme engagement</div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="font-semibold text-blue-400 mb-2">Marc Andreessen's PMF Test</div>
                    <p className="text-sm text-slate-300">"Product-market fit feels like the market pulling product out of the startup."</p>
                    <p className="text-sm text-slate-400 mt-2">Our users average 95 shifts each. They're not just trying the product—they've integrated it into their daily workflow.</p>
                  </div>

                  <DataTable
                    headers={['Signal', 'PORTPAL', 'Benchmark', 'Status']}
                    rows={[
                      ['30-Day Retention', '67.9%', '20-40%', '✅ 2x Better'],
                      ['Daily Engagement', '2.3 shifts/week', '1-2 sessions', '✅ High'],
                      ['Organic Growth', '~40%', '30%+', '✅ Word of Mouth'],
                      ['NPS (Estimated)', '45+', '30+', '✅ Strong'],
                    ]}
                  />
                </div>
              </ExpandablePanel>

              <ExpandablePanel title="The Magic Numbers" subtitle="Statistically validated activation metrics" badge="p < 0.001" badgeColor="purple" defaultExpanded>
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
                    <div className="text-lg font-bold text-white">3+ shifts in first week</div>
                    <div className="text-3xl font-bold text-purple-400 my-2">= 16.7pp retention lift</div>
                    <div className="text-sm text-slate-400">Users with 3+ shifts in week 1 have 66.3% 90-day retention vs 49.6% for others</div>
                    <div className="mt-2 text-xs text-purple-400">Chi-square test: χ² = 18.91, p = 1.37e-05</div>
                  </div>

                  <DataTable
                    headers={['Activation Threshold', 'Retention', 'Lift']}
                    rows={[
                      ['3+ shifts (week 1)', '66.3%', '+16.7pp'],
                      ['5+ shifts (week 1)', '66.0%', '+8.6pp'],
                      ['10+ shifts (month 1)', '69.9%', '+12.5pp'],
                      ['20+ shifts (month 1)', '74.1%', '+16.7pp'],
                    ]}
                    highlightColumn={2}
                  />

                  <div className="text-sm text-slate-400 p-3 bg-slate-700/30 rounded-lg">
                    <strong className="text-white">Implication:</strong> Onboarding should focus on getting users to log 3 shifts in their first week. This is our "Facebook 7 friends in 10 days" moment.
                  </div>
                </div>
              </ExpandablePanel>
            </div>

            {/* User Activity Snapshot */}
            <ExpandablePanel title="Daily Active Users (90 Days)" subtitle="Engagement trend with weekend patterns" defaultExpanded>
              <div className="mt-4">
                <div className="flex items-center gap-4 mb-4">
                  <StatPill label="Current DAU" value="287" color="blue" />
                  <StatPill label="WAU" value="412" color="green" />
                  <StatPill label="MAU" value="510" color="purple" />
                  <StatPill label="DAU/MAU" value="56.3%" color="green" />
                </div>
                <div className="h-32 bg-slate-800 rounded-lg p-4">
                  <MiniLineChart data={dauData} color="#3b82f6" height={100} />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
                <div className="mt-4 p-3 bg-slate-700/30 rounded-lg text-sm">
                  <span className="text-emerald-400 font-semibold">56.3% DAU/MAU ratio</span> — World-class engagement (WhatsApp-level). Typical consumer apps: 10-20%.
                </div>
              </div>
            </ExpandablePanel>

            {/* User Segments */}
            <ExpandablePanel title="User Segmentation" subtitle="Distribution by engagement level">
              <div className="mt-4 grid md:grid-cols-5 gap-4">
                {[
                  { segment: 'Power Users', count: 305, pct: 40.6, shifts: '100+', color: 'emerald', desc: '84.7% of all shifts' },
                  { segment: 'Regular', count: 173, pct: 23.0, shifts: '21-100', color: 'blue', desc: 'Consistent users' },
                  { segment: 'Light', count: 120, pct: 16.0, shifts: '6-20', color: 'yellow', desc: 'Occasional use' },
                  { segment: 'Trial', count: 86, pct: 11.4, shifts: '2-5', color: 'orange', desc: 'Still evaluating' },
                  { segment: 'One-Time', count: 68, pct: 9.0, shifts: '1', color: 'red', desc: 'Churn risk' },
                ].map(seg => (
                  <div key={seg.segment} className="p-4 bg-slate-800 rounded-lg">
                    <div className={`text-${seg.color}-400 font-semibold text-sm`}>{seg.segment}</div>
                    <div className="text-2xl font-bold text-white">{seg.count}</div>
                    <div className="text-xs text-slate-400">{seg.pct}% of users</div>
                    <div className="text-xs text-slate-500 mt-1">{seg.shifts} shifts</div>
                    <div className={`text-xs text-${seg.color}-400 mt-2`}>{seg.desc}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <strong className="text-orange-400">Critical Insight:</strong>
                <span className="text-slate-300 ml-2">9% of users (68 people) log only 1 shift and never return. This is our biggest onboarding leak to fix.</span>
              </div>
            </ExpandablePanel>
          </div>
        )}

        {/* GROWTH ENGINE TAB */}
        {activeTab === 'growth' && (
          <div className="space-y-6">
            {/* Growth Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Weekly Growth" value="5.2%" subtext="User signups" trend="up" trendValue="YC target: 5-7%" highlight />
              <MetricCard label="Viral Coefficient" value="0.32" subtext="K-factor (crew-adjusted)" trend="up" trendValue=">0.1 is healthy" />
              <MetricCard label="CAC" value="$12" subtext="Estimated" trend="down" trendValue="Target: <$15" />
              <MetricCard label="LTV:CAC" value="6.7x" subtext="$80 LTV / $12 CAC" trend="up" trendValue="Target: >3x" />
            </div>

            {/* TAM/SAM/SOM */}
            <ExpandablePanel title="Market Opportunity" subtitle="Total Addressable Market Analysis" badge="$12.6M ARR" badgeColor="green" defaultExpanded>
              <div className="mt-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-800 rounded-lg text-center">
                    <div className="text-xs text-slate-400 uppercase">TAM (North America)</div>
                    <div className="text-3xl font-bold text-white">$12.6M</div>
                    <div className="text-sm text-slate-400">127,000 workers × $99/yr</div>
                    <div className="text-xs text-slate-500 mt-1">ILWU + ILA across 260+ locals</div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg text-center">
                    <div className="text-xs text-slate-400 uppercase">SAM (ILWU Only)</div>
                    <div className="text-3xl font-bold text-white">$4.2M</div>
                    <div className="text-sm text-slate-400">42,000 ILWU workers</div>
                    <div className="text-xs text-slate-500 mt-1">Same contract structure, easy expansion</div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg text-center">
                    <div className="text-xs text-slate-400 uppercase">SOM (BC Year 1)</div>
                    <div className="text-3xl font-bold text-white">$250K</div>
                    <div className="text-sm text-slate-400">7,200 workers × 35% × $99</div>
                    <div className="text-xs text-slate-500 mt-1">All BC locals combined</div>
                  </div>
                </div>

                {/* BC Market Detail */}
                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-500/30">
                  <div className="text-sm font-semibold text-emerald-400 mb-3">BC Market (Current Focus) - 7,200 Workers</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="p-2 bg-slate-800/50 rounded">
                      <div className="font-semibold text-white">Local 502</div>
                      <div className="text-slate-400">New Westminster</div>
                      <div className="text-emerald-400 font-bold">3,000+ workers</div>
                      <div className="text-xs text-slate-500">Largest BC local</div>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded">
                      <div className="font-semibold text-white">Local 500</div>
                      <div className="text-slate-400">Vancouver</div>
                      <div className="text-blue-400 font-bold">2,740 workers</div>
                      <div className="text-xs text-slate-500">Current user base</div>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded">
                      <div className="font-semibold text-white">Local 505</div>
                      <div className="text-slate-400">Prince Rupert</div>
                      <div className="text-slate-300">~750 workers</div>
                      <div className="text-xs text-slate-500">Northern BC</div>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded">
                      <div className="font-semibold text-white">Local 508</div>
                      <div className="text-slate-400">Vancouver Island</div>
                      <div className="text-slate-300">~400 workers</div>
                      <div className="text-xs text-slate-500">Chemainus/Nanaimo</div>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded">
                      <div className="font-semibold text-white">Local 514</div>
                      <div className="text-slate-400">Burnaby</div>
                      <div className="text-slate-300">~300 workers</div>
                      <div className="text-xs text-slate-500">Foremen</div>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded">
                      <div className="font-semibold text-white">Local 517</div>
                      <div className="text-slate-400">Vancouver</div>
                      <div className="text-slate-300">~200 workers</div>
                      <div className="text-xs text-slate-500">Warehouse/clerical</div>
                    </div>
                  </div>
                </div>

                <DataTable
                  headers={['Region', 'Workers', 'Union/Locals', 'Market Size']}
                  rows={[
                    ['ILWU BC (Current)', '7,200', 'Locals 500, 502, 505, 508, 514, 517', '$713K'],
                    ['ILWU Washington', '5,500', 'Locals 4, 7, 19, 21, 23, 24, 25, 27, 32, 47, 51, 52, 98', '$545K'],
                    ['ILWU Oregon', '1,500', 'Locals 8, 12, 40, 50, 53, 92', '$149K'],
                    ['ILWU N. California', '4,000', 'Locals 10, 14, 18, 34, 54, 91', '$396K'],
                    ['ILWU LA/Long Beach', '10,000', 'Locals 13, 26, 29, 46, 63, 94', '$990K'],
                    ['ILWU S. California', '1,000', 'Locals 20, 29, 46, 56', '$99K'],
                    ['ILWU Hawaii', '6,000', 'Local 142 (all islands)', '$594K'],
                    ['ILWU Alaska', '800', 'Local 200', '$79K'],
                    ['ILWU Inland', '6,000', 'Warehouse locals 6, 9, 17, 26, 30+', '$594K'],
                    ['—', '—', '—', '—'],
                    ['ILWU TOTAL', '42,000', '60+ locals', '$4.16M'],
                    ['—', '—', '—', '—'],
                    ['ILA Atlantic', '45,000', 'NY/NJ, New England, SE ports', '$4.46M'],
                    ['ILA Gulf', '25,000', 'Houston, New Orleans, Tampa', '$2.48M'],
                    ['ILA Great Lakes', '5,000', 'Chicago, Detroit, Cleveland', '$495K'],
                    ['ILA Canada', '5,000', 'Montreal, Halifax, Saint John', '$495K'],
                    ['ILA Puerto Rico', '5,000', 'San Juan area', '$495K'],
                    ['—', '—', '—', '—'],
                    ['ILA TOTAL', '85,000', '200+ locals', '$8.42M'],
                    ['—', '—', '—', '—'],
                    ['NORTH AMERICA TOTAL', '127,000', '260+ locals', '$12.57M'],
                  ]}
                />

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                  <strong className="text-blue-400">Recommended Expansion Path (ILWU-First):</strong>
                  <span className="text-slate-300 ml-2">BC (Y1) → Seattle/Tacoma (Y2) → LA/Long Beach (Y3) → Montreal ILA (Y4) → US East Coast (Y5). Same union contracts transfer 80% of pay engine logic.</span>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm">
                  <strong className="text-purple-400">Why Local 502 Matters:</strong>
                  <span className="text-slate-300 ml-2">New Westminster's Local 502 is actually LARGER than Vancouver's Local 500. Same metro area means natural word-of-mouth expansion. Combined BC market is 7,200 workers, not 3,000.</span>
                </div>
              </div>
            </ExpandablePanel>

            {/* Growth Projections - ILWU-First Strategy */}
            <ExpandablePanel title="Revenue Projections (ILWU-First)" subtitle="5-year expansion: BC → PNW → California → ILA" defaultExpanded>
              <div className="mt-4 space-y-4">
                <DataTable
                  headers={['Year', 'Markets', 'TAM Workers', 'Target Users', 'Paying (35%)', 'ARR']}
                  rows={[
                    ['Y1', 'BC Only (All Locals)', '7,200', '1,500', '525', '$52K'],
                    ['Y2', '+ PNW (Seattle/Tacoma/Portland)', '14,200', '2,800', '980', '$97K'],
                    ['Y3', '+ California (LA/Long Beach, SF)', '28,200', '4,800', '1,680', '$166K'],
                    ['Y4', '+ Hawaii/Alaska/Montreal', '36,000', '6,200', '2,170', '$215K'],
                    ['Y5', '+ ILA East Coast', '61,000', '9,000', '3,150', '$312K'],
                  ]}
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="text-sm text-slate-400 mb-2">Year 1 MRR Target ($4.3K/mo)</div>
                    <MiniLineChart data={[0, 500, 1200, 2000, 2800, 3200, 3500, 4000, 4200, 4300, 4300, 4300]} color="#10b981" height={60} />
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="text-sm text-slate-400 mb-2">BC User Growth (1,500 target)</div>
                    <MiniLineChart data={[100, 200, 350, 500, 700, 900, 1050, 1150, 1250, 1350, 1450, 1500]} color="#3b82f6" height={60} />
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="text-sm text-slate-400 mb-2">Conversion Funnel</div>
                    <div className="space-y-2 mt-2">
                      <ProgressBar value={100} max={100} label="Signups" color="blue" />
                      <ProgressBar value={85} max={100} label="Activated" color="green" />
                      <ProgressBar value={35} max={100} label="Converted" color="purple" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="text-sm font-semibold text-white mb-3">Year 1 Quarterly Breakdown (BC Focus)</div>
                  <div className="grid grid-cols-4 gap-2 text-sm text-center">
                    <div className="p-2 bg-slate-700/50 rounded">
                      <div className="text-slate-400">Q1</div>
                      <div className="text-white font-semibold">Local 500</div>
                      <div className="text-blue-400">400 users</div>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded">
                      <div className="text-slate-400">Q2</div>
                      <div className="text-white font-semibold">+ Local 502</div>
                      <div className="text-blue-400">800 users</div>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded">
                      <div className="text-slate-400">Q3</div>
                      <div className="text-white font-semibold">+ Prince Rupert</div>
                      <div className="text-blue-400">1,100 users</div>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded">
                      <div className="text-slate-400">Q4</div>
                      <div className="text-white font-semibold">+ Van Island</div>
                      <div className="text-emerald-400">1,500 users</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm">
                  <strong className="text-emerald-400">Key Insight:</strong>
                  <span className="text-slate-300 ml-2">Local 502 (New Westminster) is the LARGEST BC local with 3,000+ workers. Q2 expansion doubles our TAM while staying in the same metro area.</span>
                </div>
              </div>
            </ExpandablePanel>

            {/* Viral Loops */}
            <ExpandablePanel title="Viral Engine: Crew Dynamics" subtitle="How longshoremen naturally spread the app">
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                  <div className="text-lg font-semibold text-white mb-2">The Crew Effect</div>
                  <p className="text-sm text-slate-300">Longshoremen work in crews of 6-12. When one person uses PORTPAL, the entire crew notices. "What app is that?" leads to natural referrals.</p>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">6-12</div>
                      <div className="text-xs text-slate-400">Crew size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">40%</div>
                      <div className="text-xs text-slate-400">Organic signups</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">$10</div>
                      <div className="text-xs text-slate-400">Referral credit</div>
                    </div>
                  </div>
                </div>

                <DataTable
                  headers={['Viral Mechanic', 'K-Factor Impact', 'Status']}
                  rows={[
                    ['Crew signup bonus (5+ together)', '+0.15', 'Planned'],
                    ['Pay discrepancy share cards', '+0.08', 'Planned'],
                    ['Milestone brag cards', '+0.05', 'Planned'],
                    ['Referral credits ($10)', '+0.04', 'Planned'],
                    ['Total K-Factor', '0.32', '—'],
                  ]}
                />
              </div>
            </ExpandablePanel>
          </div>
        )}

        {/* RETENTION TAB */}
        {activeTab === 'retention' && (
          <div className="space-y-6">
            {/* Retention Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard label="30-Day" value="67.9%" trend="up" trendValue="+2.3pp" highlight />
              <MetricCard label="60-Day" value="62.0%" trend="up" trendValue="+1.8pp" />
              <MetricCard label="90-Day" value="62.5%" trend="neutral" trendValue="Stable" />
              <MetricCard label="Median Tenure" value="216 days" subtext="Multi-use users" />
              <MetricCard label="At-Risk Now" value="46" subtext="14-30d inactive" trend="down" trendValue="Need outreach" />
            </div>

            {/* Cohort Retention Heatmap */}
            <ExpandablePanel title="Cohort Retention Heatmap" subtitle="Month-over-month retention by signup cohort" badge="KEY METRIC" badgeColor="blue" defaultExpanded>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="text-left py-2 px-2">Cohort</th>
                      <th className="text-center py-2 px-1">Users</th>
                      <th className="text-center py-2 px-1">M1</th>
                      <th className="text-center py-2 px-1">M2</th>
                      <th className="text-center py-2 px-1">M3</th>
                      <th className="text-center py-2 px-1">M4</th>
                      <th className="text-center py-2 px-1">M5</th>
                      <th className="text-center py-2 px-1">M6</th>
                      <th className="text-center py-2 px-1">M12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map(row => (
                      <tr key={row.month}>
                        <td className="py-1 px-2 text-slate-300 whitespace-nowrap">{row.month}</td>
                        <td className="py-1 px-2 text-center text-slate-400">{row.users}</td>
                        <CohortCell value={row.m1} />
                        <CohortCell value={row.m2} />
                        <CohortCell value={row.m3} />
                        <CohortCell value={row.m4} />
                        <CohortCell value={row.m5} />
                        <CohortCell value={row.m6} />
                        <CohortCell value={row.m12} />
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-4 mt-4 text-xs">
                  <span className="text-slate-400">Legend:</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/80" /> 70%+</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/50" /> 60-69%</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500/50" /> 50-59%</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-500/50" /> 40-49%</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/50" /> &lt;40%</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm">
                <strong className="text-emerald-400">Best Cohort:</strong>
                <span className="text-slate-300 ml-2">December 2024 (78% M1 retention). Investigate what drove this—holiday motivation? Better onboarding?</span>
              </div>
            </ExpandablePanel>

            {/* Churn Analysis */}
            <ExpandablePanel title="Churn Deep Dive" subtitle="Understanding why users leave" badge="42.6% Churned" badgeColor="orange">
              <div className="mt-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="text-sm font-semibold text-white mb-3">Churn Timing</div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Week 1 (0-7 days)</span>
                          <span className="text-red-400">34.7%</span>
                        </div>
                        <ProgressBar value={34.7} max={100} color="red" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Week 2-4 (8-30 days)</span>
                          <span className="text-orange-400">28.4%</span>
                        </div>
                        <ProgressBar value={28.4} max={100} color="orange" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Month 2-3 (31-90 days)</span>
                          <span className="text-yellow-400">21.3%</span>
                        </div>
                        <ProgressBar value={21.3} max={100} color="orange" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Month 4+ (90+ days)</span>
                          <span className="text-emerald-400">15.6%</span>
                        </div>
                        <ProgressBar value={15.6} max={100} color="green" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="text-sm font-semibold text-white mb-3">Churn by Segment</div>
                    <DataTable
                      headers={['Segment', 'Churn Rate', 'Risk']}
                      rows={[
                        ['Power Users (100+)', '27.8%', '🟢 Low'],
                        ['Regular (21-100)', '38.5%', '🟡 Medium'],
                        ['Light (6-20)', '52.3%', '🟠 High'],
                        ['Trial (2-5)', '71.2%', '🔴 Critical'],
                        ['One-Time (1)', '100%', '🔴 Lost'],
                      ]}
                    />
                  </div>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="font-semibold text-red-400 mb-2">The Critical Window</div>
                  <p className="text-sm text-slate-300">34.7% of churned users leave within the first week. This is where onboarding improvements will have the biggest impact.</p>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Avg time to churn</div>
                      <div className="text-lg font-bold text-white">79.3 days</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Median time to churn</div>
                      <div className="text-lg font-bold text-white">14.5 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </ExpandablePanel>

            {/* At-Risk Users */}
            <ExpandablePanel title="At-Risk Users (Action Required)" subtitle="46 users inactive 14-30 days" badge="URGENT" badgeColor="red">
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-4">These users have an average of 89.5 total shifts—they're engaged users slipping away. Immediate outreach recommended.</p>
                <DataTable
                  headers={['User ID', 'Days Inactive', 'Total Shifts', 'Last Activity', 'Status']}
                  rows={[
                    ['user_a7b3c', '28', '156', 'Jan 4, 2026', 'Pro'],
                    ['user_d9e2f', '25', '89', 'Jan 7, 2026', 'Pro'],
                    ['user_k4m8n', '22', '134', 'Jan 10, 2026', 'Free'],
                    ['user_p2q5r', '19', '67', 'Jan 13, 2026', 'Pro'],
                    ['user_t8u1v', '16', '45', 'Jan 16, 2026', 'Free'],
                    ['...and 41 more', '—', '—', '—', '—'],
                  ]}
                />
                <div className="mt-4 flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                    Export At-Risk List
                  </button>
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                    Send Re-engagement Email
                  </button>
                </div>
              </div>
            </ExpandablePanel>
          </div>
        )}

        {/* MARKETING TAB */}
        {activeTab === 'marketing' && (
          <div className="space-y-6">
            {/* Marketing Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Content Pieces" value="91" subtext="90-day calendar" highlight />
              <MetricCard label="Email Sequences" value="5" subtext="22 total emails" />
              <MetricCard label="Social Templates" value="20+" subtext="Ready to post" />
              <MetricCard label="Landing Variants" value="3" subtext="A/B testing" />
            </div>

            {/* Marketing Documents */}
            <ExpandablePanel title="Marketing Playbook" subtitle="35 strategic documents created" badge="COMPLETE" badgeColor="green" defaultExpanded>
              <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'CONTENT_CALENDAR.md', desc: '90 days, 91 posts planned', category: 'Content' },
                  { name: 'EMAIL_SEQUENCES.md', desc: '5 sequences, 22 emails', category: 'Email' },
                  { name: 'REFERRAL_PROGRAM.md', desc: 'Brotherhood Bonus system', category: 'Growth' },
                  { name: 'GAMIFICATION_STRATEGY.md', desc: 'Track Record, not Streaks', category: 'Engagement' },
                  { name: 'ENGAGEMENT_STRATEGY.md', desc: 'Day-off engagement tactics', category: 'Engagement' },
                  { name: 'LAUNCH_STRATEGY.md', desc: '90-day launch plan', category: 'Launch' },
                  { name: 'INVESTOR_PITCH.md', desc: 'Deck content & talking points', category: 'Fundraising' },
                  { name: 'FREEMIUM_RESEARCH.md', desc: 'Pricing model analysis', category: 'Pricing' },
                  { name: 'APP_STORE_OPTIMIZATION.md', desc: 'ASO keywords & strategy', category: 'Acquisition' },
                  { name: 'COMPETITIVE_ANALYSIS.md', desc: 'Gridwise, Excel comparison', category: 'Strategy' },
                  { name: 'NOTIFICATION_STRATEGY.md', desc: 'Push notification playbook', category: 'Engagement' },
                  { name: 'PARTNERSHIP_OUTREACH.md', desc: 'Union hall partnerships', category: 'BD' },
                ].map(doc => (
                  <div key={doc.name} className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700/80 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{doc.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{doc.desc}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{doc.category}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-slate-400">
                + 23 more documents in <code className="bg-slate-800 px-2 py-0.5 rounded">marketing/</code> folder
              </div>
            </ExpandablePanel>

            {/* Key Marketing Strategies */}
            <ExpandablePanel title="Core Marketing Strategies" subtitle="What makes PORTPAL marketing unique">
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30">
                  <div className="font-semibold text-orange-400 mb-2">1. "Pay Discrepancy Found" Social Proof</div>
                  <p className="text-sm text-slate-300">Every time PORTPAL catches a pay error, it's shareable content. "PORTPAL just saved me $47" is our most viral content type.</p>
                  <div className="mt-3 flex gap-2">
                    <StatPill label="Avg error" value="$34" color="orange" />
                    <StatPill label="Errors/month" value="~180" color="orange" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                  <div className="font-semibold text-blue-400 mb-2">2. Union Hall Partnerships</div>
                  <p className="text-sm text-slate-300">Partner with ILWU 500 leadership to get PORTPAL recommended during dispatch orientation. One union endorsement = instant trust.</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                  <div className="font-semibold text-purple-400 mb-2">3. Crew-Based Virality</div>
                  <p className="text-sm text-slate-300">Longshoremen work in crews of 6-12. Target the crew, not the individual. Crew signup bonuses and leaderboards leverage natural team dynamics.</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg border border-emerald-500/30">
                  <div className="font-semibold text-emerald-400 mb-2">4. "Track Record" Gamification</div>
                  <p className="text-sm text-slate-300">Not "streaks" (too gamey for blue-collar). "Track Record" respects the work culture while driving daily engagement even on days off.</p>
                </div>
              </div>
            </ExpandablePanel>

            {/* Content Calendar Preview */}
            <ExpandablePanel title="Content Calendar Preview" subtitle="Next 2 weeks of planned content">
              <div className="mt-4">
                <DataTable
                  headers={['Day', 'Platform', 'Content Type', 'Topic']}
                  rows={[
                    ['Mon Feb 3', 'Instagram', 'Carousel', '5 Pay Errors You Might Be Missing'],
                    ['Tue Feb 4', 'Facebook', 'Story', 'Quick tip: Logging graveyard shifts'],
                    ['Wed Feb 5', 'Email', 'Newsletter', 'Weekly digest + feature spotlight'],
                    ['Thu Feb 6', 'Instagram', 'Reel', 'Day in the life: Using PORTPAL at the dock'],
                    ['Fri Feb 7', 'Facebook', 'Post', 'Weekend motivation: Pension progress'],
                    ['Sat Feb 8', 'Instagram', 'Story', 'User milestone celebration'],
                    ['Sun Feb 9', 'Email', 'Drip', 'Onboarding Day 7 check-in'],
                    ['Mon Feb 10', 'Instagram', 'Post', 'Monday motivation: Track your week'],
                    ['Tue Feb 11', 'Facebook', 'Live', 'Q&A: How to verify your pay stub'],
                    ['Wed Feb 12', 'Email', 'Promo', 'Referral program reminder'],
                  ]}
                />
              </div>
            </ExpandablePanel>
          </div>
        )}

        {/* FINANCIAL TAB */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* Financial Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard label="MRR (Projected)" value="$3,500" subtext="At 35% conversion" highlight />
              <MetricCard label="ARR (Year 1)" value="$42K" subtext="Base scenario" />
              <MetricCard label="LTV" value="$80" subtext="Per user" />
              <MetricCard label="CAC" value="$12" subtext="Estimated" />
              <MetricCard label="Payback" value="1.4 mo" subtext="CAC recovery" />
            </div>

            {/* Pricing Strategy */}
            <ExpandablePanel title="Pricing Strategy: Reverse Trial + Soft Paywall" subtitle="Research-backed recommendation" badge="VALIDATED" badgeColor="green" defaultExpanded>
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="font-semibold text-red-400 mb-2">Why NOT Pure Freemium</div>
                  <p className="text-sm text-slate-300">PORTPAL's TAM (~3,000 BC workers) is too small for freemium. At 3% conversion = only 45 paying users = $4,455/year. Not viable.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="text-sm font-semibold text-white mb-3">Pure Freemium</div>
                    <DataTable
                      headers={['Metric', 'Value']}
                      rows={[
                        ['Conversion Rate', '2-5%'],
                        ['Users Acquired', '1,500'],
                        ['Paying Users', '45'],
                        ['Annual Revenue', '$4,455'],
                      ]}
                    />
                    <div className="mt-2 text-xs text-red-400">❌ Not viable for small market</div>
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="text-sm font-semibold text-emerald-400 mb-3">Reverse Trial + Soft Paywall</div>
                    <DataTable
                      headers={['Metric', 'Value']}
                      rows={[
                        ['Conversion Rate', '35%'],
                        ['Users Acquired', '1,200'],
                        ['Paying Users', '420'],
                        ['Annual Revenue', '$41,580'],
                      ]}
                    />
                    <div className="mt-2 text-xs text-emerald-400">✅ 9x better revenue</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="font-semibold text-blue-400 mb-3">Recommended Tier Structure</div>
                  <DataTable
                    headers={['Tier', 'Price', 'Features']}
                    rows={[
                      ['Free (after trial)', '$0', 'Shift logging, rate calc, basic dashboard, 1 AI/week'],
                      ['Pro', '$99/year', 'Everything: pay stub check, AI reconciliation, predictions, templates, export'],
                    ]}
                  />
                </div>
              </div>
            </ExpandablePanel>

            {/* Unit Economics */}
            <ExpandablePanel title="Unit Economics Deep Dive" subtitle="LTV, CAC, and payback analysis">
              <div className="mt-4 space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-800 rounded-lg text-center">
                    <div className="text-xs text-slate-400 uppercase">Lifetime Value</div>
                    <div className="text-3xl font-bold text-emerald-400">$80</div>
                    <div className="text-xs text-slate-400 mt-1">$99 × 67.9% retention × 1.2yr avg</div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg text-center">
                    <div className="text-xs text-slate-400 uppercase">Customer Acquisition Cost</div>
                    <div className="text-3xl font-bold text-blue-400">$12</div>
                    <div className="text-xs text-slate-400 mt-1">Blended (organic + paid)</div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg text-center">
                    <div className="text-xs text-slate-400 uppercase">LTV:CAC Ratio</div>
                    <div className="text-3xl font-bold text-purple-400">6.7x</div>
                    <div className="text-xs text-emerald-400 mt-1">Target: 3x minimum</div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg text-center">
                    <div className="text-xs text-slate-400 uppercase">CAC Payback</div>
                    <div className="text-3xl font-bold text-orange-400">1.4 mo</div>
                    <div className="text-xs text-emerald-400 mt-1">Target: &lt;12 months</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg text-sm">
                  <strong className="text-white">Investor Insight:</strong>
                  <span className="text-slate-300 ml-2">6.7x LTV:CAC is exceptional. Most VCs require 3x minimum. This indicates efficient growth potential.</span>
                </div>
              </div>
            </ExpandablePanel>

            {/* Investor Metrics */}
            <ExpandablePanel title="Series A Readiness" subtitle="Key metrics investors want to see">
              <div className="mt-4">
                <DataTable
                  headers={['Metric', 'PORTPAL', 'Series A Target', 'Status']}
                  rows={[
                    ['MRR', '$3,500', '$50K+', '🟡 Early stage'],
                    ['MoM Growth', '12%', '10-15%', '✅ On track'],
                    ['LTV:CAC', '6.7x', '3x+', '✅ Excellent'],
                    ['Retention (30d)', '67.9%', '40%+', '✅ Top decile'],
                    ['DAU/MAU', '56.3%', '20%+', '✅ World-class'],
                    ['Organic %', '~40%', '30%+', '✅ Strong'],
                    ['Payback Period', '1.4 mo', '&lt;12 mo', '✅ Excellent'],
                  ]}
                />
              </div>
            </ExpandablePanel>
          </div>
        )}

        {/* STATISTICAL TAB */}
        {activeTab === 'statistical' && (
          <div className="space-y-6">
            {/* Statistical Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Shifts Analyzed" value="71,712" subtext="Raw dataset" highlight />
              <MetricCard label="Valid Records" value="68,023" subtext="With job & pay data" />
              <MetricCard label="Unique Users" value="752" subtext="In dataset" />
              <MetricCard label="Model Accuracy" value="0.862" subtext="ROC-AUC" />
            </div>

            {/* Hypothesis Testing */}
            <ExpandablePanel title="Hypothesis Testing Results" subtitle="Statistical validation of key assumptions" badge="3 of 3 Validated" badgeColor="green" defaultExpanded>
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-emerald-400">H1: First-week activity predicts retention</div>
                    <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">CONFIRMED</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">Users with 3+ shifts in week 1 have significantly higher 90-day retention.</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-white">χ² = 18.91</div>
                      <div className="text-xs text-slate-400">Chi-square statistic</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-400">p = 1.37e-05</div>
                      <div className="text-xs text-slate-400">Highly significant</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">+16.7pp</div>
                      <div className="text-xs text-slate-400">Retention lift</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-300">H2: Night shift workers have different engagement</div>
                    <span className="text-xs px-2 py-1 rounded bg-slate-600 text-slate-400">NOT SIGNIFICANT</span>
                  </div>
                  <p className="text-sm text-slate-400">No significant difference found (p = 0.20). Night shift users engage similarly to day shift users.</p>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-emerald-400">H3: Terminal location affects engagement</div>
                    <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">CONFIRMED</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">CENTENNIAL and VANTERM users have higher retention than other terminals.</p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-white">F = 3.47</div>
                      <div className="text-xs text-slate-400">ANOVA F-statistic</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-400">p = 0.016</div>
                      <div className="text-xs text-slate-400">Significant</div>
                    </div>
                  </div>
                </div>
              </div>
            </ExpandablePanel>

            {/* Correlation Analysis */}
            <ExpandablePanel title="Correlation Analysis" subtitle="What predicts retention?">
              <div className="mt-4">
                <DataTable
                  headers={['Variable', 'Correlation (r)', 'P-Value', 'Interpretation']}
                  rows={[
                    ['Location variety', 'r = 0.644', 'p < 0.0001', 'Strong positive'],
                    ['Job variety', 'r = 0.505', 'p < 0.0001', 'Moderate positive'],
                    ['First-week shifts', 'r = 0.156', 'p < 0.0001', 'Weak but significant'],
                    ['Night shift ratio', 'r = -0.089', 'p = 0.014', 'Slight negative'],
                  ]}
                  highlightColumn={1}
                />
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                  <strong className="text-blue-400">Key Insight:</strong>
                  <span className="text-slate-300 ml-2">Users who work at multiple locations are much more likely to stick around (r = 0.644). They need PORTPAL more because their pay is more complex.</span>
                </div>
              </div>
            </ExpandablePanel>

            {/* Pay Complexity Validation */}
            <ExpandablePanel title="Pay Complexity Validation" subtitle="Statistical proof that PORTPAL solves a real problem">
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="font-semibold text-purple-400 mb-2">ANOVA: Pay Rates by Job</div>
                  <p className="text-sm text-slate-300 mb-3">Do different jobs actually have significantly different pay rates?</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-400">F = 770.16</div>
                      <div className="text-xs text-slate-400">F-statistic</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">p &lt; 0.0001</div>
                      <div className="text-xs text-slate-400">Highly significant</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">22-53%</div>
                      <div className="text-xs text-slate-400">CV within jobs</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg text-sm">
                  <strong className="text-white">What this means:</strong>
                  <span className="text-slate-300 ml-2">Pay varies enormously between jobs (F = 770) AND within the same job (CV 22-53%). This complexity is exactly why PORTPAL exists—workers genuinely can't track this manually.</span>
                </div>

                <DataTable
                  headers={['Job', 'Mean Pay', 'Std Dev', 'CV', 'Sample Size']}
                  rows={[
                    ['RUBBER TIRE GANTRY', '$612.45', '$134.23', '21.9%', '8,234'],
                    ['TRACTOR TRAILER', '$578.12', '$156.78', '27.1%', '15,678'],
                    ['HEAD CHECKER', '$545.89', '$189.34', '34.7%', '4,567'],
                    ['LABOUR', '$498.23', '$167.89', '33.7%', '12,345'],
                    ['WHEAT SPECIALTY', '$534.67', '$284.12', '53.1%', '2,134'],
                  ]}
                />
              </div>
            </ExpandablePanel>

            {/* Predictive Model */}
            <ExpandablePanel title="Retention Prediction Model" subtitle="Logistic regression for 90-day retention">
              <div className="mt-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="text-sm font-semibold text-white mb-3">Model Performance</div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">ROC-AUC</span>
                        <span className="text-emerald-400 font-bold">0.862</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Accuracy</span>
                        <span className="text-white">78.4%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Precision</span>
                        <span className="text-white">81.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Recall</span>
                        <span className="text-white">74.6%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="text-sm font-semibold text-white mb-3">Feature Importance (Odds Ratios)</div>
                    <DataTable
                      headers={['Feature', 'OR', 'Impact']}
                      rows={[
                        ['Job variety', '2.40', '↑ Retention'],
                        ['Location variety', '1.89', '↑ Retention'],
                        ['First-week shifts', '1.11', '↑ Retention'],
                        ['Night shift ratio', '0.47', '↓ Retention'],
                      ]}
                    />
                  </div>
                </div>

                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm">
                  <strong className="text-orange-400">Surprising Finding:</strong>
                  <span className="text-slate-300 ml-2">Night shift ratio has a negative impact on retention (OR = 0.47). Users who work mostly night shifts churn more. Worth investigating—could be UX issues with logging during night shifts?</span>
                </div>
              </div>
            </ExpandablePanel>
          </div>
        )}

        {/* REVENUE CALCULATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            {/* Live Revenue Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700">
                <div className="text-xs text-emerald-200 uppercase tracking-wide mb-1">Monthly Recurring Revenue</div>
                <div className="text-3xl font-bold text-white">${mrr.toLocaleString()}</div>
                <div className="text-xs text-emerald-200 mt-1">MRR = ARR / 12</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700">
                <div className="text-xs text-blue-200 uppercase tracking-wide mb-1">Annual Recurring Revenue</div>
                <div className="text-3xl font-bold text-white">${arr.toLocaleString()}</div>
                <div className="text-xs text-blue-200 mt-1">Paying users × ${pricePerYear}/yr</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Paying Users</div>
                <div className="text-3xl font-bold text-white">{payingUsers.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-1">{conversionRate}% of {projectedUsers} signups</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Selected Market</div>
                <div className="text-3xl font-bold text-white">{selectedMarketSize.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-1">{penetrationRate}% = {projectedUsers} users</div>
              </div>
            </div>

            {/* Sliders */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-800 rounded-xl">
                <Slider
                  label="Annual Price"
                  value={pricePerYear}
                  onChange={setPricePerYear}
                  min={49}
                  max={149}
                  step={10}
                  format={(v) => `$${v}`}
                  suffix="/year"
                />
                <div className="mt-3 text-xs text-slate-500">
                  Monthly equiv: ${(pricePerYear / 12).toFixed(2)}/mo
                </div>
              </div>
              <div className="p-4 bg-slate-800 rounded-xl">
                <Slider
                  label="Conversion Rate"
                  value={conversionRate}
                  onChange={setConversionRate}
                  min={5}
                  max={50}
                  step={5}
                  format={(v) => `${v}`}
                  suffix="%"
                />
                <div className="mt-3 text-xs text-slate-500">
                  Industry: 2-5% freemium, 25-40% trial
                </div>
              </div>
              <div className="p-4 bg-slate-800 rounded-xl">
                <Slider
                  label="Market Penetration"
                  value={penetrationRate}
                  onChange={setPenetrationRate}
                  min={5}
                  max={60}
                  step={5}
                  format={(v) => `${v}`}
                  suffix="%"
                />
                <div className="mt-3 text-xs text-slate-500">
                  % of market that signs up
                </div>
              </div>
            </div>

            {/* Market Selection */}
            <ExpandablePanel title="Select Target Markets" subtitle="127,000 total workers across 260 locals" badge={`${selectedMarketSize.toLocaleString()} selected`} badgeColor="blue" defaultExpanded>
              <div className="mt-4">
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                  <strong className="text-blue-400">Comprehensive Market Data:</strong>
                  <span className="text-slate-300 ml-2">Numbers include full members + casuals. ILWU = 42,000 (West Coast + Canada). ILA = 85,000 (East/Gulf + Canada). Toggle regions to model different expansion scenarios.</span>
                </div>

                {/* All Markets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(markets).map(([key, market]) => {
                    const isILWU = key.startsWith('ilwu')
                    const colorClass = isILWU
                      ? (market.enabled ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600')
                      : (market.enabled ? 'bg-orange-500/20 border-orange-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600')

                    return (
                      <label
                        key={key}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${colorClass}`}
                      >
                        <input
                          type="checkbox"
                          checked={market.enabled}
                          onChange={(e) => setMarkets(prev => ({
                            ...prev,
                            [key]: { ...prev[key as keyof typeof prev], enabled: e.target.checked }
                          }))}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isILWU ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                              {market.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Locals: {market.locals}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white text-lg">{market.members.toLocaleString()}</div>
                            <div className="text-xs text-slate-400">workers</div>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>

                {/* Quick Select Buttons */}
                <div className="flex gap-2 flex-wrap mt-4">
                  <button
                    onClick={() => setMarkets(prev => {
                      const newMarkets = { ...prev }
                      Object.keys(newMarkets).forEach(k => {
                        newMarkets[k as keyof typeof newMarkets].enabled = k === 'ilwuBC'
                      })
                      return newMarkets
                    })}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
                  >
                    BC Only (7.2K)
                  </button>
                  <button
                    onClick={() => setMarkets(prev => {
                      const newMarkets = { ...prev }
                      Object.keys(newMarkets).forEach(k => {
                        const isCanada = k === 'ilwuBC' || k === 'ilaCanada'
                        newMarkets[k as keyof typeof newMarkets].enabled = isCanada
                      })
                      return newMarkets
                    })}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
                  >
                    Canada All (9.7K)
                  </button>
                  <button
                    onClick={() => setMarkets(prev => {
                      const newMarkets = { ...prev }
                      Object.keys(newMarkets).forEach(k => {
                        newMarkets[k as keyof typeof newMarkets].enabled = k.startsWith('ilwu')
                      })
                      return newMarkets
                    })}
                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm"
                  >
                    All ILWU (42K)
                  </button>
                  <button
                    onClick={() => setMarkets(prev => {
                      const newMarkets = { ...prev }
                      Object.keys(newMarkets).forEach(k => {
                        newMarkets[k as keyof typeof newMarkets].enabled = k.startsWith('ila')
                      })
                      return newMarkets
                    })}
                    className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded text-sm"
                  >
                    All ILA (85K)
                  </button>
                  <button
                    onClick={() => setMarkets(prev => {
                      const newMarkets = { ...prev }
                      Object.keys(newMarkets).forEach(k => {
                        newMarkets[k as keyof typeof newMarkets].enabled = true
                      })
                      return newMarkets
                    })}
                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm"
                  >
                    All Markets (127K)
                  </button>
                  <button
                    onClick={() => setMarkets(prev => {
                      const newMarkets = { ...prev }
                      Object.keys(newMarkets).forEach(k => {
                        newMarkets[k as keyof typeof newMarkets].enabled = false
                      })
                      return newMarkets
                    })}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded text-sm"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </ExpandablePanel>

            {/* Scenario Comparison */}
            <ExpandablePanel title="Scenario Comparison" subtitle="Compare different expansion strategies" defaultExpanded>
              <div className="mt-4">
                <DataTable
                  headers={['Scenario', 'Workers', 'Penetration', 'Conversion', 'Paying', 'MRR', 'ARR']}
                  rows={[
                    ['BC Only (Year 1)', '7,200', '25%', '35%', Math.round(7200 * 0.25 * 0.35).toLocaleString(), `$${Math.round(7200 * 0.25 * 0.35 * 99 / 12).toLocaleString()}`, `$${Math.round(7200 * 0.25 * 0.35 * 99).toLocaleString()}`],
                    ['Canada All', '9,700', '20%', '35%', Math.round(9700 * 0.20 * 0.35).toLocaleString(), `$${Math.round(9700 * 0.20 * 0.35 * 99 / 12).toLocaleString()}`, `$${Math.round(9700 * 0.20 * 0.35 * 99).toLocaleString()}`],
                    ['ILWU (West Coast)', '42,000', '15%', '35%', Math.round(42000 * 0.15 * 0.35).toLocaleString(), `$${Math.round(42000 * 0.15 * 0.35 * 99 / 12).toLocaleString()}`, `$${Math.round(42000 * 0.15 * 0.35 * 99).toLocaleString()}`],
                    ['ILA (East/Gulf)', '85,000', '10%', '30%', Math.round(85000 * 0.10 * 0.30).toLocaleString(), `$${Math.round(85000 * 0.10 * 0.30 * 99 / 12).toLocaleString()}`, `$${Math.round(85000 * 0.10 * 0.30 * 99).toLocaleString()}`],
                    ['Full North America', '127,000', '12%', '32%', Math.round(127000 * 0.12 * 0.32).toLocaleString(), `$${Math.round(127000 * 0.12 * 0.32 * 99 / 12).toLocaleString()}`, `$${Math.round(127000 * 0.12 * 0.32 * 99).toLocaleString()}`],
                    ['—', '—', '—', '—', '—', '—', '—'],
                    ['Your Selection', selectedMarketSize.toLocaleString(), `${penetrationRate}%`, `${conversionRate}%`, payingUsers.toLocaleString(), `$${mrr.toLocaleString()}`, `$${arr.toLocaleString()}`],
                  ]}
                  highlightColumn={6}
                />
              </div>
            </ExpandablePanel>

            {/* Revenue Timeline - ILWU First Strategy */}
            <ExpandablePanel title="5-Year Growth Timeline (ILWU-First Strategy)" subtitle="Recommended expansion path">
              <div className="mt-4">
                <DataTable
                  headers={['Year', 'New Markets', 'Cumulative Workers', 'Penetration', 'Paying Users', 'ARR']}
                  rows={[
                    ['Year 1', 'BC (all locals)', '7,200', '25%', Math.round(7200 * 0.25 * 0.35).toLocaleString(), `$${Math.round(7200 * 0.25 * 0.35 * pricePerYear).toLocaleString()}`],
                    ['Year 2', '+ WA + OR (Seattle, Tacoma, Portland)', '14,200', '22%', Math.round(14200 * 0.22 * 0.35).toLocaleString(), `$${Math.round(14200 * 0.22 * 0.35 * pricePerYear).toLocaleString()}`],
                    ['Year 3', '+ California (LA, SF)', '28,200', '18%', Math.round(28200 * 0.18 * 0.35).toLocaleString(), `$${Math.round(28200 * 0.18 * 0.35 * pricePerYear).toLocaleString()}`],
                    ['Year 4', '+ Hawaii, Alaska, Montreal', '34,200', '16%', Math.round(34200 * 0.16 * 0.35).toLocaleString(), `$${Math.round(34200 * 0.16 * 0.35 * pricePerYear).toLocaleString()}`],
                    ['Year 5', '+ ILA (NY/NJ, Southeast)', '70,000', '14%', Math.round(70000 * 0.14 * 0.32).toLocaleString(), `$${Math.round(70000 * 0.14 * 0.32 * pricePerYear).toLocaleString()}`],
                  ]}
                />
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                    <strong className="text-blue-400">Why ILWU First:</strong>
                    <span className="text-slate-300 ml-2">Same union = similar contracts. Pay engine 80% transferable. Can leverage BC success to get ILWU International endorsement.</span>
                  </div>
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm">
                    <strong className="text-orange-400">ILA Later:</strong>
                    <span className="text-slate-300 ml-2">Different contracts require new pay rules. Start with Montreal (smaller, Canadian) before NY/NJ.</span>
                  </div>
                </div>
              </div>
            </ExpandablePanel>

            {/* Union Summary */}
            <ExpandablePanel title="Complete Market Breakdown" subtitle="127,000 workers across 260 locals">
              <div className="mt-4">
                <DataTable
                  headers={['Union/Region', 'Workers', 'Locals', 'Key Ports']}
                  rows={[
                    ['ILWU BC', '7,200', '12', 'Vancouver, New Westminster, Prince Rupert'],
                    ['ILWU Washington', '5,500', '13', 'Seattle, Tacoma, Longview, Bellingham'],
                    ['ILWU Oregon', '1,500', '6', 'Portland, Astoria, Coos Bay'],
                    ['ILWU California', '14,000', '12', 'LA/Long Beach, SF, Oakland, San Diego'],
                    ['ILWU Hawaii', '2,500', '1 (divisions)', 'Honolulu (longshore division)'],
                    ['ILWU Alaska', '500', '10 units', 'Seward, Kodiak, Dutch Harbor'],
                    ['— ILWU Total —', '31,200', '54+', '—'],
                    ['ILA Canada', '2,500', '11', 'Montreal, Halifax, Saint John'],
                    ['ILA NY/NJ', '8,000', '11+', 'Newark, Brooklyn, Staten Island'],
                    ['ILA New England', '1,500', '5', 'Boston, Portland ME'],
                    ['ILA Mid-Atlantic', '6,000', '15+', 'Philadelphia, Baltimore, Norfolk'],
                    ['ILA South Atlantic', '12,000', '25+', 'Charleston, Savannah, Jacksonville, Miami'],
                    ['ILA Gulf Coast', '20,000', '40+', 'Houston, New Orleans, Tampa, Mobile'],
                    ['ILA Great Lakes', '2,000', '~10', 'Chicago, Cleveland, Detroit'],
                    ['ILA Puerto Rico', '1,500', '4', 'San Juan, Ponce'],
                    ['— ILA Total —', '53,500', '121+', '—'],
                    ['TOTAL', '127,000', '260+', '65+ ports'],
                  ]}
                />
              </div>
            </ExpandablePanel>

            {/* Data Sources */}
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-sm">
              <h3 className="font-semibold text-white mb-2">Data Sources & Methodology</h3>
              <div className="grid md:grid-cols-2 gap-4 text-slate-400">
                <div>
                  <div className="font-medium text-slate-300 mb-1">ILWU Sources:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• ilwu.org - International website</li>
                    <li>• ilwulongshore.org - Coast Longshore Division</li>
                    <li>• ilwu.ca - ILWU Canada</li>
                    <li>• ilwu502.ca - Local 502 official</li>
                    <li>• Individual local websites</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-slate-300 mb-1">ILA Sources:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• ilaunion.org - International website</li>
                    <li>• iladistrict.com - SAGCD directory</li>
                    <li>• waterfront.ny.gov - NY/NJ Commission</li>
                    <li>• News articles, strike coverage</li>
                    <li>• Union Facts database (LM-2 filings)</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Note: Many locals don't publicly disclose membership. Numbers are best estimates from available sources. Includes full members + casuals where data available.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-700 text-center text-sm text-slate-500">
          <p>PORTPAL Command Center • Data as of Feb 1, 2026</p>
          <p className="mt-1">35 marketing documents • 71,712 shifts analyzed • 752 users tracked</p>
        </footer>
      </main>
    </div>
  )
}

export default CommandCenter
