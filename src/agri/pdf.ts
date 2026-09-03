/**
 * TARIMSAL ÜRÜN GELİR HESABI — PDF çıktısı.
 * Aynı kurumsal başlık/altbilgi/font/renk paletini kullanır (drawHeader/drawFooter,
 * NAVY/GOLD/INK…) — tüm modüllerde tek görsel dil. Ada/parsel veya KML bilgisi
 * varsa gösterilir; yoksa da PDF sorunsuz üretilir (hiçbir alan zorunlu değildir).
 * Karma modda Ekili ve Dikili ürünler PDF'te AYRI iki liste halinde görünür.
 */
import { jsPDF } from 'jspdf';
import { BRAND } from '../brand/brand';
import { NAVY, INK, GRAY, FAINT, GOLD, GREEN, M, PW, W, tl, m2 } from '../export/pdf';
import { drawHeader, drawFooter, drawBankInfoStrip, loadFonts } from '../export/pdf';
import type { AgriInput, AgriResult, CropRowResult } from './engine';

export async function buildAgriPdf(input: AgriInput, r: AgriResult): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  drawHeader(doc, 'Tarımsal Ürün Gelir Hesabı', 'Ürün deseni ve gelir yaklaşımı analizi');
  let y = 44;
  y = drawBankInfoStrip(doc, y, { bankName: input.bankName, branchName: input.branchName, reportDate: input.showReportDate ? (input.reportDate ?? new Date().toISOString().slice(0, 10)) : null });

  const hasIdentity = !!(input.mahalle || input.ada || input.parsel);
  if (hasIdentity) {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
    const parts = [
      input.mahalle && `${input.mahalle} Mah.`,
      input.ada && `Ada ${input.ada}`,
      input.parsel && `Parsel ${input.parsel}`,
      input.fromKml && '(KML)',
    ].filter(Boolean).join(' · ');
    doc.text(parts, M, y);
    y += 7;
  }

  doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...INK);
  doc.text(`Parsel Alanı: ${m2(input.parcelArea)}  ·  Ekilebilir Alan: ${m2(r.arableArea)} (%${input.arablePct.toLocaleString('tr-TR')})`, M, y);
  y += 9;

  /* PARSEL KROKİSİ — diğer modüllerle (Arsa Gelir Projeksiyonu, Otel, Akaryakıt,
     Maliyet Yaklaşımı) aynı görsel dil: lacivert sınır + açık dolgu, kuzey oku.
     Burada TAKS/çekme kavramı yok, yalnız parselin kendisi çizilir. */
  if (input.kml && input.kml.points.length >= 3) {
    const k = input.kml;
    const xs = k.points.map((q) => q.x), ys = k.points.map((q) => q.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
    const BW = W - 8;
    const BH = Math.min(78, Math.max(45, BW * (spanY / spanX)));
    if (y + BH + 22 > 275) { doc.addPage(); y = 18; }
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.5, W, 6.5, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text('PARSEL KROKİSİ', M + 3, y);
    y += 8;
    const bx = M + 4, by = y + 2;
    const sc = Math.min((BW - 12) / spanX, (BH - 12) / spanY);
    const SX = (x: number) => bx + 6 + (x - minX) * sc + (BW - 12 - spanX * sc) / 2;
    const SY = (yy: number) => by + BH - 6 - (yy - minY) * sc - (BH - 12 - spanY * sc) / 2;
    doc.setDrawColor(210, 214, 219); doc.setFillColor(253, 252, 250);
    doc.roundedRect(M, by - 2, W, BH + 4, 1.5, 1.5, 'FD');
    doc.setFillColor(237, 240, 245); doc.setDrawColor(...NAVY); doc.setLineWidth(0.5);
    const segs = k.points.map((q, i) => {
      const nxt = k.points[(i + 1) % k.points.length];
      return [SX(nxt.x) - SX(q.x), SY(nxt.y) - SY(q.y)] as [number, number];
    });
    doc.lines(segs, SX(k.points[0].x), SY(k.points[0].y), [1, 1], 'FD', true);
    doc.setLineWidth(0.2);
    const nx0 = M + W - 7, ny0 = by + 6;
    doc.setFillColor(...NAVY);
    doc.triangle(nx0, ny0 - 3.2, nx0 + 1.9, ny0 + 2.6, nx0 - 1.9, ny0 + 2.6, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...NAVY);
    doc.text('K', nx0, ny0 + 6.4, { align: 'center' });
    y = by + BH + 6;
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.6); doc.setTextColor(...GRAY);
    doc.text(`Parsel Alanı: ${m2(input.parcelArea)}`, M + 3, y);
    y += 9;
  }

  function sectionTitle(title: string) {
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.5, W, 6.5, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text(title, M + 3, y);
    y += 8;
  }

  function table(rows: CropRowResult[]) {
    const h = 6.2;
    const C = [M + 3, M + W * 0.34, M + W * 0.52, M + W * 0.66, M + W * 0.80, PW - M - 3];
    doc.setFillColor(...FAINT);
    doc.rect(M, y - 4, W, h, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(7); doc.setTextColor(...GRAY);
    doc.text('ÜRÜN', C[0], y);
    doc.text('BİRİM', C[1], y, { align: 'right' });
    doc.text('VERİM', C[2], y, { align: 'right' });
    doc.text('FİYAT', C[3], y, { align: 'right' });
    doc.text('GİDER %', C[4], y, { align: 'right' });
    doc.text('NET GELİR', C[5], y, { align: 'right' });
    y += h + 1;
    let z = false;
    for (const row of rows) {
      if (z) { doc.setFillColor(...FAINT); doc.rect(M, y - 4, W, h, 'F'); }
      z = !z;
      doc.setFont('NTRK', 'normal'); doc.setFontSize(8.3); doc.setTextColor(...INK);
      doc.text(row.name || '(isimsiz)', C[0], y);
      doc.text(row.kind === 'ekili' ? m2(row.areaM2) : row.units.toLocaleString('tr-TR') + ' ağaç', C[1], y, { align: 'right' });
      doc.text(row.yieldPerUnit.toLocaleString('tr-TR') + ' kg', C[2], y, { align: 'right' });
      doc.text(row.price.toLocaleString('tr-TR') + ' ₺/kg', C[3], y, { align: 'right' });
      doc.text('%' + row.expensePct.toLocaleString('tr-TR'), C[4], y, { align: 'right' });
      doc.setFont('NTRK', 'bold'); doc.setTextColor(...GREEN);
      doc.text(tl(row.netWithByproduct), C[5], y, { align: 'right' });
      y += h;
      if (row.byproductResult) {
        const b = row.byproductResult;
        doc.setFont('NTRK', 'normal'); doc.setFontSize(7.6); doc.setTextColor(...GRAY);
        doc.text(`  + Yan ürün: ${b.name}`, C[0], y);
        doc.text(row.kind === 'ekili' ? m2(row.areaM2) : row.units.toLocaleString('tr-TR') + ' ağaç', C[1], y, { align: 'right' });
        doc.text(b.yieldPerUnit.toLocaleString('tr-TR') + ' kg', C[2], y, { align: 'right' });
        doc.text(b.price.toLocaleString('tr-TR') + ' ₺/kg', C[3], y, { align: 'right' });
        doc.text('%' + b.expensePct.toLocaleString('tr-TR'), C[4], y, { align: 'right' });
        doc.text(tl(b.net), C[5], y, { align: 'right' });
        y += h - 1;
      }
    }
  }

  const ekiliRows = r.rows.filter((x) => x.kind === 'ekili');
  const dikiliRows = r.rows.filter((x) => x.kind === 'dikili');

  if (ekiliRows.length) { sectionTitle('EKİLİ ÜRÜNLER'); table(ekiliRows); y += 4; }
  if (dikiliRows.length) { sectionTitle('DİKİLİ ÜRÜNLER (AĞAÇ)'); table(dikiliRows); y += 4; }

  if (r.remainingArea > 0 && dikiliRows.some((x) => x.areaM2 > 0)) {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GRAY);
    doc.text(`Kalan Alan: ${m2(r.remainingArea)}`, M, y);
    y += 8;
  }

  y += 2;
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, W, 26, 2, 2, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y + 24.5, W, 1.5, 'F');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(196, 212, 229);
  doc.text('YAKLAŞIK DEĞER', M + 5, y + 8);
  doc.setFont('NTRK', 'bold'); doc.setFontSize(19); doc.setTextColor(255, 255, 255);
  doc.text(tl(r.value), M + 5, y + 19);
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(196, 212, 229);
  doc.text(`Net Gelir/yil: ${tl(r.totalNet)}  ·  Amorti: ${input.amortYears} yil`, M + W * 0.5, y + 19);
  y += 32;

  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY);

  drawFooter(doc, BRAND.version, 'Yöntem: Tarımsal Ürün Gelir Hesabı · Tutarlar KDV hariçtir');
  return doc;
}

export async function downloadAgriPdf(input: AgriInput, r: AgriResult) {
  const doc = await buildAgriPdf(input, r);
  const name = `Tarimsal-Urun-${(input.mahalle || 'Rapor').replace(/\s+/g, '-')}-${input.ada || ''}-${input.parsel || ''}.pdf`.replace(/-+\./, '.');
  doc.save(name);
}
