/**
 * MALİYET YAKLAŞIMI — mülk kategorileri ve her kategoriye özgü yapı türü önerileri.
 * Bu modül, Otel/Arsa Ticari'den bağımsız, herhangi bir gayrimenkul türünü
 * Maliyet Yaklaşımı (Arsa + Yapılar + Şerefiye/Düzeltme/Peyzaj) ile değerler.
 */
export interface PropertyCategory {
  name: string;
  buildingSuggestions: string[];
}

export const PROPERTY_CATEGORIES: PropertyCategory[] = [
  { name: 'Sağlık Tesisi', buildingSuggestions: ['Hastane Binası', 'Poliklinik', 'Tıbbi Cihaz Odaları', 'İdari Bina', 'Otopark'] },
  { name: 'Okul', buildingSuggestions: ['Derslik Binası', 'Spor Salonu', 'Yemekhane', 'İdari Bina', 'Yurt Binası'] },
  { name: 'Hayvancılık Tesisi', buildingSuggestions: ['Ahır', 'Ağıl', 'Yem Deposu', 'Sağım Ünitesi', 'İdari Bina'] },
  { name: 'Bina', buildingSuggestions: ['Ana Bina', 'Ek Bina', 'Otopark'] },
  { name: 'Otel', buildingSuggestions: ['Otel Binası', 'Lobi ve Resepsiyon Binası', 'Restoran', 'Spa/Wellness', 'Personel Lojmanı'] },
  { name: 'Villa', buildingSuggestions: ['Villa Binası', 'Havuz', 'Bahçe Evi', 'Otopark'] },
  { name: 'Ev / Konut', buildingSuggestions: ['Konut Binası', 'Garaj', 'Bahçe Duvarı'] },
  { name: 'Akaryakıt İstasyonu', buildingSuggestions: ['İstasyon Binası', 'Market', 'Oto Yıkama', 'Kanopi', 'Tank Sahası'] },
  { name: 'Rafineri', buildingSuggestions: ['Üretim Tesisi', 'Depolama Tankı', 'İdari Bina', 'Laboratuvar', 'Bakım Atölyesi'] },
  { name: 'İmalathane / Atölye', buildingSuggestions: ['Üretim Alanı', 'Depo', 'İdari Bina', 'Bakım Atölyesi'] },
  { name: 'Depo', buildingSuggestions: ['Depo Binası', 'İdari Bina', 'Yükleme Rampası'] },
  { name: 'Hangar', buildingSuggestions: ['Hangar Binası', 'İdari Bina', 'Bakım Atölyesi'] },
  { name: 'Sera', buildingSuggestions: ['Sera Binası', 'Sulama Ünitesi', 'Depo', 'İdari Bina'] },
  { name: 'Tavuk Çiftliği', buildingSuggestions: ['Kümes', 'Yem Deposu', 'İdari Bina', 'Soğuk Hava Deposu'] },
  { name: 'Pansiyon', buildingSuggestions: ['Pansiyon Binası', 'Ortak Kullanım Alanı', 'Bahçe Evi'] },
  { name: 'Kültür Tesisi', buildingSuggestions: ['Ana Bina', 'Sergi Salonu', 'İdari Bina'] },
  { name: 'Kütüphane', buildingSuggestions: ['Kütüphane Binası', 'Okuma Salonu', 'Depo'] },
  { name: 'Sinema Salonu', buildingSuggestions: ['Salon Binası', 'Fuaye', 'İdari Bina'] },
  { name: 'Tiyatro Salonu', buildingSuggestions: ['Salon Binası', 'Sahne Arkası', 'Fuaye', 'İdari Bina'] },
  { name: 'Düğün Salonu', buildingSuggestions: ['Salon Binası', 'Mutfak', 'Bahçe Alanı', 'Otopark'] },
];

export const DIGER_KATEGORI = 'Diğer';
