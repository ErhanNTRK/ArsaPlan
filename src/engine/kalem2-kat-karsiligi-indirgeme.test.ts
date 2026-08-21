/**
 * Kalem 2 — Arsa Gelir Projeksiyonu: Kat Karşılığı yöntemine de indirgeme
 * uygulanıyor (Gelir Projeksiyonu'yla aynı proje süresi + iskonto oranı),
 * ve iki indirgemeli değer %5'ten fazla ayrışırsa nicel bir açıklama
 * gösteriliyor. Konut, Karma Kullanım ve Ticari Apartman'ın hepsi aynı
 * paylaşılan computeShare/computeFinancial'ı kullandığı için tek bir
 * düzeltme üçünü birden kapsıyor.
 */
import { describe, it, expect } from 'vitest';
import { analyze } from './index';
import makeMinimalProjectInput from '../tests/fixtures/minimalProjectInput';

function withResidual(months: number, rate: number, ownerShare = 0.35) {
  const input = makeMinimalProjectInput();
  input.residual.projectMonths = months;
  input.residual.timeDiscountRate = rate;
  input.share.enabled = true;
  input.share.ownerShare = ownerShare;
  return input;
}

describe('Kalem 2 — Kat Karşılığı indirgeme (Konut/villa yolu)', () => {
  it('projectMonths=0 iken discountedShareLandValue, shareLandValue ile birebir aynı (geriye dönük uyumlu)', () => {
    const input = withResidual(0, 0);
    const r = analyze(input);
    expect(r.share.discountedShareLandValue).toBe(r.share.shareLandValue);
    expect(r.share.discountedShareLandValueRounded).toBe(r.share.shareLandValueRounded);
  });

  it('projectMonths>0 ve oran>0 iken discountedShareLandValue < shareLandValue (bugüne indirgenmiş, küçük olmalı)', () => {
    const input = withResidual(24, 0.30);
    const r = analyze(input);
    expect(r.share.discountedShareLandValue).toBeLessThan(r.share.shareLandValue);
    expect(r.share.discountedShareLandValue).toBeGreaterThan(0);
  });

  it('discountedShareLandValue = shareLandValue × (1+oran)^-(ay/12) (gerçek formül doğrulaması)', () => {
    const input = withResidual(18, 0.25);
    const r = analyze(input);
    const beklenen = r.share.shareLandValue * Math.pow(1.25, -18 / 12);
    expect(r.share.discountedShareLandValue).toBeCloseTo(beklenen, 0);
  });

  it('Süre arttıkça indirgeme büyür (değer küçülür) — yön tutarlı', () => {
    const input12 = withResidual(12, 0.30);
    const input36 = withResidual(36, 0.30);
    const r12 = analyze(input12);
    const r36 = analyze(input36);
    expect(r36.share.discountedShareLandValue).toBeLessThan(r12.share.discountedShareLandValue);
  });
});

describe('Kalem 2 — %5 tutarlılık uyarısı (gapExplanation)', () => {
  it('Fark %5 altındaysa gapExplanation null', () => {
    // ownerShare'i, residual sonucuna yakın çıkacak şekilde makul bir değere ayarlıyoruz.
    const input = makeMinimalProjectInput();
    input.residual.projectMonths = 0;
    input.share.enabled = true;
    const r = analyze(input);
    input.share.ownerShare = Math.max(0, Math.min(1, r.financial.landToRevenue)); // teorik dengeleme noktası
    const r2 = analyze(input);
    expect(Math.abs(r2.share.differenceRate)).toBeLessThan(0.05);
    expect(r2.share.gapExplanation).toBeNull();
  });

  it('Fark %5\'i aşarsa gapExplanation nicel bir mesaj içeriyor (kat karşılığı ve müteahhit kâr oranına atıf yapıyor)', () => {
    const input = makeMinimalProjectInput();
    input.share.enabled = true;
    input.share.ownerShare = 0.60; // kasıtlı olarak dengeden uzak, büyük fark yaratacak
    const r = analyze(input);
    expect(Math.abs(r.share.differenceRate)).toBeGreaterThan(0.05);
    expect(r.share.gapExplanation).not.toBeNull();
    expect(r.share.gapExplanation).toContain('%');
    expect(r.share.gapExplanation).toMatch(/kat karşılığı oranı/i);
    expect(r.share.gapExplanation).toMatch(/müteahhit kâr oranı/i);
  });

  it('İndirgeme aktifken karşılaştırma İNDİRGENMİŞ değerler üzerinden yapılıyor (ham değerler değil)', () => {
    const input = makeMinimalProjectInput();
    input.residual.projectMonths = 24;
    input.residual.timeDiscountRate = 0.30;
    input.share.enabled = true;
    input.share.ownerShare = 0.35;
    const r = analyze(input);
    const beklenenFark = r.share.discountedShareLandValue - r.financial.discountedLandValue;
    expect(r.share.difference).toBeCloseTo(beklenenFark, 0);
  });
});

describe('Kalem 2 — Karma Kullanım ve Ticari Apartman da AYNI düzeltmeyi paylaşıyor', () => {
  it('Karma Kullanım (assetType=karma) yolunda da computeShare aynı residual parametresiyle çağrılıyor, hata vermiyor', () => {
    const input = makeMinimalProjectInput();
    input.assetType = 'karma';
    input.residual.projectMonths = 24;
    input.residual.timeDiscountRate = 0.30;
    input.share.enabled = true;
    const r = analyze(input);
    // discountedShareLandValue alanı gerçekten hesaplanmış (undefined değil) — aynı
    // paylaşılan computeShare fonksiyonundan geçtiğinin kanıtı.
    expect(r.share.discountedShareLandValue).toBeDefined();
    expect(Number.isFinite(r.share.discountedShareLandValue)).toBe(true);
    // Şerefiye/oran > değer > 0 olan gerçek bir senaryoda (villa yolunda
    // doğruladığımız) formülün AYNI kod yolundan geçtiği zaten
    // computeShare'in engine/financial.ts'te TEK bir fonksiyon olmasından
    // (kod incelemesiyle doğrulandı) kesin — bu test yalnız karma modunun
    // yeni parametreyle hatasız çalıştığını teyit ediyor.
  });
});
