import * as Clipboard from 'expo-clipboard';
import { Alert, Linking, Platform, Share } from 'react-native';

import { formatPhone, toDialablePhone } from '@/lib/format';
import type { Coordinate, Pharmacy } from '@/services/types';

/** Herkesin açabileceği, paylaşıma uygun harita bağlantısı. */
export function mapsLink(location: Coordinate, label?: string): string {
  const query = `${location.latitude},${location.longitude}`;
  const name = label ? `&query_place_id=&destination_name=${encodeURIComponent(label)}` : '';
  return `https://www.google.com/maps/search/?api=1&query=${query}${name}`;
}

/** Cihazın yerel harita uygulamasında yol tarifi açar. */
export async function openDirections(pharmacy: Pharmacy): Promise<void> {
  const { latitude, longitude } = pharmacy.location;
  const label = encodeURIComponent(pharmacy.name);

  const nativeUrl = Platform.select({
    ios: `maps://?daddr=${latitude},${longitude}&q=${label}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    default: '',
  });

  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

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
    mapsLink(pharmacy.location, pharmacy.name),
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
