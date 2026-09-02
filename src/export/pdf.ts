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
import { fxLines, fxMoney, fxRateNote } from './fx';
import { inwardOffset, setbackFootprint } from '../geo/kml';
import { LOC, t } from '../i18n';

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

export const tl = (v: number) => Math.round(v).toLocaleString(LOC()) + ' ₺';
export const tlm2 = (v: number) => Math.round(v).toLocaleString(LOC()) + ' ₺/m²';
export const m2 = (v: number) => Math.round(v).toLocaleString(LOC()) + ' m²';
/** Parsel/Tapu alanı gibi tapu kaydından gelen KESİN rakamlar için — 2 ondalık korunur, yuvarlanmaz. */
export const m2p = (v: number) => v.toLocaleString(LOC(), { maximumFractionDigits: 2 }) + ' m²';
export const pct = (v: number, d = 1) => '%' + (v * 100).toFixed(d).replace('.', ',');
const num2 = (v: number) => v.toLocaleString(LOC(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  doc.text(t(title), M, 15);
  doc.setFont('NTRK', 'normal'); doc.setFontSize(9.2); doc.setTextColor(196, 212, 229);
  doc.text(t(subtitle), M, 22);
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
    doc.text(`${t(BRAND.preparedBy)} · ${t(BRAND.developerLine)}`, M, 289.5);
    doc.text(`${i} / ${pages}`, PW - M, 289.5, { align: 'right' });
    doc.text(`${t(extra)} · ${t('Birim maliyet kaynağı')}: RG 3.2.2026 / 33157 · ${BRAND.appName} ${version}`, M, 293);
  }
}

