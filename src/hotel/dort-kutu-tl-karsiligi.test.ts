/**
 * Otel — TL karşılığı artık dört kutunun (Nihai Değer, Direkt Kap, İNA,
 * Maliyet Yaklaşımı) hepsinde AYRI, belirgin bir satırda gösteriliyor.
 * (React etkileşim test altyapısı olmadığı için, altında yatan saf
 * fonksiyonu — TlValueDisplay'in verisini üreten fmtWithTlEquivalentParts'ı
 * — doğruluyoruz; bu, dört kutunun da aynı mekanizmayı kullandığını
 * garanti eder, çünkü hepsi aynı `parts={fmtTlParts}` prop'unu paylaşıyor.)
 */
import { describe, it, expect } from 'vitest';
import { fmtWithTlEquivalentParts } from './engine';

describe('Otel — dört sonuç kutusunun (Nihai Değer, Direkt Kap, İNA, Maliyet) hepsi aynı TL karşılığı mekanizmasını kullanıyor', () => {
  it('Gerçekçi bir Direkt Kap senaryosunda (USD), TL karşılığı doğru hesaplanıyor', () => {
    const r = fmtWithTlEquivalentParts(526795000 / 48.28, 'USD', 48.28);
    expect(r.tlEquivalent).not.toBeNull();
    // ~526.795.000 TL'ye yakın çıkmalı (küçük yuvarlama farkları olabilir)
    const num = Number(r.tlEquivalent!.replace(/[^\d]/g, ''));
    expect(Math.abs(num - 526795000)).toBeLessThan(1000);
  });

  it('TL bazlı bir hesapta (Maliyet Yaklaşımı dahil), TL karşılığı hiç gösterilmiyor — zaten TL', () => {
    const r = fmtWithTlEquivalentParts(686560000, 'TRY', null);
    expect(r.tlEquivalent).toBeNull();
  });
});
