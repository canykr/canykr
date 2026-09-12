import { createId } from '@/lib/id';
import { sendWithTimeout } from '@/lib/http';
import { readJson, writeJson } from '@/lib/storage';
import { config } from '@/services/config';
import type { PharmacyReport } from '@/services/types';

const STORAGE_KEY = 'eczane/reports';

/**
 * "Bu eczane kapalıydı / bilgiler yanlış" bildirimlerini toplar.
 *
 * Rakip uygulamalarda en ağır şikayet yanlış yönlendirme; bildirimleri
 * kaydedip (sunucu tanımlıysa) merkeze göndermek, veri kalitesini
 * düzeltmenin en hızlı yolu.
 */
export async function saveReport(
  input: Pick<PharmacyReport, 'pharmacyId' | 'pharmacyName' | 'reason'> & { note?: string }
): Promise<PharmacyReport> {
  const report: PharmacyReport = {
    id: createId('rpr'),
    createdAt: new Date().toISOString(),
    ...input,
  };

  const existing = await readJson<PharmacyReport[]>(STORAGE_KEY, []);
  await writeJson(STORAGE_KEY, [...existing, report]);

  if (config.submitUrl) {
    try {
      await sendWithTimeout(`${config.submitUrl.replace(/\/$/, '')}/reports`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(report),
        timeoutMs: config.requestTimeoutMs,
      });
    } catch {
      // Gönderilemezse bildirim cihazda kalır; kullanıcıyı hata ile meşgul etme.
    }
  }

  return report;
}

export async function loadReports(): Promise<PharmacyReport[]> {
  return readJson<PharmacyReport[]>(STORAGE_KEY, []);
}
