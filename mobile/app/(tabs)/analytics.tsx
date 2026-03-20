import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import type { Shift } from '../../data/mockData';
import { useShifts } from '../../hooks/useShifts';
import { getShiftAccentHex } from '../../lib/shiftColors';

// --- Tax constants (2026 Canadian) ---
const FEDERAL_BRACKETS = [
  { limit: 57375, rate: 0.15 },
  { limit: 114750, rate: 0.205 },
  { limit: 158468, rate: 0.26 },
  { limit: 220000, rate: 0.29 },
  { limit: Infinity, rate: 0.33 },
];

const BC_BRACKETS = [
  { limit: 47937, rate: 0.0506 },
  { limit: 95875, rate: 0.077 },
  { limit: 110076, rate: 0.105 },
  { limit: 133664, rate: 0.1229 },
  { limit: 181232, rate: 0.147 },
  { limit: 252752, rate: 0.168 },
  { limit: Infinity, rate: 0.205 },
];

const CPP_RATE = 0.0595;
const CPP_MAX_EARNINGS = 71300;
const EI_RATE = 0.0158;
const EI_MAX_EARNINGS = 65700;

function calcBracketTax(income: number, brackets: { limit: number; rate: number }[]): number {
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income, limit) - prev;
    tax += taxable * rate;
    prev = limit;
  }
  return tax;
}

type TimeRange = 'week' | 'month' | 'year' | 'custom';

