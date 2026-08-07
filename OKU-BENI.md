# ArsaPlan v9.0.0 — 8. Modül: Maliyet Yaklaşımı

Doğrulama: tsc 0 hata, test 199/199 (5 yeni motor testi dahil), build
başarılı. Kullanıcının verdiği tam örnek senaryo (Otel, Lojman 1.000 m²
× 25.000 TL/m² × %50 amortisman = 12.500.000 TL) gerçek motorla
çalıştırılıp doğrulandı; PDF, Excel (round-trip birebir eşleşti) ve
JPEG üretimi uçtan uca test edildi.

## Yeni: Maliyet Yaklaşımı modülü

Herhangi bir taşınmaz türünü (Otel'den bağımsız) Maliyet Yaklaşımı ile
değerleyen, tek ekranlı yeni bir modül:

1. **"Ne Değerleniyor?"** — 19 kategori (Sağlık Tesisi, Okul,
   Hayvancılık Tesisi, Bina, Otel, Villa, Ev/Konut, Akaryakıt
   İstasyonu, Rafineri, İmalathane/Atölye, Depo, Hangar, Sera, Tavuk
   Çiftliği, Pansiyon, Kültür Tesisi, Kütüphane, Sinema Salonu,
   Tiyatro Salonu, Düğün Salonu) + Diğer (elle yaz).
2. **Arsa** — KML yükle (otomatik Arsa Alanı + Ada/Parsel) veya elle
   gir; Net Arsa Alanı ayrı, hesaba giren asıl alan bu.
3. **Yapılar** (RTable ile hibrit tablo) — kategoriye özgü yapı türü
   önerileri, Tebliğ Yapı Sınıfı seçilince otomatik birim maliyet
   (elle değiştirilebilir, ↺ ile Tebliğ değerine dönülebilir),
   amortisman %, canlı hesaplanan değer.
4. **Şerefiye / Düzeltme / Çevre Düzenlemesi** — tek kalem, üç
   tipten biri seçilip elle TL tutarı girilir.
5. **Sonuç** — Toplam, **5.000'e yuvarlanmış**; üstte her değişiklikte
   canlı güncellenen özet çubuğu.
6. **PDF + Excel + JPEG** — üçü de. JPEG, mevcut jenerik mekanizmayı
   (PDF'in ilk sayfasını görsele çevirme) kullanıyor, sıfırdan
   yazılmadı.
7. Excel'de gizli veri sayfası ile tam round-trip içe/dışa aktarma.
8. Sayfa açılışında boş başlıyor, "↺ Eski verileri geri getir" düğmesi
   var (diğer modüllerle tutarlı).

**Landing sırası:** Arsa → Otel → Akaryakıt → **Maliyet Yaklaşımı
(yeni)** → Tarımsal → Üst Hakkı. Artık **8 modül**.

## Küçük düzeltme

Arsa'nın "Arsa Değeri — Yöntem Karşılaştırması" kartındaki **"İki
Yöntem Arasındaki Fark"** satırı (ekran, PDF, Excel'in üçünden de)
kaldırıldı. Kart, yalnızca Kat Karşılığı Oranı girilmişse zaten
gösteriliyordu — bu davranış aynen korundu, yalnız fark satırı çıktı.

## Bu turda netleşmeyen / sonraki tur için not

- Yapı Sınıfı listesinde Tebliğ kodları ham hâliyle (`code`) gösteriliyor
  — istersen `label` (okunabilir isim) ile değiştirebiliriz.
- Landing kart açıklaması kısa tutuldu, gerekirse zenginleştirilebilir.

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
