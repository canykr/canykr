import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { Coordinate } from '@/services/types';

/**
 * Konum sabitlemesi bu süreyi aşarsa vazgeçilir.
 *
 * `getCurrentPositionAsync` kapalı alanda dakikalarca bekleyebiliyor; sınır
 * koymazsak açılış ekranı süresiz "yükleniyor" durumunda kalır.
 */
const LOCATION_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

export type UseLocationResult = {
  coordinate: Coordinate | null;
  status: LocationStatus;
  /** Konumdan çözülen il adı (varsa). */
  cityName: string | null;
  error: string | null;
  request: () => Promise<void>;
};

/**
 * Kullanıcının konumunu ister ve bulunduğu ili çözer.
 *
 * Konum reddedilse bile uygulama çalışmaya devam eder: kullanıcı ili elle
 * seçebilir. Bu yüzden hata durumları ekranı kilitlemez.
 */
export function useLocation(): UseLocationResult {
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  // Kanca kurulur kurulmaz konum istendiği için başlangıç durumu 'loading'.
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  /**
   * Konumu getirir. İlk ifadesi `await` olduğu için efekt gövdesi içinden
   * çağrıldığında ardışık yeniden çizime yol açmaz.
   */
  const run = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus('denied');
        setError('Konum izni verilmedi. İli elle seçebilirsiniz.');
        return;
      }

      // Önce son bilinen konumu kullanarak ekranı hızlıca dolduruyoruz.
      const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
      if (lastKnown) {
        setCoordinate({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        });
      }

      const current = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.Balanced }),
        LOCATION_TIMEOUT_MS
      );

      if (!current) {
        // Süre doldu: elde son bilinen konum varsa onunla devam et.
        if (lastKnown) {
          setStatus('granted');
        } else {
          setStatus('error');
          setError('Konum zamanında alınamadı. İli elle seçebilirsiniz.');
        }
        return;
      }

      const next = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setCoordinate(next);
      setStatus('granted');

      try {
        const [place] = await Location.reverseGeocodeAsync(next);
        // Türkiye'de il bilgisi cihaza göre `region` ya da `city` alanında gelir.
        setCityName(place?.region ?? place?.city ?? null);
      } catch {
        // Ters coğrafi kodlama başarısızsa il elle seçilir; bu bir hata değil.
        setCityName(null);
      }
    } catch {
      setStatus('error');
      setError('Konum alınamadı. İli elle seçebilirsiniz.');
    }
  }, []);

  /** Kullanıcı etkileşimiyle yeniden denemek için. */
  const request = useCallback(async () => {
    setStatus('loading');
    setError(null);
    await run();
  }, [run]);

  useEffect(() => {
    // Veri getirme işi bilerek bağlanma anında başlatılıyor; sonuç geldiğinde durum güncellenir.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
  }, [run]);

  return { coordinate, status, cityName, error, request };
}
