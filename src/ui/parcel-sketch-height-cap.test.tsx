/**
 * Parsel Krokisi — uzun/dar parsellerde (Türkiye'de yaygın bir şekil,
 * örn. 20m x 100m) yükseklik artık bir üst sınırla (genişliğin ~1,4 katı)
 * sınırlanıyor, sayfada devasa yer kaplamıyor.
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ParcelSketch } from './ParcelSketch';
import type { ParcelKml } from '../engine';

function makeElongatedKml(spanX: number, spanY: number): ParcelKml {
  // Dikdörtgen bir parsel — gerçek dünyada çok uzun/dar arsalar yaygındır.
  const points = [
    { x: 0, y: 0 }, { x: spanX, y: 0 }, { x: spanX, y: spanY }, { x: 0, y: spanY },
  ];
  return {
    name: 'Test Parsel', il: '', ilce: '', mahalle: '', ada: '', parsel: '',
    deedArea: spanX * spanY, points, polygonArea: spanX * spanY, setback: 0,
  } as ParcelKml;
}

describe('Parsel Krokisi — aşırı uzun/dar parsellerde yükseklik üst sınırla kontrol altında', () => {
  it('Çok uzun/dar bir parsel (20m x 300m, oran 15) artık genişliğin ~1,4 katını aşmıyor', () => {
    const kml = makeElongatedKml(20, 300); // spanY/spanX = 15 — aşırı bir oran
    const width = 420;
    const html = renderToString(<ParcelSketch kml={kml} width={width} />);
    const match = html.match(/viewBox="0 0 (\d+) (\d+)"/);
    expect(match).not.toBeNull();
    const [, , heightStr] = match!;
    const height = Number(heightStr);
    expect(height).toBeLessThanOrEqual(Math.round(width * 1.4));
  });

  it('Normal (kareye yakın) bir parselde eski davranış (oran bazlı yükseklik) hâlâ korunuyor', () => {
    const kml = makeElongatedKml(30, 35); // oran ~1,17 — makul, sınıra takılmamalı
    const width = 420;
    const html = renderToString(<ParcelSketch kml={kml} width={width} />);
    const match = html.match(/viewBox="0 0 (\d+) (\d+)"/);
    const height = Number(match![2]);
    // Sınır (1,4×420=588) çok altında kalmalı, sınıra hiç takılmadan hesaplanmalı.
    expect(height).toBeLessThan(Math.round(width * 1.4));
    expect(height).toBeGreaterThan(220);
  });

  it('Aşırı uzun parselde bile şekil bozulmuyor — poligon hâlâ kutunun içinde, taşmıyor', () => {
    const kml = makeElongatedKml(20, 300);
    const width = 420;
    const html = renderToString(<ParcelSketch kml={kml} width={width} />);
    // Path'teki tüm koordinatlar viewBox sınırları içinde kalmalı (negatif ya da aşırı büyük olmamalı).
    const pathMatch = html.match(/<path d="([^"]+)"/);
    expect(pathMatch).not.toBeNull();
    const coords = pathMatch![1].match(/-?\d+\.?\d*/g)!.map(Number);
    for (const c of coords) {
      expect(c).toBeGreaterThanOrEqual(-5); // küçük bir tolerans
      expect(c).toBeLessThanOrEqual(Math.round(width * 1.4) + 5);
    }
  });
});
