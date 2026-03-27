import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Flag,
  CheckCircle,
  AlertCircle,
  Info,
  Timer,
  GitBranch,
  DollarSign,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  Minus,
  Plus,
  Lightbulb,
  Calendar,
  Gift,
  Plane,
} from 'lucide-react';
import { useShifts } from '../hooks/useShifts';
import { calculateYTDEarnings } from '../data/mockData';
import {
  PENSION_2026,
  SER_RULES,
  BRIDGE,
  RETIRING_ALLOWANCE,
  GOVT_BENEFITS,
  RETIREMENT_SCENARIOS,
  estimatePension,
  calculateBridge,
  getPensionYearProgress,
} from '../data/pensionData';

type PensionTab = 'overview' | 'calculator' | 'planner' | 'rules';

// Read saved pension planner settings from localStorage (called once at init)
function loadPensionPlan(): {
  shiftsPerWeek: number;
  avgPay: string;
  workWeekends: boolean;
  workHolidays: boolean;
  monthOff: boolean;
  monthsOff: number;
  preferredShift: 'DAY' | 'NIGHT' | 'GRAVEYARD' | 'MIX';
  goalDate: string;
  goalAmount: string;
  calcAge: number;
  calcYears: number;
} | null {
  try {
    const stored = localStorage.getItem('portpal_pension_plan');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore parse errors */ }
  return null;
}

