/** Ağ katmanı için ortak yardımcılar. */

export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * `fetch`i zaman aşımıyla sarmalar.
 *
 * Zaman aşımı yalnızca başlıkları değil, gövdenin okunmasını da kapsamalıdır:
 * sunucu başlıkları gönderip gövdeyi yarıda bırakırsa `response.json()`
 * süresiz bekler. Bu yüzden sayaç, gövde okunana kadar durdurulmaz; bunu
 * garantilemek için istek ve gövde okuma tek bir yerde yapılır.
 *
 * Rakip uygulamalardaki "eczane aranıyor ekranında donup kalıyor" şikayetinin
 * sebebi tam olarak bu durum.
 */
export async function fetchJsonWithTimeout<T>(
  url: string,
  init: Omit<RequestInit, 'signal'> & { timeoutMs: number }
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const { timeoutMs, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...rest, signal: controller.signal });

    if (!response.ok) {
      return { ok: false, status: response.status, data: null };
    }

    // Gövde okuması da aynı iptal penceresinin içinde kalır.
    const data = (await response.json()) as T;
    return { ok: true, status: response.status, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Sunucu zamanında yanıt vermedi. Bağlantınızı kontrol edin.', null, {
        cause: error,
      });
    }
    if (error instanceof SyntaxError) {
      throw new ApiError('Sunucu okunamayan bir yanıt döndürdü.', null, { cause: error });
    }
    throw new ApiError('İnternet bağlantısı kurulamadı.', null, { cause: error });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gövdesi önemsenmeyen istekler için (örn. kayıt gönderimi).
 * Zaman aşımı isteğin tamamını kapsar.
 */
export async function sendWithTimeout(
  url: string,
  init: Omit<RequestInit, 'signal'> & { timeoutMs: number }
): Promise<{ ok: boolean; status: number }> {
  const { timeoutMs, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...rest, signal: controller.signal });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Sunucu zamanında yanıt vermedi.', null, { cause: error });
    }
    throw new ApiError('İnternet bağlantısı kurulamadı.', null, { cause: error });
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
