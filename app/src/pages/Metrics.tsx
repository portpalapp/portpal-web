import { useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Anchor,
  Clock,
  Briefcase,
} from 'lucide-react'
import { useMetrics } from '../hooks/useMetrics'
import type { MetricsData, CohortRow } from '../hooks/useMetrics'

// ── Color Palette (from PortPal brand) ───────────────────────────────────────

const COLORS = {
  navy: '#1e3a5f',
  blue: '#2563eb',
  sky: '#0ea5e9',
  orange: '#f97316',
  green: '#22c55e',
  red: '#ef4444',
  slate: '#64748b',
  slateLight: '#94a3b8',
  slateDark: '#334155',
} as const

const CHART_COLORS = [
  COLORS.blue,
  COLORS.sky,
  COLORS.orange,
  COLORS.green,
  COLORS.navy,
  COLORS.red,
  COLORS.slate,
  '#8b5cf6', // violet for variety in large lists
  '#ec4899', // pink
  '#14b8a6', // teal
]

const SHIFT_TYPE_COLORS: Record<string, string> = {
  DAY: '#f59e0b',
  NIGHT: '#2563eb',
  GRAVEYARD: '#64748b',
}

// ── Main Component ───────────────────────────────────────────────────────────

export function Metrics() {
  const { metrics, loading, error } = useMetrics()
  const [showAllCohorts, setShowAllCohorts] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading platform metrics...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg font-medium mb-2">Failed to load metrics</p>
          <p className="text-slate-400 text-sm">{error || 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Anchor size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold">PORTPAL Metrics</h1>
              <p className="text-xs text-slate-400">YC-Style Growth Dashboard</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 hidden md:block">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* ── Key Metric Cards ──────────────────────────────────────── */}
        <KeyMetricCards metrics={metrics} />

        {/* ── Growth Chart ──────────────────────────────────────────── */}
        <GrowthChart data={metrics.weeklyGrowth} />

        {/* ── Two Column: Engagement + Value ────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">
          <StickinessChart data={metrics.stickiness} />
          <ValueChart data={metrics.weeklyGrowth} />
        </div>

        {/* ── Retention Cohort Table ────────────────────────────────── */}
        <CohortRetentionTable
          cohorts={metrics.cohorts}
          showAll={showAllCohorts}
          onToggle={() => setShowAllCohorts(!showAllCohorts)}
        />

        {/* ── Behavioral Section ────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">
          <PeakHoursChart data={metrics.peakHours} />
          <JobDistributionChart data={metrics.jobDistribution} />
          <ShiftTypeChart data={metrics.shiftTypes} />
        </div>
      </main>
    </div>
  )
}

// ── Key Metric Cards ─────────────────────────────────────────────────────────

function KeyMetricCards({ metrics }: { metrics: MetricsData }) {
  const { summary } = metrics

  const wowActiveChange = summary.activeUsersLastWeek > 0
    ? ((summary.activeUsersThisWeek - summary.activeUsersLastWeek) / summary.activeUsersLastWeek) * 100
    : 0

  const wowShiftsChange = summary.weeklyShiftsLastWeek > 0
    ? ((summary.weeklyShifts - summary.weeklyShiftsLastWeek) / summary.weeklyShiftsLastWeek) * 100
    : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <MetricCard
        icon={<Users size={18} />}
        label="Active Users (7d)"
        value={summary.activeUsersThisWeek.toLocaleString()}
        change={wowActiveChange}
        subtext={`${summary.totalUsers.toLocaleString()} total users`}
      />
      <MetricCard
        icon={<Calendar size={18} />}
        label="Weekly Shifts"
        value={summary.weeklyShifts.toLocaleString()}
        change={wowShiftsChange}
        subtext="North Star Metric"
        highlight
      />
      <MetricCard
        icon={<DollarSign size={18} />}
        label="Pay Tracked"
        value={formatLargeNumber(summary.totalPayTracked)}
        subtext={`${formatLargeNumber(summary.monthlyPayTracked)} this month`}
      />
      <MetricCard
        icon={<Activity size={18} />}
        label="M1 Retention"
        value={summary.retentionRateM1 != null ? `${summary.retentionRateM1}%` : 'N/A'}
        subtext={`${summary.migratedUsers} migrated to Supabase`}
      />
    </div>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  change?: number
  subtext: string
  highlight?: boolean
}

function MetricCard({ icon, label, value, change, subtext, highlight }: MetricCardProps) {
  return (
    <div className={`rounded-xl p-4 border ${
      highlight
        ? 'bg-blue-600/10 border-blue-500/30'
        : 'bg-slate-800 border-slate-700'
    }`}>
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {change !== undefined && change !== 0 && (
          <span className={`flex items-center text-xs font-medium ${
            change >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change).toFixed(1)}% WoW
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1">{subtext}</p>
    </div>
  )
}

// ── Growth Chart ─────────────────────────────────────────────────────────────

function GrowthChart({ data }: { data: MetricsData['weeklyGrowth'] }) {
  return (
    <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Weekly Growth</h3>
          <p className="text-xs text-slate-400">Active users + cumulative signups (26 weeks)</p>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.sky} stopOpacity={0.15} />
                <stop offset="95%" stopColor={COLORS.sky} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              interval={3}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="activeUsers"
              stroke={COLORS.blue}
              strokeWidth={2}
              fill="url(#activeGradient)"
              name="Active Users"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="cumulativeUsers"
              stroke={COLORS.sky}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              fill="url(#cumGradient)"
              name="Cumulative Signups"
            />
            <Bar
              yAxisId="left"
              dataKey="newUsers"
              fill={COLORS.orange}
              opacity={0.7}
              name="New Users"
              radius={[2, 2, 0, 0]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

// ── Stickiness Chart ─────────────────────────────────────────────────────────

function StickinessChart({ data }: { data: MetricsData['stickiness'] }) {
  return (
    <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Engagement Stickiness</h3>
        <p className="text-xs text-slate-400">DAU/WAU and DAU/MAU ratios (12 weeks)</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: 12,
              }}
              formatter={(value?: number, name?: string) => [`${value ?? 0}%`, name ?? '']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="dauWauRatio"
              stroke={COLORS.blue}
              strokeWidth={2}
              dot={{ fill: COLORS.blue, r: 3 }}
              name="DAU/WAU %"
            />
            <Line
              type="monotone"
              dataKey="dauMauRatio"
              stroke={COLORS.orange}
              strokeWidth={2}
              dot={{ fill: COLORS.orange, r: 3 }}
              name="DAU/MAU %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        {data.length > 0 && (() => {
          const latest = data[data.length - 1];
          return (
            <>
              <div>
                <p className="text-xs text-slate-400">Avg DAU</p>
                <p className="text-lg font-bold text-white">{latest.dau}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">WAU</p>
                <p className="text-lg font-bold text-white">{latest.wau}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">MAU</p>
                <p className="text-lg font-bold text-white">{latest.mau}</p>
              </div>
            </>
          );
        })()}
      </div>
    </section>
  )
}

// ── Value Chart (Pay Tracked + Shifts per Week) ──────────────────────────────

function ValueChart({ data }: { data: MetricsData['weeklyGrowth'] }) {
  return (
    <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Value Delivery</h3>
        <p className="text-xs text-slate-400">Weekly shifts logged (NSM) + pay tracked (26 weeks)</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              interval={3}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: 12,
              }}
              formatter={(value?: number, name?: string) => {
                const v = value ?? 0;
                const n = name ?? '';
                if (n === 'Pay Tracked') return [`$${v.toLocaleString()}`, n];
                return [v.toLocaleString(), n];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="left"
              dataKey="shiftsLogged"
              fill={COLORS.blue}
              name="Shifts Logged"
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="payTracked"
              stroke={COLORS.green}
              strokeWidth={2}
              dot={false}
              name="Pay Tracked"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* NSM callout */}
      {data.length > 0 && (
        <div className="mt-3 flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-blue-400" />
          <span className="text-xs text-blue-300">
            NSM: <span className="font-bold text-white">{data[data.length - 1].shiftsLogged.toLocaleString()}</span> shifts logged this week
          </span>
        </div>
      )}
    </section>
  )
}

