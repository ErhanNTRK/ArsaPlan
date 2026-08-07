import ExcelJS from 'exceljs';
import { BRAND } from '../brand/brand';
import { DORA_LOGO_PNG } from '../brand/logo';
import { triggerDownload } from '../export/excel';
import { attachDataSheet } from '../export/excelImport';
import type { CostApproachInput, CostApproachResult } from './engine';

export async function downloadCostApproachExcel(input: CostApproachInput, r: CostApproachResult) {
  const cur = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';
  const NAVY = 'FF0F2A47';
  const GOLD = 'FFB28D42';
  const FAINT = 'FFF4F6F9';

  const wb = new ExcelJS.Workbook();
  wb.creator = `${BRAND.company} · ${BRAND.author}`;
  wb.company = BRAND.company;
  wb.created = new Date();
  const logoId = wb.addImage({ base64: DORA_LOGO_PNG, extension: 'png' });

  const ws = wb.addWorksheet('Maliyet Yaklaşımı', {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  ws.columns = [{ width: 3 }, { width: 34 }, { width: 22 }, { width: 3 }];

  ws.mergeCells('A1:D2');
  const t = ws.getCell('A1');
  t.value = `  Maliyet Yaklaşımı — ${input.category || 'Taşınmaz'}`;
  t.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  t.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 24; ws.getRow(2).height = 20;
  ws.mergeCells('A3:D3');
  ws.getCell('A3').value = `  ${BRAND.company}`;
  ws.getCell('A3').font = { name: 'Arial', size: 9.5, color: { argb: 'FFC4D4E5' } };
  ws.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getRow(3).height = 15;
  ws.mergeCells('A4:D4');
  ws.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
  ws.getRow(4).height = 3;
  ws.addImage(logoId, { tl: { col: 2.4, row: 0.3 }, ext: { width: 105, height: 32 } });

  let row = 6;
  function section(text: string) {
    ws.mergeCells(`B${row}:C${row}`);
    ws.getCell(`B${row}`).value = text;
    ws.getCell(`B${row}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    ws.getCell(`B${row}`).alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(row).height = 17;
    row++;
  }
  function kv(label: string, value: string, bold = false) {
    ws.getCell(`B${row}`).value = label;
    ws.getCell(`B${row}`).font = { name: 'Arial', size: 9.5, color: { argb: 'FF5A6774' } };
    ws.getCell(`C${row}`).value = value;
    ws.getCell(`C${row}`).font = { name: 'Arial', size: 9.5, bold };
    ws.getCell(`C${row}`).alignment = { horizontal: 'right' };
    row++;
  }

  section('ARSA');
  kv('Net Arsa Alanı', `${(input.netParcelArea ?? 0).toLocaleString('tr-TR')} m²`);
  kv('Arsa m² Birim Değeri', cur(input.landUnitValue));
  kv('ARSA DEĞERİ', cur(r.landValue), true);
  row++;

  if (r.buildingRows.length > 0) {
    section('YAPILAR');
    const heads = ['Yapı Türü', 'Alan m²', 'Birim Maliyet', 'Amortisman %', 'Değer'];
    heads.forEach((h, i) => {
      const c = ws.getCell(row, 2 + i);
      c.value = h;
      c.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF5A6774' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FAINT } };
      c.alignment = { horizontal: i === 0 ? 'left' : 'right' };
    });
    row++;
    for (const b of r.buildingRows) {
      ws.getCell(row, 2).value = b.type || '—';
      ws.getCell(row, 3).value = b.area.toLocaleString('tr-TR');
      ws.getCell(row, 4).value = cur(b.effectiveUnitCost);
      ws.getCell(row, 5).value = `%${b.depreciationPct}`;
      ws.getCell(row, 6).value = cur(b.buildingValue);
      for (let c = 2; c <= 6; c++) { ws.getCell(row, c).font = { name: 'Arial', size: 8.5 }; if (c > 2) ws.getCell(row, c).alignment = { horizontal: 'right' }; }
      row++;
    }
    kv('TOPLAM YAPILAR DEĞERİ', cur(r.buildingsValue), true);
    row++;
  }

  if (r.adjustmentValue > 0) {
    section('DÜZELTME');
    const label = input.adjustmentType === 'serefiye' ? 'Şerefiye' : input.adjustmentType === 'peyzaj' ? 'Çevre Düzenlemesi' : 'Düzeltme';
    kv(label, cur(r.adjustmentValue));
    row++;
  }

  ws.getCell(`B${row}`).value = 'MALİYET YAKLAŞIMI DEĞERİ';
  ws.getCell(`B${row}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getCell(`B${row}`).alignment = { vertical: 'middle', indent: 1 };
  ws.getCell(`C${row}`).value = cur(r.totalValueRounded);
  ws.getCell(`C${row}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getCell(`C${row}`).alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  ws.getRow(row).height = 20;
  row += 2;
  ws.mergeCells(`B${row}:C${row}`);
  ws.getCell(`B${row}`).value = `${BRAND.preparedBy} · ${BRAND.developerLine} · Maliyet Yaklaşımı Modülü`;
  ws.getCell(`B${row}`).font = { name: 'Arial', size: 7.5, color: { argb: 'FF8C98A5' } };

  attachDataSheet(wb, input);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `Maliyet-Yaklasimi-${(input.category || 'rapor').replace(/\s+/g, '-')}.xlsx`);
}
