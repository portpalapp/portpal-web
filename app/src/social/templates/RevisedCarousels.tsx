/**
 * REVISED SOCIAL TEMPLATES
 * Focus: The Problem, Not The Pay
 *
 * - No prominent earnings displays
 * - Blur/hide specific dollar amounts
 * - Emphasize: accuracy, complexity, time savings, peace of mind
 */

import { Slide, TikTokSlide, Logo } from '../components'
import {
  ChevronRight,
  AlertTriangle,
  Check,
  Clock,
  Shield,
  Target,
  HelpCircle,
  FileQuestion,
  Zap,
} from 'lucide-react'

// =============================================================================
// HELPER
// =============================================================================

function SmallDiscrepancy({ amount }: { amount: number }) {
  return (
    <span className="text-orange-400 font-bold">${amount}</span>
  )
}

// =============================================================================
// CAROUSEL 1: "Is Your Pay Right?"
// =============================================================================

export function PayAccuracy_Slide1() {
  return (
    <Slide variant="navy">
      <Logo size="md" />

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-20 h-20 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-8">
          <HelpCircle size={40} className="text-orange-400" />
        </div>

        <h1 className="text-[56px] font-bold leading-tight">
          Is Your Pay
          <span className="text-orange-400"> Actually</span> Right?
        </h1>

        <p className="text-2xl text-slate-400 mt-6 max-w-[800px]">
          When's the last time you checked the math?
        </p>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-xl">
        <span>Swipe to find out why it matters</span>
        <ChevronRight size={28} />
      </div>
    </Slide>
  )
}

export function PayAccuracy_Slide2() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">The System Is Complex</h2>
        <div className="text-slate-500">2/5</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <div className="text-5xl font-bold text-blue-400 mb-2">42</div>
            <div className="text-slate-400">Job types</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <div className="text-5xl font-bold text-blue-400 mb-2">24</div>
            <div className="text-slate-400">Terminals</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <div className="text-5xl font-bold text-blue-400 mb-2">3</div>
            <div className="text-slate-400">Shift types</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <div className="text-5xl font-bold text-blue-400 mb-2">6</div>
            <div className="text-slate-400">Pay classes</div>
          </div>
        </div>

        <p className="text-xl text-slate-300">
          Plus weekend premiums. Plus overtime rules. Plus location-specific hours.
        </p>

        <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <p className="text-lg text-slate-400">
            <span className="text-white font-semibold">990 possible combinations.</span> Can you track that in your head?
          </p>
        </div>
      </div>
    </Slide>
  )
}

export function PayAccuracy_Slide3() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Mistakes Happen</h2>
        <div className="text-slate-500">3/5</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-6">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-orange-400 mt-1" size={24} />
              <div>
                <div className="font-semibold text-lg">Wrong differential applied</div>
                <div className="text-slate-400 mt-1">Job coded to wrong pay class</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-orange-400 mt-1" size={24} />
              <div>
                <div className="font-semibold text-lg">Weekend coded as weekday</div>
                <div className="text-slate-400 mt-1">Saturday rate vs Friday rate</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-orange-400 mt-1" size={24} />
              <div>
                <div className="font-semibold text-lg">Hours entered incorrectly</div>
                <div className="text-slate-400 mt-1">9-hour terminals coded as 8</div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-lg mt-8">
          Not malicious. Just complicated. But you're the one who loses.
        </p>
      </div>
    </Slide>
  )
}

export function PayAccuracy_Slide4() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Small Errors Add Up</h2>
        <div className="text-slate-500">4/5</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-12">
          <div className="text-slate-400 mb-4">A single missed differential:</div>
          <div className="text-6xl font-bold text-orange-400">
            <SmallDiscrepancy amount={34} />
          </div>
          <div className="text-slate-500 mt-2">Easy to miss. Easy to let slide.</div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-800 rounded-xl">
            <span className="text-slate-400">Happens once a month?</span>
            <span className="font-bold">10+ per year</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-slate-800 rounded-xl">
            <span className="text-slate-400">Over a 30-year career?</span>
            <span className="font-bold">300+ occurrences</span>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
          <p className="text-blue-300">
            The question isn't whether errors happen.
            <br />
            <span className="text-white font-semibold">It's whether you catch them.</span>
          </p>
        </div>
      </div>
    </Slide>
  )
}

