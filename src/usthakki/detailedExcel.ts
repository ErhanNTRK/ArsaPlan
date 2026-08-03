/**
 * AYRINTILI ÜST HAKKI DEĞER ANALİZİ — Excel (.xlsx) çıktısı.
 * Kurumsal banner ve renk paleti export/excel.ts ile aynıdır.
 */
import ExcelJS from 'exceljs';
import { attachDataSheet } from '../export/excelImport';
import { BRAND } from '../brand/brand';
import { DORA_LOGO_PNG } from '../brand/logo';
import { triggerDownload } from '../export/excel';
import type { DetailedUstHakkiInput, DetailedUstHakkiResult } from './detailedEngine';

const NAVY = 'FF0F2A47';
const GOLD = 'FFB28D42';
const FAINT = 'FFF6F8FB';
const LINEC = 'FFDCE3EB';
const THIN = { style: 'thin' as const, color: { argb: LINEC } };
const BOX = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const TL = '#,##0 "₺";[Red]-#,##0 "₺";"–"';
const SYM: Record<DetailedUstHakkiInput['currency'], string> = { TL: '₺', USD: '$', EUR: '€' };
const curFmt = (input: DetailedUstHakkiInput) =>
  input.currency === 'TL' ? TL : `#,##0 "${SYM[input.currency]}";[Red]-#,##0 "${SYM[input.currency]}";"–"`;

