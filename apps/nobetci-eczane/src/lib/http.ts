/** Ağ katmanı için ortak yardımcılar. */

export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * `fetch`i zaman aşımıyla sarmalar.
 *
 * Rakip uygulamalarda en sık şikayetlerden biri "eczane aranıyor ekranında
 * donup kalıyor" olduğu için her istek mutlaka bir süre sonra sonlanır.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs: number }
): Promise<Response> {
  const { timeoutMs, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Sunucu zamanında yanıt vermedi. Bağlantınızı kontrol edin.');
    }
    throw new ApiError('İnternet bağlantısı kurulamadı.');
  } finally {
    clearTimeout(timer);
  }
}

/** HTTP durum kodunu kullanıcıya gösterilecek Türkçe mesaja çevirir. */
export function messageForStatus(status: number): string {
  if (status === 401 || status === 403) {
    return 'API anahtarı geçersiz ya da yetkisiz.';
  }
  if (status === 404) {
    return 'Bu il/ilçe için kayıt bulunamadı.';
  }
  if (status === 429) {
    return 'İstek sınırı aşıldı, biraz sonra tekrar deneyin.';
  }
  if (status >= 500) {
    return 'Veri sağlayıcısında geçici bir sorun var.';
  }
  return `Beklenmeyen bir hata oluştu (${status}).`;
}
