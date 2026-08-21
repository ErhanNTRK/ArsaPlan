# ArsaPlan v9.6.0 — Kat Karşılığı İndirgemesi, Şerefiye Tür Seçicileri, Plan Lejantı Düzeltmesi

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **326/326 test yeşil** ·
`npm run build` başarılı. Dört düzeltme kalemi, hepsi kodlandı ve test edildi.

## 1. Otel Maliyet Yaklaşımı — Mevcut Durum Şerefiye artık tür seçici

Geçen turda Yasal Durum'a eklediğimiz Şerefiye/Düzeltme/Çevre Düzenlemesi
tür seçicisi, Mevcut Durum bölümüne hiç yansımamıştı — orası hâlâ düz bir
sayı kutusuydu. Artık aynı yapıda: **Tip** (Yok/Şerefiye/Düzeltme/Çevre
Düzenlemesi) + tutar. Yasal Durum'daki Kalem 2 mantığıyla birebir aynı:
Mevcut Durum'un kendi türü Yasal'dan **bağımsız** — tür hiç seçilmemişse
(eski taslaklar), kendi tutarı girilmişse yine uygulanır; girilmemişse
Yasal'ın tür+tutarına düşer. 4 yeni test.

## 2. Arsa Gelir Projeksiyonu — Kat Karşılığı yöntemine de indirgeme uygulandı

Daha önce yalnızca Gelir Projeksiyonu (Artık Değer) yöntemi Proje Süresi +
Yıllık İndirgeme Oranı ile bugüne çekiliyordu; Kat Karşılığı hep "bugünkü"
bir sayı olarak kalıyordu — aynı projenin iki yöntemi farklı zaman
temelinde karşılaştırılıyordu. Artık:

- **İndirgemeli Kat Karşılığı Değeri** hesaplanıyor — Gelir Projeksiyonu'nun
  kullandığı **aynı** proje-sonu indirgeme faktörüyle (arsa sahibinin
  daireleri de proje bittiğinde teslim alınıyor, aynı zamanlama).
- İki yöntem arasındaki karşılaştırma (`differenceRate`, "yakın/kat
  karşılığı yüksek/gelir yöntemi yüksek" rozeti) artık **indirgenmiş**
  değerler üzerinden yapılıyor — indirgeme kapalıyken (Proje Süresi=0)
  davranış birebir eskisiyle aynı kalıyor, geriye dönük uyumlu.
- **%5 tutarlılık uyarısı** eklendi: fark %5'i aşarsa, altında nicel bir
  açıklama çıkıyor — *"...kat karşılığı oranınız (%X) ile müteahhit kâr
  oranınız (%Y) arasında bir tutarsızlığa işaret edebilir."*

**Tek bir düzeltme, Konut, Karma Kullanım ve Ticari Apartman'ın üçünü
birden kapsıyor** — hepsi aynı paylaşılan `computeShare` fonksiyonunu
kullanıyor (yalnızca Ticari İşletme türünde Kat Karşılığı kavramı zaten
yok, oraya dokunulmadı). 8 yeni test.

## 3. Plan Lejantı — "Diğer (elle yazınız)" alanında boşluk artık yazılabiliyor

Gerçek bir hata: alan, kullanıcı canlı yazarken her tuş vuruşunda değeri
`.trim()`'liyordu — "Gelişme " yazıp boşluğa basar basmaz o boşluk anlık
olarak siliniyor, sonraki harf bitişik ekleniyordu ("GelişmeKonut" gibi).
Hem ana Arsa Gelir Projeksiyonu hem 3-8 Katlı Bina modülünde aynı hata
vardı, ikisi de düzeltildi — artık çok kelimeli lejant adları sorunsuz
yazılabiliyor.

## 4. Proje Süresi / Yıllık İndirgeme Oranı — açıklayıcı ipuçları eklendi

- **Proje Süresi:** *"Küçük/orta ölçekli projelerde ~12-18 ay, çok katlı/
  büyük ölçekli projelerde ~24-36 ay tipiktir."*
- **Yıllık İndirgeme Oranı:** *"TCMB politika faizine yakın bir risksiz
  getiri (ör. %35-38) + geliştirme riski için bir risk primi (ör. %5-10)
  toplamı önerilir."*

Bu alanlar (Step4) zaten tüm türlerde (Konut, Karma, Ticari Apartman)
ortak kullanıldığı için tek bir yerde düzeltme yeterli oldu.

## Hesaplamalarda değişiklik oldu mu?

**1, 3, 4. kalemler hayır** — yalnız gösterim/veri girişi/açıklama, hiçbir
mevcut hesaba dokunmuyor. **2. kalem, yalnızca Proje Süresi > 0 girilmiş
raporları etkiler** — Proje Süresi hep 0 (varsayılan) bırakılan raporlarda
Kat Karşılığı sonucu birebir eskisiyle aynı. **Proje Süresi > 0 girip Kat
Karşılığı karşılaştırmasına bakmış olduğunuz raporlarda**, karşılaştırma
artık indirgenmiş değerler üzerinden yapıldığı için "yakın/yüksek" rozeti
değişmiş olabilir — bu raporları gözden geçirmek isteyebilirsiniz.

## Değişen/Eklenen Dosyalar

```
src/hotel/types.ts                        mevcutCostAdjustmentType
src/hotel/engine.ts                       Mevcut Durum şerefiye — Yasal'dan bağımsız tür mantığı
src/hotel/HotelApp.tsx                    Mevcut Durum Şerefiye tür seçici UI
src/hotel/kalem1-mevcut-serefiye-tur.test.ts   YENİ — 4 test
src/engine/types.ts                       ShareResult: discountedShareLandValue(Rounded), gapExplanation
src/engine/financial.ts                   computeShare: indirgeme + %5 tutarlılık uyarısı
src/engine/index.ts                       computeShare çağrıları residual parametresiyle güncellendi
src/engine/kalem2-kat-karsiligi-indirgeme.test.ts  YENİ — 8 test
src/ui/Result.tsx                         İndirgemeli Kat Karşılığı Değeri gösterimi + gapExplanation
src/export/pdf.ts                         Aynı gösterim PDF'te
src/export/excel.ts                       Aynı gösterim Excel'de (dinamik satır indeksleme ile)
src/ui/Steps.tsx                          Plan Lejantı trim düzeltmesi + Proje Süresi/İndirgeme Oranı ipuçları
src/ui/StepsApartment.tsx                 Plan Lejantı trim düzeltmesi
```

## Yükleme — GitHub Desktop ile

1. Bu zip'i indirip **içeriğini** çıkarın (zip'in kendisini değil).
2. Çıkan klasördeki HER ŞEYİ seçip kopyalayın, klonladığınız ArsaPlan
   klasörünün üzerine yapıştırın — "üzerine yaz" onayı verin.
3. GitHub Desktop'ı açın (Current repository: **ArsaPlan** olduğundan emin
   olun), "Changes" sekmesinde tüm değişen dosyaların otomatik
   listelendiğini göreceksiniz.
4. Sol alttaki "Summary" kutusuna kısa bir not yazın (örn. "v9.6.0").
5. "Commit to main" → sonra üstteki "Push origin" düğmesine tıklayın.
6. GitHub.com'da "Actions" sekmesinin yeşile dönmesini bekleyip Ctrl+F5.

## Beklemede — henüz karar verilmedi

- "İndirgenmiş Kat Karşılığı Yöntemi" (bağımsız Maliyet Yaklaşımı'na üçüncü
  yöntem) — şimdilik eklenmiyor.
