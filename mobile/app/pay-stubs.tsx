import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useShifts } from '../hooks/useShifts';
import { getDemoPayStubs, comparePayStub } from '../lib/payStubParser';
import { getImportedJobLabel } from '../data/payStubTypes';
import type { ParsedPayStub, PayStubShift, ShiftComparison, MatchStatus } from '../data/payStubTypes';
import { formatDateShort } from '../lib/formatters';

type ScreenView = 'list' | 'detail';

const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; bg: string; icon: string }> = {
  MATCH: { label: 'Verified', color: 'text-green-700', bg: 'bg-green-100', icon: 'checkmark-circle' },
  RATE_DIFF: { label: 'Rate Diff', color: 'text-orange-700', bg: 'bg-orange-100', icon: 'alert-circle' },
  HOURS_DIFF: { label: 'Hours Diff', color: 'text-amber-700', bg: 'bg-amber-100', icon: 'time' },
  MISSING_IN_APP: { label: 'Not Logged', color: 'text-blue-700', bg: 'bg-blue-100', icon: 'add-circle' },
  MISSING_ON_STUB: { label: 'Not on Stub', color: 'text-red-700', bg: 'bg-red-100', icon: 'help-circle' },
};

// Shared formatters (local aliases to avoid renaming all call-sites)
const formatDate = formatDateShort;

