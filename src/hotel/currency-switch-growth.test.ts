/**
 * Otel — Kur değişince Gelir/Gider Artış Oranı, yeni para biriminin
 * makul aralığının ortasına otomatik ayarlanıyor (eski para biriminin
 * uygunsuz kalmış bir rakamı orada asılı kalmıyor).
 */
import { describe, it, expect } from 'vitest';
import { currencySwitchGrowthDefault } from './HotelApp';

describe('currencySwitchGrowthDefault', () => {
  it('TL -> USD geçişinde, döviz aralığının (%2-5) ortasını öneriyor', () => {
    expect(currencySwitchGrowthDefault('TRY', 'USD')).toBe(0.035);
  });

  it('TL -> EUR geçişinde de aynı öneri', () => {
    expect(currencySwitchGrowthDefault('TRY', 'EUR')).toBe(0.035);
  });

  it('USD -> TL geçişinde, TL aralığının (%28-33) ortasını öneriyor', () => {
    expect(currencySwitchGrowthDefault('USD', 'TRY')).toBe(0.30);
  });

  it('USD -> EUR geçişinde (ikisi de döviz), değer DEĞİŞTİRİLMİYOR — null döner', () => {
    expect(currencySwitchGrowthDefault('USD', 'EUR')).toBeNull();
  });

  it('Aynı para biriminde kalınırsa (TRY -> TRY), null döner', () => {
    expect(currencySwitchGrowthDefault('TRY', 'TRY')).toBeNull();
  });

  it('Periyodik Bakım Tutarı da AYNI koşulda (TL<->Döviz geçişinde) sıfırlanmalı — mutlak bir tutar olduğu için oran gibi otomatik dönüştürülemez, eski para biriminin rakamı yeni birimde anlamsız kalır', () => {
    // HotelApp.tsx'teki para birimi onChange handler'ı, maintenanceAmount'ı
    // TAM OLARAK currencySwitchGrowthDefault != null koşuluyla sıfırlıyor —
    // bu test o koşulun (TL<->Döviz ailesi değişimi) doğru davrandığını
    // doğruluyor, ki maintenanceAmount sıfırlaması da güvenle bu koşula bağlı.
    expect(currencySwitchGrowthDefault('TRY', 'USD')).not.toBeNull(); // sıfırlanmalı
    expect(currencySwitchGrowthDefault('USD', 'EUR')).toBeNull();     // sıfırlanmamalı (ikisi de döviz)
  });
});
