import type { ReactNode } from 'react'
import { Anchor, TrendingUp, AlertTriangle, Check, ChevronRight, Target } from 'lucide-react'
import { brand } from './brand'

// =============================================================================
// BASE LAYOUTS
// =============================================================================

interface SlideProps {
  children: ReactNode
  variant?: 'dark' | 'light' | 'gradient' | 'navy'
  className?: string
}

export function Slide({ children, variant = 'dark', className = '' }: SlideProps) {
  const backgrounds = {
    dark: 'bg-slate-900',
    light: 'bg-slate-50',
    gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
    navy: 'bg-gradient-to-br from-slate-800 to-slate-900',
  }

  const textColors = {
    dark: 'text-white',
    light: 'text-slate-900',
    gradient: 'text-white',
    navy: 'text-white',
  }

  return (
    <div
      className={`w-[1080px] h-[1350px] ${backgrounds[variant]} ${textColors[variant]} p-16 flex flex-col ${className}`}
      style={{ fontFamily: brand.fonts.heading }}
    >
      {children}
    </div>
  )
}

export function TikTokSlide({ children, variant = 'dark', className = '' }: SlideProps) {
  const backgrounds = {
    dark: 'bg-slate-900',
    light: 'bg-slate-50',
    gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
    navy: 'bg-gradient-to-br from-slate-800 to-slate-900',
  }

  return (
    <div
      className={`w-[1080px] h-[1920px] ${backgrounds[variant]} text-white p-12 flex flex-col ${className}`}
      style={{ fontFamily: brand.fonts.heading }}
    >
      {children}
    </div>
  )
}

// =============================================================================
// BRAND ELEMENTS
// =============================================================================

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { container: 'w-10 h-10', icon: 20, text: 'text-lg' },
    md: { container: 'w-14 h-14', icon: 28, text: 'text-2xl' },
    lg: { container: 'w-20 h-20', icon: 40, text: 'text-4xl' },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <div className={`${s.container} bg-blue-600 rounded-xl flex items-center justify-center`}>
        <Anchor size={s.icon} className="text-white" />
      </div>
      <span className={`font-bold ${s.text}`}>PORTPAL</span>
    </div>
  )
}

export function DataBadge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-medium">
      {children}
    </div>
  )
}

export function SourceBadge() {
  return (
    <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-400 px-4 py-2 rounded-lg text-sm">
      <span className="text-blue-400 font-mono">71,712</span>
      <span>real shifts analyzed</span>
    </div>
  )
}

// =============================================================================
// DATA VISUALIZATION COMPONENTS
// =============================================================================

