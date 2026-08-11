import { describe, it, expect } from 'vitest';
import {
  analyzeHotel, createDefaultHotelInput, gordonConsistentDiscountRate, explainInaVsDirectGap,
} from './engine';

describe('Kalem 5 — Gordon tutarlılığı (Direkt Kap ↔ İNA)', () => {
  it('gordonConsistentDiscountRate = cap rate + büyüme oranı', () => {
    expect(gordonConsistentDiscountRate(0.10, 0.15)).toBeCloseTo(0.25, 6);
    expect(gordonConsistentDiscountRate(0.08, 0)).toBeCloseTo(0.08, 6);
  });

  it('Gordon-tutarlı iskonto oranıyla İNA ve Direkt Kap MATEMATİKSEL OLARAK EŞİTLENİYOR (sıfıra yakın fark)', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 50, adr: 6000, occupancy: 0.7, operatingDays: 365 }];
    input.opex.expenseRate = 0.35;
    input.projection.capRate = 0.10;
    input.projection.incomeGrowthRate = 0.15;
    input.projection.expenseGrowthRate = 0.15; // gelir=gider büyümesi → NOI de aynı oranda büyür (Gordon şartı)
    input.projection.years = 10;
    input.projection.discountRate = gordonConsistentDiscountRate(0.10, 0.15); // %25
    const r = analyzeHotel(input);
    expect(r.ina).not.toBeNull();
    const gapPct = Math.abs(r.ina!.npv / r.capitalizedValue - 1) * 100;
    expect(gapPct).toBeLessThan(0.01); // pratikte sıfır — önceki elle doğrulamamızla (Python) tutarlı
    expect(r.ina!.gapExplanation).toBeNull(); // %5'in çok altında, açıklamaya gerek yok
  });

  it('Kullanıcı Gordon-tutarsız (düşük) bir iskonto oranı girerse İNA belirgin yüksek çıkar VE sistem bunu nicel olarak açıklar', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 50, adr: 6000, occupancy: 0.7, operatingDays: 365 }];
    input.opex.expenseRate = 0.35;
    input.projection.capRate = 0.10;
    input.projection.incomeGrowthRate = 0.15;
    input.projection.expenseGrowthRate = 0.15;
    input.projection.years = 10;
    input.projection.discountRate = 0.12; // Gordon-tutarlı %25'ten çok düşük — kasıtlı tutarsızlık
    const r = analyzeHotel(input);
    expect(r.ina).not.toBeNull();
    expect(r.ina!.npv).toBeGreaterThan(r.capitalizedValue); // İNA belirgin yüksek çıkmalı
    expect(r.ina!.gapExplanation).not.toBeNull();
    expect(r.ina!.gapExplanation).toContain('%'); // nicel bir açıklama içeriyor, yalnız "farklı" demiyor
    expect(r.ina!.gapExplanation).toMatch(/iskonto oranı/i);
  });

  it('explainInaVsDirectGap: fark %5 altındaysa null döner (Appraisal Institute %5 kuralı)', () => {
    // 100 vs 104 → %4 fark, açıklama YOK
    expect(explainInaVsDirectGap(100, 104, 0.10, 0.10, 0.20)).toBeNull();
    // 100 vs 106 → %6 fark, açıklama VAR
    expect(explainInaVsDirectGap(100, 106, 0.10, 0.10, 0.15)).not.toBeNull();
  });

  it('Direkt Kap yalnızsa (İNA hesaplanmadıysa) gapExplanation sorgusu hiç patlamaz', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 50, adr: 6000, occupancy: 0.7, operatingDays: 365 }];
    // discountRate girilmedi → İNA null kalmalı, gap kontrolü de sorunsuz atlanmalı
    const r = analyzeHotel(input);
    expect(r.ina).toBeNull();
  });
});
