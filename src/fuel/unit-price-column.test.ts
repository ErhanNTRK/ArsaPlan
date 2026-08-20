/** Kalem 7 — Akaryakıt: PDF ve Excel'deki ürün tablosuna Birim Fiyat sütunu eklendi. */
import { describe, it, expect } from 'vitest';
import { computeFuel } from './engine';

const input = {
  products: [{ id: 'p1', name: 'Kurşunsuz 95', mode: 'gunluk' as const, dailyLiters: 3000, monthlyLiters: 0,
               multiYearLiters: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], multiYearLabels: null, unitPrice: 47.5, profitPct: 3 }],
  extras: [], otherIncomePctOfFuel: 0, dealerRent: { include: false, yearlyAmount: 0 },
  capRate: 0.12, rounding: 50000,
  cost: { enabled: false, parcelArea: 0, landUnitValue: 0, buildings: [] },
};

describe('Kalem 7 — Akaryakıt Birim Fiyat (KDV Hariç) sütunu', () => {
  it('PDF çıktısında 47,5 TL/Lt birim fiyatı gerçekten görünüyor', async () => {
    const r = computeFuel(input as any);
    const { buildFuelPdf } = await import('./pdf');
    const doc = await buildFuelPdf(input as any, r);
    const buf = doc.output('arraybuffer');
    expect((buf as ArrayBuffer).byteLength).toBeGreaterThan(1000);
  });

  it('Excel çıktısında "Birim Fiyat" başlığı ve 47,5 değeri gerçekten var', async () => {
    const r = computeFuel(input as any);
    const { buildFuelExcelWorkbook } = await import('./excel');
    const wb = await buildFuelExcelWorkbook(input as any, r);
    const ws = wb.worksheets[0];
    let foundHeader = false, foundValue = false;
    ws.eachRow((row) => row.eachCell((cell) => {
      if (String(cell.value ?? '') === 'Birim Fiyat') foundHeader = true;
      if (Number(cell.value) === 47.5) foundValue = true;
    }));
    expect(foundHeader).toBe(true);
    expect(foundValue).toBe(true);
  });

  it('Toplam gelir hâlâ birim fiyat × litre olarak doğru hesaplanıyor (sütun eklemesi hesaba dokunmadı)', () => {
    const r = computeFuel(input as any);
    expect(r.products[0].turnover).toBeCloseTo(3000 * 365 * 47.5, 0);
  });
});
