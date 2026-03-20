import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTemplates } from '../hooks/useTemplates';
import { JOBS } from '../data/mockData';
import {
  WAGE_TABLES,
  SHIFT_MULTIPLIERS as CONTRACT_SHIFT_MULTIPLIERS,
  SKILL_DIFFERENTIALS,
} from '../data/contractData';

// ---------------------------------------------------------------------------
// Contract data — derived from contractData.ts (single source of truth)
// ---------------------------------------------------------------------------

type ShiftType = 'DAY' | 'NIGHT' | 'GRAVEYARD';
type DayType = 'MON-FRI' | 'SAT' | 'SUN-HOL';

const STBR_BY_YEAR = WAGE_TABLES.years.map((y) => ({
  year: y.year,
  label: `Year ${y.year} (${y.effective.replace(', ', ' ')})`,
  rate: y.stbr,
}));

const SHIFT_MULTIPLIERS: Record<string, Record<string, number>> = {
  DAY: { ...CONTRACT_SHIFT_MULTIPLIERS.DAY },
  NIGHT: { ...CONTRACT_SHIFT_MULTIPLIERS.NIGHT },
  GRAVEYARD: { ...CONTRACT_SHIFT_MULTIPLIERS.GRAVEYARD },
};

// Build the DIFF_CLASSES UI array from SKILL_DIFFERENTIALS.
// Order: BASE → CLASS_4 → CLASS_3 → CLASS_2 → CLASS_1 (ascending differential).
const DIFF_CLASS_ORDER = ['BASE', 'CLASS_4', 'CLASS_3', 'CLASS_2', 'CLASS_1'] as const;

const DIFF_CLASS_LABELS: Record<string, string> = {
  BASE: 'Base',
  CLASS_4: 'Class 4',
  CLASS_3: 'Class 3',
  CLASS_2: 'Class 2',
  CLASS_1: 'Class 1',
};

const DIFF_CLASSES = DIFF_CLASS_ORDER.map((id) => {
  const cls = SKILL_DIFFERENTIALS[id];
  return {
    id,
    label: DIFF_CLASS_LABELS[id],
    amount: cls.amount,
    jobs: cls.jobs.join(', '),
  };
});

