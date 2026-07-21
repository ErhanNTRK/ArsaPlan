/**
 * PDF ÇIKTISI
 * jsPDF + gömülü Türkçe font. Yalnızca "PDF indir" tıklandığında yüklenir.
 */
import { jsPDF } from 'jspdf';
import type { ProjectInput, AnalysisResult } from '../engine';
import { YAPI_SINIFLARI } from '../data/yapiSiniflari';
import { BRAND } from '../brand/brand';
import { DORA_LOGO_PNG, DORA_LOGO_W, DORA_LOGO_H } from '../brand/logo';
import { triggerDownload } from './excel';

const NAVY: [number, number, number] = [15, 42, 71];
const BAND: [number, number, number] = [234, 239, 245];
const GREEN: [number, number, number] = [30, 107, 65];
const RED: [number, number, number] = [180, 35, 24];
const AMBER: [number, number, number] = [146, 97, 10];
const GRAY: [number, number, number] = [85, 99, 111];

const tl = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';
const tlm2 = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺/m²';
const m2 = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' m²';
const pct = (v: number, d = 1) => '%' + (v * 100).toFixed(d).replace('.', ',');
const num2 = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function downloadPdf(input: ProjectInput, r: AnalysisResult, version: string) {
  const { FONT_REGULAR, FONT_BOLD } = await import('./font');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.addFileToVFS('NTRK-Regular.ttf', FONT_REGULAR);
  doc.addFont('NTRK-Regular.ttf', 'NTRK', 'normal');
  doc.addFileToVFS('NTRK-Bold.ttf', FONT_BOLD);
  doc.addFont('NTRK-Bold.ttf', 'NTRK', 'bold');
  doc.setFont('NTRK', 'normal');

  const M = 14, W = 210 - 2 * M;
  let y = 0;
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

  function pageBreak(need = 14) {
    if (y + need > 282) { doc.addPage(); y = 16; }
  }
  function header() {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
    doc.text(`${BRAND.appName} — ARSA DEĞER ANALİZİ`, M, 11);
    doc.setFont('NTRK', 'normal'); doc.setFontSize(8.5); doc.setTextColor(190, 208, 226);
    doc.text('Proje Geliştirme · Artık Değer (Residual Land Value) Yöntemi', M, 17.5);
    /* Kurumsal logo — beyaz zemin üzerinde, sağ üstte */
    const lh = 9.5, lw = (DORA_LOGO_W / DORA_LOGO_H) * lh;
    const lx = 210 - M - lw, ly = 8.5;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(lx - 2.5, ly - 2, lw + 5, lh + 4, 1.5, 1.5, 'F');
    doc.addImage(DORA_LOGO_PNG, 'PNG', lx, ly, lw, lh);
    y = 34;
  }
  function section(title: string) {
    pageBreak(20);
    doc.setFillColor(...BAND);
    doc.rect(M, y - 4.5, W, 7, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text(title, M + 2, y);
    y += 8;
  }
  function row(label: string, value: string, bold = false, color: [number, number, number] = [23, 32, 44]) {
    pageBreak();
    doc.setFont('NTRK', bold ? 'bold' : 'normal'); doc.setFontSize(9);
    doc.setTextColor(...(bold ? NAVY : GRAY));
    doc.text(label, M + 1, y);
    doc.setTextColor(...color);
    doc.setFont('NTRK', 'bold');
    doc.text(value, 210 - M - 1, y, { align: 'right' });
    doc.setDrawColor(223, 229, 236);
    doc.line(M, y + 1.8, 210 - M, y + 1.8);
    y += 6.2;
  }
  function paragraph(text: string, size = 8.5, color: [number, number, number] = GRAY) {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W - 2);
    for (const line of lines) { pageBreak(6); doc.text(line, M + 1, y); y += size * 0.48 + 1.2; }
  }

  header();

  /* Künye */
  doc.setFont('NTRK', 'bold'); doc.setFontSize(11); doc.setTextColor(23, 32, 44);
  doc.text(`${p.il} / ${p.ilce}${p.mahalle ? ' · ' + p.mahalle + ' Mah.' : ''}`, M, y);
  y += 5;
  doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
  doc.text(`Ada ${p.ada || '—'} · Parsel ${p.parsel || '—'} · ${m2(p.area)} · ${input.zoning.lejant || 'Lejant girilmedi'}`, M, y);
  y += 9;

  /* Sonuç kutusu */
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y - 5, W, 24, 2, 2, 'F');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(159, 180, 204);
  doc.text('ARTIK ARSA DEĞERİ', M + 4, y + 1);
  doc.text('ARSA m² BİRİM DEĞERİ', M + W / 2 + 4, y + 1);
  doc.setFont('NTRK', 'bold'); doc.setFontSize(15); doc.setTextColor(255, 255, 255);
  doc.text(tl(f.residualLandValue), M + 4, y + 9);
  doc.text(tlm2(f.landUnitValue), M + W / 2 + 4, y + 9);
  doc.setFont('NTRK', 'normal'); doc.setFontSize(7.5); doc.setTextColor(185, 201, 220);
  doc.text(`${c.unitCount} villa · ${m2(c.saleableArea)} satılabilir alan · arsa payı hasılatın ${pct(f.landToRevenue)} kadarı`, M + 4, y + 15);
  y += 28;

  section('PARSEL VE İMAR');
  row('Parsel Alanı (tapu)', m2(p.area));
  row('Net Parsel Alanı', m2(p.netArea));
  row('Hesap Yöntemi', input.zoning.mode === 'taks-kaks' ? 'TAKS / KAKS / Hmax' : 'Doğrudan alan girişi');
  if (input.zoning.mode === 'taks-kaks') {
    row('TAKS / KAKS', `${input.zoning.taks != null ? num2(input.zoning.taks) : '—'} / ${input.zoning.kaks != null ? num2(input.zoning.kaks) : '—'}`);
    if (input.zoning.hmax) row('Hmax', `${input.zoning.hmax} m`);
  } else {
    row('Taban Oturumu (girilen)', m2(input.zoning.directFootprint));
    row('Toplam İnşaat Alanı (girilen)', m2(input.zoning.directTotalArea));
  }
  row('Çekme Mesafeleri (ön/arka/sol/sağ)',
    `${input.zoning.setbackFront} / ${input.zoning.setbackRear} / ${input.zoning.setbackSideLeft} / ${input.zoning.setbackSideRight} m`);
  if (c.envelope.hasGeometry) {
    row('Yapılaşma Zarfı',
      `${c.envelope.buildableWidth.toFixed(1)} × ${c.envelope.buildableDepth.toFixed(1)} m = ${m2(c.envelope.envelopeArea)}`);
  }
  y += 3;

  section('KAPASİTE');
  row('Kullanılabilir Taban Alanı', m2(c.effectiveFootprint));
  row('Villa Başına Taban Alanı', m2(c.footprintPerUnit));
  row('Toplam Zemin Oturumu', m2(c.groundCoverage));
  row('Villa Kat Adedi', `${input.villa.floorsPerVilla} (zemin üstü ${c.aboveGroundFloors})`);
  row('VİLLA ADEDİ',
    `${c.unitCount}${c.unitCountRange[0] !== c.unitCountRange[1] ? `  (${c.unitCountRange[0]}–${c.unitCountRange[1]})` : ''}`,
    true, NAVY);
  if (c.emsalLeftover > 1) row('Kullanılmayan İnşaat Hakkı', m2(c.emsalLeftover), false, RED);
  row('Bağlayıcı Kısıt', bindingText[c.binding] ?? c.binding);
  row('Emsale Konu Alan', m2(c.emsalArea));
  row('Villa Başına Zemin Üstü Brüt', m2(c.grossPerVilla));
  if (c.basementArea > 0) {
    row(`Bodrum — ${c.unitCount} × ${m2(c.basementArea / Math.max(1, c.unitCount))} (${input.emsal.basementInEmsal ? 'emsale dahil' : 'emsal dışı'})`, m2(c.basementArea));
  }
  if (c.atticArea > 0) {
    row(`Çatı Arası — ${c.unitCount} × ${m2(c.atticArea / Math.max(1, c.unitCount))} (${input.emsal.atticInEmsal ? 'emsale dahil' : 'emsal dışı'})`, m2(c.atticArea));
  }
  if (c.extraSaleableArea > 0) {
    row(`Diğer Emsal Dışı Satılabilir — ${c.unitCount} × ${m2(c.extraSaleableArea / Math.max(1, c.unitCount))}`, m2(c.extraSaleableArea));
  }
  row('Toplam İnşaat Alanı (brüt)', m2(c.grossArea));
  row('Satılabilir Kapalı Alan — emsale konu', m2(c.saleableWithinEmsal));
  if (c.saleableOutsideEmsal > 0) row('Satılabilir Kapalı Alan — emsal dışı', m2(c.saleableOutsideEmsal));
  row('TOPLAM SATILABİLİR KAPALI ALAN', m2(c.saleableArea), true, NAVY);
  row('Bahçe / Açık Alan', m2(c.gardenArea));
  y += 3;

  section('FİZİBİLİTE');
  row('Yapı Sınıfı', `${input.cost.buildingClass}${sinif ? ' — ' + sinif.label : ''}`);
  row('Güncel Birim Maliyet', tlm2(f.effectiveUnitCost));
  row('Zemin Üstü İnşaat', tl(f.aboveGroundCost));
  if (f.basementCost > 0) row('Bodrum İnşaatı', tl(f.basementCost));
  if (f.atticCost > 0) row('Çatı Arası', tl(f.atticCost));
  if (f.landscapeCost > 0) row('Peyzaj ve Bahçe Düzenlemesi', tl(f.landscapeCost));
  if (f.extrasCost > 0) row('Proje, Ruhsat, Harç, Müşavirlik', tl(f.extrasCost));
  if (f.financeCost > 0) row('Finansman Gideri', tl(f.financeCost));
  row('TOPLAM MALİYET', tl(f.totalCost), true, RED);
  row('Villa Satış Hasılatı', tl(f.buildingRevenue));
  if (f.gardenRevenue > 0) row('Bahçe Satış Hasılatı', tl(f.gardenRevenue));
  row('TOPLAM SATIŞ HASILATI', tl(f.revenue), true, GREEN);
  row(`Müteahhit Kârı (${pct(input.residual.profitRate, 0)})`, tl(f.developerProfit), true, RED);
  row('ARTIK ARSA DEĞERİ', tl(f.residualLandValue), true, f.residualLandValue < 0 ? RED : GREEN);
  row('Arsa m² Birim Değeri', tlm2(f.landUnitValue), true);
  row('Arsa Değeri / Hasılat', pct(f.landToRevenue));
  row('Fiyat Düşüşüne Dayanım', pct(f.safetyMargin));
  y += 3;

  if (input.share.enabled) {
  section('KAT KARŞILIĞI KARŞILAŞTIRMASI');
  row(`Arsa Sahibi Payı (${pct(s.ownerShare, 0)})`, `${s.ownerUnits.toFixed(1)} villa · ${tl(s.ownerValue)}`);
  row(`Müteahhit Payı (${pct(s.contractorShare, 0)})`, `${s.contractorUnits.toFixed(1)} villa · ${tl(s.contractorValue)}`);
  row('Müteahhit Net Sonucu', tl(s.contractorNet), false, s.contractorNet < 0 ? RED : [23, 32, 44]);
  row('Artık Değere Denk Gelen Pay', pct(s.balancedShare));
  row('Fark', tl(s.difference), true, s.difference < 0 ? RED : GREEN);
  row('Değerlendirme',
    s.verdict === 'dengeli' ? 'Dengeli paylaşım' : s.verdict === 'arsa-sahibi-lehine' ? 'Arsa sahibi lehine' : 'Müteahhit lehine',
    true, s.verdict === 'dengeli' ? GREEN : AMBER);
  }
  y += 3;

  section('UZMAN DEĞERLENDİRMESİ');
  const levelColor: Record<string, [number, number, number]> = {
    olumlu: GREEN, bilgi: NAVY, dikkat: AMBER, uyari: RED,
  };
  for (const a of r.advice) {
    pageBreak(16);
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(...levelColor[a.level]);
    doc.text(`• ${a.title}`, M + 1, y);
    y += 4.6;
    paragraph(a.body);
    y += 2.4;
  }

  if (input.zoning.planNotes.trim()) {
    y += 2;
    section('PLAN NOTLARI');
    paragraph(input.zoning.planNotes, 9, [23, 32, 44]);
  }

  /* Alt bilgi — tüm sayfalara */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7); doc.setTextColor(140, 152, 165);
    doc.text(`${BRAND.preparedBy} · ${BRAND.authorLine}`, M, 287);
    doc.text(`${i} / ${pages}`, 210 - M, 287, { align: 'right' });
    doc.text(
      `Yöntem: Artık Değer · Tutarlar KDV hariçtir · Birim maliyet: RG 3.2.2026 / 33157 · ${BRAND.appName} ${version}`,
      M, 291,
    );
  }

  const name = `Arsa-Analizi-${(p.ilce || p.il || 'rapor').replace(/\s+/g, '-')}-${p.ada || ''}-${p.parsel || ''}.pdf`
    .replace(/-+\./, '.');
  triggerDownload(doc.output('blob'), name);
}
