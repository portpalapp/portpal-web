import React from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateLong } from '../../lib/formatters';
import RateEditor from './RateEditor';
import WorkSlipPicker from './WorkSlipPicker';
import VesselAutocomplete from './VesselAutocomplete';
import type { ShiftType, DifferentialOption } from './types';

export interface ShiftFormStep3Props {
  job: string;
  location: string;
  subjob: string;
  shift: ShiftType;
  date: string;
  regHours: number;
  otHours: number;
  regRate: number;
  otRate: number;
  totalPay: number;
  notes: string;
  foreman: string;
  vesselName: string;
  attachments: { uri: string; name: string }[];
  saving: boolean;
  // Rate editor props
  effectiveDiff: DifferentialOption;
  editingRate: boolean;
  manualRateText: string;
  manualRegRate: number | null;
  showDiffPicker: boolean;
  overrideDiff: DifferentialOption | null;
  // Template save props
  showSaveTemplate: boolean;
  newTemplateName: string;
  // Callbacks
  onSetRegHours: (hours: number) => void;
  onSetOtHours: (hours: number) => void;
  onSetNotes: (notes: string) => void;
  onSetForeman: (foreman: string) => void;
  onSetVesselName: (vesselName: string) => void;
  onSetAttachments: (attachments: { uri: string; name: string }[]) => void;
  onToggleEditRate: () => void;
  onRateTextChange: (text: string) => void;
  onConfirmEditRate: () => void;
  onToggleDiffPicker: () => void;
  onSelectDiff: (diff: DifferentialOption) => void;
  onResetRate: () => void;
  onResetDiff: () => void;
  onSetShowSaveTemplate: (show: boolean) => void;
  onSetNewTemplateName: (name: string) => void;
  onSaveTemplate: () => void;
  onSaveShift: () => void;
  onBack: () => void;
}

