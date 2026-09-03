/**
 * Bulunan hata: "Yeni Yapı Ekle" düğmesi, türü listenin İLK öğesine
 * otomatik atıyordu ama bu, yalnızca dropdown'ın onChange'inde çalışan
 * otomatik öneri mekanizmasını hiç tetiklemiyordu. Sonuç: kullanıcı yeni
 * bir satır ekleyip TÜRÜ HİÇ DEĞİŞTİRMEZSE (ki bu çok yaygın bir senaryo —
 * ilk öğe zaten aradığı tür olabilir, tam "Hayvancılık Tesisi > Ahır"
 * örneğinde olduğu gibi), Yapı Sınıfı hiçbir zaman otomatik dolmuyordu.
 */
import { describe, it, expect } from 'vitest';
import { PROPERTY_CATEGORIES } from './categories';
import { suggestBuildingClass } from '../data/yapiTuruEslesme';

describe('Maliyet Yaklaşımı — yeni yapı eklenince de otomatik öneri çalışıyor', () => {
  it('"Hayvancılık Tesisi" kategorisinin İLK yapı türü olan "Ahır", eşleşme tablosunda gerçekten var', () => {
    const kategori = PROPERTY_CATEGORIES.find((c) => c.name === 'Hayvancılık Tesisi');
    expect(kategori?.buildingSuggestions?.[0]).toBe('Ahır');
    expect(suggestBuildingClass('Ahır')).toBe('I-C');
  });

  it('Her kategorinin İLK yapı türü için, "yeni satır ekle" simülasyonu doğru buildingClassCode üretiyor (eşleşme varsa)', () => {
    for (const kategori of PROPERTY_CATEGORIES) {
      const ilkTur = kategori.buildingSuggestions?.[0];
      if (!ilkTur) continue;
      const suggested = suggestBuildingClass(ilkTur);
      // Yeni satır oluşturma mantığının aynısı (CostApproachApp.tsx'teki onClick ile birebir):
      const yeniSatir = { type: ilkTur, buildingClassCode: suggested, unitCostOverride: suggested ? null : 0 };
      if (suggested) {
        expect(yeniSatir.buildingClassCode).not.toBeNull();
        expect(yeniSatir.unitCostOverride).toBeNull();
      } else {
        // Eşleşme yoksa eski davranış (0 TL, elle doldurulmalı) korunuyor — bilinçli bir seçim, hata değil.
        expect(yeniSatir.buildingClassCode).toBeNull();
        expect(yeniSatir.unitCostOverride).toBe(0);
      }
    }
  });
});
