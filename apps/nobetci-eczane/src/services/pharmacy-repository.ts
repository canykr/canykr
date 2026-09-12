import { isOnDutyAt } from '@/lib/duty';
import { distanceInMeters } from '@/lib/geo';
import { searchKey } from '@/lib/format';
import type { Coordinate, Pharmacy, PharmacyWithDistance } from '@/services/types';

/** İki kaydın aynı eczane olup olmadığını ad + ilçe üzerinden tahmin eder. */
export function identityKey(pharmacy: Pharmacy): string {
  return `${searchKey(pharmacy.district)}|${searchKey(pharmacy.name).replace(/eczanesi|eczane/g, '').trim()}`;
}

/**
 * API kayıtlarıyla eczanelerin kendi panelinden girdiği kayıtları birleştirir.
 *
 * Aynı eczane iki kaynakta da varsa panelden gelen kayıt kazanır: konumu
 * eczacının kendisi haritadan işaretlediği için API'den gelen (çoğu zaman
 * adresten tahmin edilmiş) koordinattan daha güvenilirdir.
 */
export function mergePharmacies(fromApi: Pharmacy[], fromPanel: Pharmacy[]): Pharmacy[] {
  const merged = new Map<string, Pharmacy>();

  for (const pharmacy of fromApi) {
    merged.set(identityKey(pharmacy), pharmacy);
  }

  for (const pharmacy of fromPanel) {
    const key = identityKey(pharmacy);
    const existing = merged.get(key);
    merged.set(key, existing ? preferPanelRecord(existing, pharmacy) : pharmacy);
  }

  return [...merged.values()];
}

/**
 * Panel kaydını temel alır ama API'nin bildirdiği nöbet günlerini de korur;
 * eczane panele her gün girmese de nöbet bilgisi kaybolmasın.
 */
function preferPanelRecord(apiRecord: Pharmacy, panelRecord: Pharmacy): Pharmacy {
  const dutyDates = new Set(panelRecord.duties.map((duty) => duty.date));
  return {
    ...panelRecord,
    duties: [...panelRecord.duties, ...apiRecord.duties.filter((duty) => !dutyDates.has(duty.date))],
  };
}

/** Listeye verilen noktaya olan mesafeyi ekler. */
export function withDistance(
  pharmacies: Pharmacy[],
  origin: Coordinate | null
): PharmacyWithDistance[] {
  return pharmacies.map((pharmacy) => ({
    ...pharmacy,
    distanceMeters: origin ? distanceInMeters(origin, pharmacy.location) : null,
  }));
}

export type PharmacyFilter = {
  /** Ad, ilçe ya da adres içinde geçen metin. */
  search?: string;
  district?: string;
  /** Yalnızca şu an nöbette olanlar. */
  onlyOnDuty?: boolean;
};

export function filterPharmacies(
  pharmacies: PharmacyWithDistance[],
  filter: PharmacyFilter,
  now: Date = new Date()
): PharmacyWithDistance[] {
  const search = filter.search ? searchKey(filter.search) : '';
  const district = filter.district ? searchKey(filter.district) : '';

  return pharmacies.filter((pharmacy) => {
    if (filter.onlyOnDuty && !isOnDutyAt(pharmacy, now)) {
      return false;
    }
    if (district && searchKey(pharmacy.district) !== district) {
      return false;
    }
    if (search) {
      const haystack = searchKey(
        `${pharmacy.name} ${pharmacy.district} ${pharmacy.address} ${pharmacy.pharmacistName ?? ''}`
      );
      if (!haystack.includes(search)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Önce şu an nöbette olanlar, sonra mesafeye göre sıralar.
 * Mesafesi bilinmeyen kayıtlar en sona düşer.
 */
export function sortByRelevance(
  pharmacies: PharmacyWithDistance[],
  now: Date = new Date()
): PharmacyWithDistance[] {
  return [...pharmacies].sort((a, b) => {
    const dutyDelta = Number(isOnDutyAt(b, now)) - Number(isOnDutyAt(a, now));
    if (dutyDelta !== 0) {
      return dutyDelta;
    }

    const aDistance = a.distanceMeters ?? Number.POSITIVE_INFINITY;
    const bDistance = b.distanceMeters ?? Number.POSITIVE_INFINITY;
    if (aDistance !== bDistance) {
      return aDistance - bDistance;
    }

    return a.name.localeCompare(b.name, 'tr-TR');
  });
}

/**
 * Haritada seçilen bir nokta çevresindeki kayıtları döndürür.
 *
 * Rakip uygulamalarda en çok istenen özelliklerden biri "sadece bulunduğum
 * yerin değil, gideceğim yerin çevresindeki nöbetçileri de görebilmek".
 */
export function withinRadius(
  pharmacies: Pharmacy[],
  center: Coordinate,
  radiusMeters: number
): PharmacyWithDistance[] {
  return withDistance(pharmacies, center).filter(
    (pharmacy) => (pharmacy.distanceMeters ?? Number.POSITIVE_INFINITY) <= radiusMeters
  );
}

/** Sonuç listesinden ilçe süzgeci için seçenekleri çıkarır. */
export function districtsOf(pharmacies: Pharmacy[]): string[] {
  const districts = new Set(pharmacies.map((pharmacy) => pharmacy.district).filter(Boolean));
  return [...districts].sort((a, b) => a.localeCompare(b, 'tr-TR'));
}
