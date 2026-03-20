import { useState, useMemo } from 'react'
import {
  Users,
  Calendar,
  TrendingUp,
  Activity,
  AlertTriangle,
  Trophy,
  Flame,
  Crown,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// ============================================
// MOCK DATA GENERATION
// ============================================

// Generate cohort data (users who signed up each month)
function generateCohortData() {
  const cohorts: { month: string; signups: number; retention: number[] }[] = []
  const startDate = new Date('2023-08-01')
  const now = new Date('2026-02-01')

  let monthIndex = 0
  const currentDate = new Date(startDate)

  while (currentDate < now) {
    const monthStr = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    // Simulate signups (higher in early months, stabilizing later)
    const baseSignups = monthIndex < 6 ? 80 + Math.random() * 60 : 20 + Math.random() * 30
    const signups = Math.floor(baseSignups)

    // Generate retention rates (month 1, 2, 3, etc.)
    const retention: number[] = []
    const maxMonths = Math.floor((now.getTime() - currentDate.getTime()) / (30 * 24 * 60 * 60 * 1000))

    for (let m = 1; m <= Math.min(maxMonths, 12); m++) {
      // Retention curve: starts at ~80%, decays over time
      const baseRetention = 85 * Math.pow(0.92, m - 1)
      const noise = (Math.random() - 0.5) * 10
      retention.push(Math.max(5, Math.min(100, baseRetention + noise)))
    }

    cohorts.push({ month: monthStr, signups, retention })

    currentDate.setMonth(currentDate.getMonth() + 1)
    monthIndex++
  }

  return cohorts.reverse() // Most recent first
}

// Generate daily active users data
function generateDAUData() {
  const data: { date: string; dau: number; wau: number }[] = []
  const now = new Date('2026-02-01')

  for (let i = 90; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Base DAU with some weekly seasonality (lower on weekends)
    const dayOfWeek = date.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1

    // Growing trend over time
    const growthFactor = 1 + (90 - i) * 0.003

    const baseDau = 180 * weekendFactor * growthFactor
    const noise = (Math.random() - 0.5) * 40

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dau: Math.floor(Math.max(80, baseDau + noise)),
      wau: Math.floor(baseDau * 2.5 + noise * 2),
    })
  }

  return data
}

// Generate user distribution data
function generateUserDistribution() {
  return {
    powerUsers: { count: 89, percentage: 11.8, color: '#10b981' },
    regularUsers: { count: 234, percentage: 31.1, color: '#3b82f6' },
    casualUsers: { count: 187, percentage: 24.9, color: '#f59e0b' },
    churned: { count: 242, percentage: 32.2, color: '#ef4444' },
  }
}

