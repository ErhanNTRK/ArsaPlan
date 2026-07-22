/**
 * RAPOR PDF — v5 kurumsal görsel dil
 * Uzman değerlendirmesi bu belgede YER ALMAZ (advicePdf.ts ile ayrı indirilir);
 * rapor, talep eden kişiye doğrudan gönderilebilecek temiz bir belgedir.
 * jsPDF + gömülü Türkçe font; yalnızca "Rapor PDF" tıklanınca yüklenir.
 */
import { jsPDF } from 'jspdf';
import type { ProjectInput, AnalysisResult } from '../engine';
import { YAPI_SINIFLARI } from '../data/yapiSiniflari';
import { BRAND } from '../brand/brand';
import { DORA_LOGO_PNG, DORA_LOGO_W, DORA_LOGO_H } from '../brand/logo';
import { triggerDownload } from './excel';

/* ── Kurumsal palet ── */
export const NAVY: [number, number, number] = [15, 42, 71];
export const NAVY2: [number, number, number] = [31, 63, 102];
export const INK: [number, number, number] = [23, 32, 44];
export const GRAY: [number, number, number] = [90, 103, 116];
export const FAINT: [number, number, number] = [246, 248, 251];
export const LINE: [number, number, number] = [220, 227, 235];
export const GOLD: [number, number, number] = [178, 141, 66];
export const GREEN: [number, number, number] = [30, 107, 65];
export const RED: [number, number, number] = [180, 35, 24];

const VERDICT_TEXT: Record<string, string> = {
  'yakin': 'İki yöntem birbirine yakın',
  'kat-karsiligi-yuksek': 'Kat karşılığı değeri daha yüksek',
  'gelir-yontemi-yuksek': 'Gelir projeksiyonu değeri daha yüksek',
};
export const tl = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';
export const tlm2 = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺/m²';
export const m2 = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' m²';
export const pct = (v: number, d = 1) => '%' + (v * 100).toFixed(d).replace('.', ',');
const num2 = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const M = 15, PW = 210, W = PW - 2 * M;

export async function loadFonts(doc: jsPDF) {
  const { FONT_REGULAR, FONT_BOLD } = await import('./font');
  doc.addFileToVFS('NTRK-Regular.ttf', FONT_REGULAR);
  doc.addFont('NTRK-Regular.ttf', 'NTRK', 'normal');
  doc.addFileToVFS('NTRK-Bold.ttf', FONT_BOLD);
  doc.addFont('NTRK-Bold.ttf', 'NTRK', 'bold');
  doc.setFont('NTRK', 'normal');
}

/** Kurumsal başlık bandı — büyük logo, altın çizgi. y = 41 ile devam edilir. */
export function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PW, 34, 'F');
  doc.setFillColor(...NAVY2);
  doc.rect(0, 34, PW, 0.9, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 34.9, PW, 1.1, 'F');
  doc.setFont('NTRK', 'bold'); doc.setFontSize(17); doc.setTextColor(255, 255, 255);
  doc.text(title, M, 15);
  doc.setFont('NTRK', 'normal'); doc.setFontSize(9.2); doc.setTextColor(196, 212, 229);
  doc.text(subtitle, M, 22);
  doc.setFontSize(8); doc.setTextColor(160, 181, 205);
  doc.text(BRAND.company, M, 28.5);
  const lh = 13, lw = (DORA_LOGO_W / DORA_LOGO_H) * lh;
  const lx = PW - M - lw, ly = (34 - lh) / 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(lx - 3.4, ly - 2.6, lw + 6.8, lh + 5.2, 2, 2, 'F');
  doc.addImage(DORA_LOGO_PNG, 'PNG', lx, ly, lw, lh);
}

/** Sayfa altbilgisi — tüm sayfalara */
export function drawFooter(doc: jsPDF, version: string, extra = 'Yöntem: Gelir Projeksiyonu · Tutarlar KDV hariçtir') {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.line(M, 285, PW - M, 285);
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.2); doc.setTextColor(140, 152, 165);
    doc.text(`${BRAND.preparedBy} · ${BRAND.developerLine}`, M, 289.5);
    doc.text(`${i} / ${pages}`, PW - M, 289.5, { align: 'right' });
    doc.text(`${extra} · Birim maliyet: RG 3.2.2026 / 33157 · ${BRAND.appName} ${version}`, M, 293);
  }
}

