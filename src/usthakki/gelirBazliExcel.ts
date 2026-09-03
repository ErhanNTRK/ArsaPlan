/**
 * ÜST HAKKI YÖNTEM 4: BASİT GELİR BAZLI HESAP — Excel (.xlsx) çıktısı.
 * Kurumsal banner/renk paleti export/excel.ts ile aynı. Basit modellerin
 * (simpleExcel.ts) desenini kullanır — dikey satırlar, tek sütun tablo.
 */
import ExcelJS from 'exceljs';
import { attachDataSheet } from '../export/excelImport';
import { BRAND } from '../brand/brand';
import { DORA_LOGO_PNG } from '../brand/logo';
import { triggerDownload } from '../export/excel';
import type { GelirBazliUstHakkiInput, GelirBazliUstHakkiResult } from './gelirBazliEngine';

const NAVY = 'FF0F2A47';
const GOLD = 'FFB28D42';
const FAINT = 'FFF6F8FB';
const SYM: Record<GelirBazliUstHakkiInput['currency'], string> = { TL: '₺', USD: '$', EUR: '€' };
const TL = (input: GelirBazliUstHakkiInput) =>
  input.currency === 'TL' ? '#,##0 "₺"' : `#,##0 "${SYM[input.currency]}"`;

export async function buildGelirBazliUstHakkiWorkbook(input: GelirBazliUstHakkiInput, r: GelirBazliUstHakkiResult) {
  const wb = new ExcelJS.Workbook();
  wb.creator = `${BRAND.company} · ${BRAND.author}`;
  wb.company = BRAND.company;
  wb.created = new Date();
  const logoId = wb.addImage({ base64: DORA_LOGO_PNG, extension: 'png' });

  const ws = wb.addWorksheet('Basit Gelir Bazli Ust Hakki', {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  ws.columns = [{ width: 3 }, { width: 40 }, { width: 22 }, { width: 3 }];

  ws.mergeCells('A1:C2');
  const t = ws.getCell('A1');
  t.value = '  Basit Gelir Bazli Ust Hakki Hesabi';
  t.font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  t.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 24; ws.getRow(2).height = 20;
  ws.mergeCells('A3:C3');
  const st = ws.getCell('A3');
  st.value = `  Sadelestirilmis Gelir Indirgeme (DCF) · ${BRAND.company}`;
  st.font = { name: 'Arial', size: 9.5, color: { argb: 'FFC4D4E5' } };
  st.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  st.alignment = { vertical: 'middle' };
  ws.getRow(3).height = 15;
  ws.mergeCells('A4:C4');
  ws.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
  ws.getRow(4).height = 3;
  ws.addImage(logoId, { tl: { col: 1.8, row: 0.3 }, ext: { width: 95, height: 29 } });

  let row = 6;
  function section(text: string) {
    ws.mergeCells(`B${row}:C${row}`);
    const c = ws.getCell(`B${row}`);
    c.value = `  ${text}`;
    c.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    ws.getRow(row).height = 18;
    row++;
  }
  function kv(label: string, value: number | string, fmt?: string, bold = false) {
    ws.getCell(`B${row}`).value = label;
    ws.getCell(`B${row}`).font = { name: 'Arial', size: 10, bold };
    const vc = ws.getCell(`C${row}`);
    vc.value = value;
    if (fmt) vc.numFmt = fmt;
    vc.font = { name: 'Arial', size: 10, bold };
    vc.alignment = { horizontal: 'right' };
    row++;
  }

  const hasIdentity = !!(input.hotelName || input.ada || input.parsel);
  if (hasIdentity) {
    section('PARSEL BİLGİLERİ');
    if (input.hotelName) kv('Otel/Tesis Adı', input.hotelName);
    if (input.ada) kv('Ada', input.ada);
    if (input.parsel) kv('Parsel', input.parsel);
    kv('Parsel Alanı', `${input.parcelArea.toLocaleString('tr-TR')} m²${input.fromKml ? ' (KML)' : ''}`);
    row++;
  }

  section('SÜRE VE ORAN');
  kv('Toplam Süre', `${input.toplamSureYil} yıl`);
  kv('Kalan Süre (= Projeksiyon Süresi)', `${input.kalanSureYil} yıl`);
  kv('İskonto Oranı', `%${(r.discountRate * 100).toFixed(1)}`);
  row++;

  section('GİRDİ VARSAYIMLARI');
  kv('Toplam Gelir (1. yıl)', input.toplamGelirBase, TL(input));
  kv('Gelir Artış Oranı', `%${input.gelirArtisOraniPct}`);
  kv('İşletme Gideri Oranı', `%${input.isletmeGideriOraniPct}`);
  kv('Sabit Gider Oranı', `%${input.sabitGiderOraniPct}`);
  if (input.ecrimisilBase > 0) kv(`Ecrimisil (1. yıl, artış %${input.ecrimisilGrowthPct})`, input.ecrimisilBase, TL(input));
  if (input.ustHakkiOdemeBase > 0) kv(`Üst Hakkı Ödemesi (1. yıl, artış %${input.ustHakkiOdemeGrowthPct})`, input.ustHakkiOdemeBase, TL(input));
  if (input.bayilikBase > 0) kv(`Bayilik (1. yıl, artış %${input.bayilikGrowthPct})`, input.bayilikBase, TL(input));
  row++;

  section(`DÖNEMSEL ÖZET TABLOSU (${r.years.length} DÖNEM)`);
  ws.getCell(`B${row}`).value = 'Yıl';
  ws.getCell(`B${row}`).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF6B7A8D' } };
  ws.getCell(`C${row}`).value = 'Bugünkü Değer';
  ws.getCell(`C${row}`).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF6B7A8D' } };
  ws.getCell(`C${row}`).alignment = { horizontal: 'right' };
  row++;
  let zebra = false;
  for (const yr of r.years) {
    if (zebra) {
      ws.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FAINT } };
      ws.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FAINT } };
    }
    zebra = !zebra;
    ws.getCell(`B${row}`).value = `${yr.year}. Yıl — Toplam Gelir ${Math.round(yr.totalRevenue).toLocaleString('tr-TR')} · NOI ${Math.round(yr.noi).toLocaleString('tr-TR')} · Üst Hakkı Sahibine Kalan ${Math.round(yr.ustHakkiSahibineKalan).toLocaleString('tr-TR')}`;
    ws.getCell(`B${row}`).font = { name: 'Arial', size: 8.5 };
    const pv = ws.getCell(`C${row}`);
    pv.value = yr.presentValue;
    pv.numFmt = TL(input);
    pv.font = { name: 'Arial', size: 9, bold: true };
    pv.alignment = { horizontal: 'right' };
    row++;
  }
  row++;

  section('SONUÇ');
  kv('Nakit Akış Bugünkü Değerleri Toplamı', r.sumPresentValue, TL(input));
  if (input.donemSonuIndirgemePct > 0) {
    kv(`Dönem Sonu Değer İndirgeme (%${input.donemSonuIndirgemePct})`, -(r.sumPresentValue - r.ustHakkiDegeriLocal), TL(input));
  }
  row++;

  ws.mergeCells(`B${row}:B${row + 1}`);
  const hero = ws.getCell(`B${row}`);
  hero.value = 'ÜST HAKKI\nDEĞERİ';
  hero.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFC4D4E5' } };
  hero.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  hero.alignment = { vertical: 'middle', indent: 1, wrapText: true };
  ws.mergeCells(`C${row}:C${row + 1}`);
  const hv = ws.getCell(`C${row}`);
  hv.value = r.ustHakkiDegeriRounded;
  hv.numFmt = TL(input);
  hv.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  hv.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  hv.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
  ws.getRow(row).height = 18; ws.getRow(row + 1).height = 18;
  row += 2;

  ws.mergeCells(`A${row}:C${row}`);
  const foot = ws.getCell(`A${row}`);
  foot.value = `${BRAND.preparedBy} · ${BRAND.developerLine} · Yöntem: Basit Gelir Bazlı Üst Hakkı Hesabı (DCF) · ${BRAND.appName} ${BRAND.version}`;
  foot.font = { name: 'Arial', size: 7.5, color: { argb: 'FF8C98A5' } };

  attachDataSheet(wb, { kind: 'usthakki-gelir-bazli', input, result: r });
  return wb;
}

export async function downloadGelirBazliUstHakkiExcel(input: GelirBazliUstHakkiInput, r: GelirBazliUstHakkiResult) {
  const wb = await buildGelirBazliUstHakkiWorkbook(input, r);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, 'Ust-Hakki-Basit-Gelir-Bazli.xlsx');
}