// Generate churn risk users
function generateChurnRiskUsers() {
  const names = [
    'Michael Chen', 'Sarah Wilson', 'James Rodriguez', 'Emily Nguyen',
    'Robert Kim', 'Lisa Thompson', 'David Martinez', 'Jennifer Lee',
    'William Brown', 'Amanda Davis', 'Christopher Taylor', 'Michelle Garcia',
    'Daniel Anderson', 'Jessica White', 'Matthew Johnson', 'Ashley Moore',
  ]

  return names.slice(0, 12).map((name, i) => ({
    id: `user-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    daysSinceLastShift: 14 + Math.floor(Math.random() * 30),
    totalShifts: 5 + Math.floor(Math.random() * 50),
    signupDate: new Date(2023, 8 + Math.floor(Math.random() * 18), Math.floor(Math.random() * 28) + 1),
    proUser: Math.random() > 0.7,
  }))
}

// Generate top users data
function generateTopUsers() {
  const names = [
    'Marcus Thompson', 'Angela Rivera', 'Kevin O\'Brien', 'Stephanie Chang',
    'Brian Foster', 'Nicole Patterson', 'Derek Williams', 'Megan Sullivan',
    'Anthony Cruz', 'Samantha Hughes', 'Ryan Mitchell', 'Katherine Brooks',
  ]

  const byTotalShifts = names.slice(0, 10).map((name, i) => ({
    rank: i + 1,
    name,
    value: 350 - i * 15 - Math.floor(Math.random() * 10),
    metric: 'shifts',
  }))

  const byStreak = [...names].sort(() => Math.random() - 0.5).slice(0, 10).map((name, i) => ({
    rank: i + 1,
    name,
    value: 45 - i * 3 - Math.floor(Math.random() * 5),
    metric: 'days',
  }))

  return { byTotalShifts, byStreak }
}

// ============================================
// DASHBOARD COMPONENT
// ============================================

export function Dashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [expandedCohorts, setExpandedCohorts] = useState(false)
  const [leaderboardTab, setLeaderboardTab] = useState<'shifts' | 'streak'>('shifts')

  // Generate all mock data
  const cohortData = useMemo(() => generateCohortData(), [])
  const dauData = useMemo(() => generateDAUData(), [])
  const userDistribution = useMemo(() => generateUserDistribution(), [])
  const churnRiskUsers = useMemo(() => generateChurnRiskUsers(), [])
  const topUsers = useMemo(() => generateTopUsers(), [])

  // Key metrics
  const metrics = {
    totalUsers: 752,
    activeUsers7d: 287,
    activeUsers30d: 423,
    totalShifts: 71712,
    avgShiftsPerUserPerWeek: 2.3,
    proConversionRate: 18.5,
    proUsers: 139,
    mrrValue: 1251, // 139 * $9
  }

  // Calculate week-over-week changes
  const changes = {
    activeUsers: 8.3,
    shiftsLogged: 12.1,
    proConversion: -1.2,
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">PORTPAL Admin Dashboard</h1>
              <p className="text-sm text-slate-400">Internal Metrics &amp; Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-700 rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-400">
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics Cards */}
        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard
              icon={<Users size={20} />}
              label="Total Users"
              value={metrics.totalUsers.toLocaleString()}
              subtext={`${metrics.proUsers} Pro subscribers`}
              color="blue"
            />
            <MetricCard
              icon={<Activity size={20} />}
              label="Active Users (7d)"
              value={metrics.activeUsers7d.toLocaleString()}
              change={changes.activeUsers}
              subtext={`${((metrics.activeUsers7d / metrics.totalUsers) * 100).toFixed(1)}% of total`}
              color="green"
            />
            <MetricCard
              icon={<Calendar size={20} />}
              label="Total Shifts Logged"
              value={metrics.totalShifts.toLocaleString()}
              change={changes.shiftsLogged}
              subtext="~95 avg per user"
              color="purple"
            />
            <MetricCard
              icon={<TrendingUp size={20} />}
              label="Avg Shifts/User/Week"
              value={metrics.avgShiftsPerUserPerWeek.toFixed(1)}
              subtext="Last 30 days"
              color="orange"
            />
            <MetricCard
              icon={<Crown size={20} />}
              label="Pro Conversion Rate"
              value={`${metrics.proConversionRate}%`}
              change={changes.proConversion}
              subtext={`$${metrics.mrrValue}/mo MRR`}
              color="yellow"
            />
          </div>
        </section>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* DAU Chart */}
            <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Daily Active Users</h3>
              <div className="h-64">
                <DAUChart data={dauData} />
              </div>
            </section>

            {/* User Distribution */}
            <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">User Segments</h3>
              <div className="flex gap-6">
                <div className="w-40 h-40">
                  <UserDistributionChart data={userDistribution} />
                </div>
                <div className="flex-1 space-y-3">
                  <SegmentRow
                    label="Power Users"
                    description="5+ shifts/week"
                    count={userDistribution.powerUsers.count}
                    percentage={userDistribution.powerUsers.percentage}
                    color={userDistribution.powerUsers.color}
                  />
                  <SegmentRow
                    label="Regular Users"
                    description="1-4 shifts/week"
                    count={userDistribution.regularUsers.count}
                    percentage={userDistribution.regularUsers.percentage}
                    color={userDistribution.regularUsers.color}
                  />
                  <SegmentRow
                    label="Casual Users"
                    description="<1 shift/week"
                    count={userDistribution.casualUsers.count}
                    percentage={userDistribution.casualUsers.percentage}
                    color={userDistribution.casualUsers.color}
                  />
                  <SegmentRow
                    label="Churned"
                    description="No activity 30+ days"
                    count={userDistribution.churned.count}
                    percentage={userDistribution.churned.percentage}
                    color={userDistribution.churned.color}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Top Users Leaderboard */}
            <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Top Users</h3>
                <div className="flex bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setLeaderboardTab('shifts')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      leaderboardTab === 'shifts'
                        ? 'bg-amber-500 text-slate-900'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Trophy size={14} className="inline mr-1" />
                    Total Shifts
                  </button>
                  <button
                    onClick={() => setLeaderboardTab('streak')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      leaderboardTab === 'streak'
                        ? 'bg-orange-500 text-slate-900'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame size={14} className="inline mr-1" />
                    Current Streak
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {(leaderboardTab === 'shifts' ? topUsers.byTotalShifts : topUsers.byStreak).map((user) => (
                  <div
                    key={user.name}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      user.rank === 1 ? 'bg-amber-500 text-slate-900' :
                      user.rank === 2 ? 'bg-slate-400 text-slate-900' :
                      user.rank === 3 ? 'bg-amber-700 text-white' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {user.rank}
                    </div>
                    <span className="flex-1 text-sm">{user.name}</span>
                    <span className="font-semibold text-sm">
                      {user.value} {user.metric}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Churn Risk Table */}
            <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-red-400" />
                <h3 className="text-lg font-semibold">Churn Risk Users</h3>
                <span className="ml-auto text-sm text-slate-400">14+ days inactive</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-2 font-medium">User</th>
                      <th className="pb-2 font-medium text-right">Days Inactive</th>
                      <th className="pb-2 font-medium text-right">Total Shifts</th>
                      <th className="pb-2 font-medium text-center">Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churnRiskUsers.slice(0, 8).map((user) => (
                      <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-2">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <span className={`font-medium ${
                            user.daysSinceLastShift > 30 ? 'text-red-400' :
                            user.daysSinceLastShift > 21 ? 'text-orange-400' :
                            'text-yellow-400'
                          }`}>
                            {user.daysSinceLastShift}
                          </span>
                        </td>
                        <td className="py-2 text-right text-slate-300">{user.totalShifts}</td>
                        <td className="py-2 text-center">
                          {user.proUser ? (
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">PRO</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {/* Cohort Retention Table - Full Width */}
        <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Cohort Retention</h3>
            <button
              onClick={() => setExpandedCohorts(!expandedCohorts)}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {expandedCohorts ? 'Show Less' : 'Show All'}
              {expandedCohorts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="pb-3 pr-4 font-medium">Cohort</th>
                  <th className="pb-3 px-2 font-medium text-center">Users</th>
                  <th className="pb-3 px-2 font-medium text-center">M1</th>
                  <th className="pb-3 px-2 font-medium text-center">M2</th>
                  <th className="pb-3 px-2 font-medium text-center">M3</th>
                  <th className="pb-3 px-2 font-medium text-center">M4</th>
                  <th className="pb-3 px-2 font-medium text-center">M5</th>
                  <th className="pb-3 px-2 font-medium text-center">M6</th>
                  <th className="pb-3 px-2 font-medium text-center">M7</th>
                  <th className="pb-3 px-2 font-medium text-center">M8</th>
                  <th className="pb-3 px-2 font-medium text-center">M9</th>
                  <th className="pb-3 px-2 font-medium text-center">M10</th>
                  <th className="pb-3 px-2 font-medium text-center">M11</th>
                  <th className="pb-3 px-2 font-medium text-center">M12</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.slice(0, expandedCohorts ? undefined : 8).map((cohort) => (
                  <tr key={cohort.month} className="border-t border-slate-700/50">
                    <td className="py-2 pr-4 font-medium whitespace-nowrap">{cohort.month}</td>
                    <td className="py-2 px-2 text-center text-slate-300">{cohort.signups}</td>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        {cohort.retention[i] !== undefined ? (
                          <span
                            className="inline-block w-10 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: getRetentionColor(cohort.retention[i]),
                              color: cohort.retention[i] > 50 ? '#1e293b' : '#fff',
                            }}
                          >
                            {cohort.retention[i].toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  change?: number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'yellow'
}

function MetricCard({ icon, label, value, subtext, change, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-emerald-600 to-emerald-700',
    purple: 'from-purple-600 to-purple-700',
    orange: 'from-orange-600 to-orange-700',
    yellow: 'from-amber-500 to-amber-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4`}>
      <div className="flex items-center gap-2 text-white/80 mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {change !== undefined && (
          <span className={`flex items-center text-sm font-medium ${
            change >= 0 ? 'text-green-300' : 'text-red-300'
          }`}>
            {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-xs text-white/60 mt-1">{subtext}</p>
    </div>
  )
}

interface SegmentRowProps {
  label: string
  description: string
  count: number
  percentage: number
  color: string
}

function SegmentRow({ label, description, count, percentage, color }: SegmentRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{label}</span>
          <span className="text-sm text-slate-300">{count} users</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-slate-400">{description}</span>
          <span className="text-xs text-slate-400">{percentage}%</span>
        </div>
      </div>
    </div>
  )
}

// Simple SVG-based DAU chart
function DAUChart({ data }: { data: { date: string; dau: number }[] }) {
  const maxDau = Math.max(...data.map(d => d.dau))
  const height = 200
  const width = 100 // percentage
  const padding = 20

  // Show every 7th data point label
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2 / 4) + padding / 4
    const y = height - padding - ((d.dau / maxDau) * (height - padding * 2))
    return { ...d, x, y, index: i }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full h-full" preserveAspectRatio="none">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((pct) => (
        <line
          key={pct}
          x1="5%"
          x2="100%"
          y1={height - padding - (pct / 100) * (height - padding * 2)}
          y2={height - padding - (pct / 100) * (height - padding * 2)}
          stroke="#334155"
          strokeWidth="0.3"
        />
      ))}

      {/* Area under curve */}
      <path
        d={`${pathD} L ${points[points.length - 1]?.x}% ${height - padding} L ${points[0]?.x}% ${height - padding} Z`}
        fill="url(#dauGradient)"
        opacity="0.3"
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="0.5"
      />

      {/* Dots on some points */}
      {points.filter((_, i) => i % 15 === 0 || i === points.length - 1).map((p) => (
        <circle
          key={p.index}
          cx={`${p.x}%`}
          cy={p.y}
          r="1"
          fill="#3b82f6"
        />
      ))}

      {/* X-axis labels */}
      {points.filter((_, i) => i % 30 === 0 || i === points.length - 1).map((p) => (
        <text
          key={p.index}
          x={`${p.x}%`}
          y={height - 5}
          fill="#64748b"
          fontSize="3"
          textAnchor="middle"
        >
          {p.date}
        </text>
      ))}

      {/* Y-axis labels */}
      {[0, 50, 100].map((pct) => (
        <text
          key={pct}
          x="2%"
          y={height - padding - (pct / 100) * (height - padding * 2) + 1}
          fill="#64748b"
          fontSize="3"
          textAnchor="start"
        >
          {Math.round(maxDau * pct / 100)}
        </text>
      ))}

      <defs>
        <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Simple donut chart for user distribution
