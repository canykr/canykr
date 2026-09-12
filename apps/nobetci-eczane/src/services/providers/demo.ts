import { buildDemoPharmacies } from '@/data/demo-pharmacies';
import { searchKey } from '@/lib/format';
import type { PharmacyProvider } from '@/services/providers/types';
import type { Pharmacy, PharmacyQuery } from '@/services/types';

/**
 * API anahtarı tanımlı değilken kullanılan örnek veri kaynağı.
 * Arayüz bu moddayken kullanıcıya büyük bir "DEMO VERİ" uyarısı gösterir;
 * sağlık verisi olduğu için gerçek sanılmamalı.
 */
export function createDemoProvider(): PharmacyProvider {
  return {
    id: 'demo',
    label: 'Örnek veri',
    isLive: false,
    attribution: 'Bu kayıtlar gerçek değildir, yalnızca uygulamayı denemek içindir.',

    async fetchOnDuty(query: PharmacyQuery): Promise<Pharmacy[]> {
      // Gerçek bir ağ isteğinin gecikmesini taklit ederek yükleme durumlarının
      // arayüzde doğru göründüğünü görebilelim.
      await new Promise((resolve) => setTimeout(resolve, 250));

      return buildDemoPharmacies().filter((pharmacy) => {
        if (query.city && searchKey(pharmacy.city) !== searchKey(query.city)) {
          return false;
        }
        if (query.district && searchKey(pharmacy.district) !== searchKey(query.district)) {
          return false;
        }
        return true;
      });
    },
  };
}
