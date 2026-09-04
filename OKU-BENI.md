# ArsaPlan v9.18.0 — Basit Gelir Bazlı Üst Hakkı: Otomatik Toplam Gelir ve Ödemeler

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **446/446 test yeşil** ·
`npm run build` başarılı.

## Salih'in bulduğu tasarım uyuşmazlığı düzeltildi

v9.17.0'da eklenen "Basit Gelir Bazlı Üst Hakkı Hesabı" (4. yöntem),
Toplam Gelir'i ve Ecrimisil/Üst Hakkı Ödemesi/Bayilik tutarlarını **elle
girmeyi** istiyordu — Salih bunun "meşakkatli" olduğunu, otomatik
hesaplanmasını beklediğini belirtti.

### 1. Toplam Gelir artık KENDİ oda tablosundan otomatik hesaplanıyor

Yeni "Oda Tablosu" kartı (Oda Türü / Adet / Günlük Fiyat / Doluluk % /
Gün) eklendi — Otel modülüyle aynı mantık, ama **tamamen bağımsız, ayrı
bir veri girişi** (Otel modülüne hiç dokunmuyor, veri aktarımı yok).
Toplam Gelir artık salt-okunur, oda tablosundan otomatik toplanıyor.

### 2. Ecrimisil / Üst Hakkı Ödemesi / Bayilik artık Toplam Gelir'in oranı

Önceden her biri kendi taban tutarı + kendi büyüme oranıyla elle
giriliyordu (6 alan). Artık **tek bir oran** girilir (varsayılan %2 / %5
/ %1 — yalnızca başlangıç önerisi, sözleşmeye göre değiştirilebilir),
tutar her yıl Toplam Gelir'le birlikte otomatik büyür. 6 alan yerine 3
alan, ayrıca 1. yıl tutarı canlı olarak gösteriliyor.

## Bir bug iddiası da araştırıldı — kod doğru çıktı

"Toplam Süre 49, Kalan Süre 42 girdim ama PDF'te 49 görünüyordu"
şikayeti test edildi: motor gerçekten 42 yıl projekte ediyor, PDF'te
"Kalan Süre (= Projeksiyon Süresi): 42 yıl" ve "DÖNEMSEL ÖZET TABLOSU (42
DÖNEM)" doğru yazıyor. "Toplam Süre: 49" ayrı, doğru etiketli bir bilgi
satırı — hesaba hiç girmiyor. Muhtemelen iki satırın yan yana durması
karışıklığa yol açtı; hesap doğru.

## Hesaplamalarda değişiklik oldu mu?

Yalnızca bu yeni (henüz kimsenin gerçek veriyle kullanmadığı) 4. yöntemi
etkiliyor — diğer üç Üst Hakkı modeli ve uygulamanın geri kalanı hiç
değişmedi.

## Değişen Dosyalar

```
src/usthakki/gelirBazliEngine.ts        Oda tablosu + oran bazlı ödemeler
src/usthakki/gelirBazliPdf.ts           Oda tablosu bölümü eklendi
src/usthakki/gelirBazliExcel.ts         Oda tablosu bölümü eklendi
src/usthakki/GelirBazliUstHakkiApp.tsx  Oda tablosu UI + oran alanları
src/usthakki/gelirBazliYontem4.test.ts  16 test (5 yeni, düzeltmeyi kilitliyor)
```

## Beklemede

- "Toplam Süre" satırının PDF'ten tamamen kaldırılıp kaldırılmayacağı
  (karışıklığı önlemek için) — Salih'in onayı bekleniyor.