function UserDistributionChart({ data }: { data: ReturnType<typeof generateUserDistribution> }) {
  const segments = [
    data.powerUsers,
    data.regularUsers,
    data.casualUsers,
    data.churned,
  ]

  const total = segments.reduce((sum, s) => sum + s.count, 0)
  let currentAngle = -90 // Start from top

  const arcs = segments.map((segment) => {
    const angle = (segment.count / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = 50 + 35 * Math.cos(startRad)
    const y1 = 50 + 35 * Math.sin(startRad)
    const x2 = 50 + 35 * Math.cos(endRad)
    const y2 = 50 + 35 * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    return {
      d: `M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: segment.color,
    }
  })

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={arc.color} />
      ))}
      {/* Center hole for donut effect */}
      <circle cx="50" cy="50" r="20" fill="#1e293b" />
      <text x="50" y="48" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
        {total}
      </text>
      <text x="50" y="58" textAnchor="middle" fill="#94a3b8" fontSize="5">
        users
      </text>
    </svg>
  )
}

// Helper to get retention cell color
function getRetentionColor(retention: number): string {
  if (retention >= 70) return '#22c55e' // green-500
  if (retention >= 50) return '#84cc16' // lime-500
  if (retention >= 35) return '#eab308' // yellow-500
  if (retention >= 20) return '#f97316' // orange-500
  return '#ef4444' // red-500
}