export async function downloadDetailedUstHakkiExcel(input: DetailedUstHakkiInput, r: DetailedUstHakkiResult) {
  const wb = new ExcelJS.Workbook();
  wb.creator = `${BRAND.company} · ${BRAND.author}`;
  wb.company = BRAND.company;
  wb.created = new Date();
  const logoId = wb.addImage({ base64: DORA_LOGO_PNG, extension: 'png' });

  const ws = wb.addWorksheet('Ayrintili Ust Hakki', {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 16 },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } },
  });
  ws.columns = [{ width: 3 }, { width: 8 }, { width: 15 }, { width: 15 }, { width: 15 },
    { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 15 }, { width: 3 }];

  ws.mergeCells('A1:K2');
  const t = ws.getCell('A1');
  t.value = '  Ayrintili Ust Hakki Deger Analizi';
  t.font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  t.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 24; ws.getRow(2).height = 20;
  ws.mergeCells('A3:K3');
  const st = ws.getCell('A3');
  st.value = `  Gelir Indirgeme (DCF) — Donemsel Tablo · ${BRAND.company}`;
  st.font = { name: 'Arial', size: 9.5, color: { argb: 'FFC4D4E5' } };
  st.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  st.alignment = { vertical: 'middle' };
  ws.getRow(3).height = 15;
  ws.mergeCells('A4:K4');
  ws.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
  ws.getRow(4).height = 3;
  ws.addImage(logoId, { tl: { col: 8.6, row: 0.3 }, ext: { width: 105, height: 32 } });

  let row = 6;
  function section(text: string, span = 'B:F') {
    const [c1, c2] = span.split(':');
    ws.mergeCells(`${c1}${row}:${c2}${row}`);
    const cell = ws.getCell(`${c1}${row}`);
    cell.value = text;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(row).height = 17;
    row++;
  }
  function kv(label: string, value: string | number, fmt?: string) {
    ws.getCell(`B${row}`).value = label;
    ws.getCell(`B${row}`).font = { name: 'Arial', size: 9.5, color: { argb: 'FF5A6774' } };
    ws.getCell(`C${row}`).value = value;
    ws.getCell(`C${row}`).font = { name: 'Arial', size: 9.5 };
    if (fmt) ws.getCell(`C${row}`).numFmt = fmt;
    ws.getCell(`C${row}`).alignment = { horizontal: 'right' };
    row++;
  }

  section('SURE VE PARA BIRIMI');
  kv('Toplam Sure', `${input.toplamSureYil} yil`);
  kv('Kalan Sure', `${input.kalanSureYil} yil`);
  kv('Iskonto Orani', r.discountRate, '0.0%');
  kv('Para Birimi', input.currency);
  row++;

  if (input.showCostApproachInPdf) {
    section('MALIYET YAKLASIMI');
    kv('Arsa Alani', `${input.parcelArea.toLocaleString('tr-TR')} m²` + (input.fromKml ? ' (KML)' : ''));
    kv('Arsa m² Birim Degeri', input.landUnitValue, curFmt(input));
    kv('Arsa Degeri', r.cost.landValue, curFmt(input));
    for (const b of input.buildings) {
      if (b.area > 0 || b.unitCost > 0) kv(`  ${b.type} (${b.area.toLocaleString('tr-TR')} m²)`, b.area * b.unitCost, curFmt(input));
    }
    kv('Toplam Yapi Maliyeti', r.cost.buildingsCost, curFmt(input));
    kv('TOPLAM MALIYET', r.cost.totalCost, curFmt(input));
    kv('Toplam Maliyet (5.000\'e yuvarlanmis)', r.cost.totalCostRounded, curFmt(input));
    row++;
  }

  section(`DONEMSEL TABLO (${r.years.length} DONEM)`, 'B:K');
  const heads = ['Yıl', 'Toplam Gelir', 'Toplam Gider', 'Brüt Kâr', 'Brüt Kâr %', 'Sabit Gider', 'Net Kâr', 'Net Kâr %', 'Bugünkü Değer'];
  heads.forEach((hh, idx) => {
    const cell = ws.getCell(row, 2 + idx);
    cell.value = hh;
    cell.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF5A6774' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FAINT } };
    cell.border = BOX;
    cell.alignment = { horizontal: idx === 0 ? 'left' : 'right' };
  });
  row++;
  for (const yr of r.years) {
    const vals = [yr.year, yr.totalRevenue, yr.totalExpense, yr.grossOperatingProfit, yr.grossOperatingProfitPct / 100,
      yr.totalFixedExpense, yr.netOperatingProfit, yr.netOperatingProfitPct / 100, yr.presentValue];
    vals.forEach((v, idx) => {
      const cell = ws.getCell(row, 2 + idx);
      cell.value = v;
      if (idx === 4 || idx === 7) cell.numFmt = '0.0%';
      else if (idx > 0) cell.numFmt = curFmt(input);
      cell.border = BOX;
      cell.font = { name: 'Arial', size: 8.5, bold: idx === 8 };
      if (idx > 0) cell.alignment = { horizontal: 'right' };
    });
    row++;
  }
  row++;

  section('SONUC', 'B:F');
  kv('Nakit Akis Bugunku Deger Toplami', r.sumPresentValue, curFmt(input));
  if (input.donemSonuIndirgemePct > 0) kv(`Donem Sonu Deger Indirgeme (%${input.donemSonuIndirgemePct})`, -(r.sumPresentValue - r.propertyValueLocal), curFmt(input));
  row++;
  ws.mergeCells(`B${row}:E${row}`);
  const vcell = ws.getCell(`B${row}`);
  vcell.value = 'TASINMAZ DEGERI';
  vcell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  vcell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  vcell.alignment = { vertical: 'middle', indent: 1 };
  ws.getCell(`F${row}`).value = r.propertyValueRounded;
  ws.getCell(`F${row}`).numFmt = input.currency === 'TL' ? TL : `#,##0 "${input.currency}"`;
  ws.getCell(`F${row}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell(`F${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getCell(`F${row}`).alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  ws.getRow(row).height = 20;
  row++;
  if (input.currency !== 'TL') {
    kv('TL Karsiligi', r.propertyValueTl, TL);
  }
  row += 2;
  ws.mergeCells(`B${row}:F${row}`);
  ws.getCell(`B${row}`).value = `${BRAND.preparedBy} · ${BRAND.developerLine} · Ayrintili Ust Hakki Deger Analizi`;
  ws.getCell(`B${row}`).font = { name: 'Arial', size: 7.5, color: { argb: 'FF8C98A5' } };

  attachDataSheet(wb, input);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, 'Ayrintili-Ust-Hakki-Degerleme-Raporu.xlsx');
}
