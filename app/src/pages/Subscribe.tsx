import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  X,
  Zap,
  Brain,
  FileText,
  RotateCcw,
  Star,
  TrendingUp,
  Shield,
  ChevronRight,
  Sparkles,
  Crown,
} from 'lucide-react'

export function Subscribe() {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [isProcessing, setIsProcessing] = useState(false)

  const monthlyPrice = 10
  const yearlyPrice = 99
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2)
  const savings = (monthlyPrice * 12) - yearlyPrice

  const freeFeatures = [
    { name: 'Shift logging', included: true },
    { name: 'Automatic rate calculation', included: true },
    { name: 'Weekly summary', included: true },
    { name: 'Basic pension tracking', included: true },
    { name: 'AI questions', value: '1/week', included: 'partial' },
    { name: 'Job predictions', value: '1/week', included: 'partial' },
    { name: 'Callback feature', included: false },
    { name: 'Custom templates', included: false },
    { name: 'Pay stub upload', included: false },
    { name: 'Discrepancy alerts', included: false },
    { name: 'Advanced analytics', included: false },
  ]

  const proFeatures = [
    { icon: Brain, name: 'Unlimited AI', desc: 'Ask anything, anytime' },
    { icon: FileText, name: 'Pay Stub Check', desc: 'Upload & auto-reconcile' },
    { icon: RotateCcw, name: 'Callback', desc: 'Repeat yesterday in 1 tap' },
    { icon: Star, name: 'Templates', desc: 'Save your common shifts' },
    { icon: Zap, name: 'Daily Predictions', desc: 'Know before dispatch' },
    { icon: TrendingUp, name: 'Full Analytics', desc: 'Trends & comparisons' },
    { icon: Shield, name: 'Discrepancy Alerts', desc: 'Catch every shortage' },
  ]

  const handleSubscribe = () => {
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      localStorage.setItem('isPro', 'true')
      localStorage.setItem('proSince', new Date().toISOString())
      navigate('/')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-slate-400">
          <X size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Crown className="text-amber-400" size={20} />
          <span className="font-semibold">PORTPAL Pro</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Hero */}
      <div className="px-6 pt-4 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-medium mb-4">
          <Sparkles size={12} />
          Founding Member Pricing
        </div>
        <h1 className="text-3xl font-bold mb-2">Unlock Full Power</h1>
        <p className="text-slate-400">
          Never leave money on the table again
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="px-6 mb-6">
        <div className="bg-slate-800 rounded-xl p-1 flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900'
                : 'text-slate-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white text-slate-900'
                : 'text-slate-400'
            }`}
          >
            Yearly
            <span className="ml-1 text-green-500 text-xs">Save ${savings}</span>
          </button>
        </div>
      </div>

      {/* Price Card */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold">
                ${billingCycle === 'yearly' ? yearlyPrice : monthlyPrice}
              </span>
              <span className="text-blue-200">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </div>

            {billingCycle === 'yearly' && (
              <p className="text-blue-200 text-sm mb-4">
                Just ${yearlyMonthly}/month, billed annually
              </p>
            )}

            <div className="space-y-2 mb-6">
              {proFeatures.slice(0, 4).map(f => (
                <div key={f.name} className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-400" />
                  <span>{f.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <span className="ml-6">+ {proFeatures.length - 4} more features</span>
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full py-3 bg-white text-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start 30-Day Free Trial
                  <ChevronRight size={18} />
                </>
              )}
            </button>

            <p className="text-center text-blue-200 text-xs mt-3">
              No credit card required to start
            </p>
          </div>
        </div>
      </div>

      {/* Pro Features Grid */}
      <div className="px-6 mb-6">
        <h3 className="font-semibold text-lg mb-3">Everything in Pro</h3>
        <div className="grid grid-cols-2 gap-3">
          {proFeatures.map(f => (
            <div
              key={f.name}
              className="bg-slate-800/50 rounded-xl p-3 border border-slate-700"
            >
              <f.icon size={20} className="text-blue-400 mb-2" />
              <p className="font-medium text-sm">{f.name}</p>
              <p className="text-xs text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="px-6 mb-6">
        <h3 className="font-semibold text-lg mb-3">Free vs Pro</h3>
        <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
          <div className="grid grid-cols-3 gap-2 p-3 border-b border-slate-700 text-sm">
            <div className="text-slate-400">Feature</div>
            <div className="text-center text-slate-400">Free</div>
            <div className="text-center text-amber-400">Pro</div>
          </div>
          {freeFeatures.map(f => (
            <div
              key={f.name}
              className="grid grid-cols-3 gap-2 p-3 border-b border-slate-700/50 text-sm last:border-0"
            >
              <div className="text-slate-300">{f.name}</div>
              <div className="text-center">
                {f.included === true ? (
                  <Check size={16} className="text-green-400 mx-auto" />
                ) : f.included === 'partial' ? (
                  <span className="text-xs text-slate-400">{f.value}</span>
                ) : (
                  <X size={16} className="text-slate-600 mx-auto" />
                )}
              </div>
              <div className="text-center">
                <Check size={16} className="text-green-400 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Value Prop */}
      <div className="px-6 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-green-400 font-medium text-sm mb-1">
            Pay for itself instantly
          </p>
          <p className="text-slate-300 text-sm">
            One caught pay discrepancy pays for an entire year of Pro.
            Most users find one in their first month.
          </p>
        </div>
      </div>

      {/* Social Proof */}
      <div className="px-6 mb-8">
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-2">Join your brothers & sisters</p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-800"
                />
              ))}
            </div>
            <span className="text-slate-300 text-sm">
              <span className="font-semibold">347</span> longshoremen tracking
            </span>
          </div>
        </div>
      </div>

      {/* Continue Free */}
      <div className="px-6 pb-8">
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 text-slate-400 text-sm"
        >
          Continue with Free
        </button>
      </div>
    </div>
  )
}
