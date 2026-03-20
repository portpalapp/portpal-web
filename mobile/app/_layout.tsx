import "../global.css";
import React, { useEffect, useState, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../lib/auth";
import { ThemeProvider } from "../hooks/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import {
  View,
  ActivityIndicator,
  Text,
  ScrollView,
  Pressable,
} from "react-native";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
  },
});

// ---------------------------------------------------------------------------
// Error Boundary – catches any runtime crash and shows a recovery screen
// instead of the generic Expo "Something went wrong" error.
// ---------------------------------------------------------------------------
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f8fafc",
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: 12,
            }}
          >
            PORTPAL
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#ef4444",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Something went wrong
          </Text>
          <ScrollView
            style={{
              maxHeight: 120,
              marginBottom: 16,
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#64748b",
                textAlign: "center",
              }}
            >
              {this.state.error?.message || "Unknown error"}
            </Text>
          </ScrollView>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: "#2563eb",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Root Navigation – handles auth redirect logic
// ---------------------------------------------------------------------------
function RootLayoutNav() {
  const { session, loading, authError, demoMode } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const deepLinkHandled = useRef(false);

  // Handle deep links — intercept portpal://reset-password#access_token=...
  useEffect(() => {
    if (deepLinkHandled.current) return;

    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      // Check if this is a password reset deep link
      if (url.includes("reset-password") && url.includes("access_token")) {
        deepLinkHandled.current = true;
        const hashFragment = url.split("#")[1];
        if (hashFragment) {
          const hashParams = new URLSearchParams(hashFragment);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            setIsPasswordRecovery(true);
            router.replace("/reset-password");
            return;
          }
        }
      }
    };

    // Check initial URL (app opened via deep link)
    Linking.getInitialURL().then(handleDeepLink);

    // Listen for deep links while app is open
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, [router]);

  // Check if the user has completed onboarding.
  // Re-check when segments change so navigating away from /onboarding picks up
  // the freshly-written AsyncStorage flag.  Setting onboardingChecked=false first
  // blocks the redirect effect until the async read finishes (avoids race).
  useEffect(() => {
    if (loading) return;
    if (!session) {
      setOnboardingChecked(true);
      setNeedsOnboarding(false);
      return;
    }
    setOnboardingChecked(false);
    AsyncStorage.getItem("portpal_onboarding_completed")
      .then((value) => {
        setNeedsOnboarding(value !== "true");
        setOnboardingChecked(true);
      })
      .catch(() => {
        setNeedsOnboarding(true);
        setOnboardingChecked(true);
      });
  }, [session, loading, segments[0]]);

  useEffect(() => {
    if (loading || !onboardingChecked) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "migrate";
    const inOnboarding = segments[0] === "onboarding";
    const inResetPassword = segments[0] === "reset-password";

    // Never redirect away from the reset-password screen
    if (inResetPassword || isPasswordRecovery) return;

    // If there was an auth error (Supabase unreachable), skip auth redirect
    if (authError) {
      console.warn("[Layout] Auth error, skipping redirect:", authError);
      return;
    }

    // Demo mode: let user explore without auth
    if (demoMode) {
      if (inAuthGroup) {
        router.replace("/");
      }
      return;
    }

    if (!session && !inAuthGroup) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      // User just logged in — check if onboarding is needed
      if (needsOnboarding) {
        router.replace("/onboarding");
      } else {
        router.replace("/");
      }
    } else if (session && needsOnboarding && !inOnboarding && !inAuthGroup) {
      // User is authenticated but hasn't onboarded yet and isn't on the onboarding screen
      router.replace("/onboarding");
    }
  }, [session, loading, segments, authError, demoMode, onboardingChecked, needsOnboarding, isPasswordRecovery]);

  // Show a brief loading screen while auth initializes
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="migrate" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="subscribe"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="contract"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="template-builder"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="pension"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="pay-stubs"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="profile"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="holidays"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="vessels"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </>
  );
}

// ---------------------------------------------------------------------------
// Root Layout – wraps everything in error boundary + providers
// ---------------------------------------------------------------------------
export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SafeAreaProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