export default React.memo(function ShiftFormStep3({
  job,
  location,
  subjob,
  shift,
  date,
  regHours,
  otHours,
  regRate,
  otRate,
  totalPay,
  notes,
  foreman,
  vesselName,
  attachments,
  saving,
  effectiveDiff,
  editingRate,
  manualRateText,
  manualRegRate,
  showDiffPicker,
  overrideDiff,
  showSaveTemplate,
  newTemplateName,
  onSetRegHours,
  onSetOtHours,
  onSetNotes,
  onSetForeman,
  onSetVesselName,
  onSetAttachments,
  onToggleEditRate,
  onRateTextChange,
  onConfirmEditRate,
  onToggleDiffPicker,
  onSelectDiff,
  onResetRate,
  onResetDiff,
  onSetShowSaveTemplate,
  onSetNewTemplateName,
  onSaveTemplate,
  onSaveShift,
  onBack,
}: ShiftFormStep3Props) {
  return (
    <View>
      {/* Summary Card - Job, Location, Pay at top */}
      <View className="bg-blue-600 rounded-2xl p-4 mb-4">
        <View className="flex-row items-start justify-between mb-1">
          <Text className="text-xl font-bold text-white">{job}</Text>
          <View
            className={`px-2 py-1 rounded ${
              shift === 'DAY'
                ? 'bg-amber-400'
                : shift === 'NIGHT'
                ? 'bg-blue-900'
                : 'bg-purple-600'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                shift === 'DAY'
                  ? 'text-amber-900'
                  : shift === 'NIGHT'
                  ? 'text-blue-100'
                  : 'text-purple-100'
              }`}
            >
              {shift}
            </Text>
          </View>
        </View>
        <Text className="text-blue-200 text-sm mb-3">
          {location}
          {subjob ? ` \u2022 ${subjob}` : ''}
        </Text>

        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-blue-200 text-xs">Total Pay</Text>
            <Text className="text-3xl font-bold text-white">${totalPay.toFixed(2)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-blue-100 text-sm">{formatDateLong(date)}</Text>
          </View>
        </View>
      </View>

      {/* Hours Adjusters */}
      <View className="flex-row gap-4 mb-4">
        {/* Regular Hours */}
        <View className="flex-1 bg-white rounded-xl p-4 border border-slate-200">
          <Text className="text-xs font-medium text-slate-500 mb-2">Regular Hours</Text>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => onSetRegHours(Math.max(0, regHours - 0.5))}
              className="p-2 rounded-lg bg-slate-100"
            >
              <Ionicons name="remove" size={18} color="#475569" />
            </Pressable>
            <Text className="text-2xl font-bold text-slate-800">{regHours}</Text>
            <Pressable
              onPress={() => onSetRegHours(regHours + 0.5)}
              className="p-2 rounded-lg bg-slate-100"
            >
              <Ionicons name="add" size={18} color="#475569" />
            </Pressable>
          </View>
        </View>

        {/* OT Hours */}
        <View className="flex-1 bg-white rounded-xl p-4 border border-slate-200">
          <Text className="text-xs font-medium text-slate-500 mb-2">OT Hours</Text>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => onSetOtHours(Math.max(0, otHours - 0.5))}
              className="p-2 rounded-lg bg-slate-100"
            >
              <Ionicons name="remove" size={18} color="#475569" />
            </Pressable>
            <Text className="text-2xl font-bold text-orange-600">{otHours}</Text>
            <Pressable
              onPress={() => onSetOtHours(otHours + 0.5)}
              className="p-2 rounded-lg bg-slate-100"
            >
              <Ionicons name="add" size={18} color="#475569" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Rate Info */}
      <RateEditor
        job={job}
        regRate={regRate}
        otRate={otRate}
        effectiveDiff={effectiveDiff}
        editingRate={editingRate}
        manualRateText={manualRateText}
        manualRegRate={manualRegRate}
        showDiffPicker={showDiffPicker}
        overrideDiff={overrideDiff}
        onToggleEdit={onToggleEditRate}
        onRateTextChange={onRateTextChange}
        onConfirmEdit={onConfirmEditRate}
        onToggleDiffPicker={onToggleDiffPicker}
        onSelectDiff={onSelectDiff}
        onResetRate={onResetRate}
        onResetDiff={onResetDiff}
      />

      {/* Optional Details: Foreman, Vessel, Notes */}
      <View className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        {/* Foreman */}
        <View className="mb-3">
          <Text className="text-xs font-medium text-slate-500 mb-1">Foreman</Text>
          <TextInput
            value={foreman}
            onChangeText={onSetForeman}
            placeholder="e.g., John Smith"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
            placeholderTextColor="#94a3b8"
            autoCapitalize="words"
          />
        </View>

        {/* Vessel Name (autocomplete with manual fallback) */}
        <VesselAutocomplete value={vesselName} onChangeText={onSetVesselName} />

        {/* Notes */}
        <View>
          <Text className="text-xs font-medium text-slate-500 mb-1">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={onSetNotes}
            placeholder="Any notes about this shift..."
            multiline
            numberOfLines={3}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
            placeholderTextColor="#94a3b8"
            style={{ minHeight: 72, textAlignVertical: 'top' }}
          />
        </View>
      </View>

      {/* Work Slips (Attachments) */}
      <WorkSlipPicker attachments={attachments} onSetAttachments={onSetAttachments} />

      {/* Save as Template */}
      {!showSaveTemplate ? (
        <Pressable
          onPress={() => onSetShowSaveTemplate(true)}
          className="w-full flex-row items-center justify-center gap-2 py-2 mb-4"
        >
          <Ionicons name="star-outline" size={16} color="#9333ea" />
          <Text className="text-purple-600 text-sm font-medium">Save as Template</Text>
        </Pressable>
      ) : (
        <View className="flex-row gap-2 mb-4">
          <TextInput
            placeholder="Template name (e.g., 'Monday TT Rail')"
            value={newTemplateName}
            onChangeText={onSetNewTemplateName}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700"
            placeholderTextColor="#94a3b8"
          />
          <Pressable
            onPress={onSaveTemplate}
            className="px-4 py-2 bg-purple-600 rounded-lg justify-center"
          >
            <Text className="text-white text-sm font-medium">Save</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onSetShowSaveTemplate(false);
              onSetNewTemplateName('');
            }}
            className="px-3 py-2 bg-slate-100 rounded-lg justify-center"
          >
            <Ionicons name="close" size={16} color="#475569" />
          </Pressable>
        </View>
      )}

      {/* Save Shift Button */}
      <Pressable
        onPress={onSaveShift}
        disabled={saving}
        className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 mb-3 ${
          saving ? 'bg-green-400' : 'bg-green-600'
        }`}
        style={{
          shadowColor: '#16a34a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        {saving ? (
          <>
            <ActivityIndicator size="small" color="white" />
            <Text className="text-white font-bold text-lg">
              {attachments.length > 0 ? 'Uploading...' : 'Saving...'}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={22} color="white" />
            <Text className="text-white font-bold text-lg">Save Shift</Text>
          </>
        )}
      </Pressable>

      {/* Back Button */}
      <Pressable
        onPress={onBack}
        className="w-full py-3 bg-slate-100 rounded-xl items-center mb-8"
      >
        <Text className="text-slate-600 font-medium">Back to Details</Text>
      </Pressable>
    </View>
  );
});