export function Pension() {
  const navigate = useNavigate();
  const { shifts } = useShifts();
  const [tab, setTab] = useState<PensionTab>('overview');

  // Load saved planner settings via lazy initializers (no useEffect cascade)
  const saved = useMemo(() => loadPensionPlan(), []);
  const [calcAge, setCalcAge] = useState(() => saved?.calcAge ?? 62);
  const [calcYears, setCalcYears] = useState(() => saved?.calcYears ?? 25);

  // Planner state
  const [planShiftsPerWeek, setPlanShiftsPerWeek] = useState(() => saved?.shiftsPerWeek ?? 4);
  const [planAvgPay, setPlanAvgPay] = useState(() => saved?.avgPay ?? '');
  const [planWorkWeekends, setPlanWorkWeekends] = useState(() => saved?.workWeekends ?? false);
  const [planWorkHolidays, setPlanWorkHolidays] = useState(() => saved?.workHolidays ?? false);
  const [planMonthOff, setPlanMonthOff] = useState(() => saved?.monthOff ?? true);
  const [planMonthsOff, setPlanMonthsOff] = useState(() => saved?.monthsOff ?? 1);
  const [planPreferredShift, setPlanPreferredShift] = useState<'DAY' | 'NIGHT' | 'GRAVEYARD' | 'MIX'>(() => saved?.preferredShift ?? 'MIX');
  const [planGoalDate, setPlanGoalDate] = useState(() => saved?.goalDate ?? '');
  const [planGoalAmount, setPlanGoalAmount] = useState(() => saved?.goalAmount ?? PENSION_2026.earningsLimit.toString());
  const [planLoaded] = useState(true);

  // Auto-save planner settings whenever they change
  useEffect(() => {
    if (!planLoaded) return;
    try {
      localStorage.setItem('portpal_pension_plan', JSON.stringify({
        shiftsPerWeek: planShiftsPerWeek,
        avgPay: planAvgPay,
        workWeekends: planWorkWeekends,
        workHolidays: planWorkHolidays,
        monthOff: planMonthOff,
        monthsOff: planMonthsOff,
        preferredShift: planPreferredShift,
        goalDate: planGoalDate,
        goalAmount: planGoalAmount,
        calcAge,
        calcYears,
      }));
    } catch { /* ignore */ }
  }, [planLoaded, planShiftsPerWeek, planAvgPay, planWorkWeekends, planWorkHolidays, planMonthOff, planMonthsOff, planPreferredShift, planGoalDate, planGoalAmount, calcAge, calcYears]);

  const ytdEarnings = calculateYTDEarnings(shifts);
  const progress = getPensionYearProgress(ytdEarnings);

  const calcResult = useMemo(() => {
    const pension = estimatePension(calcAge, calcYears);
    const bridge = calculateBridge(calcYears, calcAge);
    let cpp = 0;
    if (calcAge >= 65) cpp = GOVT_BENEFITS.cppMax65;
    else if (calcAge >= 62) cpp = GOVT_BENEFITS.cppMax62;
    else if (calcAge >= 60) cpp = GOVT_BENEFITS.cppMax60;
    const oas = calcAge >= 65 ? GOVT_BENEFITS.oasMax65 : 0;
    return { pension, bridge, cpp, oas, total: pension + bridge + cpp + oas };
  }, [calcAge, calcYears]);

  const tabStyle = (t: PensionTab) =>
    `px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors ${
      tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center px-4 py-3 gap-3">
        <button onClick={() => navigate(-1)} className="hover:opacity-70">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <div className="flex-1">
          <span className="text-lg font-bold text-slate-800">Pension</span>
          <p className="text-xs text-slate-500">Waterfront Industry Pension Plan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-3">
        {(['overview', 'planner', 'calculator', 'rules'] as PensionTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tabStyle(t)}>
            {t === 'overview' ? 'Overview' : t === 'planner' ? 'Planner' : t === 'calculator' ? 'Calculator' : 'Rules'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {tab === 'overview' && (
          <>
            {/* Pension Year Progress */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flag size={18} className="text-blue-600" />
                  <span className="font-semibold text-slate-800">Pension Year Earnings</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">
                    ${ytdEarnings.toLocaleString()}
                  </span>
                  <p className="text-xs text-slate-500">
                    of ${progress.limit.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${progress.qualifiesFull ? 'bg-green-500' : progress.qualifiesPartial ? 'bg-blue-500' : 'bg-orange-400'}`}
                  style={{ width: `${Math.min(progress.pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-500">{progress.pct.toFixed(1)}% complete</span>
                <span className={`text-xs font-medium ${progress.qualifiesFull ? 'text-green-600' : progress.qualifiesPartial ? 'text-blue-600' : 'text-orange-500'}`}>
                  {progress.qualifiesFull
                    ? 'Full Year Qualified'
                    : progress.qualifiesPartial
                      ? 'Partial Year Qualified'
                      : `$${(progress.partial - ytdEarnings).toLocaleString()} to partial year`}
                </span>
              </div>
            </div>

            {/* Key Numbers for 2026 */}
            <p className="text-sm font-semibold text-slate-700 mb-2">2026 Key Numbers</p>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-blue-50 rounded-2xl p-3 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">Pension Rate</p>
                <p className="text-lg font-bold text-blue-700">${PENSION_2026.ratePerMonth}</p>
                <p className="text-xs text-slate-500">/month per year</p>
              </div>
              <div className="flex-1 bg-green-50 rounded-2xl p-3 border border-green-100">
                <p className="text-xs text-green-600 font-medium">Max Pension</p>
                <p className="text-lg font-bold text-green-700">${PENSION_2026.maxMonthlyPension.toLocaleString()}</p>
                <p className="text-xs text-slate-500">/month (35 yrs)</p>
              </div>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-purple-50 rounded-2xl p-3 border border-purple-100">
                <p className="text-xs text-purple-600 font-medium">Earnings Limit</p>
                <p className="text-lg font-bold text-purple-700">${PENSION_2026.earningsLimit.toLocaleString()}</p>
                <p className="text-xs text-slate-500">full pension year</p>
              </div>
              <div className="flex-1 bg-amber-50 rounded-2xl p-3 border border-amber-100">
                <p className="text-xs text-amber-600 font-medium">Contribution</p>
                <p className="text-lg font-bold text-amber-700">${PENSION_2026.employeeContribution.toLocaleString()}</p>
                <p className="text-xs text-slate-500">/year employee</p>
              </div>
            </div>

            {/* Retirement Scenarios */}
            <p className="text-sm font-semibold text-slate-700 mb-2">Retirement Scenarios</p>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
              {/* Header */}
              <div className="flex bg-slate-700 px-3 py-2">
                <span className="text-xs font-medium text-white w-10">Age</span>
                <span className="text-xs font-medium text-white w-10">Yrs</span>
                <span className="text-xs font-medium text-white flex-1 text-right">Pension</span>
                <span className="text-xs font-medium text-white flex-1 text-right">Bridge</span>
                <span className="text-xs font-medium text-white flex-1 text-right">Total</span>
              </div>
              {RETIREMENT_SCENARIOS.map((s, i) => (
                <div
                  key={i}
                  className={`flex px-3 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                >
                  <span className="text-xs text-slate-700 w-10 font-medium">{s.age}</span>
                  <span className="text-xs text-slate-600 w-10">{s.years}</span>
                  <span className="text-xs text-slate-700 flex-1 text-right">${s.pension.toLocaleString()}</span>
                  <span className="text-xs text-slate-600 flex-1 text-right">
                    {s.bridge > 0 ? `$${s.bridge.toLocaleString()}` : '-'}
                  </span>
                  <span className="text-xs text-blue-700 font-semibold flex-1 text-right">
                    ${s.total.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="px-3 py-2 bg-slate-100">
                <span className="text-xs text-slate-500">Total includes CPP + OAS where applicable</span>
              </div>
            </div>

            {/* Service Years Upload Placeholder */}
            <div className="bg-slate-100 rounded-2xl p-4 flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FileText size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-slate-800">Upload Service Years History</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Get your statement from the employer to track your credited years
                </p>
              </div>
              <div className="bg-blue-600 px-3 py-1.5 rounded-full">
                <span className="text-xs font-medium text-white">Coming Soon</span>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <span className="font-semibold text-blue-800 mb-1 block">Pension Questions?</span>
              <p className="text-xs text-blue-700 mb-2">
                Contact the Pension Office for your individual situation.
              </p>
              <div className="flex gap-3">
                <a
                  href="tel:6046897184"
                  className="flex-1 bg-blue-600 rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Phone size={16} className="text-white" />
                  <span className="text-white text-sm font-medium">(604) 689-7184</span>
                </a>
                <a
                  href="mailto:pensions@webc.ca"
                  className="flex-1 bg-white rounded-xl py-2.5 flex items-center justify-center gap-2 border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <Mail size={16} className="text-blue-600" />
                  <span className="text-blue-600 text-sm font-medium">Email</span>
                </a>
              </div>
            </div>
          </>
        )}

        {tab === 'planner' && (() => {
          // Calculate current pace from actual shifts
          const pensionYearStart = new Date('2026-01-04');
          const now = new Date();
          const daysSinceStart = Math.max(1, Math.round((now.getTime() - pensionYearStart.getTime()) / 86400000));
          const weeksSinceStart = daysSinceStart / 7;
          const earningsPerWeek = weeksSinceStart > 0 ? ytdEarnings / weeksSinceStart : 0;
          const shiftsThisYear = shifts.filter(s => s.date.slice(0, 10) >= '2026-01-04').length;
          // Calculate average shift pay from actual data
          const actualAvgPay = shiftsThisYear > 0 ? ytdEarnings / shiftsThisYear : 550;
          const avgPayToUse = planAvgPay ? parseFloat(planAvgPay) : actualAvgPay;

          // Shift pay modifiers based on shift type preference
          const shiftMultiplier = planPreferredShift === 'NIGHT' ? 1.26 : planPreferredShift === 'GRAVEYARD' ? 1.56 : planPreferredShift === 'DAY' ? 1.0 : 1.15;
          const weekendBonus = planWorkWeekends ? avgPayToUse * 0.28 * 1.5 : 0;
          const holidayBonus = planWorkHolidays ? avgPayToUse * 2.0 * (11 / 52) : 0;

          // Work weeks per year
          const workWeeksPerYear = 52 - (planMonthOff ? planMonthsOff * 4.33 : 0);

          // Projected weekly earnings
          const projectedWeeklyEarnings = (planShiftsPerWeek * avgPayToUse * shiftMultiplier) + weekendBonus + holidayBonus;
          const projectedAnnualEarnings = projectedWeeklyEarnings * workWeeksPerYear;

          // Goal calculations
          const goalAmount = parseFloat(planGoalAmount) || PENSION_2026.earningsLimit;
          const remaining = Math.max(0, goalAmount - ytdEarnings);
          const weeksToGoal = projectedWeeklyEarnings > 0 ? remaining / projectedWeeklyEarnings : Infinity;
          const projectedGoalDate = new Date(now);
          projectedGoalDate.setDate(projectedGoalDate.getDate() + Math.ceil(weeksToGoal * 7));

          // Check if user-set goal date is feasible
          const goalDateObj = planGoalDate ? new Date(planGoalDate + 'T00:00:00') : null;
          const weeksUntilGoalDate = goalDateObj ? Math.max(0, (goalDateObj.getTime() - now.getTime()) / (7 * 86400000)) : null;
          const requiredWeeklyForGoalDate = weeksUntilGoalDate && weeksUntilGoalDate > 0 ? remaining / weeksUntilGoalDate : null;
          const requiredShiftsForGoalDate = requiredWeeklyForGoalDate && avgPayToUse > 0 ? requiredWeeklyForGoalDate / (avgPayToUse * shiftMultiplier) : null;

          // Current pace projection
          const paceAnnualProjection = earningsPerWeek * 52;
          const onTrack = paceAnnualProjection >= goalAmount;

          // Pension year end
          const pensionYearEnd = new Date('2027-01-03');
          const weeksRemaining = Math.max(0, (pensionYearEnd.getTime() - now.getTime()) / (7 * 86400000));

          return (
            <>
              {/* Current Pace Card */}
              <div className={`rounded-2xl p-4 mb-4 ${onTrack ? 'bg-green-600' : 'bg-orange-500'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {onTrack ? (
                    <CheckCircle size={20} className="text-white" />
                  ) : (
                    <AlertCircle size={20} className="text-white" />
                  )}
                  <span className="font-semibold text-white text-base">
                    {onTrack ? 'On Track' : 'Behind Pace'}
                  </span>
                </div>
                <p className="text-white/90 text-sm mb-3">
                  At your current pace of ${Math.round(earningsPerWeek).toLocaleString()}/week, you'll earn ${Math.round(paceAnnualProjection).toLocaleString()} this pension year.
                </p>
                <div className="flex gap-3">
                  <div className="flex-1 bg-white/20 rounded-xl p-3">
                    <p className="text-white/70 text-xs">Earned</p>
                    <p className="text-white font-bold text-lg">${ytdEarnings.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 bg-white/20 rounded-xl p-3">
                    <p className="text-white/70 text-xs">Remaining</p>
                    <p className="text-white font-bold text-lg">${remaining.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 bg-white/20 rounded-xl p-3">
                    <p className="text-white/70 text-xs">Weeks Left</p>
                    <p className="text-white font-bold text-lg">{Math.round(weeksRemaining)}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Progress to Goal</span>
                  <span className="text-sm font-bold text-blue-600">{Math.min(100, (ytdEarnings / goalAmount * 100)).toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${onTrack ? 'bg-green-500' : 'bg-orange-400'}`}
                    style={{ width: `${Math.min(100, (ytdEarnings / goalAmount * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">${ytdEarnings.toLocaleString()}</span>
                  <span className="text-xs text-slate-500">${goalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Goal Settings */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <span className="font-semibold text-slate-800 mb-3 block">Your Goal</span>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Target Earnings ($)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-blue-400"
                      value={planGoalAmount}
                      onChange={(e) => setPlanGoalAmount(e.target.value)}
                      placeholder="120000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Target Date (YYYY-MM-DD)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-blue-400"
                      value={planGoalDate}
                      onChange={(e) => setPlanGoalDate(e.target.value)}
                      placeholder="2027-01-03"
                      maxLength={10}
                    />
                  </div>
                  {goalDateObj && requiredShiftsForGoalDate !== null && (
                    <div className={`rounded-xl p-3 ${requiredShiftsForGoalDate <= 5 ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                      <span className={`text-sm font-medium ${requiredShiftsForGoalDate <= 5 ? 'text-green-700' : 'text-orange-700'}`}>
                        {requiredShiftsForGoalDate <= 5
                          ? `Achievable -- you need ~${requiredShiftsForGoalDate.toFixed(1)} shifts/week ($${Math.round(requiredWeeklyForGoalDate!).toLocaleString()}/week)`
                          : `Tough -- you'd need ~${requiredShiftsForGoalDate.toFixed(1)} shifts/week ($${Math.round(requiredWeeklyForGoalDate!).toLocaleString()}/week)`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Plan Settings */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <span className="font-semibold text-slate-800 mb-3 block">Work Plan</span>
                <div className="flex flex-col gap-4">
                  {/* Shifts per week */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Shifts Per Week</p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setPlanShiftsPerWeek(Math.max(1, planShiftsPerWeek - 1))}
                        className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        <Minus size={18} className="text-slate-600" />
                      </button>
                      <span className="text-3xl font-bold text-blue-600">{planShiftsPerWeek}</span>
                      <button
                        onClick={() => setPlanShiftsPerWeek(Math.min(7, planShiftsPerWeek + 1))}
                        className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        <Plus size={18} className="text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Avg pay per shift */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      Avg Pay Per Shift {!planAvgPay && shiftsThisYear > 0 ? `(auto: $${Math.round(actualAvgPay)})` : ''}
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-blue-400"
                      value={planAvgPay}
                      onChange={(e) => setPlanAvgPay(e.target.value)}
                      placeholder={`${Math.round(actualAvgPay)}`}
                    />
                  </div>

                  {/* Preferred shift */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Preferred Shift</p>
                    <div className="flex gap-2">
                      {(['DAY', 'NIGHT', 'GRAVEYARD', 'MIX'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setPlanPreferredShift(s)}
                          className={`flex-1 py-2 rounded-xl text-center transition-colors ${
                            planPreferredShift === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span className="text-xs font-medium">
                            {s === 'MIX' ? 'Mix' : s.charAt(0) + s.slice(1).toLowerCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-slate-600" />
                      <span className="text-sm text-slate-700">Work weekends?</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planWorkWeekends}
                        onChange={(e) => setPlanWorkWeekends(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Gift size={18} className="text-slate-600" />
                      <span className="text-sm text-slate-700">Work stat holidays?</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planWorkHolidays}
                        onChange={(e) => setPlanWorkHolidays(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Plane size={18} className="text-slate-600" />
                      <span className="text-sm text-slate-700">Taking time off?</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planMonthOff}
                        onChange={(e) => setPlanMonthOff(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {planMonthOff && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">Months Off</p>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setPlanMonthsOff(Math.max(1, planMonthsOff - 1))}
                          className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          <Minus size={18} className="text-slate-600" />
                        </button>
                        <span className="text-2xl font-bold text-blue-600">{planMonthsOff}</span>
                        <button
                          onClick={() => setPlanMonthsOff(Math.min(6, planMonthsOff + 1))}
                          className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          <Plus size={18} className="text-slate-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Projection Results */}
              <div className="bg-slate-800 rounded-2xl p-4 mb-4">
                <span className="text-sm font-medium text-slate-300 mb-3 block">Your Projection</span>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Projected weekly</span>
                    <span className="text-base font-bold text-white">${Math.round(projectedWeeklyEarnings).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Projected annual</span>
                    <span className="text-base font-bold text-white">${Math.round(projectedAnnualEarnings).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Working weeks</span>
                    <span className="text-base font-bold text-white">{Math.round(workWeeksPerYear)}</span>
                  </div>

                  <div className="border-t border-slate-600 mt-1 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">Goal hit date</span>
                      <span className={`text-base font-bold ${weeksToGoal <= weeksRemaining ? 'text-green-400' : 'text-orange-400'}`}>
                        {weeksToGoal === Infinity
                          ? 'N/A'
                          : projectedGoalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {weeksToGoal !== Infinity && (
                      <p className={`text-xs mt-1 ${weeksToGoal <= weeksRemaining ? 'text-green-400' : 'text-orange-400'}`}>
                        {weeksToGoal <= weeksRemaining
                          ? `You'll hit your goal ${Math.round(weeksRemaining - weeksToGoal)} weeks early!`
                          : `You'll be ${Math.round(weeksToGoal - weeksRemaining)} weeks past the pension year end`}
                      </p>
                    )}
                  </div>

                  {/* Full pension year qualifier */}
                  <div className="border-t border-slate-600 mt-1 pt-3">
                    <div className="flex items-center gap-2">
                      {projectedAnnualEarnings >= PENSION_2026.earningsLimit ? (
                        <CheckCircle size={18} className="text-green-400" />
                      ) : (
                        <AlertCircle size={18} className="text-orange-400" />
                      )}
                      <span className="text-sm text-slate-300">
                        {projectedAnnualEarnings >= PENSION_2026.earningsLimit
                          ? 'Full pension year qualified'
                          : projectedAnnualEarnings >= PENSION_2026.partialThreshold
                            ? 'Partial pension year qualified'
                            : 'Not enough for pension year credit'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={18} className="text-blue-600" />
                  <span className="font-semibold text-blue-800">Tips to Hit Your Goal</span>
                </div>
                <div className="flex flex-col gap-2">
                  {!planWorkWeekends && (
                    <p className="text-sm text-blue-700">Weekend shifts pay 28%+ more -- toggling weekends on could add ${Math.round(avgPayToUse * 0.28 * 1.5 * workWeeksPerYear).toLocaleString()}/year</p>
                  )}
                  {planPreferredShift === 'DAY' && (
                    <p className="text-sm text-blue-700">Night shifts pay ~26% more, graveyard ~56% more than day shifts</p>
                  )}
                  {planMonthOff && planMonthsOff >= 2 && (
                    <p className="text-sm text-blue-700">Reducing time off by 1 month adds ~${Math.round(projectedWeeklyEarnings * 4.33).toLocaleString()} to your annual total</p>
                  )}
                  {planShiftsPerWeek < 5 && (
                    <p className="text-sm text-blue-700">Adding 1 more shift/week = +${Math.round(avgPayToUse * shiftMultiplier * workWeeksPerYear).toLocaleString()}/year</p>
                  )}
                  {!planWorkHolidays && (
                    <p className="text-sm text-blue-700">Stat holidays pay double time -- 11 holidays = ~${Math.round(avgPayToUse * 2.0 * 11).toLocaleString()} extra</p>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {tab === 'calculator' && (
          <>
            {/* Age Selector */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <span className="font-semibold text-slate-800 mb-3 block">Retirement Age</span>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCalcAge(Math.max(55, calcAge - 1))}
                  className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <Minus size={20} className="text-slate-600" />
                </button>
                <div className="text-center">
                  <span className="text-4xl font-bold text-blue-600 block">{calcAge}</span>
                  <span className="text-xs text-slate-500">years old</span>
                </div>
                <button
                  onClick={() => setCalcAge(Math.min(65, calcAge + 1))}
                  className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <Plus size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Years of Service Selector */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <span className="font-semibold text-slate-800 mb-3 block">Years of Service</span>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCalcYears(Math.max(10, calcYears - 1))}
                  className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <Minus size={20} className="text-slate-600" />
                </button>
                <div className="text-center">
                  <span className="text-4xl font-bold text-blue-600 block">{calcYears}</span>
                  <span className="text-xs text-slate-500">credited years</span>
                </div>
                <button
                  onClick={() => setCalcYears(Math.min(35, calcYears + 1))}
                  className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <Plus size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-slate-800 rounded-2xl p-4 mb-4">
              <span className="text-sm font-medium text-slate-300 mb-3 block">
                Estimated Monthly Income at Age {calcAge}
              </span>
              <span className="text-3xl font-bold text-white mb-4 block">
                ${calcResult.total.toLocaleString()}/mo
              </span>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-300">WIPP Pension</span>
                  <span className="text-sm font-medium text-white">${calcResult.pension.toLocaleString()}</span>
                </div>
                {calcResult.bridge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">Bridge Benefit</span>
                    <span className="text-sm font-medium text-white">${calcResult.bridge.toLocaleString()}</span>
                  </div>
                )}
                {calcResult.cpp > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">CPP (max)</span>
                    <span className="text-sm font-medium text-white">${calcResult.cpp.toLocaleString()}</span>
                  </div>
                )}
                {calcResult.oas > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">OAS (max)</span>
                    <span className="text-sm font-medium text-white">${calcResult.oas.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-slate-600 mt-1 pt-2 flex justify-between">
                  <span className="text-sm text-slate-300">Annual Total</span>
                  <span className="text-sm font-bold text-green-400">
                    ${(calcResult.total * 12).toLocaleString()}/yr
                  </span>
                </div>
              </div>
            </div>

            {/* SER Eligibility Check */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-2">
                {(calcAge >= 60 && calcYears >= 25) || (calcAge >= 55 && calcAge + calcYears >= 90) ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <AlertCircle size={20} className="text-red-500" />
                )}
                <span className="font-semibold text-slate-800">Special Early Retirement</span>
              </div>
              {(calcAge >= 60 && calcYears >= 25) || (calcAge >= 55 && calcAge + calcYears >= 90) ? (
                <p className="text-sm text-green-700">
                  You would qualify for SER with zero pension reduction at age {calcAge} with {calcYears} years.
                </p>
              ) : (
                <p className="text-sm text-slate-600">
                  Not eligible at age {calcAge} with {calcYears} years. Need age 60 + 25 years, or age + years {'>='} 90 (currently {calcAge + calcYears}).
                </p>
              )}
            </div>

            {/* Retiring Allowance */}
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <span className="font-semibold text-green-800 mb-1 block">Retiring Allowance (M&M)</span>
              {calcAge >= 55 && calcYears >= 25 ? (
                <>
                  <span className="text-2xl font-bold text-green-700 block">${RETIRING_ALLOWANCE.amount2025.toLocaleString()}</span>
                  <p className="text-xs text-green-600 mt-1">Lump sum payable upon retirement</p>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  Requires 25 years of service and age 55+. {calcYears < 25 ? `Need ${25 - calcYears} more years.` : `Need to reach age 55.`}
                </p>
              )}
            </div>
          </>
        )}

        {tab === 'rules' && (
          <>
            {/* WIPP Basics */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Info size={20} className="text-blue-600" />
                </div>
                <span className="font-semibold text-slate-800">WIPP Pension Basics</span>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-sm font-medium text-slate-700 block">How It Works</span>
                  <p className="text-sm text-slate-600 mt-1">
                    Your pension is calculated as ${PENSION_2026.ratePerMonth}/month for each year of credited service, up to {PENSION_2026.maxYears} years maximum. The pension comes with a 10-year minimum guarantee.
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 block">Earning a Pensionable Year</span>
                  <p className="text-sm text-slate-600 mt-1">
                    You need to earn ${PENSION_2026.earningsLimit.toLocaleString()} in a pension year (Jan 4 - Jan 3) for a full year of credited service. A minimum of 25% (${PENSION_2026.partialThreshold.toLocaleString()}) qualifies for a partial year.
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 block">Casual Years</span>
                  <p className="text-sm text-slate-600 mt-1">
                    Casual years below A Board are recognized once you become a union member. A Board service is recognized when you start making contributions.
                  </p>
                </div>
              </div>
            </div>

            {/* Special Early Retirement */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Timer size={20} className="text-green-600" />
                </div>
                <span className="font-semibold text-slate-800">Special Early Retirement (SER)</span>
              </div>
              <span className="text-sm text-green-700 font-medium mb-2 block">{SER_RULES.description}</span>
              <div className="flex flex-col gap-2">
                {SER_RULES.qualifications.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-sm text-green-600">{'>'}</span>
                    <p className="text-sm text-slate-600 flex-1">{q}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Early Retirement Bridge */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <GitBranch size={20} className="text-purple-600" />
                </div>
                <span className="font-semibold text-slate-800">Early Retirement Bridge</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{BRIDGE.description}</p>
              <div className="bg-purple-50 rounded-xl p-3 mb-2">
                <span className="text-sm text-purple-800">
                  ${BRIDGE.ratePerYear}/month per year of service (max {BRIDGE.maxYears25} years, or {BRIDGE.maxYears35} if you have 35+ pension years)
                </span>
              </div>
              <p className="text-xs text-slate-500">{BRIDGE.note}</p>
            </div>

            {/* Retiring Allowance */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <DollarSign size={20} className="text-amber-500" />
                </div>
                <span className="font-semibold text-slate-800">Retiring Allowance (M&M)</span>
              </div>
              <span className="text-2xl font-bold text-amber-700 mb-1 block">
                ${RETIRING_ALLOWANCE.amount2025.toLocaleString()}
              </span>
              <p className="text-sm text-slate-600">{RETIRING_ALLOWANCE.requirements}</p>
              <p className="text-xs text-slate-500 mt-1">{RETIRING_ALLOWANCE.note}</p>
            </div>

            {/* CPP & OAS */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <ShieldCheck size={20} className="text-red-500" />
                </div>
                <span className="font-semibold text-slate-800">Government Benefits</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-slate-600">CPP Maximum (age 65)</span>
                  <span className="text-sm font-medium text-slate-800">${GOVT_BENEFITS.cppMax65.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-slate-600">CPP Maximum (age 62)</span>
                  <span className="text-sm font-medium text-slate-800">${GOVT_BENEFITS.cppMax62.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-slate-600">CPP Maximum (age 60)</span>
                  <span className="text-sm font-medium text-slate-800">${GOVT_BENEFITS.cppMax60.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-slate-600">OAS Maximum (age 65)</span>
                  <span className="text-sm font-medium text-slate-800">${GOVT_BENEFITS.oasMax65.toLocaleString()}/mo</span>
                </div>
                <div className="bg-red-50 rounded-xl p-3 mt-1">
                  <p className="text-xs text-red-700">
                    CPP is reduced {GOVT_BENEFITS.cppReductionPerYear}% for every year taken before age 65 (max {GOVT_BENEFITS.cppMaxReduction}% reduction at age 60).
                  </p>
                </div>
              </div>
            </div>

            {/* Pension Trustees */}
            <div className="bg-slate-100 rounded-2xl p-4">
              <span className="font-semibold text-slate-700 mb-2 block">Pension Plan Trustees</span>
              <p className="text-sm text-slate-600">Bob Dhaliwal, ILWU Canada</p>
              <p className="text-sm text-slate-600">Andrew Gerard, Local 502</p>
              <p className="text-sm text-slate-600">Antonio Pantusa, Local 500</p>
              <p className="text-sm text-slate-600">Tom Dufresne, Pensioner Rep.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
