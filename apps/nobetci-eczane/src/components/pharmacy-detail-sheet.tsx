import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DutyBadge } from '@/components/duty-badge';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { callPharmacy, copyAddress, openDirections, sharePharmacy } from '@/lib/actions';
import { formatShift } from '@/lib/duty';
import { formatDistance } from '@/lib/geo';
import { formatPhone, formatTimestamp } from '@/lib/format';
import { saveReport } from '@/services/reports';
import type { PharmacyWithDistance } from '@/services/types';

export type PharmacyDetailSheetProps = {
  pharmacy: PharmacyWithDistance | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
};

const SOURCE_LABELS: Record<string, string> = {
  api: 'Nöbetçi eczane servisinden alındı',
  pharmacy: 'Eczanenin kendisi tarafından girildi',
  demo: 'Örnek veri — gerçek bir eczane değildir',
};

export function PharmacyDetailSheet({
  pharmacy,
  isFavorite,
  onToggleFavorite,
  onClose,
}: PharmacyDetailSheetProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);
  const [shownId, setShownId] = useState<string | null>(null);

  // Bileşen kapatıldığında bağlı kalmaya devam ettiği için, başka bir eczane
  // açıldığında "kopyalandı" / "bildirim alındı" durumları sıfırlanmalı.
  if (pharmacy && pharmacy.id !== shownId) {
    setShownId(pharmacy.id);
    setCopied(false);
    setReported(false);
  }

  if (!pharmacy) {
    return null;
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>
            {pharmacy.name}
          </ThemedText>
          <Button label="Kapat" variant="ghost" onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {pharmacy.source === 'demo' ? (
            <Banner
              tone="warning"
              title="Örnek kayıt"
              description="Bu eczane gerçek değildir. Gerçek veri için uygulamaya bir nöbetçi eczane API'si tanımlayın."
            />
          ) : null}

          {pharmacy.locationQuality !== 'exact' ? (
            <Banner
              tone="warning"
              title="Konum yaklaşık olabilir"
              description="Bu kaydın koordinatı adresten tahmin edildi. Yola çıkmadan önce eczaneyi arayarak teyit edin."
            />
          ) : null}

          <DutyBadge pharmacy={pharmacy} />

          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              Adres
            </ThemedText>
            <ThemedText type="small">{pharmacy.address}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {pharmacy.district} / {pharmacy.city} · {formatDistance(pharmacy.distanceMeters)}
            </ThemedText>
          </View>

          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              Telefon
            </ThemedText>
            <ThemedText type="small">{formatPhone(pharmacy.phone)}</ThemedText>
          </View>

          {pharmacy.pharmacistName ? (
            <View style={styles.block}>
              <ThemedText type="small" themeColor="textSecondary">
                Sorumlu eczacı
              </ThemedText>
              <ThemedText type="small">{pharmacy.pharmacistName}</ThemedText>
            </View>
          ) : null}

          {pharmacy.notes ? (
            <View style={styles.block}>
              <ThemedText type="small" themeColor="textSecondary">
                Tarif / not
              </ThemedText>
              <ThemedText type="small">{pharmacy.notes}</ThemedText>
            </View>
          ) : null}

          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              Nöbet günleri
            </ThemedText>
            {pharmacy.duties.length === 0 ? (
              <ThemedText type="small">Kayıtlı nöbet bilgisi yok.</ThemedText>
            ) : (
              pharmacy.duties.map((duty) => (
                <ThemedText key={`${duty.date}-${duty.startTime}`} type="small">
                  {formatShift(duty)}
                  {duty.declared ? '' : ' (saatler tahmini)'}
                </ThemedText>
              ))
            )}
          </View>

          <View style={styles.actions}>
            <Button
              label={`Ara · ${formatPhone(pharmacy.phone)}`}
              onPress={() => void callPharmacy(pharmacy)}
              style={styles.grow}
            />
            <Button
              label="Yol tarifi"
              variant="secondary"
              onPress={() => void openDirections(pharmacy)}
              style={styles.grow}
            />
            <Button
              label="Paylaş"
              variant="secondary"
              onPress={() => void sharePharmacy(pharmacy)}
              style={styles.grow}
            />
            <Button
              label={copied ? 'Adres kopyalandı' : 'Adresi kopyala'}
              variant="ghost"
              onPress={() => {
                void copyAddress(pharmacy).then(() => setCopied(true));
              }}
              style={styles.grow}
            />
            <Button
              label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
              variant="ghost"
              onPress={onToggleFavorite}
              style={styles.grow}
            />
          </View>

          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              {SOURCE_LABELS[pharmacy.source] ?? 'Kaynak bilinmiyor'} ·{' '}
              {formatTimestamp(pharmacy.updatedAt)}
            </ThemedText>
          </View>

          <Button
            label={reported ? 'Bildiriminiz alındı, teşekkürler' : 'Bilgiler yanlış / eczane kapalı'}
            variant="ghost"
            disabled={reported}
            onPress={() => {
              void saveReport({
                pharmacyId: pharmacy.id,
                pharmacyName: pharmacy.name,
                reason: 'diger',
              }).then(() => setReported(true));
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  title: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  block: {
    gap: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  grow: {
    flexGrow: 1,
    flexBasis: 160,
  },
});
