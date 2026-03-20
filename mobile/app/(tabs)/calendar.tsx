import { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getYear,
  setYear,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  getMonth,
  addYears,
  subYears,
} from 'date-fns';
import type { Shift } from '../../data/mockData';
import { useShifts } from '../../hooks/useShifts';
import {
  getJobColor,
  getJobIcon,
  getJobAccentHex,
  getShiftBarColor,
  getShiftDotColor,
} from '../../lib/shiftColors';

type ViewMode = 'week' | 'month' | 'year';

// ── Tax estimation helpers ───────────────────────────────────────────
// 2026 Canadian federal brackets
function calculateFederalTax(annualIncome: number): number {
  const brackets = [
    { limit: 57375, rate: 0.15 },
    { limit: 114750, rate: 0.205 },
    { limit: 158468, rate: 0.26 },
    { limit: 220000, rate: 0.29 },
    { limit: Infinity, rate: 0.33 },
  ];
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (annualIncome <= prev) break;
    const taxable = Math.min(annualIncome, b.limit) - prev;
    tax += taxable * b.rate;
    prev = b.limit;
  }
  return tax;
}

// 2026 BC provincial brackets
function calculateProvincialTax(annualIncome: number): number {
  const brackets = [
    { limit: 47937, rate: 0.0506 },
    { limit: 95875, rate: 0.077 },
    { limit: 110076, rate: 0.105 },
    { limit: 133664, rate: 0.1229 },
    { limit: 181232, rate: 0.147 },
    { limit: 252752, rate: 0.168 },
    { limit: Infinity, rate: 0.205 },
  ];
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (annualIncome <= prev) break;
    const taxable = Math.min(annualIncome, b.limit) - prev;
    tax += taxable * b.rate;
    prev = b.limit;
  }
  return tax;
}

function calculateCPP(annualIncome: number): number {
  const maxPensionableEarnings = 71300;
  const rate = 0.0595;
  return Math.min(annualIncome, maxPensionableEarnings) * rate;
}

function calculateEI(annualIncome: number): number {
  const maxInsurableEarnings = 65700;
  const rate = 0.0158;
  return Math.min(annualIncome, maxInsurableEarnings) * rate;
}

interface TaxBreakdown {
  gross: number;
  federal: number;
  provincial: number;
  cpp: number;
  ei: number;
  net: number;
}

function estimateWeeklyTax(weeklyGross: number): TaxBreakdown {
  const annualized = weeklyGross * 52;
  const federal = calculateFederalTax(annualized) / 52;
  const provincial = calculateProvincialTax(annualized) / 52;
  const cpp = calculateCPP(annualized) / 52;
  const ei = calculateEI(annualized) / 52;
  const net = weeklyGross - federal - provincial - cpp - ei;
  return { gross: weeklyGross, federal, provincial, cpp, ei, net };
}

// ── Memoized sub-components ─────────────────────────────────────────

