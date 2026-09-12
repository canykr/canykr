import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { MapCanvas, isMapAvailable } from '@/components/map-canvas';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { findCityByName } from '@/data/cities';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isValidCoordinate } from '@/lib/geo';
import type { Coordinate } from '@/services/types';

export type LocationPickerProps = {
  value: Coordinate | null;
  onChange: (coordinate: Coordinate) => void;
  /** Harita ilk açıldığında ortalanacak il. */
  city: string | null;
  error?: string;
};

const FALLBACK_CENTER: Coordinate = { latitude: 39.9334, longitude: 32.8597 };

/**
 * Eczanenin kendi konumunu haritadan işaretlemesini sağlar.
 *
 * Haritanın ortasında sabit bir artı işareti durur; kullanıcı haritayı
 * kaydırdıkça seçilen nokta güncellenir. Haritaya dokunarak da nokta
 * konulabilir. Harita modülü yoksa koordinatlar elle girilebilir.
 */
export function LocationPicker({ value, onChange, city, error }: LocationPickerProps) {
  const theme = useTheme();
  const [isLocating, setIsLocating] = useState(false);

  const center = value ?? findCityByName(city ?? '')?.center ?? FALLBACK_CENTER;

  const pickCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Konum izni gerekli',
          'Eczanenizin konumunu otomatik almak için konum iznine ihtiyaç var. Dilerseniz haritadan elle de işaretleyebilirsiniz.'
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.High,
      });
      onChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      Alert.alert('Konum alınamadı', 'Haritadan elle işaretleyebilirsiniz.');
    } finally {
      setIsLocating(false);
    }
  }, [onChange]);

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">Eczanenin konumu</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Haritayı kaydırarak artı işaretini eczanenin kapısına getirin. Doğru konum,
        hastanın sizi bulabilmesi için en kritik bilgi.
      </ThemedText>

      <View style={[styles.mapWrapper, { borderColor: error ? theme.danger : theme.border }]}>
        <MapCanvas
          center={center}
          zoom={16}
          showsUserLocation
          markers={
            value ? [{ id: 'secilen', coordinate: value, title: 'Eczane', highlighted: true }] : []
          }
          onMapPress={onChange}
          onRegionChange={onChange}
        />
        {isMapAvailable() ? (
          <View pointerEvents="none" style={styles.crosshair}>
            <ThemedText style={[styles.crosshairText, { color: theme.primary }]}>✛</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label="Konumumu kullan"
          variant="secondary"
          loading={isLocating}
          onPress={() => void pickCurrentLocation()}
          style={styles.grow}
        />
      </View>

      {isMapAvailable() ? null : (
        <View style={styles.manual}>
          <Field
            label="Enlem"
            keyboardType="numbers-and-punctuation"
            value={value ? String(value.latitude) : ''}
            placeholder="41.0082"
            onChangeText={(text) => {
              const latitude = Number(text.replace(',', '.'));
              const next = { latitude, longitude: value?.longitude ?? 0 };
              if (isValidCoordinate(next)) {
                onChange(next);
              }
            }}
          />
          <Field
            label="Boylam"
            keyboardType="numbers-and-punctuation"
            value={value ? String(value.longitude) : ''}
            placeholder="28.9784"
            onChangeText={(text) => {
              const longitude = Number(text.replace(',', '.'));
              const next = { latitude: value?.latitude ?? 0, longitude };
              if (isValidCoordinate(next)) {
                onChange(next);
              }
            }}
          />
        </View>
      )}

      {value ? (
        <ThemedText type="small" themeColor="textSecondary">
          Seçilen nokta: {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </ThemedText>
      ) : null}

      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  mapWrapper: {
    height: 260,
    borderWidth: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  crosshair: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairText: {
    fontSize: 32,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  grow: {
    flex: 1,
  },
  manual: {
    gap: Spacing.two,
  },
});
