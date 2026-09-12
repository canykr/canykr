/** Telefon numarasından rakam dışındaki her şeyi atar. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Türkiye telefon numarasını 10 haneye indirger (alan kodu + numara).
 * Tanınamayan numaralarda `null` döner.
 */
export function normalizePhone(value: string): string | null {
  let digits = digitsOnly(value);

  if (digits.startsWith('90') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10 || digits.startsWith('0')) {
    return null;
  }

  return digits;
}

/** Numarayı `0532 123 45 67` biçiminde gösterir. */
export function formatPhone(value: string): string {
  const normalized = normalizePhone(value);
  if (!normalized) {
    return value.trim();
  }
  return `0${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8)}`;
}

/** `tel:` bağlantısı için aramaya hazır numara üretir. */
export function toDialablePhone(value: string): string {
  const normalized = normalizePhone(value);
  return normalized ? `+90${normalized}` : digitsOnly(value);
}

/** Baş harfleri büyük, gereksiz boşlukları atılmış metin. */
export function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('tr-TR')
    .replace(/(^|\s|-)(\p{L})/gu, (_match, prefix: string, letter: string) =>
      `${prefix}${letter.toLocaleUpperCase('tr-TR')}`
    );
}

/**
 * Türkçe karakterleri ve büyük/küçük harf farkını yok sayan arama anahtarı üretir.
 */
export function searchKey(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .trim();
}

/** ISO zaman damgasını `12 Eylül 2026 14:30` biçiminde gösterir. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
