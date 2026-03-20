import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface LocationPickerProps {
  value: string;
  favoriteTerminals: string[];
  recentTerminals: string[];
  otherTerminals: string[];
  allLocations: string[];
  showAllTerminals: boolean;
  showCustomLocation: boolean;
  customLocation: string;
  onSelect: (location: string) => void;
  onToggleAllTerminals: () => void;
  onSetShowCustomLocation: (show: boolean) => void;
  onSetCustomLocation: (value: string) => void;
  onAddCustom: () => void;
}

export default React.memo(function LocationPicker({
  value,
  favoriteTerminals,
  recentTerminals,
  otherTerminals,
  allLocations,
  showAllTerminals,
  showCustomLocation,
  customLocation,
  onSelect,
  onToggleAllTerminals,
  onSetShowCustomLocation,
  onSetCustomLocation,
  onAddCustom,
}: LocationPickerProps) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-medium text-slate-500 mb-2">Location</Text>

      {/* Your Terminals - larger, prominent */}
      {favoriteTerminals.length > 0 && (
        <View className="mb-3">
          <Text className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-1.5">
            Your Terminals
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {favoriteTerminals.map((loc) => (
              <Pressable
                key={loc}
                onPress={() => onSelect(loc)}
                className={`px-4 py-2.5 rounded-xl ${
                  value === loc ? 'bg-blue-600' : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    value === loc ? 'text-white' : 'text-blue-700'
                  }`}
                >
                  {loc}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Recent Terminals */}
      {recentTerminals.length > 0 && (
        <View className="mb-3">
          <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Recent
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {recentTerminals.map((loc) => (
              <Pressable
                key={loc}
                onPress={() => onSelect(loc)}
                className={`px-3 py-2 rounded-lg ${
                  value === loc ? 'bg-blue-600' : 'bg-white border border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    value === loc ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {loc}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* All Terminals (collapsed if favorites exist) */}
      <View>
        {favoriteTerminals.length > 0 && (
          <Pressable
            onPress={onToggleAllTerminals}
            className="flex-row items-center gap-1 mb-1.5"
          >
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              All Terminals
            </Text>
            <Ionicons
              name={showAllTerminals ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#94a3b8"
            />
          </Pressable>
        )}
        {(favoriteTerminals.length === 0 || showAllTerminals) && (
          <View className="flex-row flex-wrap gap-2">
            {(favoriteTerminals.length === 0 ? allLocations : otherTerminals).map((loc) => (
              <Pressable
                key={loc}
                onPress={() => onSelect(loc)}
                className={`w-[31%] p-2 rounded-lg items-center ${
                  value === loc ? 'bg-blue-600' : 'bg-white border border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-medium text-center ${
                    value === loc ? 'text-white' : 'text-slate-700'
                  }`}
                  numberOfLines={1}
                >
                  {loc}
                </Text>
              </Pressable>
            ))}
            {/* Custom location button */}
            <Pressable
              onPress={() => onSetShowCustomLocation(true)}
              className="w-[31%] p-2 rounded-lg items-center justify-center bg-slate-50 border border-dashed border-slate-300 flex-row gap-1"
            >
              <Ionicons name="add" size={14} color="#64748b" />
              <Text className="text-xs font-medium text-slate-500">Other</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Custom Location Input */}
      {showCustomLocation && (
        <View className="mt-2 flex-row gap-2">
          <TextInput
            placeholder="Enter location name"
            value={customLocation}
            onChangeText={onSetCustomLocation}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
            placeholderTextColor="#94a3b8"
          />
          <Pressable
            onPress={onAddCustom}
            className="px-4 py-2 bg-blue-600 rounded-lg justify-center"
          >
            <Text className="text-white text-sm font-medium">Add</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onSetShowCustomLocation(false);
              onSetCustomLocation('');
            }}
            className="px-3 py-2 bg-slate-100 rounded-lg justify-center"
          >
            <Ionicons name="close" size={16} color="#475569" />
          </Pressable>
        </View>
      )}
    </View>
  );
});
