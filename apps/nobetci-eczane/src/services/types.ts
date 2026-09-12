/** Uygulamanın çekirdek veri modelleri. */

export type Coordinate = {
  latitude: number;
  longitude: number;
};

/**
 * Tek bir nöbet vardiyası.
 * `endTime`, `startTime`'dan küçük ya da ona eşitse vardiya ertesi güne sarkar
 * (örn. 18:30 - 08:30).
 */
export type DutyShift = {
  /** Nöbetin başladığı gün, `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm` biçiminde başlangıç saati. */
  startTime: string;
  /** `HH:mm` biçiminde bitiş saati. */
  endTime: string;
  /**
   * Saatler eczane tarafından (panelden) ya da API tarafından açıkça bildirildiyse
   * `true`. `false` ise saatler varsayılan nöbet aralığından tahmin edilmiştir ve
   * arayüzde geri sayım gösterilmez.
   */
  declared: boolean;
};

/** Kaydın nereden geldiği. */
export type PharmacySource =
  /** Uygulamayla gelen örnek veri (yalnızca demo modunda). */
  | 'demo'
  /** Yapılandırılmış nöbetçi eczane API'sinden gelen veri. */
  | 'api'
  /** Eczanenin kendi panelinden girdiği veri. */
  | 'pharmacy';

/**
 * Koordinatın ne kadar güvenilir olduğu.
 * Rakip uygulamalarda en çok şikayet edilen konu "adres doğru ama pin yanlış"
 * olduğu için bunu kullanıcıya açıkça gösteriyoruz.
 */
export type LocationQuality =
  /** Eczane panelinden doğrulanmış ya da API'den tam koordinat geldi. */
  | 'exact'
  /** Koordinat adresten/ilçe merkezinden tahmin edildi. */
  | 'approximate'
  /** Kullanılabilir koordinat yok. */
  | 'unknown';

export type Pharmacy = {
  id: string;
  name: string;
  pharmacistName?: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  location: Coordinate;
  notes?: string;
  source: PharmacySource;
  locationQuality: LocationQuality;
  /** ISO 8601 zaman damgası. */
  updatedAt: string;
  duties: DutyShift[];
};

/** Panelden kaydedilen, henüz kimliği olmayan eczane bilgisi. */
export type PharmacyDraft = Omit<
  Pharmacy,
  'id' | 'source' | 'updatedAt' | 'locationQuality'
> & {
  id?: string;
};

/** Mesafe bilgisi eklenmiş eczane kaydı. */
export type PharmacyWithDistance = Pharmacy & {
  /** Kullanıcı konumuna kuş uçuşu mesafe (metre). Konum yoksa `null`. */
  distanceMeters: number | null;
};

export type PharmacyQuery = {
  city?: string;
  district?: string;
};

/** Kullanıcıdan gelen "bu kayıt yanlış" bildirimi. */
export type PharmacyReport = {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  reason: 'kapali' | 'yanlis-konum' | 'yanlis-telefon' | 'diger';
  note?: string;
  createdAt: string;
};

/** Bir arama sonucunun kaynağı ve tazeliği. */
export type PharmacyResult = {
  pharmacies: Pharmacy[];
  /** Verinin API'den çekildiği an (ISO 8601). */
  fetchedAt: string;
  /** Veri önbellekten geldiyse `true`. */
  fromCache: boolean;
  providerId: string;
};
