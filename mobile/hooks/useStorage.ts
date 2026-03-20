import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook that wraps AsyncStorage with a useState-like API.
 * Drop-in replacement for localStorage patterns from the web app.
 */
export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then((stored) => {
      if (stored !== null) {
        try {
          setValue(JSON.parse(stored));
        } catch {
          setValue(stored as unknown as T);
        }
      }
      setLoaded(true);
    });
  }, [key]);

  const setAndStore = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(prev)
            : newValue;
        AsyncStorage.setItem(key, JSON.stringify(resolved));
        return resolved;
      });
    },
    [key]
  );

  return [value, setAndStore, loaded] as const;
}
