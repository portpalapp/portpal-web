import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Sun,
  Moon,
  CloudMoon,
  CheckCircle2,
  Briefcase,
  Info,
  Minus,
  Plus,
  Calculator,
  Bookmark,
  Check,
} from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import { JOBS } from '../data/mockData';

// ---------------------------------------------------------------------------
// Contract data — inline for web (matches mobile contractData.ts)
// ---------------------------------------------------------------------------

type ShiftType = 'DAY' | 'NIGHT' | 'GRAVEYARD';
type DayType = 'MON-FRI' | 'SAT' | 'SUN-HOL';

const STBR_BY_YEAR = [
  { year: 1, label: 'Year 1 (Apr 1 2023)', rate: 50.64 },
  { year: 2, label: 'Year 2 (Apr 1 2024)', rate: 53.17 },
  { year: 3, label: 'Year 3 (Apr 1 2025)', rate: 55.30 },
  { year: 4, label: 'Year 4 (Apr 1 2026)', rate: 57.51 },
];

const SHIFT_MULTIPLIERS: Record<string, Record<string, number>> = {
  DAY: { 'MON-FRI': 1.0, SAT: 1.28, 'SUN-HOL': 1.6 },
  NIGHT: { 'MON-FRI': 1.2598, SAT: 1.6, 'SUN-HOL': 1.6 },
  GRAVEYARD: { 'MON-FRI': 1.556, SAT: 1.6, 'SUN-HOL': 1.6 },
};

const DIFF_CLASSES = [
  { id: 'BASE', label: 'Base', amount: 0, jobs: 'LABOUR, BUNNY BUS, TRAINING, LINES, OB' },
  { id: 'CLASS_4', label: 'Class 4', amount: 0.50, jobs: 'LIFT TRUCK, DOCK CHECKER, FIRST AID, WHEAT MACHINE, WHEAT SPECIALTY' },
  { id: 'CLASS_3', label: 'Class 3', amount: 0.65, jobs: 'TRACTOR TRAILER, HEAD CHECKER, LOCI, REACHSTACKER, 40 TON (TOP PICK)' },
  { id: 'CLASS_2', label: 'Class 2', amount: 1.00, jobs: 'DOCK GANTRY, RUBBER TIRE GANTRY, SHIP GANTRY, RAIL MOUNTED GANTRY' },
  { id: 'CLASS_1', label: 'Class 1', amount: 2.50, jobs: 'HD MECHANIC, MILLWRIGHT, ELECTRICIAN, CARPENTER, PLUMBER, WELDER' },
];

