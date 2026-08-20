# ArsaPlan v9.4.0 — Maliyet Yaklaşımı Düzeltmeleri (Otel/Bağımsız/Akaryakıt) + Rapor Tarihi + Akaryakıt İyileştirmeleri

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **293/293 test yeşil** ·
`npm run build` başarılı. Sekiz düzeltme kalemi, hepsi kodlandı ve test edildi.

## 1. Otel Maliyet Yaklaşımı — Yasal Durum boşken de Mevcut Durum sonucu görünüyor

**Kök neden:** Sonuç nesnesinin (`cost`) var olup olmadığına yalnızca Yasal
Durum'un değerlerine bakılarak karar veriliyordu (`costLandValue > 0 ||
costBuildingsValue > 0`). Kullanıcı yalnızca Mevcut Durum'a veri girip Yasal
Durum'u boş bıraktığında, sonuç sessizce `null` kalıyor, ekranda hiçbir şey
görünmüyordu — "Yasal olmadan Mevcut girilemiyor" hissi buradan geliyordu.

**Düzeltme:** Kapı artık Mevcut Durum'un kendi değerlerini de kapsıyor.
2 yeni test.

## 2. Bağımsız Maliyet Yaklaşımı — Mevcut Durum şerefiyesi artık Yasal'dan bağımsız

**Kök neden:** Mevcut Durum'un düzeltme/şerefiye tutarı hesaplanırken,
tutarın uygulanıp uygulanmayacağına karar veren "kapı" (`adjustmentType`)
Yasal Durum'un kendi tür seçicisiydi. Yasal Durum'da hiç tür seçilmemişse
("none"), Mevcut Durum'a özel girilen tutar da sessizce sıfırlanıyordu.

**Düzeltme:** Mevcut Durum'a özel bir tutar girildiyse (`mevcutAdjustmentAmount
!= null`), Yasal Durum'un tür seçiciyle hiç ilgilenmeden doğrudan uygulanır.
Yalnız boş bırakılırsa Yasal Durum'un tür+tutarına geri döner (eski davranış
korunuyor). 3 yeni test.

## 3. Bağımsız Maliyet Yaklaşımı — Türkçe sayı ayrıştırıcısına geçirildi

Bu modülün tamamı hâlâ ham `<input type="number">` kullanıyordu — v9.3.0'da
düzelttiğimiz Türkçe sayı ayrıştırıcısını (`parseLocaleNumber`) hiç
görmüyordu. 11 alanın 10'u artık `Num` bileşenine bağlı; son biri (Mevcut
Durum düzeltme tutarı, "boş ≠ 0" anlamı taşıdığı için `Num`'a tam
sığmıyordu) doğrudan `parseLocaleNumber` ile düzeltildi.

## 4. Üç modülde "Rapor Tarihi" artık opsiyonel (varsayılan kapalı)

Bağımsız Maliyet Yaklaşımı, Otel Gelir Hesabı ve ana Arsa Gelir Projeksiyonu
— üçünde de PDF'te "Rapor Tarihi" satırı her zaman otomatik gösteriliyordu.
Artık sonuç ekranında (son sekmede) bir **"Rapor Tarihini Göster"** anahtarı
var, varsayılan **kapalı**:

- Kapalıyken PDF'te bu satır hiç görünmüyor.
- Açılırsa altında bir tarih seçici çıkıyor; boş bırakılırsa bugünün tarihi
  otomatik kullanılıyor.

Gerçek PDF metni `pdfjs-dist` ile çıkarılıp 6 senaryoda (kapalı/açık, üç
modül) doğrulandı.

## 5. Akaryakıt Maliyet Yaklaşımı — diğer modüllerle aynı standarda getirildi

Bu, en büyük kalemdi. Daha önce bu modülün Maliyet Yaklaşımı çapraz kontrolü
en geri kalmış hâldeydi: Yasal/Mevcut ayrımı yok, yapı türü serbest metin,
amortisman alanı hiç yok, birim maliyet tamamen elle giriliyordu. Artık:

- **Yapı Türü** — kataloglu açılır liste (`BUILDING_TYPES`), "Diğer" ile
  serbest metin de mümkün.
- **Yapı Sınıfı** — Bakanlık tebliğ kataloğundan (`YAPI_SINIFLARI`) otomatik
  birim maliyet önerisi, elle ezilebilir (↺ ile tebliğ değerine dönülebilir).
- **Amortisman %** — artık var, diğer modüllerle aynı mantık (kalan değer
  çarpanı, %0 = belirtilmemiş sayılır, tam değer kullanılır).
- **Mevcut Durum Değeri Hesapla** — diğer üç modülle birebir aynı desen
  (varsayılan kapalı, açılınca Yasal'daki satırlar kopyalanıp bağımsız
  düzenlenebilir ikinci liste oluyor).
- PDF ve Excel'de, açıksa iki ayrı Maliyet Yaklaşımı değeri gösteriliyor.

8 yeni test, biri gerçek PDF+Excel üretip "Mevcut Durum"/"YASAL DURUM"/
"MEVCUT DURUM" ibarelerinin gerçekten göründüğünü doğruluyor.

## 6. Akaryakıt — Maliyet Yaklaşımı sonucu artık 5.000'e yuvarlanıyor

Önceden yalnız kuruş hassasiyetine yuvarlanıyordu (gelir tarafı zaten
kullanıcının kendi ayarladığı esnek bir adımla yuvarlanıyordu, ama maliyet
tarafına hiç uygulanmamıştı). Artık diğer modüllerle tutarlı, sabit 5.000'e
ve katlarına yuvarlanıyor.

## 7. Akaryakıt — PDF/Excel ürün tablosuna "Birim Fiyat (KDV Hariç)" sütunu eklendi

Önceden yalnız Ciro (litre × birim fiyat çarpımının sonucu) gösteriliyordu,
çarpanın kendisi (kullanıcının girdiği KDV hariç litre fiyatı) hiçbir yerde
görünmüyordu — bir banka/denetçi cironun nasıl hesaplandığını doğrulayamıyordu.
Artık ÜRÜN ile YILLIK LİTRE arasına yeni bir sütun eklendi. Gerçek Excel
üretilip "Birim Fiyat" başlığı ve değeri doğrulandı.

## 8. Otel Gelir Hesabı PDF — Oda Dağılım Tablosu artık Gelir Özeti'nden önce

Sıra değişikliği, hesaba dokunmuyor.

## Hesaplamalarda değişiklik oldu mu?

**1, 2, 4, 8. kalemler hayır** — yalnız görünürlük/gösterim/sıra düzeltmesi.
**3. kalem yalnız düzeltici yönde** — sadece "1.234,56" gibi hem binlik hem
ondalık ayracı birlikte içeren girişlerde önceden yanlış hesaplanan
değerler artık doğru okunacak. **5, 6, 7. kalemler Akaryakıt Maliyet
Yaklaşımı sonucunu etkiler** — yapı türü artık kataloglu, amortisman artık
uygulanıyor (önceden hiç yoktu, her zaman %100 değer kullanılıyordu) ve
sonuç 5.000'e yuvarlanıyor; **daha önce bu modülde Maliyet Yaklaşımı
kullanarak aldığınız raporları gözden geçirmek isteyebilirsiniz** — özellikle
amortisman uygulamak istediğiniz yapılar varsa, önceden bu mümkün değildi.

## Değişen/Eklenen Dosyalar

```
src/hotel/engine.ts              Kalem 1 — Mevcut Durum kapı düzeltmesi
src/hotel/kalem1-yasal-bos.test.ts    YENİ — 2 test
src/hotel/types.ts               Kalem 4 — showReportDate/reportDate
src/hotel/pdf.ts                 Kalem 4, 8 — Rapor Tarihi koşullu, Oda Dağılım sırası
src/hotel/HotelApp.tsx           Kalem 4 — Rapor Tarihi UI anahtarı
src/cost/engine.ts               Kalem 2 — Mevcut Durum şerefiye bağımsızlığı
src/cost/kalem2-mevcut-bagimsiz.test.ts   YENİ — 3 test
src/cost/CostApproachApp.tsx     Kalem 3 — Num bileşenine geçiş, Kalem 4 — Rapor Tarihi UI
src/cost/pdf.ts                  Kalem 4 — Rapor Tarihi koşullu
src/engine/types.ts              Kalem 4 — ProjectInput'a showReportDate/reportDate
src/export/pdf.ts                Kalem 4 — Rapor Tarihi koşullu
src/ui/Result.tsx                Kalem 4 — Rapor Tarihi UI anahtarı, setInput prop
src/App.tsx                      Kalem 4 — Result'a setInput geçirildi
src/fuel/engine.ts               Kalem 5, 6 — FuelCostBuildingRow yeniden tasarımı, yuvarlama
src/fuel/engine.test.ts          Kalem 6 — golden test güncellendi
src/fuel/FuelApp.tsx             Kalem 5 — yapı türü/sınıfı kataloğu, amortisman, Mevcut Durum UI
src/fuel/pdf.ts                  Kalem 5, 7 — Mevcut Durum bölümü, Birim Fiyat sütunu
src/fuel/excel.ts                Kalem 5, 7 — Mevcut Durum bölümü, Birim Fiyat sütunu, buildFuelExcelWorkbook ayrımı
src/fuel/kalem5-yasal-mevcut.test.ts  YENİ — 8 test
src/fuel/unit-price-column.test.ts    YENİ — 3 test
src/tests/kalem4-rapor-tarihi.test.ts YENİ — 6 test
src/tests/fixtures/minimalProjectInput.ts  YENİ — test fixture
package.json, src/brand/brand.ts v9.4.0
```

## Yükleme

`src` / `public` / `package.json` klasör ve dosyalarını GitHub'a sürükle —
önce kök dosyalar, sonra ayrı ayrı `src`, sonra ayrı ayrı `public`, sonra
ayrı ayrı `.github` (dördü tek seferde değil, 100 dosya sınırı uyarısı
çıkar). Actions yeşile dönünce Ctrl+F5.

## Beklemede — henüz karar verilmedi

- "İndirgenmiş Kat Karşılığı Yöntemi" (bağımsız Maliyet Yaklaşımı'na üçüncü
  yöntem) — isim ve formül netleşti, eklenip eklenmeyeceği kararınıza bağlı.
