import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatchIntel } from '../hooks/useDispatchIntel';
import type { SignalLevel, SectionBreakdown, WindowSummary } from '../hooks/useDispatchIntel';

// ---------------------------------------------------------------------------
// Signal styling
// ---------------------------------------------------------------------------

const SIGNAL_STYLES: Record<SignalLevel, {
  dotColor: string;
  gradientBg: string;
  textColor: string;
}> = {
  Good: {
    dotColor: '#22c55e',
    gradientBg: '#16a34a',
    textColor: '#15803d',
  },
  Moderate: {
    dotColor: '#eab308',
    gradientBg: '#ca8a04',
    textColor: '#a16207',
  },
  Low: {
    dotColor: '#ef4444',
    gradientBg: '#dc2626',
    textColor: '#dc2626',
  },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_QUALITY: Record<number, { label: string; color: string }> = {
  0: { label: 'Low', color: '#f87171' },
  1: { label: 'Best', color: '#22c55e' },
  2: { label: 'Best', color: '#22c55e' },
  3: { label: 'Best', color: '#22c55e' },
  4: { label: 'Good', color: '#4ade80' },
  5: { label: 'OK', color: '#facc15' },
  6: { label: 'Low', color: '#f87171' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SignalHeader({
  signal,
  reason,
  dayName,
}: {
  signal: SignalLevel;
  reason: string;
  dayName: string;
}) {
  const styles = SIGNAL_STYLES[signal];

  return (
    <View
      className="rounded-2xl p-5"
      style={{ backgroundColor: styles.gradientBg }}
    >
      <View className="flex-row items-center gap-3 mb-3">
        <View className="p-2.5 bg-white/20 rounded-xl">
          <Ionicons name="radio-outline" size={24} color="#ffffff" />
        </View>
        <View>
          <Text className="text-xl font-bold text-white">Dispatch Signal</Text>
          <Text className="text-sm text-white/80">{dayName}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-3 h-3 rounded-full bg-white" />
        <Text className="text-lg font-bold text-white">{signal}</Text>
      </View>
      <Text className="text-sm text-white/90">{reason}</Text>
    </View>
  );
}

function CurrentWindowCard({
  windows,
  nextWindow,
}: {
  windows: WindowSummary[];
  nextWindow: string;
}) {
  const activeWindows = windows.filter(w => w.tickCount > 0);

  if (activeWindows.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-4 shadow-sm">
        <View className="flex-row items-center gap-2 mb-3">
          <Ionicons name="time-outline" size={18} color="#2563eb" />
          <Text className="font-semibold text-slate-800">Dispatch Windows</Text>
        </View>
        <View className="items-center py-4">
          <Text className="text-slate-500 text-sm">No active dispatch window</Text>
          <Text className="text-xs text-slate-400 mt-1">Next dispatch: {nextWindow}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="time-outline" size={18} color="#2563eb" />
        <Text className="font-semibold text-slate-800">Dispatch Windows</Text>
      </View>
      <View className="gap-3">
        {activeWindows.map(w => {
          const dayShift = w.dayShift;
          return (
            <View key={w.windowType} className="bg-slate-50 rounded-xl p-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-slate-700 capitalize">
                  {w.windowType}
                </Text>
                <Text className="text-xs text-slate-500">{w.tickCount} snapshots</Text>
              </View>
              {dayShift ? (
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Day Shift (08:00)</Text>
                    <Text className="text-sm font-bold text-slate-800">
                      {dayShift.at} / {dayShift.pre} jobs
                    </Text>
                  </View>
                  <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(dayShift.availableRate * 100, 100)}%` }}
                    />
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-400">
                      {Math.round(dayShift.availableRate * 100)}% available
                    </Text>
                    {w.totalAtDelta > 0 && (
                      <Text className="text-xs text-green-600 font-medium">
                        +{w.totalAtDelta} available this window
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                w.latestTick && (
                  <Text className="text-xs text-slate-500">
                    {w.latestTick.totals.length} shift
                    {w.latestTick.totals.length !== 1 ? 's' : ''} tracked
                  </Text>
                )
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SectionBreakdownCard({ sections }: { sections: SectionBreakdown[] }) {
  if (sections.length === 0) return null;

  const sorted = [...sections].sort((a, b) => b.pre - a.pre);

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="bar-chart-outline" size={18} color="#475569" />
        <Text className="font-semibold text-slate-800">Category Breakdown</Text>
      </View>
      <Text className="text-xs text-slate-500 mb-3">Day shift jobs by category</Text>
      <View className="gap-2.5">
        {sorted.map(section => {
          const fillRate = section.pre > 0 ? (section.at / section.pre) * 100 : 0;
          const barColor =
            fillRate >= 90 ? '#f87171' :
            fillRate >= 60 ? '#facc15' :
            '#3b82f6';
          return (
            <View key={section.section}>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm text-slate-700 font-medium">
                  {section.section}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-slate-500">
                    {section.at}/{section.pre}
                  </Text>
                  {section.delta > 0 && (
                    <View className="bg-green-50 px-1.5 py-0.5 rounded">
                      <Text className="text-[10px] text-green-600 font-medium">
                        +{section.delta}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(fillRate, 100)}%`,
                    backgroundColor: barColor,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View className="mt-3 pt-3 border-t border-slate-100">
        <View className="flex-row items-start gap-2">
          <Ionicons
            name="information-circle-outline"
            size={14}
            color="#94a3b8"
            style={{ marginTop: 1 }}
          />
          <Text className="text-[11px] text-slate-400 leading-relaxed flex-1">
            Dispatch fills categories in order: Trades first, then Dock Gantry,
            Machine categories, and Labour/HOLD last. Earlier categories claim workers first.
          </Text>
        </View>
      </View>
    </View>
  );
}

function DayOfWeekPattern({ currentDay }: { currentDay: number }) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="calendar-outline" size={18} color="#475569" />
        <Text className="font-semibold text-slate-800">Weekly Pattern</Text>
      </View>
      <Text className="text-xs text-slate-500 mb-3">Best days for casual dispatch</Text>
      <View className="flex-row justify-between gap-1">
        {DAY_LABELS.map((label, i) => {
          const quality = DAY_QUALITY[i];
          const isToday = i === currentDay;
          return (
            <View
              key={label}
              className={`flex-1 items-center p-2 rounded-xl ${isToday ? 'border-2 border-blue-500' : ''}`}
            >
              <Text
                className={`text-[10px] font-medium mb-1.5 ${isToday ? 'text-blue-600' : 'text-slate-500'}`}
              >
                {label}
              </Text>
              <View
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: quality.color }}
              />
              <Text
                className={`text-[9px] mt-1 ${isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
              >
                {quality.label}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="mt-3 pt-3 border-t border-slate-100">
        <View className="flex-row items-start gap-2">
          <Ionicons
            name="trending-up-outline"
            size={14}
            color="#94a3b8"
            style={{ marginTop: 1 }}
          />
          <Text className="text-[11px] text-slate-400 leading-relaxed flex-1">
            Monday-Wednesday typically have the highest job counts. Fridays are moderate.
            Weekends and holidays have the fewest casual opportunities -- union members take priority.
          </Text>
        </View>
      </View>
    </View>
  );
}

function RecentWindowsCard({ recentWindows }: { recentWindows: WindowSummary[] }) {
  if (recentWindows.length === 0) return null;

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="trending-up-outline" size={18} color="#475569" />
        <Text className="font-semibold text-slate-800">Recent Dispatch History</Text>
      </View>
      <View className="gap-2">
        {recentWindows.map((w, idx) => {
          const dayShift = w.dayShift;
          const date = w.latestTick?.date ?? '';
          const dayOfWeek = w.latestTick?.day_of_week ?? 0;

          return (
            <View
              key={w.latestTick?.date ?? `recent-${idx}`}
              className="flex-row items-center gap-3 p-2.5 bg-slate-50 rounded-xl"
            >
              <View className="items-center" style={{ minWidth: 40 }}>
                <Text className="text-xs font-medium text-slate-600">
                  {DAY_LABELS[dayOfWeek] ?? '?'}
                </Text>
                <Text className="text-[10px] text-slate-400">{date.slice(5)}</Text>
              </View>
              {dayShift ? (
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-slate-700">
                      {dayShift.at} / {dayShift.pre} jobs
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {Math.round(dayShift.availableRate * 100)}% available
                    </Text>
                  </View>
                  <View className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.min(dayShift.availableRate * 100, 100)}%` }}
                    />
                  </View>
                </View>
              ) : (
                <View className="flex-1">
                  <Text className="text-xs text-slate-400">No day shift data</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function DispatchScreen() {
  const router = useRouter();
  const { data, loading, nextWindow } = useDispatchIntel();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // No data state
  if (!data || !data.hasData) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="p-2 rounded-lg"
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color="#475569" />
            </Pressable>
            <Text className="text-xl font-bold text-slate-800">
              Dispatch Intelligence
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-6 shadow-sm items-center">
            <View className="p-4 bg-blue-50 rounded-2xl w-16 h-16 items-center justify-center mb-4">
              <Ionicons name="radio-outline" size={32} color="#2563eb" />
            </View>
            <Text className="text-lg font-bold text-slate-800 mb-2">
              Collecting Data
            </Text>
            <Text className="text-sm text-slate-500 text-center max-w-xs">
              Dispatch intelligence is collecting data. First insights will be
              available after tomorrow's morning dispatch.
            </Text>
            <View className="mt-4 p-3 bg-slate-50 rounded-xl w-full">
              <Text className="text-xs text-slate-500 text-center">
                The system monitors dispatch windows every 20 seconds, tracking
                job counts, fill rates, and category breakdowns to help you
                decide when to call in.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8 gap-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="p-2 rounded-lg"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color="#475569" />
          </Pressable>
          <Text className="text-xl font-bold text-slate-800">
            Dispatch Intelligence
          </Text>
        </View>

        {/* Signal Header */}
        <SignalHeader
          signal={data.signal}
          reason={data.signalReason}
          dayName={data.dayName}
        />

        {/* Quick Stats */}
        {data.latestDayShift && (
          <View className="flex-row gap-2">
            <View className="flex-1 bg-white rounded-xl p-3 shadow-sm items-center">
              <Text className="text-lg font-bold text-slate-800">
                {data.latestDayShift.pre}
              </Text>
              <Text className="text-[10px] text-slate-500">Jobs Posted</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-3 shadow-sm items-center">
              <Text className="text-lg font-bold text-slate-800">
                {data.latestDayShift.at}
              </Text>
              <Text className="text-[10px] text-slate-500">Jobs Filled</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-3 shadow-sm items-center">
              <Text className="text-lg font-bold text-blue-600">
                {Math.round(data.latestDayShift.availableRate * 100)}%
              </Text>
              <Text className="text-[10px] text-slate-500">Available</Text>
            </View>
          </View>
        )}

        {/* Current Dispatch Windows */}
        <CurrentWindowCard windows={data.windows} nextWindow={nextWindow} />

        {/* Category Breakdown */}
        <SectionBreakdownCard sections={data.sectionBreakdowns} />

        {/* Day-of-Week Pattern */}
        <DayOfWeekPattern currentDay={data.dayOfWeek} />

        {/* Recent History */}
        <RecentWindowsCard recentWindows={data.recentWindows} />

        {/* Casual advice */}
        <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <View className="flex-row items-start gap-3">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#2563eb"
              style={{ marginTop: 2 }}
            />
            <View className="flex-1">
              <Text className="text-sm font-medium text-blue-800 mb-1">
                Tip for Casuals
              </Text>
              <Text className="text-xs text-blue-700 leading-relaxed">
                Check this page the evening before to decide whether to call in.
                High job counts on weekdays (especially Monday-Wednesday) mean
                the best chances. The signal considers job volume, day of week,
                and how fast dispatch is filling positions.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