export default function AnalyticsScreen() {
  const { shifts, loading } = useShifts();
  const queryClient = useQueryClient();

  // Only refetch if data is stale (older than staleTime), not on every focus
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['shifts'], stale: true });
    }, [queryClient])
  );
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [taxExpanded, setTaxExpanded] = useState(false);

  // --- Filter shifts by time range ---
  const filteredShifts = useMemo(() => {
    const now = new Date();

    if (timeRange === 'week') {
      const start = startOfWeek(now, { weekStartsOn: 0 });
      const end = endOfWeek(now, { weekStartsOn: 0 });
      return shifts.filter((s) => {
        const d = parseISO(s.date);
        return isWithinInterval(d, { start, end });
      });
    }

    if (timeRange === 'month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return shifts.filter((s) => {
        const d = parseISO(s.date);
        return isWithinInterval(d, { start, end });
      });
    }

    if (timeRange === 'year') {
      const start = startOfYear(now);
      const end = endOfYear(now);
      return shifts.filter((s) => {
        const d = parseISO(s.date);
        return isWithinInterval(d, { start, end });
      });
    }

    // custom
    if (customStart && customEnd) {
      try {
        const start = parseISO(customStart);
        const end = parseISO(customEnd);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
          return shifts.filter((s) => {
            const d = parseISO(s.date);
            return isWithinInterval(d, { start, end });
          });
        }
      } catch {
        // invalid dates, return all
      }
    }
    return shifts;
  }, [shifts, timeRange, customStart, customEnd]);

  // --- Calculate stats from filtered shifts ---
  const totalEarnings = filteredShifts.reduce((sum, s) => sum + s.totalPay, 0);
  const totalHours = filteredShifts.reduce((sum, s) => sum + s.regHours + s.otHours, 0);
  const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

  // Location breakdown
  const locationStats = filteredShifts.reduce((acc, s) => {
    if (!acc[s.location]) acc[s.location] = { count: 0, earnings: 0 };
    acc[s.location].count++;
    acc[s.location].earnings += s.totalPay;
    return acc;
  }, {} as Record<string, { count: number; earnings: number }>);

  const locationData = Object.entries(locationStats)
    .map(([name, data]) => ({ name, fullName: name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxLocationEarnings = locationData.length > 0 ? locationData[0].earnings : 1;

  // Shift type breakdown
  const shiftStats = filteredShifts.reduce((acc, s) => {
    if (!acc[s.shift]) acc[s.shift] = 0;
    acc[s.shift]++;
    return acc;
  }, {} as Record<string, number>);

  const shiftData = [
    { name: 'Day', value: shiftStats['DAY'] || 0, color: getShiftAccentHex('DAY') },
    { name: 'Night', value: shiftStats['NIGHT'] || 0, color: getShiftAccentHex('NIGHT') },
    { name: 'Graveyard', value: shiftStats['GRAVEYARD'] || 0, color: getShiftAccentHex('GRAVEYARD') },
  ];

  const totalShiftCount = shiftData.reduce((sum, s) => sum + s.value, 0);

  // Job breakdown
  const jobStats = filteredShifts.reduce((acc, s) => {
    if (!acc[s.job]) acc[s.job] = { count: 0, earnings: 0 };
    acc[s.job].count++;
    acc[s.job].earnings += s.totalPay;
    return acc;
  }, {} as Record<string, { count: number; earnings: number }>);

  const jobData = Object.entries(jobStats)
    .map(([name, data]) => ({ name, fullName: name, ...data }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  // --- Tax estimation ---
  const taxEstimate = useMemo(() => {
    const gross = totalEarnings;
    if (gross <= 0) {
      return { gross: 0, federal: 0, provincial: 0, cpp: 0, ei: 0, net: 0, annualized: 0 };
    }

    // Determine annualized income and proration factor
    let annualized = gross;
    let prorateFactor = 1;

    if (timeRange === 'week') {
      annualized = gross * 52;
      prorateFactor = 1 / 52;
    } else if (timeRange === 'month') {
      annualized = gross * 12;
      prorateFactor = 1 / 12;
    } else if (timeRange === 'custom' && customStart && customEnd) {
      try {
        const start = parseISO(customStart);
        const end = parseISO(customEnd);
        const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        annualized = gross * (365 / days);
        prorateFactor = days / 365;
      } catch {
        // fallback: treat as annual
      }
    }
    // 'year' uses gross directly (annualized = gross, prorateFactor = 1)

    const federalAnnual = calcBracketTax(annualized, FEDERAL_BRACKETS);
    const provincialAnnual = calcBracketTax(annualized, BC_BRACKETS);
    const cppAnnual = Math.min(annualized, CPP_MAX_EARNINGS) * CPP_RATE;
    const eiAnnual = Math.min(annualized, EI_MAX_EARNINGS) * EI_RATE;

    const federal = federalAnnual * prorateFactor;
    const provincial = provincialAnnual * prorateFactor;
    const cpp = cppAnnual * prorateFactor;
    const ei = eiAnnual * prorateFactor;
    const net = gross - federal - provincial - cpp - ei;

    return { gross, federal, provincial, cpp, ei, net, annualized };
  }, [totalEarnings, timeRange, customStart, customEnd]);

  const taxMaxItem = Math.max(taxEstimate.federal, taxEstimate.provincial, taxEstimate.cpp, taxEstimate.ei, 1);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-slate-800">Analytics</Text>
          <View className="flex-row bg-slate-100 p-1 rounded-lg">
            {(['week', 'month', 'year', 'custom'] as const).map((range) => (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md ${
                  timeRange === range ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text
                  className={`text-xs font-medium capitalize ${
                    timeRange === range ? 'text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {range}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Custom date range inputs */}
        {timeRange === 'custom' && (
          <View className="bg-white rounded-xl p-3 border border-slate-200 mb-4">
            <Text className="text-xs font-medium text-slate-500 mb-2">Custom Date Range (YYYY-MM-DD)</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs text-slate-400 mb-1">Start</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800"
                  placeholder="2026-01-01"
                  placeholderTextColor="#94a3b8"
                  value={customStart}
                  onChangeText={setCustomStart}
                  maxLength={10}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-slate-400 mb-1">End</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800"
                  placeholder="2026-12-31"
                  placeholderTextColor="#94a3b8"
                  value={customEnd}
                  onChangeText={setCustomEnd}
                  maxLength={10}
                />
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats - 2x2 Grid */}
        <View className="flex-row flex-wrap justify-between mb-4">
          {/* Total Earnings */}
          <View className="w-[48%] bg-white rounded-xl p-3 border border-slate-200 mb-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="cash-outline" size={14} color="#64748b" />
              <Text className="text-xs text-slate-500">Total Earnings</Text>
            </View>
            <Text className="text-xl font-bold text-slate-800">
              ${totalEarnings.toLocaleString()}
            </Text>
          </View>

          {/* Total Hours */}
          <View className="w-[48%] bg-white rounded-xl p-3 border border-slate-200 mb-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="time-outline" size={14} color="#64748b" />
              <Text className="text-xs text-slate-500">Total Hours</Text>
            </View>
            <Text className="text-xl font-bold text-slate-800">
              {totalHours.toFixed(1)}
            </Text>
          </View>

          {/* Avg Hourly */}
          <View className="w-[48%] bg-white rounded-xl p-3 border border-slate-200">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="trending-up" size={14} color="#64748b" />
              <Text className="text-xs text-slate-500">Avg Hourly</Text>
            </View>
            <Text className="text-xl font-bold text-green-600">
              ${avgHourlyRate.toFixed(2)}
            </Text>
          </View>

          {/* Locations */}
          <View className="w-[48%] bg-white rounded-xl p-3 border border-slate-200">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text className="text-xs text-slate-500">Locations</Text>
            </View>
            <Text className="text-xl font-bold text-slate-800">
              {Object.keys(locationStats).length}
            </Text>
          </View>
        </View>

        {/* Earnings by Location - Horizontal Bar Chart */}
        <View className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
          <Text className="font-semibold text-slate-800 mb-3">
            Earnings by Location
          </Text>
          <View>
            {locationData.map((loc) => (
              <View key={loc.name} className="flex-row items-center mb-2.5">
                <Text
                  className="w-20 text-xs text-slate-600 mr-2"
                  numberOfLines={1}
                >
                  {loc.name}
                </Text>
                <View className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                  <View
                    className="h-6 bg-blue-500 rounded"
                    style={{
                      width: `${(loc.earnings / maxLocationEarnings) * 100}%`,
                    }}
                  />
                </View>
                <Text className="w-20 text-right text-xs font-medium text-slate-700 ml-2">
                  ${loc.earnings.toFixed(0)}
                </Text>
              </View>
            ))}
            {locationData.length === 0 && (
              <Text className="text-slate-500 text-sm text-center py-4">
                No location data yet
              </Text>
            )}
          </View>
        </View>

        {/* Shift Distribution */}
        <View className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
          <Text className="font-semibold text-slate-800 mb-3">
            Shift Distribution
          </Text>
          <View className="flex-row items-center gap-4">
            {/* Simple donut representation using stacked bars */}
            <View className="w-24 h-24 items-center justify-center">
              {/* Outer ring segments as a visual indicator */}
              <View className="w-20 h-20 rounded-full border-4 border-slate-100 items-center justify-center overflow-hidden">
                <View className="absolute inset-0">
                  {totalShiftCount > 0 && (
                    <>
                      {/* Day segment */}
                      <View
                        className="absolute left-0 top-0 bottom-0"
                        style={{
                          backgroundColor: '#fbbf24',
                          width: `${((shiftData[0].value / totalShiftCount) * 100)}%`,
                        }}
                      />
                      {/* Night segment */}
                      <View
                        className="absolute top-0 bottom-0"
                        style={{
                          backgroundColor: '#2563eb',
                          left: `${((shiftData[0].value / totalShiftCount) * 100)}%`,
                          width: `${((shiftData[1].value / totalShiftCount) * 100)}%`,
                        }}
                      />
                      {/* Graveyard segment */}
                      <View
                        className="absolute right-0 top-0 bottom-0"
                        style={{
                          backgroundColor: '#9333ea',
                          width: `${((shiftData[2].value / totalShiftCount) * 100)}%`,
                        }}
                      />
                    </>
                  )}
                </View>
                {/* Center white circle for donut effect */}
                <View className="w-12 h-12 rounded-full bg-white z-10 items-center justify-center">
                  <Text className="text-sm font-bold text-slate-800">
                    {totalShiftCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Legend */}
            <View className="flex-1 gap-2">
              {shiftData.map((item) => (
                <View
                  key={item.name}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-sm text-slate-600">{item.name}</Text>
                  </View>
                  <Text className="font-medium text-slate-800">
                    {item.value} shifts
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Top Jobs */}
        <View className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
          <Text className="font-semibold text-slate-800 mb-3">Top Jobs</Text>
          <View className="gap-3">
            {jobData.map((job, i) => (
              <View key={job.name} className="flex-row items-center gap-3">
                <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
                  <Text className="text-xs font-bold text-blue-600">
                    {i + 1}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="font-medium text-slate-800 text-sm flex-1 mr-2"
                      numberOfLines={1}
                    >
                      {job.name}
                    </Text>
                    <Text className="font-semibold text-slate-800">
                      ${job.earnings.toFixed(0)}
                    </Text>
                  </View>
                  <View className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(job.earnings / jobData[0].earnings) * 100}%`,
                      }}
                    />
                  </View>
                </View>
              </View>
            ))}
            {jobData.length === 0 && (
              <Text className="text-slate-500 text-sm text-center py-4">
                No job data yet
              </Text>
            )}
          </View>
        </View>

        {/* Tax Estimate */}
        <View className="bg-slate-800 rounded-xl p-4 mb-4 overflow-hidden">
          <Pressable
            onPress={() => setTaxExpanded(!taxExpanded)}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="calculator-outline" size={18} color="#e2e8f0" />
              <Text className="font-semibold text-white text-base">Tax Estimate</Text>
            </View>
            <Ionicons
              name={taxExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#94a3b8"
            />
          </Pressable>

          {/* Summary line always visible */}
          <View className="flex-row justify-between items-center mt-3">
            <Text className="text-sm text-slate-400">Net Take-Home</Text>
            <Text className="text-xl font-bold text-emerald-400">
              ${Math.max(0, taxEstimate.net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Collapsible breakdown */}
          {taxExpanded && (
            <View className="mt-4 gap-3">
              {/* Gross Earnings */}
              <View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-slate-300">Gross Earnings</Text>
                  <Text className="text-sm font-medium text-white">
                    ${taxEstimate.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <View className="h-full bg-white rounded-full" style={{ width: '100%' }} />
                </View>
              </View>

              {/* Federal Tax */}
              <View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-slate-300">Federal Tax</Text>
                  <Text className="text-sm font-medium text-red-400">
                    -${taxEstimate.federal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(taxEstimate.federal / taxMaxItem) * 100}%` }}
                  />
                </View>
              </View>

              {/* Provincial Tax (BC) */}
              <View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-slate-300">Provincial Tax (BC)</Text>
                  <Text className="text-sm font-medium text-orange-400">
                    -${taxEstimate.provincial.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(taxEstimate.provincial / taxMaxItem) * 100}%` }}
                  />
                </View>
              </View>

              {/* CPP */}
              <View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-slate-300">CPP Contribution</Text>
                  <Text className="text-sm font-medium text-yellow-400">
                    -${taxEstimate.cpp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${(taxEstimate.cpp / taxMaxItem) * 100}%` }}
                  />
                </View>
              </View>

              {/* EI */}
              <View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-slate-300">EI Premium</Text>
                  <Text className="text-sm font-medium text-blue-400">
                    -${taxEstimate.ei.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(taxEstimate.ei / taxMaxItem) * 100}%` }}
                  />
                </View>
              </View>

              {/* Divider */}
              <View className="border-t border-slate-600 my-1" />

              {/* Net Take-Home (detailed) */}
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-white">Net Take-Home</Text>
                <Text className="text-lg font-bold text-emerald-400">
                  ${Math.max(0, taxEstimate.net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>

              {/* Effective tax rate */}
              {taxEstimate.gross > 0 && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-slate-400">Effective Tax Rate</Text>
                  <Text className="text-xs text-slate-400">
                    {(((taxEstimate.gross - Math.max(0, taxEstimate.net)) / taxEstimate.gross) * 100).toFixed(1)}%
                  </Text>
                </View>
              )}

              {/* Disclaimer */}
              <Text className="text-xs text-slate-500 mt-2 leading-4">
                Estimates based on 2026 Canadian federal &amp; BC provincial tax brackets. Actual amounts may vary based on deductions, credits, and other income.
              </Text>
            </View>
          )}
        </View>

        {/* Insights */}
        <View className="bg-blue-600 rounded-xl p-4 overflow-hidden">
          {/* Gradient overlay approximation */}
          <View className="absolute inset-0 bg-blue-700 rounded-xl opacity-50" />
          <View className="relative">
            <Text className="font-semibold mb-2 text-white">Insights</Text>
            <View className="gap-2">
              <Text className="text-sm text-blue-100">
                {'\u2022'} You work most frequently at{' '}
                {locationData[0]?.fullName || 'N/A'}
              </Text>
              <Text className="text-sm text-blue-100">
                {'\u2022'} Your highest-paying job is{' '}
                {jobData[0]?.fullName || 'N/A'}
              </Text>
              <Text className="text-sm text-blue-100">
                {'\u2022'}{' '}
                {filteredShifts.length > 0
                  ? Math.round(
                      ((shiftData[0]?.value || 0) / filteredShifts.length) * 100
                    )
                  : 0}
                % of your shifts are day shifts
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
