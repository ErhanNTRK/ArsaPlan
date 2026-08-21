/**
 * Kalem 1 — Gordon Tutarlılık Uyarı Sistemi: iskonto ve büyüme oranı
 * birlikte piyasada gözlemlenmeyen bir cap rate ima ediyorsa uyarı verir.
 */
import { describe, it, expect } from 'vitest';
import { checkImpliedCapPlausibility, analyzeHotel, createDefaultHotelInput } from './engine';

describe('Kalem 1 — checkImpliedCapPlausibility (saf fonksiyon testleri)', () => {
  it('Makul aralıkta (örn. %25 iskonto, %15 büyüme → %10 ima edilen cap) uyarı YOK', () => {
    expect(checkImpliedCapPlausibility(0.25, 0.15)).toBeNull();
  });

  it('Bu sohbette bizzat yaşadığımız gerçek senaryo: %40 iskonto + %5 büyüme → %35 ima edilen cap, MAKUL DIŞI', () => {
    const w = checkImpliedCapPlausibility(0.40, 0.05);
    expect(w).not.toBeNull();
    expect(w).toContain('%35');
    expect(w).toMatch(/piyasada nadiren gözlemlenen/);
  });

  it('İskonto oranı büyüme oranına eşit ya da düşükse (implied ≤ 0) özel, daha güçlü bir uyarı verir', () => {
    const w = checkImpliedCapPlausibility(0.25, 0.31);
    expect(w).not.toBeNull();
    expect(w).toMatch(/sonsuz ya da negatif/);
  });

  it('Çok düşük ima edilen cap rate (%2) de makul dışı sayılır', () => {
    const w = checkImpliedCapPlausibility(0.10, 0.08); // implied = %2
    expect(w).not.toBeNull();
  });
});

describe('Kalem 1 — analyzeHotel içinde gerçek uçtan uca çalışıyor', () => {
  it('Bu sohbette geriye çözdüğümüz gerçek örnek (iskonto %40, büyüme %5, cap %9) uyarı üretiyor', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 50, adr: 4000, occupancy: 0.65, operatingDays: 365 }];
    input.projection.capRate = 0.09;
    input.projection.incomeGrowthRate = 0.05;
    input.projection.expenseGrowthRate = 0.05;
    input.projection.discountRate = 0.40;
    const r = analyzeHotel(input);
    expect(r.ina).not.toBeNull();
    expect(r.ina!.plausibilityWarning).not.toBeNull();
  });

  it('Gordon-tutarlı bir kombinasyonda (iskonto = cap + büyüme) uyarı yok', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 50, adr: 4000, occupancy: 0.65, operatingDays: 365 }];
    input.projection.capRate = 0.10;
    input.projection.incomeGrowthRate = 0.15;
    input.projection.expenseGrowthRate = 0.15;
    input.projection.discountRate = 0.25; // = %10 + %15, ima edilen cap tam %15... aslında burada cap-growth farkı degil discount-growth = 0.10 kontrolü
    const r = analyzeHotel(input);
    expect(r.ina!.plausibilityWarning).toBeNull();
  });
});
