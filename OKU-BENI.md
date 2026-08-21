# ArsaPlan v9.5.0 — Otel Gelir Hesabı: Gordon Uyarısı, İki Aşamalı Büyüme, Yeni/Aktif Otel Ayrımı, KML+Şerefiye

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **314/314 test yeşil** ·
`npm run build` başarılı. Dört düzeltme kalemi, hepsi kodlandı ve test edildi.

## 1. Gordon Tutarlılık Uyarı Sistemi

Otel Gelir Hesabı'nda iskonto oranı ile büyüme oranı birlikte, piyasada
gözlemlenmeyen bir kapitalizasyon oranı ima ediyorsa (Gordon kimliği:
`cap = iskonto − büyüme`, sonuç %5'in altında ya da %25'in üstündeyse),
İNA sonucunun yanında otomatik bir uyarı çıkıyor: *"İskonto ve büyüme
oranlarınız birlikte %X gibi piyasada nadiren gözlemlenen bir kapitalizasyon
oranı ima ediyor."* İskonto oranı büyüme oranına eşit ya da düşükse (sonsuz/
negatif terminal değer riski) ayrıca, daha güçlü bir uyarı gösteriliyor.
Bu, bu sohbette bizzat yaşadığımız "%40 iskonto + %5 büyüme" gibi tutarsız
kombinasyonları artık kullanıcıya önceden gösteriyor. 6 yeni test.

## 2. İki Aşamalı Büyüme

Projeksiyon büyüme oranının yanına opsiyonel **"Uzun Vadeli/Terminal Büyüme
Oranı"** alanı eklendi. Boş bırakılırsa eski davranış korunur (projeksiyon
büyümesi sonsuza kadar sürüyormuş gibi terminal değer hesaplanır).
Doldurulursa, terminal değer artık bu daha mütevazı, sürdürülebilir oranla
hesaplanıyor — otelin ilk 10 yıl hızlı büyüyüp sonra normal bir hıza
yerleştiği gerçekçi bir senaryoyu temsil ediyor. 2034'te 2 milyar TL'ye
çıkan "kapitalizasyon değeri" sorununu bu alanla kontrol altına alabilirsiniz.
4 yeni test.

## 3. Yeni/Aktif Otel Ayrımı

Adım 1'e **"Bu otel yeni mi?"** anahtarı eklendi (henüz açılmamış/inşa
hâlinde). İşaretlenirse:

- **Oturma Süresi (yıl)** alanı çıkar (varsayılan 3).
- Projeksiyona otomatik bir **kademeli oturma (ramp-up)** uygulanır — gerçek
  bir banka raporunda gördüğümüz %50 → %75 → %100 kademesini birebir üreten
  bir formülle (`1 − 0,5^yıl`), farklı oturma süreleri için de genelleşir.
- Direkt Kapitalizasyon sonucunun **bugüne indirgenmiş hâli** ("Bugünkü
  karşılığı") ayrıca gösterilir — oturma süresi kadar iskonto oranıyla
  bugüne çekilmiş.

Bu, kozmetik bir etiket değişikliği değil — **aynı hedef sayılarla girilse
bile**, "yeni" işaretlenen bir otelin değeri "aktif" işaretlenenden
gerçekten düşük çıkıyor, çünkü ilk yılların düşük doluluğu hesaba giriyor.
7 yeni test.

## 4. KML Otomatik Doldurma + Şerefiye Tür Seçici

- **KML yükleme artık Adım 1'de** — önceden yalnız Maliyet Yaklaşımı
  bölümünde, yalnız arsa alanını dolduran bir düğmeydi. Kontrol ederken
  önemli bir şey keşfettik: KML ayrıştırıcısı **zaten** TKGM'nin
  `<ExtendedData>` alanlarından İl/İlçe/Mahalle/Ada/ParselNo/Alan bilgisini
  çıkarıyordu — yalnız Otel modülü bunu kullanmıyordu. Artık tek bir KML
  yüklemesi hem taşınmaz kimliği alanlarını hem de (Maliyet Yaklaşımı
  açıksa) arsa alanını otomatik dolduruyor.
- **Şerefiye alanı artık Maliyet Yaklaşımı modülüyle aynı yapıda:** düz bir
  sayı kutusu yerine önce bir **tür seçici** (Yok / Şerefiye / Düzeltme /
  Çevre Düzenlemesi), seçilirse altında tutar kutusu. Eski taslaklarda tür
  hiç seçilmemişse (geriye dönük uyumluluk), tutar > 0 ise yine uygulanıyor
  — hiçbir eski rapor sessizce bozulmuyor.

4 yeni test — biri gerçek bir TKGM tarzı KML örneğiyle il/ilçe/ada/parsel/
alanın doğru çıkarıldığını kanıtlıyor.

## Hesaplamalarda değişiklik oldu mu?

**1 ve 4. kalemler hayır** — yalnız uyarı mesajı ve gösterim/veri girişi
değişikliği, mevcut hiçbir hesaba dokunmuyor (Şerefiye'nin geriye dönük
uyumluluk davranışı özellikle test edildi). **2 ve 3. kalemler yalnız
alanları DOLDURURSANIZ etkiler** — "Uzun Vadeli Büyüme Oranı" ve "Bu otel
yeni mi?" ikisi de varsayılan **boş/kapalı** geliyor; boş/kapalı bıraktığınız
sürece hiçbir mevcut raporunuz değişmez.

## Değişen/Eklenen Dosyalar

```
src/hotel/engine.ts                 checkImpliedCapPlausibility, buildRampSchedule, prospectiveValue, longTermGrowthRate, costAdjustmentType
src/hotel/types.ts                  plausibilityWarning, longTermGrowthRate, isNewHotel, stabilizationYears, prospectiveValue, costAdjustmentType
src/hotel/HotelApp.tsx              Gordon uyarısı gösterimi, İki Aşamalı Büyüme UI, Yeni/Aktif Otel UI, KML Adım 1'e taşındı, Şerefiye tür seçici
src/hotel/kalem1-gordon-uyari.test.ts        YENİ — 6 test
src/hotel/kalem2-iki-asamali-buyume.test.ts  YENİ — 4 test
src/hotel/kalem3-yeni-aktif-otel.test.ts     YENİ — 7 test
src/hotel/kalem4-serefiye-kml.test.ts        YENİ — 4 test
```

## Yükleme — artık GitHub Desktop ile (100 dosya sınırı yok)

Daha önce klonladığınız ArsaPlan deposunu kullanın ("Current repository"
alanının **ArsaPlan** olduğundan emin olun, Dora Değerleme Pro değil):

1. Bu zip'i indirip **içeriğini** çıkarın (zip'in kendisini değil).
2. Çıkan klasördeki HER ŞEYİ seçip kopyalayın, klonladığınız ArsaPlan
   klasörünün üzerine yapıştırın — "üzerine yaz" onayı verin.
3. GitHub Desktop'ı açın, sol tarafta "Changes" sekmesinde tüm değişen
   dosyaların otomatik listelendiğini göreceksiniz.
4. Sol alttaki "Summary" kutusuna kısa bir not yazın (örn. "v9.5.0").
5. "Commit to main" → sonra üstteki "Push origin" düğmesine tıklayın.
6. GitHub.com'da "Actions" sekmesinin yeşile dönmesini bekleyip Ctrl+F5.

## Beklemede — henüz karar verilmedi

- "İndirgenmiş Kat Karşılığı Yöntemi" (bağımsız Maliyet Yaklaşımı'na üçüncü
  yöntem) — şimdilik eklenmiyor, karar vermediniz.
