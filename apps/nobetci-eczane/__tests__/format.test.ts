import {
  digitsOnly,
  formatPhone,
  normalizePhone,
  searchKey,
  titleCase,
  toDialablePhone,
} from '@/lib/format';

describe('normalizePhone', () => {
  it('başında sıfır olan numarayı 10 haneye indirir', () => {
    expect(normalizePhone('0312 123 45 67')).toBe('3121234567');
  });

  it('ülke kodlu numarayı kabul eder', () => {
    expect(normalizePhone('+90 532 123 45 67')).toBe('5321234567');
    expect(normalizePhone('905321234567')).toBe('5321234567');
  });

  it('zaten 10 haneli numarayı olduğu gibi bırakır', () => {
    expect(normalizePhone('5321234567')).toBe('5321234567');
  });

  it('eksik ya da hatalı numarayı reddeder', () => {
    expect(normalizePhone('123')).toBeNull();
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('0 0312 123 45 67')).toBeNull();
  });
});

describe('formatPhone', () => {
  it('numarayı okunur biçimde yazar', () => {
    expect(formatPhone('05321234567')).toBe('0532 123 45 67');
  });

  it('tanınmayan numarayı olduğu gibi bırakır', () => {
    expect(formatPhone('444 0 444')).toBe('444 0 444');
  });
});

describe('toDialablePhone', () => {
  it('aramaya hazır uluslararası numara üretir', () => {
    expect(toDialablePhone('0312 123 45 67')).toBe('+903121234567');
  });

  it('tanınmayan numarada yalnızca rakamları bırakır', () => {
    expect(toDialablePhone('444 0 444')).toBe('4440444');
  });
});

describe('digitsOnly', () => {
  it('rakam dışındaki karakterleri atar', () => {
    expect(digitsOnly('(0312) 123-45 67')).toBe('03121234567');
  });
});

describe('titleCase', () => {
  it('Türkçe harflerde doğru büyütme yapar', () => {
    expect(titleCase('ışık eczanesi')).toBe('Işık Eczanesi');
    expect(titleCase('İSTANBUL')).toBe('İstanbul');
  });

  it('fazla boşlukları temizler', () => {
    expect(titleCase('  merkez   eczanesi ')).toBe('Merkez Eczanesi');
  });

  it('tireli adlarda her parçayı büyütür', () => {
    expect(titleCase('afyon-karahisar')).toBe('Afyon-Karahisar');
  });
});

describe('searchKey', () => {
  it('Türkçe karakterleri sadeleştirir', () => {
    expect(searchKey('Şişli')).toBe('sisli');
    expect(searchKey('ÇİĞDEM')).toBe('cigdem');
  });

  it('büyük/küçük harf farkını yok sayar', () => {
    expect(searchKey('KADIKÖY')).toBe(searchKey('kadıköy'));
  });
});
