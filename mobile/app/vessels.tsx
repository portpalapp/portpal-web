import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVesselSearch, useVesselDetails, useVesselList } from '../hooks/useVessels';
import type { Vessel } from '../hooks/useVessels';

// ─── Detail Card ───

function VesselDetailCard({ vessel }: { vessel: Vessel }) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-blue-600 rounded-2xl p-5 mb-4">
        <Text className="text-2xl font-bold text-white mb-1">{vessel.name}</Text>
        {vessel.former_names && (
          <Text className="text-blue-200 text-xs mb-2">Formerly: {vessel.former_names}</Text>
        )}
        <View className="flex-row flex-wrap gap-3 mt-2">
          {vessel.year_built && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={14} color="#bfdbfe" />
              <Text className="text-blue-100 text-sm">Built {vessel.year_built}</Text>
            </View>
          )}
          {vessel.teu && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="cube-outline" size={14} color="#bfdbfe" />
              <Text className="text-blue-100 text-sm">{vessel.teu.toLocaleString()} TEU</Text>
            </View>
          )}
          {vessel.bays && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="grid-outline" size={14} color="#bfdbfe" />
              <Text className="text-blue-100 text-sm">{vessel.bays} bays</Text>
            </View>
          )}
          {vessel.width && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="resize-outline" size={14} color="#bfdbfe" />
              <Text className="text-blue-100 text-sm">{vessel.width} wide</Text>
            </View>
          )}
        </View>
        <Text className="text-blue-300 text-xs mt-3">IMO {vessel.imo}</Text>
      </View>

      {/* Equipment Sections */}
      <EquipmentSection title="Deck Lashing" icon="construct-outline" items={vessel.deck_lashing} />
      <EquipmentSection title="Walkways" icon="walk-outline" items={vessel.walkways} />
      <EquipmentSection title="Lashing" icon="link-outline" items={vessel.lashing} />
      <EquipmentSection title="Bars" icon="remove-outline" items={vessel.bars} />
      <EquipmentSection title="Turnbuckles" icon="settings-outline" items={vessel.turnbuckles} />
      <EquipmentSection title="Stackers" icon="layers-outline" items={vessel.stackers} />

      {/* Notes */}
      {vessel.notes.length > 0 && (
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="alert-circle-outline" size={16} color="#d97706" />
            <Text className="text-sm font-semibold text-amber-800">Notes</Text>
          </View>
          {vessel.notes.map((note, i) => (
            <Text key={i} className="text-sm text-amber-700 mb-1">
              {'\u2022'} {note}
            </Text>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function EquipmentSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: string[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <View className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name={icon} size={16} color="#475569" />
        <Text className="text-sm font-semibold text-slate-700">{title}</Text>
        <View className="bg-slate-100 px-1.5 py-0.5 rounded">
          <Text className="text-xs text-slate-500">{items.length}</Text>
        </View>
      </View>
      {items.map((item, i) => (
        <Text key={i} className="text-sm text-slate-600 ml-6 mb-0.5">
          {'\u2022'} {item}
        </Text>
      ))}
    </View>
  );
}

// ─── Search Results Item ───

function VesselListItem({
  vessel,
  onPress,
}: {
  vessel: Pick<Vessel, 'imo' | 'name' | 'year_built' | 'teu' | 'bays'>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-slate-200 rounded-xl p-4 mb-2 flex-row items-center"
    >
      <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3">
        <Ionicons name="boat" size={20} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-800">{vessel.name}</Text>
        <Text className="text-xs text-slate-400">
          {[
            vessel.year_built && `Built ${vessel.year_built}`,
            vessel.teu && `${vessel.teu.toLocaleString()} TEU`,
            vessel.bays && `${vessel.bays} bays`,
          ]
            .filter(Boolean)
            .join(' \u2022 ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </Pressable>
  );
}

// ─── Main Screen ───

export default function VesselsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imo?: string }>();

  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIMO, setSelectedIMO] = useState<number | null>(
    params.imo ? parseInt(params.imo, 10) : null
  );
  const [page, setPage] = useState(0);

  // Hooks
  const { data: searchResults = [], isFetching: searching } = useVesselSearch(searchQuery);
  const { data: vesselDetail, isLoading: loadingDetail } = useVesselDetails(selectedIMO);
  const { data: listData, isLoading: loadingList } = useVesselList(page);

  const vessels = listData?.vessels ?? [];
  const totalVessels = listData?.total ?? 0;

  // Debounced search
  const debounceRef = useMemo(() => ({ timer: null as ReturnType<typeof setTimeout> | null }), []);
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      if (debounceRef.timer) clearTimeout(debounceRef.timer);
      debounceRef.timer = setTimeout(() => {
        setSearchQuery(text.trim());
      }, 300);
    },
    [debounceRef]
  );

  const handleSelectVessel = useCallback((imo: number) => {
    setSelectedIMO(imo);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedIMO(null);
  }, []);

  // If showing vessel details
  if (selectedIMO) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="flex-1 px-4 pt-4">
          {/* Back header */}
          <View className="flex-row items-center mb-4">
            <Pressable
              onPress={handleBackToList}
              className="flex-row items-center gap-1 mr-4"
            >
              <Ionicons name="arrow-back" size={20} color="#3b82f6" />
              <Text className="text-blue-500 font-medium">Vessels</Text>
            </Pressable>
          </View>

          {loadingDetail ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-slate-400 text-sm mt-2">Loading vessel details...</Text>
            </View>
          ) : vesselDetail ? (
            <VesselDetailCard vessel={vesselDetail} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="boat-outline" size={48} color="#cbd5e1" />
              <Text className="text-slate-400 text-sm mt-2">Vessel not found</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Search results or browse list
  const displayList = searchQuery.length >= 2 ? searchResults : vessels;
  const isLoading = searchQuery.length >= 2 ? searching : loadingList;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#1e293b" />
            </Pressable>
            <View>
              <Text className="text-xl font-bold text-slate-800">Vessels</Text>
              <Text className="text-xs text-slate-400">
                {totalVessels > 0 ? `${totalVessels} vessels in database` : 'Ship lashing info'}
              </Text>
            </View>
          </View>
          <Ionicons name="boat" size={24} color="#3b82f6" />
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 mb-4">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder="Search vessels..."
            className="flex-1 px-2 py-3 text-sm text-slate-700"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
          />
          {searchText.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchText('');
                setSearchQuery('');
              }}
            >
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        {/* List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : displayList.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="boat-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 text-sm mt-2">
              {searchQuery.length >= 2 ? 'No vessels found' : 'No vessels loaded yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayList}
            keyExtractor={(item) => String(item.imo)}
            renderItem={({ item }) => (
              <VesselListItem vessel={item} onPress={() => handleSelectVessel(item.imo)} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            // Pagination for browse mode
            onEndReached={() => {
              if (!searchQuery && vessels.length < totalVessels) {
                setPage((p) => p + 1);
              }
            }}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