/** PDF belgesini üretir; indirme yapmaz (JPEG üretimi de bunu kullanır). */
export async function buildPdf(input: ProjectInput, r: AnalysisResult, version: string): Promise<{ doc: jsPDF; name: string }> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);

  let y = 0;
  const { capacity: c, financial: f, share: s, apartment: apt, isletme } = r;
  const karma = apt != null && input.assetType !== 'konut';
  const p = input.parcel;
  const sinif = YAPI_SINIFLARI.find((x) => x.code === input.cost.buildingClass);
  const tarih = new Date().toLocaleDateString(LOC());

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
    doc.text(t(`Ada ${p.ada || '—'} · Parsel ${p.parsel || '—'} · Tapu Alanı ${m2p(p.area)}`) + ' · ' + (input.zoning.lejant.trim() || t('Lejant girilmedi')), M + 4, y + 10.6);
    doc.setFontSize(8.2);
    if (input.showReportDate) {
      const gosterilecekTarih = input.reportDate
        ? new Date(input.reportDate + 'T00:00:00').toLocaleDateString('tr-TR')
        : tarih;
      doc.text(t(`Rapor Tarihi: ${gosterilecekTarih}`), PW - M - 4, y + 5.6, { align: 'right' });
    }
    doc.text(
      t(isletme ? 'Ticari İşletme'
        : apt
          ? `${input.assetType === 'karma' ? 'Karma Kullanım' : input.assetType === 'ticari' ? 'Ticari Apartman' : 'Çok Katlı Bina'} · ${input.zoning.mode === 'cekme' ? 'Çekme Mesafesi' : apt.mode === 'taks-kaks' ? 'TAKS/KAKS' : 'Alan Bilgisi Girilerek'} Yöntemi`
          : 'Villa Projesi'),
      PW - M - 4, y + 10.6, { align: 'right' },
    );
    y += 19;
  }

  /* ── Sonuç şeridi ── */
  function hero() {
    const useManual = input.finalManualValue != null && input.finalManualValue > 0;
    const heroValue = useManual ? input.finalManualValue! : f.residualLandValueRounded;
    const heroLabel = useManual ? 'ARSA DEĞERİ (KULLANICI BELİRLEDİ)' : 'ARSA DEĞERİ (GELİR PROJEKSİYONU)';
    const H = 27;
    doc.setFillColor(...NAVY);
    doc.roundedRect(M, y, W, H, 2.2, 2.2, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(M, y + H - 1.2, W, 1.2, 'F');
    doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(168, 189, 212);
    doc.text(t(heroLabel), M + 5, y + 7);
    doc.setFont('NTRK', 'bold'); doc.setFontSize(21); doc.setTextColor(255, 255, 255);
    doc.text(tl(heroValue), M + 5, y + 18.5);
    const cx = M + W * 0.56;
    doc.setDrawColor(58, 88, 124);
    doc.line(cx - 4, y + 4.5, cx - 4, y + H - 4.5);
    const stat = (label: string, val: string, sy: number) => {
      doc.setFont('NTRK', 'normal'); doc.setFontSize(7.4); doc.setTextColor(168, 189, 212);
      doc.text(t(label), cx, sy);
      doc.setFont('NTRK', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
      doc.text(val, PW - M - 5, sy, { align: 'right' });
    };
    stat('Arsa m² Birim Değeri', tlm2(f.landUnitValue), y + 8.4);
    stat('Toplam İnşaat Alanı', m2(c.totalArea), y + 15.2);
    if (apt) stat('Satılabilir Alan', m2(apt.saleableTotal), y + 22);
    else stat(c.unitCount > 0 ? 'Villa Adedi' : 'Bahçe / Açık Alan',
              c.unitCount > 0 ? `${c.unitCount} adet` : m2(c.gardenArea), y + 22);
    y += H + 7;
    if (p.area !== p.netArea) {
      doc.setFont('NTRK', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...GRAY);
      doc.text(
        t(`Not: Tapu Alanı ${m2p(p.area)} → ${tlm2(f.landUnitValue)}  ·  Net Alan (terk sonrası) ${m2p(p.netArea)} → ${tlm2(p.netArea > 0 ? f.residualLandValue / p.netArea : 0)}`),
        M + 2, y,
      );
      y += 6;
    }
  }

  /* ── Arsa Değeri — Yöntem Karşılaştırması (krokiden önce, iki sadeleştirilmiş satır) ── */
  function methodComparison() {
    if (!input.share.enabled) return;
    const discountActive = (input.residual.projectMonths ?? 0) > 0 && (input.residual.timeDiscountRate ?? 0) > 0;
    const showKKIndirgemeli = (input.showKatKarsiligiIndirgemeli ?? true) && discountActive;
    const showGelirIndirgemeli = (input.showGelirIndirgemeli ?? true) && discountActive;
    if (!showKKIndirgemeli && !showGelirIndirgemeli) return;
    section('ARSA DEĞERİ — YÖNTEM KARŞILAŞTIRMASI');
    if (showKKIndirgemeli) row('İndirgemeli Kat Karşılığı Değeri', tl(s.discountedShareLandValueRounded), { bold: true });
    if (showGelirIndirgemeli) row('İndirgemeli Gelir Projeksiyonu Değeri', tl(f.discountedLandValueRounded), { bold: true });
    y += 4;
  }

  /* ── Hesap Varsayımları — tüm yöntemlerin (Gelir Projeksiyonu, Kat Karşılığı,
     indirgemeli versiyonları) dayandığı oranları tek yerde, şeffaf gösterir.
     Yöntem Karşılaştırması'nın hemen altında — bulgu ile gerekçesi yan yana. ── */
  function assumptionsSummary() {
    section('HESAP VARSAYIMLARI');
    row('Müteahhit Kâr Oranı (Gelir Projeksiyonu)', pct(input.residual.profitRate, 0));
    if (input.share.enabled) row('Kat Karşılığı Oranı (Arsa Sahibi Payı)', pct(s.ownerShare, 0));
    row('Finansman Gideri Oranı', pct(input.residual.financeRateOfCost, 0));
    row('Proje, Ruhsat, Harç, Müşavirlik Oranı', pct(input.cost.extrasRate, 0));
    if ((input.residual.projectMonths ?? 0) > 0) {
      row('Proje Süresi (indirgeme için)', `${input.residual.projectMonths} ay`);
      row('Yıllık İndirgeme Oranı (reel)', pct(input.residual.timeDiscountRate ?? 0, 0));
    }
    y += 4;
  }

  /* ── Bölüm başlığı ── */
  function section(title: string) {
    pageBreak(22);
    doc.setFillColor(...GOLD);
    doc.rect(M, y - 3.4, 1.8, 5.4, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9.6); doc.setTextColor(...NAVY);
    doc.text(t(title), M + 4.6, y + 0.6);
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
      doc.text(t(label), M + 3, y);
      doc.text(t(value), PW - M - 3, y, { align: 'right' });
      zebra = false;
      y += h + 0.8;
      return;
    }
    if (zebra) { doc.setFillColor(...FAINT); doc.rect(M, y - 4.4, W, h, 'F'); }
    zebra = !zebra;
    doc.setFont('NTRK', o.bold ? 'bold' : 'normal'); doc.setFontSize(9.1);
    doc.setTextColor(...(o.bold ? NAVY : GRAY));
    doc.text(t(label), M + 3, y);
    doc.setFont('NTRK', 'bold');
    doc.setTextColor(...(o.color ?? INK));
    doc.text(t(value), PW - M - 3, y, { align: 'right' });
    y += h;
  }

  /* ── Kat tablosu ── */
  /** PARSEL KROKİSİ — KML poligonu + çekme sonrası oturum (varsa).
   * x0/boxW: bu kutunun sol referansı ve genişliği (yan yana yerleşim için
   * parametrik). y0: bu kutunun başlayacağı satır. Dönen değer: kullanılan
   * TOPLAM yükseklik (dışarıdaki y bu fonksiyon içinde DEĞİŞTİRİLMEZ —
   * kroki ve yapı kesiti yan yana render edildiğinde, y'yi ikisinin en
   * uzunu kadar İLERİDE bir kez ilerletmek çağıran tarafın işi). */
  function parcelSketch(x0: number, boxW: number, y0: number): number {
    const k = p.kml;
    if (!k || k.points.length < 3) return 0;
    const xs = k.points.map((q) => q.x), ys = k.points.map((q) => q.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
    const BW = boxW - 8;                               // kutu iç genişliği
    const BH = Math.min(78, Math.max(45, BW * (spanY / spanX)));
    const bx = x0 + 4, by = y0 + 2;
    const sc = Math.min((BW - 12) / spanX, (BH - 12) / spanY);
    const SX = (x: number) => bx + 6 + (x - minX) * sc + (BW - 12 - spanX * sc) / 2;
    const SY = (yy: number) => by + BH - 6 - (yy - minY) * sc - (BH - 12 - spanY * sc) / 2;
    // çerçeve
    doc.setDrawColor(...LINE); doc.setFillColor(253, 252, 250);
    doc.roundedRect(x0, by - 2, boxW, BH + 4, 1.5, 1.5, 'FD');
    // parsel
    const draw = (ps: { x: number; y: number }[], fill: [number, number, number], stroke: [number, number, number], dash: boolean) => {
      doc.setFillColor(...fill); doc.setDrawColor(...stroke); doc.setLineWidth(0.5);
      if (dash) doc.setLineDashPattern([1.6, 1.1], 0);
      const segs = ps.map((q, i) => {
        const nx = SX(ps[(i + 1) % ps.length].x) - SX(q.x);
        const ny = SY(ps[(i + 1) % ps.length].y) - SY(q.y);
        return [nx, ny] as [number, number];
      });
      doc.lines(segs, SX(ps[0].x), SY(ps[0].y), [1, 1], 'FD', true);
      if (dash) doc.setLineDashPattern([], 0);
      doc.setLineWidth(0.2);
    };
    draw(k.points, [237, 240, 245], NAVY, false);
    const zc = input.zoning;
    let inner: { x: number; y: number }[] | null = null;
    if (zc.mode === 'cekme' && zc.cekmeFrontEdge != null) {
      const fp = setbackFootprint(k.points, zc.cekmeFrontEdge,
        { front: zc.cekmeFront, side: zc.cekmeSide, rear: zc.cekmeRear });
      if (fp) inner = fp.polygon;
    } else if (k.setback > 0) {
      inner = inwardOffset(k.points, k.setback);
    } else if (zc.mode === 'taks-kaks' && c.footprintArea > 0) {
      // TAKS/KAKS modunda gerçek çekme geometrisi yok — Taban Oturumu m²'sini
      // temsili, parselin genel oranlarına uygun ortalanmış bir dikdörtgenle
      // gösteriyoruz (gerçek mimari yerleşim değildir).
      const aspect = spanX / spanY;
      const h = Math.sqrt(c.footprintArea / aspect);
      const w = c.footprintArea / h;
      const cx = minX + spanX / 2, cy = minY + spanY / 2;
      inner = [
        { x: cx - w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy - h / 2 },
        { x: cx + w / 2, y: cy + h / 2 }, { x: cx - w / 2, y: cy + h / 2 },
      ];
    }
    if (inner) draw(inner, [243, 235, 219], GOLD, true);
    // kuzey oku
    const nx0 = x0 + boxW - 7, ny0 = by + 6;
    doc.setFillColor(...NAVY);
    doc.triangle(nx0, ny0 - 3.2, nx0 + 1.9, ny0 + 2.6, nx0 - 1.9, ny0 + 2.6, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...NAVY);
    doc.text('K', nx0, ny0 + 6.4, { align: 'center' });
    // lejant satırı — dar kutuda taşarsa sarmalanır (jsPDF splitTextToSize)
    let ly = by + BH + 6;
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...GRAY);
    const parts = [`${t('Parsel Alanı')}: ${p.area.toLocaleString(LOC(), { maximumFractionDigits: 2 })} m²`];
    if (input.zoning.mode === 'cekme') {
      parts.push(`${t('Çekme')}: ${t('ön')} ${input.zoning.cekmeFront.toLocaleString(LOC())} · ${t('yan')} ${input.zoning.cekmeSide.toLocaleString(LOC())} · ${t('arka')} ${input.zoning.cekmeRear.toLocaleString(LOC())} m`);
    } else if (input.zoning.mode === 'taks-kaks' && c.footprintArea > 0) {
      parts.push(`Taban Oturumu (temsili): ${m2(c.footprintArea)}`);
    }
    const legendLines: string[] = doc.splitTextToSize(parts.join('  ·  '), boxW - 6);
    for (const line of legendLines) { doc.text(line, x0 + 3, ly); ly += 4.2; }
    return (ly + 3) - y0;
  }

  /** YAPI KESİTİ — kat genişlikleri alanla orantılı; pencere dizileri, bodrum
   *  taraması ve zemin çizgisiyle mimari kesit diline yaklaşan şematik çizim.
   *  x0/boxW/y0: parcelSketch ile aynı mantık. targetH verilirse (kroki ile
   *  yan yana gösterildiğinde), kat yüksekliği (FH) bu hedefe sığacak şekilde
   *  otomatik küçültülür — çok katlı binalarda bile kroki ile dengeli durur. */
  function buildingSection(x0: number, boxW: number, y0: number, targetH: number | null): number {
    if ((input.showBuildingSection ?? input.reportVisuals ?? true) === false) return 0;
    type Row = { label: string; kind: string; area: number };
    const rows: Row[] = [];
    if (apt) {
      for (const fl of apt.floors) rows.push({ label: fl.label, kind: fl.kind, area: fl.area });
    } else if (!isletme) {
      const va = input.villa;
      if (input.emsal.hasBasement) rows.push({ label: 'Bodrum Kat', kind: 'bodrum', area: 0 });
      for (let i = 1; i <= Math.max(1, va.floorsAboveGround); i++) {
        rows.push({ label: i === 1 ? 'Zemin Kat' : `${i - 1}. Normal Kat`, kind: i === 1 ? 'zemin' : 'normal', area: 0 });
      }
      if (input.emsal.hasAttic) rows.push({ label: 'Çatı Arası Piyesi', kind: 'piyes', area: 0 });
    } else return 0;
    if (!rows.length) return 0;

    const above = rows.filter((r) => r.kind !== 'bodrum');
    const below = rows.filter((r) => r.kind === 'bodrum');
    // Kat yüksekliği: hedef bir yükseklik verildiyse (yan yana mod), o
    // aralığa sığacak şekilde küçültülür (en az 2,2mm — okunabilirlik alt sınırı).
    const FH = targetH != null
      ? Math.min(5.2, Math.max(2.2, (targetH - 22) / Math.max(1, rows.length)))
      : 5.2;
    const BW2 = Math.min(62, boxW * 0.58);
    const bx = x0 + 10;
    const cxm = bx + BW2 / 2;
    const groundY = y0 + 5 + above.length * FH;
    const maxA = Math.max(...rows.map((r) => r.area), 1);
    const propW = (a: number) => (a > 0 ? Math.max(BW2 * 0.24, BW2 * (a / maxA)) : BW2);
    const labelSize = boxW < 100 ? 5.8 : 6.9;   // dar kutuda (yan yana mod) küçük yazı
    const labelX = bx + BW2 + (boxW < 100 ? 5 : 10);

    doc.setDrawColor(...INK); doc.setLineWidth(0.55);
    doc.line(x0 + 2, groundY, x0 + boxW - 24, groundY);
    doc.setLineWidth(0.25); doc.setDrawColor(...GRAY);
    for (let gx = x0 + 2; gx < x0 + boxW - 24; gx += 3.2) doc.line(gx, groundY, gx - 1.6, groundY + 1.8);

    const drawWindows = (x: number, yy: number, wdt: number, commercial: boolean) => {
      const wh = FH * 0.42, wy = yy + (FH - wh) / 2;
      if (commercial) {
        doc.setFillColor(255, 255, 255); doc.setDrawColor(...NAVY); doc.setLineWidth(0.22);
        doc.rect(x + wdt * 0.10, wy, wdt * 0.80, wh, 'FD');
        doc.line(x + wdt * 0.5, wy, x + wdt * 0.5, wy + wh);
        return;
      }
      const n = Math.max(2, Math.min(6, Math.round(wdt / 11)));
      const ww = 2.6, gap = (wdt - n * ww) / (n + 1);
      doc.setFillColor(255, 255, 255); doc.setDrawColor(...NAVY); doc.setLineWidth(0.2);
      for (let i = 0; i < n; i++) doc.rect(x + gap + i * (ww + gap), wy, ww, wh, 'FD');
    };

    doc.setLineWidth(0.35);
    above.forEach((r, i) => {
      const yy = groundY - (i + 1) * FH;
      let wdt = propW(r.area);
      let x = cxm - wdt / 2;
      const commercial = r.kind === 'zemin' || r.kind === 'asma';
      if (r.kind === 'asma') { wdt *= 0.6; x = cxm - wdt / 2; }
      doc.setDrawColor(...NAVY);
      if (r.kind === 'piyes') {
        const pw = Math.max(propW(r.area), BW2 * 0.5);
        const px = cxm - pw / 2, eave = 2.2;
        doc.setFillColor(226, 232, 240);
        doc.lines([[pw + 2 * eave, 0], [-(eave + pw * 0.18), -FH + 0.6], [-(pw * 0.64), 0], [-(eave + pw * 0.18), FH - 0.6]],
                  px - eave, yy + FH, [1, 1], 'FD', true);
        doc.setLineWidth(0.5);
        doc.line(px - eave - 1.5, yy + FH, px + pw + eave + 1.5, yy + FH);
        doc.setLineWidth(0.35);
      } else {
        doc.setFillColor(...(commercial ? [244, 236, 221] as [number, number, number] : [235, 240, 246] as [number, number, number]));
        doc.rect(x, yy, wdt, FH, 'FD');
        if (FH >= 3.2) drawWindows(x, yy, wdt, commercial); // çok küçük kat yüksekliğinde pencere çizilmez, karmaşa olmasın
      }
      doc.setFont('NTRK', 'normal'); doc.setFontSize(labelSize); doc.setTextColor(...INK);
      doc.text(`${t(r.label)}${r.area > 0 ? ` · ${Math.round(r.area).toLocaleString(LOC())} m²` : ''}`, labelX, yy + FH - 1.6);
      doc.setFontSize(labelSize - 0.9); doc.setTextColor(...GRAY);
      doc.text(`+${((i) * 3).toFixed(2).replace('.', LOC() === 'tr-TR' ? ',' : '.')}`, bx - 6, yy + FH - 1.6, { align: 'right' });
    });

    below.forEach((r, i) => {
      const yy = groundY + i * FH;
      const wdt = propW(r.area);
      const x = cxm - wdt / 2;
      doc.setFillColor(240, 241, 244); doc.setDrawColor(...GRAY);
      doc.setLineDashPattern([1.4, 1], 0);
      doc.rect(x, yy, wdt, FH, 'FD');
      doc.setLineDashPattern([], 0);
      doc.setLineWidth(0.15);
      for (let hx = x + 3; hx < x + wdt; hx += 4.5) doc.line(hx, yy + FH, Math.min(hx + FH, x + wdt), yy + Math.max(0, FH - (x + wdt - hx)));
      doc.setLineWidth(0.35);
      doc.setFont('NTRK', 'normal'); doc.setFontSize(labelSize); doc.setTextColor(...GRAY);
      doc.text(`${t(r.label)}${r.area > 0 ? ` · ${Math.round(r.area).toLocaleString(LOC())} m²` : ''}`, labelX, yy + FH - 1.6);
      doc.setFontSize(labelSize - 0.9);
      doc.text(`−${((i + 1) * 3).toFixed(2).replace('.', LOC() === 'tr-TR' ? ',' : '.')}`, bx - 6, yy + FH - 1.6, { align: 'right' });
    });

    doc.setFont('NTRK', 'bold'); doc.setFontSize(6.2); doc.setTextColor(...INK);
    doc.text('±0,00', x0 + boxW - 24, groundY - 1);

    return (groundY + below.length * FH + 9) - y0;
  }

  /** Kroki ve Yapı Kesiti — ikisi de gösterilecekse YAN YANA (aynı yükseklik
   * hedefine sığacak şekilde), yalnız biri gösterilecekse tam genişlikte. */
  function visualsRow() {
    const hasKml = !!p.kml && p.kml.points.length >= 3;
    const hasRowsForSection = (apt && apt.floors.length > 0) ||
      (!apt && !isletme && (input.villa.floorsAboveGround > 0 || input.emsal.hasBasement || input.emsal.hasAttic));
    const wantKroki = (input.showParcelSketch ?? input.reportVisuals ?? true) !== false && hasKml;
    const wantKesit = (input.showBuildingSection ?? input.reportVisuals ?? true) !== false && hasRowsForSection;
    if (!wantKroki && !wantKesit) return;
    const gap = 6;
    const half = (W - gap) / 2;
    if (wantKroki && wantKesit) {
      if (y + 95 > 275) { doc.addPage(); y = 18; }
      section('PARSEL KROKİSİ VE YAPI KESİTİ (TEMSİLİ)');
      const y0 = y;
      const h1 = parcelSketch(M, half, y0);
      const h2 = buildingSection(M + half + gap, half, y0, h1 || 60);
      y = y0 + Math.max(h1, h2) + 4;
    } else if (wantKroki) {
      if (y + 95 > 275) { doc.addPage(); y = 18; }
      section('PARSEL KROKİSİ');
      const y0 = y;
      y = y0 + parcelSketch(M, W, y0) + 4;
    } else {
      if (y + 95 > 275) { doc.addPage(); y = 18; }
      section('YAPI KESİTİ (TEMSİLİ)');
      const y0 = y;
      y = y0 + buildingSection(M, W, y0, null) + 4;
    }
  }

  function floorTable() {
    if (!apt) return;
    const h = 6.4;
    /* Dört kolon gerçek genişlikte, her kolonun kendi x-konumu — TOPLAM satırı
     * dahil hiçbir sayı elle kaydırılmış "yaklaşık" bir konuma basılmaz. */
    const C1 = M + W * 0.46, C3 = M + W * 0.85, C4 = PW - M - 3;
    pageBreak(h * 3);
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.2, W, h, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(7.2); doc.setTextColor(255, 255, 255);
    doc.text(t('KAT BİLGİSİ'), M + 3, y);
    doc.text(t('KAT ALANI'), C1, y, { align: 'right' });
    doc.text(t('SATILABİLİR ALAN'), C3, y, { align: 'right' });
    doc.text(t('ORTAK ALAN'), C4, y, { align: 'right' });
    y += h + 0.6;
    let z = true;
    let totalOrtak = 0;
    for (const fl of [...apt.floors].reverse()) {
      pageBreak(h);
      if (z) { doc.setFillColor(...FAINT); doc.rect(M, y - 4.2, W, h, 'F'); }
      z = !z;
      const ortak = fl.kind === 'bodrum' && input.apartment.basements[fl.index - 1]?.use === 'ortak';
      const ortakAlan = ortak ? fl.area : Math.max(0, fl.area - fl.saleable);
      totalOrtak += ortakAlan;
      doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...INK);
      doc.text(t(fl.label), M + 3, y);
      doc.setFont('NTRK', 'bold');
      doc.text(m2(fl.area), C1, y, { align: 'right' });
      if (ortak) {
        doc.setFont('NTRK', 'normal'); doc.setTextColor(...GRAY);
        doc.text(t('ortak mahal'), C3, y, { align: 'right' });
      } else {
        doc.text(m2(fl.saleable), C3, y, { align: 'right' });
      }
      doc.setFont('NTRK', 'normal'); doc.setTextColor(...GRAY); doc.setFontSize(8.3);
      doc.text(m2(ortakAlan), C4, y, { align: 'right' });
      doc.setFontSize(9);
      y += h;
    }
    pageBreak(h);
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.2, W, h, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text(t('TOPLAM'), M + 3, y);
    doc.text(m2(apt.totalArea), C1, y, { align: 'right' });
    doc.text(m2(apt.saleableTotal), C3, y, { align: 'right' });
    doc.setFontSize(8.3);
    doc.text(m2(totalOrtak), C4, y, { align: 'right' });
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

  if (isletme) {
    /* ── Ticari İşletme: sade rapor ── */
    const H = 27;
    doc.setFillColor(...NAVY);
    doc.roundedRect(M, y, W, H, 2.2, 2.2, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(M, y + H - 1.2, W, 1.2, 'F');
    doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(168, 189, 212);
    doc.text(t('ARSA DEĞERİ (GELİR PROJEKSİYONU)'), M + 5, y + 7);
    doc.setFont('NTRK', 'bold'); doc.setFontSize(21); doc.setTextColor(255, 255, 255);
    doc.text(tl(isletme.landValue), M + 5, y + 17.5);
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.6); doc.setTextColor(168, 189, 212);
    doc.text(isletme.profit > 0
      ? `${t('Müteahhit Kazancı')}: ${tl(isletme.profit)} (${pct(isletme.profitRate)})`
      : t('Müteahhit kazancı kesilmemiştir (proje mülk sahibince yapılır)'), M + 5, y + 23);
    const cx2 = M + W * 0.56;
    doc.setDrawColor(58, 88, 124);
    doc.line(cx2 - 4, y + 4.5, cx2 - 4, y + H - 4.5);
    const stat2 = (label: string, val: string, sy: number) => {
      doc.setFont('NTRK', 'normal'); doc.setFontSize(7.4); doc.setTextColor(168, 189, 212);
      doc.text(t(label), cx2, sy);
      doc.setFont('NTRK', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
      doc.text(val, PW - M - 5, sy, { align: 'right' });
    };
    stat2('Arsa m² Birim Değeri', tlm2(isletme.landUnitValue), y + 8.4);
    stat2('Toplam Maliyet', tl(isletme.totalCost), y + 15.2);
    stat2('Öngörülen Satış Değeri', tl(isletme.salesTotal), y + 22);
    y += H + 7;

    section('YAPILAR');
    {
      const h = 6.4;
      const C2 = M + W * 0.62, C3 = PW - M - 3;
      doc.setFillColor(...NAVY);
      doc.rect(M, y - 4.2, W, h, 'F');
      doc.setFont('NTRK', 'bold'); doc.setFontSize(7.6); doc.setTextColor(255, 255, 255);
      doc.text(t('YAPI'), M + 3, y);
      doc.text(t('ALAN × BİRİM MALİYET'), C2, y, { align: 'right' });
      doc.text(t('MALİYET'), C3, y, { align: 'right' });
      y += h + 0.6;
      let z = true;
      for (const rw of isletme.rows) {
        pageBreak(h);
        if (z) { doc.setFillColor(...FAINT); doc.rect(M, y - 4.2, W, h, 'F'); }
        z = !z;
        doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...INK);
        doc.text(`${t(rw.type)} (${rw.buildingClass}${rw.depreciation > 0 ? ` · ${t('yıpranma')} ${pct(rw.depreciation, 0)}` : ''})`, M + 3, y);
        doc.setFont('NTRK', 'bold');
        doc.text(`${m2(rw.area)} × ${tlm2(rw.effectiveUnitCost)}`, C2, y, { align: 'right' });
        doc.text(tl(rw.cost), C3, y, { align: 'right' });
        y += h;
      }
      doc.setFillColor(...NAVY);
      doc.rect(M, y - 4.2, W, h, 'F');
      doc.setFont('NTRK', 'bold'); doc.setFontSize(9.2); doc.setTextColor(255, 255, 255);
      doc.text(t('YAPI MALİYETLERİ'), M + 3, y);
      doc.text(m2(isletme.totalBuildingArea), C2, y, { align: 'right' });
      doc.text(tl(isletme.buildingsCost), C3, y, { align: 'right' });
      y += h + 2;
      if (input.isletme.inflationRate > 0) {
        row('Güncelleme Oranı (tüm satırlara ortak)', pct(input.isletme.inflationRate, 1));
      }
      y += 3;
    }

    if (isletme.extrasTotal > 0) {
      section('İLAVE MALİYETLER');
      if (isletme.wallCost > 0) row('Çevre Duvarı', tl(isletme.wallCost));
      if (isletme.landscapeCost > 0) row('Peyzaj / Çevre Düzenleme', tl(isletme.landscapeCost));
      if (isletme.infraCost > 0) row('Altyapı', tl(isletme.infraCost));
      for (const oc of input.isletme.otherCosts) {
        if (oc.amount > 0) row(oc.name || 'Diğer', tl(oc.amount));
      }
      row('İLAVE MALİYETLER TOPLAMI', tl(isletme.extrasTotal), { band: true });
      y += 3;
    }

    section('DEĞERLEME');
    row('Yapı Maliyetleri', tl(isletme.buildingsCost));
    if (isletme.extrasTotal > 0) row('İlave Maliyetler', tl(isletme.extrasTotal));
    row('TOPLAM MALİYET', tl(isletme.totalCost), { band: true });
    row('Öngörülen Satış Değeri', tl(isletme.salesTotal), { bold: true, color: GREEN });
    if (isletme.profit > 0) row(`Müteahhit Kazancı (${pct(isletme.profitRate)})`, tl(isletme.profit), { color: RED });
    row('ARSA DEĞERİ (GELİR PROJEKSİYONU)', tl(isletme.landValue), { band: true });
    row('Arsa m² Birim Değeri', tlm2(isletme.landUnitValue), { bold: true });
    for (const l of fxLines(input.fx, isletme.landValue, isletme.landUnitValue)) {
      row(`Arsa Değeri (${l.code}) · ${fxRateNote(l.rate, tarih)}`,
          `${fxMoney(l.symbol, l.value)} · ${fxMoney(l.symbol, l.unitValue)}/m²`, { bold: true });
    }
    y += 4;

    drawFooter(doc, version, 'Ticari İşletme · Müteahhit kazancı kesilmez · Tutarlar KDV hariçtir');
    const name0 = `Arsa-Analizi-${(p.ilce || p.il || 'rapor').replace(/\s+/g, '-')}-${p.ada || ''}-${p.parsel || ''}.pdf`
      .replace(/-+\./, '.');
    return { doc, name: name0 };
  }

  hero();

  section('PARSEL VE İMAR');
  row('Parsel Alanı (tapu)', m2p(p.area));
  row('Net Parsel Alanı', m2p(p.netArea));
  row('Plan Lejantı', input.zoning.lejant.trim() || '—');
  row('Hesap Yöntemi', input.zoning.mode === 'cekme' ? 'Çekme Mesafesi' : input.zoning.mode === 'taks-kaks' ? 'TAKS / KAKS' : 'Alan Bilgisi Girilerek');
  if (input.zoning.mode === 'cekme') {
    row('Bahçe Mesafeleri (ön/yan/arka)', `${input.zoning.cekmeFront.toLocaleString(LOC())} / ${input.zoning.cekmeSide.toLocaleString(LOC())} / ${input.zoning.cekmeRear.toLocaleString(LOC())} m`);
    if (input.zoning.hmax) row('Hmax', `${input.zoning.hmax.toLocaleString(LOC())} m`);
  }
  if (input.zoning.mode === 'taks-kaks') {
    row('TAKS / KAKS', `${input.zoning.taks != null ? num2(input.zoning.taks) : '—'} / ${input.zoning.kaks != null ? num2(input.zoning.kaks) : '—'}`);
    if (input.zoning.hmax) row('Hmax', `${input.zoning.hmax.toLocaleString(LOC())} m`);
  }
  y += 4;

  methodComparison();
  assumptionsSummary();
  visualsRow();

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
  if (f.extrasCost > 0) row(`Proje, Ruhsat, Harç, Müşavirlik (${pct(input.cost.extrasRate, 0)})`, tl(f.extrasCost));
  if (f.financeCost > 0) row('Finansman Gideri', tl(f.financeCost));
  row('TOPLAM MALİYET', tl(f.totalCost), { band: true });
  if (apt) {
    if (karma) {
      if (apt.bodrumSaleableByUse.ticari > 0) row('Bodrum (ticari) Satış Birim Değeri', tlm2(input.sales.apt.bodrumTicari));
      if (apt.bodrumSaleableByUse.konut > 0) row('Bodrum (konut) Satış Birim Değeri', tlm2(input.sales.apt.bodrum));
    } else if (apt.saleableByKind.bodrum > 0) {
      row('Bodrum Satış Birim Değeri', tlm2(input.sales.apt.bodrum));
    }
    row(karma ? 'Zemin Kat (ticari) Satış Birim Değeri' : 'Zemin Kat Satış Birim Değeri', tlm2(input.sales.apt.zemin));
    if (karma && apt.saleableByKind.asma > 0) row('Asma Kat Satış Birim Değeri', tlm2(input.sales.apt.asma));
    row('Normal Kat Satış Birim Değeri', tlm2(input.sales.apt.normal));
    if (apt.saleableByKind.piyes > 0) row('Piyes Satış Birim Değeri', tlm2(input.sales.apt.piyes));
  }
  row('Yapı Satış Hasılatı', tl(f.buildingRevenue));
  if (f.gardenRevenue > 0) row('Bahçe Satış Hasılatı', tl(f.gardenRevenue));
  row('TOPLAM SATIŞ HASILATI', tl(f.revenue), { bold: true, color: GREEN });
  row(`Müteahhit Kazancı (${pct(input.residual.profitRate, 0)})`, tl(f.developerProfit), { color: RED });
  row('ARSA DEĞERİ (GELİR PROJEKSİYONU)', tl(f.residualLandValueRounded), { band: true });
  if ((input.residual.projectMonths ?? 0) > 0 && (input.residual.timeDiscountRate ?? 0) > 0 && f.discountedLandValue != null) {
    row(`İndirgemeli Arsa Değeri (${input.residual.projectMonths} ay · ${pct(input.residual.timeDiscountRate ?? 0, 0)})`,
        tl(f.discountedLandValue), { bold: true });
  }
  row('Arsa m² Birim Değeri', tlm2(f.landUnitValue), { bold: true });
  row('Arsa Değeri / Hasılat', pct(f.landToRevenue));
  for (const l of fxLines(input.fx, f.residualLandValueRounded, f.landUnitValue)) {
    row(`Arsa Değeri (${l.code}) · ${fxRateNote(l.rate, tarih)}`,
        `${fxMoney(l.symbol, l.value)} · ${fxMoney(l.symbol, l.unitValue)}/m²`, { bold: true });
  }
  y += 4;

  if (input.zoning.planNotes.trim()) {
    section('PLAN NOTLARI');
    paragraph(input.zoning.planNotes);
  }

  drawFooter(doc, version);

  const name = `Arsa-Analizi-${(p.ilce || p.il || 'rapor').replace(/\s+/g, '-')}-${p.ada || ''}-${p.parsel || ''}.pdf`
    .replace(/-+\./, '.');
  return { doc, name };
}

export async function downloadPdf(input: ProjectInput, r: AnalysisResult, version: string) {
  const { doc, name } = await buildPdf(input, r, version);
  triggerDownload(doc.output('blob'), name);
}
