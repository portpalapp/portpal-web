import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { useFavoriteTerminals } from '../hooks/useFavoriteTerminals';
import { LOCATIONS } from '../data/mockData';

const UNION_LOCALS = ['500', '502', '505', '508', '514', '517'] as const;

export default function ProfileScreen() {
  const { user, demoMode, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { isDark, toggleDark } = useTheme();

  const { favorites: favoriteTerminals, addFavorite, removeFavorite } = useFavoriteTerminals();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [unionLocal, setUnionLocal] = useState('500');
  const [saving, setSaving] = useState(false);
  const [showLocalPicker, setShowLocalPicker] = useState(false);
  const [showTerminalPicker, setShowTerminalPicker] = useState(false);

  // Populate fields from profile when loaded
  useEffect(() => {
    if (profile && profile.name) {
      const parts = profile.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    if (profile && profile.board) {
      // board field stores union local in existing schema
      setUnionLocal(profile.board);
    }
  }, [profile]);

  const email = user?.email || (demoMode ? 'demo@portpal.app' : '');

  const getInitials = () => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    if (first && last) return `${first}${last}`;
    if (first) return first;
    return 'U';
  };

  const handleSave = async () => {
    if (demoMode) {
      Alert.alert('Demo Mode', 'Sign in to save profile changes.');
      return;
    }

    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required.');
      return;
    }

    setSaving(true);
    const fullName = lastName.trim()
      ? `${firstName.trim()} ${lastName.trim()}`
      : firstName.trim();

    const { error } = await updateProfile({
      name: fullName,
      board: unionLocal,
    });
    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } else {
      Alert.alert('Saved', 'Your profile has been updated.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  if (profileLoading) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with back button */}
        <View
          className={`flex-row items-center px-4 py-3 border-b ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}
        >
          <Pressable onPress={() => router.back()} className="p-1 mr-3">
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? '#e2e8f0' : '#1e293b'}
            />
          </Pressable>
          <Text
            className={`text-lg font-bold flex-1 ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            Profile
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-6 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar / Initials Circle */}
          <View className="items-center mb-8">
            <View
              className={`w-24 h-24 rounded-full items-center justify-center ${
                isDark ? 'bg-blue-700' : 'bg-blue-600'
              }`}
            >
              <Text className="text-white text-3xl font-bold">
                {getInitials()}
              </Text>
            </View>
            <Text
              className={`mt-3 text-base font-semibold ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {firstName || 'User'} {lastName}
            </Text>
            {!demoMode && (
              <Text
                className={`text-sm mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Local {unionLocal}
              </Text>
            )}
          </View>

          {/* Form Fields */}
          <View className="gap-4">
            {/* First Name */}
            <View>
              <Text
                className={`text-xs font-medium mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                First Name
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
                placeholder="First name"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View>
              <Text
                className={`text-xs font-medium mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Last Name
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
                placeholder="Last name"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            {/* Email (read-only) */}
            <View>
              <Text
                className={`text-xs font-medium mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Email
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
                value={email}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>

            {/* Union Local Dropdown */}
            <View>
              <Text
                className={`text-xs font-medium mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Union Local
              </Text>
              <Pressable
                onPress={() => setShowLocalPicker(!showLocalPicker)}
                className={`border rounded-xl px-4 py-3 flex-row items-center justify-between ${
                  isDark
                    ? 'bg-slate-800 border-slate-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={isDark ? 'text-slate-100' : 'text-slate-800'}
                >
                  Local {unionLocal}
                </Text>
                <Ionicons
                  name={showLocalPicker ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
              </Pressable>

              {showLocalPicker && (
                <View
                  className={`mt-1 border rounded-xl overflow-hidden ${
                    isDark
                      ? 'bg-slate-800 border-slate-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {UNION_LOCALS.map((local) => (
                    <Pressable
                      key={local}
                      onPress={() => {
                        setUnionLocal(local);
                        setShowLocalPicker(false);
                      }}
                      className={`px-4 py-3 flex-row items-center justify-between border-b ${
                        isDark ? 'border-slate-700' : 'border-slate-100'
                      } ${
                        local === unionLocal
                          ? isDark
                            ? 'bg-blue-900/30'
                            : 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <Text
                        className={`${
                          local === unionLocal
                            ? 'text-blue-600 font-semibold'
                            : isDark
                              ? 'text-slate-200'
                              : 'text-slate-700'
                        }`}
                      >
                        Local {local}
                      </Text>
                      {local === unionLocal && (
                        <Ionicons name="checkmark" size={18} color="#2563eb" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Favorite Terminals */}
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Your Terminals
                </Text>
                <Pressable
                  onPress={() => setShowTerminalPicker(!showTerminalPicker)}
                  className="flex-row items-center gap-1"
                >
                  <Ionicons
                    name={showTerminalPicker ? 'close-circle-outline' : 'add-circle-outline'}
                    size={16}
                    color="#2563eb"
                  />
                  <Text className="text-xs font-medium text-blue-600">
                    {showTerminalPicker ? 'Done' : 'Edit'}
                  </Text>
                </Pressable>
              </View>

              {/* Current favorites as removable chips */}
              {favoriteTerminals.length > 0 ? (
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {favoriteTerminals.map((terminal) => (
                    <View
                      key={terminal}
                      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${
                        isDark
                          ? 'bg-blue-900/30 border border-blue-700'
                          : 'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isDark ? 'text-blue-300' : 'text-blue-700'
                        }`}
                      >
                        {terminal}
                      </Text>
                      <Pressable onPress={() => removeFavorite(terminal)} hitSlop={8}>
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={isDark ? '#93c5fd' : '#3b82f6'}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  className={`text-xs mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  No favorite terminals set. Tap Edit to add some.
                </Text>
              )}

              {/* Terminal picker */}
              {showTerminalPicker && (
                <View
                  className={`border rounded-xl overflow-hidden mb-1 ${
                    isDark
                      ? 'bg-slate-800 border-slate-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {LOCATIONS.filter((loc) => !favoriteTerminals.includes(loc)).map(
                    (loc, idx, arr) => (
                      <Pressable
                        key={loc}
                        onPress={() => addFavorite(loc)}
                        className={`px-4 py-3 flex-row items-center justify-between ${
                          idx < arr.length - 1
                            ? isDark
                              ? 'border-b border-slate-700'
                              : 'border-b border-slate-100'
                            : ''
                        }`}
                      >
                        <Text
                          className={isDark ? 'text-slate-200' : 'text-slate-700'}
                        >
                          {loc}
                        </Text>
                        <Ionicons name="add" size={18} color="#2563eb" />
                      </Pressable>
                    )
                  )}
                  {LOCATIONS.filter((loc) => !favoriteTerminals.includes(loc))
                    .length === 0 && (
                    <View className="px-4 py-3">
                      <Text
                        className={`text-sm ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        All terminals have been added.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Dark Mode Toggle */}
            <View
              className={`border rounded-xl px-4 py-3 flex-row items-center justify-between ${
                isDark
                  ? 'bg-slate-800 border-slate-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name={isDark ? 'moon' : 'moon-outline'}
                  size={20}
                  color={isDark ? '#a78bfa' : '#64748b'}
                />
                <Text
                  className={`font-medium ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleDark}
                trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                thumbColor={isDark ? '#ffffff' : '#f8fafc'}
              />
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="bg-blue-600 rounded-xl py-3.5 items-center mt-8"
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Save Changes
              </Text>
            )}
          </Pressable>

          {/* Sign Out Button */}
          <Pressable
            onPress={handleSignOut}
            className={`rounded-xl py-3.5 items-center mt-4 border ${
              isDark ? 'border-red-800' : 'border-red-200'
            }`}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-red-500 font-semibold text-base">
                Sign Out
              </Text>
            </View>
          </Pressable>

          {/* App Version */}
          <Text
            className={`text-center text-xs mt-8 ${
              isDark ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            PORTPAL v1.0.0
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