export function PayAccuracy_Slide5() {
  return (
    <Slide variant="gradient">
      <Logo size="lg" />

      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-5xl font-bold mb-4">One App That Knows The Rules</h1>
        <p className="text-2xl text-blue-200 mb-12">
          Log your shift. We check the math.
        </p>

        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 rounded-2xl p-6">
            <Clock className="mx-auto mb-3" size={32} />
            <div className="font-bold">30 Seconds</div>
            <div className="text-blue-200 text-sm mt-1">To log a shift</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6">
            <Shield className="mx-auto mb-3" size={32} />
            <div className="font-bold">Every Rate</div>
            <div className="text-blue-200 text-sm mt-1">Already built in</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6">
            <Check className="mx-auto mb-3" size={32} />
            <div className="font-bold">Verified</div>
            <div className="text-blue-200 text-sm mt-1">Against your stub</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl text-2xl font-bold mx-auto">
          Get PORTPAL Free
          <ChevronRight size={28} />
        </div>
      </div>

      <div className="text-center text-blue-200">Link in bio</div>
    </Slide>
  )
}

// =============================================================================
// CAROUSEL 2: "Peace of Mind" (Pension - No Dollar Amounts)
// =============================================================================

export function PeaceOfMind_Slide1() {
  return (
    <Slide variant="navy">
      <Logo size="md" />

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-8">
          <Target size={40} className="text-blue-400" />
        </div>

        <h1 className="text-[56px] font-bold leading-tight">
          Will I Hit My
          <span className="text-blue-400"> Goal</span> This Year?
        </h1>

        <p className="text-2xl text-slate-400 mt-6">
          I used to stress about this every December.
        </p>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-xl">
        <span>Swipe</span>
        <ChevronRight size={28} />
      </div>
    </Slide>
  )
}

export function PeaceOfMind_Slide2() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">The Old Way</h2>
        <div className="text-slate-500">2/4</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <FileQuestion className="text-red-400" size={24} />
            </div>
            <div>
              <div className="font-semibold">Guessing</div>
              <div className="text-slate-400 text-sm">"I think I'm on track... maybe?"</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <FileQuestion className="text-red-400" size={24} />
            </div>
            <div>
              <div className="font-semibold">Mental math</div>
              <div className="text-slate-400 text-sm">Quick calculations in the truck</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <FileQuestion className="text-red-400" size={24} />
            </div>
            <div>
              <div className="font-semibold">December panic</div>
              <div className="text-slate-400 text-sm">"Wait, am I going to make it?"</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xl text-slate-400">
          Sound familiar?
        </div>
      </div>
    </Slide>
  )
}

export function PeaceOfMind_Slide3() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Now</h2>
        <div className="text-slate-500">3/4</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* Progress Display - NO dollar amounts */}
        <div className="bg-slate-800 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-blue-400" size={28} />
            <span className="text-xl font-semibold">Annual Goal Progress</span>
          </div>

          <div className="text-6xl font-bold text-blue-400 mb-4">73%</div>

          <div className="h-4 bg-slate-700 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '73%' }} />
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Week 38 of 52</span>
            <span className="text-green-400">On track</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-lg">
            <Check className="text-green-400" size={24} />
            <span>Projected completion: <span className="font-bold">November</span></span>
          </div>
          <div className="flex items-center gap-3 text-lg">
            <Check className="text-green-400" size={24} />
            <span>Running <span className="font-bold">+4%</span> ahead of pace</span>
          </div>
        </div>
      </div>
    </Slide>
  )
}

export function PeaceOfMind_Slide4() {
  return (
    <Slide variant="gradient">
      <Logo size="lg" />

      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-5xl font-bold mb-4">Stop Wondering</h1>
        <h1 className="text-5xl font-bold mb-8">Start Knowing</h1>

        <p className="text-2xl text-blue-200 mb-12 max-w-[700px] mx-auto">
          Open the app. See where you stand. Plan time off without anxiety. Know you'll hit your goal.
        </p>

        <div className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl text-2xl font-bold mx-auto">
          Track Your Progress Free
          <ChevronRight size={28} />
        </div>
      </div>

      <div className="text-center text-blue-200">Link in bio</div>
    </Slide>
  )
}

// =============================================================================
// CAROUSEL 3: "The Time Problem"
// =============================================================================

export function TimeSavings_Slide1() {
  return (
    <Slide variant="navy">
      <Logo size="md" />

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mb-8">
          <Clock size={40} className="text-green-400" />
        </div>

        <h1 className="text-[56px] font-bold leading-tight">
          I Used To Spend
          <span className="text-green-400"> 20 Minutes</span> A Week On This
        </h1>

        <p className="text-2xl text-slate-400 mt-6">
          Spreadsheets. Calculators. Checking my math twice.
        </p>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-xl">
        <span>Swipe</span>
        <ChevronRight size={28} />
      </div>
    </Slide>
  )
}

