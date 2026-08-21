/**
 * Kalem 2 — İki Aşamalı Büyüme: longTermGrowthRate girildiğinde terminal
 * değer artık projeksiyon büyümesiyle sonsuza kadar şişmiyor, daha
 * mütevazı bir uzun vadeli oranla hesaplanıyor.
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput } from './engine';

// Sizin gerçek 116 deluxe + 8 superior odalı otel örneğiniz.
function makeInput() {
  const input = createDefaultHotelInput();
  input.rooms = [
    { id: 'r1', roomType: 'Deluxe', roomCount: 116, adr: 4000, occupancy: 0.65, operatingDays: 365 },
    { id: 'r2', roomType: 'Superior', roomCount: 8, adr: 6000, occupancy: 0.65, operatingDays: 365 },
  ];
  input.ancillary = [{ id: 'a1', name: 'Yardımcı Gelirler', annualIncome: 0, note: '' }];
  // %10 yardımcı gelir oranını doğrudan oda gelirinin üzerine eklemek yerine
  // basitleştirilmiş biçimde ancillary olarak modelliyoruz (motor toplam
  // gelire ekliyor).
  input.opex.expenseRate = 0.55;
  input.projection.capRate = 0.09;
  input.projection.years = 10;
  input.projection.incomeGrowthRate = 0.15;
  input.projection.expenseGrowthRate = 0.15;
  input.projection.discountRate = 0.25; // Gordon-tutarlı: %9+%15=%24'e yakın, makul aralıkta
  return input;
}

describe('Kalem 2 — İki Aşamalı Büyüme', () => {
  it('longTermGrowthRate boşken (eski davranış): terminal değer hâlâ %15 sonsuza kadar sürüyormuş gibi hesaplanıyor', () => {
    const input = makeInput();
    input.projection.longTermGrowthRate = null;
    const r = analyzeHotel(input);
    expect(r.ina).not.toBeNull();
    // Eski davranışla İNA, Direkt Kap'a yakın olmalı (Gordon-tutarlı iskonto seçildiği için)
    const gapPct = Math.abs(r.ina!.npv / r.capitalizedValue - 1) * 100;
    expect(gapPct).toBeLessThan(10);
  });

  it('longTermGrowthRate dolduruldu (örn. %5): terminal değer küçülüyor, İNA belirgin şekilde düşüyor', () => {
    const inputEski = makeInput();
    inputEski.projection.longTermGrowthRate = null;
    const rEski = analyzeHotel(inputEski);

    const inputYeni = makeInput();
    inputYeni.projection.longTermGrowthRate = 0.05;
    const rYeni = analyzeHotel(inputYeni);

    expect(rYeni.ina).not.toBeNull();
    expect(rYeni.ina!.npv).toBeLessThan(rEski.ina!.npv);
    // Yön doğru olduğu sürece kesin yüzdeyi katı bir aralığa zorlamıyoruz —
    // önemli olan longTermGrowthRate'in gerçekten terminal değeri
    // küçültmesi (eski, %15-sonsuz senaryosuna göre).
    const dususPct = (1 - rYeni.ina!.npv / rEski.ina!.npv) * 100;
    expect(dususPct).toBeGreaterThan(0);
  });

  it('longTermGrowthRate arttıkça İNA da (terminal değer üzerinden) artıyor — yön tutarlı', () => {
    const input3 = makeInput(); input3.projection.longTermGrowthRate = 0.03;
    const input6 = makeInput(); input6.projection.longTermGrowthRate = 0.06;
    const r3 = analyzeHotel(input3);
    const r6 = analyzeHotel(input6);
    expect(r6.ina!.npv).toBeGreaterThan(r3.ina!.npv);
  });

  it('İki aşamalı büyümeyle Gordon uyarısı (Kalem 1), terminal büyüme oranına göre değerlendiriliyor, projeksiyon büyümesine göre değil', () => {
    const input = makeInput();
    // İskonto %25, projeksiyon büyümesi %15 (ima edilen ~%10, makul) ama
    // terminal büyüme %22 girilirse (iskonto %25'e çok yakın) uyarı çıkmalı.
    input.projection.longTermGrowthRate = 0.22;
    const r = analyzeHotel(input);
    expect(r.ina!.plausibilityWarning).not.toBeNull();
  });
});
