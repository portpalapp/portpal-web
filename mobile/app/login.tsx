import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp, authError, enterDemoMode } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (mode === 'signup' && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    const { error } =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, name);

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else if (mode === 'signup') {
      Alert.alert('Success', 'Check your email to confirm your account');
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Type your email address above, then tap Forgot Password again.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'portpal://reset-password',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your email', `We sent a password reset link to ${email.trim()}`);
    }
  };

  // Allow skipping login to explore the app (demo mode)
  const handleSkipLogin = () => {
    enterDemoMode();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-1 justify-center px-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="items-center mb-8">
            <Image
              source={require('../assets/logo-full.jpg')}
              style={{ width: 180, height: 180, borderRadius: 24 }}
              resizeMode="cover"
            />
            <Text className="text-slate-500 text-sm mt-1">
              Shift tracking for longshoremen
            </Text>
          </View>

          {/* Auth error banner */}
          {authError && (
            <View className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex-row items-start gap-2">
              <Ionicons name="warning-outline" size={18} color="#ea580c" />
              <View className="flex-1">
                <Text className="text-orange-800 text-xs font-medium">
                  Connection issue
                </Text>
                <Text className="text-orange-700 text-xs mt-0.5">
                  Having trouble connecting to the server. You can still explore the app.
                </Text>
              </View>
            </View>
          )}

          {/* Form */}
          <View className="gap-3">
            {mode === 'signup' && (
              <View>
                <Text className="text-xs font-medium text-slate-500 mb-1">
                  Full Name
                </Text>
                <TextInput
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                  placeholder="Mike Thompson"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View>
              <Text className="text-xs font-medium text-slate-500 mb-1">
                Email
              </Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                placeholder="you@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            <View>
              <Text className="text-xs font-medium text-slate-500 mb-1">
                Password
              </Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
              />
            </View>

            {mode === 'login' && (
              <Pressable onPress={handleForgotPassword} className="self-end">
                <Text className="text-blue-500 text-xs font-medium">Forgot Password?</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-3.5 items-center mt-2"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Toggle mode */}
          <View className="flex-row justify-center mt-6 gap-1">
            <Text className="text-slate-500 text-sm">
              {mode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </Text>
            <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              <Text className="text-blue-600 font-medium text-sm">
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Pressable>
          </View>

          {/* Migrate existing account */}
          <Pressable
            onPress={() => router.push('/migrate')}
            className="mt-4 py-3 items-center flex-row justify-center gap-1.5"
          >
            <Ionicons name="swap-horizontal-outline" size={16} color="#2563eb" />
            <Text className="text-blue-600 text-sm font-medium">
              Existing PORTPAL user? Migrate your account
            </Text>
          </Pressable>

          {/* Skip / Explore button */}
          <Pressable
            onPress={handleSkipLogin}
            className="mt-2 py-3 items-center"
          >
            <Text className="text-slate-400 text-sm">
              Explore without signing in
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
