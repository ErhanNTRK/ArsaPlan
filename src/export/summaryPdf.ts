/**
 * ÖZET PDF — tek sayfalık özet tablo (rapora eklenmek üzere).
 * Ana rapordaki aynı kurumsal görsel dil; içerik summary.ts'den gelir.
 */
import type { jsPDF } from 'jspdf';
import type { ProjectInput, AnalysisResult } from '../engine';
import { buildSummary, type SummarySection } from './summary';
import { loadFonts, drawHeader, drawBankInfoStrip, drawFooter, NAVY, INK, GRAY, FAINT, LINE, GOLD, GREEN, RED, M, PW, W } from './pdf';
import { triggerDownload } from './excel';
import { t } from '../i18n';

export async function buildSummaryPdf(input: ProjectInput, r: AnalysisResult, version: string): Promise<{ doc: jsPDF; name: string }> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  const S = buildSummary(input, r);
  const p = input.parcel;

  drawHeader(doc, 'ARSA DEĞER ANALİZİ — ÖZET', 'Gelir Projeksiyonu Yöntemi · Özet Tablo');
  let y = 41;
  y = drawBankInfoStrip(doc, y, {
    bankName: input.bankName, branchName: input.branchName,
    reportDate: input.showReportDate ? (input.reportDate ?? new Date().toISOString().slice(0, 10)) : null,
  });

  /* Künye */
  doc.setFillColor(...FAINT); doc.roundedRect(M, y, W, 13.5, 1.6, 1.6, 'F');
  doc.setDrawColor(...LINE); doc.roundedRect(M, y, W, 13.5, 1.6, 1.6, 'S');
  doc.setFont('NTRK', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK);
  doc.text(S.place, M + 4, y + 5.6);
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8.6); doc.setTextColor(...GRAY);
  doc.text(t(S.ident) + ' · ' + (input.zoning.lejant.trim() || t('Lejant girilmedi')), M + 4, y + 10.6);
  doc.setFontSize(8.2);
  doc.text(t(S.type), PW - M - 4, y + 10.6, { align: 'right' });
  y += 19;

  /* Ana değer */
  const H = 24;
  doc.setFillColor(...NAVY); doc.roundedRect(M, y, W, H, 2.2, 2.2, 'F');
  doc.setFillColor(...GOLD); doc.rect(M, y + H - 1.2, W, 1.2, 'F');
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(168, 189, 212);
  doc.text(t(S.headline.label), M + 5, y + 7);
  doc.setFont('NTRK', 'bold'); doc.setFontSize(20); doc.setTextColor(255, 255, 255);
  doc.text(S.headline.value, M + 5, y + 17);
  doc.setFont('NTRK', 'normal'); doc.setFontSize(8); doc.setTextColor(168, 189, 212);
  doc.text(t('Arsa m² Birim Değeri'), PW - M - 5, y + 7, { align: 'right' });
  doc.setFont('NTRK', 'bold'); doc.setFontSize(12); doc.setTextColor(255, 255, 255);
  doc.text(S.headline.unit, PW - M - 5, y + 15, { align: 'right' });
  y += H + 8;

  /* İki sütun: sol = ilk iki bölüm (parsel/alan), sağ = kalanlar (fizibilite/karşılaştırma) */
  const gap = 8, colW = (W - gap) / 2, rowH = 6;
  const drawSection = (sec: SummarySection, x: number, y0: number): number => {
    let yy = y0;
    doc.setFillColor(...GOLD); doc.rect(x, yy - 3.4, 1.6, 5.2, 'F');
    doc.setFont('NTRK', 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text(t(sec.title), x + 4, yy + 0.5);
    doc.setDrawColor(...LINE); doc.line(x, yy + 3, x + colW, yy + 3);
    yy += 8;
    let z = false;
    for (const rw of sec.rows) {
      if (rw.band) {
        doc.setFillColor(...NAVY); doc.rect(x, yy - 4.2, colW, rowH, 'F');
        doc.setFont('NTRK', 'bold'); doc.setFontSize(8.2); doc.setTextColor(255, 255, 255);
        doc.text(t(rw.label), x + 2, yy);
        doc.text(rw.value, x + colW - 2, yy, { align: 'right' });
        z = false; yy += rowH + 0.6; continue;
      }
      if (z) { doc.setFillColor(...FAINT); doc.rect(x, yy - 4.2, colW, rowH, 'F'); }
      z = !z;
      doc.setFont('NTRK', rw.strong ? 'bold' : 'normal'); doc.setFontSize(8.3);
      doc.setTextColor(...(rw.strong ? NAVY : GRAY));
      const label = doc.splitTextToSize(t(rw.label), colW * 0.6)[0] as string;
      doc.text(label, x + 2, yy);
      doc.setFont('NTRK', 'bold'); doc.setFontSize(8.3);
      doc.setTextColor(...(rw.tone === 'pos' ? GREEN : rw.tone === 'neg' ? RED : INK));
      doc.text(doc.splitTextToSize(rw.value, colW * 0.62)[0] as string, x + colW - 2, yy, { align: 'right' });
      yy += rowH;
    }
    return yy + 5;
  };
  const left = S.sections.filter((s) => s.title === 'PARSEL VE İMAR' || s.title === 'ALAN BİLGİSİ' || s.title === 'TAŞINMAZ');
  const right = S.sections.filter((s) => !left.includes(s));
  let yl = y, yr = y;
  for (const sec of left) yl = drawSection(sec, M, yl);
  for (const sec of right) yr = drawSection(sec, M + colW + gap, yr);

  drawFooter(doc, version, 'Özet Tablo · Tutarlar KDV hariçtir');

  const name = `Arsa-Analizi-Ozet-${(p.ilce || p.il || 'rapor').replace(/\s+/g, '-')}-${p.ada || ''}-${p.parsel || ''}.pdf`.replace(/-+\./, '.');
  return { doc, name };
}

export async function downloadSummaryPdf(input: ProjectInput, r: AnalysisResult, version: string) {
  const { doc, name } = await buildSummaryPdf(input, r, version);
  triggerDownload(doc.output('blob'), name);
}
