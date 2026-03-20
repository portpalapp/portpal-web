import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVesselSearch } from '../../hooks/useVessels';

interface VesselAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default React.memo(function VesselAutocomplete({
  value,
  onChangeText,
}: VesselAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIMO, setSelectedIMO] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const { data: suggestions = [], isFetching } = useVesselSearch(query);

  // Debounce the search query
  const handleTextChange = useCallback(
    (text: string) => {
      onChangeText(text);
      setSelectedIMO(null);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setQuery(text.trim());
        setShowSuggestions(text.trim().length >= 2);
      }, 300);
    },
    [onChangeText]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSelectVessel = useCallback(
    (name: string, imo: number) => {
      onChangeText(name);
      setSelectedIMO(imo);
      setShowSuggestions(false);
      setQuery('');
    },
    [onChangeText]
  );

  const handleViewDetails = useCallback(() => {
    if (selectedIMO) {
      router.push({ pathname: '/vessels', params: { imo: String(selectedIMO) } });
    }
  }, [selectedIMO, router]);

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs font-medium text-slate-500">Vessel Name</Text>
        {selectedIMO && (
          <Pressable onPress={handleViewDetails} className="flex-row items-center gap-1">
            <Ionicons name="information-circle-outline" size={14} color="#3b82f6" />
            <Text className="text-xs text-blue-500 font-medium">View Details</Text>
          </Pressable>
        )}
      </View>

      <View className="relative">
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-lg">
          <Ionicons
            name="boat-outline"
            size={16}
            color="#94a3b8"
            style={{ marginLeft: 12 }}
          />
          <TextInput
            value={value}
            onChangeText={handleTextChange}
            placeholder="Search or type vessel name..."
            className="flex-1 px-2 py-2 text-sm text-slate-700"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            onFocus={() => {
              if (value.trim().length >= 2) {
                setQuery(value.trim());
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay to allow press on suggestion
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          {isFetching && (
            <View style={{ marginRight: 12 }}>
              <Ionicons name="hourglass-outline" size={14} color="#94a3b8" />
            </View>
          )}
          {value.length > 0 && !isFetching && (
            <Pressable
              onPress={() => {
                onChangeText('');
                setQuery('');
                setShowSuggestions(false);
                setSelectedIMO(null);
              }}
              style={{ marginRight: 12 }}
            >
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            className="bg-white border border-slate-200 rounded-lg mt-1 overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              maxHeight: 200,
            }}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item) => String(item.imo)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectVessel(item.name, item.imo)}
                  className="px-3 py-2.5 border-b border-slate-100 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-medium text-slate-800">{item.name}</Text>
                    <Text className="text-xs text-slate-400">
                      {[
                        item.year_built && `Built ${item.year_built}`,
                        item.teu && `${item.teu.toLocaleString()} TEU`,
                        item.bays && `${item.bays} bays`,
                      ]
                        .filter(Boolean)
                        .join(' \u2022 ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                </Pressable>
              )}
            />
          </View>
        )}

        {/* No results hint */}
        {showSuggestions && suggestions.length === 0 && query.length >= 2 && !isFetching && (
          <View className="bg-slate-50 border border-slate-200 rounded-lg mt-1 px-3 py-2">
            <Text className="text-xs text-slate-400">
              No matching vessels. Your entry will be saved as typed.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});
