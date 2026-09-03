/**
 * YAPI TÜRÜ → TEBLİĞ SINIFI OTOMATİK ÖNERİSİ
 *
 * Kullanıcı bir Yapı Türü seçtiğinde, burada bir eşleşme varsa Yapı Sınıfı
 * (ve dolayısıyla Birim Maliyet) sessizce, hiçbir açıklama/uyarı metni
 * olmadan otomatik doluyor — kullanıcı isterse elle değiştirir.
 *
 * Kapsam notu: PROPERTY_CATEGORIES'in (bağımsız Maliyet Yaklaşımı) 139
 * yapı türünün TAMAMI (%100) burada eşleşiyor — Salih'in kendi mesleki
 * değerlendirmesiyle, birkaç turda tek tek gözden geçirilip tamamlandı
 * (2026.09). BUILDING_TYPES (Otel/Akaryakıt'ın kendi listesi) ayrıca,
 * kısmi kapsamla, en üstte listeleniyor.
 */
export const YAPI_TURU_SINIF_ESLESME: Record<string, string> = {
  // ── Otel/Akaryakıt (BUILDING_TYPES) ──
  'Otel Binası': 'IV-A',
  'Apart Otel Binası': 'III-B',
  'Kapalı Yeraltı Otoparkı': 'III-A',
  'Kapalı Isıtmalı Havuz': 'IV-A',
  'Aquapark': 'III-A',
  'Türk Hamamı': 'III-A',
  'Sauna': 'III-A',
  'Gece Kulübü': 'III-B',
  'Ana Depolar': 'II-A',

  // ── Sağlık Tesisi ──
  'Ana Hastane Binası': 'V-B',
  'Laboratuvar': 'IV-A',
  'Depo': 'II-A',
  'Otopark': 'III-A',

  // ── Okul ──
  'Anaokulu Binası': 'III-A',
  'Kütüphane': 'III-C',
  'Spor Salonu': 'IV-A',
  'Yurt': 'III-C',
  'Kapalı Otopark': 'III-A',

  // ── Hayvancılık Tesisi ──
  'Ahır': 'I-C',
  'Besi Ahırı': 'I-C',
  'Yem Deposu': 'II-A',
  'Veteriner Binası': 'III-B',
  'Makine Garajı': 'III-A',
  'Su Deposu': 'I-C',

  // ── Bina (genel) ──
  'Sosyal Tesis': 'III-A',

  // ── Villa ──
  'Kapalı Garaj': 'III-A',

  // ── Ev/Konut ──
  'Ana Konut': 'III-C',
  'Garaj': 'III-A',

  // ── Akaryakıt İstasyonu (kategori) ──
  'Akaryakıt Adaları': 'III-A',
  'LPG Ünitesi': 'III-A',

  // ── İmalathane/Atölye ──
  'Üretim Alanı': 'II-C',
  'Atölye': 'II-A',

  'Hammadde Deposu': 'II-A',
  'Mamul Deposu': 'II-A',

  // ── Depo (kategori) ──
  'Ana Depo': 'II-A',
  'Soğuk Hava Deposu': 'II-C',

  // ── Sera ──
  'Sera Bloğu 1': 'I-A',
  'Sera Bloğu 2': 'I-A',
  'Sera Bloğu 3': 'I-A',

  // ── Tavuk Çiftliği ──
  'Kümes': 'I-A',
  'Civciv Kümesi': 'I-A',
  'Kesimhane': 'II-C',

  // ── Düğün Salonu ──
  'Düğün Salonu': 'IV-B',

  // ── Salih'in kendi mesleki değerlendirmesiyle eklenen eşleşmeler ──
  // (Sağlık Tesisi / Okul / Hayvancılık Tesisi — tebliğde birebir madde
  // olmayan, analoji ile Salih'in kendisinin belirlediği yardımcı yapılar.)
  'Poliklinik': 'IV-A',
  'İdari Bina': 'III-B',
  'Yemekhane': 'III-B',
  'Çamaşırhane': 'III-B',
  'Teknik Merkez': 'III-B',
  'Oksijen Merkezi': 'III-B',
  'Jeneratör Binası': 'III-A',
  'Güvenlik Binası': 'II-B',
  'Derslik Binası': 'III-B',
  'Konferans Salonu': 'III-C',
  'Çok Amaçlı Salon': 'III-C',
  'Kantin': 'III-A',
  'Kazan Dairesi': 'II-B',
  'Güvenlik Kulübesi': 'II-B',
  'Sağmalhane': 'II-A',
  'Doğumhane': 'II-A',
  'Buzağı Barınağı': 'II-A',
  'Karantina Ahırı': 'II-A',

  // ── İkinci tur — Salih'in kendi mesleki değerlendirmesi ──
  'Silaj Çukuru': 'I-A',
  'Süt Soğutma Merkezi': 'III-A',
  'Sağım Ünitesi': 'III-A',
  'Personel Lojmanı': 'II-B',
  'Atık Deposu': 'II-A',
  'Gübre Çukuru': 'I-A',
  'Gübre Separatörü': 'I-B',
  'Ana Bina': 'III-B',
  'Ek Bina': 'III-A',
  'Teknik Hacim': 'III-A',
  'Misafir Evi': 'III-A',
  'Açık Garaj': 'I-B',
  'Havuz Makine Dairesi': 'II-A',
  'Kömürlük': 'I-B',
  'Eklenti': 'II-A',
  'Market': 'III-A',
  'Satış Binası': 'III-A',
  'Kanopi': 'II-A',
  'Oto Yıkama': 'II-A',
  'Yağlama Servisi': 'II-C',
  'Lastik Servisi': 'II-C',
  'Kafe': 'III-A',
  'Restoran': 'III-C',
  'WC Binası': 'II-A',
  'Trafo': 'II-C',
  'Tank Sahası': 'I-B',
  'Kalite Kontrol Laboratuvarı': 'III-B',
  'Sevkiyat Alanı': 'II-C',
  'Soyunma Odası': 'III-A',

  // ── Üçüncü tur — Salih'in kendi mesleki değerlendirmesi ──
  'Yükleme Rampası': 'II-A',
  'Fide Ünitesi': 'I-B',
  'Paketleme Alanı': 'II-C',
  'Gübre Deposu': 'I-B',
  'İlaç Deposu': 'III-A',
  'Yumurta Toplama Ünitesi': 'III-A',
  'Paketleme Ünitesi': 'III-A',
  'Kuluçkahane': 'III-A',
  'Konaklama Binası': 'III-B',
  'Resepsiyon': 'III-A',
  'Mutfak': 'III-A',
  'Gelin Odası': 'II-C',
  'Servis Alanı': 'II-C',
  'İdari Ofis': 'III-A',
  'Açık Organizasyon Alanı': 'II-A',
};

/** Yapı türü metninden (tam eşleşme) önerilen tebliğ sınıf kodunu döner, yoksa null. */
export function suggestBuildingClass(type: string): string | null {
  return YAPI_TURU_SINIF_ESLESME[type.trim()] ?? null;
}
