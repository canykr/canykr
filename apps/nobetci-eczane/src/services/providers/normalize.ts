import { findCityByName } from '@/data/cities';
import { distanceInMeters, isValidCoordinate } from '@/lib/geo';
import { titleCase } from '@/lib/format';
import { DEFAULT_SHIFT_END, DEFAULT_SHIFT_START, toDateString } from '@/lib/duty';
import type { Coordinate, LocationQuality, Pharmacy } from '@/services/types';

/**
 * Bir eczanenin il merkezine bu mesafeden uzak olması beklenmez. Daha uzak
 * koordinatlar büyük olasılıkla hatalıdır (enlem/boylam yer değiştirmiş,
 * virgül hatası vb.) ve "yaklaşık" olarak işaretlenir.
 */
const MAX_PLAUSIBLE_DISTANCE_FROM_CITY_METERS = 250_000;

/** Türkiye'nin kabaca sınırlayıcı kutusu. */
const TURKEY_BOUNDS = {
  minLatitude: 35.6,
  maxLatitude: 42.4,
  minLongitude: 25.5,
  maxLongitude: 45.0,
};

function isInTurkey(coordinate: Coordinate): boolean {
  return (
    coordinate.latitude >= TURKEY_BOUNDS.minLatitude &&
    coordinate.latitude <= TURKEY_BOUNDS.maxLatitude &&
    coordinate.longitude >= TURKEY_BOUNDS.minLongitude &&
    coordinate.longitude <= TURKEY_BOUNDS.maxLongitude
  );
}

/**
 * `"41.0082,28.9784"` ya da `"41.0082 , 28.9784"` biçimindeki metni koordinata
 * çevirir. Bazı sağlayıcılar enlem/boylamı ayrı alanlarda da verir.
 */
export function parseLatLng(value: unknown): Coordinate | null {
  if (typeof value !== 'string') {
    return null;
  }
  const parts = value.split(',');
  if (parts.length !== 2) {
    return null;
  }
  const latitude = Number(parts[0].trim());
  const longitude = Number(parts[1].trim());
  const coordinate = { latitude, longitude };
  return isValidCoordinate(coordinate) ? coordinate : null;
}

export function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Sağlayıcıdan gelen çeşitli koordinat alanlarını tek biçime indirger. */
export function pickCoordinate(raw: Record<string, unknown>): Coordinate | null {
  const combined = parseLatLng(raw.loc ?? raw.location ?? raw.coordinates);
  if (combined) {
    return combined;
  }

  const latitude = toNumber(raw.latitude ?? raw.lat ?? raw.enlem);
  const longitude = toNumber(raw.longitude ?? raw.lng ?? raw.lon ?? raw.boylam);
  const coordinate = { latitude: latitude ?? Number.NaN, longitude: longitude ?? Number.NaN };
  return isValidCoordinate(coordinate) ? coordinate : null;
}

/**
 * Koordinatı, ait olduğu ile göre denetler.
 *
 * Kullanıcıların en çok şikayet ettiği durum "adres doğru ama harita yanlış
 * yere götürüyor". Bu yüzden şüpheli koordinatı sessizce kullanmak yerine
 * `approximate` olarak işaretliyoruz; arayüz de bunu kullanıcıya söylüyor.
 */
export function assessLocation(
  coordinate: Coordinate | null,
  cityName: string
): { location: Coordinate | null; quality: LocationQuality } {
  const city = findCityByName(cityName);

  if (!coordinate) {
    return { location: city?.center ?? null, quality: city ? 'approximate' : 'unknown' };
  }

  if (!isInTurkey(coordinate)) {
    return { location: city?.center ?? coordinate, quality: 'approximate' };
  }

  if (city) {
    const distance = distanceInMeters(city.center, coordinate);
    if (distance > MAX_PLAUSIBLE_DISTANCE_FROM_CITY_METERS) {
      return { location: coordinate, quality: 'approximate' };
    }
  }

  return { location: coordinate, quality: 'exact' };
}

export type RawPharmacy = {
  name: string;
  address: string;
  phone: string;
  city: string;
  district: string;
  coordinate: Coordinate | null;
  pharmacistName?: string;
  notes?: string;
  /** API saatleri veriyorsa `HH:mm` olarak. */
  startTime?: string;
  endTime?: string;
};

/**
 * Sağlayıcıdan gelen ham kaydı uygulamanın veri modeline çevirir.
 * `id`, aynı eczane farklı günlerde tekrar geldiğinde kararlı kalsın diye
 * ad + ilçe üzerinden üretilir.
 */
export function toPharmacy(
  raw: RawPharmacy,
  options: { providerId: string; dutyDate?: Date }
): Pharmacy {
  const dutyDate = options.dutyDate ?? new Date();
  const city = titleCase(raw.city);
  const district = titleCase(raw.district);
  const name = titleCase(raw.name);
  const { location, quality } = assessLocation(raw.coordinate, city);

  const declared = Boolean(raw.startTime && raw.endTime);

  return {
    id: buildStableId(options.providerId, city, district, name),
    name,
    pharmacistName: raw.pharmacistName ? titleCase(raw.pharmacistName) : undefined,
    city,
    district,
    address: raw.address.trim().replace(/\s+/g, ' '),
    phone: raw.phone.trim(),
    location: location ?? { latitude: 0, longitude: 0 },
    notes: raw.notes?.trim() || undefined,
    source: 'api',
    locationQuality: location ? quality : 'unknown',
    updatedAt: new Date().toISOString(),
    duties: [
      {
        date: toDateString(dutyDate),
        startTime: raw.startTime ?? DEFAULT_SHIFT_START,
        endTime: raw.endTime ?? DEFAULT_SHIFT_END,
        declared,
      },
    ],
  };
}

/** Aynı eczane için her seferinde aynı kimliği üretir. */
export function buildStableId(
  providerId: string,
  city: string,
  district: string,
  name: string
): string {
  const slug = [city, district, name]
    .join('-')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
  return `${providerId}:${slug}`;
}
