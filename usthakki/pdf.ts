/**
 * ÜST HAKKI DEĞERLEME — PDF çıktısı.
 * Dönem sayısı kalan süreye göre değişir; tablo pageBreak ile otomatik
 * sayfalanır, hiçbir zaman taşmaz. Aynı kurumsal görsel dil (NAVY/GOLD/INK).
 * NOT: "â" harfi PDF fontunda desteklenmiyor — "Kâr/kazanç" gibi kelimeler
 * kullanılmaz (bkz. Fuel modülü düzeltmesi, 2026-07-30).
 */
import { jsPDF } from 'jspdf';
import { BRAND } from '../brand/brand';
import { NAVY, INK, GRAY, FAINT, GOLD, M, PW, W, tl } from '../export/pdf';
import { drawHeader, drawFooter, loadFonts } from '../export/pdf';
import type { UstHakkiInput, UstHakkiResult } from './engine';

export async function buildUstHakkiPdf(input: UstHakkiInput, r: UstHakkiResult): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  drawHeader(doc, 'Üst Hakkı Değerleme Raporu', 'Gelir İndirgeme (DCF) ve Karşılaştırmalı Yöntemler');
  let y = 44;

  function pageBreak(need: number) {
    if (y + need > 280) { doc.addPage(); y = 20; }
  }
  function sectionTitle(title: string) {
    pageBreak(10);
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.5, W, 6.5, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text(title, M + 3, y);
    y += 8;
  }
  function row(label: string, value: string, bold = false) {
    pageBreak(7);
    doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text(label, M + 3, y);
    doc.setFont('NTRK', bold ? 'bold' : 'normal'); doc.setTextColor(...INK);
    doc.text(value, PW - M - 3, y, { align: 'right' });
    y += 6.2;
  }

  sectionTitle('SÜRE VE İSKONTO');
  row('İlk Süre', `${input.ilkSureYil} yıl`);
  row('Kalan Süre', `${input.kalanSureYil} yıl`);
  row('İskonto Oranı (risksiz + risk primi)', `%${(r.discountRate * 100).toFixed(1)}`);
  y += 2;

  sectionTitle(`GELİR İNDİRGEME TABLOSU (${r.years.length} DÖNEM)`);
  const h = 5.6;
  const C = [M + 3, M + W * 0.32, M + W * 0.52, M + W * 0.72, PW - M - 3];
  function tableHead() {
    doc.setFillColor(...FAINT);
    doc.rect(M, y - 4, W, h, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(6.6); doc.setTextColor(...GRAY);
    doc.text('YIL', C[0], y);
    doc.text('GELİR', C[1], y, { align: 'right' });
    doc.text('ÖDEME/ECRİMİSİL', C[2], y, { align: 'right' });
    doc.text('NET NAKİT AKIŞ', C[3], y, { align: 'right' });
    doc.text('BUGÜNKÜ DEĞER', C[4], y, { align: 'right' });
    y += h + 0.5;
  }
  tableHead();
  let zebra = false;
  for (const yr of r.years) {
    pageBreak(h + 2);
    if (y < 48) tableHead(); // sayfa değiştiyse başlığı tekrar bas
    if (zebra) { doc.setFillColor(...FAINT); doc.rect(M, y - 4, W, h, 'F'); }
    zebra = !zebra;
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...INK);
    doc.text(String(yr.year), C[0], y);
    doc.text(tl(yr.income), C[1], y, { align: 'right' });
    doc.text(yr.payment + yr.ecrimisil > 0 ? '−' + tl(yr.payment + yr.ecrimisil) : '—', C[2], y, { align: 'right' });
    doc.text(tl(yr.netCashFlow), C[3], y, { align: 'right' });
    doc.setFont('NTRK', 'bold');
    doc.text(tl(yr.presentValue), C[4], y, { align: 'right' });
    y += h;
  }
  y += 4;
  if (input.hasTerminalValue) {
    row(`Devir Sonu Bedeli (${input.kalanSureYil}. yıl sonu, indirgenmiş)`, tl(input.terminalValue / Math.pow(1 + r.discountRate, input.kalanSureYil)));
  } else {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.6); doc.setTextColor(...GRAY);
    pageBreak(6);
    doc.text('Devir sonu bedeli: sözleşmede belirtilmediği için hesaba katılmamıştır.', M, y);
    y += 6;
  }

  pageBreak(30);
  y += 2;
  sectionTitle('KARŞILAŞTIRMALI YÖNTEMLER');
  row('DCF Değeri', tl(r.dcfValue), input.finalMethod === 'dcf');
  row(`Referans Üst Hakkı Hesabı (K=${r.referenceFactor.toFixed(3)})`, tl(r.referenceValue), input.finalMethod === 'reference');
  if (input.costApproachValue != null) row('Maliyet Yaklaşımı', tl(input.costApproachValue), input.finalMethod === 'cost');
  if (input.marketApproachValue != null) row('Emsal Yaklaşımı', tl(input.marketApproachValue), input.finalMethod === 'market');
  y += 4;

  pageBreak(28);
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, W, 24, 2, 2, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y + 22.5, W, 1.5, 'F');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(196, 212, 229);
  doc.text('NİHAİ ÜST HAKKI DEĞERİ', M + 5, y + 8);
  doc.setFont('NTRK', 'bold'); doc.setFontSize(19); doc.setTextColor(255, 255, 255);
  doc.text(tl(r.finalValue), M + 5, y + 19);
  y += 30;

  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY);
  pageBreak(8);
  doc.text('Nihai değer takdiri uzmana aittir; sistem yöntemler arasında seçim yapmaz.', M, y);

  drawFooter(doc, BRAND.version, 'Yöntem: Üst Hakkı Değerleme (DCF) · Tutarlar KDV hariçtir');
  return doc;
}

export async function downloadUstHakkiPdf(input: UstHakkiInput, r: UstHakkiResult) {
  const doc = await buildUstHakkiPdf(input, r);
  doc.save('Ust-Hakki-Degerleme-Raporu.pdf');
}
