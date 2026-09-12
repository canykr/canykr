import type { Coordinate } from '@/services/types';

export type City = {
  /** Plaka kodu. */
  code: number;
  name: string;
  /** İl merkezine ait yaklaşık koordinat (en yakın ili tahmin etmek için). */
  center: Coordinate;
};

/** Türkiye'nin 81 ili, plaka sırasına göre. */
export const CITIES: City[] = [
  { code: 1, name: 'Adana', center: { latitude: 37.0, longitude: 35.3213 } },
  { code: 2, name: 'Adıyaman', center: { latitude: 37.7648, longitude: 38.2786 } },
  { code: 3, name: 'Afyonkarahisar', center: { latitude: 38.7507, longitude: 30.5567 } },
  { code: 4, name: 'Ağrı', center: { latitude: 39.7191, longitude: 43.0503 } },
  { code: 5, name: 'Amasya', center: { latitude: 40.6499, longitude: 35.8353 } },
  { code: 6, name: 'Ankara', center: { latitude: 39.9334, longitude: 32.8597 } },
  { code: 7, name: 'Antalya', center: { latitude: 36.8969, longitude: 30.7133 } },
  { code: 8, name: 'Artvin', center: { latitude: 41.1828, longitude: 41.8183 } },
  { code: 9, name: 'Aydın', center: { latitude: 37.856, longitude: 27.8416 } },
  { code: 10, name: 'Balıkesir', center: { latitude: 39.6484, longitude: 27.8826 } },
  { code: 11, name: 'Bilecik', center: { latitude: 40.1451, longitude: 29.9799 } },
  { code: 12, name: 'Bingöl', center: { latitude: 38.8854, longitude: 40.498 } },
  { code: 13, name: 'Bitlis', center: { latitude: 38.4006, longitude: 42.1095 } },
  { code: 14, name: 'Bolu', center: { latitude: 40.576, longitude: 31.5788 } },
  { code: 15, name: 'Burdur', center: { latitude: 37.7203, longitude: 30.2908 } },
  { code: 16, name: 'Bursa', center: { latitude: 40.1885, longitude: 29.061 } },
  { code: 17, name: 'Çanakkale', center: { latitude: 40.1553, longitude: 26.4142 } },
  { code: 18, name: 'Çankırı', center: { latitude: 40.6013, longitude: 33.6134 } },
  { code: 19, name: 'Çorum', center: { latitude: 40.5506, longitude: 34.9556 } },
  { code: 20, name: 'Denizli', center: { latitude: 37.7765, longitude: 29.0864 } },
  { code: 21, name: 'Diyarbakır', center: { latitude: 37.9144, longitude: 40.2306 } },
  { code: 22, name: 'Edirne', center: { latitude: 41.6818, longitude: 26.5623 } },
  { code: 23, name: 'Elazığ', center: { latitude: 38.681, longitude: 39.2264 } },
  { code: 24, name: 'Erzincan', center: { latitude: 39.75, longitude: 39.5 } },
  { code: 25, name: 'Erzurum', center: { latitude: 39.9043, longitude: 41.2679 } },
  { code: 26, name: 'Eskişehir', center: { latitude: 39.7767, longitude: 30.5206 } },
  { code: 27, name: 'Gaziantep', center: { latitude: 37.0662, longitude: 37.3833 } },
  { code: 28, name: 'Giresun', center: { latitude: 40.9128, longitude: 38.3895 } },
  { code: 29, name: 'Gümüşhane', center: { latitude: 40.4386, longitude: 39.5086 } },
  { code: 30, name: 'Hakkari', center: { latitude: 37.5744, longitude: 43.7408 } },
  { code: 31, name: 'Hatay', center: { latitude: 36.2025, longitude: 36.1606 } },
  { code: 32, name: 'Isparta', center: { latitude: 37.7648, longitude: 30.5566 } },
  { code: 33, name: 'Mersin', center: { latitude: 36.8121, longitude: 34.6415 } },
  { code: 34, name: 'İstanbul', center: { latitude: 41.0082, longitude: 28.9784 } },
  { code: 35, name: 'İzmir', center: { latitude: 38.4237, longitude: 27.1428 } },
  { code: 36, name: 'Kars', center: { latitude: 40.6013, longitude: 43.0975 } },
  { code: 37, name: 'Kastamonu', center: { latitude: 41.3887, longitude: 33.7827 } },
  { code: 38, name: 'Kayseri', center: { latitude: 38.7312, longitude: 35.4787 } },
  { code: 39, name: 'Kırklareli', center: { latitude: 41.7333, longitude: 27.2167 } },
  { code: 40, name: 'Kırşehir', center: { latitude: 39.1425, longitude: 34.1709 } },
  { code: 41, name: 'Kocaeli', center: { latitude: 40.8533, longitude: 29.8815 } },
  { code: 42, name: 'Konya', center: { latitude: 37.8667, longitude: 32.4833 } },
  { code: 43, name: 'Kütahya', center: { latitude: 39.4167, longitude: 29.9833 } },
  { code: 44, name: 'Malatya', center: { latitude: 38.3552, longitude: 38.3095 } },
  { code: 45, name: 'Manisa', center: { latitude: 38.6191, longitude: 27.4289 } },
  { code: 46, name: 'Kahramanmaraş', center: { latitude: 37.5858, longitude: 36.9371 } },
  { code: 47, name: 'Mardin', center: { latitude: 37.3212, longitude: 40.7245 } },
  { code: 48, name: 'Muğla', center: { latitude: 37.2153, longitude: 28.3636 } },
  { code: 49, name: 'Muş', center: { latitude: 38.9462, longitude: 41.7539 } },
  { code: 50, name: 'Nevşehir', center: { latitude: 38.6939, longitude: 34.6857 } },
  { code: 51, name: 'Niğde', center: { latitude: 37.9667, longitude: 34.6833 } },
  { code: 52, name: 'Ordu', center: { latitude: 40.9839, longitude: 37.8764 } },
  { code: 53, name: 'Rize', center: { latitude: 41.0201, longitude: 40.5234 } },
  { code: 54, name: 'Sakarya', center: { latitude: 40.7569, longitude: 30.3783 } },
  { code: 55, name: 'Samsun', center: { latitude: 41.2867, longitude: 36.33 } },
  { code: 56, name: 'Siirt', center: { latitude: 37.9333, longitude: 41.95 } },
  { code: 57, name: 'Sinop', center: { latitude: 42.0231, longitude: 35.1531 } },
  { code: 58, name: 'Sivas', center: { latitude: 39.7477, longitude: 37.0179 } },
  { code: 59, name: 'Tekirdağ', center: { latitude: 40.9833, longitude: 27.5167 } },
  { code: 60, name: 'Tokat', center: { latitude: 40.3167, longitude: 36.55 } },
  { code: 61, name: 'Trabzon', center: { latitude: 41.0027, longitude: 39.7168 } },
  { code: 62, name: 'Tunceli', center: { latitude: 39.1079, longitude: 39.5401 } },
  { code: 63, name: 'Şanlıurfa', center: { latitude: 37.1591, longitude: 38.7969 } },
  { code: 64, name: 'Uşak', center: { latitude: 38.6823, longitude: 29.4082 } },
  { code: 65, name: 'Van', center: { latitude: 38.4891, longitude: 43.4089 } },
  { code: 66, name: 'Yozgat', center: { latitude: 39.8181, longitude: 34.8147 } },
  { code: 67, name: 'Zonguldak', center: { latitude: 41.4564, longitude: 31.7987 } },
  { code: 68, name: 'Aksaray', center: { latitude: 38.3687, longitude: 34.037 } },
  { code: 69, name: 'Bayburt', center: { latitude: 40.2552, longitude: 40.2249 } },
  { code: 70, name: 'Karaman', center: { latitude: 37.1759, longitude: 33.2287 } },
  { code: 71, name: 'Kırıkkale', center: { latitude: 39.8468, longitude: 33.5153 } },
  { code: 72, name: 'Batman', center: { latitude: 37.8812, longitude: 41.1351 } },
  { code: 73, name: 'Şırnak', center: { latitude: 37.4187, longitude: 42.4918 } },
  { code: 74, name: 'Bartın', center: { latitude: 41.6344, longitude: 32.3375 } },
  { code: 75, name: 'Ardahan', center: { latitude: 41.1105, longitude: 42.7022 } },
  { code: 76, name: 'Iğdır', center: { latitude: 39.9237, longitude: 44.045 } },
  { code: 77, name: 'Yalova', center: { latitude: 40.65, longitude: 29.2667 } },
  { code: 78, name: 'Karabük', center: { latitude: 41.2061, longitude: 32.6204 } },
  { code: 79, name: 'Kilis', center: { latitude: 36.7184, longitude: 37.1212 } },
  { code: 80, name: 'Osmaniye', center: { latitude: 37.0742, longitude: 36.2478 } },
  { code: 81, name: 'Düzce', center: { latitude: 40.8438, longitude: 31.1565 } },
];

export const CITY_NAMES = CITIES.map((city) => city.name);

/**
 * Servislerin ve cihazların kullandığı kısa ya da eski il adları.
 * Eşleşmeyen bir ad, koordinatın "bilinmiyor" sayılmasına yol açtığı için
 * bu tablo veri kalitesi açısından önemli.
 */
const CITY_ALIASES: Record<string, string> = {
  afyon: 'Afyonkarahisar',
  antep: 'Gaziantep',
  urfa: 'Şanlıurfa',
  maras: 'Kahramanmaraş',
  'k.maraş': 'Kahramanmaraş',
  maraş: 'Kahramanmaraş',
  içel: 'Mersin',
  icel: 'Mersin',
  hakkâri: 'Hakkari',
  'i̇stanbul': 'İstanbul',
  'i̇zmir': 'İzmir',
};

export function findCityByName(name: string): City | undefined {
  const target = name.trim().toLocaleLowerCase('tr-TR');
  const direct = CITIES.find((city) => city.name.toLocaleLowerCase('tr-TR') === target);
  if (direct) {
    return direct;
  }

  const alias = CITY_ALIASES[target];
  return alias
    ? CITIES.find((city) => city.name === alias)
    : undefined;
}