interface StatCardProps {
  value: string
  label: string
  sublabel?: string
  variant?: 'default' | 'highlight' | 'warning' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

export function StatCard({ value, label, sublabel, variant = 'default', size = 'md' }: StatCardProps) {
  const variants = {
    default: 'bg-slate-800 border-slate-700',
    highlight: 'bg-blue-600 border-blue-500',
    warning: 'bg-orange-500/20 border-orange-500/30',
    success: 'bg-green-500/20 border-green-500/30',
  }

  const sizes = {
    sm: { value: 'text-3xl', label: 'text-sm', padding: 'p-4' },
    md: { value: 'text-5xl', label: 'text-lg', padding: 'p-6' },
    lg: { value: 'text-7xl', label: 'text-xl', padding: 'p-8' },
  }

  const s = sizes[size]

  return (
    <div className={`${variants[variant]} ${s.padding} rounded-2xl border`}>
      <div className={`${s.value} font-bold mb-2`}>{value}</div>
      <div className={`${s.label} text-slate-300`}>{label}</div>
      {sublabel && <div className="text-sm text-slate-500 mt-1">{sublabel}</div>}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'blue' | 'green' | 'orange'
}

export function ProgressBar({ value, max, showLabel = true, size = 'md', variant = 'blue' }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const heights = { sm: 'h-3', md: 'h-6', lg: 'h-10' }
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  }

  return (
    <div className="w-full">
      <div className={`${heights[size]} bg-slate-700 rounded-full overflow-hidden`}>
        <div
          className={`h-full bg-gradient-to-r ${colors[variant]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-slate-400">{percentage.toFixed(1)}%</span>
          <span className="text-slate-400">
            ${value.toLocaleString()} / ${max.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}

interface JobRankingProps {
  rank: number
  job: string
  amount: string
  detail?: string
  highlight?: boolean
}

export function JobRanking({ rank, job, amount, detail, highlight = false }: JobRankingProps) {
  return (
    <div
      className={`flex items-center gap-4 p-5 rounded-xl ${
        highlight ? 'bg-blue-600' : 'bg-slate-800'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
          highlight ? 'bg-white/20' : 'bg-slate-700'
        }`}
      >
        {rank}
      </div>
      <div className="flex-1">
        <div className="text-xl font-semibold">{job}</div>
        {detail && <div className="text-sm text-slate-400">{detail}</div>}
      </div>
      <div className="text-2xl font-bold">{amount}</div>
    </div>
  )
}

interface ComparisonRowProps {
  label: string
  left: { value: string; sublabel?: string }
  right: { value: string; sublabel?: string }
  winner?: 'left' | 'right' | 'tie'
}

export function ComparisonRow({ label, left, right, winner }: ComparisonRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/50 rounded-xl">
      <div className={`text-center ${winner === 'left' ? 'text-green-400' : ''}`}>
        <div className="text-2xl font-bold">{left.value}</div>
        {left.sublabel && <div className="text-xs text-slate-500">{left.sublabel}</div>}
      </div>
      <div className="text-center text-slate-400 text-sm self-center">{label}</div>
      <div className={`text-center ${winner === 'right' ? 'text-green-400' : ''}`}>
        <div className="text-2xl font-bold">{right.value}</div>
        {right.sublabel && <div className="text-xs text-slate-500">{right.sublabel}</div>}
      </div>
    </div>
  )
}

// =============================================================================
// CONTENT BLOCKS
// =============================================================================

interface AlertBlockProps {
  type: 'warning' | 'error' | 'success' | 'info'
  title: string
  description?: string
}

export function AlertBlock({ type, title, description }: AlertBlockProps) {
  const styles = {
    warning: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: AlertTriangle, color: 'text-orange-400' },
    error: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle, color: 'text-red-400' },
    success: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: Check, color: 'text-green-400' },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: TrendingUp, color: 'text-blue-400' },
  }

  const s = styles[type]
  const Icon = s.icon

  return (
    <div className={`${s.bg} ${s.border} border rounded-2xl p-6 flex gap-4`}>
      <div className={`${s.color}`}>
        <Icon size={28} />
      </div>
      <div>
        <div className={`font-semibold text-lg ${s.color}`}>{title}</div>
        {description && <div className="text-slate-300 mt-1">{description}</div>}
      </div>
    </div>
  )
}

interface CTABlockProps {
  headline: string
  subheadline?: string
  buttonText?: string
}

export function CTABlock({ headline, subheadline, buttonText = 'Get PORTPAL Free' }: CTABlockProps) {
  return (
    <div className="text-center mt-auto">
      <div className="text-2xl font-bold mb-2">{headline}</div>
      {subheadline && <div className="text-slate-400 mb-6">{subheadline}</div>}
      <div className="inline-flex items-center gap-2 bg-blue-600 px-8 py-4 rounded-xl text-xl font-semibold">
        {buttonText}
        <ChevronRight size={24} />
      </div>
    </div>
  )
}

// =============================================================================
// PENSION TRACKER COMPONENTS
// =============================================================================

interface PensionTrackerProps {
  current: number
  goal: number
  weekNumber: number
  projectedDate?: string
}

export function PensionTracker({ current, goal, weekNumber, projectedDate }: PensionTrackerProps) {
  return (
    <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <Target className="text-blue-400" size={28} />
        <div>
          <div className="text-xl font-semibold">Pension Year Progress</div>
          <div className="text-sm text-slate-400">Week {weekNumber} of 52</div>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-6xl font-bold text-blue-400">${current.toLocaleString()}</span>
        <span className="text-2xl text-slate-500">/ ${goal.toLocaleString()}</span>
      </div>

      <ProgressBar value={current} max={goal} size="lg" />

      {projectedDate && (
        <div className="mt-6 flex items-center gap-2 text-green-400">
          <TrendingUp size={20} />
          <span>On track to hit goal by {projectedDate}</span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// DIFFERENTIAL TABLE
// =============================================================================

interface DifferentialRowProps {
  className: string
  amount: string
  jobs: string[]
  highlight?: boolean
}

export function DifferentialRow({ className, amount, jobs, highlight = false }: DifferentialRowProps) {
  return (
    <div
      className={`grid grid-cols-[120px_100px_1fr] gap-4 p-4 rounded-xl ${
        highlight ? 'bg-blue-600' : 'bg-slate-800/50'
      }`}
    >
      <div className="font-semibold">{className}</div>
      <div className="font-mono text-green-400">{amount}</div>
      <div className="text-slate-400 text-sm">{jobs.join(', ')}</div>
    </div>
  )
}

// =============================================================================
// SLIDE TEMPLATES
// =============================================================================

interface HookSlideProps {
  hook: string
  subhook?: string
  badge?: string
}

export function HookSlide({ hook, subhook, badge }: HookSlideProps) {
  return (
    <Slide variant="navy">
      <Logo size="md" />

      <div className="flex-1 flex flex-col justify-center">
        {badge && <DataBadge>{badge}</DataBadge>}
        <h1 className="text-6xl font-bold leading-tight mt-6">{hook}</h1>
        {subhook && <p className="text-2xl text-slate-400 mt-6">{subhook}</p>}
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-lg">
        <span>Swipe to see the data</span>
        <ChevronRight size={24} />
      </div>
    </Slide>
  )
}

interface DataSlideProps {
  title: string
  children: ReactNode
  slideNumber?: string
}

export function DataSlide({ title, children, slideNumber }: DataSlideProps) {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-4xl font-bold">{title}</h2>
        {slideNumber && <div className="text-slate-500 text-lg">{slideNumber}</div>}
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">{children}</div>

      <SourceBadge />
    </Slide>
  )
}

interface CTASlideProps {
  headline: string
  stats?: { value: string; label: string }[]
}

export function CTASlide({ headline, stats }: CTASlideProps) {
  return (
    <Slide variant="gradient">
      <Logo size="lg" />

      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-5xl font-bold mb-8">{headline}</h1>

        {stats && (
          <div className="grid grid-cols-3 gap-6 mb-12">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-6">
                <div className="text-4xl font-bold">{stat.value}</div>
                <div className="text-blue-200 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl text-2xl font-bold mx-auto">
          Download Free
          <ChevronRight size={28} />
        </div>
      </div>

      <div className="text-center text-blue-200">Link in bio</div>
    </Slide>
  )
}
