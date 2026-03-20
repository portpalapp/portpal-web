import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

type Tab = 'email' | 'no-email';

// Union locals available for identity verification
const UNION_LOCALS = ['500', '502', '505', '508', '514', '517'];

export default function MigrateScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('email');

  // ── Tab 1: "I have access to my email" ──────────────────────────────────
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // ── Tab 2: "I can't access my email" ────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [unionLocal, setUnionLocal] = useState('500');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{
    bubble_id: string;
    masked_email: string;
    first_name: string;
    last_name: string;
  } | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailLoading, setNewEmailLoading] = useState(false);
  const [newEmailSuccess, setNewEmailSuccess] = useState(false);

  // ── Tab 1 handler: migrate with existing email ──────────────────────────
  const handleEmailMigration = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setEmailLoading(true);
    try {
      // Check if this email exists in bubble_users
      const { data: bubbleUser, error: lookupError } = await supabase
        .from('bubble_users')
        .select('bubble_id, email')
        .ilike('email', email.trim())
        .is('supabase_user_id', null)
        .maybeSingle();

      if (lookupError) {
        Alert.alert('Error', 'Unable to look up your account. Please try again.');
        setEmailLoading(false);
        return;
      }

      if (!bubbleUser) {
        Alert.alert(
          'Account not found',
          'No existing PORTPAL account was found with that email. Please check the spelling or use the "I can\'t access my email" option.'
        );
        setEmailLoading(false);
        return;
      }

      // Create Supabase Auth account with a random temp password
      const tempPassword = generateTempPassword();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: tempPassword,
        options: { data: { name: (bubbleUser as any).email } },
      });

      if (signUpError) {
        // If user already exists in Supabase Auth, they can just reset password
        if (signUpError.message?.includes('already registered')) {
          Alert.alert(
            'Account already exists',
            'A Supabase account with this email already exists. Try signing in, or use "Forgot Password" to reset it.'
          );
        } else {
          Alert.alert('Error', signUpError.message);
        }
        setEmailLoading(false);
        return;
      }

      // Link the Bubble user to the new Supabase Auth user
      if (signUpData.user) {
        await (supabase.rpc as any)('link_bubble_user', {
          p_email: email.trim(),
          p_supabase_uid: signUpData.user.id,
        });
      }

      // Send password reset email so user can set their own password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: 'portpal://reset-password' }
      );

      if (resetError) {
        console.warn('[Migrate] Password reset email error:', resetError.message);
      }

      // Sign out the temp session so user must come back through the reset link
      await supabase.auth.signOut();

      setEmailSuccess(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    }
    setEmailLoading(false);
  };

  // ── Tab 2 handler: verify identity ──────────────────────────────────────
  const handleVerifyIdentity = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name');
      return;
    }

    setVerifyLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)('verify_bubble_identity', {
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
        p_union_local: unionLocal,
      });

      if (error) {
        Alert.alert('Error', 'Unable to verify your identity. Please try again.');
        setVerifyLoading(false);
        return;
      }

      if (!data || (data as any).length === 0) {
        Alert.alert(
          'No match found',
          'We could not find a PORTPAL account matching that name and union local. Please double-check your information.'
        );
        setVerifyLoading(false);
        return;
      }

      // If multiple matches, take the first one
      // (in practice, name + union local should be unique enough)
      setMatchedUser(data[0]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    }
    setVerifyLoading(false);
  };

  // ── Tab 2 handler: submit new email ─────────────────────────────────────
  const handleNewEmailSubmit = async () => {
    if (!newEmail.trim()) {
      Alert.alert('Error', 'Please enter your new email address');
      return;
    }
    if (!matchedUser) return;

    setNewEmailLoading(true);
    try {
      // Create Supabase Auth account with the new email
      const tempPassword = generateTempPassword();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail.trim(),
        password: tempPassword,
        options: {
          data: {
            name: `${matchedUser.first_name} ${matchedUser.last_name}`,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          Alert.alert(
            'Email already in use',
            'This email is already registered. Please use a different email or try signing in.'
          );
        } else {
          Alert.alert('Error', signUpError.message);
        }
        setNewEmailLoading(false);
        return;
      }

      // Update the bubble user's email and link to Supabase Auth
      if (signUpData.user) {
        await (supabase.rpc as any)('update_bubble_user_email', {
          p_bubble_id: (matchedUser as any).bubble_id,
          p_new_email: newEmail.trim(),
          p_supabase_uid: signUpData.user.id,
        });
      }

      // Send password reset so user can set their own password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        newEmail.trim(),
        { redirectTo: 'portpal://reset-password' }
      );

      if (resetError) {
        console.warn('[Migrate] Password reset email error:', resetError.message);
      }

      // Sign out the temp session
      await supabase.auth.signOut();

      setNewEmailSuccess(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    }
    setNewEmailLoading(false);
  };

  // ── Success screens ─────────────────────────────────────────────────────
  if (emailSuccess || newEmailSuccess) {
    const displayEmail = emailSuccess ? email.trim() : newEmail.trim();
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 justify-center px-6">
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={40} color="#22c55e" />
            </View>
            <Text className="text-xl font-bold text-slate-800 text-center">
              Check your email
            </Text>
            <Text className="text-slate-500 text-sm text-center mt-2 px-4">
              We sent a password setup link to{'\n'}
              <Text className="font-semibold text-slate-700">{displayEmail}</Text>
            </Text>
          </View>

          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-start gap-2">
              <Ionicons name="information-circle" size={20} color="#2563eb" />
              <View className="flex-1">
                <Text className="text-blue-800 text-sm font-medium">
                  What happens next?
                </Text>
                <Text className="text-blue-700 text-xs mt-1">
                  1. Open the link in your email{'\n'}
                  2. Set a new password{'\n'}
                  3. Come back and sign in with your email and new password
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => router.replace('/login')}
            className="bg-blue-600 rounded-xl py-3.5 items-center"
          >
            <Text className="text-white font-semibold text-base">
              Back to Sign In
            </Text>
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
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center mt-4 mb-6">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center mr-3"
            >
              <Ionicons name="arrow-back" size={20} color="#334155" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-bold text-slate-800">
                Migrate your account
              </Text>
              <Text className="text-slate-500 text-xs mt-0.5">
                Transfer your existing PORTPAL data
              </Text>
            </View>
          </View>

          {/* Tab selector */}
          <View className="flex-row bg-white rounded-xl border border-slate-200 p-1 mb-6">
            <Pressable
              onPress={() => setActiveTab('email')}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                activeTab === 'email' ? 'bg-blue-600' : ''
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  activeTab === 'email' ? 'text-white' : 'text-slate-500'
                }`}
              >
                I have my email
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('no-email')}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                activeTab === 'no-email' ? 'bg-blue-600' : ''
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  activeTab === 'no-email' ? 'text-white' : 'text-slate-500'
                }`}
              >
                Can't access email
              </Text>
            </Pressable>
          </View>

          {/* ── Tab 1: Have email ───────────────────────────────────────── */}
          {activeTab === 'email' && (
            <View>
              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <View className="flex-row items-start gap-2">
                  <Ionicons name="information-circle" size={20} color="#2563eb" />
                  <Text className="flex-1 text-blue-800 text-xs">
                    Enter the email you used with PORTPAL. We'll send you a link
                    to set up your new password.
                  </Text>
                </View>
              </View>

              <View className="gap-3">
                <View>
                  <Text className="text-xs font-medium text-slate-500 mb-1">
                    Email used with PORTPAL
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

                <Pressable
                  onPress={handleEmailMigration}
                  disabled={emailLoading}
                  className="bg-blue-600 rounded-xl py-3.5 items-center mt-2"
                >
                  {emailLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      Migrate my account
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Tab 2: No email access ─────────────────────────────────── */}
          {activeTab === 'no-email' && !matchedUser && (
            <View>
              <View className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
                <View className="flex-row items-start gap-2">
                  <Ionicons name="information-circle" size={20} color="#ea580c" />
                  <Text className="flex-1 text-orange-800 text-xs">
                    We'll verify your identity using your name and union local,
                    then let you set up a new email for your account.
                  </Text>
                </View>
              </View>

              <View className="gap-3">
                <View>
                  <Text className="text-xs font-medium text-slate-500 mb-1">
                    First Name
                  </Text>
                  <TextInput
                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                    placeholder="Mike"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>

                <View>
                  <Text className="text-xs font-medium text-slate-500 mb-1">
                    Last Name
                  </Text>
                  <TextInput
                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                    placeholder="Thompson"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>

                <View>
                  <Text className="text-xs font-medium text-slate-500 mb-1">
                    Union Local
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {UNION_LOCALS.map((local) => (
                      <Pressable
                        key={local}
                        onPress={() => setUnionLocal(local)}
                        className={`px-4 py-2.5 rounded-xl border ${
                          unionLocal === local
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            unionLocal === local ? 'text-white' : 'text-slate-600'
                          }`}
                        >
                          {local}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Pressable
                  onPress={handleVerifyIdentity}
                  disabled={verifyLoading}
                  className="bg-blue-600 rounded-xl py-3.5 items-center mt-2"
                >
                  {verifyLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      Find my account
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Tab 2: Match found → enter new email ───────────────────── */}
          {activeTab === 'no-email' && matchedUser && (
            <View>
              {/* Match confirmation card */}
              <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
                <View className="flex-row items-start gap-2">
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  <View className="flex-1">
                    <Text className="text-green-800 text-sm font-medium">
                      Account found
                    </Text>
                    <Text className="text-green-700 text-xs mt-1">
                      {matchedUser.first_name} {matchedUser.last_name}
                    </Text>
                    <Text className="text-green-600 text-xs mt-0.5">
                      Original email: {matchedUser.masked_email}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <View className="flex-row items-start gap-2">
                  <Ionicons name="mail-outline" size={20} color="#2563eb" />
                  <Text className="flex-1 text-blue-800 text-xs">
                    Enter a new email address for your account. We'll send a
                    password setup link to this email.
                  </Text>
                </View>
              </View>

              <View className="gap-3">
                <View>
                  <Text className="text-xs font-medium text-slate-500 mb-1">
                    New Email Address
                  </Text>
                  <TextInput
                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                    placeholder="newemail@example.com"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                  />
                </View>

                <Pressable
                  onPress={handleNewEmailSubmit}
                  disabled={newEmailLoading}
                  className="bg-blue-600 rounded-xl py-3.5 items-center mt-2"
                >
                  {newEmailLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      Set up new email
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMatchedUser(null);
                    setNewEmail('');
                  }}
                  className="py-2 items-center"
                >
                  <Text className="text-slate-400 text-sm">
                    That's not me, try again
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Generate a random temporary password (never shown to user). */
function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pw = '';
  for (let i = 0; i < 24; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}
