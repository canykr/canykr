import type { Pharmacy, PharmacyQuery } from '@/services/types';

export type PharmacyProvider = {
  id: string;
  /** Kullanıcıya gösterilecek ad. */
  label: string;
  /** Sağlayıcı gerçek veri döndürüyor mu (demo değil)? */
  isLive: boolean;
  /** Verinin kaynağını arayüzde belirtmek için. */
  attribution: string;
  fetchOnDuty(query: PharmacyQuery): Promise<Pharmacy[]>;
};
