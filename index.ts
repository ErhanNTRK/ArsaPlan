/**
 * OTEL GELİRİ — PDF RAPORU
 * Mevcut export/pdf.ts kurumsal görsel dilini (font, header, footer, renk paleti)
 * yeniden kullanır; jsPDF font gömme ve logo çizim mantığı tekrar yazılmamıştır.
 */
import { jsPDF } from 'jspdf';
import {
  loadFonts, drawHeader, drawFooter,
  NAVY, GOLD, INK, GRAY, FAINT, LINE, M, PW, W, tl, pct,
} from '../export/pdf';
import { triggerDownload } from '../export/excel';
import { BRAND } from '../brand/brand';
import type { HotelIncomeInput, HotelIncomeResult } from './types';

export async function buildHotelPdf(
  input: HotelIncomeInput, r: HotelIncomeResult,
): Promise<{ doc: jsPDF; name: string }> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);

  let y = 0;
  const tarih = new Date().toLocaleDateString('tr-TR');

  function pageBreak(need = 14) {
    if (y + need > 280) { doc.addPage(); y = 18; }
  }

  drawHeader(doc, input.general.facilityName || 'Otel Gelir Analizi', 'Gelir İndirgeme Yaklaşımı · Konaklama Tesisleri');
  y = 41;

  /* Künye */
  doc.setFillColor(...FAINT);
  doc.roundedRect(M, y, W, 13.5, 1.6, 1.6, 'F');
  doc.setDrawColor(...LINE);
  doc.roundedRect(M, y, W, 13.5, 1.6, 1.6, 'S');
  doc.setFont('NTRK', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK);
  const g = input.general;
  doc.text(`${g.il || '—'} / ${g.ilce || '—'}${g.mahalle ? ' · ' + g.mahalle + ' Mahallesi' : ''}`, M + 4, y + 5.6);
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8.6); doc.setTextColor(...GRAY);
  doc.text(`Ada ${g.ada || '—'} · Parsel ${g.parsel || '—'}`, M + 4, y + 10.6);
  doc.setFontSize(8.2);
  doc.text(`Rapor Tarihi: ${tarih}`, PW - M - 4, y + 5.6, { align: 'right' });
  doc.text('Direkt Kapitalizasyon Yöntemi', PW - M - 4, y + 10.6, { align: 'right' });
  y += 19;

  /* Sonuç şeridi */
  const H = 27;
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, W, H, 2.2, 2.2, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y + H - 1.2, W, 1.2, 'F');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(168, 189, 212);
  doc.text('GELİR YAKLAŞIMINA GÖRE PİYASA DEĞERİ', M + 5, y + 7);
  doc.setFont('NTRK', 'bold'); doc.setFontSize(21); doc.setTextColor(255, 255, 255);
  doc.text(tl(r.capitalizedValue), M + 5, y + 18.5);
  const cx = M + W * 0.58;
  doc.setDrawColor(58, 88, 124);
  doc.line(cx - 4, y + 4.5, cx - 4, y + H - 4.5);
  const stat = (label: string, val: string, sy: number) => {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.4); doc.setTextColor(168, 189, 212);
    doc.text(label, cx, sy);
    doc.setFont('NTRK', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
    doc.text(val, cx, sy + 5.2);
  };
  stat('NET İŞLETME GELİRİ (NOI)', tl(r.noi), y + 10.5);
  stat('KAPİTALİZASYON ORANI', pct(input.projection.capRate), y + 21.5);
  y += H + 8;

  /* Gelir kırılımı tablosu */
  const sectionTitle = (title: string) => {
    pageBreak(16);
    doc.setFont('NTRK', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...INK);
    doc.text(title, M, y);
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.6);
    doc.line(M, y + 1.6, M + 9, y + 1.6);
    y += 7;
  };

  const table = (head: string[], rows: string[][], widths: number[]) => {
    const rh = 6.4;
    doc.setFillColor(...NAVY);
    doc.rect(M, y, W, rh, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(7.6); doc.setTextColor(255, 255, 255);
    let x = M + 2;
    head.forEach((h, i) => { doc.text(h, x, y + rh - 2); x += widths[i]; });
    y += rh;
    rows.forEach((row, ri) => {
      pageBreak(rh + 2);
      if (ri % 2 === 1) { doc.setFillColor(...FAINT); doc.rect(M, y, W, rh, 'F'); }
      doc.setFont('NTRK', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...INK);
      let xx = M + 2;
      row.forEach((cell, ci) => { doc.text(cell, xx, y + rh - 2); xx += widths[ci]; });
      y += rh;
    });
    doc.setDrawColor(...LINE);
    doc.line(M, y, M + W, y);
    y += 6;
  };

  sectionTitle('Gelir Özeti');
  table(
    ['Gelir Kalemi', 'Yıllık Tutar'],
    [
      ['Toplam Oda Geliri', tl(r.totalRoomRevenue)],
      ['Toplam Yardımcı İşletme Geliri', tl(r.totalAncillaryRevenue)],
      ['Toplam Ticari Kira Geliri', tl(r.totalLeaseRevenue)],
      ['TOPLAM BRÜT GELİR', tl(r.totalGrossRevenue)],
      ['İşletme Gideri', `%${Math.round(input.opex.expenseRate * 100)} · ${tl(r.totalExpense)}`],
      ['NET İŞLETME GELİRİ (NOI)', tl(r.noi)],
    ],
    [110, 70],
  );

  if (r.roomRows.length > 0) {
    sectionTitle('Oda Dağılım Tablosu');
    table(
      ['Oda Tipi', 'Adet', 'Fiyat', 'Doluluk', 'Yıllık Gelir'],
      r.roomRows.map((row) => [
        row.roomType, String(row.roomCount), tl(row.adr), pct(row.occupancy, 0), tl(row.annualRevenue),
      ]),
      [55, 20, 35, 30, 40],
    );
  }

  if (r.leaseRows.length > 0) {
    sectionTitle('Ticari Kira Tablosu');
    table(
      ['Alan Adı', 'Kiracı', 'Aylık Kira', 'Yıllık Kira'],
      r.leaseRows.map((row) => [row.areaName || '—', row.tenant || '—', tl(row.monthlyAmount), tl(row.annualAmount)]),
      [55, 55, 35, 35],
    );
  }

  sectionTitle('Yıllık Projeksiyon Tablosu');
  table(
    ['Yıl', 'Toplam Gelir', 'İşletme Gideri', 'NOI', 'Kapitalizasyon Değeri'],
    r.projectionTable.map((row) => [
      String(row.year), tl(row.totalRevenue), tl(row.totalExpense), tl(row.noi), tl(row.capitalizedValue),
    ]),
    [20, 45, 40, 40, 45],
  );

  sectionTitle('Değerlendirme Özeti');
  pageBreak(20);
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8.6); doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(r.summaryText, W);
  doc.text(lines, M, y);
  y += lines.length * 4.2 + 4;

  drawFooter(doc, BRAND.version, 'Yöntem: Gelir İndirgeme Yaklaşımı (Direkt Kapitalizasyon) · Tutarlar KDV hariçtir');

  const name = `Otel-Gelir-Analizi-${(g.facilityName || g.ilce || g.il || 'rapor').replace(/\s+/g, '-')}.pdf`;
  return { doc, name };
}

export async function downloadHotelPdf(input: HotelIncomeInput, r: HotelIncomeResult) {
  const { doc, name } = await buildHotelPdf(input, r);
  triggerDownload(doc.output('blob'), name);
}
