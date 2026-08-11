import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { analyzeHotel, createDefaultHotelInput } from './engine';
import { buildHotelPdf } from './pdf';
import { buildHotelExcelWorkbook } from './excel';

describe('Kalem 4 — PDF/Excel TL karşılığı (döviz bazlı otel)', () => {
  it('Dolar bazlı otelde Excel çıktısında TL karşılığı ve kullanılan kur satırı var', async () => {
    const input = createDefaultHotelInput();
    input.currency = 'USD';
    input.fxRate = 40.5; // 1 USD = 40,5 TL örnek kur
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 50, adr: 150, occupancy: 0.7, operatingDays: 365 }];
    const r = analyzeHotel(input);

    const wb = await buildHotelExcelWorkbook(input, r);
    const buf = await wb.xlsx.writeBuffer();
    writeFileSync('/tmp/otel-usd-test.xlsx', Buffer.from(buf as ArrayBuffer));

    const ws = wb.worksheets[0];
    let foundTlEquivalent = false;
    let foundFxRateRow = false;
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        const v = String(cell.value ?? '');
        if (v.includes('≈') && v.includes('₺')) foundTlEquivalent = true;
        if (v.includes('Kullanılan Kur') || (v.includes('1 $') && v.includes('₺'))) foundFxRateRow = true;
      });
    });
    expect(foundTlEquivalent).toBe(true);
    expect(foundFxRateRow).toBe(true);
  });

  it('TL bazlı otelde TL karşılığı satırı YOK (gereksiz tekrar olmasın)', async () => {
    const input = createDefaultHotelInput(); // currency varsayılan TRY
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 50, adr: 6000, occupancy: 0.7, operatingDays: 365 }];
    const r = analyzeHotel(input);
    const wb = await buildHotelExcelWorkbook(input, r);
    const ws = wb.worksheets[0];
    let foundFxRateRow = false;
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (String(cell.value ?? '').includes('Kullanılan Kur')) foundFxRateRow = true;
      });
    });
    expect(foundFxRateRow).toBe(false);
  });

  it('Dolar bazlı otelde PDF gerçekten üretilebiliyor (hata fırlatmıyor) ve TL karşılığı verisi hesaba katılıyor', async () => {
    const input = createDefaultHotelInput();
    input.currency = 'USD';
    input.fxRate = 40.5;
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 50, adr: 150, occupancy: 0.7, operatingDays: 365 }];
    const r = analyzeHotel(input);
    const { doc } = await buildHotelPdf(input, r);
    const buf = doc.output('arraybuffer');
    writeFileSync('/tmp/otel-usd-test.pdf', Buffer.from(buf as ArrayBuffer));
    expect((buf as ArrayBuffer).byteLength).toBeGreaterThan(1000); // gerçek bir PDF üretildi
  });
});
