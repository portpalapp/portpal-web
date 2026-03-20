import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Supabase schema note:
// When ready to sync favorite terminals to the database, run:
//   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_terminals text[] DEFAULT '{}';
// Until then, favorites are stored locally via AsyncStorage.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'portpal_favorite_terminals';

export function useFavoriteTerminals() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setFavorites(JSON.parse(val));
        } catch {
          // corrupted data – reset
          setFavorites([]);
        }
      }
      setLoaded(true);
    });
  }, []);

  const setFavoriteTerminals = useCallback(async (terminals: string[]) => {
    setFavorites(terminals);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(terminals));
  }, []);

  const addFavorite = useCallback(async (terminal: string) => {
    const updated = [...new Set([...favorites, terminal])];
    setFavorites(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [favorites]);

  const removeFavorite = useCallback(async (terminal: string) => {
    const updated = favorites.filter((t) => t !== terminal);
    setFavorites(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [favorites]);

  const toggleFavorite = useCallback(async (terminal: string) => {
    if (favorites.includes(terminal)) {
      await removeFavorite(terminal);
    } else {
      await addFavorite(terminal);
    }
  }, [favorites, addFavorite, removeFavorite]);

  return { favorites, loaded, setFavoriteTerminals, addFavorite, removeFavorite, toggleFavorite };
}
