import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Coordinate } from '@/services/types';

/**
 * `expo-maps` yerel (native) bir modüldür ve Expo Go içinde bulunmaz;
 * geliştirme derlemesi (`npx expo run:ios` / `run:android`) gerekir.
 * Modül yoksa uygulamanın çökmemesi için içe aktarma korumaya alındı.
 */
type MapsModule = typeof import('expo-maps');

let maps: MapsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  maps = require('expo-maps') as MapsModule;
} catch {
  maps = null;
}

export type MapMarker = {
  id: string;
  coordinate: Coordinate;
  title: string;
  /** Vurgulu (örn. nöbetçi) işaretleri ayırt etmek için. */
  highlighted?: boolean;
};

export type MapCanvasProps = {
  center: Coordinate;
  zoom?: number;
  markers?: MapMarker[];
  onMarkerPress?: (id: string) => void;
  onMapPress?: (coordinate: Coordinate) => void;
  onRegionChange?: (center: Coordinate) => void;
  showsUserLocation?: boolean;
  style?: object;
};

export function isMapAvailable(): boolean {
  if (Platform.OS === 'ios') {
    return Boolean(maps?.AppleMaps?.View);
  }
  if (Platform.OS === 'android') {
    return Boolean(maps?.GoogleMaps?.View);
  }
  return false;
}

export function MapCanvas({
  center,
  zoom = 13,
  markers = [],
  onMarkerPress,
  onMapPress,
  onRegionChange,
  showsUserLocation = true,
  style,
}: MapCanvasProps) {
  const theme = useTheme();

  const cameraPosition = useMemo(
    () => ({ coordinates: center, zoom }),
    [center, zoom]
  );

  if (!isMapAvailable()) {
    return <MapFallback markers={markers} style={style} />;
  }

  if (Platform.OS === 'ios' && maps?.AppleMaps) {
    const { AppleMaps } = maps;
    return (
      <AppleMaps.View
        style={[styles.map, style]}
        cameraPosition={cameraPosition}
        properties={{ isMyLocationEnabled: showsUserLocation }}
        uiSettings={{ myLocationButtonEnabled: showsUserLocation }}
        markers={markers.map((marker) => ({
          id: marker.id,
          coordinates: marker.coordinate,
          title: marker.title,
          systemImage: 'cross.case.fill',
          tintColor: marker.highlighted ? theme.primary : theme.textSecondary,
        }))}
        onMarkerClick={(event) => {
          if (event.id) {
            onMarkerPress?.(event.id);
          }
        }}
        onMapClick={(event) => {
          const { latitude, longitude } = event.coordinates;
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            onMapPress?.({ latitude, longitude });
          }
        }}
        onCameraMove={(event) => {
          const { latitude, longitude } = event.coordinates;
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            onRegionChange?.({ latitude, longitude });
          }
        }}
      />
    );
  }

  if (Platform.OS === 'android' && maps?.GoogleMaps) {
    const { GoogleMaps } = maps;
    return (
      <GoogleMaps.View
        style={[styles.map, style]}
        cameraPosition={cameraPosition}
        properties={{ isMyLocationEnabled: showsUserLocation }}
        uiSettings={{ myLocationButtonEnabled: showsUserLocation }}
        markers={markers.map((marker) => ({
          id: marker.id,
          coordinates: marker.coordinate,
          title: marker.title,
          showCallout: true,
        }))}
        onMarkerClick={(event) => {
          if (event.id) {
            onMarkerPress?.(event.id);
          }
        }}
        onMapClick={(event) => {
          const { latitude, longitude } = event.coordinates;
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            onMapPress?.({ latitude, longitude });
          }
        }}
        onCameraMove={(event) => {
          const { latitude, longitude } = event.coordinates;
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            onRegionChange?.({ latitude, longitude });
          }
        }}
      />
    );
  }

  return <MapFallback markers={markers} style={style} />;
}

/**
 * Harita modülü yokken (Expo Go, web) gösterilen yedek görünüm.
 * Uygulamanın geri kalanı çalışmaya devam eder.
 */
function MapFallback({ markers, style }: { markers: MapMarker[]; style?: object }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.map,
        styles.fallback,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        style,
      ]}>
      <ThemedText type="smallBold">Harita bu ortamda görüntülenemiyor</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.fallbackText}>
        Harita için geliştirme derlemesi gerekiyor: {'\n'}
        <ThemedText type="code">npx expo run:android</ThemedText> ya da{' '}
        <ThemedText type="code">npx expo run:ios</ThemedText>
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Bu bölgede {markers.length} eczane işaretlendi.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  fallback: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  fallbackText: {
    textAlign: 'center',
  },
});
