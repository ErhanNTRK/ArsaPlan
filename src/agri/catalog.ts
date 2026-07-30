/**
 * TARIMSAL ÜRÜN KATALOĞU — yönlendirici öneriler (2025-26 denetimli).
 * Her değer yalnız ÖNERİDİR; kullanıcı tüm kutuları serbestçe ezer.
 * Kaynak etiketi arayüzde gösterilir; yıllık güncelleme bu dosyada yapılır.
 */
export interface CropRef {
  name: string;
  /** kg/dönüm (ekili) veya kg/ağaç (dikili) */
  yieldPerUnit: number;
  /** TL/kg (KDV'siz üretici fiyatı önerisi) */
  price: number;
  /** gider oranı % */
  expensePct: number;
  /** amorti yılı önerisi */
  years: number;
  source: string;
  note?: string;
  /** Bu ürünün yaygın yan ürünü varsa adı — Yan Ürün açılınca önerilen katalog eşleşmesi bulmak için */
  byproductHint?: string;
}

export interface ByproductRef {
  name: string;
  /** kg/dönüm — ANA ürünle aynı alan (units) üzerinden hesaplanır */
  yieldPerUnit: number;
  price: number;
  expensePct: number;
  source: string;
  note?: string;
}

/** Yan ürün kataloğu — online denetimli (2025-26). Ana üründen bağımsız, "Diğer" ile serbest de yazılabilir. */
export const BYPRODUCTS: ByproductRef[] = [
  { name: 'Saman (Buğday)', yieldPerUnit: 180, price: 7.2, expensePct: 15, source: 'Samsun Ticaret Borsası 2025', note: 'Dönüme ort. 4-8 balya × 20-25 kg' },
  { name: 'Saman (Arpa)', yieldPerUnit: 190, price: 7.5, expensePct: 15, source: 'sektör ort. 2025', note: 'Buğday samanından hafif proteinli' },
  { name: 'Ayçiçeği Küspesi', yieldPerUnit: 60, price: 9, expensePct: 20, source: 'sektör ort. 2025', note: 'Yağ üretiminden kalan yan ürün' },
  { name: 'Pamuk Çiğit Küspesi', yieldPerUnit: 45, price: 14.5, expensePct: 20, source: 'Tariş 2025 (ton 14.500 TL)' },
];

export const FIELD_CROPS: CropRef[] = [
  { name: 'Buğday', yieldPerUnit: 350, price: 13.5, expensePct: 35, years: 3, source: 'TMO 2025 · Adana ÇB verim ort.', note: 'Desteklerle üretici eline ~16 TL/kg geçer', byproductHint: 'Saman (Buğday)' },
  { name: 'Arpa', yieldPerUnit: 300, price: 11, expensePct: 30, years: 3, source: 'TMO 2025', byproductHint: 'Saman (Arpa)' },
  { name: 'Mısır', yieldPerUnit: 800, price: 10, expensePct: 40, years: 2, source: 'sektör ort. 2025' },
  { name: 'Ayçiçeği', yieldPerUnit: 175, price: 25, expensePct: 35, years: 3, source: 'sektör ort. 2025', byproductHint: 'Ayçiçeği Küspesi' },
  { name: 'Pamuk', yieldPerUnit: 300, price: 30, expensePct: 45, years: 2, source: 'sektör ort. 2025', byproductHint: 'Pamuk Çiğit Küspesi' },
  { name: 'Domates', yieldPerUnit: 4000, price: 5, expensePct: 50, years: 2, source: 'hal ort. 2025' },
  { name: 'Biber', yieldPerUnit: 2000, price: 8, expensePct: 50, years: 2, source: 'hal ort. 2025' },
  { name: 'Patates', yieldPerUnit: 2500, price: 10, expensePct: 45, years: 2, source: 'hal ort. 2025' },
  { name: 'Soğan', yieldPerUnit: 3000, price: 8, expensePct: 40, years: 2, source: 'hal ort. 2025' },
  { name: 'Salatalık', yieldPerUnit: 2500, price: 5, expensePct: 45, years: 2, source: 'hal ort. 2025' },
];

export const TREE_CROPS: CropRef[] = [
  { name: 'Kiraz', yieldPerUnit: 38, price: 38, expensePct: 40, years: 5, source: 'sektör 2025-26', note: 'Fiyat bölgeye göre 8-55 TL bandında şiddetle değişir' },
  { name: 'Kayısı', yieldPerUnit: 50, price: 25, expensePct: 40, years: 4, source: 'sektör ort.' },
  { name: 'Şeftali', yieldPerUnit: 50, price: 20, expensePct: 40, years: 4, source: 'sektör ort.' },
  { name: 'Erik', yieldPerUnit: 45, price: 18, expensePct: 40, years: 4, source: 'sektör ort.' },
  { name: 'Elma', yieldPerUnit: 60, price: 15, expensePct: 45, years: 5, source: 'sektör ort.' },
  { name: 'Armut', yieldPerUnit: 60, price: 18, expensePct: 45, years: 5, source: 'sektör ort.' },
  { name: 'Nar', yieldPerUnit: 40, price: 20, expensePct: 40, years: 5, source: 'sektör ort.' },
  { name: 'İncir', yieldPerUnit: 30, price: 30, expensePct: 35, years: 5, source: 'sektör ort.' },
  { name: 'Ceviz', yieldPerUnit: 32, price: 80, expensePct: 35, years: 7, source: 'sektör 2025 (yetişkin aşılı 30-40 kg)', note: 'Yaşa göre 3-100 kg bandı' },
  { name: 'Badem', yieldPerUnit: 8, price: 100, expensePct: 35, years: 6, source: 'sektör ort.' },
  { name: 'Zeytin', yieldPerUnit: 18, price: 45, expensePct: 40, years: 6, source: 'Marmarabirlik 2024-25 yağlık', note: 'Sofralıkta kalibreye göre 47-125 TL' },
];
