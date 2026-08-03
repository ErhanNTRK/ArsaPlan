# ArsaPlan v6.0.12 — Her Sayfanın Altına Sabit Geri Bar'ı

Doğrulama: `npx tsc -b` → 0 hata · `npm run test` → **192/192** · `npm run
build` → başarılı · oxlint → 0 hata.

## Tek ekranlı dört modüle sabit alt "← Ana Sayfaya Dön" bar'ı eklendi

Arsa ve Otel modülleri (çok adımlı sihirbaz) zaten Geri/Devam bar'ına
sahipti — o ikisine dokunulmadı. Tek ekranlı modüllerde bu pratiklik
eksikti (yalnızca en üstte küçük bir bağlantı vardı, uzun bir sayfada
en yukarı kaydırmak gerekiyordu). Şimdi **Tarımsal Ürün, Akaryakıt, ve
Üst Hakkı'nın üç yöntemi** (Toplam Değerden, Sadece Arsa Değeri
Üzerinden, Toplam Gelir Üzerinden) sayfanın en altında, ekranda sabit
kalan (kaydırmadan bağımsız) bir "← Ana Sayfaya Dön" bar'ı kazandı —
Arsa/Otel'deki bar ile aynı görsel dil.

**Teknik not:** Sabit bar alttaki içeriğin üzerine binmesin diye her
dört sayfaya da yeterli alt boşluk eklendi; PDF/Excel çıktılarını
etkilemez (yalnız ekranda görünür, `no-print` sınıfı sayesinde
yazdırmada/PDF'te hiç yer kaplamaz).

## Merak ettiğin soru — "kaç zipte tamamlanacak"

Dürüst tahminim: elimde hâlâ **4 büyük, kendi başına ayrı tur gerektiren
iş** var — (1) Otel Maliyet Yaklaşımı + döviz + KML + 5.000 yuvarlama +
PDF içerik seçimi, (2) tüm modüllerde Excel içe aktarma, (3) tam
İngilizce (ekran+PDF+Excel), (4) cihaz-bazlı (PC/tablet/telefon)
arayüz uyarlaması. Her biri gerçekten "yeni özellik" boyutunda, tek
turda bitmesi gerçekçi değil — muhtemelen **3-5 zip daha** (bazı küçük
maddeleri büyük turların yanına ekleyerek birleştirebilirim, bu sayıyı
kesinleştirir). Netleşen notların geldikçe daha kesin söyleyebilirim.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
