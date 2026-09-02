/**
 * Yapı Sınıfı otomatik önerisi — tebliğ referanslı, ~60 yapı türü için
 * sessizce (açıklama olmadan) doldurulan eşleşme tablosu.
 */
import { describe, it, expect } from 'vitest';
import { suggestBuildingClass, YAPI_TURU_SINIF_ESLESME } from './yapiTuruEslesme';
import { YAPI_SINIFLARI } from './yapiSiniflari';

describe('Yapı Sınıfı otomatik önerisi', () => {
  it('Bilinen bir yapı türü (Yurt) doğru sınıfı döndürüyor', () => {
    expect(suggestBuildingClass('Yurt')).toBe('III-C');
  });

  it('Bilinmeyen bir yapı türü (örn. Kantin) null döndürüyor — zorlama eşleşme yok', () => {
    expect(suggestBuildingClass('Kantin')).toBeNull();
  });

  it('Boş metin null döndürüyor', () => {
    expect(suggestBuildingClass('')).toBeNull();
  });

  it('Tablodaki HER kod, gerçek YAPI_SINIFLARI kataloğunda mevcut (geçersiz kod yok)', () => {
    const gecerliKodlar = new Set(YAPI_SINIFLARI.map((c) => c.code));
    for (const [tur, kod] of Object.entries(YAPI_TURU_SINIF_ESLESME)) {
      expect(gecerliKodlar.has(kod), `"${tur}" -> "${kod}" geçersiz bir kataloğa işaret ediyor`).toBe(true);
    }
  });

  it('Tablo en az 40 yapı türü içeriyor (kapsam kontrolü — bazı isimler kategoriler arası tekrar ettiği için tekilleşiyor)', () => {
    expect(Object.keys(YAPI_TURU_SINIF_ESLESME).length).toBeGreaterThanOrEqual(40);
  });
});
