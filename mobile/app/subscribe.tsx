import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface FreeFeature {
  name: string;
  included: boolean | 'partial';
  value?: string;
}

interface ProFeature {
  icon: IoniconsName;
  name: string;
  desc: string;
}

export default function SubscribeScreen() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    'yearly'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setIsPro] = useStorage<string>('isPro', 'false');
  const [, setProSince] = useStorage<string>('proSince', '');

  const monthlyPrice = 10;
  const yearlyPrice = 99;
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2);
  const savings = monthlyPrice * 12 - yearlyPrice;

  const freeFeatures: FreeFeature[] = [
    { name: 'Shift logging', included: true },
    { name: 'Automatic rate calculation', included: true },
    { name: 'Weekly summary', included: true },
    { name: 'Basic pension tracking', included: true },
    { name: 'AI questions', value: '1/week', included: 'partial' },
    { name: 'Job predictions', value: '1/week', included: 'partial' },
    { name: 'Callback feature', included: false },
    { name: 'Custom templates', included: false },
    { name: 'Pay stub upload', included: false },
    { name: 'Discrepancy alerts', included: false },
    { name: 'Advanced analytics', included: false },
  ];

  const proFeatures: ProFeature[] = [
    { icon: 'bulb', name: 'Unlimited AI', desc: 'Ask anything, anytime' },
    {
      icon: 'document-text-outline',
      name: 'Pay Stub Check',
      desc: 'Upload & auto-reconcile',
    },
    { icon: 'refresh', name: 'Callback', desc: 'Repeat yesterday in 1 tap' },
    {
      icon: 'star-outline',
      name: 'Templates',
      desc: 'Save your common shifts',
    },
    {
      icon: 'flash-outline',
      name: 'Daily Predictions',
      desc: 'Know before dispatch',
    },
    {
      icon: 'trending-up',
      name: 'Full Analytics',
      desc: 'Trends & comparisons',
    },
    {
      icon: 'shield-checkmark-outline',
      name: 'Discrepancy Alerts',
      desc: 'Catch every shortage',
    },
  ];

  const handleSubscribe = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsPro('true');
      setProSince(new Date().toISOString());
      router.replace('/');
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="close" size={24} color="#94a3b8" />
          </Pressable>
          <View className="flex-row items-center gap-2">
            <Ionicons name="trophy" size={20} color="#fbbf24" />
            <Text className="font-semibold text-white">PORTPAL Pro</Text>
          </View>
          <View className="w-8" />
        </View>

        {/* Hero */}
        <View className="px-6 pt-4 pb-8 items-center">
          <View className="flex-row items-center gap-2 bg-amber-500/20 px-3 py-1 rounded-full mb-4">
            <Ionicons name="sparkles" size={12} color="#fbbf24" />
            <Text className="text-xs font-medium text-amber-400">
              Founding Member Pricing
            </Text>
          </View>
          <Text className="text-3xl font-bold text-white mb-2">
            Unlock Full Power
          </Text>
          <Text className="text-slate-400">
            Never leave money on the table again
          </Text>
        </View>

        {/* Billing Toggle */}
        <View className="px-6 mb-6">
          <View className="bg-slate-800 rounded-xl p-1 flex-row">
            <Pressable
              onPress={() => setBillingCycle('monthly')}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                billingCycle === 'monthly' ? 'bg-white' : ''
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  billingCycle === 'monthly'
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}
              >
                Monthly
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setBillingCycle('yearly')}
              className={`flex-1 py-2.5 rounded-lg items-center flex-row justify-center gap-1 ${
                billingCycle === 'yearly' ? 'bg-white' : ''
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  billingCycle === 'yearly'
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}
              >
                Yearly
              </Text>
              <Text className="text-xs text-green-500">Save ${savings}</Text>
            </Pressable>
          </View>
        </View>

        {/* Price Card */}
        <View className="px-6 mb-6">
          <View className="bg-blue-600 rounded-2xl p-6 overflow-hidden">
            {/* Decorative circle */}
            <View
              className="absolute w-32 h-32 bg-white/10 rounded-full"
              style={{ top: -16, right: -16 }}
            />

            <View className="flex-row items-baseline gap-1 mb-1">
              <Text className="text-4xl font-bold text-white">
                ${billingCycle === 'yearly' ? yearlyPrice : monthlyPrice}
              </Text>
              <Text className="text-blue-200">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </Text>
            </View>

            {billingCycle === 'yearly' && (
              <Text className="text-blue-200 text-sm mb-4">
                Just ${yearlyMonthly}/month, billed annually
              </Text>
            )}

            <View className="gap-2 mb-6">
              {proFeatures.slice(0, 4).map((f) => (
                <View key={f.name} className="flex-row items-center gap-2">
                  <Ionicons name="checkmark" size={16} color="#4ade80" />
                  <Text className="text-sm text-white">{f.name}</Text>
                </View>
              ))}
              <View className="flex-row items-center gap-2 ml-6">
                <Text className="text-sm text-blue-200">
                  + {proFeatures.length - 4} more features
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleSubscribe}
              disabled={isProcessing}
              className={`w-full py-3.5 bg-white rounded-xl flex-row items-center justify-center gap-2 ${
                isProcessing ? 'opacity-70' : ''
              }`}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text className="font-semibold text-blue-600">
                    Processing...
                  </Text>
                </>
              ) : (
                <>
                  <Text className="font-semibold text-blue-600">
                    Start 30-Day Free Trial
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#2563eb" />
                </>
              )}
            </Pressable>

            <Text className="text-center text-blue-200 text-xs mt-3">
              No credit card required to start
            </Text>
          </View>
        </View>

        {/* Pro Features Grid */}
        <View className="px-6 mb-6">
          <Text className="font-semibold text-lg text-white mb-3">
            Everything in Pro
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {proFeatures.map((f) => (
              <View
                key={f.name}
                className="bg-slate-800/50 rounded-xl p-3 border border-slate-700"
                style={{ width: '47%' }}
              >
                <Ionicons
                  name={f.icon}
                  size={20}
                  color="#60a5fa"
                  style={{ marginBottom: 8 }}
                />
                <Text className="font-medium text-sm text-white">
                  {f.name}
                </Text>
                <Text className="text-xs text-slate-400">{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Comparison Table */}
        <View className="px-6 mb-6">
          <Text className="font-semibold text-lg text-white mb-3">
            Free vs Pro
          </Text>
          <View className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
            {/* Table Header */}
            <View className="flex-row p-3 border-b border-slate-700">
              <Text className="flex-1 text-sm text-slate-400">Feature</Text>
              <Text className="w-16 text-center text-sm text-slate-400">
                Free
              </Text>
              <Text className="w-16 text-center text-sm text-amber-400">
                Pro
              </Text>
            </View>
            {/* Table Rows */}
            {freeFeatures.map((f, index) => (
              <View
                key={f.name}
                className={`flex-row items-center p-3 ${
                  index < freeFeatures.length - 1
                    ? 'border-b border-slate-700/50'
                    : ''
                }`}
              >
                <Text className="flex-1 text-sm text-slate-300">{f.name}</Text>
                <View className="w-16 items-center">
                  {f.included === true ? (
                    <Ionicons name="checkmark" size={16} color="#4ade80" />
                  ) : f.included === 'partial' ? (
                    <Text className="text-xs text-slate-400">{f.value}</Text>
                  ) : (
                    <Ionicons name="close" size={16} color="#475569" />
                  )}
                </View>
                <View className="w-16 items-center">
                  <Ionicons name="checkmark" size={16} color="#4ade80" />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Value Prop */}
        <View className="px-6 mb-6">
          <View className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <Text className="text-green-400 font-medium text-sm mb-1">
              Pay for itself instantly
            </Text>
            <Text className="text-slate-300 text-sm">
              One caught pay discrepancy pays for an entire year of Pro. Most
              users find one in their first month.
            </Text>
          </View>
        </View>

        {/* Social Proof */}
        <View className="px-6 mb-8">
          <View className="items-center">
            <Text className="text-slate-400 text-sm mb-2">
              Join your brothers & sisters
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-800"
                    style={{ marginLeft: i === 1 ? 0 : -8 }}
                  />
                ))}
              </View>
              <Text className="text-slate-300 text-sm">
                <Text className="font-semibold">347</Text> longshoremen
                tracking
              </Text>
            </View>
          </View>
        </View>

        {/* Continue Free */}
        <View className="px-6">
          <Pressable
            onPress={() => router.replace('/')}
            className="w-full py-3 items-center"
          >
            <Text className="text-slate-400 text-sm">Continue with Free</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
