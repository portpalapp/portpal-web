import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatchIntel } from '../hooks/useDispatchIntel';
import type { SignalLevel } from '../hooks/useDispatchIntel';

// ---------------------------------------------------------------------------
// Signal styling config
// ---------------------------------------------------------------------------

const SIGNAL_CONFIG: Record<SignalLevel, {
  dotColor: string;
  bgClass: string;
  borderClass: string;
  textColor: string;
  label: string;
}> = {
  Good: {
    dotColor: '#22c55e',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textColor: '#15803d',
    label: 'Good',
  },
  Moderate: {
    dotColor: '#eab308',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    textColor: '#a16207',
    label: 'Moderate',
  },
  Low: {
    dotColor: '#ef4444',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textColor: '#dc2626',
    label: 'Low',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DispatchSignal() {
  const router = useRouter();
  const { data, loading, nextWindow } = useDispatchIntel();

  if (loading) {
    return (
      <View className="bg-white rounded-2xl p-4 shadow-sm">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-slate-100 rounded-xl" />
          <View className="flex-1 gap-2">
            <View className="h-4 bg-slate-100 rounded w-2/3" />
            <View className="h-3 bg-slate-100 rounded w-1/2" />
          </View>
        </View>
        <ActivityIndicator size="small" color="#94a3b8" style={{ marginTop: 8 }} />
      </View>
    );
  }

  // No data yet
  if (!data || !data.hasData) {
    return (
      <Pressable
        onPress={() => router.push('/dispatch')}
        className="bg-slate-50 rounded-2xl p-4 border border-slate-200"
      >
        <View className="flex-row items-center gap-3">
          <View className="p-2 bg-blue-100 rounded-xl">
            <Ionicons name="radio-outline" size={20} color="#2563eb" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-slate-800 text-sm">
              Dispatch Intelligence
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              Collecting data. First insights available after tomorrow's morning dispatch.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </View>
      </Pressable>
    );
  }

  const config = SIGNAL_CONFIG[data.signal];
  const activeLabel = data.activeWindow?.windowType ?? null;
  const isActiveDispatch = activeLabel !== null;

  // Build the key stat line
  let keyStat = '';
  if (data.latestDayShift) {
    const { pre, at } = data.latestDayShift;
    keyStat = `${at} of ${pre} jobs available`;
  }

  // Day-of-week context for casuals
  let dayContext = '';
  if (data.isWeekend) {
    dayContext = `${data.dayName} -- members take most jobs`;
  } else {
    dayContext = `${data.dayName} -- best chances for casuals`;
  }

  return (
    <Pressable
      onPress={() => router.push('/dispatch')}
      className={`${config.bgClass} rounded-2xl p-4 border ${config.borderClass}`}
    >
      <View className="flex-row items-start gap-3">
        <View className="p-2 bg-white/70 rounded-xl">
          <Ionicons name="radio-outline" size={20} color={config.textColor} />
        </View>

        <View className="flex-1">
          {/* Signal label + dot */}
          <View className="flex-row items-center gap-2 mb-1">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: config.dotColor }}
            />
            <Text style={{ color: config.textColor }} className="text-sm font-bold">
              {config.label}
            </Text>
            <Text className="text-xs text-slate-500">Dispatch Signal</Text>
          </View>

          {/* Key stat */}
          {keyStat !== '' && (
            <Text className="text-sm font-medium text-slate-800">{keyStat}</Text>
          )}

          {/* Active window or next window */}
          <View className="flex-row items-center gap-1.5 mt-1.5">
            <Ionicons name="time-outline" size={12} color="#94a3b8" />
            {isActiveDispatch ? (
              <Text className="text-xs font-medium text-blue-600">{activeLabel}</Text>
            ) : (
              <Text className="text-xs text-slate-500">Next: {nextWindow}</Text>
            )}
          </View>

          {/* Stale data warning */}
          {data.isStale && (
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="alert-circle-outline" size={11} color="#f59e0b" />
              <Text className="text-[10px] text-amber-600">Data from {data.dateStr}</Text>
            </View>
          )}

          {/* Day context */}
          <Text className="text-[11px] text-slate-400 mt-1">{dayContext}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ marginTop: 4 }} />
      </View>
    </Pressable>
  );
}
