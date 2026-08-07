# ArsaPlan v9.1.0 — Maliyet Yaklaşımı Kategorileri Genişletildi

Doğrulama: tsc 0 hata, test 199/199, build başarılı. Kategori sayısı
ve içerikleri gerçek verilerle doğrulandı.

## Maliyet Yaklaşımı — "Ne Değerleniyor?" listesi güncellendi

**6 kategori kaldırıldı:** Rafineri, Hangar, Kültür Tesisi,
Kütüphane, Sinema Salonu, Tiyatro Salonu.

**Kalan 13 kategorinin yapı türü önerileri senin verdiğin detaylı
listelerle güncellendi** — her biri artık ana bina + destek
birimlerini (idari, depo, teknik, güvenlik, personel vb.) kapsıyor.
Örnek: Hayvancılık Tesisi artık 19 kalem (Buzağı Barınağı, Gübre
Separatörü gibi ayrıntılara kadar).

**Otel kategorisi artık kendi listesini kullanmıyor** — Otel
modülünün mevcut, 37 kalemlik BUILDING_TYPES kataloğunu (Lobi ve
Resepsiyon Binası, Sonsuzluk Havuzu, Su Sporları Merkezi vb.)
doğrudan paylaşıyor, tutarlılık için.

**Toplam: 14 kategori** kaldı (13 kendi listesiyle + Otel paylaşılan
listeyle) + "Diğer" (elle yaz).

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
