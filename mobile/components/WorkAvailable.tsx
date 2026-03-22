import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkInfo } from '../hooks/useWorkInfo';
import type { ShiftTotal } from '../hooks/useWorkInfo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDayShiftTotals(totals: ShiftTotal[]): { pre: number; at: number } {
  const day = totals.find(t => t.shift === '08:00');
  if (!day) return { pre: 0, at: 0 };
  return {
    pre: parseInt(day.pre, 10) || 0,
    at: parseInt(day.at, 10) || 0,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkAvailable() {
  const router = useRouter();
  const { snapshots, loading } = useWorkInfo(['vancouver']);

  if (loading) {
    return (
      <View className="bg-white rounded-2xl p-4 shadow-sm">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="w-5 h-5 bg-slate-100 rounded" />
          <View className="h-4 bg-slate-100 rounded w-1/3" />
        </View>
        <ActivityIndicator size="small" color="#94a3b8" />
      </View>
    );
  }

  const vancouver = snapshots.find(s => s.location === 'vancouver');

  if (!vancouver) {
    return null;
  }

  const { pre, at } = parseDayShiftTotals(vancouver.totals);

  if (pre === 0 && at === 0) {
    return null;
  }

  const available = at;
  const total = pre;
  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;

  return (
    <Pressable
      onPress={() => router.push('/dispatch')}
      className="bg-white rounded-2xl p-4 shadow-sm"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="briefcase-outline" size={18} color="#2563eb" />
          <Text className="font-semibold text-slate-800">Work Available</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-blue-600 font-medium">Details</Text>
          <Ionicons name="chevron-forward" size={14} color="#2563eb" />
        </View>
      </View>

      <View className="flex-row gap-3">
        {/* Total jobs */}
        <View className="flex-1 bg-blue-50 rounded-xl p-3 items-center">
          <Text className="text-xl font-bold text-blue-700">{total}</Text>
          <Text className="text-[10px] text-blue-600 mt-0.5">Jobs Posted</Text>
        </View>
        {/* Jobs available */}
        <View className="flex-1 bg-green-50 rounded-xl p-3 items-center">
          <Text className="text-xl font-bold text-green-700">{available}</Text>
          <Text className="text-[10px] text-green-600 mt-0.5">Available</Text>
        </View>
        {/* Fill rate */}
        <View className="flex-1 bg-slate-50 rounded-xl p-3 items-center">
          <Text className="text-xl font-bold text-slate-700">{availablePct}%</Text>
          <Text className="text-[10px] text-slate-500 mt-0.5">Available</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="mt-3">
        <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${Math.min(availablePct, 100)}%` }}
          />
        </View>
        <Text className="text-[10px] text-slate-400 mt-1">
          Vancouver day shift (08:00)
        </Text>
      </View>
    </Pressable>
  );
}