interface MonthDayCellProps {
  day: Date;
  dayShifts: Shift[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onPress: (day: Date) => void;
}

const MonthDayCell = memo(function MonthDayCell({
  day,
  dayShifts,
  isCurrentMonth,
  isToday,
  isSelected,
  onPress,
}: MonthDayCellProps) {
  const primaryJob = dayShifts.length > 0 ? dayShifts[0].job : null;
  const jobColor = primaryJob ? getJobColor(primaryJob) : null;
  const jobIcon = primaryJob ? getJobIcon(primaryJob) : null;
  const jobAccent = primaryJob ? getJobAccentHex(primaryJob) : null;

  let cellBg = '';
  if (isSelected) {
    cellBg = 'bg-blue-600';
  } else if (dayShifts.length > 0 && isCurrentMonth) {
    cellBg = jobColor?.bg || '';
  } else if (isToday) {
    cellBg = 'bg-blue-50';
  }

  return (
    <Pressable
      onPress={() => onPress(day)}
      className={`w-[14.28%] p-1 items-center justify-center rounded-lg relative ${cellBg}`}
      style={{ height: 52 }}
    >
      <Text
        className={`text-sm font-medium ${
          isSelected
            ? 'text-white'
            : isToday
              ? 'text-blue-600'
              : isCurrentMonth
                ? 'text-slate-700'
                : 'text-slate-300'
        }`}
      >
        {format(day, 'd')}
      </Text>
      {dayShifts.length > 0 &&
        isCurrentMonth &&
        jobIcon &&
        jobAccent && (
          <View className="mt-0.5">
            <Ionicons
              name={jobIcon}
              size={11}
              color={isSelected ? '#ffffff' : jobAccent}
            />
          </View>
        )}
    </Pressable>
  );
});

interface WeekShiftItemProps {
  shift: Shift & { dayLabel: string };
}

const WeekShiftItem = memo(function WeekShiftItem({ shift: s }: WeekShiftItemProps) {
  return (
    <View className="bg-white rounded-xl p-3 border border-slate-100">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <View
            className={`w-2.5 h-2.5 rounded-full ${getShiftBarColor(s.shift)}`}
          />
          <Text className="text-sm font-semibold text-slate-800">
            {s.job}
          </Text>
        </View>
        <Text className="text-sm font-bold text-green-600">
          ${s.totalPay.toFixed(2)}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-slate-500">
          {s.dayLabel} · {s.shift.charAt(0) + s.shift.slice(1).toLowerCase()} · {s.location}
        </Text>
        <Text className="text-xs text-slate-400">
          {s.regHours}h{s.otHours > 0 ? ` + ${s.otHours} OT` : ''}
        </Text>
      </View>
      {s.subjob ? (
        <Text className="text-xs text-slate-400 mt-0.5">{s.subjob}</Text>
      ) : null}
      {s.attachments && s.attachments.length > 0 ? (
        <View className="flex-row gap-1.5 mt-1.5">
          {s.attachments.map((att, ai) => (
            /^image\//i.test(att.type) ? (
              <Image
                key={ai}
                source={{ uri: att.url }}
                className="w-6 h-6 rounded"
                resizeMode="cover"
              />
            ) : (
              <View
                key={ai}
                className="w-6 h-6 rounded bg-slate-100 items-center justify-center"
              >
                <Ionicons name="document-text-outline" size={14} color="#64748b" />
              </View>
            )
          ))}
        </View>
      ) : null}
    </View>
  );
});

