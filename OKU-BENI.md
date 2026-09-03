# ArsaPlan v9.15.0 — Otel Modülü Büyük Tur: Yenileme Fonu, Denetim Tablosu, Yeniden İnşa Kontrolü, Yapı Sınıfı Önerisi

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **394/394 test yeşil** ·
`npm run build` başarılı.

## 1. Direkt Kapitalizasyon NOI'sine Yenileme Fonu düşümü eklendi

Önceden Direkt Kap ve İNA farklı NOI tanımı kullanıyordu (İNA yenileme
fonunu düşüyor, Direkt Kap düşmüyordu) — artık ikisi **tutarlı**. Hero
NOI, Yıllık Projeksiyon Tablosu'nun 1. yıl NOI'siyle birebir aynı.

## 2. İkincil İNA satırına iskonto oranı eklendi

Direkt Kap nihai değerken, ikincil satırdaki "İNA (NBD)" artık kullanılan
iskonto oranını da gösteriyor — Direkt Kap'ın kendi cap rate'ini
göstermesiyle tutarlı.

## 3. "Yeniden inşa maliyeti" kontrolü eklendi

Anemon Otel incelemesinde bulunan kontrol: Direkt Kap ya da İNA sonucu,
Maliyet Yaklaşımı'nın Yapı Değerleri'nin altına düşerse artık otomatik bir
uyarı çıkıyor — çalışan bir varlığın, yeniden yapma maliyetinden ucuza
değerlenmesi ekonomik olarak anlamsızdır.

## 4. PDF'e İNA'nın tam indirgeme detay tablosu eklendi

"İNA — İndirgeme Detayı" başlığı altında: yıl, nakit akışı, iskonto
katsayısı, bugünkü değer — ve terminal değerin formülü/kapitalizasyon
oranı/bugünkü değeri açıkça yazıyor. Artık kod erişimi olmayan biri
(banka uzmanı) sonucu PDF'ten birebir denetleyebilir.

## 5-6. Sonuç ekranına iki bilgi notu eklendi (PDF'te DEĞİL)

- Terminal büyüme oranı otomatik (son iki yıldan) alındığında bir uyarı.
- Otel değerinin işletme/demirbaş unsurları içerebileceğine dair bir
  kapsam notu.

İkisi de yalnızca ekranda — hesaba hiçbir etkisi yok, PDF'e hiç girmiyor.

## 7. Otel Maliyet Yaklaşımı'na Yapı Sınıfı otomatik önerisi eklendi

Bağımsız Maliyet Yaklaşımı/Akaryakıt'takiyle aynı mekanizma (139/139
eşleşme oranını kullanan aynı tablo) — Otel'in Maliyet Yaklaşımı'nda Yapı
Türü seçilince (Yasal ve Mevcut Durum'da, hem dropdown'dan seçimde hem
"Yapı Ekle" düğmesinde), eşleşme varsa Birim Maliyet sessizce doluyor.

## Hesaplamalarda değişiklik oldu mu?

**Yalnızca Kalem 1** hesabı etkiliyor — Direkt Kapitalizasyon sonucunuz,
Yenileme Fonu Oranı girilmişse artık biraz düşer (o oranın büyüklüğüne
göre, tipik %1 ile ~%1-3 arası bir azalma). Yenileme Fonu Oranı hiç
girilmemişse (varsayılan) hiçbir değişiklik yok. Diğer altı kalem yalnız
gösterim/arayüz/veri girişi.

## Değişen/Eklenen Dosyalar

```
src/hotel/engine.ts                    Kalem 1 (NOI), Kalem 3 (uyarı)
src/hotel/pdf.ts                       Kalem 2 (iskonto etiketi), Kalem 4 (detay tablosu)
src/hotel/HotelApp.tsx                 Kalem 5, 6 (bilgi notları), Kalem 7 (öneri wiring)
src/hotel/bu-oturum-yedi-kalem.test.ts YENİ — 10 test, yedi kalemin hepsini kapsıyor
```

## Beklemede — henüz karar verilmedi/kodlanmadı

- **İndirgenmiş Kat Karşılığı Yöntemi** — hâlâ "beklesin" kararınız geçerli.
