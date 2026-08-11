# ArsaPlan v9.3.0 — Otel Gelir Hesabı ve Arsa Gelir Projeksiyonu Düzeltmeleri

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **249/249 test yeşil** ·
`npm run build` başarılı. Beş küçük düzeltme talebi olarak başladı, ikisi
(çekme mesafesi 0 sorunu, Direkt Kap/İNA tutarsızlığı) gerçek kod hatası
çıktı ve kök nedenden düzeltildi — kozmetik yama değil.

## 1. Otel Gelir Hesabı — "Tesis Adı" zorunluluğu kaldırıldı

Daha önce 1. adımda tesis adı girilmeden ilerlemek mümkün değildi. Artık
uzman ismi henüz belirlememiş olsa bile rapor ilerletilebiliyor.

## 2. Arsa Gelir Projeksiyonu — çekme mesafelerine 0 girilebiliyor (gerçek hata düzeltmesi)

**Kök neden bulundu:** `src/geo/kml.ts` içindeki `inwardOffset` fonksiyonu,
kendine-kesişme koruması için ofset poligonuyla orijinal poligon arasındaki
en yakın mesafeyi ölçüp bekleneden "çok küçükse" reddediyordu. Ama gerçekten
**0 girilen bir çekme mesafesi** (yola/komşuya sıfır çekmeyle inşa
edilebilen parseller için meşru bir durum), tanım gereği orijinal sınıra tam
temas eder — bu bozukluk değil, doğru sonuçtur. Kod bu ayrımı yapamıyor,
meşru bir sıfırı hatayla karıştırıp `"Çekme mesafeleri bu parsel şekline
uygulanamadı"` diye reddediyordu.

**Düzeltme:** Sıfır-mesafeli bir kenar varken kendine-kesişme kontrolü
atlanıyor (o kenarın sınıra değmesi zaten beklenen davranış). Ayrıca tüm
kenarlar tam sıfırsa (yola/komşuya tamamen sıfır çekmeli bir parsel),
oturum artık parselin kendisine eşit kabul ediliyor, `null` dönmüyor.

Gerçek geometriyle (40×30 dikdörtgen parsel) test edildi: karışık (ön=0,
diğerleri>0), tam sıfır (hepsi=0), ve normal (sıfırsız) senaryoların
üçü de doğrulandı; negatif/geçersiz mesafe hâlâ reddediliyor (geriye dönük
uyumlu). `src/geo/kml.test.zero-setback.test.ts` — 6 yeni test.

## 3. Otel Gelir Hesabı — para birimi simgesi artık tutarlı

Yalnız "Oda Tipleri" bölümünde değil, taradığımızda aynı hatanın **beş
yerde daha** olduğu görüldü: Yardımcı Gelir, Ticari Kira, Bakım Tutarı,
Şerefiye alanları da Dolar/Euro seçilse bile hep "₺" gösteriyordu. Hepsi
düzeltildi — artık seçilen para birimine göre $/€/₺ doğru gösteriliyor.

**Not:** "Maliyet Yaklaşımı" (çapraz kontrol) bölümündeki arsa/bina m²
birim değeri alanları **bilinçli olarak TL'de bırakıldı** — Türk ekspertiz
pratiğinde inşaat/arsa maliyetleri, otel geliri döviz bazlı olsa bile
genelde TL cinsinden verilir. İsterseniz bunu da döviz bazlı yapabiliriz,
şimdilik dokunulmadı.

## 4. Otel Gelir Hesabı — PDF/Excel'de TL karşılığı eksikliği (gerçek veri kaybı düzeltmesi)

**Kök neden:** Döviz kuru (`fxRate`) alanı veri modelinde ve arayüzde zaten
vardı — kullanıcı kuru giriyordu, uygulama saklıyordu, ama `pdf.ts` ve
`excel.ts` dosyalarının **hiçbirinde bir kez bile kullanılmıyordu.**
Girilen kur sessizce kayboluyordu.

**Düzeltme:** Yeni `fmtWithTlEquivalent()` yardımcı fonksiyonu eklendi.
Artık TL dışı bir para birimi seçiliyse:
- Ekrandaki NİHAİ DEĞER ve üç yöntem kartı (Direkt Kap, İNA, Maliyet)
  TL karşılığını parantez içinde gösteriyor.
- PDF'teki ana sonuç kutusu, altında "≈ X ₺ · 1 $ = Y ₺" satırıyla
  genişliyor; ikincil yöntemler listesi de TL karşılığını içeriyor.
- Excel'de "NİHAİ DEĞER" satırına TL karşılığı ekleniyor, altına ayrı bir
  "Kullanılan Kur" satırı düşüyor; Yöntemlerin Karşılaştırması bölümündeki
  üç değer de aynı şekilde güncelleniyor.
- TL bazlı otellerde hiçbir ekstra satır eklenmiyor (gereksiz tekrar yok).

Gerçek bir dolar bazlı otel (150 $ ADR, kur 40,5) ile PDF+Excel üretilip
doğrulandı: Excel'de `"12.455.000 $ (≈ 504.427.500 ₺)"` satırı gözle
teyit edildi. `src/hotel/tl-equivalent.test.ts` — 3 yeni test.

(`excel.ts` test edilebilir olması için `buildHotelExcelWorkbook()` /
`downloadHotelExcel()` olarak ikiye ayrıldı — `cost/ziraatExcel.ts`'te
kullandığımız desenin aynısı.)

