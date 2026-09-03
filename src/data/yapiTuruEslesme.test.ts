/**
 * Yapı Sınıfı otomatik önerisi — tebliğ referanslı, PROPERTY_CATEGORIES'in
 * tamamı (%100) için sessizce (açıklama olmadan) doldurulan eşleşme tablosu.
 */
import { describe, it, expect } from 'vitest';
import { suggestBuildingClass, YAPI_TURU_SINIF_ESLESME } from './yapiTuruEslesme';
import { YAPI_SINIFLARI } from './yapiSiniflari';
import { PROPERTY_CATEGORIES } from '../cost/categories';

describe('Yapı Sınıfı otomatik önerisi', () => {
  it('Bilinen bir yapı türü (Yurt) doğru sınıfı döndürüyor', () => {
    expect(suggestBuildingClass('Yurt')).toBe('III-C');
  });

  it('Bilinmeyen bir yapı türü null döndürüyor — kataloğun kendisinde olmayan uydurma bir tür', () => {
    expect(suggestBuildingClass('Böyle Bir Yapı Türü Yok')).toBeNull();
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

  it('Tablo en az 100 yapı türü içeriyor (kapsam kontrolü — bazı isimler kategoriler arası tekrar ettiği için tekilleşiyor)', () => {
    expect(Object.keys(YAPI_TURU_SINIF_ESLESME).length).toBeGreaterThanOrEqual(100);
  });

  it('PROPERTY_CATEGORIES\'teki 139 yapı türünün TAMAMI eşleşiyor — %100 kapsam', () => {
    const eslesmeyenler: string[] = [];
    for (const cat of PROPERTY_CATEGORIES) {
      for (const tur of (cat.buildingSuggestions ?? [])) {
        if (!suggestBuildingClass(tur)) eslesmeyenler.push(`[${cat.name}] ${tur}`);
      }
    }
    expect(eslesmeyenler, `Eşleşmeyenler: ${eslesmeyenler.join(', ')}`).toEqual([]);
  });
});
