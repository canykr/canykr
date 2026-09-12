import { useCallback, useEffect, useState } from 'react';

import { readJson, StorageKeys, writeJson } from '@/lib/storage';
import type { Pharmacy } from '@/services/types';

export type UseFavoritesResult = {
  favorites: Pharmacy[];
  isFavorite: (id: string) => boolean;
  toggle: (pharmacy: Pharmacy) => Promise<void>;
  isLoading: boolean;
};

/** Kullanıcının kaydettiği eczaneler; cihazda saklanır. */
export function useFavorites(): UseFavoritesResult {
  const [favorites, setFavorites] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await readJson<Pharmacy[]>(StorageKeys.favorites, []);
      if (!cancelled) {
        setFavorites(stored);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((entry) => entry.id === id),
    [favorites]
  );

  const toggle = useCallback(
    async (pharmacy: Pharmacy) => {
      const exists = favorites.some((entry) => entry.id === pharmacy.id);
      const next = exists
        ? favorites.filter((entry) => entry.id !== pharmacy.id)
        : [...favorites, pharmacy];

      setFavorites(next);
      await writeJson(StorageKeys.favorites, next);
    },
    [favorites]
  );

  return { favorites, isFavorite, toggle, isLoading };
}
