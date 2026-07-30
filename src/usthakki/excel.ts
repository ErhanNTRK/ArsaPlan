/**
 * ÜST HAKKI DEĞERLEME — Excel (.xlsx) çıktısı.
 * Tam DCF tablosu (dönem sayısı kalan süre kadar); kurumsal banner ve renk
 * paleti export/excel.ts ile aynıdır. "â" harfi kullanılmaz (font sınırı).
 */
import ExcelJS from 'exceljs';
import { BRAND } from '../brand/brand';
import { DORA_LOGO_PNG } from '../brand/logo';
import { triggerDownload } from '../export/excel';
import type { UstHakkiInput, UstHakkiResult } from './engine';

const NAVY = 'FF0F2A47';
const GOLD = 'FFB28D42';
const FAINT = 'FFF6F8FB';
const LINEC = 'FFDCE3EB';
const THIN = { style: 'thin' as const, color: { argb: LINEC } };
const BOX = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const TL = '#,##0 "₺";[Red]-#,##0 "₺";"–"';

export async function downloadUstHakkiExcel(input: UstHakkiInput, r: UstHakkiResult) {
  const wb = new ExcelJS.Workbook();
  wb.creator = `${BRAND.company} · ${BRAND.author}`;
  wb.company = BRAND.company;
  wb.created = new Date();
  const logoId = wb.addImage({ base64: DORA_LOGO_PNG, extension: 'png' });

  const ws = wb.addWorksheet('Üst Hakkı', {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 16 },
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } },
  });
  ws.columns = [{ width: 3 }, { width: 22 }, { width: 16 }, { width: 18 }, { width: 17 }, { width: 17 }, { width: 3 }];

  ws.mergeCells('A1:G2');
  const t = ws.getCell('A1');
  t.value = '  Üst Hakkı Değerleme Raporu';
  t.font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  t.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 24;
  ws.getRow(2).height = 20;
  ws.mergeCells('A3:G3');
  const st = ws.getCell('A3');
  st.value = `  Gelir Indirgeme (DCF) ve Karsilastirmali Yontemler · ${BRAND.company}`;
  st.font = { name: 'Arial', size: 9.5, color: { argb: 'FFC4D4E5' } };
  st.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  st.alignment = { vertical: 'middle' };
  ws.getRow(3).height = 15;
  ws.mergeCells('A4:G4');
  ws.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
  ws.getRow(4).height = 3;
  ws.addImage(logoId, { tl: { col: 4.4, row: 0.3 }, ext: { width: 105, height: 32 } });

  let row = 6;
  function section(text: string) {
    ws.mergeCells(`B${row}:F${row}`);
    const cell = ws.getCell(`B${row}`);
    cell.value = text;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(row).height = 17;
    row++;
  }
  function kv(label: string, value: string | number, fmt?: string, opts: { bold?: boolean } = {}) {
    ws.getCell(`B${row}`).value = label;
    ws.getCell(`B${row}`).font = { name: 'Arial', size: 9.5, color: { argb: 'FF5A6774' } };
    ws.getCell(`C${row}`).value = value;
    ws.getCell(`C${row}`).font = { name: 'Arial', size: 9.5, bold: !!opts.bold };
    if (fmt) ws.getCell(`C${row}`).numFmt = fmt;
    ws.getCell(`C${row}`).alignment = { horizontal: 'right' };
    row++;
  }

  section('SÜRE VE ISKONTO');
  kv('İlk Süre', `${input.ilkSureYil} yıl`);
  kv('Kalan Süre', `${input.kalanSureYil} yıl`);
  kv('İskonto Oranı', r.discountRate, '0.0%');
  row++;

  section(`GELİR İNDİRGEME TABLOSU (${r.years.length} DONEM)`);
  const heads = ['Yıl', 'Gelir', 'Odeme/Ecrimisil', 'Net Nakit Akis', 'Bugunku Deger'];
  heads.forEach((hh, i) => {
    const cell = ws.getCell(row, 2 + i);
    cell.value = hh;
    cell.font = { name: 'Arial', size: 8.5, bold: true, color: { argb: 'FF5A6774' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FAINT } };
    cell.border = BOX;
    cell.alignment = { horizontal: i === 0 ? 'left' : 'right' };
  });
  row++;
  for (const yr of r.years) {
    ws.getCell(row, 2).value = yr.year;
    ws.getCell(row, 3).value = yr.income; ws.getCell(row, 3).numFmt = TL;
    ws.getCell(row, 4).value = -(yr.payment + yr.ecrimisil); ws.getCell(row, 4).numFmt = TL;
    ws.getCell(row, 5).value = yr.netCashFlow; ws.getCell(row, 5).numFmt = TL;
    ws.getCell(row, 6).value = yr.presentValue; ws.getCell(row, 6).numFmt = TL;
    ws.getCell(row, 6).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E6B41' } };
    for (let c = 2; c <= 6; c++) {
      ws.getCell(row, c).border = BOX;
      if (!ws.getCell(row, c).font) ws.getCell(row, c).font = { name: 'Arial', size: 9 };
      if (c > 2) ws.getCell(row, c).alignment = { horizontal: 'right' };
    }
    row++;
  }
  row++;

  section('KARSILASTIRMALI YONTEMLER');
  kv('DCF Degeri', r.dcfValue, TL, { bold: input.finalMethod === 'dcf' });
  kv(`Referans Ust Hakki Hesabi (K=${r.referenceFactor.toFixed(3)})`, r.referenceValue, TL, { bold: input.finalMethod === 'reference' });
  if (input.costApproachValue != null) kv('Maliyet Yaklasimi', input.costApproachValue, TL, { bold: input.finalMethod === 'cost' });
  if (input.marketApproachValue != null) kv('Emsal Yaklasimi', input.marketApproachValue, TL, { bold: input.finalMethod === 'market' });
  row++;

  ws.mergeCells(`B${row}:E${row}`);
  const vcell = ws.getCell(`B${row}`);
  vcell.value = 'NIHAI UST HAKKI DEGERI';
  vcell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  vcell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  vcell.alignment = { vertical: 'middle', indent: 1 };
  ws.getCell(`F${row}`).value = r.finalValue;
  ws.getCell(`F${row}`).numFmt = TL;
  ws.getCell(`F${row}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell(`F${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getCell(`F${row}`).alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  ws.getRow(row).height = 20;
  row += 2;

  ws.mergeCells(`B${row}:F${row}`);
  ws.getCell(`B${row}`).value = 'Nihai deger takdiri uzmana aittir; sistem yontemler arasinda secim yapmaz.';
  ws.getCell(`B${row}`).font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF8C98A5' } };
  row += 2;
  ws.mergeCells(`B${row}:F${row}`);
  ws.getCell(`B${row}`).value = `${BRAND.preparedBy} · ${BRAND.developerLine} · Ust Hakki Degerleme Modulu`;
  ws.getCell(`B${row}`).font = { name: 'Arial', size: 7.5, color: { argb: 'FF8C98A5' } };

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, 'Ust-Hakki-Degerleme-Raporu.xlsx');
}
