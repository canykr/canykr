import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage üzerinde JSON okuma/yazma için ince bir katman.
 * Bozuk veriyi sessizce yok sayar ki uygulama açılışta kilitlenmesin.
 */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const StorageKeys = {
  localPharmacies: 'eczane/local-pharmacies',
  myPharmacyId: 'eczane/my-pharmacy-id',
  favorites: 'eczane/favorites',
  lastCity: 'eczane/last-city',
} as const;
