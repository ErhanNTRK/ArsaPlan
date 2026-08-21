/**
 * Kalem 3 — Yeni/Aktif Otel ayrımı: isNewHotel=true iken kademeli oturma
 * (ramp-up) projeksiyona uygulanır ve Direkt Kap'ın bugüne indirgenmiş
 * hâli (prospectiveValue) hesaplanır. Aynı hedef sayılarla girilse bile
 * "yeni" işaretlenen otelin değeri "aktif" işaretlenenden düşük çıkmalı.
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput, buildRampSchedule } from './engine';

function makeInput() {
  const input = createDefaultHotelInput();
  input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 100, adr: 5000, occupancy: 0.65, operatingDays: 365 }];
  input.opex.expenseRate = 0.55;
  input.projection.capRate = 0.10;
  input.projection.years = 10;
  input.projection.incomeGrowthRate = 0.10;
  input.projection.expenseGrowthRate = 0.10;
  input.projection.discountRate = 0.20;
  return input;
}

describe('Kalem 3 — buildRampSchedule (saf fonksiyon)', () => {
  it('3 yıllık oturma → gerçek banka örneğiyle birebir örtüşen %50/%75 kademesi üretir', () => {
    const s = buildRampSchedule(3);
    expect(s.length).toBe(2);
    expect(s[0]).toBeCloseTo(0.5, 6);
    expect(s[1]).toBeCloseTo(0.75, 6);
  });

  it('1 yıllık oturma → boş dizi (ramp yok, ilk yıldan itibaren tam hedef)', () => {
    expect(buildRampSchedule(1)).toEqual([]);
  });

  it('5 yıllık oturma → 4 elemanlı, tek düze hedefe yaklaşan bir dizi', () => {
    const s = buildRampSchedule(5);
    expect(s.length).toBe(4);
    expect(s[3]).toBeCloseTo(1 - 0.5 ** 4, 6);
    // Her eleman bir öncekinden büyük olmalı (kademeli artış)
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1]);
  });
});

describe('Kalem 3 — analyzeHotel: aynı hedef sayılarla, yeni otel değeri aktif otelden düşük', () => {
  it('isNewHotel=false (aktif): İNA, ramp-up UYGULANMADAN hesaplanıyor', () => {
    const aktif = makeInput();
    aktif.isNewHotel = false;
    const rAktif = analyzeHotel(aktif);

    const yeni = makeInput();
    yeni.isNewHotel = true;
    yeni.stabilizationYears = 3;
    const rYeni = analyzeHotel(yeni);

    expect(rYeni.ina).not.toBeNull();
    expect(rAktif.ina).not.toBeNull();
    // Aynı hedef girdilerle bile, yeni otelin İNA'sı aktif otelden DÜŞÜK olmalı
    // (ramp-up ilk yıllardaki geliri azaltıyor).
    expect(rYeni.ina!.npv).toBeLessThan(rAktif.ina!.npv);
  });

  it('isNewHotel=true iken projeksiyon tablosunun ilk yılları gerçekten düşük gelirli', () => {
    const yeni = makeInput();
    yeni.isNewHotel = true;
    yeni.stabilizationYears = 3;
    const r = analyzeHotel(yeni);
    const aktif = makeInput();
    const rAktif = analyzeHotel(aktif);

    // 1. yıl geliri, hedefin (aktif senaryonun) yaklaşık %50'si olmalı
    const oran1 = r.projectionTable[0].totalRevenue / rAktif.projectionTable[0].totalRevenue;
    expect(oran1).toBeCloseTo(0.5, 1);
    // 3. yıldan itibaren (ramp bitmiş) gelir aktif senaryoyla birebir örtüşmeli
    const oran3 = r.projectionTable[2].totalRevenue / rAktif.projectionTable[2].totalRevenue;
    expect(oran3).toBeCloseTo(1.0, 2);
  });

  it('prospectiveValue yalnız isNewHotel=true VE iskonto oranı girilmişken hesaplanıyor', () => {
    const aktif = makeInput(); aktif.isNewHotel = false;
    expect(analyzeHotel(aktif).prospectiveValue).toBeNull();

    const yeniIskontoYok = makeInput();
    yeniIskontoYok.isNewHotel = true;
    yeniIskontoYok.projection.discountRate = null;
    expect(analyzeHotel(yeniIskontoYok).prospectiveValue).toBeNull();

    const yeniTam = makeInput();
    yeniTam.isNewHotel = true;
    const rYeniTam = analyzeHotel(yeniTam);
    expect(rYeniTam.prospectiveValue).not.toBeNull();
    expect(rYeniTam.prospectiveValue!).toBeLessThan(rYeniTam.capitalizedValue);
  });

  it('prospectiveValue = capitalizedValue / (1+iskonto)^oturmaSüresi (gerçek formül doğrulaması)', () => {
    const input = makeInput();
    input.isNewHotel = true;
    input.stabilizationYears = 4;
    input.projection.discountRate = 0.22;
    const r = analyzeHotel(input);
    const beklenen = Math.round((r.capitalizedValue / Math.pow(1.22, 4)) / 5000) * 5000;
    // r.capitalizedValue zaten 5.000'e yuvarlanmış görüntülenen değer; iç
    // hesap ham değeri kullandığı için birkaç 5.000'lik adım farkı olabilir.
    expect(Math.abs(r.prospectiveValue! - beklenen)).toBeLessThanOrEqual(5000);
  });
});
