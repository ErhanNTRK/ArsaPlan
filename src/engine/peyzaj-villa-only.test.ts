/**
 * Peyzaj ve Bahçe — yalnız Villa'da kalsın, Çok Katlı Bina/Karma'dan
 * çıkarılsın kararı. Kritik nokta: yalnız UI'da gizlemek yetmez, motor
 * seviyesinde de gerçekten sıfırlanmalı — kullanıcı önceden Villa modunda
 * girdiği landscapeUnitCost'un, Çok Katlı Bina/Karma hesabına sessizce
 * karışmadığını doğruluyoruz.
 */
import { describe, it, expect } from 'vitest';
import { analyze } from './index';
import makeMinimalProjectInput from '../tests/fixtures/minimalProjectInput';

describe('Peyzaj ve Bahçe — Villa\'da uygulanıyor, Çok Katlı Bina/Karma\'da sıfırlanıyor', () => {
  it('Villa: landscapeUnitCost gerçekten hesaba giriyor (mevcut davranış korunuyor)', () => {
    const input = makeMinimalProjectInput();
    input.housingType = 'villa';
    input.site.landscapeUnitCost = 1200;
    const r = analyze(input);
    expect(r.financial.landscapeCost).toBeGreaterThan(0);
  });

  it('Konut (3-8 Katlı Bina): landscapeUnitCost depoda dursa bile hesaba HİÇ girmiyor', () => {
    const input = makeMinimalProjectInput();
    input.housingType = 'apartman-3-8';
    input.site.landscapeUnitCost = 1200; // eski Villa girdisi, hâlâ input'ta duruyor
    input.site.gardenPricePerM2 = 5000;
    const r = analyze(input);
    expect(r.financial.landscapeCost).toBe(0);
  });

  it('Karma Kullanım: aynı şekilde sıfırlanıyor', () => {
    const input = makeMinimalProjectInput();
    input.assetType = 'karma';
    input.site.landscapeUnitCost = 1200;
    const r = analyze(input);
    expect(r.financial.landscapeCost).toBe(0);
  });

  it('input.site\'ın kendisi DEĞİŞTİRİLMİYOR — yalnız hesap için geçici olarak sıfırlanıyor (Villa\'ya dönülürse veri kaybolmaz)', () => {
    const input = makeMinimalProjectInput();
    input.housingType = 'apartman-3-8';
    input.site.landscapeUnitCost = 1200;
    analyze(input);
    // analyze() çağrısından SONRA input.site.landscapeUnitCost hâlâ 1200 olmalı — mutasyon yok.
    expect(input.site.landscapeUnitCost).toBe(1200);
  });
});