// ── Cohort Retention Table ───────────────────────────────────────────────────

function CohortRetentionTable({
  cohorts,
  showAll,
  onToggle,
}: {
  cohorts: CohortRow[]
  showAll: boolean
  onToggle: () => void
}) {
  const displayCohorts = showAll ? cohorts : cohorts.slice(-6);

  return (
    <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Cohort Retention</h3>
          <p className="text-xs text-slate-400">Monthly signup cohorts — % active in each subsequent month</p>
        </div>
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          {showAll ? 'Show Less' : 'Show All'}
          {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-3 pr-4 font-medium whitespace-nowrap">Cohort</th>
              <th className="pb-3 px-2 font-medium text-center">Size</th>
              <th className="pb-3 px-2 font-medium text-center">M0</th>
              <th className="pb-3 px-2 font-medium text-center">M1</th>
              <th className="pb-3 px-2 font-medium text-center">M2</th>
              <th className="pb-3 px-2 font-medium text-center">M3</th>
              <th className="pb-3 px-2 font-medium text-center">M6</th>
              <th className="pb-3 px-2 font-medium text-center">M12</th>
            </tr>
          </thead>
          <tbody>
            {displayCohorts.map((cohort) => (
              <tr key={cohort.cohortKey} className="border-t border-slate-700/50">
                <td className="py-2 pr-4 font-medium whitespace-nowrap text-slate-300">
                  {cohort.cohortMonth}
                </td>
                <td className="py-2 px-2 text-center text-slate-400">{cohort.size}</td>
                {[0, 1, 2, 3, 6, 12].map((m) => (
                  <td key={m} className="py-2 px-2 text-center">
                    {cohort.retention[m] != null ? (
                      <span
                        className="inline-block w-12 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: getRetentionColor(cohort.retention[m]!),
                          color: cohort.retention[m]! > 50 ? '#1e293b' : '#fff',
                        }}
                      >
                        {cohort.retention[m]}%
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── Peak Hours Chart ─────────────────────────────────────────────────────────

function PeakHoursChart({ data }: { data: MetricsData['peakHours'] }) {
  // Highlight working hours (5AM-11PM)
  const chartData = data.map(d => ({
    ...d,
    fill: d.hour >= 5 && d.hour <= 22 ? COLORS.blue : COLORS.slateDark,
  }))

  const peakHour = data.reduce((max, d) => d.count > max.count ? d : max, data[0])

  return (
    <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-slate-400" />
        <div>
          <h3 className="font-semibold">Peak Usage Hours</h3>
          <p className="text-xs text-slate-400">When users log shifts</p>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 9 }}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {peakHour && (
        <p className="text-xs text-slate-400 mt-2">
          Peak: <span className="text-white font-medium">{peakHour.label}</span> ({peakHour.count.toLocaleString()} shifts)
        </p>
      )}
    </section>
  )
}

// ── Job Distribution Chart ───────────────────────────────────────────────────

function JobDistributionChart({ data }: { data: MetricsData['jobDistribution'] }) {
  const top5 = data.slice(0, 5)

  return (
    <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase size={16} className="text-slate-400" />
        <div>
          <h3 className="font-semibold">Job Type Distribution</h3>
          <p className="text-xs text-slate-400">Top 5 by shift count</p>
        </div>
      </div>
      <div className="space-y-3">
        {top5.map((job, i) => {
          const maxCount = top5[0].count
          const pct = maxCount > 0 ? (job.count / maxCount) * 100 : 0
          return (
            <div key={job.job}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300 truncate max-w-[140px]" title={job.job}>
                  {job.job}
                </span>
                <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
                  {job.count.toLocaleString()} shifts
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── Shift Type Chart ─────────────────────────────────────────────────────────

function ShiftTypeChart({ data }: { data: MetricsData['shiftTypes'] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const chartData = data.map(d => ({
    ...d,
    color: SHIFT_TYPE_COLORS[d.type] || COLORS.slate,
    percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }))

  return (
    <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-slate-400" />
        <div>
          <h3 className="font-semibold">Shift Type Breakdown</h3>
          <p className="text-xs text-slate-400">{total.toLocaleString()} total shifts</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                strokeWidth={0}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          {chartData.map(item => (
            <div key={item.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-300">{item.type}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-white">{item.percentage}%</span>
                <span className="text-xs text-slate-500 ml-1">({item.count.toLocaleString()})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRetentionColor(retention: number): string {
  if (retention >= 70) return '#22c55e'
  if (retention >= 50) return '#84cc16'
  if (retention >= 35) return '#eab308'
  if (retention >= 20) return '#f97316'
  return '#ef4444'
}

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}
