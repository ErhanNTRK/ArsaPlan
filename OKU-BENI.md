# ArsaPlan v8.4.0 — "Hüküm Bileşeni" (RTable) Kuruldu ve Uygulandı

Doğrulama: tsc 0 hata, test 194/194, build başarılı.

## "Hüküm Yüzüğü" — tek, paylaşılan hibrit tablo bileşeni

`src/ui/RTable.tsx` — tüm modüllerin ortak kullanacağı, masaüstünde
gerçek tablo / dar ekranda otomatik kart görünümüne dönen tek bir
bileşen (`RTable`, `RRow`, `RCell`). CSS'i (`.rtable`) de Kat
Tablosu'nun deseniyle birleştirilip **tek kaynaktan** yönetiliyor —
artık her yeni tabloyu sıfırdan tasarlamak yerine bu üç bileşeni
kullanmak yeterli.

## Bu bileşenle donatılan yerler

- **Otel — Maliyet Yaklaşımı Yapılar listesi**
- **Üst Hakkı — Toplam Değer Esaslı ve Arsa Değeri Esaslı Yapı
  listeleri** (iki yöntem de)
- **Üst Hakkı — Toplam Gelir Üzerinden Yapı Maliyetleri**

## Zaten grid tabanlı olan, yalnız mobil davranışı eklenen yerler

- **Otel — Oda Tipleri, Yardımcı Gelirler**
- **Arsa Ticari İşletme — Yapılar listesi**

Bunlar RTable'a çevrilmedi (zaten kendi grid yapıları vardı, yalnız
dar ekranda etiketli kart görünümüne dönmelerini sağlayan CSS
eklendi) — sonuç aynı, kullanıcı deneyimi tutarlı.

## Mimari nedenle atlanan yerler — dürüst not

**Tarımsal Ürün ve Akaryakıt'ın ürün satırları RTable'a UYGUN DEĞİL**
— bunlarda seçilen türe/moda göre (ekili/dikili, günlük/yıllık/kısmi
dönem vb.) **değişken sayıda alan** gösteriliyor. Sabit sütunlu bir
tabloya zorlamak, sütun sayısının satırdan satıra değişmesine yol
açar — bu, tablo yerine mevcut kart yapısında kalmalı. Bu iki modülü
bilinçli olarak dönüştürmedim.

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
