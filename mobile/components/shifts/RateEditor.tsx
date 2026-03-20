import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DIFFERENTIALS } from '../../data/mockData';
import { DIFFERENTIAL_CLASSES, type DifferentialOption } from './types';

export interface RateEditorProps {
  job: string;
  regRate: number;
  otRate: number;
  effectiveDiff: DifferentialOption;
  editingRate: boolean;
  manualRateText: string;
  manualRegRate: number | null;
  showDiffPicker: boolean;
  overrideDiff: DifferentialOption | null;
  onToggleEdit: () => void;
  onRateTextChange: (text: string) => void;
  onConfirmEdit: () => void;
  onToggleDiffPicker: () => void;
  onSelectDiff: (diff: DifferentialOption) => void;
  onResetRate: () => void;
  onResetDiff: () => void;
}

export default React.memo(function RateEditor({
  job,
  regRate,
  otRate,
  effectiveDiff,
  editingRate,
  manualRateText,
  manualRegRate,
  showDiffPicker,
  overrideDiff,
  onToggleEdit,
  onRateTextChange,
  onConfirmEdit,
  onToggleDiffPicker,
  onSelectDiff,
  onResetRate,
  onResetDiff,
}: RateEditorProps) {
  return (
    <View className="bg-slate-50 rounded-xl p-4 mb-4">
      {/* Data confidence banner */}
      {DIFFERENTIALS[job]?.hasData ? (
        <View className="flex-row items-center gap-2 bg-green-50 px-3 py-2 rounded-lg mb-3">
          <Ionicons name="checkmark-circle" size={14} color="#15803d" />
          <Text className="text-green-700 text-xs">Verified rate from 71,712 shifts</Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg mb-3">
          <Ionicons name="alert-circle-outline" size={14} color="#c2410c" />
          <Text className="text-orange-700 text-xs">
            Using base rate - your entry helps us learn!
          </Text>
        </View>
      )}

      {/* Editable Regular Rate */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm text-slate-600">Regular Rate</Text>
        {editingRate ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-slate-400">$</Text>
            <TextInput
              keyboardType="numeric"
              value={manualRateText}
              onChangeText={onRateTextChange}
              className="w-20 px-2 py-1 border border-blue-300 rounded text-right font-medium text-slate-800"
            />
            <Text className="text-slate-400">/hr</Text>
            <Pressable onPress={onConfirmEdit} className="ml-1 p-1">
              <Ionicons name="checkmark" size={14} color="#16a34a" />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={onToggleEdit} className="flex-row items-center gap-1">
            <Text className="font-medium text-slate-800">${regRate.toFixed(2)}/hr</Text>
            <Ionicons name="pencil" size={12} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-sm text-slate-600">OT Rate (1.5x)</Text>
        <Text className="font-medium text-slate-800 text-sm">${otRate.toFixed(2)}/hr</Text>
      </View>

      {/* Editable Differential */}
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-slate-600">Differential</Text>
        <Pressable onPress={onToggleDiffPicker} className="flex-row items-center gap-1">
          <Text className="font-medium text-slate-800 text-sm">
            {effectiveDiff.label} (+${effectiveDiff.amount.toFixed(2)})
          </Text>
          <Ionicons name="pencil" size={12} color="#94a3b8" />
        </Pressable>
      </View>

      {/* Differential Picker Dropdown */}
      {showDiffPicker && (
        <View className="mt-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
          {DIFFERENTIAL_CLASSES.map((dc) => {
            const isActive = effectiveDiff.label === dc.label;
            return (
              <Pressable
                key={dc.label}
                onPress={() => onSelectDiff({ label: dc.label, amount: dc.amount })}
                className={`flex-row justify-between items-center px-4 py-3 border-b border-slate-100 ${
                  isActive ? 'bg-blue-50' : ''
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive ? 'text-blue-700' : 'text-slate-700'
                  }`}
                >
                  {dc.label}
                </Text>
                <Text
                  className={`text-sm ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
                >
                  +${dc.amount.toFixed(2)}/hr
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {manualRegRate !== null && (
        <Pressable onPress={onResetRate} className="mt-2">
          <Text className="text-xs text-blue-600 underline">Reset to calculated rate</Text>
        </Pressable>
      )}

      {overrideDiff && (
        <Pressable onPress={onResetDiff} className="mt-1">
          <Text className="text-xs text-blue-600 underline">Reset differential to default</Text>
        </Pressable>
      )}
    </View>
  );
});