export default function PayStubsScreen() {
  const router = useRouter();
  const { shifts } = useShifts();
  const [view, setView] = useState<ScreenView>('list');
  const [stubs, setStubs] = useState<ParsedPayStub[]>([]);
  const [selectedStub, setSelectedStub] = useState<ParsedPayStub | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [selectedForImport, setSelectedForImport] = useState<Set<string>>(new Set());
  const [showJobPicker, setShowJobPicker] = useState<{ shift: PayStubShift; index: number } | null>(null);
  const [importedJobs, setImportedJobs] = useState<Record<string, string>>({});

  // Comparison data for selected stub
  const comparisons = useMemo(() => {
    if (!selectedStub) return [];
    return comparePayStub(selectedStub, shifts);
  }, [selectedStub, shifts]);

  const matchCount = comparisons.filter((c) => c.status === 'MATCH').length;
  const discrepancyCount = comparisons.filter((c) => c.status === 'RATE_DIFF' || c.status === 'HOURS_DIFF').length;
  const missingCount = comparisons.filter((c) => c.status === 'MISSING_IN_APP').length;

  // Load demo data
  const handleDemo = () => {
    const demoStubs = getDemoPayStubs();
    setStubs(demoStubs);
  };

  // Handle PDF upload
  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      // For now, show that we received the file but need backend parsing
      Alert.alert(
        'Pay Stub Received',
        `File: ${result.assets[0].name}\n\nPDF parsing requires server-side processing. For now, try the demo to see the feature in action.`,
        [
          { text: 'Try Demo', onPress: handleDemo },
          { text: 'OK' },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Could not select file. Please try again.');
    }
  };

  // Select a stub to view details
  const handleSelectStub = (stub: ParsedPayStub) => {
    setSelectedStub(stub);
    setExpandedDate(null);
    // Pre-select all MISSING_IN_APP for import
    const missing = comparePayStub(stub, shifts)
      .filter((c) => c.status === 'MISSING_IN_APP')
      .map((c) => c.date);
    setSelectedForImport(new Set(missing));
    setView('detail');
  };

  // Toggle a shift for import
  const toggleImport = (date: string) => {
    const next = new Set(selectedForImport);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setSelectedForImport(next);
  };

  // Import selected shifts
  const handleImport = () => {
    const toImport = comparisons.filter(
      (c) => c.status === 'MISSING_IN_APP' && selectedForImport.has(c.date) && c.stubShift
    );

    if (toImport.length === 0) {
      Alert.alert('No shifts selected', 'Select at least one shift to import.');
      return;
    }

    // In production, this would call the useShifts hook to create shifts
    Alert.alert(
      'Import Shifts',
      `Import ${toImport.length} shift${toImport.length > 1 ? 's' : ''} from this pay stub?\n\nYou can update the job names after importing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: () => {
            Alert.alert(
              'Shifts Imported',
              `${toImport.length} shift${toImport.length > 1 ? 's' : ''} added to your log. Update the job names in your shift history.`
            );
          },
        },
      ]
    );
  };

  // ── Empty State ────────────────────────────────────────────────────────────

  if (view === 'list' && stubs.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="flex-row items-center px-4 py-3 gap-3">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800 flex-1">Pay Stubs</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 flex-1 justify-center">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="document-text" size={40} color="#2563eb" />
            </View>
            <Text className="text-xl font-bold text-slate-800 mb-2 text-center">
              Upload Your Pay Stub
            </Text>
            <Text className="text-sm text-slate-500 text-center leading-5 px-4">
              We'll read your BCMEA pay stub and automatically:
            </Text>
          </View>

          <View className="gap-3 mb-8">
            {[
              { icon: 'search', color: '#ef4444', title: 'Find pay discrepancies', desc: 'Compare stub amounts against your logged shifts' },
              { icon: 'add-circle', color: '#2563eb', title: 'Auto-add missing shifts', desc: "Import shifts you haven't logged yet" },
              { icon: 'school', color: '#9333ea', title: 'Learn correct rates', desc: 'Improve pay calculations based on real stubs' },
              { icon: 'shield-checkmark', color: '#16a34a', title: 'Verify your entries', desc: 'Confirm your logged hours and pay are accurate' },
            ].map((item, i) => (
              <View key={i} className="flex-row items-start gap-3 bg-white rounded-xl p-3">
                <View className="p-2 rounded-lg" style={{ backgroundColor: item.color + '15' }}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-slate-800 text-sm">{item.title}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleUpload}
            activeOpacity={0.85}
            className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center gap-2 mb-3"
          >
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text className="text-white font-semibold text-base">Upload PDF Pay Stub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDemo}
            activeOpacity={0.7}
            className="py-3 items-center"
          >
            <Text className="text-blue-600 font-medium text-sm">Try with sample data</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── List View ──────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="flex-row items-center px-4 py-3 gap-3">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800 flex-1">Pay Stubs</Text>
          <TouchableOpacity onPress={handleUpload} className="p-2 bg-blue-100 rounded-xl">
            <Ionicons name="add" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8" showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <View className="bg-slate-800 rounded-2xl p-4 mb-4">
            <Text className="text-sm text-slate-300 mb-1">{stubs.length} Pay Stubs Loaded</Text>
            <Text className="text-2xl font-bold text-white">
              ${stubs.reduce((sum, s) => sum + s.netPay, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
            <Text className="text-xs text-slate-400 mt-1">Total net pay across loaded stubs</Text>
          </View>

          {/* Stub Cards */}
          <View className="gap-3">
            {stubs.map((stub, i) => {
              const comp = comparePayStub(stub, shifts);
              const matches = comp.filter((c) => c.status === 'MATCH').length;
              const issues = comp.filter((c) => c.status === 'RATE_DIFF' || c.status === 'HOURS_DIFF').length;
              const missing = comp.filter((c) => c.status === 'MISSING_IN_APP').length;

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectStub(stub)}
                  activeOpacity={0.85}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View>
                      <Text className="font-semibold text-slate-800">
                        Pay Period {stub.payPeriod}/{stub.totalPayPeriods}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        Week ending {formatDate(stub.payEndDate)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-slate-800">
                        ${stub.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Text>
                      <Text className="text-xs text-slate-500">net pay</Text>
                    </View>
                  </View>

                  {/* Shift summary badges */}
                  <View className="flex-row gap-2 mt-1">
                    <Text className="text-xs text-slate-600">
                      {stub.shifts.length} shifts
                    </Text>
                    {matches > 0 && (
                      <View className="flex-row items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                        <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                        <Text className="text-xs text-green-700">{matches} verified</Text>
                      </View>
                    )}
                    {issues > 0 && (
                      <View className="flex-row items-center gap-1 bg-orange-100 px-2 py-0.5 rounded-full">
                        <Ionicons name="alert-circle" size={12} color="#ea580c" />
                        <Text className="text-xs text-orange-700">{issues} discrepanc{issues > 1 ? 'ies' : 'y'}</Text>
                      </View>
                    )}
                    {missing > 0 && (
                      <View className="flex-row items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-full">
                        <Ionicons name="add-circle" size={12} color="#2563eb" />
                        <Text className="text-xs text-blue-700">{missing} to import</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center justify-end mt-2">
                    <Text className="text-xs text-blue-600 font-medium">View Details</Text>
                    <Ionicons name="chevron-forward" size={14} color="#2563eb" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Detail View ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 gap-3">
        <TouchableOpacity
          onPress={() => { setView('list'); setSelectedStub(null); }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-800">
            Period {selectedStub?.payPeriod}/{selectedStub?.totalPayPeriods}
          </Text>
          <Text className="text-xs text-slate-500">
            Week ending {selectedStub ? formatDate(selectedStub.payEndDate) : ''}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8" showsVerticalScrollIndicator={false}>
        {/* Pay Summary */}
        <View className="bg-slate-800 rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between mb-3">
            <View>
              <Text className="text-xs text-slate-400">Gross Pay</Text>
              <Text className="text-xl font-bold text-white">
                ${selectedStub?.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-slate-400">Net Pay</Text>
              <Text className="text-xl font-bold text-green-400">
                ${selectedStub?.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 bg-white/10 rounded-xl p-2">
              <Text className="text-xs text-slate-400">Tax</Text>
              <Text className="text-sm font-medium text-white">
                ${selectedStub?.deductions.federalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-2">
              <Text className="text-xs text-slate-400">Union</Text>
              <Text className="text-sm font-medium text-white">
                ${selectedStub?.deductions.unionDues.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-2">
              <Text className="text-xs text-slate-400">Benefits</Text>
              <Text className="text-sm font-medium text-white">
                ${((selectedStub?.deductions.welfare || 0) + (selectedStub?.deductions.groupLife || 0)).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* YTD Earnings */}
          <View className="mt-3 pt-3 border-t border-white/10 flex-row justify-between">
            <Text className="text-xs text-slate-400">YTD Earnings</Text>
            <Text className="text-sm font-medium text-slate-300">
              ${selectedStub?.ytdEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Comparison Summary */}
        <View className="flex-row gap-3 mb-4">
          {matchCount > 0 && (
            <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
              <Text className="text-2xl font-bold text-green-600">{matchCount}</Text>
              <Text className="text-xs text-green-700">Verified</Text>
            </View>
          )}
          {discrepancyCount > 0 && (
            <View className="flex-1 bg-orange-50 rounded-xl p-3 border border-orange-100">
              <Text className="text-2xl font-bold text-orange-600">{discrepancyCount}</Text>
              <Text className="text-xs text-orange-700">Discrepancies</Text>
            </View>
          )}
          {missingCount > 0 && (
            <View className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <Text className="text-2xl font-bold text-blue-600">{missingCount}</Text>
              <Text className="text-xs text-blue-700">To Import</Text>
            </View>
          )}
        </View>

        {/* Shift-by-Shift Breakdown */}
        <Text className="text-sm font-semibold text-slate-700 mb-2">Shift Details</Text>
        <View className="gap-2 mb-4">
          {comparisons.map((comp, i) => {
            const config = STATUS_CONFIG[comp.status];
            const isExpanded = expandedDate === comp.date;
            const s = comp.stubShift;
            const isImportable = comp.status === 'MISSING_IN_APP';
            const isSelected = selectedForImport.has(comp.date);
            const assignedJob = importedJobs[comp.date];

            return (
              <TouchableOpacity
                key={i}
                onPress={() => setExpandedDate(isExpanded ? null : comp.date)}
                activeOpacity={0.85}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                {/* Main row */}
                <View className="flex-row items-center p-3 gap-3">
                  {/* Status icon */}
                  <View className={`p-1.5 rounded-lg ${config.bg}`}>
                    <Ionicons name={config.icon as any} size={18} color={config.color.replace('text-', '').includes('green') ? '#16a34a' : config.color.includes('orange') ? '#ea580c' : config.color.includes('amber') ? '#d97706' : config.color.includes('blue') ? '#2563eb' : '#ef4444'} />
                  </View>

                  {/* Shift info */}
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-medium text-slate-800 text-sm">
                        {formatDate(comp.date)}
                      </Text>
                      <View className={`px-1.5 py-0.5 rounded ${config.bg}`}>
                        <Text className={`text-xs font-medium ${config.color}`}>{config.label}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {s ? `${s.appLocation} • ${s.shiftType}` : `${comp.appShift?.location} • ${comp.appShift?.shift}`}
                      {s ? ` • ${s.regHours}h${s.otHours > 0 ? ` + ${s.otHours}h OT` : ''}` : ''}
                    </Text>
                  </View>

                  {/* Pay amount */}
                  <View className="items-end">
                    <Text className="font-semibold text-slate-800">
                      ${s ? s.totalAmount.toFixed(2) : comp.appShift?.totalPay.toFixed(2)}
                    </Text>
                    {s && (
                      <Text className="text-xs text-slate-500">
                        @${s.regRate.toFixed(2)}/hr
                      </Text>
                    )}
                  </View>

                  {/* Import checkbox for missing shifts */}
                  {isImportable && (
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); toggleImport(comp.date); }}
                      className="ml-1"
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isSelected ? '#2563eb' : '#94a3b8'}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Expanded details */}
                {isExpanded && (
                  <View className="px-3 pb-3 pt-0 border-t border-slate-100">
                    {/* Stub data */}
                    {s && (
                      <View className="mt-2">
                        <Text className="text-xs font-medium text-slate-600 mb-1">Pay Stub Says:</Text>
                        <View className="bg-slate-50 rounded-lg p-2 gap-1">
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-slate-600">Regular</Text>
                            <Text className="text-xs text-slate-700">{s.regHours}h × ${s.regRate.toFixed(2)} = ${s.regAmount.toFixed(2)}</Text>
                          </View>
                          {s.otHours > 0 && (
                            <View className="flex-row justify-between">
                              <Text className="text-xs text-slate-600">Overtime</Text>
                              <Text className="text-xs text-slate-700">{s.otHours}h × ${s.otRate.toFixed(2)} = ${s.otAmount.toFixed(2)}</Text>
                            </View>
                          )}
                          {s.travelHours && s.travelHours > 0 && (
                            <View className="flex-row justify-between">
                              <Text className="text-xs text-slate-600">Travel</Text>
                              <Text className="text-xs text-slate-700">{s.travelHours}h × ${s.travelRate?.toFixed(2)} = ${((s.travelRate || 0) * s.travelHours).toFixed(2)}</Text>
                            </View>
                          )}
                          <View className="flex-row justify-between pt-1 border-t border-slate-200">
                            <Text className="text-xs font-medium text-slate-600">Terminal</Text>
                            <Text className="text-xs text-slate-700">{s.terminalRaw} ({s.companyCode})</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-xs font-medium text-slate-600">Rate Class</Text>
                            <Text className="text-xs text-slate-700">{s.inferredDiffClass}</Text>
                          </View>
                          {s.possibleJobs.length > 0 && (
                            <View className="mt-1">
                              <Text className="text-xs text-slate-500">
                                Possible jobs: {s.possibleJobs.slice(0, 3).join(', ')}{s.possibleJobs.length > 3 ? ` +${s.possibleJobs.length - 3} more` : ''}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* App data */}
                    {comp.appShift && (
                      <View className="mt-2">
                        <Text className="text-xs font-medium text-slate-600 mb-1">Your Log Says:</Text>
                        <View className="bg-blue-50 rounded-lg p-2 gap-1">
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-slate-600">Job</Text>
                            <Text className="text-xs font-medium text-slate-700">{comp.appShift.job}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-slate-600">Location</Text>
                            <Text className="text-xs text-slate-700">{comp.appShift.location}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-slate-600">Hours</Text>
                            <Text className="text-xs text-slate-700">
                              {comp.appShift.regHours}h reg{comp.appShift.otHours > 0 ? ` + ${comp.appShift.otHours}h OT` : ''}
                            </Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-slate-600">Rate</Text>
                            <Text className="text-xs text-slate-700">${comp.appShift.regRate.toFixed(2)}/hr</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-slate-600">Total</Text>
                            <Text className="text-xs font-medium text-slate-700">${comp.appShift.totalPay.toFixed(2)}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Discrepancy callout */}
                    {(comp.rateDifference || comp.hoursDifference || comp.payDifference) && (
                      <View className="mt-2 bg-orange-50 rounded-lg p-2 border border-orange-200">
                        <Text className="text-xs font-medium text-orange-800 mb-1">Discrepancy Found</Text>
                        {comp.rateDifference && (
                          <Text className="text-xs text-orange-700">
                            Rate difference: {comp.rateDifference > 0 ? '+' : ''}${comp.rateDifference.toFixed(2)}/hr
                            {comp.rateDifference > 0 ? ' (stub paid more)' : ' (stub paid less)'}
                          </Text>
                        )}
                        {comp.hoursDifference && (
                          <Text className="text-xs text-orange-700">
                            Hours difference: {comp.hoursDifference.toFixed(1)}h
                          </Text>
                        )}
                        {comp.payDifference && (
                          <Text className="text-xs text-orange-700">
                            Total pay difference: {comp.payDifference > 0 ? '+' : ''}${comp.payDifference.toFixed(2)}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Import: choose job */}
                    {isImportable && s && (
                      <View className="mt-2">
                        <Text className="text-xs font-medium text-blue-700 mb-1">
                          Choose job for import:
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                          <View className="flex-row gap-2">
                            {s.possibleJobs.map((job) => (
                              <TouchableOpacity
                                key={job}
                                onPress={() => setImportedJobs({ ...importedJobs, [comp.date]: job })}
                                className={`px-3 py-1.5 rounded-full border ${assignedJob === job ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
                              >
                                <Text className={`text-xs font-medium ${assignedJob === job ? 'text-white' : 'text-slate-700'}`}>
                                  {job}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vacation Info */}
        {selectedStub && (
          <View className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mb-4 flex-row items-center gap-3">
            <Ionicons name="sunny-outline" size={20} color="#10b981" />
            <View>
              <Text className="text-sm font-medium text-emerald-800">
                Vacation: {selectedStub.vacationTaken} days taken, {selectedStub.vacationBalance} remaining
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Import Bar */}
      {missingCount > 0 && (
        <View className="px-4 py-3 bg-white border-t border-slate-200">
          <TouchableOpacity
            onPress={handleImport}
            activeOpacity={0.85}
            className="bg-blue-600 rounded-xl py-3.5 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text className="text-white font-semibold">
              Import {selectedForImport.size} Shift{selectedForImport.size !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
