/**
 * Nöbetçi eczane veri kaynağının yapılandırması.
 *
 * Değerler `EXPO_PUBLIC_*` ortam değişkenlerinden okunur (bkz. `.env.example`).
 *
 * GÜVENLİK NOTU: `EXPO_PUBLIC_` ile başlayan değişkenler JavaScript paketine
 * gömülür; yani uygulamayı indiren herkes API anahtarını okuyabilir. Bu yüzden
 * yayına çıkarken önerilen kurulum, anahtarı kendi sunucunuzda tutan bir vekil
 * (proxy) servis yazıp `provider` olarak `custom` seçmektir.
 */

export type ProviderId = 'demo' | 'collectapi' | 'nosyapi' | 'custom';

export type AppConfig = {
  provider: ProviderId;
  apiKey: string | null;
  /** `custom` sağlayıcı için taban adres, örn. `https://api.ornek.com`. */
  baseUrl: string | null;
  /** Eczane panelinden gelen kayıtların gönderileceği adres. */
  submitUrl: string | null;
  /** Ağ isteklerinin en fazla bekleyeceği süre (ms). */
  requestTimeoutMs: number;
};

/**
 * `EXPO_PUBLIC_*` değişkenleri paketleyici tarafından derleme sırasında
 * metin olarak değiştirilir. Bu yüzden her biri ayrı ayrı, düz yazımla
 * okunmak zorundadır; `process.env[degisken]` biçiminde dinamik erişim
 * çalışma zamanında `undefined` döner.
 */
function clean(value: string | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

const DEFAULT_TIMEOUT_MS = 12_000;

/**
 * Zaman aşımını okur. Sayıya çevrilemeyen bir değer `NaN` üretir ve
 * `setTimeout(..., NaN)` sıfıra yuvarlandığı için her istek daha başlamadan
 * iptal edilirdi; bu yüzden yalnızca geçerli pozitif sayılar kabul edilir.
 */
export function readTimeout(raw: string | undefined): number {
  const parsed = Number(clean(raw));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function resolveProvider(): ProviderId {
  const raw = clean(process.env.EXPO_PUBLIC_PHARMACY_PROVIDER);
  if (raw === 'collectapi' || raw === 'nosyapi' || raw === 'custom' || raw === 'demo') {
    return raw;
  }
  // Anahtar verilmemişse uygulama örnek veriyle açılır, çökmez.
  return 'demo';
}

export const config: AppConfig = {
  provider: resolveProvider(),
  apiKey: clean(process.env.EXPO_PUBLIC_PHARMACY_API_KEY),
  baseUrl: clean(process.env.EXPO_PUBLIC_PHARMACY_API_URL),
  submitUrl: clean(process.env.EXPO_PUBLIC_PHARMACY_SUBMIT_URL),
  requestTimeoutMs: readTimeout(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS),
};

/** Gerçek bir veri kaynağı yapılandırılmış mı? */
export function isLiveDataConfigured(current: AppConfig = config): boolean {
  if (current.provider === 'demo') {
    return false;
  }
  if (current.provider === 'custom') {
    return Boolean(current.baseUrl);
  }
  return Boolean(current.apiKey);
}
