import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateLong, getTodayStr } from '../../lib/formatters';
import LocationPicker from './LocationPicker';
import type { ShiftType } from './types';

// Shift date by N days, return YYYY-MM-DD
function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function getYesterdayStr(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateLabel(dateStr: string): string | null {
  if (dateStr === getTodayStr()) return 'Today';
  if (dateStr === getYesterdayStr()) return 'Yesterday';
  return null;
}

export interface ShiftFormStep2Props {
  location: string;
  subjob: string;
  shift: ShiftType;
  date: string;
  availableSubjobs: string[];
  customSubjob: string;
  showCustomSubjob: boolean;
  // Location picker props
  favoriteTerminals: string[];
  recentTerminals: string[];
  otherTerminals: string[];
  allLocations: string[];
  showAllTerminals: boolean;
  showCustomLocation: boolean;
  customLocation: string;
  // Callbacks
  onSelectLocation: (loc: string) => void;
  onToggleAllTerminals: () => void;
  onSetShowCustomLocation: (show: boolean) => void;
  onSetCustomLocation: (value: string) => void;
  onAddCustomLocation: () => void;
  onSetSubjob: (subjob: string) => void;
  onSetCustomSubjob: (value: string) => void;
  onSetShowCustomSubjob: (show: boolean) => void;
  onApplyCustomSubjob: () => void;
  onSetShift: (shift: ShiftType) => void;
  onSetDate: (date: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default React.memo(function ShiftFormStep2({
  location,
  subjob,
  shift,
  date,
  availableSubjobs,
  customSubjob,
  showCustomSubjob,
  favoriteTerminals,
  recentTerminals,
  otherTerminals,
  allLocations,
  showAllTerminals,
  showCustomLocation,
  customLocation,
  onSelectLocation,
  onToggleAllTerminals,
  onSetShowCustomLocation,
  onSetCustomLocation,
  onAddCustomLocation,
  onSetSubjob,
  onSetCustomSubjob,
  onSetShowCustomSubjob,
  onApplyCustomSubjob,
  onSetShift,
  onSetDate,
  onBack,
  onContinue,
}: ShiftFormStep2Props) {
  const dateLabel = getDateLabel(date);
  const todayStr = getTodayStr();

  return (
    <View>
      <Text className="font-semibold text-slate-700 mb-4">Where and when?</Text>

      {/* Location Picker */}
      <LocationPicker
        value={location}
        favoriteTerminals={favoriteTerminals}
        recentTerminals={recentTerminals}
        otherTerminals={otherTerminals}
        allLocations={allLocations}
        showAllTerminals={showAllTerminals}
        showCustomLocation={showCustomLocation}
        customLocation={customLocation}
        onSelect={onSelectLocation}
        onToggleAllTerminals={onToggleAllTerminals}
        onSetShowCustomLocation={onSetShowCustomLocation}
        onSetCustomLocation={onSetCustomLocation}
        onAddCustom={onAddCustomLocation}
      />

      {/* Subjob */}
      <View className="mb-4">
        <Text className="text-xs font-medium text-slate-500 mb-2">
          Subjob {availableSubjobs.length === 0 ? '(Optional)' : ''}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {availableSubjobs.map((sub) => (
            <Pressable
              key={sub}
              onPress={() => {
                onSetSubjob(sub);
                onSetShowCustomSubjob(false);
              }}
              className={`px-3 py-1.5 rounded-lg ${
                subjob === sub ? 'bg-orange-500' : 'bg-white border border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  subjob === sub ? 'text-white' : 'text-slate-600'
                }`}
              >
                {sub}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => onSetShowCustomSubjob(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex-row items-center gap-1"
          >
            <Ionicons name="add" size={12} color="#64748b" />
            <Text className="text-xs font-medium text-slate-500">Add Custom</Text>
          </Pressable>
        </View>

        {/* Custom Subjob Input */}
        {showCustomSubjob && (
          <View className="mt-2 flex-row gap-2">
            <TextInput
              placeholder="Enter subjob name"
              value={customSubjob}
              onChangeText={onSetCustomSubjob}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
              placeholderTextColor="#94a3b8"
            />
            <Pressable
              onPress={onApplyCustomSubjob}
              className="px-4 py-2 bg-orange-500 rounded-lg justify-center"
            >
              <Text className="text-white text-sm font-medium">Add</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSetShowCustomSubjob(false);
                onSetCustomSubjob('');
              }}
              className="px-3 py-2 bg-slate-100 rounded-lg justify-center"
            >
              <Ionicons name="close" size={16} color="#475569" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Shift Type */}
      <View className="mb-4">
        <Text className="text-xs font-medium text-slate-500 mb-2">Shift</Text>
        <View className="flex-row gap-2">
          {(['DAY', 'NIGHT', 'GRAVEYARD'] as ShiftType[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => onSetShift(s)}
              className={`flex-1 p-3 rounded-xl items-center ${
                shift === s
                  ? s === 'DAY'
                    ? 'bg-amber-400'
                    : s === 'NIGHT'
                    ? 'bg-blue-600'
                    : 'bg-purple-600'
                  : 'bg-white border border-slate-200'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  shift === s
                    ? s === 'DAY'
                      ? 'text-amber-900'
                      : 'text-white'
                    : 'text-slate-600'
                }`}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Date */}
      <View className="mb-4">
        <Text className="text-xs font-medium text-slate-500 mb-2">Date</Text>

        {/* Date picker with arrows */}
        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
          <Pressable
            onPress={() => onSetDate(shiftDate(date, -1))}
            className="px-3 py-3 bg-slate-50"
          >
            <Ionicons name="chevron-back" size={20} color="#475569" />
          </Pressable>
          <View className="flex-1 items-center py-3">
            <Text className="text-base font-semibold text-slate-800">
              {formatDateLong(date)}
            </Text>
            {dateLabel && (
              <Text className="text-blue-600 text-xs font-medium mt-0.5">{dateLabel}</Text>
            )}
          </View>
          <Pressable
            onPress={() => {
              if (date < todayStr) onSetDate(shiftDate(date, 1));
            }}
            className={`px-3 py-3 bg-slate-50 ${date >= todayStr ? 'opacity-30' : ''}`}
          >
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </Pressable>
        </View>

        {/* Quick date buttons */}
        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={() => onSetDate(todayStr)}
            className={`px-4 py-2 rounded-lg ${
              date === todayStr ? 'bg-blue-600' : 'bg-white border border-slate-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                date === todayStr ? 'text-white' : 'text-slate-600'
              }`}
            >
              Today
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onSetDate(getYesterdayStr())}
            className={`px-4 py-2 rounded-lg ${
              date === getYesterdayStr() ? 'bg-blue-600' : 'bg-white border border-slate-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                date === getYesterdayStr() ? 'text-white' : 'text-slate-600'
              }`}
            >
              Yesterday
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row gap-2 mt-2 mb-4">
        <Pressable onPress={onBack} className="flex-1 py-3 bg-slate-100 rounded-xl items-center">
          <Text className="text-slate-600 font-medium">Back</Text>
        </Pressable>
        <Pressable
          onPress={onContinue}
          disabled={!location}
          className={`flex-1 py-3 rounded-xl items-center ${
            location ? 'bg-blue-600' : 'bg-blue-600 opacity-50'
          }`}
        >
          <Text className="text-white font-medium">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
});
