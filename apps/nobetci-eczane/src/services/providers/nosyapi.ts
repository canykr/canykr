import { ApiError, fetchJsonWithTimeout, messageForStatus } from '@/lib/http';
import { pickCoordinate, toPharmacy } from '@/services/providers/normalize';
import type { PharmacyProvider } from '@/services/providers/types';
import type { AppConfig } from '@/services/config';
import type { Pharmacy, PharmacyQuery } from '@/services/types';

const ENDPOINT = 'https://www.nosyapi.com/apiv2/service/pharmacies-on-duty';

/**
 * NosyAPI yanıt gövdesi `{ "status": "success", "data": [...] }` biçimindedir.
 * Alan adları sağlayıcı sürümüne göre `pharmacyName`/`name`,
 * `latitude`/`lat` gibi değişebildiği için okuma esnek tutuldu.
 */
type NosyApiResponse = {
  status?: string;
  message?: string;
  data?: Record<string, unknown>[];
};

function firstString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return '';
}

export function createNosyApiProvider(config: AppConfig): PharmacyProvider {
  return {
    id: 'nosyapi',
    label: 'NosyAPI',
    isLive: true,
    attribution: 'Veri kaynağı: NosyAPI Nöbetçi Eczane servisi',

    async fetchOnDuty(query: PharmacyQuery): Promise<Pharmacy[]> {
      if (!config.apiKey) {
        throw new ApiError('NosyAPI anahtarı tanımlı değil.');
      }
      if (!query.city) {
        throw new ApiError('Nöbetçi eczane sorgusu için il gerekli.');
      }

      const params = new URLSearchParams({ city: query.city });
      if (query.district) {
        params.set('district', query.district);
      }

      const response = await fetchJsonWithTimeout<NosyApiResponse>(
        `${ENDPOINT}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            accept: 'application/json',
          },
          timeoutMs: config.requestTimeoutMs,
        }
      );

      if (!response.ok) {
        throw new ApiError(messageForStatus(response.status), response.status);
      }

      const body = response.data;
      if (!body || !Array.isArray(body.data)) {
        throw new ApiError(body?.message ?? 'Veri sağlayıcısı beklenmeyen bir yanıt döndürdü.');
      }

      return body.data
        .map((row) => ({ row, name: firstString(row, ['pharmacyName', 'name', 'eczaneAdi']) }))
        .filter((entry) => entry.name.length > 0)
        .map(({ row, name }) =>
          toPharmacy(
            {
              name,
              address: firstString(row, ['address', 'adres']),
              phone: firstString(row, ['phone', 'phoneNumber', 'telefon']),
              city: firstString(row, ['city', 'il']) || (query.city ?? ''),
              district: firstString(row, ['district', 'town', 'ilce']) || (query.district ?? ''),
              coordinate: pickCoordinate(row),
              notes: firstString(row, ['directions', 'tarif']) || undefined,
            },
            { providerId: 'nosyapi' }
          )
        );
    },
  };
}
