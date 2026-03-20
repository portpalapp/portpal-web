import { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShifts } from '../hooks/useShifts';
import { calculateYTDEarnings } from '../data/mockData';
import {
  PENSION_2026,
  PENSION_TABLE,
  SER_RULES,
  BRIDGE,
  RETIRING_ALLOWANCE,
  GOVT_BENEFITS,
  RETIREMENT_SCENARIOS,
  estimatePension,
  calculateBridge,
  getPensionYearProgress,
} from '../data/pensionData';

type PensionTab = 'overview' | 'calculator' | 'planner' | 'rules';

export default function PensionScreen() {
  const router = useRouter();
  const { shifts } = useShifts();
  const [tab, setTab] = useState<PensionTab>('overview');
  const [calcAge, setCalcAge] = useState(62);
  const [calcYears, setCalcYears] = useState(25);

  // Planner state
  const [planShiftsPerWeek, setPlanShiftsPerWeek] = useState(4);
  const [planAvgPay, setPlanAvgPay] = useState('');
  const [planWorkWeekends, setPlanWorkWeekends] = useState(false);
  const [planWorkHolidays, setPlanWorkHolidays] = useState(false);
  const [planMonthOff, setPlanMonthOff] = useState(true);
  const [planMonthsOff, setPlanMonthsOff] = useState(1);
  const [planPreferredShift, setPlanPreferredShift] = useState<'DAY' | 'NIGHT' | 'GRAVEYARD' | 'MIX'>('MIX');
  const [planGoalDate, setPlanGoalDate] = useState('');
  const [planGoalAmount, setPlanGoalAmount] = useState(PENSION_2026.earningsLimit.toString());
  const [planLoaded, setPlanLoaded] = useState(false);

  // Load saved planner settings
  useEffect(() => {
    AsyncStorage.getItem('portpal_pension_plan').then((stored) => {
      if (stored) {
        try {
          const p = JSON.parse(stored);
          if (p.shiftsPerWeek) setPlanShiftsPerWeek(p.shiftsPerWeek);
          if (p.avgPay) setPlanAvgPay(p.avgPay);
          if (p.workWeekends !== undefined) setPlanWorkWeekends(p.workWeekends);
          if (p.workHolidays !== undefined) setPlanWorkHolidays(p.workHolidays);
          if (p.monthOff !== undefined) setPlanMonthOff(p.monthOff);
          if (p.monthsOff) setPlanMonthsOff(p.monthsOff);
          if (p.preferredShift) setPlanPreferredShift(p.preferredShift);
          if (p.goalDate) setPlanGoalDate(p.goalDate);
          if (p.goalAmount) setPlanGoalAmount(p.goalAmount);
          if (p.calcAge) setCalcAge(p.calcAge);
          if (p.calcYears) setCalcYears(p.calcYears);
        } catch { /* ignore parse errors */ }
      }
      setPlanLoaded(true);
    }).catch(() => setPlanLoaded(true));
  }, []);

  // Auto-save planner settings whenever they change
  useEffect(() => {
    if (!planLoaded) return;
    AsyncStorage.setItem('portpal_pension_plan', JSON.stringify({
      shiftsPerWeek: planShiftsPerWeek,
      avgPay: planAvgPay,
      workWeekends: planWorkWeekends,
      workHolidays: planWorkHolidays,
      monthOff: planMonthOff,
      monthsOff: planMonthsOff,
      preferredShift: planPreferredShift,
      goalDate: planGoalDate,
      goalAmount: planGoalAmount,
      calcAge,
      calcYears,
    })).catch(() => {});
  }, [planLoaded, planShiftsPerWeek, planAvgPay, planWorkWeekends, planWorkHolidays, planMonthOff, planMonthsOff, planPreferredShift, planGoalDate, planGoalAmount, calcAge, calcYears]);

  const ytdEarnings = calculateYTDEarnings(shifts);
  const progress = getPensionYearProgress(ytdEarnings);

  const calcResult = useMemo(() => {
    const pension = estimatePension(calcAge, calcYears);
    const bridge = calculateBridge(calcYears, calcAge);
    let cpp = 0;
    if (calcAge >= 65) cpp = GOVT_BENEFITS.cppMax65;
    else if (calcAge >= 62) cpp = GOVT_BENEFITS.cppMax62;
    else if (calcAge >= 60) cpp = GOVT_BENEFITS.cppMax60;
    const oas = calcAge >= 65 ? GOVT_BENEFITS.oasMax65 : 0;
    return { pension, bridge, cpp, oas, total: pension + bridge + cpp + oas };
  }, [calcAge, calcYears]);

  const tabStyle = (t: PensionTab) =>
    `px-4 py-2 rounded-full ${tab === t ? 'bg-blue-600' : 'bg-slate-100'}`;
  const tabText = (t: PensionTab) =>
    `text-sm font-medium ${tab === t ? 'text-white' : 'text-slate-600'}`;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 gap-3">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-800">Pension</Text>
          <Text className="text-xs text-slate-500">Waterfront Industry Pension Plan</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 px-4 mb-3">
        {(['overview', 'planner', 'calculator', 'rules'] as PensionTab[]).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} className={tabStyle(t)}>
            <Text className={tabText(t)}>
              {t === 'overview' ? 'Overview' : t === 'planner' ? 'Planner' : t === 'calculator' ? 'Calculator' : 'Rules'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8" showsVerticalScrollIndicator={false}>
        {tab === 'overview' && (
          <>
            {/* Pension Year Progress */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="flag" size={18} color="#2563eb" />
                  <Text className="font-semibold text-slate-800">Pension Year Earnings</Text>
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-blue-600">
                    ${ytdEarnings.toLocaleString()}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    of ${progress.limit.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${progress.qualifiesFull ? 'bg-green-500' : progress.qualifiesPartial ? 'bg-blue-500' : 'bg-orange-400'}`}
                  style={{ width: `${Math.min(progress.pct, 100)}%` }}
                />
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-slate-500">{progress.pct.toFixed(1)}% complete</Text>
                <Text className={`text-xs font-medium ${progress.qualifiesFull ? 'text-green-600' : progress.qualifiesPartial ? 'text-blue-600' : 'text-orange-500'}`}>
                  {progress.qualifiesFull
                    ? 'Full Year Qualified'
                    : progress.qualifiesPartial
                      ? 'Partial Year Qualified'
                      : `$${(progress.partial - ytdEarnings).toLocaleString()} to partial year`}
                </Text>
              </View>
            </View>

            {/* Key Numbers for 2026 */}
            <Text className="text-sm font-semibold text-slate-700 mb-2">2026 Key Numbers</Text>
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-blue-50 rounded-2xl p-3 border border-blue-100">
                <Text className="text-xs text-blue-600 font-medium">Pension Rate</Text>
                <Text className="text-lg font-bold text-blue-700">${PENSION_2026.ratePerMonth}</Text>
                <Text className="text-xs text-slate-500">/month per year</Text>
              </View>
              <View className="flex-1 bg-green-50 rounded-2xl p-3 border border-green-100">
                <Text className="text-xs text-green-600 font-medium">Max Pension</Text>
                <Text className="text-lg font-bold text-green-700">${PENSION_2026.maxMonthlyPension.toLocaleString()}</Text>
                <Text className="text-xs text-slate-500">/month (35 yrs)</Text>
              </View>
            </View>
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-purple-50 rounded-2xl p-3 border border-purple-100">
                <Text className="text-xs text-purple-600 font-medium">Earnings Limit</Text>
                <Text className="text-lg font-bold text-purple-700">${PENSION_2026.earningsLimit.toLocaleString()}</Text>
                <Text className="text-xs text-slate-500">full pension year</Text>
              </View>
              <View className="flex-1 bg-amber-50 rounded-2xl p-3 border border-amber-100">
                <Text className="text-xs text-amber-600 font-medium">Contribution</Text>
                <Text className="text-lg font-bold text-amber-700">${PENSION_2026.employeeContribution.toLocaleString()}</Text>
                <Text className="text-xs text-slate-500">/year employee</Text>
              </View>
            </View>

            {/* Retirement Scenarios */}
            <Text className="text-sm font-semibold text-slate-700 mb-2">Retirement Scenarios</Text>
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
              {/* Header */}
              <View className="flex-row bg-slate-700 px-3 py-2">
                <Text className="text-xs font-medium text-white w-10">Age</Text>
                <Text className="text-xs font-medium text-white w-10">Yrs</Text>
                <Text className="text-xs font-medium text-white flex-1 text-right">Pension</Text>
                <Text className="text-xs font-medium text-white flex-1 text-right">Bridge</Text>
                <Text className="text-xs font-medium text-white flex-1 text-right">Total</Text>
              </View>
              {RETIREMENT_SCENARIOS.map((s, i) => (
                <View
                  key={i}
                  className={`flex-row px-3 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                >
                  <Text className="text-xs text-slate-700 w-10 font-medium">{s.age}</Text>
                  <Text className="text-xs text-slate-600 w-10">{s.years}</Text>
                  <Text className="text-xs text-slate-700 flex-1 text-right">${s.pension.toLocaleString()}</Text>
                  <Text className="text-xs text-slate-600 flex-1 text-right">
                    {s.bridge > 0 ? `$${s.bridge.toLocaleString()}` : '-'}
                  </Text>
                  <Text className="text-xs text-blue-700 font-semibold flex-1 text-right">
                    ${s.total.toLocaleString()}
                  </Text>
                </View>
              ))}
              <View className="px-3 py-2 bg-slate-100">
                <Text className="text-xs text-slate-500">Total includes CPP + OAS where applicable</Text>
              </View>
            </View>

            {/* Service Years Upload Placeholder */}
            <TouchableOpacity
              activeOpacity={0.7}
              className="bg-slate-100 rounded-2xl p-4 flex-row items-center gap-3 mb-4"
            >
              <View className="p-2 bg-blue-100 rounded-xl">
                <Ionicons name="document-attach-outline" size={24} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-slate-800">Upload Service Years History</Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Get your statement from the employer to track your credited years
                </Text>
              </View>
              <View className="bg-blue-600 px-3 py-1.5 rounded-full">
                <Text className="text-xs font-medium text-white">Coming Soon</Text>
              </View>
            </TouchableOpacity>

            {/* Contact */}
            <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <Text className="font-semibold text-blue-800 mb-1">Pension Questions?</Text>
              <Text className="text-xs text-blue-700 mb-2">
                Contact the Pension Office for your individual situation.
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => Linking.openURL('tel:6046897184')}
                  className="flex-1 bg-blue-600 rounded-xl py-2.5 flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text className="text-white text-sm font-medium">(604) 689-7184</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Linking.openURL('mailto:pensions@webc.ca')}
                  className="flex-1 bg-white rounded-xl py-2.5 flex-row items-center justify-center gap-2 border border-blue-200"
                >
                  <Ionicons name="mail" size={16} color="#2563eb" />
                  <Text className="text-blue-600 text-sm font-medium">Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {tab === 'planner' && (() => {
          // Calculate current pace from actual shifts
          const pensionYearStart = new Date('2026-01-04');
          const now = new Date();
          const daysSinceStart = Math.max(1, Math.round((now.getTime() - pensionYearStart.getTime()) / 86400000));
          const weeksSinceStart = daysSinceStart / 7;
          const earningsPerWeek = weeksSinceStart > 0 ? ytdEarnings / weeksSinceStart : 0;
          const shiftsThisYear = shifts.filter(s => s.date.slice(0, 10) >= '2026-01-04').length;
          const shiftsPerWeek = weeksSinceStart > 0 ? shiftsThisYear / weeksSinceStart : 0;

          // Calculate average shift pay from actual data
          const actualAvgPay = shiftsThisYear > 0 ? ytdEarnings / shiftsThisYear : 550;
          const avgPayToUse = planAvgPay ? parseFloat(planAvgPay) : actualAvgPay;

          // Shift pay modifiers based on shift type preference
          const shiftMultiplier = planPreferredShift === 'NIGHT' ? 1.26 : planPreferredShift === 'GRAVEYARD' ? 1.56 : planPreferredShift === 'DAY' ? 1.0 : 1.15;
          const weekendBonus = planWorkWeekends ? avgPayToUse * 0.28 * 1.5 : 0; // ~28% of week = 2 days, 1.5x rate
          const holidayBonus = planWorkHolidays ? avgPayToUse * 2.0 * (11 / 52) : 0; // 11 stat holidays/yr, 2x pay

          // Work weeks per year
          const workWeeksPerYear = 52 - (planMonthOff ? planMonthsOff * 4.33 : 0);

          // Projected weekly earnings
          const projectedWeeklyEarnings = (planShiftsPerWeek * avgPayToUse * shiftMultiplier) + weekendBonus + holidayBonus;
          const projectedAnnualEarnings = projectedWeeklyEarnings * workWeeksPerYear;

          // Goal calculations
          const goalAmount = parseFloat(planGoalAmount) || PENSION_2026.earningsLimit;
          const remaining = Math.max(0, goalAmount - ytdEarnings);
          const weeksToGoal = projectedWeeklyEarnings > 0 ? remaining / projectedWeeklyEarnings : Infinity;
          const projectedGoalDate = new Date(now);
          projectedGoalDate.setDate(projectedGoalDate.getDate() + Math.ceil(weeksToGoal * 7));

          // Check if user-set goal date is feasible
          const goalDateObj = planGoalDate ? new Date(planGoalDate + 'T00:00:00') : null;
          const weeksUntilGoalDate = goalDateObj ? Math.max(0, (goalDateObj.getTime() - now.getTime()) / (7 * 86400000)) : null;
          const requiredWeeklyForGoalDate = weeksUntilGoalDate && weeksUntilGoalDate > 0 ? remaining / weeksUntilGoalDate : null;
          const requiredShiftsForGoalDate = requiredWeeklyForGoalDate && avgPayToUse > 0 ? requiredWeeklyForGoalDate / (avgPayToUse * shiftMultiplier) : null;

          // Current pace projection
          const paceAnnualProjection = earningsPerWeek * 52;
          const onTrack = paceAnnualProjection >= goalAmount;

          // Pension year end
          const pensionYearEnd = new Date('2027-01-03');
          const weeksRemaining = Math.max(0, (pensionYearEnd.getTime() - now.getTime()) / (7 * 86400000));

          return (
            <>
              {/* Current Pace Card */}
              <View className={`rounded-2xl p-4 mb-4 ${onTrack ? 'bg-green-600' : 'bg-orange-500'}`}>
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name={onTrack ? 'checkmark-circle' : 'warning'} size={20} color="#fff" />
                  <Text className="font-semibold text-white text-base">
                    {onTrack ? 'On Track' : 'Behind Pace'}
                  </Text>
                </View>
                <Text className="text-white/90 text-sm mb-3">
                  At your current pace of ${Math.round(earningsPerWeek).toLocaleString()}/week, you'll earn ${Math.round(paceAnnualProjection).toLocaleString()} this pension year.
                </Text>
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-white/20 rounded-xl p-3">
                    <Text className="text-white/70 text-xs">Earned</Text>
                    <Text className="text-white font-bold text-lg">${ytdEarnings.toLocaleString()}</Text>
                  </View>
                  <View className="flex-1 bg-white/20 rounded-xl p-3">
                    <Text className="text-white/70 text-xs">Remaining</Text>
                    <Text className="text-white font-bold text-lg">${remaining.toLocaleString()}</Text>
                  </View>
                  <View className="flex-1 bg-white/20 rounded-xl p-3">
                    <Text className="text-white/70 text-xs">Weeks Left</Text>
                    <Text className="text-white font-bold text-lg">{Math.round(weeksRemaining)}</Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm font-medium text-slate-700">Progress to Goal</Text>
                  <Text className="text-sm font-bold text-blue-600">{Math.min(100, (ytdEarnings / goalAmount * 100)).toFixed(1)}%</Text>
                </View>
                <View className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <View
                    className={`h-full rounded-full ${onTrack ? 'bg-green-500' : 'bg-orange-400'}`}
                    style={{ width: `${Math.min(100, (ytdEarnings / goalAmount * 100))}%` }}
                  />
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">${ytdEarnings.toLocaleString()}</Text>
                  <Text className="text-xs text-slate-500">${goalAmount.toLocaleString()}</Text>
                </View>
              </View>

              {/* Goal Settings */}
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <Text className="font-semibold text-slate-800 mb-3">Your Goal</Text>
                <View className="gap-3">
                  <View>
                    <Text className="text-xs font-medium text-slate-500 mb-1">Target Earnings ($)</Text>
                    <TextInput
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                      value={planGoalAmount}
                      onChangeText={setPlanGoalAmount}
                      keyboardType="numeric"
                      placeholder="120000"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-medium text-slate-500 mb-1">Target Date (YYYY-MM-DD)</Text>
                    <TextInput
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                      value={planGoalDate}
                      onChangeText={setPlanGoalDate}
                      placeholder="2027-01-03"
                      placeholderTextColor="#94a3b8"
                      maxLength={10}
                    />
                  </View>
                  {goalDateObj && requiredShiftsForGoalDate !== null && (
                    <View className={`rounded-xl p-3 ${requiredShiftsForGoalDate <= 5 ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                      <Text className={`text-sm font-medium ${requiredShiftsForGoalDate <= 5 ? 'text-green-700' : 'text-orange-700'}`}>
                        {requiredShiftsForGoalDate <= 5
                          ? `Achievable — you need ~${requiredShiftsForGoalDate.toFixed(1)} shifts/week ($${Math.round(requiredWeeklyForGoalDate!).toLocaleString()}/week)`
                          : `Tough — you'd need ~${requiredShiftsForGoalDate.toFixed(1)} shifts/week ($${Math.round(requiredWeeklyForGoalDate!).toLocaleString()}/week)`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Work Plan Settings */}
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <Text className="font-semibold text-slate-800 mb-3">Work Plan</Text>
                <View className="gap-4">
                  {/* Shifts per week */}
                  <View>
                    <Text className="text-xs font-medium text-slate-500 mb-2">Shifts Per Week</Text>
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        onPress={() => setPlanShiftsPerWeek(Math.max(1, planShiftsPerWeek - 1))}
                        className="p-2 bg-slate-100 rounded-xl"
                      >
                        <Ionicons name="remove" size={18} color="#475569" />
                      </TouchableOpacity>
                      <Text className="text-3xl font-bold text-blue-600">{planShiftsPerWeek}</Text>
                      <TouchableOpacity
                        onPress={() => setPlanShiftsPerWeek(Math.min(7, planShiftsPerWeek + 1))}
                        className="p-2 bg-slate-100 rounded-xl"
                      >
                        <Ionicons name="add" size={18} color="#475569" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Avg pay per shift */}
                  <View>
                    <Text className="text-xs font-medium text-slate-500 mb-1">
                      Avg Pay Per Shift {!planAvgPay && shiftsThisYear > 0 ? `(auto: $${Math.round(actualAvgPay)})` : ''}
                    </Text>
                    <TextInput
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                      value={planAvgPay}
                      onChangeText={setPlanAvgPay}
                      keyboardType="numeric"
                      placeholder={`${Math.round(actualAvgPay)}`}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  {/* Preferred shift */}
                  <View>
                    <Text className="text-xs font-medium text-slate-500 mb-2">Preferred Shift</Text>
                    <View className="flex-row gap-2">
                      {(['DAY', 'NIGHT', 'GRAVEYARD', 'MIX'] as const).map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => setPlanPreferredShift(s)}
                          className={`flex-1 py-2 rounded-xl items-center ${planPreferredShift === s ? 'bg-blue-600' : 'bg-slate-100'}`}
                        >
                          <Text className={`text-xs font-medium ${planPreferredShift === s ? 'text-white' : 'text-slate-600'}`}>
                            {s === 'MIX' ? 'Mix' : s.charAt(0) + s.slice(1).toLowerCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Toggles */}
                  <View className="flex-row items-center justify-between py-1">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="calendar-outline" size={18} color="#475569" />
                      <Text className="text-sm text-slate-700">Work weekends?</Text>
                    </View>
                    <Switch
                      value={planWorkWeekends}
                      onValueChange={setPlanWorkWeekends}
                      trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                      thumbColor="#fff"
                    />
                  </View>

                  <View className="flex-row items-center justify-between py-1">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="gift-outline" size={18} color="#475569" />
                      <Text className="text-sm text-slate-700">Work stat holidays?</Text>
                    </View>
                    <Switch
                      value={planWorkHolidays}
                      onValueChange={setPlanWorkHolidays}
                      trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                      thumbColor="#fff"
                    />
                  </View>

                  <View className="flex-row items-center justify-between py-1">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="airplane-outline" size={18} color="#475569" />
                      <Text className="text-sm text-slate-700">Taking time off?</Text>
                    </View>
                    <Switch
                      value={planMonthOff}
                      onValueChange={setPlanMonthOff}
                      trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                      thumbColor="#fff"
                    />
                  </View>

                  {planMonthOff && (
                    <View>
                      <Text className="text-xs font-medium text-slate-500 mb-2">Months Off</Text>
                      <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                          onPress={() => setPlanMonthsOff(Math.max(1, planMonthsOff - 1))}
                          className="p-2 bg-slate-100 rounded-xl"
                        >
                          <Ionicons name="remove" size={18} color="#475569" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-blue-600">{planMonthsOff}</Text>
                        <TouchableOpacity
                          onPress={() => setPlanMonthsOff(Math.min(6, planMonthsOff + 1))}
                          className="p-2 bg-slate-100 rounded-xl"
                        >
                          <Ionicons name="add" size={18} color="#475569" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Projection Results */}
              <View className="bg-slate-800 rounded-2xl p-4 mb-4">
                <Text className="text-sm font-medium text-slate-300 mb-3">Your Projection</Text>
                <View className="gap-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-slate-400">Projected weekly</Text>
                    <Text className="text-base font-bold text-white">${Math.round(projectedWeeklyEarnings).toLocaleString()}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-slate-400">Projected annual</Text>
                    <Text className="text-base font-bold text-white">${Math.round(projectedAnnualEarnings).toLocaleString()}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-slate-400">Working weeks</Text>
                    <Text className="text-base font-bold text-white">{Math.round(workWeeksPerYear)}</Text>
                  </View>

                  <View className="border-t border-slate-600 mt-1 pt-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-slate-300">Goal hit date</Text>
                      <Text className={`text-base font-bold ${weeksToGoal <= weeksRemaining ? 'text-green-400' : 'text-orange-400'}`}>
                        {weeksToGoal === Infinity
                          ? 'N/A'
                          : projectedGoalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    {weeksToGoal !== Infinity && (
                      <Text className={`text-xs mt-1 ${weeksToGoal <= weeksRemaining ? 'text-green-400' : 'text-orange-400'}`}>
                        {weeksToGoal <= weeksRemaining
                          ? `You'll hit your goal ${Math.round(weeksRemaining - weeksToGoal)} weeks early!`
                          : `You'll be ${Math.round(weeksToGoal - weeksRemaining)} weeks past the pension year end`}
                      </Text>
                    )}
                  </View>

                  {/* Full pension year qualifier */}
                  <View className="border-t border-slate-600 mt-1 pt-3">
                    <View className="flex-row items-center gap-2">
                      <Ionicons
                        name={projectedAnnualEarnings >= PENSION_2026.earningsLimit ? 'checkmark-circle' : 'alert-circle'}
                        size={18}
                        color={projectedAnnualEarnings >= PENSION_2026.earningsLimit ? '#4ade80' : '#fb923c'}
                      />
                      <Text className="text-sm text-slate-300">
                        {projectedAnnualEarnings >= PENSION_2026.earningsLimit
                          ? 'Full pension year qualified'
                          : projectedAnnualEarnings >= PENSION_2026.partialThreshold
                            ? 'Partial pension year qualified'
                            : 'Not enough for pension year credit'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Tips */}
              <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="bulb-outline" size={18} color="#2563eb" />
                  <Text className="font-semibold text-blue-800">Tips to Hit Your Goal</Text>
                </View>
                <View className="gap-2">
                  {!planWorkWeekends && (
                    <Text className="text-sm text-blue-700">• Weekend shifts pay 28%+ more — toggling weekends on could add ${Math.round(avgPayToUse * 0.28 * 1.5 * workWeeksPerYear).toLocaleString()}/year</Text>
                  )}
                  {planPreferredShift === 'DAY' && (
                    <Text className="text-sm text-blue-700">• Night shifts pay ~26% more, graveyard ~56% more than day shifts</Text>
                  )}
                  {planMonthOff && planMonthsOff >= 2 && (
                    <Text className="text-sm text-blue-700">• Reducing time off by 1 month adds ~${Math.round(projectedWeeklyEarnings * 4.33).toLocaleString()} to your annual total</Text>
                  )}
                  {planShiftsPerWeek < 5 && (
                    <Text className="text-sm text-blue-700">• Adding 1 more shift/week = +${Math.round(avgPayToUse * shiftMultiplier * workWeeksPerYear).toLocaleString()}/year</Text>
                  )}
                  {!planWorkHolidays && (
                    <Text className="text-sm text-blue-700">• Stat holidays pay double time — 11 holidays = ~${Math.round(avgPayToUse * 2.0 * 11).toLocaleString()} extra</Text>
                  )}
                </View>
              </View>
            </>
          );
        })()}

        {tab === 'calculator' && (
          <>
            {/* Age Selector */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="font-semibold text-slate-800 mb-3">Retirement Age</Text>
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setCalcAge(Math.max(55, calcAge - 1))}
                  className="p-3 bg-slate-100 rounded-xl"
                >
                  <Ionicons name="remove" size={20} color="#475569" />
                </TouchableOpacity>
                <View className="items-center">
                  <Text className="text-4xl font-bold text-blue-600">{calcAge}</Text>
                  <Text className="text-xs text-slate-500">years old</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setCalcAge(Math.min(65, calcAge + 1))}
                  className="p-3 bg-slate-100 rounded-xl"
                >
                  <Ionicons name="add" size={20} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Years of Service Selector */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="font-semibold text-slate-800 mb-3">Years of Service</Text>
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setCalcYears(Math.max(10, calcYears - 1))}
                  className="p-3 bg-slate-100 rounded-xl"
                >
                  <Ionicons name="remove" size={20} color="#475569" />
                </TouchableOpacity>
                <View className="items-center">
                  <Text className="text-4xl font-bold text-blue-600">{calcYears}</Text>
                  <Text className="text-xs text-slate-500">credited years</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setCalcYears(Math.min(35, calcYears + 1))}
                  className="p-3 bg-slate-100 rounded-xl"
                >
                  <Ionicons name="add" size={20} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Results */}
            <View className="bg-slate-800 rounded-2xl p-4 mb-4">
              <Text className="text-sm font-medium text-slate-300 mb-3">
                Estimated Monthly Income at Age {calcAge}
              </Text>
              <Text className="text-3xl font-bold text-white mb-4">
                ${calcResult.total.toLocaleString()}/mo
              </Text>

              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-300">WIPP Pension</Text>
                  <Text className="text-sm font-medium text-white">${calcResult.pension.toLocaleString()}</Text>
                </View>
                {calcResult.bridge > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-slate-300">Bridge Benefit</Text>
                    <Text className="text-sm font-medium text-white">${calcResult.bridge.toLocaleString()}</Text>
                  </View>
                )}
                {calcResult.cpp > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-slate-300">CPP (max)</Text>
                    <Text className="text-sm font-medium text-white">${calcResult.cpp.toLocaleString()}</Text>
                  </View>
                )}
                {calcResult.oas > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-slate-300">OAS (max)</Text>
                    <Text className="text-sm font-medium text-white">${calcResult.oas.toLocaleString()}</Text>
                  </View>
                )}
                <View className="border-t border-slate-600 mt-1 pt-2 flex-row justify-between">
                  <Text className="text-sm text-slate-300">Annual Total</Text>
                  <Text className="text-sm font-bold text-green-400">
                    ${(calcResult.total * 12).toLocaleString()}/yr
                  </Text>
                </View>
              </View>
            </View>

            {/* SER Eligibility Check */}
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons
                  name={
                    (calcAge >= 60 && calcYears >= 25) || (calcAge >= 55 && calcAge + calcYears >= 90)
                      ? 'checkmark-circle'
                      : 'close-circle'
                  }
                  size={20}
                  color={
                    (calcAge >= 60 && calcYears >= 25) || (calcAge >= 55 && calcAge + calcYears >= 90)
                      ? '#16a34a'
                      : '#ef4444'
                  }
                />
                <Text className="font-semibold text-slate-800">Special Early Retirement</Text>
              </View>
              {(calcAge >= 60 && calcYears >= 25) || (calcAge >= 55 && calcAge + calcYears >= 90) ? (
                <Text className="text-sm text-green-700">
                  You would qualify for SER with zero pension reduction at age {calcAge} with {calcYears} years.
                </Text>
              ) : (
                <Text className="text-sm text-slate-600">
                  Not eligible at age {calcAge} with {calcYears} years. Need age 60 + 25 years, or age + years {'>='} 90 (currently {calcAge + calcYears}).
                </Text>
              )}
            </View>

            {/* Retiring Allowance */}
            <View className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <Text className="font-semibold text-green-800 mb-1">Retiring Allowance (M&M)</Text>
              {calcAge >= 55 && calcYears >= 25 ? (
                <>
                  <Text className="text-2xl font-bold text-green-700">${RETIRING_ALLOWANCE.amount2025.toLocaleString()}</Text>
                  <Text className="text-xs text-green-600 mt-1">Lump sum payable upon retirement</Text>
                </>
              ) : (
                <Text className="text-sm text-slate-600">
                  Requires 25 years of service and age 55+. {calcYears < 25 ? `Need ${25 - calcYears} more years.` : `Need to reach age 55.`}
                </Text>
              )}
            </View>
          </>
        )}

        {tab === 'rules' && (
          <>
            {/* WIPP Basics */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="p-2 bg-blue-100 rounded-xl">
                  <Ionicons name="information-circle" size={20} color="#2563eb" />
                </View>
                <Text className="font-semibold text-slate-800">WIPP Pension Basics</Text>
              </View>
              <View className="gap-3">
                <View>
                  <Text className="text-sm font-medium text-slate-700">How It Works</Text>
                  <Text className="text-sm text-slate-600 mt-1">
                    Your pension is calculated as ${PENSION_2026.ratePerMonth}/month for each year of credited service, up to {PENSION_2026.maxYears} years maximum. The pension comes with a 10-year minimum guarantee.
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-slate-700">Earning a Pensionable Year</Text>
                  <Text className="text-sm text-slate-600 mt-1">
                    You need to earn ${PENSION_2026.earningsLimit.toLocaleString()} in a pension year (Jan 4 - Jan 3) for a full year of credited service. A minimum of 25% (${PENSION_2026.partialThreshold.toLocaleString()}) qualifies for a partial year.
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-slate-700">Casual Years</Text>
                  <Text className="text-sm text-slate-600 mt-1">
                    Casual years below A Board are recognized once you become a union member. A Board service is recognized when you start making contributions.
                  </Text>
                </View>
              </View>
            </View>

            {/* Special Early Retirement */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="p-2 bg-green-100 rounded-xl">
                  <Ionicons name="timer-outline" size={20} color="#16a34a" />
                </View>
                <Text className="font-semibold text-slate-800">Special Early Retirement (SER)</Text>
              </View>
              <Text className="text-sm text-green-700 font-medium mb-2">{SER_RULES.description}</Text>
              <View className="gap-2">
                {SER_RULES.qualifications.map((q, i) => (
                  <View key={i} className="flex-row gap-2">
                    <Text className="text-sm text-green-600">{'>'}</Text>
                    <Text className="text-sm text-slate-600 flex-1">{q}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Early Retirement Bridge */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="p-2 bg-purple-100 rounded-xl">
                  <Ionicons name="git-branch-outline" size={20} color="#9333ea" />
                </View>
                <Text className="font-semibold text-slate-800">Early Retirement Bridge</Text>
              </View>
              <Text className="text-sm text-slate-600 mb-2">{BRIDGE.description}</Text>
              <View className="bg-purple-50 rounded-xl p-3 mb-2">
                <Text className="text-sm text-purple-800">
                  ${BRIDGE.ratePerYear}/month per year of service (max {BRIDGE.maxYears25} years, or {BRIDGE.maxYears35} if you have 35+ pension years)
                </Text>
              </View>
              <Text className="text-xs text-slate-500">{BRIDGE.note}</Text>
            </View>

            {/* Retiring Allowance */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="p-2 bg-amber-100 rounded-xl">
                  <Ionicons name="cash-outline" size={20} color="#f59e0b" />
                </View>
                <Text className="font-semibold text-slate-800">Retiring Allowance (M&M)</Text>
              </View>
              <Text className="text-2xl font-bold text-amber-700 mb-1">
                ${RETIRING_ALLOWANCE.amount2025.toLocaleString()}
              </Text>
              <Text className="text-sm text-slate-600">{RETIRING_ALLOWANCE.requirements}</Text>
              <Text className="text-xs text-slate-500 mt-1">{RETIRING_ALLOWANCE.note}</Text>
            </View>

            {/* CPP & OAS */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="p-2 bg-red-100 rounded-xl">
                  <Ionicons name="shield-checkmark-outline" size={20} color="#ef4444" />
                </View>
                <Text className="font-semibold text-slate-800">Government Benefits</Text>
              </View>
              <View className="gap-2">
                <View className="flex-row justify-between py-1">
                  <Text className="text-sm text-slate-600">CPP Maximum (age 65)</Text>
                  <Text className="text-sm font-medium text-slate-800">${GOVT_BENEFITS.cppMax65.toLocaleString()}/mo</Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="text-sm text-slate-600">CPP Maximum (age 62)</Text>
                  <Text className="text-sm font-medium text-slate-800">${GOVT_BENEFITS.cppMax62.toLocaleString()}/mo</Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="text-sm text-slate-600">CPP Maximum (age 60)</Text>
                  <Text className="text-sm font-medium text-slate-800">${GOVT_BENEFITS.cppMax60.toLocaleString()}/mo</Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="text-sm text-slate-600">OAS Maximum (age 65)</Text>
                  <Text className="text-sm font-medium text-slate-800">${GOVT_BENEFITS.oasMax65.toLocaleString()}/mo</Text>
                </View>
                <View className="bg-red-50 rounded-xl p-3 mt-1">
                  <Text className="text-xs text-red-700">
                    CPP is reduced {GOVT_BENEFITS.cppReductionPerYear}% for every year taken before age 65 (max {GOVT_BENEFITS.cppMaxReduction}% reduction at age 60).
                  </Text>
                </View>
              </View>
            </View>

            {/* Pension Trustees */}
            <View className="bg-slate-100 rounded-2xl p-4">
              <Text className="font-semibold text-slate-700 mb-2">Pension Plan Trustees</Text>
              <Text className="text-sm text-slate-600">Bob Dhaliwal, ILWU Canada</Text>
              <Text className="text-sm text-slate-600">Andrew Gerard, Local 502</Text>
              <Text className="text-sm text-slate-600">Antonio Pantusa, Local 500</Text>
              <Text className="text-sm text-slate-600">Tom Dufresne, Pensioner Rep.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
