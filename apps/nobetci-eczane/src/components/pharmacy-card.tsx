import { Pressable, StyleSheet, View } from 'react-native';

import { DutyBadge } from '@/components/duty-badge';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { callPharmacy, openDirections, sharePharmacy } from '@/lib/actions';
import { formatDistance } from '@/lib/geo';
import { formatPhone } from '@/lib/format';
import type { PharmacyWithDistance } from '@/services/types';

export type PharmacyCardProps = {
  pharmacy: PharmacyWithDistance;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function PharmacyCard({
  pharmacy,
  onPress,
  isFavorite,
  onToggleFavorite,
}: PharmacyCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pharmacy.name}, ${pharmacy.district}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {pharmacy.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {pharmacy.district} · {formatDistance(pharmacy.distanceMeters)}
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          hitSlop={12}
          onPress={onToggleFavorite}>
          <ThemedText style={{ color: isFavorite ? theme.warning : theme.textSecondary }}>
            {isFavorite ? '★' : '☆'}
          </ThemedText>
        </Pressable>
      </View>

      <DutyBadge pharmacy={pharmacy} />

      <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
        {pharmacy.address}
      </ThemedText>

      {pharmacy.locationQuality !== 'exact' ? (
        <ThemedText type="small" style={{ color: theme.warning }}>
          ⚠︎ Konum yaklaşık olabilir — yola çıkmadan önce arayın.
        </ThemedText>
      ) : null}

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
        />
        <Button
          label="Paylaş"
          variant="ghost"
          accessibilityHint="Eczane bilgisini ve harita bağlantısını paylaşır"
          onPress={() => void sharePharmacy(pharmacy)}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  grow: {
    flexGrow: 1,
    flexBasis: 180,
  },
});
