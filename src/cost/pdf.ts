import { jsPDF } from 'jspdf';
import { loadFonts, drawHeader, drawFooter, NAVY, GOLD, INK, GRAY, FAINT, M, PW, W } from '../export/pdf';
import { triggerDownload } from '../export/excel';
import { BRAND } from '../brand/brand';
import type { CostApproachInput, CostApproachResult } from './engine';

export async function buildCostApproachPdf(
  input: CostApproachInput, r: CostApproachResult,
): Promise<{ doc: jsPDF; name: string }> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  const cur = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';
  const tarih = new Date().toLocaleDateString('tr-TR');
  let y = 0;

  drawHeader(doc, `Maliyet Yaklaşımı — ${input.category || 'Taşınmaz'}`,
    'Arsa + Yapılar + Şerefiye/Düzeltme/Çevre Düzenlemesi');
  y = 42;
  const kimlik = [input.general.il, input.general.ilce, input.general.mahalle,
    input.general.ada ? `Ada ${input.general.ada}` : '', input.general.parsel ? `Parsel ${input.general.parsel}` : '']
    .filter(Boolean).join(' · ');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8.6); doc.setTextColor(...GRAY);
  doc.text(kimlik || '—', M, y);
  doc.text(`Rapor Tarihi: ${tarih}`, PW - M, y, { align: 'right' });
  y += 8;

  function pageBreak(need = 14) { if (y + need > 280) { doc.addPage(); y = 18; } }
  function sectionTitle(title: string) {
    pageBreak(12);
    doc.setFont('NTRK', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK);
    doc.text(title, M, y); y += 3;
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.6); doc.line(M, y, M + W, y); y += 6;
  }
  function row(label: string, value: string, bold = false) {
    pageBreak(7);
    doc.setFont('NTRK', bold ? 'bold' : 'normal'); doc.setFontSize(9.2); doc.setTextColor(...INK);
    doc.text(label, M + 2, y);
    doc.setFont('NTRK', 'bold');
    doc.text(value, PW - M - 2, y, { align: 'right' });
    y += 6.3;
  }

  sectionTitle('ARSA');
  row('Net Arsa Alanı', `${(input.netParcelArea ?? 0).toLocaleString('tr-TR')} m²`);
  row('Arsa m² Birim Değeri', cur(input.landUnitValue));
  row('ARSA DEĞERİ', cur(r.landValue), true);
  y += 2;

  if (r.buildingRows.length > 0) {
    sectionTitle('YAPILAR');
    const heads = ['Yapı Türü', 'Alan m²', 'Birim Maliyet', 'Amortisman %', 'Değer'];
    const colX = [M + 2, M + 62, M + 92, M + 130, PW - M - 2];
    doc.setFont('NTRK', 'bold'); doc.setFontSize(7.6); doc.setTextColor(...GRAY);
    heads.forEach((h, i) => doc.text(h, colX[i], y, { align: i === 0 ? 'left' : 'right' }));
    y += 5;
    let zebra = false;
    for (const b of r.buildingRows) {
      pageBreak(7);
      if (zebra) { doc.setFillColor(...FAINT); doc.rect(M, y - 3.8, W, 6, 'F'); }
      zebra = !zebra;
      doc.setFont('NTRK', 'normal'); doc.setFontSize(8.4); doc.setTextColor(...INK);
      doc.text(b.type || '—', colX[0], y);
      doc.text(b.area.toLocaleString('tr-TR'), colX[1], y, { align: 'right' });
      doc.text(cur(b.effectiveUnitCost), colX[2], y, { align: 'right' });
      doc.text(`%${b.depreciationPct}`, colX[3], y, { align: 'right' });
      doc.text(cur(b.buildingValue), colX[4], y, { align: 'right' });
      y += 6;
    }
    row('TOPLAM YAPILAR DEĞERİ', cur(r.buildingsValue), true);
    y += 2;
  }

  if (r.adjustmentValue > 0) {
    sectionTitle('DÜZELTME');
    const label = input.adjustmentType === 'serefiye' ? 'Şerefiye' : input.adjustmentType === 'peyzaj' ? 'Çevre Düzenlemesi' : 'Düzeltme';
    row(label, cur(r.adjustmentValue));
    y += 2;
  }

  pageBreak(30);
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, W, 24, 2.2, 2.2, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y + 24 - 1.2, W, 1.2, 'F');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(168, 189, 212);
  doc.text('MALİYET YAKLAŞIMI DEĞERİ', M + 5, y + 8);
  doc.setFont('NTRK', 'bold'); doc.setFontSize(19); doc.setTextColor(255, 255, 255);
  doc.text(cur(r.totalValueRounded), M + 5, y + 18.5);
  y += 24 + 8;

  drawFooter(doc, BRAND.version, 'Yöntem: Maliyet Yaklaşımı · Tutarlar KDV hariçtir');

  const name = `Maliyet-Yaklasimi-${(input.category || 'rapor').replace(/\s+/g, '-')}.pdf`;
  return { doc, name };
}

export async function downloadCostApproachPdf(input: CostApproachInput, r: CostApproachResult) {
  const { doc, name } = await buildCostApproachPdf(input, r);
  triggerDownload(new Blob([doc.output('arraybuffer')], { type: 'application/pdf' }), name);
}
