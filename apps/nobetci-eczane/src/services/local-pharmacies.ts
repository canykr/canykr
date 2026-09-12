import { createId } from '@/lib/id';
import { ApiError, fetchWithTimeout } from '@/lib/http';
import { readJson, removeKey, StorageKeys, writeJson } from '@/lib/storage';
import { config } from '@/services/config';
import type { Pharmacy, PharmacyDraft } from '@/services/types';

/**
 * Eczane panelinden girilen kayıtların saklandığı yer.
 *
 * Kayıt her zaman önce cihaza yazılır; sunucuya gönderim isteğe bağlıdır ve
 * başarısız olsa bile eczacının girdiği bilgi kaybolmaz.
 */
export async function loadLocalPharmacies(): Promise<Pharmacy[]> {
  return readJson<Pharmacy[]>(StorageKeys.localPharmacies, []);
}

export async function saveLocalPharmacy(draft: PharmacyDraft): Promise<Pharmacy> {
  const existing = await loadLocalPharmacies();
  const id = draft.id ?? createId();

  const pharmacy: Pharmacy = {
    ...draft,
    id,
    source: 'pharmacy',
    // Konumu eczacı haritadan kendisi işaretlediği için kesin sayılır.
    locationQuality: 'exact',
    updatedAt: new Date().toISOString(),
  };

  const next = existing.some((entry) => entry.id === id)
    ? existing.map((entry) => (entry.id === id ? pharmacy : entry))
    : [...existing, pharmacy];

  await writeJson(StorageKeys.localPharmacies, next);
  return pharmacy;
}

export async function deleteLocalPharmacy(id: string): Promise<void> {
  const existing = await loadLocalPharmacies();
  await writeJson(
    StorageKeys.localPharmacies,
    existing.filter((entry) => entry.id !== id)
  );
}

export async function getMyPharmacyId(): Promise<string | null> {
  return readJson<string | null>(StorageKeys.myPharmacyId, null);
}

export async function setMyPharmacyId(id: string | null): Promise<void> {
  if (id === null) {
    await removeKey(StorageKeys.myPharmacyId);
    return;
  }
  await writeJson(StorageKeys.myPharmacyId, id);
}

/**
 * Kaydı, tanımlıysa merkezî sunucuya gönderir.
 * Sunucu tanımlı değilse kayıt yalnızca bu cihazda kalır ve `false` döner.
 */
export async function publishPharmacy(pharmacy: Pharmacy): Promise<boolean> {
  if (!config.submitUrl) {
    return false;
  }

  const response = await fetchWithTimeout(config.submitUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify(pharmacy),
    timeoutMs: config.requestTimeoutMs,
  });

  if (!response.ok) {
    throw new ApiError('Kayıt sunucuya gönderilemedi, cihazınızda saklandı.', response.status);
  }

  return true;
}
