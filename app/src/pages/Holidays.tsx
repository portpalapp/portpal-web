import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Flag,
  CheckCircle,
  Clock,
  Briefcase,
  Info,
  DollarSign,
  PieChart,
  XCircle,
  AlertCircle,
  Plane,
  ChevronRight,
} from 'lucide-react';
import { useShifts } from '../hooks/useShifts';
import {
  STAT_HOLIDAYS_2026,
  STAT_PAY_RULES,
  daysUntil,
} from '../data/holidayData';
import { formatDateShort, formatDateCompact, getTodayStr } from '../lib/formatters';

type HolidayTab = 'upcoming' | 'rules';

export function Holidays() {
  const navigate = useNavigate();
  const { shifts } = useShifts();
  const [tab, setTab] = useState<HolidayTab>('upcoming');

  const tabStyle = (t: HolidayTab) =>
    `px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
      tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;

  // Count qualifying shifts in a counting period
  const countQualifyingShifts = (start: string, end: string): number => {
    return shifts.filter(
      (s) => s.date.slice(0, 10) >= start && s.date.slice(0, 10) <= end
    ).length;
  };

  // Determine today string for comparisons
  const todayStr = getTodayStr();

  // Split holidays into upcoming and past
  const holidayData = useMemo(() => {
    return STAT_HOLIDAYS_2026.map((h) => {
      const days = daysUntil(h.date);
      const isPast = h.date < todayStr;
      const qualifyingShifts = countQualifyingShifts(
        h.countingPeriodStart,
        h.countingPeriodEnd
      );
      return { ...h, days, isPast, qualifyingShifts };
    });
  }, [shifts, todayStr]);

  const formatDate = formatDateShort;
  const formatShortDate = formatDateCompact;

  const getStatusColor = (qualifyingShifts: number, isPast: boolean) => {
    if (isPast) return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400' };
    if (qualifyingShifts >= 15) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
    if (qualifyingShifts > 0) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' };
    return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500' };
  };

  const getPayEstimate = (qualifyingShifts: number) => {
    if (qualifyingShifts >= 15) return 'Full day (8hrs)';
    if (qualifyingShifts > 0) return `${qualifyingShifts}/20ths`;
    return 'No shifts yet';
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="hover:opacity-70">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Calendar size={22} className="text-blue-600" />
          <span className="text-lg font-bold text-slate-800">Stat Holidays</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3">
        <button onClick={() => setTab('upcoming')} className={tabStyle('upcoming')}>
          Upcoming
        </button>
        <button onClick={() => setTab('rules')} className={tabStyle('rules')}>
          Rules
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {tab === 'upcoming' && (
          <div className="flex flex-col gap-3">
            {holidayData.map((h, idx) => {
              const colors = getStatusColor(h.qualifyingShifts, h.isPast);
              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-4 border ${colors.bg} ${colors.border}`}
                  style={{ opacity: h.isPast ? 0.55 : 1 }}
                >
                  {/* Holiday name and countdown */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      {h.isPast ? (
                        <CheckCircle size={18} className="text-slate-400" />
                      ) : (
                        <Flag
                          size={18}
                          className={
                            h.qualifyingShifts >= 15
                              ? 'text-green-600'
                              : h.qualifyingShifts > 0
                                ? 'text-blue-600'
                                : 'text-slate-500'
                          }
                        />
                      )}
                      <span
                        className={`font-bold text-base truncate ${
                          h.isPast ? 'text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {h.name}
                      </span>
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-full ${
                        h.isPast
                          ? 'bg-slate-200'
                          : h.days <= 7
                            ? 'bg-red-100'
                            : h.days <= 30
                              ? 'bg-amber-100'
                              : 'bg-blue-100'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          h.isPast
                            ? 'text-slate-500'
                            : h.days <= 7
                              ? 'text-red-700'
                              : h.days <= 30
                                ? 'text-amber-700'
                                : 'text-blue-700'
                        }`}
                      >
                        {h.isPast ? 'Passed' : h.days === 0 ? 'Today' : `${h.days}d`}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <p className={`text-sm mb-2 ${h.isPast ? 'text-slate-400' : 'text-slate-600'}`}>
                    {formatDate(h.date)}
                  </p>

                  {/* Counting period and shifts */}
                  <div className={`rounded-xl p-3 ${h.isPast ? 'bg-slate-100' : 'bg-white/70'}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock size={14} className={h.isPast ? 'text-slate-400' : 'text-slate-500'} />
                      <span className={`text-xs font-medium ${h.isPast ? 'text-slate-400' : 'text-slate-500'}`}>
                        Counting Period: {formatShortDate(h.countingPeriodStart)} - {formatShortDate(h.countingPeriodEnd)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Briefcase
                          size={14}
                          className={
                            h.isPast
                              ? 'text-slate-400'
                              : h.qualifyingShifts >= 15
                                ? 'text-green-600'
                                : h.qualifyingShifts > 0
                                  ? 'text-blue-600'
                                  : 'text-slate-400'
                          }
                        />
                        <span className={`text-sm font-semibold ${colors.text}`}>
                          {h.qualifyingShifts} qualifying shift{h.qualifyingShifts !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div
                        className={`px-2 py-0.5 rounded-full ${
                          h.qualifyingShifts >= 15
                            ? 'bg-green-100'
                            : h.qualifyingShifts > 0
                              ? 'bg-blue-100'
                              : 'bg-slate-100'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${
                            h.qualifyingShifts >= 15
                              ? 'text-green-700'
                              : h.qualifyingShifts > 0
                                ? 'text-blue-700'
                                : 'text-slate-500'
                          }`}
                        >
                          {getPayEstimate(h.qualifyingShifts)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar for upcoming holidays */}
                    {!h.isPast && h.qualifyingShifts < 15 && (
                      <div className="mt-2">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              h.qualifyingShifts > 0 ? 'bg-blue-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${Math.min((h.qualifyingShifts / 15) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {15 - h.qualifyingShifts} more shift{15 - h.qualifyingShifts !== 1 ? 's' : ''} for full pay
                        </p>
                      </div>
                    )}

                    {/* Full pay indicator */}
                    {!h.isPast && h.qualifyingShifts >= 15 && (
                      <div className="flex items-center gap-1 mt-2">
                        <CheckCircle size={14} className="text-green-600" />
                        <span className="text-xs font-medium text-green-700">
                          You qualify for full stat pay!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'rules' && (
          <div className="flex flex-col gap-4">
            {/* How Stat Pay Works */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Info size={20} className="text-blue-600" />
                <span className="font-bold text-slate-800 text-base">How Stat Pay Works</span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{STAT_PAY_RULES.summary}</p>
              <div className="flex flex-col gap-2">
                {STAT_PAY_RULES.rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                    </div>
                    <p className="text-sm text-slate-700 flex-1">{rule}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pay Tiers */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={20} className="text-green-600" />
                <span className="font-bold text-slate-800 text-base">Pay Tiers</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="font-bold text-green-800">15+ shifts</span>
                  </div>
                  <p className="text-sm text-green-700">Full day's pay (8 hours at your regular rate)</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <PieChart size={16} className="text-blue-600" />
                    <span className="font-bold text-blue-800">1-14 shifts</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    1/20th of a full day's pay per shift worked. Example: 10 shifts = 10/20ths (half a day's pay).
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle size={16} className="text-slate-400" />
                    <span className="font-bold text-slate-600">0 shifts</span>
                  </div>
                  <p className="text-sm text-slate-500">No stat pay for this holiday.</p>
                </div>
              </div>
            </div>

            {/* Working on a Stat Holiday */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} className="text-amber-600" />
                <span className="font-bold text-amber-800 text-base">Working ON a Stat Holiday</span>
              </div>
              <p className="text-sm text-amber-700">{STAT_PAY_RULES.workingHolidayPay}</p>
            </div>

            {/* Vacation Rules */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Plane size={20} className="text-violet-500" />
                <span className="font-bold text-slate-800 text-base">Vacation Rules</span>
              </div>
              <div className="flex flex-col gap-2">
                {STAT_PAY_RULES.vacationRules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-violet-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700 flex-1">{rule}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Counting Period Explanation */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={20} className="text-slate-600" />
                <span className="font-bold text-slate-800 text-base">What is the Counting Period?</span>
              </div>
              <p className="text-sm text-slate-600 leading-5">
                The counting period is the 4 full weeks (Sunday to Saturday) immediately before the
                week in which the stat holiday falls. Any shifts you work during this window count
                toward your stat pay qualification. The more shifts you log, the more stat pay you
                receive -- up to a full day at 15+ shifts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