const DAY_TYPES: { key: DayType; label: string }[] = [
  { key: 'MON-FRI', label: 'Mon-Fri' },
  { key: 'SAT', label: 'Saturday' },
  { key: 'SUN-HOL', label: 'Sun/Holiday' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TemplateBuilderScreen() {
  const router = useRouter();
  const { addTemplate } = useTemplates();

  // Step 1 -- Contract year (default Year 3 = current contract year 2026)
  const [selectedYear, setSelectedYear] = useState(3);

  // Step 2 -- Job description
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [customJob, setCustomJob] = useState('');
  const [subJob, setSubJob] = useState('');
  const [showJobList, setShowJobList] = useState(true);

  // Step 3 -- Shift type (no day type selector -- we show all 3 in summary)
  const [shift, setShift] = useState<ShiftType>('DAY');

  // Step 4 -- Differential
  const [diffClass, setDiffClass] = useState('BASE');

  // Step 5 -- Hours
  const [regHours, setRegHours] = useState(8);
  const [otHours, setOtHours] = useState(0);

  // Save template
  const [templateName, setTemplateName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Calculations -- compute rates for ALL day types
  // ---------------------------------------------------------------------------

  const stbr = STBR_BY_YEAR.find((y) => y.year === selectedYear)!;
  const diff = DIFF_CLASSES.find((d) => d.id === diffClass)!;

  const calcRates = (dayType: DayType) => {
    const multiplier = SHIFT_MULTIPLIERS[shift][dayType];
    const baseAfterShift = stbr.rate * multiplier;
    const regRate = Math.round((baseAfterShift + diff.amount) * 100) / 100;
    const otRate = Math.round(regRate * 1.5 * 100) / 100;
    return { multiplier, regRate, otRate };
  };

  // Primary rates (Mon-Fri) for the pay calculation section
  const monFriRates = calcRates('MON-FRI');
  const satRates = calcRates('SAT');
  const sunRates = calcRates('SUN-HOL');

  // Pay estimate uses Mon-Fri as default display
  const regPay = Math.round(regHours * monFriRates.regRate * 100) / 100;
  const otPay = Math.round(otHours * monFriRates.otRate * 100) / 100;
  const totalPay = Math.round((regPay + otPay) * 100) / 100;

  // Readable labels
  const shiftLabel =
    shift === 'DAY' ? 'Day' : shift === 'NIGHT' ? 'Night' : 'Graveyard';

  // Effective job name
  const effectiveJob = selectedJob || customJob.trim() || 'Custom';

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!templateName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this template.');
      return;
    }

    setSaving(true);

    try {
      // Save to Supabase via useTemplates hook
      await addTemplate({
        name: templateName.trim(),
        job: effectiveJob,
        location: 'CUSTOM',
        shift,
        subjob: subJob.trim() || '',
      });

      // Also save calculation details to AsyncStorage for shift logger
      const details = {
        name: templateName.trim(),
        year: selectedYear,
        stbr: stbr.rate,
        shift,
        job: effectiveJob,
        subjob: subJob.trim() || '',
        diffClass: diff.id,
        diffLabel: diff.label,
        diffAmount: diff.amount,
        rates: {
          'MON-FRI': { reg: monFriRates.regRate, ot: monFriRates.otRate },
          SAT: { reg: satRates.regRate, ot: satRates.otRate },
          'SUN-HOL': { reg: sunRates.regRate, ot: sunRates.otRate },
        },
        regHours,
        otHours,
        totalPay,
        createdAt: new Date().toISOString(),
      };

      // Store under a list of custom template details
      const existing = await AsyncStorage.getItem('customTemplateDetails');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(details);
      await AsyncStorage.setItem('customTemplateDetails', JSON.stringify(list));

      Alert.alert('Saved', `Template "${templateName.trim()}" has been saved.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const shiftBg = (s: ShiftType, selected: boolean) => {
    if (!selected) return 'bg-white border border-slate-200';
    if (s === 'DAY') return 'bg-amber-400';
    if (s === 'NIGHT') return 'bg-blue-600';
    return 'bg-purple-600';
  };

  const shiftText = (s: ShiftType, selected: boolean) => {
    if (!selected) return 'text-slate-600';
    if (s === 'DAY') return 'text-amber-900';
    return 'text-white';
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center justify-between border-b border-slate-100">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-1 p-1"
          >
            <Ionicons name="chevron-back" size={22} color="#475569" />
            <Text className="text-slate-600 text-sm">Back</Text>
          </Pressable>
          <Text className="font-semibold text-slate-800 text-base">
            Shift Template Builder
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-4 pb-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ================================================================ */}
          {/* STEP 1 -- Contract Year                                         */}
          {/* ================================================================ */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white text-xs font-bold">1</Text>
              </View>
              <Text className="font-semibold text-slate-700">
                Contract Year
              </Text>
            </View>

            <View className="flex-row gap-2">
              {STBR_BY_YEAR.map((y) => (
                <Pressable
                  key={y.year}
                  onPress={() => setSelectedYear(y.year)}
                  className={`flex-1 p-3 rounded-xl items-center ${
                    selectedYear === y.year
                      ? 'bg-blue-600'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      selectedYear === y.year ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    Year {y.year}
                  </Text>
                  <Text
                    className={`text-sm font-bold mt-0.5 ${
                      selectedYear === y.year ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    ${y.rate.toFixed(2)}
                  </Text>
                  <Text
                    className={`text-[10px] mt-0.5 ${
                      selectedYear === y.year ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    Apr {2022 + y.year}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ================================================================ */}
          {/* STEP 2 -- Job Description                                       */}
          {/* ================================================================ */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white text-xs font-bold">2</Text>
              </View>
              <Text className="font-semibold text-slate-700">
                Job Description
              </Text>
            </View>

            {/* Toggle: standard vs custom */}
            <View className="flex-row gap-2 mb-3">
              <Pressable
                onPress={() => {
                  setShowJobList(true);
                  setCustomJob('');
                }}
                className={`flex-1 p-3 rounded-xl items-center ${
                  showJobList
                    ? 'bg-blue-600'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    showJobList ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  Standard Job
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowJobList(false);
                  setSelectedJob(null);
                }}
                className={`flex-1 p-3 rounded-xl items-center ${
                  !showJobList
                    ? 'bg-blue-600'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    !showJobList ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  Custom Job
                </Text>
              </Pressable>
            </View>

            {showJobList ? (
              /* Standard job picker */
              <View className="bg-white border border-slate-200 rounded-xl p-2 max-h-48">
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                  {JOBS.map((job) => (
                    <Pressable
                      key={job}
                      onPress={() => setSelectedJob(job)}
                      className={`px-3 py-2.5 rounded-lg mb-0.5 ${
                        selectedJob === job ? 'bg-blue-50' : ''
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`text-sm ${
                            selectedJob === job
                              ? 'text-blue-700 font-semibold'
                              : 'text-slate-700'
                          }`}
                        >
                          {job}
                        </Text>
                        {selectedJob === job && (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color="#2563eb"
                          />
                        )}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : (
              /* Custom job input */
              <TextInput
                placeholder="Enter job name"
                value={customJob}
                onChangeText={setCustomJob}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700"
                placeholderTextColor="#94a3b8"
              />
            )}

            {/* Sub-job (optional) */}
            <Text className="text-xs font-medium text-slate-500 mt-3 mb-2">
              Sub-job (optional)
            </Text>
            <TextInput
              placeholder="e.g. RAIL (TT), SHIP (TT)"
              value={subJob}
              onChangeText={setSubJob}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700"
              placeholderTextColor="#94a3b8"
            />

            {/* Selected job display */}
            {(selectedJob || customJob.trim()) && (
              <View className="mt-3 bg-slate-100 rounded-lg px-3 py-2 flex-row items-center gap-2">
                <Ionicons name="briefcase-outline" size={16} color="#64748b" />
                <Text className="text-xs text-slate-600 flex-1 font-medium">
                  {effectiveJob}
                  {subJob.trim() ? ` - ${subJob.trim()}` : ''}
                </Text>
              </View>
            )}
          </View>

          {/* ================================================================ */}
          {/* STEP 3 -- Shift Type                                            */}
          {/* ================================================================ */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white text-xs font-bold">3</Text>
              </View>
              <Text className="font-semibold text-slate-700">Shift Type</Text>
            </View>

            {/* Shift type */}
            <View className="flex-row gap-2">
              {(['DAY', 'NIGHT', 'GRAVEYARD'] as ShiftType[]).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setShift(s)}
                  className={`flex-1 p-3 rounded-xl items-center ${shiftBg(
                    s,
                    shift === s
                  )}`}
                >
                  <Ionicons
                    name={
                      s === 'DAY'
                        ? 'sunny'
                        : s === 'NIGHT'
                        ? 'moon'
                        : 'cloudy-night'
                    }
                    size={18}
                    color={
                      shift !== s
                        ? '#94a3b8'
                        : s === 'DAY'
                        ? '#78350f'
                        : '#ffffff'
                    }
                  />
                  <Text
                    className={`text-sm font-medium mt-1 ${shiftText(
                      s,
                      shift === s
                    )}`}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Multiplier info for all day types */}
            <View className="mt-3 bg-slate-100 rounded-lg px-3 py-2">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                <Text className="text-xs text-slate-500 font-medium">
                  {shiftLabel} shift multipliers
                </Text>
              </View>
              {DAY_TYPES.map((d) => {
                const m = SHIFT_MULTIPLIERS[shift][d.key];
                return (
                  <Text key={d.key} className="text-xs text-slate-500 ml-6">
                    {d.label}: {m.toFixed(4)}x {'\u2192'} ${(stbr.rate * m).toFixed(2)}/hr base
                  </Text>
                );
              })}
            </View>
          </View>

          {/* ================================================================ */}
          {/* STEP 4 -- Skill Differential                                    */}
          {/* ================================================================ */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white text-xs font-bold">4</Text>
              </View>
              <Text className="font-semibold text-slate-700">
                Skill Differential
              </Text>
            </View>

            <View className="gap-2">
              {DIFF_CLASSES.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => setDiffClass(d.id)}
                  className={`p-4 rounded-xl flex-row items-center ${
                    diffClass === d.id
                      ? 'bg-blue-600'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  {/* Differential badge */}
                  <View
                    className={`w-16 items-center justify-center rounded-lg py-2 mr-3 ${
                      diffClass === d.id ? 'bg-white/20' : 'bg-slate-50'
                    }`}
                  >
                    <Text
                      className={`text-base font-bold ${
                        diffClass === d.id ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {d.amount === 0
                        ? '$0'
                        : `+$${d.amount.toFixed(2)}`}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`font-semibold text-sm ${
                        diffClass === d.id ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {d.label}
                    </Text>
                    <Text
                      className={`text-xs mt-0.5 ${
                        diffClass === d.id ? 'text-blue-200' : 'text-slate-500'
                      }`}
                      numberOfLines={2}
                    >
                      {d.jobs}
                    </Text>
                  </View>

                  {diffClass === d.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#86efac" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* ================================================================ */}
          {/* STEP 5 -- Hours                                                 */}
          {/* ================================================================ */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white text-xs font-bold">5</Text>
              </View>
              <Text className="font-semibold text-slate-700">Hours</Text>
            </View>

            <View className="flex-row gap-4">
              {/* Regular Hours */}
              <View className="flex-1 bg-white rounded-xl p-4 border border-slate-200">
                <Text className="text-xs font-medium text-slate-500 mb-3">
                  Regular Hours
                </Text>
                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={() => setRegHours(Math.max(0, regHours - 0.5))}
                    className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center"
                  >
                    <Ionicons name="remove" size={20} color="#475569" />
                  </Pressable>
                  <Text className="text-2xl font-bold text-slate-800">
                    {regHours}
                  </Text>
                  <Pressable
                    onPress={() => setRegHours(regHours + 0.5)}
                    className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center"
                  >
                    <Ionicons name="add" size={20} color="#475569" />
                  </Pressable>
                </View>
              </View>

              {/* OT Hours */}
              <View className="flex-1 bg-white rounded-xl p-4 border border-slate-200">
                <Text className="text-xs font-medium text-slate-500 mb-3">
                  OT Hours
                </Text>
                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={() => setOtHours(Math.max(0, otHours - 0.5))}
                    className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center"
                  >
                    <Ionicons name="remove" size={20} color="#475569" />
                  </Pressable>
                  <Text className="text-2xl font-bold text-orange-600">
                    {otHours}
                  </Text>
                  <Pressable
                    onPress={() => setOtHours(otHours + 0.5)}
                    className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center"
                  >
                    <Ionicons name="add" size={20} color="#475569" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Hours note */}
            <View className="mt-3 bg-slate-100 rounded-lg px-3 py-2 flex-row items-center gap-2">
              <Ionicons name="information-circle-outline" size={16} color="#64748b" />
              <Text className="text-xs text-slate-500 flex-1">
                Hours apply to all day types. You can edit individual shifts after saving.
              </Text>
            </View>
          </View>

          {/* ================================================================ */}
          {/* LIVE SUMMARY CARD                                               */}
          {/* ================================================================ */}
          <View className="bg-slate-800 rounded-2xl p-5 mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="calculator-outline" size={18} color="#94a3b8" />
              <Text className="font-semibold text-white">Pay Breakdown</Text>
            </View>

            {/* Base info */}
            <View className="gap-2 mb-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-400">Base Rate</Text>
                <Text className="text-sm text-slate-300 font-medium">
                  ${stbr.rate.toFixed(2)} (Year {selectedYear} STBR)
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-400">Shift</Text>
                <Text className="text-sm text-slate-300 font-medium">
                  {shiftLabel}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-400">Differential</Text>
                <Text className="text-sm text-slate-300 font-medium">
                  +${diff.amount.toFixed(2)} ({diff.label})
                </Text>
              </View>

              {(selectedJob || customJob.trim()) && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-400">Job</Text>
                  <Text className="text-sm text-slate-300 font-medium">
                    {effectiveJob}
                    {subJob.trim() ? ` - ${subJob.trim()}` : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-600 mb-3" />

            {/* All day type rates table */}
            <View className="mb-3">
              <Text className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">
                Rates by Day Type
              </Text>

              {/* Table header */}
              <View className="flex-row mb-1.5">
                <View className="flex-1">
                  <Text className="text-xs text-slate-500"></Text>
                </View>
                <View className="w-28 items-end">
                  <Text className="text-xs text-slate-500 font-medium">Reg/hr</Text>
                </View>
                <View className="w-28 items-end">
                  <Text className="text-xs text-slate-500 font-medium">OT/hr</Text>
                </View>
              </View>

              {/* Mon-Fri row */}
              <View className="flex-row py-1.5">
                <View className="flex-1">
                  <Text className="text-sm text-slate-300 font-medium">Mon-Fri</Text>
                </View>
                <View className="w-28 items-end">
                  <Text className="text-sm text-white font-bold">
                    ${monFriRates.regRate.toFixed(2)}
                  </Text>
                </View>
                <View className="w-28 items-end">
                  <Text className="text-sm text-orange-300 font-bold">
                    ${monFriRates.otRate.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Saturday row */}
              <View className="flex-row py-1.5">
                <View className="flex-1">
                  <Text className="text-sm text-slate-300 font-medium">Saturday</Text>
                </View>
                <View className="w-28 items-end">
                  <Text className="text-sm text-white font-bold">
                    ${satRates.regRate.toFixed(2)}
                  </Text>
                </View>
                <View className="w-28 items-end">
                  <Text className="text-sm text-orange-300 font-bold">
                    ${satRates.otRate.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Sun/Holiday row */}
              <View className="flex-row py-1.5">
                <View className="flex-1">
                  <Text className="text-sm text-slate-300 font-medium">Sun/Holiday</Text>
                </View>
                <View className="w-28 items-end">
                  <Text className="text-sm text-white font-bold">
                    ${sunRates.regRate.toFixed(2)}
                  </Text>
                </View>
                <View className="w-28 items-end">
                  <Text className="text-sm text-orange-300 font-bold">
                    ${sunRates.otRate.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-600 mb-3" />

            {/* Pay estimate (Mon-Fri) */}
            <Text className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">
              Mon-Fri Estimate
            </Text>
            <View className="gap-1.5 mb-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-400">
                  {regHours} hrs reg x ${monFriRates.regRate.toFixed(2)}
                </Text>
                <Text className="text-sm text-slate-300 font-medium">
                  ${regPay.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-400">
                  {otHours} hrs OT x ${monFriRates.otRate.toFixed(2)}
                </Text>
                <Text className="text-sm text-slate-300 font-medium">
                  ${otPay.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-600 mb-3" />

            {/* Total */}
            <View className="flex-row justify-between items-center">
              <Text className="text-base text-white font-semibold">
                Total Pay (Mon-Fri)
              </Text>
              <Text className="text-2xl text-white font-bold">
                ${totalPay.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* ================================================================ */}
          {/* SAVE BUTTON                                                     */}
          {/* ================================================================ */}
          {!showNameInput ? (
            <Pressable
              onPress={() => setShowNameInput(true)}
              className="w-full py-4 bg-blue-600 rounded-xl flex-row items-center justify-center gap-2 mb-4"
            >
              <Ionicons name="bookmark-outline" size={20} color="#ffffff" />
              <Text className="text-white font-semibold text-base">
                Save as Template
              </Text>
            </Pressable>
          ) : (
            <View className="mb-4">
              <Text className="text-xs font-medium text-slate-500 mb-2">
                Template Name
              </Text>
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  placeholder="e.g. Night TT Class 3"
                  value={templateName}
                  onChangeText={setTemplateName}
                  autoFocus
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setShowNameInput(false);
                    setTemplateName('');
                  }}
                  className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
                >
                  <Text className="text-slate-600 font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  className={`flex-1 py-3 bg-green-600 rounded-xl flex-row items-center justify-center gap-2 ${
                    saving ? 'opacity-60' : ''
                  }`}
                >
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                  <Text className="text-white font-medium">
                    {saving ? 'Saving...' : 'Save Template'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Info note at bottom */}
          <View className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={20} color="#2563eb" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-blue-800 mb-1">
                  How this works
                </Text>
                <Text className="text-xs text-blue-700 leading-5">
                  This template saves your pay rates for all day types (Mon-Fri,
                  Saturday, Sunday/Holiday). The same hours and differential are
                  applied across all days, with the base rate adjusted by shift
                  multiplier. You can edit individual entries after logging a shift.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
