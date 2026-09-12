import { toDateString } from '@/lib/duty';
import type { Pharmacy } from '@/services/types';

type DemoSeed = {
  name: string;
  pharmacistName: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  /** Vardiya bugünden kaç gün sonra başlıyor. 0 = bugün. */
  dayOffset: number;
  startTime: string;
  endTime: string;
  notes?: string;
};

/**
 * Uygulamayı API anahtarı olmadan denemek için kullanılan örnek kayıtlar.
 * Adlarında "(Örnek)" ibaresi var; hiçbiri gerçek bir eczane değildir.
 */
const SEEDS: DemoSeed[] = [
  {
    name: 'Papatya Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'İstanbul',
    district: 'Kadıköy',
    address: 'Caferağa Mah. Örnek Sok. No:1, Kadıköy',
    phone: '0212 000 00 01',
    latitude: 40.9903,
    longitude: 29.0273,
    dayOffset: 0,
    startTime: '00:00',
    endTime: '23:59',
    notes: 'Moda İskelesi’ne yürüme mesafesinde.',
  },
  {
    name: 'Deniz Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'İstanbul',
    district: 'Beşiktaş',
    address: 'Sinanpaşa Mah. Örnek Cad. No:12, Beşiktaş',
    phone: '0212 000 00 02',
    latitude: 41.0422,
    longitude: 29.0083,
    dayOffset: 0,
    startTime: '00:00',
    endTime: '23:59',
  },
  {
    name: 'Yeni Umut Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'İstanbul',
    district: 'Şişli',
    address: 'Halaskargazi Cad. No:210, Şişli',
    phone: '0212 000 00 03',
    latitude: 41.0602,
    longitude: 28.9877,
    dayOffset: 0,
    startTime: '18:30',
    endTime: '08:30',
  },
  {
    name: 'Bahar Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'İstanbul',
    district: 'Üsküdar',
    address: 'Mimar Sinan Mah. Örnek Sok. No:5, Üsküdar',
    phone: '0216 000 00 04',
    latitude: 41.0256,
    longitude: 29.0146,
    dayOffset: 1,
    startTime: '18:30',
    endTime: '08:30',
  },
  {
    name: 'Merkez Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'Ankara',
    district: 'Çankaya',
    address: 'Kızılay Meydanı, Örnek Cad. No:3, Çankaya',
    phone: '0312 000 00 05',
    latitude: 39.9208,
    longitude: 32.8541,
    dayOffset: 0,
    startTime: '00:00',
    endTime: '23:59',
  },
  {
    name: 'Şifa Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'Ankara',
    district: 'Keçiören',
    address: 'Kalaba Mah. Örnek Sok. No:44, Keçiören',
    phone: '0312 000 00 06',
    latitude: 39.9799,
    longitude: 32.8697,
    dayOffset: 0,
    startTime: '18:30',
    endTime: '08:30',
  },
  {
    name: 'Konak Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'İzmir',
    district: 'Konak',
    address: 'Alsancak Mah. Örnek Cad. No:7, Konak',
    phone: '0232 000 00 07',
    latitude: 38.4325,
    longitude: 27.1421,
    dayOffset: 0,
    startTime: '00:00',
    endTime: '23:59',
  },
  {
    name: 'Ege Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'İzmir',
    district: 'Karşıyaka',
    address: 'Bostanlı Mah. Örnek Sok. No:19, Karşıyaka',
    phone: '0232 000 00 08',
    latitude: 38.4592,
    longitude: 27.0977,
    dayOffset: 0,
    startTime: '18:30',
    endTime: '08:30',
  },
  {
    name: 'Akdeniz Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'Antalya',
    district: 'Muratpaşa',
    address: 'Lara Cad. Örnek Apt. No:88, Muratpaşa',
    phone: '0242 000 00 09',
    latitude: 36.8841,
    longitude: 30.7056,
    dayOffset: 0,
    startTime: '00:00',
    endTime: '23:59',
  },
  {
    name: 'Yıldız Eczanesi (Örnek)',
    pharmacistName: 'Ecz. Demo Kullanıcı',
    city: 'Bursa',
    district: 'Nilüfer',
    address: 'Görükle Mah. Örnek Cad. No:2, Nilüfer',
    phone: '0224 000 00 10',
    latitude: 40.2234,
    longitude: 28.8734,
    dayOffset: 0,
    startTime: '18:30',
    endTime: '08:30',
  },
];

function shiftDate(now: Date, dayOffset: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  return toDateString(date);
}

/**
 * Örnek kayıtları, vardiyaları her zaman "bugün"e denk gelecek biçimde üretir.
 * Böylece demo modunda liste hiçbir zaman boş kalmaz.
 */
export function buildDemoPharmacies(now: Date = new Date()): Pharmacy[] {
  return SEEDS.map((seed, index) => ({
    id: `demo:${index + 1}`,
    name: seed.name,
    pharmacistName: seed.pharmacistName,
    city: seed.city,
    district: seed.district,
    address: seed.address,
    phone: seed.phone,
    location: { latitude: seed.latitude, longitude: seed.longitude },
    notes: seed.notes,
    source: 'demo' as const,
    locationQuality: 'exact' as const,
    updatedAt: now.toISOString(),
    duties: [
      {
        date: shiftDate(now, seed.dayOffset),
        startTime: seed.startTime,
        endTime: seed.endTime,
        declared: true,
      },
    ],
  }));
}
