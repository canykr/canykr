import { hasErrors, validatePharmacyDraft } from '@/lib/validation';
import type { PharmacyDraft } from '@/services/types';

function validDraft(): PharmacyDraft {
  return {
    name: 'Papatya Eczanesi',
    pharmacistName: 'Ecz. Ayşe Yılmaz',
    city: 'İstanbul',
    district: 'Kadıköy',
    address: 'Caferağa Mah. Örnek Sok. No:1',
    phone: '0216 123 45 67',
    location: { latitude: 40.9903, longitude: 29.0273 },
    duties: [],
  };
}

describe('validatePharmacyDraft', () => {
  it('eksiksiz formu geçerli sayar', () => {
    expect(hasErrors(validatePharmacyDraft(validDraft()))).toBe(false);
  });

  it('kısa eczane adını reddeder', () => {
    const errors = validatePharmacyDraft({ ...validDraft(), name: 'AB' });
    expect(errors.name).toBeDefined();
  });

  it('il seçilmediğinde uyarır', () => {
    const errors = validatePharmacyDraft({ ...validDraft(), city: '' });
    expect(errors.city).toBeDefined();
  });

  it('kısa adresi reddeder', () => {
    const errors = validatePharmacyDraft({ ...validDraft(), address: 'Kısa' });
    expect(errors.address).toBeDefined();
  });

  it('hatalı telefonu reddeder', () => {
    const errors = validatePharmacyDraft({ ...validDraft(), phone: '123' });
    expect(errors.phone).toBeDefined();
  });

  it('konum seçilmediğinde uyarır', () => {
    const errors = validatePharmacyDraft({ ...validDraft(), location: undefined });
    expect(errors.location).toBeDefined();
  });

  it('sıfır koordinatı geçerli saymaz', () => {
    const errors = validatePharmacyDraft({
      ...validDraft(),
      location: { latitude: 0, longitude: 0 },
    });
    expect(errors.location).toBeDefined();
  });

  it('birden çok hatayı birlikte bildirir', () => {
    const errors = validatePharmacyDraft({});
    expect(Object.keys(errors).sort()).toEqual([
      'address',
      'city',
      'district',
      'location',
      'name',
      'phone',
    ]);
  });
});
