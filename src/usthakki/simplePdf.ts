/**
 * ÜST HAKKI YÖNTEM 1/2 — PDF çıktısı.
 * Salih'in kuralı: "150.000.000 ÷3 ×2 gibi ara hesaplar gösterilmeyecek" —
 * yalnız Parsel bilgileri ve nihai Üst Hakkı Değeri (Yöntem 2'de ayrıca
 * Üst Hakkı Arsa Değeri + Bina Değeri bileşenleri, çünkü Salih'in örneği
 * bunları açıkça "gösterilecek" diye belirtti).
 */
import { jsPDF } from 'jspdf';
import { BRAND } from '../brand/brand';
import { NAVY, INK, GRAY, GOLD, M, PW, W } from '../export/pdf';
import { drawHeader, drawFooter, loadFonts } from '../export/pdf';
import type { WholeValueResult, LandOnlyResult } from './simpleCostEngine';

interface SimpleInput {
  hotelName: string; mahalle: string; ada: string; parsel: string; parcelArea: number; fromKml: boolean;
  currency: 'TL' | 'USD' | 'EUR';
}
const SYM: Record<SimpleInput['currency'], string> = { TL: '₺', USD: '$', EUR: '€' };
const cur = (v: number, input: SimpleInput) => Math.round(v).toLocaleString('tr-TR') + ' ' + SYM[input.currency];

export async function buildSimpleUstHakkiPdf(
  method: 'toplam' | 'arsa', input: SimpleInput, whole: WholeValueResult, land: LandOnlyResult,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  const title = method === 'toplam' ? 'Toplam Değerden Üst Hakkı Hesabı' : 'Sadece Arsa Değeri Üzerinden Üst Hakkı Hesabı';
  drawHeader(doc, title, 'Üst Hakkı Değerleme Raporu');
  let y = 44;

  function sectionTitle(t: string) {
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.5, W, 6.5, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text(t, M + 3, y);
    y += 8;
  }
  function row(label: string, value: string, bold = false) {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text(label, M + 3, y);
    doc.setFont('NTRK', bold ? 'bold' : 'normal'); doc.setTextColor(...INK);
    doc.text(value, PW - M - 3, y, { align: 'right' });
    y += 6.5;
  }

  sectionTitle('PARSEL BİLGİLERİ');
  if (input.hotelName) row('Otel Adı', input.hotelName);
  if (input.mahalle) row('Mahalle', input.mahalle);
  if (input.ada) row('Ada', input.ada);
  if (input.parsel) row('Parsel', input.parsel);
  row('Parsel Alanı', `${input.parcelArea.toLocaleString('tr-TR')} m²` + (input.fromKml ? ' (KML)' : ''));
  y += 4;

  if (method === 'arsa') {
    sectionTitle('SONUÇ');
    row('Üst Hakkı Arsa Değeri', cur(land.ustHakkiArsaDegeri, input));
    row('+ Bina Değeri', cur(land.buildingValueAdded, input));
    y += 2;
  }

  const boxH = 24;
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, W, boxH, 2, 2, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y + boxH - 1.5, W, 1.5, 'F');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(196, 212, 229);
  doc.text(method === 'toplam' ? 'ÜST HAKKI DEĞERİ' : 'NİHAİ ÜST HAKKI DEĞERİ', M + 5, y + 8);
  doc.setFont('NTRK', 'bold'); doc.setFontSize(19); doc.setTextColor(255, 255, 255);
  const finalValue = method === 'toplam' ? whole.ustHakkiValue : land.nihaiUstHakkiDegeri;
  doc.text(cur(finalValue, input), M + 5, y + 19);
  y += boxH + 8;

  drawFooter(doc, BRAND.version, `Yöntem: ${title} · Tutarlar KDV hariçtir`);
  return doc;
}

export async function downloadSimpleUstHakkiPdf(
  method: 'toplam' | 'arsa', input: SimpleInput, whole: WholeValueResult, land: LandOnlyResult,
) {
  const doc = await buildSimpleUstHakkiPdf(method, input, whole, land);
  doc.save(method === 'toplam' ? 'Ust-Hakki-Toplam-Degerden.pdf' : 'Ust-Hakki-Sadece-Arsa.pdf');
}
