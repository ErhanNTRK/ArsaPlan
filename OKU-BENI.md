# ArsaPlan v8.2.0 — Asma Kat %75 + Kat Tablosu Gerçek Hibrit Tablo

Doğrulama: tsc 0 hata, test 194/194, build başarılı.

## 1) Asma Kat — oran gizli, %75 varsayılan

Asma Kat alanı artık **zemin katın %75'i** üzerinden hesaplanıyor
(önceden %40'tı). Kullanıcıya bu oran hiç gösterilmiyor — yalnız
eski metin duruyor: *"Asma kat alanı sistem tarafından otomatik
oluşturulur. Gerekirse kat tablosundan değiştirilebilir."* Excel
raporundaki "zeminin %X'i önerisi" ibaresi de kaldırıldı, tutarlılık
için (yalnız adet ve emsal durumu gösteriliyor artık).

## 2) Kat Tablosu artık gerçek bir hibrit tablo

Önceki "büyük kartlar" yerine, **tek bir DOM yapısı** (gerçek
`<table>`) kuruldu — CSS ile:
- **Masaüstünde**: klasik tablo görünümü, tüm katlar satır satır,
  sütunlar (Kat Alanı, Ortak Alan Payı, Satılabilir Alan, Ortak Alan)
  hizalı — bir katı değiştirince diğerlerini karşılaştırmak artık çok
  daha kolay.
- **Dar ekranda (≤700px)**: otomatik olarak kart görünümüne dönüyor
  (her satır kendi kartı, etiketler değerin üstünde) — dokunmatik
  kullanılabilirlik korunuyor.

Bu, JavaScript'te ekran genişliği kontrolü gerektirmeden, yalnız CSS
ile çalışıyor — daha az kod, daha az risk.

## Dürüst not — bu turda YAPILMAYAN

Hibrit tablo yaklaşımını yalnız **Kat Tablosu'na** uyguladım (en çok
konuşulan, en değerli hedef). Aynı deseni **Oda Tipleri (Otel),
Yapılar listeleri (Otel + Arsa Ticari), Ürün satırları (Tarım,
Akaryakıt)** gibi diğer tekrarlayan veri girişi ekranlarına henüz
yaymadım — zaman/token bütçesini Kat Tablosu'nu sağlam ve doğru
tamamlamaya ayırdım. Bunlar ayrı bir turda bekliyor.

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
