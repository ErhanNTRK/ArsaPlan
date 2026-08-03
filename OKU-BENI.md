# ArsaPlan v7.0.1 — Üst Hakkı: Geniş Matris Excel + Diğer Düzeltmeler

Doğrulama: tsc 0 hata, test 192/192, build başarılı. Geniş matris Excel
gerçek verilerle üretilip LibreOffice ile render edilerek **sıfır ####
hatası** doğrulandı; referans banka şablonuyla yapı/oran karşılaştırması
yapıldı (Oda Gelirleri %92,9 gibi oranlar birebir örtüşüyor).

## 1) Toplam Değerden Üst Hakkı Hesabı — sonuç gösterimi sadeleşti

"Daimi Müstakil Hak Değeri (2/3)" ara satırı kaldırıldı. Artık yalnız
**"Taşınmazın Değeri"** (Arsa+Yapı) ve **"Üst Hakkı Değeri"** (nihai)
gösteriliyor — ekranda, PDF'te, Excel'de.

## 2) Üst Hakkı modülünde binlik ayırıcı eksikliği düzeltildi

Modülün **tüm** sayısal girdi kutuları (39 alan, iki dosyada) artık
paylaşılan `Num` bileşenini kullanıyor — "60000" yerine "60.000"
görünüyor. Gelirler Tablosu'ndaki (Yiyecek/Diğer/Toplantı/Dükkan)
alanlar dahil, ekran görüntünde işaret ettiğin tam yer.

## 3) Nihai değer artık her yerde çift para birimli

Üç yöntemin de (Toplam Değerden, Sadece Arsa, Toplam Gelir Üzerinden)
**yalnız nihai sonucu** — ara hücreler değil — hem seçilen dövizde hem
TL karşılığında gösteriyor: ekranda, PDF'te, Excel'de.

## 4) Excel'in Dönemsel Tablosu geniş matrise dönüştürüldü

Referans banka şablonundaki gibi: her gelir/gider kalemi bir **satır**
(Oda Gelirleri, Yiyecek/İçecek Gelirleri, Diğer Gelirler, Toplantı/Salon
Kiralama Gelirleri, Dükkan Kira Gelirleri, Toplam Gelirler, ardından
işletme ve sabit gider kalemleri), dönemler (1'den kalan süreye kadar)
yatayda **sütun**. Her gelir satırının yanında **"Toplam Gelir
İçerisinde Oranı"** sütunu var (karışım her yıl sabit kaldığından tek
kez hesaplanıyor, referans tabloyla aynı mantık). Sütun sayısı kalan
süreye göre otomatik genişliyor (49 yıla kadar test edildi).

**PDF mevcut yıl-satırlı hâliyle kaldı** (zaten sayfalama ile tam
listeyi veriyordu, konuştuğumuz gibi). **Ekran önizlemesi** kısaltılmış
kalmaya devam ediyor (ilk 6 dönem + "PDF/Excel'de tam liste" notu).

**Bu değişiklik sırasında yakaladığım ve düzelttiğim bir yan hata:**
sütun düzeni değişince, "TAŞINMAZ DEĞERİ" ve "TL Karşılığı" sonuç
satırları eski (artık dar kalan) bir sütuna yazmaya devam ediyordu,
`####` hatası veriyordu — bunu bulup düzelttim, gerçek Excel'le
doğruladım.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
