import type { Coordinate } from '@/services/types';

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * İki koordinat arasındaki kuş uçuşu mesafeyi metre cinsinden hesaplar
 * (haversine formülü).
 */
export function distanceInMeters(from: Coordinate, to: Coordinate): number {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.sin(deltaLon / 2) ** 2 * Math.cos(fromLat) * Math.cos(toLat);

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Mesafeyi kullanıcıya gösterilecek biçime çevirir. */
export function formatDistance(meters: number | null): string {
  if (meters === null || !Number.isFinite(meters)) {
    return '—';
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  if (meters < 10_000) {
    return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
  }
  return `${Math.round(meters / 1000)} km`;
}

/** Koordinatın Dünya üzerinde geçerli bir nokta olup olmadığını doğrular. */
export function isValidCoordinate(value: Partial<Coordinate> | null | undefined): value is Coordinate {
  if (!value) {
    return false;
  }
  const { latitude, longitude } = value;
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}
