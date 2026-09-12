import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/lib/http';
import { readJson, StorageKeys, writeJson } from '@/lib/storage';
import { TimedCache } from '@/services/cache';
import { loadLocalPharmacies } from '@/services/local-pharmacies';
import { mergePharmacies } from '@/services/pharmacy-repository';
import { resolveProvider } from '@/services/providers';
import type { Pharmacy } from '@/services/types';

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new TimedCache<Pharmacy[]>(CACHE_TTL_MS);

export type PharmaciesStatus = 'loading' | 'ready' | 'error';

export type UsePharmaciesResult = {
  pharmacies: Pharmacy[];
  status: PharmaciesStatus;
  error: string | null;
  /** Gösterilen veri önbellekten gelip gelmediği. */
  fromCache: boolean;
  fetchedAt: string | null;
  isLive: boolean;
  attribution: string;
  reload: () => Promise<void>;
};

/**
 * Seçili il için nöbetçi eczaneleri getirir ve eczanelerin panelden girdiği
 * kayıtlarla birleştirir.
 *
 * Ağ hatasında elde bayat veri varsa onu göstermeye devam eder; kullanıcı
 * acil bir ihtiyaç için uygulamayı açtığında boş ekranla karşılaşmasın.
 */
export function usePharmacies(city: string | null): UsePharmaciesResult {
  const provider = useMemo(() => resolveProvider(), []);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [status, setStatus] = useState<PharmaciesStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (targetCity: string | null, { useCache }: { useCache: boolean }) => {
      if (!targetCity) {
        setStatus('ready');
        setPharmacies([]);
        return;
      }

      const id = ++requestId.current;
      setStatus('loading');
      setError(null);

      const cached = useCache ? cache.get(targetCity) : null;
      if (cached) {
        setPharmacies(cached.value);
        setFromCache(true);
        if (!cached.isStale) {
          setStatus('ready');
          return;
        }
      }

      try {
        const [fromApi, fromPanel] = await Promise.all([
          provider.fetchOnDuty({ city: targetCity }),
          loadLocalPharmacies(),
        ]);

        // Kullanıcı bu sırada başka bir il seçtiyse eski yanıtı yok say.
        if (id !== requestId.current) {
          return;
        }

        const panelForCity = fromPanel.filter(
          (pharmacy) => pharmacy.city.localeCompare(targetCity, 'tr-TR', { sensitivity: 'base' }) === 0
        );
        const merged = mergePharmacies(fromApi, panelForCity);

        cache.set(targetCity, merged);
        setPharmacies(merged);
        setFromCache(false);
        setFetchedAt(new Date().toISOString());
        setStatus('ready');
      } catch (caught) {
        if (id !== requestId.current) {
          return;
        }
        const message =
          caught instanceof ApiError ? caught.message : 'Nöbetçi eczaneler alınamadı.';
        setError(message);
        // Bayat veri varsa göstermeye devam et, yalnızca uyarıyı ekle.
        setStatus(cached ? 'ready' : 'error');
      }
    },
    [provider]
  );

  useEffect(() => {
    // Veri getirme işi bilerek bağlanma anında başlatılıyor; sonuç geldiğinde durum güncellenir.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(city, { useCache: true });
    if (city) {
      void writeJson(StorageKeys.lastCity, city);
    }
  }, [city, load]);

  const reload = useCallback(async () => {
    await load(city, { useCache: false });
  }, [city, load]);

  return {
    pharmacies,
    status,
    error,
    fromCache,
    fetchedAt,
    isLive: provider.isLive,
    attribution: provider.attribution,
    reload,
  };
}

/** Uygulama açıldığında en son seçilen ili hatırlar. */
export async function loadLastCity(): Promise<string | null> {
  return readJson<string | null>(StorageKeys.lastCity, null);
}
