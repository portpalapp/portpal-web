import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Anchor,
  Check,
  ChevronRight,
  Shield,
  TrendingUp,
  Brain,
  FileText,
  Clock,
  DollarSign,
  Users,
  Star,
  ArrowRight,
  Play,
  Menu,
  X,
} from 'lucide-react'

export function Landing() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // Store email for waitlist
      const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]')
      waitlist.push({ email, date: new Date().toISOString() })
      localStorage.setItem('waitlist', JSON.stringify(waitlist))
      setSubmitted(true)
    }
  }

  const features = [
    {
      icon: DollarSign,
      title: 'Auto Rate Calculation',
      desc: 'Every job, shift, and differential. Calculated instantly.',
    },
    {
      icon: Shield,
      title: 'Catch Discrepancies',
      desc: 'Find pay errors before they cost you thousands.',
    },
    {
      icon: TrendingUp,
      title: 'Pension Tracking',
      desc: 'Know exactly when you\'ll hit your $120k goal.',
    },
    {
      icon: Brain,
      title: 'AI Assistant',
      desc: 'Ask anything about rates, rules, and your patterns.',
    },
    {
      icon: Clock,
      title: '30-Second Logging',
      desc: 'Quick entry with smart defaults from your history.',
    },
    {
      icon: FileText,
      title: 'Pay Stub Upload',
      desc: 'Photo to audit. We check the math for you.',
    },
  ]

  const stats = [
    { value: '71,712', label: 'Shifts Analyzed' },
    { value: '42', label: 'Job Types' },
    { value: '24', label: 'Terminals' },
    { value: '$34', label: 'Avg Error Caught' },
  ]

  const testimonials = [
    {
      quote: "Found $340 they owed me in my first month. App paid for itself 3x over.",
      name: "Mike T.",
      role: "TT Driver, 12 years",
      rating: 5,
    },
    {
      quote: "Finally know if I'll make pension without guessing. The AI is incredibly helpful.",
      name: "Sarah K.",
      role: "Head Checker, 8 years",
      rating: 5,
    },
    {
      quote: "My dad used paper for 30 years. Got him on PORTPAL and he's actually checking his pay now.",
      name: "James L.",
      role: "RTG Operator, 5 years",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Anchor size={18} />
              </div>
              <span className="font-bold text-lg">PORTPAL</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white text-sm">Features</a>
              <a href="#pricing" className="text-slate-300 hover:text-white text-sm">Pricing</a>
              <a href="#testimonials" className="text-slate-300 hover:text-white text-sm">Reviews</a>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500"
              >
                Open App
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-slate-300 hover:text-white">Features</a>
              <a href="#pricing" className="block text-slate-300 hover:text-white">Pricing</a>
              <a href="#testimonials" className="block text-slate-300 hover:text-white">Reviews</a>
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-2 bg-blue-600 rounded-lg font-medium"
              >
                Open App
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm mb-6">
            <Users size={16} />
            Built by longshoremen, for longshoremen
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Stop Leaving Money
            <span className="text-blue-500"> On the Table</span>
          </h1>

          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Track your shifts. Catch pay errors. Know exactly when you'll hit pension.
            The shift tracker that actually understands longshore pay.
          </p>

          {/* Email Signup */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-500"
              >
                Get Early Access
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 max-w-md mx-auto mb-8">
              <div className="flex items-center gap-2 text-green-400">
                <Check size={20} />
                <span className="font-medium">You're on the list! We'll be in touch.</span>
              </div>
            </div>
          )}

          <p className="text-sm text-slate-500">
            30-day free trial. No credit card required.
          </p>

          {/* Hero Image/Demo */}
          <div className="mt-12 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 shadow-2xl">
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                <button className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-all hover:scale-105">
                  <Play size={32} className="ml-1" />
                </button>
              </div>
              <p className="text-slate-400 text-sm mt-4">Watch: How PORTPAL saved Mike $2,400 in his first year</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-slate-800 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-400">{stat.value}</div>
                <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">The Problem</h2>
            <p className="text-slate-400">Sound familiar?</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
              <div className="text-4xl mb-4">$34</div>
              <p className="text-slate-300">Average pay error per incident. "Small" mistakes that add up to thousands over a career.</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
              <div className="text-4xl mb-4">7+</div>
              <p className="text-slate-300">Different jobs with different rates in a single week. Who can track all that in their head?</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
              <div className="text-4xl mb-4">???</div>
              <p className="text-slate-300">"Will I make pension this year?" The anxiety of not knowing until December.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-slate-400">Built specifically for BC longshoremen</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(feature => (
              <div key={feature.title} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all">
                <feature.icon className="text-blue-400 mb-4" size={28} />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-slate-400">One caught error pays for a year</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Tier */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="text-lg font-semibold mb-2">Free</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-slate-400">/forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-400" />
                  Unlimited shift logging
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-400" />
                  Auto rate calculation
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-400" />
                  Weekly summary
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-400" />
                  Basic pension tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <X size={16} className="text-slate-600" />
                  1 AI question/week
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <X size={16} className="text-slate-600" />
                  Limited predictions
                </li>
              </ul>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 border border-slate-600 rounded-xl font-medium hover:bg-slate-700"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 relative">
              <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded">
                POPULAR
              </div>
              <div className="text-lg font-semibold mb-2">Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-blue-200">/year</span>
              </div>
              <p className="text-blue-200 text-sm mb-6">Just $8.25/month</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-300" />
                  Everything in Free
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-300" />
                  Unlimited AI assistant
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-300" />
                  Pay stub upload & reconciliation
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-300" />
                  Discrepancy alerts
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-300" />
                  Callback & templates
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-300" />
                  Daily job predictions
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-300" />
                  Full analytics & export
                </li>
              </ul>
              <button
                onClick={() => navigate('/subscribe')}
                className="w-full py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50"
              >
                Start 30-Day Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">From Your Brothers & Sisters</h2>
            <p className="text-slate-400">Real results from real longshoremen</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4">"{t.quote}"</p>
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control?</h2>
          <p className="text-slate-400 mb-8">
            Join hundreds of longshoremen who stopped guessing and started knowing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-500"
            >
              Open App
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => navigate('/subscribe')}
              className="px-8 py-4 border border-slate-600 rounded-xl font-semibold hover:bg-slate-800"
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Anchor size={18} />
              </div>
              <span className="font-bold">PORTPAL</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
            <div className="text-sm text-slate-500">
              Made with solidarity in Vancouver, BC
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
