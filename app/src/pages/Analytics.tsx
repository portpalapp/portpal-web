import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, MapPin, Clock, DollarSign, Loader2 } from 'lucide-react'
import { useShifts } from '../hooks/useShifts'
import { formatCurrency } from '../lib/formatters'

export function Analytics() {
  const { shifts, loading } = useShifts()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Empty state
  if (shifts.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <TrendingUp size={40} className="mb-3" />
          <p className="font-medium text-slate-600">No data yet</p>
          <p className="text-sm">Log some shifts to see your analytics</p>
        </div>
      </div>
    )
  }

  // Calculate stats
  const totalEarnings = shifts.reduce((sum, s) => sum + s.totalPay, 0)
  const totalHours = shifts.reduce((sum, s) => sum + s.regHours + s.otHours, 0)
  const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0

  // Location breakdown
  const locationStats = shifts.reduce((acc, s) => {
    if (!acc[s.location]) acc[s.location] = { count: 0, earnings: 0 }
    acc[s.location].count++
    acc[s.location].earnings += s.totalPay
    return acc
  }, {} as Record<string, { count: number; earnings: number }>)

  const locationData = Object.entries(locationStats)
    .map(([name, data]) => ({ name: name.substring(0, 8), ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Shift type breakdown
  const shiftStats = shifts.reduce((acc, s) => {
    if (!acc[s.shift]) acc[s.shift] = 0
    acc[s.shift]++
    return acc
  }, {} as Record<string, number>)

  const shiftData = [
    { name: 'Day', value: shiftStats['DAY'] || 0, color: '#fbbf24' },
    { name: 'Night', value: shiftStats['NIGHT'] || 0, color: '#2563eb' },
    { name: 'Graveyard', value: shiftStats['GRAVEYARD'] || 0, color: '#9333ea' },
  ]

  // Job breakdown
  const jobStats = shifts.reduce((acc, s) => {
    if (!acc[s.job]) acc[s.job] = { count: 0, earnings: 0 }
    acc[s.job].count++
    acc[s.job].earnings += s.totalPay
    return acc
  }, {} as Record<string, { count: number; earnings: number }>)

  const jobData = Object.entries(jobStats)
    .map(([name, data]) => ({ name: name.substring(0, 12), ...data }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5)

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                timeRange === range
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <DollarSign size={14} />
            <span className="text-xs">Total Earnings</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{formatCurrency(totalEarnings)}</p>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock size={14} />
            <span className="text-xs">Total Hours</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{totalHours.toFixed(1)}</p>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp size={14} />
            <span className="text-xs">Avg Hourly</span>
          </div>
          <p className="text-xl font-bold text-green-600">{formatCurrency(avgHourlyRate)}</p>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <MapPin size={14} />
            <span className="text-xs">Locations</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{Object.keys(locationStats).length}</p>
        </div>
      </div>

      {/* Earnings by Location */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Earnings by Location</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locationData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
              <Bar dataKey="earnings" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shift Distribution */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Shift Distribution</h3>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shiftData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                >
                  {shiftData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {shiftData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-800">{item.value} shifts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Jobs */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Top Jobs</h3>
        <div className="space-y-3">
          {jobData.map((job, i) => (
            <div key={job.name} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-slate-800 text-sm">{job.name}</p>
                  <p className="font-semibold text-slate-800">{formatCurrency(job.earnings)}</p>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(job.earnings / jobData[0].earnings) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
        <h3 className="font-semibold mb-2">Insights</h3>
        <ul className="space-y-2 text-sm text-blue-100">
          <li>• You work most frequently at {locationData[0]?.name || 'N/A'}</li>
          <li>• Your highest-paying job is {jobData[0]?.name || 'N/A'}</li>
          <li>• {Math.round((shiftData[0]?.value / shifts.length) * 100) || 0}% of your shifts are day shifts</li>
        </ul>
      </div>
    </div>
  )
}
