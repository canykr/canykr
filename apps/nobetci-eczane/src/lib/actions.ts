import * as Clipboard from 'expo-clipboard';
import { Alert, Linking, Platform, Share } from 'react-native';

import { formatPhone, toDialablePhone } from '@/lib/format';
import type { Pharmacy } from '@/services/types';

/** Eczanenin adresini tek satırlık aranabilir metne çevirir. */
function addressQuery(pharmacy: Pharmacy): string {
  return `${pharmacy.name} ${pharmacy.address} ${pharmacy.district} ${pharmacy.city}`
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Herkesin açabileceği, paylaşıma uygun harita bağlantısı.
 *
 * Koordinat yoksa adres metniyle arama bağlantısı üretilir; böylece
 * bağlantı hâlâ işe yarar. Google'ın Search URL API'si yalnızca `query`
 * parametresini tanır, bu yüzden eczane adı paylaşım metninde taşınır.
 */
export function mapsLink(pharmacy: Pharmacy): string {
  const query = pharmacy.location
    ? `${pharmacy.location.latitude},${pharmacy.location.longitude}`
    : addressQuery(pharmacy);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Cihazın yerel harita uygulamasında yol tarifi açar. */
export async function openDirections(pharmacy: Pharmacy): Promise<void> {
  const label = encodeURIComponent(pharmacy.name);

  // Koordinat yoksa adresle arama yapılır; kullanıcıyı (0, 0) noktasına
  // yollamaktansa adresi haritada aratmak çok daha doğru.
  const nativeUrl = pharmacy.location
    ? Platform.select({
        ios: `maps://?daddr=${pharmacy.location.latitude},${pharmacy.location.longitude}&q=${label}`,
        android: `geo:${pharmacy.location.latitude},${pharmacy.location.longitude}?q=${pharmacy.location.latitude},${pharmacy.location.longitude}(${label})`,
        default: '',
      })
    : '';

  const webUrl = pharmacy.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.location.latitude},${pharmacy.location.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressQuery(pharmacy))}`;

  try {
    if (nativeUrl && (await Linking.canOpenURL(nativeUrl))) {
      await Linking.openURL(nativeUrl);
      return;
    }
    await Linking.openURL(webUrl);
  } catch {
    Alert.alert('Harita açılamadı', 'Cihazınızda bir harita uygulaması bulunamadı.');
  }
}

/** Eczaneyi telefonla arar. */
export async function callPharmacy(pharmacy: Pharmacy): Promise<void> {
  const url = `tel:${toDialablePhone(pharmacy.phone)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Arama başlatılamadı', `Numarayı elle arayabilirsiniz: ${formatPhone(pharmacy.phone)}`);
  }
}

/**
 * Eczaneyi paylaşır.
 *
 * Rakip uygulamalarda "başkasına konum göndermek tam bir kabus" diye şikayet
 * edilen akış bu: metinle birlikte doğrudan açılabilir bir harita bağlantısı
 * gönderiyoruz ki karşı taraf haritayı kendisi aramak zorunda kalmasın.
 */
export async function sharePharmacy(pharmacy: Pharmacy): Promise<void> {
  const lines = [
    `${pharmacy.name} — Nöbetçi Eczane`,
    `${pharmacy.district} / ${pharmacy.city}`,
    pharmacy.address,
    `Tel: ${formatPhone(pharmacy.phone)}`,
    '',
    mapsLink(pharmacy),
  ];

  try {
    await Share.share({
      message: lines.join('\n'),
      title: pharmacy.name,
    });
  } catch {
    // Kullanıcı paylaşım ekranını kapattıysa sessizce geç.
  }
}

/** Adresi panoya kopyalar. */
export async function copyAddress(pharmacy: Pharmacy): Promise<void> {
  await Clipboard.setStringAsync(`${pharmacy.name}\n${pharmacy.address}\n${pharmacy.district} / ${pharmacy.city}`);
}
