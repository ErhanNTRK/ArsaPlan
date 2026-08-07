/**
 * JPEG ÇIKTISI — Maliyet Yaklaşımı PDF'inin 1. sayfasının birebir görüntüsü.
 * Mekanizma src/export/jpeg.ts ile aynı (pdf.js ile tarayıcıda çizilir).
 */
import { buildCostApproachPdf } from './pdf';
import { triggerDownload } from '../export/excel';
import type { CostApproachInput, CostApproachResult } from './engine';

export async function downloadCostApproachJpeg(input: CostApproachInput, r: CostApproachResult) {
  const { doc, name } = await buildCostApproachPdf(input, r);
  const data = doc.output('arraybuffer');

  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const scale = 150 / 72;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG üretilemedi'))), 'image/jpeg', 0.92));
  triggerDownload(blob, name.replace(/\.pdf$/, '.jpg'));
}
