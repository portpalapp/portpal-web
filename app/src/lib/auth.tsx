import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { AuthContext } from './AuthContext';
import type { Session } from '@supabase/supabase-js';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const enterDemoMode = () => setDemoMode(true);

  useEffect(() => {
    // Get initial session with retry on network errors
    const getSessionWithRetry = async (attempts = 0) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (attempts < 2) {
            await new Promise(r => setTimeout(r, 1000 * (attempts + 1)));
            return getSessionWithRetry(attempts + 1);
          }
          console.warn('[Auth] getSession error:', error.message);
          setAuthError(error.message);
        }
        setSession(session);
      } catch (err: unknown) {
        if (attempts < 2) {
          await new Promise(r => setTimeout(r, 1000 * (attempts + 1)));
          return getSessionWithRetry(attempts + 1);
        }
        console.warn('[Auth] getSession failed:', err);
        setAuthError(err instanceof Error ? err.message : 'Failed to connect to auth service');
        setSession(null);
      }
      setLoading(false);
    };
    getSessionWithRetry();

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      subscription = data.subscription;
    } catch (err) {
      console.warn('[Auth] onAuthStateChange failed:', err);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] signOut failed:', err);
    }
    setSession(null);
    setDemoMode(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        authError,
        demoMode,
        enterDemoMode,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook is in ./useAuth.ts to satisfy react-refresh/only-export-components
