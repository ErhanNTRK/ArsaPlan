import { describe, it, expect } from 'vitest';
import { inwardOffset, setbackFootprint, polygonArea } from './kml';

describe('Çekme mesafelerine 0 girilebilmesi (düzeltme)', () => {
  const rect = [
    { x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 30 }, { x: 0, y: 30 },
  ];

  it('Ön=0, diğerleri>0: geometri artık hesaplanabiliyor, ön kenar sınıra tam temas ediyor', () => {
    const r = inwardOffset(rect, [0, 3, 3, 3]);
    expect(r).not.toBeNull();
    // Ön kenar (y=0) boyunca, çekme 0 olduğu için oturum tam sınıra değmeli.
    expect(r!.some((p) => Math.abs(p.y - 0) < 1e-9)).toBe(true);
    // Yan/arka kenarlarda gerçek 3 metrelik çekme uygulanmış olmalı.
    const area = polygonArea(r!);
    expect(area).toBeCloseTo((40 - 2 * 3) * (30 - 3), 1); // 34 x 27 = 918
  });

  it('Tüm kenarlar SIFIR: oturum, parselin kendisine eşit olmalı (null DEĞİL)', () => {
    const r = inwardOffset(rect, [0, 0, 0, 0]);
    expect(r).not.toBeNull();
    expect(polygonArea(r!)).toBeCloseTo(polygonArea(rect), 1); // 1200 m², parselle birebir
  });

  it('setbackFootprint ile: hepsi sıfır senaryosu da artık çalışıyor', () => {
    const r = setbackFootprint(rect, 0, { front: 0, side: 0, rear: 0 });
    expect(r).not.toBeNull();
    expect(r!.area).toBeCloseTo(1200, 1);
  });

  it('Geriye dönük uyumluluk: normal (sıfırsız) çekme senaryosu hâlâ doğru çalışıyor', () => {
    const r = inwardOffset(rect, [5, 3, 3, 3]);
    expect(r).not.toBeNull();
    expect(polygonArea(r!)).toBeCloseTo((40 - 2 * 3) * (30 - 5 - 3), 1); // 34 x 22 = 748
  });

  it('Geriye dönük uyumluluk: negatif/geçersiz mesafe hâlâ reddediliyor', () => {
    const r = inwardOffset(rect, [-5, -3, -3, -3]);
    expect(r).toBeNull();
  });

  it('Tek sayı (uniform) formunda da 0 kabul ediliyor', () => {
    const r = inwardOffset(rect, 0);
    expect(r).not.toBeNull();
    expect(polygonArea(r!)).toBeCloseTo(1200, 1);
  });
});
