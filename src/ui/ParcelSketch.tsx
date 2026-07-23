/**
 * Parsel Krokisi — KML poligonunu kurumsal dille çizer.
 * Lacivert sınır + açık dolgu; çekme sonrası oturum altın dolguyla içte.
 * Kuzey oku (projeksiyonda +y = kuzey) ve ölçek çubuğu ile.
 */
import { inwardOffset, polygonArea } from '../geo/kml';
import { LOC, t } from '../i18n';
import type { ParcelKml } from '../engine';

const fmt = (v: number, d = 0) =>
  v.toLocaleString(LOC(), { maximumFractionDigits: d, minimumFractionDigits: d });

export function ParcelSketch({ kml, width = 420 }: { kml: ParcelKml; width?: number }) {
  const pts = kml.points;
  if (pts.length < 3) return null;

  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX, spanY = maxY - minY;

  const PAD = 34;
  const height = Math.max(220, Math.round((width - 2 * PAD) * (spanY / spanX)) + 2 * PAD);
  const scale = Math.min((width - 2 * PAD) / spanX, (height - 2 * PAD) / spanY);
  // Ekran y aşağı büyür; kuzey yukarı kalsın diye çeviriyoruz
  const X = (x: number) => PAD + (x - minX) * scale + (width - 2 * PAD - spanX * scale) / 2;
  const Y = (y: number) => height - PAD - (y - minY) * scale - (height - 2 * PAD - spanY * scale) / 2;
  const path = (ps: { x: number; y: number }[]) =>
    ps.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ') + ' Z';

  const inner = kml.setback > 0 ? inwardOffset(pts, kml.setback) : null;
  const innerArea = inner ? polygonArea(inner) : 0;

  // Ölçek çubuğu: 5/10/20/50 m'den ekrana sığan en büyüğü
  const bar = [50, 20, 10, 5].find((b) => b * scale <= (width - 2 * PAD) * 0.4) ?? 5;

  return (
    <div className="sketch-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="sketch" role="img"
           aria-label={t('Parsel Krokisi')}>
        {/* Parsel */}
        <path d={path(pts)} fill="rgba(15,42,71,0.06)" stroke="#0F2A47" strokeWidth={2} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={2.6} fill="#0F2A47" />
        ))}
        {/* Çekme sonrası oturum */}
        {inner && (
          <path d={path(inner)} fill="rgba(178,141,66,0.28)" stroke="#B28D42"
                strokeWidth={1.6} strokeDasharray="5 3" strokeLinejoin="round" />
        )}
        {/* Kuzey oku */}
        <g transform={`translate(${width - 24}, 30)`}>
          <path d="M0,-12 L6,8 L0,4 L-6,8 Z" fill="#0F2A47" />
          <text y={22} textAnchor="middle" fontSize={10} fill="#0F2A47" fontWeight={700}>K</text>
        </g>
        {/* Ölçek çubuğu */}
        <g transform={`translate(${PAD}, ${height - 12})`}>
          <line x1={0} y1={0} x2={bar * scale} y2={0} stroke="#0F2A47" strokeWidth={2} />
          <line x1={0} y1={-4} x2={0} y2={4} stroke="#0F2A47" strokeWidth={2} />
          <line x1={bar * scale} y1={-4} x2={bar * scale} y2={4} stroke="#0F2A47" strokeWidth={2} />
          <text x={bar * scale / 2} y={-5} textAnchor="middle" fontSize={9.5} fill="#0F2A47">{bar} m</text>
        </g>
      </svg>
      <div className="sketch-legend">
        <span><i className="sw sw-parcel" /> {t('Parsel sınırı')} · {fmt(kml.polygonArea, 1)} m²</span>
        {inner && (
          <span><i className="sw sw-inner" /> {t('Çekme sonrası oturum')} ({fmt(kml.setback, 1)} m) · {fmt(innerArea, 1)} m²</span>
        )}
        {kml.setback > 0 && !inner && (
          <span className="sketch-invalid">⚠ {t('Bu çekme mesafesi bu parsel şekline uygulanamıyor (parsel tükeniyor veya geometri geçersiz).')}</span>
        )}
      </div>
    </div>
  );
}
