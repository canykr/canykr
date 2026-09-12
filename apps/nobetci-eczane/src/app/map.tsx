import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapCanvas, isMapAvailable, type MapMarker } from '@/components/map-canvas';
import { PharmacyDetailSheet } from '@/components/pharmacy-detail-sheet';
import { ThemedText } from '@/components/themed-text';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { CITIES } from '@/data/cities';
import { useFavorites } from '@/hooks/use-favorites';
import { useLocation } from '@/hooks/use-location';
import { usePharmacies } from '@/hooks/use-pharmacies';
import { useTheme } from '@/hooks/use-theme';
import { isOnDutyAt } from '@/lib/duty';
import { distanceInMeters, formatDistance } from '@/lib/geo';
import { sortByRelevance, withinRadius } from '@/services/pharmacy-repository';
import type { Coordinate, PharmacyWithDistance } from '@/services/types';

/** "Bu bölgede ara" düğmesinin görünmesi için gereken en küçük kayma. */
const RESEARCH_THRESHOLD_METERS = 2_000;
/** Aramada taranan yarıçap. */
const SEARCH_RADIUS_METERS = 25_000;

const ANKARA: Coordinate = { latitude: 39.9334, longitude: 32.8597 };

function nearestCityTo(coordinate: Coordinate): string {
  return CITIES.reduce((closest, city) =>
    distanceInMeters(coordinate, city.center) < distanceInMeters(coordinate, closest.center)
      ? city
      : closest
  ).name;
}

/**
 * Harita ekranı.
 *
 * Rakip uygulamalarda en çok istenen iki şey burada karşılanıyor:
 * kullanıcı haritayı istediği yere kaydırıp "bu bölgede ara" diyebiliyor
 * (sadece bulunduğu konumla sınırlı değil) ve nöbetçi olmayan kayıtlar
 * haritayı kirletmiyor.
 */
export default function MapScreen() {
  const theme = useTheme();
  const location = useLocation();
  const favorites = useFavorites();

  const [searchCenter, setSearchCenter] = useState<Coordinate | null>(null);
  const [selected, setSelected] = useState<PharmacyWithDistance | null>(null);
  const viewCenter = useRef<Coordinate | null>(null);
  const [canResearch, setCanResearch] = useState(false);

  // Arama merkezi: kullanıcı "bu bölgede ara" dediyse o nokta, yoksa kendi konumu.
  const center = searchCenter ?? location.coordinate ?? ANKARA;
  const city = useMemo(() => nearestCityTo(center), [center]);
  const { pharmacies, status, error, isLive } = usePharmacies(city);

  const results = useMemo(() => {
    const onDuty = pharmacies.filter((pharmacy) => isOnDutyAt(pharmacy));
    return sortByRelevance(withinRadius(onDuty, center, SEARCH_RADIUS_METERS));
  }, [pharmacies, center]);

  const markers: MapMarker[] = useMemo(
    () =>
      results.map((pharmacy) => ({
        id: pharmacy.id,
        coordinate: pharmacy.location,
        title: pharmacy.name,
        highlighted: true,
      })),
    [results]
  );

  const handleRegionChange = useCallback(
    (next: Coordinate) => {
      viewCenter.current = next;
      setCanResearch(distanceInMeters(next, center) > RESEARCH_THRESHOLD_METERS);
    },
    [center]
  );

  const searchHere = useCallback(() => {
    if (viewCenter.current) {
      setSearchCenter(viewCenter.current);
      setCanResearch(false);
    }
  }, []);

  const nearest = results[0] ?? null;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.mapArea}>
        <MapCanvas
          center={center}
          zoom={12}
          markers={markers}
          showsUserLocation
          onRegionChange={handleRegionChange}
          onMarkerPress={(id) => {
            const match = results.find((pharmacy) => pharmacy.id === id);
            if (match) {
              setSelected(match);
            }
          }}
        />

        {canResearch ? (
          <View style={styles.floating}>
            <Button label="Bu bölgede ara" onPress={searchHere} />
          </View>
        ) : null}
      </View>

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {!isLive ? (
          <Banner
            tone="warning"
            title="Örnek veri"
            description="Haritadaki işaretler gerçek eczaneler değildir."
          />
        ) : null}

        {error ? <Banner tone="warning" title="Veri alınamadı" description={error} /> : null}

        <View style={styles.panelHeader}>
          <View style={styles.panelText}>
            <ThemedText type="smallBold">
              {city} çevresinde {results.length} nöbetçi eczane
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDistance(SEARCH_RADIUS_METERS)} yarıçapında arandı
            </ThemedText>
          </View>
          {status === 'loading' ? <ActivityIndicator color={theme.primary} /> : null}
        </View>

        {nearest ? (
          <Button
            label={`En yakını: ${nearest.name} · ${formatDistance(nearest.distanceMeters)}`}
            variant="secondary"
            onPress={() => setSelected(nearest)}
          />
        ) : status === 'ready' ? (
          <ThemedText type="small" themeColor="textSecondary">
            Bu bölgede nöbetçi eczane bulunamadı. Haritayı kaydırıp yeniden arayın.
          </ThemedText>
        ) : null}

        {isMapAvailable() ? (
          <ThemedText type="small" themeColor="textSecondary">
            Haritayı istediğiniz bölgeye kaydırın, üstteki düğmeyle orayı tarayın.
          </ThemedText>
        ) : null}
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
  },
  mapArea: {
    flex: 1,
  },
  floating: {
    position: 'absolute',
    top: Spacing.three,
    alignSelf: 'center',
  },
  panel: {
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  panelText: {
    flex: 1,
    gap: Spacing.half,
  },
});
