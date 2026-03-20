import { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../hooks/useProfile';
import { LOCATIONS } from '../data/mockData';

// ---------------------------------------------------------------------------
// Schema note:
// The Supabase profiles table needs a `ratings` column added:
//   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ratings text[] DEFAULT '{}';
// Until then, ratings are saved to AsyncStorage with key 'portpal_user_ratings'.
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 6;

// Union locals data
const UNION_LOCALS = [
  { id: '500', name: 'Local 500', location: 'Vancouver' },
  { id: '502', name: 'Local 502', location: 'New Westminster' },
  { id: '505', name: 'Local 505', location: 'Prince Rupert' },
  { id: '508', name: 'Local 508', location: 'Chemainus / Nanaimo' },
  { id: '514', name: 'Local 514', location: 'Burnaby (Foremen)' },
  { id: '517', name: 'Local 517', location: 'Vancouver (Warehouse)' },
];

// Primary terminals shown as cards
const PRIMARY_TERMINALS = [
  'CENTENNIAL',
  'VANTERM',
  'DELTAPORT',
  'FRASER SURREY',
  'LYNNTERM',
  'NEPTUNE',
];

// Job certification groups
const JOB_GROUPS: { label: string; icon: keyof typeof Ionicons.glyphMap; jobs: string[] }[] = [
  {
    label: 'Equipment',
    icon: 'car-outline',
    jobs: [
      '40 TON (TOP PICK)',
      'BULLDOZER',
      'EXCAVATOR',
      'FRONT END LOADER',
      'KOMATSU',
      'LOCI',
      'REACHSTACKER',
      'TRACTOR TRAILER',
      'LIFT TRUCK',
      'MOBILE CRANE',
    ],
  },
  {
    label: 'Gantry',
    icon: 'construct-outline',
    jobs: [
      'DOCK GANTRY',
      'RAIL MOUNTED GANTRY',
      'RUBBER TIRE GANTRY',
      'SHIP GANTRY',
    ],
  },
  {
    label: 'Trades',
    icon: 'hammer-outline',
    jobs: [
      'CARPENTER',
      'ELECTRICIAN',
      'HD MECHANIC',
      'MILLWRIGHT',
      'PLUMBER',
      'WELDER',
      'PAINTER',
    ],
  },
  {
    label: 'Dock',
    icon: 'boat-outline',
    jobs: [
      'DOCK CHECKER',
      'HEAD CHECKER',
      'GEARPERSON',
      'STORESPERSON',
      'LABOUR',
      'LINES',
    ],
  },
  {
    label: 'Specialty',
    icon: 'star-outline',
    jobs: [
      'BULK OPERATOR',
      'LIQUID BULK',
      'WHEAT MACHINE',
      'WHEAT SPECIALTY',
      'FIRST AID',
      'TRAINER',
    ],
  },
  {
    label: 'Other',
    icon: 'ellipsis-horizontal-outline',
    jobs: [
      'BUNNY BUS',
      'DOW MEN',
      'HATCH TENDER/SIGNAL',
      'LOCKERMAN',
      'OB',
      'PUSHER',
      'SWITCHMAN',
      'TRACKMEN',
      'TRAINING',
      'WINCH DRIVER',
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateProfile } = useProfile();

  // Step tracking
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form state
  const [selectedLocal, setSelectedLocal] = useState('500');
  const [selectedBoard, setSelectedBoard] = useState<'A' | 'B'>('A');
  const [seniorityNumber, setSeniorityNumber] = useState('');
  const [selectedTerminals, setSelectedTerminals] = useState<string[]>([]);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Animate step transitions
  const animateTransition = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      animateTransition(step - 1);
    }
  };

  // Toggle a single rating
  const toggleRating = (job: string) => {
    setSelectedRatings((prev) =>
      prev.includes(job) ? prev.filter((j) => j !== job) : [...prev, job]
    );
  };

  // Toggle all in a group
  const toggleGroup = (jobs: string[]) => {
    const allSelected = jobs.every((j) => selectedRatings.includes(j));
    if (allSelected) {
      setSelectedRatings((prev) => prev.filter((j) => !jobs.includes(j)));
    } else {
      setSelectedRatings((prev) => {
        const combined = new Set([...prev, ...jobs]);
        return Array.from(combined);
      });
    }
  };

  // Save and complete onboarding
  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save profile data to Supabase
      const profileUpdates: Record<string, any> = {
        union_local: selectedLocal,
        board: selectedBoard,
        // Keep home_terminal as the first selected terminal for backwards compat
        home_terminal: selectedTerminals.length > 0 ? selectedTerminals[0] : null,
      };
      if (seniorityNumber.trim()) {
        profileUpdates.seniority = parseInt(seniorityNumber, 10) || 0;
      }

      const { error } = await updateProfile(profileUpdates);
      if (error) {
        console.warn('[Onboarding] Profile update error:', error);
      }

      // Save favorite terminals to AsyncStorage
      await AsyncStorage.setItem(
        'portpal_favorite_terminals',
        JSON.stringify(selectedTerminals)
      );

      // Save ratings to AsyncStorage (no DB column yet)
      await AsyncStorage.setItem(
        'portpal_user_ratings',
        JSON.stringify(selectedRatings)
      );

      // Mark onboarding as completed
      await AsyncStorage.setItem('portpal_onboarding_completed', 'true');

      setSaving(false);
      router.replace('/');
    } catch (err) {
      console.warn('[Onboarding] Error saving:', err);
      setSaving(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // ---------------------------------------------------------------------------
  // Step renderers
  // ---------------------------------------------------------------------------

  const renderProgressBar = () => (
    <View className="flex-row items-center justify-center gap-2 pt-4 pb-2 px-6">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i <= step ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        />
      ))}
    </View>
  );

  const renderStepWelcome = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-6">
        <Ionicons name="boat" size={40} color="#ffffff" />
      </View>
      <Text className="text-3xl font-bold text-slate-800 text-center mb-3">
        Welcome to PORTPAL
      </Text>
      <Text className="text-base text-slate-500 text-center leading-6 mb-2">
        Let's set up your profile so we can calculate your pay accurately.
      </Text>
      <Text className="text-sm text-slate-400 text-center">
        This only takes a minute.
      </Text>
      <Pressable
        onPress={goNext}
        className="bg-blue-600 rounded-2xl py-4 px-12 mt-10"
      >
        <Text className="text-white font-semibold text-base">Get Started</Text>
      </Pressable>
    </View>
  );

  const renderStepUnionLocal = () => (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pb-8"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-2xl font-bold text-slate-800 mb-2 mt-4">
        Which local are you in?
      </Text>
      <Text className="text-sm text-slate-500 mb-6">
        Select your ILWU local union.
      </Text>
      <View className="gap-3">
        {UNION_LOCALS.map((local) => (
          <Pressable
            key={local.id}
            onPress={() => setSelectedLocal(local.id)}
            className={`flex-row items-center p-4 rounded-2xl border-2 ${
              selectedLocal === local.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                selectedLocal === local.id ? 'bg-blue-600' : 'bg-slate-100'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  selectedLocal === local.id ? 'text-white' : 'text-slate-500'
                }`}
              >
                {local.id}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className={`font-semibold text-base ${
                  selectedLocal === local.id ? 'text-blue-700' : 'text-slate-800'
                }`}
              >
                {local.name}
              </Text>
              <Text
                className={`text-sm ${
                  selectedLocal === local.id ? 'text-blue-500' : 'text-slate-400'
                }`}
              >
                {local.location}
              </Text>
            </View>
            {selectedLocal === local.id && (
              <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
            )}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const renderStepBoardSeniority = () => (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pb-8"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Board selection */}
      <Text className="text-2xl font-bold text-slate-800 mb-2 mt-4">
        What board are you on?
      </Text>
      <Text className="text-sm text-slate-500 mb-5">
        Select your dispatch board.
      </Text>
      <View className="flex-row gap-4 mb-8">
        {(['A', 'B'] as const).map((board) => (
          <Pressable
            key={board}
            onPress={() => setSelectedBoard(board)}
            className={`flex-1 py-5 rounded-2xl border-2 items-center ${
              selectedBoard === board
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <Text
              className={`text-3xl font-bold mb-1 ${
                selectedBoard === board ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              {board}
            </Text>
            <Text
              className={`text-sm ${
                selectedBoard === board ? 'text-blue-500' : 'text-slate-400'
              }`}
            >
              {board} Board
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Seniority number */}
      <Text className="text-2xl font-bold text-slate-800 mb-2">
        Seniority number
      </Text>
      <Text className="text-sm text-slate-500 mb-4">
        You can find this on your dispatch card.
      </Text>
      <TextInput
        className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-lg"
        placeholder="e.g., 2847"
        placeholderTextColor="#94a3b8"
        value={seniorityNumber}
        onChangeText={setSeniorityNumber}
        keyboardType="number-pad"
        returnKeyType="done"
      />
    </ScrollView>
  );

  const toggleTerminal = (terminal: string) => {
    setSelectedTerminals((prev) =>
      prev.includes(terminal)
        ? prev.filter((t) => t !== terminal)
        : [...prev, terminal]
    );
  };

  const renderStepHomeTerminal = () => {
    // All locations minus the primary ones, for the "Other" picker
    const otherLocations = LOCATIONS.filter(
      (loc) => !PRIMARY_TERMINALS.includes(loc)
    );

    return (
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-slate-800 mb-2 mt-4">
          Which terminals do you work at?
        </Text>
        <Text className="text-sm text-slate-500 mb-6">
          Select all that apply. These will appear first when logging shifts.
        </Text>

        {/* Selected count badge */}
        {selectedTerminals.length > 0 && (
          <View className="flex-row items-center justify-between mb-4 bg-blue-50 rounded-xl px-4 py-2.5">
            <Text className="text-blue-600 text-sm font-medium">
              {selectedTerminals.length} terminal{selectedTerminals.length !== 1 ? 's' : ''} selected
            </Text>
            <Pressable onPress={() => setSelectedTerminals([])}>
              <Text className="text-blue-500 text-sm">Clear all</Text>
            </Pressable>
          </View>
        )}

        {/* Primary terminal cards (multi-select) */}
        <View className="flex-row flex-wrap gap-3 mb-4">
          {PRIMARY_TERMINALS.map((terminal) => {
            const isSelected = selectedTerminals.includes(terminal);
            return (
              <Pressable
                key={terminal}
                onPress={() => toggleTerminal(terminal)}
                className={`rounded-2xl border-2 py-3.5 px-4 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
                style={{ width: (Dimensions.get('window').width - 60) / 2 - 6 }}
              >
                <View className="flex-row items-center justify-between">
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={isSelected ? '#2563eb' : '#94a3b8'}
                  />
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                  )}
                </View>
                <Text
                  className={`font-semibold text-sm mt-1.5 ${
                    isSelected ? 'text-blue-700' : 'text-slate-700'
                  }`}
                >
                  {terminal}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Other toggle */}
        <Pressable
          onPress={() => setShowAllLocations(!showAllLocations)}
          className={`flex-row items-center justify-between p-4 rounded-2xl border-2 ${
            otherLocations.some((loc) => selectedTerminals.includes(loc))
              ? 'border-blue-600 bg-blue-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="list-outline" size={20} color="#64748b" />
            <Text className="text-slate-700 font-medium">
              Other locations...
            </Text>
          </View>
          <Ionicons
            name={showAllLocations ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#94a3b8"
          />
        </Pressable>

        {showAllLocations && (
          <View className="mt-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {otherLocations.map((loc, idx) => {
              const isSelected = selectedTerminals.includes(loc);
              return (
                <Pressable
                  key={loc}
                  onPress={() => toggleTerminal(loc)}
                  className={`px-4 py-3 flex-row items-center justify-between ${
                    idx < otherLocations.length - 1
                      ? 'border-b border-slate-100'
                      : ''
                  } ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <Text
                    className={
                      isSelected
                        ? 'text-blue-600 font-semibold'
                        : 'text-slate-700'
                    }
                  >
                    {loc}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color="#2563eb" />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderStepRatings = () => (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pb-8"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-2xl font-bold text-slate-800 mb-2 mt-4">
        Job certifications
      </Text>
      <Text className="text-sm text-slate-500 mb-6">
        Select jobs you're rated for. This helps show relevant templates and analytics.
      </Text>

      {selectedRatings.length > 0 && (
        <View className="flex-row items-center justify-between mb-4 bg-blue-50 rounded-xl px-4 py-2.5">
          <Text className="text-blue-600 text-sm font-medium">
            {selectedRatings.length} job{selectedRatings.length !== 1 ? 's' : ''} selected
          </Text>
          <Pressable onPress={() => setSelectedRatings([])}>
            <Text className="text-blue-500 text-sm">Clear all</Text>
          </Pressable>
        </View>
      )}

      {JOB_GROUPS.map((group) => {
        const allSelected = group.jobs.every((j) =>
          selectedRatings.includes(j)
        );

        return (
          <View key={group.label} className="mb-5">
            {/* Group header */}
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={group.icon as any}
                  size={18}
                  color="#64748b"
                />
                <Text className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  {group.label}
                </Text>
              </View>
              <Pressable
                onPress={() => toggleGroup(group.jobs)}
                className="px-3 py-1 rounded-lg bg-slate-100"
              >
                <Text className="text-xs font-medium text-slate-500">
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </Pressable>
            </View>

            {/* Job chips */}
            <View className="flex-row flex-wrap gap-2">
              {group.jobs.map((job) => {
                const isSelected = selectedRatings.includes(job);
                return (
                  <Pressable
                    key={job}
                    onPress={() => toggleRating(job)}
                    className={`rounded-xl px-3.5 py-2.5 border ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <View className="flex-row items-center gap-1.5">
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#2563eb"
                        />
                      )}
                      <Text
                        className={`text-xs font-medium ${
                          isSelected ? 'text-blue-700' : 'text-slate-600'
                        }`}
                      >
                        {job}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderStepComplete = () => {
    const localInfo = UNION_LOCALS.find((l) => l.id === selectedLocal);
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-green-500 items-center justify-center mb-6">
          <Ionicons name="checkmark" size={44} color="#ffffff" />
        </View>
        <Text className="text-3xl font-bold text-slate-800 text-center mb-3">
          You're all set!
        </Text>
        <Text className="text-base text-slate-500 text-center mb-8">
          Your profile is ready. Start tracking your shifts.
        </Text>

        {/* Summary card */}
        <View className="bg-white rounded-2xl p-5 w-full border border-slate-200 mb-8">
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-500">Union Local</Text>
              <Text className="text-sm font-semibold text-slate-800">
                Local {selectedLocal}
                {localInfo ? ` - ${localInfo.location}` : ''}
              </Text>
            </View>
            <View className="h-px bg-slate-100" />
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-500">Board</Text>
              <Text className="text-sm font-semibold text-slate-800">
                {selectedBoard} Board
              </Text>
            </View>
            {seniorityNumber.trim() ? (
              <>
                <View className="h-px bg-slate-100" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-slate-500">Seniority</Text>
                  <Text className="text-sm font-semibold text-slate-800">
                    #{seniorityNumber}
                  </Text>
                </View>
              </>
            ) : null}
            {selectedTerminals.length > 0 ? (
              <>
                <View className="h-px bg-slate-100" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-slate-500">Favorite Terminals</Text>
                  <Text className="text-sm font-semibold text-slate-800">
                    {selectedTerminals.length} terminal{selectedTerminals.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </>
            ) : null}
            {selectedRatings.length > 0 && (
              <>
                <View className="h-px bg-slate-100" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-slate-500">Rated Jobs</Text>
                  <Text className="text-sm font-semibold text-slate-800">
                    {selectedRatings.length} job
                    {selectedRatings.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <Pressable
          onPress={handleComplete}
          disabled={saving}
          className="bg-blue-600 rounded-2xl py-4 px-12 w-full items-center"
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Start Tracking
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  // Map step index to render function
  const renderStep = () => {
    switch (step) {
      case 0:
        return renderStepWelcome();
      case 1:
        return renderStepUnionLocal();
      case 2:
        return renderStepBoardSeniority();
      case 3:
        return renderStepHomeTerminal();
      case 4:
        return renderStepRatings();
      case 5:
        return renderStepComplete();
      default:
        return null;
    }
  };

  // Whether current step can be skipped
  const isSkippable = step === 3 || step === 4;

  // Whether to show bottom nav (not on welcome or complete)
  const showBottomNav = step > 0 && step < TOTAL_STEPS - 1;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress bar */}
        {renderProgressBar()}

        {/* Back button (not on step 0) */}
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <Pressable
            onPress={goBack}
            className="flex-row items-center px-6 pt-2 pb-1"
          >
            <Ionicons name="arrow-back" size={20} color="#64748b" />
            <Text className="text-slate-500 text-sm ml-1">Back</Text>
          </Pressable>
        )}

        {/* Step content */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {renderStep()}
        </Animated.View>

        {/* Bottom navigation */}
        {showBottomNav && (
          <View className="px-6 pb-4 pt-2">
            <View className="flex-row items-center gap-3">
              {isSkippable && (
                <Pressable
                  onPress={goNext}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 items-center"
                >
                  <Text className="text-slate-500 font-semibold text-base">
                    Skip
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={goNext}
                className={`py-3.5 rounded-2xl bg-blue-600 items-center ${
                  isSkippable ? 'flex-1' : 'w-full'
                }`}
              >
                <Text className="text-white font-semibold text-base">
                  Continue
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
