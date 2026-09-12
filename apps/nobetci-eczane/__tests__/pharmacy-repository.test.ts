import {
  districtsOf,
  filterPharmacies,
  mergePharmacies,
  sortByRelevance,
  withDistance,
  withinRadius,
} from '@/services/pharmacy-repository';
import type { Pharmacy } from '@/services/types';

const NOW = new Date(2026, 8, 12, 22, 0);
const TODAY = '2026-09-12';

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
    updatedAt: NOW.toISOString(),
    duties: [{ date: TODAY, startTime: '18:30', endTime: '08:30', declared: true }],
    ...overrides,
  };
}

describe('mergePharmacies', () => {
  it('panelden gelen kaydı API kaydının önüne geçirir', () => {
    const fromApi = [
      make({ name: 'Papatya Eczanesi', locationQuality: 'approximate', phone: '0216 111 11 11' }),
    ];
    const fromPanel = [
      make({
        name: 'Papatya Eczanesi',
        id: 'panel-1',
        source: 'pharmacy',
        phone: '0216 222 22 22',
        location: { latitude: 40.9903, longitude: 29.0273 },
      }),
    ];

    const merged = mergePharmacies(fromApi, fromPanel);

    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe('pharmacy');
    expect(merged[0].phone).toBe('0216 222 22 22');
  });

  it('panel kaydı API nöbet günlerini korur', () => {
    const fromApi = [
      make({
        name: 'Papatya Eczanesi',
        duties: [{ date: '2026-09-20', startTime: '18:30', endTime: '08:30', declared: false }],
      }),
    ];
    const fromPanel = [make({ name: 'Papatya Eczanesi', id: 'panel-1', source: 'pharmacy' })];

    const merged = mergePharmacies(fromApi, fromPanel);

    expect(merged[0].duties.map((duty) => duty.date).sort()).toEqual(['2026-09-12', '2026-09-20']);
  });

  it('farklı eczaneleri birleştirmez', () => {
    const merged = mergePharmacies(
      [make({ name: 'Papatya Eczanesi' })],
      [make({ name: 'Deniz Eczanesi', id: 'panel-2', source: 'pharmacy' })]
    );
    expect(merged).toHaveLength(2);
  });

  it('aynı adı farklı ilçelerde ayrı tutar', () => {
    const merged = mergePharmacies(
      [make({ name: 'Merkez Eczanesi', district: 'Kadıköy' })],
      [make({ name: 'Merkez Eczanesi', id: 'p', district: 'Şişli', source: 'pharmacy' })]
    );
    expect(merged).toHaveLength(2);
  });
});

describe('withDistance', () => {
  it('konum verilmediğinde mesafeyi null bırakır', () => {
    const result = withDistance([make({ name: 'Papatya Eczanesi' })], null);
    expect(result[0].distanceMeters).toBeNull();
  });

  it('konum verildiğinde mesafeyi hesaplar', () => {
    const result = withDistance([make({ name: 'Papatya Eczanesi' })], {
      latitude: 41.0422,
      longitude: 29.0083,
    });
    expect(result[0].distanceMeters).toBeGreaterThan(0);
  });
});

describe('filterPharmacies', () => {
  const list = withDistance(
    [
      make({ name: 'Papatya Eczanesi', district: 'Kadıköy' }),
      make({ name: 'Deniz Eczanesi', district: 'Beşiktaş', id: 'deniz' }),
      make({
        name: 'Kapalı Eczanesi',
        district: 'Kadıköy',
        id: 'kapali',
        duties: [{ date: '2026-09-01', startTime: '18:30', endTime: '08:30', declared: true }],
      }),
    ],
    null
  );

  it('yalnızca nöbetçileri süzer', () => {
    const result = filterPharmacies(list, { onlyOnDuty: true }, NOW);
    expect(result.map((entry) => entry.name)).toEqual(['Papatya Eczanesi', 'Deniz Eczanesi']);
  });

  it('ilçeye göre süzer', () => {
    const result = filterPharmacies(list, { district: 'Beşiktaş' }, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Deniz Eczanesi');
  });

  it('Türkçe karakter farkını yok sayarak arar', () => {
    const result = filterPharmacies(list, { search: 'besiktas' }, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Deniz Eczanesi');
  });

  it('eczane adında arama yapar', () => {
    const result = filterPharmacies(list, { search: 'papatya' }, NOW);
    expect(result).toHaveLength(1);
  });

  it('eşleşme yoksa boş liste verir', () => {
    expect(filterPharmacies(list, { search: 'olmayan' }, NOW)).toHaveLength(0);
  });
});

describe('sortByRelevance', () => {
  it('nöbetçileri öne, sonra yakınları başa alır', () => {
    const origin = { latitude: 41.0, longitude: 29.0 };
    const list = withDistance(
      [
        make({
          name: 'Uzak Nöbetçi',
          location: { latitude: 41.2, longitude: 29.3 },
          id: 'uzak',
        }),
        make({
          name: 'Yakın Kapalı',
          id: 'kapali',
          location: { latitude: 41.001, longitude: 29.001 },
          duties: [{ date: '2026-09-01', startTime: '18:30', endTime: '08:30', declared: true }],
        }),
        make({
          name: 'Yakın Nöbetçi',
          id: 'yakin',
          location: { latitude: 41.01, longitude: 29.01 },
        }),
      ],
      origin
    );

    const sorted = sortByRelevance(list, NOW);
    expect(sorted.map((entry) => entry.name)).toEqual([
      'Yakın Nöbetçi',
      'Uzak Nöbetçi',
      'Yakın Kapalı',
    ]);
  });

  it('girdi dizisini değiştirmez', () => {
    const list = withDistance([make({ name: 'B' }), make({ name: 'A', id: 'a' })], null);
    const before = list.map((entry) => entry.name);
    sortByRelevance(list, NOW);
    expect(list.map((entry) => entry.name)).toEqual(before);
  });
});

describe('withinRadius', () => {
  it('seçilen nokta çevresindeki eczaneleri verir', () => {
    const center = { latitude: 41.0, longitude: 29.0 };
    const result = withinRadius(
      [
        make({ name: 'Yakın', location: { latitude: 41.005, longitude: 29.005 } }),
        make({ name: 'Uzak', id: 'uzak', location: { latitude: 41.5, longitude: 29.5 } }),
      ],
      center,
      5_000
    );

    expect(result.map((entry) => entry.name)).toEqual(['Yakın']);
    expect(result[0].distanceMeters).not.toBeNull();
  });
});

describe('districtsOf', () => {
  it('benzersiz ilçeleri alfabetik verir', () => {
    const result = districtsOf([
      make({ name: 'A', district: 'Şişli' }),
      make({ name: 'B', district: 'Kadıköy' }),
      make({ name: 'C', district: 'Kadıköy' }),
    ]);
    expect(result).toEqual(['Kadıköy', 'Şişli']);
  });
});
