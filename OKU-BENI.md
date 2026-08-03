# ArsaPlan v6.0.14 — Otel Döviz Seçimi (Adım 1)

Doğrulama: tsc 0 hata, test 192/192, build başarılı. (Token tasarrufu:
bu tur PDF üretmeden yalnız derleme+test ile doğrulandı.)

## Eklenen

Otel Gelir Hesabı'nın **1. adımına** (Oda Gelirlerinden önce) Para Birimi
kartı eklendi: TL/USD/EUR seçimi, TL dışı seçilirse kur sorusu. Seçim
kaydediliyor.

## Dürüst sınır — bu turda TAMAMLANMADI

Para birimi **seçimi** eklendi ama ekrandaki/PDF'teki tüm ₺ sembollerinin
seçilen para birimine göre değişmesi (tam yayılım) henüz yapılmadı —
bu, Üst Hakkı modülünde yaptığımız gibi ayrı, kendi başına bir iş
(onlarca `fmtTL`/`tl()` çağrısını tek tek gözden geçirmek gerekiyor).
Token tasarrufu önceliğiyle bu turda atlandı, sıradaki turda tamamlarım.

## Yükleme
`src`/`public`/`package.json` klasör simgelerini GitHub'a sürükle →
üzerine yaz → Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