## 5. Otel Gelir Hesabı — Direkt Kap ve İNA arasındaki büyük fark (gerçek matematiksel düzeltme, uyarı değil)

Bu, en çok tartıştığımız kalem oldu ve "yalnız uyarı yeterli değil, çözüm
istiyorum" haklı itirazınız üzerine gerçek bir düzeltmeye dönüştü.

**Bulunan İKİ gerçek hata:**

1. **Terminal değer yanlış yılın NOI'sinden hesaplanıyordu.**
   `computeIna()` fonksiyonu, uluslararası standardın (Appraisal
   Institute / Gordon Büyüme kimliği) gerektirdiği gibi **bir sonraki**
   yılın NOI'si yerine, projeksiyonun **son yılının kendi** NOI'sini
   kullanıyordu — bu, İNA sonucunu sistematik olarak düşük gösteriyordu.
   Düzeltme, gerçek bir **banka Excel'inden alınan golden referans
   değerle** doğrulandı: eski kod gerçek değerden %0,9 sapıyordu, yeni kod
   %0,4'e indi — sapma yarıya düştü.

2. **İskonto oranı, cap rate ve büyüme oranıyla hiçbir matematiksel
   bağlantısı olmadan, kullanıcı tarafından bağımsız giriliyordu.**
   Gordon kimliğine göre (`iskonto oranı = cap rate + büyüme oranı`)
   bunlar tutarlı olmalı; aksi halde iki yöntem farklı soruları
   cevaplıyor demektir (biri büyümesiz, diğeri büyümeli bir gelecek
   varsayıyor).

**Gerçek çözüm (uyarı değil):**
- `gordonConsistentDiscountRate(capRate, growthRate)` eklendi — Gordon
  kimliğinden tutarlı iskonto oranını hesaplıyor.
- İskonto Oranı alanının altına **"Tutarlı iskonto oranını kullan"**
  hızlı düğmesi eklendi; kullanıcı mevcut cap rate + büyüme oranından
  otomatik hesaplanan tutarlı değeri tek tıkla uygulayabiliyor.
- `explainInaVsDirectGap()` eklendi — iki yöntem **%5'ten fazla**
  ayrışırsa (Appraisal Institute'ün kurumsal pratikte kullandığı "%5
  kuralı"), sistem yalnız "farklı" demiyor, **nicel olarak** açıklıyor:
  "İskonto oranınız tutarlı değerden X puan sapıyor, bu yüzden İNA
  Direkt Kap'tan %Y farklı çıkıyor." Bu mesaj hem sonuç ekranında hem
  Projeksiyon adımında gösteriliyor.

Gerçek testle doğrulandı: Gordon-tutarlı iskonto oranı kullanıldığında
(cap %10 + büyüme %15 = iskonto %25), İNA ve Direkt Kap **matematiksel
olarak sıfıra yakın farkla eşitleniyor** (< %0,01) — tam olarak Erhan
Plaza Hotel örneğinde elle kanıtladığımız sonucun kodda birebir karşılığı.
`src/hotel/gordon-consistency.test.ts` — 5 yeni test.

## Hesaplamalarda değişiklik oldu mu?

**1, 2, 3, 4. kalemler hayır** — yalnız kısıtlama kaldırma, hata
düzeltmesi (geometri), görsel simge, ve eksik gösterim tamamlama;
mevcut hiçbir raporun sayısal sonucunu değiştirmiyor.

**5. kalem EVET** — terminal değer formülü değiştiği için, **daha önce
İNA (İndirgenmiş Nakit Akımı) kullanarak aldığınız raporlardaki NBD
değerleri artık farklı (ve gerçek referansa göre daha isabetli) çıkacak.**
Direkt Kapitalizasyon sonuçları etkilenmedi. Daha önce İNA ile teslim
ettiğiniz raporları yeniden gözden geçirmek isteyebilirsiniz.

## Değişen/Eklenen Dosyalar

```
src/hotel/HotelApp.tsx        Tesis adı kısıtı kaldırıldı, para birimi simgesi (5 yer), TL karşılığı gösterimi, Gordon düğmesi + gap açıklaması
src/hotel/engine.ts           computeIna terminal değer düzeltmesi, fmtWithTlEquivalent, gordonConsistentDiscountRate, explainInaVsDirectGap
src/hotel/engine.test.ts      Golden test npv doğrulaması eklendi (gerçek banka Excel referansıyla)
src/hotel/types.ts            HotelInaResult'a gapExplanation eklendi
src/hotel/pdf.ts              Ana sonuç kutusu ve ikincil yöntemler listesine TL karşılığı
src/hotel/excel.ts            buildHotelExcelWorkbook/downloadHotelExcel ayrımı, NİHAİ DEĞER + karşılaştırma satırlarına TL karşılığı
src/hotel/tl-equivalent.test.ts       YENİ — 3 test
src/hotel/gordon-consistency.test.ts  YENİ — 5 test
src/geo/kml.ts                 inwardOffset: sıfır-mesafe düzeltmesi
src/geo/kml.test.ts            Eski "sıfır=null" testi yeni davranışa güncellendi
src/geo/kml.test.zero-setback.test.ts YENİ — 6 test
package.json, src/brand/brand.ts      v9.3.0
```

## Yükleme

`src` / `public` / `package.json` klasör ve dosyalarını GitHub'a sürükle
→ önce kök dosyalar, sonra ayrı ayrı `src`, sonra ayrı ayrı `public` →
Commit directly to main → Actions sekmesinde yeşile dönene kadar bekle →
Ctrl+F5.
