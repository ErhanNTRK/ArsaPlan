# ArsaPlan v6.0.10 — Netleşen 9 Düzeltme

Doğrulama: `npx tsc -b` → 0 hata · `npm run test` → **192/192** (birebir
aynı sayı — hiçbir hesaplama mantığına dokunulmadı) · `npm run build` →
başarılı · oxlint → 0 hata.

Bu pakete yalnızca **kesinleşmiş, net** maddeler alındı. Büyük/yeni
kapsamlı işler (Otel Maliyet Yaklaşımı, tüm modüllerde Excel içe/dışa
aktarma, tam İngilizce, cihaz-bazlı responsive tasarım) kasıtlı olarak
dışarıda bırakıldı — bunlar kendi ayrı, odaklı turlarını hak ediyor.

## Yapılanlar

1. **Asma Kat merkezleme hatası düzeltildi.** Yapı kesiti çiziminde Asma
   Kat'ın genişliği daraltılıyordu ama konumu eski (geniş) genişlikle
   hesaplanıyordu — bu, kutunun merkezden sola kaymasına, "yamuk"
   görünmesine yol açıyordu. Artık aynı (daraltılmış) genişlik hem çizim
   hem merkezleme için kullanılıyor.
2. **Tarımsal Ürün: "(kiralanabilir dükkan mantığı)" parantezi kaldırıldı**
   — yalnız uygulama içi ipucunda varmış (PDF/Excel'de zaten yoktu),
   formül cümlesi ("Değer = yıllık net gelir × amorti yılı, en yakın
   5.000 TL'ye yuvarlanmıştır.") aynen kaldı.
3. **Yan ürünün nihai değere etkisi artık PDF'te de ana satırlarla aynı
   "NET GELİR" sütununda, sağa yaslı gösteriliyor** — önceden ayrı bir
   metin cümlesinin içine gömülüydü, görsel olarak kopuk duruyordu
   (Excel'de zaten doğruydu, yalnız PDF düzeltildi).
4. **Geliştirici imzasına e-posta eklendi** (erhan.onturk@doradegerleme.com.tr)
   — tek bir merkezi sabitten geldiği için **tüm modüllerin PDF/Excel
   footer'larına otomatik yayıldı**.
5. **Beş yerdeki yönlendirici aralık ifadesi kaldırıldı** ("piyasa
   uygulaması %X-Y", "genelde %X-Y", "Tipik X-Y ₺/m²") — Müteahhit Kâr
   Oranı, Günümüze İndirgeme, Zemin Kat Alan Kaybı, Normal Kat Ortak
   Mahal Payı, Peyzaj Birim Maliyeti alanlarında. Hesap sonuçları aynen
   kalıyor, yalnız normatif "böyle olmalı" cümleleri gitti.
6. **Otel: Ticari Kira satırlarından "Alan Adı" kaldırıldı** — yalnız
   Alan Türü + Kiracı kaldı (PDF sütun başlığı da güncellendi).
7. **Otel: "Projeksiyon Süresi 3-25 yıl arası" önerisi kaldırıldı.**
8. **Binlik ayırıcı eksikliği düzeltildi — uygulama genelinde.** Kök
   neden: paylaşılan `Num` bileşeni `type="number"` kullanıyordu, bu HTML
   girdi türü biçimlendirilmiş gösterimi desteklemiyor. Artık odaktayken
   ham rakam, odak dışındayken **"60.000"** gibi binlik ayırıcılı
   gösteriliyor — bu, yalnız "Maliyet ve Satış" kartını değil, `Num`
   bileşenini kullanan **tüm sayısal girdi kutularını** kapsıyor.
9. **KAKS/TAKS havuzu aşım uyarısı eklendi.** Önceden yalnız "elle
   girişler nedeniyle X m² satılabilir alan hakkı dağıtılmadı" (eksik
   kullanım) uyarısı vardı; şimdi simetriği de var: elle girilen alanlar
   toplamı KAKS/TAKS'tan türeyen havuzu **aşarsa** uyarı çıkıyor (örn.
   KAKS sonradan küçültülürse), hem ekranda hem PDF'te. **Dürüst not:**
   bu kod, zaten kanıtlanmış pozitif-kalıntı deseninin simetriği ve
   testleri bozmuyor, ama elimde bu turda **canlı bir aşım senaryosuyla
   PDF çıktısını görsel olarak doğrulama fırsatı olmadı** — ilk
   kullanımında bir tuhaflık görürsen hemen bildir.

## Bu pakette YAPILMAYAN (bilinçli olarak dışarıda, ayrı tur bekliyor)

- Otel Maliyet Yaklaşımı (yeni bölüm, Üst Hakkı'nın yapı kataloğunu
  paylaşarak) + Otel'de döviz seçimi + KML + 5.000 yuvarlama + PDF içerik
  seçimi (Gelir/İNA/Maliyet tikleri)
- Tüm modüllerde Excel içe aktarma (üretilen Excel'i geri yükleyip
  formu doldurma)
- Tam İngilizce (ekran + PDF + Excel, tüm modüller)
- Cihaz tipine göre uyarlanabilir arayüz (PC/tablet/telefon)
- Örnek ile Doldur (her modülde)
- İşletme (Ticari) modülünde Yapılar/Maliyetler kartının kutu düzeni +
  KML'den çevre duvarı uzunluğu + Peyzaj/Altyapı maliyet formülü şeffaflığı
- Karma kullanımda kesit çizimindeki genel merkezleme taraması (yalnız
  Asma Kat'ın kendi hatası bu turda düzeltildi; başka katlarda benzer
  bir sorun görürsen bildir)

## Yükleme (ayrıntılı adımlar)

1. `ArsaPlan-v6.0.10.zip` dosyasını bilgisayarında bir yere **çıkar
   (extract/unzip)**. İçinde `src` klasörü, `public` klasörü,
   `package.json` dosyası ve bu `OKU-BENI.md` görünecek.
2. Tarayıcında **github.com/ErhanNTRK/ArsaPlan** adresine git.
3. Sağ üstteki **"Add file"** düğmesine tıkla → **"Upload files"** seç.
4. Bilgisayarındaki dosya gezgininde (Explorer/Finder) çıkardığın
   klasöre git. **`src` klasörünün simgesine tıkla** (içine girme!) ve
   tarayıcıdaki yükleme alanına **sürükle-bırak**. Aynısını **`public`**
   klasörü için de yap. Son olarak **`package.json`** dosyasını da aynı
   alana sürükle.
5. "Bu dosyalar zaten var, üzerine yazılsın mı?" sorusuna **evet** de.
6. Sayfanın en altındaki **"Commit changes"** düğmesine bas.
7. Üstteki **"Actions"** sekmesine geç, en yeni çalışmanın yanında
   **yeşil tik** görününceye kadar bekle (genelde 30-60 saniye).
8. Siteyi aç, **Ctrl+F5** ile önbelleği atlayarak tazele.

Sorularının cevabı geldiğinde (özellikle Otel Maliyet Yaklaşımı'ndaki
son netleşen kısımlar, "Toplam Gelir Üzerinden Üst Hakkı Hesabı" ifadesi
artık netti — Üst Hakkı'daki Yapı Türü kataloğuyla aynı desen kullanılacak)
sıradaki turu başlatırım.
