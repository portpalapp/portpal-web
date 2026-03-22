import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCallback as useReactCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  calculateWeeklyEarnings,
  calculateYTDEarnings,
} from '../../data/mockData';
import { STAT_HOLIDAYS_2026, daysUntil } from '../../data/holidayData';
import type { Shift } from '../../data/mockData';
import { useShifts } from '../../hooks/useShifts';
import { useProfile } from '../../hooks/useProfile';
import { formatDateRelative } from '../../lib/formatters';
import { getShiftBarColor } from '../../lib/shiftColors';

// Streak: counts consecutive shifts where each gap is ≤ 48 hours.
// A worker has 48 hours from the end of a shift to log the next one.
const calculateStreak = (shifts: Shift[]) => {
  if (shifts.length === 0) return 0;

  // Sort by date descending
  const sorted = [...shifts]
    .map((s) => s.date)
    .sort((a, b) => b.localeCompare(a));

  // Deduplicate dates
  const uniqueDates: string[] = [];
  for (const d of sorted) {
    if (uniqueDates.length === 0 || uniqueDates[uniqueDates.length - 1] !== d) {
      uniqueDates.push(d);
    }
  }

  // The most recent shift must be within 48 hours of now to count
  const now = new Date();
  const latestShiftDate = new Date(uniqueDates[0] + 'T23:59:59');
  const hoursSinceLatest = (now.getTime() - latestShiftDate.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLatest > 48) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const curr = new Date(uniqueDates[i - 1] + 'T00:00:00');
    const prev = new Date(uniqueDates[i] + 'T00:00:00');
    const gapDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    // 48 hours = 2 days gap allowed (accounts for weekends, days off)
    if (gapDays <= 2) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export default function HomeScreen() {
  const router = useRouter();
  const { shifts, loading: shiftsLoading } = useShifts();
  const { profile, loading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  // Only refetch queries that are already stale (older than staleTime), not on every focus
  useFocusEffect(
    useReactCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['shifts'], stale: true });
      queryClient.invalidateQueries({ queryKey: ['profile'], stale: true });
    }, [queryClient])
  );

  const loading = shiftsLoading || profileLoading;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const thisWeekEarnings = calculateWeeklyEarnings(shifts, 0);
  const lastWeekEarnings = calculateWeeklyEarnings(shifts, 1);
  const ytdEarnings = calculateYTDEarnings(shifts);
  const pensionProgress = (ytdEarnings / profile.pensionGoal) * 100;

  // Calculate weeks until pension goal at current rate
  const avgWeeklyEarnings = (thisWeekEarnings + lastWeekEarnings) / 2;
  const remainingToGoal = profile.pensionGoal - ytdEarnings;
  const weeksToGoal =
    avgWeeklyEarnings > 0 ? Math.ceil(remainingToGoal / avgWeeklyEarnings) : 0;
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + weeksToGoal * 7);

  // Get this week's shifts (string comparison for timezone safety)
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekStartStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;

  const thisWeekShifts = shifts.filter((s) => {
    return s.date.slice(0, 10) >= weekStartStr;
  });
  const thisWeekHours = thisWeekShifts.reduce((sum, s) => sum + s.regHours + s.otHours, 0);

  // Get last week's shifts
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekStartStr = `${lastWeekStart.getFullYear()}-${String(lastWeekStart.getMonth() + 1).padStart(2, '0')}-${String(lastWeekStart.getDate()).padStart(2, '0')}`;
  const lastWeekShifts = shifts.filter((s) => {
    const d = s.date.slice(0, 10);
    return d >= lastWeekStartStr && d < weekStartStr;
  });
  const lastWeekHours = lastWeekShifts.reduce((sum, s) => sum + s.regHours + s.otHours, 0);

  // Calculate streaks from real data
  const currentStreak = calculateStreak(shifts);

  // Points system
  // 10 pts per shift logged, 5 pts per streak day (bonus), 50 pts per pay stub uploaded
  // Streak multiplier: streak >= 5 = 1.5x, >= 10 = 2x, >= 20 = 3x
  const points = (() => {
    const shiftPoints = shifts.length * 10;
    const streakBonus = currentStreak * 5;
    const streakMultiplier = currentStreak >= 20 ? 3 : currentStreak >= 10 ? 2 : currentStreak >= 5 ? 1.5 : 1;
    // Count shifts with attachments as pay stub uploads
    const stubUploads = shifts.filter((s: any) => s.attachments && Array.isArray(s.attachments) && s.attachments.length > 0).length;
    const stubPoints = stubUploads * 50;
    const basePoints = shiftPoints + streakBonus + stubPoints;
    const total = Math.round(basePoints * streakMultiplier);
    return { total, shiftPoints, streakBonus, stubPoints, streakMultiplier };
  })();

  // formatDate → uses shared formatDateRelative
  const formatDate = formatDateRelative;

  // shiftBarColor → uses shared getShiftBarColor
  const shiftBarColor = getShiftBarColor;

  const weekChangePercent =
    lastWeekEarnings > 0
      ? Math.round(
          ((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100
        )
      : 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-slate-500 text-sm">Welcome back,</Text>
            <Text className="text-xl font-bold text-slate-800">
              {profile.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-2 bg-blue-600 px-3 py-1.5 rounded-full">
              <Ionicons name="boat-outline" size={16} color="#ffffff" />
              <Text className="text-sm font-medium text-white">
                #{profile.seniority}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              activeOpacity={0.7}
              className="p-1"
            >
              <Ionicons name="person-circle-outline" size={30} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Shift + Streak */}
        {(() => {
          const now2 = new Date();
          const todayStr = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-${String(now2.getDate()).padStart(2, '0')}`;
          const todayShifts = shifts.filter(s => s.date.slice(0, 10) === todayStr);
          const hasToday = todayShifts.length > 0;

          return (
            <View className="flex-row gap-3 mb-4">
              {/* Today's Shift */}
              <TouchableOpacity
                onPress={() => {
                  if (hasToday) {
                    const s = todayShifts[0];
                    router.push({ pathname: '/(tabs)/shifts', params: { editShiftId: s.id, prefillJob: s.job, prefillLocation: s.location, prefillShift: s.shift, prefillSubjob: s.subjob || '' } });
                  } else {
                    router.push('/(tabs)/shifts');
                  }
                }}
                activeOpacity={0.85}
                className={`flex-1 rounded-2xl p-4 ${hasToday ? 'bg-green-50 border border-green-200' : 'bg-slate-100 border border-slate-200'}`}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name={hasToday ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={hasToday ? '#16a34a' : '#94a3b8'} />
                  <Text className={`text-xs font-semibold ${hasToday ? 'text-green-700' : 'text-slate-500'}`}>
                    Today's Shift
                  </Text>
                </View>
                {hasToday ? (
                  <>
                    <Text className="font-bold text-slate-800 text-base" numberOfLines={1}>{todayShifts[0].job}</Text>
                    <Text className="text-slate-600 text-xs mt-0.5">{todayShifts[0].location} · {todayShifts[0].shift.charAt(0) + todayShifts[0].shift.slice(1).toLowerCase()}</Text>
                    <Text className="text-green-600 font-bold text-lg mt-1">${todayShifts[0].totalPay.toFixed(0)}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{todayShifts[0].regHours}h{todayShifts[0].otHours > 0 ? ` + ${todayShifts[0].otHours} OT` : ''} · Tap to edit</Text>
                    {todayShifts.length > 1 && (
                      <Text className="text-xs text-green-600 mt-1">+{todayShifts.length - 1} more shift{todayShifts.length > 2 ? 's' : ''}</Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text className="font-medium text-slate-600 text-sm">No shift logged</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">Tap to log today's shift</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Streak + Points */}
              <View className="w-28 bg-orange-50 rounded-2xl p-3 border border-orange-100 items-center justify-between">
                <View className="items-center">
                  <View className="p-1.5 bg-orange-100 rounded-lg mb-0.5">
                    <Ionicons name="flame" size={18} color="#f97316" />
                  </View>
                  <Text className="text-2xl font-bold text-orange-600">{currentStreak}</Text>
                  <Text className="text-[10px] text-orange-600 font-medium">Streak</Text>
                </View>
                <View className="w-full h-px bg-orange-200 my-1.5" />
                <View className="items-center">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star" size={12} color="#eab308" />
                    <Text className="text-base font-bold text-amber-600">{points.total}</Text>
                  </View>
                  <Text className="text-[10px] text-amber-600 font-medium">Points</Text>
                  {points.streakMultiplier > 1 && (
                    <Text className="text-[9px] text-orange-500 font-medium">{points.streakMultiplier}x bonus!</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })()}

        {/* Earnings Cards - 2 column */}
        <View className="flex-row gap-3 mb-4">
          {/* This Week */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/calendar')}
            activeOpacity={0.85}
            className="flex-1 bg-blue-600 rounded-2xl p-4"
          >
            <Text className="text-blue-100 text-xs font-medium">
              This Week
            </Text>
            <Text className="text-2xl font-bold mt-1 text-white">
              ${thisWeekEarnings.toLocaleString()}
            </Text>
            <View className="gap-1 mt-2">
              <Text className="text-blue-100 text-xs">
                {thisWeekShifts.length} shift{thisWeekShifts.length !== 1 ? 's' : ''} · {thisWeekHours}h
              </Text>
              {lastWeekEarnings > 0 && (
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name={thisWeekEarnings >= lastWeekEarnings ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={thisWeekEarnings >= lastWeekEarnings ? '#86efac' : '#fbbf24'}
                  />
                  <Text
                    className={thisWeekEarnings >= lastWeekEarnings ? 'text-green-300 text-xs' : 'text-amber-300 text-xs'}
                  >
                    {thisWeekEarnings > lastWeekEarnings ? '+' : ''}{weekChangePercent}% vs last
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Last Week */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/calendar')}
            activeOpacity={0.85}
            className="flex-1 bg-slate-700 rounded-2xl p-4"
          >
            <Text className="text-slate-300 text-xs font-medium">
              Last Week
            </Text>
            <Text className="text-2xl font-bold mt-1 text-white">
              ${lastWeekEarnings.toLocaleString()}
            </Text>
            <View className="gap-1 mt-2">
              <Text className="text-slate-300 text-xs">
                {lastWeekShifts.length} shift{lastWeekShifts.length !== 1 ? 's' : ''} · {lastWeekHours}h
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pension Progress */}
        <TouchableOpacity
          onPress={() => router.push('/pension')}
          activeOpacity={0.85}
          className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="flag" size={18} color="#2563eb" />
              <View>
                <Text className="font-semibold text-slate-800">
                  Pension Year Progress
                </Text>
                <Text className="text-xs text-slate-500">
                  Jan 4, 2026 - Jan 3, 2027
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-lg font-bold text-blue-600">
                ${ytdEarnings.toLocaleString()}
              </Text>
              <Text className="text-xs text-slate-500">
                of ${profile.pensionGoal.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(pensionProgress, 100)}%` }}
            />
          </View>

          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-xs text-slate-500">
              {pensionProgress.toFixed(1)}% complete
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="sparkles" size={12} color="#9333ea" />
              <Text className="text-xs text-purple-600">
                Goal by{' '}
                {projectedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#9333ea" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Work Opportunities */}
        {(() => {
          // Calculate job recommendations based on user's shift history
          const jobStats = shifts.reduce((acc, s) => {
            if (!acc[s.job]) acc[s.job] = { 
              count: 0, 
              earnings: 0, 
              avgPay: 0, 
              lastWorked: s.date,
              locations: new Set()
            };
            acc[s.job].count++;
            acc[s.job].earnings += s.totalPay;
            acc[s.job].locations.add(s.location);
            if (s.date > acc[s.job].lastWorked) {
              acc[s.job].lastWorked = s.date;
            }
            return acc;
          }, {} as Record<string, { count: number; earnings: number; avgPay: number; lastWorked: string; locations: Set<string> }>);

          // Calculate average pay for each job
          Object.keys(jobStats).forEach(job => {
            jobStats[job].avgPay = jobStats[job].earnings / jobStats[job].count;
          });

          // Get user's most worked jobs (personalized recommendations)
          const userJobs = Object.entries(jobStats)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 3)
            .map(([job, stats]) => ({
              name: job,
              subtitle: `${stats.count} times · $${stats.avgPay.toFixed(0)} avg`,
              prediction: `${Math.min(85, Math.max(25, 45 + (stats.count * 2)))}% likely`,
              isPersonalized: true
            }));

          // Fallback popular jobs for new users
          const popularJobs = [
            { name: 'LABOUR', subtitle: 'General work · $445 avg', prediction: '65% likely', isPersonalized: false },
            { name: 'LIFT TRUCK', subtitle: 'Machine operator · $490 avg', prediction: '55% likely', isPersonalized: false },
            { name: 'TRACTOR TRAILER', subtitle: 'TT operations · $510 avg', prediction: '45% likely', isPersonalized: false },
            { name: 'HEAD CHECKER', subtitle: 'Supervision · $465 avg', prediction: '40% likely', isPersonalized: false },
          ];

          // Use personalized jobs if user has history, otherwise show popular jobs
          const jobRecommendations = userJobs.length > 0 ? userJobs : popularJobs;
          const sectionTitle = userJobs.length > 0 ? 'Your Top Jobs' : 'Popular Jobs';
          const sectionSubtitle = userJobs.length > 0 ? 'Based on your work history' : 'High-demand positions';

          return (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="font-semibold text-slate-800">{sectionTitle}</Text>
                  <Text className="text-xs text-slate-500">{sectionSubtitle}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/analytics')}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-1"
                >
                  <Text className="text-xs text-blue-600 font-medium">View All</Text>
                  <Ionicons name="chevron-forward" size={14} color="#2563eb" />
                </TouchableOpacity>
              </View>

              <View className="gap-3">
                {jobRecommendations.map((job, i) => (
                  <TouchableOpacity
                    key={job.name}
                    onPress={() => router.push({ pathname: '/job-detail', params: { jobName: job.name } })}
                    activeOpacity={0.7}
                    className="flex-row items-center gap-3 p-2 rounded-xl bg-slate-50"
                  >
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                      <Ionicons 
                        name={job.isPersonalized ? "star" : "briefcase-outline"} 
                        size={16} 
                        color="#2563eb" 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-slate-800 text-sm" numberOfLines={1}>
                        {job.name}
                      </Text>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {job.subtitle}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-bold text-green-600">
                        {job.prediction}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mt-3 pt-3 border-t border-slate-100">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="analytics-outline" size={16} color="#64748b" />
                  <Text className="text-xs text-slate-500 flex-1">
                    Predictions based on dispatch patterns, your board position, and work history
                  </Text>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Upcoming Stat Holidays */}
        {(() => {
          const now3 = new Date();
          const todayStr2 = `${now3.getFullYear()}-${String(now3.getMonth() + 1).padStart(2, '0')}-${String(now3.getDate()).padStart(2, '0')}`;
          const upcomingHolidays = STAT_HOLIDAYS_2026.filter(h => h.date >= todayStr2).slice(0, 3);

          if (upcomingHolidays.length === 0) return null;

          const nearest = upcomingHolidays[0];
          const nearestDays = daysUntil(nearest.date);
          const nearestCountingShifts = shifts.filter(
            s => s.date.slice(0, 10) >= nearest.countingPeriodStart && s.date.slice(0, 10) <= nearest.countingPeriodEnd
          ).length;

          const formatHolidayDate = (dateStr: string) => {
            const d = new Date(dateStr + 'T12:00:00');
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          };
          const formatShortDate = (dateStr: string) => {
            const d = new Date(dateStr + 'T12:00:00');
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          };

          return (
            <TouchableOpacity
              onPress={() => router.push('/holidays')}
              activeOpacity={0.85}
              className="bg-white rounded-2xl p-4 shadow-sm mb-4"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar" size={18} color="#2563eb" />
                  <Text className="font-semibold text-slate-800">Upcoming Stat Holidays</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs text-blue-600 font-medium">View All</Text>
                  <Ionicons name="chevron-forward" size={14} color="#2563eb" />
                </View>
              </View>

              <View className="gap-2">
                {upcomingHolidays.map((h, idx) => {
                  const days = daysUntil(h.date);
                  const isNearest = idx === 0;
                  const borderColor = days <= 7 ? 'border-l-red-500' : days <= 30 ? 'border-l-amber-500' : 'border-l-blue-500';

                  return (
                    <View key={idx}>
                      <View className={`flex-row items-center justify-between p-2.5 rounded-xl bg-slate-50 border-l-4 ${borderColor}`}>
                        <View className="flex-1 mr-2">
                          <Text className="font-semibold text-slate-800 text-sm" numberOfLines={1}>{h.name}</Text>
                          <Text className="text-xs text-slate-500 mt-0.5">{formatHolidayDate(h.date)}</Text>
                        </View>
                        <View className={`px-2.5 py-1 rounded-full ${days <= 7 ? 'bg-red-100' : days <= 30 ? 'bg-amber-100' : 'bg-blue-100'}`}>
                          <Text className={`text-xs font-bold ${days <= 7 ? 'text-red-700' : days <= 30 ? 'text-amber-700' : 'text-blue-700'}`}>
                            {days === 0 ? 'Today' : `${days}d`}
                          </Text>
                        </View>
                      </View>

                      {/* Extra detail for nearest holiday */}
                      {isNearest && (
                        <View className="mt-1.5 ml-3 flex-row items-center gap-1.5">
                          <Ionicons name="time-outline" size={12} color="#64748b" />
                          <Text className="text-[11px] text-slate-500">
                            Counting: {formatShortDate(nearest.countingPeriodStart)} - {formatShortDate(nearest.countingPeriodEnd)}
                          </Text>
                          <Text className="text-[11px] font-semibold text-slate-500"> · </Text>
                          <Text className={`text-[11px] font-semibold ${nearestCountingShifts >= 15 ? 'text-green-600' : nearestCountingShifts > 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                            {nearestCountingShifts} shift{nearestCountingShifts !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* Rewards & Points */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="star" size={18} color="#eab308" />
              <Text className="font-semibold text-slate-800">Rewards</Text>
            </View>
            <View className="bg-amber-100 px-3 py-1 rounded-full">
              <Text className="text-sm font-bold text-amber-700">{points.total} pts</Text>
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between py-1.5">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center">
                  <Ionicons name="create-outline" size={12} color="#2563eb" />
                </View>
                <Text className="text-sm text-slate-700">Shifts logged ({shifts.length})</Text>
              </View>
              <Text className="text-sm font-medium text-slate-600">+{points.shiftPoints}</Text>
            </View>
            <View className="flex-row items-center justify-between py-1.5">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 bg-orange-100 rounded-full items-center justify-center">
                  <Ionicons name="flame" size={12} color="#f97316" />
                </View>
                <Text className="text-sm text-slate-700">Streak bonus ({currentStreak} days)</Text>
              </View>
              <Text className="text-sm font-medium text-slate-600">+{points.streakBonus}</Text>
            </View>
            <View className="flex-row items-center justify-between py-1.5">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 bg-green-100 rounded-full items-center justify-center">
                  <Ionicons name="document-text" size={12} color="#16a34a" />
                </View>
                <Text className="text-sm text-slate-700">Pay stubs uploaded</Text>
              </View>
              <Text className="text-sm font-medium text-slate-600">+{points.stubPoints}</Text>
            </View>
            {points.streakMultiplier > 1 && (
              <View className="flex-row items-center justify-between py-1.5 bg-amber-50 -mx-2 px-2 rounded-lg">
                <View className="flex-row items-center gap-2">
                  <View className="w-6 h-6 bg-amber-200 rounded-full items-center justify-center">
                    <Ionicons name="flash" size={12} color="#d97706" />
                  </View>
                  <Text className="text-sm font-medium text-amber-700">Streak multiplier</Text>
                </View>
                <Text className="text-sm font-bold text-amber-700">{points.streakMultiplier}x</Text>
              </View>
            )}
          </View>

          {/* Hoodie giveaway teaser */}
          <View className="mt-3 pt-3 border-t border-slate-100">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">🎁</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-800">PORTPAL Hoodie Giveaway</Text>
                <Text className="text-xs text-slate-500">Top point earners win exclusive PORTPAL merch. Keep logging!</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </View>
          </View>
        </View>

        {/* Pay Stub Upload */}
        <TouchableOpacity
          onPress={() => router.push('/pay-stubs')}
          activeOpacity={0.85}
          className="bg-green-50 rounded-2xl p-4 border border-green-100 flex-row items-start gap-3 mb-4"
        >
          <View className="p-2 bg-green-100 rounded-xl">
            <Ionicons name="document-text" size={20} color="#16a34a" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-green-800">
              Upload Pay Stub
            </Text>
            <Text className="text-xs text-green-700 mt-1">
              Earn 50 bonus points per upload! Compare your pay stub against logged shifts.
            </Text>
            <View className="mt-2 flex-row items-center gap-1">
              <Ionicons name="star" size={12} color="#16a34a" />
              <Text className="text-xs font-medium text-green-700">
                +50 pts per upload
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* This Week's Shifts */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar-outline" size={18} color="#475569" />
              <Text className="font-semibold text-slate-800">
                This Week's Shifts
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/calendar')}
              activeOpacity={0.7}
              className="flex-row items-center gap-1"
            >
              <Text className="text-xs text-blue-600 font-medium">
                View All
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {thisWeekShifts.length > 0 ? (
            <View className="gap-2">
              {thisWeekShifts.slice(0, 5).map((shift) => (
                <TouchableOpacity
                  key={shift.id}
                  onPress={() => router.push({ pathname: '/job-detail', params: { jobName: shift.job } })}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 p-2 rounded-xl active:bg-slate-50"
                >
                  <View
                    className={`w-2 h-10 rounded-full ${shiftBarColor(shift.shift)}`}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="font-medium text-slate-800 text-sm flex-1 mr-2"
                        numberOfLines={1}
                      >
                        {shift.job}
                      </Text>
                      <Text className="font-semibold text-slate-800">
                        ${shift.totalPay.toFixed(0)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-slate-500">
                        {shift.location} {'\u00B7'} {shift.shift}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {formatDate(shift.date)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#e2e8f0" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text className="text-slate-500 text-sm text-center py-4">
              No shifts logged this week
            </Text>
          )}

          {/* Week Total */}
          {thisWeekShifts.length > 0 && (
            <View className="mt-3 pt-3 border-t border-slate-100 flex-row justify-between items-center">
              <Text className="text-sm text-slate-600">
                Week Total ({thisWeekShifts.length} shifts)
              </Text>
              <Text className="font-bold text-slate-800">
                ${thisWeekEarnings.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Quick AI Actions */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/chat')}
          activeOpacity={0.85}
          className="bg-slate-100 rounded-2xl p-4 flex-row items-center gap-3"
        >
          <View className="p-2 bg-purple-100 rounded-xl">
            <Ionicons name="sparkles" size={20} color="#9333ea" />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-slate-800">
              Ask AI anything
            </Text>
            <Text className="text-xs text-slate-500">
              Rates, predictions, collective agreement...
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* Contract & Templates */}
        <View className="flex-row gap-3 mt-4">
          {/* Contract Reference */}
          <TouchableOpacity
            onPress={() => router.push('/contract')}
            activeOpacity={0.85}
            className="flex-1 bg-emerald-50 rounded-2xl p-4 border border-emerald-100"
          >
            <View className="flex-row items-center gap-2">
              <View className="p-2 bg-emerald-100 rounded-xl">
                <Ionicons name="book-outline" size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-800">
                  Contract Reference
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Pay rates, rules & entitlements
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Shift Template Builder */}
          <TouchableOpacity
            onPress={() => router.push('/template-builder')}
            activeOpacity={0.85}
            className="flex-1 bg-violet-50 rounded-2xl p-4 border border-violet-100"
          >
            <View className="flex-row items-center gap-2">
              <View className="p-2 bg-violet-100 rounded-xl">
                <Ionicons name="calculator-outline" size={20} color="#8b5cf6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-800">
                  Shift Template Builder
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Build custom shift templates
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Vessel Info */}
        <TouchableOpacity
          onPress={() => router.push('/vessels')}
          activeOpacity={0.85}
          className="bg-sky-50 rounded-2xl p-4 border border-sky-100 flex-row items-center gap-3 mt-3"
        >
          <View className="p-2 bg-sky-100 rounded-xl">
            <Ionicons name="boat-outline" size={20} color="#0284c7" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-slate-800">Vessel Info</Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              Search ship details, lashing equipment & specs
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
