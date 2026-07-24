/**
 * GOLDEN TEST — Otel Geliri Motoru
 * Referans: teknik geliştirme dokümanı Bölüm 2/10'daki örnek oda dağılımı.
 *   Standart 30 adet · 3.500 ₺ · %72 doluluk · 365 gün
 *   Deluxe   20 adet · 5.000 ₺ · %61 doluluk · 365 gün
 *   Suit     10 adet · 8.000 ₺ · %54 doluluk · 365 gün
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput, computeRoomRevenue, computeCapitalizedValue, computeNoi } from './engine';
import type { HotelIncomeInput, RoomRevenueRow } from './types';

const rooms: RoomRevenueRow[] = [
  { id: '1', roomType: 'Standart', roomCount: 30, adr: 3500, occupancy: 0.72, operatingDays: 365 },
  { id: '2', roomType: 'Deluxe', roomCount: 20, adr: 5000, occupancy: 0.61, operatingDays: 365 },
  { id: '3', roomType: 'Suit', roomCount: 10, adr: 8000, occupancy: 0.54, operatingDays: 365 },
];

describe('computeRoomRevenue', () => {
  it('her oda tipini dokümandaki formülle hesaplar: Sayı × Fiyat × Doluluk × Gün', () => {
    const { rows, total } = computeRoomRevenue(rooms);
    expect(rows[0].annualRevenue).toBe(Math.round(30 * 3500 * 0.72 * 365));
    expect(rows[1].annualRevenue).toBe(Math.round(20 * 5000 * 0.61 * 365));
    expect(rows[2].annualRevenue).toBe(Math.round(10 * 8000 * 0.54 * 365));
    expect(total).toBe(rows[0].annualRevenue + rows[1].annualRevenue + rows[2].annualRevenue);
  });

  it('doluluk %100 üzerini sınırlar, negatif değerleri sıfırlar', () => {
    const { rows } = computeRoomRevenue([
      { id: '1', roomType: 'Test', roomCount: -5, adr: -100, occupancy: 1.5, operatingDays: 500 },
    ]);
    expect(rows[0].annualRevenue).toBe(0); // roomCount ve adr sıfırlanınca gelir 0 olur
  });
});

describe('computeNoi ve computeCapitalizedValue', () => {
  it('dokümandaki örnek: 100.000.000 ₺ gelir, %35 gider → 65.000.000 ₺ NOI', () => {
    const { totalExpense, noi } = computeNoi(100_000_000, 0.35);
    expect(totalExpense).toBe(35_000_000);
    expect(noi).toBe(65_000_000);
  });

  it('kapitalizasyon oranı sıfırsa değer 0 döner (bölme hatası fırlatmaz)', () => {
    expect(computeCapitalizedValue(65_000_000, 0)).toBe(0);
  });

  it('NOI / Cap Rate ile nihai değeri hesaplar', () => {
    expect(computeCapitalizedValue(65_000_000, 0.10)).toBe(650_000_000);
  });
});

describe('analyzeHotel — uçtan uca orkestrasyon', () => {
  const input: HotelIncomeInput = {
    ...createDefaultHotelInput(),
    rooms,
    ancillary: [{ id: 'a1', name: 'Restoran', annualIncome: 2_000_000, note: '' }],
    leases: [{ id: 'l1', areaName: 'Zemin Kat Market', areaType: 'Market', tenant: 'X Market', inputMode: 'aylik', amount: 50_000, note: '' }],
    opex: { expenseRate: 0.35 },
    projection: { startYear: 2026, years: 5, incomeGrowthRate: 0.15, expenseGrowthRate: 0, capRate: 0.10, terminalCapRate: null, discountRate: null },
  };

  it('tüm gelir kalemlerini çifte saymadan toplar', () => {
    const r = analyzeHotel(input);
    expect(r.totalGrossRevenue).toBe(r.totalRoomRevenue + r.totalAncillaryRevenue + r.totalLeaseRevenue);
    expect(r.totalLeaseRevenue).toBe(50_000 * 12);
  });

  it('projeksiyon tablosu doğru yıl sayısında ve bileşik büyüyor', () => {
    const r = analyzeHotel(input);
    expect(r.projectionTable).toHaveLength(5);
    expect(r.projectionTable[0].totalRevenue).toBe(r.totalGrossRevenue);
    expect(r.projectionTable[1].totalRevenue).toBeGreaterThan(r.projectionTable[0].totalRevenue);
  });

  it('performans göstergelerini (ADR, doluluk, RevPAR) oda sayısı ağırlıklı hesaplar', () => {
    const r = analyzeHotel(input);
    expect(r.performance.totalRoomCount).toBe(60);
    expect(r.performance.revPar).toBeCloseTo(r.performance.blendedAdr * r.performance.blendedOccupancy, 5);
  });

  it('gelirsiz/oda tipsiz durumda uyarı üretir ama hesaplamayı engellemez', () => {
    const empty: HotelIncomeInput = { ...createDefaultHotelInput() };
    const r = analyzeHotel(empty);
    expect(r.warnings.some((w) => w.message.includes('oda tipi'))).toBe(true);
    expect(r.totalGrossRevenue).toBe(0);
    expect(r.capitalizedValue).toBe(0);
  });

  it('otomatik özet metni gelir/gider/NOI/değeri içerir', () => {
    const r = analyzeHotel(input);
    expect(r.summaryText).toContain('₺');
    expect(r.summaryText.length).toBeGreaterThan(20);
  });
});

describe('yardımcı gelir — oran modu', () => {
  it("Salih'in örneği: oda geliri 10M, diğer gelirler oda gelirinin %2'si → 200.000 ₺, toplam 10,2M", () => {
    const input: HotelIncomeInput = {
      ...createDefaultHotelInput(),
      rooms: [{ id: '1', roomType: 'Standart', roomCount: 100, adr: 1000, occupancy: 1, operatingDays: 100 }], // 10.000.000
      ancillary: [{ id: 'a1', name: 'Diğer', mode: 'oran', annualIncome: 0, rate: 0.02, note: '' }],
    };
    const r = analyzeHotel(input);
    expect(r.totalRoomRevenue).toBe(10_000_000);
    expect(r.totalAncillaryRevenue).toBe(200_000);
    expect(r.totalGrossRevenue).toBe(10_200_000);
    expect(r.ancillaryRows[0].effectiveIncome).toBe(200_000);
  });
});