// ── Main component ──────────────────────────────────────────────────
export default function Calendar() {
  const { shifts, loading } = useShifts();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Only refetch if data is stale (older than staleTime), not on every focus
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['shifts'], stale: true });
    }, [queryClient])
  );
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [taxExpanded, setTaxExpanded] = useState(false);

  const getShiftsForDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter((s) => s.date.slice(0, 10) === dateStr);
  }, [shifts]);

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getMonthDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startWeekDay = startOfWeek(start, { weekStartsOn: 0 });
    const days: Date[] = [];

    let day = startWeekDay;
    while (day <= end || days.length % 7 !== 0) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const navigateWeek = (direction: number) => {
    setCurrentDate(addDays(currentDate, direction * 7));
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1)
    );
  };

  const navigateYear = (direction: number) => {
    setCurrentDate(
      direction > 0 ? addYears(currentDate, 1) : subYears(currentDate, 1)
    );
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();

  // Pre-compute shifts for each month day to avoid repeated filtering in render
  const monthDayShiftsMap = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const day of monthDays) {
      const dateStr = format(day, 'yyyy-MM-dd');
      map.set(dateStr, shifts.filter((s) => s.date.slice(0, 10) === dateStr));
    }
    return map;
  }, [monthDays, shifts]);

  const onDayPress = useCallback((day: Date) => {
    setSelectedDate(day);
  }, []);

  const selectedShifts = selectedDate ? getShiftsForDate(selectedDate) : [];

  // Calculate week totals and collect all week shifts
  const weekShifts = useMemo(() => {
    const all: (Shift & { dayLabel: string })[] = [];
    for (const day of weekDays) {
      const dayShifts = getShiftsForDate(day);
      for (const s of dayShifts) {
        all.push({ ...s, dayLabel: format(day, 'EEE, MMM d') });
      }
    }
    return all;
  }, [weekDays, shifts]);

  const weekTotal = weekDays.reduce((sum, day) => {
    const dayShifts = getShiftsForDate(day);
    return sum + dayShifts.reduce((s, shift) => s + shift.totalPay, 0);
  }, 0);

  const weekHours = weekShifts.reduce((sum, s) => sum + s.regHours + s.otHours, 0);

  const taxBreakdown = useMemo(() => estimateWeeklyTax(weekTotal), [weekTotal]);

  // Year view data: shifts grouped by month
  const yearMonthData = useMemo(() => {
    const year = getYear(currentDate);
    const yearStart = startOfYear(setYear(new Date(), year));
    const yearEnd = endOfYear(yearStart);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return months.map((monthDate) => {
      const mStartStr = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const mEndStr = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      const monthShifts = shifts.filter((s) => {
        const dateStr = s.date.slice(0, 10);
        return dateStr >= mStartStr && dateStr <= mEndStr;
      });
      const totalEarnings = monthShifts.reduce(
        (sum, s) => sum + s.totalPay,
        0
      );
      const totalHours = monthShifts.reduce(
        (sum, s) => sum + s.regHours + s.otHours,
        0
      );
      return {
        date: monthDate,
        month: getMonth(monthDate),
        name: format(monthDate, 'MMM'),
        fullName: format(monthDate, 'MMMM'),
        shiftCount: monthShifts.length,
        totalEarnings,
        totalHours,
      };
    });
  }, [currentDate, shifts]);

  // Month view: get unique jobs for currently visible month
  const monthJobs = useMemo(() => {
    if (viewMode !== 'month') return [];
    const mStartStr = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const mEndStr = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    const jobSet = new Set<string>();
    shifts.forEach((s) => {
      const dateStr = s.date.slice(0, 10);
      if (dateStr >= mStartStr && dateStr <= mEndStr) {
        jobSet.add(s.job);
      }
    });
    return Array.from(jobSet).sort();
  }, [currentDate, shifts, viewMode]);

  // Month view: totals for the current month (use string comparison to avoid timezone issues)
  const monthTotals = useMemo(() => {
    if (viewMode !== 'month') return { earnings: 0, hours: 0, shiftCount: 0 };
    const mStartStr = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const mEndStr = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    const monthShifts = shifts.filter((s) => {
      const dateStr = s.date.slice(0, 10);
      return dateStr >= mStartStr && dateStr <= mEndStr;
    });
    return {
      earnings: monthShifts.reduce((sum, s) => sum + s.totalPay, 0),
      hours: monthShifts.reduce((sum, s) => sum + s.regHours + s.otHours, 0),
      shiftCount: monthShifts.length,
    };
  }, [currentDate, shifts, viewMode]);

  // Month view: weekly breakdown (weeks run Sun-Sat, string comparison for timezone safety)
  const monthWeekData = useMemo(() => {
    if (viewMode !== 'month') return [];
    const mStart = startOfMonth(currentDate);
    const mEnd = endOfMonth(currentDate);
    const mStartStr = format(mStart, 'yyyy-MM-dd');
    const mEndStr = format(mEnd, 'yyyy-MM-dd');
    let weekStart = startOfWeek(mStart, { weekStartsOn: 0 });
    const weeks: { weekNum: number; start: Date; end: Date; daysInWeek: number; shiftCount: number; earnings: number; hours: number }[] = [];
    let weekNum = 1;
    while (weekStart <= mEnd) {
      const weekEnd = addDays(weekStart, 6);
      const clampStart = weekStart < mStart ? mStart : weekStart;
      const clampEnd = weekEnd > mEnd ? mEnd : weekEnd;
      const clampStartStr = format(clampStart, 'yyyy-MM-dd');
      const clampEndStr = format(clampEnd, 'yyyy-MM-dd');
      const daysInWeek = Math.round((clampEnd.getTime() - clampStart.getTime()) / 86400000) + 1;
      const wShifts = shifts.filter((s) => {
        const dateStr = s.date.slice(0, 10);
        return dateStr >= clampStartStr && dateStr <= clampEndStr;
      });
      weeks.push({
        weekNum,
        start: clampStart,
        end: clampEnd,
        daysInWeek,
        shiftCount: wShifts.length,
        earnings: wShifts.reduce((sum, s) => sum + s.totalPay, 0),
        hours: wShifts.reduce((sum, s) => sum + s.regHours + s.otHours, 0),
      });
      weekStart = addDays(weekStart, 7);
      weekNum++;
    }
    return weeks;
  }, [currentDate, shifts, viewMode]);

  // Year view: totals for the whole year
  const yearTotals = useMemo(() => {
    if (viewMode !== 'year') return { earnings: 0, hours: 0, shiftCount: 0 };
    return yearMonthData.reduce(
      (acc, m) => ({
        earnings: acc.earnings + m.totalEarnings,
        hours: acc.hours + m.totalHours,
        shiftCount: acc.shiftCount + m.shiftCount,
      }),
      { earnings: 0, hours: 0, shiftCount: 0 }
    );
  }, [yearMonthData, viewMode]);

  // getShiftDotColor and getShiftBarColor imported from shared shiftColors module

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-slate-50 items-center justify-center"
        edges={['top']}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // ── Navigation title / subtitle logic ─────────────────────────────
  const getNavTitle = () => {
    if (viewMode === 'week') {
      return `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;
    }
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    return String(getYear(currentDate));
  };

  const handleNavigate = (direction: number) => {
    if (viewMode === 'week') navigateWeek(direction);
    else if (viewMode === 'month') navigateMonth(direction);
    else navigateYear(direction);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="p-4 pt-2">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-slate-800">Calendar</Text>
            <View className="flex-row items-center gap-1.5">
              {(['week', 'month', 'year'] as ViewMode[]).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-xl ${
                    viewMode === mode ? 'bg-blue-600' : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      viewMode === mode ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => handleNavigate(-1)}
              className="p-2 rounded-lg bg-slate-100"
            >
              <Ionicons name="chevron-back" size={20} color="#475569" />
            </Pressable>
            <View className="items-center">
              <Text className="font-semibold text-slate-800">
                {getNavTitle()}
              </Text>
              {viewMode === 'week' && (
                <Text className="text-xs text-slate-500">Pay Period Week</Text>
              )}
            </View>
            <Pressable
              onPress={() => handleNavigate(1)}
              className="p-2 rounded-lg bg-slate-100"
            >
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </Pressable>
          </View>

          {/* ── Week View ───────────────────────────────────────── */}
          {viewMode === 'week' && (
            <View className="gap-4">
              <View className="flex-row flex-wrap gap-1">
                {weekDays.map((day) => {
                  const dayShifts = getShiftsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected =
                    selectedDate !== null && isSameDay(day, selectedDate);

                  return (
                    <Pressable
                      key={day.toISOString()}
                      onPress={() => setSelectedDate(day)}
                      className={`flex-1 p-2 rounded-xl items-center ${
                        isSelected
                          ? 'bg-blue-600'
                          : isToday
                            ? 'bg-blue-50 border-2 border-blue-300'
                            : 'bg-white border border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          isSelected ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {format(day, 'EEE')}
                      </Text>
                      <Text
                        className={`text-lg font-bold ${
                          isSelected ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {format(day, 'd')}
                      </Text>
                      {dayShifts.length > 0 && (
                        <View className="flex-row justify-center gap-0.5 mt-1">
                          {dayShifts.slice(0, 3).map((s, i) => (
                            <View
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${getShiftDotColor(s.shift)}`}
                            />
                          ))}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Week Total */}
              <View className="bg-slate-800 rounded-xl p-4">
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-slate-300 text-xs">Week Total</Text>
                    <Text className="text-2xl font-bold text-white">
                      ${weekTotal.toFixed(2)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-slate-300 text-xs">{weekShifts.length} shifts</Text>
                    <Text className="text-lg font-semibold text-white">{weekHours}h</Text>
                  </View>
                </View>
              </View>

              {/* Week Shift List */}
              {weekShifts.length > 0 ? (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    This Week's Shifts
                  </Text>
                  {weekShifts.map((s, i) => (
                    <WeekShiftItem key={s.id || i} shift={s} />
                  ))}
                </View>
              ) : (
                <View className="bg-white rounded-xl p-6 items-center border border-slate-100">
                  <Ionicons name="calendar-outline" size={32} color="#cbd5e1" />
                  <Text className="text-slate-400 text-sm mt-2">No shifts logged this week</Text>
                </View>
              )}

              {/* Tax Estimate (collapsible) */}
              <View className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Pressable
                  onPress={() => setTaxExpanded(!taxExpanded)}
                  className="flex-row items-center justify-between p-4"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="calculator-outline"
                      size={18}
                      color="#475569"
                    />
                    <Text className="font-semibold text-slate-800">
                      Tax Breakdown
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-medium text-green-600">
                      ${taxBreakdown.net.toFixed(2)}
                    </Text>
                    <Ionicons
                      name={taxExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#475569"
                    />
                  </View>
                </Pressable>

                {taxExpanded && (
                  <View className="px-4 pb-4 gap-2 border-t border-slate-100 pt-3">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-600">
                        Gross Earnings
                      </Text>
                      <Text className="text-sm font-medium text-slate-800">
                        ${taxBreakdown.gross.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-600">
                        Federal Tax
                      </Text>
                      <Text className="text-sm font-medium text-red-500">
                        -${taxBreakdown.federal.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-600">
                        BC Provincial Tax
                      </Text>
                      <Text className="text-sm font-medium text-red-500">
                        -${taxBreakdown.provincial.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-600">CPP</Text>
                      <Text className="text-sm font-medium text-red-500">
                        -${taxBreakdown.cpp.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-600">EI</Text>
                      <Text className="text-sm font-medium text-red-500">
                        -${taxBreakdown.ei.toFixed(2)}
                      </Text>
                    </View>
                    <View className="h-px bg-slate-200 my-1" />
                    <View className="flex-row justify-between">
                      <Text className="text-sm font-semibold text-slate-800">
                        Estimated Take-Home
                      </Text>
                      <Text className="text-sm font-bold text-green-600">
                        ${taxBreakdown.net.toFixed(2)}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-400 mt-2">
                      Estimates based on 2026 Canadian federal & BC
                      provincial tax brackets. Actual amounts may vary.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── Month View ──────────────────────────────────────── */}
          {viewMode === 'month' && (
            <View className="gap-3">
              <View className="bg-white rounded-xl p-3">
                {/* Day-of-week headers */}
                <View className="flex-row flex-wrap mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <View key={i} className="w-[14.28%] items-center py-1">
                      <Text className="text-xs font-medium text-slate-400">
                        {d}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Month day grid — each cell is React.memo'd */}
                <View className="flex-row flex-wrap">
                  {monthDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayShifts = monthDayShiftsMap.get(dateStr) || [];
                    return (
                      <MonthDayCell
                        key={day.toISOString()}
                        day={day}
                        dayShifts={dayShifts}
                        isCurrentMonth={isSameMonth(day, currentDate)}
                        isToday={isSameDay(day, new Date())}
                        isSelected={selectedDate !== null && isSameDay(day, selectedDate)}
                        onPress={onDayPress}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Shift type legend */}
              <View className="bg-white rounded-xl p-3">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Shift Types</Text>
                <View className="flex-row gap-4">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-3 h-3 rounded-full bg-amber-400" />
                    <Text className="text-xs text-slate-600">Day</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-3 h-3 rounded-full bg-blue-600" />
                    <Text className="text-xs text-slate-600">Night</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-3 h-3 rounded-full bg-purple-600" />
                    <Text className="text-xs text-slate-600">Graveyard</Text>
                  </View>
                </View>
              </View>

              {/* Dynamic job legend for current month */}
              {monthJobs.length > 0 && (
                <View className="bg-white rounded-xl p-3">
                  <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Jobs This Month</Text>
                  <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                    {monthJobs.map((job) => {
                      const color = getJobColor(job);
                      const icon = getJobIcon(job);
                      const hex = getJobAccentHex(job);
                      return (
                        <View
                          key={job}
                          className="flex-row items-center gap-1"
                        >
                          <View
                            className={`w-2.5 h-2.5 rounded ${color.accent}`}
                          />
                          <Ionicons name={icon} size={10} color={hex} />
                          <Text className="text-xs text-slate-600">{job}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Monthly Summary */}
              <View className="bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-400 text-xs mb-1">{format(currentDate, 'MMMM yyyy')} Total</Text>
                <Text className="text-2xl font-bold text-white mb-2">
                  ${monthTotals.earnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
                <View className="flex-row gap-4">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                    <Text className="text-slate-300 text-sm">{monthTotals.hours.toFixed(1)} hrs</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                    <Text className="text-slate-300 text-sm">{monthTotals.shiftCount} shifts</Text>
                  </View>
                </View>
              </View>

              {/* Weekly Breakdown */}
              {monthWeekData.length > 0 && (
                <View className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <View className="px-4 py-3 border-b border-slate-100">
                    <Text className="font-semibold text-slate-800">Weekly Breakdown</Text>
                  </View>
                  {monthWeekData.map((week) => (
                    <View
                      key={week.weekNum}
                      className="px-4 py-3 border-b border-slate-50 flex-row items-center"
                    >
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="font-medium text-slate-800 text-sm">
                            Week {week.weekNum}
                          </Text>
                          {week.daysInWeek < 7 && (
                            <View className="px-1.5 py-0.5 bg-slate-100 rounded">
                              <Text className="text-[10px] text-slate-500">{week.daysInWeek} days</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs text-slate-400 mt-0.5">
                          {format(week.start, 'MMM d')} – {format(week.end, 'MMM d')}
                        </Text>
                      </View>
                      <View className="items-end mr-4">
                        <Text className="text-sm font-medium text-slate-500">
                          {week.shiftCount} shift{week.shiftCount !== 1 ? 's' : ''}
                        </Text>
                        <Text className="text-xs text-slate-400">{week.hours.toFixed(1)} hrs</Text>
                      </View>
                      <Text className="font-bold text-slate-800">
                        ${week.earnings.toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Year View ───────────────────────────────────────── */}
          {viewMode === 'year' && (
            <View className="gap-4">
              {/* Year Summary */}
              <View className="bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-400 text-xs mb-1">{getYear(currentDate)} Year Total</Text>
                <Text className="text-2xl font-bold text-white mb-2">
                  ${yearTotals.earnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
                <View className="flex-row gap-4">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                    <Text className="text-slate-300 text-sm">{yearTotals.hours.toFixed(1)} hrs</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                    <Text className="text-slate-300 text-sm">{yearTotals.shiftCount} shifts</Text>
                  </View>
                  {yearTotals.hours > 0 && (
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="trending-up" size={14} color="#94a3b8" />
                      <Text className="text-slate-300 text-sm">
                        ${(yearTotals.earnings / yearTotals.hours).toFixed(2)}/hr avg
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Month Cards Grid */}
              <View className="flex-row flex-wrap gap-2 justify-between">
                {yearMonthData.map((m) => {
                  const hasShifts = m.shiftCount > 0;
                  return (
                    <Pressable
                      key={m.month}
                      onPress={() => {
                        setCurrentDate(m.date);
                        setViewMode('month');
                      }}
                      className={`w-[31.5%] rounded-xl p-3 border ${
                        hasShifts
                          ? 'bg-white border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-semibold text-slate-800">
                          {m.name}
                        </Text>
                        {hasShifts && (
                          <View className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </View>
                      <Text className="text-xs text-slate-500">
                        {m.shiftCount} shift{m.shiftCount !== 1 ? 's' : ''}
                      </Text>
                      {hasShifts && (
                        <>
                          <Text className="text-xs font-medium text-green-600 mt-0.5">
                            ${m.totalEarnings.toFixed(0)}
                          </Text>
                          <Text className="text-[10px] text-slate-400 mt-0.5">
                            {m.totalHours.toFixed(1)} hrs
                          </Text>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Selected Day Detail ─────────────────────────────── */}
          {selectedDate && viewMode !== 'year' && (
            <View className="mt-4 bg-white rounded-xl p-4 border border-slate-200">
              <Text className="font-semibold text-slate-800 mb-3">
                {format(selectedDate, 'EEEE, MMMM d')}
              </Text>
              {selectedShifts.length > 0 ? (
                <View className="gap-2">
                  {selectedShifts.map((shift) => (
                    <View
                      key={shift.id}
                      className="flex-row items-center gap-3 p-3 bg-slate-50 rounded-lg"
                    >
                      <View
                        className={`w-1 h-12 rounded-full ${getShiftBarColor(shift.shift)}`}
                      />
                      <View className="flex-1">
                        <Text className="font-medium text-slate-800">
                          {shift.job}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          {shift.location} {'\u2022'} {shift.regHours}h +{' '}
                          {shift.otHours}h OT
                        </Text>
                      </View>
                      <Text className="font-bold text-slate-800">
                        ${shift.totalPay.toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-slate-500 text-sm text-center py-4">
                  No shifts logged
                </Text>
              )}
            </View>
          )}

          {/* ── Legend (shift types) ────────────────────────────── */}
          {viewMode === 'week' && (
            <View className="flex-row justify-center gap-4 mt-4">
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-amber-400" />
                <Text className="text-xs text-slate-500">Day</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-blue-600" />
                <Text className="text-xs text-slate-500">Night</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-purple-600" />
                <Text className="text-xs text-slate-500">Graveyard</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
