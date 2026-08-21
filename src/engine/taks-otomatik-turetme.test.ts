/**
 * TAKS boşken otomatik taban oturumu türetme + kullanıcı elle değiştirirse
 * kat sayısının otomatik yeniden hesaplanması. Gerçek Denizli/Çakmak
 * örneğinin sayılarıyla doğrulandı (bu sohbette elle hesapladığımız örnek).
 */
import { describe, it, expect } from 'vitest';
import { computeCapacity } from './capacity';
import type { Parcel, Zoning, EmsalOptions, VillaConfig } from './types';

const parcel: Parcel = { il: 'Denizli', ilce: 'Merkezefendi', mahalle: 'Çakmak', ada: '9275', parsel: '1', area: 10000.33, netArea: 10000.33 };

function makeZoning(taks: number | null, footprintOverride?: number | null): Zoning {
  return {
    mode: 'taks-kaks', lejant: 'Konut Alanı', taks, kaks: 1.45, hmax: null,
    directFootprint: 0, directEmsalArea: 0, cekmeFront: 0, cekmeSide: 0, cekmeRear: 0, cekmeFrontEdge: null,
    planNotes: '', footprintOverride: footprintOverride ?? null,
  };
}

const emsal: EmsalOptions = {
  hasExtra: true, extraMode: 'oran', extraRate: 0.15, extraArea: 0,
  hasAttic: true, atticMode: 'oran', atticRate: 0.35, atticArea: 0, atticInEmsal: true,
  hasBasement: true, basementMode: 'oran', basementRate: 1.0, basementArea: 0, basementInEmsal: false,
};

const villa: VillaConfig = { villaType: 'mustakil', unitCount: 0, floorsAboveGround: 12 };

describe('TAKS boşken otomatik taban oturumu türetme', () => {
  it('TAKS null, Kat Sayısı=12 iken taban oturumu Emsal Alanı ve çatı oranından doğru türetiliyor (Denizli örneği)', () => {
    const c = computeCapacity(parcel, makeZoning(null), emsal, villa);
    // Emsal alan = 10000.33*1.45 = 14500.4785; footprint = emsal/(12+0.35) = emsal/12.35
    const beklenenFootprint = (10000.33 * 1.45) / (12 + 0.35);
    expect(c.footprintArea).toBeCloseTo(beklenenFootprint, 1);
    expect(c.footprintSuggested).toBe(true);
    expect(c.effectiveFloorsAboveGround).toBeNull();
    expect(c.warnings.some((w) => w.includes('otomatik türetildi'))).toBe(true);
  });

  it('TAKS girilmişse, otomatik türetme hiç devreye girmiyor (eski davranış korunuyor)', () => {
    const c = computeCapacity(parcel, makeZoning(0.30), emsal, villa);
    expect(c.footprintArea).toBeCloseTo(10000.33 * 0.30, 1);
    expect(c.footprintSuggested).toBe(false);
  });

  it('Kat Sayısı=0 (girilmemiş) ve TAKS de boşsa, taban oturumu 0 kalır ve yönlendirici uyarı çıkar', () => {
    const villaNoFloors: VillaConfig = { ...villa, floorsAboveGround: 0 };
    const c = computeCapacity(parcel, makeZoning(null), emsal, villaNoFloors);
    expect(c.footprintArea).toBe(0);
    expect(c.warnings.some((w) => w.includes('Kat Sayısı'))).toBe(true);
  });
});

describe('Kullanıcı önerilen taban oturumunu elle değiştirirse kat sayısı otomatik güncelleniyor', () => {
  it('Sistem 1000 m² önerse, kullanıcı 900 m² yaparsa, kat sayısı emsali tam tüketecek şekilde otomatik artıyor', () => {
    // Basit senaryo: çatı yok, yalnız Emsal/Kat Sayısı ilişkisi net görünsün.
    const basitEmsal: EmsalOptions = { ...emsal, hasAttic: false };
    const oneri = computeCapacity(parcel, makeZoning(null), basitEmsal, villa);
    expect(oneri.footprintSuggested).toBe(true);

    const override = computeCapacity(parcel, makeZoning(null, 900), basitEmsal, villa);
    expect(override.footprintArea).toBe(900);
    expect(override.footprintSuggested).toBe(false);
    expect(override.effectiveFloorsAboveGround).not.toBeNull();
    // Emsal alanı = 14500.4785; 900 m² taban ile emsali tam tüketmek için gereken kat sayısı:
    const beklenenKat = (10000.33 * 1.45) / 900;
    expect(override.effectiveFloorsAboveGround!).toBeCloseTo(beklenenKat, 2);
  });

  it('Taban oturumu küçültülünce (900 < öneri), gereken kat sayısı ARTIYOR (yön mantıklı)', () => {
    const basitEmsal: EmsalOptions = { ...emsal, hasAttic: false };
    const oneriKatSayisi = (10000.33 * 1.45) / villa.floorsAboveGround; // önerilen taban oturumu = emsal/12
    const override = computeCapacity(parcel, makeZoning(null, oneriKatSayisi * 0.9), basitEmsal, villa);
    expect(override.effectiveFloorsAboveGround!).toBeGreaterThan(villa.floorsAboveGround);
  });

  it('effectiveFloorsAboveGround, downstream areaPerFloor/floorFits hesaplarına gerçekten yansıyor', () => {
    const basitEmsal: EmsalOptions = { ...emsal, hasAttic: false };
    const override = computeCapacity(parcel, makeZoning(null, 900), basitEmsal, villa);
    // floorsAboveGround artık villa.floorsAboveGround (12) değil, yeniden hesaplanmış (yuvarlanmış) değer olmalı
    expect(override.floorsAboveGround).not.toBe(12);
    expect(override.floorsAboveGround).toBe(Math.round(override.effectiveFloorsAboveGround!));
  });

  it('footprintOverride girilmemişse (null), eski davranış (öneri kullanılır) korunuyor — geriye dönük uyumlu', () => {
    const c1 = computeCapacity(parcel, makeZoning(null, null), emsal, villa);
    const c2 = computeCapacity(parcel, makeZoning(null), emsal, villa);
    expect(c1.footprintArea).toBeCloseTo(c2.footprintArea, 6);
  });
});
