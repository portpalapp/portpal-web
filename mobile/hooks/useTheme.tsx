import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'portpal_dark_mode';

interface ThemeContext {
  isDark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContext>({
  isDark: false,
  toggleDark: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored !== null) {
          setIsDark(stored === 'true');
        }
        setLoaded(true);
      })
      .catch((err) => {
        console.warn('[useTheme] Failed to load preference:', err);
        setLoaded(true);
      });
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
        console.warn('[useTheme] Failed to save preference:', err)
      );
      return next;
    });
  };

  // Don't render children until preference is loaded to prevent flash
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
