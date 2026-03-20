import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShifts } from '../hooks/useShifts';
import {
  STAT_HOLIDAYS_2026,
  STAT_PAY_RULES,
  daysUntil,
  type StatHoliday,
} from '../data/holidayData';
import { formatDateShort, formatDateCompact, getTodayStr } from '../lib/formatters';

type HolidayTab = 'upcoming' | 'rules';

export default function HolidaysScreen() {
  const router = useRouter();
  const { shifts } = useShifts();
  const [tab, setTab] = useState<HolidayTab>('upcoming');

  const tabStyle = (t: HolidayTab) =>
    `px-4 py-2 rounded-full ${tab === t ? 'bg-blue-600' : 'bg-slate-100'}`;
  const tabText = (t: HolidayTab) =>
    `text-sm font-semibold ${tab === t ? 'text-white' : 'text-slate-600'}`;

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

  // Shared formatters
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
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2 flex-1">
          <Ionicons name="calendar" size={22} color="#2563eb" />
          <Text className="text-lg font-bold text-slate-800">Stat Holidays</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 px-4 py-3">
        <TouchableOpacity onPress={() => setTab('upcoming')} className={tabStyle('upcoming')}>
          <Text className={tabText('upcoming')}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('rules')} className={tabStyle('rules')}>
          <Text className={tabText('rules')}>Rules</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {tab === 'upcoming' && (
          <View className="gap-3">
            {holidayData.map((h, idx) => {
              const colors = getStatusColor(h.qualifyingShifts, h.isPast);
              return (
                <View
                  key={idx}
                  className={`rounded-2xl p-4 border ${colors.bg} ${colors.border}`}
                  style={{ opacity: h.isPast ? 0.55 : 1 }}
                >
                  {/* Holiday name and countdown */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <Ionicons
                        name={h.isPast ? 'checkmark-circle' : 'flag'}
                        size={18}
                        color={
                          h.isPast
                            ? '#94a3b8'
                            : h.qualifyingShifts >= 15
                              ? '#16a34a'
                              : h.qualifyingShifts > 0
                                ? '#2563eb'
                                : '#64748b'
                        }
                      />
                      <Text
                        className={`font-bold text-base ${h.isPast ? 'text-slate-400' : 'text-slate-800'}`}
                        numberOfLines={1}
                      >
                        {h.name}
                      </Text>
                    </View>
                    <View
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
                      <Text
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
                      </Text>
                    </View>
                  </View>

                  {/* Date */}
                  <Text className={`text-sm mb-2 ${h.isPast ? 'text-slate-400' : 'text-slate-600'}`}>
                    {formatDate(h.date)}
                  </Text>

                  {/* Counting period and shifts */}
                  <View className={`rounded-xl p-3 ${h.isPast ? 'bg-slate-100' : 'bg-white/70'}`}>
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <Ionicons name="time-outline" size={14} color={h.isPast ? '#94a3b8' : '#64748b'} />
                      <Text className={`text-xs font-medium ${h.isPast ? 'text-slate-400' : 'text-slate-500'}`}>
                        Counting Period: {formatShortDate(h.countingPeriodStart)} - {formatShortDate(h.countingPeriodEnd)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons
                          name="briefcase-outline"
                          size={14}
                          color={
                            h.isPast
                              ? '#94a3b8'
                              : h.qualifyingShifts >= 15
                                ? '#16a34a'
                                : h.qualifyingShifts > 0
                                  ? '#2563eb'
                                  : '#94a3b8'
                          }
                        />
                        <Text className={`text-sm font-semibold ${colors.text}`}>
                          {h.qualifyingShifts} qualifying shift{h.qualifyingShifts !== 1 ? 's' : ''}
                        </Text>
                      </View>

                      <View
                        className={`px-2 py-0.5 rounded-full ${
                          h.qualifyingShifts >= 15
                            ? 'bg-green-100'
                            : h.qualifyingShifts > 0
                              ? 'bg-blue-100'
                              : 'bg-slate-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            h.qualifyingShifts >= 15
                              ? 'text-green-700'
                              : h.qualifyingShifts > 0
                                ? 'text-blue-700'
                                : 'text-slate-500'
                          }`}
                        >
                          {getPayEstimate(h.qualifyingShifts)}
                        </Text>
                      </View>
                    </View>

                    {/* Progress bar for upcoming holidays */}
                    {!h.isPast && h.qualifyingShifts < 15 && (
                      <View className="mt-2">
                        <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <View
                            className={`h-full rounded-full ${
                              h.qualifyingShifts > 0 ? 'bg-blue-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${Math.min((h.qualifyingShifts / 15) * 100, 100)}%` }}
                          />
                        </View>
                        <Text className="text-[10px] text-slate-400 mt-1">
                          {15 - h.qualifyingShifts} more shift{15 - h.qualifyingShifts !== 1 ? 's' : ''} for full pay
                        </Text>
                      </View>
                    )}

                    {/* Full pay indicator */}
                    {!h.isPast && h.qualifyingShifts >= 15 && (
                      <View className="flex-row items-center gap-1 mt-2">
                        <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                        <Text className="text-xs font-medium text-green-700">
                          You qualify for full stat pay!
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {tab === 'rules' && (
          <View className="gap-4">
            {/* How Stat Pay Works */}
            <View className="bg-white rounded-2xl p-4 border border-slate-200">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="information-circle" size={20} color="#2563eb" />
                <Text className="font-bold text-slate-800 text-base">How Stat Pay Works</Text>
              </View>
              <Text className="text-sm text-slate-600 mb-3">{STAT_PAY_RULES.summary}</Text>
              <View className="gap-2">
                {STAT_PAY_RULES.rules.map((rule, i) => (
                  <View key={i} className="flex-row items-start gap-2">
                    <View className="w-5 h-5 bg-blue-100 rounded-full items-center justify-center mt-0.5">
                      <Text className="text-xs font-bold text-blue-600">{i + 1}</Text>
                    </View>
                    <Text className="text-sm text-slate-700 flex-1">{rule}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Pay Tiers */}
            <View className="bg-white rounded-2xl p-4 border border-slate-200">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="cash-outline" size={20} color="#16a34a" />
                <Text className="font-bold text-slate-800 text-base">Pay Tiers</Text>
              </View>

              <View className="gap-3">
                <View className="bg-green-50 rounded-xl p-3 border border-green-200">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text className="font-bold text-green-800">15+ shifts</Text>
                  </View>
                  <Text className="text-sm text-green-700">Full day's pay (8 hours at your regular rate)</Text>
                </View>

                <View className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Ionicons name="pie-chart" size={16} color="#2563eb" />
                    <Text className="font-bold text-blue-800">1-14 shifts</Text>
                  </View>
                  <Text className="text-sm text-blue-700">
                    1/20th of a full day's pay per shift worked. Example: 10 shifts = 10/20ths (half a day's pay).
                  </Text>
                </View>

                <View className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Ionicons name="close-circle" size={16} color="#94a3b8" />
                    <Text className="font-bold text-slate-600">0 shifts</Text>
                  </View>
                  <Text className="text-sm text-slate-500">No stat pay for this holiday.</Text>
                </View>
              </View>
            </View>

            {/* Working on a Stat Holiday */}
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="alert-circle" size={20} color="#d97706" />
                <Text className="font-bold text-amber-800 text-base">Working ON a Stat Holiday</Text>
              </View>
              <Text className="text-sm text-amber-700">{STAT_PAY_RULES.workingHolidayPay}</Text>
            </View>

            {/* Vacation Rules */}
            <View className="bg-white rounded-2xl p-4 border border-slate-200">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="airplane-outline" size={20} color="#8b5cf6" />
                <Text className="font-bold text-slate-800 text-base">Vacation Rules</Text>
              </View>
              <View className="gap-2">
                {STAT_PAY_RULES.vacationRules.map((rule, i) => (
                  <View key={i} className="flex-row items-start gap-2">
                    <Ionicons name="chevron-forward" size={14} color="#8b5cf6" style={{ marginTop: 2 }} />
                    <Text className="text-sm text-slate-700 flex-1">{rule}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Counting Period Explanation */}
            <View className="bg-white rounded-2xl p-4 border border-slate-200">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="calendar-outline" size={20} color="#475569" />
                <Text className="font-bold text-slate-800 text-base">What is the Counting Period?</Text>
              </View>
              <Text className="text-sm text-slate-600 leading-5">
                The counting period is the 4 full weeks (Sunday to Saturday) immediately before the
                week in which the stat holiday falls. Any shifts you work during this window count
                toward your stat pay qualification. The more shifts you log, the more stat pay you
                receive -- up to a full day at 15+ shifts.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
