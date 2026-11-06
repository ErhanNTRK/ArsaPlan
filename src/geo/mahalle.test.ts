import { describe, it, expect } from 'vitest';
import { mahalleKisa, mahalleUzun } from './mahalle';

describe('Mahalle son eki tek seferlik eklenir', () => {
  it('son ek yoksa eklenir', () => {
    expect(mahalleKisa('Test')).toBe('Test Mah.');
    expect(mahalleUzun('Test')).toBe('Test Mahallesi');
  });
  it('kullanıcı Mah / Mah. / Mahallesi yazdıysa tekrarlanmaz', () => {
    expect(mahalleKisa('Test Mah')).toBe('Test Mah.');
    expect(mahalleKisa('Test Mah.')).toBe('Test Mah.');
    expect(mahalleKisa('Test Mahallesi')).toBe('Test Mah.');
    expect(mahalleUzun('Test mah.')).toBe('Test Mahallesi');
  });
  it('boş değer boş döner', () => {
    expect(mahalleKisa('')).toBe('');
    expect(mahalleUzun(undefined)).toBe('');
  });
});
