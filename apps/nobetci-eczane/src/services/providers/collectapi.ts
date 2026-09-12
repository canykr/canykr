import { ApiError, fetchWithTimeout, messageForStatus } from '@/lib/http';
import { pickCoordinate, toPharmacy } from '@/services/providers/normalize';
import type { PharmacyProvider } from '@/services/providers/types';
import type { AppConfig } from '@/services/config';
import type { Pharmacy, PharmacyQuery } from '@/services/types';

const ENDPOINT = 'https://api.collectapi.com/health/dutyPharmacy';

/**
 * CollectAPI yanıt gövdesi:
 * `{ "success": true, "result": [{ "name", "dist", "address", "phone", "loc" }] }`
 * `loc` alanı `"41.0082,28.9784"` biçiminde tek metindir.
 */
type CollectApiResponse = {
  success?: boolean;
  result?: Record<string, unknown>[];
};

export function createCollectApiProvider(config: AppConfig): PharmacyProvider {
  return {
    id: 'collectapi',
    label: 'CollectAPI',
    isLive: true,
    attribution: 'Veri kaynağı: CollectAPI Nöbetçi Eczane servisi',

    async fetchOnDuty(query: PharmacyQuery): Promise<Pharmacy[]> {
      if (!config.apiKey) {
        throw new ApiError('CollectAPI anahtarı tanımlı değil.');
      }
      if (!query.city) {
        throw new ApiError('Nöbetçi eczane sorgusu için il gerekli.');
      }

      const params = new URLSearchParams({ il: query.city });
      if (query.district) {
        params.set('ilce', query.district);
      }

      const response = await fetchWithTimeout(`${ENDPOINT}?${params.toString()}`, {
        method: 'GET',
        headers: {
          authorization: `apikey ${config.apiKey}`,
          'content-type': 'application/json',
        },
        timeoutMs: config.requestTimeoutMs,
      });

      if (!response.ok) {
        throw new ApiError(messageForStatus(response.status), response.status);
      }

      const body = (await response.json()) as CollectApiResponse;
      if (body.success === false || !Array.isArray(body.result)) {
        throw new ApiError('Veri sağlayıcısı beklenmeyen bir yanıt döndürdü.');
      }

      return body.result
        .filter((row) => typeof row.name === 'string' && row.name.trim().length > 0)
        .map((row) =>
          toPharmacy(
            {
              name: String(row.name),
              address: String(row.address ?? ''),
              phone: String(row.phone ?? ''),
              city: query.city ?? '',
              district: String(row.dist ?? query.district ?? ''),
              coordinate: pickCoordinate(row),
            },
            { providerId: 'collectapi' }
          )
        );
    },
  };
}