const DAY_TYPES: { key: DayType; label: string }[] = [
  { key: 'MON-FRI', label: 'Mon-Fri' },
  { key: 'SAT', label: 'Saturday' },
  { key: 'SUN-HOL', label: 'Sun/Holiday' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TemplateBuilder() {
  const navigate = useNavigate();
  const { addTemplate } = useTemplates();

  // Step 1 -- Contract year (default Year 3 = current contract year 2025-2026)
  const [selectedYear, setSelectedYear] = useState(3);

  // Step 2 -- Job description
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [customJob, setCustomJob] = useState('');
  const [subJob, setSubJob] = useState('');
  const [showJobList, setShowJobList] = useState(true);

  // Step 3 -- Shift type
  const [shift, setShift] = useState<ShiftType>('DAY');

  // Step 4 -- Differential
  const [diffClass, setDiffClass] = useState('BASE');

  // Step 5 -- Hours
  const [regHours, setRegHours] = useState(8);
  const [otHours, setOtHours] = useState(0);

  // Save template
  const [templateName, setTemplateName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------

  const stbr = STBR_BY_YEAR.find((y) => y.year === selectedYear)!;
  const diff = DIFF_CLASSES.find((d) => d.id === diffClass)!;

  const calcRates = (dayType: DayType) => {
    const multiplier = SHIFT_MULTIPLIERS[shift][dayType];
    const baseAfterShift = stbr.rate * multiplier;
    const regRate = Math.round((baseAfterShift + diff.amount) * 100) / 100;
    const otRate = Math.round(regRate * 1.5 * 100) / 100;
    return { multiplier, regRate, otRate };
  };

  const monFriRates = calcRates('MON-FRI');
  const satRates = calcRates('SAT');
  const sunRates = calcRates('SUN-HOL');

  const regPay = Math.round(regHours * monFriRates.regRate * 100) / 100;
  const otPay = Math.round(otHours * monFriRates.otRate * 100) / 100;
  const totalPay = Math.round((regPay + otPay) * 100) / 100;

  const shiftLabel =
    shift === 'DAY' ? 'Day' : shift === 'NIGHT' ? 'Night' : 'Graveyard';

  const effectiveJob = selectedJob || customJob.trim() || 'Custom';

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a name for this template.');
      return;
    }

    setSaving(true);

    try {
      await addTemplate({
        name: templateName.trim(),
        job: effectiveJob,
        location: 'CUSTOM',
        shift,
        subjob: subJob.trim() || '',
      });

      // Also save calculation details to localStorage for shift logger
      const details = {
        name: templateName.trim(),
        year: selectedYear,
        stbr: stbr.rate,
        shift,
        job: effectiveJob,
        subjob: subJob.trim() || '',
        diffClass: diff.id,
        diffLabel: diff.label,
        diffAmount: diff.amount,
        rates: {
          'MON-FRI': { reg: monFriRates.regRate, ot: monFriRates.otRate },
          SAT: { reg: satRates.regRate, ot: satRates.otRate },
          'SUN-HOL': { reg: sunRates.regRate, ot: sunRates.otRate },
        },
        regHours,
        otHours,
        totalPay,
        createdAt: new Date().toISOString(),
      };

      const existing = localStorage.getItem('customTemplateDetails');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(details);
      localStorage.setItem('customTemplateDetails', JSON.stringify(list));

      alert(`Template "${templateName.trim()}" has been saved.`);
      navigate(-1);
    } catch {
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const shiftBg = (s: ShiftType, selected: boolean) => {
    if (!selected) return 'bg-white border border-slate-200';
    if (s === 'DAY') return 'bg-amber-400';
    if (s === 'NIGHT') return 'bg-blue-600';
    return 'bg-purple-600';
  };

  const shiftText = (s: ShiftType, selected: boolean) => {
    if (!selected) return 'text-slate-600';
    if (s === 'DAY') return 'text-amber-900';
    return 'text-white';
  };

  const ShiftIcon = ({ type, selected }: { type: ShiftType; selected: boolean }) => {
    const color = !selected ? '#94a3b8' : type === 'DAY' ? '#78350f' : '#ffffff';
    if (type === 'DAY') return <Sun size={18} color={color} />;
    if (type === 'NIGHT') return <Moon size={18} color={color} />;
    return <CloudMoon size={18} color={color} />;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={22} className="text-slate-600" />
          <span className="text-slate-600 text-sm">Back</span>
        </button>
        <span className="font-semibold text-slate-800 text-base">
          Shift Template Builder
        </span>
        <div className="w-14" />
      </div>

      <div className="overflow-y-auto px-4 pt-4 pb-8 max-w-2xl mx-auto">
        {/* ================================================================ */}
        {/* STEP 1 -- Contract Year                                         */}
        {/* ================================================================ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <span className="font-semibold text-slate-700">Contract Year</span>
          </div>

          <div className="flex gap-2">
            {STBR_BY_YEAR.map((y) => (
              <button
                key={y.year}
                onClick={() => setSelectedYear(y.year)}
                className={`flex-1 p-3 rounded-xl text-center transition-colors ${
                  selectedYear === y.year
                    ? 'bg-blue-600'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span
                  className={`text-xs font-medium block ${
                    selectedYear === y.year ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  Year {y.year}
                </span>
                <span
                  className={`text-sm font-bold mt-0.5 block ${
                    selectedYear === y.year ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  ${y.rate.toFixed(2)}
                </span>
                <span
                  className={`text-[10px] mt-0.5 block ${
                    selectedYear === y.year ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  Apr {2022 + y.year}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* STEP 2 -- Job Description                                       */}
        {/* ================================================================ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <span className="font-semibold text-slate-700">Job Description</span>
          </div>

          {/* Toggle: standard vs custom */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                setShowJobList(true);
                setCustomJob('');
              }}
              className={`flex-1 p-3 rounded-xl text-center transition-colors ${
                showJobList
                  ? 'bg-blue-600'
                  : 'bg-white border border-slate-200 hover:border-slate-300'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  showJobList ? 'text-white' : 'text-slate-600'
                }`}
              >
                Standard Job
              </span>
            </button>
            <button
              onClick={() => {
                setShowJobList(false);
                setSelectedJob(null);
              }}
              className={`flex-1 p-3 rounded-xl text-center transition-colors ${
                !showJobList
                  ? 'bg-blue-600'
                  : 'bg-white border border-slate-200 hover:border-slate-300'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  !showJobList ? 'text-white' : 'text-slate-600'
                }`}
              >
                Custom Job
              </span>
            </button>
          </div>

          {showJobList ? (
            /* Standard job picker */
            <div className="bg-white border border-slate-200 rounded-xl p-2 max-h-48 overflow-y-auto">
              {JOBS.map((job) => (
                <button
                  key={job}
                  onClick={() => setSelectedJob(job)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-colors ${
                    selectedJob === job ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        selectedJob === job
                          ? 'text-blue-700 font-semibold'
                          : 'text-slate-700'
                      }`}
                    >
                      {job}
                    </span>
                    {selectedJob === job && (
                      <CheckCircle2 size={18} className="text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Custom job input */
            <input
              type="text"
              placeholder="Enter job name"
              value={customJob}
              onChange={(e) => setCustomJob(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}

          {/* Sub-job (optional) */}
          <p className="text-xs font-medium text-slate-500 mt-3 mb-2">
            Sub-job (optional)
          </p>
          <input
            type="text"
            placeholder="e.g. RAIL (TT), SHIP (TT)"
            value={subJob}
            onChange={(e) => setSubJob(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Selected job display */}
          {(selectedJob || customJob.trim()) && (
            <div className="mt-3 bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <Briefcase size={16} className="text-slate-500" />
              <span className="text-xs text-slate-600 flex-1 font-medium">
                {effectiveJob}
                {subJob.trim() ? ` - ${subJob.trim()}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* STEP 3 -- Shift Type                                            */}
        {/* ================================================================ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <span className="font-semibold text-slate-700">Shift Type</span>
          </div>

          <div className="flex gap-2">
            {(['DAY', 'NIGHT', 'GRAVEYARD'] as ShiftType[]).map((s) => (
              <button
                key={s}
                onClick={() => setShift(s)}
                className={`flex-1 p-3 rounded-xl flex flex-col items-center transition-colors ${shiftBg(
                  s,
                  shift === s
                )}`}
              >
                <ShiftIcon type={s} selected={shift === s} />
                <span
                  className={`text-sm font-medium mt-1 ${shiftText(
                    s,
                    shift === s
                  )}`}
                >
                  {s}
                </span>
              </button>
            ))}
          </div>

          {/* Multiplier info for all day types */}
          <div className="mt-3 bg-slate-100 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <Info size={16} className="text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">
                {shiftLabel} shift multipliers
              </span>
            </div>
            {DAY_TYPES.map((d) => {
              const m = SHIFT_MULTIPLIERS[shift][d.key];
              return (
                <p key={d.key} className="text-xs text-slate-500 ml-6">
                  {d.label}: {m.toFixed(4)}x {'\u2192'} ${(stbr.rate * m).toFixed(2)}/hr base
                </p>
              );
            })}
          </div>
        </div>

        {/* ================================================================ */}
        {/* STEP 4 -- Skill Differential                                    */}
        {/* ================================================================ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">4</span>
            </div>
            <span className="font-semibold text-slate-700">Skill Differential</span>
          </div>

          <div className="space-y-2">
            {DIFF_CLASSES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDiffClass(d.id)}
                className={`w-full p-4 rounded-xl flex items-center transition-colors ${
                  diffClass === d.id
                    ? 'bg-blue-600'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Differential badge */}
                <div
                  className={`w-16 flex items-center justify-center rounded-lg py-2 mr-3 ${
                    diffClass === d.id ? 'bg-white/20' : 'bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-base font-bold ${
                      diffClass === d.id ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {d.amount === 0 ? '$0' : `+$${d.amount.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex-1 text-left">
                  <span
                    className={`font-semibold text-sm block ${
                      diffClass === d.id ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {d.label}
                  </span>
                  <span
                    className={`text-xs mt-0.5 block line-clamp-2 ${
                      diffClass === d.id ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {d.jobs}
                  </span>
                </div>

                {diffClass === d.id && (
                  <CheckCircle2 size={20} className="text-green-300" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* STEP 5 -- Hours                                                 */}
        {/* ================================================================ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">5</span>
            </div>
            <span className="font-semibold text-slate-700">Hours</span>
          </div>

          <div className="flex gap-4">
            {/* Regular Hours */}
            <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-3">
                Regular Hours
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setRegHours(Math.max(0, regHours - 0.5))}
                  className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <Minus size={20} className="text-slate-600" />
                </button>
                <span className="text-2xl font-bold text-slate-800">
                  {regHours}
                </span>
                <button
                  onClick={() => setRegHours(regHours + 0.5)}
                  className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <Plus size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* OT Hours */}
            <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-3">
                OT Hours
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setOtHours(Math.max(0, otHours - 0.5))}
                  className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <Minus size={20} className="text-slate-600" />
                </button>
                <span className="text-2xl font-bold text-orange-600">
                  {otHours}
                </span>
                <button
                  onClick={() => setOtHours(otHours + 0.5)}
                  className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <Plus size={20} className="text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Hours note */}
          <div className="mt-3 bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <Info size={16} className="text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500">
              Hours apply to all day types. You can edit individual shifts after saving.
            </span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* LIVE SUMMARY CARD                                               */}
        {/* ================================================================ */}
        <div className="bg-slate-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-slate-400" />
            <span className="font-semibold text-white">Pay Breakdown</span>
          </div>

          {/* Base info */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Base Rate</span>
              <span className="text-sm text-slate-300 font-medium">
                ${stbr.rate.toFixed(2)} (Year {selectedYear} STBR)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Shift</span>
              <span className="text-sm text-slate-300 font-medium">{shiftLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Differential</span>
              <span className="text-sm text-slate-300 font-medium">
                +${diff.amount.toFixed(2)} ({diff.label})
              </span>
            </div>
            {(selectedJob || customJob.trim()) && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Job</span>
                <span className="text-sm text-slate-300 font-medium">
                  {effectiveJob}
                  {subJob.trim() ? ` - ${subJob.trim()}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-600 mb-3" />

          {/* All day type rates table */}
          <div className="mb-3">
            <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">
              Rates by Day Type
            </p>

            {/* Table header */}
            <div className="flex mb-1.5">
              <div className="flex-1" />
              <div className="w-28 text-right">
                <span className="text-xs text-slate-500 font-medium">Reg/hr</span>
              </div>
              <div className="w-28 text-right">
                <span className="text-xs text-slate-500 font-medium">OT/hr</span>
              </div>
            </div>

            {/* Mon-Fri row */}
            <div className="flex py-1.5">
              <div className="flex-1">
                <span className="text-sm text-slate-300 font-medium">Mon-Fri</span>
              </div>
              <div className="w-28 text-right">
                <span className="text-sm text-white font-bold">
                  ${monFriRates.regRate.toFixed(2)}
                </span>
              </div>
              <div className="w-28 text-right">
                <span className="text-sm text-orange-300 font-bold">
                  ${monFriRates.otRate.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Saturday row */}
            <div className="flex py-1.5">
              <div className="flex-1">
                <span className="text-sm text-slate-300 font-medium">Saturday</span>
              </div>
              <div className="w-28 text-right">
                <span className="text-sm text-white font-bold">
                  ${satRates.regRate.toFixed(2)}
                </span>
              </div>
              <div className="w-28 text-right">
                <span className="text-sm text-orange-300 font-bold">
                  ${satRates.otRate.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Sun/Holiday row */}
            <div className="flex py-1.5">
              <div className="flex-1">
                <span className="text-sm text-slate-300 font-medium">Sun/Holiday</span>
              </div>
              <div className="w-28 text-right">
                <span className="text-sm text-white font-bold">
                  ${sunRates.regRate.toFixed(2)}
                </span>
              </div>
              <div className="w-28 text-right">
                <span className="text-sm text-orange-300 font-bold">
                  ${sunRates.otRate.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-600 mb-3" />

          {/* Pay estimate (Mon-Fri) */}
          <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">
            Mon-Fri Estimate
          </p>
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">
                {regHours} hrs reg x ${monFriRates.regRate.toFixed(2)}
              </span>
              <span className="text-sm text-slate-300 font-medium">
                ${regPay.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">
                {otHours} hrs OT x ${monFriRates.otRate.toFixed(2)}
              </span>
              <span className="text-sm text-slate-300 font-medium">
                ${otPay.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-600 mb-3" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-base text-white font-semibold">
              Total Pay (Mon-Fri)
            </span>
            <span className="text-2xl text-white font-bold">
              ${totalPay.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SAVE BUTTON                                                     */}
        {/* ================================================================ */}
        {!showNameInput ? (
          <button
            onClick={() => setShowNameInput(true)}
            className="w-full py-4 bg-blue-600 rounded-xl flex items-center justify-center gap-2 mb-4 hover:bg-blue-700 transition-colors"
          >
            <Bookmark size={20} className="text-white" />
            <span className="text-white font-semibold text-base">
              Save as Template
            </span>
          </button>
        ) : (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 mb-2">
              Template Name
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. Night TT Class 3"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                autoFocus
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNameInput(false);
                  setTemplateName('');
                }}
                className="flex-1 py-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <span className="text-slate-600 font-medium">Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex-1 py-3 bg-green-600 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors ${
                  saving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <Check size={18} className="text-white" />
                <span className="text-white font-medium">
                  {saving ? 'Saving...' : 'Save Template'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Info note at bottom */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-1">
                How this works
              </p>
              <p className="text-xs text-blue-700 leading-5">
                This template saves your pay rates for all day types (Mon-Fri,
                Saturday, Sunday/Holiday). The same hours and differential are
                applied across all days, with the base rate adjusted by shift
                multiplier. You can edit individual entries after logging a shift.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
