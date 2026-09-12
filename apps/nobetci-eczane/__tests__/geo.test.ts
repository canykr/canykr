import { distanceInMeters, formatDistance, isValidCoordinate } from '@/lib/geo';

describe('distanceInMeters', () => {
  it('aynı nokta için sıfır döner', () => {
    const point = { latitude: 41.0082, longitude: 28.9784 };
    expect(distanceInMeters(point, point)).toBe(0);
  });

  it('Kadıköy - Beşiktaş arasını makul bir değerde hesaplar', () => {
    const kadikoy = { latitude: 40.9903, longitude: 29.0273 };
    const besiktas = { latitude: 41.0422, longitude: 29.0083 };
    const distance = distanceInMeters(kadikoy, besiktas);

    // Kuş uçuşu yaklaşık 6 km.
    expect(distance).toBeGreaterThan(5_000);
    expect(distance).toBeLessThan(7_000);
  });

  it('simetriktir', () => {
    const a = { latitude: 39.9334, longitude: 32.8597 };
    const b = { latitude: 38.4237, longitude: 27.1428 };
    expect(distanceInMeters(a, b)).toBeCloseTo(distanceInMeters(b, a), 6);
  });
});

describe('formatDistance', () => {
  it('bir kilometrenin altını metre olarak yazar', () => {
    expect(formatDistance(340)).toBe('340 m');
  });

  it('yakın mesafeleri virgüllü kilometre olarak yazar', () => {
    expect(formatDistance(2_450)).toBe('2,5 km');
  });

  it('uzak mesafeleri tam kilometre olarak yazar', () => {
    expect(formatDistance(24_500)).toBe('25 km');
  });

  it('mesafe bilinmiyorsa tire gösterir', () => {
    expect(formatDistance(null)).toBe('—');
  });
});

describe('isValidCoordinate', () => {
  it('geçerli koordinatı kabul eder', () => {
    expect(isValidCoordinate({ latitude: 41, longitude: 29 })).toBe(true);
  });

  it('sınır dışı değerleri reddeder', () => {
    expect(isValidCoordinate({ latitude: 91, longitude: 29 })).toBe(false);
    expect(isValidCoordinate({ latitude: 41, longitude: 181 })).toBe(false);
  });

  it('sıfır adasını (0,0) reddeder', () => {
    expect(isValidCoordinate({ latitude: 0, longitude: 0 })).toBe(false);
  });

  it('eksik ya da sayı olmayan değerleri reddeder', () => {
    expect(isValidCoordinate(null)).toBe(false);
    expect(isValidCoordinate({ latitude: Number.NaN, longitude: 29 })).toBe(false);
    expect(isValidCoordinate({ latitude: 41 })).toBe(false);
  });
});