export async function downloadPdf(input: ProjectInput, r: AnalysisResult, version: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);

  let y = 0;
  const { capacity: c, financial: f, share: s, apartment: apt } = r;
  const p = input.parcel;
  const sinif = YAPI_SINIFLARI.find((x) => x.code === input.cost.buildingClass);
  const tarih = new Date().toLocaleDateString('tr-TR');

  function pageBreak(need = 14) {
    if (y + need > 280) { doc.addPage(); y = 18; zebra = false; }
  }

  /* ── Künye şeridi ── */
  function kunye() {
    doc.setFillColor(...FAINT);
    doc.roundedRect(M, y, W, 13.5, 1.6, 1.6, 'F');
    doc.setDrawColor(...LINE);
    doc.roundedRect(M, y, W, 13.5, 1.6, 1.6, 'S');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK);
    doc.text(`${p.il} / ${p.ilce}${p.mahalle ? ' · ' + p.mahalle + ' Mahallesi' : ''}`, M + 4, y + 5.6);
    doc.setFont('NTRK', 'normal'); doc.setFontSize(8.6); doc.setTextColor(...GRAY);
    doc.text(`Ada ${p.ada || '—'} · Parsel ${p.parsel || '—'} · Tapu Alanı ${m2(p.area)} · ${input.zoning.lejant.trim() || 'Lejant girilmedi'}`, M + 4, y + 10.6);
    doc.setFontSize(8.2);
    doc.text(`Rapor Tarihi: ${tarih}`, PW - M - 4, y + 5.6, { align: 'right' });
    doc.text(
      apt
        ? `Çok Katlı Bina · ${apt.mode === 'taks-kaks' ? 'TAKS/KAKS' : 'Doğrudan Alan'} Yöntemi`
        : 'Villa Projesi',
      PW - M - 4, y + 10.6, { align: 'right' },
    );
    y += 19;
  }

  /* ── Sonuç şeridi ── */
  function hero() {
    const H = 27;
    doc.setFillColor(...NAVY);
    doc.roundedRect(M, y, W, H, 2.2, 2.2, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(M, y + H - 1.2, W, 1.2, 'F');
    doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(168, 189, 212);
    doc.text('ARSA DEĞERİ (GELİR PROJEKSİYONU)', M + 5, y + 7);
    doc.setFont('NTRK', 'bold'); doc.setFontSize(21); doc.setTextColor(255, 255, 255);
    doc.text(tl(f.residualLandValue), M + 5, y + 17.5);
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.6); doc.setTextColor(168, 189, 212);
    doc.text(f.revenue > 0 ? `Arsa payı, hasılatın ${pct(f.landToRevenue)} kadarıdır` : ' ', M + 5, y + 23);
    const cx = M + W * 0.56;
    doc.setDrawColor(58, 88, 124);
    doc.line(cx - 4, y + 4.5, cx - 4, y + H - 4.5);
    const stat = (label: string, val: string, sy: number) => {
      doc.setFont('NTRK', 'normal'); doc.setFontSize(7.4); doc.setTextColor(168, 189, 212);
      doc.text(label, cx, sy);
      doc.setFont('NTRK', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
      doc.text(val, PW - M - 5, sy, { align: 'right' });
    };
    stat('Arsa m² Birim Değeri', tlm2(f.landUnitValue), y + 8.4);
    stat('Toplam İnşaat Alanı', m2(c.totalArea), y + 15.2);
    if (apt) stat('Satılabilir Alan', m2(apt.saleableTotal), y + 22);
    else stat(c.unitCount > 0 ? 'Villa Adedi' : 'Bahçe / Açık Alan',
              c.unitCount > 0 ? `${c.unitCount} adet` : m2(c.gardenArea), y + 22);
    y += H + 7;
  }

  /* ── Bölüm başlığı ── */
  function section(title: string) {
    pageBreak(22);
    doc.setFillColor(...GOLD);
    doc.rect(M, y - 3.4, 1.8, 5.4, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9.6); doc.setTextColor(...NAVY);
    doc.text(title, M + 4.6, y + 0.6);
    doc.setDrawColor(...LINE);
    doc.line(M, y + 3.2, PW - M, y + 3.2);
    y += 8.4;
    zebra = false;
  }

  /* ── Veri satırı — zebra + bant desteği ── */
  let zebra = false;
  function row(label: string, value: string, o: { bold?: boolean; color?: [number, number, number]; band?: boolean } = {}) {
    pageBreak();
    const h = 6.4;
    if (o.band) {
      doc.setFillColor(...NAVY);
      doc.rect(M, y - 4.4, W, h, 'F');
      doc.setFont('NTRK', 'bold'); doc.setFontSize(9.2); doc.setTextColor(255, 255, 255);
      doc.text(label, M + 3, y);
      doc.text(value, PW - M - 3, y, { align: 'right' });
      zebra = false;
      y += h + 0.8;
      return;
    }
    if (zebra) { doc.setFillColor(...FAINT); doc.rect(M, y - 4.4, W, h, 'F'); }
    zebra = !zebra;
    doc.setFont('NTRK', o.bold ? 'bold' : 'normal'); doc.setFontSize(9.1);
    doc.setTextColor(...(o.bold ? NAVY : GRAY));
    doc.text(label, M + 3, y);
    doc.setFont('NTRK', 'bold');
    doc.setTextColor(...(o.color ?? INK));
    doc.text(value, PW - M - 3, y, { align: 'right' });
    y += h;
  }

  /* ── Kat tablosu ── */
  function floorTable() {
    if (!apt) return;
    const h = 6.4;
    const C2 = M + W * 0.64, C3 = PW - M - 3;
    pageBreak(h * 3);
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.2, W, h, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(7.6); doc.setTextColor(255, 255, 255);
    doc.text('KAT BİLGİSİ', M + 3, y);
    doc.text('KAT ALANI', C2, y, { align: 'right' });
    doc.text('SATILABİLİR ALAN', C3, y, { align: 'right' });
    y += h + 0.6;
    let z = true;
    for (const fl of apt.floors) {
      pageBreak(h);
      if (z) { doc.setFillColor(...FAINT); doc.rect(M, y - 4.2, W, h, 'F'); }
      z = !z;
      const ortak = fl.kind === 'bodrum' && input.apartment.basements[fl.index - 1]?.use === 'ortak';
      doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...INK);
      doc.text(fl.label, M + 3, y);
      doc.setFont('NTRK', 'bold');
      doc.text(m2(fl.area), C2, y, { align: 'right' });
      if (ortak) {
        doc.setFont('NTRK', 'normal'); doc.setTextColor(...GRAY);
        doc.text('ortak mahal', C3, y, { align: 'right' });
      } else {
        doc.text(m2(fl.saleable), C3, y, { align: 'right' });
      }
      y += h;
    }
    pageBreak(h);
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.2, W, h, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9.2); doc.setTextColor(255, 255, 255);
    doc.text('TOPLAM', M + 3, y);
    doc.text(m2(apt.totalArea), C2, y, { align: 'right' });
    doc.text(m2(apt.saleableTotal), C3, y, { align: 'right' });
    y += h + 2;
    zebra = false;
  }

  function paragraph(text: string, size = 9, color: [number, number, number] = INK) {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W - 2);
    for (const line of lines) { pageBreak(6); doc.text(line, M + 1, y); y += size * 0.48 + 1.2; }
  }

  /* ═══════════ SAYFA AKIŞI ═══════════ */
  drawHeader(doc, 'ARSA DEĞER ANALİZİ', 'Gelir Projeksiyonu Yöntemi · Proje Geliştirme Raporu');
  y = 41;
  kunye();
  hero();

  section('PARSEL VE İMAR');
  row('Parsel Alanı (tapu)', m2(p.area));
  row('Net Parsel Alanı', m2(p.netArea));
  row('Plan Lejantı', input.zoning.lejant.trim() || '—');
  row('Hesap Yöntemi', input.zoning.mode === 'taks-kaks' ? 'TAKS / KAKS' : 'Doğrudan Alan');
  if (input.zoning.mode === 'taks-kaks') {
    row('TAKS / KAKS', `${input.zoning.taks != null ? num2(input.zoning.taks) : '—'} / ${input.zoning.kaks != null ? num2(input.zoning.kaks) : '—'}`);
    if (input.zoning.hmax) row('Hmax', `${input.zoning.hmax.toLocaleString('tr-TR')} m`);
  }
  y += 4;

  if (apt) {
    section('KAT TABLOSU');
    floorTable();
    if (apt.mode === 'taks-kaks') {
      row('Taban Oturumu Limiti (parsel × TAKS)', m2(apt.footprintArea));
      if (apt.extraSaleableArea > 0) row('İlave Satılabilir Alan (emsal dışı)', m2(apt.extraSaleableArea));
    }
    row('Bahçe / Açık Alan', m2(apt.gardenArea));
    y += 4;
  } else {
    section('ALAN ÜRETİMİ');
    row('Taban Oturumu', m2(c.footprintArea));
    row('Emsale Dahil Alan', m2(c.emsalArea));
    if (c.extraArea > 0) row('Emsal Dışı Satılabilir Alan', m2(c.extraArea));
    if (c.atticArea > 0) row(`Çatı Katı (${input.emsal.atticInEmsal ? 'emsale dahil' : 'emsal dışı'})`, m2(c.atticArea));
    if (c.basementArea > 0) row(`Bodrum Kat (${input.emsal.basementInEmsal ? 'emsale dahil' : 'emsal dışı'})`, m2(c.basementArea));
    if (c.emsalConsumedByExtras > 0) row('Emsalden Kullanılan (çatı/bodrum)', m2(c.emsalConsumedByExtras), { color: RED });
    row('Zemin Üstü Katlara Kalan', m2(c.aboveGroundArea));
    row('TOPLAM İNŞAAT ALANI', m2(c.totalArea), { band: true });
    row('Bahçe / Açık Alan', m2(c.gardenArea));
    if (c.unitCount > 0) {
      row('Villa Adedi', `${c.unitCount} adet`);
      row('Villa Başına Toplam Alan', m2(c.areaPerUnit));
    }
    y += 4;
  }

  section('FİZİBİLİTE');
  row('Yapı Sınıfı', `${input.cost.buildingClass}${sinif ? ' — ' + sinif.label : ''}`);
  row('Güncel Birim Maliyet', tlm2(f.effectiveUnitCost));
  row('İnşaat Maliyeti', tl(f.constructionCost));
  if (f.landscapeCost > 0) row('Peyzaj ve Bahçe Düzenlemesi', tl(f.landscapeCost));
  if (f.extrasCost > 0) row('Proje, Ruhsat, Harç, Müşavirlik', tl(f.extrasCost));
  if (f.financeCost > 0) row('Finansman Gideri', tl(f.financeCost));
  row('TOPLAM MALİYET', tl(f.totalCost), { band: true });
  if (apt) {
    if (apt.saleableByKind.bodrum > 0) row('Bodrum Satış Birim Değeri', tlm2(input.sales.apt.bodrum));
    row('Zemin Kat Satış Birim Değeri', tlm2(input.sales.apt.zemin));
    row('Normal Kat Satış Birim Değeri', tlm2(input.sales.apt.normal));
    if (apt.saleableByKind.piyes > 0) row('Piyes Satış Birim Değeri', tlm2(input.sales.apt.piyes));
  }
  row('Yapı Satış Hasılatı', tl(f.buildingRevenue));
  if (f.gardenRevenue > 0) row('Bahçe Satış Hasılatı', tl(f.gardenRevenue));
  row('TOPLAM SATIŞ HASILATI', tl(f.revenue), { bold: true, color: GREEN });
  row(`Müteahhit Kârı (${pct(input.residual.profitRate, 0)})`, tl(f.developerProfit), { color: RED });
  row('ARSA DEĞERİ (GELİR PROJEKSİYONU)', tl(f.residualLandValue), { band: true });
  row('Arsa m² Birim Değeri', tlm2(f.landUnitValue), { bold: true });
  row('Arsa Değeri / Hasılat', pct(f.landToRevenue));
  y += 4;

  if (input.share.enabled) {
    section('ARSA DEĞERİ — YÖNTEM KARŞILAŞTIRMASI');
    row(`Arsa Sahibi Payı (${pct(s.ownerShare, 0)})`, `${s.ownerUnits > 0 ? s.ownerUnits.toFixed(1) + ' villa · ' : ''}${m2(s.ownerArea)}`);
    row(`Müteahhit Payı (${pct(s.contractorShare, 0)})`, `${s.contractorUnits > 0 ? s.contractorUnits.toFixed(1) + ' villa · ' : ''}${m2(s.contractorArea)}`);
    row('Kat Karşılığı Yöntemine Göre Arsa Değeri', tl(s.shareLandValue), { bold: true });
    row('Gelir Projeksiyonuna Göre Arsa Değeri', tl(f.residualLandValue), { bold: true });
    row('İki Yöntem Arasındaki Fark', `${tl(Math.abs(s.difference))} (${pct(Math.abs(s.differenceRate))})`);
    row('Gelir Projeksiyonuna Denk Gelen Arsa Payı', pct(s.balancedShare));
    row('Değerlendirme', VERDICT_TEXT[s.verdict], { band: true });
    y += 4;
  }

  if (input.zoning.planNotes.trim()) {
    section('PLAN NOTLARI');
    paragraph(input.zoning.planNotes);
  }

  drawFooter(doc, version);

  const name = `Arsa-Analizi-${(p.ilce || p.il || 'rapor').replace(/\s+/g, '-')}-${p.ada || ''}-${p.parsel || ''}.pdf`
    .replace(/-+\./, '.');
  triggerDownload(doc.output('blob'), name);
}
