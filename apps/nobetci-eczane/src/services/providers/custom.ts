import { ApiError, fetchJsonWithTimeout, messageForStatus } from '@/lib/http';
import { pickCoordinate, toPharmacy } from '@/services/providers/normalize';
import type { PharmacyProvider } from '@/services/providers/types';
import type { AppConfig } from '@/services/config';
import type { Pharmacy, PharmacyQuery } from '@/services/types';

/**
 * Yanıttan kayıt dizisini çıkarır. Düz dizi ya da `{ data: [...] }` kabul
 * edilir; JSON `null` gövdesi de dahil diğer her şey geçersizdir.
 */
export function extractRows(body: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(body)) {
    return body as Record<string, unknown>[];
  }
  if (body !== null && typeof body === 'object') {
    const data = (body as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data as Record<string, unknown>[];
    }
  }
  return null;
}

/**
 * Kendi sunucunuz (ya da bir API'yi anahtarınızla saran vekil servis) için
 * sağlayıcı. Yayına çıkarken önerilen kurulum budur: API anahtarı sunucuda
 * kalır, uygulama paketine gömülmez.
 *
 * Beklenen sözleşme:
 *   GET {baseUrl}/nobetci?il=Ankara&ilce=Çankaya
 *   200 -> { "data": [ { "name", "address", "phone", "city", "district",
 *                        "latitude", "longitude", "startTime?", "endTime?" } ] }
 *
 * `data` yerine düz dizi döndüren sunucular da desteklenir.
 */
export function createCustomProvider(config: AppConfig): PharmacyProvider {
  return {
    id: 'custom',
    label: 'Kendi sunucunuz',
    isLive: true,
    attribution: 'Veri kaynağı: kendi nöbetçi eczane servisiniz',

    async fetchOnDuty(query: PharmacyQuery): Promise<Pharmacy[]> {
      if (!config.baseUrl) {
        throw new ApiError('Sunucu adresi (EXPO_PUBLIC_PHARMACY_API_URL) tanımlı değil.');
      }

      const params = new URLSearchParams();
      if (query.city) {
        params.set('il', query.city);
      }
      if (query.district) {
        params.set('ilce', query.district);
      }

      const url = `${config.baseUrl.replace(/\/$/, '')}/nobetci?${params.toString()}`;
      const response = await fetchJsonWithTimeout<unknown>(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
        },
        timeoutMs: config.requestTimeoutMs,
      });

      if (!response.ok) {
        throw new ApiError(messageForStatus(response.status), response.status);
      }

      const rows = extractRows(response.data);
      if (!rows) {
        throw new ApiError('Sunucu beklenmeyen bir yanıt döndürdü.');
      }

      return rows
        .filter((row): row is Record<string, unknown> => typeof row?.name === 'string')
        .map((row) =>
          toPharmacy(
            {
              name: String(row.name),
              address: String(row.address ?? ''),
              phone: String(row.phone ?? ''),
              city: String(row.city ?? query.city ?? ''),
              district: String(row.district ?? query.district ?? ''),
              coordinate: pickCoordinate(row),
              pharmacistName: row.pharmacistName ? String(row.pharmacistName) : undefined,
              notes: row.notes ? String(row.notes) : undefined,
              startTime: typeof row.startTime === 'string' ? row.startTime : undefined,
              endTime: typeof row.endTime === 'string' ? row.endTime : undefined,
            },
            { providerId: 'custom' }
          )
        );
    },
  };
}
