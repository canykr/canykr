import {
  dropPastShifts,
  formatShift,
  isOnDutyAt,
  isShiftActiveAt,
  isValidDateString,
  isValidTimeString,
  nextShiftAfter,
  normalizeShifts,
  remainingDutyLabel,
  toDateString,
} from '@/lib/duty';
import type { DutyShift, Pharmacy } from '@/services/types';

function shift(date: string, startTime: string, endTime: string): DutyShift {
  return { date, startTime, endTime, declared: true };
}

function pharmacyWith(duties: DutyShift[]): Pharmacy {
  return {
    id: 'test',
    name: 'Test Eczanesi',
    city: 'Ankara',
    district: 'Çankaya',
    address: 'Test adresi',
    phone: '0312 000 00 00',
    location: { latitude: 39.92, longitude: 32.85 },
    source: 'pharmacy',
    locationQuality: 'exact',
    updatedAt: new Date().toISOString(),
    duties,
  };
}

describe('tarih ve saat doğrulama', () => {
  it('geçerli tarihleri kabul eder', () => {
    expect(isValidDateString('2026-09-12')).toBe(true);
  });

  it('takvimde olmayan tarihleri reddeder', () => {
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('12.09.2026')).toBe(false);
  });

  it('saat biçimini doğrular', () => {
    expect(isValidTimeString('18:30')).toBe(true);
    expect(isValidTimeString('08:05')).toBe(true);
    expect(isValidTimeString('24:00')).toBe(false);
    expect(isValidTimeString('9:00')).toBe(false);
  });
});

describe('toDateString', () => {
  it('yerel saate göre YYYY-MM-DD üretir', () => {
    expect(toDateString(new Date(2026, 8, 5, 23, 30))).toBe('2026-09-05');
  });
});

describe('isShiftActiveAt', () => {
  const overnight = shift('2026-09-12', '18:30', '08:30');

  it('vardiya başlamadan önce nöbetçi saymaz', () => {
    expect(isShiftActiveAt(overnight, new Date(2026, 8, 12, 17, 0))).toBe(false);
  });

  it('vardiya içinde nöbetçi sayar', () => {
    expect(isShiftActiveAt(overnight, new Date(2026, 8, 12, 20, 0))).toBe(true);
  });

  it('gece yarısını aşan vardiyayı ertesi sabaha taşır', () => {
    expect(isShiftActiveAt(overnight, new Date(2026, 8, 13, 7, 0))).toBe(true);
  });

  it('vardiya bittikten sonra nöbetçi saymaz', () => {
    expect(isShiftActiveAt(overnight, new Date(2026, 8, 13, 9, 0))).toBe(false);
  });

  it('tam gün vardiyayı destekler', () => {
    const allDay = shift('2026-09-12', '00:00', '23:59');
    expect(isShiftActiveAt(allDay, new Date(2026, 8, 12, 12, 0))).toBe(true);
  });

  it('bozuk vardiya verisini nöbetçi saymaz', () => {
    expect(isShiftActiveAt(shift('bozuk', '18:30', '08:30'), new Date())).toBe(false);
    expect(isShiftActiveAt(shift('2026-09-12', '99:99', '08:30'), new Date())).toBe(false);
  });
});

describe('isOnDutyAt', () => {
  it('vardiyalardan biri aktifse nöbetçi sayar', () => {
    const pharmacy = pharmacyWith([
      shift('2026-09-10', '18:30', '08:30'),
      shift('2026-09-12', '18:30', '08:30'),
    ]);
    expect(isOnDutyAt(pharmacy, new Date(2026, 8, 12, 22, 0))).toBe(true);
  });

  it('hiç vardiyası yoksa nöbetçi saymaz', () => {
    expect(isOnDutyAt(pharmacyWith([]), new Date())).toBe(false);
  });
});

describe('nextShiftAfter', () => {
  it('gelecekteki en yakın vardiyayı verir', () => {
    const pharmacy = pharmacyWith([
      shift('2026-09-20', '18:30', '08:30'),
      shift('2026-09-15', '18:30', '08:30'),
    ]);
    expect(nextShiftAfter(pharmacy, new Date(2026, 8, 12))?.date).toBe('2026-09-15');
  });

  it('gelecekte vardiya yoksa null verir', () => {
    const pharmacy = pharmacyWith([shift('2026-09-01', '18:30', '08:30')]);
    expect(nextShiftAfter(pharmacy, new Date(2026, 8, 12))).toBeNull();
  });
});

describe('remainingDutyLabel', () => {
  it('kalan süreyi saat ve dakika olarak yazar', () => {
    const pharmacy = pharmacyWith([shift('2026-09-12', '18:30', '08:30')]);
    expect(remainingDutyLabel(pharmacy, new Date(2026, 8, 12, 20, 0))).toBe(
      '12 sa 30 dk sonra bitiyor'
    );
  });

  it('bir saatin altında yalnızca dakika yazar', () => {
    const pharmacy = pharmacyWith([shift('2026-09-12', '18:30', '20:00')]);
    expect(remainingDutyLabel(pharmacy, new Date(2026, 8, 12, 19, 35))).toBe('25 dk sonra bitiyor');
  });

  it('nöbette değilse null verir', () => {
    const pharmacy = pharmacyWith([shift('2026-09-12', '18:30', '20:00')]);
    expect(remainingDutyLabel(pharmacy, new Date(2026, 8, 12, 9, 0))).toBeNull();
  });
});

describe('formatShift', () => {
  it('vardiyayı okunur biçimde yazar', () => {
    expect(formatShift(shift('2026-09-12', '18:30', '08:30'))).toBe('12 Eylül · 18:30 - 08:30');
  });
});

describe('normalizeShifts', () => {
  it('aynı güne ait vardiyaları teke indirir ve sıralar', () => {
    const result = normalizeShifts([
      shift('2026-09-14', '18:30', '08:30'),
      shift('2026-09-12', '18:30', '08:30'),
      shift('2026-09-12', '09:00', '18:00'),
    ]);
    expect(result.map((entry) => entry.date)).toEqual(['2026-09-12', '2026-09-14']);
    expect(result[0].startTime).toBe('09:00');
  });
});

describe('dropPastShifts', () => {
  it('bitmiş vardiyaları atar, sürmekte olanı korur', () => {
    const result = dropPastShifts(
      [shift('2026-09-01', '18:30', '08:30'), shift('2026-09-12', '18:30', '08:30')],
      new Date(2026, 8, 12, 22, 0)
    );
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-09-12');
  });
});
