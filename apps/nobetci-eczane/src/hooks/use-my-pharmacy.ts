import { useCallback, useEffect, useState } from 'react';

import {
  deleteLocalPharmacy,
  getMyPharmacyId,
  loadLocalPharmacies,
  publishPharmacy,
  saveLocalPharmacy,
  setMyPharmacyId,
} from '@/services/local-pharmacies';
import type { Pharmacy, PharmacyDraft } from '@/services/types';

export type SaveOutcome = {
  pharmacy: Pharmacy;
  /** Kayıt merkezî sunucuya da gönderilebildi mi? */
  published: boolean;
  /** Sunucuya gönderim başarısızsa kullanıcıya gösterilecek not. */
  publishError: string | null;
};

export type UseMyPharmacyResult = {
  pharmacy: Pharmacy | null;
  isLoading: boolean;
  save: (draft: PharmacyDraft) => Promise<SaveOutcome>;
  remove: () => Promise<void>;
};

/**
 * Eczane panelinin durumu: bu cihazda kayıtlı eczane bilgisi.
 */
export function useMyPharmacy(): UseMyPharmacyResult {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [id, all] = await Promise.all([getMyPharmacyId(), loadLocalPharmacies()]);
    setPharmacy(all.find((entry) => entry.id === id) ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Veri getirme işi bilerek bağlanma anında başlatılıyor; sonuç geldiğinde durum güncellenir.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const save = useCallback(async (draft: PharmacyDraft): Promise<SaveOutcome> => {
    const saved = await saveLocalPharmacy(draft);
    await setMyPharmacyId(saved.id);
    setPharmacy(saved);

    try {
      const published = await publishPharmacy(saved);
      return { pharmacy: saved, published, publishError: null };
    } catch (error) {
      return {
        pharmacy: saved,
        published: false,
        publishError:
          error instanceof Error ? error.message : 'Kayıt sunucuya gönderilemedi.',
      };
    }
  }, []);

  const remove = useCallback(async () => {
    if (!pharmacy) {
      return;
    }
    await deleteLocalPharmacy(pharmacy.id);
    await setMyPharmacyId(null);
    setPharmacy(null);
  }, [pharmacy]);

  return { pharmacy, isLoading, save, remove };
}
