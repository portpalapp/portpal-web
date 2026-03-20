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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Extract tokens from the deep link URL and establish a session
  useEffect(() => {
    const extractSession = async () => {
      try {
        // Get the URL that opened this screen
        const url = await Linking.getInitialURL();
        if (url) {
          const hashFragment = url.split('#')[1];
          if (hashFragment) {
            const hashParams = new URLSearchParams(hashFragment);
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) {
                console.warn('[ResetPassword] setSession error:', error.message);
              } else {
                setSessionReady(true);
                setInitializing(false);
                return;
              }
            }
          }
        }

        // Also check if we already have a valid session (e.g., from PASSWORD_RECOVERY event)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
        }
      } catch (err) {
        console.warn('[ResetPassword] init error:', err);
      }
      setInitializing(false);
    };

    extractSession();
  }, []);

  const handleResetPassword = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      Alert.alert(
        'Password Updated',
        'Your password has been set. You can now sign in.',
        [{ text: 'Sign In', onPress: () => router.replace('/login') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  if (initializing) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-slate-400 text-sm mt-3">Verifying reset link...</Text>
      </SafeAreaView>
    );
  }

  if (!sessionReady) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 justify-center px-6">
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={40} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-slate-800 text-center">
              Link expired or invalid
            </Text>
            <Text className="text-slate-500 text-sm text-center mt-2 px-4">
              This password reset link has expired or is no longer valid.
              Please request a new one.
            </Text>
          </View>

          <Pressable
            onPress={() => router.replace('/login')}
            className="bg-blue-600 rounded-xl py-3.5 items-center"
          >
            <Text className="text-white font-semibold text-base">Back to Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
              <Ionicons name="lock-open-outline" size={32} color="#2563eb" />
            </View>
            <Text className="text-2xl font-bold text-slate-800">Set New Password</Text>
            <Text className="text-slate-500 text-sm text-center mt-1">
              Choose a password for your PORTPAL account
            </Text>
          </View>

          {/* Password fields */}
          <View className="gap-4 mb-6">
            <View>
              <Text className="text-xs font-medium text-slate-500 mb-1">New Password</Text>
              <View className="flex-row items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                <TextInput
                  className="flex-1 px-4 py-3 text-slate-800"
                  placeholder="At least 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                  placeholderTextColor="#94a3b8"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="px-3"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </Pressable>
              </View>
            </View>

            <View>
              <Text className="text-xs font-medium text-slate-500 mb-1">Confirm Password</Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleResetPassword}
            disabled={loading}
            className={`rounded-xl py-3.5 items-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">Set Password</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.replace('/login')}
            className="py-3 items-center mt-2"
          >
            <Text className="text-slate-400 text-sm">Cancel</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
