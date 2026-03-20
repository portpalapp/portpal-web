/**
 * SALARY TRANSPARENCY CAROUSEL
 * "What [JOB] Actually Pays" format
 *
 * Usage: Export each slide as a 1080x1350 PNG for Instagram carousel
 */

import {
  Slide,
  Logo,
  DataBadge,
  SourceBadge,
  JobRanking,
  StatCard,
  DifferentialRow,
} from '../components'
import { realData } from '../brand'
import { ChevronRight, TrendingUp, DollarSign } from 'lucide-react'

// =============================================================================
// VARIATION 1: Top Earning Jobs
// =============================================================================

export function SalaryCarousel1_Slide1() {
  return (
    <Slide variant="navy">
      <Logo size="md" />

      <div className="flex-1 flex flex-col justify-center">
        <DataBadge>
          <TrendingUp size={16} />
          Real data from {realData.totalShifts.toLocaleString()} shifts
        </DataBadge>

        <h1 className="text-[64px] font-bold leading-tight mt-8">
          What Longshoremen
          <span className="text-blue-400"> Actually</span> Make
        </h1>

        <p className="text-2xl text-slate-400 mt-6 max-w-[800px]">
          Not speculation. Not union propaganda. Real earnings from real shifts.
        </p>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-xl">
        <span>Swipe to see the breakdown</span>
        <ChevronRight size={28} />
      </div>
    </Slide>
  )
}

export function SalaryCarousel1_Slide2() {
  const topJobs = realData.topJobs.slice(0, 5)

  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-4xl font-bold">Top Earning Jobs</h2>
          <p className="text-slate-400 mt-2">Per shift, night Mon-Fri</p>
        </div>
        <div className="text-slate-500">2/5</div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {topJobs.map((job, i) => (
          <JobRanking
            key={job.job}
            rank={i + 1}
            job={job.job}
            amount={`$${job.perShift}`}
            detail={`$${job.hourly.toFixed(2)}/hr`}
            highlight={i === 0}
          />
        ))}
      </div>

      <SourceBadge />
    </Slide>
  )
}

export function SalaryCarousel1_Slide3() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Why The Difference?</h2>
        <div className="text-slate-500">3/5</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-2xl text-slate-300 mb-8">
          Job differentials add to your base rate. Here's the breakdown:
        </p>

        <div className="space-y-3">
          {realData.differentials.slice(0, 5).map((diff) => (
            <DifferentialRow
              key={diff.class}
              className={diff.class}
              amount={`+$${diff.amount.toFixed(2)}/hr`}
              jobs={diff.jobs}
              highlight={diff.class === 'CLASS_1'}
            />
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
          <p className="text-blue-300">
            <span className="font-bold">Class 1 jobs</span> add $2.50/hr to every rate.
            Over a career, that's $100k+ difference.
          </p>
        </div>
      </div>

      <SourceBadge />
    </Slide>
  )
}

export function SalaryCarousel1_Slide4() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Weekend Premium</h2>
        <div className="text-slate-500">4/5</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <StatCard
            value="$55.95"
            label="Weekday Day Rate"
            sublabel="TT, Mon-Fri"
            size="lg"
          />
          <StatCard
            value="$71.43"
            label="Saturday Day Rate"
            sublabel="Same job, +28%"
            variant="highlight"
            size="lg"
          />
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-400" size={32} />
            <div>
              <div className="text-2xl font-bold text-green-400">One Saturday = 1.3 Weekdays</div>
              <div className="text-slate-300">Same hours, more money</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-slate-400">
          <p className="text-lg">
            Sunday and all graveyard weekends pay <span className="text-white font-bold">$88.48/hr</span> base.
            That's 58% more than weekday day shift.
          </p>
        </div>
      </div>

      <SourceBadge />
    </Slide>
  )
}

export function SalaryCarousel1_Slide5() {
  return (
    <Slide variant="gradient">
      <Logo size="lg" />

      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-5xl font-bold mb-4">Know Your Numbers</h1>
        <p className="text-2xl text-blue-200 mb-12">Track every shift. Catch every dollar.</p>

        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold">{realData.totalShifts.toLocaleString()}</div>
            <div className="text-blue-200 mt-2">Shifts Analyzed</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold">{realData.totalJobs}</div>
            <div className="text-blue-200 mt-2">Job Types</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold">{realData.totalLocations}</div>
            <div className="text-blue-200 mt-2">Terminals</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl text-2xl font-bold mx-auto">
          Get PORTPAL Free
          <ChevronRight size={28} />
        </div>
      </div>

      <div className="text-center text-blue-200 text-lg">Link in bio</div>
    </Slide>
  )
}

// =============================================================================
// VARIATION 2: Pay Mistakes
// =============================================================================

export function PayMistakesCarousel_Slide1() {
  return (
    <Slide variant="navy">
      <Logo size="md" />

      <div className="flex-1 flex flex-col justify-center">
        <DataBadge>
          <span className="text-orange-400">Found in the data</span>
        </DataBadge>

        <h1 className="text-[64px] font-bold leading-tight mt-8">
          5 Ways You're
          <span className="text-orange-400"> Getting Shorted</span>
        </h1>

        <p className="text-2xl text-slate-400 mt-6">(and don't know it)</p>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-xl">
        <span>Swipe for the breakdown</span>
        <ChevronRight size={28} />
      </div>
    </Slide>
  )
}

export function PayMistakesCarousel_Slide2() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">#1: Wrong Differential</h2>
        <div className="text-slate-500">2/6</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 mb-8">
          <div className="text-xl text-slate-300 mb-4">
            TT coded as BASE instead of <span className="text-white font-bold">Class 3 (+$0.65/hr)</span>
          </div>
          <div className="text-5xl font-bold text-red-400">-$5.20 per shift</div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <StatCard
            value="200"
            label="Shifts/year"
            size="md"
          />
          <StatCard
            value="$1,040"
            label="Lost annually"
            variant="warning"
            size="md"
          />
        </div>

        <p className="text-slate-400 mt-8 text-lg">
          Over a 30-year career: <span className="text-white font-bold">$31,200</span> left on the table.
        </p>
      </div>

      <SourceBadge />
    </Slide>
  )
}

