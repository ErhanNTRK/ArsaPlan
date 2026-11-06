import { describe, it, expect } from 'vitest';
import { parseLocaleNumber } from './fields';

describe('parseLocaleNumber — Türkçe/uluslararası sayı ayrıştırma düzeltmesi', () => {
  it('Türkçe: binlik nokta + ondalık virgül — "1.234,56" → 1234.56 (ESKİ KOD 1,234 VERİYORDU)', () => {
    expect(parseLocaleNumber('1.234,56')).toBeCloseTo(1234.56, 6);
  });

  it('Türkçe: yalnız ondalık virgül — "1234,56" → 1234.56', () => {
    expect(parseLocaleNumber('1234,56')).toBeCloseTo(1234.56, 6);
  });

  it('Uluslararası: yalnız ondalık nokta — "1234.56" → 1234.56', () => {
    expect(parseLocaleNumber('1234.56')).toBeCloseTo(1234.56, 6);
  });

  it('Uluslararası: binlik virgül + ondalık nokta — "1,234.56" → 1234.56', () => {
    expect(parseLocaleNumber('1,234.56')).toBeCloseTo(1234.56, 6);
  });

  it('Tam sayı — "1234" → 1234', () => {
    expect(parseLocaleNumber('1234')).toBe(1234);
  });

  it('Küçük ondalık — "0,50" → 0.5', () => {
    expect(parseLocaleNumber('0,50')).toBeCloseTo(0.5, 6);
  });

  it('Büyük Türkçe rakam — "1.001.552,75" → 1001552.75', () => {
    expect(parseLocaleNumber('1.001.552,75')).toBeCloseTo(1001552.75, 2);
  });

  it('Negatif değer — "-1.234,56" → -1234.56', () => {
    expect(parseLocaleNumber('-1.234,56')).toBeCloseTo(-1234.56, 6);
  });

  it('Boş girdi → 0', () => {
    expect(parseLocaleNumber('')).toBe(0);
    expect(parseLocaleNumber('   ')).toBe(0);
  });

  it('Geçersiz girdi → 0 (NaN değil)', () => {
    expect(parseLocaleNumber('abc')).toBe(0);
  });

  it('Gerçek ArsaPlan senaryosu: "21.050" → 21050 (TR binlik deseni), "21.05" → 21.05 (ondalık) ayrımı doğru yapılır', () => {
    expect(parseLocaleNumber('21.050')).toBe(21050);
    expect(parseLocaleNumber('21.05')).toBeCloseTo(21.05, 6);
    expect(parseLocaleNumber('21.050,50')).toBeCloseTo(21050.5, 2);
    expect(parseLocaleNumber('1.234.567')).toBe(1234567);
  });
});

import { formatTyping } from './fields';
describe('formatTyping — yazarken binlik ayracı', () => {
  it('tam sayı gruplanır', () => {
    expect(formatTyping('1000000')).toBe('1.000.000');
    expect(formatTyping('999')).toBe('999');
    expect(formatTyping('1000')).toBe('1.000');
  });
  it('ondalık virgül korunur', () => {
    expect(formatTyping('1234,5')).toBe('1.234,5');
    expect(formatTyping('0,')).toBe('0,');
    expect(formatTyping('0,05')).toBe('0,05');
  });
  it('sonda yazılan nokta ondalığa çevrilir', () => {
    expect(formatTyping('0.')).toBe('0,');
    expect(formatTyping('1.000.')).toBe('1.000,');
  });
  it('eklenen binlik noktalar tekrar biçimlenir', () => {
    expect(formatTyping('1.0005')).toBe('10.005');
  });
  it('eksi işareti korunur, baştaki sıfırlar atılır', () => {
    expect(formatTyping('-1500')).toBe('-1.500');
    expect(formatTyping('007')).toBe('7');
  });
});
