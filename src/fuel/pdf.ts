/**
 * AKARYAKIT GELİR HESABI — PDF çıktısı.
 * Aynı kurumsal başlık/altbilgi/font/renk paletini kullanır — tüm modüllerde
 * tek görsel dil. Gelir ve (varsa) Maliyet yaklaşımı yan yana gösterilir.
 */
import { jsPDF } from 'jspdf';
import { BRAND } from '../brand/brand';
import { NAVY, INK, GRAY, FAINT, GOLD, GREEN, M, PW, W, tl } from '../export/pdf';
import { drawHeader, drawFooter, drawBankInfoStrip, loadFonts } from '../export/pdf';
import type { FuelInput, FuelResult } from './engine';

export async function buildFuelPdf(input: FuelInput, r: FuelResult): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  drawHeader(doc, 'Akaryakıt Gelir Hesabı', 'İstasyon satışları ve değerleme analizi (KDV hariç)');
  let y = 44;
  y = drawBankInfoStrip(doc, y, { bankName: input.bankName, branchName: input.branchName, reportDate: input.showReportDate ? (input.reportDate ?? new Date().toISOString().slice(0, 10)) : null });

  function sectionTitle(title: string) {
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 4.5, W, 6.5, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text(title, M + 3, y);
    y += 8;
  }
  function row(label: string, value: string, bold = false) {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text(label, M + 3, y);
    doc.setFont('NTRK', bold ? 'bold' : 'normal'); doc.setTextColor(...INK);
    doc.text(value, PW - M - 3, y, { align: 'right' });
    y += 6.2;
  }

  sectionTitle('AKARYAKIT SATIŞLARI (KDV HARİÇ)');
  const h = 6.2;
  const C = [M + 3, M + W * 0.32, M + W * 0.48, M + W * 0.66, M + W * 0.82, PW - M - 3];
  doc.setFillColor(...FAINT);
  doc.rect(M, y - 4, W, h, 'F');
  doc.setFont('NTRK', 'bold'); doc.setFontSize(7); doc.setTextColor(...GRAY);
  doc.text('ÜRÜN', C[0], y);
  doc.text('BİRİM FİYAT', C[1], y, { align: 'right' });
  doc.text('YILLIK LİTRE', C[2], y, { align: 'right' });
  doc.text('CİRO', C[3], y, { align: 'right' });
  doc.text('KAZANÇ %', C[4], y, { align: 'right' });
  doc.text('NET KAZANÇ', C[5], y, { align: 'right' });
  y += h + 1;
  let z = false;
  for (const p of r.products) {
    if (z) { doc.setFillColor(...FAINT); doc.rect(M, y - 4, W, h, 'F'); }
    z = !z;
    doc.setFont('NTRK', 'normal'); doc.setFontSize(8.3); doc.setTextColor(...INK);
    doc.text(p.name, C[0], y);
    doc.text(tl(p.unitPrice) + '/Lt', C[1], y, { align: 'right' });
    doc.text(Math.round(p.yearlyLitersUsed).toLocaleString('tr-TR') + ' Lt', C[2], y, { align: 'right' });
    doc.text(tl(p.turnover), C[3], y, { align: 'right' });
    doc.text('%' + p.profitPct.toLocaleString('tr-TR'), C[4], y, { align: 'right' });
    doc.setFont('NTRK', 'bold'); doc.setTextColor(...GREEN);
    doc.text(tl(p.net), C[5], y, { align: 'right' });
    y += h;

    if (p.mode === 'cokyil') {
      const vals = p.multiYearLiters.filter((v) => v > 0);
      const labels = p.multiYearLabels ?? vals.map((_, i) => `${i + 1}. Yıl`);
      p.multiYearLiters.forEach((v, i) => {
        if (v <= 0) return;
        doc.setFont('NTRK', 'normal'); doc.setFontSize(7.4); doc.setTextColor(...GRAY);
        doc.text(`  ${labels[i] ?? `${i + 1}. Yıl`}`, C[0] + 2, y);
        doc.text(Math.round(v).toLocaleString('tr-TR') + ' Lt', C[2], y, { align: 'right' });
        doc.text(tl(v * p.unitPrice), C[3], y, { align: 'right' });
        y += h - 1.4;
      });
      if (vals.length > 0) {
        doc.setFont('NTRK', 'bold'); doc.setFontSize(7.4); doc.setTextColor(...INK);
        doc.text(`  ${vals.length} Yıllık Ortalama`, C[0] + 2, y);
        doc.text(Math.round(p.yearlyLitersUsed).toLocaleString('tr-TR') + ' Lt', C[2], y, { align: 'right' });
        y += h - 1.4;
      }
    }
  }
  y += 4;

  /* DÜZELTME: "DİĞER GELİRLER VE KESİNTİLER" tek başlığı, gelir kalemlerini
     (Market, Oto Yıkama) bir kesinti kalemiyle (Dağıtıcı Kirası) karıştırıp
     gösteriyordu — Salih'in bildirdiği "gider gibi görünüyor" izlenimi tam
     buradan geliyordu. Artık iki AYRI, net başlıklı bölüm var. Ayrıca "ciro
     × kâr%" modunda girilen kalemlerin hesap detayı da (önceden hiç
     görünmeyen) küçük bir alt satırla gösteriliyor.
  */
  sectionTitle('DİĞER GELİR KALEMLERİ');
  row('Yakıt Net Kazancı/yıl', tl(r.fuelNet));
  for (const e of input.extras) {
    const net = e.mode === 'net' ? Math.max(0, e.netAmount) : Math.max(0, e.turnover) * Math.max(0, e.profitPct) / 100;
    if (net <= 0) continue;
    row(`  ${e.name || 'İlave Gelir Kalemi'}/yıl`, tl(net));
    if (e.mode === 'ciro') {
      doc.setFont('NTRK', 'normal'); doc.setFontSize(7); doc.setTextColor(...GRAY);
      doc.text(`    (Ciro ${tl(e.turnover)} x %${e.profitPct} kar oranı)`, M + 5, y - 1.2);
      y += 3.6;
    }
  }
  if (r.otherIncomeFromPct > 0) row(`Diğer Gelirler (yakıt cirosunun %${input.otherIncomePctOfFuel})`, tl(r.otherIncomeFromPct));
  y += 2;

  if (r.dealerRentApplied > 0) {
    sectionTitle('KESİNTİLER');
    row('Dağıtıcı Kirası', '−' + tl(r.dealerRentApplied));
    y += 2;
  }

  sectionTitle('SONUÇ');
  row('TOPLAM NET KAZANÇ/yıl', tl(r.totalNet), true);
  y += 4;

  doc.setFillColor(...NAVY);
  const method = input.finalMethod ?? 'gelir';
  const useManual = method === 'manuel' && input.finalManualValue != null && input.finalManualValue > 0;
  const heroValue = useManual ? input.finalManualValue!
    : method === 'maliyet' && r.costValue != null ? r.costValue
    : r.incomeValueRounded;
  const heroLabel = useManual ? 'NİHAİ DEĞER (KULLANICI BELİRLEDİ)'
    : method === 'maliyet' && r.costValue != null ? 'MALİYET YAKLAŞIMI'
    : 'GELİR YAKLAŞIMI';
  const boxH = 26;
  doc.roundedRect(M, y, W, boxH, 2, 2, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y + boxH - 1.5, W, 1.5, 'F');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(196, 212, 229);
  doc.text(heroLabel, M + 5, y + 8);
  doc.setFont('NTRK', 'bold'); doc.setFontSize(18); doc.setTextColor(255, 255, 255);
  doc.text(tl(heroValue), M + 5, y + 19);
  if (!useManual) {
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.5); doc.setTextColor(196, 212, 229);
    doc.text(method === 'maliyet' && r.costValue != null
      ? `Arsa ${tl(r.costLand)} + Yapılar ${tl(r.costBuildings)}`
      : `Net kazanç / %${input.capRate}`, M + 5, y + 25);
  }
  y += boxH + 6;

  /* İkincil yöntemler — seçilen nihai yöntem OLMAYAN diğerleri, küçük satırlar hâlinde */
  let hasSecondary = false;
  if (method !== 'gelir') { row('Gelir Yaklaşımı', tl(r.incomeValueRounded)); hasSecondary = true; }
  if (method !== 'maliyet' && r.costValue != null) { row('Maliyet Yaklaşımı', tl(r.costValue)); hasSecondary = true; }
  if (hasSecondary) y += 3;

  const showMevcutFuelCost = !!input.cost.computeMevcutDurum && (input.cost.mevcutBuildings?.length ?? 0) > 0
    && r.costCurrent.value != null;
  if (showMevcutFuelCost) {
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(...INK);
    doc.text('Maliyet Yaklaşımı — Mevcut Durum', M + 3, y);
    doc.setFont('NTRK', 'bold'); doc.setTextColor(...GREEN);
    doc.text(tl(r.costCurrent.value!), PW - M - 3, y, { align: 'right' });
    y += 5.6;
    doc.setFont('NTRK', 'normal'); doc.setFontSize(7.6); doc.setTextColor(...GRAY);
    doc.text(`Arsa ${tl(r.costLand)} + Yapılar ${tl(r.costCurrent.buildings)}`, M + 3, y);
    y += 7;
  }

  doc.setFont('NTRK', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
  doc.text('Kapitalizasyon Oranı', M + 3, y);
  doc.setFont('NTRK', 'bold'); doc.setTextColor(...INK);
  doc.text(`%${input.capRate}`, PW - M - 3, y, { align: 'right' });
  y += 8;

  drawFooter(doc, BRAND.version, 'Yöntem: Akaryakıt Gelir Hesabı · Tutarlar KDV hariçtir');
  return doc;
}

export async function downloadFuelPdf(input: FuelInput, r: FuelResult) {
  const doc = await buildFuelPdf(input, r);
  doc.save('Akaryakit-Gelir-Hesabi.pdf');
}