export function PayMistakesCarousel_Slide3() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">#2: Saturday → Friday</h2>
        <div className="text-slate-500">3/6</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 mb-8">
          <div className="text-xl text-slate-300 mb-4">
            Saturday shift coded as Friday
          </div>
          <div className="grid grid-cols-2 gap-8 mt-6">
            <div>
              <div className="text-slate-500 text-sm mb-1">Friday rate</div>
              <div className="text-3xl font-bold">$55.95/hr</div>
            </div>
            <div>
              <div className="text-slate-500 text-sm mb-1">Saturday rate</div>
              <div className="text-3xl font-bold text-green-400">$71.43/hr</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-6xl font-bold text-red-400 mb-2">-$123.84</div>
          <div className="text-xl text-slate-400">Per 8-hour shift</div>
        </div>

        <p className="text-slate-400 mt-8 text-lg text-center">
          20 Saturdays/year = <span className="text-white font-bold">$2,477</span> missing
        </p>
      </div>

      <SourceBadge />
    </Slide>
  )
}

// ... Additional slides follow same pattern

// =============================================================================
// VARIATION 3: Specific Job Deep Dive
// =============================================================================

export function TTDeepDiveCarousel_Slide1() {
  return (
    <Slide variant="navy">
      <Logo size="md" />

      <div className="flex-1 flex flex-col justify-center">
        <DataBadge>Tractor Trailer</DataBadge>

        <h1 className="text-[64px] font-bold leading-tight mt-8">
          The Complete
          <span className="text-blue-400"> TT Pay Guide</span>
        </h1>

        <p className="text-2xl text-slate-400 mt-6">
          Every rate. Every differential. Every location.
        </p>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-xl">
        <span>Swipe for the full breakdown</span>
        <ChevronRight size={28} />
      </div>
    </Slide>
  )
}

export function TTDeepDiveCarousel_Slide2() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Base Rates (Mon-Fri)</h2>
        <div className="text-slate-500">2/5</div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-6 text-center">
            <div className="text-amber-400 text-sm font-medium mb-2">DAY</div>
            <div className="text-4xl font-bold">$55.95</div>
            <div className="text-slate-400 text-sm mt-2">/hr</div>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-6 text-center">
            <div className="text-blue-400 text-sm font-medium mb-2">NIGHT</div>
            <div className="text-4xl font-bold">$70.32</div>
            <div className="text-slate-400 text-sm mt-2">/hr</div>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-6 text-center">
            <div className="text-purple-400 text-sm font-medium mb-2">GRAVEYARD</div>
            <div className="text-4xl font-bold">$86.70</div>
            <div className="text-slate-400 text-sm mt-2">/hr</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="text-slate-400 mb-2">Includes differential:</div>
          <div className="text-2xl font-bold">
            Class 3: <span className="text-green-400">+$0.65/hr</span>
          </div>
        </div>

        <p className="text-slate-400 text-lg">
          Graveyard pays <span className="text-white font-bold">55% more</span> than day shift.
          But with fewer hours (6.5 vs 8).
        </p>
      </div>

      <SourceBadge />
    </Slide>
  )
}

export function TTDeepDiveCarousel_Slide3() {
  return (
    <Slide variant="dark">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-4xl font-bold">Location Matters</h2>
        <div className="text-slate-500">3/5</div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xl text-slate-400 mb-8">
          Same job, same shift. Different hours by terminal:
        </p>

        <div className="space-y-4">
          <div className="bg-blue-600 rounded-2xl p-6 flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">CENTENNIAL</div>
              <div className="text-blue-200">Day & Night shifts</div>
            </div>
            <div className="text-4xl font-bold">9 hrs</div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">VANTERM / DELTAPORT</div>
              <div className="text-slate-400">Day & Night shifts</div>
            </div>
            <div className="text-4xl font-bold">8 hrs</div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl">
          <div className="text-xl">
            That extra hour at Centennial = <span className="text-green-400 font-bold">$70.32 more</span> per night shift
          </div>
        </div>
      </div>

      <SourceBadge />
    </Slide>
  )
}

// Export all for use in preview/render system
export const SalaryCarousels = {
  topJobs: [
    SalaryCarousel1_Slide1,
    SalaryCarousel1_Slide2,
    SalaryCarousel1_Slide3,
    SalaryCarousel1_Slide4,
    SalaryCarousel1_Slide5,
  ],
  payMistakes: [
    PayMistakesCarousel_Slide1,
    PayMistakesCarousel_Slide2,
    PayMistakesCarousel_Slide3,
    // Add remaining slides
  ],
  ttDeepDive: [
    TTDeepDiveCarousel_Slide1,
    TTDeepDiveCarousel_Slide2,
    TTDeepDiveCarousel_Slide3,
    // Add remaining slides
  ],
}
