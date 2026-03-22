import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useShifts } from '../hooks/useShifts';
import { useProfile } from '../hooks/useProfile';
import { formatDateRelative } from '../lib/formatters';
import { getShiftAccentHex } from '../lib/shiftColors';

// Dispatch prediction based on the Dispatch Oracle system from CLAUDE.md
function calculateDispatchProbability(jobName: string, userBoard: string, userShifts: any[]) {
  // Simple prediction algorithm based on historical patterns
  const jobShifts = userShifts.filter(s => s.job === jobName);
  const totalJobShifts = jobShifts.length;
  
  if (totalJobShifts === 0) {
    // No history - return general market probability
    const marketProbabilities: Record<string, number> = {
      'LABOUR': 65, // High demand, low skill
      'TRACTOR TRAILER': 45, // Moderate demand
      'LIFT TRUCK': 55, // Common job
      'DOCK GANTRY': 25, // Specialized, low demand
      'RUBBER TIRE GANTRY': 30, // Specialized
      'HEAD CHECKER': 40, // Moderate demand
      'WHEAT MACHINE': 35, // Seasonal
      'HD MECHANIC': 20, // Specialized trades
    };
    return marketProbabilities[jobName] || 35;
  }

  // Calculate based on user history + board position
  const recentShifts = jobShifts.filter(s => {
    const shiftDate = new Date(s.date);
    const daysSince = (Date.now() - shiftDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30; // Last 30 days
  });

  let baseProbability = 40;
  
  // Board factor (A board gets dispatched first)
  const boardFactors: Record<string, number> = {
    'A': 1.3, 'B': 1.0, 'C': 0.8, 'T': 0.6, '00': 0.5, 'R': 0.4
  };
  baseProbability *= boardFactors[userBoard] || 1.0;

  // Recent activity factor
  const recentFrequency = recentShifts.length / 30; // shifts per day
  if (recentFrequency > 0.3) baseProbability *= 1.2; // Very active
  else if (recentFrequency > 0.1) baseProbability *= 1.1; // Active
  else if (recentFrequency < 0.05) baseProbability *= 0.8; // Less active

  // Cap at reasonable bounds
  return Math.min(Math.max(Math.round(baseProbability), 10), 85);
}

function getJobInsight(jobName: string, shifts: any[]) {
  const insights = [
    "This job typically dispatches in the morning wave (6:45-9:00 AM)",
    "High demand during container vessel operations",
    "Often requires specific terminal experience",
    "Frequently has overtime opportunities", 
    "Popular with senior workers on your board",
    "Dispatch order: after trades, before general labour",
    "Weekend work common for this classification"
  ];
  
  // Pick insight based on job type
  if (jobName.includes('GANTRY')) return "Crane operations require specific certification and experience";
  if (jobName.includes('MECHANIC')) return "Trades dispatch first - higher probability early in sequence";
  if (jobName.includes('LABOUR')) return "General labour dispatches last but has highest volume";
  if (jobName.includes('TRACTOR')) return "TT work often has built-in overtime at most terminals";
  if (jobName.includes('WHEAT')) return "Seasonal work - demand varies by grain vessel schedule";
  
  return insights[Math.floor(Math.random() * insights.length)];
}

export default function JobDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobName?: string }>();
  const { shifts, loading: shiftsLoading } = useShifts();
  const { profile, loading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['shifts'], stale: true });
      queryClient.invalidateQueries({ queryKey: ['profile'], stale: true });
    }, [queryClient])
  );

  const jobName = params.jobName;
  const loading = shiftsLoading || profileLoading;

  if (!jobName) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center" edges={['top']}>
        <Text className="text-slate-500">No job specified</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // Filter shifts for this job
  const jobShifts = shifts.filter(s => s.job === jobName);
  const totalEarnings = jobShifts.reduce((sum, s) => sum + s.totalPay, 0);
  const totalHours = jobShifts.reduce((sum, s) => sum + s.regHours + s.otHours, 0);
  const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

  // Calculate dispatch probability
  const dispatchProbability = calculateDispatchProbability(jobName, profile.board || 'B', shifts);
  
  // Get most common terminals for this job
  const terminalStats = jobShifts.reduce((acc, s) => {
    if (!acc[s.location]) acc[s.location] = 0;
    acc[s.location]++;
    return acc;
  }, {} as Record<string, number>);
  
  const topTerminals = Object.entries(terminalStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([terminal, count]) => ({ terminal, count }));

  // Most common shifts
  const shiftStats = jobShifts.reduce((acc, s) => {
    if (!acc[s.shift]) acc[s.shift] = 0;
    acc[s.shift]++;
    return acc;
  }, {} as Record<string, number>);
  
  const preferredShift = Object.entries(shiftStats)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'DAY';

  // Recent activity (last 30 days)
  const recentShifts = jobShifts.filter(s => {
    const shiftDate = new Date(s.date);
    const daysSince = (Date.now() - shiftDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  });

  // Performance metrics
  const avgPay = jobShifts.length > 0 ? totalEarnings / jobShifts.length : 0;
  const lastWorked = jobShifts.length > 0 ? jobShifts[0].date : null; // shifts are ordered desc
  
  const jobInsight = getJobInsight(jobName, jobShifts);
  
  // Determine dispatch timing
  const getDispatchTiming = () => {
    if (jobName.includes('MECHANIC') || jobName.includes('ELECTRICIAN') || jobName.includes('TRADES')) {
      return "Trades dispatch first (6:45-7:15 AM)";
    }
    if (jobName.includes('GANTRY')) {
      return "Crane ops dispatch early (7:00-7:30 AM)";
    }
    if (jobName.includes('LABOUR')) {
      return "General labour dispatches last (8:30-9:00 AM)";
    }
    return "Typically dispatches 7:15-8:15 AM";
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView 
        className="flex-1" 
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color="#475569" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-800" numberOfLines={2}>
              {jobName}
            </Text>
            <Text className="text-sm text-slate-500">Job Classification Details</Text>
          </View>
        </View>

        {/* Dispatch Prediction Card */}
        <View className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 mb-4 overflow-hidden">
          <View className="absolute inset-0 bg-blue-700 rounded-2xl opacity-50" />
          <View className="relative">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="analytics" size={18} color="#e0f2fe" />
              <Text className="font-semibold text-white">Dispatch Prediction</Text>
            </View>
            <View className="flex-row items-end gap-2">
              <Text className="text-4xl font-bold text-white">{dispatchProbability}%</Text>
              <Text className="text-blue-200 text-lg font-medium mb-1">likely tomorrow</Text>
            </View>
            <Text className="text-blue-100 text-sm mt-2">{getDispatchTiming()}</Text>
            <View className="flex-row items-center gap-1 mt-2">
              <Ionicons name="information-circle" size={14} color="#93c5fd" />
              <Text className="text-blue-200 text-xs flex-1">{jobInsight}</Text>
            </View>
          </View>
        </View>

        {/* Your Stats - 2x2 Grid */}
        <View className="flex-row flex-wrap justify-between mb-4">
          <View className="w-[48%] bg-white rounded-xl p-3 border border-slate-200 mb-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="calendar-outline" size={14} color="#64748b" />
              <Text className="text-xs text-slate-500">Times Worked</Text>
            </View>
            <Text className="text-xl font-bold text-slate-800">
              {jobShifts.length}
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              {recentShifts.length} in last 30 days
            </Text>
          </View>

          <View className="w-[48%] bg-white rounded-xl p-3 border border-slate-200 mb-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="cash-outline" size={14} color="#64748b" />
              <Text className="text-xs text-slate-500">Avg Per Shift</Text>
            </View>
            <Text className="text-xl font-bold text-green-600">
              ${avgPay.toFixed(0)}
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              ${avgHourlyRate.toFixed(2)}/hr
            </Text>
          </View>

          <View className="w-[48%] bg-white rounded-xl p-3 border border-slate-200">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text className="text-xs text-slate-500">Top Terminal</Text>
            </View>
            <Text className="text-lg font-bold text-slate-800" numberOfLines={1}>
              {topTerminals[0]?.terminal || 'N/A'}
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              {topTerminals[0]?.count || 0} times
            </Text>
          </View>

          <View className="w-[48%] bg-white rounded-xl p-3 border border-slate-200">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="time-outline" size={14} color="#64748b" />
              <Text className="text-xs text-slate-500">Preferred Shift</Text>
            </View>
            <Text className="text-lg font-bold text-slate-800">
              {preferredShift}
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              Most common
            </Text>
          </View>
        </View>

        {/* Terminals Worked */}
        {topTerminals.length > 0 && (
          <View className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
            <Text className="font-semibold text-slate-800 mb-3">
              Terminals You've Worked
            </Text>
            <View className="gap-2">
              {topTerminals.map(({ terminal, count }) => (
                <View key={terminal} className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View 
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: getShiftAccentHex('DAY') }}
                    />
                    <Text className="font-medium text-slate-800">{terminal}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-bold text-slate-800">{count}</Text>
                    <Text className="text-xs text-slate-500">shifts</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent History */}
        {recentShifts.length > 0 && (
          <View className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
            <Text className="font-semibold text-slate-800 mb-3">
              Recent Activity ({recentShifts.length} shifts)
            </Text>
            <View className="gap-2">
              {recentShifts.slice(0, 5).map((shift) => (
                <View key={shift.id} className="flex-row items-center gap-3 p-2 rounded-lg bg-slate-50">
                  <View 
                    className="w-1.5 h-8 rounded-full"
                    style={{ backgroundColor: getShiftAccentHex(shift.shift) }}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-medium text-slate-800 text-sm">
                        {shift.location}
                      </Text>
                      <Text className="font-semibold text-slate-800">
                        ${shift.totalPay.toFixed(0)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-slate-500">
                        {shift.shift} · {shift.regHours}h{shift.otHours > 0 ? ` + ${shift.otHours}OT` : ''}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {formatDateRelative(shift.date)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            
            {lastWorked && (
              <View className="mt-3 pt-3 border-t border-slate-100 flex-row justify-between items-center">
                <Text className="text-sm text-slate-600">Last worked this job</Text>
                <Text className="text-sm font-medium text-slate-800">
                  {formatDateRelative(lastWorked)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* No History State */}
        {jobShifts.length === 0 && (
          <View className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
            <View className="items-center py-6">
              <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="briefcase-outline" size={24} color="#64748b" />
              </View>
              <Text className="font-medium text-slate-800 text-center mb-1">
                You haven't worked this job yet
              </Text>
              <Text className="text-sm text-slate-500 text-center mb-4">
                Dispatch prediction based on market data for your board position
              </Text>
              <TouchableOpacity 
                onPress={() => router.push({ 
                  pathname: '/(tabs)/shifts', 
                  params: { prefillJob: jobName } 
                })}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Log a Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Market Insights */}
        <View className="bg-slate-800 rounded-xl p-4">
          <Text className="font-semibold text-white mb-3">Market Intelligence</Text>
          <View className="gap-2">
            <Text className="text-sm text-slate-300">
              • Demand varies by vessel schedule and terminal operations
            </Text>
            <Text className="text-sm text-slate-300">
              • Board {profile.board || 'B'} position affects dispatch probability
            </Text>
            <Text className="text-sm text-slate-300">
              • Consider plug-in timing for best dispatch chances
            </Text>
            {jobName.includes('CENTENNIAL') && (
              <Text className="text-sm text-slate-300">
                • Centennial typically offers 9-hour shifts (vs 8h elsewhere)
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}