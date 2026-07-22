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

const VERDICT_TEXT: Record<string, string> = {
  'yakin': 'İki yöntem birbirine yakın',
  'kat-karsiligi-yuksek': 'Kat karşılığı değeri daha yüksek',
  'gelir-yontemi-yuksek': 'Gelir yöntemi değeri daha yüksek',
};

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

  const { capacity: c, financial: f, share: s, apartment: apt } = r;
  const p = input.parcel;
  const sinif = YAPI_SINIFLARI.find((x) => x.code === input.cost.buildingClass);

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
    ['Proje Tipi', apt ? '3-8 Katlı Bina' : 'Villa'],
    ['Plan Lejantı', input.zoning.lejant.trim() || '—'],
    ['Hesap Yöntemi', input.zoning.mode === 'taks-kaks' ? 'TAKS / KAKS' : 'Doğrudan alan girişi'],
    ['TAKS', input.zoning.taks ?? '—'],
    ['KAKS / Emsal', input.zoning.kaks ?? '—'],
    ['Hmax', input.zoning.hmax ?? '—'],
  ]);
  ws1.getCell(`C${row - 9}`).numFmt = M2;
  ws1.getCell(`C${row - 8}`).numFmt = M2;
  ws1.getCell(`C${row - 3}`).numFmt = NUM2;
  ws1.getCell(`C${row - 2}`).numFmt = NUM2;
  row++;

  if (apt) {
    row = section(ws1, row, 'KAT TABLOSU');
    /* Başlık satırı */
    const heads = ['KAT BİLGİSİ', 'KAT ALANI', 'SATILABİLİR ALAN'];
    heads.forEach((h, i) => {
      const cell = ws1.getCell(row, 2 + i);
      cell.value = h;
      cell.font = { name: 'Arial', size: 8.5, bold: true, color: { argb: 'FF5B6B7F' } };
      cell.alignment = i === 0 ? { indent: 1 } : { horizontal: 'right', indent: 1 };
    });
    row++;
    for (const fl of apt.floors) {
      ws1.getCell(`B${row}`).value = fl.label;
      ws1.getCell(`B${row}`).font = { name: 'Arial', size: 10 };
      ws1.getCell(`B${row}`).alignment = { indent: 1 };
      const ca = ws1.getCell(`C${row}`);
      ca.value = fl.area; ca.numFmt = M2;
      ca.font = { name: 'Arial', size: 10 }; ca.alignment = { horizontal: 'right', indent: 1 };
      const cs = ws1.getCell(`D${row}`);
      const ortak = fl.kind === 'bodrum' && input.apartment.basements[fl.index - 1]?.use === 'ortak';
      cs.value = ortak ? 'ortak mahal' : fl.saleable;
      if (typeof cs.value === 'number') cs.numFmt = M2;
      cs.font = { name: 'Arial', size: 10, italic: typeof cs.value === 'string' };
      cs.alignment = { horizontal: 'right', indent: 1 };
      row++;
    }
    /* Toplam satırı */
    ws1.getCell(`B${row}`).value = 'TOPLAM';
    ws1.getCell(`C${row}`).value = apt.totalArea;
    ws1.getCell(`D${row}`).value = apt.saleableTotal;
    ['B', 'C', 'D'].forEach((col) => {
      const cell = ws1.getCell(`${col}${row}`);
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
      if (col !== 'B') { cell.numFmt = M2; cell.alignment = { horizontal: 'right', indent: 1 }; }
      else cell.alignment = { indent: 1 };
    });
    row += 2;
    const sumStart = row;
    row = rows(ws1, row, [
      ...(apt.mode === 'taks-kaks' ? [
        ['Taban Oturumu Limiti (parsel × TAKS)', Math.round(apt.footprintArea), 'm²'] as Row,
        ['İlave Satılabilir Alan (emsal dışı)', Math.round(apt.extraSaleableArea), 'm²'] as Row,
      ] : []),
      ['Bahçe / Açık Alan', Math.round(apt.gardenArea), 'm²'],
    ]);
    for (let i = sumStart; i < row; i++) {
      const cell = ws1.getCell(`C${i}`);
      if (typeof cell.value === 'number') cell.numFmt = M2;
    }
    row++;
  } else {
  row = section(ws1, row, 'ALAN ÜRETİMİ');
  const capStart = row;
  row = rows(ws1, row, [
    ['Taban Oturumu', Math.round(c.footprintArea), 'm²'],
    ['Emsale Dahil Alan', Math.round(c.emsalArea), 'm²'],
    ['Emsal Dışı Satılabilir Alan', Math.round(c.extraArea), 'm²'],
    ['Çatı Katı', Math.round(c.atticArea), input.emsal.atticInEmsal ? 'emsale dahil' : 'emsal dışı'],
    ['Bodrum Kat', Math.round(c.basementArea), input.emsal.basementInEmsal ? 'emsale dahil' : 'emsal dışı'],
    ['Emsalden Kullanılan (çatı/bodrum)', Math.round(c.emsalConsumedByExtras), 'm²'],
    ['Zemin Üstü Katlara Kalan', Math.round(c.aboveGroundArea), 'm²'],
    ['TOPLAM İNŞAAT ALANI', Math.round(c.totalArea), 'm²'],
    ['Bahçe / Açık Alan', Math.round(c.gardenArea), 'm²'],
    ['Villa Adedi', c.unitCount > 0 ? c.unitCount : '—'],
    ['Villa Başına Toplam Alan', Math.round(c.areaPerUnit), 'm²'],
    ['Zemin Üstü Kat Adedi', c.floorsAboveGround],
    ['Kat Başına Alan', Math.round(c.areaPerFloor), 'm²'],
  ]);
  for (let i = capStart; i < row; i++) {
    const cell = ws1.getCell(`C${i}`);
    const lbl = String(ws1.getCell(`B${i}`).value);
    if (typeof cell.value === 'number' && lbl !== 'Villa Adedi' && lbl !== 'Zemin Üstü Kat Adedi') cell.numFmt = M2;
  }
  ws1.getCell(`B${capStart + 7}`).font = { name: 'Arial', size: 10, bold: true };
  ws1.getCell(`C${capStart + 7}`).font = { name: 'Arial', size: 10, bold: true };
  row++;
  }

  row = section(ws1, row, 'FİZİBİLİTE');
  if (apt) {
    /* [etiket, değer, biçim, kalın] — apartman fizibilitesi kat tipi bazlı birim değerlerle */
    const aptFin: Array<[string, string | number, string | null, boolean]> = [
      ['Yapı Sınıfı', `${input.cost.buildingClass}${sinif ? ' — ' + sinif.label : ''}`, null, false],
      ['Tebliğ Birim Maliyeti', Math.round(input.cost.unitCost), TLM2, false],
      ['Güncelleme Oranı', input.cost.inflationRate, PCT, false],
      ['Güncel Birim Maliyet', Math.round(f.effectiveUnitCost), TLM2, false],
      ['İnşaat Maliyeti (toplam kat alanı üzerinden)', Math.round(f.constructionCost), TL, false],
      ['Peyzaj ve Bahçe Düzenlemesi', Math.round(f.landscapeCost), TL, false],
      ['Proje, Ruhsat, Harç, Müşavirlik', Math.round(f.extrasCost), TL, false],
      ['Finansman Gideri', Math.round(f.financeCost), TL, false],
      ['TOPLAM MALİYET', Math.round(f.totalCost), TL, true],
      ...(apt.saleableByKind.bodrum > 0
        ? [['Bodrum Satış Birim Değeri', Math.round(input.sales.apt.bodrum), TLM2, false] as [string, number, string, boolean]] : []),
      ['Zemin Kat Satış Birim Değeri', Math.round(input.sales.apt.zemin), TLM2, false],
      ['Normal Kat Satış Birim Değeri', Math.round(input.sales.apt.normal), TLM2, false],
      ...(apt.saleableByKind.piyes > 0
        ? [['Piyes Satış Birim Değeri', Math.round(input.sales.apt.piyes), TLM2, false] as [string, number, string, boolean]] : []),
      ['Yapı Satış Hasılatı', Math.round(f.buildingRevenue), TL, false],
      ['Bahçe Satış Hasılatı', Math.round(f.gardenRevenue), TL, false],
      ['TOPLAM SATIŞ HASILATI', Math.round(f.revenue), TL, true],
      ['Müteahhit Kârı', Math.round(f.developerProfit), TL, false],
      ['ARTIK ARSA DEĞERİ', Math.round(f.residualLandValue), TL, true],
      ['Arsa m² Birim Değeri', Math.round(f.landUnitValue), TLM2, false],
      ['Arsa Değeri / Hasılat', f.landToRevenue, PCT, false],
      ['Satılabilir m² Başına Maliyet', Math.round(f.costPerSaleableM2), TLM2, false],
    ];
    for (const [label, value, fmt, bold] of aptFin) {
      const l = ws1.getCell(`B${row}`);
      l.value = label; l.font = { name: 'Arial', size: 10, bold }; l.alignment = { indent: 1 };
      const v = ws1.getCell(`C${row}`);
      v.value = value;
      v.font = { name: 'Arial', size: 10, bold };
      v.alignment = { horizontal: 'right', indent: 1 };
      if (typeof value === 'number' && fmt) v.numFmt = fmt;
      if (bold) v.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
      row++;
    }
  } else {
  const finStart = row;
  row = rows(ws1, row, [
    ['Yapı Sınıfı', `${input.cost.buildingClass}${sinif ? ' — ' + sinif.label : ''}`],
    ['Tebliğ Birim Maliyeti', Math.round(input.cost.unitCost)],
    ['Güncelleme Oranı', input.cost.inflationRate],
    ['Güncel Birim Maliyet', Math.round(f.effectiveUnitCost)],
    ['İnşaat Maliyeti', Math.round(f.constructionCost)],
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
  ], TL);
  ws1.getCell(`C${finStart + 1}`).numFmt = TLM2;
  ws1.getCell(`C${finStart + 2}`).numFmt = PCT;
  ws1.getCell(`C${finStart + 3}`).numFmt = TLM2;
  ws1.getCell(`C${finStart + 14}`).numFmt = TLM2;
  ws1.getCell(`C${finStart + 15}`).numFmt = PCT;
  ws1.getCell(`C${finStart + 16}`).numFmt = TLM2;
  [finStart + 8, finStart + 11, finStart + 13].forEach((i) => {
    ws1.getCell(`B${i}`).font = { name: 'Arial', size: 10, bold: true };
    ws1.getCell(`C${i}`).font = { name: 'Arial', size: 10, bold: true };
  });
  }
  row++;

  if (input.share.enabled) {
  row = section(ws1, row, 'ARSA DEĞERİ — YÖNTEM KARŞILAŞTIRMASI');
  const shStart = row;
  row = rows(ws1, row, [
    ['Arsa Sahibi Payı', s.ownerShare],
    ['Müteahhit Payı', s.contractorShare],
    ['Kat Karşılığı Yöntemine Göre Arsa Değeri', Math.round(s.shareLandValue)],
    ['Gelir Yöntemine Göre Arsa Değeri', Math.round(f.residualLandValue)],
    ['İki Yöntem Arasındaki Fark', Math.round(Math.abs(s.difference))],
    ['Farkın Oranı', Math.abs(s.differenceRate)],
    ['Gelir Yöntemine Denk Gelen Arsa Payı', s.balancedShare],
    ['Değerlendirme', VERDICT_TEXT[s.verdict]],
  ], TL);
  ws1.getCell(`C${shStart}`).numFmt = PCT;
  ws1.getCell(`C${shStart + 1}`).numFmt = PCT;
  ws1.getCell(`C${shStart + 5}`).numFmt = PCT;
  ws1.getCell(`C${shStart + 6}`).numFmt = PCT;
  [shStart + 2, shStart + 3].forEach((i) => {
    ws1.getCell(`B${i}`).font = { name: 'Arial', size: 10, bold: true };
    ws1.getCell(`C${i}`).font = { name: 'Arial', size: 10, bold: true };
  });
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
  if (apt) {
    const a = input.apartment;
    const aktifBodrum = a.basements.slice(0, Math.min(4, Math.max(0, a.basementCount)));
    const list: Row[] = [
      ['Hesap Yöntemi', apt.mode === 'taks-kaks' ? 'TAKS / KAKS' : 'Doğrudan Alan'],
      ['Bodrum Kat Sayısı', aktifBodrum.length],
      ...aktifBodrum.map((b, i): Row => [
        `${i + 1}. Bodrum Kullanımı`,
        b.use === 'ortak' ? 'Ortak mahal (satılamaz)' : `Konut${apt.mode === 'taks-kaks' ? ` · kayıp %${(b.lossRate * 100).toFixed(0)}` : ''}`,
      ]),
      ['Normal Kat Sayısı', apt.normalFloorCount,
        apt.mode === 'taks-kaks' && apt.derivedFloorsFromHmax != null
          ? `Hmax → zemin dahil ${apt.derivedFloorsFromHmax} kat` : undefined],
      ['Çatı Arası Piyesi', a.hasPiyes
        ? (apt.mode === 'taks-kaks'
          ? `Var · normal katın %${(a.piyesRate * 100).toFixed(0)}'i · ${a.piyesInEmsal ? 'emsale dahil' : 'emsal dışı'}`
          : 'Var')
        : 'Yok'],
      ...(apt.mode === 'taks-kaks' ? [
        ['Zemin Kat Alan Kaybı', a.zeminLossRate] as Row,
        ['Normal Kat Ortak Mahal Payı', a.normalCommonRate] as Row,
        ['İlave Satılabilir Alan', a.hasExtraSaleable
          ? (a.extraMode === 'oran' ? `Emsalin %${(a.extraRate * 100).toFixed(1)}'i` : `${a.extraArea} m² (elle)`)
          : 'Yok'] as Row,
      ] : []),
      ['Peyzaj Birim Maliyeti', input.site.landscapeUnitCost],
      ['Bahçe Satış Değeri', input.site.gardenPricePerM2],
      ['Bodrum Satış Birim Değeri', input.sales.apt.bodrum],
      ['Zemin Kat Satış Birim Değeri', input.sales.apt.zemin],
      ['Normal Kat Satış Birim Değeri', input.sales.apt.normal],
      ['Piyes Satış Birim Değeri', input.sales.apt.piyes],
      ['Müteahhit Kâr Oranı', input.residual.profitRate],
      ['Finansman Gideri (toplam maliyetin yüzdesi)', input.residual.financeRateOfCost],
      ['Kat Karşılığı Bölümü', input.share.enabled ? 'Raporda gösteriliyor' : 'Kapalı'],
      ['Arsa Sahibi Payı', input.share.ownerShare],
    ];
    const start2 = r2;
    r2 = rows(ws2, start2, list);
    for (let i = start2; i < r2; i++) {
      const lbl = String(ws2.getCell(`B${i}`).value);
      const cell = ws2.getCell(`C${i}`);
      if (typeof cell.value !== 'number') continue;
      if (lbl.includes('Birim Değeri') || lbl.includes('Birim Maliyeti') || lbl.includes('Satış Değeri')) cell.numFmt = TLM2;
      else if (lbl.includes('Oranı') || lbl.includes('Kaybı') || lbl.includes('Payı') || lbl.includes('Gideri')) cell.numFmt = PCT;
    }
  } else {
  r2 = rows(ws2, r2, [
    ['Villa Tipi', input.villa.villaType === 'mustakil' ? 'Müstakil' : input.villa.villaType === 'ikiz' ? 'İkiz' : 'Sıralı'],
    ['Villa Adedi', input.villa.unitCount > 0 ? input.villa.unitCount : 'Girilmedi'],
    ['Zemin Üstü Kat Adedi', input.villa.floorsAboveGround],
    ['Emsal Dışı Satılabilir Alan', input.emsal.hasExtra
      ? (input.emsal.extraMode === 'oran' ? `Emsalin %${(input.emsal.extraRate * 100).toFixed(1)}'i` : `${input.emsal.extraArea} m² (elle)`) : 'Yok'],
    ['Çatı Katı', input.emsal.hasAttic
      ? `${input.emsal.atticMode === 'oran' ? 'Tabanın %' + (input.emsal.atticRate * 100).toFixed(0) + "'i" : input.emsal.atticArea + ' m² (elle)'} · ${input.emsal.atticInEmsal ? 'emsale dahil' : 'emsal dışı'}` : 'Yok'],
    ['Bodrum Kat', input.emsal.hasBasement
      ? `${input.emsal.basementMode === 'oran' ? 'Tabanın %' + (input.emsal.basementRate * 100).toFixed(0) + "'i" : input.emsal.basementArea + ' m² (elle)'} · ${input.emsal.basementInEmsal ? 'emsale dahil' : 'emsal dışı'}` : 'Yok'],
    ['Peyzaj Birim Maliyeti', input.site.landscapeUnitCost],
    ['Bahçe Satış Değeri', input.site.gardenPricePerM2],
    ['Satış Birim Değeri (toplam inşaat m²)', input.sales.unitPrice],
    ['Müteahhit Kâr Oranı', input.residual.profitRate],
    ['Finansman Gideri (toplam maliyetin yüzdesi)', input.residual.financeRateOfCost],
    ['Kat Karşılığı Bölümü', input.share.enabled ? 'Raporda gösteriliyor' : 'Kapalı'],
    ['Arsa Sahibi Payı', input.share.ownerShare],
  ]);
  ['C10', 'C11', 'C12'].forEach((a) => { ws2.getCell(a).numFmt = TLM2; });
  ['C13', 'C14', 'C16'].forEach((a) => { ws2.getCell(a).numFmt = PCT; });
  }
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
  const levelText: Record<string, string> = { olumlu: 'OLUMLU', bilgi: 'BİLGİ', dikkat: 'DİKKAT', uyari: 'UYARI', 'uyari-uygulama': 'UYARI' };
  const levelColor: Record<string, string> = { olumlu: 'FF1E6B41', bilgi: 'FF0F2A47', dikkat: 'FF92610A', uyari: 'FFB42318', 'uyari-uygulama': 'FF92610A' };
  for (const a of r.advice) {
    if (a.level === 'uyari-uygulama') continue;   // yalnızca uygulama ekranında gösterilir
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
