/**
 * Otel — NİHAİ DEĞER kutusunda TL karşılığı artık ayrı, belirgin bir
 * satır olarak gösteriliyor (önceden ana rakamla aynı satırda, küçük
 * parantez içindeydi — kullanıcı fark etmekte zorlanıyordu).
 */
import { describe, it, expect } from 'vitest';
import { fmtWithTlEquivalentParts } from './engine';

describe('fmtWithTlEquivalentParts — TL karşılığını ayrı satır için ayırır', () => {
  it('Döviz + geçerli kur varken, ana tutar ve TL karşılığı AYRI dizeler olarak dönüyor', () => {
    const r = fmtWithTlEquivalentParts(11830000, 'USD', 48.28);
    expect(r.main).toContain('$');
    expect(r.main).not.toContain('₺');
    expect(r.tlEquivalent).not.toBeNull();
    expect(r.tlEquivalent).toContain('₺');
  });

  it('TL iken tlEquivalent her zaman null — kendi kendine karşılık göstermeye gerek yok', () => {
    const r = fmtWithTlEquivalentParts(500000000, 'TRY', null);
    expect(r.tlEquivalent).toBeNull();
    expect(r.main).toContain('₺');
  });

  it('Döviz ama kur girilmemişse (fxRate null), tlEquivalent null kalır — icat edilmiş kur gösterilmez', () => {
    const r = fmtWithTlEquivalentParts(100000, 'USD', null);
    expect(r.tlEquivalent).toBeNull();
  });

  it('Hesaplanan TL karşılığı, ana tutar × kur ile birebir tutarlı', () => {
    const r = fmtWithTlEquivalentParts(1000, 'EUR', 50);
    // 1000 EUR × 50 = 50.000 TL beklenir
    expect(r.tlEquivalent).toContain('50.000');
  });
});
