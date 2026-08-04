# ArsaPlan v7.5.0 — Otel: Yatay Düzen + Gereksiz Tekrarlar Kaldırıldı

Doğrulama: tsc 0 hata, test 193/193, build başarılı.

## Değişiklikler (geciken maddeler, tamamlandı)

- **İşletme Gideri kompakt/yatay** — uzun açıklama paragrafı kaldırıldı,
  Oran + sonuç tek satırda.
- **Toplam Brüt Gelir / NOI tekrarı kaldırıldı** — bunlar zaten
  sayfanın üstünde (Adım 5 hero kutularında) gösteriliyordu, İşletme
  Gideri kartında ikinci kez tekrarlanıyordu.
- **Projeksiyon Parametreleri artık tek yatay satır** — Başlangıç Yılı,
  Süre, Gelir Artışı, Gider Artışı yan yana; Kapitalizasyon Oranı ayrı.
- **Yıllık Projeksiyon Tablosu artık yalnız İNA verisi girilince
  gösteriliyor** — İskonto Oranı boşsa (yalnız Direkt Kapitalizasyon
  kullanılıyorsa) bu tablo hiç görünmüyor, gereksiz uzunluk kalkıyor.

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
