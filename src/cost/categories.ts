/**
 * MALİYET YAKLAŞIMI — mülk kategorileri ve her kategoriye özgü yapı türü önerileri.
 * Bu modül, Otel/Arsa Ticari'den bağımsız, herhangi bir gayrimenkul türünü
 * Maliyet Yaklaşımı (Arsa + Yapılar + Şerefiye/Düzeltme/Peyzaj) ile değerler.
 *
 * NOT: "Otel" kategorisinin yapı listesi burada YOK — Otel modülünün kendi
 * BUILDING_TYPES kataloğu (src/usthakki/detailedEngine.ts) kullanılır, tutarlılık
 * için (bkz. CostApproachApp.tsx).
 */
export interface PropertyCategory {
  name: string;
  buildingSuggestions: string[];
}

export const PROPERTY_CATEGORIES: PropertyCategory[] = [
  { name: 'Sağlık Tesisi', buildingSuggestions: [
    'Ana Hastane Binası', 'Poliklinik', 'Laboratuvar', 'İdari Bina', 'Yemekhane', 'Çamaşırhane',
    'Teknik Merkez', 'Oksijen Merkezi', 'Jeneratör Binası', 'Güvenlik Binası', 'Depo', 'Otopark',
  ] },
  { name: 'Okul', buildingSuggestions: [
    'Derslik Binası', 'Anaokulu Binası', 'İdari Bina', 'Laboratuvar', 'Kütüphane', 'Konferans Salonu',
    'Çok Amaçlı Salon', 'Spor Salonu', 'Atölye', 'Yemekhane', 'Kantin', 'Yurt', 'Kazan Dairesi',
    'Güvenlik Kulübesi', 'Depo', 'Kapalı Otopark',
  ] },
  { name: 'Hayvancılık Tesisi', buildingSuggestions: [
    'Ahır', 'Sağmalhane', 'Doğumhane', 'Buzağı Barınağı', 'Besi Ahırı', 'Karantina Ahırı', 'Yem Deposu',
    'Silaj Çukuru', 'Süt Soğutma Merkezi', 'Sağım Ünitesi', 'Veteriner Binası', 'İdari Bina',
    'Personel Lojmanı', 'Makine Garajı', 'Atık Deposu', 'Gübre Çukuru', 'Gübre Separatörü',
    'Jeneratör Binası', 'Su Deposu',
  ] },
  { name: 'Bina', buildingSuggestions: [
    'Ana Bina', 'Ek Bina', 'İdari Bina', 'Sosyal Tesis', 'Depo', 'Teknik Hacim', 'Güvenlik Kulübesi', 'Otopark',
  ] },
  { name: 'Otel', buildingSuggestions: [] },
  { name: 'Villa', buildingSuggestions: [
    'Ana Konut', 'Misafir Evi', 'Kapalı Garaj', 'Açık Garaj', 'Depo', 'Kazan Dairesi',
    'Havuz Makine Dairesi', 'Güvenlik Kulübesi',
  ] },
  { name: 'Ev / Konut', buildingSuggestions: ['Ana Konut', 'Depo', 'Kömürlük', 'Garaj', 'Eklenti'] },
  { name: 'Akaryakıt İstasyonu', buildingSuggestions: [
    'Market', 'Satış Binası', 'Kanopi', 'Akaryakıt Adaları', 'LPG Ünitesi', 'Oto Yıkama',
    'Yağlama Servisi', 'Lastik Servisi', 'Kafe', 'Restoran', 'WC Binası', 'İdari Bina', 'Depo',
    'Jeneratör Binası', 'Trafo', 'Tank Sahası',
  ] },
  { name: 'İmalathane / Atölye', buildingSuggestions: [
    'Üretim Alanı', 'Atölye', 'İdari Bina', 'Kalite Kontrol Laboratuvarı', 'Depo', 'Hammadde Deposu',
    'Mamul Deposu', 'Sevkiyat Alanı', 'Yemekhane', 'Soyunma Odası', 'Teknik Hacim',
  ] },
  { name: 'Depo', buildingSuggestions: [
    'Ana Depo', 'Soğuk Hava Deposu', 'İdari Bina', 'Sevkiyat Alanı', 'Yükleme Rampası',
    'Teknik Hacim', 'Güvenlik Kulübesi',
  ] },
  { name: 'Sera', buildingSuggestions: [
    'Sera Bloğu 1', 'Sera Bloğu 2', 'Sera Bloğu 3', 'Fide Ünitesi', 'Paketleme Alanı', 'Depo',
    'Gübre Deposu', 'İlaç Deposu', 'Kazan Dairesi', 'Su Deposu', 'İdari Bina',
  ] },
  { name: 'Tavuk Çiftliği', buildingSuggestions: [
    'Kümes', 'Civciv Kümesi', 'Yem Deposu', 'Yumurta Toplama Ünitesi', 'Paketleme Ünitesi',
    'Kuluçkahane', 'Kesimhane', 'Soğuk Hava Deposu', 'İdari Bina', 'Personel Lojmanı',
    'Jeneratör Binası', 'Gübre Deposu',
  ] },
  { name: 'Pansiyon', buildingSuggestions: [
    'Konaklama Binası', 'Resepsiyon', 'Yemekhane', 'Mutfak', 'Çamaşırhane', 'Depo',
  ] },
  { name: 'Düğün Salonu', buildingSuggestions: [
    'Düğün Salonu', 'Gelin Odası', 'Mutfak', 'Servis Alanı', 'Depo', 'İdari Ofis',
    'Açık Organizasyon Alanı', 'Otopark',
  ] },
];

export const DIGER_KATEGORI = 'Diğer';
