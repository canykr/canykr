import { assessLocation, buildStableId, parseLatLng, pickCoordinate, toPharmacy } from '@/services/providers/normalize';

describe('parseLatLng', () => {
  it('virgülle ayrılmış koordinat metnini çözer', () => {
    expect(parseLatLng('41.0082,28.9784')).toEqual({ latitude: 41.0082, longitude: 28.9784 });
  });

  it('boşluklu yazımı da çözer', () => {
    expect(parseLatLng(' 39.92 , 32.85 ')).toEqual({ latitude: 39.92, longitude: 32.85 });
  });

  it('geçersiz girdilerde null verir', () => {
    expect(parseLatLng('41.0082')).toBeNull();
    expect(parseLatLng('abc,def')).toBeNull();
    expect(parseLatLng(null)).toBeNull();
    expect(parseLatLng('0,0')).toBeNull();
  });
});

describe('pickCoordinate', () => {
  it('tek alanda gelen koordinatı okur (CollectAPI biçimi)', () => {
    expect(pickCoordinate({ loc: '41.0082,28.9784' })).toEqual({
      latitude: 41.0082,
      longitude: 28.9784,
    });
  });

  it('ayrı alanlarda gelen koordinatı okur', () => {
    expect(pickCoordinate({ latitude: '39.92', longitude: '32.85' })).toEqual({
      latitude: 39.92,
      longitude: 32.85,
    });
  });

  it('Türkçe alan adlarını da okur', () => {
    expect(pickCoordinate({ enlem: 38.42, boylam: 27.14 })).toEqual({
      latitude: 38.42,
      longitude: 27.14,
    });
  });

  it('koordinat yoksa null verir', () => {
    expect(pickCoordinate({ name: 'Eczane' })).toBeNull();
  });
});

describe('assessLocation', () => {
  it('ile yakın koordinatı kesin sayar', () => {
    const result = assessLocation({ latitude: 41.0082, longitude: 28.9784 }, 'İstanbul');
    expect(result.quality).toBe('exact');
  });

  it('ilinden çok uzak koordinatı şüpheli sayar', () => {
    // Van koordinatı İstanbul kaydında geldiyse veri hatalıdır.
    const result = assessLocation({ latitude: 38.4891, longitude: 43.4089 }, 'İstanbul');
    expect(result.quality).toBe('approximate');
  });

  it('Türkiye dışındaki koordinatı il merkezine çeker', () => {
    const result = assessLocation({ latitude: 52.52, longitude: 13.405 }, 'Ankara');
    expect(result.quality).toBe('approximate');
    expect(result.location?.latitude).toBeCloseTo(39.9334, 3);
  });

  it('koordinat yoksa il merkezini yaklaşık konum olarak verir', () => {
    const result = assessLocation(null, 'İzmir');
    expect(result.quality).toBe('approximate');
    expect(result.location?.longitude).toBeCloseTo(27.1428, 3);
  });

  it('tanınmayan ilde koordinat yoksa konumu bilinmez sayar', () => {
    const result = assessLocation(null, 'Olmayanşehir');
    expect(result.quality).toBe('unknown');
    expect(result.location).toBeNull();
  });
});

describe('buildStableId', () => {
  it('aynı eczane için her seferinde aynı kimliği üretir', () => {
    const first = buildStableId('collectapi', 'İstanbul', 'Kadıköy', 'Papatya Eczanesi');
    const second = buildStableId('collectapi', 'İstanbul', 'Kadıköy', 'Papatya Eczanesi');
    expect(first).toBe(second);
  });

  it('farklı eczaneler için farklı kimlik üretir', () => {
    expect(buildStableId('collectapi', 'İstanbul', 'Kadıköy', 'Papatya Eczanesi')).not.toBe(
      buildStableId('collectapi', 'İstanbul', 'Kadıköy', 'Deniz Eczanesi')
    );
  });
});

describe('toPharmacy', () => {
  it('ham kaydı uygulamanın veri modeline çevirir', () => {
    const pharmacy = toPharmacy(
      {
        name: 'papatya eczanesi',
        address: '  Caferağa   Mah. No:1 ',
        phone: '0216 000 00 01',
        city: 'istanbul',
        district: 'kadıköy',
        coordinate: { latitude: 40.9903, longitude: 29.0273 },
      },
      { providerId: 'collectapi', dutyDate: new Date(2026, 8, 12) }
    );

    expect(pharmacy.name).toBe('Papatya Eczanesi');
    expect(pharmacy.city).toBe('İstanbul');
    expect(pharmacy.address).toBe('Caferağa Mah. No:1');
    expect(pharmacy.source).toBe('api');
    expect(pharmacy.locationQuality).toBe('exact');
    expect(pharmacy.duties).toHaveLength(1);
    expect(pharmacy.duties[0].date).toBe('2026-09-12');
  });

  it('API saat vermediğinde vardiyayı bildirilmemiş olarak işaretler', () => {
    const pharmacy = toPharmacy(
      {
        name: 'Deniz Eczanesi',
        address: 'Örnek Cad. No:2',
        phone: '0216 000 00 02',
        city: 'İstanbul',
        district: 'Beşiktaş',
        coordinate: null,
      },
      { providerId: 'collectapi' }
    );

    expect(pharmacy.duties[0].declared).toBe(false);
    expect(pharmacy.locationQuality).toBe('approximate');
  });

  it('API saat verdiğinde vardiyayı bildirilmiş sayar', () => {
    const pharmacy = toPharmacy(
      {
        name: 'Şifa Eczanesi',
        address: 'Örnek Cad. No:3',
        phone: '0312 000 00 03',
        city: 'Ankara',
        district: 'Çankaya',
        coordinate: { latitude: 39.92, longitude: 32.85 },
        startTime: '09:00',
        endTime: '19:00',
      },
      { providerId: 'custom' }
    );

    expect(pharmacy.duties[0]).toMatchObject({
      startTime: '09:00',
      endTime: '19:00',
      declared: true,
    });
  });
});
