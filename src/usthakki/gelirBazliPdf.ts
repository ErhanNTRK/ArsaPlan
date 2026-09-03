/**
 * ÜST HAKKI YÖNTEM 4: BASİT GELİR BAZLI HESAP — PDF çıktısı.
 * Diğer Üst Hakkı modelleriyle (Ayrıntılı, Basit Toplam/Arsa Değeri Esaslı)
 * aynı tasarım dili: sonuç en başta, dönemsel özet tablosu tek tablo.
 */
import { jsPDF } from 'jspdf';
import { BRAND } from '../brand/brand';
import { NAVY, INK, GRAY, FAINT, GOLD, M, PW, W } from '../export/pdf';
import { drawHeader, drawFooter, drawBankInfoStrip, loadFonts } from '../export/pdf';
import type { GelirBazliUstHakkiInput, GelirBazliUstHakkiResult } from './gelirBazliEngine';

const SYM: Record<GelirBazliUstHakkiInput['currency'], string> = { TL: '₺', USD: '$', EUR: '€' };
const cur = (v: number, input: GelirBazliUstHakkiInput) =>
  Math.round(v).toLocaleString('tr-TR') + ' ' + SYM[input.currency];

export async function buildGelirBazliUstHakkiPdf(
  input: GelirBazliUstHakkiInput, r: GelirBazliUstHakkiResult,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  drawHeader(doc, 'Basit Gelir Bazlı Üst Hakkı Hesabı', 'Sadeleştirilmiş Gelir İndirgeme (DCF)');
  let y = 44;
  y = drawBankInfoStrip(doc, y, { bankName: input.bankName, branchName: input.branchName, reportDate: input.showReportDate ? (input.reportDate ?? new Date().toISOString().slice(0, 10)) : null });

  function pageBreak(need: number): boolean { if (y + need > 280) { doc.addPage(); y = 20; return true; } return false; }
  function sectionTitle(t: string) {
    pageBreak(10);
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.5, W, 6.5, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text(t, M + 3, y);
    y += 8;
  }
  function row(label: string, value: string, bold = false) {
    pageBreak(7);
    doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text(label, M + 3, y);
    doc.setFont('NTRK', bold ? 'bold' : 'normal'); doc.setTextColor(...INK);
    doc.text(value, PW - M - 3, y, { align: 'right' });
    y += 6.5;
  }

  const hasIdentity = !!(input.hotelName || input.ada || input.parsel);
  if (hasIdentity) {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
    const parts = [input.hotelName, input.ada && `Ada ${input.ada}`, input.parsel && `Parsel ${input.parsel}`,
      input.fromKml && '(KML)'].filter(Boolean).join(' · ');
    doc.text(parts, M, y); y += 7;
  }

  /* ── SONUÇ — en başta ── */
  const boxH = input.currency !== 'TL' ? 32 : 24;
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, W, boxH, 2, 2, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y + boxH - 1.5, W, 1.5, 'F');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(196, 212, 229);
  doc.text('ÜST HAKKI DEĞERİ', M + 5, y + 8);
  doc.setFont('NTRK', 'bold'); doc.setFontSize(19); doc.setTextColor(255, 255, 255);
  doc.text(cur(r.ustHakkiDegeriRounded, input), M + 5, y + 19);
  if (input.currency !== 'TL') {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(196, 212, 229);
    doc.text(`TL Karşılığı: ${Math.round(r.ustHakkiDegeriTl).toLocaleString('tr-TR')} ₺`, M + 5, y + 27);
  }
  y += boxH + 8;

  sectionTitle('PARSEL VE SÜRE BİLGİLERİ');
  if (input.hotelName) row('Otel/Tesis Adı', input.hotelName);
  if (input.ada) row('Ada', input.ada);
  if (input.parsel) row('Parsel', input.parsel);
  row('Parsel Alanı', `${input.parcelArea.toLocaleString('tr-TR')} m²` + (input.fromKml ? ' (KML)' : ''));
  row('Toplam Süre', `${input.toplamSureYil} yıl`);
  row('Kalan Süre (= Projeksiyon Süresi)', `${input.kalanSureYil} yıl`);
  row('İskonto Oranı', `%${(r.discountRate * 100).toFixed(1)}`);
  y += 2;

  sectionTitle('GİRDİ VARSAYIMLARI');
  row('Toplam Gelir (1. yıl)', cur(input.toplamGelirBase, input));
  row('Gelir Artış Oranı', `%${input.gelirArtisOraniPct}`);
  row('İşletme Gideri Oranı', `%${input.isletmeGideriOraniPct}`);
  row('Sabit Gider Oranı', `%${input.sabitGiderOraniPct}`);
  if (input.ecrimisilBase > 0) row('Ecrimisil (1. yıl, artış %' + input.ecrimisilGrowthPct + ')', cur(input.ecrimisilBase, input));
  if (input.ustHakkiOdemeBase > 0) row('Üst Hakkı Ödemesi (1. yıl, artış %' + input.ustHakkiOdemeGrowthPct + ')', cur(input.ustHakkiOdemeBase, input));
  if (input.bayilikBase > 0) row('Bayilik (1. yıl, artış %' + input.bayilikGrowthPct + ')', cur(input.bayilikBase, input));
  y += 2;

  sectionTitle(`DÖNEMSEL ÖZET TABLOSU (${r.years.length} DÖNEM)`);
  const h = 5.4;
  const C = [M + 2, M + W * 0.24, M + W * 0.44, M + W * 0.64, M + W * 0.82, PW - M - 2];
  function tableHead() {
    doc.setFillColor(...FAINT);
    doc.rect(M, y - 3.8, W, h, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(6.4); doc.setTextColor(...GRAY);
    doc.text('YIL', C[0], y);
    doc.text('TOPLAM GELİR', C[1], y, { align: 'right' });
    doc.text('NOI', C[2], y, { align: 'right' });
    doc.text('ÜST HAKKI SAHİBİNE KALAN', C[3], y, { align: 'right' });
    doc.text('BUGÜNKÜ DEĞER', C[4], y, { align: 'right' });
    y += h + 0.5;
  }
  tableHead();
  let zebra = false;
  for (const yr of r.years) {
    const newPage = pageBreak(h + 2);
    if (newPage) tableHead();
    if (zebra) { doc.setFillColor(...FAINT); doc.rect(M, y - 3.8, W, h, 'F'); }
    zebra = !zebra;
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...INK);
    doc.text(String(yr.year), C[0], y);
    doc.text(cur(yr.totalRevenue, input), C[1], y, { align: 'right' });
    doc.text(cur(yr.noi, input), C[2], y, { align: 'right' });
    doc.text(cur(yr.ustHakkiSahibineKalan, input), C[3], y, { align: 'right' });
    doc.setFont('NTRK', 'bold');
    doc.text(cur(yr.presentValue, input), C[4], y, { align: 'right' });
    y += h;
  }
  y += 4;

  pageBreak(30);
  sectionTitle('SONUÇ — HESAP DETAYI');
  row('Nakit Akış Bugünkü Değerleri Toplamı', cur(r.sumPresentValue, input));
  if (input.donemSonuIndirgemePct > 0) {
    row(`Dönem Sonu Değer İndirgeme (%${input.donemSonuIndirgemePct})`, '−' + cur(r.sumPresentValue - r.ustHakkiDegeriLocal, input));
  }
  row('ÜST HAKKI DEĞERİ (yukarıdaki kutuyla aynı)', cur(r.ustHakkiDegeriRounded, input), true);

  drawFooter(doc, BRAND.version, 'Yöntem: Basit Gelir Bazlı Üst Hakkı Hesabı (DCF) · Tutarlar KDV hariçtir');
  return doc;
}

export async function downloadGelirBazliUstHakkiPdf(input: GelirBazliUstHakkiInput, r: GelirBazliUstHakkiResult) {
  const doc = await buildGelirBazliUstHakkiPdf(input, r);
  doc.save('Ust-Hakki-Basit-Gelir-Bazli.pdf');
}
