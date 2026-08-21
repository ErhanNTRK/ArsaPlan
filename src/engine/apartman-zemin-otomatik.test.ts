/**
 * Konut (3-8 Katlı Bina) ve Karma Kullanım — TAKS boşken Zemin Kat'ın
 * otomatik değerinin artık sıfır kalmayıp, satılabilir havuz ve kat
 * sayısından türetilmesi. İkisi de aynı computeApartment fonksiyonunu
 * paylaştığı için tek düzeltme ikisini birden kapsıyor.
 */
import { describe, it, expect } from 'vitest';
import { computeApartment } from './apartment';
import type { Parcel, Zoning, ApartmentInput } from './types';

const parcel: Parcel = { il: 'Denizli', ilce: 'Merkezefendi', mahalle: 'Çakmak', ada: '9275', parsel: '1', area: 10000, netArea: 10000 };

function makeZoning(taks: number | null): Zoning {
  return {
    mode: 'taks-kaks', lejant: 'Konut Alanı', taks, kaks: 1.45, hmax: null,
    directFootprint: 0, directEmsalArea: 0, cekmeFront: 0, cekmeSide: 0, cekmeRear: 0, cekmeFrontEdge: null,
    planNotes: '', footprintOverride: null,
  };
}

const apt: ApartmentInput = {
  basementCount: 0,
  basements: [
    { use: 'konut', area: null, lossRate: 0.10, saleable: null },
    { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
    { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
    { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
  ],
  zeminArea: null, zeminLossRate: 0.15, zeminSaleable: null,
  normalCount: 9, // deneyde net bir "10 birim" (1 zemin + 9 normal) elde etmek için
  normalAreas: [null, null, null, null, null, null, null, null],
  normalSaleables: [null, null, null, null, null, null, null, null],
  normalCommonRate: 0.10,
  hasPiyes: false, piyesInEmsal: true, piyesRate: 0.30, piyesArea: null, piyesSaleable: null,
  asmaCount: 0, asmaInEmsal: true, asmaRate: 0.40, asmaAreas: [null, null, null, null], asmaSaleables: [null, null, null, null],
  hasExtraSaleable: false, extraMode: 'oran', extraRate: 0.10, extraArea: 0,
};

describe('Konut (3-8 Katlı)/Karma — TAKS boşken Zemin Kat otomatik değeri artık sıfır kalmıyor', () => {
  it('TAKS null, 9 normal kat, piyes yokken: Taban Oturumu = Havuz ÷ 10 (1 zemin + 9 normal)', () => {
    const r = computeApartment(parcel, makeZoning(null), apt, 'konut');
    const beklenenHavuz = 10000 * 1.45; // extraSaleableArea=0 çünkü hasExtraSaleable=false
    const beklenenFootprint = beklenenHavuz / 10;
    expect(r.footprintArea).toBeCloseTo(beklenenFootprint, 1);
    expect(r.footprintSuggested).toBe(true);
  });

  it('Zemin Kat\'ın otomatik alanı artık gerçekten sıfır DEĞİL — kullanıcının bildirdiği hata düzeltildi', () => {
    const r = computeApartment(parcel, makeZoning(null), apt, 'konut');
    const zemin = r.floors.find((f) => f.kind === 'zemin');
    expect(zemin).toBeDefined();
    expect(zemin!.area).toBeGreaterThan(0);
    expect(zemin!.autoArea).toBe(true); // otomatik değer, kullanıcı elle girmedi
  });

  it('TAKS girilmişse eski davranış birebir korunuyor (geriye dönük uyumlu)', () => {
    const r = computeApartment(parcel, makeZoning(0.30), apt, 'konut');
    expect(r.footprintArea).toBeCloseTo(10000 * 0.30, 1);
    expect(r.footprintSuggested).toBe(false);
  });

  it('Karma Kullanım (variant="karma") için de aynı düzeltme çalışıyor', () => {
    const r = computeApartment(parcel, makeZoning(null), apt, 'karma');
    expect(r.footprintArea).toBeGreaterThan(0);
    expect(r.footprintSuggested).toBe(true);
  });

  it('Zemin Kat elle girilmişse, otomatik türetilen taban oturumu Zemin\'in görünen alanını DEĞİŞTİRMİYOR', () => {
    const aptManuel: ApartmentInput = { ...apt, zeminArea: 500 };
    const r = computeApartment(parcel, makeZoning(null), aptManuel, 'konut');
    const zemin = r.floors.find((f) => f.kind === 'zemin');
    expect(zemin!.area).toBe(500);
    expect(zemin!.autoArea).toBe(false);
  });

  it('Piyes emsale dahilse (oran modunda), türetme formülü piyes payını da dikkate alıyor', () => {
    const aptPiyes: ApartmentInput = { ...apt, hasPiyes: true, piyesInEmsal: true, piyesRate: 0.30 };
    const r = computeApartment(parcel, makeZoning(null), aptPiyes, 'konut');
    const beklenenHavuz = 10000 * 1.45;
    const beklenenFootprint = beklenenHavuz / (1 + 9 + 0.30); // 1 zemin + 9 normal + 0.30 piyes payı
    expect(r.footprintArea).toBeCloseTo(beklenenFootprint, 1);
  });
});
