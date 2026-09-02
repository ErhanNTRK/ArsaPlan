/**
 * YAPI TÜRÜ → TEBLİĞ SINIFI OTOMATİK ÖNERİSİ
 *
 * Kullanıcı bir Yapı Türü seçtiğinde, burada bir eşleşme varsa Yapı Sınıfı
 * (ve dolayısıyla Birim Maliyet) sessizce, hiçbir açıklama/uyarı metni
 * olmadan otomatik doluyor — kullanıcı isterse elle değiştirir.
 *
 * Kapsam notu: BUILDING_TYPES (Otel/Akaryakıt) ve PROPERTY_CATEGORIES'in
 * (bağımsız Maliyet Yaklaşımı) toplam ~179 yapı türünün yalnızca bir kısmı
 * (~60'ı) tebliğde net ya da makul bir analoji karşılığı buluyor — geri
 * kalanı için kullanıcı hâlâ elle seçim yapmalı, bu bilinçli bir tercih
 * (yanlış/zorlama bir eşleşme sunmaktansa hiç önermemek daha güvenilir).
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
  'Kalite Kontrol Lab': 'IV-A',
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
};

/** Yapı türü metninden (tam eşleşme) önerilen tebliğ sınıf kodunu döner, yoksa null. */
export function suggestBuildingClass(type: string): string | null {
  return YAPI_TURU_SINIF_ESLESME[type.trim()] ?? null;
}
