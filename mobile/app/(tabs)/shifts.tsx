import { useReducer, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useStorage } from '../../hooks/useStorage';
import { useShifts } from '../../hooks/useShifts';
import { useTemplates } from '../../hooks/useTemplates';
import type { TemplateRecord } from '../../hooks/useTemplates';
import { useWorkSlips } from '../../hooks/useWorkSlips';
import { useFavoriteTerminals } from '../../hooks/useFavoriteTerminals';
import {
  LOCATIONS,
  SUBJOBS,
  BASE_RATES,
  DIFFERENTIALS,
  HOURS_BY_LOCATION,
} from '../../data/mockData';
import { getTodayStr } from '../../lib/formatters';
import {
  ShiftFormStep1,
  ShiftFormStep2,
  ShiftFormStep3,
} from '../../components/shifts';
import {
  type ShiftType,
  type LastShiftData,
  type DifferentialOption,
  STEP_LABELS,
  getInitialState,
  shiftFormReducer,
} from '../../components/shifts/types';

export default function ShiftsScreen() {
  // ─── Reducer ───
  const [state, dispatch] = useReducer(shiftFormReducer, getTodayStr(), getInitialState);

  // ─── Supabase hooks ───
  const { shifts: allShifts, addShift, updateShiftAttachments } = useShifts();
  const { templates, addTemplate, deleteTemplate: deleteTemplateSupabase } = useTemplates();
  const { uploadWorkSlip } = useWorkSlips();

  // ─── Favorite terminals ───
  const { favorites: favoriteTerminals } = useFavoriteTerminals();

  // ─── Persisted data (local preferences) ───
  const [customLocations, setCustomLocations] = useStorage<string[]>('customLocations', []);
  const [, setLastShiftStorage] = useStorage<LastShiftData | null>('lastShift', null);

  // ─── Derive lastShift from actual shifts data ───
  const lastShift: LastShiftData | null = useMemo(() => {
    if (allShifts.length === 0) return null;
    const s = allShifts[0];
    return {
      job: s.job,
      location: s.location,
      subjob: s.subjob,
      shift: s.shift as ShiftType,
      date: s.date,
      regHours: s.regHours,
      otHours: s.otHours,
      regRate: s.regRate,
      otRate: s.otRate,
      totalPay: s.totalPay,
    };
  }, [allShifts]);

  // ─── Route params for callback from home screen ───
  const params = useLocalSearchParams<{ callback?: string }>();
  const callbackHandled = useRef(false);

  useEffect(() => {
    if (callbackHandled.current) return;
    if (!params.callback || !lastShift) return;
    callbackHandled.current = true;

    // Apply last shift data
    dispatch({ type: 'SET_JOB', job: lastShift.job });
    dispatch({ type: 'SET_LOCATION', location: lastShift.location });
    dispatch({ type: 'SET_SUBJOB', subjob: lastShift.subjob || '' });
    dispatch({ type: 'SET_SHIFT', shift: lastShift.shift });
    dispatch({ type: 'SET_DATE', date: getTodayStr() });
    dispatch({ type: 'SET_STEP1_MODE', mode: 'choose' });

    if (params.callback === 'true') {
      dispatch({ type: 'SET_STEP', step: 3 });
    } else if (params.callback === 'edit') {
      dispatch({ type: 'SET_STEP', step: 2 });
    }
  }, [params.callback, lastShift]);

  // ─── Reset when leaving this tab ───
  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch({ type: 'RESET_ON_BLUR' });
      };
    }, [])
  );

  // ─── Derived values ───

  const effectiveDiff: DifferentialOption = useMemo(() => {
    if (state.overrideDiff) return state.overrideDiff;
    const d = DIFFERENTIALS[state.job];
    if (d) return { label: d.class, amount: d.amount };
    return { label: 'BASE', amount: 0 };
  }, [state.job, state.overrideDiff]);

  const calculateRate = useCallback(() => {
    if (!state.job) return { regRate: 0, otRate: 0 };

    if (state.manualRegRate !== null) {
      return {
        regRate: state.manualRegRate,
        otRate: Math.round(state.manualRegRate * 1.5 * 100) / 100,
      };
    }

    const dayOfWeek = new Date(state.date + 'T12:00:00').getDay();
    const dayType = dayOfWeek === 0 ? 'SUN' : dayOfWeek === 6 ? 'SAT' : 'MON-FRI';
    const baseRate = BASE_RATES[state.shift][dayType];

    let regRate = baseRate + effectiveDiff.amount;
    if (state.job === 'TRAINER') {
      regRate = baseRate * 1.333333 + 1.67;
    }

    return {
      regRate: Math.round(regRate * 100) / 100,
      otRate: Math.round(regRate * 1.5 * 100) / 100,
    };
  }, [state.job, state.manualRegRate, state.date, state.shift, effectiveDiff.amount]);

  const { regRate, otRate } = calculateRate();
  const totalPay = state.regHours * regRate + state.otHours * otRate;

  // Filter out "BLANK" from subjobs
  const availableSubjobs = (SUBJOBS[state.job] || []).filter((s) => s !== 'BLANK');

  // All locations including custom ones
  const allLocations = useMemo(
    () => [...LOCATIONS, ...customLocations.filter((c) => !LOCATIONS.includes(c))],
    [customLocations]
  );

  // Derive recent terminals from shift history (last 5 unique, not in favorites)
  const recentTerminals = useMemo(() => {
    const seen = new Set<string>();
    const recent: string[] = [];
    for (const s of allShifts) {
      if (!seen.has(s.location) && !favoriteTerminals.includes(s.location)) {
        seen.add(s.location);
        recent.push(s.location);
        if (recent.length >= 5) break;
      }
    }
    return recent;
  }, [allShifts, favoriteTerminals]);

  // Remaining locations (not in favorites or recent)
  const otherTerminals = useMemo(() => {
    const usedSet = new Set([...favoriteTerminals, ...recentTerminals]);
    return allLocations.filter((loc) => !usedSet.has(loc));
  }, [favoriteTerminals, recentTerminals, allLocations]);

  // ─── Action Handlers ───

  const updateHoursForLocation = useCallback(
    (loc: string) => {
      const hours = HOURS_BY_LOCATION[loc] || HOURS_BY_LOCATION.DEFAULT;
      if (state.shift === 'DAY') dispatch({ type: 'SET_REG_HOURS', hours: hours.day });
      else if (state.shift === 'NIGHT') dispatch({ type: 'SET_REG_HOURS', hours: hours.night });
      else dispatch({ type: 'SET_REG_HOURS', hours: hours.graveyard });
    },
    [state.shift]
  );

  const handleSelectLocation = useCallback(
    (loc: string) => {
      dispatch({ type: 'SET_LOCATION', location: loc });
      updateHoursForLocation(loc);
    },
    [updateHoursForLocation]
  );

  const handleSetShift = useCallback(
    (s: ShiftType) => {
      dispatch({ type: 'SET_SHIFT', shift: s });
      const hours = HOURS_BY_LOCATION[state.location] || HOURS_BY_LOCATION.DEFAULT;
      if (s === 'DAY') dispatch({ type: 'SET_REG_HOURS', hours: hours.day });
      else if (s === 'NIGHT') dispatch({ type: 'SET_REG_HOURS', hours: hours.night });
      else dispatch({ type: 'SET_REG_HOURS', hours: hours.graveyard });
    },
    [state.location]
  );

  const handleRepeatLastShift = useCallback(() => {
    if (lastShift) {
      dispatch({ type: 'SET_JOB', job: lastShift.job });
      dispatch({ type: 'SET_LOCATION', location: lastShift.location });
      dispatch({ type: 'SET_SUBJOB', subjob: lastShift.subjob || '' });
      dispatch({ type: 'SET_SHIFT', shift: lastShift.shift });
      dispatch({ type: 'SET_DATE', date: getTodayStr() });
      dispatch({ type: 'SET_STEP1_MODE', mode: 'choose' });
      dispatch({ type: 'SET_STEP', step: 3 });
    }
  }, [lastShift]);

  const handleEditLastShift = useCallback(() => {
    if (lastShift) {
      dispatch({ type: 'SET_JOB', job: lastShift.job });
      dispatch({ type: 'SET_LOCATION', location: lastShift.location });
      dispatch({ type: 'SET_SUBJOB', subjob: lastShift.subjob || '' });
      dispatch({ type: 'SET_SHIFT', shift: lastShift.shift });
      dispatch({ type: 'SET_DATE', date: getTodayStr() });
      dispatch({ type: 'SET_STEP1_MODE', mode: 'jobs' });
    }
  }, [lastShift]);

  const handleSelectJob = useCallback((job: string) => {
    dispatch({ type: 'SELECT_JOB', job });
  }, []);

  const handleApplyTemplate = useCallback((template: TemplateRecord) => {
    dispatch({ type: 'APPLY_TEMPLATE', template });
  }, []);

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      await deleteTemplateSupabase(id);
    },
    [deleteTemplateSupabase]
  );

  const handleSaveCustomLocation = useCallback(() => {
    if (!state.customLocation) return;
    const upper = state.customLocation.toUpperCase();
    const updated = [...customLocations, upper];
    setCustomLocations(updated);
    dispatch({ type: 'SET_LOCATION', location: upper });
    dispatch({ type: 'SET_CUSTOM_LOCATION', value: '' });
    dispatch({ type: 'SET_SHOW_CUSTOM_LOCATION', show: false });
  }, [state.customLocation, customLocations, setCustomLocations]);

  const handleApplyCustomSubjob = useCallback(() => {
    if (state.customSubjob) {
      dispatch({ type: 'SET_SUBJOB', subjob: state.customSubjob.toUpperCase() });
      dispatch({ type: 'SET_SHOW_CUSTOM_SUBJOB', show: false });
      dispatch({ type: 'SET_CUSTOM_SUBJOB', value: '' });
    }
  }, [state.customSubjob]);

  const handleToggleEditRate = useCallback(() => {
    dispatch({ type: 'SET_MANUAL_REG_RATE', rate: regRate });
    dispatch({ type: 'SET_MANUAL_RATE_TEXT', text: regRate.toFixed(2) });
    dispatch({ type: 'SET_EDITING_RATE', editing: true });
  }, [regRate]);

  const handleRateTextChange = useCallback((text: string) => {
    dispatch({ type: 'SET_MANUAL_RATE_TEXT', text });
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      dispatch({ type: 'SET_MANUAL_REG_RATE', rate: parsed });
    }
  }, []);

  const handleConfirmEditRate = useCallback(() => {
    dispatch({ type: 'SET_EDITING_RATE', editing: false });
  }, []);

  const handleSelectDiff = useCallback((diff: DifferentialOption) => {
    dispatch({ type: 'APPLY_DIFF_SELECTION', diff });
  }, []);

  const handleResetRate = useCallback(() => {
    dispatch({ type: 'SET_MANUAL_REG_RATE', rate: null });
    dispatch({ type: 'SET_MANUAL_RATE_TEXT', text: '' });
  }, []);

  const handleResetDiff = useCallback(() => {
    dispatch({ type: 'SET_OVERRIDE_DIFF', diff: null });
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    if (!state.newTemplateName || !state.job || !state.location) return;
    await addTemplate({
      name: state.newTemplateName,
      job: state.job,
      location: state.location,
      subjob: state.subjob || undefined,
      shift: state.shift,
    });
    dispatch({ type: 'SET_NEW_TEMPLATE_NAME', name: '' });
    dispatch({ type: 'SET_SHOW_SAVE_TEMPLATE', show: false });
  }, [state.newTemplateName, state.job, state.location, state.subjob, state.shift, addTemplate]);

  // Build notes string combining foreman, vessel, and notes
  const buildNotesString = useCallback(() => {
    const parts: string[] = [];
    if (state.foreman) parts.push(`Foreman: ${state.foreman}`);
    if (state.vesselName) parts.push(`Vessel: ${state.vesselName}`);
    if (state.notes) parts.push(state.notes);
    return parts.join(' | ');
  }, [state.foreman, state.vesselName, state.notes]);

  // ─── Save shift handler ───
  const handleSaveShift = useCallback(async () => {
    if (state.saving) return;
    dispatch({ type: 'SET_SAVING', saving: true });

    const shiftData: LastShiftData = {
      job: state.job,
      location: state.location,
      subjob: state.subjob,
      shift: state.shift,
      date: state.date,
      regHours: state.regHours,
      otHours: state.otHours,
      regRate,
      otRate,
      totalPay,
    };

    const combinedNotes = buildNotesString();

    const result = await addShift({
      date: state.date,
      job: state.job,
      location: state.location,
      subjob: state.subjob || undefined,
      shift: state.shift,
      regHours: state.regHours,
      otHours: state.otHours,
      regRate,
      otRate,
      totalPay,
      notes: combinedNotes || undefined,
    });

    if (result?.error) {
      dispatch({ type: 'SET_SAVING', saving: false });
      Alert.alert('Error', 'Failed to save shift');
      return;
    }

    // Upload attachments if any were selected
    const shiftId = result?.data?.id;
    let uploadFailCount = 0;

    if (shiftId && state.attachments.length > 0) {
      const uploadedAttachments: { url: string; name: string; type: string }[] = [];

      for (const file of state.attachments) {
        const uploadResult = await uploadWorkSlip(shiftId, file);
        if (uploadResult.data) {
          uploadedAttachments.push(uploadResult.data);
        } else {
          console.warn('[shifts] Failed to upload:', file.name, uploadResult.error?.message);
          uploadFailCount++;
        }
      }

      // Update the shift record with attachment metadata
      if (uploadedAttachments.length > 0) {
        await updateShiftAttachments(shiftId, uploadedAttachments);
      }
    }

    dispatch({ type: 'SET_SAVING', saving: false });
    setLastShiftStorage(shiftData);

    // Show appropriate alert
    if (uploadFailCount > 0) {
      Alert.alert(
        'Shift Saved',
        `Shift saved, but ${uploadFailCount} attachment(s) failed to upload.`
      );
    } else if (state.attachments.length > 0) {
      Alert.alert('Success', 'Shift and work slips saved!');
    } else {
      Alert.alert('Success', 'Shift saved!');
    }

    dispatch({ type: 'RESET_FORM' });
  }, [
    state.saving,
    state.job,
    state.location,
    state.subjob,
    state.shift,
    state.date,
    state.regHours,
    state.otHours,
    state.attachments,
    regRate,
    otRate,
    totalPay,
    buildNotesString,
    addShift,
    uploadWorkSlip,
    updateShiftAttachments,
    setLastShiftStorage,
  ]);

  // ─── Simple dispatch wrappers (stable refs for child props) ───

  const setStep1Mode = useCallback(
    (mode: 'choose' | 'templates' | 'jobs') => dispatch({ type: 'SET_STEP1_MODE', mode }),
    []
  );
  const setDate = useCallback(
    (date: string) => dispatch({ type: 'SET_DATE', date }),
    []
  );
  const setSubjob = useCallback(
    (subjob: string) => dispatch({ type: 'SET_SUBJOB', subjob }),
    []
  );
  const setCustomSubjob = useCallback(
    (value: string) => dispatch({ type: 'SET_CUSTOM_SUBJOB', value }),
    []
  );
  const setShowCustomSubjob = useCallback(
    (show: boolean) => dispatch({ type: 'SET_SHOW_CUSTOM_SUBJOB', show }),
    []
  );
  const setCustomLocation = useCallback(
    (value: string) => dispatch({ type: 'SET_CUSTOM_LOCATION', value }),
    []
  );
  const setShowCustomLocation = useCallback(
    (show: boolean) => dispatch({ type: 'SET_SHOW_CUSTOM_LOCATION', show }),
    []
  );
  const toggleAllTerminals = useCallback(
    () => dispatch({ type: 'SET_SHOW_ALL_TERMINALS', show: !state.showAllTerminals }),
    [state.showAllTerminals]
  );
  const setRegHours = useCallback(
    (hours: number) => dispatch({ type: 'SET_REG_HOURS', hours }),
    []
  );
  const setOtHours = useCallback(
    (hours: number) => dispatch({ type: 'SET_OT_HOURS', hours }),
    []
  );
  const setNotes = useCallback(
    (notes: string) => dispatch({ type: 'SET_NOTES', notes }),
    []
  );
  const setForeman = useCallback(
    (foreman: string) => dispatch({ type: 'SET_FOREMAN', foreman }),
    []
  );
  const setVesselName = useCallback(
    (vesselName: string) => dispatch({ type: 'SET_VESSEL_NAME', vesselName }),
    []
  );
  const setAttachments = useCallback(
    (attachments: { uri: string; name: string }[]) =>
      dispatch({ type: 'SET_ATTACHMENTS', attachments }),
    []
  );
  const toggleDiffPicker = useCallback(
    () => dispatch({ type: 'SET_SHOW_DIFF_PICKER', show: !state.showDiffPicker }),
    [state.showDiffPicker]
  );
  const setShowSaveTemplate = useCallback(
    (show: boolean) => dispatch({ type: 'SET_SHOW_SAVE_TEMPLATE', show }),
    []
  );
  const setNewTemplateName = useCallback(
    (name: string) => dispatch({ type: 'SET_NEW_TEMPLATE_NAME', name }),
    []
  );

  const goBackToStep1Jobs = useCallback(() => {
    dispatch({ type: 'SET_STEP', step: 1 });
    dispatch({ type: 'SET_STEP1_MODE', mode: 'jobs' });
  }, []);

  const goToStep3 = useCallback(() => dispatch({ type: 'SET_STEP', step: 3 }), []);
  const goToStep2 = useCallback(() => dispatch({ type: 'SET_STEP', step: 2 }), []);

  // ─── Render ───

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-slate-800">Log Shift</Text>
            <Text className="text-sm text-slate-500">Quick entry with smart defaults</Text>
          </View>

          {/* Progress Steps */}
          <View className="flex-row items-center justify-between mb-6 px-4">
            {[1, 2, 3].map((s, idx) => (
              <View key={s} className="flex-row items-center">
                <View className="items-center">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      state.step >= s ? 'bg-blue-600' : 'bg-slate-100'
                    }`}
                  >
                    {state.step > s ? (
                      <Ionicons name="checkmark" size={16} color="white" />
                    ) : (
                      <Text
                        className={`text-sm font-medium ${
                          state.step >= s ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {s}
                      </Text>
                    )}
                  </View>
                  <Text className="text-[10px] text-slate-400 mt-1">{STEP_LABELS[idx]}</Text>
                </View>
                {s < 3 && (
                  <View
                    className={`w-16 h-0.5 mx-2 mb-4 ${
                      state.step > s ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </View>
            ))}
          </View>

          {/* ========== STEP 1: Job Selection ========== */}
          {state.step === 1 && (
            <ShiftFormStep1
              step1Mode={state.step1Mode}
              lastShift={lastShift}
              selectedJob={state.job}
              templates={templates}
              onSetStep1Mode={setStep1Mode}
              onRepeatLastShift={handleRepeatLastShift}
              onEditLastShift={handleEditLastShift}
              onSelectJob={handleSelectJob}
              onApplyTemplate={handleApplyTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          )}

          {/* ========== STEP 2: Location & Details ========== */}
          {state.step === 2 && (
            <ShiftFormStep2
              location={state.location}
              subjob={state.subjob}
              shift={state.shift}
              date={state.date}
              availableSubjobs={availableSubjobs}
              customSubjob={state.customSubjob}
              showCustomSubjob={state.showCustomSubjob}
              favoriteTerminals={favoriteTerminals}
              recentTerminals={recentTerminals}
              otherTerminals={otherTerminals}
              allLocations={allLocations}
              showAllTerminals={state.showAllTerminals}
              showCustomLocation={state.showCustomLocation}
              customLocation={state.customLocation}
              onSelectLocation={handleSelectLocation}
              onToggleAllTerminals={toggleAllTerminals}
              onSetShowCustomLocation={setShowCustomLocation}
              onSetCustomLocation={setCustomLocation}
              onAddCustomLocation={handleSaveCustomLocation}
              onSetSubjob={setSubjob}
              onSetCustomSubjob={setCustomSubjob}
              onSetShowCustomSubjob={setShowCustomSubjob}
              onApplyCustomSubjob={handleApplyCustomSubjob}
              onSetShift={handleSetShift}
              onSetDate={setDate}
              onBack={goBackToStep1Jobs}
              onContinue={goToStep3}
            />
          )}

          {/* ========== STEP 3: Review & Save ========== */}
          {state.step === 3 && (
            <ShiftFormStep3
              job={state.job}
              location={state.location}
              subjob={state.subjob}
              shift={state.shift}
              date={state.date}
              regHours={state.regHours}
              otHours={state.otHours}
              regRate={regRate}
              otRate={otRate}
              totalPay={totalPay}
              notes={state.notes}
              foreman={state.foreman}
              vesselName={state.vesselName}
              attachments={state.attachments}
              saving={state.saving}
              effectiveDiff={effectiveDiff}
              editingRate={state.editingRate}
              manualRateText={state.manualRateText}
              manualRegRate={state.manualRegRate}
              showDiffPicker={state.showDiffPicker}
              overrideDiff={state.overrideDiff}
              showSaveTemplate={state.showSaveTemplate}
              newTemplateName={state.newTemplateName}
              onSetRegHours={setRegHours}
              onSetOtHours={setOtHours}
              onSetNotes={setNotes}
              onSetForeman={setForeman}
              onSetVesselName={setVesselName}
              onSetAttachments={setAttachments}
              onToggleEditRate={handleToggleEditRate}
              onRateTextChange={handleRateTextChange}
              onConfirmEditRate={handleConfirmEditRate}
              onToggleDiffPicker={toggleDiffPicker}
              onSelectDiff={handleSelectDiff}
              onResetRate={handleResetRate}
              onResetDiff={handleResetDiff}
              onSetShowSaveTemplate={setShowSaveTemplate}
              onSetNewTemplateName={setNewTemplateName}
              onSaveTemplate={handleSaveTemplate}
              onSaveShift={handleSaveShift}
              onBack={goToStep2}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
