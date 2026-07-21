/**
 * EXCEL ÇIKTISI (.xlsx)
 * Bu modül yalnızca "Excel indir" tıklandığında yüklenir (dinamik import),
 * böylece uygulamanın ilk açılışı hafif kalır.
 */
import ExcelJS from 'exceljs';
import type { ProjectInput, AnalysisResult } from '../engine';
import { YAPI_SINIFLARI, TEBLIG_KAYNAK } from '../data/yapiSiniflari';
import { BRAND } from '../brand/brand';
import { DORA_LOGO_PNG } from '../brand/logo';

const NAVY = 'FF0F2A47';
const BAND = 'FFEAEFF5';
const GREEN = 'FFE4EFE2';

const TL = '#,##0 "₺";[Red]-#,##0 "₺";"–"';
const TLM2 = '#,##0 "₺/m²";[Red]-#,##0 "₺/m²";"–"';
const M2 = '#,##0 "m²";[Red]-#,##0 "m²";"–"';
const PCT = '0.0%;[Red]-0.0%;"–"';
const NUM2 = '0.00';

type Row = [string, string | number, string?];

export async function downloadExcel(input: ProjectInput, r: AnalysisResult, version: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = `${BRAND.company} · ${BRAND.author}`;
  wb.company = BRAND.company;
  wb.created = new Date();
  const logoId = wb.addImage({ base64: DORA_LOGO_PNG, extension: 'png' });

  const { capacity: c, financial: f, share: s } = r;
  const p = input.parcel;
  const sinif = YAPI_SINIFLARI.find((x) => x.code === input.cost.buildingClass);
  const bindingText: Record<string, string> = {
    'TAKS': 'Taban alanı katsayısı (TAKS)',
    'KAKS': 'Emsal (KAKS)',
    'ÇEKME MESAFESİ': 'Çekme mesafeleri / yerleşim zarfı',
    'DOĞRUDAN TABAN': 'Doğrudan girilen taban oturumu',
    'DOĞRUDAN İNŞAAT ALANI': 'Doğrudan girilen inşaat alanı',
    'YOK': 'Belirlenemedi',
  };

  function sheet(name: string, title: string) {
    const ws = wb.addWorksheet(name, {
      properties: { defaultRowHeight: 16 },
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } },
    });
    ws.columns = [{ width: 3 }, { width: 46 }, { width: 24 }, { width: 30 }];
    ws.mergeCells('B1:D1');
    const t = ws.getCell('B1');
    t.value = title;
    t.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    t.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(1).height = 30;
    /* Kurumsal logo — başlık bandının sağ ucunda */
    ws.addImage(logoId, { tl: { col: 3.05, row: 0.15 }, ext: { width: 96, height: 29 } });
    return ws;
  }

  function section(ws: ExcelJS.Worksheet, row: number, text: string) {
    ws.mergeCells(`B${row}:D${row}`);
    const cell = ws.getCell(`B${row}`);
    cell.value = text;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: NAVY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BAND } };
    cell.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(row).height = 19;
    return row + 1;
  }

  function rows(ws: ExcelJS.Worksheet, start: number, list: Row[], fmt?: string, highlight = false) {
    let row = start;
    for (const [label, value, note] of list) {
      const l = ws.getCell(`B${row}`);
      l.value = label;
      l.font = { name: 'Arial', size: 10, bold: highlight };
      l.alignment = { indent: 1 };
      const v = ws.getCell(`C${row}`);
      v.value = value;
      v.font = { name: 'Arial', size: 10, bold: highlight, color: { argb: highlight ? 'FF1E6B41' : 'FF17202C' } };
      v.alignment = { horizontal: 'right', indent: 1 };
      if (typeof value === 'number' && fmt) v.numFmt = fmt;
      if (highlight) {
        v.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
      }
      if (note) {
        const n = ws.getCell(`D${row}`);
        n.value = note;
        n.font = { name: 'Arial', size: 8.5, italic: true, color: { argb: 'FF5B6B7F' } };
        n.alignment = { indent: 1, wrapText: false };
      }
      row++;
    }
    return row;
  }

  /* ── 1. RAPOR ── */
  const ws1 = sheet('RAPOR', 'ARSA DEĞER ANALİZİ — YÖNETİCİ ÖZETİ');
  let row = 3;
  ws1.mergeCells(`B${row}:D${row}`);
  ws1.getCell(`B${row}`).value =
    `${p.il} / ${p.ilce}${p.mahalle ? ' · ' + p.mahalle + ' Mah.' : ''} · Ada ${p.ada || '—'} · Parsel ${p.parsel || '—'}`;
  ws1.getCell(`B${row}`).font = { name: 'Arial', size: 10, bold: true };
  ws1.getCell(`B${row}`).alignment = { indent: 1 };
  row += 2;

  row = section(ws1, row, 'SONUÇ');
  row = rows(ws1, row, [
    ['ARTIK ARSA DEĞERİ (RLV)', Math.round(f.residualLandValue)],
    ['ARSA m² BİRİM DEĞERİ', Math.round(f.landUnitValue)],
  ], TL, true);
  ws1.getCell(`C${row - 1}`).numFmt = TLM2;
  row++;

  row = section(ws1, row, 'PARSEL VE İMAR');
  row = rows(ws1, row, [
    ['Parsel Alanı (tapu)', p.area, 'm²'],
    ['Net Parsel Alanı', p.netArea, 'm²'],
    ['Değerleme Konusu', input.assetType === 'konut' ? 'Konut' : input.assetType === 'ticari' ? 'Ticari' : 'Karma'],
    ['Proje Tipi', 'Villa'],
    ['Hesap Yöntemi', input.zoning.mode === 'taks-kaks' ? 'TAKS / KAKS / Hmax' : 'Doğrudan alan girişi'],
    ['TAKS', input.zoning.taks ?? '—'],
    ['KAKS / Emsal', input.zoning.kaks ?? '—'],
    ['Hmax', input.zoning.hmax ?? '—'],
    ['Çekme Mesafeleri (ön/arka/sol/sağ)',
      `${input.zoning.setbackFront} / ${input.zoning.setbackRear} / ${input.zoning.setbackSideLeft} / ${input.zoning.setbackSideRight} m`],
  ]);
  ws1.getCell(`C${row - 9}`).numFmt = M2;
  ws1.getCell(`C${row - 8}`).numFmt = M2;
  ws1.getCell(`C${row - 4}`).numFmt = NUM2;
  ws1.getCell(`C${row - 3}`).numFmt = NUM2;
  row++;

  row = section(ws1, row, 'KAPASİTE');
  const capRows: Row[] = [];
  if (c.envelope.hasGeometry) {
    capRows.push(['Yapılaşma Zarfı',
      `${c.envelope.buildableWidth.toFixed(1)} × ${c.envelope.buildableDepth.toFixed(1)} m = ${Math.round(c.envelope.envelopeArea)} m²`]);
  }
  capRows.push(
    ['Kullanılabilir Taban Alanı', Math.round(c.effectiveFootprint), 'm²'],
    ['Villa Başına Taban Alanı', Math.round(c.footprintPerUnit), 'm²'],
    ['Toplam Zemin Oturumu', Math.round(c.groundCoverage), 'm²'],
    ['VİLLA ADEDİ', c.unitCount, `tahmini aralık: ${c.unitCountRange[0]}–${c.unitCountRange[1]}`],
    ['Bağlayıcı Kısıt', bindingText[c.binding] ?? c.binding],
    ['Emsale Konu Alan', Math.round(c.emsalArea), 'm²'],
    ['Bodrum Alanı', Math.round(c.basementArea), input.emsal.basementInEmsal ? 'emsale dahil' : 'emsal dışı'],
    ['Çatı Arası Alanı', Math.round(c.atticArea), input.emsal.atticInEmsal ? 'emsale dahil' : 'emsal dışı'],
    ['Diğer Emsal Dışı Satılabilir', Math.round(c.extraSaleableArea), 'm²'],
    ['Toplam İnşaat Alanı (brüt)', Math.round(c.grossArea), 'm²'],
    ['Satılabilir Kapalı Alan — emsale konu', Math.round(c.saleableWithinEmsal), 'm²'],
    ['Satılabilir Kapalı Alan — emsal dışı', Math.round(c.saleableOutsideEmsal), 'm²'],
    ['TOPLAM SATILABİLİR KAPALI ALAN', Math.round(c.saleableArea), 'm²'],
    ['Bahçe / Açık Alan', Math.round(c.gardenArea), 'm²'],
  );
  const capStart = row;
  row = rows(ws1, row, capRows);
  for (let i = capStart; i < row; i++) {
    const v = ws1.getCell(`C${i}`);
    if (typeof v.value === 'number') v.numFmt = ws1.getCell(`B${i}`).value === 'VİLLA ADEDİ' ? '#,##0' : M2;
  }
  row++;

  row = section(ws1, row, 'FİZİBİLİTE');
  const finStart = row;
  row = rows(ws1, row, [
    ['Yapı Sınıfı', `${input.cost.buildingClass}${sinif ? ' — ' + sinif.label : ''}`],
    ['Tebliğ Birim Maliyeti', Math.round(input.cost.unitCost)],
    ['Güncelleme Oranı', input.cost.inflationRate],
    ['Güncel Birim Maliyet', Math.round(f.effectiveUnitCost)],
    ['Zemin Üstü İnşaat Maliyeti', Math.round(f.aboveGroundCost)],
    ['Bodrum Maliyeti', Math.round(f.basementCost)],
    ['Çatı Arası Maliyeti', Math.round(f.atticCost)],
    ['Peyzaj ve Bahçe Düzenlemesi', Math.round(f.landscapeCost)],
    ['Proje, Ruhsat, Harç, Müşavirlik', Math.round(f.extrasCost)],
    ['Finansman Gideri', Math.round(f.financeCost)],
    ['TOPLAM MALİYET', Math.round(f.totalCost)],
    ['Villa Satış Hasılatı', Math.round(f.buildingRevenue)],
    ['Bahçe Satış Hasılatı', Math.round(f.gardenRevenue)],
    ['TOPLAM SATIŞ HASILATI', Math.round(f.revenue)],
    ['Müteahhit Kârı', Math.round(f.developerProfit)],
    ['ARTIK ARSA DEĞERİ', Math.round(f.residualLandValue)],
    ['Arsa m² Birim Değeri', Math.round(f.landUnitValue)],
    ['Arsa Değeri / Hasılat', f.landToRevenue],
    ['Satılabilir m² Başına Maliyet', Math.round(f.costPerSaleableM2)],
    ['Fiyat Düşüşüne Dayanım', f.safetyMargin],
  ], TL);
  ws1.getCell(`C${finStart + 1}`).numFmt = TLM2;
  ws1.getCell(`C${finStart + 2}`).numFmt = PCT;
  ws1.getCell(`C${finStart + 3}`).numFmt = TLM2;
  ws1.getCell(`C${finStart + 16}`).numFmt = TLM2;
  ws1.getCell(`C${finStart + 17}`).numFmt = PCT;
  ws1.getCell(`C${finStart + 18}`).numFmt = TLM2;
  ws1.getCell(`C${finStart + 19}`).numFmt = PCT;
  [finStart + 10, finStart + 13, finStart + 15].forEach((i) => {
    ws1.getCell(`B${i}`).font = { name: 'Arial', size: 10, bold: true };
    ws1.getCell(`C${i}`).font = { name: 'Arial', size: 10, bold: true };
  });
  row++;

  if (input.share.enabled) {
  row = section(ws1, row, 'KAT KARŞILIĞI');
  const shStart = row;
  row = rows(ws1, row, [
    ['Arsa Sahibi Payı', s.ownerShare],
    ['Müteahhit Payı', s.contractorShare],
    ['Arsa Sahibine Kalan Değer', Math.round(s.ownerValue)],
    ['Müteahhide Kalan Değer', Math.round(s.contractorValue)],
    ['Müteahhit Net Sonucu (maliyet sonrası)', Math.round(s.contractorNet)],
    ['Artık Değere Denk Gelen Pay', s.balancedShare],
    ['Fark (Kat Karşılığı − Artık Değer)', Math.round(s.difference)],
    ['Değerlendirme', s.verdict === 'dengeli' ? 'Dengeli paylaşım'
      : s.verdict === 'arsa-sahibi-lehine' ? 'Arsa sahibi lehine' : 'Müteahhit lehine'],
  ], TL);
  ws1.getCell(`C${shStart}`).numFmt = PCT;
  ws1.getCell(`C${shStart + 1}`).numFmt = PCT;
  ws1.getCell(`C${shStart + 5}`).numFmt = PCT;
  }
  row += 2;

  ws1.mergeCells(`B${row}:D${row}`);
  ws1.getCell(`B${row}`).value =
    `${BRAND.preparedBy} · ${BRAND.authorLine}\n` +
    `Yöntem: Artık Değer (Residual Land Value) · Tutarlar KDV hariçtir · Birim maliyet kaynağı: ${TEBLIG_KAYNAK} · ${BRAND.appName} ${version}`;
  ws1.getCell(`B${row}`).alignment = { indent: 1, wrapText: true };
  ws1.getRow(row).height = 26;
  ws1.getCell(`B${row}`).font = { name: 'Arial', size: 8.5, italic: true, color: { argb: 'FF5B6B7F' } };
  ws1.getCell(`B${row}`).alignment = { indent: 1 };

  /* ── 2. GİRDİLER ── */
  const ws2 = sheet('GİRDİLER', 'ANALİZDE KULLANILAN VARSAYIMLAR');
  let r2 = 3;
  r2 = section(ws2, r2, 'GİRDİ ÖZETİ');
  r2 = rows(ws2, r2, [
    ['Villa Tipi', input.villa.villaType === 'mustakil' ? 'Müstakil' : input.villa.villaType === 'ikiz' ? 'İkiz' : 'Sıralı'],
    ['Villa Kurgusu', input.villa.mode === 'adet' ? 'Adetten büyüklüğe' : 'Büyüklükten adede'],
    ['Villa Brüt Alanı (adet başına)', Math.round(r.capacity.grossPerVilla), 'm²'],
    ['Villa Kat Adedi (bodrum dahil)', input.villa.floorsPerVilla],
    ['Zemin Üstü Kat Adedi', r.capacity.aboveGroundFloors],
    ['Yerleşim Verimliliği', input.villa.layoutEfficiency],
    ['Bodrum', input.emsal.hasBasement
      ? `Var — ${input.emsal.basementInEmsal ? 'emsale dahil' : 'emsal dışı'}, ${input.emsal.basementSaleable ? 'satılabilir' : 'satılamaz'}` : 'Yok'],
    ['Çatı Arası Piyesi', input.emsal.hasAttic
      ? `Var — ${input.emsal.atticInEmsal ? 'emsale dahil' : 'emsal dışı'}, ${input.emsal.atticSaleable ? 'satılabilir' : 'satılamaz'}` : 'Yok'],
    ['Diğer Emsal Dışı Satılabilir (villa başına)', input.emsal.extraSaleablePerUnit, 'm²'],
    ['Peyzaj Birim Maliyeti', input.site.landscapeUnitCost],
    ['Bahçe Satış Değeri', input.site.gardenPricePerM2],
    ['Villa Satış Birim Değeri', input.sales.unitPrice],
    ['Müteahhit Kâr Oranı', input.residual.profitRate],
    ['Finansman Gideri (toplam maliyetin yüzdesi)', input.residual.financeRateOfCost],
    ['Kat Karşılığı Bölümü', input.share.enabled ? 'Raporda gösteriliyor' : 'Kapalı'],
    ['Arsa Sahibi Payı', input.share.ownerShare],
  ]);
  [5, 13, 14, 16].forEach((i) => { ws2.getCell(`C${3 + i}`).numFmt = PCT; });
  ws2.getCell('C5').numFmt = M2;
  ws2.getCell('C12').numFmt = TLM2;
  ws2.getCell('C13').numFmt = TLM2;
  ws2.getCell('C14').numFmt = TLM2;
  if (input.zoning.planNotes.trim()) {
    r2 += 1;
    r2 = section(ws2, r2, 'PLAN NOTLARI');
    ws2.mergeCells(`B${r2}:D${r2 + 4}`);
    const pn = ws2.getCell(`B${r2}`);
    pn.value = input.zoning.planNotes;
    pn.font = { name: 'Arial', size: 9.5 };
    pn.alignment = { vertical: 'top', wrapText: true, indent: 1 };
  }

  /* ── 3. UZMAN GÖRÜŞÜ ── */
  const ws3 = sheet('UZMAN GÖRÜŞÜ', 'UZMAN DEĞERLENDİRMESİ');
  ws3.columns = [{ width: 3 }, { width: 14 }, { width: 34 }, { width: 92 }];
  let r3 = 3;
  const head = ['DÜZEY', 'BAŞLIK', 'DEĞERLENDİRME'];
  head.forEach((h, i) => {
    const cell = ws3.getCell(r3, 2 + i);
    cell.value = h;
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3F66' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  r3++;
  const levelText: Record<string, string> = { olumlu: 'OLUMLU', bilgi: 'BİLGİ', dikkat: 'DİKKAT', uyari: 'UYARI' };
  const levelColor: Record<string, string> = { olumlu: 'FF1E6B41', bilgi: 'FF0F2A47', dikkat: 'FF92610A', uyari: 'FFB42318' };
  for (const a of r.advice) {
    ws3.getCell(`B${r3}`).value = levelText[a.level];
    ws3.getCell(`B${r3}`).font = { name: 'Arial', size: 9, bold: true, color: { argb: levelColor[a.level] } };
    ws3.getCell(`B${r3}`).alignment = { horizontal: 'center', vertical: 'top' };
    ws3.getCell(`C${r3}`).value = a.title;
    ws3.getCell(`C${r3}`).font = { name: 'Arial', size: 9.5, bold: true };
    ws3.getCell(`C${r3}`).alignment = { vertical: 'top', wrapText: true, indent: 1 };
    ws3.getCell(`D${r3}`).value = a.body;
    ws3.getCell(`D${r3}`).font = { name: 'Arial', size: 9.5 };
    ws3.getCell(`D${r3}`).alignment = { vertical: 'top', wrapText: true, indent: 1 };
    ws3.getRow(r3).height = Math.max(30, Math.ceil(a.body.length / 95) * 13);
    r3++;
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const name = `Arsa-Analizi-${(p.ilce || p.il || 'rapor').replace(/\s+/g, '-')}-${p.ada || ''}-${p.parsel || ''}.xlsx`
    .replace(/-+\./, '.');
  triggerDownload(blob, name);
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
