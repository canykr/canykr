/**
 * Kod incelemesinde bulunan hatalar için yazılan testler.
 * Her biri, düzeltmeden önce başarısız olan bir davranışı sabitler.
 */
import { findCityByName } from '@/data/cities';
import { readTimeout } from '@/services/config';
import { extractRows } from '@/services/providers/custom';
import { assessLocation, toPharmacy } from '@/services/providers/normalize';
import { mergePharmacies, withDistance, withinRadius } from '@/services/pharmacy-repository';
import type { Pharmacy } from '@/services/types';

function make(overrides: Partial<Pharmacy> & { name: string }): Pharmacy {
  return {
    id: overrides.name,
    city: 'İstanbul',
    district: 'Kadıköy',
    address: 'Örnek adres',
    phone: '0216 000 00 00',
    location: { latitude: 40.99, longitude: 29.02 },
    source: 'api',
    locationQuality: 'exact',
    updatedAt: '2026-09-12T18:00:00.000Z',
    duties: [{ date: '2026-09-12', startTime: '18:30', endTime: '08:30', declared: true }],
    ...overrides,
  };
}

describe('il adı eş anlamlıları', () => {
  it('kısa adları tam il adına çözer', () => {
    expect(findCityByName('Afyon')?.name).toBe('Afyonkarahisar');
    expect(findCityByName('Antep')?.name).toBe('Gaziantep');
    expect(findCityByName('Urfa')?.name).toBe('Şanlıurfa');
    expect(findCityByName('İçel')?.name).toBe('Mersin');
  });

  it('tam adları çözmeye devam eder', () => {
    expect(findCityByName('İstanbul')?.code).toBe(34);
    expect(findCityByName('  ankara  ')?.code).toBe(6);
  });

  it('tanınmayan adda undefined verir', () => {
    expect(findCityByName('Olmayanşehir')).toBeUndefined();
  });
});

describe('zaman aşımı yapılandırması', () => {
  it('geçerli değeri kullanır', () => {
    expect(readTimeout('5000')).toBe(5000);
  });

  it('sayı olmayan değerde varsayılana düşer', () => {
    // NaN, setTimeout tarafından 0'a yuvarlanır ve her istek anında iptal olurdu.
    expect(readTimeout('abc')).toBe(12_000);
    expect(readTimeout('')).toBe(12_000);
    expect(readTimeout(undefined)).toBe(12_000);
  });

  it('sıfır ve negatif değerleri reddeder', () => {
    expect(readTimeout('0')).toBe(12_000);
    expect(readTimeout('-100')).toBe(12_000);
  });
});

describe('custom sağlayıcı yanıt çözümlemesi', () => {
  it('düz diziyi kabul eder', () => {
    expect(extractRows([{ name: 'A' }])).toHaveLength(1);
  });

  it('data alanındaki diziyi kabul eder', () => {
    expect(extractRows({ data: [{ name: 'A' }] })).toHaveLength(1);
  });

  it('JSON null gövdesinde çökmeden null verir', () => {
    expect(extractRows(null)).toBeNull();
  });

  it('beklenmeyen biçimlerde null verir', () => {
    expect(extractRows({ data: 'olmadı' })).toBeNull();
    expect(extractRows(42)).toBeNull();
    expect(extractRows(undefined)).toBeNull();
  });
});

describe('koordinatsız kayıtlar', () => {
  it('tanınmayan ilde konumu null bırakır, (0,0) üretmez', () => {
    const pharmacy = toPharmacy(
      {
        name: 'Bilinmeyen Eczanesi',
        address: 'Bir adres',
        phone: '0000',
        city: 'Olmayanşehir',
        district: 'Merkez',
        coordinate: null,
      },
      { providerId: 'test' }
    );

    expect(pharmacy.location).toBeNull();
    expect(pharmacy.locationQuality).toBe('unknown');
  });

  it('eş anlamlı il adında merkez koordinatına düşer', () => {
    const result = assessLocation(null, 'Afyon');
    expect(result.quality).toBe('approximate');
    expect(result.location?.latitude).toBeCloseTo(38.7507, 3);
  });

  it('mesafe hesabında konumsuz kaydı null bırakır', () => {
    const result = withDistance([make({ name: 'Konumsuz', location: null })], {
      latitude: 41,
      longitude: 29,
    });
    expect(result[0].distanceMeters).toBeNull();
  });

  it('bölge aramasında konumsuz kaydı dışarıda bırakır', () => {
    const result = withinRadius(
      [
        make({ name: 'Konumlu', location: { latitude: 41.0, longitude: 29.0 } }),
        make({ name: 'Konumsuz', id: 'k2', location: null }),
      ],
      { latitude: 41.0, longitude: 29.0 },
      5_000
    );
    expect(result.map((entry) => entry.name)).toEqual(['Konumlu']);
  });
});

describe('sağlayıcıdan gelen tekrarlı kayıtlar', () => {
  it('aynı eczanenin iki satırında nöbet günlerini birleştirir', () => {
    const merged = mergePharmacies(
      [
        make({
          name: 'Papatya Eczanesi',
          duties: [{ date: '2026-09-12', startTime: '18:30', endTime: '08:30', declared: false }],
        }),
        make({
          name: 'Papatya Eczanesi',
          id: 'ikinci-satir',
          duties: [{ date: '2026-09-13', startTime: '18:30', endTime: '08:30', declared: false }],
        }),
      ],
      []
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].duties.map((duty) => duty.date).sort()).toEqual([
      '2026-09-12',
      '2026-09-13',
    ]);
  });

  it('aynı günü iki kez eklemez', () => {
    const merged = mergePharmacies(
      [make({ name: 'Papatya Eczanesi' }), make({ name: 'Papatya Eczanesi', id: 'ikinci' })],
      []
    );
    expect(merged[0].duties).toHaveLength(1);
  });
});
