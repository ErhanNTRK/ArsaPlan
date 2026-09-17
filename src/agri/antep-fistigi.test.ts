/**
 * Erhan'ın bildirdiği eksiklik: ağaç kataloğunda Antep Fıstığı hiç yoktu
 * (Antep/Siirt bölgesinde yaygın bir ürün). Şanlıurfa Ticaret Borsası
 * (Eylül 2026) ve sektör kaynaklarından doğrulanmış verilerle eklendi.
 */
import { describe, it, expect } from 'vitest';
import { TREE_CROPS } from './catalog';

describe('Antep Fıstığı — ağaç kataloğuna eklendi', () => {
  it('Kataloğun içinde gerçekten var', () => {
    const fistik = TREE_CROPS.find((c) => c.name === 'Antep Fıstığı');
    expect(fistik).toBeDefined();
  });

  it('Verim, fiyat, gider oranı gerçekçi ve pozitif değerler', () => {
    const fistik = TREE_CROPS.find((c) => c.name === 'Antep Fıstığı')!;
    expect(fistik.yieldPerUnit).toBeGreaterThan(0);
    expect(fistik.price).toBeGreaterThan(0);
    expect(fistik.expensePct).toBeGreaterThan(0);
    expect(fistik.expensePct).toBeLessThan(100);
  });

  it('Ekonomik ömür diğer ağaçlardan (Zeytin/Ceviz) daha uzun veya en az onlar kadar — fıstığın uzun ömürlü olma özelliğini yansıtıyor', () => {
    const fistik = TREE_CROPS.find((c) => c.name === 'Antep Fıstığı')!;
    const zeytin = TREE_CROPS.find((c) => c.name === 'Zeytin')!;
    expect(fistik.economicLifeYears).toBeGreaterThanOrEqual(zeytin.economicLifeYears!);
  });

  it('Kaynak alanı dolu (Şanlıurfa Ticaret Borsası) — diğer kalemlerle aynı doğrulama standardı', () => {
    const fistik = TREE_CROPS.find((c) => c.name === 'Antep Fıstığı')!;
    expect(fistik.source).toBeTruthy();
    expect(fistik.source.length).toBeGreaterThan(10);
  });

  it('DÜZELTME — verim, Erhan\'ın saha tecrübesiyle karşılaştırıldığında muhafazakar bir varsayılana çekilmiş (10 kg/ağaç değil, 6 kg/ağaç)', () => {
    const fistik = TREE_CROPS.find((c) => c.name === 'Antep Fıstığı')!;
    expect(fistik.yieldPerUnit).toBeLessThanOrEqual(6);
    expect(fistik.expensePct).toBeGreaterThanOrEqual(35);
  });
});
