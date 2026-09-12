import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PharmacyCard } from '@/components/pharmacy-card';
import { PharmacyDetailSheet } from '@/components/pharmacy-detail-sheet';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useFavorites } from '@/hooks/use-favorites';
import { useLocation } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';
import { withDistance } from '@/services/pharmacy-repository';
import type { PharmacyWithDistance } from '@/services/types';

export default function FavoritesScreen() {
  const theme = useTheme();
  const favorites = useFavorites();
  const location = useLocation();
  const [selected, setSelected] = useState<PharmacyWithDistance | null>(null);

  const items = useMemo(
    () => withDistance(favorites.favorites, location.coordinate),
    [favorites.favorites, location.coordinate]
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <ThemedText type="smallBold">Favoriler</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Sık kullandığınız eczaneler bu cihazda saklanır.
          </ThemedText>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PharmacyCard
              pharmacy={item}
              isFavorite
              onToggleFavorite={() => void favorites.toggle(item)}
              onPress={() => setSelected(item)}
            />
          )}
          ListEmptyComponent={
            favorites.isLoading ? null : (
              <EmptyState
                title="Henüz favori eklemediniz"
                description="Nöbetçi listesinde bir eczanenin yanındaki yıldıza dokunarak buraya ekleyebilirsiniz."
              />
            )
          }
        />
      </View>

      <PharmacyDetailSheet
        pharmacy={selected}
        isFavorite={selected ? favorites.isFavorite(selected.id) : false}
        onToggleFavorite={() => {
          if (selected) {
            void favorites.toggle(selected);
          }
        }}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    paddingTop: Spacing.two,
    gap: Spacing.half,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
  },
});