export function TimeSavings_Slide2() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Now It's 30 Seconds</h2>
        <div className="text-slate-500">2/4</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-2xl font-bold">1</div>
            <div>
              <div className="text-xl font-semibold">Pick your job</div>
              <div className="text-slate-400">Tap from the list</div>
            </div>
            <div className="ml-auto text-slate-500">5 sec</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-2xl font-bold">2</div>
            <div>
              <div className="text-xl font-semibold">Pick location & shift</div>
              <div className="text-slate-400">Hours auto-fill</div>
            </div>
            <div className="ml-auto text-slate-500">10 sec</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-2xl font-bold">3</div>
            <div>
              <div className="text-xl font-semibold">Confirm & save</div>
              <div className="text-slate-400">Rate calculated automatically</div>
            </div>
            <div className="ml-auto text-slate-500">5 sec</div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-4">
          <Zap className="text-green-400" size={32} />
          <div>
            <div className="text-2xl font-bold">20 seconds total</div>
            <div className="text-slate-400">All rates built in. No math needed.</div>
          </div>
        </div>
      </div>
    </Slide>
  )
}

export function TimeSavings_Slide3() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Your Time Back</h2>
        <div className="text-slate-500">3/4</div>
      </div>

      <div className="flex-1 flex flex-col justify-center text-center">
        <div className="mb-8">
          <div className="text-slate-400 mb-2">Per week saved:</div>
          <div className="text-6xl font-bold text-green-400">18 minutes</div>
        </div>

        <div className="mb-8">
          <div className="text-slate-400 mb-2">Per year saved:</div>
          <div className="text-6xl font-bold text-green-400">15+ hours</div>
        </div>

        <p className="text-xl text-slate-400">
          Plus zero stress about whether you got the math right.
        </p>
      </div>
    </Slide>
  )
}

export function TimeSavings_Slide4() {
  return (
    <Slide variant="gradient">
      <Logo size="lg" />

      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-5xl font-bold mb-4">Your Time Is Worth</h1>
        <h1 className="text-5xl font-bold mb-8">More Than Data Entry</h1>

        <p className="text-2xl text-blue-200 mb-12">
          Stop doing math that an app can do better.
        </p>

        <div className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl text-2xl font-bold mx-auto">
          Get PORTPAL Free
          <ChevronRight size={28} />
        </div>
      </div>

      <div className="text-center text-blue-200">Link in bio</div>
    </Slide>
  )
}

// =============================================================================
// TIKTOK: The Discrepancy Catch (Short Story)
// =============================================================================

export function DiscrepancyCatch_TikTok() {
  return (
    <TikTokSlide variant="navy">
      <Logo size="sm" />

      <div className="flex-1 flex flex-col justify-center text-center px-8">
        <div className="text-slate-400 text-xl mb-4">Just happened:</div>

        <h1 className="text-[48px] font-bold leading-tight mb-8">
          Logged my shift.
          <br />
          App flagged something.
        </h1>

        <div className="bg-orange-500/20 border border-orange-500/30 rounded-2xl p-8 mb-8">
          <div className="text-slate-400 mb-2">Discrepancy found:</div>
          <div className="text-5xl font-bold text-orange-400">
            <SmallDiscrepancy amount={34} />
          </div>
          <div className="text-slate-400 mt-2">Wrong differential applied</div>
        </div>

        <p className="text-2xl text-slate-300 mb-8">
          Small error. Would've missed it.
        </p>

        <div className="text-xl text-slate-400">
          How many have you missed?
        </div>
      </div>

      <div className="text-center">
        <div className="text-blue-400 font-semibold text-lg">PORTPAL - Link in bio</div>
      </div>
    </TikTokSlide>
  )
}

// =============================================================================
// TIKTOK: The Progress Check
// =============================================================================

export function ProgressCheck_TikTok() {
  return (
    <TikTokSlide variant="navy">
      <Logo size="sm" />

      <div className="flex-1 flex flex-col justify-center text-center px-8">
        <div className="text-slate-400 text-xl mb-4">The question I used to dread:</div>

        <h1 className="text-[42px] font-bold leading-tight mb-12">
          "Will I hit my goal this year?"
        </h1>

        <div className="bg-slate-800 rounded-3xl p-8 mb-8">
          <div className="text-4xl font-bold text-blue-400 mb-4">67%</div>
          <div className="h-4 bg-slate-700 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '67%' }} />
          </div>
          <div className="flex items-center justify-center gap-2 text-green-400">
            <Check size={20} />
            <span>On track for November</span>
          </div>
        </div>

        <p className="text-2xl text-slate-300 mb-4">
          Now I just open the app.
        </p>
        <p className="text-xl text-slate-400">
          No guessing. No December panic.
        </p>
      </div>

      <div className="text-center">
        <div className="text-blue-400 font-semibold text-lg">PORTPAL - Link in bio</div>
      </div>
    </TikTokSlide>
  )
}

// Non-component exports (slide collections) are in RevisedCarouselsData.ts
// to satisfy react-refresh/only-export-components
