import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/city-picker';
import { PharmacyCard } from '@/components/pharmacy-card';
import { PharmacyDetailSheet } from '@/components/pharmacy-detail-sheet';
import { ThemedText } from '@/components/themed-text';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { CITIES, findCityByName } from '@/data/cities';
import { useFavorites } from '@/hooks/use-favorites';
import { useLocation } from '@/hooks/use-location';
import { loadLastCity, usePharmacies } from '@/hooks/use-pharmacies';
import { useTheme } from '@/hooks/use-theme';
import { distanceInMeters } from '@/lib/geo';
import {
  districtsOf,
  filterPharmacies,
  sortByRelevance,
  withDistance,
} from '@/services/pharmacy-repository';
import type { Coordinate, PharmacyWithDistance } from '@/services/types';

/** Konuma en yakın il merkezini bulur (ters coğrafi kodlama başarısız olursa). */
function nearestCity(coordinate: Coordinate): string {
  let closest = CITIES[0];
  let shortest = Number.POSITIVE_INFINITY;

  for (const city of CITIES) {
    const distance = distanceInMeters(coordinate, city.center);
    if (distance < shortest) {
      shortest = distance;
      closest = city;
    }
  }

  return closest.name;
}

export default function NearbyScreen() {
  const theme = useTheme();
  const location = useLocation();
  const favorites = useFavorites();

  // Kullanıcının açıkça seçtiği il; boşsa kayıtlı ya da konumdan çözülen il kullanılır.
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [storedCity, setStoredCity] = useState<string | null>(null);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [onlyOnDuty, setOnlyOnDuty] = useState(true);
  const [selected, setSelected] = useState<PharmacyWithDistance | null>(null);

  /** Konumdan çözülen il: önce ters coğrafi kodlama, olmazsa en yakın il merkezi. */
  const cityFromLocation = useMemo(() => {
    const resolved = location.cityName ? findCityByName(location.cityName) : undefined;
    if (resolved) {
      return resolved.name;
    }
    return location.coordinate ? nearestCity(location.coordinate) : null;
  }, [location.cityName, location.coordinate]);

  // Öncelik sırası: kullanıcının seçimi > en son kullanılan il > konumdan çözülen il.
  const city = selectedCity ?? storedCity ?? cityFromLocation;

  const { pharmacies, status, error, fromCache, isLive, attribution, reload } = usePharmacies(city);

  // En son kullanılan ili hatırla; kullanıcı uygulamayı açtığında oradan başlasın.
  useEffect(() => {
    let cancelled = false;
    void loadLastCity().then((stored) => {
      if (!cancelled && stored) {
        setStoredCity(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const districts = useMemo(() => districtsOf(pharmacies), [pharmacies]);

  const visible = useMemo(() => {
    const withDistances = withDistance(pharmacies, location.coordinate);
    const filtered = filterPharmacies(withDistances, {
      search,
      district: district ?? undefined,
      onlyOnDuty,
    });
    return sortByRelevance(filtered);
  }, [pharmacies, location.coordinate, search, district, onlyOnDuty]);

  const handleRefresh = useCallback(() => {
    void reload();
  }, [reload]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <ThemedText type="smallBold">Nöbetçi Eczaneler</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {city ?? 'İl seçilmedi'}
              {location.coordinate ? ' · konumunuza göre sıralı' : ''}
            </ThemedText>
          </View>
          <Button label="İl değiştir" variant="secondary" onPress={() => setPickerVisible(true)} />
        </View>

        <TextInput
          accessibilityLabel="Eczane, ilçe ya da adres ara"
          placeholder="Eczane, ilçe ya da adres ara"
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={[
            styles.search,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />

        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={status === 'loading' && pharmacies.length > 0}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {!isLive ? (
                <Banner
                  tone="warning"
                  title="Örnek veri gösteriliyor"
                  description="Gerçek nöbetçi eczane verisi için uygulamaya bir API anahtarı tanımlayın. Ayrıntılar README dosyasında."
                />
              ) : null}

              {error ? (
                <Banner
                  tone={pharmacies.length > 0 ? 'warning' : 'danger'}
                  title={pharmacies.length > 0 ? 'Güncel veri alınamadı' : 'Veri alınamadı'}
                  description={
                    pharmacies.length > 0
                      ? `${error} Elinizdeki son kayıtlar gösteriliyor.`
                      : error
                  }
                />
              ) : null}

              {fromCache && !error ? (
                <Banner
                  tone="info"
                  title="Kayıtlı veri gösteriliyor"
                  description="Aşağı çekerek güncelleyebilirsiniz."
                />
              ) : null}

              {location.error ? (
                <Banner tone="info" title="Konum kullanılamıyor" description={location.error} />
              ) : null}

              <View style={styles.filters}>
                <Chip
                  label={onlyOnDuty ? 'Sadece nöbetçiler ✓' : 'Sadece nöbetçiler'}
                  selected={onlyOnDuty}
                  onPress={() => setOnlyOnDuty((value) => !value)}
                />
                {districts.map((entry) => (
                  <Chip
                    key={entry}
                    label={entry}
                    selected={district === entry}
                    onPress={() => setDistrict((current) => (current === entry ? null : entry))}
                  />
                ))}
              </View>

              <ThemedText type="small" themeColor="textSecondary">
                {visible.length} eczane · {attribution}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <PharmacyCard
              pharmacy={item}
              isFavorite={favorites.isFavorite(item.id)}
              onToggleFavorite={() => void favorites.toggle(item)}
              onPress={() => setSelected(item)}
            />
          )}
          ListEmptyComponent={
            status === 'loading' ? (
              <View style={styles.loading}>
                <ActivityIndicator color={theme.primary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Nöbetçi eczaneler getiriliyor…
                </ThemedText>
              </View>
            ) : status === 'error' ? (
              <EmptyState
                title="Liste yüklenemedi"
                description={error ?? 'Bağlantınızı kontrol edip tekrar deneyin.'}
                actionLabel="Tekrar dene"
                onAction={handleRefresh}
              />
            ) : (
              <EmptyState
                title="Sonuç yok"
                description={
                  onlyOnDuty
                    ? 'Seçili süzgeçlerle nöbetçi eczane bulunamadı. Süzgeçleri gevşetmeyi deneyin.'
                    : 'Bu il için kayıt bulunamadı. Başka bir il seçebilirsiniz.'
                }
                actionLabel="Süzgeçleri temizle"
                onAction={() => {
                  setSearch('');
                  setDistrict(null);
                  setOnlyOnDuty(false);
                }}
              />
            )
          }
        />
      </View>

      <CityPicker
        visible={isPickerVisible}
        selected={city}
        onSelect={(value) => {
          setSelectedCity(value);
          setDistrict(null);
        }}
        onClose={() => setPickerVisible(false)}
      />

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
  search: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  listHeader: {
    gap: Spacing.two,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  loading: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
});
